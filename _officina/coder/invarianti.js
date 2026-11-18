#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — invarianti: cose che devono essere SEMPRE vere
//   node invarianti.js [partite] [cicli] [giocatori] [seme] [--senza-matto] [--solo-matto] [--tutto] [--severo] [--diario]
//   REPO=/percorso/copia node invarianti.js
// Gioca partite di soli bot e dopo OGNI mossa controlla:
//   NUM   niente NaN / Infinity / undefined dentro lo stato
//   JSON  lo stato si salva e si rilegge in JSON senza cambiare
//   SOLDI niente soldi, sporchi, debiti, tesori sotto zero; prezzi di Borsa sopra zero
//   PROP  ogni terreno ha un solo padrone che esiste; niente padroni su caselle non in vendita;
//         quote dei Grandi Affari mai oltre il totale; sette coerenti (membri veri, Gran Maestro dentro)
//   VISTA vista() non cambia lo stato vero (JSON prima = JSON dopo)
//   SEGR  vista(s, id) non contiene i segreti degli altri (prova del "canarino":
//         metto numeri e scritte riconoscibili nei segreti degli altri e li cerco nella vista)
//   FINE  la partita finisce, con una classifica fatta di numeri veri
//   CARICA la stessa partita, salvata e riletta ogni 7 mosse (come fa il server), finisce uguale
// Seconda parte, "il giocatore matto": durante la partita arrivano azioni a caso di OGNI tipo,
// anche con valori sbagliati (negativi, NaN, scritte). Il motore puo' dire "non puoi" (va bene),
// ma non deve rompersi (eccezione) e non deve sporcare lo stato.
// Esce con codice 1 se un invariante e' violato.
// =====================================================================
const fs = require("fs"), path = require("path");
const { REPO, carica, gioca, casuale } = require("./laguna.js");

const arg = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const partite = Number(arg[0]) || 6, cicli = Number(arg[1]) || 8, giocatori = Number(arg[2]) || 4, seme0 = Number(arg[3]) || 7000;
const DIARIO = process.argv.includes("--diario"); // stampa ogni azione del matto accettata dal motore
const SENZA_MATTO = process.argv.includes("--senza-matto"), TUTTO = process.argv.includes("--tutto");

const { L, B } = carica();
const sorgente = fs.readFileSync(path.join(REPO, "motore.js"), "utf8");
console.log(`INVARIANTI  repo=${REPO}  partite=${partite}  cicli=${cicli}  giocatori=${giocatori}  seme=${seme0}`);

// ---------------------------------------------------------------- raccolta delle violazioni
const violazioni = new Map(); // chiave -> { n, esempio }
let contesto = {};
let partitaMatta = false; // vero mentre gioca anche il "giocatore matto"
function viola(codice, cosa, dettaglio) {
  const chiave = codice + " | " + cosa.replace(/\d+/g, "#");
  const v = violazioni.get(chiave) || { n: 0, codice, cosa, esempio: null, matto: partitaMatta };
  v.n++;
  if (!v.esempio) v.esempio = { ...contesto, dettaglio: dettaglio === undefined ? undefined : String(typeof dettaglio === "string" ? dettaglio : JSON.stringify(dettaglio)).slice(0, 260) };
  violazioni.set(chiave, v);
}

// ---------------------------------------------------------------- le liste dei segreti scritte nel server e in locale.js
function lista(file, nome) {
  try { const t = fs.readFileSync(path.join(REPO, file), "utf8"); const m = t.match(new RegExp("const " + nome + "\\s*=\\s*\\[([^\\]]*)\\]")); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null; } catch (e) { return null; }
}
const SEGRETI_SERVER = lista("server/index.ts", "ALTRI_SEGRETI") || [], PIANI_SERVER = lista("server/index.ts", "PIANI_SEGRETI") || [];
const SEGRETI_LOCALE = lista("locale.js", "ALTRI_SEGRETI") || [], PIANI_LOCALE = lista("locale.js", "PIANI_SEGRETI");
// la vista come la manda il server. Motore nuovo: e' L.vistaSicura (una sola funzione per server e partita locale).
// Motore vecchio (prima della Tappa 0): vista del motore + i ritocchi che stavano in server/index.ts.
function vistaServer(s, id) {
  if (L.vistaSicura) return L.vistaSicura(s, id);
  const v = L.vista(s, id);
  for (const p of v.players) {
    if (p.id === id) { delete p.tracce; continue; }
    for (const k of SEGRETI_SERVER) delete p[k];
    if (Array.isArray(p.funzioniPiani)) p.funzioniPiani = p.funzioniPiani.map((f) => PIANI_SERVER.includes(f) ? "riservato" : f);
    if (Array.isArray(p.stanze)) p.stanze = p.stanze.filter((f) => !PIANI_SERVER.includes(f));
  }
  v.log = v.log.filter((r) => !r.chi || r.chi === id || !/prestito|restituisce|investe|vende|ipoteca|riscatta/.test(r.testo));
  return v;
}

