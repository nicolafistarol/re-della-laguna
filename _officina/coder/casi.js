#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — prove mirate: un caso preciso per ogni difetto corretto
//   node casi.js            (REPO=/percorso/copia per una copia di lavoro)
// A differenza di sim.js e invarianti.js (che giocano a caso), qui ogni prova costruisce
// la situazione esatta e controlla il risultato. Se un difetto gia' corretto torna, qui si vede subito.
// Chi corregge un difetto nuovo aggiunge qui la sua prova (in fondo, con il codice del difetto).
// Esce con 1 se una prova fallisce.
// =====================================================================
const { REPO, carica, gioca } = require("./laguna.js");
const { L, B } = carica();
console.log(`CASI  repo=${REPO}`);

let ok = 0; const falliti = [];
function prova(codice, titolo, fn) {
  try { fn(); ok++; console.log("  ok   " + codice.padEnd(8) + titolo); }
  catch (e) { falliti.push(codice + " " + titolo + ": " + e.message); console.log("  NO   " + codice.padEnd(8) + titolo + "\n         " + String(e.message).slice(0, 300)); }
}
function vero(x, msg) { if (!x) throw new Error(msg || "atteso vero"); }
function uguale(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || "valori diversi") + ": " + JSON.stringify(a).slice(0, 120) + " invece di " + JSON.stringify(b).slice(0, 120)); }
// l'azione deve essere rifiutata con un errore DI GIOCO ("non puoi") e lo stato deve restare identico
function rifiutata(s, id, a, cosa) {
  const prima = JSON.stringify(s); let e = null;
  try { L.applica(s, id, a); } catch (x) { e = x; }
  if (!e) throw new Error((cosa || JSON.stringify(a).slice(0, 100)) + ": accettata, doveva essere rifiutata");
  if (!e.gioco) throw new Error((cosa || JSON.stringify(a).slice(0, 100)) + ": errore del codice invece di un rifiuto (" + e.message + ")");
  if (JSON.stringify(s) !== prima) throw new Error((cosa || JSON.stringify(a).slice(0, 100)) + ": rifiutata, ma lo stato è cambiato");
  return e.message;
}
function accettata(s, id, a) { try { return L.applica(s, id, a); } catch (e) { throw new Error(JSON.stringify(a).slice(0, 120) + ": rifiutata (" + e.message + ")"); } }
const copia = (s) => JSON.parse(JSON.stringify(s));

// ---------------------------------------------------------------- situazioni di partenza
// una partita di bot fermata di giorno, senza domande aperte, con il giocatore di turno che non ha ancora tirato
function diGiorno(seed, ciclo, giocatori) {
  const r = gioca(L, B, { seed, cicli: 16, giocatori: giocatori || 4, giro: seed, fermaSe: (s) => s.fase === "giorno" && s.ciclo >= ciclo && !s.pending && !L.corrente(s).haTirato && L.corrente(s).faro === 0 });
  const s = r.stato; vero(s.fase === "giorno" && !s.fine, "non sono riuscito a fermare la partita di giorno");
  for (const p of s.players) { p.bot = false; }
  return s;
}
function diNotte(seed, ciclo, giocatori) {
  const r = gioca(L, B, { seed, cicli: 16, giocatori: giocatori || 4, giro: seed, fermaSe: (s) => s.fase === "notte" && s.ciclo >= ciclo && s.notte && s.notte.ora === 0 });
  const s = r.stato; vero(s.fase === "notte" && !s.fine, "non sono riuscito a fermare la partita di notte");
  for (const p of s.players) { p.bot = false; }
  return s;
}
const G = diGiorno(31, 4), NT = diNotte(32, 4);
// tutti ricchi, liberi e con almeno un terreno: cosi' le prove non dipendono da come e' andata la partita dei bot
// (se domani cambiano l'economia o i bot, queste situazioni restano valide)
const ricco = (s) => {
  for (const p of s.players) {
    p.cash = 30_000_000; p.sporchi = 12_000_000; p.fama = 80; p.faro = 0;
    if (!s.lotti.some((l) => l.owner === p.id)) { const libero = s.lotti.find((l) => l.owner == null && l.tipoCasella === "lotto"); if (libero) libero.owner = p.id; }
  }
  return s;
};

