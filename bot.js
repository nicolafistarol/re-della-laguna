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
    if (mia && mia.membri.length > 1 && mia.tesoro >= 3e6 && Math.random() < 0.15) { const m = mia.membri.filter((x) => x !== i.id); return { tipo: "prova_fedelta", setta: mia.id, membro: m[Math.floor(Math.random() * m.length)] }; }
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
  if (st && !(st.pngReclutati > 0) && L.livelloSetta(o, st) >= 2 && st.tesoro >= 3e6) {
    if (s !== "faro") return { tipo: "vai", luogo: "faro" };
    return { tipo: "recluta", setta: st.id, chi: "banchiere" };
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
      const s = o.contratti.find((o) => o.a === i.id && "proposto" === o.stato);
      if (s) return { tipo: "rispondi_contratto", id: s.id, si: !1 };
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
        { const LL = globalThis.Laguna || (typeof require !== "undefined" ? require("./motore.js") : null); const iv = invitoBot(o, i, LL); if (iv) return iv; }
        { const sosp = Object.keys(i.corrotti || {}).find((k) => i.corrotti[k].sospetto && i.stato >= 1);
          if (sosp) return { tipo: "scarica_contatto", chiave: sosp }; }
        if (!i.haTirato) {
          if (!i.doppi && i.rapidoCiclo !== o.ciclo && t.destinazioniRapide && Math.random() < 0.3) {
            const ds = t.destinazioniRapide(o, i).filter((d) => i.cash - d.costo > 3e5);
            const buone = ds.filter((d) => { const l = o.lotti.find((x) => x.idx === d.idx); return !l.owner || l.owner === i.id; });
            const d = (buone.length ? buone : ds)[Math.floor(Math.random() * (buone.length ? buone.length : ds.length))];
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
            return s ? { tipo: "permesso", lotto: s.l.id } : null;
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
            if (n.serate && n.serate[i.id]) return c >= 5 ? { tipo: "torna_a_casa" } : { tipo: "aspetta" }; // chi ospita resta a casa
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
              d = ["Legale", "Costruttore", "Investitore"].includes(e) || 0 === a || i.stato >= ("Spavaldo" === e ? 2 : 1) || (i.arresti >= 2 && i.stato >= 1) || ("Spavaldo" !== e && t.patrimonio(o, i, !1) > 4e7) || ("Spavaldo" !== e && o.resaAnnunciata),
              f = u.find((o) => o.O.legale && i.cash > 6e5);
            if (f) return { tipo: "occasione", n: f.n, oggetti: [] };
            if (d)
              return "palazzo" !== s || l.uscito
                ? { tipo: "torna_a_casa" }
                : ((l.uscito = !0), { tipo: "vai", luogo: Math.random() < 0.5 ? "club" : "marina" });
            const g = t.postiValigetta(o, i),
              h = (i.valigetta || []).length,
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
            const m = u
              .filter((o) => !o.O.legale && p > (o.O.costo || 0) + 2e5 && ((i.calore || {})[s] || 0) < ("Spavaldo" === e ? 2 : 1))
              .sort((o, t) => (t.O.guadagno ? t.O.guadagno[1] : 0) - (o.O.guadagno ? o.O.guadagno[1] : 0))[0];
            if (m && ("Furbo" !== e || !n.racconto[i.id].slice(-1)[0].includes("sbirri"))) {
              const o = (i.valigetta || [])
                .map((o) => o.id)
                .filter((o) => (t.OGGETTI[o].salva || []).some((o) => m.O.pericoli.includes(o)) || "telefono" === o);
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
    STRATEGIE: ["Legale", "Costruttore", "Investitore", "Furbo", "Spavaldo", "Esperto"],
  };
  "undefined" != typeof module && module.exports ? (module.exports = n) : (o.LagunaBot = n);
})("undefined" != typeof globalThis ? globalThis : this);
