// Prova dei ritocchi del 18/11 sera (v76): un gruppo di controlli per ognuno degli 8 punti.
// node /home/claude/prove/casi-ritocchi.js [motore.js] [bot.js]
const L = require(process.argv[2] || "/home/claude/re-della-laguna/motore.js");
globalThis.Laguna = L;
const B = require(process.argv[3] || "/home/claude/re-della-laguna/bot.js");
let ok = 0, ko = 0;
function prova(nome, cond, extra) { if (cond) { ok++; console.log("  ok  " + nome); } else { ko++; console.log("  NO  " + nome + (extra !== undefined ? " -> " + JSON.stringify(extra) : "")); } }
function errore(nome, f, testo) { try { f(); ko++; console.log("  NO  " + nome + " (nessun errore)"); } catch (e) { const ok2 = !testo || e.message.includes(testo); if (ok2) { ok++; console.log("  ok  " + nome + ": \"" + e.message + "\""); } else { ko++; console.log("  NO  " + nome + ": \"" + e.message + "\""); } } }
const ap = (s, id, a) => L.applica(s, id, a);
const haMsg = (p, testo) => p.messaggi.some((m) => m.testo.includes(testo));

function nuova(seed, gen) {
  const s = L.nuovaPartita({ giocatori: [{ nome: "Anna" }, { nome: "Sabri" }, { nome: "Carla" }, { nome: "Dario" }], seed, cicli: 12, consigli: false, gen });
  while (s.fase === "pacchetti") { const p = s.players[s.sceltaPacchetti[0]]; ap(s, p.id, { tipo: "pacchetto", id: s.pacchettiDisponibili[0] }); }
  for (const p of s.players) { p.cash = 30_000_000; p.livello = 2; }
  return s;
}
function turnoDi(s, p) { s.turno = s.ordine.indexOf(s.players.indexOf(p)); s.pending = null; p.haTirato = false; p.doppi = 0; p.azioneGiornoFatta = false; }
function sbriga(s) {
  for (let k = 0; k < 20; k++) {
    const pd = s.pending; if (!pd) return;
    if (pd.tipo === "asta") { for (const id of pd.partecipanti) if (s.pending && s.pending.offerte[id] === undefined) ap(s, id, { tipo: "offerta", importo: 0 }); continue; }
    const g = pd.giocatore; ap(s, g, pd.tipo === "compra" ? { tipo: "compra", si: false } : pd.tipo === "municipio" ? { tipo: "municipio", scelta: "nulla" } : pd.tipo === "chiamata" ? { tipo: "chiamata", si: false } : { tipo: pd.tipo, importo: 0 });
  }
}
// gioca fino alla prossima Alba (il Ciclo cresce di 1)
function finoAlba(s) {
  const c0 = s.ciclo;
  for (let k = 0; k < 3000 && s.ciclo === c0 && !s.fine; k++) {
    if (s.fase === "giorno") { const p = L.corrente(s); sbriga(s); if (s.fase !== "giorno") continue; ap(s, p.id, p.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); sbriga(s); continue; }
    if (s.fase === "notte") {
      const N2 = s.notte, p = s.players.find((x) => !s.notteFatti[x.id] && !(x.faro > 0) && !N2.pronto[x.id]);
      if (!p) { for (const q of s.players) if (!s.notteFatti[q.id]) try { ap(s, q.id, { tipo: "pronto" }); } catch (e) { } continue; }
      if (N2.chiuso[p.id] || N2.viaggio[p.id]) { ap(s, p.id, { tipo: "avanti" }); continue; }
      ap(s, p.id, { tipo: "torna_a_casa" }); continue;
    }
    if (s.fase === "alba") { for (const q of s.players) try { ap(s, q.id, { tipo: "pronto" }); } catch (e) { } continue; }
    break;
  }
  return s.ciclo === c0 + 1;
}
function lottoLibero(s, p) { const l = s.lotti.find((x) => x.tipoCasella === "lotto" && x.owner == null && x.giro === "o"); l.owner = p.id; l.lvl = 0; l.permesso = false; l.negato = false; return l; }

