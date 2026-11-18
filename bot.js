!(function (o) {
  "use strict";
  const t = o.Laguna || ("undefined" != typeof require ? require("./motore.js") : null);
  function i(o, i) {
    const e = t.ATTIVITA;
    return (
      (
        {
          Legale: ["hotel", "ristorante", "uffici", "boutique", "residenze"],
          Costruttore: ["hotel", "ristorante", "uffici", "boutique", "residenze"],
          Investitore: ["uffici", "hotel", "boutique", "ristorante", "residenze"],
          Furbo: ["lavanderia", "discoteca", "galleria", "ristorante", "residenze"],
          Spavaldo: ["discoteca", "beachclub", "magazzino", "ristorante", "residenze"],
          Esperto: ["magazzino", "lavanderia", "discoteca", "galleria", "residenze"],
        }[o.strat] || ["residenze"]
      ).find((o) => ((o) => !e[o].isole || e[o].isole.includes(i.isola))(o) && !e[o].licenza && !e[o].serie) || "residenze"
    );
  }
  function e(o, e, r) {
    let n = null,
      a = 0;
    for (const s of t.propri(o, e)) {
      if (s.lvl >= 5 || s.chiuso || s.ipoteca || s.cantiere || "lotto" !== s.tipoCasella) continue;
      if (void 0 !== r && !!s.permesso !== r) continue;
      const c = s.lvl + 1;
      if (c >= 3 && !t.haSerie(o, e, s.serie)) continue;
      if (5 === c && e.fama < 50) continue;
      const l = s.tipo || i(e, s),
        u = t.ATTIVITA[l],
        p = t.N.costLvl[c] * s.prezzo;
      if (e.cash - p < 2e5) continue;
      const d = (t.N.R * u.r * (t.N.rendLvl[c] - t.N.rendLvl[s.lvl]) * s.prezzo) / p;
      d > a && ((a = d), (n = { l: s, tipo: l }));
    }
    return n;
  }
  function r(o, t) {
    return (o.valigetta || []).some((o) => o.id === t);
  }
  // I Grandi Affari (Livello 4): aste, quote, poteri. Al massimo una mossa per giorno.
  // ---------------------------------------------------------------- sette
// Ogni carattere ha il suo prezzo per entrare in una setta: lo Spavaldo entra gratis, il Legale quasi mai.
const PREZZO_SETTA = { Spavaldo: 0, Furbo: 2e5, Esperto: 4e5, Investitore: 8e5, Costruttore: 8e5, Legale: 2e6 };
const NOMI_SETTA = [["La Mano Nera", "Nessuno vede, tutti pagano."], ["I Figli della Nebbia", "Dalla laguna veniamo."], ["Ordine del Tridente", "Tre punte, un solo padrone."], ["Loggia del Corallo", "Il mare custodisce."], ["La Lanterna Spenta", "Al buio si fanno gli affari."]];
function rispostaInvito(o, i, n, a) {
  const tondo = (v) => (Math.ceil(v / 5e4) * 5e4).toLocaleString("it-IT") + " €";
  const off = a.offerta || 0, ricco = i.cash + i.sporchi;
  const no = (m) => ({ tipo: "rispondi_invito", setta: a.setta, si: !1, motivo: m });
  const si = { tipo: "rispondi_invito", setta: a.setta, si: !0 };
  if (i.settaFondata) return no("Ha già la sua setta.");
  if (off < 0) {
    const max = ({ Spavaldo: 0.1, Furbo: 0.05 }[n] || 0) * ricco;
    return -off <= max ? si : no(max > 0 ? "Pagherebbe al massimo " + tondo(max) + " per entrare." : "Non paga per entrare in una setta.");
  }
  let serve = PREZZO_SETTA[n] != null ? PREZZO_SETTA[n] : 3e5;
  if ((i.sette || []).length) serve += 5e5; // e' gia' in un'altra setta: costa di piu' convincerlo
  if (i.stato >= 2) serve += 5e5; // ha la polizia addosso: entrare e' un rischio
  return off >= serve ? si : no("Entrerebbe con un regalo di almeno " + tondo(serve) + ".");
}
// Il Gran Maestro bot invita una persona al Ciclo, con un regalo se il Tesoro puo' permetterselo
function invitoBot(o, i, L) {
  // tradimenti e sospetti
  if (i._tradCiclo !== o.ciclo) {
    i._tradCiclo = o.ciclo;
    const altra = (o.sette || []).find((x) => x.gm !== i.id && x.membri.includes(i.id));
    if (altra && !altra.tradimento && altra.tesoro >= 1e7 && ["Furbo", "Spavaldo"].includes(i.strat) && Math.random() < 0.08) return { tipo: "tradisci", setta: altra.id };
    const mia = (o.sette || []).find((x) => x.gm === i.id);
    const costoProva = mia && L && L.costoProvaFedelta ? L.costoProvaFedelta(o, mia) : 1e6;
    if (mia && mia.membri.length > 1 && mia.tesoro >= Math.max(3e6, costoProva * 2.5) && Math.random() < 0.15) { const m = mia.membri.filter((x) => x !== i.id); return { tipo: "prova_fedelta", setta: mia.id, membro: m[Math.floor(Math.random() * m.length)] }; }
  }
  const st = (o.sette || []).find((x) => x.gm === i.id);
  if (st && st.membri.length >= 2 && !(st.convocazione && st.convocazione.ciclo === o.ciclo) && o.ciclo % 2 === 0) {
    const posti = ["faro", "porto", "bisca", "club"].filter((l) => L.luogoAperto(o, l, i));
    if (posti.length) return { tipo: "convoca", setta: st.id, luogo: posti[0], ora: 2 + Math.floor(Math.random() * 2) };
  }
  if (!st || i._invCiclo === o.ciclo) return null;
  i._invCiclo = o.ciclo;
  const presi = new Set((o.inviti || []).filter((x) => x.setta === st.id).map((x) => x.a));
  const scelte = o.players.filter((q) => q.id !== i.id && !st.membri.includes(q.id) && !presi.has(q.id) && !q.settaFondata && !(q.sette || []).length && !q.eliminato);
  if (!scelte.length) return null;
  // preferisce chi ha soldi sporchi: e' gia' dei loro
  const q = scelte.sort((a, b) => (b.sporchi || 0) - (a.sporchi || 0))[0];
  const regalo = st.tesoro > 3.2e6 ? 5e5 : st.tesoro >= 2e6 ? 2e5 : 0;
  return { tipo: "invita_setta", setta: st.id, invitato: q.id, offerta: regalo };
}

// Le Grandi Opere: ogni carattere vota a modo suo, e dice perché nella chat della setta
const VOTO_OPERA = {
  Spavaldo: { amnistia: 1, porto: 1, colpo: 1, giudice: 0.6, isola: 1 },
  Furbo: { amnistia: 0.6, porto: 1, colpo: 0.7, giudice: 0.7, isola: 1 },
  Esperto: { amnistia: 0.6, porto: 0.7, colpo: 0.5, giudice: 1, isola: 0.8 },
  Investitore: { amnistia: 0.4, porto: 0.7, colpo: 0.2, giudice: 0.5, isola: 1 },
  Costruttore: { amnistia: 0.5, porto: 0.6, colpo: 0.3, giudice: 0.6, isola: 0.9 },
  Legale: { amnistia: 0.3, porto: 0.2, colpo: 0, giudice: 0.9, isola: 0.3 },
};
const MOTIVO_SI = { amnistia: "Una fedina pulita fa comodo a tutti.", porto: "Il Porto senza pattuglie è oro.", colpo: "Quarantacinque milioni. Ci sto.", giudice: "Un giudice amico vale più di mille avvocati.", isola: "Soldi ogni Alba, per sempre." };
const MOTIVO_NO = { amnistia: "Troppo rumore per niente: la Procura ci guarderà.", porto: "Al Porto non ci lavoro, sono soldi buttati.", colpo: "Troppo rischioso: se va male finiamo tutti Indagati.", giudice: "Costa troppo per una protezione che forse non serve.", isola: "Costa una fortuna, e i blitz della Finanza fanno paura." };
function votoBot(o, i, n) {
  for (const id of i.sette || []) {
    const st = (o.sette || []).find((x) => x.id === id);
    if (!st || !st.opera || st.gm === i.id || st.opera.voti[i.id] !== undefined) continue;
    const k = st.opera.id; let v = (VOTO_OPERA[n] || VOTO_OPERA.Esperto)[k] ?? 0.5;
    if (k === "amnistia" && ((i.condanne || 0) > 0 || (i.stato || 0) >= 2 || i.faro > 0)) v += 0.5; // chi ha la polizia addosso vuole l'amnistia
    if (k === "colpo" && (i.stato || 0) >= 2) v -= 0.3; // gia' Indagato: un colpo fallito lo rovina
    const si = v >= 0.5;
    return { tipo: "vota_opera", setta: st.id, si, motivo: si ? MOTIVO_SI[k] : MOTIVO_NO[k] };
  }
  return null;
}
// il Gran Maestro bot propone una Grande Opera quando il Tesoro lo permette (e tiene un cuscinetto)
const GUSTO_OPERA = { Spavaldo: ["colpo", "porto", "isola", "amnistia", "giudice"], Furbo: ["porto", "isola", "colpo", "amnistia", "giudice"], Esperto: ["giudice", "isola", "amnistia", "porto", "colpo"] };
function operaBot(o, i, n, L) {
  const st = (o.sette || []).find((x) => x.gm === i.id);
  if (!st || st.opera || !L || !L.OPERE || i._operaCiclo === o.ciclo) return null;
  i._operaCiclo = o.ciclo;
  const lv = L.livelloSetta(o, st);
  for (const k of GUSTO_OPERA[n] || ["isola", "giudice", "porto", "amnistia", "colpo"]) {
    const O = L.OPERE[k]; if ((st.opereFatte || []).includes(k) || lv < O.lv) continue;
    if (k === "amnistia" && !st.membri.some((id) => { const m = o.players.find((x) => x.id === id); return m && ((m.condanne || 0) > 0 || m.stato >= 2); })) continue;
    if (st.tesoro >= L.costoOpera(st, k) + 1e6) return { tipo: "proponi_opera", setta: st.id, opera: k };
  }
  return null;
}
// la Lavanderia della setta: i bot sporchi ci passano un po' di soldi a ogni Ciclo
function lavaBot(o, i, n, L) {
  if (!L || i.faro > 0 || i._lavaCiclo === o.ciclo || !["Furbo", "Spavaldo", "Esperto"].includes(n)) return null;
  i._lavaCiclo = o.ciclo;
  const st = (o.sette || []).find((x) => (i.sette || []).includes(x.id)); if (!st) return null;
  const max = 1e6 * L.livelloSetta(o, st), q = Math.floor(Math.min(max, i.sporchi * 0.4, st.tesoro / 0.7) / 1e5) * 1e5;
  return q >= 2e5 && i.sporchi > 2e6 ? { tipo: "lava_setta", setta: st.id, importo: q } : null;
}
// Di notte: fondare la setta e, col livello 2, reclutare al Faro
// convocazione: i membri ci vanno e aspettano, il Gran Maestro celebra il rito quando arriva qualcuno
function convocazioneBot(o, i, L, s) {
  for (const id of i.sette || []) {
    const st = (o.sette || []).find((x) => x.id === id), c = st && st.convocazione;
    if (!c || c.ciclo !== o.ciclo || c.fatto || o.notte.ora > c.ora + 2) continue;
    if (s !== c.luogo) { if (L.luogoAperto(o, c.luogo, i)) return { tipo: "vai", luogo: c.luogo }; continue; }
    if (st.gm === i.id && o.notte.ora >= c.ora) { const qui = o.players.filter((q) => q.id !== i.id && st.membri.includes(q.id) && o.notte.dove[q.id] === c.luogo && !o.notte.viaggio[q.id] && !o.notteFatti[q.id]); if (qui.length) return { tipo: "rito", setta: st.id }; }
    return { tipo: "aspetta" };
  }
  return null;
}
function settaNotteBot(o, i, e, L, s) {
  if (!i.settaFondata && !(i.sette || []).length && ["Spavaldo", "Furbo", "Esperto"].includes(e) && i.sporchi >= L.N.settaSporchi && o.ciclo >= 2 && i._fondaCiclo !== o.ciclo) {
    i._fondaCiclo = o.ciclo;
    if (Math.random() < 0.6) { const usati = (o.sette || []).map((x) => x.nome); const nm = NOMI_SETTA.find((x) => !usati.includes(x[0])) || ["La Setta di " + i.nome, ""]; return { tipo: "fonda_setta", nome: nm[0], motto: nm[1] }; }
  }
  const st = (o.sette || []).find((x) => x.gm === i.id);
  if (st && i._recCiclo !== o.ciclo) {
    const lvS = L.livelloSetta(o, st);
    const chi = !st.banchiere && st.tesoro >= 3e6 ? "banchiere" : lvS >= 2 && !st.commissario && st.tesoro >= 4.5e6 ? "commissario" : lvS >= 2 && !st.giudice && st.tesoro >= 6e6 ? "giudice" : null;
    if (chi) { if (s !== "faro") return { tipo: "vai", luogo: "faro" }; i._recCiclo = o.ciclo; return { tipo: "recluta", setta: st.id, chi }; }
  }
  return null;
}
// ---------------------------------------------------------------- Favori e ricatti (v74)
// Quanto vale un Favore per il bot. "deve" = il bot lo dovrebbe (allora alcuni Favori non li promette mai: Infinity).
const PESO_FAVORE = { Spavaldo: 0.7, Furbo: 1, Esperto: 1, Investitore: 1.2, Costruttore: 1.2, Legale: 1.5 };
function valoreFavore(o, i, n, tipo, altro, deve, L) {
  const chi = deve ? i : altro; // chi lo dovrebbe
  if (tipo === "voto") return deve && (i.fama || 0) >= 40 && (o.candidati[altro.id] !== undefined || (altro.fama || 0) >= 25) ? Infinity : 3e5;
  if (tipo === "passo") { const mx = L.propri(o, chi).concat(o.lotti.filter((l) => l.owner === chi.id && l.serie === "Moli")).reduce((a, l) => Math.max(a, L.affitto(o, l) || 0), 0); return Math.max(2e5, mx / 2); }
  if (tipo === "silenzio") { if (deve && n === "Legale") return Infinity; const k = ((deve ? i : altro).prove || []).filter((x) => x.su === (deve ? altro : i).id).length; return k ? 15e5 * k : 2e5; }
  if (tipo === "mano") return deve && (i.stato || 0) >= 2 ? Infinity : 25e4;
  return Infinity;
}
// un patto con un Favore: il bot fa i conti (soldi che riceve, soldi che paga, terreno che passa di mano)
function rispostaPattoBot(o, i, n, k, L) {
  const no = { tipo: "rispondi_contratto", id: k.id, si: !1 };
  if (!k.favore || !L || !L.FAVORI) return no;
  const da = o.players.find((x) => x.id === k.da); if (!da) return no;
  let riceve = (k.chiPagaOra === "da" ? k.pagoOra : 0) + (k.chiPagaDopo === "da" ? k.pagoDopo : 0);
  let paga = (k.chiPagaOra === "a" ? k.pagoOra : 0) + (k.chiPagaDopo === "a" ? k.pagoDopo : 0);
  if (k.lottoCeduto) { const l = o.lotti.find((x) => x.id === k.lottoCeduto); if (!l) return no; if (l.owner === i.id) paga += l.prezzo; else riceve += l.prezzo; }
  const meta = k.tipo === "notarile" ? Math.round(0.02 * (k.pagoOra + k.pagoDopo) / 2) : 0;
  if (i.cash < (k.chiPagaOra === "a" ? k.pagoOra : 0) + meta + 1e5) return no;
  const botDeve = k.favore.deve === "a";
  if (L.motivoNoFavore(o, botDeve ? i.id : da.id, botDeve ? da.id : i.id, k.favore.tipo)) return no;
  const v = valoreFavore(o, i, n, k.favore.tipo, da, botDeve, L);
  if (!isFinite(v)) return no;
  const ok = botDeve ? riceve - paga >= v * (PESO_FAVORE[n] || 1) : paga - riceve <= v * 0.8;
  return { tipo: "rispondi_contratto", id: k.id, si: !!ok };
}
// il bot ricattato: pari se puo', se no accetta (o confessa se e' pulito, o lo Spavaldo a volte rifiuta)
function rispostaRicattoBot(o, i, n, r, L) {
  if ((i.prove || []).some((x) => x.su === r.da)) return { tipo: "rispondi_ricatto", id: r.id, scelta: "pari" };
  const puo = !L.motivoNoFavore(o, i.id, r.da, r.tipo);
  let scelta;
  if ((i.stato || 0) >= 2 || (i.tracce || 0) > 40) scelta = "accetto";
  else if ((i.tracce || 0) < 15 && !(i.stato || 0)) scelta = "confesso";
  else scelta = n === "Spavaldo" && Math.random() < 0.3 ? "rifiuto" : "accetto";
  if (scelta === "accetto" && !puo) scelta = "rifiuto";
  return { tipo: "rispondi_ricatto", id: r.id, scelta };
}
// il bot usa i Favori che ha in mano. "giorno" = e' il suo turno, prima dei dadi.
function usaFavoriBot(o, i, n, L, inizioTurno) {
  const miei = (o.favori || []).filter((f) => f.a === i.id && f.stato === "aperto");
  if (!miei.length) return null;
  const tent = o.ciclo * 100 + o.giorno * 10 + (o.fase === "notte" ? 9 : 0);
  i._favTent = i._favTent && i._favTent.t === tent ? i._favTent : { t: tent, id: {} };
  const prova = (f, a) => { if (i._favTent.id[f.id]) return null; i._favTent.id[f.id] = !0; return a; };
  for (const f of miei) {
    const deve = o.players.find((x) => x.id === f.deve); if (!deve || deve.fallito) continue;
    const scadeOra = f.scade - 1 <= o.ciclo;
    if (f.tipo === "voto" && o.candidati && o.candidati[i.id] !== undefined) { const a = prova(f, { tipo: "favore_usa", id: f.id }); if (a) return a; }
    if (f.tipo === "silenzio" && ((i.stato || 0) >= 2 || scadeOra)) { const a = prova(f, { tipo: "favore_usa", id: f.id }); if (a) return a; }
    if (f.tipo === "passo" && inizioTurno && o.fase === "giorno") {
      const suoi = o.lotti.filter((l) => l.owner === deve.id && l.giro === "o");
      const caro = suoi.sort((a, b) => (L.affitto(o, b) || 0) - (L.affitto(o, a) || 0))[0];
      const dist = caro ? (caro.idx - i.pos + L.CASELLE) % L.CASELLE : -1;
      if ((caro && dist >= 8 && dist <= 13) || scadeOra) { const a = prova(f, { tipo: "favore_usa", id: f.id }); if (a) return a; }
    }
    if (f.tipo === "mano" && o.fase === "giorno") {
      const st = (o.sette || []).find((x) => x.gm === i.id && x.membri.includes(deve.id) && x.convocazione && x.convocazione.ciclo === o.ciclo && !x.convocazione.fatto);
      if (st && !(deve.faro > 0) && L.luogoAperto(o, st.convocazione.luogo, deve)) { const a = prova(f, { tipo: "favore_usa", id: f.id, luogo: st.convocazione.luogo, ora: st.convocazione.ora }); if (a) return a; }
    }
  }
  return null;
}
// il bot e' al suo turno, di giorno: ricatta (Furbo, Spavaldo, Esperto) o denuncia il primo in classifica (gli altri)
function provaBot(o, i, n, L) {
  if (i._provaCiclo === o.ciclo || !(i.prove || []).length) return null;
  i._provaCiclo = o.ciclo;
  const silenzio = (id) => (o.favori || []).some((f) => f.tipo === "silenzio" && f.stato === "attivo" && f.deve === i.id && f.a === id);
  if (["Furbo", "Spavaldo", "Esperto"].includes(n)) {
    if ((o.ricatti || []).some((r) => r.da === i.id && r.stato === "attesa")) return null;
    for (let k = 0; k < i.prove.length; k++) {
      const pr = i.prove[k]; if (pr.rifiutata) continue;
      const b = o.players.find((x) => x.id === pr.su);
      if (!b || b.fallito || (b.stato || 0) < 1 || silenzio(b.id)) continue;
      if (o.principianti && !b.bot && o.ciclo < 3) continue;
      if (b.senzaParola != null && o.ciclo <= b.senzaParola) continue;
      const caro = o.lotti.some((l) => l.owner === b.id && (L.affitto(o, l) || 0) >= 3e5);
      const tipo = caro ? "passo" : o.candidati && o.candidati[i.id] !== undefined ? "voto" : "silenzio";
      if (L.motivoNoFavore(o, b.id, i.id, tipo)) continue;
      return { tipo: "ricatto", prova: k, favore: tipo };
    }
    return null;
  }
  // Legale, Costruttore, Investitore: mai ricatti. Denunciano, e solo il primo in classifica.
  const primo = o.players.filter((x) => !x.fallito).sort((a, b) => L.patrimonio(o, b, true) - L.patrimonio(o, a, true))[0];
  if (!primo || primo.id === i.id || silenzio(primo.id)) return null;
  const k = i.prove.findIndex((x) => x.su === primo.id);
  return k >= 0 ? { tipo: "denuncia", prova: k } : null;
}
// di notte: il bot che deve La Mano va all'appuntamento e aspetta
function manoBot(o, i, L, s) {
  const f = (o.favori || []).find((x) => x.tipo === "mano" && x.stato === "attivo" && x.deve === i.id && x.uso && x.uso.ciclo === o.ciclo && o.notte.ora <= x.uso.ora);
  if (!f) return null;
  if (s !== f.uso.luogo) return L.luogoAperto(o, f.uso.luogo, i) ? { tipo: "vai", luogo: f.uso.luogo } : null;
  return { tipo: "aspetta" };
}
// v75 — I Servizi dei contatti e la Fedina pulita. Di giorno, nel turno del bot.
// Prova ogni mossa una sola volta per turno (se il motore la rifiuta, non la ripete).
const SPORCHI_BOT = ["Furbo", "Spavaldo", "Esperto"];
function serviziFedinaBot(o, i, n, L) {
  if (i.faro > 0) return null;
  const tent = o.ciclo * 100 + o.giorno * 10 + o.turno;
  i._sf = i._sf && i._sf.t === tent ? i._sf : { t: tent, k: {} };
  const una = (k, a) => { if (!a || i._sf.k[k]) return null; i._sf.k[k] = !0; return a; };
  const C = L.CASELLE, rivali = o.players.filter((q) => q.id !== i.id && !q.fallito);
  const avanti = (da, a) => (a - da + C) % C;
  // il Sindaco toglie la transenna se e' sulla sua strada e lui ha la polizia vicina
  if (o.sindaco === i.id && o.transenna && o.transenna.da !== i.id && i.togliCiclo !== o.ciclo && (i.tracce || 0) > 25) {
    const d = avanti(i.pos, o.transenna.pos);
    if (d >= 1 && d <= 18) { const a = una("togli", { tipo: "togli_transenna" }); if (a) return a; }
  }
  // i Servizi: solo i bot sporchi, e solo con contatti tranquilli
  if (SPORCHI_BOT.includes(n)) {
    const c = i.corrotti || {}, libero = (k) => c[k] && c[k].sospetto == null && c[k].servizioCiclo !== o.ciclo;
    if (libero("commissario") && o.ciclo % 2 === 0 && !(o.ordineVargas && o.ordineVargas.ciclo === o.ciclo)) {
      const somma = {};
      for (const q of rivali) for (const [l, v] of Object.entries(q.calore || {})) if (l !== "palazzo") somma[l] = (somma[l] || 0) + v;
      const best = Object.entries(somma).sort((x, y) => y[1] - x[1])[0];
      const a = una("vargas", { tipo: "servizio", chi: "commissario", luogo: best && best[1] > 0 ? best[0] : "porto" }); if (a) return a;
    }
    if ((i.stato || 0) < 2 && o.transennaCiclo !== o.ciclo) {
      for (const k of Object.keys(c).filter((x) => x.startsWith("agente_") && libero(x) && o.ciclo - (c[x].dal || 0) >= 2)) {
        const isola = k.slice(7);
        const lotti = o.lotti.filter((l) => l.giro === "o" && l.tipoCasella === "lotto" && l.isola === isola && !o.players.some((q) => !q.fallito && !q.inner && q.pos === l.idx));
        for (const q of rivali.filter((q) => (q.stato || 0) >= 2 && !(q.faro > 0))) {
          const l = lotti.find((l) => { const d = avanti(q.pos, l.idx); return d === 10 || d === 11; });
          if (l) { const a = una("agente", { tipo: "servizio", chi: "agente", isola, pos: l.idx }); if (a) return a; }
        }
      }
    }
  }
  // la Fedina pulita
  const fed = i.fedina || 0;
  if (fed >= 6 && !i.operaFatta && i.cash > 6e6 && L.OPERE_PUBBLICHE) {
    const libere = L.ISOLE.filter((x) => !(o.opere || []).some((op) => op.isola === x));
    const conta = (x) => o.lotti.filter((l) => l.owner === i.id && l.isola === x).length;
    const isola = libere.sort((a, b) => conta(b) - conta(a))[0];
    if (isola) { const a = una("opera", { tipo: "opera_pubblica", isola, opera: ["teatro", "parco", "scuola"][o.ciclo % 3] }); if (a) return a; }
  }
  if (fed >= 4 || i.fascicolo) {
    const f = i.fascicolo;
    if (f && f.indizi.length && (f.indizi.length >= 2 || f.albe >= 3)) { const a = una("pubblica", { tipo: "inchiesta_pubblica" }); if (a) return a; }
    if (!f && fed >= 4) {
      const silenzio = (id) => (o.favori || []).some((x) => x.tipo === "silenzio" && x.stato === "attivo" && x.deve === i.id && x.a === id);
      const ok = rivali.filter((q) => !silenzio(q.id) && !((i.inchiestaBlocco || {})[q.id] > o.ciclo));
      let b = ok.filter((q) => (q.stato || 0) >= 1).sort((x, y) => (y.stato || 0) - (x.stato || 0))[0];
      if (!b) { const primo = ok.slice().sort((x, y) => L.patrimonio(o, y, !0) - L.patrimonio(o, x, !0))[0]; if (primo && (primo.tracce || 0) > 20) b = primo; }
      if (b) { const a = una("inchiesta", { tipo: "inchiesta_apri", bersaglio: b.id }); if (a) return a; }
    }
  }
  if (fed >= 2 && i.espostoCiclo !== o.ciclo && !(i.espostoStop != null && i.espostoStop >= o.ciclo) && !(o.esposto && o.esposto.ciclo === o.ciclo)) {
    const somma = {};
    for (const q of rivali) for (const [l, v] of Object.entries(q.calore || {})) if (l !== "palazzo" && l !== "faro") somma[l] = (somma[l] || 0) + v;
    const best = Object.entries(somma).sort((x, y) => y[1] - x[1])[0];
    if (best && best[1] >= 1) { const a = una("esposto", { tipo: "esposto", luogo: best[0] }); if (a) return a; }
  }
  return null;
}
// di notte: il doganiere (solo se il bot e' al Porto o all'Aeroporto)
function doganiereBot(o, i, n, L, dove) {
  if (!SPORCHI_BOT.includes(n) || (dove !== "porto" && dove !== "aeroporto")) return null;
  const c = (i.corrotti || {}).doganiere; if (!c || c.sospetto != null) return null;
  i._dog = i._dog && i._dog.ciclo === o.ciclo ? i._dog : { ciclo: o.ciclo, lista: !1, ris: !1 };
  if (c.servizioCiclo !== o.ciclo && !i._dog.lista) { i._dog.lista = !0; return { tipo: "servizio", chi: "doganiere" }; }
  const ar = i.arrivi;
  if (ar && ar.ciclo === o.ciclo && ar.riservato == null && ar.lista.length && !i._dog.ris) {
    i._dog.ris = !0;
    const val = (x) => { const O = L.OCCASIONI.find((y) => y.nome === x.nome); return O && O.guadagno ? O.guadagno[1] : 0; };
    const best = ar.lista.slice().sort((x, y) => val(y) - val(x))[0];
    return { tipo: "servizio", chi: "doganiere", n: best.n };
  }
  return null;
}
function grandiBot(o, i, n) {
    if (!o.grandi || !t.GRANDI || (i.livello || 0) < 4 || i.faro > 0) return null;
    const oggi = o.ciclo * 10 + o.giorno;
    if (i.botGrandi === oggi) return null;
    const segna = (a) => ((i.botGrandi = oggi), a);
    for (const k of t.ORDINE_GRANDI || ["tv"]) {
      const g = o.grandi[k], G = t.GRANDI[k];
      if (!g || !G) continue;
      if (g.stato === "asta") {
        if (g.offerte && void 0 !== g.offerte[i.id]) continue;
        const voglia = { Spavaldo: 1.5, Esperto: 1.3, Furbo: 1.3, Investitore: 1.2 }[n] || 1;
        const v = Math.round(Math.min(i.cash * 0.6, G.base * voglia * (0.9 + 0.4 * Math.random())));
        if (v >= G.base) return segna({ tipo: "offerta_grande", affare: k, importo: v });
        continue;
      }
      if (g.stato !== "attiva") continue;
      if (g.capo === i.id && (i.stato || 0) < 3) {
        if (k === "tv" && g.titoloneCiclo !== o.ciclo) {
          const riv = o.players.filter((p) => p.id !== i.id && !p.fallito).sort((a, b) => t.patrimonio(o, b, true) - t.patrimonio(o, a, true));
          const b = riv.find((p) => p.stato >= 1 || p.tracce > 25);
          return segna(b ? { tipo: "titolone", scelta: "scandalo", bersaglio: b.id } : { tipo: "titolone", scelta: "fama" });
        }
        if (k === "banca") {
          if (!g.tasso && g.tassoCiclo !== o.ciclo) return segna({ tipo: "tasso_banca", tasso: ["Spavaldo", "Furbo"].includes(n) ? 20 : 10 });
          const gia = g.riciclatoCiclo === o.ciclo ? g.riciclato || 0 : 0;
          if (["Spavaldo", "Furbo", "Esperto"].includes(n) && i.sporchi > 1e6 && gia === 0 && (i.calSoldi || 0) < 2) return segna({ tipo: "ricicla_banca", importo: Math.min(G.riciclaMax, Math.floor(i.sporchi / 1e5) * 1e5) });
        }
      }
      const gia = (g.quoteCiclo || {})[i.id] || 0, mie = (g.quote || {})[i.id] || 0;
      if (g.mercato > 0 && gia < G.maxQuoteCiclo && i.cash > g.prezzoQuota * 3) {
        const capoQ = g.capo ? g.quote[g.capo] || 0 : 0;
        const minaccia = g.capo === i.id && Object.entries(g.quote).some(([id, q]) => id !== i.id && q >= mie - 1);
        const attacco = g.capo !== i.id && ["Spavaldo", "Furbo", "Esperto"].includes(n) && Math.random() < 0.5 && capoQ - mie <= g.mercato;
        if (minaccia || attacco || Math.random() < 0.15) {
          const q = Math.min(G.maxQuoteCiclo - gia, g.mercato, minaccia || attacco ? 2 : 1);
          let c = 0; for (let x = 0; x < q; x++) c += Math.round(g.prezzoQuota * Math.pow(1.1, x));
          if (q > 0 && c < i.cash - 1e6) return segna({ tipo: "quote_grande", affare: k, n: q });
        }
      }
    }
    return null;
  }

  const n = {
    prossima: function (o, i) {
      const n = i.strat || "Legale";
      // Sette e mezzo: ogni carattere ha il suo coraggio
      const sm = o.manoSM && o.manoSM[i.id];
      if (sm) {
        const tot = sm.carte.reduce((a, c) => a + (c % 10 < 7 ? (c % 10) + 1 : 0.5), 0);
        if (sm.puoRilanciare && !sm.rilancio && sm.carte.length === 1 && i.cash + i.sporchi > sm.posta * 4 && ((tot >= 6 && "Legale" !== n) || ("Spavaldo" === n && Math.random() < 0.3))) return { tipo: "sm", mossa: "rilancia" };
        const soglia = { Spavaldo: 6, Furbo: 5.5, Esperto: 5.5, Investitore: 5, Costruttore: 5, Legale: 4.5 }[n] || 5;
        return { tipo: "sm", mossa: tot < soglia ? "carta" : "sto" };
      }
      if ("pacchetti" === o.fase) {
        if (o.players[o.sceltaPacchetti[0]].id !== i.id) return null;
        const t = {
          Legale: "commerciante",
          Costruttore: "costruttore",
          Investitore: "investitore",
          Furbo: "contrabbandiere",
          Spavaldo: "playboy",
          Esperto: "politico",
        }[n];
        return { tipo: "pacchetto", id: o.pacchettiDisponibili.includes(t) ? t : o.pacchettiDisponibili[0] };
      }
      if (o.pending && "asta" === o.pending.tipo && o.pending.partecipanti.includes(i.id) && void 0 === o.pending.offerte[i.id]) {
        const t = o.lotti.find((t) => t.id === o.pending.lotto),
          e = 0.7 + 0.5 * Math.random(),
          r = 3e5;
        { const v = Math.max(0, Math.min(i.cash - r, Math.round(t.prezzo * e))); return { tipo: "offerta", importo: o.pending.minimo && v < o.pending.minimo ? 0 : v }; }
      }
      const prop = (o.proposte || []).find((x) => x.a === i.id && "proposta" === x.stato);
      if (prop) {
        // trattare i terreni: il bot ragiona sul valore e su quante vie del gruppo ha, e dice il suo prezzo
        const l = o.lotti.find((x) => x.id === prop.lotto);
        const valore = l.prezzo * (1 + 0.6 * (l.lvl || 0));
        const arrot = (v) => Math.ceil(v / 10000) * 10000;
        const delGruppo = o.lotti.filter((x) => x.serie === l.serie && x.id !== l.id && x.owner === i.id).length;
        const gruppo = o.lotti.filter((x) => x.serie === l.serie).length;
        if (prop.compro) {
          // un altro vuole comprare un terreno del bot
          if (t.haSerie(o, i, l.serie) && l.serie !== "Moli") { const s3 = arrot(valore * 3); return prop.prezzo >= s3 ? { tipo: "rispondi_proposta", id: prop.id, si: !0 } : { tipo: "rispondi_proposta", id: prop.id, si: !1, motivo: "Ha tutto il gruppo di vie: lo venderebbe solo per almeno " + s3.toLocaleString("it-IT") + " €." }; }
          let soglia = valore * (delGruppo >= 1 ? 1.5 : 1.2) * ({ Spavaldo: 1.1, Costruttore: 1.15, Investitore: 0.95 }[n] || 1);
          if (i.cash < 3e5) soglia *= 0.85; // se e' a corto di soldi vende piu' volentieri
          soglia = arrot(soglia);
          return prop.prezzo >= soglia ? { tipo: "rispondi_proposta", id: prop.id, si: !0 } : { tipo: "rispondi_proposta", id: prop.id, si: !1, motivo: "Lo venderebbe per almeno " + soglia.toLocaleString("it-IT") + " €." };
        }
        // un altro vuole vendere un suo terreno al bot
        const completa = delGruppo === gruppo - 1;
        const massimo = arrot(valore * (completa ? 1.8 : delGruppo >= 1 ? 1.25 : 1.0));
        if (i.cash - prop.prezzo < 3e5) return { tipo: "rispondi_proposta", id: prop.id, si: !1, motivo: "Adesso non ha abbastanza soldi." };
        return prop.prezzo <= massimo ? { tipo: "rispondi_proposta", id: prop.id, si: !0 } : { tipo: "rispondi_proposta", id: prop.id, si: !1, motivo: "Al massimo pagherebbe " + massimo.toLocaleString("it-IT") + " €." };
      }
      const a = o.inviti.find((o) => o.a === i.id);
      if (a) return rispostaInvito(o, i, n, a);
      { const vo = votoBot(o, i, n); if (vo) return vo; }
      const LF = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null);
      { const rc = (o.ricatti || []).find((x) => x.a === i.id && x.stato === "attesa"); if (rc && LF && LF.FAVORI) return rispostaRicattoBot(o, i, n, rc, LF); }
      const s = o.contratti.find((o) => o.a === i.id && "proposto" === o.stato);
      if (s) return s.favore ? rispostaPattoBot(o, i, n, s, LF) : { tipo: "rispondi_contratto", id: s.id, si: !1 };
      // patto sulla parola scaduto: il bot paga sempre, se ha i soldi (v76)
      if (LF && LF.restoPatto && o.fase !== "pacchetti" && !o.fine) {
        const k = (o.contratti || []).find((x) => x.stato === "scaduto" && x.tipo !== "notarile" && (x.chiPagaDopo === "da" ? x.da : x.a) === i.id && LF.restoPatto(x) > 0 && i.cash >= LF.restoPatto(x));
        if (k) return { tipo: "paga_patto", id: k.id };
      }
      // messo alla prova anche se era fedele: 1 volta su 3 se ne va dalla setta (v76)
      if (i.provato && i._provatoVisto !== i.provato.setta + ":" + i.provato.ciclo) {
        i._provatoVisto = i.provato.setta + ":" + i.provato.ciclo;
        const st = (o.sette || []).find((x) => x.id === i.provato.setta && x.membri.includes(i.id) && x.gm !== i.id);
        if (st && Math.random() < 1 / 3) return { tipo: "lascia_setta", setta: st.id };
      }
      if (LF && LF.FAVORI && o.fase !== "pacchetti" && !o.fine && !(o.fase === "notte" && (o.notteFatti[i.id] || (o.notte && o.notte.viaggio[i.id])))) { const fu = usaFavoriBot(o, i, n, LF, o.fase === "giorno" && t.corrente(o).id === i.id && !i.haTirato && !o.pending); if (fu) return fu; }
      if ("giorno" === o.fase) {
        if (t.corrente(o).id !== i.id) return null;
        const r = o.pending;
        if (r && r.giocatore === i.id) {
          if ("compra" === r.tipo) {
            const t = o.lotti.find((o) => o.id === r.lotto);
            return { tipo: "compra", si: i.cash - t.prezzo > ("Investitore" === n ? 4e5 : 2e5) };
          }
          if ("gala" === r.tipo) return { tipo: "gala", importo: i.cash > 3e6 ? 3e5 : 0 };
          if ("casino_reale" === r.tipo) return { tipo: "casino_reale", importo: 0 };
          if ("chiamata" === r.tipo)
            return { tipo: "chiamata", si: !["Legale", "Costruttore", "Investitore"].includes(n) && i.stato < 2, telefono: !0 };
          if ("municipio" === r.tipo)
            return { tipo: "municipio", scelta: i.fama >= 40 && i.cash > 3e6 && void 0 === o.candidati[i.id] ? "candidati" : "nulla" };
        }
        if (r) return null;
        { const gr = grandiBot(o, i, n); if (gr) return gr; }
        { const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null); const iv = invitoBot(o, i, LL); if (iv) return iv; const op = operaBot(o, i, n, LL); if (op) return op; const lv = lavaBot(o, i, n, LL); if (lv) return lv; }
        if (LF && LF.FAVORI && !i.haTirato) { const pv = provaBot(o, i, n, LF); if (pv) return pv; }
        if (LF && LF.SERVIZI) { const sf = serviziFedinaBot(o, i, n, LF); if (sf) return sf; }
        { const sosp = Object.keys(i.corrotti || {}).find((k) => i.corrotti[k].sospetto && i.stato >= 1);
          if (sosp) return { tipo: "scarica_contatto", chiave: sosp }; }
        if (!i.haTirato) {
          // viaggio rapido (v76): costa carburante e la mossa del giorno, una volta ogni 2 Cicli: solo verso un terreno libero o suo
          if (!i.doppi && t.destinazioniRapide && (t.motivoNoRapido ? !t.motivoNoRapido(o, i) : i.rapidoCiclo !== o.ciclo) && Math.random() < 0.3) {
            const ds = t.destinazioniRapide(o, i).filter((d) => i.cash - d.costo > 1.5e6 && d.mezzo !== "taxi");
            const buone = ds.filter((d) => { const l = o.lotti.find((x) => x.idx === d.idx); return !l.owner || l.owner === i.id; });
            const d = buone[Math.floor(Math.random() * buone.length)];
            if (d) return { tipo: "viaggio_rapido", idx: d.idx };
          }
          return { tipo: "tira" };
        }
        if (!i.agenziaUsata && 0 === i.faro && t.isolaDiPos) {
          // Agenzia immobiliare: compra il terreno libero piu' economico dell'isola se resta un cuscinetto
          const isola = (t.casella(o, i) || {}).isola || t.isolaDiPos(i.pos);
          const liberi = o.lotti.filter((l) => null == l.owner && l.isola === isola && ("lotto" === l.tipoCasella || "molo" === l.tipoCasella))
            .sort((a, b) => a.prezzo - b.prezzo);
          if (liberi.length && i.cash - t.prezzoAgenzia(o, i, liberi[0]) > 4e5) return { tipo: "agenzia", lotto: liberi[0].id };
        }
        if (!i.azioneGiornoFatta && 0 === i.faro) {
          const r = (function (o, i, r) {
            const n = 100 * o.ciclo + 10 * o.giorno + o.turno,
              a = t.propri(o, i).find((o) => o.negato);
            if (a && ["Furbo", "Spavaldo", "Esperto"].includes(r) && i.cash + i.sporchi > 6e5)
              return { tipo: "regalo_assessore", lotto: a.id };
            if (i.permessoTurno === n) return null;
            if (t.propri(o, i).some((o) => o.permesso && !o.cantiere)) return null;
            const s = e(o, i, !1);
            if (!s) return null;
            // il Timbro falso (v76): lo usa solo se il permesso e' a rischio (rimandato) o costoso
            if ((i.valigetta || []).some((x) => x.id === "timbro")) {
              const inf = t.infoPermesso ? t.infoPermesso(o, i, s.l) : null;
              const g2 = inf && (inf.sicuro || !!inf.rinvio); // partite nuove: permesso sicuro col bollo, o rimandato per un motivo
              const usa = g2 ? !!inf.rinvio || inf.bollo >= 250000 : s.l.prezzo >= 4e5; // partite vecchie: il permesso e' sempre a rischio
              if (usa) return { tipo: "permesso", lotto: s.l.id, timbro: !0 };
            }
            return { tipo: "permesso", lotto: s.l.id };
          })(o, i, n);
          if (r) return r;
          const a = (function (o, t, i) {
            const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null);
            const poss = LL.stanzePossibili(o, t).filter((x) => x.ok && t.cash > x.costo * 1.6);
            if (poss.some((x) => x.id === "casino_privato") && ["Costruttore", "Spavaldo", "Furbo"].includes(i) && Math.random() < 0.4) return { tipo: "stanza", stanza: "casino_privato" };
            if (poss.length && Math.random() < 0.3) {
              const f = [t.veicoli.length ? "garage" : null, "ristorante_panoramico", t.sporchi > 3e6 ? "caveau" : null, "suite"].filter(Boolean).find((x) => poss.some((y) => y.id === x));
              if (f) return { tipo: "stanza", stanza: f };
            }
            // con tanti contanti fermi chiunque costruisce piani: si ripagano in pochi Cicli
            if (("Costruttore" === i ? t.cash > 15e5 && Math.random() < 0.6 : t.cash > 8e6 || (t.cash > 4e6 && Math.random() < 0.15)) && LL.condizioniPalazzo(o, t).ok) {
              const q = t.piani >= 6 && t.cash > 2 * LL.costoPiani(t, 3) ? 3 : t.piani >= 6 && t.cash > 2 * LL.costoPiani(t, 2) ? 2 : 1;
              if (LL.costoPiani(t, q) + (t.piani ? 0 : 3e5) < t.cash) return { tipo: "piano", quanti: q };
            }
            const r = e(o, t, !0),
              n = r ? { tipo: "costruisci", lotto: r.l.id, attivita: 0 === r.l.lvl ? r.tipo : void 0 } : null;
            return (
              n ||
              (t.cash > 12e6 && !t.veicoli.includes("jet")
                ? { tipo: "veicolo", veicolo: "jet" }
                : t.cash > 4e6 && !t.veicoli.includes("yacht")
                  ? { tipo: "veicolo", veicolo: "yacht" }
                  : null)
            );
          })(o, i, n);
          if (a) return a;
        }
        return "Investitore" === n && i.cash > 15e5 && !i._investito
          ? ((i._investito = !0), { tipo: "investi", cosa: "borsa", nome: "SoleTech", importo: Math.round(0.6 * (i.cash - 8e5)) })
          : i.debito > 0 && i.cash > i.debito + 5e5
            ? { tipo: "restituisci", importo: i.debito }
            : ((i._investito = !1), { tipo: "fine_turno" });
      }
      return "notte" === o.fase
        ? (function (o, i, e) {
            const n = o.notte;
            if (!n) return null;
            const prop = (n.proposte || []).find((x) => x.a === i.id && x.stato === "attesa");
            if (prop) return { tipo: "rispondi_incontro", id: prop.id, si: prop.tipo === "drink" ? Math.random() < 0.8 : i.cash > prop.importo * 6 && Math.random() < 0.6 };
            if (o.notteFatti[i.id] || i.faro > 0) return null;
            if (n.pronto && n.pronto[i.id]) return null;
            if (n.chiuso[i.id] || n.viaggio[i.id]) return { tipo: "avanti" };
            const a = t.livelloSblocco(o, i),
              s = n.dove[i.id],
              c = n.ora;
            (i._n && i._n.ciclo === o.ciclo) || (i._n = { ciclo: o.ciclo, visti: [], ric: !1, corr: !1, aspettato: 0 });
            const l = i._n;
            { const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null); if (LL && LL.FAVORI) { const mb = manoBot(o, i, LL, s); if (mb) return mb; } }
            if (n.serate && n.serate[i.id]) return c >= 5 ? { tipo: "torna_a_casa" } : { tipo: "aspetta" }; // chi ospita resta a casa
            { const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null); if (LL && LL.SERVIZI) { const dg = doganiereBot(o, i, e, LL, s); if (dg) return dg; } }
            // v75: con un esposto in giro il Furbo e l'Esperto 1 volta su 2 restano a casa; sotto inchiesta saltano gli affari
            if (l.casa === void 0) l.casa = ["Furbo", "Esperto"].includes(e) && ((o.esposto && o.esposto.ciclo === o.ciclo && Math.random() < 0.5) || i.sottoInchiesta === o.ciclo);
            { const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null); const cv = convocazioneBot(o, i, LL, s); if (cv) return cv; }
            // se una persona vera e' nello stesso posto, a volte il bot si fa avanti
            if (s !== "palazzo" && !l.proposto && !n.chiuso[i.id] && !n.viaggio[i.id]) {
              const umano = o.players.find((x) => !x.bot && x.id !== i.id && !o.notteFatti[x.id] && x.faro === 0 && !n.viaggio[x.id] && n.dove[x.id] === s);
              if (umano && Math.random() < 0.35) { l.proposto = !0; return ["Spavaldo", "Furbo", "Esperto"].includes(e) && i.cash + i.sporchi > 1e6 ? { tipo: "incontro", a: umano.id, cosa: "sfida", importo: 1e5 } : { tipo: "incontro", a: umano.id, cosa: "drink" }; }
            }
            // le serate nei casino' privati degli altri
            const osp = n.ospite && n.ospite[i.id];
            if (osp) { if (!l.giocato && i.cash > 1e6) { l.giocato = !0; return { tipo: "gioca_serata", importo: 1e5 }; } return c >= 4 ? { tipo: "torna_a_casa" } : { tipo: "aspetta" }; }
            const ser = Object.keys(n.serate || {}).find((h) => h !== i.id);
            if (ser && !l.serata && i.cash > 3e6 && Math.random() < 0.35) { l.serata = !0; return { tipo: "vai_serata", host: ser }; }
            { const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null); if (!l.setta) { const sn = settaNotteBot(o, i, e, LL, s); if (sn) { if (sn.tipo === "fonda_setta" || sn.tipo === "recluta") l.setta = !0; return sn; } } }
            l.visti.includes(s) || l.visti.push(s);
            // prima si ripuliscono i soldi sporchi: tenerli a fine partita vale poco e una confisca li porta via
            // ripulisce solo quanto i suoi locali possono giustificare, se no la Finanza se ne accorge
            const giustificabili = Math.max(5e5, 2 * t.propri(o, i).reduce((a, x) => a + t.rendita(o, x), 0));
            if ("casino" === s && !l.ric && i.sporchi > 3e5)
              return ((l.ric = !0), { tipo: "ricicla", metodo: t.copertura(o, i) - (i.copUsata || 0) > 0 ? "copertura" : "shadow", importo: Math.min(i.sporchi, giustificabili) });
            if (i.sporchi > 15e5 && !l.ric && c < 5 && "casino" !== s && t.luogoAperto(o, "casino", i)) return { tipo: "vai", luogo: "casino" };
            const u = t.occasioniVisibili(o, i).map((o) => ({ ...o, O: t.OCCASIONI.find((t) => t.id === o.id) })),
              p = i.cash + i.sporchi,
              // i furbi si fermano appena la polizia li osserva; lo spavaldo solo quando e' indagato
              // chi e' gia' molto ricco rischia piu' di quanto guadagna stanotte: lo spavaldo no, lui rischia sempre
              d = ["Legale", "Costruttore", "Investitore"].includes(e) || 0 === a || l.casa || i.stato >= ("Spavaldo" === e ? 2 : 1) || (i.arresti >= 2 && i.stato >= 1) || ("Spavaldo" !== e && t.patrimonio(o, i, !1) > 4e7) || ("Spavaldo" !== e && o.resaAnnunciata),
              f = u.find((o) => o.O.legale && i.cash > 6e5);
            if (f) return { tipo: "occasione", n: f.n, oggetti: [] };
            if (d)
              return "palazzo" !== s || l.uscito
                ? { tipo: "torna_a_casa" }
                : ((l.uscito = !0), { tipo: "vai", luogo: Math.random() < 0.5 ? "club" : "marina" });
            const g = t.postiValigetta(o, i),
              h = t.postiUsati ? t.postiUsati(i) : (i.valigetta || []).length,
              v =
                "mercato" === s
                  ? ["maschera", "Furbo" !== e && a >= 2 ? "disturbatore" : null, "telefono"].filter(Boolean)
                  : "porto" === s
                    ? ["furgone"]
                    : "marina" === s
                      ? ["motoscafo"]
                      : "club" === s && "Esperto" === e
                        ? ["macchina"]
                        : [];
            for (const o of v) if (!r(i, o) && h < g && p > t.OGGETTI[o].prezzo + 4e5) return { tipo: "compra_oggetto", oggetto: o };
            // strumenti del banco di stanotte: il bot ne compra uno se ha spazio e soldi (lo Spavaldo e il Furbo di piu')
            if (n.banco && n.banco[s] && n.banco[s].length && !l["banco" + s] && Math.random() < ("Spavaldo" === e || "Furbo" === e ? 0.7 : 0.35)) {
              l["banco" + s] = !0;
              const b = n.banco[s].map((x) => [x, t.STRUMENTI[x]]).filter(([x, O]) => !O.legale && h + (O.posti || 1) <= g && p > t.prezzoOggetto(o, x) + 5e5)[0];
              if (b) return { tipo: "compra_oggetto", oggetto: b[0] };
            }
            const m = u
              .filter((o) => !o.O.legale && p > (o.O.costo || 0) + 2e5 && ((i.calore || {})[s] || 0) < ("Spavaldo" === e ? 2 : 1))
              .sort((o, t) => (t.O.guadagno ? t.O.guadagno[1] : 0) - (o.O.guadagno ? o.O.guadagno[1] : 0))[0];
            if (m && ("Furbo" !== e || !n.racconto[i.id].slice(-1)[0].includes("sbirri"))) {
              const o = (i.valigetta || [])
                .map((o) => o.id)
                .filter((o) => (t.oggettoDef(o).salva || []).some((o) => m.O.pericoli.includes(o)) || "telefono" === o || (t.oggettoDef(o).eff || []).some((e) => (!e.luoghi || e.luoghi.includes(m.luogo)) && (!e.occ || e.occ.includes(m.id))));
              return { tipo: "occasione", n: m.n, oggetti: o };
            }
            if ("casino" === s && !l.ric && i.sporchi > 3e5)
              return ((l.ric = !0), { tipo: "ricicla", metodo: t.copertura(o, i) > 0 ? "copertura" : "shadow", importo: i.sporchi });
            if ("aeroporto" === s && ["Furbo", "Esperto"].includes(e) && !l.dog && !i.corrotti.doganiere && i.cash > 1.2e6)
              return ((l.dog = !0), { tipo: "corrompi", chi: "doganiere", isola: null });
            if ("club" === s && "Esperto" === e && !l.corr && !i.corrotti.agente_Sole && i.cash > 15e5)
              return ((l.corr = !0), { tipo: "corrompi", chi: "agente", isola: "Sole" });
            if (c >= 5) return { tipo: "torna_a_casa" };
            const b = o.notte.occasioni.find((o) => o.riservata === i.id && !o.preso && o.alle > c + 1);
            if (b && s !== b.luogo) return { tipo: "vai", luogo: b.luogo };
            if (i.sporchi > 6e5 && t.luogoAperto(o, "casino", i) && !l.ric && "casino" !== s) return { tipo: "vai", luogo: "casino" };
            if (!r(i, "maschera") && t.luogoAperto(o, "mercato", i) && !l.visti.includes("mercato") && "mercato" !== s)
              return { tipo: "vai", luogo: "mercato" };
            const z = ["porto", "marina", "bisca", "villa", "club"].filter(
              (x) => t.luogoAperto(o, x, i) && !l.visti.includes(x) && x !== s && ("villa" !== x || "Furbo" !== e),
            );
            if (z.length) return { tipo: "vai", luogo: z[Math.floor(Math.random() * z.length)] };
            if (l.aspettato < 1) return (l.aspettato++, { tipo: "aspetta" });
            return { tipo: "torna_a_casa" };
          })(o, i, n)
        : null;
    },
    // I giocatori-computer giocano finche' non tocca a una persona. L'UNICA copia di questo giro:
    // la usano il server (server/index.ts) e la partita locale (locale.js).
    //   opz.finche(stato): ci si ferma quando torna vero (es. "appena cala la notte") · opz.max: numero massimo di mosse
    // Ritorna { mosse, errori }: errori = errori veri del codice (NON le mosse rifiutate), da scrivere nei log.
    // Regole: al bot si chiede la mossa UNA volta sola (prossima() ricorda cosa ha gia' deciso, chiederla due volte la cambia);
    // la mossa si applica con applicaSicura (se e' rifiutata lo stato torna com'era), poi si prova la via d'uscita piu' semplice.
    gioca: function (stato, opz) {
      const applica = t.applicaSicura || t.applica, max = (opz && opz.max) || 3000, finche = opz && opz.finche;
      const esito = { mosse: 0, errori: [] };
      const segna = (e, bot, azione) => { if (!e || !e.gioco) esito.errori.push({ bot: bot.nome, azione: azione, messaggio: String((e && e.message) || e), ciclo: stato.ciclo + 1, fase: stato.fase }); };
      for (let k = 0; k < max && !stato.fine && !(finche && finche(stato)); k++) {
        let bot = null, azione = null;
        for (const p of stato.players) if (p.bot) { const x = n.prossima(stato, p); if (x) { bot = p; azione = x; break; } }
        if (!bot) break;
        try { applica(stato, bot.id, azione); esito.mosse++; }
        catch (e) {
          segna(e, bot, azione);
          try {
            const io = stato.players.find((x) => x.id === bot.id), pd = stato.pending; // dopo un rifiuto lo stato e' stato rimesso com'era: si rilegge
            if (stato.fase === "notte") applica(stato, io.id, { tipo: "pronto" });
            else if (pd && pd.tipo === "asta") applica(stato, io.id, { tipo: "offerta", importo: 0 });
            else if (pd && pd.giocatore === io.id) applica(stato, io.id, { tipo: pd.tipo, si: false, importo: 0 });
            else applica(stato, io.id, io.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" });
            esito.mosse++;
          } catch (e2) { segna(e2, bot, { tipo: "via d'uscita" }); break; }
        }
      }
      return esito;
    },
    STRATEGIE: ["Legale", "Costruttore", "Investitore", "Furbo", "Spavaldo", "Esperto"],
  };
  "undefined" != typeof module && module.exports ? (module.exports = n) : (o.LagunaBot = n);
})("undefined" != typeof globalThis ? globalThis : this);
