// =====================================================================
// RE DELLA LAGUNA — funzione del server (Supabase Edge Function, Deno)
// Un solo indirizzo con questi comandi:
//   { comando: "crea", nome, giocatori:[{nome, bot, strategia}], principianti }
//   { comando: "entra", codice, nome }
//   { comando: "inizia", partita, principianti, durata:{modo, cicli, obiettivo} }
//   { comando: "azione", partita, azione:{tipo,...} }
//   { comando: "presente", partita } · { comando: "esci", partita } · { comando: "computer", partita, player }
// Il motore delle regole e i giocatori-computer arrivano dal progetto GitHub,
// fissati a una versione precisa (commit), cosi' non cambiano da soli.
// Il saldo segreto resta qui: ai giocatori arriva solo la loro "vista" (Laguna.vistaSicura).
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import "https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@a31b8bbf007e8641b25920e2f36efdd203b418d0/server/motore.js";
import "https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@a31b8bbf007e8641b25920e2f36efdd203b418d0/server/bot.js";

// deno-lint-ignore no-explicit-any
const L = (globalThis as any).Laguna;
// deno-lint-ignore no-explicit-any
const B = (globalThis as any).LagunaBot;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  db: { schema: "laguna" },
});

function nuovoCodice() {
  const parole = ["PALMA", "CORONA", "FLAMINGO", "AMBRA", "SOLE", "MARINA", "FARO"];
  return parole[Math.floor(Math.random() * parole.length)] + "-" + Math.floor(1000 + Math.random() * 9000);
}

// Questo file vuole il motore nuovo (Laguna.vistaSicura e LagunaBot.gioca). Se il commit scritto negli import qui sopra
// e' ancora quello vecchio, meglio fermarsi subito con un messaggio chiaro che far girare una partita a meta'.
if (typeof L?.vistaSicura !== "function" || typeof B?.gioca !== "function") {
  throw new Error("server/index.ts e' piu' nuovo del motore che importa: aggiorna il commit negli import (lo fa pubblica.sh) e ripubblica.");
}

// Cosa vede ogni giocatore: una sola funzione, nel motore (Laguna.vistaSicura), la stessa della partita locale.
// Le viste si calcolano PRIMA di salvare: se una non si riesce a calcolare, non viene salvato niente.
// deno-lint-ignore no-explicit-any
function calcolaViste(partitaId: string, stato: any, versione: number) {
  // deno-lint-ignore no-explicit-any
  return stato.players.map((p: any) => ({
    partita_id: partitaId, player_id: p.id, versione, vista: L.vistaSicura(stato, p.id), aggiornata_il: new Date().toISOString(),
  }));
}
// deno-lint-ignore no-explicit-any
async function salvaViste(righe: any[]) {
  const { error } = await admin.from("viste").upsert(righe);
  if (error) throw error;
}

// I giocatori-computer giocano finche' non tocca a una persona: una sola funzione, in bot.js (LagunaBot.gioca).
// Gli errori veri del codice (non le mosse rifiutate) finiscono nei log, cosi' si vedono.
// deno-lint-ignore no-explicit-any
function giocaBot(stato: any) {
  const r = B.gioca(stato);
  for (const e of r.errori) console.error("Errore in una mossa dei computer:", JSON.stringify(e));
}


// ---- chi e' collegato (punto 33) ----
// Ogni pagina aperta manda "presente" ogni 30 secondi (giocatori.visto_il).
// Chi non si fa vivo da 3 minuti: al suo posto gioca il computer (prudente, "Legale") finche' non torna.
// Chi preme "Esci dalla partita": il computer prende il suo posto per sempre.
const ASSENZA_MS = 3 * 60 * 1000;
// deno-lint-ignore no-explicit-any
function mettiComputer(stato: any, pid: string, perSempre: boolean) {
  // deno-lint-ignore no-explicit-any
  const p = stato.players.find((x: any) => x.id === pid);
  if (!p) return;
  if (!p.bot) { p.stratPrima = p.strat ?? null; p.strat = p.strat || "Legale"; p.bot = true; }
  if (perSempre) { p.uscito = true; delete p.assente; } else if (!p.uscito) p.assente = true;
}
// deno-lint-ignore no-explicit-any
function rimettiPersona(stato: any, pid: string) {
  // deno-lint-ignore no-explicit-any
  const p = stato.players.find((x: any) => x.id === pid);
  if (!p || !p.assente || p.uscito) return;
  p.bot = false; p.strat = p.stratPrima ?? null; delete p.stratPrima; delete p.assente;
}
// fa giocare i computer, calcola le viste e salva solo se nessuno ha cambiato la partita nel frattempo
// deno-lint-ignore no-explicit-any
async function salvaStato(id: string, stato: any, versione: number) {
  giocaBot(stato);
  const nuova = versione + 1;
  const viste = calcolaViste(id, stato, nuova);
  const { data: agg } = await admin.from("partite")
    .update({ stato, versione: nuova, aggiornata_il: new Date().toISOString(), finita: !!stato.fine })
    .eq("id", id).eq("versione", versione).select("id");
  if (!agg?.length) return false;
  await salvaViste(viste);
  return true;
}
// deno-lint-ignore no-explicit-any
function presenze(gioc: any[], ora: number) {
  // deno-lint-ignore no-explicit-any
  return gioc.map((g: any) => ({ id: g.player_id, persona: !g.bot, collegato: !!g.user_id, secondi: g.visto_il ? Math.max(0, Math.round((ora - Date.parse(g.visto_il)) / 1000)) : null, assente: !!g.assente, uscito: !!g.uscito }));
}