// ---------------------------------------------------------------- controlli
function numeriVeri(x, percorso, fuori) {
  if (x === null) return;
  const t = typeof x;
  if (t === "number") { if (!Number.isFinite(x)) fuori.push(percorso + " = " + x); return; }
  if (t === "undefined") { fuori.push(percorso + " = undefined"); return; }
  if (t === "function" || t === "symbol" || t === "bigint") { fuori.push(percorso + " = " + t); return; }
  if (t !== "object") return;
  if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) numeriVeri(x[i], percorso + "[" + i + "]", fuori); return; }
  if (Object.getPrototypeOf(x) !== Object.prototype) { fuori.push(percorso + " = oggetto non semplice (" + (x.constructor && x.constructor.name) + ")"); return; }
  for (const k of Object.keys(x)) numeriVeri(x[k], percorso + "." + k, fuori);
}
const EPS = 0.51; // i centesimi non contano
function controllaStato(s) {
  // NUM
  const fuori = []; numeriVeri(s, "s", fuori);
  for (const f of fuori.slice(0, 5)) viola("NUM", f.replace(/ = .*/, "").replace(/players\[\d+\]/, "players[]").replace(/lotti\[\d+\]/, "lotti[]") + " non è un numero vero", f);
  // JSON
  let j;
  try { j = JSON.stringify(s); } catch (e) { viola("JSON", "lo stato non si può salvare", e.message); return null; }
  if (!fuori.length && JSON.stringify(JSON.parse(j)) !== j) viola("JSON", "lo stato riletto è diverso da quello salvato");
  // SOLDI
  const ids = new Set(s.players.map((p) => p.id));
  for (const p of s.players) {
    for (const k of ["cash", "sporchi", "debito"]) { if (typeof p[k] !== "number") viola("SOLDI", "giocatore." + k + " non è un numero", p.nome + ": " + p[k]); else if (p[k] < -EPS) viola("SOLDI", "giocatore." + k + " sotto zero", p.nome + " (" + p.strat + "): " + Math.round(p[k])); }
    for (const k of ["fama", "tracce", "piani", "faro", "stato", "pos"]) if (typeof p[k] !== "number") viola("SOLDI", "giocatore." + k + " non è un numero", p.nome + ": " + p[k]);
    if (p.tracce < -EPS) viola("SOLDI", "giocatore.tracce sotto zero", p.nome + ": " + p.tracce);
    if (p.piani < 0 || p.piani > L.N.pianiMax || p.piani !== Math.floor(p.piani)) viola("PROP", "piani del Palazzo fuori misura", p.nome + ": " + p.piani);
    if (p.pos < 0 || p.pos >= L.CASELLE || p.pos !== Math.floor(p.pos)) viola("PROP", "pedina fuori dal tabellone", p.nome + ": pos " + p.pos);
    for (const [a, q] of Object.entries(p.azioni || {})) if (!(q >= -1e-6)) viola("SOLDI", "azioni possedute sotto zero", p.nome + " " + a + ": " + q);
    for (const [a, q] of Object.entries(p.cripto || {})) if (!(q >= -1e-6)) viola("SOLDI", "cripto possedute sotto zero", p.nome + " " + a + ": " + q);
    for (const idS of p.sette || []) { const st = s.sette.find((x) => x.id === idS); if (!st) viola("PROP", "giocatore in una setta che non esiste", p.nome + " " + idS); else if (!st.membri.includes(p.id)) viola("PROP", "giocatore dice di essere in una setta che non lo ha tra i membri", p.nome + " " + idS); }
  }
  for (const [k, v] of Object.entries(s.borsa || {})) if (!(v > 0)) viola("SOLDI", "prezzo di Borsa non positivo", k + ": " + v);
  for (const [k, v] of Object.entries(s.cripto || {})) if (!(v > 0)) viola("SOLDI", "prezzo cripto non positivo", k + ": " + v);
  if (!(s.tassa >= 0 && s.tassa <= 1)) viola("SOLDI", "tassa fuori misura", s.tassa);
  // PROP
  if (s.lotti.length !== L.CASELLE) viola("PROP", "numero di caselle sbagliato", s.lotti.length);
  const visti = new Set();
  for (const l of s.lotti) {
    if (visti.has(l.id)) viola("PROP", "due caselle con lo stesso nome interno", l.id); visti.add(l.id);
    if (l.owner != null && (typeof l.owner !== "string" || !ids.has(l.owner))) viola("PROP", "terreno con un padrone che non esiste (o più di uno)", l.nome + ": " + JSON.stringify(l.owner));
    if (l.owner != null && !["lotto", "molo"].includes(l.tipoCasella)) viola("PROP", "padrone su una casella che non si vende", l.nome);
    if (l.owner == null && (l.lvl > 0 || l.ipoteca > 0)) viola("PROP", "terreno senza padrone ma con edifici o ipoteca", l.nome + " lvl " + l.lvl + " ipoteca " + l.ipoteca);
    if (!(l.lvl >= 0 && l.lvl <= 5) || l.lvl !== Math.floor(l.lvl)) viola("PROP", "livello dell'edificio fuori misura", l.nome + ": " + l.lvl);
    if (l.lvl > 0 && !l.tipo) viola("PROP", "edificio senza tipo di attività", l.nome);
    if (l.tipo && !L.ATTIVITA[l.tipo]) viola("PROP", "attività sconosciuta su un terreno", l.nome + ": " + l.tipo);
    if (l.ipoteca < -EPS) viola("SOLDI", "ipoteca sotto zero", l.nome + ": " + l.ipoteca);
  }
  for (const [k, g] of Object.entries(s.grandi || {})) {
    if (g.capo != null && !ids.has(g.capo)) viola("PROP", "Grande Affare con un capo che non esiste", k + ": " + g.capo);
    if (g.quote) { let tot = 0; for (const [id, q] of Object.entries(g.quote)) { tot += q; if (!ids.has(id)) viola("PROP", "quote di un Grande Affare a chi non esiste", k + ": " + id); if (q < 0) viola("PROP", "quote di un Grande Affare sotto zero", k + " " + id + ": " + q); }
      const totale = (L.GRANDI[k] && L.GRANDI[k].quote) || 100; if (tot > totale + 1e-6) viola("PROP", "quote di un Grande Affare oltre il totale", k + ": " + tot + " su " + totale); }
  }
  for (const st of s.sette) {
    if (!ids.has(st.gm) || !st.membri.includes(st.gm)) viola("PROP", "setta con un Gran Maestro che non è tra i membri", st.nome + ": " + st.gm);
    if (new Set(st.membri).size !== st.membri.length) viola("PROP", "setta con lo stesso membro due volte", st.nome);
    for (const id of st.membri) { if (!ids.has(id)) viola("PROP", "setta con un membro che non esiste", st.nome + ": " + id); else if (!(s.players.find((p) => p.id === id).sette || []).includes(st.id)) viola("PROP", "membro della setta che non sa di esserlo", st.nome + ": " + id); }
    if (!(st.tesoro >= -EPS)) viola("SOLDI", "Tesoro della setta sotto zero", st.nome + ": " + st.tesoro);
    if (st.sepolto != null && !(st.sepolto >= -EPS)) viola("SOLDI", "Tesoro sepolto sotto zero", st.nome + ": " + st.sepolto);
  }
  if (s.sindaco != null && !ids.has(s.sindaco)) viola("PROP", "Sindaco che non esiste", s.sindaco);
  if (s.fase === "giorno" && !(s.turno >= 0 && s.turno < s.ordine.length)) viola("PROP", "turno fuori dall'ordine", s.turno);
  return j;
}

