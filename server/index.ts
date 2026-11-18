// =====================================================================
// RE DELLA LAGUNA — funzione del server (Supabase Edge Function, Deno)
// Un solo indirizzo con questi comandi:
//   { comando: "crea", nome, giocatori:[{nome, bot, strategia}], principianti }
//   { comando: "entra", codice, nome }                    entri (o rientri, se il posto e' gia' tuo)
//   { comando: "rientra", codice, rientro }               riprendi il TUO posto da un altro dispositivo (codice personale)
//   { comando: "mio_codice", partita }                    il tuo codice personale di rientro (lo vedi solo tu)
//   { comando: "inizia", partita, principianti, durata:{modo, cicli, obiettivo}, ricomincia }
//   { comando: "azione", partita, azione:{tipo,...}, versione, mossa }
//   { comando: "sollecita", partita, chi, subito }        chi non gioca da troppo tempo: il computer gioca al suo posto
//   { comando: "torno", partita }                         sono tornato: il computer smette di giocare al mio posto
// Il motore delle regole e i giocatori-computer arrivano dal progetto GitHub,
// fissati a una versione precisa (commit), cosi' non cambiano da soli.
// Il saldo segreto resta qui: ai giocatori arriva solo la loro "vista" (Laguna.vistaSicura).
// =====================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import "https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@a8f7fef4b20da50ad92c640a6147649f22371bff/server/motore.js";
import "https://cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@a8f7fef4b20da50ad92c640a6147649f22371bff/server/bot.js";

// deno-lint-ignore no-explicit-any
type Tutto = any;
const L = (globalThis as Tutto).Laguna;
const B = (globalThis as Tutto).LagunaBot;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const CHIAVE_SERVIZIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, CHIAVE_SERVIZIO, {
  db: { schema: "laguna" },
});

function nuovoCodice() {
  const parole = ["PALMA", "CORONA", "FLAMINGO", "AMBRA", "SOLE", "MARINA", "FARO"];
  return parole[Math.floor(Math.random() * parole.length)] + "-" + Math.floor(1000 + Math.random() * 9000);
}
const copia = (x: Tutto) => JSON.parse(JSON.stringify(x));

// Questo file vuole il motore nuovo (Laguna.vistaSicura e LagunaBot.gioca). Se il commit scritto negli import qui sopra
// e' ancora quello vecchio, meglio fermarsi subito con un messaggio chiaro che far girare una partita a meta'.
if (typeof L?.vistaSicura !== "function" || typeof B?.gioca !== "function") {
  throw new Error("server/index.ts e' piu' nuovo del motore che importa: aggiorna il commit negli import (lo fa pubblica.sh) e ripubblica.");
}

