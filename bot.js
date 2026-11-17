!(function (o) {
  "use strict";
  const t = o.Laguna || ("undefined" != typeof require ? require("./motore.js") : null);
  function i(o, i) {
    const e = t.ATTIVITA;
    return (
      (
        {
          Legale: ["hotel", "ristorante", "uffici", "boutique", "residenze"],
          Costruttore: ["residenze", "hotel", "ristorante"],
          Investitore: ["uffici", "agenzia", "hotel", "residenze"],
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
  const n = {
    prossima: function (o, i) {
      const n = i.strat || "Legale";
      if ("pacchetti" === o.fase) {
        if (o.players[o.sceltaPacchetti[0]].id !== i.id) return null;
        const t = {
          Legale: "commerciante",
          Costruttore: "costruttore",
          Investitore: "investitore",
          Furbo: "contrabbandiere",
          Spavaldo: "playboy",
          Esperto: "contrabbandiere",
        }[n];
        return { tipo: "pacchetto", id: o.pacchettiDisponibili.includes(t) ? t : o.pacchettiDisponibili[0] };
      }
      if (o.pending && "asta" === o.pending.tipo && o.pending.partecipanti.includes(i.id) && void 0 === o.pending.offerte[i.id]) {
        const t = o.lotti.find((t) => t.id === o.pending.lotto),
          e = 0.7 + 0.5 * Math.random(),
          r = 3e5;
        return { tipo: "offerta", importo: Math.max(0, Math.min(i.cash - r, Math.round(t.prezzo * e))) };
      }
      const prop = (o.proposte || []).find((x) => x.a === i.id && "proposta" === x.stato);
      if (prop) {
        const l = o.lotti.find((x) => x.id === prop.lotto);
        const valore = l.prezzo * (1 + 0.6 * (l.lvl || 0));
        let si;
        if (prop.compro) si = prop.prezzo >= valore * 1.5 && !t.haSerie(o, i, l.serie);
        else {
          const completa = o.lotti.filter((x) => x.serie === l.serie && x.id !== l.id).every((x) => x.owner === i.id);
          si = i.cash - prop.prezzo > 3e5 && (completa ? prop.prezzo <= valore * 1.8 : prop.prezzo <= valore * 0.9);
        }
        return { tipo: "rispondi_proposta", id: prop.id, si };
      }
      const a = o.inviti.find((o) => o.a === i.id);
      if (a)
        return {
          tipo: "rispondi_invito",
          setta: a.setta,
          si: "Legale" !== n,
        };
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
        if (!i.haTirato) return { tipo: "tira" };
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
            if ("Costruttore" === i && t.cash > 12e5 && Math.random() < 0.5) return { tipo: "piano", funzione: "appartamenti" };
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
            if (!n || o.notteFatti[i.id] || i.faro > 0) return null;
            if (n.pronto && n.pronto[i.id]) return null;
            if (n.chiuso[i.id] || n.viaggio[i.id]) return { tipo: "avanti" };
            const a = t.livelloSblocco(o),
              s = n.dove[i.id],
              c = n.ora;
            (i._n && i._n.ciclo === o.ciclo) || (i._n = { ciclo: o.ciclo, visti: [], ric: !1, corr: !1, aspettato: 0 });
            const l = i._n;
            l.visti.includes(s) || l.visti.push(s);
            const u = t.occasioniVisibili(o, i).map((o) => ({ ...o, O: t.OCCASIONI.find((t) => t.id === o.id) })),
              p = i.cash + i.sporchi,
              d = ["Legale", "Costruttore", "Investitore"].includes(e) || 0 === a || (i.stato >= 3 && "Spavaldo" !== e),
              f = u.find((o) => o.O.legale && i.cash > 6e5);
            if (f) return { tipo: "occasione", n: f.n, oggetti: [] };
            if (d)
              return "palazzo" !== s || l.uscito
                ? { tipo: "torna_a_casa" }
                : ((l.uscito = !0), { tipo: "vai", luogo: Math.random() < 0.5 ? "club" : "marina" });
            const g = t.postiValigetta(o),
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
              .filter((o) => !o.O.legale && p > (o.O.costo || 0) + 2e5)
              .sort((o, t) => (t.O.guadagno ? t.O.guadagno[1] : 0) - (o.O.guadagno ? o.O.guadagno[1] : 0))[0];
            if (m && ("Furbo" !== e || !n.racconto[i.id].slice(-1)[0].includes("sbirri"))) {
              const o = (i.valigetta || [])
                .map((o) => o.id)
                .filter((o) => (t.OGGETTI[o].salva || []).some((o) => m.O.pericoli.includes(o)) || "telefono" === o);
              return { tipo: "occasione", n: m.n, oggetti: o };
            }
            if ("casino" === s && !l.ric && i.sporchi > 3e5)
              return ((l.ric = !0), { tipo: "ricicla", metodo: t.copertura(o, i) > 0 ? "copertura" : "shadow", importo: i.sporchi });
            if ("club" === s && "Esperto" === e && !l.corr && !i.corrotti.agente_Sole && i.cash > 15e5)
              return ((l.corr = !0), { tipo: "corrompi", chi: "agente", isola: "Sole" });
            if (c >= 5) return { tipo: "torna_a_casa" };
            const b = o.notte.occasioni.find((o) => o.riservata === i.id && !o.preso && o.alle > c + 1);
            if (b && s !== b.luogo) return { tipo: "vai", luogo: b.luogo };
            if (i.sporchi > 6e5 && t.luogoAperto(o, "casino") && !l.ric && "casino" !== s) return { tipo: "vai", luogo: "casino" };
            if (!r(i, "maschera") && t.luogoAperto(o, "mercato") && !l.visti.includes("mercato") && "mercato" !== s)
              return { tipo: "vai", luogo: "mercato" };
            const z = ["porto", "marina", "bisca", "villa", "club"].filter(
              (i) => t.luogoAperto(o, i) && !l.visti.includes(i) && i !== s && ("villa" !== i || "Furbo" !== e),
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
