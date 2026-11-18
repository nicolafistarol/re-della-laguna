// Prova dei Servizi dei contatti (dinamica 3) e della Fedina pulita (dinamica 4).
// node /home/claude/prove/casi-fedina.js [motore.js]
// 4 persone, nessun bot. Usa ogni Servizio (transenna, retata, conto, carico) e ogni potere della Fedina
// (esposto, inchiesta con indizi e pubblicazione, opera pubblica), la contromossa del Sindaco, i casi limite,
// e controlla che la vista di un terzo giocatore non contenga i segreti.
const L = require(process.argv[2] || "/home/claude/re-della-laguna/motore.js");
let ok = 0, ko = 0;
function prova(nome, cond, extra) { if (cond) { ok++; console.log("  ok  " + nome); } else { ko++; console.log("  NO  " + nome + (extra !== undefined ? " -> " + JSON.stringify(extra) : "")); } }
function errore(nome, f, testo) { try { f(); ko++; console.log("  NO  " + nome + " (nessun errore)"); } catch (e) { const ok2 = !testo || e.message.includes(testo); if (ok2) { ok++; console.log("  ok  " + nome + ": \"" + e.message + "\""); } else { ko++; console.log("  NO  " + nome + ": \"" + e.message + "\""); } } }
const ap = (s, id, a) => L.applica(s, id, a);

const s = L.nuovaPartita({ giocatori: [{ nome: "Anna" }, { nome: "Bruno" }, { nome: "Carla" }, { nome: "Dario" }], seed: 11, cicli: 12, consigli: false });
while (s.fase === "pacchetti") { const p = s.players[s.sceltaPacchetti[0]]; ap(s, p.id, { tipo: "pacchetto", id: s.pacchettiDisponibili[0] }); }
const [A, B, C, D] = s.players;
for (const p of s.players) { p.cash = 20_000_000; p.livello = 2; p.evasione = 0; }
const ultimoMsg = (p) => (p.messaggi[p.messaggi.length - 1] || {}).testo || "";
const haMsg = (p, testo) => p.messaggi.some((m) => m.testo.includes(testo));
const gazz = (testo) => s.gazzetta.some((g) => g.testo.includes(testo));
const lotto = (idx) => s.lotti.find((l) => l.giro === "o" && l.idx === idx);
function turnoDi(p) { s.turno = s.ordine.indexOf(s.players.indexOf(p)); s.pending = null; p.haTirato = false; p.doppi = 0; }
function sbriga() { // chiude le scelte in sospeso (compra, asta, municipio...)
  for (let k = 0; k < 20; k++) {
    const pd = s.pending; if (!pd) return;
    if (pd.tipo === "asta") { for (const id of pd.partecipanti) if (s.pending && s.pending.offerte[id] === undefined) ap(s, id, { tipo: "offerta", importo: 0 }); continue; }
    const g = pd.giocatore; ap(s, g, pd.tipo === "compra" ? { tipo: "compra", si: false } : pd.tipo === "municipio" ? { tipo: "municipio", scelta: "nulla" } : pd.tipo === "chiamata" ? { tipo: "chiamata", si: false } : { tipo: pd.tipo, importo: 0 });
  }
}
function prossimo() { const p = L.corrente(s); sbriga(); if (!p.haTirato) { ap(s, p.id, { tipo: "tira" }); sbriga(); } if (s.fase === "giorno" && L.corrente(s).id === p.id) { sbriga(); if (!L.corrente(s).haTirato) ap(s, p.id, { tipo: "tira" }); sbriga(); ap(s, p.id, { tipo: "fine_turno" }); } }
function finoAllaNotte() { for (let k = 0; k < 400 && s.fase === "giorno"; k++) prossimo(); }
function finoAlba(prima) {
  for (let k = 0; k < 300 && s.fase === "notte"; k++) {
    const N2 = s.notte, p = s.players.find((x) => !s.notteFatti[x.id] && !(x.faro > 0) && !N2.pronto[x.id]);
    if (!p) break;
    if (N2.chiuso[p.id] || N2.viaggio[p.id]) { ap(s, p.id, { tipo: "avanti" }); continue; }
    if (prima && !prima.fatto) { prima.fatto = true; prima(); }
    ap(s, p.id, { tipo: "torna_a_casa" });
  }
}
// porta p esattamente sulla casella idx con un tiro vero (prova il tiro su una copia, poi sposta la pedina prima)
function atterraSu(p, idx) {
  for (let k = 0; k < 30; k++) {
    const c = JSON.parse(JSON.stringify(s)), q = c.players.find((x) => x.id === p.id);
    q.pos = 0; try { L.applica(c, p.id, { tipo: "tira" }); } catch (e) { return false; }
    const d = q.dadi; if (d && !(d[0] === d[1] && d[1] === d[2])) { const n = d[0] + d[1] + d[2]; p.pos = (idx - n + L.CASELLE) % L.CASELLE; ap(s, p.id, { tipo: "tira" }); return p.pos === idx; }
    s.rngState = (s.rngState + 7) >>> 0; // tris: si cambia tiro
  }
  return false;
}

