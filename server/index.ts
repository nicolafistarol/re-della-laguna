// =====================================================================
// RE DELLA LAGUNA — funzione del server (Supabase Edge Function, Deno)
// Un solo indirizzo con questi comandi:
//   { comando: "crea", nome, giocatori:[{nome, bot, strategia}], principianti }
//   { comando: "entra", codice, nome }
//   { comando: "inizia", partita, principianti, durata:{modo, cicli, obiettivo} }
//   { comando: "azione", partita, azione:{tipo,...} }
// Il motore delle regole e i giocatori-computer arrivano dal progetto GitHub,
// fissati a una versione precisa (commit), cosi' non cambiano da soli.
// Il saldo segreto resta qui: ai giocatori arriva solo la loro "vista".
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import "https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@c79c36ad87fe9bdb95db836ddae24396ec684400/server/motore.js";
import "https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@c79c36ad87fe9bdb95db836ddae24396ec684400/server/bot.js";

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

// Il motore toglie gia' saldi, tracce e segreti degli altri; qui togliamo anche
// gli indizi indiretti (affari della notte, riciclo, prestiti, piani segreti).
const ALTRI_SEGRETI = ["affariOk", "pulitoCiclo", "mosseNotte", "mossePagate", "disturbatore", "copUsata",
  "paradisoCiclo", "ombraCicli", "prestiti", "telefonataUsata", "scontoCarico", "mercatoNero", "emergenza", "licenzaNegata", "trucchi", "lavato", "lavatoCiclo"];
const PIANI_SEGRETI = ["caveau", "piani_segreti", "sala_insonorizzata", "bunker", "osservatorio"];
// deno-lint-ignore no-explicit-any
function vistaSicura(stato: any, id: string) {
  const v = L.vista(stato, id);
  // deno-lint-ignore no-explicit-any
  for (const p of v.players as any[]) {
    if (p.id === id) { delete p.tracce; continue; } // le proprie Tracce restano nascoste anche a se stessi
    for (const k of ALTRI_SEGRETI) delete p[k];
    if (Array.isArray(p.funzioniPiani)) p.funzioniPiani = p.funzioniPiani.map((f: string) => PIANI_SEGRETI.includes(f) ? "riservato" : f);
    if (Array.isArray(p.stanze)) p.stanze = p.stanze.filter((f: string) => !PIANI_SEGRETI.includes(f)); // le stanze segrete degli altri non si vedono
  }
  // dalla cronaca pubblica tolgo le operazioni private degli altri (prestiti, investimenti, vendite)
  // deno-lint-ignore no-explicit-any
  v.log = (v.log as any[]).filter((r: any) => !r.chi || r.chi === id || !/prestito|restituisce|investe|vende|ipoteca|riscatta/.test(r.testo));
  return v;
}

// deno-lint-ignore no-explicit-any
async function salvaViste(partitaId: string, stato: any, versione: number) {
  // deno-lint-ignore no-explicit-any
  const righe = stato.players.map((p: any) => ({
    partita_id: partitaId, player_id: p.id, versione, vista: vistaSicura(stato, p.id), aggiornata_il: new Date().toISOString(),
  }));
  const { error } = await admin.from("viste").upsert(righe);
  if (error) throw error;
}

// I giocatori-computer giocano finche' non tocca a una persona.
// Al bot si chiede la mossa UNA volta sola: le sue scelte ricordano cosa ha gia' deciso.
// deno-lint-ignore no-explicit-any
function giocaBot(stato: any) {
  for (let i = 0; i < 3000 && !stato.fine; i++) {
    // deno-lint-ignore no-explicit-any
    let bot: any = null, a: any = null;
    for (const p of stato.players) if (p.bot) { const x = B.prossima(stato, p); if (x) { bot = p; a = x; break; } }
    if (!bot) return;
    try { L.applica(stato, bot.id, a); }
    catch (_e) {
      try {
        if (stato.fase === "notte") L.applica(stato, bot.id, { tipo: "pronto" });
        else if (stato.pending?.tipo === "asta") L.applica(stato, bot.id, { tipo: "offerta", importo: 0 });
        else if (stato.pending && stato.pending.giocatore === bot.id) L.applica(stato, bot.id, { tipo: stato.pending.tipo, si: false, importo: 0 });
        else L.applica(stato, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
      } catch (_e2) { return; }
    }
  }
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
      giocaBot(stato);
      await admin.from("partite").update({ stato, in_corso: true, versione: 1 }).eq("id", partita.id);
      await salvaViste(partita.id, stato, 1);
      return json({ ok: true });
    }

    if (body.comando === "azione") {
      const { data: me } = await admin.from("giocatori").select("player_id")
        .eq("partita_id", body.partita).eq("user_id", uid).single();
      if (!me) return json({ errore: "Non giochi in questa partita." }, 403);
      const { data: partita } = await admin.from("partite").select("stato,versione").eq("id", body.partita).single();
      if (!partita?.stato) return json({ errore: "La partita non è ancora iniziata." }, 400);
      const stato = partita.stato;
      if (!Array.isArray(stato.players?.[0]?.valigetta) || stato.lotti?.length !== L.CASELLE) return json({ errore: "Questa partita è della versione vecchia del gioco (tabellone piccolo): creane una nuova." }, 400);
      // partite iniziate prima della notte nuova: aggiungo i campi che mancano
      if (stato.notte && !stato.notte.pronto) Object.assign(stato.notte, { pronto: {}, daScelta: {}, inizioRacc: {}, base: {}, inizio: Date.now() });
      const esito = "ok";
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
      // scrittura sicura: se nel frattempo qualcun altro ha cambiato la partita, si riprova
      const { data: agg } = await admin.from("partite")
        .update({ stato, versione: nuova, aggiornata_il: new Date().toISOString(), finita: !!stato.fine })
        .eq("id", body.partita).eq("versione", partita.versione).select("id");
      if (!agg?.length) return json({ errore: "Un altro giocatore ha appena agito: riprova." }, 409);
      await salvaViste(body.partita, stato, nuova);
      await admin.from("azioni").insert({ partita_id: body.partita, player_id: me.player_id, azione: body.azione, esito });
      return json({ ok: true, versione: nuova });
    }

    return json({ errore: "Comando sconosciuto." }, 400);
  } catch (e) {
    console.error(e);
    return json({ errore: "Errore del server: " + (e as Error).message }, 500);
  }
});
