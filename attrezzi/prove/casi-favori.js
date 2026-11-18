// Prova dei Favori (dinamica 1) e del Ricatto (dinamica 2).
// node /home/claude/prove/casi-favori.js [motore.js]
// Crea una partita con 4 persone (nessun bot), fa un patto con un Favore per ognuno dei 4 tipi, li usa,
// rompe una parola, fa un ricatto con ognuna delle 4 risposte, e controlla la vista di un terzo giocatore.
const L = require(process.argv[2] || "/home/claude/re-della-laguna/motore.js");
let ok = 0, ko = 0;
function prova(nome, cond, extra) { if (cond) { ok++; console.log("  ok  " + nome); } else { ko++; console.log("  NO  " + nome + (extra ? " -> " + extra : "")); } }
function errore(nome, f, testo) { try { f(); ko++; console.log("  NO  " + nome + " (nessun errore)"); } catch (e) { const ok2 = !testo || e.message.includes(testo); if (ok2) { ok++; console.log("  ok  " + nome + ": \"" + e.message + "\""); } else { ko++; console.log("  NO  " + nome + ": \"" + e.message + "\""); } } }
const ap = (s, id, a) => L.applica(s, id, a);

const s = L.nuovaPartita({ giocatori: [{ nome: "Anna" }, { nome: "Bruno" }, { nome: "Carla" }, { nome: "Dario" }], seed: 7, cicli: 12, consigli: false });
while (s.fase === "pacchetti") { const p = s.players[s.sceltaPacchetti[0]]; ap(s, p.id, { tipo: "pacchetto", id: s.pacchettiDisponibili[0] }); }
const [A, B, C, D] = s.players;
for (const p of s.players) { p.cash = 20_000_000; p.livello = 2; }