console.log("1. I Servizi: controlli");
s.ciclo = 2; s.blackout = null; s.sindaco = C.id;
A.corrotti = { agente_Sole: { dal: 0 }, commissario: { dal: 0 }, banchiere: { dal: 1 }, doganiere: { dal: 1 } };
D.corrotti = { agente_Ambra: { dal: 2 }, commissario: { dal: 1 } };
B.corrotti = { banchiere: { dal: 0, sospetto: 2 } };
turnoDi(B);
errore("Servizio senza il contatto", () => ap(s, B.id, { tipo: "servizio", chi: "commissario", luogo: "porto" }), "Non hai questo contatto.");
errore("Contatto sotto inchiesta", () => ap(s, B.id, { tipo: "servizio", chi: "banchiere", bersaglio: A.id }), "È sotto inchiesta: non risponde al telefono.");
turnoDi(D);
errore("Agente comprato da poco", () => ap(s, D.id, { tipo: "servizio", chi: "agente", isola: "Ambra", pos: s.lotti.find((l) => l.isola === "Ambra" && l.tipoCasella === "lotto").idx }), "L'agente non si fida ancora");
turnoDi(A);
errore("Transenna fuori dal turno", () => ap(s, B.id, { tipo: "servizio", chi: "agente", isola: "Sole", pos: 1 }), "Non hai questo contatto");
const viaSole = s.lotti.filter((l) => l.giro === "o" && l.tipoCasella === "lotto" && l.isola === "Sole" && !s.players.some((q) => q.pos === l.idx));
errore("Transenna su una casella di un'altra isola", () => ap(s, A.id, { tipo: "servizio", chi: "agente", isola: "Sole", pos: s.lotti.find((l) => l.isola === "Ambra" && l.tipoCasella === "lotto").idx }), "Scegli una via di Distretto Sole");
B.pos = viaSole[1].idx;
errore("Transenna dove c'e' una pedina", () => ap(s, A.id, { tipo: "servizio", chi: "agente", isola: "Sole", pos: viaSole[1].idx }), "c'è una pedina");
B.pos = 0;
errore("Doganiere di giorno", () => ap(s, A.id, { tipo: "servizio", chi: "doganiere" }), "solo di notte");

