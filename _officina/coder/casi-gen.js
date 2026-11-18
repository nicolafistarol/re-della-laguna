// =====================================================================
// Prove mirate sulle regole G1 (partite nuove = gen 2, le vecchie restano gen 1) e G2 (VERSIONE) — Tappa 0
// Caricato da casi.js.
// =====================================================================
const fs = require("fs"), path = require("path");
const { prova, vero, uguale, copia, G, L, B } = require("./casi.js");
const { gioca, REPO } = require("./laguna.js");

prova("G1", "una partita nuova nasce di generazione 2; una partita senza il campo vale 1", () => {
  vero(typeof L.gen2 === "function" && typeof L.num === "function", "mancano Laguna.gen2 o Laguna.num");
  const s = L.nuovaPartita({ giocatori: [{ nome: "a" }, { nome: "b", bot: true, strat: "Legale" }], seed: 3 });
  uguale(s.gen, 2); vero(L.gen2(s), "gen2 deve essere vero per una partita nuova");
  const vecchia = copia(s); delete vecchia.gen; delete vecchia.motoreNascita;
  vero(!L.gen2(vecchia) && !L.gen2({}) && !L.gen2({ gen: 1 }) && !L.gen2(null), "gen2 deve essere falso per le partite vecchie");
});
prova("G1", "num(s, chiave): le partite vecchie leggono SEMPRE i numeri di prima", () => {
  const nuova = { gen: 2 }, vecchia = {};
  for (const k of Object.keys(L.N)) uguale(L.num(vecchia, k), L.N[k], "num per una partita vecchia, chiave " + k);
  for (const k of Object.keys(L.N_GEN2)) vero(k in L.N, "N_GEN2 ha la chiave '" + k + "' che in N non c'è (errore di battitura?)");
  for (const k of Object.keys(L.N)) uguale(L.num(nuova, k), k in L.N_GEN2 ? L.N_GEN2[k] : L.N[k]);
  uguale(L.num(nuova, "toString"), undefined, "le parole riservate non sono numeri del gioco");
});
prova("G1", "una partita iniziata con il motore vecchio resta di generazione 1 anche dopo molte mosse", () => {
  const f = path.join(__dirname, "risultati", "vecchia-79.json");
  vero(fs.existsSync(f), "manca " + f + " (node vecchia.js --salva con il motore vecchio)");
  const s = JSON.parse(fs.readFileSync(f, "utf8")); vero(s.gen === undefined, "il file di prova non è di una partita vecchia");
  for (const p of s.players) if (!p.bot) { p.bot = true; p.strat = "Legale"; }
  const fine = s.ciclo + 2, r = gioca(L, B, { seed: 9, stato: s, fermaSe: (x) => x.ciclo >= fine });
  uguale(r.eccezioni, []); vero(s.gen === undefined && !L.gen2(s), "la partita vecchia è diventata di generazione " + s.gen);
  uguale(L.vista(s, "g1").gen, 1, "nella vista la generazione di una partita vecchia deve essere 1");
});
prova("G2", "VERSIONE del motore: c'è, sta nella vista, ed è uguale al ?v= di index.html", () => {
  vero(Number.isInteger(L.VERSIONE) && L.VERSIONE > 0, "manca Laguna.VERSIONE");
  const v = L.vista(G, "g1"); uguale(v.versioneMotore, L.VERSIONE); uguale(v.gen, 2);
  const html = fs.readFileSync(path.join(REPO, "index.html"), "utf8"), m = html.match(/gioco\.js\?v=(\d+)/);
  vero(m && +m[1] === L.VERSIONE, "VERSIONE del motore = " + L.VERSIONE + " ma index.html è a ?v=" + (m && m[1]) + " (li alza insieme pubblica.sh)");
});
