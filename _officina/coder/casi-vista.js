// =====================================================================
// Prove mirate sulla vista (cosa vede ognuno) e sul giro dei bot condiviso — Tappa 0, P3
// Caricato da casi.js.
// =====================================================================
const { prova, vero, uguale, accettata, copia, ricco, G, NT, L, B } = require("./casi.js");
const vistaDi = (s, id) => (L.vistaSicura || L.vista)(s, id);

function conManoAperta() {
  const s = ricco(copia(NT)), p = s.players[0];
  p.livello = 3; s.notte.dove[p.id] = "bisca"; delete s.notte.viaggio[p.id]; delete s.notte.chiuso[p.id]; delete s.notteFatti[p.id];
  accettata(s, p.id, { tipo: "attivita", importo: 100_000 });
  vero(s.manoSM && s.manoSM[p.id] && Array.isArray(s.manoSM[p.id].mazzo), "non sono riuscito ad aprire una mano di Sette e mezzo alla Bisca");
  return { s, p };
}
prova("COD-02", "Sette e mezzo: il mazzo e le mani non escono mai, né agli altri né a chi gioca", () => {
  const { s, p } = conManoAperta();
  for (const q of s.players) {
    const v = vistaDi(s, q.id), j = JSON.stringify(v);
    vero(v.manoSM === undefined, q.nome + " riceve manoSM (le mani di tutti)");
    vero(!/"mazzo":/.test(j), q.nome + " riceve un mazzo di carte");
    if (q.id === p.id) { vero(v.notte.manoSM && Array.isArray(v.notte.manoSM.carte), "chi gioca deve vedere le sue carte"); vero(v.notte.manoSM.mazzo === undefined, "chi gioca non deve vedere il mazzo"); }
    else vero(v.notte.manoSM === null, q.nome + " vede la mano di " + p.nome);
  }
});
prova("COD-02", "Sette e mezzo in una sfida: chi è sfidato non vede né il mazzo né le carte dell'altro prima della fine", () => {
  const s = ricco(copia(NT)), a = s.players[0], b = s.players[1];
  for (const q of [a, b]) { q.livello = 3; s.notte.dove[q.id] = "club"; delete s.notte.viaggio[q.id]; delete s.notte.chiuso[q.id]; delete s.notteFatti[q.id]; }
  accettata(s, a.id, { tipo: "incontro", a: b.id, cosa: "sfida", importo: 100_000 });
  for (const q of s.players) { const j = JSON.stringify(vistaDi(s, q.id)); vero(!/"mazzo":/.test(j), q.nome + " riceve il mazzo della sfida"); if (q.id !== a.id) vero(!/"manoDa":/.test(j), q.nome + " vede le carte di chi sfida"); }
});
prova("ON-07", "degli altri giocatori si vede solo quello che è pubblico (niente memoria dei bot, prestiti, merce rubata...)", () => {
  vero(Array.isArray(L.CAMPI_PUBBLICI), "manca Laguna.CAMPI_PUBBLICI");
  const s = ricco(copia(NT)), io = s.players[0];
  for (const q of s.players) { q._n = { visti: ["porto"], ric: true }; q._lavaCiclo = 3; q.botGrandi = 31; q.refurtiva = { ciclo: s.ciclo, importo: 900_000 }; q.nascondigli = ["s1"]; q.trucchi = { maschera: 2 }; q.lavato = 5; q.prestiti = [{ importo: 1 }]; q.livello = 3; q.stanze = ["caveau", "spa"]; q.funzioniPiani = ["caveau", "appartamenti"]; q.piani = 12; }
  const v = vistaDi(s, io.id);
  for (const q of v.players) {
    if (q.id === io.id) { vero(q.cash === io.cash && q._n, "le mie cose devo vederle"); vero(q.tracce === undefined, "le mie Tracce non si vedono come numero"); continue; }
    for (const k of Object.keys(q)) vero(k === "fascia" || L.CAMPI_PUBBLICI.includes(k), "campo non pubblico di un altro nella vista: " + k);
    vero(typeof q.fascia === "string", "manca la fascia di " + q.nome);
    uguale(q.stanze, ["spa"], "le stanze segrete degli altri non si vedono"); uguale(q.funzioniPiani, ["riservato", "appartamenti"]);
    for (const k of ["id", "nome", "colore", "pos", "faro", "fama", "piani", "veicoli", "pacchetto"]) vero(k in q, "manca il campo pubblico " + k);
  }
  vero(v.rngState === undefined && v.seed === undefined, "il seme dei dadi è nella vista");
});
prova("COD-06", "una sola vista e un solo giro dei bot: server e partita locale usano Laguna.vistaSicura e LagunaBot.gioca", () => {
  vero(typeof L.vistaSicura === "function" && typeof B.gioca === "function", "mancano Laguna.vistaSicura o LagunaBot.gioca");
  const fs = require("fs"), path = require("path"), { REPO } = require("./laguna.js");
  for (const f of ["locale.js", "server/index.ts"]) { const c = fs.readFileSync(path.join(REPO, f), "utf8"); vero(/vistaSicura\(/.test(c) && /B\.gioca\(/.test(c), f + " non usa le funzioni comuni"); vero(!/ALTRI_SEGRETI|PIANI_SEGRETI/.test(c), f + " ha ancora una sua lista di segreti"); }
});
prova("COD-06", "LagunaBot.gioca: fa giocare i bot fino al turno di una persona e non nasconde gli errori del codice", () => {
  const s = L.nuovaPartita({ giocatori: [{ nome: "Io" }, { nome: "Rocco", bot: true, strat: "Furbo" }, { nome: "Vera", bot: true, strat: "Legale" }], seed: 5, durata: { modo: "cicli", cicli: 6 } });
  const r = B.gioca(s); uguale(r.errori, []); vero(r.mosse > 0, "i bot non hanno mosso");
  vero(s.fase === "pacchetti" || L.corrente(s).id === "g1" || s.pending, "dopo il giro dei bot deve toccare alla persona");
  // un errore vero dentro una mossa non sparisce: torna nell'elenco
  const t = copia(G); for (const p of t.players) p.bot = true; t.players[0].strat = "Legale"; t.players[2].cash = NaN;
  const e = B.gioca(t, { max: 3 }); vero(e.errori.length > 0 && /non è più un numero/.test(e.errori[0].messaggio), "l'errore del codice doveva comparire nell'elenco: " + JSON.stringify(e.errori).slice(0, 200));
});
