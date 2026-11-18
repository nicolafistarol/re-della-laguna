// node sim.js MOTORE BOT partite cicli
const [,, M, BT, NP, NC] = process.argv;
const L = require(M); globalThis.Laguna = L; const B = require(BT);
const strat = ["Furbo", "Legale", "Costruttore", "Spavaldo", "Esperto", "Investitore"];
let somma = {}, conta = {}, errori = {}, vinc = {}, pats = [], strum = 0, sit = 0, chiusi = 0;
for (let g = 0; g < +NP; g++) {
  const gs = [0, 1, 2, 3].map((i) => ({ nome: "B" + i, bot: true, strat: strat[(g + i) % 6] }));
  const s = L.nuovaPartita({ giocatori: gs, seed: g + 1, cicli: +NC });
  let passi = 0;
  while (!s.fine && passi++ < 60000) {
    let bot = null, a = null;
    for (const p of s.players) { const x = B.prossima(s, p); if (x) { bot = p; a = x; break; } }
    if (!bot) { errori["nessuna mossa " + s.fase] = (errori["nessuna mossa " + s.fase] || 0) + 1; break; }
    if (a.tipo === "compra_oggetto" && L.STRUMENTI && L.STRUMENTI[a.oggetto]) strum++;
    try { L.applica(s, bot.id, a); }
    catch (e) {
      if (!e.utente && !/^[A-Z]/.test(e.message)) { const k = (e.stack || e.message).split("\n").slice(0, 2).join(" | "); errori[k] = (errori[k] || 0) + 1; }
      try {
        if (s.fase === "notte") L.applica(s, bot.id, { tipo: "pronto" });
        else if (s.pending?.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 });
        else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 });
        else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
      } catch (e2) { if (!/^[A-Z]/.test(e2.message)) { const k = "2:" + (e2.stack || "").split("\n").slice(0, 2).join(" | "); errori[k] = (errori[k] || 0) + 1; } }
    }
  }
  if (!s.fine) errori["non finita (passi " + passi + ", ciclo " + s.ciclo + " " + s.fase + ")"] = (errori["non finita (passi " + passi + ", ciclo " + s.ciclo + " " + s.fase + ")"] || 0) + 1;
  sit += (s.sitStoria || []).length;
  for (const p of s.players) for (const k of Object.keys(p)) if (typeof p[k] === "number" && !isFinite(p[k])) errori["NaN " + k] = (errori["NaN " + k] || 0) + 1;
  const pat = s.players.map((p) => L.patrimonio(s, p, true)), w = pat.indexOf(Math.max(...pat));
  s.players.forEach((p, i) => { somma[p.strat] = (somma[p.strat] || 0) + pat[i]; conta[p.strat] = (conta[p.strat] || 0) + 1; });
  vinc[s.players[w].strat] = (vinc[s.players[w].strat] || 0) + 1; pats.push(pat[w]);
}
pats.sort((a, b) => a - b);
console.log("vittorie", vinc, "mediana vincitore", Math.round(pats[pats.length >> 1] / 1e6) + " M", "strumenti comprati", strum, "situazioni", sit);
console.log("media M", Object.fromEntries(Object.keys(somma).map((k) => [k, Math.round(somma[k] / conta[k] / 1e6)])));
console.log("errori", errori);