console.log("2. La transenna (agente)");
const tr0 = A.tracce, rc0 = L.rischioContatto(s, A, "agente_Sole");
const posT = viaSole[0].idx;
ap(s, A.id, { tipo: "servizio", chi: "agente", isola: "Sole", pos: posT });
prova("s.transenna messa, di A", s.transenna && s.transenna.pos === posT && s.transenna.da === A.id);
prova("Notizia pubblica della transenna", gazz("Posto di blocco a sorpresa in " + lotto(posT).nome));
prova("+3 Tracce e la macchia", Math.round(A.tracce - tr0) === 3 && A.macchia === true);
prova("Il Servizio conta (servizioCiclo, servizi)", A.corrotti.agente_Sole.servizioCiclo === s.ciclo && A.corrotti.agente_Sole.servizi === 1);
prova("Il rischio del contatto sale di 0,03 (a pari Tracce)", Math.abs(L.rischioContatto(s, { ...A, tracce: tr0 }, "agente_Sole") - rc0 - 0.03) < 1e-9, [rc0, L.rischioContatto(s, { ...A, tracce: tr0 }, "agente_Sole")]);
errore("Secondo Servizio dello stesso contatto", () => ap(s, A.id, { tipo: "servizio", chi: "agente", isola: "Sole", pos: viaSole[2].idx }), "Questo Ciclo ti ha già fatto un Servizio.");
D.corrotti.agente_Ambra.dal = 0; turnoDi(D);
errore("Una transenna per Ciclo in tutta la Laguna", () => ap(s, D.id, { tipo: "servizio", chi: "agente", isola: "Ambra", pos: s.lotti.find((l) => l.isola === "Ambra" && l.tipoCasella === "lotto" && !s.players.some((q) => q.pos === l.idx)).idx }), "In questo Ciclo c'è già stata una transenna.");

console.log("3. La retata (Vargas) e il conto (Lenz)");
turnoDi(A);
ap(s, A.id, { tipo: "servizio", chi: "commissario", luogo: "porto" });
prova("ordineVargas di A al Porto", s.ordineVargas && s.ordineVargas.luogo === "porto" && s.ordineVargas.da === A.id);
prova("+4 Tracce del Servizio di Vargas segnate", (A.storiaTracce || []).some((x) => x.cosa === "un Servizio di il Commissario Vargas" && x.quanto === 4));
turnoDi(D);
errore("Vargas ha già altri ordini", () => ap(s, D.id, { tipo: "servizio", chi: "commissario", luogo: "bisca" }), "Stanotte Vargas ha già altri ordini.");
errore("Retata al Palazzo", () => ap(s, D.id, { tipo: "servizio", chi: "commissario", luogo: "palazzo" }), "posto della notte");
B.cash = 7_400_000; B.sporchi = 2_600_000;
const msgB = B.messaggi.length;
ap(s, A.id, { tipo: "servizio", chi: "banchiere", bersaglio: B.id }); // giorno, anche fuori dal suo turno
prova("Lenz: contiVisti di B", A.contiVisti && A.contiVisti[B.id] && A.contiVisti[B.id].puliti === 7 && A.contiVisti[B.id].sporchi === 3, A.contiVisti);
prova("Lenz: messaggio privato ad A", ultimoMsg(A).startsWith("Lenz: «Bruno ha circa 7 milioni puliti e circa 3 milioni sporchi."));
prova("Chi è spiato non lo sa", B.messaggi.length === msgB);
errore("Lenz su sé stessi", () => { A.corrotti.banchiere.servizioCiclo = null; try { ap(s, A.id, { tipo: "servizio", chi: "banchiere", bersaglio: A.id }); } finally { A.corrotti.banchiere.servizioCiclo = s.ciclo; } }, "Scegli un rivale.");
prova("Umore dei contatti nella vista di A", (() => { const v = L.vista(s, A.id).players.find((x) => x.id === A.id); return v.umoreContatti && v.umoreContatti.agente_Sole && ["tranquillo", "teso", "nervoso"].includes(v.umoreContatti.commissario); })());
prova("Umore: sotto inchiesta", L.vista(s, B.id).players.find((x) => x.id === B.id).umoreContatti.banchiere === "inchiesta");

