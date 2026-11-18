#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — una partita GIA' INIZIATA gira nel motore nuovo? (regola G1 di DECISIONI.md)
//   node vecchia.js <stato.json> [cicli=3]
//   node vecchia.js --salva <uscita.json> [seme] [ciclo] [giocatori]   salva una partita a meta' (per fare le prove)
// Legge uno stato salvato (es. la colonna "stato" della partita vera, letta in SOLA LETTURA),
// fa giocare i bot al posto di tutti per qualche Ciclo e controlla: nessuna eccezione, nessun
// numero rotto, vista() funziona per tutti e non cambia lo stato. Non scrive da nessuna parte.
// Esce con 1 se qualcosa non va.
// =====================================================================
const fs = require("fs");
const { REPO, carica, gioca } = require("./laguna.js");
const { L, B } = carica();
const arg = process.argv.slice(2);

if (arg[0] === "--salva") {
  const seme = Number(arg[2]) || 77, finoA = Number(arg[3]) || 9, giocatori = Number(arg[4]) || 5;
  const r = gioca(L, B, { seed: seme, giocatori, durata: { modo: "libera" }, giro: seme, fermaSe: (s) => s.ciclo >= finoA && s.fase === "giorno" && s.giorno >= 1 });
  const s = r.stato;
  // come nella partita vera: due persone e il resto bot
  s.players[0].bot = false; s.players[0].strat = null; s.players[1].bot = false; s.players[1].strat = null;
  fs.writeFileSync(arg[1], JSON.stringify(s));
  console.log(`Salvata una partita a metà: ${arg[1]}  (motore di ${REPO}, seme ${seme}, Ciclo ${s.ciclo + 1}, ${s.fase}, ${s.players.length} giocatori, ${s.sette.length} sette, ${r.eccezioni.length} eccezioni)`);
  process.exit(0);
}
if (!arg[0]) { console.error("Uso: node vecchia.js <stato.json> [cicli=3]"); process.exit(2); }
const stato = JSON.parse(fs.readFileSync(arg[0], "utf8"));
const cicli = Number(arg[1]) || 3;
const s0 = stato.stato && stato.players === undefined ? stato.stato : stato; // accetta anche la riga intera del database
console.log(`VECCHIA  repo=${REPO}  file=${arg[0]}  Ciclo ${s0.ciclo + 1}, ${s0.fase}, ${s0.players.length} giocatori, gen ${s0.gen || 1}, motore ${L.VERSIONE || "(senza numero)"}`);
const guai = [];
const numeri = (x, dove, fuori) => { if (typeof x === "number") { if (!Number.isFinite(x)) fuori.push(dove); } else if (x && typeof x === "object") for (const k of Object.keys(x)) numeri(x[k], dove + "." + k, fuori); };
const controlla = (s, quando) => {
  const fuori = []; numeri(s, "s", fuori); if (fuori.length) guai.push(quando + ": numeri rotti in " + fuori.slice(0, 3).join(", "));
  const prima = JSON.stringify(s);
  for (const p of s.players) { try { (L.vistaSicura || L.vista)(s, p.id); } catch (e) { guai.push(quando + ": la vista di " + p.nome + " va in errore: " + e.message); } }
  if (JSON.stringify(s) !== prima) guai.push(quando + ": la vista ha cambiato lo stato");
};
controlla(s0, "appena caricata");
// le persone diventano bot prudenti per la prova (solo in questa copia in memoria)
for (const p of s0.players) if (!p.bot) { p.bot = true; p.strat = "Legale"; }
const fine = s0.ciclo + cicli; let n = 0;
const r = gioca(L, B, { seed: 4242, stato: s0, fermaSe: (s) => s.ciclo >= fine, dopo(s) { if (++n % 25 === 0) controlla(s, "Ciclo " + (s.ciclo + 1) + " " + s.fase); } });
controlla(r.stato, "alla fine");
for (const e of r.eccezioni) guai.push("eccezione: " + e.dove + " " + e.messaggio + " " + (e.riga || "") + " " + (e.azione || ""));
for (const b of r.blocchi) guai.push("la partita si ferma: " + JSON.stringify(b));
console.log(`Giocate ${r.passi} mosse, arrivati al Ciclo ${r.stato.ciclo + 1} (${r.stato.fase})${r.stato.fine ? ", partita finita" : ""}. Mosse rifiutate: ${Object.values(r.rifiuti).reduce((a, b) => a + b, 0)}`);
for (const [k, v] of Object.entries(r.rifiuti).slice(0, 8)) console.log("   " + v + "  " + k);
if (guai.length) { console.log("VECCHIA: NON VA"); for (const g of [...new Set(guai)].slice(0, 20)) console.log("  - " + g); process.exit(1); }
console.log("VECCHIA: OK");