// ------------------------------------------------------------ il codice personale di rientro
// Serve a riprendere il proprio posto da un altro dispositivo. Non e' scritto da nessuna parte: si ricalcola ogni volta
// dalla partita, dal posto e da un segreto che conosce solo il server. Per questo non puo' finire nella vista di nessuno.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // senza I, L, O, 0, 1: non si confondono a leggerli
async function codiceRientro(partitaId: string, playerId: string): Promise<string> {
  const segreto = Deno.env.get("LAGUNA_SEGRETO_RIENTRO") || CHIAVE_SERVIZIO;
  const enc = new TextEncoder();
  const chiave = await crypto.subtle.importKey("raw", enc.encode(segreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firma = new Uint8Array(await crypto.subtle.sign("HMAC", chiave, enc.encode("rientro:" + partitaId + ":" + playerId)));
  let c = "";
  for (let i = 0; i < 6; i++) c += ALFABETO[((firma[i * 2] << 8) | firma[i * 2 + 1]) % ALFABETO.length];
  return c;
}
const soloCodice = (t: unknown) => String(t ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// ------------------------------------------------------------ gli appunti del server dentro la partita salvata
// stato._srv: cose che servono solo al server. Si tolgono PRIMA di dare lo stato al motore e si rimettono prima di salvare:
// il motore non li vede mai e non entrano mai in nessuna vista. Stanno nella stessa riga dello stato, cosi' si salvano insieme a lui.
//   mosse[g] = { v, ids }   v: versione prodotta dall'ultima mossa accettata di g · ids: le ultime mosse accettate (numero unico)
//   att[g]   = da quando (orologio del server) si aspetta g
//   sost[g]  = 1: il computer gioca al posto di g finche' non torna
function prendiAppunti(stato: Tutto) {
  const srv = stato._srv || {};
  delete stato._srv;
  for (const k of ["mosse", "att", "sost"]) if (!srv[k] || typeof srv[k] !== "object") srv[k] = {};
  return srv;
}
// tempi massimi (DECISIONI, Giorno): turno 3 minuti, asta 60 secondi. Se il motore li dichiara in N, valgono i suoi.
const TEMPO_TURNO = () => Number(L.N?.tempoTurno) || 180;
const TEMPO_ASTA = () => Number(L.N?.tempoAsta) || 60;
// Chi sta aspettando la partita, di giorno? (di notte c'e' gia' l'orologio dell'ora). Solo persone: i computer giocano da soli.
function attesi(stato: Tutto, srv: Tutto): { chi: string; asta: boolean }[] {
  if (!stato || stato.fine) return [];
  const persona = (id: string) => { const p = stato.players.find((x: Tutto) => x.id === id); return !!p && !p.bot && !srv.sost[id]; };
  if (stato.fase === "pacchetti") { const p = stato.players[stato.sceltaPacchetti?.[0]]; return p && persona(p.id) ? [{ chi: p.id, asta: false }] : []; }
  if (stato.fase !== "giorno") return [];
  const pd = stato.pending;
  if (pd && pd.tipo === "asta") return (pd.partecipanti || []).filter((id: string) => typeof pd.offerte?.[id] !== "number" && persona(id)).map((id: string) => ({ chi: id, asta: true }));
  const id = pd && pd.giocatore ? pd.giocatore : L.corrente(stato)?.id;
  return id && persona(id) ? [{ chi: id, asta: false }] : [];
}
// dopo ogni mossa: da quando si aspetta ognuno. Chi ha appena mosso riparte da zero ("3 minuti SENZA mosse").
function segnaAttese(stato: Tutto, srv: Tutto, haMosso: string | null) {
  const ora = Date.now(), nuove: Tutto = {};
  for (const a of attesi(stato, srv)) nuove[a.chi] = (a.chi !== haMosso && srv.att[a.chi]) || ora;
  srv.att = nuove;
}
// le persone che giocano ancora davvero (non computer, non sostituite)
const personeVere = (stato: Tutto, srv: Tutto) => stato.players.filter((p: Tutto) => !p.bot && !srv.sost[p.id]);

// Cosa vede ogni giocatore: una sola funzione, nel motore (Laguna.vistaSicura), la stessa della partita locale.
// Le viste si calcolano PRIMA di salvare: se una non si riesce a calcolare, non viene salvato niente.
// In piu' il server aggiunge "online": chi si aspetta e da quando, e chi e' sostituito dal computer (lo vedono tutti).
function calcolaViste(partitaId: string, stato: Tutto, srv: Tutto, versione: number) {
  const adesso = Date.now(), asta = !!(stato.pending && stato.pending.tipo === "asta");
  const online = {
    adesso, sost: Object.keys(srv.sost),
    attesa: Object.keys(srv.att).map((chi) => ({ chi, da: srv.att[chi], limite: asta ? TEMPO_ASTA() : TEMPO_TURNO() })),
  };
  return stato.players.map((p: Tutto) => {
    const vista = L.vistaSicura(stato, p.id);
    vista.online = online;
    return { partita_id: partitaId, player_id: p.id, versione, vista, aggiornata_il: new Date(adesso).toISOString() };
  });
}

// I giocatori-computer giocano finche' non tocca a una persona: una sola funzione, in bot.js (LagunaBot.gioca).
// Chi e' assente (srv.sost) per la durata del giro diventa un computer prudente ("Legale"), poi torna una persona.
// Gli errori veri del codice (non le mosse rifiutate) finiscono nei log, cosi' si vedono.
function giocaBot(stato: Tutto, srv: Tutto) {
  // se non resta nessuna persona vera, i sostituiti NON giocano: la partita aspetta (non deve giocarsi da sola fino alla fine)
  const assenti = personeVere(stato, srv).length ? stato.players.filter((p: Tutto) => !p.bot && srv.sost[p.id]) : [];
  const prima = assenti.map((p: Tutto) => p.strat);
  for (const p of assenti) { p.bot = true; p.strat = "Legale"; }
  try {
    const r = B.gioca(stato);
    for (const e of r.errori) console.error("Errore in una mossa dei computer:", JSON.stringify(e));
  } finally {
    assenti.forEach((p: Tutto, i: number) => { p.bot = false; if (prima[i] === undefined) delete p.strat; else p.strat = prima[i]; });
  }
}

// come finisce la partita: solo i valori ammessi dal motore
function durataPulita(body: Tutto) {
  const d = body.durata || {};
  const modo = ["cicli", "obiettivo", "libera"].includes(d.modo) ? d.modo : "cicli";
  return { modo, cicli: Number(d.cicli ?? body.cicli) || 8, obiettivo: Number(d.obiettivo) || 0 };
}

// ------------------------------------------------------------ salvare
class Conflitto extends Error {}
// Scrive la partita solo se nessuno l'ha cambiata nel frattempo (versione attesa), poi le viste, poi il registro.
// Strada 1: la funzione SQL laguna.salva_mossa (tutto insieme, o niente). C'e' solo dopo la migrazione migrazione-s.sql.
// Strada 2 (ripiego, senza migrazione): le stesse scritture una dopo l'altra, come prima.
// Le viste non tornano mai indietro: si scrivono solo se la loro versione e' piu' vecchia di quella nuova.
let conSql: boolean | null = null; // null = non lo so ancora
async function salva(partitaId: string, attesa: number, nuova: number, stato: Tutto, viste: Tutto[], extra: Tutto, registro: Tutto | null) {
  if (conSql !== false) {
    const { data, error } = await admin.rpc("salva_mossa", {
      p_partita: partitaId, p_attesa: attesa, p_nuova: nuova, p_stato: stato, p_finita: !!stato.fine,
      p_in_corso: extra.in_corso ?? null, p_viste: viste.map((v) => ({ player_id: v.player_id, vista: v.vista })), p_registro: registro,
    });
    if (!error) { conSql = true; if (data === false) throw new Conflitto(); return; }
    // la funzione non c'e' (migrazione non ancora fatta) o non va: si passa al ripiego. Se ha dato errore non ha scritto niente.
    if (conSql === true) console.error("salva_mossa ha dato errore, uso il ripiego:", error.message);
    conSql = false;
  }
  const { data: agg, error: e1 } = await admin.from("partite")
    .update({ stato, versione: nuova, aggiornata_il: new Date().toISOString(), finita: !!stato.fine, ...extra })
    .eq("id", partitaId).eq("versione", attesa).select("id");
  if (e1) throw e1;
  if (!agg?.length) throw new Conflitto();
  await scriviViste(viste, nuova);
  if (registro) { const { error } = await admin.from("azioni").insert(registro); if (error) console.error("Registro delle azioni non scritto:", error.message); }
}
async function scriviViste(viste: Tutto[], nuova: number) {
  const esiti = await Promise.all(viste.map((v) => admin.from("viste").update(v).eq("partita_id", v.partita_id).eq("player_id", v.player_id).lt("versione", nuova).select("player_id")));
  for (const e of esiti) if (e.error) throw e.error;
  // una vista che non c'era ancora (partita appena iniziata) si crea
  const mancano = viste.filter((_v, i) => !esiti[i].data?.length);
  if (!mancano.length) return;
  const { data: ci } = await admin.from("viste").select("player_id").eq("partita_id", viste[0].partita_id);
  const nuove = mancano.filter((v) => !(ci ?? []).some((x: Tutto) => x.player_id === v.player_id));
  if (nuove.length) { const { error } = await admin.from("viste").insert(nuove); if (error) throw error; }
}

const PARTITA_VECCHIA = "Questa partita è della versione vecchia del gioco (tabellone piccolo): creane una nuova.";
// Legge la partita, la cambia con "cambia" e la salva. Se nel frattempo un altro giocatore ha mosso, RICOMINCIA DA CAPO
// da solo (rilegge e riapplica), fino a 6 volte: il giocatore non deve piu' vedere "riprova".
// cambia(stato, srv, versione) ritorna: { risposta } per rispondere senza salvare, oppure { haMosso, registro }.
async function conLaPartita(partitaId: string, cambia: (stato: Tutto, srv: Tutto, versione: number) => Tutto) {
  for (let giro = 0; giro < 6; giro++) {
    const { data: partita } = await admin.from("partite").select("stato,versione").eq("id", partitaId).single();
    if (!partita?.stato) return json({ errore: "La partita non è ancora iniziata." }, 400);
    const stato = partita.stato, srv = prendiAppunti(stato);
    if (!Array.isArray(stato.players?.[0]?.valigetta) || stato.lotti?.length !== L.CASELLE) return json({ errore: PARTITA_VECCHIA }, 400);
    // partite iniziate prima della notte nuova: aggiungo i campi che mancano
    if (stato.notte && !stato.notte.pronto) Object.assign(stato.notte, { pronto: {}, daScelta: {}, inizioRacc: {}, base: {}, inizio: Date.now() });
    const esito = await cambia(stato, srv, partita.versione);
    if (esito.risposta) return esito.risposta;
    giocaBot(stato, srv);
    segnaAttese(stato, srv, esito.haMosso ?? null);
    const nuova = partita.versione + 1;
    if (esito.dopo) esito.dopo(nuova);
    const viste = calcolaViste(partitaId, stato, srv, nuova); // prima di salvare: se fallisce, lo stato non cambia
    stato._srv = srv;
    try { await salva(partitaId, partita.versione, nuova, stato, viste, {}, esito.registro ?? null); }
    catch (e) { if (e instanceof Conflitto) { await new Promise((r) => setTimeout(r, 20 + Math.random() * 60 * (giro + 1))); continue; } throw e; }
    return json({ ok: true, versione: nuova });
  }
  return json({ errore: "In questo momento giocano in troppi insieme: la mossa non è partita. Riprova." }, 409);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // chi sta chiamando (il token del giocatore)
    const auth = req.headers.get("Authorization") ?? "";
    const { data: u } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ errore: "Il tuo accesso è scaduto o manca. Ricarica la pagina ed entra di nuovo." }, 401);
    const uid = u.user.id;
    let body: Tutto = null;
    try { body = await req.json(); } catch (_e) { body = null; }
    if (!body || typeof body !== "object") return json({ errore: "Richiesta non valida." }, 400);
    const mioPosto = async (partitaId: unknown) => {
      if (typeof partitaId !== "string" || !partitaId) return null;
      const { data } = await admin.from("giocatori").select("player_id").eq("partita_id", partitaId).eq("user_id", uid).maybeSingle();
      return data ? (data.player_id as string) : null;
    };
    const NON_GIOCHI = { errore: "Non giochi in questa partita (o il tuo posto è stato ripreso da un altro dispositivo).", nonGiochi: true };

    if (body.comando === "crea") {
      const gioc = (Array.isArray(body.giocatori) ? body.giocatori : []).slice(0, 8);
      if (gioc.length < 2) return json({ errore: "Servono almeno 2 giocatori." }, 400);
      // il primo giocatore e' chi crea la partita; gli altri umani entrano con il codice
      let partita: Tutto = null, error: Tutto = null;
      for (let i = 0; i < 5 && !partita; i++) { // se il codice esiste gia' se ne prova un altro
        ({ data: partita, error } = await admin.from("partite").insert({ codice: nuovoCodice(), creata_da: uid }).select().single());
      }
      if (!partita) throw error ?? new Error("non riesco a creare la partita");
      const righe = gioc.map((g: Tutto, i: number) => ({
        partita_id: partita.id, player_id: "g" + (i + 1), nome: String(g?.nome ?? "").trim().slice(0, 30) || "Giocatore " + (i + 1),
        bot: !!g?.bot, strategia: g?.bot && typeof g.strategia === "string" ? g.strategia.slice(0, 30) : null, user_id: i === 0 ? uid : null,
      }));
      const { error: e2 } = await admin.from("giocatori").insert(righe);
      if (e2) throw e2;
      return json({ partita: partita.id, codice: partita.codice });
    }

    if (body.comando === "entra") {
      const { data: partita } = await admin.from("partite").select("id,in_corso").eq("codice", String(body.codice ?? "").trim().toUpperCase()).maybeSingle();
      if (!partita) return json({ errore: "Codice non valido. Controlla di averlo scritto giusto (esempio: PALMA-4821)." }, 404);
      // chi ha gia' il posto rientra SEMPRE, anche a partita iniziata
      const gia = await mioPosto(partita.id);
      if (gia) return json({ partita: partita.id, player: gia, in_corso: partita.in_corso });
      if (partita.in_corso) return json({ errore: "La partita è già iniziata e su questo dispositivo non hai un posto. Se giocavi da un altro dispositivo, usa il tuo codice personale di rientro.", serveRientro: true }, 400);
      const nome = String(body.nome ?? "").trim().slice(0, 30);
      // due amici che entrano nello stesso momento: il posto si prende solo se e' ANCORA libero, altrimenti si passa al successivo
      for (let giro = 0; giro < 8; giro++) {
        const { data: liberi } = await admin.from("giocatori").select("player_id,nome")
          .eq("partita_id", partita.id).is("user_id", null).eq("bot", false).order("player_id").limit(1);
        if (!liberi?.length) return json({ errore: "Non ci sono posti liberi in questa partita." }, 400);
        const { data: preso, error } = await admin.from("giocatori").update({ user_id: uid, nome: nome || liberi[0].nome })
          .eq("partita_id", partita.id).eq("player_id", liberi[0].player_id).is("user_id", null).select("player_id");
        if (error) { // sei gia' entrato un attimo fa con un altro clic: il tuo posto e' quello
          const mio = await mioPosto(partita.id);
          if (mio) return json({ partita: partita.id, player: mio, in_corso: false });
          throw error;
        }
        if (preso?.length) return json({ partita: partita.id, player: liberi[0].player_id, in_corso: false });
      }
      return json({ errore: "Stanno entrando in tanti insieme: riprova tra un attimo." }, 409);
    }

    if (body.comando === "rientra") {
      const { data: partita } = await admin.from("partite").select("id,in_corso,creata_da").eq("codice", String(body.codice ?? "").trim().toUpperCase()).maybeSingle();
      const sbagliato = { errore: "Codice di rientro non valido. Controlla di averlo copiato tutto (esempio: PALMA-4821-K3Q9PX)." };
      if (!partita) return json(sbagliato, 404);
      const dato = soloCodice(body.rientro);
      const { data: posti } = await admin.from("giocatori").select("player_id,user_id,nome").eq("partita_id", partita.id).eq("bot", false).order("player_id");
      let posto: Tutto = null;
      for (const g of posti ?? []) if (g.user_id && dato.length === 6 && (await codiceRientro(partita.id, g.player_id)) === dato) posto = g;
      if (!posto) return json(sbagliato, 404);
      if (posto.user_id === uid) return json({ partita: partita.id, player: posto.player_id, in_corso: partita.in_corso });
      const gia = await mioPosto(partita.id);
      if (gia) return json({ errore: "Su questo dispositivo giochi già in questa partita con un altro posto: non puoi prenderne due." }, 400);
      const { error } = await admin.from("giocatori").update({ user_id: uid }).eq("partita_id", partita.id).eq("player_id", posto.player_id);
      if (error) throw error;
      // chi ha creato la partita resta "chi l'ha creata" anche dal dispositivo nuovo
      if (partita.creata_da === posto.user_id) await admin.from("partite").update({ creata_da: uid }).eq("id", partita.id);
      return json({ partita: partita.id, player: posto.player_id, in_corso: partita.in_corso });
    }

    if (body.comando === "mio_codice") {
      const mio = await mioPosto(body.partita);
      if (!mio) return json(NON_GIOCHI, 403);
      const { data: partita } = await admin.from("partite").select("codice").eq("id", body.partita).single();
      return json({ codice: partita!.codice, rientro: await codiceRientro(body.partita, mio), player: mio });
    }

    if (body.comando === "inizia") {
      const { data: partita } = await admin.from("partite").select("id,creata_da,in_corso,versione").eq("id", String(body.partita ?? "")).maybeSingle();
      if (!partita || partita.creata_da !== uid) return json({ errore: "Solo chi ha creato la partita la può iniziare." }, 403);
      // una partita gia' iniziata non riparte per sbaglio (doppio clic): per ricominciarla serve dirlo apposta
      if (partita.in_corso && body.ricomincia !== true) return json({ errore: "La partita è già iniziata.", giaIniziata: true }, 400);
      const { data: gioc } = await admin.from("giocatori").select("*").eq("partita_id", partita.id).order("player_id");
      if (gioc!.some((g: Tutto) => !g.bot && !g.user_id)) return json({ errore: "Manca ancora qualcuno: aspetta che tutti entrino con il codice." }, 400);
      // il giocatore g1 e' sempre chi ha creato la partita: e' lui che puo' chiudere una partita libera
      const stato = L.nuovaPartita({
        giocatori: gioc!.map((g: Tutto) => ({ nome: g.nome, bot: g.bot, strat: g.strategia })),
        principianti: !!body.principianti,
        consigli: body.consigli !== undefined ? !!body.consigli : !!body.principianti,
        durata: durataPulita(body),
      });
      const srv = prendiAppunti(stato);
      giocaBot(stato, srv);
      segnaAttese(stato, srv, null);
      // la versione non torna mai indietro, nemmeno quando si ricomincia: i browser scartano le viste piu' vecchie
      const nuova = (partita.versione || 0) + 1;
      const viste = calcolaViste(partita.id, stato, srv, nuova);
      stato._srv = srv;
      try { await salva(partita.id, partita.versione || 0, nuova, stato, viste, { in_corso: true }, null); }
      catch (e) { if (e instanceof Conflitto) return json({ errore: "La partita è già iniziata.", giaIniziata: true }, 400); throw e; }
      return json({ ok: true, versione: nuova });
    }

    if (body.comando === "azione") {
      const mio = await mioPosto(body.partita);
      if (!mio) return json(NON_GIOCHI, 403);
      // il numero unico della mossa: se il browser non lo manda, ne faccio uno io (serve quando il server riprova da solo)
      const idMossa = typeof body.mossa === "string" && body.mossa ? body.mossa.slice(0, 40) : "s" + crypto.randomUUID();
      const vista = Number.isFinite(body.versione) ? Number(body.versione) : null;
      const reg: { rifiuto: string | null } = { rifiuto: null };
      const risposta = await conLaPartita(body.partita, (stato, srv, versione) => {
        const m = srv.mosse[mio] || { v: 0, ids: [] };
        // 1. la stessa identica mossa e' gia' stata fatta (richiesta arrivata due volte): va bene cosi', non si rifa'
        if (m.ids.includes(idMossa)) return { risposta: json({ ok: true, versione, ripetuta: true }) };
        // 2. doppio clic: questa mossa e' partita PRIMA che il giocatore vedesse l'effetto della sua mossa precedente
        if (vista !== null && vista < m.v) return { risposta: json({ errore: "Hai cliccato due volte: vale solo la prima mossa.", doppia: true }, 409) };
        try {
          L.applica(stato, mio, copia(body.azione ?? null));
        } catch (e) {
          const err = e as Tutto;
          if (!err.gioco) throw e;
          reg.rifiuto = err.message;
          return { risposta: json({ errore: err.message, rifiutata: true }, 400) };
        }
        const eraSostituito = !!srv.sost[mio];
        delete srv.sost[mio]; // ha mosso: e' tornato
        return {
          haMosso: mio, registro: { partita_id: body.partita, player_id: mio, azione: body.azione, esito: eraSostituito ? "ok (tornato)" : "ok" },
          dopo: (nuova: number) => { srv.mosse[mio] = { v: nuova, ids: [...m.ids, idMossa].slice(-6) }; },
        };
      });
      if (reg.rifiuto !== null) { const { error } = await admin.from("azioni").insert({ partita_id: body.partita, player_id: mio, azione: body.azione ?? {}, esito: reg.rifiuto }); if (error) console.error("Registro delle azioni non scritto:", error.message); }
      return risposta;
    }

    // Chi non gioca da troppo tempo. Lo puo' chiedere chiunque sia nella partita: decide l'orologio del server.
    // Asta: dopo 60 secondi chi non ha offerto "non offre". Turno: dopo 3 minuti il computer gioca prudente al suo posto.
    // Chi ha creato la partita puo' farlo subito (subito: true, chi: "g2") senza aspettare il tempo.
    if (body.comando === "sollecita") {
      const mio = await mioPosto(body.partita);
      if (!mio) return json(NON_GIOCHI, 403);
      let creatore = false;
      if (body.subito === true) {
        const { data: partita } = await admin.from("partite").select("creata_da").eq("id", body.partita).single();
        creatore = partita?.creata_da === uid;
        if (!creatore) return json({ errore: "Solo chi ha creato la partita può far giocare subito il computer al posto di un altro." }, 403);
      }
      return await conLaPartita(body.partita, (stato, srv) => {
        const ora = Date.now(), fuori: string[] = [];
        if (creatore) {
          const p = stato.players.find((x: Tutto) => x.id === body.chi);
          if (!p || p.bot || p.id === mio) return { risposta: json({ errore: "Scegli un altro giocatore (una persona, non un computer)." }, 400) };
          if (srv.sost[p.id]) return { risposta: json({ errore: "Il computer sta già giocando al posto di " + p.nome + "." }, 400) };
          fuori.push(p.id);
        } else {
          const tutti = attesi(stato, srv);
          for (const a of tutti) if (ora - (srv.att[a.chi] ?? ora) >= (a.asta ? TEMPO_ASTA() : TEMPO_TURNO()) * 1000) fuori.push(a.chi);
          if (!fuori.length) {
            const manca = tutti.length ? Math.max(1, ...tutti.map((a) => Math.ceil(((a.asta ? TEMPO_ASTA() : TEMPO_TURNO()) * 1000 - (ora - (srv.att[a.chi] ?? ora))) / 1000))) : 0;
            return { risposta: json({ errore: tutti.length ? "Non è ancora passato il tempo massimo: mancano " + manca + " secondi." : "Adesso non si sta aspettando nessuno.", presto: true, manca }, 400) };
          }
        }
        const asta = stato.pending && stato.pending.tipo === "asta" ? stato.pending : null;
        const fatti: string[] = [];
        for (const id of fuori) {
          if (asta && asta.partecipanti.includes(id) && typeof asta.offerte[id] !== "number" && !creatore) {
            // all'asta chi non risponde in tempo "non offre"; resta lui a giocare
            try { L.applica(stato, id, { tipo: "offerta", importo: 0 }); fatti.push(id); } catch (e) { if (!(e as Tutto).gioco) throw e; }
            continue;
          }
          // non si sostituisce l'ultima persona rimasta: la partita non deve giocarsi da sola
          if (personeVere(stato, srv).filter((p: Tutto) => p.id !== id).length === 0) continue;
          srv.sost[id] = 1; fatti.push(id);
        }
        if (!fatti.length) return { risposta: json({ errore: "Non posso far giocare il computer al posto dell'ultima persona rimasta: la partita aspetta.", ultimo: true }, 400) };
        return { registro: { partita_id: body.partita, player_id: mio, azione: { tipo: "sollecita", chi: fatti, subito: creatore }, esito: "ok" } };
      });
    }

    // "Sono tornato": il computer smette di giocare al mio posto (basta anche fare una mossa qualsiasi)
    if (body.comando === "torno") {
      const mio = await mioPosto(body.partita);
      if (!mio) return json(NON_GIOCHI, 403);
      return await conLaPartita(body.partita, (_stato, srv, versione) => {
        if (!srv.sost[mio]) return { risposta: json({ ok: true, versione }) };
        delete srv.sost[mio];
        return { haMosso: mio, registro: { partita_id: body.partita, player_id: mio, azione: { tipo: "torno" }, esito: "ok" } };
      });
    }

    return json({ errore: "Comando sconosciuto." }, 400);
  } catch (e) {
    console.error(e);
    return json({ errore: "Il server ha avuto un problema e la mossa non è stata fatta. Riprova tra poco. (" + (e as Error).message + ")", guasto: true }, 500);
  }
});
