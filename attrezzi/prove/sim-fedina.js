// node sim-fedina.js MOTORE BOT partite cicli — come sim.js, piu' i conti di Servizi e Fedina (v75)
const [,, M, BT, NP, NC] = process.argv;
const L = require(M); globalThis.Laguna = L; const B = require(BT);
const strat = ["Furbo", "Legale", "Costruttore", "Spavaldo", "Esperto", "Investitore"];
const K = { servizi: {}, togli: 0, esposti: 0, inchieste: 0, pubblicate: 0, opere: 0, fermiTransenna: 0, condTransenna: 0, condanne: 0, fedinaFine: {}, fedinaMax: {} };
let somma = {}, conta = {}, errori = {}, vinc = {}, pats = [];
for (let g = 0; g < +NP; g++) {
  const gs = [0, 1, 2, 3].map((i) => ({ nome: "B" + i, bot: true, strat: strat[(g + i) % 6] }));
  const s = L.nuovaPartita({ giocatori: gs, seed: g + 1, cicli: +NC });
  let passi = 0;
  while (!s.fine && passi++ < 60000) {
    let bot = null, a = null;
    for (const p of s.players) { const x = B.prossima(s, p); if (x) { bot = p; a = x; break; } }
    if (!bot) { errori["nessuna mossa " + s.fase] = (errori["nessuna mossa " + s.fase] || 0) + 1; break; }
    const sent0 = s.players.map((p) => p.ultimaSentenza), pist0 = s.players.map((p) => p.ultimaPista);
    try {
      L.applica(s, bot.id, a);
      if (a.tipo === "servizio") { const k = a.chi + (a.n != null ? "+riserva" : ""); K.servizi[k] = (K.servizi[k] || 0) + 1; }
      for (const t of ["togli_transenna", "esposto", "inchiesta_apri", "inchiesta_pubblica", "opera_pubblica"]) if (a.tipo === t) K[{ togli_transenna: "togli", esposto: "esposti", inchiesta_apri: "inchieste", inchiesta_pubblica: "pubblicate", opera_pubblica: "opere" }[t]]++;
    } catch (e) {
      if (!e.utente && !/^[A-Z]/.test(e.message)) { const k = (e.stack || e.message).split("\n").slice(0, 2).join(" | "); errori[k] = (errori[k] || 0) + 1; }
      try {
        if (s.fase === "notte") L.applica(s, bot.id, { tipo: "pronto" });
        else if (s.pending?.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 });
        else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 });
        else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
      } catch (e2) { if (!/^[A-Z]/.test(e2.message)) { const k = "2:" + (e2.stack || "").split("\n").slice(0, 2).join(" | "); errori[k] = (errori[k] || 0) + 1; } }
    }
    s.players.forEach((p, j) => {
      if (p.ultimaPista !== pist0[j] && p.ultimaPista && p.ultimaPista.k === "transenna") K.fermiTransenna++;
      if (p.ultimaSentenza !== sent0[j] && p.ultimaSentenza) { K.condanne++; if (pist0[j] && pist0[j].k === "transenna" && p.ultimaSentenza.motivo === "processo") K.condTransenna++; }
    });
  }
  if (!s.fine) errori["non finita"] = (errori["non finita"] || 0) + 1;
  for (const p of s.players) for (const k of Object.keys(p)) if (typeof p[k] === "number" && !isFinite(p[k])) errori["NaN " + k] = (errori["NaN " + k] || 0) + 1;
  for (const p of s.players) { K.fedinaFine[p.strat] = (K.fedinaFine[p.strat] || 0) + (p.fedina || 0); K.fedinaMax[p.strat] = Math.max(K.fedinaMax[p.strat] || 0, p.fedina || 0); }
  const pat = s.players.map((p) => L.patrimonio(s, p, true)), w = pat.indexOf(Math.max(...pat));
  s.players.forEach((p, i) => { somma[p.strat] = (somma[p.strat] || 0) + pat[i]; conta[p.strat] = (conta[p.strat] || 0) + 1; });
  vinc[s.players[w].strat] = (vinc[s.players[w].strat] || 0) + 1; pats.push(pat[w]);
}
pats.sort((a, b) => a - b);
for (const k of Object.keys(K.fedinaFine)) K.fedinaFine[k] = +(K.fedinaFine[k] / conta[k]).toFixed(1);
console.log("vittorie", JSON.stringify(vinc), "mediana vincitore", Math.round(pats[pats.length >> 1] / 1e6) + " M");
console.log("media M", JSON.stringify(Object.fromEntries(Object.keys(somma).map((k) => [k, Math.round(somma[k] / conta[k] / 1e6)]))));
console.log("errori", JSON.stringify(errori));
console.log("v75", JSON.stringify(K));