console.log("4. La Fedina: esposto e inchiesta nello stesso Ciclo");
C.fedina = 4; D.fedina = 1;
B.tracce = 60; B.stato = 2; B.storiaTracce = [{ cosa: "il container dimenticato", quanto: 20, ciclo: s.ciclo }]; B.calore = { porto: 2 };
turnoDi(D);
errore("Esposto senza Fedina 2", () => ap(s, D.id, { tipo: "esposto", luogo: "club" }), "Ti serve Fedina pulita 2.");
turnoDi(C);
errore("Esposto sul Palazzo", () => ap(s, C.id, { tipo: "esposto", luogo: "palazzo" }), "posto della notte");
errore("Esposto sul Faro", () => ap(s, C.id, { tipo: "esposto", luogo: "faro" }), "posto della notte");
ap(s, C.id, { tipo: "esposto", luogo: "club" });
prova("s.esposto di C al Club", s.esposto && s.esposto.luogo === "club" && s.esposto.da === C.id);
prova("Notizia dell'esposto senza posto né nome", gazz("Un cittadino ha segnalato movimenti sospetti.") && !s.gazzetta.slice(-1)[0].testo.includes("Club"));
D.fedina = 2; turnoDi(D);
errore("Un esposto per notte", () => ap(s, D.id, { tipo: "esposto", luogo: "bisca" }), "La polizia ha già una segnalazione per stanotte.");
turnoDi(C);
errore("Un esposto a testa per Ciclo", () => { const e = s.esposto; s.esposto = null; try { ap(s, C.id, { tipo: "esposto", luogo: "bisca" }); } finally { s.esposto = e; } }, "In questo Ciclo hai già firmato un esposto.");
errore("Inchiesta su sé stessi", () => ap(s, C.id, { tipo: "inchiesta_apri", bersaglio: C.id }), "Scegli un rivale.");
ap(s, C.id, { tipo: "inchiesta_apri", bersaglio: B.id });
prova("Fascicolo di C su B", C.fascicolo && C.fascicolo.su === B.id && C.fascicolo.albe === 0);
prova("B sa che qualcuno indaga, senza nome", ultimoMsg(B) === "Vera: «Qualcuno fa domande su di te in Procura. Non so chi.»" && B.sottoInchiesta === s.ciclo);
errore("Un fascicolo alla volta", () => ap(s, C.id, { tipo: "inchiesta_apri", bersaglio: A.id }), "Hai già un fascicolo aperto");
D.fedina = 4; turnoDi(D);
s.favori = s.favori || []; s.favori.push({ id: "fz", deve: D.id, a: B.id, tipo: "silenzio", origine: "patto", nato: s.ciclo, scade: s.ciclo + 4, stato: "attivo", uso: { fino: s.ciclo + 1 } });
errore("Il Silenzio blocca inchiesta_apri sul creditore", () => ap(s, D.id, { tipo: "inchiesta_apri", bersaglio: B.id }), "Hai promesso il Silenzio a Bruno");

console.log("5. La vista di un terzo giocatore (Dario)");
{
  const prima = JSON.stringify(s);
  const v = L.vista(s, D.id), vA = L.vista(s, A.id), vC = L.vista(s, C.id), vB = L.vista(s, B.id);
  prova("vista() non cambia lo stato", JSON.stringify(s) === prima);
  prova("Transenna: Dario vede pos e isola", v.transenna && v.transenna.pos === posT && v.transenna.isola === "Sole");
  prova("Transenna: Dario NON vede chi l'ha messa", v.transenna && !("da" in v.transenna));
  prova("Transenna: Anna sa che è sua", vA.transenna && vA.transenna.da === A.id);
  prova("ordineVargas: Dario non lo vede", !("ordineVargas" in v));
  prova("ordineVargas: Bruno (che finirà nella retata) non lo vede", !("ordineVargas" in vB));
  prova("ordineVargas: Anna lo vede", vA.ordineVargas && vA.ordineVargas.luogo === "porto");
  prova("Esposto: Dario sa solo che c'è", v.esposto && Object.keys(v.esposto).join() === "ciclo");
  prova("Esposto: Carla vede posto e firma", vC.esposto && vC.esposto.luogo === "club" && vC.esposto.da === C.id);
  const vc = v.players.find((x) => x.id === C.id), vb = v.players.find((x) => x.id === B.id), va = v.players.find((x) => x.id === A.id);
  prova("Fascicolo degli altri: mai nella vista", !("fascicolo" in vc) && !JSON.stringify(v).includes("\"fascicolo\""));
  prova("sottoInchiesta, contiVisti, macchia, espostoCiclo degli altri: segreti", !("sottoInchiesta" in vb) && !("contiVisti" in va) && !("macchia" in va) && !("espostoCiclo" in vc) && !("corrotti" in va));
  prova("Fedina degli altri: segreta (v81)", vc.fedina === undefined);
  prova("Carla vede il suo fascicolo", vC.players.find((x) => x.id === C.id).fascicolo.su === B.id);
}

