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
    cicli: 6, giorni: 3,
    cashStart: 1_000_000, stipendio: 400_000, tassa: 0.20,
    affVuoto: 0.15, affLvl: [1, 1, 4, 12, 26, 45], rendLvl: [0, 1, 2.2, 3.6, 5.2, 7.0],
    costLvl: [0, 0.5, 0.5, 0.75, 1.0, 1.5], R: 0.75,
    moloFee: [0, 25_000, 50_000, 100_000, 200_000],
    pianoCost: 400_000, pianoGrow: 1.08, pianoRend: 0.62, pianiMax: 60,
    borsaMu: 0.30, borsaSd: 0.16, criptoMu: 0.40, criptoSd: 0.50, criptoCrash: 0.12,
    caricoBase: 250_000, caricoGrow: 100_000, caricoMax: 3_000_000, caricoMagazzino: 1.5,
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
    { id: "commerciante", nome: "Il Commerciante", lotti: [["Vicolo del Mercato", "ristorante"], ["Via delle Onde", "ristorante"]], extra: { cash: 250_000 } },
    { id: "costruttore", nome: "Il Costruttore", lotti: [["Vicolo dei Pescatori", "residenze"], ["Via dei Cantieri", "residenze"]], extra: { piani: 2 } },
    { id: "investitore", nome: "L'Investitore", lotti: [["Corso Industria", "uffici"], ["Via delle Spezie", "agenzia"]], extra: { azioni: 500_000 } },
    { id: "playboy", nome: "Il Playboy", lotti: [["Viale Neon", "discoteca"], ["Lungomare Cocco", "beachclub"]], extra: { veicolo: "motoscafo", fama: 25 } },
    { id: "contrabbandiere", nome: "Il Contrabbandiere", lotti: [["Darsena Container", "magazzino"], ["Via delle Lanterne", "lavanderia"]], extra: { reputazione: 20 } },
    { id: "politico", nome: "Il Politico", lotti: [["Baia Turchese", "hotel"], ["Flamingo Drive", "boutique"]], extra: { fama: 30 } },
    { id: "ereditiera", nome: "L'Ereditiera", lotti: [["Viale dei Resort", "hotel"], ["Ocean Boulevard", "galleria"]], extra: { cash: 400_000 } },
    { id: "speculatore", nome: "Lo Speculatore", lotti: [["Piazzetta Ambra", "lavanderia"], ["Viale Solare", "uffici"]], extra: { cripto: 250_000 } },
  ];

  const AZIENDE = ["Corona Bank", "Laguna Energy", "Flamingo Luxury", "SoleTech", "Palma Resorts", "Marina Shipping"];
  const MONETE = ["LagunaCoin", "FlamingoToken", "ShadowCoin"];

  const OUTER = [
    ["Ponte Sud — Partenza", "angolo"], ["Vicolo del Mercato", "Spezie", "Ambra", 100], ["Via delle Spezie", "Spezie", "Ambra", 110],
    ["Gazzetta", "gazzetta"], ["Piazzetta Ambra", "Spezie", "Ambra", 130], ["Molo Ambra", "Moli", "Ambra", 200],
    ["Vicolo dei Pescatori", "Lanterne", "Ambra", 150], ["Mercato Nero", "speciale"], ["Via delle Lanterne", "Lanterne", "Ambra", 160],
    ["Scalinata dei Gatti", "Lanterne", "Ambra", 180], ["Ponte Ovest — Il Faro", "angolo"],
    ["Lungomare Cocco", "Sabbia", "Palma", 220], ["Via delle Onde", "Sabbia", "Palma", 230], ["Gazzetta", "gazzetta"],
    ["Spiaggia dei Gabbiani", "Sabbia", "Palma", 250], ["Molo Palma", "Moli", "Palma", 200], ["Baia Turchese", "Corallo", "Palma", 280],
    ["Spiaggia VIP", "speciale"], ["Viale dei Resort", "Corallo", "Palma", 300], ["Punta Palma", "Corallo", "Palma", 320],
    ["Ponte Nord — Spiaggia Libera", "angolo"],
    ["Viale Neon", "Neon", "Flamingo", 360], ["Flamingo Drive", "Neon", "Flamingo", 380], ["Gazzetta", "gazzetta"],
    ["Via delle Orchidee", "Neon", "Flamingo", 400], ["Molo Flamingo", "Moli", "Flamingo", 200], ["Ocean Boulevard", "Velluto", "Flamingo", 450],
    ["Gala Flamingo", "speciale"], ["Villa Rosa", "Velluto", "Flamingo", 480], ["Belvedere Flamingo", "Velluto", "Flamingo", 520],
    ["Ponte Est — Posto di blocco", "angolo"],
    ["Via dei Cantieri", "Acciaio", "Sole", 580], ["Corso Industria", "Acciaio", "Sole", 600], ["Gazzetta", "gazzetta"],
    ["Viale Solare", "Acciaio", "Sole", 640], ["Molo Sole", "Moli", "Sole", 200], ["Darsena Container", "Vetro", "Sole", 700],
    ["Porto Container", "speciale"], ["Piazza dell'Innovazione", "Vetro", "Sole", 750], ["Torre del Sole", "Vetro", "Sole", 800],
  ];
  const INNER = [
    ["La Borsa", "speciale"], ["Viale dei Diamanti", "Oro", "Corona", 1000], ["Galleria Imperiale", "Oro", "Corona", 1050],
    ["Il Municipio", "speciale"], ["Piazza Corona", "Oro", "Corona", 1100], ["Corso della Borsa", "Oro", "Corona", 1200],
    ["Banca Centrale", "speciale"], ["Skyline Avenue", "Platino", "Corona", 1400], ["Piazza dei Re", "Platino", "Corona", 1500],
    ["Casinò Reale", "speciale"], ["Torre Sovrana", "Platino", "Corona", 1700], ["Corona Tower", "Platino", "Corona", 2000],
  ];
  const CORNER_TO_INNER = { 0: 0, 10: 3, 20: 6, 30: 9 };
  const INNER_TO_CORNER = { 0: 0, 3: 10, 6: 20, 9: 30 };
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
    if (l.chiuso > 0 || l.owner == null) return 0;
    const owner = giocatore(s, l.owner);
    if (owner.faro > 0 && l.lvl === 0) return 0;
    const base = N.affVuoto * l.prezzo;
    if (l.lvl === 0) return round(base * (haSerie(s, owner, l.serie) ? 2 : 1) * vmult(s, l.isola));
    const t = ATTIVITA[l.tipo];
    return round(base * t.a * N.affLvl[l.lvl] * vmult(s, l.isola));
  }
  function rendita(s, l) {
    if (!l.tipo || l.lvl === 0 || l.chiuso > 0) return 0;
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
  function privato(s, p, testo) { p.messaggi.push({ ciclo: s.ciclo + 1, testo }); if (p.messaggi.length > 60) p.messaggi.shift(); }

  // ------------------------------------------------------------ nuova partita
  function nuovaPartita(opz) {
    const seed = (opz.seed ?? Math.floor(Math.random() * 1e9)) >>> 0;
    const s = {
      versione: 1, seed, rngState: seed, ciclo: 0, giorno: 0, fase: "pacchetti", turno: 0,
      ordine: [], players: [], lotti: [], valore: {}, borsa: {}, cripto: {}, sette: [], contratti: [], inviti: [],
      gazzetta: [], log: [], sindaco: null, candidati: {}, leggi: [], tassa: N.tassa, licenze: [],
      pending: null, notteFatti: {}, prossimoId: 1, principianti: !!opz.principianti, fine: false,
    };
    OUTER.forEach((c, i) => s.lotti.push(cella(s, c, "o", i)));
    INNER.forEach((c, i) => s.lotti.push(cella(s, c, "i", i)));
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
        dadi: null, azioneGiornoFatta: false, haTirato: false, doppi: 0, sette: [], ombraCicli: 0,
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
    p.haTirato = false; p.azioneGiornoFatta = false; p.doppi = 0; p.dadi = null;
    s.pending = null;
    if (p.faro > 0) {
      p.faro -= 1;
      log(s, p.nome + " è al Faro (ancora " + p.faro + " turni). Ha diritto a una telefonata.", p.id);
      p.haTirato = true; // non si muove; puo' fare 1 azione
    }
  }

  function tira(s, p) {
    if (s.fase !== "giorno") err("Si tirano i dadi solo di giorno.");
    if (corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (p.haTirato) err("Hai già tirato i dadi.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    const d1 = dado(s), d2 = dado(s), n = d1 + d2;
    p.dadi = [d1, d2];
    const doppio = d1 === d2;
    if (doppio) p.doppi += 1;
    if (p.doppi >= 3) {
      mandaAlFaro(s, p, 2, "tre doppi di fila");
      p.haTirato = true;
      return;
    }
    log(s, p.nome + " tira " + d1 + " e " + d2 + ".", p.id);
    muovi(s, p, n, doppio);
    if (!doppio) p.haTirato = true;
  }

  function muovi(s, p, n, doppio) {
    if (p.inner) {
      for (let k = 0; k < n; k++) {
        p.ipos = (p.ipos + 1) % 12;
        if (INNER_TO_CORNER[p.ipos] !== undefined && k < n - 1 && p.vuoleUscire !== false) {
          p.inner = false; p.pos = INNER_TO_CORNER[p.ipos];
          log(s, p.nome + " esce da Isola Corona.", p.id);
          for (let j = k + 1; j < n; j++) passo(s, p);
          break;
        }
      }
    } else {
      for (let k = 0; k < n; k++) {
        passo(s, p);
        if (doppio && CORNER_TO_INNER[p.pos] !== undefined && k < n - 1 && p.vuoleCorona !== false) {
          p.inner = true; p.ipos = CORNER_TO_INNER[p.pos];
          log(s, p.nome + " fa un doppio e svolta verso Isola Corona.", p.id);
          for (let j = k + 1; j < n; j++) p.ipos = (p.ipos + 1) % 12;
          break;
        }
      }
    }
    const c = casella(s, p);
    atterra(s, p, c);
  }
  function passo(s, p) {
    p.pos = (p.pos + 1) % 40;
    if (p.pos === 0) {
      if (p.blocco > 0) { log(s, p.nome + " passa dal Via ma lo Stipendio è bloccato dal Giudice.", p.id); }
      else { p.cash += N.stipendio; log(s, p.nome + " passa dal Ponte Sud e incassa lo Stipendio (" + euro(N.stipendio) + ").", p.id); }
    }
  }
  function casella(s, p) { return p.inner ? s.lotti.find((l) => l.giro === "i" && l.idx === p.ipos) : s.lotti.find((l) => l.giro === "o" && l.idx === p.pos); }

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
        log(s, p.nome + " paga " + euro(dovuto) + " di affitto a " + owner.nome + " (" + c.nome + ").", p.id);
      }
      return;
    }
    switch (c.nome) {
      case "Gazzetta": cartaGazzetta(s, p); break;
      case "Ponte Est — Posto di blocco": postoDiBlocco(s, p); break;
      case "Mercato Nero": privato(s, p, "Al Mercato Nero puoi comprare oggetti per la notte (maschera, disturbatore) anche con soldi sporchi."); p.mercatoNero = true; break;
      case "Spiaggia VIP": { const f = 2 + Math.floor(rng(s) * 4); p.fama += f; log(s, p.nome + " incontra un ospite famoso alla Spiaggia VIP: +" + f + " fama.", p.id); break; }
      case "Gala Flamingo": s.pending = { tipo: "gala", giocatore: p.id }; break;
      case "Porto Container": privato(s, p, "Al Porto Container: stanotte il tuo primo carico costa il 20% in meno."); p.scontoCarico = true; break;
      case "La Borsa": privato(s, p, "Alla Borsa: le tue prossime operazioni oggi sono senza commissioni."); break;
      case "Il Municipio": s.pending = { tipo: "municipio", giocatore: p.id }; break;
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
    ["Avanzi fino al Ponte Sud e incassi lo Stipendio.", (s, p) => { if (!p.inner) { p.pos = 0; if (!p.blocco) p.cash += N.stipendio; } }],
    ["Uno scandalo minore ti tocca di striscio: -3 fama.", (s, p) => { p.fama = Math.max(0, p.fama - 3); }],
    ["Dividendo straordinario: +10% sulle tue azioni.", (s, p) => { for (const a of AZIENDE) if (p.azioni[a]) p.azioni[a] *= 1.1; }],
  ];
  function cartaGazzetta(s, p) {
    const i = Math.floor(rng(s) * CARTE.length);
    const [testo, f] = CARTE[i];
    f(s, p);
    log(s, p.nome + " pesca una Gazzetta: " + testo, p.id);
    s.ultimaCarta = { giocatore: p.id, testo };
  }

  function postoDiBlocco(s, p) {
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
      p.cash -= l.prezzo; l.owner = p.id; s.pending = null;
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
      w.cash -= bid; l.owner = w.id;
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
      if (p.cash < 500_000) err("La licenza costa 500.000 €.");
      p.cash -= 500_000; s.licenze.push(p.id);
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
    if (p.inner === false && casella(s, p).id === l.id) costo *= 0.9;
    costo = round(costo);
    if (p.cash < costo) err("Ti servono " + euro(costo) + " puliti.");
    p.cash -= costo; l.tipo = nuovoTipo; l.lvl = next; p.azioneGiornoFatta = true;
    log(s, p.nome + " porta " + ATTIVITA[l.tipo].nome + " in " + l.nome + " al livello " + next + " (" + euro(costo) + ").", p.id);
    if (next >= 3) { notizia(s, ATTIVITA[l.tipo].nome + " di " + p.nome + " in " + l.nome + " cresce: ora è di livello " + next + ".", "affari"); controllaValoreLusso(s, l); }
    if (ATTIVITA[l.tipo].lusso && next >= 3) p.fama += 3;
  }
  function controllaValoreLusso(s, l) {
    if (l.tipo && ATTIVITA[l.tipo].lusso && l.lvl >= 3) s.valore[l.isola] = clamp(s.valore[l.isola] + 0.3, 1, 10);
  }
  function piano(s, p, funzione) {
    azioneGiorno(s, p);
    const FUN = ["appartamenti", "uffici", "ristorante_panoramico", "spa", "casino_privato", "caveau", "sala_insonorizzata", "garage", "eliporto", "piani_segreti"];
    if (!FUN.includes(funzione)) err("Funzione del piano non valida.");
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
      s.giorno = 0; s.fase = "notte"; s.notteFatti = {};
      for (const p of s.players) { p.affariStanotte = []; p.mosseNotte = 0; p.mossePagate = []; p.pulitoCiclo = true; p.spiaSu = null; p.disturbatore = false; }
      if (s.principianti && s.ciclo === 0) notizia(s, "Prima notte: per i principianti gli affari illegali si aprono dal secondo Ciclo.", "evento");
      log(s, "Cala la Notte sul Ciclo " + (s.ciclo + 1) + ".");
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
    return c.isola || (p.inner ? "Corona" : ["Ambra", "Palma", "Flamingo", "Sole"][Math.floor(p.pos / 10) % 4]);
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
    pagatore.cash -= k.pagoOra; ricevente.cash += k.pagoOra;
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
  function regala(s, p, idA, importo, sporchi) {
    importo = Math.floor(importo || 0); const a = giocatore(s, idA);
    if (importo <= 0) err("Importo non valido.");
    if (sporchi) { if (p.sporchi < importo) err("Non hai abbastanza sporchi."); p.sporchi -= importo; a.sporchi += importo; }
    else { if (p.cash < importo) err("Non hai abbastanza soldi."); p.cash -= importo; a.cash += importo; }
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
    if (p.inner) p.inner = false; p.pos = 10;
    log(s, p.nome + " va al Faro per " + turni + " turni (" + motivo + ").", p.id);
    notizia(s, p.nome + " è stato portato al Faro.", "scandalo");
  }
  function condanna(s, p, gravita, motivo) {
    gravita = gravita || "lieve";
    if (p.condanne > 0 && gravita !== "gravissima") gravita = ORDINE_GRAVITA[ORDINE_GRAVITA.indexOf(gravita) + 1];
    const pena = PENE[gravita];
    let protGiudice = false;
    for (const id of p.sette) { const st = s.sette.find((x) => x.id === id); if (st && st.giudice) protGiudice = true; }
    if (protGiudice && rng(s) < 0.6) {
      privato(s, p, "Il Giudice è dei vostri: il processo si chiude con un nulla di fatto.");
      notizia(s, "Assolto " + p.nome + ". Qualcuno storce il naso.", "scandalo");
      p.stato = 0; p.tracce *= 0.5; p.peggiorReato = null; return;
    }
    const confiscati = p.sporchi; p.sporchi = 0;
    const protetto = p.funzioniPiani.includes("caveau") && gravita !== "gravissima" ? Math.min(confiscati, 5_000_000) : 0;
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
    // risultati delle spie
    for (const p of s.players) if (p.spiaSu) {
      const b = giocatore(s, p.spiaSu);
      if (b.affariStanotte && b.affariStanotte.length && !b.disturbatore && rng(s) < 0.5) {
        p.prove.push({ su: b.id, ciclo: s.ciclo + 1, cosa: AFFARI[b.affariStanotte[0].tipo].nome });
        privato(s, p, "Hai una foto di " + b.nome + " durante un affare illegale. È una Prova: puoi usarla per denunciare, ricattare o per un articolo.");
      } else privato(s, p, "Hai seguito " + b.nome + " tutta la notte, ma non hai trovato niente.");
    }
    for (const p of s.players) {
      const r = { rendite: 0, tasse: 0, evasa: 0, stipendioSindaco: 0, interessi: 0, corruzione: 0, veicoli: 0, palazzo: 0, decima: 0 };
      // rendite
      let rend = 0;
      for (const l of propri(s, p)) {
        if (l.chiuso > 0) { l.chiuso -= 1; continue; }
        rend += rendita(s, l);
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
      if (a === "SoleTech") mu += s.lotti.filter((l) => l.tipo === "uffici").length * 0.01;
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
    if (s.ciclo >= N.cicli) return fine(s);
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
      case "retata": { const i = ISOLE[Math.floor(rng(s) * 4)]; for (const p of vivi) if (!p.pulitoCiclo) p.tracce += 8; notizia(s, "Retata della polizia a " + NOMI_ISOLE[i] + ": controlli ovunque.", "evento"); break; }
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
      case "affare": return affare(s, p, a.affare, a.intensita, a.mosse);
      case "corrompi": return corrompi(s, p, a.chi, a.isola, !!a.sporchi);
      case "ricicla": return ricicla(s, p, a.metodo, a.importo);
      case "spia": return spia(s, p, a.bersaglio);
      case "denuncia": return denuncia(s, p, a.prova);
      case "pronto": return pronto(s, p);
      case "fonda_setta": return fondaSetta(s, p, a.nome, a.motto);
      case "invita_setta": return invitaSetta(s, p, a.setta, a.invitato);
      case "rispondi_invito": return rispondiInvito(s, p, a.setta, !!a.si);
      case "versa_setta": return versaSetta(s, p, a.setta, a.importo, !!a.sporchi);
      case "recluta": return recluta(s, p, a.setta, a.chi);
      case "operazione": return operazione(s, p, a.setta, a.op, a.bersaglio, a.direzione);
      case "articolo": return articolo(s, p, a.bersaglio, a.tono, a.importo, a.testo, !!a.sporchi);
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
      for (const k of ["cash", "sporchi", "tracce", "stato", "corrotti", "prove", "messaggi", "debito", "azioni", "cripto", "evasione", "affariStanotte", "spiaSu", "sette", "settaFondata", "reputazione", "peggiorReato", "riciclTot", "ultimaSentenza", "offertaBoss"]) delete p[k];
      p.fascia = fasciaPubblica;
    }
    v.sette = s.sette.filter((st) => st.membri.includes(idGiocatore));
    v.inviti = s.inviti.filter((x) => x.a === idGiocatore);
    v.contratti = s.contratti.filter((k) => k.da === idGiocatore || k.a === idGiocatore || (k.tipo === "notarile" && k.stato !== "proposto")).map((k) => (k.da === idGiocatore || k.a === idGiocatore) ? k : { id: k.id, da: k.da, a: k.a, tipo: k.tipo, stato: k.stato });
    if (v.pending && v.pending.tipo === "asta") v.pending.offerte = Object.fromEntries(Object.keys(s.pending.offerte).map((k) => [k, k === idGiocatore ? s.pending.offerte[k] : "segreta"]));
    if (v.ultimaAlba) v.ultimaAlba.riepilogo = { [idGiocatore]: s.ultimaAlba.riepilogo[idGiocatore] };
    return v;
  }

  const API = {
    N, ATTIVITA, AFFARI, PACCHETTI, AZIENDE, MONETE, ISOLE, NOMI_ISOLE, STATI, LEGGI, PENE,
    nuovaPartita, applica, vista, patrimonio, fascia, affitto, rendita, copertura, valoreLotto, valorePalazzo, valoreInvestimenti,
    haSerie, propri, corrente, casella, livelloSetta, euro, giocatore,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.Laguna = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
