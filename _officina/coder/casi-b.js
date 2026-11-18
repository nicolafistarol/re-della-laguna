// =====================================================================
// Prove mirate del Coder B (Tappa 1): notte, polizia, setta. Caricato da casi.js.
// Ogni exploit chiuso ha qui il suo caso: sul motore di prima passava, ora no.
// =====================================================================
const { prova, vero, uguale, rifiutata, accettata, copia, ricco, G, NT, L, B } = require("./casi.js");
const vistaDi = (s, id) => (L.vistaSicura || L.vista)(s, id);
// tutti svegli, liberi, al Livello 3, nello stesso posto
function notte(dove, n) {
  const s = ricco(copia(NT));
  s.sette = []; s.inviti = [];
  for (const p of s.players) { p.livello = 3; p.sette = []; p.settaFondata = null; p.tracce = 0; p.stato = 0; p.peggiorReato = null; p.condanne = 0; p.corrotti = {}; p.valigetta = []; p.prove = []; p.calore = {}; p.calSoldi = 0;
    s.notte.dove[p.id] = dove || "club"; delete s.notte.viaggio[p.id]; delete s.notte.chiuso[p.id]; delete s.notte.pronto[p.id]; delete s.notteFatti[p.id]; }
  if (s.notte.ospite) s.notte.ospite = {};
  s.manoSM = {}; s.notte.proposte = [];
  return s;
}
// una setta di livello 3 con il Gran Maestro al Faro
function conSetta(inf) {
  const s = notte("faro"), gm = s.players[0];
  accettata(s, gm.id, { tipo: "fonda_setta", nome: "Prova", motto: "" });
  const st = s.sette[0]; st.influenza = inf == null ? 40 : inf; st.tesoro = 30_000_000;
  return { s, gm, st };
}
const entra = (s, st, gm, q, offerta) => { accettata(s, gm.id, { tipo: "invita_setta", setta: st.id, invitato: q.id, offerta: offerta || 0 }); accettata(s, q.id, { tipo: "rispondi_invito", setta: st.id, si: true }); };