// VISTA + SEGR
const CAN = 7_301_000_000; // numeri "canarino": nessun conto del gioco ci arriva
function controllaViste(s, j0) {
  for (const p of s.players) {
    let v;
    try { v = L.vista(s, p.id); } catch (e) { viola("VISTA", "vista() va in errore", e.message + " | " + (String(e.stack).match(/motore\.js:\d+/) || [""])[0]); continue; }
    const j1 = JSON.stringify(s);
    if (j1 !== j0) { viola("VISTA", "vista() ha cambiato lo stato vero", primaDifferenza(JSON.parse(j0), JSON.parse(j1), "s")); j0 = j1; }
    // campi vietati sugli altri giocatori
    for (const q of v.players) if (q.id !== p.id) for (const k of ["cash", "sporchi", "tracce", "debito", "prove", "messaggi", "valigetta", "conti", "corrotti", "azioni", "cripto"]) if (k in q) viola("SEGR", "nella vista c'è il campo segreto di un altro: " + k, p.nome + " vede " + q.nome + "." + k);
    // motore nuovo: degli altri passa SOLO quello che sta in CAMPI_PUBBLICI (piu' la fascia)
    if (L.CAMPI_PUBBLICI) for (const q of v.players) if (q.id !== p.id) for (const k of Object.keys(q)) if (k !== "fascia" && !L.CAMPI_PUBBLICI.includes(k)) viola("SEGR", "nella vista di un altro giocatore c'è un campo non pubblico: " + k, p.nome + " vede " + q.nome + "." + k);
    if (v.manoSM) viola("SEGR", "nella vista c'è manoSM (le mani di Sette e mezzo di tutti)", p.nome);
    if (v.rngState !== undefined || v.seed !== undefined) viola("SEGR", "nella vista c'è il seme dei dadi", p.nome);
    // di notte: dove sono gli altri si sa solo se sono nello stesso posto
    if (s.notte && v.notte && v.notte.dove) for (const q of s.players) if (q.id !== p.id && v.notte.dove[q.id] != null) {
      const insieme = !s.notte.viaggio[p.id] && !s.notte.viaggio[q.id] && s.notte.dove[p.id] && s.notte.dove[p.id] !== "palazzo" && s.notte.dove[q.id] === s.notte.dove[p.id];
      if (!insieme) viola("SEGR", "di notte si vede dove si trova un altro giocatore", p.nome + " vede " + q.nome + " a " + v.notte.dove[q.id]);
    }
    if (/"mazzo":/.test(JSON.stringify(v))) viola("SEGR", "nella vista c'è un mazzo di carte (le carte che usciranno)", p.nome);
  }
}
function primaDifferenza(a, b, percorso) {
  if (a === b) return null;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return percorso + ": " + JSON.stringify(a) + " -> " + JSON.stringify(b);
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = primaDifferenza(a[k], b[k], percorso + "." + k); if (d) return d; }
  return null;
}
// il canarino: su una copia metto segni riconoscibili nei segreti degli altri, poi li cerco nella vista
function controllaCanarino(j0) {
  const base = JSON.parse(j0);
  for (const io of base.players) {
    const c = JSON.parse(j0), segni = [];
    let n = 0;
    const num = (cosa) => { const x = CAN + 7919 * ++n; segni.push([String(x), cosa]); return x; };
    const scr = (cosa) => { const x = "CANARINO" + ++n + "X"; segni.push([x, cosa]); return x; };
    const altri = c.players.filter((q) => q.id !== io.id);
    for (const q of altri) {
      q.cash = num("soldi di " + q.nome); q.sporchi = num("sporchi di " + q.nome); q.debito = num("debito di " + q.nome); q.riciclTot = num("soldi ripuliti da " + q.nome);
      q.messaggi.push({ ciclo: c.ciclo + 1, testo: scr("messaggi privati di " + q.nome) });
      q.conti = q.conti || {}; q.conti[c.ciclo] = { [scr("'I miei conti' di " + q.nome)]: [1, 1] };
      if (q.ultimoEsito) q.ultimoEsito.dc = num("esito dell'ultima azione di notte di " + q.nome);
      // ogni altro campo non pubblico (anche quelli che nasceranno domani, e la memoria dei bot): un segno dentro
      if (L.CAMPI_PUBBLICI) for (const k of Object.keys(q)) {
        if (L.CAMPI_PUBBLICI.includes(k) || ["cash", "sporchi", "debito", "riciclTot", "messaggi", "conti", "ultimoEsito", "tracce", "stato", "fama"].includes(k)) continue;
        const x = q[k], cosa = "il campo '" + k + "' di " + q.nome;
        if (Array.isArray(x)) { if (k === "sette") continue; x.push(scr(cosa)); }
        else if (x && typeof x === "object") x[scr(cosa)] = 1;
        else if (typeof x === "string") q[k] = scr(cosa);
      }
      // un segno anche in campi segreti che oggi magari non ci sono
      q.refurtiva = { ciclo: -5, importo: num("la merce comprata dal Ricettatore da " + q.nome) }; q._n = { visti: [scr("i posti visitati stanotte da " + q.nome + " (memoria del bot)")] };
      q.nascondigli = [scr("i nascondigli scoperti da " + q.nome)]; q.trucchi = { [scr("gli oggetti usati da " + q.nome)]: 1 }; q.lavato = num("i soldi lavati con la setta da " + q.nome);
      if (c.notte) { (c.notte.racconto[q.id] = c.notte.racconto[q.id] || []).push(scr("racconto della notte di " + q.nome)); if (c.notte.base && c.notte.base[q.id]) c.notte.base[q.id].soldi = num("soldi a inizio ora di " + q.nome + " (notte.base)"); }
      if (c.manoSM && c.manoSM[q.id]) c.manoSM[q.id].segno = scr("mano di Sette e mezzo di " + q.nome + " (manoSM)");
      if (c.pending && c.pending.tipo === "asta" && c.pending.offerte && c.pending.offerte[q.id] !== undefined) c.pending.offerte[q.id] = num("offerta segreta all'asta di " + q.nome);
      for (const [k, g] of Object.entries(c.grandi || {})) if (g.offerte && g.offerte[q.id] !== undefined) g.offerte[q.id] = num("offerta segreta per " + k + " di " + q.nome);
      if (c.ultimaAlba && c.ultimaAlba.riepilogo && c.ultimaAlba.riepilogo[q.id]) c.ultimaAlba.riepilogo[q.id].segno = scr("riepilogo dell'Alba di " + q.nome);
      if (c.riepOra && c.riepOra.per && c.riepOra.per[q.id]) c.riepOra.per[q.id].segno = scr("riepilogo dell'ora di " + q.nome);
    }
    // tabelle "per giocatore" in cima allo stato o dentro la notte (anche quelle che nasceranno domani):
    // un segno dentro la parte degli altri. Se esce nella vista, la tabella va tolta o filtrata dentro vista().
    const idTutti = new Set(c.players.map((q) => q.id));
    const perGiocatore = (m) => m && typeof m === "object" && !Array.isArray(m) && Object.keys(m).length > 0 && Object.keys(m).every((id) => idTutti.has(id));
    const pianta = (m, nome) => { for (const q of altri) { const x = m[q.id]; if (Array.isArray(x)) x.push(scr("la tabella '" + nome + "' nella parte di " + q.nome)); else if (x && typeof x === "object") x[scr("la tabella '" + nome + "' nella parte di " + q.nome)] = 1; } };
    for (const [k, m] of Object.entries(c)) if (perGiocatore(m)) pianta(m, k);
    if (c.notte) for (const [k, m] of Object.entries(c.notte)) if (perGiocatore(m)) pianta(m, "notte." + k);
    for (const st of c.sette) if (!st.membri.includes(io.id)) {
      st.tesoro = num("Tesoro della setta rivale " + st.nome); st.influenza = num("Influenza della setta rivale"); (st.chat = st.chat || []).push({ da: st.gm, nome: "x", testo: scr("chat della setta rivale"), ciclo: 0 });
    } else if (st.gm !== io.id) st.sepolto = num("Tesoro sepolto (lo sa solo il Gran Maestro)");
    if (altri.length >= 2) c.flussi.push({ n: 999999, c: 1, g: 1, da: altri[0].id, a: altri[1].id, importo: num("passaggio di soldi privato tra altri due"), motivo: scr("motivo di un passaggio privato tra altri due"), pubblico: false });
    let v;
    try { v = JSON.stringify(vistaServer(c, io.id)); } catch (e) { continue; } // la copia truccata puo' confondere il motore: non e' un errore del gioco
    let vm = null; try { vm = JSON.stringify(L.vista(c, io.id)); } catch (e) { }
    for (const [segno, cosa] of segni) {
      const generico = altri.reduce((x, q) => x.split(q.nome).join("un altro"), cosa);
      if (v.includes(segno)) viola("SEGR", "il server manda a un giocatore: " + generico, io.nome + " riceve: " + cosa);
      else if (vm && vm.includes(segno)) viola("SEGR-motore", "vista() del motore lascia passare (lo toglie solo il server): " + generico, io.nome + " riceve: " + cosa);
    }
  }
}