// giorno: una mossa per volta per chi e' di turno, finche' non cala la notte
function finoAllaNotte(maxPassi) {
  for (let k = 0; k < (maxPassi || 400) && s.fase === "giorno"; k++) {
    const p = L.corrente(s), pd = s.pending;
    if (pd && pd.tipo === "asta") { for (const id of pd.partecipanti) if (s.pending && s.pending.offerte[id] === undefined) ap(s, id, { tipo: "offerta", importo: 0 }); continue; }
    if (pd && pd.giocatore) { const g = pd.giocatore; ap(s, g, pd.tipo === "compra" ? { tipo: "compra", si: false } : pd.tipo === "municipio" ? { tipo: "municipio", scelta: "nulla" } : pd.tipo === "chiamata" ? { tipo: "chiamata", si: false } : { tipo: pd.tipo, importo: 0 }); continue; }
    ap(s, p.id, p.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
  }
}
// notte: chi ha un appuntamento ci va e aspetta, gli altri tornano a casa. Poi l'Alba.
function notteFinoAlba(appuntamenti) {
  for (let k = 0; k < 300 && s.fase === "notte"; k++) {
    const N2 = s.notte;
    const p = s.players.find((x) => !s.notteFatti[x.id] && !(x.faro > 0) && !N2.pronto[x.id]);
    if (!p) break;
    const app = (appuntamenti || {})[p.id];
    if (N2.chiuso[p.id] || N2.viaggio[p.id]) { ap(s, p.id, { tipo: "avanti" }); continue; }
    if (app && N2.ora <= app.ora) { if (N2.dove[p.id] !== app.luogo) ap(s, p.id, { tipo: "vai", luogo: app.luogo }); else ap(s, p.id, { tipo: "aspetta" }); continue; }
    ap(s, p.id, { tipo: "torna_a_casa" });
  }
}
function patto(da, a, tipo, chiDeve, extra) {
  return ap(s, da.id, { tipo: "contratto", contratto: { a: a.id, tipo: "parola", pagoOra: 0, chiPagaOra: "da", pagoDopo: 0, chiPagaDopo: "a", cicli: 1, favore: tipo, favoreDeve: chiDeve, ...(extra || {}) } });
}
function accetta(a) { const k = s.contratti.filter((x) => x.a === a.id && x.stato === "proposto").pop(); ap(s, a.id, { tipo: "rispondi_contratto", id: k.id, si: true }); return k; }
const fav = (deve, a, tipo) => (s.favori || []).find((f) => f.deve === deve.id && f.a === a.id && f.tipo === tipo);

console.log("1. Patti con un Favore, uno per tipo");
s.ciclo = 1; // cosi' all'Alba di questo Ciclo ci sono le elezioni
patto(A, B, "voto", "a"); accetta(B);
prova("Voto: B lo deve ad A, aperto", fav(B, A, "voto") && fav(B, A, "voto").stato === "aperto");
patto(B, A, "passo", "da"); accetta(A);
prova("Passo libero: B lo deve ad A", fav(B, A, "passo") && fav(B, A, "passo").origine === "patto");
patto(A, C, "silenzio", "a"); accetta(C);
prova("Silenzio: C lo deve ad A", !!fav(C, A, "silenzio"));
patto(B, C, "mano", "a"); accetta(C);
prova("La Mano: C la deve a B", !!fav(C, B, "mano"));
prova("Scheda del patto con il Favore", s.contratti.some((k) => k.favore && k.favore.tipo === "mano" && k.favore.id));
errore("Stesso Favore due volte", () => patto(A, B, "voto", "a"), "Questo Favore te lo deve già.");
patto(C, B, "voto", "a"); accetta(B); // B: voto ad A, passo ad A, voto a C = 3 aperti
errore("Troppi Favori aperti", () => patto(D, B, "mano", "a"), "ha già promesso troppo: 3 Favori aperti.");
errore("Patto con un Favore sconosciuto", () => patto(A, D, "luna", "a"), "Favore sconosciuto");

console.log("2. Usare i Favori");
// Il Voto: A candidato, C candidato con piu' fama. Senza il Voto vincerebbe C.
s.candidati[A.id] = 0; A.fama = 0; C.fama = 20; B.fama = 30; A.mandati = 0; C.mandati = 0;
errore("Voto usato da chi non e' candidato", () => ap(s, C.id, { tipo: "favore_usa", id: fav(B, C, "voto").id }), "Il Voto si usa quando sei candidato.");
s.candidati[C.id] = 0;
ap(s, A.id, { tipo: "favore_usa", id: fav(B, A, "voto").id });
prova("Voto attivo per le elezioni", fav(B, A, "voto").stato === "attivo" && fav(B, A, "voto").uso.elezione);
prova("Gazzetta: B sostiene A", s.gazzetta.some((g) => g.testo === "Bruno sostiene Anna alle elezioni."));
// Silenzio: C ha 2 Prove su A
C.prove.push({ su: A.id, ciclo: 1, cosa: "foto notturna" }, { su: A.id, ciclo: 1, cosa: "soffiata" }, { su: D.id, ciclo: 1, cosa: "soffiata" });
ap(s, A.id, { tipo: "favore_usa", id: fav(C, A, "silenzio").id });
prova("Silenzio: bruciate 2 Prove, resta quella su D", fav(C, A, "silenzio").uso.bruciate === 2 && C.prove.length === 1 && C.prove[0].su === D.id);
prova("Messaggio ad A: ha bruciato 2 Prove", A.messaggi.some((m) => m.testo === "Carla ha bruciato 2 Prove su di te."));
C.prove.push({ su: A.id, ciclo: 1, cosa: "foto nuova" });
errore("Silenzio: C non puo' denunciare A", () => ap(s, C.id, { tipo: "denuncia", prova: C.prove.length - 1 }), "Hai promesso il Silenzio a Anna");
errore("Silenzio: C non puo' ricattare A", () => ap(s, C.id, { tipo: "ricatto", prova: C.prove.length - 1, favore: "passo" }), "Hai promesso il Silenzio a Anna");
C.prove.pop();
// La Mano: B la usa di giorno, appuntamento al Club alle 01:00 (ora 3)
errore("Mano a palazzo", () => ap(s, B.id, { tipo: "favore_usa", id: fav(C, B, "mano").id, luogo: "palazzo", ora: 3 }), "Scegli un posto");
ap(s, B.id, { tipo: "favore_usa", id: fav(C, B, "mano").id, luogo: "club", ora: 3 });
prova("Mano attiva con posto e ora", fav(C, B, "mano").stato === "attivo" && fav(C, B, "mano").uso.luogo === "club");
prova("Messaggio a C con l'appuntamento", C.messaggi.some((m) => m.testo.includes("stanotte alle 01:00 devi essere a Club Neon")));
// Passo libero: tutti i terreni di B; A non paga affitti per 4 turni
for (const l of s.lotti) if ((l.tipoCasella === "lotto" || l.tipoCasella === "molo") && l.owner !== A.id) { l.owner = B.id; if (l.tipoCasella === "lotto") { l.lvl = 2; l.tipo = l.tipo || "residenze"; } }
errore("Passo libero di notte no (si prova a fingere la notte)", () => { const f0 = s.fase; s.fase = "notte"; try { ap(s, A.id, { tipo: "favore_usa", id: fav(B, A, "passo").id }); } finally { s.fase = f0; } }, "di giorno");
ap(s, A.id, { tipo: "favore_usa", id: fav(B, A, "passo").id });
prova("Passo libero attivo, 4 turni", fav(B, A, "passo").uso.turni === 4);
const flussiPrima = s.flussi.length, cashB = B.cash;

console.log("3. Rompere la parola");
const famaB = B.fama;
ap(s, B.id, { tipo: "favore_rompi", id: fav(B, C, "voto").id });
prova("Parola rotta: stato rotto, -8 fama, senza parola", fav(B, C, "voto").stato === "rotto" && B.fama === famaB - 8 && B.senzaParola === s.ciclo + 2);
prova("Gazzetta: Bruno non mantiene la parola", s.gazzetta.some((g) => g.testo === "Bruno non mantiene la parola data a Carla."));
errore("Senza parola: nessuno accetta Favori da B", () => patto(D, B, "mano", "a"), "Nessuno si fida della parola di Bruno fino al Ciclo " + (s.ciclo + 3) + ".");
errore("Solo chi lo deve puo' rompere", () => ap(s, A.id, { tipo: "favore_rompi", id: fav(B, A, "passo").id }), "non lo devi tu");

console.log("4. Il giorno, la notte con la Mano, l'Alba con le elezioni");
finoAllaNotte();
const affittiAB = s.flussi.slice(flussiPrima).filter((f) => f.da === A.id && f.a === B.id).length;
prova("A non ha pagato affitti a B col Passo libero", affittiAB === 0, affittiAB + " affitti");
prova("Passo libero contato sui turni di A", fav(B, A, "passo").stato === "pagato" || fav(B, A, "passo").uso.turni < 4, JSON.stringify(fav(B, A, "passo").uso));
prova("Cronaca: A passa gratis da un terreno di B (" + s.log.filter((r) => r.testo.includes("passa gratis")).length + " volte)", s.log.some((r) => r.testo.startsWith("Anna passa gratis da ")));
prova("E' notte", s.fase === "notte");
// la vista di Dario: niente Silenzio, Mano, ricatti degli altri
{
  const v = L.vista(s, D.id), j = JSON.stringify(v);
  prova("Vista di D: nessun Silenzio o Mano", !(v.favori || []).some((f) => f.tipo === "silenzio" || f.tipo === "mano"));
  prova("Vista di D: vede il Voto attivo e il Passo (pubblici)", (v.favori || []).some((f) => f.tipo === "voto" && f.stato === "attivo") && (v.favori || []).every((f) => f.deve === D.id || f.a === D.id || ["voto", "passo"].includes(f.tipo)));
  prova("Vista di D: i Favori degli altri sono ridotti (niente prova, scade)", (v.favori || []).filter((f) => f.deve !== D.id && f.a !== D.id).every((f) => !("prova" in f) && !("scade" in f)));
  prova("Vista di D: senzaParola di B e' pubblico", v.players.find((x) => x.id === B.id).senzaParola === B.senzaParola);
  prova("Vista di D: niente macchia degli altri", v.players.filter((x) => x.id !== D.id).every((x) => !("macchia" in x)));
  prova("Vista di D: nessun club/appuntamento", !j.includes("\"luogo\":\"club\""));
}
A.fama = 0; C.fama = 5; B.fama = 30;
notteFinoAlba({ [C.id]: { luogo: "club", ora: 3 } });
prova("La Mano: C e' venuto, Favore pagato", fav(C, B, "mano").stato === "pagato", fav(C, B, "mano").stato);
prova("Elezioni: A Sindaco grazie al Voto di B", s.sindaco === A.id, "sindaco " + s.sindaco);
prova("Voto pagato dopo le elezioni", fav(B, A, "voto").stato === "pagato");
prova("Silenzio ancora attivo (fino alla fine del prossimo Ciclo)", fav(C, A, "silenzio").stato === "attivo");

console.log("5. La Mano non mantenuta");
patto(D, A, "mano", "a"); accetta(A);
ap(s, D.id, { tipo: "favore_usa", id: fav(A, D, "mano").id, luogo: "marina", ora: 2 });
const famaA = A.fama;
finoAllaNotte(); notteFinoAlba({});
prova("A non e' andato: parola rotta da sola", fav(A, D, "mano").stato === "rotto" && A.senzaParola != null && s.gazzetta.some((g) => g.testo === "Anna non mantiene la parola data a Dario."));
prova("Silenzio pagato all'Alba dopo", fav(C, A, "silenzio").stato === "pagato");

console.log("6. Il ricatto, le 4 risposte");
for (const p of s.players) { p.senzaParola = null; p.prove = []; p.stanze = []; p.funzioniPiani = []; }
s.favori = s.favori.filter((f) => f.stato !== "aperto");
// accetto (e poi rompe la parola: la Prova torna)
A.prove.push({ su: C.id, ciclo: s.ciclo + 1, cosa: "foto notturna" });
let trA = A.tracce;
ap(s, A.id, { tipo: "ricatto", prova: 0, favore: "passo" });
let r = s.ricatti[s.ricatti.length - 1];
prova("Ricatto in attesa, Prova dentro il ricatto, +6 Tracce, reato grave, macchia", r.stato === "attesa" && A.prove.length === 0 && Math.round(A.tracce - trA) === 6 && A.peggiorReato === "grave" && A.macchia === true);
prova("Messaggio alla vittima con la Prova e il Favore", C.messaggi.some((m) => m.testo.startsWith("Anna ha una Prova su di te (foto notturna, Ciclo") && m.testo.includes("Passo libero. Rispondi prima dell'Alba.")));
prova("Pista del ricatto per chi ricatta", L.piste(s, A).some((x) => x.k === "ricatto" && x.peso === 10));
A.prove.push({ su: B.id, ciclo: s.ciclo + 1, cosa: "soffiata" });
errore("Un solo ricatto aperto alla volta", () => ap(s, A.id, { tipo: "ricatto", prova: 0, favore: "voto" }), "Hai già un ricatto aperto.");
ap(s, C.id, { tipo: "rispondi_ricatto", id: r.id, scelta: "accetto" });
const fr = s.favori.find((f) => f.origine === "ricatto" && f.deve === C.id && f.a === A.id);
prova("Accetto: nasce il Favore con la Prova in pegno", r.stato === "accettato" && fr && fr.prova && fr.prova.su === C.id);
prova("Pista resta finche' il Favore e' aperto", L.piste(s, A).some((x) => x.k === "ricatto"));
ap(s, C.id, { tipo: "favore_rompi", id: fr.id });
prova("Parola rotta su un ricatto: la Prova torna ad A (solo da denunciare)", A.prove.some((x) => x.su === C.id && x.rifiutata));
prova("Pista sparita col Favore rotto", !L.piste(s, A).some((x) => x.k === "ricatto"));
// rifiuto
const iB = A.prove.findIndex((x) => x.su === B.id);
ap(s, A.id, { tipo: "ricatto", prova: iB, favore: "voto" });
r = s.ricatti[s.ricatti.length - 1];
ap(s, B.id, { tipo: "rispondi_ricatto", id: r.id, scelta: "rifiuto" });
prova("Rifiuto: la Prova torna con rifiutata", r.stato === "rifiutato" && A.prove.some((x) => x.su === B.id && x.rifiutata));
errore("Prova gia' vista", () => ap(s, A.id, { tipo: "ricatto", prova: A.prove.findIndex((x) => x.su === B.id), favore: "voto" }), "Questa Prova l'ha già vista. Ora puoi solo denunciarlo.");
// confesso
B.prove.push({ su: D.id, ciclo: s.ciclo + 1, cosa: "foto notturna" });
const trB = B.tracce, trD = D.tracce, stD = D.stato;
ap(s, B.id, { tipo: "ricatto", prova: 0, favore: "silenzio" });
r = s.ricatti[s.ricatti.length - 1];
ap(s, D.id, { tipo: "rispondi_ricatto", id: r.id, scelta: "confesso" });
prova("Confesso: vittima +17, ricattatore +6+25 e Osservato almeno", Math.round(D.tracce - trD) === 17 && D.stato === stD && Math.round(B.tracce - trB) === 31 && B.stato >= 1, [D.tracce - trD, B.tracce - trB, B.stato].join(" "));
prova("Gazzetta della confessione", s.gazzetta.some((g) => g.testo === "Dario confessa in Procura e fa un nome: Bruno lo ricattava."));
// pari e patta
C.prove.push({ su: A.id, ciclo: s.ciclo + 1, cosa: "soffiata" });
A.prove.push({ su: C.id, ciclo: s.ciclo + 1, cosa: "foto" });
ap(s, C.id, { tipo: "ricatto", prova: 0, favore: "mano" });
r = s.ricatti[s.ricatti.length - 1];
errore("Pari senza Prova (D non c'entra)", () => ap(s, D.id, { tipo: "rispondi_ricatto", id: r.id, scelta: "pari" }), "Ricatto non trovato.");
const provaAsuC = A.prove.filter((x) => x.su === C.id).length;
ap(s, A.id, { tipo: "rispondi_ricatto", id: r.id, scelta: "pari" });
prova("Pari: bruciate tutte e due le Prove", r.stato === "pari" && C.prove.length === 0 && A.prove.filter((x) => x.su === C.id).length === provaAsuC - 1);
// senza risposta all'Alba = rifiuto
B.prove.push({ su: D.id, ciclo: s.ciclo + 1, cosa: "soffiata" });
ap(s, B.id, { tipo: "ricatto", prova: B.prove.length - 1, favore: "voto" });
const rD = s.ricatti[s.ricatti.length - 1];
// Ufficio stampa: almeno una volta su 12 tentativi (su copie della partita) smaschera il ricatto
{
  let smasch = 0;
  for (let k = 0; k < 12; k++) {
    const c2 = JSON.parse(JSON.stringify(s)); c2.rngState = 1000 + k; const a2 = c2.players[0], c3 = c2.players[1];
    c3.stanze = ["ufficio_stampa"]; c3.funzioniPiani = ["ufficio_stampa"]; a2.prove.push({ su: c3.id, ciclo: 1, cosa: "foto" }); c2.ricatti = c2.ricatti.filter((x) => x.da !== a2.id || x.stato !== "attesa");
    const f0 = a2.fama; L.applica(c2, a2.id, { tipo: "ricatto", prova: a2.prove.length - 1, favore: "voto" });
    if (c2.ricatti[c2.ricatti.length - 1].stato === "smascherato") { smasch++; if (smasch === 1) prova("Ufficio stampa: smascherato, -8 fama, Gazzetta", a2.fama === Math.max(0, f0 - 8) && c2.gazzetta.some((g) => g.testo.includes("denuncia un tentato ricatto. Dietro c'è Anna."))); }
  }
  prova("Ufficio stampa smaschera qualche volta (" + smasch + " su 12)", smasch > 0 && smasch < 12);
}

console.log("7. Vista di un terzo e Alba");
{
  // durante il ricatto B -> D, la vista di A non contiene il ricatto; quella di C non contiene ricatti di altri
  const vA = L.vista(s, A.id);
  prova("Vista di A: solo i ricatti dove c'e' A", (vA.ricatti || []).every((x) => x.da === A.id || x.a === A.id) && !(vA.ricatti || []).some((x) => x.id === rD.id));
  const vD = L.vista(s, D.id);
  prova("Vista di D: vede il ricatto contro di lui", (vD.ricatti || []).some((x) => x.id === rD.id));
  const prima = JSON.stringify(s); L.vista(s, C.id); L.vista(s, D.id);
  prova("vista() non cambia lo stato", JSON.stringify(s) === prima);
}
finoAllaNotte(); notteFinoAlba({});
prova("Ricatto senza risposta all'Alba = rifiuto", rD.stato === "rifiutato" && B.prove.some((x) => x.su === D.id && x.rifiutata));
prova("I Favori aperti scadono dopo 4 Cicli", (() => { const c2 = JSON.parse(JSON.stringify(s)); c2.favori.push({ id: "fx", deve: "g2", a: "g4", tipo: "voto", origine: "patto", nato: 0, scade: c2.ciclo, stato: "aperto", uso: null, prova: null }); for (let k = 0; k < 400 && c2.ciclo === s.ciclo; k++) { const p = L.corrente(c2); try { L.applica(c2, p.id, p.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); } catch (e) { if (c2.pending && c2.pending.giocatore) L.applica(c2, c2.pending.giocatore, c2.pending.tipo === "compra" ? { tipo: "compra", si: false } : c2.pending.tipo === "municipio" ? { tipo: "municipio", scelta: "nulla" } : { tipo: c2.pending.tipo, importo: 0, si: false }); else if (c2.pending && c2.pending.tipo === "asta") for (const id of c2.pending.partecipanti) L.applica(c2, id, { tipo: "offerta", importo: 0 }); } if (c2.fase === "notte") for (const q of c2.players) if (!c2.notteFatti[q.id]) L.applica(c2, q.id, { tipo: "torna_a_casa" }); } return c2.favori.find((f) => f.id === "fx").stato === "scaduto"; })());

console.log("8. Partita vecchia senza i campi nuovi");
{
  const c2 = JSON.parse(JSON.stringify(s)); delete c2.favori; delete c2.ricatti; for (const p of c2.players) { delete p.macchia; delete p.senzaParola; }
  let bene = true; try { L.vista(c2, "g1"); L.piste(c2, c2.players[0]); } catch (e) { bene = false; console.log(e.message); }
  try { const p = c2.players[0], q = c2.players[1]; L.applica(c2, p.id, { tipo: "contratto", contratto: { a: q.id, tipo: "parola", favore: "voto", favoreDeve: "a" } }); } catch (e) { bene = false; console.log(e.message); }
  prova("Una partita senza s.favori / s.ricatti funziona", bene && Array.isArray(c2.favori));
}

console.log("\n" + ok + " controlli ok, " + ko + " sbagliati");
process.exit(ko ? 1 : 0);