// ------------------------------------------------------------------ 1
console.log("1. Timbro del Municipio");
{
  const s = nuova(3); const [A] = s.players; turnoDi(s, A);
  A.valigetta = [{ id: "timbro" }]; const l1 = lottoLibero(s, A), l2 = lottoLibero(s, A);
  const tr0 = A.tracce, cash0 = A.cash;
  ap(s, A.id, { tipo: "permesso", lotto: l1.id });
  prova("Permesso senza timbro:true -> il Timbro resta in valigetta", A.valigetta.some((o) => o.id === "timbro") && l1.permesso && A.tracce === tr0);
  prova("... e si paga il bollo (partita nuova)", A.cash < cash0);
  A.permessoTurno = -1; const cash1 = A.cash;
  ap(s, A.id, { tipo: "permesso", lotto: l2.id, timbro: true });
  prova("Con timbro:true il permesso passa, senza bollo, +6 Tracce, Timbro consumato", l2.permesso && A.cash === cash1 && A.tracce === tr0 + 6 && !A.valigetta.some((o) => o.id === "timbro"));
  const l3 = lottoLibero(s, A); A.permessoTurno = -1;
  errore("timbro:true senza Timbro", () => ap(s, A.id, { tipo: "permesso", lotto: l3.id, timbro: true }), "Non hai il Timbro");
  prova("Descrizione nuova del Timbro", /scegli tu se usarlo/.test(L.STRUMENTI.timbro.descr));
  const s1 = nuova(4, 1); const [A1] = s1.players; turnoDi(s1, A1); A1.valigetta = [{ id: "timbro" }]; const m1 = lottoLibero(s1, A1);
  ap(s1, A1.id, { tipo: "permesso", lotto: m1.id });
  prova("Partita vecchia (gen 1): senza timbro:true il Timbro resta", A1.valigetta.some((o) => o.id === "timbro"));
  // bot: lo usa se il permesso e' rimandato (Indagato)
  const s2 = nuova(5); const [A2] = s2.players; turnoDi(s2, A2); A2.bot = true; A2.strat = "Legale"; A2.valigetta = [{ id: "timbro" }]; A2.stato = 3; lottoLibero(s2, A2); A2.haTirato = true; A2.agenziaUsata = true;
  let a2 = null; for (let k = 0; k < 5 && !a2; k++) { const x = B.prossima(s2, A2); if (x && x.tipo === "permesso") a2 = x; else if (x) break; }
  prova("Bot Indagato con il Timbro: chiede il permesso con timbro:true", a2 && a2.timbro === true, a2);
}
// ------------------------------------------------------------------ 2
function settaDi(s, gm, membri, tesoro, influenza) {
  const st = { id: "sT" + s.prossimoId++, nome: "La Prova", motto: "", gm: gm.id, membri: [gm.id, ...membri.map((m) => m.id)], tesoro, operazioni: 0, pngReclutati: 0, influenza, ingressi: {} };
  s.sette.push(st); for (const p of [gm, ...membri]) p.sette.push(st.id); gm.settaFondata = st.id; return st;
}
console.log("2. Prova di fedeltà");
{
  const s = nuova(6); const [A, S2, C] = s.players; const st = settaDi(s, A, [S2, C], 30_000_000, 20);
  prova("Costo = 10% del Tesoro (3 M)", L.costoProvaFedelta(s, st) === 3_000_000);
  ap(s, A.id, { tipo: "prova_fedelta", setta: st.id, membro: S2.id });
  prova("Tesoro -3 M, st.prove = {ciclo, n:1}", st.tesoro === 27_000_000 && st.prove.n === 1 && st.prove.ciclo === s.ciclo);
  prova("Il membro sa: 'Il Gran Maestro ti ha messo alla prova.'", haMsg(S2, "Il Gran Maestro ti ha messo alla prova."));
  prova("Fedele: 'Era una prova inutile: sei stato fedele.'", haMsg(S2, "Era una prova inutile: sei stato fedele."));
  prova("Fedele: la setta perde 3 Influenza (20 -> 17)", L.influenzaDi(s, st) === 17);
  prova("Seconda nello stesso Ciclo costa il doppio (2,7 M x2)", L.costoProvaFedelta(s, st) === 5_400_000);
  ap(s, A.id, { tipo: "prova_fedelta", setta: st.id, membro: C.id });
  prova("Terza costa il quadruplo", L.costoProvaFedelta(s, st) === Math.max(2_000_000, Math.round(st.tesoro * 0.1)) * 4);
  prova("Influenza non scende sotto la soglia del livello 2 (12)", (() => { st.influenza = 13; ap(s, A.id, { tipo: "prova_fedelta", setta: st.id, membro: C.id }); return L.influenzaDi(s, st) === 12 && L.livelloSetta(s, st) === 2; })());
  s.ciclo += 1; prova("Nuovo Ciclo: il prezzo torna normale", L.costoProvaFedelta(s, st) === Math.max(2_000_000, Math.round(st.tesoro * 0.1)));
  st.tesoro = 5_000_000; prova("Minimo 2 M con un Tesoro piccolo", L.costoProvaFedelta(s, st) === 2_000_000);
  st.tesoro = 1_500_000; errore("Tesoro sotto il costo", () => ap(s, A.id, { tipo: "prova_fedelta", setta: st.id, membro: C.id }), "costa 2.000.000");
  // il traditore scoperto resta come prima
  st.tesoro = 30_000_000; st.tradimento = { da: S2.id, ciclo: s.ciclo - 1 };
  ap(s, A.id, { tipo: "prova_fedelta", setta: st.id, membro: S2.id });
  prova("Traditore scoperto: fuori dalla setta", !st.membri.includes(S2.id) && !st.tradimento);
  // bot fedele provato: 1 volta su 3 se ne va
  const r0 = Math.random; C.bot = true; C.strat = "Legale";
  C.provato = { setta: st.id, ciclo: s.ciclo }; Math.random = () => 0.1; const x1 = B.prossima(s, C);
  prova("Bot fedele provato (caso 1 su 3): lascia la setta", x1 && x1.tipo === "lascia_setta", x1);
  C.provato = { setta: st.id, ciclo: s.ciclo + 9 }; Math.random = () => 0.9; const x2 = B.prossima(s, C);
  prova("Bot fedele provato (altri casi): resta", !x2 || x2.tipo !== "lascia_setta", x2);
  Math.random = r0;
}
// ------------------------------------------------------------------ 3
console.log("3. Vendetta della setta");
{
  const s = nuova(8); const [A, S2, C, D] = s.players; const st = settaDi(s, A, [S2, C], 30_000_000, 20);
  ap(s, S2.id, { tipo: "tradisci", setta: st.id });
  const c = s.ciclo;
  prova("Si arriva all'Alba", finoAlba(s));
  prova("Il traditore è fuori", !st.membri.includes(S2.id));
  prova("Il Gran Maestro ha una Prova sul traditore", (A.prove || []).some((p) => p.su === S2.id && p.cosa === "i segreti che ha lasciato nella setta"));
  prova("p.marchiatoFino = Ciclo + 4", S2.marchiatoFino === c + 4);
  prova("I membri sanno il nome", haMsg(A, "Sabri ci ha venduti. Il Gran Maestro ha una Prova su di lui.") && haMsg(C, "Sabri ci ha venduti."));
  prova("Il traditore lo sa", haMsg(S2, "La setta ha tenuto qualcosa su di te."));
  errore("Nessuna setta lo invita", () => ap(s, A.id, { tipo: "invita_setta", setta: st.id, invitato: S2.id, offerta: 0 }), "nessuna setta lo prende");
  const st2 = settaDi(s, D, [], 5_000_000, 0); s.inviti.push({ setta: st2.id, a: S2.id, da: D.id, offerta: 0, ciclo: s.ciclo });
  errore("Non può entrare in un'altra setta", () => ap(s, S2.id, { tipo: "rispondi_invito", setta: st2.id, si: true }), "nessuna setta ti prende");
  S2.sporchi = 20_000_000; errore("Non può fondarne una", () => { s.fase = "notte"; s.notteFatti[S2.id] = false; ap(s, S2.id, { tipo: "fonda_setta", nome: "X" }); }, "Hai venduto una setta");
  s.ciclo = c + 5; s.fase = "giorno";
  ap(s, S2.id, { tipo: "rispondi_invito", setta: st2.id, si: true });
  prova("Dopo 4 Cicli può rientrare in una setta", st2.membri.includes(S2.id));
}
// ------------------------------------------------------------------ 4
console.log("4. Viaggio rapido");
{
  const s = nuova(9); const [A] = s.players; turnoDi(s, A); A.pos = 0;
  prova("Niente taxi per il Municipio", L.destinazioniRapide(s, A).length === 0 && L.N.taxiMunicipio === undefined);
  A.veicoli = ["motoscafo"]; let ds = L.destinazioniRapide(s, A);
  prova("Motoscafo: 100.000 €", ds.length > 0 && ds.every((d) => d.mezzo === "motoscafo" && d.costo === 100_000), ds.slice(0, 2));
  A.veicoli = ["elicottero"]; ds = L.destinazioniRapide(s, A);
  prova("Elicottero: 300.000 €", ds.length > 0 && ds.every((d) => d.costo === 300_000));
  A.veicoli = []; A.funzioniPiani = ["eliporto"]; A.stanze = ["eliporto"]; ds = L.destinazioniRapide(s, A);
  prova("Eliporto del Palazzo: 300.000 €", ds.length > 0 && ds.every((d) => d.costo === 300_000), ds.length);
  A.funzioniPiani = []; A.stanze = []; A.veicoli = ["jet"]; ds = L.destinazioniRapide(s, A);
  prova("Jet: 600.000 €", ds.length > 0 && ds.every((d) => d.costo === 600_000));
  const molo = s.lotti.find((l) => l.tipoCasella === "molo"); A.veicoli = []; A.pos = molo.idx; ds = L.destinazioniRapide(s, A);
  prova("Traghetto dal molo: 50.000 €", ds.length === 1 && ds[0].mezzo === "traghetto" && ds[0].costo === 50_000);
  A.veicoli = ["motoscafo"]; A.pos = 0; const cash0 = A.cash; const d = L.destinazioniRapide(s, A).find((x) => { const l = s.lotti.find((y) => y.idx === x.idx); return !l.owner; }) || L.destinazioniRapide(s, A)[0];
  ap(s, A.id, { tipo: "viaggio_rapido", idx: d.idx });
  prova("Viaggio: paga il carburante, consuma la mossa del giorno", A.cash <= cash0 - 100_000 && A.azioneGiornoFatta === true && A.rapidoCiclo === s.ciclo);
  sbriga(s);
  const l = lottoLibero(s, A);
  errore("Stesso turno: niente permesso", () => ap(s, A.id, { tipo: "permesso", lotto: l.id }), "viaggio rapido");
  errore("Stesso turno: niente piano del Palazzo", () => ap(s, A.id, { tipo: "piano", quanti: 1 }), "");
  s.ciclo += 1; turnoDi(s, A);
  prova("Ciclo dopo: 'fra 1 Ciclo'", L.cicliAlRapido(s, A) === 1 && /fra 1 Ciclo/.test(L.motivoNoRapido(s, A)));
  errore("Ciclo dopo: viaggio rifiutato", () => ap(s, A.id, { tipo: "viaggio_rapido", idx: L.destinazioniRapide(s, A)[0].idx }), "ogni 2 Cicli");
  s.ciclo += 1; turnoDi(s, A);
  prova("Due Cicli dopo: si può di nuovo", L.cicliAlRapido(s, A) === 0 && L.motivoNoRapido(s, A) === "");
  A.azioneGiornoFatta = true; prova("Mossa del giorno già usata: niente viaggio", /mossa del giorno/.test(L.motivoNoRapido(s, A)));
  // candidatura dal telefono: il doppio
  const s2 = nuova(10); const [, Q] = s2.players; Q.fama = 50; const c0 = Q.cash, base = L.N.candidatura * (Q.pacchetto === "politico" ? 0.5 : 1);
  ap(s2, Q.id, { tipo: "candidati" });
  prova("Candidatura dall'app Municipio: il doppio", Q.cash === c0 - 2 * base && s2.candidati[Q.id] === 0);
  errore("Non ci si candida due volte", () => ap(s2, Q.id, { tipo: "candidati" }), "già candidato");
  const R = s2.players[2]; R.fama = 50; R.municipioOggi = true; const c1 = R.cash; ap(s2, R.id, { tipo: "candidati" });
  prova("Sul Municipio oggi: prezzo pieno, non doppio", R.cash === c1 - L.N.candidatura * (R.pacchetto === "politico" ? 0.5 : 1));
}
// ------------------------------------------------------------------ 5
console.log("5. Testo del Favore nel patto");
{
  prova("Passo libero, lo devo io", L.testoFavorePatto("passo", true, "Sabri") === "Sabri, per i suoi prossimi 4 turni, non paga affitti né pedaggi sui tuoi terreni.");
  prova("Passo libero, lo deve lei", L.testoFavorePatto("passo", false, "Sabri") === "Per i tuoi prossimi 4 turni non paghi affitti né pedaggi sui terreni di Sabri.");
  for (const t of ["voto", "silenzio", "mano"]) {
    const io = L.testoFavorePatto(t, true, "Sabri"), lei = L.testoFavorePatto(t, false, "Sabri");
    prova(t + ": due frasi diverse, tutte e due col nome", io && lei && io !== lei && io.includes("Sabri") && lei.includes("Sabri"), [io, lei]);
  }
  prova("Il Voto dovuto da me: la MIA fama per Sabri", /la tua fama diventa punti per Sabri/.test(L.testoFavorePatto("voto", true, "Sabri")));
  prova("Il Silenzio dovuto da lei: lei brucia le Prove su di me", /^Sabri brucia tutte le Prove che ha su di te/.test(L.testoFavorePatto("silenzio", false, "Sabri")));
}
// ------------------------------------------------------------------ 6
console.log("6. Patto sulla parola non pagato");
{
  const s = nuova(12); const [A, S2, C] = s.players;
  const patto = (da, a, importo) => { ap(s, da.id, { tipo: "contratto", contratto: { a: a.id, tipo: "parola", pagoOra: 0, chiPagaOra: "da", pagoDopo: importo, chiPagaDopo: "a", cicli: 1 } }); const k = s.contratti.filter((x) => x.a === a.id && x.stato === "proposto").pop(); ap(s, a.id, { tipo: "rispondi_contratto", id: k.id, si: true }); k.scadenza = s.ciclo; return k; };
  const k1 = patto(A, S2, 1_000_000), k2 = patto(A, C, 2_000_000), k3 = patto(C, S2, 500_000);
  const famaC = C.fama;
  prova("Alba 1", finoAlba(s));
  prova("Alla scadenza: 'scaduto' con scadutoCiclo", k1.stato === "scaduto" && k1.scadutoCiclo === s.ciclo - 1 && k2.stato === "scaduto");
  prova("Il debitore sa che ha tempo fino all'Alba dopo", haMsg(S2, "entro la prossima Alba"));
  errore("Paga ora: non tocca a chi riceve", () => ap(s, A.id, { tipo: "paga_patto", id: k1.id }), "Non sei tu");
  const a0 = A.cash, s0 = S2.cash; ap(s, S2.id, { tipo: "paga_patto", id: k1.id });
  prova("Paga ora: paga e chiude", k1.stato === "chiuso" && A.cash === a0 + 1_000_000 && S2.cash === s0 - 1_000_000);
  ap(s, S2.id, { tipo: "regala", a: C.id, importo: 500_000 });
  prova("Pagare dall'app Banca (regalo) chiude il patto", k3.stato === "chiuso");
  // bot paga sempre se ha i soldi
  const s2 = JSON.parse(JSON.stringify(s)); const Cb = s2.players[2]; Cb.bot = true; Cb.strat = "Furbo"; const xb = B.prossima(s2, Cb);
  prova("Il bot paga il patto scaduto", xb && xb.tipo === "paga_patto" && xb.id === k2.id, xb);
  // gemella: stessa partita ma con il patto pagato, per misurare la fama persa nella stessa Alba
  const gem = JSON.parse(JSON.stringify(s)); gem.contratti.find((x) => x.id === k2.id).stato = "chiuso";
  prova("Alba 2", finoAlba(s)); finoAlba(gem);
  const famaGem = gem.players[2].fama;
  prova("Non pagato all'Alba dopo: patto rotto, -8 fama, senza parola", k2.stato === "rotto" && C.fama === Math.max(0, famaGem - 8) && C.senzaParola === s.ciclo + 1, [k2.stato, C.fama, famaGem, C.senzaParola, s.ciclo]);
  prova("Notizia pubblica: 'Carla non mantiene la parola data a Anna.'", s.gazzetta.some((g) => g.testo === "Carla non mantiene la parola data a Anna."));
  prova("Il patto pagato resta chiuso", k1.stato === "chiuso");
  // un patto scaduto prima della v76 (senza scadutoCiclo) non diventa parola rotta
  const vecchio = { id: "kV", da: A.id, a: S2.id, tipo: "parola", pagoOra: 0, pagoDopo: 300_000, chiPagaDopo: "a", stato: "scaduto", scadenza: 0 }; s.contratti.push(vecchio);
  finoAlba(s); prova("Patto scaduto prima della v76: nessuna punizione", vecchio.stato === "scaduto");
}
// ------------------------------------------------------------------ 7
console.log("7. Versione nella vista");
{
  const s = nuova(13); const prima = JSON.stringify(s); const v = L.vista(s, s.players[0].id);
  prova("v.versioneRegole = VERSIONE_REGOLE = 76", v.versioneRegole === L.VERSIONE_REGOLE && L.VERSIONE_REGOLE === 76);
  prova("vista() non tocca lo stato", JSON.stringify(s) === prima);
}
// ------------------------------------------------------------------ 8
console.log("8. La parola rotta si vede subito");
{
  const s = nuova(14); const [A, S2] = s.players;
  ap(s, A.id, { tipo: "contratto", contratto: { a: S2.id, tipo: "parola", pagoOra: 0, chiPagaOra: "da", pagoDopo: 0, chiPagaDopo: "a", cicli: 1, favore: "voto", favoreDeve: "a" } });
  const k = s.contratti.filter((x) => x.a === S2.id && x.stato === "proposto").pop(); ap(s, S2.id, { tipo: "rispondi_contratto", id: k.id, si: true });
  const f = s.favori.find((x) => x.deve === S2.id && x.a === A.id);
  ap(s, S2.id, { tipo: "favore_rompi", id: f.id });
  const g = s.gazzetta.find((x) => x.testo === "Sabri non mantiene la parola data a Anna.");
  prova("Notizia di tipo 'parola' (esce in Ultim'ora)", g && g.tipo === "parola");
  prova("A chi rompe: 'Hai rotto la parola con Anna: −8 fama, e fino al Ciclo N ...'", haMsg(S2, "Hai rotto la parola con Anna: −8 fama, e fino al Ciclo " + (S2.senzaParola + 1) + " nessuno accetterà Favori da te."));
  prova("A chi la subisce: 'Sabri non ha mantenuto la parola: Il Voto.'", haMsg(A, "Sabri non ha mantenuto la parola: Il Voto."));
  // con una Prova in pegno (ricatto)
  const s3 = nuova(15); const [A3, S3] = s3.players; A3.prove = [{ su: S3.id, ciclo: 1, cosa: "foto" }];
  ap(s3, A3.id, { tipo: "ricatto", prova: 0, favore: "passo" });
  const r = (s3.ricatti || []).find((x) => x.a === S3.id); if (r) ap(s3, S3.id, { tipo: "rispondi_ricatto", id: r.id, scelta: "accetto" });
  const f3 = (s3.favori || []).find((x) => x.deve === S3.id);
  if (f3) ap(s3, S3.id, { tipo: "favore_rompi", id: f3.id });
  prova("Con la Prova in pegno: 'La Prova torna a te.'", f3 && haMsg(A3, "non ha mantenuto la parola: Passo libero. La Prova torna a te."), f3 ? A3.messaggi.slice(-2) : "nessun favore dal ricatto");
}
// ------------------------------------------------------------------ 9
console.log("9. Sotto il cappuccio: al rito i nomi li sa solo il Gran Maestro");
{
  const s = nuova(16); const [A, S2, C, D] = s.players; const st = settaDi(s, A, [S2, C], 30_000_000, 20);
  // gioca il giorno fino alla notte
  for (let k = 0; k < 2000 && s.fase === "giorno"; k++) { const p = L.corrente(s); sbriga(s); if (s.fase !== "giorno") break; ap(s, p.id, p.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); sbriga(s); }
  prova("È notte", s.fase === "notte");
  ap(s, A.id, { tipo: "convoca", setta: st.id, luogo: "faro", ora: Math.max(1, s.notte.ora + 1) });
  prova("La convocazione ai membri non ha nomi di presenti", S2.messaggi.slice(-1)[0].testo.startsWith("Il Gran Maestro convoca la setta"));
  for (const p of [A, S2, C, D]) { s.notte.dove[p.id] = "faro"; delete s.notte.viaggio[p.id]; s.notte.chiuso[p.id] = false; }
  s.notte.ora = st.convocazione.ora;
  const vS = L.vista(s, S2.id), vA = L.vista(s, A.id);
  prova("Vista di un membro: confratelli senza posto e fuori da 'qui'", vS.notte.dove[A.id] == null && vS.notte.dove[C.id] == null && !vS.notte.qui.includes(A.id) && !vS.notte.qui.includes(C.id), [vS.notte.dove, vS.notte.qui]);
  prova("Vista di un membro: 2 incappucciati", vS.notte.incappucciati === 2);
  prova("Vista di un membro: chi non è della setta si vede (Dario)", vS.notte.dove[D.id] === "faro" && vS.notte.qui.includes(D.id));
  prova("Vista del Gran Maestro: vede tutti i nomi", vA.notte.dove[S2.id] === "faro" && vA.notte.qui.includes(S2.id) && vA.notte.qui.includes(C.id) && !vA.notte.incappucciati);
  ap(s, A.id, { tipo: "rito", setta: st.id });
  const rS = (s.notte.racconto[S2.id] || []).join(" | "), rA = (s.notte.racconto[A.id] || []).join(" | ");
  prova("Al membro: 'Siete in 3 sotto il cappuccio.' e nessun nome", rS.includes("Siete in 3 sotto il cappuccio.") && !/Anna|Carla/.test(rS), rS);
  prova("Al Gran Maestro: i nomi dei presenti", /Anna, Sabri, Carla sotto lo stesso cappuccio\./.test(rA) || (rA.includes("Sabri") && rA.includes("Carla")), rA);
  prova("La vista di un membro dopo il rito resta senza nomi", L.vista(s, C.id).notte.dove[A.id] == null);
}
// ------------------------------------------------------------------ 10
console.log("10. Di notte non si sa chi stai aspettando");
{
  const s = nuova(17); const [A, S2, C, D] = s.players;
  for (let k = 0; k < 2000 && s.fase === "giorno"; k++) { const p = L.corrente(s); sbriga(s); if (s.fase !== "giorno") break; ap(s, p.id, p.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); sbriga(s); }
  prova("È notte", s.fase === "notte");
  ap(s, S2.id, { tipo: "torna_a_casa" });
  const primaV = JSON.stringify(s); const v = L.vista(s, A.id);
  prova("vista() non tocca lo stato vero della notte", JSON.stringify(s) === primaV);
  prova("v.notte.pronto ha solo il mio stato", Object.keys(v.notte.pronto).join() === A.id, v.notte.pronto);
  prova("v.notte.chiuso ha solo il mio stato", Object.keys(v.notte.chiuso).join() === A.id, v.notte.chiuso);
  prova("v.notteFatti ha solo il mio stato", Object.keys(v.notteFatti).join() === A.id, v.notteFatti);
  const attesi = s.players.filter((p) => p.id !== A.id && !s.notteFatti[p.id] && p.faro === 0 && !s.notte.pronto[p.id]).length;
  prova("v.notte.mancano = quanti altri non hanno finito (" + attesi + ")", v.notte.mancano === attesi, v.notte.mancano);
  prova("Lo stato vero ha ancora lo stato di Sabri", !!(s.notteFatti[S2.id] || s.notte.pronto[S2.id] || s.notte.chiuso[S2.id]));
  prova("La notte arriva all'Alba come prima", finoAlba(s));
}
console.log("\n" + ok + " controlli ok, " + ko + " sbagliati");
process.exit(ko ? 1 : 0);
