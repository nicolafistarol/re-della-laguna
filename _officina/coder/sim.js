#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — partite di soli bot
//   node sim.js <partite> <cicli> [giocatori=4] [seme=1000] [--breve] [--storie-a-caso]
//   REPO=/percorso/copia node sim.js 30 12
// Stampa: errori ed eccezioni, vittorie per storia e per carattere,
// patrimonio mediano del vincitore. Esce con codice 1 se ci sono eccezioni,
// blocchi o partite che non finiscono.
// Riferimento (STATO.md): 12 Cicli ~100-105 M, 16 Cicli ~440-520 M, 0 errori.
// =====================================================================
const { REPO, carica, gioca, mediana, milioni } = require("./laguna.js");
const impronta = require("crypto").createHash("md5"); // l'esito esatto di tutte le partite: se una modifica non deve cambiare le regole, resta uguale

const partite = Number(process.argv[2]) || 20;
const cicli = Number(process.argv[3]) || 12;
const giocatori = Number(process.argv[4]) || 4; // 4 = come il riferimento di STATO.md
const seme0 = Number(process.argv[5]) || 1000;
const silenzio = process.argv.includes("--breve");
const storieACaso = process.argv.includes("--storie-a-caso"); // separa l'effetto della storia da quello del carattere

const { L, B } = carica();
console.log(`SIM  repo=${REPO}  partite=${partite}  cicli=${cicli}  giocatori=${giocatori}  seme=${seme0}`);

const t0 = Date.now();
const vincitori = [], tutti = [], perStoria = {}, perCarattere = {}, presStoria = {}, presCarattere = {};
const rifiuti = {}, eccezioni = [], blocchi = [];
let passi = 0, arresti = 0, falliti = 0, sette = 0, tempiScaduti = 0;

for (let i = 0; i < partite; i++) {
  const r = gioca(L, B, { seed: seme0 + i, cicli, giocatori, giro: i, storieACaso });
  passi += r.passi; tempiScaduti += r.tempiScaduti || 0;
  for (const e of r.eccezioni) eccezioni.push(e);
  for (const b of r.blocchi) blocchi.push({ ...b, seed: r.seed });
  for (const [k, n] of Object.entries(r.rifiuti)) rifiuti[k] = (rifiuti[k] || 0) + n;
  const s = r.stato;
  if (s) impronta.update(JSON.stringify([r.passi, s.ciclo, s.classifica, s.players.map((p) => [Math.round(p.cash), Math.round(p.sporchi), Math.round(p.debito), Math.round(p.tracce * 100), p.fama, p.piani, p.arresti]), s.lotti.map((l) => [l.owner, l.lvl, l.tipo]), s.sette.map((st) => [st.membri.length, Math.round(st.tesoro)])]));
  if (!s || !s.fine || !s.classifica) continue;
  const primo = s.classifica[0], pv = s.players.find((p) => p.id === primo.id);
  vincitori.push(primo.patrimonio);
  for (const c of s.classifica) tutti.push(c.patrimonio);
  for (const p of s.players) {
    presStoria[p.pacchetto] = (presStoria[p.pacchetto] || 0) + 1;
    presCarattere[p.strat] = (presCarattere[p.strat] || 0) + 1;
    arresti += p.arresti || 0; if (p.fallito) falliti++;
  }
  sette += s.sette.length;
  perStoria[pv.pacchetto] = (perStoria[pv.pacchetto] || 0) + 1;
  perCarattere[pv.strat] = (perCarattere[pv.strat] || 0) + 1;
}

const finite = vincitori.length;
function tabella(titolo, vinte, presenze) {
  console.log("\n" + titolo + " (vittorie / partite giocate):");
  for (const k of Object.keys(presenze).sort((a, b) => (vinte[b] || 0) / presenze[b] - (vinte[a] || 0) / presenze[a]))
    console.log("  " + String(k).padEnd(14) + String(vinte[k] || 0).padStart(4) + " / " + String(presenze[k]).padEnd(4) + "  " + (100 * (vinte[k] || 0) / presenze[k]).toFixed(0).padStart(3) + "%");
}
console.log(`\nPartite finite: ${finite}/${partite}   mosse in tutto: ${passi}   tempo: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (finite) {
  const ord = [...vincitori].sort((a, b) => a - b);
  console.log(`Patrimonio del vincitore: mediana ${milioni(mediana(vincitori))}   (minimo ${milioni(ord[0])}, massimo ${milioni(ord[ord.length - 1])})`);
  console.log(`Patrimonio di tutti: mediana ${milioni(mediana(tutti))}   arresti per partita: ${(arresti / finite).toFixed(1)}   falliti: ${falliti}   sette per partita: ${(sette / finite).toFixed(1)}`);
  if (!silenzio) { tabella("STORIA", perStoria, presStoria); tabella("CARATTERE", perCarattere, presCarattere); }
}
const nRif = Object.values(rifiuti).reduce((a, b) => a + b, 0);
console.log(`\nMosse dei bot rifiutate dal motore: ${nRif}` + (tempiScaduti ? `   ore di notte chiuse dall'orologio: ${tempiScaduti}` : ""));
if (!silenzio) for (const [k, n] of Object.entries(rifiuti).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log("  " + String(n).padStart(5) + "  " + k);
console.log(`\nImpronta delle partite: ${impronta.digest("hex").slice(0, 12)}  (uguale prima e dopo = le regole non sono cambiate)`);
console.log(`ECCEZIONI (errori del codice): ${eccezioni.length}`);
const viste = {};
for (const e of eccezioni) { const k = e.dove + " | " + e.messaggio + " | " + (e.riga || "?"); (viste[k] = viste[k] || { n: 0, e }).n++; }
for (const [k, x] of Object.entries(viste)) console.log(`  x${x.n}  ${k}\n       es.: seme ${x.e.seed}, Ciclo ${x.e.ciclo}, ${x.e.fase}, ${x.e.bot || ""} ${x.e.azione || ""}`);
console.log(`BLOCCHI (partita ferma o che non finisce): ${blocchi.length}`);
for (const b of blocchi.slice(0, 10)) console.log("  " + JSON.stringify(b));

const male = eccezioni.length > 0 || blocchi.length > 0 || finite < partite;
console.log(male ? "\nSIM: NON VA" : "\nSIM: OK");
process.exit(male ? 1 : 0);