prova("ILL-01", "Borsa: una sola operazione per setta per notte (prima 6: 10 M diventavano 49 M)", () => {
  const { s, gm, st } = conSetta();
  const p0 = s.borsa.SoleTech, ieri = (s.borsaIeri || s.borsa).SoleTech;
  accettata(s, gm.id, { tipo: "operazione", setta: st.id, op: "manipola", bersaglio: "SoleTech", direzione: "su" });
  vero(s.borsa.SoleTech <= Math.max(p0, ieri * 1.5) + 1e-6, "il titolo ha superato il tetto");
  vero(s.borsa.SoleTech <= p0 * 1.4 + 1e-6, "spinta troppo forte");
  // l'ora dopo: stessa notte, altra operazione -> rifiutata
  delete s.notte.chiuso[gm.id]; delete s.notte.pronto[gm.id];
  const m = rifiutata(s, gm.id, { tipo: "operazione", setta: st.id, op: "manipola", bersaglio: "Corona Bank", direzione: "su" });
  vero(/una sola per notte/.test(m), m);
});
prova("ILL-01", "Borsa: un titolo si muove una volta sola per notte, anche se ci prova un'altra setta", () => {
  const { s, gm, st } = conSetta();
  s.spinte = { ciclo: s.ciclo, titoli: { SoleTech: true } };
  const m = rifiutata(s, gm.id, { tipo: "operazione", setta: st.id, op: "manipola", bersaglio: "SoleTech", direzione: "su" });
  vero(/una volta sola/.test(m), m);
});
prova("ILL-20", "operazione della setta: 5 Tracce al Gran Maestro, 1 agli altri membri", () => {
  const { s, gm, st } = conSetta(), q = s.players[1];
  entra(s, st, gm, q);
  const t0 = q.tracce, g0 = gm.tracce;
  accettata(s, gm.id, { tipo: "operazione", setta: st.id, op: "sabotaggio", bersaglio: "nessuna" === 1 ? "" : (s.sette.push({ id: "sX", nome: "Rivale", motto: "", gm: s.players[2].id, membri: [s.players[2].id], tesoro: 1e6, operazioni: 0, pngReclutati: 0, influenza: 0 }), "sX") });
  vero(Math.abs(q.tracce - t0 - 1) < 1e-6, "il membro ha preso " + (q.tracce - t0) + " Tracce");
  vero(Math.abs(gm.tracce - g0 - 5) < 1e-6, "il Gran Maestro ha preso " + (gm.tracce - g0));
});
prova("ILL-08", "setta nuova: Influenza 0, e versare 40 M nel Tesoro non la fa salire di livello", () => {
  const s = notte("faro"), gm = s.players[0]; gm.sporchi = 60_000_000;
  accettata(s, gm.id, { tipo: "fonda_setta", nome: "Prova", motto: "" });
  const st = s.sette[0];
  uguale(L.influenzaDi(s, st), 0); uguale(L.livelloSetta(s, st), 1);
  accettata(s, gm.id, { tipo: "versa_setta", setta: st.id, importo: 40_000_000, sporchi: true });
  uguale(L.influenzaDi(s, st), 0, "i versamenti hanno dato Influenza"); uguale(L.livelloSetta(s, st), 1);
});
prova("ILL-08", "setta vecchia (senza punti Influenza): il versamento non alza il livello", () => {
  const { s, gm, st } = conSetta(); delete st.influenza; st.tesoro = 2_000_000; st.operazioni = 0;
  const prima = L.influenzaDi(s, st);
  accettata(s, gm.id, { tipo: "versa_setta", setta: st.id, importo: 20_000_000, sporchi: false });
  uguale(L.influenzaDi(s, st), prima);
});
prova("ILL-11", "sporchi versati nel Tesoro o regalati lasciano Tracce (prima zero)", () => {
  const { s, gm, st } = conSetta(), q = s.players[1];
  const t0 = gm.tracce;
  accettata(s, gm.id, { tipo: "versa_setta", setta: st.id, importo: 5_000_000, sporchi: true });
  vero(gm.tracce - t0 >= 9.9, "versare 5 M sporchi ha dato " + (gm.tracce - t0) + " Tracce");
  const t1 = gm.tracce, q0 = q.tracce;
  accettata(s, gm.id, { tipo: "regala", a: q.id, importo: 2_000_000, sporchi: true });
  vero(gm.tracce > t1 + 3 && q.tracce > q0 + 3, "regalare sporchi non ha lasciato Tracce a tutti e due");
});
prova("ILL-09", "traditore: non si tradisce nel Ciclo in cui si entra; chi esce subito restituisce il regalo", () => {
  const { s, gm, st } = conSetta(), q = s.players[1];
  q.sporchi = 1_000_000; q.cash = 2_000_000; q.debito = 0;
  entra(s, st, gm, q, 10_000_000);
  uguale(q.sporchi, 11_000_000);
  const m = rifiutata(s, q.id, { tipo: "tradisci", setta: st.id });
  vero(/almeno un'Alba/.test(m), m);
  const tes = st.tesoro; q.sporchi = 4_000_000; // ne ha gia' spesi 7
  accettata(s, q.id, { tipo: "lascia_setta", setta: st.id });
  uguale(st.tesoro, tes + 10_000_000, "il regalo non e' tornato nel Tesoro");
  uguale(q.sporchi, 0); vero(q.cash === 0 && q.debito === 4_000_000, "il resto doveva venire dai puliti e poi a debito: cash " + q.cash + " debito " + q.debito);
});
prova("ILL-09", "patto: chi e' cacciato entro 2 Cicli riprende la quota; dopo 2 Cicli nessuno restituisce niente", () => {
  const { s, gm, st } = conSetta(), q = s.players[1], r = s.players[2];
  q.sporchi = 5_000_000; const c0 = q.cash;
  entra(s, st, gm, q, -5_000_000);
  uguale(q.sporchi, 0);
  accettata(s, gm.id, { tipo: "espelli_setta", setta: st.id, membro: q.id });
  uguale(q.sporchi, 5_000_000, "la quota non e' tornata"); uguale(q.cash, c0);
  entra(s, st, gm, r, 2_000_000); st.ingressi[r.id].ciclo = s.ciclo - 2;
  const sp = r.sporchi; accettata(s, r.id, { tipo: "lascia_setta", setta: st.id }); uguale(r.sporchi, sp);
  // dopo un'Alba da membro si puo' tradire
  const { s: s2, gm: g2, st: st2 } = conSetta(), t = s2.players[1]; entra(s2, st2, g2, t); st2.ingressi[t.id].ciclo = s2.ciclo - 1;
  accettata(s2, t.id, { tipo: "tradisci", setta: st2.id });
});
prova("ILL-10", "la multa non si evita spendendo i contanti: stessa multa con 20 M in contanti o 20 M nel Palazzo", () => {
  const fai = (inPiani) => { const s = notte("club"), p = s.players[0]; p.cash = inPiani ? 0 : 20_000_000; p.azioni = {}; p.cripto = {}; p.veicoli = []; p.debito = 0; p.sporchi = 0;
    if (inPiani) { let n = 0; while (L.valorePalazzo({ piani: p.piani + n }) - L.valorePalazzo(p) < 20_000_000) n++; p.piani += n; }
    return { p, pena: L.descriviPena(s, p, "grave"), s }; };
  const a = fai(false), b = fai(true);
  vero(b.pena.multa > a.pena.multa * 0.9, "multa con i contanti " + a.pena.multa + ", con i piani " + b.pena.multa);
  vero(b.pena.multa > 1_000_000, "multa troppo bassa: " + b.pena.multa);
});
prova("ILL-12", "Giudice della setta: niente assoluzione a caso, e gli sconti non superano 2 gradini", () => {
  const { s, gm, st } = conSetta(); st.giudice = true; st.attive = { giudice: { dal: 0, fino: null } }; gm.valigetta = [{ id: "avvocato", notti: null }];
  const d = L.descriviPena(s, gm, "gravissima");
  uguale(d.gravita, "media", "setta + Giudice + supremo + avvocato");
  vero(d.note.some((x) => /Più di 2 gradini/.test(x)), "manca la nota sul tetto");
  // 30 condanne vere: mai assolto
  for (let i = 0; i < 30; i++) { const x = copia(s), p = x.players[0]; p.stato = 4; p.peggiorReato = "grave"; p.tracce = 50; x.rngState = 1000 + i;
    x.notte.ora = 5; for (const q of x.players) { x.notteFatti[q.id] = true; } x.notteFatti[p.id] = false; accettata(x, p.id, { tipo: "torna_a_casa" });
    vero(x.fase !== "notte", "la notte non e' finita"); vero(x.players[0].condanne === p.condanne || x.players[0].ultimaSentenza, "nessuna sentenza"); vero(x.players[0].ultimaSentenza && x.players[0].ultimaSentenza.ciclo != null, "assolto a caso (seme " + i + ")"); }
});
prova("ILL-13", "Posto di blocco da Osservato: perquisizione e un gradino, non la condanna", () => {
  vero(typeof L.rischioPostoDiBlocco === "function", "manca rischioPostoDiBlocco");
  const s = ricco(copia(G)), p = L.corrente(s);
  p.stato = 2; p.peggiorReato = "grave"; p.tracce = 40; p.condanne = 0; p.valigetta = []; p.sporchi = 10_000_000; p.stanze = []; p.funzioniPiani = [];
  uguale(L.rischioPostoDiBlocco(s, p), 1);
  // lo metto 2 caselle prima del Ponte Est e provo finche' i dadi danno 2... piu' semplice: chiamo la casella con un tiro truccato
  let fatto = false;
  for (let seme = 1; seme < 400 && !fatto; seme++) { const x = copia(s), q = L.corrente(x); x.rngState = seme; q.pos = 80 - 7; q.inner = false;
    try { L.applica(x, q.id, { tipo: "tira" }); } catch (e) { continue; }
    if (q.pos !== 80) continue; fatto = true;
    uguale(q.condanne, 0, "condannato al Posto di blocco"); uguale(q.stato, 3); vero(q.sporchi < 10_000_000, "nessuna perquisizione"); vero(q.faro === 0, "mandato al Faro"); }
  vero(fatto, "non sono riuscito a far fermare la pedina sul Posto di blocco");
});
prova("NOT-02", "Casinò privato: chi entra e gioca con soldi sporchi non esce con soldi puliti", () => {
  for (let seme = 1; seme <= 40; seme++) {
    const s = notte("palazzo"), host = s.players[0], osp = s.players[1]; s.rngState = seme;
    host.stanze = ["casino_privato"]; host.piani = 8; host.cash = 30_000_000; host.sporchi = 0; osp.cash = 100_000; osp.sporchi = 2_000_000;
    L.apriSerataProva(s, host.id, 500_000);
    s.notte.ospite = { [osp.id]: host.id }; s.notte.serate[host.id].ospiti.push(osp.id);
    const tot0 = host.sporchi + osp.sporchi, pul0 = osp.cash;
    for (let k = 0; k < 5; k++) { delete s.notte.chiuso[osp.id]; delete s.notte.pronto[osp.id]; if (osp.sporchi < 200_000) break;
      accettata(s, osp.id, { tipo: "gioca_serata", importo: 200_000 }); while (s.manoSM[osp.id]) accettata(s, osp.id, { tipo: "sm", mossa: L.vista(s, osp.id).notte.manoSM.totale < 5 ? "carta" : "sto" }); }
    uguale(host.sporchi + osp.sporchi, tot0, "seme " + seme + ": gli sporchi dei due insieme sono cambiati (ripulitura)");
    vero(osp.cash - pul0 <= 5 * 400_000, "vincite troppo alte");
  }
  // l'ingresso pagato con sporchi arriva sporco
  const s = notte("club"), host = s.players[0], osp = s.players[1]; host.stanze = ["casino_privato"]; host.piani = 8; host.sporchi = 0; osp.cash = 0; osp.sporchi = 2_000_000; const hc = host.cash;
  L.apriSerataProva(s, host.id, 500_000); for (const q of s.players) if (q !== osp) s.notteFatti[q.id] = true;
  accettata(s, osp.id, { tipo: "vai_serata", host: host.id }); for (let k = 0; k < 3 && !(s.notte.ospite && s.notte.ospite[osp.id]); k++) accettata(s, osp.id, { tipo: "avanti" });
  vero(s.notte.ospite && s.notte.ospite[osp.id] === host.id, "non e' arrivato alla serata"); uguale(host.sporchi, 500_000, "l'ingresso sporco e' arrivato pulito"); uguale(host.cash, hc);
});
prova("NOT-01", "una proposta non scade se l'altro ha gia' premuto Avanti: l'ora aspetta la risposta", () => {
  const s = notte("club"), a = s.players[0], b = s.players[1];
  for (const q of s.players.slice(2)) s.notteFatti[q.id] = true;
  accettata(s, b.id, { tipo: "aspetta" }); accettata(s, b.id, { tipo: "avanti" });
  const ora = s.notte.ora, f0 = b.fama;
  accettata(s, a.id, { tipo: "incontro", a: b.id, cosa: "drink" }); accettata(s, a.id, { tipo: "avanti" });
  uguale(s.notte.ora, ora, "l'ora si e' chiusa prima della risposta");
  const pr = vistaDi(s, b.id).notte.proposte.find((x) => x.a === b.id && x.stato === "attesa"); vero(pr, "chi ha gia' premuto Avanti non vede la proposta");
  accettata(s, b.id, { tipo: "rispondi_incontro", id: pr.id, si: true });
  uguale(b.fama, f0 + 2); uguale(s.notte.ora, ora + 1, "dopo la risposta l'ora doveva chiudersi");
});
prova("NOT-01", "se l'altro non risponde, la proposta scade dopo 30 secondi e i soldi tornano", () => {
  const s = notte("club"), a = s.players[0], b = s.players[1];
  for (const q of s.players.slice(2)) s.notteFatti[q.id] = true;
  const vecchio = Date.now; let t = 1_900_000_000_000; Date.now = () => t;
  try {
    s.notte.inizio = t; accettata(s, b.id, { tipo: "aspetta" }); accettata(s, b.id, { tipo: "avanti" });
    const tot = a.cash + a.sporchi, ora = s.notte.ora;
    accettata(s, a.id, { tipo: "incontro", a: b.id, cosa: "sfida", importo: 100_000 }); accettata(s, a.id, { tipo: "avanti" });
    uguale(a.cash + a.sporchi, tot - 100_000); vero(!s.manoSM[a.id], "le carte non si danno prima che l'altro accetti");
    rifiutata(s, a.id, { tipo: "tempo_scaduto" });
    t += 31_000; accettata(s, a.id, { tipo: "tempo_scaduto" });
    uguale(s.notte.ora, ora + 1); uguale(a.cash + a.sporchi, tot, "i soldi della sfida non sono tornati");
  } finally { Date.now = vecchio; }
});
prova("PT-08", "Sette e mezzo tra giocatori: prima l'altro accetta, poi giocano tutti e due, alla fine si vedono le carte", () => {
  const s = notte("club"), a = s.players[0], b = s.players[1];
  for (const q of s.players.slice(2)) s.notteFatti[q.id] = true;
  const tot = a.cash + a.sporchi + b.cash + b.sporchi;
  accettata(s, a.id, { tipo: "incontro", a: b.id, cosa: "sfida", importo: 100_000 });
  const pr = s.notte.proposte[0]; uguale(pr.stato, "attesa");
  accettata(s, b.id, { tipo: "rispondi_incontro", id: pr.id, si: true });
  vero(s.manoSM[a.id] && s.manoSM[b.id], "tutti e due devono avere una mano");
  vero(!s.manoSM[a.id].mazzo.some((c) => s.manoSM[b.id].mazzo.includes(c) || s.manoSM[b.id].carte.includes(c)), "i due mucchi hanno carte in comune");
  accettata(s, a.id, { tipo: "sm", mossa: "sto" });
  const jb = JSON.stringify(vistaDi(s, b.id)); vero(!/"manoDa"|"maniSfida"|"mazzo":/.test(jb), "chi sta ancora giocando vede le carte dell'altro");
  uguale(pr.stato, "in_gioco");
  accettata(s, b.id, { tipo: "sm", mossa: "sto" });
  uguale(pr.stato, "finita"); vero(pr.manoDa && pr.manoA, "alla fine le carte si devono vedere");
  uguale(a.cash + a.sporchi + b.cash + b.sporchi, tot, "soldi creati o spariti");
  vero(vistaDi(s, a.id).notte.ultimaMano && vistaDi(s, b.id).notte.ultimaMano, "manca l'esito per tutti e due");
});