// come finisce la partita: solo i valori ammessi dal motore
// deno-lint-ignore no-explicit-any
function durataPulita(body: any) {
  const d = body.durata || {};
  const modo = ["cicli", "obiettivo", "libera"].includes(d.modo) ? d.modo : "cicli";
  return { modo, cicli: Number(d.cicli ?? body.cicli) || 8, obiettivo: Number(d.obiettivo) || 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // chi sta chiamando (il token del giocatore)
    const auth = req.headers.get("Authorization") ?? "";
    const { data: u } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ errore: "Devi entrare con il tuo account." }, 401);
    const uid = u.user.id;
    const body = await req.json();

    if (body.comando === "crea") {
      const gioc = (body.giocatori ?? []).slice(0, 8);
      if (gioc.length < 2) return json({ errore: "Servono almeno 2 giocatori." }, 400);
      // il primo giocatore e' chi crea la partita; gli altri umani entrano con il codice
      const { data: partita, error } = await admin.from("partite")
        .insert({ codice: nuovoCodice(), creata_da: uid }).select().single();
      if (error) throw error;
      // deno-lint-ignore no-explicit-any
      const righe = gioc.map((g: any, i: number) => ({
        partita_id: partita.id, player_id: "g" + (i + 1), nome: String(g.nome).slice(0, 30),
        bot: !!g.bot, strategia: g.strategia ?? null, user_id: i === 0 ? uid : null,
      }));
      await admin.from("giocatori").insert(righe);
      return json({ partita: partita.id, codice: partita.codice });
    }

    if (body.comando === "entra") {
      const { data: partita } = await admin.from("partite").select("id,in_corso").eq("codice", body.codice).single();
      if (!partita) return json({ errore: "Codice non valido." }, 404);
      if (partita.in_corso) return json({ errore: "La partita è già iniziata." }, 400);
      const { data: gia } = await admin.from("giocatori").select("player_id").eq("partita_id", partita.id).eq("user_id", uid).maybeSingle();
      if (gia) return json({ partita: partita.id, player: gia.player_id });
      const { data: liberi } = await admin.from("giocatori").select("*")
        .eq("partita_id", partita.id).is("user_id", null).eq("bot", false).order("player_id").limit(1);
      if (!liberi?.length) return json({ errore: "Non ci sono posti liberi." }, 400);
      await admin.from("giocatori").update({ user_id: uid, nome: body.nome ?? liberi[0].nome })
        .eq("partita_id", partita.id).eq("player_id", liberi[0].player_id);
      return json({ partita: partita.id, player: liberi[0].player_id });
    }

    if (body.comando === "inizia") {
      const { data: partita } = await admin.from("partite").select("*").eq("id", body.partita).single();
      if (!partita || partita.creata_da !== uid) return json({ errore: "Solo chi ha creato la partita la può iniziare." }, 403);
      const { data: gioc } = await admin.from("giocatori").select("*").eq("partita_id", partita.id).order("player_id");
      // deno-lint-ignore no-explicit-any
      if (gioc!.some((g: any) => !g.bot && !g.user_id)) return json({ errore: "Manca ancora qualcuno: aspetta che tutti entrino con il codice." }, 400);
      // il giocatore g1 e' sempre chi ha creato la partita: e' lui che puo' chiudere una partita libera
      const stato = L.nuovaPartita({
        // deno-lint-ignore no-explicit-any
        giocatori: gioc!.map((g: any) => ({ nome: g.nome, bot: g.bot, strat: g.strategia })),
        principianti: !!body.principianti,
        consigli: body.consigli !== undefined ? !!body.consigli : !!body.principianti,
        durata: durataPulita(body),
      });
      // v116 modalita' test (solo con ?test nell'indirizzo): si parte da un Ciclo avanzato con soldi e Livello alti
      if (body.test && typeof B.preparaTest === "function") B.preparaTest(stato, { ciclo: Number(body.daCiclo) || 6 });
      giocaBot(stato);
      const viste = calcolaViste(partita.id, stato, 1);
      await admin.from("partite").update({ stato, in_corso: true, versione: 1 }).eq("id", partita.id);
      await salvaViste(viste);
      return json({ ok: true });
    }

    if (body.comando === "presente") {
      const ora = Date.now();
      const { data: gioc } = await admin.from("giocatori").select("player_id,user_id,bot,visto_il,assente,uscito").eq("partita_id", body.partita).order("player_id");
      // deno-lint-ignore no-explicit-any
      const me = (gioc ?? []).find((g: any) => g.user_id === uid);
      if (!me) return json({ errore: "Non giochi in questa partita." }, 403);
      await admin.from("giocatori").update({ visto_il: new Date(ora).toISOString() }).eq("partita_id", body.partita).eq("player_id", me.player_id);
      me.visto_il = new Date(ora).toISOString();
      const { data: partita } = await admin.from("partite").select("in_corso,finita").eq("id", body.partita).single();
      if (partita?.in_corso && !partita.finita && !me.uscito) {
        // deno-lint-ignore no-explicit-any
        const via = gioc!.filter((g: any) => !g.bot && g.user_id && !g.uscito && !g.assente && g.player_id !== me.player_id && g.visto_il && ora - Date.parse(g.visto_il) > ASSENZA_MS);
        const torno = !!me.assente;
        if (via.length || torno) {
          const { data: pp } = await admin.from("partite").select("stato,versione").eq("id", body.partita).single();
          if (pp?.stato && !pp.stato.fine) {
            if (torno) rimettiPersona(pp.stato, me.player_id);
            // deno-lint-ignore no-explicit-any
            for (const g of via) mettiComputer(pp.stato, g.player_id, false);
            if (await salvaStato(body.partita, pp.stato, pp.versione)) {
              if (torno) { await admin.from("giocatori").update({ assente: false }).eq("partita_id", body.partita).eq("player_id", me.player_id); me.assente = false; }
              for (const g of via) { await admin.from("giocatori").update({ assente: true }).eq("partita_id", body.partita).eq("player_id", g.player_id); g.assente = true; }
            }
          }
        }
      }
      return json({ ok: true, presenze: presenze(gioc!, ora) });
    }

    if (body.comando === "esci") {
      const { data: me } = await admin.from("giocatori").select("player_id,uscito").eq("partita_id", body.partita).eq("user_id", uid).maybeSingle();
      if (!me) return json({ ok: true });
      const { data: partita } = await admin.from("partite").select("in_corso,finita,stato,versione,creata_da").eq("id", body.partita).single();
      if (!partita) return json({ ok: true });
      if (!partita.in_corso) {
        // sala d'attesa: il posto torna libero (chi ha creato la partita resta: e' lui la sala)
        if (partita.creata_da !== uid) await admin.from("giocatori").update({ user_id: null, visto_il: null }).eq("partita_id", body.partita).eq("player_id", me.player_id);
        return json({ ok: true });
      }
      if (partita.finita || me.uscito) return json({ ok: true });
      for (let tent = 0; tent < 3; tent++) {
        const { data: pp } = tent ? await admin.from("partite").select("stato,versione").eq("id", body.partita).single() : { data: partita };
        const stato = pp!.stato;
        mettiComputer(stato, me.player_id, true);
        // deno-lint-ignore no-explicit-any
        if (stato.players.every((p: any) => p.bot)) {
          // non resta nessuna persona: la partita si chiude qui, senza far giocare i computer da soli
          await admin.from("partite").update({ stato, finita: true, versione: pp!.versione + 1, aggiornata_il: new Date().toISOString() }).eq("id", body.partita);
          break;
        }
        if (await salvaStato(body.partita, stato, pp!.versione)) break;
      }
      await admin.from("giocatori").update({ uscito: true, assente: false }).eq("partita_id", body.partita).eq("player_id", me.player_id);
      return json({ ok: true });
    }

    if (body.comando === "computer") {
      // chi ha creato la partita mette il computer al posto di un altro (sala d'attesa: per sempre; partita: finche' non torna)
      const { data: partita } = await admin.from("partite").select("in_corso,finita,stato,versione,creata_da").eq("id", body.partita).single();
      if (!partita || partita.creata_da !== uid) return json({ errore: "Solo chi ha creato la partita può farlo." }, 403);
      const { data: g } = await admin.from("giocatori").select("*").eq("partita_id", body.partita).eq("player_id", body.player).maybeSingle();
      if (!g || g.bot || g.user_id === uid) return json({ errore: "Questo posto non si può dare al computer." }, 400);
      if (!partita.in_corso) {
        const strat = B.STRATEGIE[Math.floor(Math.random() * B.STRATEGIE.length)];
        await admin.from("giocatori").update({ bot: true, strategia: strat, nome: strat, user_id: null, visto_il: null }).eq("partita_id", body.partita).eq("player_id", body.player);
        return json({ ok: true });
      }
      if (partita.finita || g.uscito || g.assente) return json({ ok: true });
      if (g.visto_il && Date.now() - Date.parse(g.visto_il) < 60_000) return json({ errore: "È ancora collegato: aspetta almeno un minuto." }, 400);
      mettiComputer(partita.stato, body.player, false);
      if (!(await salvaStato(body.partita, partita.stato, partita.versione))) return json({ errore: "Un altro giocatore ha appena agito: riprova." }, 409);
      await admin.from("giocatori").update({ assente: true }).eq("partita_id", body.partita).eq("player_id", body.player);
      return json({ ok: true });
    }

    if (body.comando === "azione") {
      const { data: me } = await admin.from("giocatori").select("player_id,assente,uscito")
        .eq("partita_id", body.partita).eq("user_id", uid).single();
      if (!me) return json({ errore: "Non giochi in questa partita." }, 403);
      if (me.uscito) return json({ errore: "Sei uscito da questa partita: ora al tuo posto gioca il computer." }, 403);
      const { data: partita } = await admin.from("partite").select("stato,versione").eq("id", body.partita).single();
      if (!partita?.stato) return json({ errore: "La partita non è ancora iniziata." }, 400);
      const stato = partita.stato;
      if (!Array.isArray(stato.players?.[0]?.valigetta) || stato.lotti?.length !== L.CASELLE) return json({ errore: "Questa partita è della versione vecchia del gioco (tabellone piccolo): creane una nuova." }, 400);
      // partite iniziate prima della notte nuova: aggiungo i campi che mancano
      if (stato.notte && !stato.notte.pronto) Object.assign(stato.notte, { pronto: {}, daScelta: {}, inizioRacc: {}, base: {}, inizio: Date.now() });
      const esito = "ok";
      if (me.assente) rimettiPersona(stato, me.player_id); // era via e al suo posto giocava il computer: e' tornato
      try {
        L.applica(stato, me.player_id, body.azione);
      } catch (e) {
        // deno-lint-ignore no-explicit-any
        const err = e as any;
        if (!err.gioco) throw e;
        await admin.from("azioni").insert({ partita_id: body.partita, player_id: me.player_id, azione: body.azione, esito: err.message });
        return json({ errore: err.message }, 400);
      }
      giocaBot(stato);
      const nuova = partita.versione + 1;
      const viste = calcolaViste(body.partita, stato, nuova); // prima di salvare: se fallisce, lo stato non cambia
      // scrittura sicura: se nel frattempo qualcun altro ha cambiato la partita, si riprova
      const { data: agg } = await admin.from("partite")
        .update({ stato, versione: nuova, aggiornata_il: new Date().toISOString(), finita: !!stato.fine })
        .eq("id", body.partita).eq("versione", partita.versione).select("id");
      if (!agg?.length) return json({ errore: "Un altro giocatore ha appena agito: riprova." }, 409);
      await salvaViste(viste);
      await admin.from("giocatori").update({ visto_il: new Date().toISOString(), ...(me.assente ? { assente: false } : {}) }).eq("partita_id", body.partita).eq("player_id", me.player_id);
      await admin.from("azioni").insert({ partita_id: body.partita, player_id: me.player_id, azione: body.azione, esito });
      return json({ ok: true, versione: nuova });
    }

    return json({ errore: "Comando sconosciuto." }, 400);
  } catch (e) {
    console.error(e);
    return json({ errore: "Errore del server: " + (e as Error).message }, 500);
  }
});
