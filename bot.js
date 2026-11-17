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
            const casinoOk = (o.licenze || []).includes(t.id) && !(t.funzioniPiani || []).includes("casino_privato");
            if (t.piani > 0 && casinoOk && ["Costruttore", "Spavaldo", "Furbo"].includes(i) && t.cash > 15e5 && Math.random() < 0.4) return { tipo: "piano", funzione: "casino_privato" };
            if ("Costruttore" === i && t.cash > 25e5 && Math.random() < 0.3 && (t.piani > 0 || o.lotti.filter((l) => l.owner === t.id && l.lvl >= 1).length >= 2)) return { tipo: "piano", funzione: "appartamenti" };
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