console.log("6. Si cade nella transenna, il Sindaco la toglie");
turnoDi(B);
const st0 = B.stato;
prova("Bruno arriva sulla transenna con un tiro vero", atterraSu(B, posT), B.pos);
prova("Bruno (Osservato) viene fermato: un gradino in più", B.stato === st0 + 1 && B.ultimaPista && B.ultimaPista.k === "transenna", [B.stato, B.ultimaPista]);
prova("L'agente si è esposto (servizi +1)", A.corrotti.agente_Sole.servizi === 2);
prova("Cronaca: si ferma alla transenna", s.log.some((r) => r.testo === "Bruno si ferma alla transenna di " + lotto(posT).nome + "."));
sbriga(); if (L.corrente(s).id === B.id) { if (!B.haTirato) { ap(s, B.id, { tipo: "tira" }); sbriga(); } ap(s, B.id, { tipo: "fine_turno" }); }
turnoDi(D);
errore("Solo il Sindaco toglie la transenna", () => ap(s, D.id, { tipo: "togli_transenna" }), "Solo il Sindaco");
turnoDi(C);
ap(s, C.id, { tipo: "togli_transenna" });
prova("Il Sindaco l'ha tolta, notizia", !s.transenna && gazz("Il Sindaco fa togliere la transenna di " + lotto(posT).nome));
errore("Nessuna transenna da togliere", () => ap(s, C.id, { tipo: "togli_transenna" }), "Non c'è nessuna transenna.");

console.log("7. La transenna dura fino al prossimo turno di chi l'ha messa");
s.transennaCiclo = -1; A.corrotti.agente_Sole.servizioCiclo = null; s.giorno = 0;
turnoDi(A);
const libera = s.lotti.find((l) => l.giro === "o" && l.tipoCasella === "lotto" && l.isola === "Sole" && !s.players.some((q) => q.pos === l.idx));
ap(s, A.id, { tipo: "servizio", chi: "agente", isola: "Sole", pos: libera.idx });
prova("Transenna rimessa", s.transenna && s.transenna.pos === libera.idx);
for (let k = 0; k < 3; k++) prossimo(); // il turno di Anna e di altri due
prova("Durante il giro degli altri resta", !!s.transenna);
for (let k = 0; k < 8 && L.corrente(s).id !== A.id; k++) prossimo();
prova("Al prossimo turno di Anna sparisce", L.corrente(s).id === A.id && !s.transenna);