// ---------------------------------------------------------------- COD-01: valori sbagliati
prova("COD-01", "importi che non sono numeri vengono rifiutati e non cambiano niente", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id);
  io.debito = 2_000_000; io.prestiti = [{ importo: 2_000_000, inizio: s.ciclo, scadenza: s.ciclo + 3 }]; io.azioni[L.AZIENDE[0]] = 1000; io.cripto[L.MONETE[0]] = 500;
  for (const cattivo of ["abc", {}, [], true, -1, -1_000_000, 1e15]) {
    rifiutata(s, io.id, { tipo: "regala", a: altro.id, importo: cattivo });
    rifiutata(s, io.id, { tipo: "restituisci", importo: cattivo });
    rifiutata(s, io.id, { tipo: "prestito", importo: cattivo });
    rifiutata(s, io.id, { tipo: "proponi_lotto", a: altro.id, lotto: s.lotti.find((l) => l.owner === altro.id).id, prezzo: cattivo, compro: true });
    rifiutata(s, io.id, { tipo: "articolo", bersaglio: altro.id, tono: "elogio", importo: cattivo });
    rifiutata(s, io.id, { tipo: "campagna", importo: cattivo });
  }
  for (const cattivo of ["abc", {}, [], true]) {
    rifiutata(s, io.id, { tipo: "vendi", cosa: "borsa", nome: L.AZIENDE[0], quota: cattivo });
    rifiutata(s, io.id, { tipo: "vendi", cosa: "cripto", nome: L.MONETE[0], quota: cattivo });
    rifiutata(s, io.id, { tipo: "evasione", quota: cattivo });
    rifiutata(s, io.id, { tipo: "contratto", contratto: { a: altro.id, tipo: "parola", pagoOra: cattivo, pagoDopo: 0, cicli: 1 } });
    rifiutata(s, io.id, { tipo: "contratto", contratto: { a: altro.id, tipo: "parola", pagoOra: 0, pagoDopo: cattivo, cicli: 1 } });
    rifiutata(s, io.id, { tipo: "contratto", contratto: { a: altro.id, tipo: "parola", pagoOra: 0, pagoDopo: 0, cicli: cattivo } });
  }
});
prova("COD-01", "NaN e Infinito diventano 'vuoto' (come quando passano dal server) e non rompono i conti", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id);
  for (const x of [NaN, Infinity, -Infinity, null, undefined]) {
    for (const a of [{ tipo: "regala", a: altro.id, importo: x }, { tipo: "evasione", quota: x }, { tipo: "vendi", cosa: "borsa", nome: L.AZIENDE[0], quota: x }, { tipo: "restituisci", importo: x }, { tipo: "prestito", importo: x }, { tipo: "piano", quanti: x }]) { try { L.applica(s, io.id, a); } catch (e) { vero(e.gioco, a.tipo + ": errore del codice: " + e.message); } }
    for (const p of s.players) for (const k of ["cash", "sporchi", "debito", "fama", "tracce", "evasione"]) vero(Number.isFinite(p[k]), a_dire(k, p, x));
  }
  function a_dire(k, p, x) { return `dopo un valore ${x}: ${k} di ${p.nome} = ${p[k]}`; }
});
prova("COD-01", "un numero scritto come testo (\"100000\") vale come numero", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id), prima = altro.cash;
  accettata(s, io.id, { tipo: "regala", a: altro.id, importo: "100000" });
  uguale(altro.cash, prima + 100000);
});
prova("COD-01", "la cintura di sicurezza: se i conti non sono più numeri l'azione dà un errore vero (il server non salva)", () => {
  const s = copia(G), io = L.corrente(s); s.players[1].cash = NaN; let e = null;
  try { L.applica(s, io.id, { tipo: "tira" }); } catch (x) { e = x; }
  vero(e && !e.gioco && /non è più un numero/.test(e.message), "atteso un errore del codice, trovato: " + (e && e.message));
});
prova("COD-01", "applicaSicura rimette lo stato com'era dopo un rifiuto e dopo un errore", () => {
  vero(typeof L.applicaSicura === "function", "manca Laguna.applicaSicura");
  const s = ricco(copia(G)), io = L.corrente(s), prima = JSON.stringify(s);
  try { L.applicaSicura(s, io.id, { tipo: "regala", a: "nessuno", importo: 5 }); } catch (e) { vero(e.gioco); }
  uguale(JSON.stringify(s), prima, "dopo un rifiuto");
  const t = copia(G); t.players[1].cash = NaN; const primaT = JSON.stringify(t);
  try { L.applicaSicura(t, L.corrente(t).id, { tipo: "tira" }); } catch (e) { vero(!e.gioco); }
  uguale(JSON.stringify(t), primaT, "dopo un errore");
});
// ---------------------------------------------------------------- COD-03: azioni malformate
prova("COD-03", "azioni malformate: rifiutate, mai un errore del codice", () => {
  const s = ricco(copia(G)), io = L.corrente(s);
  for (const a of [null, undefined, 5, "tira", [], { tipo: 5 }, { tipo: null }, {}, { tipo: "constructor" }, { tipo: "__proto__" }, { tipo: "contratto", contratto: null }, { tipo: "contratto", contratto: "x" }, { tipo: "contratto", contratto: [] }, { tipo: "contratto" },
    { tipo: "stanza", stanza: "constructor" }, { tipo: "piano", funzione: "__proto__" }, { tipo: "piano", funzione: "toString" }, { tipo: "veicolo", veicolo: "valueOf" }, { tipo: "costruisci", lotto: "constructor", attivita: "hasOwnProperty" },
    { tipo: "investi", cosa: "borsa", nome: "__proto__", importo: 100000 }, { tipo: "vendi", cosa: "veicolo", nome: "constructor" }, { tipo: "legge", legge: "constructor" }, { tipo: "offerta_grande", affare: "constructor", importo: 1 },
    { tipo: "regala", a: { id: "g1" }, importo: 5 }, { tipo: "regala", a: ["g1"], importo: 5 }, { tipo: "msg_setta", setta: "s1", testo: "x".repeat(5000) }, { tipo: "occasione", n: 1, oggetti: "maschera" }, { tipo: "occasione", n: 1, oggetti: [{}] }])
    rifiutata(s, io.id, a);
  const n = ricco(copia(NT)), p = n.players[0];
  for (const a of [{ tipo: "corrompi", chi: "__proto__", isola: "Palma" }, { tipo: "corrompi", chi: "constructor" }, { tipo: "vai", luogo: "constructor" }, { tipo: "compra_oggetto", oggetto: "__proto__" }, { tipo: "recluta", setta: "s1", chi: "toString" }, { tipo: "soffiata", luogo: "valueOf" }])
    rifiutata(n, p.id, a);
});
// ---------------------------------------------------------------- COD-04: azioni rifiutate ma fatte a meta'
prova("COD-04", "articolo su un bersaglio che non esiste: rifiutato, i soldi restano", () => {
  const s = ricco(copia(G)), io = L.corrente(s);
  rifiutata(s, io.id, { tipo: "articolo", bersaglio: "Corona Bank", tono: "elogio", importo: 300_000 });
  rifiutata(s, io.id, { tipo: "articolo", bersaglio: "g99", tono: "scandalo", importo: 300_000, sporchi: true });
});
prova("COD-04", "al Faro una telefonata rifiutata non consuma la telefonata del turno", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id); io.faro = 2;
  rifiutata(s, io.id, { tipo: "regala", a: "nessuno", importo: 100_000 });
  accettata(s, io.id, { tipo: "regala", a: altro.id, importo: 100_000 });
  rifiutata(s, io.id, { tipo: "regala", a: altro.id, importo: 100_000 }, "seconda telefonata nello stesso turno");
});
prova("COD-04", "Municipio e Casinò Reale: se la scelta è rifiutata la finestra resta aperta", () => {
  const s = copia(G), io = L.corrente(s); io.cash = 1000; io.fama = 0;
  s.pending = { tipo: "municipio", giocatore: io.id };
  rifiutata(s, io.id, { tipo: "municipio", scelta: "licenza" }); rifiutata(s, io.id, { tipo: "municipio", scelta: "candidati" });
  accettata(s, io.id, { tipo: "municipio", scelta: null }); vero(s.pending === null, "uscendo dal Municipio la finestra deve chiudersi");
  s.pending = { tipo: "casino_reale", giocatore: io.id };
  rifiutata(s, io.id, { tipo: "casino_reale", importo: 5_000_000 });
  accettata(s, io.id, { tipo: "casino_reale", importo: 0 }); vero(s.pending === null);
});
prova("COD-04", "legge 'polizia doppia' senza isola: rifiutata, la legge del Ciclo non è consumata", () => {
  const s = copia(G), io = L.corrente(s); s.sindaco = io.id; delete s.leggeCiclo;
  rifiutata(s, io.id, { tipo: "legge", legge: "polizia_doppia", isola: "Pippo" });
  rifiutata(s, io.id, { tipo: "tasse" }); rifiutata(s, io.id, { tipo: "tasse", quota: "abc" });
  accettata(s, io.id, { tipo: "tasse", quota: 0.25 }); uguale(s.tassa, 0.25);
});
prova("COD-04", "operazione della setta con bersaglio sbagliato: rifiutata, il Tesoro non paga", () => {
  const s = ricco(copia(NT)), gm = s.players[0];
  const st = { id: "s77", nome: "Prova", motto: "", gm: gm.id, membri: [gm.id], tesoro: 60_000_000, operazioni: 0, pngReclutati: 0, influenza: 90 };
  s.sette.push(st); gm.sette = ["s77"]; gm.settaFondata = "s77"; gm.livello = 4; s.notte.dove[gm.id] = "faro"; delete s.notte.viaggio[gm.id]; delete s.notte.chiuso[gm.id]; delete s.notteFatti[gm.id];
  for (const a of [{ op: "manipola", bersaglio: "Pippo" }, { op: "blackout", bersaglio: "Pippo" }, { op: "evasione", bersaglio: "g99" }, { op: "sabotaggio", bersaglio: "s77" }, { op: "inchiesta", bersaglio: gm.id }, { op: "inchiesta", bersaglio: "g99" }, { op: "boh", bersaglio: "x" }])
    rifiutata(s, gm.id, { tipo: "operazione", setta: "s77", ...a });
  uguale(st.tesoro, 60_000_000);
});
prova("COD-04", "proposta di terreno che non vale più: scade senza errore (così resta salvato)", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id), l = s.lotti.find((x) => x.owner === altro.id);
  const id = accettata(s, io.id, { tipo: "proponi_lotto", a: altro.id, lotto: l.id, prezzo: 2_000_000, compro: true });
  io.cash = 10; // nel frattempo chi compra ha speso tutto
  accettata(s, altro.id, { tipo: "rispondi_proposta", id, si: true });
  uguale(s.proposte.find((x) => x.id === id).stato, "scaduta"); uguale(l.owner, altro.id); uguale(io.cash, 10);
});
prova("ECO-14", "non ci si regala soldi da soli", () => { const s = ricco(copia(G)), io = L.corrente(s); rifiutata(s, io.id, { tipo: "regala", a: io.id, importo: 100_000 }); });
// ---------------------------------------------------------------- ECO-10: contratti
prova("ECO-10", "contratto: non si promette più di quanto si possiede, né cifre smisurate", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id);
  const base = { a: altro.id, tipo: "notarile", pagoOra: 0, chiPagaOra: "da", chiPagaDopo: "da", cicli: 1 };
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, pagoDopo: 1e308 } });
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, pagoDopo: 1e12 } });
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, pagoDopo: Math.floor(L.patrimonio(s, io, false)) + 1 } });
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, pagoDopo: 0, pagoOra: io.cash + 1 } });
  accettata(s, io.id, { tipo: "contratto", contratto: { ...base, pagoDopo: Math.floor(L.patrimonio(s, io, false)) } });
});
prova("ECO-10", "contratto: quando paga l'altro, il limite si controlla alla firma (senza svelare i suoi conti a chi propone)", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id);
  const id = accettata(s, io.id, { tipo: "contratto", contratto: { a: altro.id, tipo: "notarile", pagoOra: 0, chiPagaOra: "da", pagoDopo: 900_000_000, chiPagaDopo: "a", cicli: 1 } });
  const msg = rifiutata(s, altro.id, { tipo: "rispondi_contratto", id, si: true });
  vero(/più di quanto possiedi/.test(msg), "messaggio inatteso: " + msg);
});
prova("ECO-10", "contratto: garanzia e terreno ceduto devono essere dei due firmatari", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id), terzo = s.players.find((p) => p.id !== io.id && p.id !== altro.id);
  const delTerzo = s.lotti.find((l) => l.owner === terzo.id).id, mio = s.lotti.find((l) => l.owner === io.id).id, suo = s.lotti.find((l) => l.owner === altro.id).id;
  const base = { a: altro.id, tipo: "notarile", pagoOra: 0, chiPagaOra: "da", pagoDopo: 1_000_000, chiPagaDopo: "da", cicli: 1 };
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, garanzia: delTerzo } });
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, garanzia: suo } }, "garanzia su un terreno di chi incassa");
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, garanzia: "o999" } });
  rifiutata(s, io.id, { tipo: "contratto", contratto: { ...base, lottoCeduto: delTerzo } });
  accettata(s, io.id, { tipo: "contratto", contratto: { ...base, garanzia: mio, lottoCeduto: suo } });
});
prova("ECO-10", "contratto notarile: il notaio si paga solo se ci sono i contanti, e nessuno va sotto zero", () => {
  const s = ricco(copia(G)), io = L.corrente(s), altro = s.players.find((p) => p.id !== io.id);
  const id = accettata(s, io.id, { tipo: "contratto", contratto: { a: altro.id, tipo: "notarile", pagoOra: 0, chiPagaOra: "da", pagoDopo: 20_000_000, chiPagaDopo: "da", cicli: 1 } });
  altro.cash = 1000; // chi firma non ha i 200.000 del notaio
  rifiutata(s, altro.id, { tipo: "rispondi_contratto", id, si: true });
  altro.cash = 5_000_000; const tot = io.cash + altro.cash;
  accettata(s, altro.id, { tipo: "rispondi_contratto", id, si: true });
  uguale(io.cash + altro.cash, tot - 400_000, "il notaio prende il 2% in tutto"); vero(io.cash >= 0 && altro.cash >= 0);
});
prova("ECO-10", "contratto non pagato e senza garanzia: chi incassa prende solo quello che c'è (la banca non crea soldi)", () => {
  const r = gioca(L, B, { seed: 41, cicli: 16, giocatori: 4, giro: 41, fermaSe: (s) => s.fase === "notte" && s.ciclo >= 3 });
  const s = r.stato; ricco(s); const io = s.players[0], altro = s.players[1];
  s.contratti.push({ id: "cX", da: io.id, a: altro.id, tipo: "notarile", pagoOra: 0, chiPagaOra: "da", pagoDopo: 25_000_000, chiPagaDopo: "da", scadenza: s.ciclo + 1, garanzia: null, lottoCeduto: null, testo: "", stato: "attivo" });
  io.cash = 3_000_000; io.azioni = {}; io.cripto = {}; const debito0 = io.debito;
  // si gioca fino a dopo la scadenza, tenendo bassi i contanti di chi deve pagare; alla chiusura si fotografano i suoi conti
  const fineC = s.ciclo + 2; let foto = null;
  const k = s.contratti.find((y) => y.id === "cX");
  gioca(L, B, { seed: 41, stato: s, fermaSe: (x) => x.ciclo >= fineC,
    prima(x) { if (k.stato === "attivo") { x.players[0].cash = 3_000_000; x.players[0].azioni = {}; x.players[0].cripto = {}; x.players[0].debito = 0; x.players[0].prestiti = []; } },
    dopo(x) { if (!foto && k.stato !== "attivo") foto = { cash: x.players[0].cash, debito: x.players[0].debito }; } });
  uguale(k.stato, "chiuso"); vero(k.nonPagato > 0, "doveva restare una parte non pagata (nonPagato = " + k.nonPagato + ")");
  vero(foto && foto.cash >= 0, "chi non paga finisce sotto zero: " + (foto && foto.cash));
  vero(foto.debito < 1_000_000, "la differenza è finita a debito con la banca (" + Math.round(foto.debito) + "): l'altro ha incassato soldi che non c'erano");
  vero(k.pagoDopo - k.nonPagato < 15_000_000, "incassato quasi tutto anche se i soldi non c'erano: " + (k.pagoDopo - k.nonPagato));
});
// ---------------------------------------------------------------- ECO-09: Resa dei conti
prova("ECO-09", "Resa dei conti: chi non ha i contanti per la multa va a debito, mai sotto zero", () => {
  // ultima notte di una partita corta: tutti con un reato grave, tante Tracce, pochi contanti e un Palazzo alto
  const r = gioca(L, B, { seed: 51, cicli: 6, giocatori: 4, giro: 51, fermaSe: (s) => s.fase === "notte" && s.ciclo >= 5 });
  const s = r.stato; vero(s.fase === "notte" && s.ciclo === 5, "non sono arrivato all'ultima notte");
  for (const p of s.players) { p.peggiorReato = "grave"; p.tracce = 500; p.sporchi = 5_000_000; p.cash = 100_000; p.debito = 0; p.prestiti = []; p.azioni = {}; p.cripto = {}; p.piani = 20; p.funzioniPiani = Array(20).fill("appartamenti"); p.faro = 0; }
  gioca(L, B, { seed: 51, stato: s, prima(x) { if (!x.fine) for (const p of x.players) { if (p.cash > 100_000) p.cash = 100_000; p.tracce = Math.max(p.tracce, 500); p.peggiorReato = "grave"; } } });
  vero(s.fine && Array.isArray(s.resa), "la partita non è finita con la Resa dei conti");
  vero(s.resa.length >= 1, "nessuna multa alla Resa: la prova non prova niente");
  for (const p of s.players) vero(p.cash >= -1, p.nome + " finisce con " + Math.round(p.cash) + " € in contanti");
  const aDebito = s.resa.filter((x) => s.players.find((q) => q.id === x.id).debito > 0).length;
  console.log(`         (${s.resa.length} multe alla Resa, ${aDebito} pagate in parte a debito)`);
  for (const c of s.classifica) vero(Number.isFinite(c.patrimonio));
});
prova("ECO-09", "nelle partite normali dei bot nessuno finisce con contanti sotto zero (12 partite)", () => {
  for (let i = 0; i < 12; i++) { const s = gioca(L, B, { seed: 1000 + i, cicli: 12, giocatori: 4 + ((i + 1) % 2) * 2, giro: i }).stato; vero(s.fine, "partita non finita");
    for (const p of s.players) vero(p.cash >= -1, `seme ${1000 + i}: ${p.nome} finisce con ${Math.round(p.cash)} € in contanti`); }
});

module.exports = { prova, vero, uguale, rifiutata, accettata, copia, diGiorno, diNotte, ricco, G, NT, L, B, fine };
function fine() {
  console.log(`\n${ok} prove riuscite, ${falliti.length} fallite`);
  if (falliti.length) { console.log("CASI: NON VA"); for (const f of falliti) console.log("  - " + f.slice(0, 260)); process.exit(1); }
  console.log("CASI: OK"); process.exit(0);
}
// le prove delle tappe successive stanno in file a parte (casi-*.js) e vengono caricate qui
if (require.main === module) {
  const fs = require("fs"), path = require("path");
  for (const f of fs.readdirSync(__dirname).filter((x) => /^casi-.*\.js$/.test(x)).sort()) require(path.join(__dirname, f));
  fine();
}