// ---------------------------------------------------------------- il giocatore matto
const TIPI = (() => { const i = sorgente.indexOf("function applica0("), f = sorgente.indexOf("function vista(", i); const corpo = sorgente.slice(i, f); const t = {};
  for (const riga of corpo.split("\n")) { const m = [...riga.matchAll(/case "([a-z_0-9]+)":/g)]; if (!m.length) continue; const campi = [...new Set([...riga.matchAll(/\ba\.([a-zA-Z]+)/g)].map((x) => x[1]).filter((x) => x !== "tipo"))]; for (const x of m) t[x[1]] = campi; }
  return t; })();
const provati = {}, riusciti = {}, strani = {};
function matto(s, rnd) {
  const scegli = (v) => v[Math.floor(rnd() * v.length)];
  const idG = s.players.map((p) => p.id), idL = s.lotti.map((l) => l.id), idS = s.sette.map((x) => x.id);
  const NUM_BUONI = [0, 1, 2, 3, 4, 5, 10, 50_000, 100_000, 300_000, 1_000_000, 3_000_000, 10_000_000, 0.1, 0.2, 0.5];
  const NUM_CATTIVI = [-1, -1_000_000, NaN, Infinity, -Infinity, "100000", "abc", null, undefined, 1e15, {}, [], true, 1.5, -0.5];
  const numero = () => rnd() < 0.7 ? scegli(NUM_BUONI) : scegli(NUM_CATTIVI);
  const o = (v) => rnd() < 0.85 && v.length ? scegli(v) : scegli(["boh", "", null, undefined, 7, "__proto__", "constructor", {}]);
  const POOL = {
    lotto: () => o(idL), a: () => o(idG), bersaglio: () => o(idG.concat(Object.keys(L.AZIENDE || {}), L.AZIENDE || [])), invitato: () => o(idG), membro: () => o(idG), host: () => o(idG),
    setta: () => o(idS), luogo: () => o(Object.keys(L.LUOGHI)), oggetto: () => o(Object.keys(L.OGGETTI)), oggetti: () => rnd() < 0.8 ? Object.keys(L.OGGETTI).filter(() => rnd() < 0.3) : scegli([null, "x", 5, {}]),
    attivita: () => o(Object.keys(L.ATTIVITA)), veicolo: () => o(Object.keys(L.N.veicoli)), stanza: () => o(Object.keys(L.STANZE)), funzione: () => o(Object.keys(L.STANZE).concat(["appartamenti"])),
    affare: () => o(Object.keys(L.GRANDI)), cosa: () => o(["borsa", "cripto", "drink", "sfida", "segui", "carte", "affare"]), nome: () => o([...(L.AZIENDE || []), ...(L.MONETE || []), "La Prova"]),
    metodo: () => o(["copertura", "shadow", "casino", "paradiso", "banchiere", "galleria"]), mossa: () => o(["carta", "sto", "rilancia"]), isola: () => o(L.ISOLE), legge: () => o(Object.keys(L.LEGGI)), opera: () => o(Object.keys(L.OPERE)),
    op: () => o(["manipola", "blackout", "evasione", "inchiesta", "sabotaggio", "scandalo"]), direzione: () => o(["su", "giu"]), chi: () => o(["agente", "commissario", "banchiere", "doganiere", ...Object.keys(L.GIRO || {})]),
    chiave: () => o(["commissario", "banchiere", "doganiere", ...L.ISOLE.map((i) => "agente_" + i)]), tono: () => o(["buono", "cattivo", "scandalo", "elogio"]), scelta: () => o(["fama", "scandalo", "borsa", "tassa", "permesso", "multa", "sconto", 0, 1, 2]),
    si: () => rnd() < 0.5, sporchi: () => rnd() < 0.5, telefono: () => rnd() < 0.5, compro: () => rnd() < 0.5, indietro: () => rnd() < 0.5, corona: () => rnd() < 0.5, uscire: () => rnd() < 0.5,
    testo: () => o(["ciao", "x".repeat(5000), "<b>ciao</b>"]), motto: () => o(["motto"]), motivo: () => o(["perché sì"]), id: () => o([...(s.proposte || []).map((x) => x.id), ...s.contratti.map((x) => x.id), ...((s.notte && s.notte.proposte) || []).map((x) => x.id), ...L.PACCHETTI.map((x) => x.id)]),
    contratto: () => rnd() < 0.85 ? { a: o(idG), tipo: o(["notarile", "parola"]), pagoOra: numero(), pagoDopo: numero(), cicli: numero(), chiPagaOra: o(["a", "da"]), chiPagaDopo: o(["a", "da"]), lottoCeduto: rnd() < 0.3 ? o(idL) : null, garanzia: rnd() < 0.3 ? o(idL) : null, testo: "patto" } : scegli([null, undefined, "x", 5]),
  };
  const tipi = Object.keys(TIPI).filter((t) => t !== "tempo_scaduto" && t !== "chiudi_partita");
  const quante = 1 + Math.floor(rnd() * 3);
  // --- il matto "furbo": un'azione che ha senso in questo momento (cosi' arriva in fondo alle funzioni), fatta da chi puo' farla
  const furba = () => {
    const altro = (p) => scegli(s.players.filter((q) => q.id !== p.id)), soldi = () => scegli([50_000, 125_000, 300_000, 1_000_000, 3_000_000, 10_000_000]);
    const miei = (p) => s.lotti.filter((l) => l.owner === p.id), settaDi = (p) => s.sette.find((st) => st.membri.includes(p.id)), settaGM = (p) => s.sette.find((st) => st.gm === p.id);
    if (s.fase === "pacchetti") return null;
    // risposte in sospeso (valgono giorno e notte)
    const cose = [];
    for (const k of s.contratti) if (k.stato === "proposto") cose.push([s.players.find((p) => p.id === k.a), { tipo: "rispondi_contratto", id: k.id, si: rnd() < 0.8 }]);
    for (const x of s.proposte || []) if (x.stato === "proposta") cose.push([s.players.find((p) => p.id === x.a), { tipo: "rispondi_proposta", id: x.id, si: rnd() < 0.8, motivo: "boh" }]);
    for (const x of s.inviti || []) cose.push([s.players.find((p) => p.id === x.a), { tipo: "rispondi_invito", setta: x.setta, si: rnd() < 0.8 }]);
    for (const st of s.sette) if (st.opera && st.opera.stato !== "fatta") cose.push([s.players.find((p) => p.id === scegli(st.membri)), { tipo: "vota_opera", setta: st.id, si: rnd() < 0.7 }]);
    if (cose.length && rnd() < 0.35) return scegli(cose);
    if (s.fase === "giorno") {
      if (s.pending) {
        const pd = s.pending, p = s.players.find((x) => x.id === pd.giocatore) || L.corrente(s);
        if (pd.tipo === "compra") return [p, { tipo: "compra", si: rnd() < 0.7 }];
        if (pd.tipo === "asta") { const q = s.players.find((x) => pd.partecipanti.includes(x.id) && pd.offerte[x.id] === undefined) || p; return [q, { tipo: "offerta", importo: scegli([0, 100_000, 400_000]) }]; }
        if (pd.tipo === "gala") return [p, { tipo: "gala", importo: scegli([0, 200_000, 1_000_000]) }];
        if (pd.tipo === "casino_reale") return [p, { tipo: "casino_reale", importo: scegli([0, 100_000, 50_000_000]) }];
        if (pd.tipo === "municipio") return [p, { tipo: "municipio", scelta: scegli(["candidati", "licenza", null]) }];
        if (pd.tipo === "chiamata") return [p, { tipo: "chiamata", si: rnd() < 0.5, telefono: rnd() < 0.5 }];
        return null;
      }
      const p = L.corrente(s), mio = miei(p), lm = mio.length ? scegli(mio).id : "o1", lib = s.lotti.filter((l) => l.owner == null && l.tipoCasella === "lotto"), st = settaDi(p), gm = settaGM(p);
      const sind = s.players.find((x) => x.id === s.sindaco) || p, capo = (k) => s.players.find((x) => s.grandi && s.grandi[k] && x.id === s.grandi[k].capo) || p;
      return scegli([
        [p, { tipo: "costruisci", lotto: lm, attivita: scegli(Object.keys(L.ATTIVITA)) }], [p, { tipo: "permesso", lotto: lm }], [p, { tipo: "regalo_assessore", lotto: lm }],
        [p, { tipo: "agenzia", lotto: lib.length ? scegli(lib).id : lm }], [p, { tipo: "piano", quanti: scegli([1, 1, 2, 3]) }], [p, { tipo: "stanza", stanza: scegli(Object.keys(L.STANZE)) }],
        [p, { tipo: "veicolo", veicolo: scegli(Object.keys(L.N.veicoli)) }], [p, { tipo: "prestito", importo: soldi() }], [p, { tipo: "restituisci", importo: soldi() }],
        [p, { tipo: "ipoteca", lotto: lm }], [p, { tipo: "riscatta", lotto: lm }], [p, { tipo: "licenza" }], [p, { tipo: "busta_licenza" }], [p, { tipo: "candidati" }], [p, { tipo: "campagna", importo: soldi() }],
        [p, { tipo: "investi", cosa: "borsa", nome: scegli(L.AZIENDE), importo: soldi() }], [p, { tipo: "investi", cosa: "cripto", nome: scegli(L.MONETE), importo: soldi() }],
        [p, { tipo: "vendi", cosa: "borsa", nome: scegli(L.AZIENDE), quota: scegli([0.5, 1]) }], [p, { tipo: "vendi", cosa: "cripto", nome: scegli(L.MONETE), quota: 1 }], [p, { tipo: "vendi", cosa: "veicolo", nome: scegli(p.veicoli.concat(["yacht"])) }],
        [p, { tipo: "regala", a: altro(p).id, importo: soldi(), sporchi: rnd() < 0.3 }], [p, { tipo: "evasione", quota: scegli([0, 0.1, 0.3]) }], [p, { tipo: "denuncia", prova: 0 }],
        [p, { tipo: "contratto", contratto: { a: altro(p).id, tipo: scegli(["notarile", "parola"]), pagoOra: scegli([0, 100_000, 2_000_000]), chiPagaOra: scegli(["a", "da"]), pagoDopo: scegli([0, 500_000, 5_000_000, 900_000_000]), chiPagaDopo: scegli(["a", "da"]), cicli: scegli([1, 2]), lottoCeduto: rnd() < 0.3 ? scegli(s.lotti).id : null, garanzia: rnd() < 0.3 ? scegli(s.lotti).id : null, testo: "patto" } }],
        [p, { tipo: "proponi_lotto", a: altro(p).id, lotto: rnd() < 0.5 ? lm : scegli(s.lotti).id, prezzo: soldi(), compro: rnd() < 0.5 }],
        [p, { tipo: "articolo", bersaglio: altro(p).id, tono: scegli(["scandalo", "elogio"]), importo: soldi(), testo: "titolo", sporchi: rnd() < 0.3 }],
        [p, { tipo: "viaggio_rapido", idx: (scegli(L.destinazioniRapide(s, p)) || { idx: 3 }).idx }],
        [sind, { tipo: "legge", legge: scegli(Object.keys(L.LEGGI)), isola: scegli(L.ISOLE.concat([null])) }], [sind, { tipo: "tasse", quota: scegli([0.1, 0.2, 0.3]) }],
        [p, { tipo: "offerta_grande", affare: scegli(Object.keys(L.GRANDI)), importo: scegli([0, 12_000_000, 16_000_000]) }], [p, { tipo: "quote_grande", affare: scegli(Object.keys(L.GRANDI)), n: scegli([1, 2]) }],
        [capo("tv"), { tipo: "titolone", scelta: scegli(["fama", "scandalo", "borsa"]), bersaglio: altro(p).id, azienda: scegli(L.AZIENDE), su: rnd() < 0.5 }],
        [capo("banca"), { tipo: "tasso_banca", tasso: scegli([5, 10, 20]) }], [capo("banca"), { tipo: "blocca_conto", bersaglio: altro(p).id }], [capo("banca"), { tipo: "ricicla_banca", importo: soldi() }],
        [p, { tipo: "versa_setta", setta: st ? st.id : "s1", importo: soldi(), sporchi: rnd() < 0.5 }], [p, { tipo: "lava_setta", setta: st ? st.id : "s1", importo: soldi() }], [p, { tipo: "msg_setta", setta: st ? st.id : "s1", testo: "ciao" }],
        [p, { tipo: "invita_setta", setta: gm ? gm.id : "s1", invitato: altro(p).id, offerta: scegli([0, 500_000, -500_000]) }], [p, { tipo: "espelli_setta", setta: gm ? gm.id : "s1", membro: altro(p).id }],
        [p, { tipo: "proponi_opera", setta: gm ? gm.id : "s1", opera: scegli(Object.keys(L.OPERE)) }], [p, { tipo: "ritira_opera", setta: gm ? gm.id : "s1" }], [p, { tipo: "lascia_setta", setta: st ? st.id : "s1" }],
        [p, { tipo: p.haTirato ? "fine_turno" : "tira" }],
      ]);
    }
    if (s.fase === "notte" && s.notte) {
      const N2 = s.notte, vivi = s.players.filter((p) => !s.notteFatti[p.id] && p.faro === 0); if (!vivi.length) return null;
      const liberi = vivi.filter((q) => !N2.chiuso[q.id] && !N2.viaggio[q.id]); // chi puo' ancora scegliere in quest'ora
      const p = scegli(liberi.length && rnd() < 0.85 ? liberi : vivi), dove = N2.dove[p.id], st = settaDi(p), gm = settaGM(p), qui = s.players.filter((q) => q.id !== p.id && N2.dove[q.id] === dove);
      if (s.manoSM && s.manoSM[p.id]) return [p, { tipo: "sm", mossa: scegli(["carta", "sto", "rilancia"]) }];
      const prop = (N2.proposte || []).find((x) => x.a === p.id && x.stato === "attesa"); if (prop && rnd() < 0.7) return [p, { tipo: "rispondi_incontro", id: prop.id, si: rnd() < 0.8 }];
      let scelte = []; try { scelte = L.scelteNotte(s, p); } catch (e) { }
      const daScelta = (x) => x.k === "aspetta" ? { tipo: "aspetta" } : x.k === "fissa" ? { tipo: "attivita", importo: scegli([10_000, 100_000, 1_000_000]) } : x.k === "occ" ? { tipo: "occasione", n: x.n, oggetti: (p.valigetta || []).map((y) => y.id).filter(() => rnd() < 0.5) }
        : x.k === "ricettatore" ? { tipo: "ricettatore", importo: scegli([100_000, 500_000, 2_000_000]) } : x.k === "polizia" ? { tipo: "corrompi", chi: scegli(["agente", "commissario"]), isola: scegli(L.ISOLE), sporchi: rnd() < 0.5 }
        : x.k === "banchiere" || x.k === "doganiere" ? { tipo: "corrompi", chi: x.k, sporchi: rnd() < 0.5 } : x.k === "ballo" ? { tipo: "ballo" } : x.k === "ricicla" ? { tipo: "ricicla", metodo: scegli(["copertura", "shadow", "paradiso"]), importo: soldi() }
        : x.k === "articolo" ? { tipo: "articolo", bersaglio: altro(p).id, tono: scegli(["scandalo", "elogio"]), importo: soldi(), testo: "t", sporchi: rnd() < 0.5 } : x.k === "rito" ? { tipo: "rito", setta: x.setta }
        : x.k === "scava" ? { tipo: "scava", setta: x.setta } : x.k === "serata" ? { tipo: "serata", ingresso: scegli([0, 50_000, 100_000]) } : x.k === "setta" ? { tipo: "operazione", setta: gm ? gm.id : st ? st.id : "s1", op: scegli(["manipola", "blackout", "evasione", "fantoccio", "inchiesta", "sabotaggio"]), bersaglio: scegli([altro(p).id, scegli(L.AZIENDE), scegli(L.ISOLE), (s.sette.find((y) => y !== st) || { id: "s9" }).id]), direzione: scegli(["su", "giu"]) } : null;
      const aperti = Object.keys(L.LUOGHI).filter((l) => l !== dove && L.luogoAperto(s, l, p)), serate = Object.keys(N2.serate || {});
      const lista = scelte.map(daScelta).filter(Boolean).map((a) => [p, a]).concat([
        [p, { tipo: "vai", luogo: scegli(aperti.length ? aperti : ["club"]) }], [p, { tipo: "vai", luogo: scegli(aperti.length ? aperti : ["club"]) }], [p, { tipo: "avanti" }], [p, { tipo: "avanti" }], [p, { tipo: "aspetta" }],
        [p, { tipo: "compra_oggetto", oggetto: scegli(Object.keys(L.OGGETTI).filter((k) => L.OGGETTI[k].dove === dove).concat(["maschera"])) }], [p, { tipo: "soffiata", luogo: scegli(Object.keys(L.LUOGHI)) }],
        [p, { tipo: "foto", bersaglio: (scegli(qui) || altro(p)).id }], [p, { tipo: "incontro", a: (scegli(qui) || altro(p)).id, cosa: scegli(["drink", "sfida", "segui"]), importo: scegli([50_000, 200_000]) }],
        [p, { tipo: "spa" }], [p, { tipo: "serata", ingresso: 50_000 }], [p, { tipo: "vai_serata", host: scegli(serate.concat([altro(p).id])) }], [p, { tipo: "gioca_serata", importo: scegli([50_000, 200_000]) }],
        [p, { tipo: "fonda_setta", nome: "La Prova " + s.prossimoId, motto: "motto" }], [p, { tipo: "recluta", setta: gm ? gm.id : "s1", chi: scegli(["banchiere", "commissario", "giudice", "doganiere"]) }],
        [p, { tipo: "convoca", setta: gm ? gm.id : "s1", luogo: scegli(Object.keys(L.LUOGHI)), ora: scegli([2, 3, 4]) }], [p, { tipo: "jet_setta", setta: st ? st.id : "s1" }], [p, { tipo: "rito", setta: st ? st.id : "s1" }],
        [p, { tipo: "seppellisci", setta: gm ? gm.id : "s1", importo: soldi(), indietro: rnd() < 0.3 }], [p, { tipo: "scava", setta: scegli(s.sette.concat([{ id: "s1" }])).id }],
        [p, { tipo: "tradisci", setta: st ? st.id : "s1" }], [p, { tipo: "prova_fedelta", setta: gm ? gm.id : "s1", membro: altro(p).id }], [p, { tipo: "scarica_contatto", chiave: scegli(Object.keys(p.corrotti || {}).concat(["commissario"])) }],
        [p, { tipo: "regala", a: altro(p).id, importo: soldi(), sporchi: true }], [p, { tipo: "versa_setta", setta: st ? st.id : "s1", importo: soldi(), sporchi: true }], [p, { tipo: "lava_setta", setta: st ? st.id : "s1", importo: soldi() }],
      ]);
      if (rnd() < 0.02) return [p, { tipo: "torna_a_casa" }];
      return scegli(lista);
    }
    return null;
  };
  for (let i = 0; i < quante && !s.fine; i++) {
    let tipo = scegli(tipi), a = { tipo }, chi = null;
    const f = rnd() < 0.6 ? furba() : null;
    if (f && f[0]) {
      chi = f[0]; a = f[1]; tipo = a.tipo;
      // una volta su quattro, dentro l'azione sensata finisce un valore sbagliato
      if (rnd() < 0.25) { const ks = Object.keys(a).filter((k) => k !== "tipo"); if (ks.length) { const k = scegli(ks); a[k] = typeof a[k] === "number" || ["importo", "prezzo", "quota", "n", "quanti", "ingresso", "offerta", "tasso", "ora", "idx", "prova"].includes(k) ? scegli(NUM_CATTIVI) : k === "contratto" ? (rnd() < 0.5 ? { ...a[k], [scegli(["pagoOra", "pagoDopo", "cicli"])]: scegli(NUM_CATTIVI) } : scegli([null, "x", 5])) : scegli(["boh", "", null, undefined, 7, "__proto__", "constructor", {}, []]); } }
    } else {
      for (const campo of TIPI[tipo]) a[campo] = POOL[campo] ? POOL[campo]() : numero();
      if (tipo === "titolone" || tipo === "articolo") { a.bersaglio = POOL.bersaglio(); a.importo = numero(); a.scelta = POOL.scelta(); a.testo = "t"; a.tono = POOL.tono(); }
      // chi manda l'azione: spesso quello a cui tocca davvero, cosi' piu' azioni vanno a segno
      chi = scegli(s.players);
      if (rnd() < 0.6) { if (s.pending && s.pending.giocatore) chi = s.players.find((p) => p.id === s.pending.giocatore) || chi; else if (s.fase === "giorno") chi = L.corrente(s); }
      if (s.pending && rnd() < 0.3 && TIPI[s.pending.tipo]) { a.tipo = s.pending.tipo; for (const campo of TIPI[a.tipo]) if (!(campo in a)) a[campo] = POOL[campo] ? POOL[campo]() : numero(); }
    }
    const tipoV = a.tipo;
    provati[tipoV] = (provati[tipoV] || 0) + 1;
    contesto = { seed: contesto.seed, ciclo: s.ciclo + 1, fase: s.fase, chi: chi.nome, azione: JSON.stringify(a, (k, v) => typeof v === "number" && !Number.isFinite(v) ? String(v) : v === undefined ? "undefined" : typeof v === "string" && v.length > 40 ? v.slice(0, 20) + "…(" + v.length + ")" : v).slice(0, 220), matto: true };
    const foto = JSON.stringify(s), gravi0 = quanteGravi();
    let ok = false, rifiutata = false;
    try { L.applica(s, chi.id, a); ok = true; }
    catch (e) {
      if (e && e.gioco) rifiutata = true;
      else viola("ROTTO", "azione '" + tipoV + "' manda in errore il motore: " + String(e && e.message).replace(/'[^']*'|"[^"]*"/g, "…") + " | " + ((String(e && e.stack).match(/motore\.js:\d+/) || ["?"])[0]), e && e.message);
    }
    if (rifiutata) {
      // il motore ha detto "non puoi": allora non deve essere cambiato niente
      let dopo = null; try { dopo = JSON.stringify(s); } catch (e) { }
      if (dopo !== foto) viola("A-META", "azione '" + tipoV + "' rifiutata, ma lo stato è cambiato lo stesso", primaDifferenza(JSON.parse(foto), dopo ? JSON.parse(dopo) : {}, "s"));
      ripristina(s, foto); continue;
    }
    if (!ok) { ripristina(s, foto); continue; }
    riusciti[tipoV] = (riusciti[tipoV] || 0) + 1;
    if (DIARIO) console.log("   [matto] seme " + contesto.seed + " C" + contesto.ciclo + " " + contesto.fase + " " + chi.nome + " " + contesto.azione);
    // un importo sbagliato che viene accettato e' sospetto
    for (const k of ["importo", "prezzo", "offerta", "ingresso", "quota", "tasso", "n", "quanti"]) if (k in a) { const x = a[k]; if ((typeof x === "number" && (x < 0 || !Number.isFinite(x))) || (typeof x === "string") || (x !== null && typeof x === "object")) { const kk = tipoV + "." + k + " = " + (typeof x === "number" ? (x < 0 ? "negativo" : String(x)) : typeof x === "string" ? "scritta" : "oggetto"); strani[kk] = (strani[kk] || 0) + 1; } }
    const j = controllaStato(s);
    if (j && rnd() < 0.15) controllaViste(s, j);
    // se questa azione ha sporcato lo stato, torno a prima: cosi' ogni buco si vede da solo
    if (quanteGravi() > gravi0) ripristina(s, foto);
  }
}
function quanteGravi() { let n = 0; for (const v of violazioni.values()) if (!["DOPPIONE", "SEGR-motore", "A-META"].includes(v.codice)) n += v.n; return n; }
function ripristina(s, foto) { const o = JSON.parse(foto); for (const k of Object.keys(s)) delete s[k]; Object.assign(s, o); }

// ---------------------------------------------------------------- le partite
let mosse = 0, finite = 0, eccezioni = [], blocchi = [];
function unaPartita(seed, opz) {
  let n = 0;
  partitaMatta = !!(opz && opz.matto);
  const rnd = casuale(seed * 31 + 5);
  const r = gioca(L, B, { seed, cicli, giocatori, giro: seed, ...opz,
    dopo(s, bot, a) {
      n++;
      contesto = { seed, ciclo: s.ciclo + 1, fase: s.fase, chi: bot.nome + " (" + bot.strat + ")", azione: JSON.stringify(a).slice(0, 160) };
      const j = controllaStato(s);
      if (j && (TUTTO || n % 6 === 0 || (s.fase === "notte" && n % 3 === 0))) controllaViste(s, j);
      if (j && (TUTTO || n % 60 === 0 || (s.fase === "notte" && n % 12 === 0))) controllaCanarino(j);
      if (opz && opz.matto) {
        // dal Ciclo 3 tutti ricchi e famosi (solo in queste partite di prova): cosi' si aprono sette, Livello 4, Grandi Affari
        if (s.ciclo >= 2 && !s._ricchi) { s._ricchi = true; for (const q of s.players) { q.cash += 40_000_000; q.sporchi += 15_000_000; q.fama += 45; } }
        if (rnd() < 0.5) matto(s, rnd);
      }
    } });
  mosse += r.passi;
  contesto = { seed, fase: "fine" };
  for (const e of r.eccezioni) { eccezioni.push(e); viola(opz && opz.matto ? "ROTTO-poi" : "ECCEZIONE", (opz && opz.matto ? "dopo le azioni del matto, " : "") + e.dove + ": " + e.messaggio + " | " + (e.riga || "?"), e); }
  for (const b of r.blocchi) { blocchi.push(b); viola("FINE", (opz && opz.matto ? "(con il matto) " : "") + "la partita si ferma: " + (b.motivo || "nessun bot ha una mossa") + " [" + b.fase + (b.pending ? ", in attesa di: " + b.pending : "") + "]", b); }
  const s = r.stato;
  if (s && s.fine) {
    finite++;
    if (!Array.isArray(s.classifica) || s.classifica.length !== s.players.length) viola("FINE", "classifica mancante o incompleta");
    else for (const c of s.classifica) if (!Number.isFinite(c.patrimonio)) viola("FINE", "patrimonio finale che non è un numero", c);
    const j = controllaStato(s); if (j) { controllaViste(s, j); controllaCanarino(j); }
  }
  partitaMatta = false;
  return r;
}

const t0 = Date.now();
// 1) partite normali
const SOLO_MATTO = process.argv.includes("--solo-matto");
if (!SOLO_MATTO) for (let i = 0; i < partite; i++) unaPartita(seme0 + i, {});
if (!SOLO_MATTO) console.log(`\n1) Partite di bot controllate mossa per mossa: ${finite}/${partite} finite, ${mosse} mosse`);
// 2) salva e ricarica: stessa partita, deve finire uguale
let diverse = 0;
for (let i = 0; i < (SOLO_MATTO ? 0 : Math.min(3, partite)); i++) {
  const a = gioca(L, B, { seed: seme0 + i, cicli, giocatori, giro: seme0 + i });
  const b = gioca(L, B, { seed: seme0 + i, cicli, giocatori, giro: seme0 + i, ricaricaOgni: 7 });
  const ca = JSON.stringify(a.stato && a.stato.classifica), cb = JSON.stringify(b.stato && b.stato.classifica);
  if (ca !== cb) { diverse++; contesto = { seed: seme0 + i }; viola("CARICA", "la partita salvata e riletta finisce in modo diverso (c'è memoria fuori dallo stato)", "senza ricarica: " + ca.slice(0, 110) + " | con ricarica: " + cb.slice(0, 110)); }
}
if (!SOLO_MATTO) console.log(`2) Salva e ricarica ogni 7 mosse: ${Math.min(3, partite) - diverse}/${Math.min(3, partite)} partite finiscono uguali`);
// 2b) il giro dei bot condiviso (LagunaBot.gioca, quello che usano server e partita locale) deve dare la stessa partita
if (!SOLO_MATTO && typeof B.gioca === "function") {
  let uguali = 0; const quante = Math.min(2, partite);
  for (let i = 0; i < quante; i++) {
    const seed = seme0 + i, a = gioca(L, B, { seed, cicli, giocatori, giro: seed });
    const vr = Math.random, vn = Date.now; Math.random = casuale(seed ^ 0x9e3779b9); let orologio = 1_800_000_000_000; Date.now = () => orologio;
    let s2 = null, err2 = null;
    try {
      const nomi = a.stato.players.map((p) => ({ nome: p.nome, bot: true, strat: p.strat }));
      s2 = L.nuovaPartita({ giocatori: nomi, seed, durata: { modo: "cicli", cicli }, principianti: false, consigli: false });
      for (let k = 0; k < 400 && !s2.fine; k++) { const r = B.gioca(s2, { max: 100000 }); if (r.errori.length) { err2 = r.errori[0]; break; } if (s2.fine) break; if (s2.fase === "notte") { orologio += (L.TEMPO_ORA + 5) * 1000; try { L.applica(s2, s2.players[0].id, { tipo: "tempo_scaduto" }); } catch (e) { break; } } else break; }
    } catch (e) { err2 = { messaggio: e.message }; } finally { Math.random = vr; Date.now = vn; }
    contesto = { seed };
    if (err2) viola("ECCEZIONE", "LagunaBot.gioca: errore del codice in una mossa dei bot: " + err2.messaggio, err2);
    else if (JSON.stringify(s2 && s2.classifica) !== JSON.stringify(a.stato.classifica)) viola("CARICA", "LagunaBot.gioca (server e partita locale) non dà la stessa partita del giro delle prove", JSON.stringify(s2 && s2.classifica).slice(0, 120) + " | " + JSON.stringify(a.stato.classifica).slice(0, 120));
    else uguali++;
  }
  console.log(`2b) Il giro dei bot condiviso (LagunaBot.gioca) dà la stessa partita: ${uguali}/${quante}`);
}
// 3) il giocatore matto
if (!SENZA_MATTO) {
  const f0 = finite, m0 = mosse;
  // almeno 12 Cicli: sotto non si aprono il Livello 4 e i Grandi Affari
  for (let i = 0; i < partite; i++) unaPartita(seme0 + 500 + i, { matto: true, cicli: Math.max(cicli, 12) });
  const np = Object.values(provati).reduce((a, b) => a + b, 0), nr = Object.values(riusciti).reduce((a, b) => a + b, 0);
  console.log(`3) Giocatore matto: ${finite - f0}/${partite} partite finite, ${np} azioni a caso (${nr} accettate dal motore), ${Object.keys(TIPI).length} tipi di azione nel motore`);
  const mai = Object.keys(TIPI).filter((t) => !riusciti[t] && t !== "tempo_scaduto" && t !== "chiudi_partita");
  if (mai.length) console.log(`   tipi mai riusciti nemmeno una volta (quindi poco provati): ${mai.join(", ")}`);
  const ks = Object.keys(strani);
  if (ks.length) { console.log("   Valori strani accettati senza errore (di solito innocui: NaN e Infinito diventano 'vuoto', i fuori misura vengono tagliati):"); for (const k of ks.sort()) console.log("     " + String(strani[k]).padStart(4) + "  " + k); }
}
// le due liste dei segreti (server e partita locale) devono essere uguali
const soloServer = SEGRETI_SERVER.filter((x) => !SEGRETI_LOCALE.includes(x)), soloLocale = SEGRETI_LOCALE.filter((x) => !SEGRETI_SERVER.includes(x));
// (dal motore nuovo le liste non ci sono piu': c'e' una sola vistaSicura nel motore)
for (const f of ["server/index.ts", "locale.js"]) { let c = ""; try { c = fs.readFileSync(path.join(REPO, f), "utf8"); } catch (e) { }
  if (L.vistaSicura && /function vistaSicura|function giocaBot\s*\([^)]*\)\s*\{\s*for/.test(c)) { contesto = {}; viola("DOPPIONE", f + " ha ancora una copia sua di vistaSicura o del giro dei bot: deve usare L.vistaSicura e B.gioca"); } }
if (soloServer.length || soloLocale.length || (PIANI_SERVER.length && !PIANI_LOCALE)) {
  contesto = {};
  viola("DOPPIONE", "le liste dei segreti in server/index.ts e in locale.js sono diverse", "solo nel server: " + soloServer.join(",") + " | solo in locale: " + soloLocale.join(",") + (PIANI_SERVER.length && !PIANI_LOCALE ? " | PIANI_SEGRETI manca in locale.js" : ""));
}

// ---------------------------------------------------------------- risultato
console.log(`\nTempo: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const elenco = [...violazioni.values()].sort((a, b) => a.codice.localeCompare(b.codice) || b.n - a.n);
if (!elenco.length) { console.log("INVARIANTI: OK (nessuna violazione)"); process.exit(0); }
console.log(`\nVIOLAZIONI: ${elenco.length} tipi diversi`);
for (const v of elenco) {
  console.log(`\n[${v.codice}] x${v.n}  ${v.cosa}`);
  const e = v.esempio || {};
  console.log(`    es.: seme ${e.seed}, Ciclo ${e.ciclo}, ${e.fase}${e.matto ? ", MATTO" : ""}, ${e.chi || ""} ${e.azione || ""}`);
  if (e.dettaglio) console.log(`    ${e.dettaglio}`);
}
// i doppioni e i segreti che il server toglie da solo sono avvisi; il resto blocca
// Cosa blocca e cosa no:
//  - le violazioni nelle partite NORMALI bloccano sempre (sono regressioni: oggi sono zero);
//  - i buchi trovati dal "giocatore matto" sono difetti gia' presenti (nel rapporto: COD-01, COD-02...):
//    oggi sono solo avvisi; quando saranno corretti si lancia con --severo e bloccano anche loro.
const SEVERO = process.argv.includes("--severo");
const SOLO_AVVISO = ["DOPPIONE", "SEGR-motore"];
const gravi = elenco.filter((v) => !SOLO_AVVISO.includes(v.codice) && (SEVERO || !v.matto));
if (gravi.length) { console.log("\nGRAVI (bloccano):"); for (const v of gravi) console.log(`  [${v.codice}] ${v.cosa}  (seme ${(v.esempio || {}).seed}, Ciclo ${(v.esempio || {}).ciclo})`); }
console.log(`BUCHI-MATTO: ${elenco.filter((v) => v.matto).length}`);
console.log(gravi.length ? `\nINVARIANTI: NON VA (${gravi.length} tipi di violazione che bloccano, ${elenco.length - gravi.length} avvisi)` : `\nINVARIANTI: OK con ${elenco.length} avvisi`);
process.exit(gravi.length ? 1 : 0);