console.log("8. La notte: retata, esposto, doganiere");
finoAllaNotte();
prova("È notte", s.fase === "notte");
prova("Vargas: il Porto è pericoloso", s.notte.pericolo.porto === "pericoloso");
prova("Esposto: il Club è pericoloso", s.notte.pericolo.club === "pericoloso");
s.notte.occasioni.push({ n: 901, id: "container", luogo: "porto", dalle: 0, alle: 6, preso: null, riservata: null });
s.notte.occasioni.push({ n: 902, id: "orologi", luogo: "porto", dalle: 1, alle: 5, preso: null, riservata: D.id });
ap(s, A.id, { tipo: "servizio", chi: "doganiere" });
prova("Doganiere: la lista dei carichi", A.arrivi && A.arrivi.ciclo === s.ciclo && A.arrivi.lista.some((x) => x.n === 901), A.arrivi);
prova("Doganiere: niente carichi riservati ad altri", !A.arrivi.lista.some((x) => x.n === 902));
prova("Doganiere: messaggio", ultimoMsg(A).startsWith("Il doganiere: «Stanotte arrivano:"));
errore("Riservare un carico fuori lista", () => ap(s, A.id, { tipo: "servizio", chi: "doganiere", n: 902 }), "non era nella lista");
ap(s, A.id, { tipo: "servizio", chi: "doganiere", n: 901 });
prova("Doganiere: carico riservato ad Anna", s.notte.occasioni.find((o) => o.n === 901).riservata === A.id && A.arrivi.riservato === 901);
errore("Un solo carico per Ciclo", () => ap(s, A.id, { tipo: "servizio", chi: "doganiere", n: (A.arrivi.lista.find((x) => x.n !== 901) || { n: 901 }).n }), "già tenuto da parte");
errore("Il doganiere non fa due Servizi", () => ap(s, A.id, { tipo: "servizio", chi: "doganiere" }), "Questo Ciclo ti ha già fatto un Servizio.");
prova("Vista di Dario: niente arrivi di Anna", !("arrivi" in L.vista(s, D.id).players.find((x) => x.id === A.id)));
prova("Lenz anche di notte", (() => { A.corrotti.banchiere.servizioCiclo = null; ap(s, A.id, { tipo: "servizio", chi: "banchiere", bersaglio: D.id }); return A.contiVisti[D.id].ciclo === s.ciclo; })());
const famaC0 = C.fama, ciclo0 = s.ciclo;
D.macchia = true; D.fedina = 4; D.fascicolo = { su: A.id, aperto: s.ciclo, albe: 0, indizi: [] }; // Dario si sporca con un fascicolo aperto
finoAlba(() => { B.luoghiNotte = { club: true }; }); // Bruno fa affari al Club, dove c'e' l'esposto

console.log("9. L'Alba");
prova("È un Ciclo nuovo", s.ciclo === ciclo0 + 1 && s.fase === "giorno");
prova("Esposto a segno: Carla +4 fama", haMsg(C, "Il tuo esposto ha colto nel segno: stanotte a Club Neon c'era chi faceva affari (1 persona).") && gazz("I controlli di stanotte a Club Neon hanno dato frutti."));
prova("Esposto chiuso", !s.esposto);
prova("ordineVargas chiuso", !s.ordineVargas);
prova("Fedina: Carla pulita sale a 5", C.fedina === 5, C.fedina);
prova("Fedina: Anna (contatti) resta a 0", A.fedina === 0);
prova("Macchia: torna falsa all'Alba per tutti", s.players.every((p) => p.macchia === false));
prova("Fedina: Dario si è sporcato e torna a 0", D.fedina === 0 && haMsg(D, "Vera: «La tua Fedina pulita è andata. Si ricomincia da zero.»"));
prova("Fedina sotto 4: Dario ritira le accuse", !D.fascicolo && gazz("Dario ritira le accuse contro Anna: non è più credibile."));
prova("Fascicolo: primo indizio", C.fascicolo && C.fascicolo.albe === 1 && C.fascicolo.indizi.length === 1 && haMsg(C, "Fascicolo su Bruno: nuovo indizio."), C.fascicolo);

