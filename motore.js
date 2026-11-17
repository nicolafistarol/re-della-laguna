/* =====================================================================
   RE DELLA LAGUNA — motore delle regole
   ---------------------------------------------------------------------
   Un solo file con tutto il regolamento. Funziona:
   - nel browser (versione di prova, index.html)
   - in Node (prove automatiche, test.js)
   - nel server Supabase (funzione "azione"), cosi' le regole sono uguali per tutti.
   Lo stato della partita e' un semplice oggetto JSON: si puo' salvare e ricaricare.
   Tutte le azioni passano da applica(stato, idGiocatore, azione).
   ===================================================================== */
(function (root) {
  "use strict";

  // ------------------------------------------------------------ numeri del gioco
  const N = {
    cicli: 8, giorni: 4,
    cashStart: 1_000_000, stipendio: 400_000, tassa: 0.20,
    affVuoto: 0.15, affLvl: [1, 1, 4, 12, 26, 45], rendLvl: [0, 1, 2.2, 3.6, 5.2, 7.0],
    costLvl: [0, 0.5, 0.5, 0.75, 1.0, 1.5], R: 0.75,
    moloFee: [0, 25_000, 50_000, 100_000, 200_000],
    pianoCost: 400_000, pianoGrow: 1.08, pianoRend: 0.62, pianiMax: 60,
    bonusIllegale: 1.4, // gli affari della notte rendono il 40% in piu': tanto premio, tanto rischio
    borsaMu: 0.21, borsaSd: 0.16, criptoMu: 0.40, criptoSd: 0.50, criptoCrash: 0.12,
    caricoBase: 350_000, caricoGrow: 150_000, caricoMax: 3_000_000, caricoMagazzino: 1.5,
    profittoBase: 0.65, tracceAffare: 10, coltoBase: 0.012, affariNotte: 2,
    intens: { prudente: [1.0, 0.5], normale: [1.4, 1.0], spavaldo: [2.0, 3.0] },
    ricCopPerdita: 0.15, ricCopTracce: 0.4, shadowPerdita: 0.25, shadowTracce: 0.6,
    evasioneMax: 0.30,
    indagineK: 100, scendi: 0.35, decayPulito: 0.20, decaySporco: 0.05,
    prot: { agente: 0.30, commissario: 0.50, max: 0.70 },
    corruz: { agente: [250_000, 125_000], commissario: [1_000_000, 500_000], banchiere: [750_000, 375_000] },
    pentito: 0.04,
    prestitoQuota: 0.30, prestitoInt: 0.10, emergenzaInt: 0.25, ipotecaQuota: 0.5,
    candidatura: 750_000, stipendioSindaco: 750_000,
    settaPatrimonio: 8_000_000, settaFama: 20, settaLivelli: [0, 3_000_000, 8_000_000, 20_000_000], decima: 0.15,
    fasce: [[6e6, "Benestante"], [12e6, "Ricco"], [20e6, "Milionario"], [30e6, "Magnate"], [Infinity, "Sovrano"]],
    mosse: {
      nascosto: { nome: "Posto nascosto", tracce: 0.60, colto: 0.70, carico: 0.9, costo: 0 },
      maschera: { nome: "Maschera", tracce: 1, colto: 0.70, carico: 1, costo: 50_000 },
      alibi: { nome: "Alibi a una festa", tracce: 0.70, colto: 1, carico: 1, costo: 60_000 },
      disturbatore: { nome: "Disturbatore", tracce: 1, colto: 1, carico: 1, costo: 75_000 },
    },
    veicoli: {
      motoscafo: { nome: "Motoscafo", prezzo: 300_000, rend: 0.10, fama: 2 },
      supercar: { nome: "Supercar", prezzo: 650_000, rend: 0.08, fama: 4 },
      yacht: { nome: "Yacht", prezzo: 2_000_000, rend: 0.18, fama: 6 },
      elicottero: { nome: "Elicottero", prezzo: 2_500_000, rend: 0.14, fama: 6 },
      megayacht: { nome: "Megayacht", prezzo: 6_000_000, rend: 0.20, fama: 12 },
      jet: { nome: "Jet privato", prezzo: 9_000_000, rend: 0.18, fama: 15 },
    },
  };

  // Tipi di attivita': rendita (x R), affitto (x), copertura (quota prezzo x livello), attenzione
  const ATTIVITA = {
    residenze: { nome: "Residenze", gruppo: "residenze", r: 0.45, a: 2.0, c: 0, att: 0, isole: null },
    ristorante: { nome: "Ristorante", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Ambra", "Palma", "Corona"] },
    hotel: { nome: "Hotel di lusso", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Palma", "Flamingo", "Corona"], lusso: true },
    boutique: { nome: "Boutique di lusso", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Flamingo", "Corona"], lusso: true },
    uffici: { nome: "Uffici e hub tech", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Sole", "Corona"] },
    yachtclub: { nome: "Yacht club", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Palma"] },
    agenzia: { nome: "Agenzia immobiliare", gruppo: "servizi", r: 0.6, a: 0.8, c: 0, att: 0, isole: null },
    legale: { nome: "Studio legale", gruppo: "servizi", r: 0.6, a: 0.8, c: 0, att: 0, isole: ["Corona", "Sole"] },
    lavanderia: { nome: "Lavanderia", gruppo: "copertura", r: 0.6, a: 0.8, c: 0.8, att: 1, isole: ["Ambra", "Sole"] },
    galleria: { nome: "Galleria d'arte", gruppo: "copertura", r: 0.6, a: 0.8, c: 0.8, att: 1, isole: ["Flamingo", "Corona"] },
    magazzino: { nome: "Magazzino portuale", gruppo: "copertura", r: 0.6, a: 0.8, c: 0.8, att: 1, isole: ["Sole", "Ambra"] },
    discoteca: { nome: "Discoteca", gruppo: "notte", r: 1.25, a: 1.0, c: 0.5, att: 2, isole: ["Flamingo", "Palma"], lusso: true },
    beachclub: { nome: "Beach club", gruppo: "notte", r: 1.25, a: 1.0, c: 0.5, att: 2, isole: ["Palma"] },
    casino: { nome: "Casinò", gruppo: "rischio", r: 1.6, a: 1.2, c: 1.2, att: 4, isole: ["Flamingo", "Corona"], licenza: true, lusso: true },
    bancaprivata: { nome: "Banca privata", gruppo: "rischio", r: 1.6, a: 1.2, c: 1.2, att: 3, isole: ["Corona"], serie: true },
  };

  const AFFARI = {
    contrabbando: { nome: "Contrabbando", profitto: 0.65, tracce: 10, gravita: "media", descr: "Compri un carico al porto e lo rivendi." },
    ricettazione: { nome: "Ricettazione", profitto: 0.40, tracce: 6, gravita: "media", descr: "Compri merce rubata a poco e la rivendi." },
    bisca: { nome: "Bisca clandestina", profitto: 0.90, tracce: 8, gravita: "lieve", descr: "Serve una tua discoteca o un tuo casinò.", richiede: ["notte", "rischio"] },
    falsi: { nome: "Falsi d'autore", profitto: 1.0, tracce: 14, gravita: "grave", descr: "Serve una tua galleria d'arte.", richiede: ["galleria"] },
    colpo: { nome: "Il Colpo", profitto: 2.5, tracce: 30, gravita: "gravissima", descr: "Furto al caveau. Serve una setta di livello 3." },
  };

  const PACCHETTI = [
    { id: "commerciante", nome: "Il Commerciante", lotti: [["Via delle Onde", "ristorante"], ["Golf delle Palme", "ristorante"]], extra: { cash: 300_000 } },
    { id: "costruttore", nome: "Il Costruttore", lotti: [["Vicolo dei Pescatori", "residenze"], ["Via dei Cantieri", "residenze"]], extra: { piani: 2 } },
    { id: "investitore", nome: "L'Investitore", lotti: [["Via delle Spezie", "agenzia"], ["Corso Industria", "agenzia"]], extra: { azioni: 250_000 } },
    { id: "playboy", nome: "Il Playboy", lotti: [["Viale Neon", "discoteca"], ["Lungomare Cocco", "beachclub"]], extra: { veicolo: "motoscafo", fama: 25 } },
    { id: "contrabbandiere", nome: "Il Contrabbandiere", lotti: [["Piazzetta Ambra", "lavanderia"], ["Darsena Container", "magazzino"]], extra: { reputazione: 20 } },
    { id: "politico", nome: "Il Politico", lotti: [["Baia Turchese", "hotel"], ["Flamingo Drive", "boutique"]], extra: { fama: 30, cash: 100_000 } },
    { id: "ereditiera", nome: "L'Ereditiera", lotti: [["Viale dei Resort", "hotel"], ["Villa Rosa", "galleria"]], extra: { cash: 200_000 } },
    { id: "speculatore", nome: "Lo Speculatore", lotti: [["Via delle Lanterne", "lavanderia"], ["Viale Solare", "uffici"]], extra: { cripto: 250_000 } },
  ];


  const AZIENDE = ["Corona Bank", "Laguna Energy", "Flamingo Luxury", "SoleTech", "Palma Resorts", "Marina Shipping"];
  const MONETE = ["LagunaCoin", "FlamingoToken", "ShadowCoin"];

  // Il tabellone: un unico giro da 80 caselle che entra in tutte e 5 le isole.
  // Ogni isola ha 16 caselle: un ponte (o ingresso), 3 gruppi di vie da 3, un molo, un'Agenzia, Gazzette e luoghi speciali.
  const OUTER = [
    // Borgo Ambra (0-15)
    ["Ponte Sud — Partenza", "angolo"], ["Vicolo del Mercato", "Spezie", "Ambra", 60], ["Via delle Spezie", "Spezie", "Ambra", 70],
    ["Gazzetta", "gazzetta"], ["Piazzetta Ambra", "Spezie", "Ambra", 80], ["Molo Ambra", "Moli", "Ambra", 150],
    ["Vicolo dei Pescatori", "Lanterne", "Ambra", 100], ["Mercato Nero", "speciale"], ["Via delle Lanterne", "Lanterne", "Ambra", 110],
    ["Scalinata dei Gatti", "Lanterne", "Ambra", 120], ["Agenzia di Borgo Ambra", "agenzia"],
    ["Corte dei Mosaici", "Terracotta", "Ambra", 140], ["Via dei Vasai", "Terracotta", "Ambra", 150], ["Gazzetta", "gazzetta"],
    ["Piazza del Campanile", "Terracotta", "Ambra", 170], ["Bisca del Vicolo", "speciale"],
    // Costa Palma (16-31)
    ["Ponte Ovest — Il Faro", "angolo"], ["Lungomare Cocco", "Sabbia", "Palma", 190], ["Via delle Onde", "Sabbia", "Palma", 200],
    ["Gazzetta", "gazzetta"], ["Spiaggia dei Gabbiani", "Sabbia", "Palma", 220], ["Molo Palma", "Moli", "Palma", 150],
    ["Baia Turchese", "Corallo", "Palma", 240], ["Spiaggia VIP", "speciale"], ["Viale dei Resort", "Corallo", "Palma", 260],
    ["Punta Palma", "Corallo", "Palma", 280], ["Agenzia di Costa Palma", "agenzia"],
    ["Sentiero delle Palme", "Giungla", "Palma", 300], ["Belvedere delle Palme", "Giungla", "Palma", 310], ["Gazzetta", "gazzetta"],
    ["Golf delle Palme", "Giungla", "Palma", 330], ["Ponte Nord", "libero"],
    // Isola Corona (32-47)
    ["Ingresso di Isola Corona", "angolo"], ["Viale dei Diamanti", "Oro", "Corona", 900], ["Galleria Imperiale", "Oro", "Corona", 950],
    ["La Borsa", "speciale"], ["Piazza Corona", "Oro", "Corona", 1000], ["Il Municipio", "speciale"],
    ["Corso della Borsa", "Platino", "Corona", 1200], ["Banca Centrale", "speciale"], ["Skyline Avenue", "Platino", "Corona", 1300],
    ["Piazza dei Re", "Platino", "Corona", 1400], ["Gazzetta", "gazzetta"], ["Casinò Reale", "speciale"],
    ["Torre Sovrana", "Diamante", "Corona", 1600], ["Corona Tower", "Diamante", "Corona", 1800],
    ["Agenzia di Isola Corona", "agenzia"], ["Attico del Re", "Diamante", "Corona", 2000],
    // Baia Flamingo (48-63)
    ["Pontile Flamingo", "libero"], ["Viale Neon", "Neon", "Flamingo", 360], ["Flamingo Drive", "Neon", "Flamingo", 380],
    ["Gazzetta", "gazzetta"], ["Via delle Orchidee", "Neon", "Flamingo", 400], ["Molo Flamingo", "Moli", "Flamingo", 150],
    ["Ocean Boulevard", "Velluto", "Flamingo", 440], ["Gala Flamingo", "speciale"], ["Villa Rosa", "Velluto", "Flamingo", 460],
    ["Belvedere Flamingo", "Velluto", "Flamingo", 480], ["Agenzia di Baia Flamingo", "agenzia"],
    ["Passeggiata Rosa", "Perla", "Flamingo", 500], ["Piazza dei Fenicotteri", "Perla", "Flamingo", 520], ["Gazzetta", "gazzetta"],
    ["Lungolago delle Ninfee", "Perla", "Flamingo", 550], ["Spiaggia Libera", "libero"],
    // Distretto Sole (64-79)
    ["Ponte Est — Posto di blocco", "angolo"], ["Via dei Cantieri", "Acciaio", "Sole", 580], ["Corso Industria", "Acciaio", "Sole", 600],
    ["Gazzetta", "gazzetta"], ["Viale Solare", "Acciaio", "Sole", 640], ["Molo Sole", "Moli", "Sole", 150],
    ["Darsena Container", "Vetro", "Sole", 680], ["Porto Container", "speciale"], ["Piazza dell'Innovazione", "Vetro", "Sole", 720],
    ["Torre del Sole", "Vetro", "Sole", 760], ["Agenzia del Distretto Sole", "agenzia"],
    ["Viale dei Pannelli", "Rame", "Sole", 800], ["Hub delle Gru", "Rame", "Sole", 820], ["Gazzetta", "gazzetta"],
    ["Lungomare Solare", "Rame", "Sole", 850], ["Rampa del Ponte Sud", "libero"],
  ];
  const CASELLE = OUTER.length; // 80
  const SEZIONE = 16;
  const ORDINE_ISOLE = ["Ambra", "Palma", "Corona", "Flamingo", "Sole"];
  const POS_FARO = 16;
  function isolaDiPos(pos) { return ORDINE_ISOLE[Math.floor((((pos % CASELLE) + CASELLE) % CASELLE) / SEZIONE)]; }
  const ISOLE = ["Ambra", "Palma", "Flamingo", "Sole", "Corona"];
  const NOMI_ISOLE = { Ambra: "Borgo Ambra", Palma: "Costa Palma", Flamingo: "Baia Flamingo", Sole: "Distretto Sole", Corona: "Isola Corona" };
  const STATI = ["Tranquillo", "Voci", "Osservato", "Indagato", "Processo"];
  const PENE = {
    lieve: { faro: 0, multa: 0.05, attivita: null, blocco: 0, fama: 5 },
    media: { faro: 2, multa: 0.10, attivita: "chiusa", blocco: 1, fama: 10 },
    grave: { faro: 4, multa: 0.20, attivita: "confisca", blocco: 2, fama: 30 },
    gravissima: { faro: 6, multa: 0.35, attivita: "confisca+", blocco: 2, fama: 50 },
  };
  const ORDINE_GRAVITA = [null, "lieve", "media", "grave", "gravissima"];
  const LEGGI = {
    tassa_lusso: { nome: "Tassa sul lusso", descr: "+10% sul prezzo di yacht, elicotteri e jet." },
    amnistia: { nome: "Amnistia", descr: "Tracce -30% a tutti." },
    giro_cripto: { nome: "Giro di vite sulle cripto", descr: "ShadowCoin bloccata per un Ciclo." },
    zona_franca: { nome: "Zona franca", descr: "Niente tasse a Distretto Sole." },
    polizia_doppia: { nome: "Polizia raddoppiata", descr: "Tracce che contano il doppio in un'isola." },
    condono: { nome: "Condono edilizio", descr: "Il prossimo livello costa la metà per tutti." },
  };

  // ------------------------------------------------------------ utilita'
  function rng(s) { // mulberry32 con stato salvato nella partita
    let t = (s.rngState = (s.rngState + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gauss(s, mu, sd) {
    const u = Math.max(1e-9, rng(s)), v = rng(s);
    return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function dado(s) { return 1 + Math.floor(rng(s) * 6); }
  function euro(n) { return Math.round(n).toLocaleString("it-IT") + " €"; }
  function round(n) { return Math.round(n); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function err(msg) { const e = new Error(msg); e.gioco = true; throw e; }
  function peggio(a, b) { return ORDINE_GRAVITA.indexOf(a) >= ORDINE_GRAVITA.indexOf(b) ? a : b; }

  function giocatore(s, id) { const p = s.players.find((x) => x.id === id); if (!p) err("Giocatore non trovato."); return p; }
  function lotto(s, id) { const l = s.lotti.find((x) => x.id === id); if (!l) err("Lotto non trovato."); return l; }
  function propri(s, p) { return s.lotti.filter((l) => l.owner === p.id && l.serie !== "Moli"); }
  function moliDi(s, p) { return s.lotti.filter((l) => l.owner === p.id && l.serie === "Moli"); }
  function serieLotti(s, serie) { return s.lotti.filter((l) => l.serie === serie); }
  function haSerie(s, p, serie) { return serieLotti(s, serie).every((l) => l.owner === p.id); }
  function vmult(s, isola) { return 0.5 + 0.1 * s.valore[isola]; }
  function corrente(s) { return s.players[s.ordine[s.turno]]; }

  function valoreLotto(l) {
    let v = l.prezzo;
    for (let k = 1; k <= l.lvl; k++) v += N.costLvl[k] * l.prezzo;
    return v;
  }
  function valorePalazzo(p) { let v = 0; for (let i = 0; i < p.piani; i++) v += N.pianoCost * Math.pow(N.pianoGrow, i); return v; }
  function valoreInvestimenti(s, p) {
    let v = 0;
    for (const a of AZIENDE) v += (p.azioni[a] || 0) * s.borsa[a];
    for (const m of MONETE) v += (p.cripto[m] || 0) * s.cripto[m];
    for (const v2 of p.veicoli) v += N.veicoli[v2].prezzo * 0.8;
    return v;
  }
  function patrimonio(s, p, conSporchi) {
    let v = p.cash + valoreInvestimenti(s, p) + valorePalazzo(p) - p.debito;
    for (const l of s.lotti) if (l.owner === p.id) v += valoreLotto(l) - (l.ipoteca || 0);
    if (conSporchi) v += 0.5 * p.sporchi;
    return v;
  }
  function fascia(s, p) { const v = patrimonio(s, p, false); return N.fasce.find((f) => v < f[0])[1]; }

  function affitto(s, l) {
    if (l.chiuso > 0 || l.owner == null || l.cantiere) return 0;
    const owner = giocatore(s, l.owner);
    if (owner.faro > 0 && l.lvl === 0) return 0;
    const base = N.affVuoto * l.prezzo;
    if (l.lvl === 0) return round(base * (haSerie(s, owner, l.serie) ? 2 : 1) * vmult(s, l.isola));
    const t = ATTIVITA[l.tipo];
    return round(base * t.a * N.affLvl[l.lvl] * vmult(s, l.isola));
  }
  function rendita(s, l) {
    if (!l.tipo || l.lvl === 0 || l.chiuso > 0 || l.cantiere) return 0;
    const t = ATTIVITA[l.tipo];
    let r = N.R * t.r * N.rendLvl[l.lvl] * l.prezzo * vmult(s, l.isola);
    if (l.ipoteca) r *= 0.5;
    return round(r);
  }
  function copertura(s, p) {
    let c = 0;
    for (const l of propri(s, p)) if (l.tipo && !l.chiuso) c += ATTIVITA[l.tipo].c * l.prezzo * l.lvl;
    for (const f of p.funzioniPiani) if (f === "casino_privato") c += 400_000;
    return round(c);
  }

  function log(s, testo, chi) { s.log.push({ c: s.ciclo + 1, g: s.giorno + 1, testo, chi: chi ?? null }); if (s.log.length > 400) s.log.shift(); }
  function notizia(s, testo, tipo) { s.gazzetta.push({ ciclo: s.ciclo + 1, testo, tipo: tipo || "notizia" }); if (s.gazzetta.length > 120) s.gazzetta.shift(); }
  // Ogni passaggio di soldi viene scritto qui con il motivo.
  // pubblico = lo vedono tutti (affitti, aste, stipendi...); privato = solo chi paga e chi riceve.
  function flusso(s, da, a, importo, motivo, pubblico) {
    importo = round(importo); if (!importo) return;
    s.flussi = s.flussi || [];
    s.flussi.push({ n: (s.nFlussi = (s.nFlussi || 0) + 1), c: s.ciclo + 1, g: s.giorno + 1, da: da ? da.id : null, a: a ? a.id : null, importo, motivo, pubblico: !!pubblico });
    if (s.flussi.length > 160) s.flussi.shift();
  }
  function privato(s, p, testo) { p.messaggi.push({ ciclo: s.ciclo + 1, testo }); if (p.messaggi.length > 60) p.messaggi.shift(); }

  // ------------------------------------------------------------ nuova partita
  function nuovaPartita(opz) {
    const seed = (opz.seed ?? Math.floor(Math.random() * 1e9)) >>> 0;
    const s = {
      versione: 1, seed, rngState: seed, ciclo: 0, giorno: 0, fase: "pacchetti", turno: 0,
      ordine: [], players: [], lotti: [], valore: {}, borsa: {}, cripto: {}, sette: [], contratti: [], inviti: [],
      gazzetta: [], log: [], sindaco: null, candidati: {}, leggi: [], tassa: N.tassa, licenze: [],
      pending: null, notteFatti: {}, prossimoId: 1, principianti: !!opz.principianti, fine: false,
      cicli: [6, 8, 10].includes(opz.cicli) ? opz.cicli : N.cicli, flussi: [], proposte: [],
    };
    OUTER.forEach((c, i) => s.lotti.push(cella(s, c, "o", i)));
    for (const i of ISOLE) s.valore[i] = 5;
    for (const a of AZIENDE) s.borsa[a] = 100;
    for (const m of MONETE) s.cripto[m] = 10;
    opz.giocatori.forEach((g, i) => {
      s.players.push({
        id: "g" + (i + 1), nome: g.nome, bot: !!g.bot, strat: g.strat || null, colore: g.colore || COLORI[i % COLORI.length],
        cash: N.cashStart, sporchi: 0, azioni: {}, cripto: {}, veicoli: [], pos: 0, inner: false, ipos: 0,
        tracce: 0, stato: 0, condanne: 0, faro: 0, blocco: 0, corrotti: {}, fama: 10, reputazione: 0, affariOk: 0,
        piani: 0, funzioniPiani: [], debito: 0, prestiti: [], pacchetto: null, prove: [], pulitoCiclo: true,
        peggiorReato: null, riciclTot: 0, evasione: 0, fallito: false, messaggi: [], arresti: 0, mosseNotte: 0,
        dadi: null, azioneGiornoFatta: false, haTirato: false, doppi: 0, sette: [], ombraCicli: 0, valigetta: [],
      });
    });
    // ordine dei turni con i dadi
    s.ordine = s.players.map((_, i) => i).sort(() => rng(s) - 0.5);
    // scelta dei pacchetti: al contrario dell'ordine di gioco
    s.sceltaPacchetti = [...s.ordine].reverse();
    s.pacchettiDisponibili = PACCHETTI.slice(0, Math.max(6, s.players.length)).map((p) => p.id);
    log(s, "Partita creata. Ordine dei turni: " + s.ordine.map((i) => s.players[i].nome).join(", ") + ".");
    return s;
  }
  const COLORI = ["#e2557e", "#14a3a8", "#c9a24a", "#7a5cff", "#3fa34d", "#ff8a3d", "#2f6fe0", "#8a8a8a"];

  function cella(s, c, giro, i) {
    const id = giro + i;
    if (c.length === 2) return { id, giro, idx: i, nome: c[0], serie: null, tipoCasella: c[1], isola: null, prezzo: 0, owner: null, lvl: 0, tipo: null, chiuso: 0, ipoteca: 0 };
    return { id, giro, idx: i, nome: c[0], serie: c[1], tipoCasella: c[1] === "Moli" ? "molo" : "lotto", isola: c[2], prezzo: c[3] * 1000, owner: null, lvl: 0, tipo: null, chiuso: 0, ipoteca: 0 };
  }

  function scegliPacchetto(s, p, idPacchetto) {
    if (s.fase !== "pacchetti") err("Non è il momento di scegliere il pacchetto.");
    if (s.players[s.sceltaPacchetti[0]].id !== p.id) err("Non tocca a te scegliere.");
    if (!s.pacchettiDisponibili.includes(idPacchetto)) err("Pacchetto non disponibile.");
    const pk = PACCHETTI.find((x) => x.id === idPacchetto);
    for (const [nome, tipo] of pk.lotti) {
      const l = s.lotti.find((x) => x.nome === nome);
      l.owner = p.id; l.lvl = 1; l.tipo = tipo;
    }
    const e = pk.extra;
    if (e.cash) p.cash += e.cash;
    if (e.piani) p.piani = e.piani, p.funzioniPiani = ["appartamenti", "appartamenti"];
    if (e.azioni) { for (const a of ["SoleTech", "Corona Bank"]) p.azioni[a] = (e.azioni / 2) / s.borsa[a]; }
    if (e.cripto) p.cripto.FlamingoToken = e.cripto / s.cripto.FlamingoToken;
    if (e.veicolo) p.veicoli.push(e.veicolo);
    if (e.fama) p.fama = e.fama;
    if (e.reputazione) p.reputazione = e.reputazione;
    if (pk.id === "playboy") p.cerchie = ["yacht"];
    p.pacchetto = pk.id;
    s.pacchettiDisponibili = s.pacchettiDisponibili.filter((x) => x !== idPacchetto);
    s.sceltaPacchetti.shift();
    log(s, p.nome + " sceglie il pacchetto " + pk.nome + ".", p.id);
    if (s.sceltaPacchetti.length === 0) {
      s.fase = "giorno"; s.turno = 0;
      notizia(s, "Si apre la stagione degli affari nella Laguna. Che vinca il più furbo.", "evento");
      iniziaTurno(s);
    }
  }

  // ------------------------------------------------------------ giorno
  function iniziaTurno(s) {
    const p = corrente(s);
    p.haTirato = false; p.azioneGiornoFatta = false; p.doppi = 0; p.dadi = null; p.agenziaUsata = false; p.agenziaSconto = false; p.municipioOggi = false;
    s.pending = null;
    if (p.faro > 0) {
      p.faro -= 1;
      log(s, p.nome + " è al Faro (ancora " + p.faro + " turni). Ha diritto a una telefonata.", p.id);
      p.haTirato = true; // non si muove; puo' fare 1 azione
    } else chiamataLampo(s, p);
  }

  function tira(s, p) {
    if (s.fase !== "giorno") err("Si tirano i dadi solo di giorno.");
    if (corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (p.haTirato) err("Hai già tirato i dadi.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    // tre dadi: si va avanti della somma; un tris (tre uguali) fa ritirare
    const d = [dado(s), dado(s), dado(s)], n = d[0] + d[1] + d[2];
    p.dadi = d;
    const tris = d[0] === d[1] && d[1] === d[2];
    log(s, p.nome + " tira " + d.join(" e ") + ".", p.id);
    muovi(s, p, n);
    if (tris && p.doppi < 1 && !p.faro) { p.doppi += 1; log(s, p.nome + " fa tris: tira ancora!", p.id); }
    else p.haTirato = true;
  }

  function muovi(s, p, n) {
    p.inner = false;
    for (let k = 0; k < n; k++) passo(s, p);
    const c = casella(s, p);
    atterra(s, p, c);
  }
  function passo(s, p) {
    p.pos = (p.pos + 1) % CASELLE;
    if (p.pos === 0) {
      if (p.blocco > 0) { log(s, p.nome + " passa dal Via ma lo Stipendio è bloccato dal Giudice.", p.id); }
      else { p.cash += N.stipendio; flusso(s, null, p, N.stipendio, "Stipendio al Ponte Sud", true); log(s, p.nome + " passa dal Ponte Sud e incassa lo Stipendio (" + euro(N.stipendio) + ").", p.id); }
    }
  }
  function casella(s, p) { return s.lotti.find((l) => l.giro === "o" && l.idx === p.pos); }

  function atterra(s, p, c) {
    if (c.tipoCasella === "lotto" || c.tipoCasella === "molo") {
      if (c.owner == null) { s.pending = { tipo: "compra", lotto: c.id, giocatore: p.id }; return; }
      if (c.owner === p.id) return;
      const owner = giocatore(s, c.owner);
      let dovuto;
      if (c.tipoCasella === "molo") dovuto = N.moloFee[moliDi(s, owner).length];
      else dovuto = affitto(s, c);
      if (dovuto > 0) {
        paga(s, p, dovuto, owner);
        flusso(s, p, owner, dovuto, (c.tipoCasella === "molo" ? "Pedaggio del " : "Affitto di ") + c.nome, true);
        log(s, p.nome + " paga " + euro(dovuto) + " di affitto a " + owner.nome + " (" + c.nome + ").", p.id);
      }
      return;
    }
    if (c.tipoCasella === "agenzia") {
      p.agenziaSconto = true;
      privato(s, p, "All'" + c.nome + " ti accolgono con un caffè: in questo turno puoi comprare un terreno libero di " + NOMI_ISOLE[c.isola || isolaDiPos(p.pos)] + " a prezzo pieno, senza il 20% in più. Apri l'app Agenzia.");
      log(s, p.nome + " passa dall'" + c.nome + ".", p.id);
      return;
    }
    switch (c.nome) {
      case "Gazzetta": cartaGazzetta(s, p); break;
      case "Ponte Est — Posto di blocco": postoDiBlocco(s, p); break;
      case "Bisca del Vicolo": if (livelloSblocco(s) >= 1) privato(s, p, "Dalla porta della Bisca qualcuno ti fa segno: \"Stanotte si gioca forte. Porta contanti.\""); else { const f = 1 + Math.floor(rng(s) * 2); p.fama += f; log(s, p.nome + " si fa vedere alla Bisca del Vicolo: +" + f + " fama.", p.id); } break;
      case "Mercato Nero": if (livelloSblocco(s) >= 1) privato(s, p, "Passando dal Mercato Nero un venditore ti fa l'occhiolino: \"Stanotte passa a trovarmi, ho roba nuova.\""); break;
      case "Spiaggia VIP": { const f = 2 + Math.floor(rng(s) * 4); p.fama += f; log(s, p.nome + " incontra un ospite famoso alla Spiaggia VIP: +" + f + " fama.", p.id); break; }
      case "Gala Flamingo": s.pending = { tipo: "gala", giocatore: p.id }; break;
      case "Porto Container": if (livelloSblocco(s) >= 1) privato(s, p, "Al Porto un gruista ti dice sottovoce che stanotte arrivano container senza bolla."); break;
      case "La Borsa": privato(s, p, "Alla Borsa: le tue prossime operazioni oggi sono senza commissioni."); break;
      case "Il Municipio": p.municipioOggi = true; s.pending = { tipo: "municipio", giocatore: p.id }; break;
      case "Banca Centrale": privato(s, p, "Alla Banca Centrale: puoi chiedere un prestito con l'Azione del giorno."); break;
      case "Casinò Reale": s.pending = { tipo: "casino_reale", giocatore: p.id }; break;
      default: break;
    }
  }

  // Le carte Gazzetta (gli "imprevisti" della Laguna)
  const CARTE = [
    ["Un turista ti lascia una mancia enorme.", (s, p) => { p.cash += 150_000; }],
    ["Vinci un premio come imprenditore dell'anno: +5 fama.", (s, p) => { p.fama += 5; }],
    ["Paghi la manutenzione delle tue proprietà: 30.000 € per ogni attività.", (s, p) => { paga(s, p, 30_000 * propri(s, p).filter((l) => l.lvl > 0).length, null); }],
    ["Un'intervista in TV ti rende simpatico: +3 fama.", (s, p) => { p.fama += 3; }],
    ["Multa per divieto di sosta dello yacht: 50.000 €.", (s, p) => { paga(s, p, 50_000, null); }],
    ["Un vecchio debito ti viene restituito: +250.000 €.", (s, p) => { p.cash += 250_000; }],
    ["Controllo fiscale a sorpresa: se hai evaso, le tue Tracce salgono.", (s, p) => { if (p.evasione > 0) p.tracce += 15; }],
    ["Un informatore ti vende una soffiata: ottieni una Prova su un rivale a caso, se ha fatto affari illegali.", (s, p) => {
      const altri = s.players.filter((x) => x.id !== p.id && x.tracce > 20);
      if (altri.length) { const b = altri[Math.floor(rng(s) * altri.length)]; p.prove.push({ su: b.id, ciclo: s.ciclo + 1, cosa: "soffiata" }); }
    }],
    ["Il tuo quartiere va di moda: +0,5 Valore all'isola dove sei.", (s, p) => { const c = casella(s, p); const i = c.isola || "Corona"; s.valore[i] = clamp(s.valore[i] + 0.5, 1, 10); }],
    ["Avanzi fino al Ponte Sud e incassi lo Stipendio.", (s, p) => { p.pos = 0; if (!p.blocco) p.cash += N.stipendio; }],
    ["Uno scandalo minore ti tocca di striscio: -3 fama.", (s, p) => { p.fama = Math.max(0, p.fama - 3); }],
    ["Dividendo straordinario: +10% sulle tue azioni.", (s, p) => { for (const a of AZIENDE) if (p.azioni[a]) p.azioni[a] *= 1.1; }],
  ];
  function cartaGazzetta(s, p) {
    const i = Math.floor(rng(s) * CARTE.length);
    const [testo, f] = CARTE[i];
    const prima = p.cash;
    f(s, p);
    if (p.cash !== prima) flusso(s, p.cash < prima ? p : null, p.cash > prima ? p : null, Math.abs(p.cash - prima), "Gazzetta: " + testo, true);
    log(s, p.nome + " pesca una Gazzetta: " + testo, p.id);
    s.ultimaCarta = { giocatore: p.id, testo };
  }

  function postoDiBlocco(s, p) {
    if (haOggetto(p, "documenti")) { togliOggetto(p, "documenti"); log(s, p.nome + " passa il Posto di blocco senza problemi.", p.id); privato(s, p, "Al Posto di blocco mostri i documenti falsi. L'agente ti fa cenno di passare."); return; }
    if (p.stato >= 2 || (p.tracce > 30 && rng(s) < p.tracce / 250)) {
      log(s, p.nome + " viene fermato al Posto di blocco e controllato.", p.id);
      condanna(s, p, p.peggiorReato || "lieve", "Posto di blocco");
    } else log(s, p.nome + " passa il Posto di blocco senza problemi.", p.id);
  }

  function compra(s, p, si) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "compra" || pd.giocatore !== p.id) err("Non c'è niente da comprare adesso.");
    const l = lotto(s, pd.lotto);
    if (si) {
      if (p.cash < l.prezzo) err("Non hai abbastanza soldi puliti. Puoi rifiutare e andare all'asta.");
      p.cash -= l.prezzo; l.owner = p.id; s.pending = null; flusso(s, p, null, l.prezzo, "Acquisto di " + l.nome, true);
      log(s, p.nome + " compra " + l.nome + " per " + euro(l.prezzo) + ".", p.id);
      notizia(s, p.nome + " compra " + l.nome + ".", "affari");
      controllaValoreLusso(s, l);
    } else {
      s.pending = { tipo: "asta", lotto: l.id, offerte: {}, giocatore: p.id, partecipanti: s.players.filter((x) => !x.fallito && x.faro === 0).map((x) => x.id) };
      log(s, p.nome + " rinuncia: " + l.nome + " va all'asta.", p.id);
    }
  }
  function offerta(s, p, importo) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "asta") err("Non c'è un'asta in corso.");
    if (!pd.partecipanti.includes(p.id)) err("Non partecipi a questa asta.");
    importo = Math.max(0, Math.floor(importo || 0));
    if (importo > p.cash) err("Non puoi offrire più dei tuoi soldi puliti.");
    pd.offerte[p.id] = importo;
    if (Object.keys(pd.offerte).length >= pd.partecipanti.length) chiudiAsta(s);
  }
  function chiudiAsta(s) {
    const pd = s.pending, l = lotto(s, pd.lotto);
    let best = null, bid = 0;
    for (const [id, v] of Object.entries(pd.offerte)) if (v > bid) { best = id; bid = v; }
    s.pending = null;
    if (best && bid > 0) {
      const w = giocatore(s, best);
      w.cash -= bid; l.owner = w.id; flusso(s, w, null, bid, "Asta vinta: " + l.nome, true);
      log(s, "Asta: " + w.nome + " vince " + l.nome + " con " + euro(bid) + ".", w.id);
      notizia(s, "Asta per " + l.nome + ": se la aggiudica " + w.nome + ".", "affari");
    } else log(s, "Asta per " + l.nome + ": nessuna offerta. Il lotto resta libero.");
  }

  function gala(s, p, dono) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "gala" || pd.giocatore !== p.id) err("Non sei al Gala.");
    dono = Math.max(0, Math.floor(dono || 0));
    if (dono > p.cash) err("Non hai abbastanza soldi puliti.");
    p.cash -= dono; s.pending = null;
    const f = Math.floor(dono / 100_000);
    p.fama += Math.min(15, f);
    if (dono > 0) { log(s, p.nome + " dona " + euro(dono) + " al Gala Flamingo: +" + Math.min(15, f) + " fama.", p.id); notizia(s, p.nome + " dona " + euro(dono) + " in beneficenza al Gala Flamingo.", "fama"); }
  }
  function casinoReale(s, p, puntata) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "casino_reale" || pd.giocatore !== p.id) err("Non sei al Casinò Reale.");
    puntata = Math.max(0, Math.floor(puntata || 0));
    s.pending = null;
    if (!puntata) return;
    if (puntata > p.cash) err("Non hai abbastanza soldi puliti.");
    if (rng(s) < 0.47) { p.cash += puntata; log(s, p.nome + " vince " + euro(puntata) + " al Casinò Reale.", p.id); }
    else { p.cash -= puntata; log(s, p.nome + " perde " + euro(puntata) + " al Casinò Reale.", p.id); }
  }
  function municipio(s, p, scelta) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "municipio" || pd.giocatore !== p.id) err("Non sei al Municipio.");
    s.pending = null;
    if (scelta === "candidati") candidati(s, p);
    else if (scelta === "licenza") {
      if (s.licenze.includes(p.id)) err("La licenza ce l'hai già.");
      if (p.cash < 400_000) err("Allo sportello la licenza costa 400.000 €.");
      p.cash -= 400_000; s.licenze.push(p.id);
      log(s, p.nome + " ottiene la licenza per aprire un casinò.", p.id);
    }
  }
  function candidati(s, p) {
    if (p.fama < 40) err("Per candidarti serve fama 40.");
    if (s.candidati[p.id]) err("Sei già candidato.");
    if (p.cash < N.candidatura) err("La candidatura costa " + euro(N.candidatura) + ".");
    p.cash -= N.candidatura; s.candidati[p.id] = 0;
    notizia(s, p.nome + " si candida a Sindaco della Laguna.", "politica");
  }

  // ---- azioni del giorno (una grande per turno)
  function azioneGiorno(s, p) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (p.azioneGiornoFatta) err("Hai già fatto la tua Azione del giorno.");
    if (s.pending) err("Prima finisci la scelta in corso.");
  }
  function costruisci(s, p, idLotto, tipo) {
    azioneGiorno(s, p);
    const l = lotto(s, idLotto);
    if (l.owner !== p.id) err("Puoi costruire solo sui tuoi lotti.");
    if (l.tipoCasella !== "lotto") err("Qui non si costruisce.");
    if (l.ipoteca) err("Il lotto è ipotecato: prima riscattalo.");
    if (l.chiuso > 0) err("L'attività è chiusa dal Giudice.");
    if (l.lvl >= 5) err("Hai già raggiunto il livello massimo.");
    if (l.cantiere) err("C'è già un cantiere aperto: apre all'Alba.");
    if (!l.permesso) err("Prima serve il permesso del Municipio.");
    let nuovoTipo = l.tipo;
    if (l.lvl === 0) {
      if (!tipo || !ATTIVITA[tipo]) err("Scegli che attività aprire.");
      const t = ATTIVITA[tipo];
      if (t.isole && !t.isole.includes(l.isola)) err(t.nome + " non si può aprire in questa isola.");
      if (t.licenza && !s.licenze.includes(p.id)) err("Per il casinò serve la licenza del Municipio.");
      if (t.serie && !haSerie(s, p, l.serie)) err("La banca privata richiede la serie completa.");
      nuovoTipo = tipo;
    } else if (tipo && tipo !== l.tipo) err("Per cambiare attività bisogna prima venderla (non ancora disponibile nella prova).");
    const next = l.lvl + 1;
    if (next >= 3 && !haSerie(s, p, l.serie)) err("Per il livello " + next + " serve la serie completa.");
    if (next === 5 && p.fama < 50) err("Il livello Icona richiede fama 50.");
    let costo = N.costLvl[next] * l.prezzo;
    if (s.leggi.includes("condono")) costo *= 0.5;
    if (casella(s, p).id === l.id) costo *= 0.9;
    costo = round(costo);
    if (p.cash < costo) err("Ti servono " + euro(costo) + " puliti.");
    p.cash -= costo; l.cantiere = { tipo: nuovoTipo, lvl: next }; l.permesso = false; p.azioneGiornoFatta = true;
    log(s, p.nome + " apre il cantiere: " + ATTIVITA[nuovoTipo].nome + " in " + l.nome + " (" + euro(costo) + "). Sarà pronto all'Alba.", p.id);
  }
  function controllaValoreLusso(s, l) {
    if (l.tipo && ATTIVITA[l.tipo].lusso && l.lvl >= 3) s.valore[l.isola] = clamp(s.valore[l.isola] + 0.3, 1, 10);
  }
  function piano(s, p, funzione) {
    azioneGiorno(s, p);
    const FUN = ["appartamenti", "uffici", "ristorante_panoramico", "spa", "casino_privato", "caveau", "sala_insonorizzata", "garage", "eliporto", "piani_segreti"];
    if (!FUN.includes(funzione)) err("Funzione del piano non valida.");
    if (p.piani === 0 && propri(s, p).filter((l) => l.lvl >= 1).length < 2) err("Per il Palazzo servono almeno 2 attività aperte.");
    if (p.piani === 0 && !p.permessoPalazzo && p.pacchetto !== "costruttore") {
      if (p.cash < 300_000) err("Il permesso per il Palazzo costa 300.000 €.");
      p.cash -= 300_000; p.permessoPalazzo = true;
      log(s, p.nome + " ottiene il permesso per costruire il suo Palazzo.", p.id);
    }
    if (p.piani >= N.pianiMax) err("Il Palazzo ha già 60 piani.");
    if (funzione === "casino_privato" && !s.licenze.includes(p.id)) err("Serve la licenza per il casinò.");
    const costo = round(N.pianoCost * Math.pow(N.pianoGrow, p.piani));
    if (p.cash < costo) err("Il prossimo piano costa " + euro(costo) + ".");
    p.cash -= costo; p.piani += 1; p.funzioniPiani.push(funzione); p.azioneGiornoFatta = true;
    if (p.piani % 5 === 0) p.fama += 1;
    log(s, p.nome + " aggiunge il piano " + p.piani + " al suo Palazzo (" + funzione.replace(/_/g, " ") + ").", p.id);
    aggiornaSkyline(s);
  }
  function aggiornaSkyline(s) {
    let best = null;
    for (const p of s.players) if (p.piani > 0 && (!best || p.piani > best.piani)) best = p;
    if (best && s.skyline !== best.id) { s.skyline = best.id; notizia(s, best.nome + " ha ora il palazzo più alto della Laguna: è il Padrone dello Skyline.", "fama"); }
  }
  function compraVeicolo(s, p, tipo) {
    azioneGiorno(s, p);
    const v = N.veicoli[tipo];
    if (!v) err("Veicolo sconosciuto.");
    let prezzo = v.prezzo;
    if (s.leggi.includes("tassa_lusso") && ["yacht", "megayacht", "elicottero", "jet"].includes(tipo)) prezzo *= 1.1;
    if (p.cash < prezzo) err("Ti servono " + euro(prezzo) + ".");
    p.cash -= prezzo; p.veicoli.push(tipo); p.fama += v.fama; p.azioneGiornoFatta = true;
    log(s, p.nome + " compra: " + v.nome + ".", p.id);
    notizia(s, "Avvistato alla Marina dei Re: il nuovo " + v.nome.toLowerCase() + " di " + p.nome + ".", "fama");
  }
  function prestito(s, p, importo) {
    azioneGiorno(s, p);
    importo = Math.floor(importo || 0);
    const cap = N.prestitoQuota * propri(s, p).reduce((a, l) => a + valoreLotto(l), 0) - p.debito;
    if (importo <= 0 || importo > cap) err("Puoi chiedere al massimo " + euro(Math.max(0, cap)) + ".");
    p.debito += importo; p.cash += importo; p.azioneGiornoFatta = true;
    p.prestiti.push({ importo, inizio: s.ciclo, scadenza: s.ciclo + 3 });
    log(s, p.nome + " ottiene un prestito di " + euro(importo) + " dalla Banca Centrale.", p.id);
  }
  function restituisci(s, p, importo) {
    importo = Math.min(Math.floor(importo || 0), p.debito, p.cash);
    if (importo <= 0) err("Niente da restituire.");
    p.cash -= importo; p.debito -= importo;
    if (p.debito < 1) { p.debito = 0; p.prestiti = []; }
    log(s, p.nome + " restituisce " + euro(importo) + " alla Banca.", p.id);
  }
  function ipoteca(s, p, idLotto) {
    const l = lotto(s, idLotto);
    if (l.owner !== p.id) err("Non è tuo.");
    if (l.ipoteca) err("È già ipotecato.");
    const q = round(N.ipotecaQuota * valoreLotto(l));
    l.ipoteca = q; l.ipotecaCiclo = s.ciclo; p.cash += q;
    log(s, p.nome + " ipoteca " + l.nome + " e riceve " + euro(q) + ".", p.id);
    notizia(s, "Sul cartello di " + l.nome + " compare la scritta \"Ipotecato\".", "voce");
  }
  function riscatta(s, p, idLotto) {
    const l = lotto(s, idLotto);
    if (l.owner !== p.id || !l.ipoteca) err("Niente da riscattare.");
    const c = round(l.ipoteca * 1.1);
    if (p.cash < c) err("Ti servono " + euro(c) + ".");
    p.cash -= c; l.ipoteca = 0;
    log(s, p.nome + " riscatta " + l.nome + ".", p.id);
  }
  // azioni piccole (illimitate)
  function investi(s, p, cosa, nome, importo) {
    importo = Math.floor(importo || 0);
    if (importo <= 0) err("Importo non valido.");
    if (cosa === "borsa") {
      if (!AZIENDE.includes(nome)) err("Azienda sconosciuta.");
      if (p.cash < importo) err("Non hai abbastanza soldi puliti.");
      p.cash -= importo; p.azioni[nome] = (p.azioni[nome] || 0) + importo / s.borsa[nome];
    } else if (cosa === "cripto") {
      if (!MONETE.includes(nome)) err("Moneta sconosciuta.");
      if (nome === "ShadowCoin" && s.leggi.includes("giro_cripto")) err("ShadowCoin è bloccata dalla legge del Sindaco.");
      if (p.cash < importo) err("Non hai abbastanza soldi puliti.");
      p.cash -= importo; p.cripto[nome] = (p.cripto[nome] || 0) + importo / s.cripto[nome];
    } else err("Investimento sconosciuto.");
    log(s, p.nome + " investe " + euro(importo) + " in " + nome + ".", p.id);
  }
  function vendi(s, p, cosa, nome, quota) {
    quota = clamp(quota || 1, 0, 1);
    if (cosa === "borsa") {
      const q = (p.azioni[nome] || 0) * quota; if (q <= 0) err("Non hai azioni di " + nome + ".");
      p.azioni[nome] -= q; p.cash += round(q * s.borsa[nome]);
      log(s, p.nome + " vende azioni di " + nome + " per " + euro(q * s.borsa[nome]) + ".", p.id);
    } else if (cosa === "cripto") {
      const q = (p.cripto[nome] || 0) * quota; if (q <= 0) err("Non hai " + nome + ".");
      p.cripto[nome] -= q; p.cash += round(q * s.cripto[nome]);
      log(s, p.nome + " vende " + nome + " per " + euro(q * s.cripto[nome]) + ".", p.id);
    } else if (cosa === "veicolo") {
      const i = p.veicoli.indexOf(nome); if (i < 0) err("Non hai questo veicolo.");
      p.veicoli.splice(i, 1); p.cash += round(N.veicoli[nome].prezzo * 0.8);
      log(s, p.nome + " vende " + N.veicoli[nome].nome + ".", p.id);
    }
  }

  function fineTurno(s, p) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (!p.haTirato) err("Prima tira i dadi.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    p.scontoCarico = p.scontoCarico || false;
    prossimoTurno(s);
  }
  function prossimoTurno(s) {
    s.turno += 1;
    if (s.turno >= s.ordine.length) {
      s.turno = 0;
      fineGiorno(s);
      if (s.fase !== "giorno") return;
    }
    const p = corrente(s);
    if (p.fallito && p.faro === 0 && false) return prossimoTurno(s);
    iniziaTurno(s);
  }
  function fineGiorno(s) {
    // controllo della polizia: un tiro per giocatore alla fine di ogni Giorno
    for (const p of s.players) tiroIndagine(s, p);
    s.giorno += 1;
    if (s.giorno >= N.giorni) {
      s.giorno = 0;
      if (s.principianti && s.ciclo === 0) notizia(s, "Prima notte nella Laguna: stasera si fa festa. Gli affari loschi arriveranno presto.", "evento");
      iniziaNotte(s);
    }
  }

  // ------------------------------------------------------------ notte
  function inNotte(s, p) {
    if (s.fase !== "notte") err("Questa azione si fa solo di notte.");
    if (s.notteFatti[p.id]) err("Hai già detto \"Pronto\" per questa notte.");
    if (p.faro > 0) err("Sei al Faro: stanotte puoi solo ricevere visite.");
  }
  function affare(s, p, tipo, intensita, mosse) {
    inNotte(s, p);
    if (s.principianti && s.ciclo === 0) err("Nella partita per principianti gli affari illegali si aprono dal secondo Ciclo.");
    const A = AFFARI[tipo]; if (!A) err("Affare sconosciuto.");
    if (!N.intens[intensita]) err("Scegli l'intensità.");
    if (p.affariStanotte.length >= N.affariNotte) err("Stanotte hai già fatto " + N.affariNotte + " affari.");
    if (A.richiede) {
      const ok = propri(s, p).some((l) => l.tipo && (A.richiede.includes(ATTIVITA[l.tipo].gruppo) || A.richiede.includes(l.tipo)));
      if (!ok) err(A.descr);
    }
    if (tipo === "colpo" && !p.sette.some((id) => livelloSetta(s, s.sette.find((x) => x.id === id)) >= 3)) err(A.descr);
    mosse = (mosse || []).filter((m) => N.mosse[m]);
    let costoMosse = 0, fT = 1, fC = 1, fK = 1;
    p.mossePagate = p.mossePagate || [];
    for (const m of mosse) {
      const M = N.mosse[m];
      if (!p.mossePagate.includes(m)) { costoMosse += M.costo; p.mossePagate.push(m); } // si pagano una volta per notte
      fT *= M.tracce; fC *= M.colto; fK *= M.carico; if (m === "disturbatore") p.disturbatore = true;
    }
    if (mosse.includes("alibi")) costoMosse += 0; // costo gia' nella mossa
    // carico
    let carico = Math.min(N.caricoMax, N.caricoBase + N.caricoGrow * p.affariOk + 50_000 * Math.floor(p.reputazione / 10));
    if (propri(s, p).some((l) => l.tipo === "magazzino")) carico *= N.caricoMagazzino;
    if (tipo === "bisca") carico = Math.max(300_000, propri(s, p).filter((l) => l.tipo && ["notte", "rischio"].includes(ATTIVITA[l.tipo].gruppo)).reduce((a, l) => a + l.prezzo * l.lvl * 0.6, 0));
    if (tipo === "colpo") carico = 2_000_000;
    carico *= fK;
    if (p.scontoCarico) { carico *= 1; }
    const fondi = p.sporchi + p.cash;
    carico = Math.min(carico, fondi - costoMosse);
    if (carico < 50_000) err("Non hai abbastanza soldi per questo affare.");
    // paga (prima con gli sporchi)
    let costo = carico * (p.scontoCarico && tipo === "contrabbando" ? 0.8 : 1) + costoMosse;
    p.scontoCarico = false;
    const daSporchi = Math.min(p.sporchi, costo); p.sporchi -= daSporchi; p.cash -= (costo - daSporchi);
    const [gMult, tMult] = N.intens[intensita];
    // protezione dell'isola: agente comprato
    const isola = isolaDiNotte(s, p);
    const protIsola = p.corrotti["agente_" + isola] ? 0.7 : 1;
    const esito = rng(s);
    let profitto = 0, perso = false;
    if (esito < 0.08 && tipo !== "bisca") perso = true;
    else profitto = carico * A.profitto * gMult * (0.7 + 0.6 * rng(s));
    if (!perso) { p.sporchi += carico + profitto; p.affariOk += 1; p.reputazione += 2; }
    let tracce = A.tracce * tMult * (0.6 + 0.8 * rng(s)) * fT * protIsola;
    if (s.leggi.includes("polizia_doppia_" + isola)) tracce *= 2;
    p.tracce += tracce; p.pulitoCiclo = false;
    p.peggiorReato = peggio(p.peggiorReato, intensita === "spavaldo" && A.gravita === "media" ? "grave" : A.gravita);
    p.affariStanotte.push({ tipo, intensita, mosse, isola });
    let colto = N.coltoBase * tMult * fC * (p.corrotti.commissario ? 0.5 : 1);
    if (rng(s) < colto) {
      p.stato = Math.max(p.stato, 3);
      privato(s, p, "Sei stato colto sul fatto durante: " + A.nome + ". Ora sei Indagato.");
      notizia(s, "Movimenti sospetti nella notte a " + NOMI_ISOLE[isola] + ". La polizia ha un nome.", "voce");
    }
    if (perso) privato(s, p, A.nome + ": il carico è andato perso. Hai perso " + euro(carico) + ".");
    else privato(s, p, A.nome + " (" + intensita + ") riuscito: +" + euro(carico + profitto) + " in soldi sporchi.");
    log(s, p.nome + " si muove nell'ombra.", p.id);
    return { carico: round(carico), profitto: round(profitto), perso };
  }
  function isolaDiNotte(s, p) {
    const c = casella(s, p);
    return c.isola || isolaDiPos(p.pos);
  }
  function corrompi(s, p, chi, isola, pagaConSporchi) {
    inNotte(s, p);
    let chiave = chi, prezzo;
    if (chi === "agente") {
      if (!ISOLE.includes(isola)) err("Scegli l'isola dell'agente.");
      chiave = "agente_" + isola; prezzo = N.corruz.agente[0];
    } else if (chi === "commissario") prezzo = N.corruz.commissario[0];
    else if (chi === "banchiere") prezzo = N.corruz.banchiere[0];
    else err("Personaggio sconosciuto.");
    if (p.corrotti[chiave]) err("Lo hai già comprato.");
    if (pagaConSporchi) { prezzo *= 0.8; if (p.sporchi < prezzo) err("Non hai abbastanza soldi sporchi."); p.sporchi -= prezzo; }
    else { if (p.cash < prezzo) err("Non hai abbastanza soldi."); p.cash -= prezzo; }
    // il personaggio puo' rifiutare (e denunciare) se sei troppo chiacchierato
    if (rng(s) < 0.05 + 0.03 * p.stato) {
      p.tracce += 20;
      privato(s, p, "Il personaggio ha rifiutato e ha fatto il tuo nome. Hai perso i soldi.");
      return false;
    }
    p.corrotti[chiave] = { dal: s.ciclo };
    p.tracce += 4; p.pulitoCiclo = false;
    p.peggiorReato = peggio(p.peggiorReato, chi === "agente" ? "media" : "grave");
    privato(s, p, "Accordo fatto: ora hai dalla tua parte " + (chi === "agente" ? "l'agente di " + NOMI_ISOLE[isola] : chi === "commissario" ? "il Commissario Vargas" : "il banchiere Lenz") + ".");
    return true;
  }
  function ricicla(s, p, metodo, importo) {
    inNotte(s, p);
    importo = Math.min(Math.floor(importo || 0), p.sporchi);
    if (importo <= 0) err("Non hai soldi sporchi da ripulire.");
    if (metodo === "copertura") {
      const cap = copertura(s, p) - (p.copUsata || 0);
      if (cap <= 0) err("Le tue attività di copertura sono già piene per questo Ciclo.");
      const q = Math.min(importo, cap);
      p.sporchi -= q; p.cash += round(q * (1 - N.ricCopPerdita)); p.copUsata = (p.copUsata || 0) + q;
      p.tracce += N.ricCopTracce * q / 100_000; p.riciclTot += q;
      privato(s, p, "Ripuliti " + euro(q) + " con le tue attività di copertura.");
    } else if (metodo === "shadow") {
      if (s.leggi.includes("giro_cripto")) err("ShadowCoin è bloccata dalla legge del Sindaco.");
      p.sporchi -= importo; p.cash += round(importo * (1 - N.shadowPerdita));
      p.tracce += N.shadowTracce * importo / 100_000; p.riciclTot += importo;
      privato(s, p, "Ripuliti " + euro(importo) + " con ShadowCoin.");
    } else if (metodo === "paradiso") {
      if (!p.veicoli.includes("jet")) err("Per il paradiso fiscale serve il jet.");
      if (p.paradisoCiclo === s.ciclo) err("Un solo viaggio per Ciclo.");
      const q = Math.min(importo, 5_000_000);
      p.sporchi -= q; p.cash += round(q * 0.7); p.paradisoCiclo = s.ciclo; p.riciclTot += q;
      p.tracce += 0.2 * q / 100_000;
      privato(s, p, "Viaggio d'affari: ripuliti " + euro(q) + " in un paradiso fiscale.");
    } else err("Metodo sconosciuto.");
    p.pulitoCiclo = false;
    if (p.riciclTot > 8_000_000) p.peggiorReato = peggio(p.peggiorReato, "grave");
  }
  function spia(s, p, idBersaglio) {
    inNotte(s, p);
    if (idBersaglio === p.id) err("Non puoi spiare te stesso.");
    giocatore(s, idBersaglio);
    p.spiaSu = idBersaglio;
    privato(s, p, "Stanotte segui " + giocatore(s, idBersaglio).nome + " con la macchina fotografica.");
  }
  function denuncia(s, p, idx) {
    const pr = p.prove[idx]; if (!pr) err("Prova non trovata.");
    const b = giocatore(s, pr.su);
    b.tracce += 35; b.stato = Math.min(4, b.stato + 1);
    p.prove.splice(idx, 1);
    notizia(s, "Una denuncia anonima mette nei guai " + b.nome + ".", "voce");
    privato(s, b, "Qualcuno ti ha denunciato con una prova. Le tue Tracce sono salite.");
  }
  function pronto(s, p) {
    if (s.fase !== "notte") err("Non è notte.");
    s.notteFatti[p.id] = true;
    if (s.players.every((x) => s.notteFatti[x.id] || x.faro > 0)) alba(s);
  }

  // ------------------------------------------------------------ la notte come viaggio (v2)
  // La notte va dalle 22 alle 4: 6 ore. Ogni ora tutti scelgono insieme (vai / fai qualcosa / aspetta),
  // poi l'ora si chiude e si scopre cosa e' successo.
  const ORE = ["22:00", "23:00", "00:00", "01:00", "02:00", "03:00", "04:00"];
  const LUOGHI = {
    palazzo: { nome: "Il tuo Palazzo", isola: null, sblocco: 0 },
    club: { nome: "Club Neon", isola: "Flamingo", sblocco: 0 },
    marina: { nome: "Marina dei Re", isola: "Flamingo", sblocco: 0 },
    mercato: { nome: "Mercato Nero", isola: "Ambra", sblocco: 1 },
    bisca: { nome: "Bisca del Vicolo", isola: "Ambra", sblocco: 1 },
    porto: { nome: "Porto Container", isola: "Sole", sblocco: 1 },
    casino: { nome: "Casinò Reale", isola: "Corona", sblocco: 1 },
    redazione: { nome: "Redazione della Gazzetta", isola: "Corona", sblocco: 2 },
    villa: { nome: "Villa sulla scogliera", isola: "Palma", sblocco: 3 },
    faro: { nome: "Il Faro", isola: "Faro", sblocco: 3 },
  };
  const OGGETTI = {
    maschera: { nome: "Maschera", dove: "mercato", prezzo: 40_000, illegale: true, salva: ["testimone", "telecamere", "fotografo"], consuma: true, descr: "Telecamere e testimoni non ti riconoscono." },
    disturbatore: { nome: "Disturbatore radio", dove: "mercato", prezzo: 90_000, illegale: true, salva: ["allarme", "intercettazione"], consuma: true, descr: "Blocca allarmi e intercettazioni per un colpo." },
    telefono: { nome: "Telefono usa-e-getta", dove: "mercato", prezzo: 20_000, salva: ["intercettazione"], consuma: true, descr: "Accetti un'offerta senza lasciare il tuo nome." },
    documenti: { nome: "Documenti falsi", dove: "mercato", prezzo: 150_000, illegale: true, salva: ["posto_di_blocco"], consuma: true, descr: "Di giorno passi il Posto di blocco senza controlli." },
    furgone: { nome: "Furgone pulito", dove: "porto", prezzo: 120_000, salva: ["pattuglia"], notti: 3, descr: "Il carico non si perde se passa una pattuglia. Dura 3 notti." },
    motoscafo: { nome: "Motoscafo a noleggio", dove: "marina", prezzo: 60_000, salva: ["guardia"], notti: 1, veloce: true, descr: "Stanotte ti sposti in 1 ora ovunque, e scappi dal mare." },
    avvocato: { nome: "Avvocato pagato", dove: "redazione", prezzo: 250_000, salva: ["sentenza"], consuma: true, descr: "La prossima sentenza scende di un gradino." },
    macchina: { nome: "Macchina fotografica", dove: "club", prezzo: 30_000, salva: [], descr: "Fotografi chi fa cose losche vicino a te: ottieni una Prova." },
    fiches: { nome: "Fiches truccate", dove: "bisca", prezzo: 80_000, illegale: true, consuma: true, descr: "Al Casinò Reale ripulisci il 10% in più." },
    cassetta: { nome: "Cassetta di sicurezza", dove: "casino", prezzo: 200_000, descr: "Protegge 1 milione di soldi sporchi da una confisca." },
  };
  const PERICOLI = {
    pattuglia: { arriva: "passa una pattuglia della polizia", salvo: "il furgone pulito non desta sospetti", danno: "perso" },
    guardia: { arriva: "si avvicina la Guardia Costiera", salvo: "con il motoscafo sparisci nel buio", danno: "perso" },
    testimone: { arriva: "qualcuno ti fissa troppo a lungo", salvo: "con la maschera nessuno ti riconosce", danno: "riconosciuto" },
    telecamere: { arriva: "noti una telecamera nuova", salvo: "la maschera ti copre il viso", danno: "riconosciuto" },
    allarme: { arriva: "scatta un allarme silenzioso", salvo: "il disturbatore lo zittisce", danno: "allarme" },
    intercettazione: { arriva: "la polizia ascolta le chiamate della zona", salvo: "il telefono usa-e-getta non porta a te", danno: "riconosciuto" },
    fotografo: { arriva: "un flash si accende nel buio", salvo: "nella foto c'è solo una maschera", danno: "foto" },
    retata: { arriva: "arriva una retata", salvo: null, danno: "retata" },
    rissa: { arriva: "scoppia una rissa", salvo: null, danno: "meta" },
  };
  // Le occasioni della notte. costo = quanto metti tu (prima con gli sporchi), guadagno = quanto torna, in sporchi.
  const OCCASIONI = [
    { id: "festa", luogo: "club", sblocco: 0, legale: true, nome: "La festa privata", testo: "Al piano di sopra c'è una festa con gente che conta. L'ingresso costa caro.", costo: 50_000, fama: 4, pericoli: [] },
    { id: "giro_barca", luogo: "marina", sblocco: 0, legale: true, nome: "Il giro in barca", testo: "Un armatore offre un giro sotto le stelle a chi offre lo champagne.", costo: 80_000, fama: 5, pericoli: [] },
    { id: "vip", luogo: "club", sblocco: 1, nome: "Il VIP ubriaco", testo: "Un politico ha bevuto troppo e parla di cose che non dovrebbe. Basta stargli vicino.", costo: 20_000, prova: true, pericoli: ["fotografo"], tracce: 3, gravita: "lieve" },
    { id: "container", luogo: "porto", sblocco: 1, nome: "Il container dimenticato", testo: "Un container senza bolla, il lucchetto già rotto. Nessuno lo reclama.", costo: 0, guadagno: [600_000, 960_000], pericoli: ["pattuglia"], tracce: 6, gravita: "media" },
    { id: "orologi", luogo: "porto", sblocco: 1, nome: "Il carico di orologi", testo: "Un marinaio vende una cassa di orologi svizzeri. Contanti, subito.", costo: 200_000, guadagno: [1_680_000, 2_480_000], pericoli: ["pattuglia", "intercettazione"], tracce: 9, gravita: "media" },
    { id: "mare", luogo: "marina", sblocco: 1, nome: "Il carico dal mare", testo: "Una barca senza luci aspetta al largo. Il carico va preso e portato a terra.", costo: 300_000, guadagno: [2_720_000, 3_960_000], pericoli: ["guardia", "pattuglia"], tracce: 12, gravita: "media" },
    { id: "tavolo", luogo: "bisca", sblocco: 1, nome: "Il tavolo truccato", testo: "Il croupier è un amico. Stanotte le carte girano dalla tua parte, se paghi la sua parte.", costo: 100_000, guadagno: [820_000, 1_400_000], pericoli: ["testimone", "rissa"], tracce: 6, gravita: "lieve" },
    { id: "refurtiva", luogo: "mercato", sblocco: 1, nome: "La merce rubata", testo: "Gioielli da un furto in villa. Il prezzo è un regalo, la provenienza no.", costo: 150_000, guadagno: [1_050_000, 1_490_000], pericoli: ["retata", "testimone"], tracce: 7, gravita: "media" },
    { id: "quadri", luogo: "club", sblocco: 2, nome: "I quadri falsi", testo: "Un collezionista cerca chi venda due tele \"d'autore\" a un ricco turista.", costo: 200_000, guadagno: [1_840_000, 2_800_000], pericoli: ["testimone", "fotografo"], tracce: 10, gravita: "grave" },
    { id: "pesce", luogo: "porto", sblocco: 2, nome: "Il peschereccio", testo: "Sotto il ghiaccio del pesce c'è altro. Va scaricato prima dell'alba.", costo: 350_000, guadagno: [3_080_000, 4_400_000], pericoli: ["pattuglia", "telecamere"], tracce: 13, gravita: "grave" },
    { id: "colpo", luogo: "villa", sblocco: 3, nome: "Il Colpo alla villa", testo: "Il proprietario è in viaggio. In cassaforte, dicono, ci sono i gioielli di famiglia.", costo: 250_000, guadagno: [5_720_000, 8_360_000], pericoli: ["allarme", "telecamere"], tracce: 26, gravita: "grave" },
    { id: "lingotti", luogo: "villa", sblocco: 3, nome: "I lingotti nella cantina", testo: "Il custode della villa ha debiti di gioco. Per una cifra giusta, lascia la porta aperta.", costo: 400_000, guadagno: [3_960_000, 5_720_000], pericoli: ["allarme", "testimone"], tracce: 18, gravita: "grave" },
  ];
  const INDIZI = {
    club: [["La musica è alta, la gente balla. Nessuno guarda nessuno.", "Il buttafuori ti saluta per nome. Tutto tranquillo."], ["Al bancone ci sono due uomini che non bevono.", "Un fotografo gira tra i tavoli più del solito."], ["Fuori dal club c'è un furgone con i vetri scuri, il motore acceso.", "Il barista ti fa segno di non fermarti troppo."]],
    marina: [["Si sente solo l'acqua contro le barche.", "Il guardiano dorme nella sua cabina."], ["Una motovedetta è ormeggiata più vicina del solito.", "Qualcuno ha acceso le luci su un molo che di solito è buio."], ["Un faro della Guardia Costiera spazza il porto ogni pochi minuti.", "Il guardiano è sveglio e prende appunti."]],
    mercato: [["I banchi sono pieni e i venditori ridono.", "Un vecchio ti offre un caffè: oggi si tratta con calma."], ["I venditori parlano a bassa voce e guardano la strada.", "Metà dei banchi ha già chiuso."], ["Il vicolo è stranamente vuoto.", "Un ragazzino corre via gridando un nome in codice."]],
    bisca: [["Fumo, carte e risate. La serata gira bene.", "Il padrone della bisca offre da bere a tutti."], ["Al tavolo grande c'è una faccia nuova che non gioca.", "Il croupier sbaglia a contare, è nervoso."], ["La porta sul retro è sbarrata.", "Qualcuno ha appena perso tutto e cerca un colpevole."]],
    porto: [["Il molo è deserto. Si sente solo il mare.", "Le gru sono ferme e i guardiani giocano a carte."], ["Troppe auto scure parcheggiate davanti al porto.", "Un cane antidroga abbaia in lontananza."], ["Un gabbiano vola via all'improvviso: qualcuno è nascosto dietro i container.", "Le luci dei lampeggianti si riflettono sull'acqua, spenti ma presenti."]],
    casino: [["Le slot suonano, i tavoli sono pieni di turisti.", "Il direttore di sala ti sorride."], ["Due uomini in giacca grigia osservano la cassa.", "Il cambio fiches oggi è lento: controllano i documenti."], ["Alla cassa c'è un ispettore della Finanza.", "Il direttore di sala evita il tuo sguardo."]],
    redazione: [["Le rotative girano, il caporedattore è di buon umore.", "In redazione c'è solo il turno di notte."], ["Un giornalista ti riconosce e prende il telefono.", "Sul tavolo c'è una cartella con il nome di un rivale."], ["Fuori dalla redazione c'è un'auto della polizia.", "Il caporedattore ti dice di andartene in fretta."]],
    villa: [["La villa è buia, il cane dorme.", "Le finestre del primo piano sono socchiuse."], ["Una luce si accende e si spegne al piano terra.", "Il cancello ha un lucchetto nuovo."], ["Ci sono tre telecamere nuove sulla facciata.", "Un'auto di vigilanza passa due volte in dieci minuti."]],
    faro: [["Le onde coprono ogni rumore. Qui nessuno ascolta.", "Il guardiano del Faro guarda il mare, non te."], ["Sulla scogliera c'è una seconda barca ormeggiata.", "Senti delle voci dietro la torre."], ["Il guardiano parla al telefono e ti guarda.", "Sul molo ci sono impronte fresche di scarponi."]],
  };
  const LIVELLI_PERICOLO = ["tranquillo", "agitato", "pericoloso"];
  const P_GUAI = [0.10, 0.30, 0.55];

  function livelloSblocco(s) { return s.principianti ? Math.min(3, s.ciclo) : 3; }
  function postiValigetta(s) { return [2, 4, 4, 6][livelloSblocco(s)]; }
  function luogoAperto(s, l) { return LUOGHI[l] && LUOGHI[l].sblocco <= livelloSblocco(s); }
  function isolaCasa(s, p) { const l = s.lotti.find((x) => x.owner === p.id && x.isola); return l ? l.isola : "Corona"; }
  function isolaLuogo(s, p, l) { return l === "palazzo" ? isolaCasa(s, p) : LUOGHI[l].isola; }
  function oreViaggio(s, p, da, a) {
    if (haOggetto(p, "motoscafo") || haPiano(p, "eliporto") || p.veicoli.some((v) => ["motoscafo", "yacht", "megayacht", "elicottero"].includes(v))) return 1;
    return isolaLuogo(s, p, da) === isolaLuogo(s, p, a) ? 1 : 2;
  }
  function haPiano(p, f) { return (p.funzioniPiani || []).includes(f); }
  function haOggetto(p, id) { return (p.valigetta || []).some((o) => o.id === id); }
  function togliOggetto(p, id) { const i = (p.valigetta || []).findIndex((o) => o.id === id); if (i >= 0) p.valigetta.splice(i, 1); }
  function racconta(s, p, testo, dopo) { if (!s.notte) return; (s.notte.racconto[p.id] = s.notte.racconto[p.id] || []).push(ORE[s.notte.ora + (dopo ? 1 : 0)] + " — " + testo); }
  function indizio(s, l) { const lv = LIVELLI_PERICOLO.indexOf(s.notte.pericolo[l]); const arr = INDIZI[l] && INDIZI[l][lv]; return arr ? arr[Math.floor(rng(s) * arr.length)] : ""; }
  function pagaMisto(s, p, costo) { // prima gli sporchi, poi i puliti
    if (p.sporchi + p.cash < costo) err("Non hai abbastanza soldi: servono " + euro(costo) + ".");
    const ds = Math.min(p.sporchi, costo); p.sporchi -= ds; p.cash -= costo - ds;
  }

  const VERA = [
    null,
    "Vera: \"Ti ha cercato un tipo del Porto. Gente seria. Stanotte si aprono il Mercato Nero, la Bisca, il Porto e il Casinò Reale. La valigetta ora ha 4 posti.\"",
    "Vera: \"Il banchiere Lenz vuole conoscerti. Da oggi puoi usare Borsa, Cripto e Contratti. Di notte anche la Redazione della Gazzetta è aperta per te.\"",
    "Vera: \"È arrivato un biglietto senza firma: 'Al Faro, a mezzanotte'. Si aprono la Villa sulla scogliera, il Faro e le sette. La valigetta ora ha 6 posti.\"",
  ];

  function iniziaNotte(s) {
    s.fase = "notte"; s.notteFatti = {};
    const lv = livelloSblocco(s);
    if (s.principianti && lv > 0 && s.sbloccoAnnunciato !== lv) { s.sbloccoAnnunciato = lv; for (const p of s.players) privato(s, p, VERA[lv]); }
    s.notte = { ora: 0, pericolo: {}, occasioni: [], chiuso: {}, viaggio: {}, dove: {}, fatto: {}, foto: {}, racconto: {}, pronto: {}, daScelta: {}, inizioRacc: {}, base: {}, inizio: 0 };
    for (const l of Object.keys(LUOGHI)) {
      const x = rng(s);
      let lvp = x < 0.45 ? 0 : x < 0.8 ? 1 : 2;
      if (s.blackout && LUOGHI[l].isola === s.blackout) lvp = 0;
      if (s.retataAnnunciata) lvp = Math.min(2, lvp + 1);
      s.notte.pericolo[l] = LIVELLI_PERICOLO[lvp];
    }
    // occasioni nascoste nei luoghi aperti
    let n = 1;
    for (const l of Object.keys(LUOGHI)) {
      if (!luogoAperto(s, l)) continue;
      const pool = OCCASIONI.filter((o) => o.luogo === l && o.sblocco <= lv);
      if (!pool.length) continue;
      const quante = rng(s) < 0.4 ? 1 : 2;
      for (let k = 0; k < quante && pool.length; k++) {
        const o = pool.splice(Math.floor(rng(s) * pool.length), 1)[0];
        const dalle = Math.floor(rng(s) * 3), alle = Math.min(6, dalle + 2 + Math.floor(rng(s) * 3));
        s.notte.occasioni.push({ n: n++, id: o.id, luogo: l, dalle, alle, preso: null, riservata: null });
      }
    }
    for (const p of s.players) {
      p.affariStanotte = []; p.pulitoCiclo = true;
      s.notte.dove[p.id] = "palazzo";
      if (p.faro > 0) { s.notteFatti[p.id] = true; racconta(s, p, "Passi la notte al Faro, in cella. Fuori la Laguna si muove senza di te."); continue; }
      racconta(s, p, "Esci dal tuo palazzo. La Laguna è accesa.");
      // una chiamata, a volte
      if (lv >= 1 && rng(s) < 0.45) {
        const pool = OCCASIONI.filter((o) => !o.legale && o.sblocco <= lv && luogoAperto(s, o.luogo));
        const o = pool[Math.floor(rng(s) * pool.length)];
        const alle = 3 + Math.floor(rng(s) * 3);
        s.notte.occasioni.push({ n: n++, id: o.id, luogo: o.luogo, dalle: 0, alle, preso: null, riservata: p.id });
        const msg = "Chiamata da un numero sconosciuto: \"" + o.testo + " Vieni a " + LUOGHI[o.luogo].nome + " prima delle " + ORE[alle] + ".\"";
        racconta(s, p, msg); privato(s, p, msg);
      }
    }
    log(s, "Cala la Notte sul Ciclo " + (s.ciclo + 1) + ".");
    for (const b of s.players) if (b.bot && b.faro === 0 && haPiano(b, "casino_privato") && rng(s) < 0.5) apriSerataSenzaOra(s, b, [50_000, 100_000][Math.floor(rng(s) * 2)]);
    apriOra(s, true);
    controllaOra(s);
  }
  // Ogni ora: si fotografano soldi, fama e tracce, per il riepilogo di fine ora
  const TEMPO_ORA = 120; // secondi: poi chi non ha scelto resta dov'e'
  function adesso() { return Date.now(); }
  function apriOra(s, prima) {
    const N2 = s.notte;
    N2.inizio = adesso(); N2.base = {};
    for (const p of s.players) {
      if (prima) N2.inizioRacc[p.id] = 0;
      if (s.notteFatti[p.id] || p.faro > 0) continue;
      N2.base[p.id] = { soldi: p.cash + p.sporchi, sporchi: p.sporchi, fama: p.fama, tracce: p.tracce };
    }
  }
  function avanti(s, p) {
    inNotte2(s, p);
    const N2 = s.notte;
    if (!N2.chiuso[p.id] && !N2.viaggio[p.id]) err("Prima scegli cosa fare in quest'ora.");
    N2.pronto[p.id] = true;
    controllaOra(s);
  }
  function tempoScaduto(s) {
    if (s.fase !== "notte" || !s.notte) err("Non è notte.");
    const N2 = s.notte;
    if (adesso() - N2.inizio < TEMPO_ORA * 1000 - 1500) err("Il tempo non è ancora finito.");
    for (const q of attivi(s)) {
      if (!N2.chiuso[q.id] && !N2.viaggio[q.id]) {
        N2.daScelta[q.id] = (N2.racconto[q.id] || []).length;
        N2.chiuso[q.id] = true;
        racconta(s, q, "Il tempo passa. Resti " + (N2.dove[q.id] === "palazzo" ? "nel Palazzo" : "a " + nomeLuogo(N2.dove[q.id])) + " senza fare niente.");
      }
      N2.pronto[q.id] = true;
    }
    controllaOra(s);
  }
  // Lo sfarzo: piu' fama e ricchezza hai, piu' entri nelle sale lussuose (0 normale, 1 VIP, 2 riservato)
  function lustro(s, p) {
    const punti = p.fama + patrimonio(s, p) / 500_000;
    return punti >= 55 ? 2 : punti >= 30 ? 1 : 0;
  }
  function livelloPalazzo(p) { return p.piani >= 30 ? 2 : p.piani >= 10 ? 1 : 0; }
  // Ogni luogo ha un'attivita' fissa, sempre presente
  const ATTIVITA_NOTTE = {
    club: { id: "giro", titolo: "Offri un giro a tutto il locale", testo: "Champagne per tutti. Domani tutti sapranno il tuo nome.", costo: 30_000 },
    marina: { id: "yacht", titolo: "Passeggia tra gli yacht", testo: "I marinai parlano. Qualcuno sa che aria tira altrove." },
    mercato: { id: "chiedi", titolo: "Chiedi in giro", testo: "Un vecchio al banco sa sempre dove gira la roba stanotte." },
    bisca: { id: "carte", titolo: "Una mano a carte", testo: "Si punta forte. Puoi raddoppiare o perdere tutto.", puntata: true },
    porto: { id: "gruisti", titolo: "Parla con i gruisti", testo: "Sanno quali navi arrivano più tardi, e cosa portano." },
    casino: { id: "roulette", titolo: "Gioca alla roulette", testo: "Tutto in regola, niente Tracce. Rosso o nero?", puntata: true },
    redazione: { id: "bozze", titolo: "Leggi le bozze di domani", testo: "Sul tavolo del caporedattore c'è la prima pagina di domani." },
    villa: { id: "osserva", titolo: "Osserva la villa dal buio", testo: "Dal bosco si vedono finestre, guardie e telecamere." },
    faro: { id: "mare", titolo: "Guarda chi arriva dal mare", testo: "Dall'alto del Faro si vedono tutte le luci della Laguna." },
  };
  function attivitaNotte(s, p, importo) {
    oraLibera(s, p);
    const N2 = s.notte, dove = N2.dove[p.id], A = ATTIVITA_NOTTE[dove];
    if (!A) err("Qui non c'è niente di speciale da fare.");
    const altroLuogo = () => { const ls = Object.keys(LUOGHI).filter((l) => l !== "palazzo" && l !== dove && luogoAperto(s, l)); return ls[Math.floor(rng(s) * ls.length)]; };
    if (A.puntata) {
      importo = round(Number(importo) || 0);
      if (importo < 10_000) err("La puntata minima è 10.000 €.");
      if (importo > 2_000_000) err("Il banco non accetta più di 2 milioni a puntata.");
    }
    switch (A.id) {
      case "giro": {
        const f = 2 + lustro(s, p); pagaMisto(s, p, A.costo); p.fama += f;
        racconta(s, p, "Alzi il bicchiere e il DJ dice il tuo nome al microfono. Tutto il locale brinda con te. +" + f + " fama.");
        break;
      }
      case "yacht": {
        const l = altroLuogo(); const lv = N2.pericolo[l];
        racconta(s, p, "Un marinaio ti dice che a " + LUOGHI[l].nome + " stanotte " + { tranquillo: "è tutto tranquillo", agitato: "c'è movimento, meglio stare attenti", pericoloso: "è pieno di polizia" }[lv] + ".");
        break;
      }
      case "chiedi": {
        const o = N2.occasioni.find((x) => !x.preso && !x.riservata && x.luogo !== "mercato" && x.alle > N2.ora && luogoAperto(s, x.luogo) && !OCCASIONI.find((y) => y.id === x.id).legale);
        if (o) racconta(s, p, "Il vecchio abbassa la voce: \"" + OCCASIONI.find((y) => y.id === o.id).nome + ", a " + LUOGHI[o.luogo].nome + ", tra le " + ORE[Math.max(o.dalle, N2.ora)] + " e le " + ORE[o.alle] + ".\"");
        else racconta(s, p, "Il vecchio scuote la testa: stanotte non gira niente di buono.");
        break;
      }
      case "carte": case "roulette": {
        // alla roulette si gioca solo con soldi puliti: altrimenti sarebbe un modo facile di ripulire gli sporchi
        if (A.id === "roulette") { if (p.cash < importo) err("Al Casinò Reale si gioca solo con soldi puliti."); p.cash -= importo; }
        else pagaMisto(s, p, importo);
        const vinto = rng(s) < (A.id === "carte" ? 0.47 : 0.46);
        if (A.id === "carte") {
          p.tracce += 1;
          if (vinto) { p.sporchi += importo * 2; racconta(s, p, "Scopri le carte: hai vinto. Ti porti via " + euro(importo * 2) + " in contanti sporchi."); }
          else racconta(s, p, "L'ultima carta gira male. Perdi " + euro(importo) + ".");
        } else {
          if (vinto) { p.cash += importo * 2; racconta(s, p, "La pallina si ferma sul tuo colore. Vinci " + euro(importo * 2) + ", tutto pulito."); }
          else racconta(s, p, "La pallina rimbalza e si ferma sul colore sbagliato. Perdi " + euro(importo) + ".");
        }
        break;
      }
      case "gruisti": {
        const o = N2.occasioni.filter((x) => !x.preso && x.luogo === "porto" && x.dalle > N2.ora && (!x.riservata || x.riservata === p.id));
        racconta(s, p, o.length ? "Un gruista guarda l'orologio: \"Alle " + ORE[o[0].dalle] + " arriva qualcosa di interessante. " + OCCASIONI.find((y) => y.id === o[0].id).nome + ".\"" : "I gruisti dicono che stanotte non arriva più niente.");
        break;
      }
      case "bozze": {
        const altri = s.players.filter((x) => x.id !== p.id).sort((a, b) => b.tracce - a.tracce);
        const b = altri[0];
        racconta(s, p, b && b.tracce > 15 ? "In prima pagina c'è un pezzo ancora senza titolo. Il nome che compare di più è " + b.nome + "." : "Domani in prima pagina c'è solo il meteo e la regata. Nessuno nei guai, per ora.");
        break;
      }
      case "osserva": {
        const lv = N2.pericolo.villa;
        const o = N2.occasioni.find((x) => !x.preso && x.luogo === "villa" && x.alle > N2.ora);
        racconta(s, p, (lv === "tranquillo" ? "Le guardie dormono e le telecamere sono spente." : lv === "agitato" ? "Una guardia fa il giro ogni mezz'ora." : "Ci sono auto della vigilanza ovunque: stanotte è una trappola.") + (o ? " E qualcuno ha lasciato una finestra aperta fino alle " + ORE[o.alle] + "." : " Ma stanotte non c'è un modo per entrare."));
        break;
      }
      case "mare": {
        const visti = s.players.filter((x) => x.id !== p.id && !s.notteFatti[x.id] && x.faro === 0).map((x) => x.nome + (N2.viaggio[x.id] ? " è in viaggio" : (N2.dove[x.id] === "palazzo" ? " è nel suo Palazzo" : " è a " + nomeLuogo(N2.dove[x.id]))));
        racconta(s, p, visti.length ? "Dal Faro vedi tutto: " + visti.join(", ") + "." : "Dal Faro vedi solo il mare. Gli altri sono già a casa.");
        break;
      }
    }
    N2.chiuso[p.id] = true;
    controllaOra(s);
  }
  // Il Palazzo di notte: spa, serate nel casino' privato (gli ospiti vengono nel tuo Palazzo e pagano l'ingresso)
  function aCasaSua(s, p) { const N2 = s.notte; return N2.dove[p.id] === "palazzo" && !N2.viaggio[p.id] && !(N2.ospite && N2.ospite[p.id]); }
  function spa(s, p) {
    oraLibera(s, p);
    if (!aCasaSua(s, p) || !haPiano(p, "spa")) err("Ti serve la Spa nel tuo Palazzo.");
    if (s.notte.spaFatta && s.notte.spaFatta[p.id]) err("Stanotte la Spa l'hai già usata.");
    pagaMisto(s, p, 50_000); p.fama += 3; (s.notte.spaFatta = s.notte.spaFatta || {})[p.id] = true;
    racconta(s, p, "Inviti un'attrice famosa nella tua Spa. Foto in accappatoio, champagne, risate: domani ne parleranno tutti. +3 fama.");
    s.notte.chiuso[p.id] = true; controllaOra(s);
  }
  function apriSerata(s, p, ingresso) {
    oraLibera(s, p);
    if (!aCasaSua(s, p)) err("La serata si apre dal tuo Palazzo.");
    if (!haPiano(p, "casino_privato")) err("Ti serve un piano con il Casinò privato.");
    ingresso = round(Number(ingresso) || 0);
    if (ingresso < 0 || ingresso > 500_000) err("L'ingresso va da 0 a 500.000 €.");
    const N2 = s.notte; N2.serate = N2.serate || {};
    if (N2.serate[p.id]) err("La serata è già aperta.");
    N2.serate[p.id] = { ingresso, dalle: N2.ora, ospiti: [], banco: 0 };
    racconta(s, p, "Accendi le luci del tuo Casinò privato. Gli inviti partono: ingresso " + euro(ingresso) + ". Tu tieni il banco.");
    for (const q of s.players) if (q.id !== p.id) privato(s, q, "Invito da " + p.nome + ": stanotte serata nel Casinò privato del suo Palazzo, al piano " + p.piani + ". Ingresso " + euro(ingresso) + ".");
    notizia(s, p.nome + " apre il suo Casinò privato: stanotte si gioca al piano " + p.piani + ".", "voce");
    N2.chiuso[p.id] = true; controllaOra(s);
  }
  function apriSerataSenzaOra(s, p, ingresso) {
    const N2 = s.notte; N2.serate = N2.serate || {};
    N2.serate[p.id] = { ingresso, dalle: N2.ora, ospiti: [], banco: 0 };
    for (const q of s.players) if (q.id !== p.id) privato(s, q, "Invito da " + p.nome + ": stanotte poker nel Casinò privato del suo Palazzo, al piano " + p.piani + ". Ingresso " + euro(ingresso) + ".");
    notizia(s, p.nome + " apre il suo Casinò privato: stanotte si gioca a poker al piano " + p.piani + ".", "voce");
  }
  function vaiSerata(s, p, idHost) {
    oraLibera(s, p);
    const N2 = s.notte, host = giocatore(s, idHost), se = N2.serate && N2.serate[idHost];
    if (!se || idHost === p.id) err("Non c'è nessuna serata lì.");
    if (N2.ospite && N2.ospite[p.id] === idHost) err("Sei già alla serata.");
    const ore = N2.dove[p.id] === "palazzo" ? 1 : oreViaggio(s, p, N2.dove[p.id], "palazzo");
    N2.viaggio[p.id] = { verso: "palazzo", restano: ore, da: N2.dove[p.id], serata: idHost };
    N2.chiuso[p.id] = true;
    racconta(s, p, "Parti verso il Palazzo di " + host.nome + (ore > 1 ? ": ci vorranno 2 ore." : "."));
    controllaOra(s);
  }
  function arrivaSerata(s, p, idHost) {
    const N2 = s.notte, host = giocatore(s, idHost), se = N2.serate && N2.serate[idHost];
    N2.ospite = N2.ospite || {};
    if (!se) { racconta(s, p, "Arrivi al Palazzo di " + host.nome + ", ma la festa è già finita.", true); return; }
    const paga = Math.min(se.ingresso, p.cash + p.sporchi);
    if (paga > 0) { pagaMisto(s, p, paga); host.cash += paga; se.banco += paga; }
    N2.ospite[p.id] = idHost; se.ospiti.push(p.id);
    racconta(s, p, "Sali fino al piano " + host.piani + " del Palazzo di " + host.nome + ". Paghi l'ingresso (" + euro(paga) + ") e ti siedi al tavolo.", true);
    racconta(s, host, p.nome + " arriva alla tua serata e paga " + euro(paga) + " di ingresso.", true);
  }
  // Poker a 5 carte contro il banco: vince la mano migliore, a parita' vince il banco
  const SEMI = ["♠", "♥", "♦", "♣"], VALORI = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const NOMI_MANI = ["Carta alta", "Coppia", "Doppia coppia", "Tris", "Scala", "Colore", "Full", "Poker", "Scala colore"];
  function mano(s, mazzo) { const m = []; for (let i = 0; i < 5; i++) m.push(mazzo.splice(Math.floor(rng(s) * mazzo.length), 1)[0]); return m; }
  function punteggio(m) {
    const v = m.map((c) => c % 13).sort((a, b) => b - a), colore = m.every((c) => Math.floor(c / 13) === Math.floor(m[0] / 13));
    const conta = {}; for (const x of v) conta[x] = (conta[x] || 0) + 1;
    const gruppi = Object.entries(conta).map(([x, n]) => [n, +x]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const u = [...new Set(v)]; let scala = u.length === 5 && (u[0] - u[4] === 4);
    if (u.join() === "12,3,2,1,0") scala = true; // A-2-3-4-5
    let tipo = 0;
    if (scala && colore) tipo = 8; else if (gruppi[0][0] === 4) tipo = 7; else if (gruppi[0][0] === 3 && gruppi[1][0] === 2) tipo = 6;
    else if (colore) tipo = 5; else if (scala) tipo = 4; else if (gruppi[0][0] === 3) tipo = 3; else if (gruppi[0][0] === 2 && gruppi[1][0] === 2) tipo = 2; else if (gruppi[0][0] === 2) tipo = 1;
    return [tipo, ...gruppi.map((g) => g[1])];
  }
  function confronta(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; }
  function testoMano(m) { return m.map((c) => VALORI[c % 13] + SEMI[Math.floor(c / 13)]).join(" "); }
  function giocaSerata(s, p, importo) {
    oraLibera(s, p);
    const N2 = s.notte, idHost = N2.ospite && N2.ospite[p.id], host = idHost && giocatore(s, idHost);
    if (!host) err("Non sei a una serata.");
    importo = round(Number(importo) || 0);
    if (importo < 10_000) err("La puntata minima è 10.000 €.");
    if (importo > Math.max(0, host.cash)) err("Il banco di " + host.nome + " non copre una puntata così alta.");
    pagaMisto(s, p, importo);
    const mazzo = [...Array(52).keys()], mia = mano(s, mazzo), sua = mano(s, mazzo);
    const pm = punteggio(mia), ps = punteggio(sua), vinco = confronta(pm, ps) > 0;
    const descr = "Le tue carte: " + testoMano(mia) + " (" + NOMI_MANI[pm[0]] + "). " + host.nome + ": " + testoMano(sua) + " (" + NOMI_MANI[ps[0]] + ").";
    (N2.ultimaMano = N2.ultimaMano || {})[p.id] = { mia, sua, nomeMia: NOMI_MANI[pm[0]], nomeSua: NOMI_MANI[ps[0]], vinco, importo, banco: host.nome };
    if (vinco) {
      host.cash -= importo; p.cash += importo * 2; N2.serate[idHost].banco -= importo;
      racconta(s, p, descr + " Vinci " + euro(importo * 2) + ".");
      racconta(s, host, p.nome + " ti batte a poker con " + NOMI_MANI[pm[0]].toLowerCase() + ": il banco paga " + euro(importo) + ".");
    } else {
      host.cash += importo; N2.serate[idHost].banco += importo;
      racconta(s, p, descr + " Vince il banco: perdi " + euro(importo) + ".");
      racconta(s, host, p.nome + " perde " + euro(importo) + " al tuo tavolo di poker.");
    }
    N2.chiuso[p.id] = true; controllaOra(s);
  }
  // Gli incontri: se un altro giocatore e' nello stesso posto, puoi offrirgli da bere, sfidarlo o seguirlo
  function quiConMe(s, p) {
    const N2 = s.notte; if (!N2 || N2.viaggio[p.id]) return [];
    const d = N2.dove[p.id];
    const casa = (x) => (N2.ospite && N2.ospite[x.id]) || x.id;
    if (d === "palazzo") return s.players.filter((x) => x.id !== p.id && !s.notteFatti[x.id] && x.faro === 0 && !N2.viaggio[x.id] && N2.dove[x.id] === "palazzo" && casa(x) === casa(p) && (casa(p) !== p.id || casa(x) !== x.id));
    return s.players.filter((x) => x.id !== p.id && !s.notteFatti[x.id] && x.faro === 0 && !N2.viaggio[x.id] && N2.dove[x.id] === d);
  }
  function incontro(s, p, idA, tipo, importo) {
    oraLibera(s, p);
    const N2 = s.notte, q = giocatore(s, idA);
    if (!quiConMe(s, p).includes(q)) err(q.nome + " non è qui.");
    N2.proposte = N2.proposte || [];
    if (tipo === "segui") {
      N2.segue = N2.segue || {}; N2.segue[p.id] = q.id;
      racconta(s, p, "Ti metti in un angolo e non perdi d'occhio " + q.nome + ". Dove andrà, lo saprai.");
    } else if (tipo === "drink") {
      pagaMisto(s, p, 20_000);
      N2.proposte.push({ id: (N2.prossimaProposta = (N2.prossimaProposta || 0) + 1), da: p.id, a: q.id, tipo, importo: 0, stato: "attesa" });
      racconta(s, p, "Fai portare due bicchieri al tavolo di " + q.nome + ". Ora tocca a lui decidere.");
    } else if (tipo === "sfida") {
      importo = round(Number(importo) || 0);
      if (importo < 50_000) err("La sfida minima è 50.000 €.");
      const sp0 = p.sporchi; pagaMisto(s, p, importo);
      N2.proposte.push({ id: (N2.prossimaProposta = (N2.prossimaProposta || 0) + 1), da: p.id, a: q.id, tipo, importo, sporchiDa: sp0 - p.sporchi, stato: "attesa" });
      racconta(s, p, "Butti " + euro(importo) + " sul tavolo davanti a " + q.nome + ": \"Una mano sola. Chi vince prende tutto.\"");
    } else err("Incontro sconosciuto.");
    N2.chiuso[p.id] = true;
    controllaOra(s);
  }
  function restituisci_(p, pr) { p.sporchi += pr.sporchiDa || 0; p.cash += pr.importo - (pr.sporchiDa || 0); }
  function rispondiIncontro(s, p, id, si) {
    if (s.fase !== "notte" || !s.notte) err("Non è notte.");
    const N2 = s.notte, pr = (N2.proposte || []).find((x) => x.id === id && x.a === p.id && x.stato === "attesa");
    if (!pr) err("Questa proposta non c'è più.");
    const da = giocatore(s, pr.da);
    if (!si) {
      pr.stato = "no";
      if (pr.importo) restituisci_(da, pr); // la posta torna indietro
      racconta(s, da, p.nome + " non accetta" + (pr.tipo === "drink" ? " il bicchiere" : " la sfida") + "." + (pr.importo ? " Ti riprendi i soldi." : ""));
      racconta(s, p, "Rifiuti la proposta di " + da.nome + ".");
      return;
    }
    if (pr.tipo === "drink") {
      pr.stato = "si"; da.fama += 2; p.fama += 2;
      const tasche = p.sporchi > 2_000_000 ? "ha le tasche piene di contanti sporchi" : p.sporchi > 300_000 ? "maneggia qualche contante di troppo" : "sembra pulito, per ora";
      racconta(s, da, p.nome + " accetta il bicchiere. Si parla, si ride. Tra una frase e l'altra capisci che " + tasche + ". +2 fama.");
      racconta(s, p, "Bevi con " + da.nome + ". Una bella serata: +2 fama. Forse hai parlato un po' troppo.");
    } else {
      const sp0 = p.sporchi; pagaMisto(s, p, pr.importo);
      pr.stato = "si";
      const vince = rng(s) < 0.5 ? da : p, perde = vince === da ? p : da;
      const sporchiPiatto = (pr.sporchiDa || 0) + (sp0 - p.sporchi); // i soldi sporchi restano sporchi anche se cambiano tasca
      vince.sporchi += sporchiPiatto; vince.cash += pr.importo * 2 - sporchiPiatto;
      racconta(s, vince, "Una mano sola contro " + perde.nome + ". Hai vinto: " + euro(pr.importo * 2) + ".");
      racconta(s, perde, "Una mano sola contro " + vince.nome + ". Hai perso " + euro(pr.importo) + ".");
      notizia(s, "Al " + nomeLuogo(N2.dove[p.id]) + " sfida a carte tra " + da.nome + " e " + p.nome + ": vince " + vince.nome + ".", "voce");
    }
  }
  // Le scelte dell'ora: al massimo 3, decise dal luogo e dall'ora
  function scelteNotte(s, p) {
    const N2 = s.notte;
    if (!N2 || s.notteFatti[p.id] || p.faro > 0 || N2.chiuso[p.id] || N2.viaggio[p.id]) return [];
    const dove = N2.dove[p.id], lv = livelloSblocco(s);
    const occ = occasioniVisibili(s, p).sort((a, b) => (b.riservata ? 1 : 0) - (a.riservata ? 1 : 0)).map((o) => {
      const O = OCCASIONI.find((x) => x.id === o.id);
      return { k: "occ", n: o.n, titolo: O.nome, testo: O.testo, costo: O.costo || 0, legale: !!O.legale, riservata: !!o.riservata };
    });
    const sp = [];
    if (dove === "casino" && p.sporchi > 0) sp.push({ k: "ricicla", titolo: "Ripulisci i soldi sporchi", testo: "Il cassiere cambia le fiches senza fare domande. Una parte resta a lui." });
    if (dove === "casino" && lv >= 1) sp.push({ k: "banchiere", titolo: "Un drink con il banchiere Lenz", testo: "Lenz siede sempre allo stesso tavolo. Con lui i soldi trovano strade nuove." });
    if (dove === "club" && lv >= 1) sp.push({ k: "polizia", titolo: "Parla con un agente fuori servizio", testo: "Al bancone c'è un poliziotto che beve da solo. Ha l'aria di chi cerca un extra." });
    if (dove === "redazione") sp.push({ k: "articolo", titolo: "Una busta al caporedattore", testo: "Domattina la Gazzetta può parlare bene di te. O male di un altro." });
    if (dove === "faro" && s.sette.some((st) => st.gm === p.id)) sp.push({ k: "setta", titolo: "Riunisci la setta", testo: "Tra le onde, i tuoi confratelli aspettano un ordine." });
    const ospiteDi = N2.ospite && N2.ospite[p.id];
    if (ospiteDi) {
      const h = giocatore(s, ospiteDi);
      return [{ k: "tavolo", titolo: "Una mano di poker con " + h.nome, testo: "5 carte a te, 5 al banco. Vince la mano migliore: ti paga il doppio.", puntata: true },
        { k: "brinda", a: ospiteDi, titolo: "Brinda con " + h.nome, testo: "Un bicchiere con chi ti ospita: +2 fama se accetta.", costo: 20_000 },
        { k: "aspetta", titolo: "Goditi la vista", testo: "Dal piano " + h.piani + " la Laguna sembra piccola." }];
    }
    if (dove === "palazzo" && haPiano(p, "casino_privato") && !(N2.serate && N2.serate[p.id])) sp.push({ k: "serata", titolo: "Apri una serata nel tuo Casinò", testo: "Gli altri ricevono l'invito. Chi viene paga l'ingresso, e il banco sei tu." });
    if (dove === "palazzo" && haPiano(p, "spa") && !(N2.spaFatta && N2.spaFatta[p.id])) sp.push({ k: "spa", titolo: "Una serata nella tua Spa", testo: "Un ospite famoso, fotografi discreti. 50.000 €, +3 fama." });
    if (dove === "palazzo" && haPiano(p, "sala_insonorizzata") && lv >= 1) sp.push({ k: "polizia", titolo: "Un incontro nella sala insonorizzata", testo: "Qui dentro nessuno ascolta. Puoi comprare un poliziotto o il banchiere." });
    if (dove === "palazzo" && p.sporchi > 0 && p.veicoli.includes("jet")) sp.push({ k: "paradiso", titolo: "Volo nel paradiso fiscale", testo: "Il jet è pronto. All'alba i soldi sporchi saranno puliti, meno la commissione." });
    if (haOggetto(p, "macchina") && dove !== "palazzo") {
      const q = s.players.find((x) => x.id !== p.id && N2.dove[x.id] === dove && !N2.viaggio[x.id] && !s.notteFatti[x.id]);
      if (q) sp.push({ k: "foto", bersaglio: q.id, titolo: "Fotografa " + q.nome, testo: q.nome + " è qui. Se fa qualcosa di strano, avrai una Prova." });
    }
    const fissa = ATTIVITA_NOTTE[dove] ? { k: "fissa", ...ATTIVITA_NOTTE[dove] } : null;
    const tutte = fissa ? [...[...occ, ...sp].slice(0, 2), fissa] : [...occ, ...sp].slice(0, 3);
    if (tutte.length < 3) {
      const tardi = s.notte.occasioni.some((o) => !o.preso && o.luogo === dove && o.dalle > N2.ora && (!o.riservata || o.riservata === p.id));
      tutte.push({ k: "aspetta", titolo: dove === "palazzo" ? "Resta a casa un'ora" : "Resta qui e guardati intorno", testo: tardi ? "Si dice che più tardi qui arrivi qualcuno." : dove === "palazzo" ? "Ti versi da bere e guardi le luci della Laguna." : "Passi un'ora a osservare chi entra e chi esce." });
    }
    return tutte;
  }

  function inNotte2(s, p) {
    if (s.fase !== "notte" || !s.notte) err("Questa azione si fa solo di notte.");
    if (s.notteFatti[p.id]) err("Per te la notte è finita.");
    if (p.faro > 0) err("Sei al Faro: stanotte non puoi muoverti.");
  }
  function oraLibera(s, p) {
    inNotte2(s, p);
    if (s.notte.chiuso[p.id]) err("Hai già deciso cosa fare in quest'ora. Aspetta gli altri.");
    if (s.notte.viaggio[p.id]) err("Sei in viaggio.");
  }
  function qui(s, p, luogo, cosa) {
    if (s.notte.viaggio[p.id]) err("Sei in viaggio.");
    if (s.notte.dove[p.id] !== luogo) err(cosa + " si fa a " + LUOGHI[luogo].nome + ".");
  }
  function occasioniVisibili(s, p) {
    if (!s.notte || s.notte.viaggio[p.id]) return [];
    const dove = s.notte.dove[p.id], ora = s.notte.ora;
    return s.notte.occasioni.filter((o) => !o.preso && o.luogo === dove && ora >= o.dalle && ora < o.alle && (!o.riservata || o.riservata === p.id));
  }

  function vai(s, p, luogo) {
    oraLibera(s, p);
    if (!LUOGHI[luogo]) err("Luogo sconosciuto.");
    if (!luogoAperto(s, luogo)) err("Questo posto non si è ancora aperto per te.");
    const da = s.notte.dove[p.id];
    if (da === luogo) err("Sei già qui.");
    const ore = oreViaggio(s, p, da, luogo);
    s.notte.viaggio[p.id] = { verso: luogo, restano: ore, da };
    if (s.notte.ospite) delete s.notte.ospite[p.id];
    s.notte.chiuso[p.id] = true;
    racconta(s, p, "Parti verso " + LUOGHI[luogo].nome + (ore > 1 ? ": ci vorranno 2 ore, attraverso i ponti." : "."));
    controllaOra(s);
  }
  function aspetta(s, p) {
    oraLibera(s, p);
    s.notte.chiuso[p.id] = true;
    const osp = s.notte.ospite && s.notte.ospite[p.id];
    racconta(s, p, osp ? "Resti alla serata di " + giocatore(s, osp).nome + ", un bicchiere in mano e la Laguna sotto i piedi." : s.notte.dove[p.id] === "palazzo" ? "Resti nel tuo Palazzo a guardare le luci della Laguna." : "Resti a " + nomeLuogo(s.notte.dove[p.id]) + " a guardarti intorno.");
    controllaOra(s);
  }
  function nomeLuogo(l) { return LUOGHI[l] ? LUOGHI[l].nome : l; }
  function tornaACasa(s, p) {
    inNotte2(s, p);
    s.notteFatti[p.id] = true; s.notte.chiuso[p.id] = true;
    delete s.notte.viaggio[p.id];
    s.notte.dove[p.id] = "palazzo";
    racconta(s, p, "Torni al tuo palazzo. Per stanotte basta così.");
    controllaOra(s);
  }
  function compraOggetto(s, p, id) {
    inNotte2(s, p);
    const O = OGGETTI[id]; if (!O) err("Oggetto sconosciuto.");
    qui(s, p, O.dove, "Questo acquisto");
    p.valigetta = p.valigetta || [];
    if (p.valigetta.length >= postiValigetta(s)) err("La valigetta è piena (" + postiValigetta(s) + " posti).");
    if (!O.notti && !O.consuma && haOggetto(p, id)) err("Ce l'hai già.");
    pagaMisto(s, p, O.prezzo);
    p.valigetta.push({ id, notti: O.notti || null });
    racconta(s, p, "Compri: " + O.nome + ".");
  }
  function soffiata(s, p, luogo) {
    inNotte2(s, p);
    qui(s, p, "mercato", "Comprare una soffiata");
    if (!LUOGHI[luogo] || luogo === "palazzo") err("Su quale posto vuoi la soffiata?");
    pagaMisto(s, p, 50_000);
    const lv = s.notte.pericolo[luogo];
    const frase = { tranquillo: "stanotte è tranquillo, puoi stare sereno", agitato: "c'è movimento, meglio stare attenti", pericoloso: "è pieno di sbirri, stanne lontano" }[lv];
    racconta(s, p, "Un informatore ti sussurra che a " + LUOGHI[luogo].nome + " " + frase + ".");
  }
  function prendiOccasione(s, p, n, oggetti) {
    oraLibera(s, p);
    const o = s.notte.occasioni.find((x) => x.n === n);
    if (!o || !occasioniVisibili(s, p).includes(o)) err("Questa occasione non c'è più.");
    const O = OCCASIONI.find((x) => x.id === o.id);
    oggetti = [...new Set(oggetti || [])].filter((id) => haOggetto(p, id));
    if (O.costo > 0) pagaMisto(s, p, O.costo);
    o.preso = p.id;
    s.notte.fatto[p.id] = { n, oggetti };
    s.notte.chiuso[p.id] = true;
    racconta(s, p, O.legale ? O.nome + ": ci stai." : O.nome + ": accetti." + (oggetti.length ? " Porti con te: " + oggetti.map((x) => OGGETTI[x].nome.toLowerCase()).join(", ") + "." : ""));
    risolviOccasione(s, p, s.notte.fatto[p.id]);
    controllaOra(s);
  }
  function fotografa(s, p, idBersaglio) {
    oraLibera(s, p);
    if (!haOggetto(p, "macchina")) err("Ti serve la macchina fotografica (si compra al Club Neon).");
    if (idBersaglio === p.id) err("Non puoi fotografare te stesso.");
    giocatore(s, idBersaglio);
    s.notte.foto[p.id] = idBersaglio; s.notte.chiuso[p.id] = true;
    racconta(s, p, "Ti apposti con la macchina fotografica e aspetti " + giocatore(s, idBersaglio).nome + ".");
    controllaOra(s);
  }
  // azioni "che prendono l'ora" e si fanno in un posto preciso
  function ricicla2(s, p, metodo, importo) {
    oraLibera(s, p);
    if (metodo === "paradiso") qui(s, p, "palazzo", "Il viaggio nel paradiso fiscale (col jet)");
    else qui(s, p, "casino", "Ripulire i soldi");
    const prima = p.cash;
    ricicla(s, p, metodo, importo);
    if (metodo !== "paradiso" && haOggetto(p, "fiches")) { const bonus = round((p.cash - prima) * 0.1); p.cash += bonus; togliOggetto(p, "fiches"); }
    s.notte.chiuso[p.id] = true;
    racconta(s, p, "Ripulisci " + euro(p.cash - prima) + ": ora sono soldi puliti.");
    controllaOra(s);
  }
  function corrompi2(s, p, chi, isola, sporchi) {
    oraLibera(s, p);
    const sala = s.notte.dove[p.id] === "palazzo" && !s.notte.ospite?.[p.id] && haPiano(p, "sala_insonorizzata") && !s.notte.viaggio[p.id];
    if (!sala) { if (chi === "banchiere") qui(s, p, "casino", "Incontrare il banchiere Lenz"); else qui(s, p, "club", "Incontrare la polizia"); }
    const ok = corrompi(s, p, chi, isola, sporchi);
    s.notte.chiuso[p.id] = true;
    racconta(s, p, ok ? "Una stretta di mano in un angolo buio. Accordo fatto." : "Ti guarda, intasca i soldi e se ne va. Brutto segno.");
    controllaOra(s);
  }
  function articolo2(s, p, a) {
    oraLibera(s, p);
    qui(s, p, "redazione", "Comprare un articolo");
    articolo(s, p, a.bersaglio, a.tono, a.importo, a.testo, !!a.sporchi);
    s.notte.chiuso[p.id] = true;
    racconta(s, p, "Lasci una busta al caporedattore. Domattina se ne parlerà.");
    controllaOra(s);
  }
  function settaAlFaro(s, p, fn) {
    oraLibera(s, p);
    qui(s, p, "faro", "Le riunioni della setta");
    fn();
    s.notte.chiuso[p.id] = true;
    racconta(s, p, "Al Faro, tra le onde, la setta si riunisce.");
    controllaOra(s);
  }

  function attivi(s) { return s.players.filter((p) => !s.notteFatti[p.id] && p.faro === 0); }
  function controllaOra(s) {
    if (s.fase !== "notte" || !s.notte) return;
    for (const p of attivi(s)) if (s.notte.viaggio[p.id]) s.notte.chiuso[p.id] = true;
    if (attivi(s).every((p) => s.notte.pronto[p.id])) risolviOra(s);
  }
  function risolviOccasione(s, p, f) {
    const o = s.notte.occasioni.find((x) => x.n === f.n);
    const O = OCCASIONI.find((x) => x.id === o.id);
    const usati = f.oggetti || [];
    for (const id of usati) if (OGGETTI[id].consuma) togliOggetto(p, id);
    if (O.legale) {
      p.fama += O.fama + lustro(s, p);
      racconta(s, p, O.id === "festa" ? "Alla festa stringi le mani giuste. La tua fama cresce." : "Champagne, stelle e armatori. Domani tutti parleranno di te.");
      return;
    }
    p.affariStanotte.push({ tipo: O.id }); p.pulitoCiclo = false; p.affariOk += 1; p.reputazione += 2;
    p.peggiorReato = peggio(p.peggiorReato, O.gravita);
    let tracce = O.tracce * 0.75 * (0.7 + 0.6 * rng(s));
    const isola = LUOGHI[o.luogo].isola;
    let pg = P_GUAI[LIVELLI_PERICOLO.indexOf(s.notte.pericolo[o.luogo])];
    if (p.corrotti["agente_" + isola]) pg *= 0.6;
    if (p.corrotti.commissario) pg *= 0.8;
    if (s.leggi.includes("polizia_doppia_" + isola)) pg *= 1.4;
    const guaio = O.pericoli.length && rng(s) < pg ? O.pericoli[Math.floor(rng(s) * O.pericoli.length)] : null;
    let guadagno = O.guadagno ? (O.guadagno[0] + rng(s) * (O.guadagno[1] - O.guadagno[0])) * (1 + 0.2 * lustro(s, p)) * N.bonusIllegale : 0;
    if (guaio) {
      const G = PERICOLI[guaio];
      const salvatore = usati.find((id) => (OGGETTI[id].salva || []).includes(guaio)) || (guaio === "guardia" && haOggetto(p, "motoscafo") ? "motoscafo" : null) || (guaio === "pattuglia" && haOggetto(p, "furgone") ? "furgone" : null);
      if (salvatore) racconta(s, p, "Mentre lavori " + G.arriva + ", ma " + G.salvo + ".");
      else {
        racconta(s, p, "Mentre lavori " + G.arriva + ".");
        if (G.danno === "perso") { guadagno = 0; tracce += 6; racconta(s, p, "Molli tutto e scappi. Il carico è perso, e con lui i soldi che ci avevi messo."); }
        else if (G.danno === "riconosciuto") { tracce += 15; p.stato = Math.max(p.stato, 2); racconta(s, p, "Hai l'impressione di essere stato riconosciuto. Da domani qualcuno ti terrà d'occhio."); }
        else if (G.danno === "allarme") { guadagno = 0; tracce += 18; p.stato = Math.max(p.stato, 3); racconta(s, p, "Sirene in lontananza. Scappi a mani vuote, e la polizia ha un nome: il tuo."); notizia(s, "Tentato colpo a " + NOMI_ISOLE[isola] + ". La polizia segue una pista.", "scandalo"); }
        else if (G.danno === "foto") { tracce += 8; const altri = s.players.filter((x) => x.id !== p.id); if (altri.length) { const b = altri[Math.floor(rng(s) * altri.length)]; b.prove.push({ su: p.id, ciclo: s.ciclo + 1, cosa: O.nome }); privato(s, b, "Un fotografo ti vende una foto di " + p.nome + " durante \"" + O.nome + "\". È una Prova."); } racconta(s, p, "Qualcuno ora ha una tua foto. Non sai chi."); }
        else if (G.danno === "retata") { guadagno = 0; tracce += 10; const prima = (p.valigetta || []).length; if (!haPiano(p, "piani_segreti")) p.valigetta = (p.valigetta || []).filter((x) => !OGGETTI[x.id].illegale); racconta(s, p, "Ti perquisiscono e ti lasciano andare. Il carico è sequestrato" + (prima > p.valigetta.length ? ", e anche gli oggetti illegali della valigetta." : haPiano(p, "piani_segreti") ? ". Gli oggetti illegali però sono al sicuro nei piani segreti del tuo Palazzo." : ".")); }
        else if (G.danno === "meta") { guadagno *= 0.5; racconta(s, p, "Nella confusione ti porti via solo metà del bottino."); }
      }
    }
    if (O.prova && (!guaio || usati.includes("maschera"))) {
      const altri = s.players.filter((x) => x.id !== p.id && x.tracce > 10);
      if (altri.length) { const b = altri[Math.floor(rng(s) * altri.length)]; p.prove.push({ su: b.id, ciclo: s.ciclo + 1, cosa: "confidenze del politico" }); racconta(s, p, "Il politico ti racconta segreti su " + b.nome + ". Ora hai una Prova."); }
      else racconta(s, p, "Il politico parla tanto ma non dice niente di utile.");
    }
    if (o.riservata === p.id && usati.includes("telefono")) tracce *= 0.5;
    if (s.leggi.includes("polizia_doppia_" + isola)) tracce *= 1.5;
    p.tracce += tracce;
    if (guadagno > 0) {
      p.sporchi += round(guadagno); // il guadagno e' tutto quello che torna indietro (il costo era gia' stato pagato)
      racconta(s, p, "Torni con " + euro(guadagno) + " in contanti sporchi.");
    }
    if (p.offertaBoss && o.luogo === "porto") { p.sporchi += round(guadagno); p.tracce += tracce; p.offertaBoss = false; racconta(s, p, "Il boss straniero mantiene la parola: il carico vale il doppio."); }
  }
  function risolviOra(s) {
    const N2 = s.notte;
    // 1. le occasioni prese in quest'ora sono gia' state risolte al momento della scelta
    const fineRacc = {};
    for (const p of s.players) fineRacc[p.id] = (N2.racconto[p.id] || []).length;
    // 2. i viaggi
    for (const p of s.players) {
      const v = N2.viaggio[p.id]; if (!v) continue;
      v.restano -= 1;
      if (v.restano <= 0) {
        N2.dove[p.id] = v.verso; delete N2.viaggio[p.id];
        if (N2.ospite) delete N2.ospite[p.id];
        if (v.serata) arrivaSerata(s, p, v.serata);
        else if (v.verso === "palazzo") racconta(s, p, "Sei di nuovo nel tuo palazzo.", true);
        else racconta(s, p, "Arrivi a " + LUOGHI[v.verso].nome + ". " + indizio(s, v.verso), true);
      }
    }
    // 3. gli incontri
    const gruppi = {};
    for (const p of s.players) {
      if (s.notteFatti[p.id] || p.faro > 0 || N2.viaggio[p.id]) continue;
      const d = N2.dove[p.id]; if (d === "palazzo") continue;
      (gruppi[d] = gruppi[d] || []).push(p);
    }
    for (const [d, g] of Object.entries(gruppi)) {
      if (g.length < 2) continue;
      for (const p of g) {
        const altri = g.filter((x) => x.id !== p.id);
        racconta(s, p, "A " + LUOGHI[d].nome + " incroci " + altri.map((x) => x.nome).join(" e ") + ". Vi guardate un attimo.", true);
      }
    }
    for (const p of s.players) {
      const b = N2.foto[p.id]; if (!b) continue;
      const t = giocatore(s, b);
      const insieme = !N2.viaggio[t.id] && !N2.viaggio[p.id] && N2.dove[t.id] === N2.dove[p.id] && N2.dove[p.id] !== "palazzo";
      const f = N2.fatto[t.id];
      if (!insieme) racconta(s, p, t.nome + " non si fa vedere. Nessuna foto.");
      else if (f && !OCCASIONI.find((o) => o.id === N2.occasioni.find((x) => x.n === f.n).id).legale) {
        if ((f.oggetti || []).includes("maschera")) racconta(s, p, "Scatti, ma in foto c'è solo una maschera.");
        else { p.prove.push({ su: t.id, ciclo: s.ciclo + 1, cosa: "foto notturna" }); racconta(s, p, "Click. Hai una foto di " + t.nome + " con le mani nel sacco. È una Prova."); }
      } else racconta(s, p, "Fotografi " + t.nome + ", ma non sta facendo niente di strano.");
    }
    for (const pr of N2.proposte || []) if (pr.stato === "attesa") {
      pr.stato = "scaduta";
      const da = giocatore(s, pr.da);
      if (pr.importo) restituisci_(da, pr);
      racconta(s, da, giocatore(s, pr.a).nome + " non ti ha risposto." + (pr.importo ? " Ti riprendi i soldi." : ""));
    }
    for (const [chi, chiSeguito] of Object.entries(N2.segue || {})) {
      const p = giocatore(s, chi), q = giocatore(s, chiSeguito);
      const dove = s.notteFatti[q.id] ? "a casa sua" : N2.viaggio[q.id] ? "verso " + nomeLuogo(N2.viaggio[q.id].verso) : "a " + nomeLuogo(N2.dove[q.id]);
      racconta(s, p, "Segui " + q.nome + " da lontano: va " + dove + ".", true);
    }
    N2.segue = {};
    // 4. il riepilogo dell'ora: chi hai visto, cosa hai guadagnato, quanto rischio hai preso
    const per = {};
    for (const p of s.players) {
      const b = N2.base[p.id]; if (!b) continue;
      const d = N2.dove[p.id];
      const visti = N2.viaggio[p.id] || d === "palazzo" ? [] : s.players.filter((x) => x.id !== p.id && !N2.viaggio[x.id] && !s.notteFatti[x.id] && x.faro === 0 && N2.dove[x.id] === d).map((x) => x.nome);
      const dt = p.tracce - b.tracce;
      per[p.id] = {
        dove: N2.viaggio[p.id] ? "in viaggio" : nomeLuogo(d), visti,
        soldi: round(p.cash + p.sporchi - b.soldi), sporchi: round(p.sporchi - b.sporchi), fama: Math.round(p.fama - b.fama),
        rischio: dt <= 0.5 ? 0 : dt < 8 ? 1 : dt < 16 ? 2 : 3,
        righe: (N2.racconto[p.id] || []).slice(N2.inizioRacc[p.id] || 0, fineRacc[p.id]),
        aCasa: !!s.notteFatti[p.id],
      };
    }
    s.riepOra = { n: (s.riepOra ? s.riepOra.n : 0) + 1, ciclo: s.ciclo, da: ORE[N2.ora], a: ORE[N2.ora + 1], per };
    // 5. l'ora avanza
    N2.ora += 1; N2.chiuso = {}; N2.fatto = {}; N2.foto = {}; N2.pronto = {}; N2.daScelta = {};
    for (const p of s.players) { N2.inizioRacc[p.id] = fineRacc[p.id]; if (s.notteFatti[p.id] || p.faro > 0) N2.chiuso[p.id] = true; }
    if (N2.ora >= 6) return fineNotte(s);
    apriOra(s);
    controllaOra(s);
  }
  function fineNotte(s) {
    for (const p of s.players) {
      if (s.notte.dove[p.id] !== "palazzo" && !p.faro) racconta(s, p, "Alle 4 torni a casa, mentre il cielo schiarisce.");
      p.raccontoNotte = s.notte.racconto[p.id] || [];
      // gli oggetti a tempo
      p.valigetta = (p.valigetta || []).map((o) => o.notti ? { ...o, notti: o.notti - 1 } : o).filter((o) => o.notti === null || o.notti === undefined || o.notti > 0);
      s.notteFatti[p.id] = true;
    }
    s.notte = null;
    alba(s);
  }

  // ------------------------------------------------------------ permessi e cantieri (stile Hotel)
  function chiediPermesso(s, p, idLotto) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    const l = lotto(s, idLotto);
    if (l.owner !== p.id || l.tipoCasella !== "lotto") err("Il permesso si chiede per un tuo lotto.");
    if (l.cantiere) err("C'è già un cantiere aperto.");
    if (l.permesso) err("Il permesso ce l'hai già: puoi costruire.");
    if (l.lvl >= 5) err("Il lotto è già al massimo.");
    const turno = s.ciclo * 100 + s.giorno * 10 + s.turno;
    if (p.permessoTurno === turno) err("Al Municipio si va una volta per turno.");
    p.permessoTurno = turno;
    const primo = s.principianti && !p.primoPermesso;
    p.primoPermesso = true;
    const x = primo ? 0 : rng(s);
    if (x < 0.55) { l.permesso = true; l.negato = false; log(s, p.nome + " ottiene il permesso per costruire in " + l.nome + ".", p.id); return "approvato"; }
    if (x < 0.85) { privato(s, p, "Municipio: la tua pratica per " + l.nome + " è rimandata. Riprova al prossimo turno."); return "rimandato"; }
    l.negato = true;
    privato(s, p, "Municipio: permesso negato per " + l.nome + ". L'assessore però ha fatto capire che \"si può sempre parlare\".");
    return "negato";
  }
  // Agenzia immobiliare (app del telefono): una volta per turno compri un terreno libero
  // dell'isola dove sei, anche senza fermarti sopra. Costa il 20% in più (prezzo pieno se sei passato da un'Agenzia).
  function prezzoAgenzia(s, p, l) { return p.agenziaSconto ? l.prezzo : round(l.prezzo * 1.2); }
  function agenzia(s, p, idLotto) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("L'Agenzia si usa di giorno, nel tuo turno.");
    if (!p.haTirato) err("Prima tira i dadi: l'Agenzia lavora sull'isola dove arrivi.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    if (p.faro > 0) err("Dal Faro non puoi comprare terreni.");
    if (p.agenziaUsata) err("All'Agenzia si compra un terreno per turno.");
    const l = lotto(s, idLotto);
    if (l.owner != null) err("Questo terreno ha già un proprietario.");
    if (l.tipoCasella !== "lotto" && l.tipoCasella !== "molo") err("Questo non è un terreno.");
    const isola = casella(s, p).isola || isolaDiPos(p.pos);
    if (l.isola !== isola) err("L'Agenzia vende solo terreni di " + NOMI_ISOLE[isola] + ", l'isola dove sei.");
    const costo = prezzoAgenzia(s, p, l);
    if (p.cash < costo) err("Non hai abbastanza soldi puliti: serve " + euro(costo) + ".");
    p.cash -= costo; l.owner = p.id; p.agenziaUsata = true; flusso(s, p, null, costo, "Agenzia: " + l.nome, true);
    log(s, p.nome + " compra " + l.nome + " tramite l'Agenzia per " + euro(costo) + ".", p.id);
    notizia(s, p.nome + " compra " + l.nome + ".", "affari");
    controllaValoreLusso(s, l);
  }
  // Licenza del casinò chiesta dall'app Municipio: come i permessi (approvata, rimandata o negata).
  function chiediLicenza(s, p) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Al Municipio si va di giorno, nel tuo turno.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    if (s.licenze.includes(p.id)) err("La licenza ce l'hai già.");
    if (p.cash < 500_000) err("La licenza costa 500.000 €.");
    const turno = s.ciclo * 100 + s.giorno * 10 + s.turno;
    if (p.licenzaTurno === turno) err("La domanda di licenza si fa una volta per turno.");
    p.licenzaTurno = turno;
    const x = rng(s) - Math.min(0.2, p.fama / 400);
    if (x < 0.45) { p.cash -= 500_000; s.licenze.push(p.id); p.licenzaNegata = false; log(s, p.nome + " ottiene la licenza per aprire un casinò.", p.id); privato(s, p, "Municipio: licenza del casinò APPROVATA. Pagati 500.000 €. Ora puoi costruire un casinò a Baia Flamingo o a Isola Corona."); return "approvato"; }
    if (x < 0.8) { privato(s, p, "Municipio: la domanda di licenza è rimandata. Riprova al prossimo turno (più fama hai, più è facile)."); return "rimandato"; }
    p.licenzaNegata = true;
    privato(s, p, "Municipio: licenza NEGATA. L'assessore però ti guarda e dice: \"Con una busta, tutto si sistema.\"");
    return "negato";
  }
  function bustaLicenza(s, p) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (!p.licenzaNegata) err("Non c'è nessuna licenza negata da sistemare.");
    pagaMisto(s, p, 650_000);
    s.licenze.push(p.id); p.licenzaNegata = false;
    p.tracce += 10; p.pulitoCiclo = false; p.peggiorReato = peggio(p.peggiorReato, "lieve");
    privato(s, p, "Una busta gonfia passa sotto il tavolo. La licenza del casinò è tua.");
    log(s, p.nome + " ottiene la licenza per aprire un casinò.", p.id);
  }
  function regaloAssessore(s, p, idLotto) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Non è il tuo turno.");
    const l = lotto(s, idLotto);
    if (l.owner !== p.id || !l.negato) err("Non c'è nessun permesso negato da sistemare.");
    const costo = Math.max(50_000, round(l.prezzo * 0.1));
    pagaMisto(s, p, costo);
    l.permesso = true; l.negato = false;
    p.tracce += 6; p.pulitoCiclo = false; p.peggiorReato = peggio(p.peggiorReato, "lieve");
    privato(s, p, "Una busta passa di mano. Il permesso per " + l.nome + " è approvato.");
    log(s, p.nome + " ottiene il permesso per costruire in " + l.nome + ".", p.id);
  }
  function chiudiCantieri(s) {
    for (const l of s.lotti) if (l.cantiere) {
      if (!l.owner) { l.cantiere = null; l.permesso = false; continue; }
      const p = giocatore(s, l.owner);
      l.tipo = l.cantiere.tipo; l.lvl = l.cantiere.lvl; l.cantiere = null;
      notizia(s, (l.lvl === 1 ? "Apre " : "Si amplia ") + ATTIVITA[l.tipo].nome.toLowerCase() + " di " + p.nome + " in " + l.nome + (l.lvl > 1 ? ": ora è di livello " + l.lvl : "") + ".", "affari");
      p.fama += l.lvl === 1 ? 1 : 0;
      if (ATTIVITA[l.tipo].lusso && l.lvl >= 3) p.fama += 3;
      controllaValoreLusso(s, l);
    }
  }

  // ------------------------------------------------------------ imprevisti di giorno
  function chiamataLampo(s, p) {
    if (livelloSblocco(s) < 1 || p.faro > 0 || p.bot && false) return;
    if (rng(s) >= 0.12) return;
    const g = round(150_000 + rng(s) * 150_000);
    s.pending = { tipo: "chiamata", giocatore: p.id, guadagno: g, testo: "Squilla il telefono, numero sconosciuto: \"Ho un lavoretto veloce, oggi. " + euro(g) + " in contanti. Ci stai? Non richiamarmi da questo numero.\"" };
  }
  function rispondiChiamata(s, p, si, conTelefono) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "chiamata" || pd.giocatore !== p.id) err("Nessuna chiamata in attesa.");
    s.pending = null;
    if (!si) { privato(s, p, "Riattacchi. Meglio non rischiare."); return; }
    const tel = conTelefono && haOggetto(p, "telefono");
    if (tel) togliOggetto(p, "telefono");
    p.sporchi += pd.guadagno; p.tracce += tel ? 2 : 9; p.pulitoCiclo = false; p.peggiorReato = peggio(p.peggiorReato, "lieve");
    privato(s, p, "Lavoretto fatto: +" + euro(pd.guadagno) + " in contanti sporchi." + (tel ? " Il telefono usa-e-getta finisce in mare." : " Hai usato il tuo numero: qualcuno potrebbe ascoltare."));
  }
  function perquisizioni(s) {
    for (const p of s.players) if (p.stato >= 2 && (p.valigetta || []).some((o) => OGGETTI[o.id].illegale) && rng(s) < 0.3) {
      p.valigetta = p.valigetta.filter((o) => !OGGETTI[o.id].illegale);
      privato(s, p, "All'alba la polizia perquisisce il tuo palazzo: sequestrati gli oggetti illegali della valigetta.");
      p.tracce += 5;
    }
  }

  // ------------------------------------------------------------ sette
  function livelloSetta(s, st) {
    if (!st) return 0;
    let lv = 1;
    if (st.tesoro >= N.settaLivelli[1] && st.membri.length >= 3) lv = 2;
    if (st.tesoro >= N.settaLivelli[2] && st.membri.length >= 3 && (st.pngReclutati || 0) >= 1) lv = 3;
    if (st.tesoro >= N.settaLivelli[3] && st.membri.length >= 3 && (st.pngReclutati || 0) >= 1) lv = 4;
    return lv;
  }
  function fondaSetta(s, p, nome, motto) {
    inNotte(s, p);
    if (p.settaFondata) err("Hai già fondato una setta.");
    if (patrimonio(s, p, false) < N.settaPatrimonio) err("Per fondare una setta serve un patrimonio di " + euro(N.settaPatrimonio) + ".");
    if (p.fama < N.settaFama && p.reputazione < 20) err("Serve fama 20 (o una buona Reputazione nel giro).");
    if (!nome) err("Dai un nome alla setta.");
    const st = { id: "s" + s.prossimoId++, nome: String(nome).slice(0, 40), motto: String(motto || "").slice(0, 80), gm: p.id, membri: [p.id], tesoro: 0, operazioni: 0, pngReclutati: 0 };
    s.sette.push(st); p.sette.push(st.id); p.settaFondata = st.id;
    privato(s, p, "Hai fondato la setta \"" + st.nome + "\". Sei il Gran Maestro. Invita altri membri.");
    notizia(s, "Strani simboli compaiono sui muri della Laguna. Qualcuno dice che è nata una nuova setta.", "voce");
  }
  function invitaSetta(s, p, idSetta, idInvitato) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro invita.");
    if (st.membri.includes(idInvitato)) err("È già un membro.");
    s.inviti.push({ setta: idSetta, a: idInvitato, da: p.id });
    privato(s, giocatore(s, idInvitato), "Hai ricevuto un invito segreto da una setta: \"" + st.nome + "\".");
  }
  function rispondiInvito(s, p, idSetta, si) {
    const i = s.inviti.findIndex((x) => x.setta === idSetta && x.a === p.id); if (i < 0) err("Nessun invito.");
    s.inviti.splice(i, 1);
    const st = s.sette.find((x) => x.id === idSetta);
    if (si) { st.membri.push(p.id); p.sette.push(idSetta); privato(s, p, "Sei entrato nella setta \"" + st.nome + "\"."); privato(s, giocatore(s, st.gm), p.nome + " è entrato nella tua setta."); }
  }
  function versaSetta(s, p, idSetta, importo, sporchi) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    importo = Math.floor(importo || 0); if (importo <= 0) err("Importo non valido.");
    if (sporchi) { if (p.sporchi < importo) err("Non hai abbastanza sporchi."); p.sporchi -= importo; }
    else { if (p.cash < importo) err("Non hai abbastanza soldi."); p.cash -= importo; }
    st.tesoro += importo;
  }
  function recluta(s, p, idSetta, chi) {
    inNotte(s, p);
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro recluta.");
    if (livelloSetta(s, st) < 2) err("Per reclutare personaggi serve una setta di livello 2.");
    const prezzi = { commissario: 3_000_000, giudice: 3_500_000, banchiere: 2_500_000 };
    if (!prezzi[chi]) err("Personaggio sconosciuto.");
    if (st.tesoro < prezzi[chi]) err("Il Tesoro non basta (" + euro(prezzi[chi]) + ").");
    st.tesoro -= prezzi[chi]; st.pngReclutati = (st.pngReclutati || 0) + 1; st[chi] = true;
    for (const id of st.membri) giocatore(s, id).tracce += 3;
    privato(s, p, "Il " + chi + " ora appartiene alla setta.");
  }
  function operazione(s, p, idSetta, tipo, bersaglio, direzione) {
    inNotte(s, p);
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro lancia le operazioni.");
    const lv = livelloSetta(s, st);
    const OPS = {
      manipola: { lv: 2, costo: 1_000_000, nome: "Manipolare un titolo" },
      blackout: { lv: 3, costo: 3_000_000, nome: "Blackout di un'isola" },
      evasione: { lv: 3, costo: 2_000_000, nome: "Evasione dal Faro" },
      fantoccio: { lv: 4, costo: 10_000_000, nome: "Sindaco fantoccio" },
    };
    const O = OPS[tipo]; if (!O) err("Operazione sconosciuta.");
    if (lv < O.lv) err(O.nome + " richiede una setta di livello " + O.lv + ".");
    if (st.tesoro < O.costo) err("Il Tesoro non basta (" + euro(O.costo) + ").");
    st.tesoro -= O.costo; st.operazioni += 1;
    const riuscita = rng(s) < 0.75;
    for (const id of st.membri) { const m = giocatore(s, id); m.tracce += 5; m.pulitoCiclo = false; }
    if (!riuscita) { privato(s, p, O.nome + ": l'operazione è fallita."); notizia(s, "Fallito un misterioso piano nella Laguna.", "voce"); return; }
    if (tipo === "manipola") {
      if (!AZIENDE.includes(bersaglio)) err("Scegli un titolo.");
      const f = lv >= 3 ? 0.4 : 0.15;
      s.borsa[bersaglio] *= direzione === "giu" ? 1 - f : 1 + f;
      notizia(s, "Movimento improvviso su " + bersaglio + " (" + (direzione === "giu" ? "-" : "+") + Math.round(f * 100) + "%). Nessuno sa spiegarlo.", "borsa");
    } else if (tipo === "blackout") {
      s.blackout = bersaglio; notizia(s, "Blackout totale a " + (NOMI_ISOLE[bersaglio] || bersaglio) + ". Nessuno ha visto niente.", "evento");
    } else if (tipo === "evasione") {
      const b = giocatore(s, bersaglio); b.faro = 0; notizia(s, b.nome + " è evaso dal Faro!", "evento");
    } else if (tipo === "fantoccio") {
      s.sindaco = p.id; s.sindacoFino = s.ciclo + 2; notizia(s, "Colpo di scena al Municipio: il Sindaco si dimette. Il nuovo Sindaco sembra sapere già cosa fare.", "politica");
    }
    privato(s, p, O.nome + ": riuscita.");
  }

  // ------------------------------------------------------------ articoli e contratti
  function articolo(s, p, idBersaglio, tono, importo, testo, sporchi) {
    importo = Math.floor(importo || 0);
    if (importo < 125_000) err("Un articolo costa almeno 125.000 €.");
    if (sporchi) { if (p.sporchi < importo * 0.8) err("Non hai abbastanza sporchi."); p.sporchi -= importo * 0.8; p.tracce += 3; }
    else { if (p.cash < importo) err("Non hai abbastanza soldi."); p.cash -= importo; }
    const b = giocatore(s, idBersaglio);
    const forza = Math.min(20, Math.round(importo / 50_000));
    // credibilita': uno scandalo su chi ha davvero tracce e' credibile; su chi e' pulito puo' ritorcersi
    if (tono === "scandalo") {
      const credibile = b.tracce > 25 || b.stato >= 1 || p.prove.some((x) => x.su === b.id);
      if (!credibile && rng(s) < 0.4) {
        p.fama = Math.max(0, p.fama - forza); notizia(s, "Smentita: l'articolo contro " + b.nome + " era falso. Brutta figura per chi lo ha pagato.", "fama");
        return;
      }
      b.fama = Math.max(0, b.fama - forza); b.tracce += credibile ? 10 : 0;
      notizia(s, testo ? "\"" + String(testo).slice(0, 140) + "\"" : "Inchiesta della Gazzetta su " + b.nome + ": troppe cose non tornano.", "scandalo");
    } else {
      b.fama += Math.round(forza * 0.8);
      notizia(s, testo ? "\"" + String(testo).slice(0, 140) + "\"" : b.nome + " è il nuovo volto vincente della Laguna.", "fama");
    }
  }
  function proponiContratto(s, p, c) {
    const a = giocatore(s, c.a);
    if (a.id === p.id) err("Non puoi fare un contratto con te stesso.");
    const k = {
      id: "c" + s.prossimoId++, da: p.id, a: a.id, tipo: c.tipo === "notarile" ? "notarile" : "parola",
      pagoOra: Math.max(0, Math.floor(c.pagoOra || 0)), chiPagaOra: c.chiPagaOra === "a" ? "a" : "da",
      pagoDopo: Math.max(0, Math.floor(c.pagoDopo || 0)), chiPagaDopo: c.chiPagaDopo === "da" ? "da" : "a",
      scadenza: s.ciclo + Math.max(1, Math.min(4, Math.floor(c.cicli || 1))), garanzia: c.garanzia || null,
      lottoCeduto: c.lottoCeduto || null, testo: String(c.testo || "").slice(0, 400), stato: "proposto",
    };
    s.contratti.push(k);
    privato(s, a, p.nome + " ti propone un contratto. Guardalo nell'app Contratti.");
    return k.id;
  }
  function rispondiContratto(s, p, idC, si) {
    const k = s.contratti.find((x) => x.id === idC); if (!k || k.a !== p.id || k.stato !== "proposto") err("Contratto non trovato.");
    if (!si) { k.stato = "rifiutato"; privato(s, giocatore(s, k.da), p.nome + " ha rifiutato il tuo contratto."); return; }
    const da = giocatore(s, k.da), a = p;
    const pagatore = k.chiPagaOra === "da" ? da : a, ricevente = k.chiPagaOra === "da" ? a : da;
    if (k.pagoOra > pagatore.cash) err(pagatore.nome + " non ha abbastanza soldi per il pagamento iniziale.");
    if (k.tipo === "notarile") { const fee = round(0.02 * (k.pagoOra + k.pagoDopo)); da.cash -= fee / 2; a.cash -= fee / 2; }
    pagatore.cash -= k.pagoOra; ricevente.cash += k.pagoOra; flusso(s, pagatore, ricevente, k.pagoOra, "Patto: pagamento iniziale", k.tipo === "notarile");
    if (k.lottoCeduto) { const l = lotto(s, k.lottoCeduto); if (l.owner === da.id) l.owner = a.id; else if (l.owner === a.id) l.owner = da.id; }
    k.stato = "attivo";
    if (k.tipo === "notarile") notizia(s, "Firmato dal notaio un contratto tra " + da.nome + " e " + a.nome + ".", "affari");
    privato(s, da, a.nome + " ha accettato il contratto.");
  }
  function scadenzeContratti(s) {
    for (const k of s.contratti) {
      if (k.stato !== "attivo" || k.scadenza > s.ciclo || !k.pagoDopo) { if (k.stato === "attivo" && !k.pagoDopo && k.scadenza <= s.ciclo) k.stato = "chiuso"; continue; }
      const da = giocatore(s, k.da), a = giocatore(s, k.a);
      const pagatore = k.chiPagaDopo === "da" ? da : a, ricevente = k.chiPagaDopo === "da" ? a : da;
      if (k.tipo === "notarile") {
        if (pagatore.cash >= k.pagoDopo) { pagatore.cash -= k.pagoDopo; ricevente.cash += k.pagoDopo; k.stato = "chiuso"; }
        else if (k.garanzia) {
          const l = s.lotti.find((x) => x.id === k.garanzia);
          if (l && l.owner === pagatore.id) { l.owner = ricevente.id; notizia(s, pagatore.nome + " non paga: " + l.nome + " passa a " + ricevente.nome + ".", "affari"); }
          k.stato = "eseguito";
        } else { paga(s, pagatore, k.pagoDopo, ricevente); k.stato = "chiuso"; }
      } else {
        k.stato = "scaduto";
        privato(s, ricevente, "Scade il patto sulla parola con " + pagatore.nome + ": " + euro(k.pagoDopo) + ". Nessuno lo farà rispettare per te.");
        privato(s, pagatore, "Scade il patto sulla parola con " + ricevente.nome + ": dovresti pagare " + euro(k.pagoDopo) + ". Paga dall'app Banca, se vuoi mantenere la parola.");
      }
    }
  }
  // Proposte dirette tra giocatori: compro un tuo terreno / ti vendo un mio terreno.
  function proponiLotto(s, p, idA, idLotto, prezzo, compro) {
    if (s.fase === "pacchetti" || s.fine) err("Adesso non si tratta.");
    const a = giocatore(s, idA); if (!a || a.id === p.id) err("Scegli un altro giocatore.");
    const l = lotto(s, idLotto);
    prezzo = Math.floor(prezzo || 0); if (prezzo <= 0) err("Scrivi un prezzo.");
    if (compro) { if (l.owner !== a.id) err("Quel terreno non è suo."); if (p.cash < prezzo) err("Non hai abbastanza soldi puliti per offrire " + euro(prezzo) + "."); }
    else { if (l.owner !== p.id) err("Quel terreno non è tuo."); if (l.cantiere) err("C'è un cantiere aperto: aspetta l'Alba."); }
    s.proposte = (s.proposte || []).filter((x) => !(x.da === p.id && x.lotto === idLotto && x.stato === "proposta"));
    const pr = { id: "q" + s.prossimoId++, da: p.id, a: a.id, lotto: idLotto, prezzo, compro: !!compro, stato: "proposta", ciclo: s.ciclo };
    s.proposte.push(pr);
    privato(s, a, p.nome + (compro ? " vuole comprare il tuo " + l.nome + " per " : " ti offre il suo " + l.nome + " per ") + euro(prezzo) + ". Rispondi dalla finestra o dall'app Contratti.");
    log(s, p.nome + " fa una proposta a " + a.nome + " per " + l.nome + ".", p.id);
    return pr.id;
  }
  function rispondiProposta(s, p, idP, si) {
    const pr = (s.proposte || []).find((x) => x.id === idP);
    if (!pr || pr.a !== p.id || pr.stato !== "proposta") err("Proposta non trovata.");
    const da = giocatore(s, pr.da), l = lotto(s, pr.lotto);
    if (!si) { pr.stato = "rifiutata"; privato(s, da, p.nome + " ha rifiutato la tua proposta per " + l.nome + "."); log(s, p.nome + " rifiuta la proposta di " + da.nome + " per " + l.nome + ".", p.id); return; }
    const compratore = pr.compro ? da : p, venditore = pr.compro ? p : da;
    if (l.owner !== venditore.id) { pr.stato = "scaduta"; err("Il terreno non è più di " + venditore.nome + "."); }
    if (l.cantiere) err("C'è un cantiere aperto su quel terreno: aspetta l'Alba.");
    if (compratore.cash < pr.prezzo) { pr.stato = "scaduta"; err(compratore.nome + " non ha più abbastanza soldi."); }
    compratore.cash -= pr.prezzo; venditore.cash += pr.prezzo; l.owner = compratore.id; l.permesso = false; l.negato = false;
    pr.stato = "accettata";
    flusso(s, compratore, venditore, pr.prezzo, "Compravendita: " + l.nome, true);
    log(s, venditore.nome + " vende " + l.nome + " a " + compratore.nome + " per " + euro(pr.prezzo) + ".", p.id);
    notizia(s, venditore.nome + " vende " + l.nome + " a " + compratore.nome + ".", "affari");
    controllaValoreLusso(s, l);
  }
  function regala(s, p, idA, importo, sporchi) {
    importo = Math.floor(importo || 0); const a = giocatore(s, idA);
    if (importo <= 0) err("Importo non valido.");
    if (sporchi) { if (p.sporchi < importo) err("Non hai abbastanza sporchi."); p.sporchi -= importo; a.sporchi += importo; }
    else { if (p.cash < importo) err("Non hai abbastanza soldi."); p.cash -= importo; a.cash += importo; }
    flusso(s, p, a, importo, sporchi ? "Regalo in contanti sporchi" : "Regalo", false);
    privato(s, a, p.nome + " ti ha dato " + euro(importo) + (sporchi ? " in contanti sporchi." : "."));
  }

  // ------------------------------------------------------------ pagamenti e debiti
  function paga(s, p, importo, a) {
    if (p.cash < importo) raccogli(s, p, importo - p.cash);
    const pagato = Math.min(importo, Math.max(0, p.cash));
    p.cash -= pagato; if (a) a.cash += pagato;
    if (pagato < importo) {
      const resto = importo - pagato;
      p.debito += resto; if (a) a.cash += resto;
      p.emergenza = true;
      notizia(s, "Voci di corridoio: " + p.nome + " ha chiesto un prestito d'emergenza alla Banca Centrale.", "voce");
    }
  }
  function raccogli(s, p, need) {
    for (const a of AZIENDE) { if (need <= 0) return; const v = (p.azioni[a] || 0) * s.borsa[a]; const q = Math.min(v, need); if (q > 0) { p.azioni[a] -= q / s.borsa[a]; p.cash += q; need -= q; } }
    for (const m of MONETE) { if (need <= 0) return; const v = (p.cripto[m] || 0) * s.cripto[m]; const q = Math.min(v, need); if (q > 0) { p.cripto[m] -= q / s.cripto[m]; p.cash += q; need -= q; } }
    if (need > 0 && p.sporchi > 0) { /* gli sporchi non pagano affitti puliti */ }
  }

  // ------------------------------------------------------------ indagini e pene
  function tiroIndagine(s, p) {
    if (p.faro > 0) return;
    let prot = 0;
    if (Object.keys(p.corrotti).some((k) => k.startsWith("agente_"))) prot += N.prot.agente;
    if (p.corrotti.commissario) prot += N.prot.commissario;
    for (const id of p.sette) { const st = s.sette.find((x) => x.id === id); const lv = livelloSetta(s, st); prot += [0, 0.1, 0.2, 0.3, 0.3][lv]; if (st && st.commissario) prot += 0.3; }
    prot = Math.min(N.prot.max, prot);
    let tr = p.tracce;
    if (p.fama >= 60) tr *= 1.25;
    const pUp = tr / (tr + N.indagineK) * (1 - prot);
    const vecchio = p.stato;
    if (tr > 0 && rng(s) < pUp) p.stato = Math.min(4, p.stato + 1);
    else if (p.pulitoCiclo && p.stato > 0 && rng(s) < N.scendi) p.stato -= 1;
    if (p.stato !== vecchio) {
      const segnali = ["Ti senti più tranquillo: nessuno parla di te.", "Un personaggio ti dice: \"Si parla di te, in giro.\"", "Vedi spesso un'auto della polizia vicino ai tuoi locali.", "La Gazzetta fa il tuo nome. I tuoi conti sono sotto controllo.", "Ricevi una convocazione del Giudice per l'Alba."];
      privato(s, p, segnali[p.stato]);
      if (p.stato === 1) notizia(s, "Si mormora su certi affari di " + p.nome + ".", "voce");
      if (p.stato === 3) notizia(s, p.nome + " è sotto indagine.", "scandalo");
    }
  }
  function mandaAlFaro(s, p, turni, motivo) {
    p.faro = Math.max(p.faro, turni); p.arresti += 1;
    p.inner = false; p.pos = POS_FARO;
    log(s, p.nome + " va al Faro per " + turni + " turni (" + motivo + ").", p.id);
    notizia(s, p.nome + " è stato portato al Faro.", "scandalo");
  }
  function condanna(s, p, gravita, motivo) {
    gravita = gravita || "lieve";
    if (p.condanne > 0 && gravita !== "gravissima") gravita = ORDINE_GRAVITA[ORDINE_GRAVITA.indexOf(gravita) + 1];
    if (haOggetto(p, "avvocato")) { togliOggetto(p, "avvocato"); if (gravita !== "lieve") gravita = ORDINE_GRAVITA[ORDINE_GRAVITA.indexOf(gravita) - 1]; privato(s, p, "Il tuo avvocato fa il suo lavoro: la pena scende di un gradino."); }
    const pena = PENE[gravita];
    let protGiudice = false;
    for (const id of p.sette) { const st = s.sette.find((x) => x.id === id); if (st && st.giudice) protGiudice = true; }
    if (protGiudice && rng(s) < 0.6) {
      privato(s, p, "Il Giudice è dei vostri: il processo si chiude con un nulla di fatto.");
      notizia(s, "Assolto " + p.nome + ". Qualcuno storce il naso.", "scandalo");
      p.stato = 0; p.tracce *= 0.5; p.peggiorReato = null; return;
    }
    const confiscati = p.sporchi; p.sporchi = 0;
    const protetto = Math.min(confiscati, (p.funzioniPiani.includes("caveau") && gravita !== "gravissima" ? 5_000_000 : 0) + (haOggetto(p, "cassetta") ? 1_000_000 : 0));
    p.sporchi = protetto;
    const multa = round(pena.multa * Math.max(0, p.cash + valoreInvestimenti(s, p)));
    paga(s, p, multa, null);
    const coinvolte = propri(s, p).filter((l) => l.tipo && ["copertura", "notte", "rischio"].includes(ATTIVITA[l.tipo].gruppo));
    if (pena.attivita && (p.riciclTot > 0 || gravita !== "media")) {
      for (const l of coinvolte) {
        if (pena.attivita === "chiusa") l.chiuso = 1;
        else { l.owner = null; l.lvl = 0; l.tipo = null; l.ipoteca = 0; }
      }
      if (pena.attivita === "confisca+") {
        const altri = propri(s, p).sort((a, b) => valoreLotto(b) - valoreLotto(a)).slice(0, 1);
        for (const l of altri) { l.owner = null; l.lvl = 0; l.tipo = null; }
        if (p.piani > 4) { p.piani -= 4; p.funzioniPiani.splice(-4); }
      }
    }
    if (pena.faro > 0) mandaAlFaro(s, p, pena.faro, "condanna");
    p.blocco = pena.blocco; p.fama = Math.max(0, p.fama - pena.fama);
    p.condanne += 1; p.stato = 0; p.tracce = 15; p.peggiorReato = null; p.riciclTot = 0;
    p.corrotti = {};
    if (gravita === "grave" || gravita === "gravissima") { p.cerchie = []; }
    p.ultimaSentenza = { gravita, multa, confiscati: confiscati - protetto, faro: pena.faro, blocco: pena.blocco, motivo: motivo || "" };
    privato(s, p, "Sentenza (" + gravita + "): confiscati " + euro(confiscati - protetto) + " di soldi sporchi, multa " + euro(multa) + (pena.faro ? ", " + pena.faro + " turni al Faro" : "") + (pena.blocco ? ", entrate bloccate per " + pena.blocco + " Cicli" : "") + ".");
    notizia(s, "Condannato " + p.nome + " (" + gravita + ").", "scandalo");
  }

  // ------------------------------------------------------------ alba
  function alba(s) {
    s.fase = "alba";
    const riepilogo = {};
    chiudiCantieri(s);
    perquisizioni(s);
    s.retataAnnunciata = false;
    for (const p of s.players) {
      const r = { rendite: 0, tasse: 0, evasa: 0, stipendioSindaco: 0, interessi: 0, corruzione: 0, veicoli: 0, palazzo: 0, decima: 0 };
      // rendite
      let rend = 0;
      r.dettaglio = [];
      for (const l of propri(s, p)) {
        if (l.chiuso > 0) { l.chiuso -= 1; r.dettaglio.push({ nome: l.nome, cosa: "chiusa", importo: 0 }); continue; }
        const rl = rendita(s, l);
        rend += rl;
        r.dettaglio.push({ nome: l.nome, cosa: l.tipo ? ATTIVITA[l.tipo].nome + " · livello " + l.lvl : l.cantiere ? "cantiere in corso" : "terreno vuoto: non rende, costruisci!", importo: round(rl) });
        if (l.tipo) { const t = ATTIVITA[l.tipo]; if (t.att && (p.affariStanotte.length || p.riciclTot)) p.tracce += t.att * 0.5 * (l.lvl / 2); }
        if (l.ipoteca && s.ciclo - l.ipotecaCiclo >= 4) { notizia(s, "La Banca mette all'asta " + l.nome + ": ipoteca non riscattata.", "affari"); l.owner = null; l.lvl = 0; l.tipo = null; l.ipoteca = 0; }
      }
      // palazzo
      let pal = 0;
      p.funzioniPiani.forEach((f, i) => {
        const c = N.pianoCost * Math.pow(N.pianoGrow, i);
        if (["appartamenti", "uffici"].includes(f)) pal += c * N.pianoRend;
        else if (["ristorante_panoramico", "casino_privato"].includes(f)) pal += c * N.pianoRend * 1.1;
        else pal += c * 0.15;
      });
      r.palazzo = round(pal);
      // veicoli a noleggio
      for (const v of p.veicoli) r.veicoli += N.veicoli[v].prezzo * N.veicoli[v].rend;
      rend += pal + r.veicoli;
      if (p.faro > 0) rend *= 0.7;
      if (p.blocco > 0) { rend *= 0.5; p.blocco -= 1; }
      const zona = s.leggi.includes("zona_franca") ? propri(s, p).filter((l) => l.isola === "Sole").reduce((a, l) => a + rendita(s, l), 0) : 0;
      const evasa = rend * clamp(p.evasione || 0, 0, N.evasioneMax);
      if (evasa > 0) { p.sporchi += evasa; p.tracce += 2 * (evasa > 0 ? 1 : 0); p.pulitoCiclo = false; p.peggiorReato = peggio(p.peggiorReato, "lieve"); }
      const tassa = Math.max(0, (rend - evasa - zona) * s.tassa);
      // decima della setta
      let decima = 0;
      for (const id of p.sette) { const st = s.sette.find((x) => x.id === id); if (st) { const d = (rend - evasa - tassa) * N.decima / p.sette.length; st.tesoro += d; decima += d; } }
      p.cash += rend - evasa - tassa - decima;
      r.rendite = round(rend); r.tasse = round(tassa); r.evasa = round(evasa); r.decima = round(decima);
      // sindaco
      if (s.sindaco === p.id) { p.cash += N.stipendioSindaco; r.stipendioSindaco = N.stipendioSindaco; }
      // debiti
      if (p.debito > 0) {
        const tasso = p.emergenza ? N.emergenzaInt : N.prestitoInt;
        const int = p.debito * tasso; p.debito += int; r.interessi = round(int);
        const pagabile = Math.min(p.cash * 0.5, p.debito); p.cash -= pagabile; p.debito -= pagabile;
        if (p.debito < 1) { p.debito = 0; p.emergenza = false; }
      }
      // corruzione: rate e pentiti
      for (const k of Object.keys(p.corrotti)) {
        const base = k.startsWith("agente_") ? N.corruz.agente[1] : N.corruz[k] ? N.corruz[k][1] : 0;
        if (p.sporchi >= base) p.sporchi -= base; else if (p.cash >= base) p.cash -= base; else { delete p.corrotti[k]; privato(s, p, "Non hai pagato: hai perso un contatto corrotto."); continue; }
        r.corruzione += base;
        if (rng(s) < N.pentito) { delete p.corrotti[k]; p.tracce += 25; p.stato = Math.min(4, p.stato + 1); notizia(s, "Un pentito parla: tremano in molti nella Laguna.", "scandalo"); privato(s, p, "Uno dei tuoi contatti corrotti si è pentito e ha fatto il tuo nome."); }
      }
      // tracce che calano
      p.tracce *= 1 - (p.pulitoCiclo ? N.decayPulito : N.decaySporco);
      if (p.pulitoCiclo) p.ombraCicli = (p.ombraCicli || 0) + 1; else p.ombraCicli = 0;
      p.copUsata = 0;
      riepilogo[p.id] = r;
    }
    // processo per chi e' arrivato allo stato 4
    for (const p of s.players) if (p.stato >= 4) {
      if (!p.peggiorReato) { p.stato = 1; p.tracce *= 0.5; privato(s, p, "Il Giudice archivia: non ci sono reati provati."); notizia(s, "Archiviata l'indagine su " + p.nome + ".", "voce"); }
      else condanna(s, p, p.peggiorReato, "processo");
    }
    // borsa e cripto
    for (const a of AZIENDE) {
      let mu = N.borsaMu / 3; // la crescita media si divide anche sui giorni
      if (a === "Flamingo Luxury") mu += (s.valore.Flamingo - 5) * 0.01;
      if (a === "Palma Resorts") mu += (s.valore.Palma - 5) * 0.01;
      if (a === "SoleTech") mu += Math.min(4, s.lotti.filter((l) => l.tipo === "uffici").length) * 0.01;
      s.borsa[a] = Math.max(5, s.borsa[a] * (1 + gauss(s, mu, N.borsaSd)));
    }
    for (const m of MONETE) {
      const sd = m === "FlamingoToken" ? N.criptoSd * 1.4 : m === "LagunaCoin" ? N.criptoSd * 0.4 : N.criptoSd;
      if (rng(s) < N.criptoCrash * (m === "LagunaCoin" ? 0.3 : 1)) { s.cripto[m] *= 0.3; notizia(s, "Crollo di " + m + ": -70% in una notte.", "borsa"); }
      else s.cripto[m] = Math.max(0.1, s.cripto[m] * (1 + gauss(s, N.criptoMu / 2, sd)));
    }
    // valore dei quartieri: piccolo rumore
    for (const i of ISOLE) s.valore[i] = clamp(Math.round((s.valore[i] + [-0.3, 0, 0, 0.3][Math.floor(rng(s) * 4)]) * 10) / 10, 1, 10);
    scadenzeContratti(s);
    regista(s);
    // sette: livelli
    for (const st of s.sette) {
      const lv = livelloSetta(s, st);
      if (lv > (st.livelloNotificato || 1)) { st.livelloNotificato = lv; privato(s, giocatore(s, st.gm), "La tua setta sale al livello " + lv + "."); }
      // chi sta nell'ombra troppo a lungo perde i bonus
      for (const id of st.membri) { const m = giocatore(s, id); if (m.ombraCicli >= 3 && id !== st.gm) privato(s, giocatore(s, st.gm), m.nome + " sta nell'ombra da 3 Cicli: puoi cacciarlo."); }
    }
    // elezioni ogni 2 cicli
    if (s.ciclo % 2 === 1) elezioni(s);
    s.ultimaAlba = { ciclo: s.ciclo + 1, riepilogo };
    s.blackout = null;
    s.leggi = s.leggi.filter((x) => !x.startsWith("giro_cripto"));
    // cicli
    s.ciclo += 1;
    if (s.ciclo >= (s.cicli || N.cicli)) return fine(s);
    s.fase = "giorno"; s.giorno = 0; s.turno = 0;
    notizia(s, "Sorge il sole sul Ciclo " + (s.ciclo + 1) + ".", "evento");
    iniziaTurno(s);
  }

  function elezioni(s) {
    const cand = Object.keys(s.candidati);
    if (cand.length === 0) { notizia(s, "Nessun giocatore si candida: resta in carica il Sindaco Albertini.", "politica"); return; }
    let best = null, bestV = -1;
    for (const id of cand) { const p = giocatore(s, id); const v = p.fama * 2 + (s.candidati[id] || 0) / 100_000 + rng(s) * 10; if (v > bestV) { bestV = v; best = p; } }
    s.sindaco = best.id; s.candidati = {};
    best.fama += 10;
    notizia(s, best.nome + " è il nuovo Sindaco della Laguna!", "politica");
    privato(s, best, "Sei il Sindaco. Puoi fare una legge per Ciclo e cambiare le tasse dall'app Municipio.");
  }
  function campagna(s, p, importo) {
    if (s.candidati[p.id] === undefined) err("Prima candidati.");
    importo = Math.floor(importo || 0); if (importo <= 0 || importo > p.cash) err("Importo non valido.");
    p.cash -= importo; s.candidati[p.id] += importo; p.fama += Math.min(5, Math.floor(importo / 200_000));
  }
  function legge(s, p, idLegge, isola) {
    if (s.sindaco !== p.id) err("Solo il Sindaco fa le leggi.");
    if (s.leggeCiclo === s.ciclo) err("Una sola legge per Ciclo.");
    if (!LEGGI[idLegge]) err("Legge sconosciuta.");
    s.leggeCiclo = s.ciclo;
    if (idLegge === "amnistia") { for (const x of s.players) x.tracce *= 0.7; }
    else if (idLegge === "polizia_doppia") { if (!ISOLE.includes(isola)) err("Scegli l'isola."); s.leggi.push("polizia_doppia_" + isola); }
    else s.leggi.push(idLegge);
    notizia(s, "Il Sindaco " + p.nome + " firma una nuova legge: " + LEGGI[idLegge].nome + ".", "politica");
  }
  function tasse(s, p, q) {
    if (s.sindaco !== p.id) err("Solo il Sindaco cambia le tasse.");
    s.tassa = clamp(q, 0.1, 0.3);
    notizia(s, "Le tasse sulle rendite sono ora al " + Math.round(s.tassa * 100) + "%.", "politica");
  }

  // Il Regista: eventi che nascono da cio' che fanno i giocatori
  function regista(s) {
    const vivi = s.players.filter((p) => !p.fallito);
    const pat = vivi.map((p) => patrimonio(s, p, false));
    const max = Math.max(...pat), media = pat.reduce((a, b) => a + b, 0) / pat.length;
    const leader = vivi[pat.indexOf(max)];
    const illegali = vivi.filter((p) => !p.pulitoCiclo).length;
    const eventi = [];
    if (max > media * 1.8) eventi.push(["controllo", 3]);
    if (illegali >= Math.ceil(vivi.length / 2)) eventi.push(["retata", 3]);
    if (illegali === 0) eventi.push(["boss", 3]);
    eventi.push(["tempesta", 1], ["festival", 1], ["crollo", 1], ["turisti", 2], ["blackout", 1], ["bolla", 1], ["niente", 4]);
    const tot = eventi.reduce((a, e) => a + e[1], 0);
    let x = rng(s) * tot, ev = "niente";
    for (const [e, w] of eventi) { x -= w; if (x <= 0) { ev = e; break; } }
    switch (ev) {
      case "controllo": if (leader.peggiorReato || leader.evasione > 0) leader.tracce += 15; notizia(s, "La Guardia di Finanza accende un faro sui conti di " + leader.nome + ".", "evento"); break;
      case "retata": { const i = ISOLE[Math.floor(rng(s) * 4)]; s.retataAnnunciata = true; for (const p of vivi) if (!p.pulitoCiclo) p.tracce += 8; notizia(s, "Retata della polizia a " + NOMI_ISOLE[i] + ": controlli ovunque.", "evento"); break; }
      case "boss": { const t = vivi[Math.floor(rng(s) * vivi.length)]; privato(s, t, "Un boss straniero ti propone un affare enorme: stanotte il tuo carico di contrabbando può valere il doppio. Ma lascerà il doppio delle tracce."); t.offertaBoss = true; notizia(s, "Arriva in Laguna uno straniero con un megayacht nero. Nessuno sa chi sia.", "voce"); break; }
      case "tempesta": s.valore.Palma = clamp(s.valore.Palma - 1, 1, 10); notizia(s, "Tempesta tropicale: Costa Palma perde valore, gli yacht restano in porto.", "evento"); break;
      case "festival": s.valore.Flamingo = clamp(s.valore.Flamingo + 1, 1, 10); s.valore.Palma = clamp(s.valore.Palma + 0.5, 1, 10); notizia(s, "Festival dell'estate: Baia Flamingo e Costa Palma piene di turisti.", "evento"); break;
      case "crollo": for (const a of AZIENDE) s.borsa[a] *= 0.7; notizia(s, "Crollo della Borsa della Laguna: -30% su tutti i titoli.", "borsa"); break;
      case "turisti": s.valore.Corona = clamp(s.valore.Corona + 0.5, 1, 10); s.valore.Palma = clamp(s.valore.Palma + 0.5, 1, 10); notizia(s, "Arrivano i turisti miliardari: hotel e noleggi al completo.", "evento"); break;
      case "blackout": s.blackout = ISOLE[Math.floor(rng(s) * 4)]; notizia(s, "Blackout annunciato stanotte a " + NOMI_ISOLE[s.blackout] + ".", "evento"); break;
      case "bolla": for (const i of ISOLE) s.valore[i] = clamp(s.valore[i] + 0.5, 1, 10); notizia(s, "Bolla immobiliare: i prezzi salgono ovunque. Fino a quando?", "evento"); break;
      default: break;
    }
  }

  function fine(s) {
    s.fase = "fine"; s.fine = true;
    const cl = s.players.map((p) => ({ id: p.id, nome: p.nome, patrimonio: round(patrimonio(s, p, true)), fama: p.fama, arresti: p.arresti, tracce: round(p.tracce), piani: p.piani, riciclTot: p.riciclTot }))
      .sort((a, b) => b.patrimonio - a.patrimonio);
    const titoli = [];
    titoli.push({ titolo: "Re della Laguna", a: cl[0].nome });
    const stella = [...cl].sort((a, b) => b.fama - a.fama)[0]; titoli.push({ titolo: "La Stella", a: stella.nome });
    const pulito = cl.filter((x) => x.arresti === 0).sort((a, b) => a.tracce - b.tracce)[0]; if (pulito) titoli.push({ titolo: "Mani Pulite", a: pulito.nome });
    const best = s.sette.map((st) => ({ st, v: st.tesoro + 1e6 * st.operazioni })).sort((a, b) => b.v - a.v)[0];
    if (best) titoli.push({ titolo: "Gran Burattinaio", a: giocatore(s, best.st.gm).nome + " (setta \"" + best.st.nome + "\")" });
    s.classifica = cl; s.titoli = titoli;
    s.rivelazione = s.sette.map((st) => ({ setta: st.nome, gm: giocatore(s, st.gm).nome, membri: st.membri.map((id) => giocatore(s, id).nome), tesoro: round(st.tesoro) }));
    notizia(s, "Fine della partita. " + cl[0].nome + " è il Re della Laguna.", "evento");
  }

  // ------------------------------------------------------------ ingresso unico
  function applica(s, idGiocatore, a) {
    const N0 = s.fase === "notte" && s.notte, ora0 = N0 ? N0.ora : -1, eraChiuso = N0 ? !!N0.chiuso[idGiocatore] : true;
    const len0 = N0 ? (N0.racconto[idGiocatore] || []).length : 0;
    const r = applica0(s, idGiocatore, a);
    if (N0 && s.notte === N0 && N0.ora === ora0 && !eraChiuso && N0.chiuso[idGiocatore] && N0.daScelta[idGiocatore] === undefined) N0.daScelta[idGiocatore] = len0;
    return r;
  }
  function applica0(s, idGiocatore, a) {
    if (s.fine && a.tipo !== "nulla") err("La partita è finita.");
    const p = giocatore(s, idGiocatore);
    const giorniAzioniTelefono = ["investi", "vendi", "restituisci", "ipoteca", "riscatta", "articolo", "contratto", "rispondi_contratto", "regala", "versa_setta", "rispondi_invito", "invita_setta", "campagna", "legge", "tasse", "evasione", "denuncia"];
    if (p.faro > 0 && s.fase === "giorno" && corrente(s).id === p.id && giorniAzioniTelefono.includes(a.tipo)) {
      if (p.telefonataUsata === s.ciclo * 10 + s.giorno) err("Al Faro hai una sola telefonata per turno.");
      p.telefonataUsata = s.ciclo * 10 + s.giorno;
    }
    switch (a.tipo) {
      case "pacchetto": return scegliPacchetto(s, p, a.id);
      case "tira": return tira(s, p);
      case "compra": return compra(s, p, !!a.si);
      case "agenzia": return agenzia(s, p, a.lotto);
      case "proponi_lotto": return proponiLotto(s, p, a.a, a.lotto, a.prezzo, a.compro);
      case "rispondi_proposta": return rispondiProposta(s, p, a.id, !!a.si);
      case "licenza": return chiediLicenza(s, p);
      case "busta_licenza": return bustaLicenza(s, p);
      case "offerta": return offerta(s, p, a.importo);
      case "gala": return gala(s, p, a.importo);
      case "casino_reale": return casinoReale(s, p, a.importo);
      case "municipio": return municipio(s, p, a.scelta);
      case "costruisci": return costruisci(s, p, a.lotto, a.attivita);
      case "piano": return piano(s, p, a.funzione);
      case "veicolo": return compraVeicolo(s, p, a.veicolo);
      case "prestito": return prestito(s, p, a.importo);
      case "restituisci": return restituisci(s, p, a.importo);
      case "ipoteca": return ipoteca(s, p, a.lotto);
      case "riscatta": return riscatta(s, p, a.lotto);
      case "investi": return investi(s, p, a.cosa, a.nome, a.importo);
      case "vendi": return vendi(s, p, a.cosa, a.nome, a.quota);
      case "fine_turno": return fineTurno(s, p);
      case "permesso": return chiediPermesso(s, p, a.lotto);
      case "regalo_assessore": return regaloAssessore(s, p, a.lotto);
      case "chiamata": return rispondiChiamata(s, p, !!a.si, !!a.telefono);
      case "vai": return vai(s, p, a.luogo);
      case "aspetta": return aspetta(s, p);
      case "avanti": return avanti(s, p);
      case "attivita": return attivitaNotte(s, p, a.importo);
      case "spa": return spa(s, p);
      case "serata": return apriSerata(s, p, a.ingresso);
      case "vai_serata": return vaiSerata(s, p, a.host);
      case "gioca_serata": return giocaSerata(s, p, a.importo);
      case "incontro": return incontro(s, p, a.a, a.cosa, a.importo);
      case "rispondi_incontro": return rispondiIncontro(s, p, a.id, !!a.si);
      case "tempo_scaduto": return tempoScaduto(s);
      case "pronto": case "torna_a_casa": return tornaACasa(s, p);
      case "compra_oggetto": return compraOggetto(s, p, a.oggetto);
      case "soffiata": return soffiata(s, p, a.luogo);
      case "occasione": return prendiOccasione(s, p, a.n, a.oggetti);
      case "foto": return fotografa(s, p, a.bersaglio);
      case "corrompi": return corrompi2(s, p, a.chi, a.isola, !!a.sporchi);
      case "ricicla": return ricicla2(s, p, a.metodo, a.importo);
      case "denuncia": return denuncia(s, p, a.prova);
      case "fonda_setta": return fondaSetta(s, p, a.nome, a.motto);
      case "invita_setta": return invitaSetta(s, p, a.setta, a.invitato);
      case "rispondi_invito": return rispondiInvito(s, p, a.setta, !!a.si);
      case "versa_setta": return versaSetta(s, p, a.setta, a.importo, !!a.sporchi);
      case "recluta": return settaAlFaro(s, p, () => recluta(s, p, a.setta, a.chi));
      case "operazione": return settaAlFaro(s, p, () => operazione(s, p, a.setta, a.op, a.bersaglio, a.direzione));
      case "articolo": return s.fase === "notte" ? articolo2(s, p, a) : articolo(s, p, a.bersaglio, a.tono, a.importo, a.testo, !!a.sporchi);
      case "contratto": return proponiContratto(s, p, a.contratto);
      case "rispondi_contratto": return rispondiContratto(s, p, a.id, !!a.si);
      case "regala": return regala(s, p, a.a, a.importo, !!a.sporchi);
      case "candidati": return candidati(s, p);
      case "campagna": return campagna(s, p, a.importo);
      case "legge": return legge(s, p, a.legge, a.isola);
      case "tasse": return tasse(s, p, a.quota);
      case "evasione": p.evasione = clamp(a.quota || 0, 0, N.evasioneMax); return;
      case "preferenze": if (a.corona !== undefined) p.vuoleCorona = !!a.corona; if (a.uscire !== undefined) p.vuoleUscire = !!a.uscire; return;
      default: err("Azione sconosciuta: " + a.tipo);
    }
  }

  // Vista per un giocatore: nasconde i dati segreti degli altri (saldo, sporchi, tracce, sette, prove)
  function vista(s, idGiocatore) {
    const v = JSON.parse(JSON.stringify(s));
    delete v.rngState; delete v.seed;
    for (const p of v.players) {
      if (p.id === idGiocatore) continue;
      const vero = s.players.find((x) => x.id === p.id);
      const fasciaPubblica = fascia(s, vero);
      for (const k of ["cash", "sporchi", "tracce", "stato", "corrotti", "prove", "messaggi", "debito", "azioni", "cripto", "evasione", "affariStanotte", "spiaSu", "sette", "settaFondata", "reputazione", "peggiorReato", "riciclTot", "ultimaSentenza", "offertaBoss", "valigetta", "raccontoNotte", "permessoTurno", "primoPermesso"]) delete p[k];
      p.fascia = fasciaPubblica;
    }
    v.sette = s.sette.filter((st) => st.membri.includes(idGiocatore));
    v.inviti = s.inviti.filter((x) => x.a === idGiocatore);
    v.flussi = (s.flussi || []).filter((f) => f.pubblico || f.da === idGiocatore || f.a === idGiocatore);
    v.proposte = (s.proposte || []).filter((x) => x.da === idGiocatore || x.a === idGiocatore);
    v.contratti = s.contratti.filter((k) => k.da === idGiocatore || k.a === idGiocatore || (k.tipo === "notarile" && k.stato !== "proposto")).map((k) => (k.da === idGiocatore || k.a === idGiocatore) ? k : { id: k.id, da: k.da, a: k.a, tipo: k.tipo, stato: k.stato });
    if (v.pending && v.pending.tipo === "asta") v.pending.offerte = Object.fromEntries(Object.keys(s.pending.offerte).map((k) => [k, k === idGiocatore ? s.pending.offerte[k] : "segreta"]));
    if (v.ultimaAlba) v.ultimaAlba.riepilogo = { [idGiocatore]: s.ultimaAlba.riepilogo[idGiocatore] };
    if (v.pending && v.pending.tipo === "chiamata" && v.pending.giocatore !== idGiocatore) v.pending = { tipo: "chiamata", giocatore: v.pending.giocatore };
    for (const l of v.lotti) if (l.owner !== idGiocatore) { delete l.negato; }
    if (s.notte) {
      const me = s.players.find((x) => x.id === idGiocatore);
      v.notte = {
        ora: s.notte.ora, dove: s.notte.dove,
        viaggio: Object.fromEntries(Object.entries(s.notte.viaggio).map(([k, x]) => [k, { verso: k === idGiocatore ? x.verso : null, restano: k === idGiocatore ? x.restano : null, serata: k === idGiocatore ? x.serata || null : null }])),
        chiuso: s.notte.chiuso, racconto: s.notte.racconto[idGiocatore] || [],
        pronto: s.notte.pronto, inizio: s.notte.inizio, tempo: TEMPO_ORA, adesso: adesso(),
        daScelta: s.notte.daScelta[idGiocatore], inizioRacc: s.notte.inizioRacc[idGiocatore] || 0,
        scelte: me ? scelteNotte(s, me) : [],
        qui: me ? quiConMe(s, me).map((x) => x.id) : [],
        ospite: s.notte.ospite ? s.notte.ospite[idGiocatore] || null : null,
        serate: Object.entries(s.notte.serate || {}).map(([id, se]) => { const h = s.players.find((x) => x.id === id); return { host: id, nome: h.nome, piani: h.piani, livello: livelloPalazzo(h), ingresso: se.ingresso, ospiti: se.ospiti.length, banco: id === idGiocatore ? se.banco : undefined }; }),
        proposte: (s.notte.proposte || []).filter((x) => x.a === idGiocatore || x.da === idGiocatore),
        ultimaMano: s.notte.ultimaMano ? s.notte.ultimaMano[idGiocatore] || null : null,
        occasioni: me ? occasioniVisibili(s, me).map((o) => ({ ...o, ...OCCASIONI.find((x) => x.id === o.id), n: o.n })) : [],
        piuTardi: me && !s.notte.viaggio[idGiocatore] ? s.notte.occasioni.filter((o) => !o.preso && o.luogo === s.notte.dove[idGiocatore] && o.dalle > s.notte.ora && (!o.riservata || o.riservata === idGiocatore)).length : 0,
        chiamate: s.notte.occasioni.filter((o) => o.riservata === idGiocatore && !o.preso).map((o) => ({ n: o.n, luogo: o.luogo, alle: o.alle, nome: OCCASIONI.find((x) => x.id === o.id).nome })),
      };
    }
    if (s.riepOra) v.riepOra = { n: s.riepOra.n, ciclo: s.riepOra.ciclo, da: s.riepOra.da, a: s.riepOra.a, mio: s.riepOra.per[idGiocatore] || null };
    { const me = s.players.find((x) => x.id === idGiocatore); if (me) { v.lustro = lustro(s, me); v.livelloPalazzo = livelloPalazzo(me); } }
    v.sblocco = livelloSblocco(s); v.postiValigetta = postiValigetta(s);
    return v;
  }

  const API = {
    N, ATTIVITA, AFFARI, PACCHETTI, AZIENDE, MONETE, ISOLE, NOMI_ISOLE, STATI, LEGGI, PENE,
    nuovaPartita, applica, vista, patrimonio, fascia, affitto, rendita, copertura, valoreLotto, valorePalazzo, valoreInvestimenti,
    haSerie, propri, corrente, casella, livelloSetta, euro, giocatore,
    ORE, LUOGHI, CASELLE, SEZIONE, ORDINE_ISOLE, isolaDiPos, prezzoAgenzia, OGGETTI, OCCASIONI, PERICOLI, occasioniVisibili, scelteNotte, TEMPO_ORA, punteggio, apriSerataProva: (s, id, ingresso) => apriSerataSenzaOra(s, giocatore(s, id), ingresso), lustro, livelloPalazzo, livelloSblocco, postiValigetta, oreViaggio, luogoAperto,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.Laguna = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
