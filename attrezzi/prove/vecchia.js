// partita giocata col motore vecchio, poi continuata col nuovo
const [,, MV, BV, MN, BN] = process.argv;
function gioca(L, B, s, finoCiclo) {
  let passi = 0, err = {};
  while (!s.fine && s.ciclo < finoCiclo && passi++ < 80000) {
    let bot = null, a = null;
    for (const p of s.players) { const x = B.prossima(s, p); if (x) { bot = p; a = x; break; } }
    if (!bot) break;
    try { L.applica(s, bot.id, a); } catch (e) {
      if (!/^[A-Z]/.test(e.message)) err[(e.stack || "").split("\n").slice(0, 2).join("|")] = 1;
      try { if (s.fase === "notte") L.applica(s, bot.id, { tipo: "pronto" }); else if (s.pending?.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 }); else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 }); else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); } catch (e2) { }
    }
  }
  return err;
}
let tot = {};
for (let g = 0; g < 10; g++) {
  let Lv = require(MV); globalThis.Laguna = Lv; let Bv = require(BV);
  const strat = ["Furbo", "Legale", "Spavaldo", "Esperto"];
  const s = Lv.nuovaPartita({ giocatori: strat.map((x, i) => ({ nome: "B" + i, bot: true, strat: x })), seed: 77 + g, cicli: 20 });
  gioca(Lv, Bv, s, 13);
  const json = JSON.stringify(s);
  delete require.cache[require.resolve(MV)]; delete require.cache[require.resolve(BV)];
  const Ln = require(MN); globalThis.Laguna = Ln; const Bn = require(BN);
  const s2 = JSON.parse(json);
  for (const p of s2.players) Ln.vista(s2, p.id);
  Object.assign(tot, gioca(Ln, Bn, s2, 99));
  console.log("partita", g, "ciclo arrivo", s2.ciclo, "fine", !!s2.fine, "situazioni", (s2.sitStoria || []).length);
  delete require.cache[require.resolve(MN)]; delete require.cache[require.resolve(BN)];
}
console.log("errori", tot);