console.log("10. Secondo indizio e pubblicazione");
const fam0 = s.players.map((p) => p.fama);
finoAllaNotte(); B.calore = { porto: 2, bisca: 1 }; B.tracce = Math.max(B.tracce, 40); finoAlba();
prova("Fascicolo: secondo indizio, diverso dal primo", C.fascicolo && C.fascicolo.indizi.length === 2 && C.fascicolo.indizi[0].k + C.fascicolo.indizi[0].luogo !== C.fascicolo.indizi[1].k + C.fascicolo.indizi[1].luogo, C.fascicolo);
prova("Gli indizi sono in terza persona", C.fascicolo.indizi.every((x) => x.testo.includes("Bruno")));
prova("Fedina di Carla a 6: il messaggio dell'Opera", C.fedina === 6 && haMsg(C, "6 Cicli puliti"));
turnoDi(C);
const bF = B.fama, bT = B.tracce, bS = B.stato, cF = C.fama, ind = C.fascicolo.indizi.map((x) => x.testo);
ap(s, C.id, { tipo: "inchiesta_pubblica" });
prova("Pubblica (2 indizi): Bruno −15 fama, +25 Tracce", B.fama === Math.max(0, bF - 15) && Math.round(B.tracce - bT) === 25);
prova("Pubblica: la polizia sale di un gradino, mai oltre 3", B.stato === Math.min(3, Math.max(bS, bS + 1)) && B.stato <= 3, [bS, B.stato]);
prova("Pubblica: Carla +6 fama", C.fama === cF + 6);
prova("Pubblica: notizia firmata con i due indizi", gazz("INCHIESTA di Carla su Bruno. " + ind[0] + " " + ind[1]));
prova("Pubblica: fascicolo chiuso", !C.fascicolo && C.inchiestaBlocco[B.id] === s.ciclo + 3);
errore("Su di lui hai già indagato da poco", () => ap(s, C.id, { tipo: "inchiesta_apri", bersaglio: B.id }), "Su di lui hai già indagato da poco.");
errore("Pubblicare senza indizi", () => ap(s, C.id, { tipo: "inchiesta_pubblica" }), "almeno un indizio");
prova("Con 1 indizio: −6 fama, +10 Tracce, +2 a chi pubblica", JSON.stringify(L.effettoInchiesta(1)) === JSON.stringify({ fama: 6, tracce: 10, stato: 0, mia: 2 }));

console.log("11. L'Opera pubblica");
turnoDi(D);
errore("Opera senza Fedina 6", () => ap(s, D.id, { tipo: "opera_pubblica", isola: "Sole", opera: "teatro" }), "Ti serve Fedina pulita 6.");
turnoDi(C);
errore("Opera sconosciuta", () => ap(s, C.id, { tipo: "opera_pubblica", isola: "Sole", opera: "stadio" }), "teatro, parco o scuola");
const cash0 = C.cash, val0 = s.valore.Sole, fC = C.fama;
ap(s, C.id, { tipo: "opera_pubblica", isola: "Sole", opera: "teatro" });
prova("Opera: −3.000.000 € puliti", cash0 - C.cash === 3_000_000);
prova("Opera: pagamento pubblico", s.flussi.some((f) => f.pubblico && f.da === C.id && f.importo === 3_000_000));
prova("Opera: l'isola vale +1, Carla +8 fama", Math.abs(s.valore.Sole - Math.min(10, val0 + 1)) < 1e-9 && C.fama === fC + 8 && C.operaFatta === true);
prova("Opera: notizia", gazz("Carla dona alla città il Teatro di Distretto Sole. L'isola vale di più per tutti."));
errore("Una sola opera a testa", () => ap(s, C.id, { tipo: "opera_pubblica", isola: "Palma", opera: "parco" }), "una sola a partita");
D.fedina = 6; turnoDi(D);
errore("Una sola opera per isola", () => ap(s, D.id, { tipo: "opera_pubblica", isola: "Sole", opera: "parco" }), "Qui c'è già il Teatro di Carla.");
prova("Le opere sono pubbliche (vista di Bruno)", L.vista(s, B.id).opere.length === 1 && L.vista(s, B.id).opere[0].nome === "Carla");

console.log("12. Archiviazione e condanna");
D.fedina = 4; D.macchia = false; D.corrotti = {}; D.fascicolo = { su: A.id, aperto: s.ciclo - 3, albe: 3, indizi: [] };
C.stato = 4; C.peggiorReato = "lieve";
finoAllaNotte(); finoAlba();
prova("Fascicolo dopo 4 Albe: archiviato", !D.fascicolo && D.inchiestaBlocco[A.id] === s.ciclo + 1 && haMsg(D, "archiviato"));
prova("Condanna: Fedina a 0", C.condanne >= 1 && C.fedina === 0);
prova("Condanna: l'opera resta, la targa no", s.opere.length === 1 && s.opere[0].di === null && s.opere[0].nome === null && gazz("Tolta la targa dal Teatro di Distretto Sole."));

console.log("13. Esposto a vuoto");
D.fedina = 3; turnoDi(D);
ap(s, D.id, { tipo: "esposto", luogo: "bisca" });
const fD = D.fama;
finoAllaNotte(); finoAlba();
prova("Esposto a vuoto: messaggio e un Ciclo di stop", haMsg(D, "Esposto a vuoto: a Bisca del Vicolo stanotte non c'era nessuno.") && D.espostoStop === s.ciclo);
prova("Notizia dell'allarme inutile", gazz("Controlli a vuoto stanotte a Bisca del Vicolo. Allarme inutile."));
turnoDi(D);
errore("Dopo l'allarme inutile", () => ap(s, D.id, { tipo: "esposto", luogo: "club" }), "Dopo l'allarme inutile, la polizia per ora non ti ascolta.");

console.log("14. L'avviso prima delle mosse sporche");
prova("macchiaAzione: corrompere macchia", L.macchiaAzione(s, A.id, { tipo: "corrompi", chi: "agente", isola: "Sole" }) === true);
prova("macchiaAzione: un Servizio macchia", L.macchiaAzione(s, A.id, { tipo: "servizio", chi: "banchiere" }) === true);
prova("macchiaAzione: tirare i dadi no", L.macchiaAzione(s, A.id, { tipo: "tira" }) === false);
prova("macchiaAzione: regalo pulito no, sporco sì", !L.macchiaAzione(s, A.id, { tipo: "regala", sporchi: false }) && L.macchiaAzione(s, A.id, { tipo: "regala", sporchi: true }));

console.log("15. Una partita vecchia, senza i campi nuovi");
{
  const v = JSON.parse(JSON.stringify(s));
  for (const k of ["transenna", "transennaCiclo", "ordineVargas", "esposto", "opere"]) delete v[k];
  for (const p of v.players) for (const k of ["fedina", "macchia", "fascicolo", "inchiestaBlocco", "espostoStop", "espostoCiclo", "contiVisti", "arrivi", "sottoInchiesta", "operaFatta", "presentati", "togliCiclo"]) delete p[k];
  for (const p of v.players) for (const c of Object.values(p.corrotti || {})) { delete c.servizi; delete c.servizioCiclo; }
  let rotto = null;
  try {
    for (let k = 0; k < 600 && v.fase === "giorno"; k++) { const p = L.corrente(v), pd = v.pending;
      if (pd && pd.tipo === "asta") { for (const id of pd.partecipanti) if (v.pending && v.pending.offerte[id] === undefined) L.applica(v, id, { tipo: "offerta", importo: 0 }); continue; }
      if (pd && pd.giocatore) { L.applica(v, pd.giocatore, pd.tipo === "compra" ? { tipo: "compra", si: false } : pd.tipo === "municipio" ? { tipo: "municipio", scelta: "nulla" } : pd.tipo === "chiamata" ? { tipo: "chiamata", si: false } : { tipo: pd.tipo, importo: 0 }); continue; }
      L.applica(v, p.id, p.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); }
    for (let k = 0; k < 300 && v.fase === "notte"; k++) { const p = v.players.find((x) => !v.notteFatti[x.id] && !(x.faro > 0)); if (!p) break; L.applica(v, p.id, v.notte.chiuso[p.id] || v.notte.viaggio[p.id] ? { tipo: "avanti" } : { tipo: "torna_a_casa" }); }
    L.vista(v, v.players[0].id);
  } catch (e) { rotto = e.stack; }
  prova("Gioca un Ciclo intero e arriva all'Alba senza errori", !rotto && v.fase === "giorno", rotto);
  prova("La Fedina nasce da sola (0 o 1)", v.players.every((p) => typeof p.fedina === "number"));
}

console.log("\n" + ok + " controlli ok, " + ko + " sbagliati");
process.exit(ko ? 1 : 0);
