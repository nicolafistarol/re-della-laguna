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

  // ------------------------------------------------------------ versione del motore e generazione delle partite
  // VERSIONE: il numero di questa versione del gioco, lo stesso di ?v= in index.html (li alza insieme pubblica.sh).
  // Sta anche nella vista (versioneMotore): il browser lo confronta con il suo e, se il server e' diverso,
  // puo' dire "e' uscita una versione nuova: ricarica la pagina".
  const VERSIONE = 65;
  // GENERAZIONE (regola G1 di DECISIONI.md). Correzioni, sicurezza, chiarezza e funzioni nuove valgono per TUTTE le partite.
  // I numeri di bilanciamento che cambiano i conti (rendite, soglie, prezzi, percentuali) valgono solo per le partite NUOVE:
  // una partita creata da qui in poi nasce con s.gen = 2; quelle gia' iniziate non hanno il campo e valgono 1.
  //   - un numero nuovo:   si scrive in N_GEN2 (stessa chiave di N) e si legge con num(s, "chiave") invece di N.chiave
  //   - una regola nuova:  if (gen2(s)) { ...regola nuova... } else { ...regola di prima... }
  // Ogni campo nuovo dello stato deve avere un ripiego (x.campo || valore): le partite vecchie non lo hanno.
  const GEN = 2;
  // VERSIONE_REGOLE: il numero delle regole (lo stesso di ?v= nella pagina e della finestra "Novita'"). Sta anche nella vista
  // (versioneRegole): se la pagina e' piu' vecchia del motore che ha fatto la vista, chiede di aggiornare.
  const VERSIONE_REGOLE = 77;
  function gen2(s) { return ((s && s.gen) || 1) >= 2; }

  // ------------------------------------------------------------ numeri del gioco
  const N = {
    cicli: 8, giorni: 4,
    // come finisce la partita: a Cicli, a obiettivo (patrimonio) o libera (la chiude chi l'ha creata)
    durataCicli: [6, 8, 10, 12, 16, 20], obiettivi: [50_000_000, 100_000_000, 200_000_000], quasiTraguardo: 0.75,
    settaOffertaMax: 10_000_000, spintaForte: 0.4,
    // LE PISTE: la polizia ti scopre sempre per un motivo
    pistaLuogoNotte: 0.4,   // guai di notte x(1 + 0,4 x calore del posto)
    pistaLuogo: 6,          // Tracce in piu' all'indagine: 6 x calore^2 per ogni posto
    pistaSoldi: 8,          // Tracce in piu' per ogni milione di soldi che "non tornano"
    pistaRivale: 8,         // per ogni Prova che un rivale ha su di te
    pistaComplice: 12,      // per ogni complice sotto inchiesta che non hai scaricato
    occupata: 0.75, // se la polizia indaga su un altro, per te rischi e controlli x0,75
    resaK: 60, resaStato: 0.1, resaMax: 0.9, resaMulta: 1.5, // la Resa dei conti di fine partita
    cashStart: 1_500_000, stipendio: 600_000, valoreSporchi: 0.25, tassa: 0.20,
    affVuoto: 0.15, affLvl: [1, 1, 4, 12, 26, 45], rendLvl: [0, 1, 2.2, 3.6, 5.2, 7.0],
    costLvl: [0, 0.5, 0.5, 0.75, 1.0, 1.5], R: 0.95,
    moloFee: [0, 25_000, 50_000, 100_000, 200_000],
    pianoCost: 400_000, pianoGrow: 1.08, pianoRend: 0.62, pianiMax: 60, cantiereGrande: 6,
    pianoRendGrow: 1.08, // di quanto cresce la RENDITA di ogni piano in piu' (gen 1: come il costo)
    lussoRend: 1, permessoBollo: 0, decimaMax: 0, terrenoInizialeMin: 150_000,
    illegaleLivello: [1, 1, 1, 1, 1], // gli affari della notte valgono di piu' salendo di Livello (solo gen 2)
    astaBase: 0.6, // base d'asta: il 60% del prezzo del terreno. Sotto non si vende (vale per tutte le aste dei terreni)
    bonusIllegale: 1.4, // gli affari della notte rendono il 40% in piu': tanto premio, tanto rischio
    borsaMu: 0.21, dividendoInv: 0.04, borsaSd: 0.16, criptoMu: 0.40, criptoSd: 0.50, criptoCrash: 0.12,
    caricoBase: 350_000, caricoGrow: 150_000, caricoMax: 3_000_000, caricoMagazzino: 1.5,
    profittoBase: 0.65, tracceAffare: 10, coltoBase: 0.012, affariNotte: 2,
    intens: { prudente: [1.0, 0.5], normale: [1.4, 1.0], spavaldo: [2.0, 3.0] },
    ricCopPerdita: 0.15, ricCopTracce: 0.4, shadowPerdita: 0.25, shadowTracce: 0.6,
    evasioneMax: 0.30,
    indagineK: 100, scendi: 0.35, decayPulito: 0.20, decaySporco: 0.05,
    prot: { agente: 0.30, commissario: 0.50, max: 0.70 },
    corruz: { agente: [250_000, 125_000], commissario: [1_000_000, 500_000], banchiere: [750_000, 375_000], doganiere: [500_000, 250_000] },
    pentito: 0.04, oggettoFalla: 0.15,
    prestitoQuota: 0.30, prestitoInt: 0.10, emergenzaInt: 0.25, ipotecaQuota: 0.5,
    ipotecaCicli: 4, ipotecaRiscatto: 1.1, debitoAlba: 0.5, // ipoteca: 4 Cicli per riscattarla pagando il 10% in piu'; debiti: a ogni Alba la Banca si prende meta' dei contanti
    candidatura: 750_000, stipendioSindaco: 750_000,
    settaPatrimonio: 8_000_000, settaFama: 20, settaSporchi: 8_000_000, settaCosto: 5_000_000, settaTesoroIniziale: 2_000_000, settaLivelli: [0, 3_000_000, 8_000_000, 20_000_000], settaInfluenza: [0, 0, 12, 35, 70], rapido: { traghetto: 50_000, motoscafo: 100_000, elicottero: 300_000, jet: 600_000 }, rapidoOgni: 2, costoBallo: 300_000, decima: 0.15, perqDa: 25, perqK: 160, perqMax: 0.35, perqSequestro: 0.3,
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
  // I numeri che cambiano SOLO per le partite nuove (gen 2). Stessa chiave di N, una riga per tema.
  // Vuoto finche' nessuno ne aggiunge: num(s, k) allora da' sempre N[k].
  const N_GEN2 = {
    // --- economia e Palazzo
    pianoRendGrow: 1.04,   // ECO-01: la rendita dei piani cresce meno del loro costo. Il rapporto diceva 1,05: provato insieme agli altri ritocchi dava 800 M a 20 Cicli, con 1,04 circa 600 M
    borsaMu: 0.18,         // ECO-05: con 0,36 l'Investitore vinceva 7 partite su 10; con 0,24 ancora 4 su 10 (sim 18/11 sera); 0,18 = come le partite vecchie
    // --- giorno: terreni, affitti, permessi
    affLvl: [1, 7, 18, 36, 65, 100], // GIO-02: l'affitto cresce con l'attivita' (prima [1, 1, 4, 12, 26, 45]): livello 1 = 105% del prezzo del terreno, livello 2 = 270%
    lussoRend: 0.85,       // PT-13: Hotel e Boutique di lusso rendono il 15% in meno del Ristorante, ma danno fama a ogni Alba
    permessoBollo: 0.10,   // il permesso e' sicuro ma si paga: 10% del prezzo del terreno (gratis se sei fermo sul Municipio)
    terrenoInizialeMin: 350_000, // ECO-03: terreni iniziali di valore vicino
    // --- notte e affari illegali
    illegaleLivello: [1, 1, 1.5, 2.5, 4], // ECO-02
    dividendoInv: 0.025,
    // --- polizia e pene
    // --- setta
    decimaMax: 1_000_000,  // ECO-06: la decima si paga solo sulle attivita', al massimo 1 M x livello della setta a ogni Alba
    spintaForte: 0.25, // "Muovere un titolo" con una setta di livello 3 o piu' (prima 0,40)
  };
  // num(s, "chiave"): partita nuova -> il numero di N_GEN2 se c'e', altrimenti quello di N; partita vecchia -> sempre N.
  function num(s, k) { return gen2(s) && Object.prototype.hasOwnProperty.call(N_GEN2, k) ? N_GEN2[k] : N[k]; }

  // Tipi di attivita': rendita (x R), affitto (x), copertura (quota prezzo x livello), attenzione
  const ATTIVITA = {
    residenze: { nome: "Residenze", perk: "Rende poco, ma chi ci finisce sopra paga il doppio d'affitto.", perche: "Sceglila sulle caselle dove gli altri cadono spesso: l'affitto è doppio.", rischio: "Nessuno.", gruppo: "residenze", r: 0.45, a: 2.0, c: 0, att: 0, isole: null },
    ristorante: { nome: "Ristorante", perk: "Rende bene, sempre. È l'attività normale.", perche: "Sceglilo quando vuoi solo soldi sicuri a ogni Alba.", rischio: "Nessuno.", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Ambra", "Palma", "Corona"] },
    hotel: { nome: "Hotel di lusso", perk: "Lusso: dal livello 3 ti dà fama e fa salire il valore dell'isola.", perche: "Sceglilo se ti serve fama: elezioni, sale riservate di notte, livello Icona.", rischio: "Nessuno.", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Palma", "Flamingo", "Corona"], lusso: true },
    boutique: { nome: "Boutique di lusso", perk: "Lusso: dal livello 3 ti dà fama e fa salire il valore dell'isola.", perche: "Sceglila se ti serve fama: elezioni, sale riservate di notte, livello Icona.", rischio: "Nessuno.", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Flamingo", "Corona"], lusso: true },
    uffici: { nome: "Uffici e hub tech", perk: "Fa salire SoleTech in Borsa.", perche: "Sceglili se hai (o vuoi) azioni SoleTech: ogni ufficio le spinge su.", rischio: "Nessuno.", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Sole", "Corona"] },
    yachtclub: { nome: "Yacht club", perk: "I tuoi mezzi a noleggio rendono il 25% in più.", perche: "Sceglilo se hai mezzi a noleggio: yacht, elicottero, jet.", rischio: "Nessuno.", gruppo: "reddito", r: 1.0, a: 1.0, c: 0.3, att: 0, isole: ["Palma"] },
    agenzia: { nome: "Agenzia immobiliare", perk: "All'Agenzia compri i terreni senza il 20% in più.", perche: "Sceglila se vuoi comprare tanti terreni: all'Agenzia risparmi il 20% ogni volta.", rischio: "Rende poco.", gruppo: "servizi", r: 0.6, a: 0.8, c: 0, att: 0, isole: null },
    legale: { nome: "Studio legale", perk: "Se ti condannano, la multa è più bassa del 30%.", perche: "Sceglilo se fai affari sporchi: se ti condannano paghi meno.", rischio: "Rende poco.", gruppo: "servizi", r: 0.6, a: 0.8, c: 0, att: 0, isole: ["Corona", "Sole"] },
    lavanderia: { nome: "Lavanderia", perk: "Ti fa ripulire i soldi sporchi al Casinò Reale.", perche: "Sceglila se di notte fai soldi sporchi: senza una copertura non li ripulisci.", rischio: "Se fai affari sporchi, attira la polizia.", gruppo: "copertura", r: 0.6, a: 0.8, c: 0.8, att: 1, isole: ["Ambra", "Sole"] },
    galleria: { nome: "Galleria d'arte", perk: "Ripulisce soldi sporchi e apre l'affare «Falsi d'autore».", perche: "Sceglila se vuoi un affare tutto tuo di notte: i falsi d'autore.", rischio: "Attira la polizia.", gruppo: "copertura", r: 0.6, a: 0.8, c: 0.8, att: 1, isole: ["Flamingo", "Corona"] },
    magazzino: { nome: "Magazzino portuale", perk: "Ripulisce soldi sporchi e al Porto carichi il 50% in più.", perche: "Sceglilo se fai contrabbando al Porto: carichi il 50% in più.", rischio: "Attira la polizia.", gruppo: "copertura", r: 0.6, a: 0.8, c: 0.8, att: 1, isole: ["Sole", "Ambra"] },
    discoteca: { nome: "Discoteca", perk: "Rende tanto e apre la bisca clandestina. È anche lusso.", perche: "Sceglila se vuoi tanto incasso e la bisca, e accetti la polizia addosso.", rischio: "Attira molto la polizia.", gruppo: "notte", r: 1.25, a: 1.0, c: 0.5, att: 2, isole: ["Flamingo", "Palma"], lusso: true },
    beachclub: { nome: "Beach club", perk: "Rende tanto, apre la bisca clandestina e ti dà +2 fama a ogni Alba.", perche: "Sceglilo se vuoi incasso e fama insieme, e accetti la polizia addosso.", rischio: "Attira molto la polizia.", gruppo: "notte", r: 1.25, a: 1.0, c: 0.5, att: 2, isole: ["Palma"] },
    casino: { nome: "Casinò", perk: "Rende più di tutte e ripulisce tanto. Serve la licenza.", perche: "Sceglilo se hai la licenza e tanti soldi sporchi da ripulire.", rischio: "La polizia lo guarda moltissimo.", gruppo: "rischio", r: 1.6, a: 1.2, c: 1.2, att: 4, isole: ["Flamingo", "Corona"], licenza: true, lusso: true },
    bancaprivata: { nome: "Banca privata", perk: "Rende più di tutte e ripulisce tanto. Serve tutto il gruppo di vie.", perche: "Sceglila se hai tutto il gruppo di vie a Isola Corona: rende più di tutte.", rischio: "La polizia la guarda molto.", gruppo: "rischio", r: 1.6, a: 1.2, c: 1.2, att: 3, isole: ["Corona"], serie: true },
  };

  const AFFARI = {
    contrabbando: { nome: "Contrabbando", profitto: 0.65, tracce: 10, gravita: "media", descr: "Compri un carico al porto e lo rivendi." },
    ricettazione: { nome: "Ricettazione", profitto: 0.40, tracce: 6, gravita: "media", descr: "Compri merce rubata a poco e la rivendi." },
    bisca: { nome: "Bisca clandestina", profitto: 0.90, tracce: 8, gravita: "lieve", descr: "Serve una tua discoteca o un tuo casinò.", richiede: ["notte", "rischio"] },
    falsi: { nome: "Falsi d'autore", profitto: 1.0, tracce: 14, gravita: "grave", descr: "Serve una tua galleria d'arte.", richiede: ["galleria"] },
    colpo: { nome: "Il Colpo", profitto: 2.5, tracce: 30, gravita: "gravissima", descr: "Furto al caveau. Serve una setta di livello 3." },
  };

  // Le classi: tutti partono con gli stessi soldi e un terreno a sorte; ogni classe ha un vantaggio suo.
  const PACCHETTI = [
    { id: "commerciante", nome: "Il Commerciante", perk: "Tutti i tuoi affitti rendono il 25% in più.", extra: {} },
    { id: "costruttore", nome: "Il Costruttore", perk: "Cantieri e piani del Palazzo costano il 15% in meno. Il permesso del Palazzo è gratis.", extra: {} },
    { id: "investitore", nome: "L'Investitore", perk: "Ogni Alba le tue azioni ti pagano un dividendo (4%; nelle partite nuove 2,5%).", extra: {} },
    { id: "playboy", nome: "Il Playboy", perk: "+2 fama ogni Alba. Parti con il motoscafo (Viaggio rapido tra i Moli) e gli amici dello yacht.", extra: { veicolo: "motoscafo" } },
    { id: "contrabbandiere", nome: "Il Contrabbandiere", perk: "Gli affari della notte lasciano il 30% di Tracce in meno. Un posto in più in valigetta.", extra: {} },
    { id: "politico", nome: "Il Politico", perk: "Parti con fama 20. Candidarti a Sindaco costa metà e la licenza del casinò è più facile (3 volte su 4 al primo colpo).", extra: { fama: 20 } },
    { id: "ereditiera", nome: "L'Ereditiera", perk: "La banca ti presta il doppio e senza interessi.", extra: {} },
    { id: "speculatore", nome: "Lo Speculatore", perk: "Ogni Alba le tue cripto crescono del 5% in più.", extra: {} },
  ];



  const AZIENDE = ["Corona Bank", "Laguna Energy", "Flamingo Luxury", "SoleTech", "Palma Resorts", "Marina Shipping"];
  const MONETE = ["LagunaCoin", "FlamingoToken", "ShadowCoin"];

  // Il tabellone: un unico giro da 100 caselle che entra in tutte e 5 le isole (20 caselle per isola).
  // Ogni isola ha 20 caselle: un ponte (o ingresso), 4 gruppi di vie da 3, l'Asta del Comune, un molo, un'Agenzia, Gazzette e luoghi speciali.
  const OUTER = [
    // Borgo Ambra (caselle 0-19)
    ["Ponte Sud — Partenza", "angolo"], ["Vicolo del Mercato", "Spezie", "Ambra", 60], ["Via delle Spezie", "Spezie", "Ambra", 70],
    ["Gazzetta", "gazzetta"], ["Piazzetta Ambra", "Spezie", "Ambra", 80], ["Molo Ambra", "Moli", "Ambra", 150],
    ["Vicolo dei Pescatori", "Lanterne", "Ambra", 100], ["Mercato Nero", "speciale"], ["Via delle Lanterne", "Lanterne", "Ambra", 110],
    ["Scalinata dei Gatti", "Lanterne", "Ambra", 120], ["Agenzia di Borgo Ambra", "agenzia"],
    ["Corte dei Mosaici", "Terracotta", "Ambra", 140], ["Via dei Vasai", "Terracotta", "Ambra", 150], ["Gazzetta", "gazzetta"],
    ["Piazza del Campanile", "Terracotta", "Ambra", 170],
    ["Riva del Sale", "Salina", "Ambra", 180], ["Calle dei Salinari", "Salina", "Ambra", 190], ["Asta del Comune", "asta"], ["Piazza della Salina", "Salina", "Ambra", 200],
    ["Bisca del Vicolo", "speciale"],
    // Costa Palma (20-39)
    ["Ponte Ovest — Il Faro", "angolo"], ["Lungomare Cocco", "Sabbia", "Palma", 190], ["Via delle Onde", "Sabbia", "Palma", 200],
    ["Gazzetta", "gazzetta"], ["Spiaggia dei Gabbiani", "Sabbia", "Palma", 220], ["Molo Palma", "Moli", "Palma", 150],
    ["Baia Turchese", "Corallo", "Palma", 240], ["Spiaggia VIP", "speciale"], ["Viale dei Resort", "Corallo", "Palma", 260],
    ["Punta Palma", "Corallo", "Palma", 280], ["Agenzia di Costa Palma", "agenzia"],
    ["Sentiero delle Palme", "Giungla", "Palma", 300], ["Belvedere delle Palme", "Giungla", "Palma", 310], ["Gazzetta", "gazzetta"],
    ["Golf delle Palme", "Giungla", "Palma", 330],
    ["Sentiero delle Mangrovie", "Mangrovie", "Palma", 340], ["Asta del Comune", "asta"], ["Approdo delle Mangrovie", "Mangrovie", "Palma", 345], ["Laguna delle Mangrovie", "Mangrovie", "Palma", 350],
    ["Eliporto Nord", "eliporto"],
    // Isola Corona (40-59)
    ["Ingresso di Isola Corona", "angolo"], ["Viale dei Diamanti", "Oro", "Corona", 900], ["Galleria Imperiale", "Oro", "Corona", 950],
    ["La Borsa", "speciale"], ["Piazza Corona", "Oro", "Corona", 1000], ["Il Municipio", "speciale"],
    ["Via degli Smeraldi", "Smeraldo", "Corona", 1100], ["Piazza Smeraldo", "Smeraldo", "Corona", 1150], ["Asta del Comune", "asta"], ["Loggia degli Smeraldi", "Smeraldo", "Corona", 1180],
    ["Corso della Borsa", "Platino", "Corona", 1200], ["Banca Centrale", "speciale"], ["Skyline Avenue", "Platino", "Corona", 1300],
    ["Piazza dei Re", "Platino", "Corona", 1400], ["Gazzetta", "gazzetta"], ["Casinò Reale", "speciale"],
    ["Torre Sovrana", "Diamante", "Corona", 1600], ["Corona Tower", "Diamante", "Corona", 1800],
    ["Agenzia di Isola Corona", "agenzia"], ["Attico del Re", "Diamante", "Corona", 2000],
    // Baia Flamingo (60-79)
    ["Eliporto Flamingo", "eliporto"], ["Viale Neon", "Neon", "Flamingo", 360], ["Flamingo Drive", "Neon", "Flamingo", 380],
    ["Gazzetta", "gazzetta"], ["Via delle Orchidee", "Neon", "Flamingo", 400], ["Molo Flamingo", "Moli", "Flamingo", 150],
    ["Ocean Boulevard", "Velluto", "Flamingo", 440], ["Gala Flamingo", "speciale"], ["Villa Rosa", "Velluto", "Flamingo", 460],
    ["Belvedere Flamingo", "Velluto", "Flamingo", 480], ["Agenzia di Baia Flamingo", "agenzia"],
    ["Passeggiata Rosa", "Perla", "Flamingo", 500], ["Piazza dei Fenicotteri", "Perla", "Flamingo", 520], ["Gazzetta", "gazzetta"],
    ["Lungolago delle Ninfee", "Perla", "Flamingo", 550],
    ["Viale del Tramonto", "Tramonto", "Flamingo", 560], ["Terrazza del Tramonto", "Tramonto", "Flamingo", 570], ["Asta del Comune", "asta"], ["Pontile del Tramonto", "Tramonto", "Flamingo", 575],
    ["Eliporto della Spiaggia", "eliporto"],
    // Distretto Sole (80-99)
    ["Ponte Est — Posto di blocco", "angolo"], ["Via dei Cantieri", "Acciaio", "Sole", 580], ["Corso Industria", "Acciaio", "Sole", 600],
    ["Gazzetta", "gazzetta"], ["Viale Solare", "Acciaio", "Sole", 640], ["Molo Sole", "Moli", "Sole", 150],
    ["Darsena Container", "Vetro", "Sole", 680], ["Porto Container", "speciale"], ["Piazza dell'Innovazione", "Vetro", "Sole", 720],
    ["Torre del Sole", "Vetro", "Sole", 760], ["Agenzia del Distretto Sole", "agenzia"],
    ["Viale dei Pannelli", "Rame", "Sole", 800], ["Hub delle Gru", "Rame", "Sole", 820], ["Gazzetta", "gazzetta"],
    ["Lungomare Solare", "Rame", "Sole", 850],
    ["Via del Cobalto", "Cobalto", "Sole", 870], ["Piazza Fotovoltaica", "Cobalto", "Sole", 880], ["Asta del Comune", "asta"], ["Torre Eolica", "Cobalto", "Sole", 900],
    ["Aeroporto della Laguna", "aeroporto"],
  ];
  const CASELLE = OUTER.length; // 100
  const SEZIONE = 20;
  const ORDINE_ISOLE = ["Ambra", "Palma", "Corona", "Flamingo", "Sole"];
  const POS_FARO = 20;
  function isolaDiPos(pos) { return ORDINE_ISOLE[Math.floor((((pos % CASELLE) + CASELLE) % CASELLE) / SEZIONE)]; }
  const ISOLE = ["Ambra", "Palma", "Flamingo", "Sole", "Corona"];
  const NOMI_ISOLE = { Ambra: "Borgo Ambra", Palma: "Costa Palma", Flamingo: "Baia Flamingo", Sole: "Distretto Sole", Corona: "Isola Corona" };
  const STATI = ["Tranquillo", "Voci", "Osservato", "Indagato", "Processo"];
  const PENE = {
    lieve: { faro: 0, multa: 0.06, attivita: null, blocco: 0, fama: 5 },
    media: { faro: 2, multa: 0.12, attivita: "chiusa", blocco: 1, fama: 12 },
    grave: { faro: 4, multa: 0.24, attivita: "confisca", blocco: 2, fama: 30 },
    gravissima: { faro: 6, multa: 0.40, attivita: "confisca+", blocco: 3, fama: 50 },
  };
  const ORDINE_GRAVITA = [null, "lieve", "media", "grave", "gravissima"];
  // Le leggi durano fino alle prossime elezioni (ogni 2 Cicli), poi decadono. La stessa legge non si firma due volte.
  // L'Amnistia vale subito e una volta sola; il Giro di vite sulle cripto dura un Ciclo.
  const LEGGI = {
    tassa_lusso: { nome: "Tassa sul lusso", descr: "+10% sul prezzo di yacht, elicotteri e jet." },
    amnistia: { nome: "Amnistia", descr: "Tracce -30% a tutti." },
    giro_cripto: { nome: "Giro di vite sulle cripto", descr: "ShadowCoin bloccata per un Ciclo." },
    zona_franca: { nome: "Zona franca", descr: "Niente tasse a Distretto Sole." },
    polizia_doppia: { nome: "Polizia raddoppiata", descr: "Tracce che contano il doppio in un'isola." },
    condono: { nome: "Condono edilizio", descr: "I cantieri costano la metà per tutti." },
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
    for (const [k, g] of Object.entries(s.grandi || {})) if (g.quote && g.quote[p.id]) v += g.quote[p.id] * g.prezzoQuota;
    return v;
  }
  function patrimonio(s, p, conSporchi) {
    let v = p.cash + valoreInvestimenti(s, p) + valorePalazzo(p) - p.debito;
    for (const l of s.lotti) if (l.owner === p.id) v += valoreLotto(l) - (l.ipoteca || 0);
    if (conSporchi) v += N.valoreSporchi * p.sporchi;
    return v;
  }
  function fascia(s, p) { const v = patrimonio(s, p, false); return N.fasce.find((f) => v < f[0])[1]; }

  function affitto(s, l) {
    if (l.chiuso > 0 || l.owner == null || l.cantiere) return 0;
    const owner = giocatore(s, l.owner);
    if (owner.faro > 0 && l.lvl === 0) return 0;
    const base = N.affVuoto * l.prezzo;
    const sm = sitMult(s, "af", { isola: l.isola, tipo: l.tipo });
    if (l.lvl === 0) return round(base * (haSerie(s, owner, l.serie) ? 2 : 1) * vmult(s, l.isola) * (owner.pacchetto === "commerciante" ? 1.25 : 1) * sm);
    const t = ATTIVITA[l.tipo];
    // partite nuove: l'affitto cresce di piu' con il livello, e il gruppo completo da' +50% anche alle attivita'
    if (gen2(s)) return round(base * t.a * num(s, "affLvl")[l.lvl] * (haSerie(s, owner, l.serie) ? 1.5 : 1) * vmult(s, l.isola) * (owner.pacchetto === "commerciante" ? 1.25 : 1) * sm);
    return round(base * t.a * N.affLvl[l.lvl] * vmult(s, l.isola) * (owner.pacchetto === "commerciante" ? 1.25 : 1) * sm);
  }
  function rendita(s, l) {
    if (!l.tipo || l.lvl === 0 || l.chiuso > 0 || l.cantiere) return 0;
    const t = ATTIVITA[l.tipo];
    let r = N.R * t.r * N.rendLvl[l.lvl] * l.prezzo * vmult(s, l.isola) * sitMult(s, "re", { isola: l.isola, tipo: l.tipo });
    if (gen2(s) && lussoFama(t)) r *= num(s, "lussoRend");
    if (l.ipoteca) r *= 0.5;
    return round(r);
  }
  // Hotel e Boutique di lusso: nelle partite nuove rendono un po' meno ma danno fama a ogni Alba
  function lussoFama(t) { return !!(t && t.lusso && t.gruppo === "reddito"); }
  // quante vie di un gruppo ha un giocatore, e quante sono in tutto
  function vieGruppo(s, p, serie) { const v = serieLotti(s, serie); return { mie: v.filter((l) => l.owner === p.id).length, tutte: v.length }; }
  // Si puo' portare questo terreno al livello dopo? { ok, perche }
  //   partite nuove: livello 3 con 2 vie su 3 del gruppo, livelli 4 e 5 con il gruppo intero. Partite vecchie: gruppo intero dal livello 3.
  function puoSalire(s, p, l) {
    const next = l.lvl + 1, g = vieGruppo(s, p, l.serie);
    if (next > 5) return { ok: false, perche: "È già al livello massimo." };
    if (next >= 3 && g.mie < g.tutte && !(gen2(s) && next === 3 && g.mie >= Math.min(2, g.tutte))) return { ok: false, perche: gen2(s) && next === 3 ? "Per il livello 3 servono almeno 2 vie del gruppo " + l.serie + " (ne hai " + g.mie + " su " + g.tutte + ")." : "Per il livello " + next + " serve tutto il gruppo " + l.serie + " (hai " + g.mie + " vie su " + g.tutte + ")." };
    if (next === 5 && p.fama < 50) return { ok: false, perche: "Il livello Icona richiede fama 50 (ne hai " + p.fama + ")." };
    return { ok: true, perche: "" };
  }
  // Le soglie dei Livelli del giocatore. Partite nuove: piu' basse nelle partite corte, piu' alte in quelle lunghe (ECO-04).
  const SOGLIE_BASE = [0, 3_500_000, 7_000_000, 15_000_000, 40_000_000];
  function soglieLivello(s) {
    if (!gen2(s) || (s.modoFine || "cicli") !== "cicli") return SOGLIE_BASE;
    const f = { 6: 0.6, 8: 0.75, 10: 0.9, 12: 1, 16: 1.5, 20: 2.5 }[s.cicli || N.cicli] || 1;
    return SOGLIE_BASE.map((x) => round(x * f));
  }
  // di quanto valgono di piu' gli affari della notte per il Livello del giocatore (1 nelle partite vecchie)
  function moltIllegale(s, p) { return num(s, "illegaleLivello")[Math.min(4, (p && p.livello) || 0)] || 1; }
  function copertura(s, p) {
    let c = 0;
    for (const l of propri(s, p)) if (l.tipo && !l.chiuso) c += ATTIVITA[l.tipo].c * l.prezzo * l.lvl;
    if (haPiano(p, "casino_privato")) c += 400_000;
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
  // un messaggio "lieve": l'avviso di una casella dove non c'e' niente da decidere. L'interfaccia puo' mostrarlo come
  // avviso che sparisce e non contarlo tra i messaggi nuovi (cosi' quelli importanti non si perdono).
  function avvisoCasella(s, p, testo) { p.messaggi.push({ ciclo: s.ciclo + 1, testo, lieve: true }); if (p.messaggi.length > 60) p.messaggi.shift(); }

  // ------------------------------------------------------------ nuova partita
  function nuovaPartita(opz) {
    const seed = (opz.seed ?? Math.floor(Math.random() * 1e9)) >>> 0;
    const s = {
      versione: 1, gen: opz.gen === 1 ? 1 : GEN, motoreNascita: VERSIONE, seed, rngState: seed, ciclo: 0, giorno: 0, fase: "pacchetti", turno: 0,
      ordine: [], players: [], lotti: [], valore: {}, borsa: {}, cripto: {}, sette: [], contratti: [], inviti: [],
      gazzetta: [], log: [], sindaco: null, candidati: {}, leggi: [], tassa: N.tassa, licenze: [],
      pending: null, notteFatti: {}, prossimoId: 1, principianti: !!opz.principianti, fine: false,
      flussi: [], proposte: [], grandi: {},
    };
    for (const k of ORDINE_GRANDI) grande(s, k);
    // durata: { modo: "cicli", cicli } · { modo: "obiettivo", obiettivo } · { modo: "libera" }
    { const d = opz.durata || {}; const modo = ["cicli", "obiettivo", "libera"].includes(d.modo) ? d.modo : "cicli";
      const c = Number(d.cicli ?? opz.cicli), o = Number(d.obiettivo);
      s.modoFine = modo;
      s.cicli = modo === "cicli" ? (N.durataCicli.includes(c) ? c : N.cicli) : null;
      s.obiettivo = modo === "obiettivo" ? (N.obiettivi.includes(o) ? o : N.obiettivi[1]) : null;
      s.chiusura = false; }
    // partita guidata: Vera da' consigli e spiega le cose nuove; senza consigli per chi conosce gia' il gioco
    s.consigli = opz.consigli !== undefined ? !!opz.consigli : true;
    OUTER.forEach((c, i) => s.lotti.push(cella(s, c, "o", i)));
    for (const i of ISOLE) s.valore[i] = 5;
    for (const a of AZIENDE) s.borsa[a] = 100;
    for (const m of MONETE) s.cripto[m] = 10;
    opz.giocatori.forEach((g, i) => {
      s.players.push({
        id: "g" + (i + 1), nome: g.nome, bot: !!g.bot, strat: g.strat || null, colore: g.colore || COLORI[i % COLORI.length],
        cash: N.cashStart, sporchi: 0, azioni: {}, cripto: {}, veicoli: [], pos: 0, inner: false, ipos: 0,
        tracce: 0, stato: 0, condanne: 0, faro: 0, blocco: 0, corrotti: {}, fama: 10, reputazione: 0, affariOk: 0,
        piani: 0, funzioniPiani: [], stanze: [], debito: 0, prestiti: [], pacchetto: null, prove: [], pulitoCiclo: true,
        peggiorReato: null, riciclTot: 0, evasione: 0, fallito: false, messaggi: [], arresti: 0, mosseNotte: 0,
        dadi: null, azioneGiornoFatta: false, haTirato: false, doppi: 0, sette: [], ombraCicli: 0, valigetta: [],
      });
    });
    // ordine dei turni con i dadi
    s.ordine = s.players.map((_, i) => i).sort(() => rng(s) - 0.5);
    // scelta dei pacchetti: al contrario dell'ordine di gioco
    s.sceltaPacchetti = [...s.ordine].reverse();
    s.pacchettiDisponibili = PACCHETTI.slice(0, gen2(s) ? PACCHETTI.length : Math.max(6, s.players.length)).map((p) => p.id); // partite nuove: sempre tutte e 8 le storie
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
    const e = pk.extra;
    if (e.veicolo) p.veicoli.push(e.veicolo);
    if (e.fama) p.fama = e.fama;
    if (pk.id === "playboy") p.cerchie = ["yacht"];
    p.pacchetto = pk.id;
    s.pacchettiDisponibili = s.pacchettiDisponibili.filter((x) => x !== idPacchetto);
    s.sceltaPacchetti.shift();
    log(s, p.nome + " sceglie il pacchetto " + pk.nome + ".", p.id);
    if (s.sceltaPacchetti.length === 0) {
      terreniIniziali(s);
      s.fase = "giorno"; s.turno = 0;
      notizia(s, "Si apre la stagione degli affari nella Laguna. Che vinca il più furbo.", "evento");
      iniziaTurno(s);
    }
  }

  // ------------------------------------------------------------ giorno
  // ogni giocatore riceve un terreno a sorte; chi ne riceve uno più economico ha la differenza in contanti
  function terreniIniziali(s) {
    const TETTO = 600_000;
    const pool = s.lotti.filter((l) => l.tipoCasella === "lotto" && !l.owner && l.prezzo >= num(s, "terrenoInizialeMin") && l.prezzo <= TETTO);
    for (const p of s.players) {
      const i = Math.floor(rng(s) * pool.length); const l = pool.splice(i, 1)[0]; if (!l) continue;
      const tipo = ["ristorante", "hotel", "uffici", "boutique"].find((k) => ATTIVITA[k].isole.includes(l.isola));
      l.owner = p.id; l.lvl = 1; l.tipo = tipo; p.cash += TETTO - l.prezzo;
      privato(s, p, "Ti tocca in sorte " + l.nome + " (" + NOMI_ISOLE[l.isola] + "), con un " + ATTIVITA[tipo].nome.toLowerCase() + " già aperto" + (TETTO - l.prezzo > 0 ? ", più " + euro(TETTO - l.prezzo) + " per pareggiare il valore" : "") + ".");
      log(s, p.nome + " riceve " + l.nome + ".", p.id);
    }
  }
  // terreni sequestrati dal Giudice o dalla Banca: vanno all'asta, i soldi alla banca, l'ex padrone non partecipa
  function sequestra(s, l, ex) {
    l.owner = null; l.lvl = 0; l.tipo = null; l.ipoteca = 0; l.chiuso = 0; l.cantiere = null;
    (s.sequestrati = s.sequestrati || []).push({ lotto: l.id, escluso: ex ? ex.id : null });
    notizia(s, "Il Comune sequestra " + l.nome + ": andrà all'Asta del Comune.", "affari");
  }
  function avviaAstaSequestro(s) {
    if (s.pending || s.fase !== "giorno" || !(s.sequestrati || []).length) return;
    const q = s.sequestrati.shift(), l = lotto(s, q.lotto);
    if (l.owner) return avviaAstaSequestro(s);
    const minimo = baseAsta(l);
    const part = partecipantiAsta(s, minimo, q.escluso);
    if (!part.length) { s.sequestrati.unshift(q); return; } // nessuno puo' partecipare adesso: il terreno resta in coda (ILL-14)
    s.pending = { tipo: "asta", lotto: l.id, offerte: {}, giocatore: corrente(s).id, partecipanti: part, sequestro: true, minimo, escluso: q.escluso, inizio: adesso() };
    notizia(s, "Asta del Comune: si vende " + l.nome + " (sequestrato). Base d'asta " + euro(minimo) + ".", "affari");
  }
  // LE ASTE DEI TERRENI (regole uguali per tutte):
  //  - base d'asta = 60% del prezzo: un'offerta piu' bassa non vale, e se nessuno ci arriva il terreno resta libero;
  //  - chi ha rifiutato di comprare il terreno (o l'ex padrone, se e' un sequestro) non partecipa a quell'asta;
  //  - partecipa solo chi ha in tasca almeno la base (agli altri non si chiede niente);
  //  - offerte segrete, una a testa; vince la piu' alta; a parita' vince chi ha offerto per primo;
  //  - quando l'asta si chiude le offerte si vedono tutte (s.ultimaAsta).
  function baseAsta(l) { return round(l.prezzo * N.astaBase); }
  function partecipantiAsta(s, minimo, escluso) { return s.players.filter((x) => !x.fallito && x.faro === 0 && x.id !== escluso && x.cash >= minimo).map((x) => x.id); }
  function iniziaTurno(s) {
    const p = corrente(s);
    if (s.transenna && s.transenna.da === p.id) s.transenna = null; // la transenna resta fino al prossimo turno di chi l'ha messa
    p.haTirato = false; p.azioneGiornoFatta = false; p.doppi = 0; p.dadi = null; p.agenziaUsata = false; p.agenziaSconto = false; p.municipioOggi = false;
    s.pending = null;
    if (p.faro > 0) {
      p.faro -= 1;
      log(s, p.nome + " è al Faro (ancora " + p.faro + " turni). Ha diritto a una telefonata.", p.id);
      p.haTirato = true; // non si muove; puo' fare 1 azione
    } else chiamataLampo(s, p);
    avviaAstaSequestro(s);
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

  // Viaggio rapido (v76): una volta ogni 2 Cicli, al posto dei dadi, secondo i tuoi mezzi. Si paga il carburante
  // e consuma la mossa del giorno di quel turno (niente permesso, cantiere, piano o altra mossa del giorno).
  function idxCasella(nome) { return OUTER.findIndex((c) => c[0] === nome); }
  function destinazioniRapide(s, p) {
    const d = new Map(), metti = (idx, costo, mezzo) => { if (idx !== p.pos && (!d.has(idx) || d.get(idx).costo > costo)) d.set(idx, { idx, costo, mezzo }); };
    const qui = casella(s, p), corona = idxCasella("Ingresso di Isola Corona");
    const moli = s.lotti.filter((l) => l.tipoCasella === "molo").map((l) => l.idx);
    const eli = s.lotti.filter((l) => l.tipoCasella === "eliporto").map((l) => l.idx).concat([corona]);
    const aero = idxCasella("Aeroporto della Laguna");
    const R = N.rapido;
    if (qui.tipoCasella === "molo") metti(corona, R.traghetto, "traghetto");
    if (p.veicoli.some((v) => ["motoscafo", "yacht", "megayacht"].includes(v))) { for (const m of moli) metti(m, R.motoscafo, "motoscafo"); metti(corona, R.motoscafo, "motoscafo"); }
    if (p.veicoli.includes("elicottero") || haPiano(p, "eliporto")) for (const e of eli) metti(e, R.elicottero, "elicottero");
    if (p.veicoli.includes("jet")) { metti(aero, R.jet, "jet"); for (const e of eli) metti(e, R.jet, "jet"); }
    // (fino alla v75 c'era anche il taxi per il Municipio: tolto, al Municipio si arriva coi dadi)
    return [...d.values()];
  }
  // fra quanti Cicli puoi rifare il viaggio rapido (0 = adesso)
  function cicliAlRapido(s, p) { return p.rapidoCiclo == null ? 0 : Math.max(0, N.rapidoOgni - (s.ciclo - p.rapidoCiclo)); }
  // perche' adesso non puoi fare il viaggio rapido ("" = puoi)
  function motivoNoRapido(s, p) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) return "Non è il tuo turno.";
    if (p.haTirato || p.doppi) return "Il viaggio rapido si fa al posto dei dadi, a inizio turno.";
    if (s.pending) return "Prima finisci la scelta in corso.";
    if (p.faro > 0) return "Sei al Faro.";
    const n = cicliAlRapido(s, p);
    if (n > 0) return "Il viaggio rapido si fa una volta ogni " + N.rapidoOgni + " Cicli: il prossimo fra " + n + (n === 1 ? " Ciclo." : " Cicli.");
    if (p.azioneGiornoFatta) return "Hai già usato la mossa del giorno: il viaggio rapido la consuma.";
    return "";
  }
  function viaggioRapido(s, p, idx) {
    { const m = motivoNoRapido(s, p); if (m) err(m); }
    const dest = destinazioniRapide(s, p).find((x) => x.idx === idx);
    if (!dest) err("Con i tuoi mezzi lì non ci arrivi.");
    const NOME_MEZZO = { traghetto: "Il traghetto", motoscafo: "Il carburante del motoscafo", elicottero: "Il carburante dell'elicottero", jet: "Il carburante del jet" };
    if (p.cash < dest.costo) err((NOME_MEZZO[dest.mezzo] || "Il viaggio") + " costa " + euro(dest.costo) + ".");
    p.cash -= dest.costo; if (dest.costo) flusso(s, p, null, dest.costo, "Viaggio rapido (" + dest.mezzo + ")", false);
    p.rapidoCiclo = s.ciclo; p.rapidoTurno = s.ciclo * 100 + s.giorno * 10 + s.turno; p.azioneGiornoFatta = true;
    p.haTirato = true; p.inner = false; p.pos = idx;
    const c = casella(s, p);
    const COME = { taxi: "prende un taxi per il centro", traghetto: "prende il traghetto", motoscafo: "attraversa la laguna in motoscafo", elicottero: "atterra in elicottero", jet: "atterra con il jet" };
    log(s, p.nome + " " + COME[dest.mezzo] + ": " + c.nome + ".", p.id);
    atterra(s, p, c);
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
    // la transenna di un agente comprato: un Posto di blocco in piu', uguale a quello del Ponte Est (v75)
    if (s.transenna && p.pos === s.transenna.pos) {
      log(s, p.nome + " si ferma alla transenna di " + c.nome + ".");
      postoDiBlocco(s, p, c.nome);
      if (p.faro > 0) return;
    }
    if (c.tipoCasella === "lotto" || c.tipoCasella === "molo") {
      if (c.owner == null) { s.pending = { tipo: "compra", lotto: c.id, giocatore: p.id }; return; }
      if (c.owner === p.id) return;
      const owner = giocatore(s, c.owner);
      if (passoLibero(s, p, owner.id)) { log(s, p.nome + " passa gratis da " + c.nome + ": Passo libero di " + owner.nome + "."); return; }
      let dovuto;
      if (c.tipoCasella === "molo") dovuto = N.moloFee[moliDi(s, owner).length];
      else dovuto = affitto(s, c);
      if (dovuto > 0) {
        paga(s, p, dovuto, owner);
        flusso(s, p, owner, dovuto, (c.tipoCasella === "molo" ? "Pedaggio del " : "Affitto di ") + c.nome, true);
        log(s, p.nome + " paga " + euro(dovuto) + (c.tipoCasella === "molo" ? " di pedaggio (l'affitto dei Moli) a " : " di affitto a ") + owner.nome + " (" + c.nome + ").", p.id);
      }
      return;
    }
    if (c.tipoCasella === "agenzia") {
      p.agenziaSconto = true;
      avvisoCasella(s, p, "All'" + c.nome + " ti accolgono con un caffè: in questo turno puoi comprare un terreno libero di " + NOMI_ISOLE[c.isola || isolaDiPos(p.pos)] + " a prezzo pieno, senza il 20% in più. Apri l'app Agenzia.");
      log(s, p.nome + " passa dall'" + c.nome + ".", p.id);
      return;
    }
    if (c.tipoCasella === "eliporto") { log(s, p.nome + " passa dall'" + c.nome + ".", p.id); avvisoCasella(s, p, c.nome + ": qui atterrano elicotteri e jet. Con un elicottero (o l'eliporto nel Palazzo) ci arrivi col Viaggio rapido."); return; }
    if (c.tipoCasella === "aeroporto") { log(s, p.nome + " passa dall'Aeroporto.", p.id); avvisoCasella(s, p, livelloSblocco(s, p) >= 2 ? "All'Aeroporto un facchino ti sussurra: \"Stanotte atterra un cargo che non risulta da nessuna parte.\"" : "L'Aeroporto della Laguna: di notte, dal Livello 2, qui arrivano e partono carichi che nessuno deve vedere."); return; }
    if (c.tipoCasella === "asta") {
      p.agenziaSconto = true;
      if ((s.sequestrati || []).length) avvisoCasella(s, p, "All'Asta del Comune c'è un terreno sequestrato in vendita: l'asta parte all'inizio del prossimo turno. Base d'asta: il " + Math.round(N.astaBase * 100) + "% del prezzo.");
      avvisoCasella(s, p, "Ufficio aste del Comune: in questo turno puoi comprare un terreno libero di " + NOMI_ISOLE[isolaDiPos(p.pos)] + " a prezzo pieno, senza il 20% in più. Apri l'app Agenzia. (Le aste vere sono per i terreni sequestrati: partono a inizio turno.)");
      log(s, p.nome + " passa dall'Asta del Comune.", p.id);
      return;
    }
    switch (c.nome) {
      case "Gazzetta": case "Voci di piazza": cartaGazzetta(s, p); break;
      case "Ponte Est — Posto di blocco": postoDiBlocco(s, p); break;
      case "Bisca del Vicolo": if (livelloSblocco(s, p) >= 1) avvisoCasella(s, p, "Dalla porta della Bisca qualcuno ti fa segno: \"Stanotte si gioca forte. Porta contanti.\""); else { const f = 1 + Math.floor(rng(s) * 2); p.fama += f; log(s, p.nome + " si fa vedere alla Bisca del Vicolo: +" + f + " fama.", p.id); } break;
      case "Mercato Nero": if (livelloSblocco(s, p) >= 1) avvisoCasella(s, p, "Passando dal Mercato Nero un venditore ti fa l'occhiolino: \"Stanotte passa a trovarmi, ho roba nuova.\""); break;
      case "Spiaggia VIP": { const f = 2 + Math.floor(rng(s) * 4); p.fama += f; log(s, p.nome + " incontra un ospite famoso alla Spiaggia VIP: +" + f + " fama.", p.id); break; }
      case "Gala Flamingo": s.pending = { tipo: "gala", giocatore: p.id }; break;
      case "Porto Container": if (livelloSblocco(s, p) >= 1) avvisoCasella(s, p, "Al Porto un gruista ti dice sottovoce che stanotte arrivano container senza bolla."); break;
      case "La Borsa": avvisoCasella(s, p, "La Borsa della Laguna. Qui non si paga e non si incassa niente: azioni e cripto si comprano dal telefono, app Borsa (dal Livello 2), da qualsiasi casella."); break;
      case "Il Municipio": p.municipioOggi = true; s.pending = { tipo: "municipio", giocatore: p.id }; break;
      case "Banca Centrale": avvisoCasella(s, p, "La Banca Centrale. Qui non si paga niente: il prestito si chiede dal telefono (app Banca) da qualsiasi casella, e usa la mossa del giorno."); break;
      case "Casinò Reale": s.pending = { tipo: "casino_reale", giocatore: p.id }; break;
      default: break;
    }
  }

  // VOCI DI PIAZZA: le carte delle caselle-imprevisto (la Gazzetta e' solo il giornale).
  // Ogni carta: [testo, effetto]. L'effetto puo' ritornare l'ESITO in una frase ("La Finanza non trova niente."):
  // l'esito e' privato (sta in p.esitoCarta e in un messaggio), il testo della carta lo vedono tutti.
  const CARTE = [
    ["Un turista ti lascia una mancia enorme.", (s, p) => { p.cash += 150_000; return "+" + euro(150_000) + "."; }],
    ["Vinci un premio come imprenditore dell'anno: +5 fama.", (s, p) => { p.fama += 5; }],
    ["Paghi la manutenzione delle tue proprietà: 30.000 € per ogni attività.", (s, p) => { const n = propri(s, p).filter((l) => l.lvl > 0).length; paga(s, p, 30_000 * n, null); return n ? "Hai " + n + " attività: paghi " + euro(30_000 * n) + "." : "Non hai attività aperte: non paghi niente."; }],
    ["Un'intervista in TV ti rende simpatico: +3 fama.", (s, p) => { p.fama += 3; }],
    ["Multa per divieto di sosta dello yacht: 50.000 €.", (s, p) => { paga(s, p, 50_000, null); }],
    ["Un vecchio debito ti viene restituito: +250.000 €.", (s, p) => { p.cash += 250_000; }],
    ["Controllo fiscale a sorpresa: se hai evaso, le tue Tracce salgono.", (s, p) => { if (p.evasione > 0) { p.tracce += 15; return "Stai evadendo le tasse: la Finanza se ne accorge e le tue Tracce salgono."; } return "Non stai evadendo: la Finanza non trova niente."; }],
    ["Un informatore ti vende una soffiata: ottieni una Prova su un rivale a caso, se ha fatto affari illegali.", (s, p) => {
      const altri = s.players.filter((x) => x.id !== p.id && x.tracce > 20);
      if (altri.length) { const b = altri[Math.floor(rng(s) * altri.length)]; p.prove.push({ su: b.id, ciclo: s.ciclo + 1, cosa: "soffiata" }); return "Ottieni una Prova su " + b.nome + ": la trovi nell'app Prove."; }
      return "Nessun rivale ha lasciato abbastanza Tracce: niente Prova.";
    }],
    ["Il tuo quartiere va di moda: +0,5 Valore all'isola dove sei.", (s, p) => { const i = casella(s, p).isola || isolaDiPos(p.pos); s.valore[i] = clamp(s.valore[i] + 0.5, 1, 10); return NOMI_ISOLE[i] + " vale di più: affitti e rendite lì salgono un po'."; }],
    ["Avanzi fino al Ponte Sud e incassi lo Stipendio.", (s, p) => { p.pos = 0; if (!p.blocco) { p.cash += N.stipendio; return "+" + euro(N.stipendio) + "."; } return "Lo Stipendio però è bloccato dal Giudice: non incassi niente."; }],
    ["Uno scandalo minore ti tocca di striscio: -3 fama.", (s, p) => { p.fama = Math.max(0, p.fama - 3); }],
    ["Dividendo straordinario: +10% sulle tue azioni.", (s, p) => { let ha = false; for (const a of AZIENDE) if (p.azioni[a]) { p.azioni[a] *= 1.1; ha = true; } return ha ? "Le tue azioni valgono il 10% in più." : "Non hai azioni: stavolta niente."; }],
  ];
  function cartaGazzetta(s, p) {
    const i = Math.floor(rng(s) * CARTE.length);
    const [testo, f] = CARTE[i];
    const prima = p.cash;
    const esito = f(s, p) || "";
    if (p.cash !== prima) flusso(s, p.cash < prima ? p : null, p.cash > prima ? p : null, Math.abs(p.cash - prima), "Voci di piazza: " + testo, true);
    segnaCarta(s, p, testo, esito);
  }
  // la carta pescata: il testo e' pubblico (s.ultimaCarta), l'esito e' solo di chi l'ha pescata (p.esitoCarta)
  function segnaCarta(s, p, testo, esito) {
    const n = (s.nCarte = (s.nCarte || 0) + 1);
    log(s, p.nome + " pesca una Voce di piazza: " + testo, p.id);
    s.ultimaCarta = { giocatore: p.id, testo, n };
    p.esitoCarta = { n, testo, esito: esito || "" };
    if (esito) privato(s, p, "Voci di piazza: " + testo + " " + esito);
  }

  // quanto e' probabile essere fermati se ti fermi sul Posto di blocco (0..1). La usa il fermo vero e la vista.
  // Da "Osservato" in su ti fermano sempre; altrimenti conta quante Tracce hai, e i poliziotti comprati ti coprono.
  function rischioPostoDiBlocco(s, p) {
    if ((p.stato || 0) >= 2) return 1;
    if (!((p.tracce || 0) > 25)) return 0;
    return Math.min(1, p.tracce / 180) * (1 - protezione(s, p));
  }
  function postoDiBlocco(s, p, transenna) {
    if (haOggetto(p, "documenti") && rng(s) < N.oggettoFalla) { togliOggetto(p, "documenti"); privato(s, p, "Al Posto di blocco l'agente guarda i tuoi documenti falsi troppo a lungo. Non ci casca."); }
    else if (haOggetto(p, "documenti")) { togliOggetto(p, "documenti"); log(s, p.nome + " passa " + (transenna ? "la transenna" : "il Posto di blocco") + " senza problemi.", p.id); privato(s, p, "Al Posto di blocco mostri i documenti falsi. L'agente ti fa cenno di passare."); return; }
    // ILL-13: niente condanna per un tiro di dadi. Il fermo e' una perquisizione subito e un gradino verso il Processo.
    const r = rischioPostoDiBlocco(s, p);
    if (r > 0 && (r >= 1 || rng(s) < r)) {
      const osservato = p.stato >= 2, perche = osservato ? "La polizia ti teneva già d'occhio (" + STATI[p.stato] + ")." : motivoPolizia(s, p);
      log(s, p.nome + " viene fermato al Posto di blocco e controllato.", p.id);
      const trovato = perquisisci(s, p, "blocco");
      p.stato = Math.min(4, Math.max(p.stato, 0) + 1); p.ultimaPista = { k: transenna ? "transenna" : "blocco", testo: (transenna ? "Ti hanno fermato alla transenna di " + transenna + ". " : "Ti hanno fermato al Posto di blocco. ") + perche, ciclo: s.ciclo + 1 };
      if (transenna && s.transenna) { const da = s.players.find((x) => x.id === s.transenna.da), ag = da && (da.corrotti || {})["agente_" + s.transenna.isola]; if (ag) ag.servizi = (ag.servizi || 0) + 1; } // l'agente si e' esposto
      privato(s, p, "Fermato al Posto di blocco. Perché: " + perche + (trovato ? "" : " Ti perquisiscono ma non trovano niente.") + " La polizia sale di un gradino: ora sei \"" + STATI[p.stato] + "\"." + (p.stato >= 4 ? " All'Alba c'è il Processo." : ""));
    } else log(s, p.nome + " passa " + (transenna ? "la transenna" : "il Posto di blocco") + " senza problemi.", p.id);
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
      // chi rinuncia non puo' ricomprarlo all'asta a meno (era la mossa migliore: rifiutare e poi vincere a poco)
      const minimo = baseAsta(l), part = partecipantiAsta(s, minimo, p.id);
      if (!part.length) { s.pending = null; log(s, p.nome + " rinuncia a " + l.nome + ". Nessun altro può offrire la base d'asta (" + euro(minimo) + "): il terreno resta libero.", p.id); return; }
      s.pending = { tipo: "asta", lotto: l.id, offerte: {}, giocatore: p.id, partecipanti: part, minimo, escluso: p.id, inizio: adesso() };
      log(s, p.nome + " rinuncia: " + l.nome + " va all'asta tra gli altri. Base d'asta " + euro(minimo) + ".", p.id);
    }
  }
  function offerta(s, p, importo) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "asta") err("Non c'è un'asta in corso.");
    if (!pd.partecipanti.includes(p.id)) err(pd.escluso === p.id ? (pd.sequestro ? "Il terreno era tuo: a questa asta non puoi partecipare." : "Hai rinunciato a questo terreno: a questa asta non puoi offrire.") : "Non partecipi a questa asta.");
    if (pd.offerte[p.id] !== undefined) err("La tua offerta l'hai già fatta: è segreta e non si cambia.");
    importo = Math.max(0, Math.floor(importo || 0));
    if (importo > p.cash) err("Non puoi offrire più dei tuoi soldi puliti.");
    if (pd.minimo && importo > 0 && importo < pd.minimo) err("La base d'asta è " + euro(pd.minimo) + ": offri almeno questa cifra, oppure 0 per non offrire.");
    pd.offerte[p.id] = importo;
    if (Object.keys(pd.offerte).length >= pd.partecipanti.length) chiudiAsta(s);
  }
  function chiudiAsta(s) {
    const pd = s.pending, l = lotto(s, pd.lotto);
    let best = null, bid = 0, pari = false;
    // a parita' vince chi ha offerto per primo (le offerte sono in ordine di arrivo)
    for (const [id, v] of Object.entries(pd.offerte)) { if (v > bid) { best = id; bid = v; pari = false; } else if (v === bid && v > 0) pari = true; }
    s.pending = null;
    // l'esito con TUTTE le offerte: adesso non sono piu' segrete
    s.ultimaAsta = { n: (s.nAste = (s.nAste || 0) + 1), ciclo: s.ciclo + 1, giorno: s.giorno + 1, lotto: l.id, nome: l.nome, prezzo: l.prezzo, minimo: pd.minimo || 0, sequestro: !!pd.sequestro, escluso: pd.escluso || null, offerte: { ...pd.offerte }, vincitore: best && bid > 0 ? best : null, importo: best && bid > 0 ? bid : 0, pari };
    if (best && bid > 0) {
      const w = giocatore(s, best);
      w.cash -= bid; l.owner = w.id; flusso(s, w, null, bid, "Asta vinta: " + l.nome, true);
      log(s, "Asta: " + w.nome + " vince " + l.nome + " con " + euro(bid) + (pari ? " (offerta pari a un'altra: vince chi ha offerto per primo)" : "") + ".", w.id);
      notizia(s, "Asta per " + l.nome + ": se la aggiudica " + w.nome + " con " + euro(bid) + ".", "affari");
    } else log(s, "Asta per " + l.nome + ": nessuna offerta" + (pd.minimo ? " sopra la base di " + euro(pd.minimo) : "") + ". Il terreno resta libero.");
    if (pd.sequestro) avviaAstaSequestro(s);
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
    if (puntata > p.cash) err("Non hai abbastanza soldi puliti.");
    s.pending = null;
    if (!puntata) return;
    if (rng(s) < 0.47) { p.cash += puntata; log(s, p.nome + " vince " + euro(puntata) + " al Casinò Reale.", p.id); }
    else { p.cash -= puntata; log(s, p.nome + " perde " + euro(puntata) + " al Casinò Reale.", p.id); }
  }
  function municipio(s, p, scelta) {
    const pd = s.pending;
    if (!pd || pd.tipo !== "municipio" || pd.giocatore !== p.id) err("Non sei al Municipio.");
    if (scelta === "candidati") candidati(s, p); // se non puoi candidarti resti allo sportello
    else if (scelta === "licenza") {
      if (s.licenze.includes(p.id)) err("La licenza ce l'hai già.");
      if (p.cash < 400_000) err("Allo sportello la licenza costa 400.000 €.");
      p.cash -= 400_000; s.licenze.push(p.id);
      log(s, p.nome + " ottiene la licenza per aprire un casinò.", p.id);
    }
    s.pending = null;
  }
  // quanto costa candidarsi: allo sportello (sei sul Municipio oggi) il prezzo pieno, dal telefono il doppio (v76: niente piu' taxi)
  function costoCandidatura(s, p, daTelefono) {
    return N.candidatura * (p.pacchetto === "politico" ? 0.5 : 1) * (daTelefono && !p.municipioOggi ? 2 : 1);
  }
  function candidati(s, p, daTelefono) {
    if (p.fama < 40) err("Per candidarti serve fama 40.");
    if (s.candidati[p.id] !== undefined) err("Sei già candidato.");
    const cand = costoCandidatura(s, p, daTelefono);
    if (p.cash < cand) err("La candidatura costa " + euro(cand) + (daTelefono && !p.municipioOggi ? " dal telefono (allo sportello del Municipio la metà)" : "") + ".");
    p.cash -= cand; s.candidati[p.id] = 0;
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
    } else if (tipo && tipo !== l.tipo) err("Non si può cambiare tipo di attività: qui c'è già " + ATTIVITA[l.tipo].nome + ".");
    const next = l.lvl + 1;
    { const ps = puoSalire(s, p, l); if (!ps.ok) err(ps.perche); }
    const costo = costoCantiere(s, p, l).costo;
    if (p.cash < costo) err("Ti servono " + euro(costo) + " puliti.");
    p.cash -= costo; l.cantiere = { tipo: nuovoTipo, lvl: next }; l.permesso = false; p.azioneGiornoFatta = true;
    log(s, p.nome + " apre il cantiere: " + ATTIVITA[nuovoTipo].nome + " in " + l.nome + " (" + euro(costo) + "). Sarà pronto all'Alba.", p.id);
  }
  // Quanto costa il prossimo livello di un terreno, con gli sconti e il loro motivo (lo stesso conto per il motore e per l'app).
  //   { costo: quello che paghi davvero, pieno: senza sconti, livello, sconti: [{ k, perche, quota }] }
  function costoCantiere(s, p, l) {
    const next = l.lvl + 1, pieno = round(N.costLvl[Math.min(next, 5)] * l.prezzo), sconti = [];
    let costo = N.costLvl[Math.min(next, 5)] * l.prezzo;
    if (s.leggi.includes("condono")) { costo *= 0.5; sconti.push({ k: "condono", perche: "Condono edilizio del Sindaco", quota: 0.5 }); }
    if (s.fase === "giorno" && casella(s, p).id === l.id) { costo *= 0.9; sconti.push({ k: "qui", perche: "sei fermo su questo terreno", quota: 0.1 }); }
    if (p.pacchetto === "costruttore") { costo *= 0.85; sconti.push({ k: "costruttore", perche: "sei il Costruttore", quota: 0.15 }); }
    return { costo: round(costo), pieno, livello: next, sconti };
  }
  // Quanto rende in piu', a ogni Alba, portare un terreno al livello dopo (per decidere quale alzare).
  //   { piu: euro in piu' a ogni Alba, costo, cicli: in quanti Cicli si ripaga (null se non rende) }
  function guadagnoLivello(s, p, l, tipo) {
    const next = l.lvl + 1, t = ATTIVITA[l.tipo || tipo];
    if (!t || next > 5) return { piu: 0, costo: 0, cicli: null };
    const ora = rendita(s, l), poi = rendita(s, { ...l, tipo: l.tipo || tipo, lvl: next, cantiere: null, chiuso: 0 });
    const costo = costoCantiere(s, p, l).costo, piu = poi - ora;
    return { piu, costo, cicli: piu > 0 ? Math.ceil(costo / piu * 10) / 10 : null };
  }
  function controllaValoreLusso(s, l) {
    if (l.tipo && ATTIVITA[l.tipo].lusso && l.lvl >= 3) s.valore[l.isola] = clamp(s.valore[l.isola] + 0.3, 1, 10);
  }
  // IL PALAZZO: i PIANI sono l'altezza e rendono l'affitto; le STANZE speciali si comprano a parte.
  // Tre traguardi: Palazzo (dal piano 1), Attico (6 piani), Grattacielo (15 piani).
  const FASCE_PALAZZO = [
    { nome: "Palazzo", da: 1, lv: 0, rend: 1, fama: 0, fun: ["garage", "ristorante_panoramico", "osservatorio"] },
    { nome: "Attico", da: 6, lv: 0, rend: 1.3, fama: 5, fun: ["spa", "sala_insonorizzata", "caveau", "casino_privato", "bunker", "ufficio_stampa"] },
    { nome: "Grattacielo", da: 15, lv: 0, rend: 1.5, fama: 10, fun: ["eliporto", "piani_segreti", "suite"] },
  ];
  const STANZE = {
    garage: { nome: "Garage di lusso", costo: 500_000, quando: "giorno", descr: "I tuoi mezzi a noleggio rendono il 50% in più.", esempio: "Uno yacht passa da 360.000 € a 540.000 € a ogni Alba." },
    ristorante_panoramico: { nome: "Ristorante panoramico", costo: 900_000, rendita: 300_000, quando: "giorno", descr: "Rende 300.000 € a ogni Alba e ti dà +1 fama ogni Ciclo.", esempio: "In 3 Cicli si è già ripagato." },
    spa: { nome: "Spa e piscina", costo: 1_500_000, quando: "notte", descr: "Di notte, a casa tua, organizzi una serata con un ospite famoso: +3 fama.", esempio: "Più fama = sale e luoghi più esclusivi di notte." },
    sala_insonorizzata: { nome: "Sala insonorizzata", costo: 2_000_000, quando: "notte", descr: "Di notte compri poliziotti e banchieri senza uscire di casa.", esempio: "Niente viaggio al Porto: nessuno ti vede, nessuna pista sul posto." },
    caveau: { nome: "Caveau", costo: 2_000_000, quando: "sempre", descr: "Se ti condannano, salva fino a 5 milioni di soldi sporchi (non per i reati gravissimi).", esempio: "Hai 7 M sporchi e ti beccano: ne perdi 2, non 7." },
    casino_privato: { nome: "Casinò privato", costo: 3_000_000, rendita: 250_000, quando: "notte", licenza: true, descr: "Di notte apri serate di Sette e mezzo: gli ospiti pagano l'ingresso e il banco sei tu. Rende anche 250.000 € a ogni Alba. Serve la licenza.", esempio: "4 ospiti a 100.000 € = 400.000 € solo di ingressi." },
    eliporto: { nome: "Eliporto", costo: 3_000_000, quando: "sempre", descr: "Di giorno Viaggio rapido verso gli Eliporti; di notte ogni spostamento dura 1 ora.", esempio: "Arrivi a Isola Corona senza tirare i dadi." },
    piani_segreti: { nome: "Piani segreti", costo: 3_500_000, quando: "notte", descr: "Nelle retate la polizia non trova la tua valigetta.", esempio: "Ti perquisiscono: gli oggetti illegali restano tuoi." },
    osservatorio: { nome: "Terrazza col cannocchiale", costo: 1_200_000, quando: "notte", descr: "Di notte vedi dove sono il banchiere Lenz, il Commissario Vargas, il doganiere e la giornalista, ora per ora.", esempio: "Sai che Vargas è al Porto: stanotte il tuo carico lo fai alla Bisca." },
    bunker: { nome: "Bunker", costo: 2_500_000, quando: "sempre", descr: "Le perquisizioni all'Alba sono più rare (−40%) e se arrivano trovano la metà dei contanti.", esempio: "Rischio di perquisizione dal 20% al 12%; ti prendono il 15% degli sporchi invece del 30%." },
    ufficio_stampa: { nome: "Ufficio stampa", costo: 2_500_000, quando: "sempre", descr: "Uno scandalo pagato contro di te, 1 volta su 2, viene smentito e si ritorce su chi l'ha pagato.", esempio: "Un rivale paga la Gazzetta per infangarti: domani la smentita è sua." },
    suite: { nome: "Suite presidenziale", costo: 4_000_000, quando: "giorno", descr: "Ospiti potenti dormono da te: +3 fama ogni Ciclo.", esempio: "In 5 Cicli sono +15 fama." },
  };
  const SOVRAPPREZZO_PIANI = [1, 1.5, 2]; // piu' piani nella stessa mossa: il 2° e il 3° costano di piu'
  function stanzeDi(p) { if (!p.stanze) p.stanze = (p.funzioniPiani || []).filter((f) => STANZE[f]); return p.stanze; }
  function fasciaPalazzo(n) { return FASCE_PALAZZO.reduce((r, f, i) => (n >= f.da ? i : r), 0); }
  // ATTENZIONE: passare sempre la partita (s). Senza s si ottengono i numeri delle partite vecchie.
  function baseRendPiano(i, s) { return N.pianoCost * Math.pow(num(s, "pianoRendGrow"), i) * N.pianoRend * FASCE_PALAZZO[fasciaPalazzo(i + 1)].rend; }
  function renditaPiani(n, s) { let r = 0; for (let i = 0; i < n; i++) r += baseRendPiano(i, s); return round(r); }
  function renditaPalazzo(p, s) { let r = renditaPiani(p.piani, s); for (const f of (p.stanze || (p.funzioniPiani || []).filter((x) => STANZE[x]))) r += STANZE[f].rendita || 0; return round(r); }
  function costoPiano(p) { return costoPiani(p, 1); }
  function costoPiani(p, quanti) {
    let c = 0;
    for (let k = 0; k < quanti; k++) c += N.pianoCost * Math.pow(N.pianoGrow, p.piani + k) * SOVRAPPREZZO_PIANI[k];
    return round(c * (p.pacchetto === "costruttore" ? 0.85 : 1));
  }
  function costoStanza(p, f) { return round(STANZE[f].costo * (p.pacchetto === "costruttore" ? 0.85 : 1)); }
  // cosa manca per iniziare il Palazzo (lo mostra subito l'app)
  function condizioniPalazzo(s, p) {
    const aperte = propri(s, p).filter((l) => l.lvl >= 1).length;
    return { aperte, serveAperte: 2, permesso: !!(p.permessoPalazzo || p.pacchetto === "costruttore"), costoPermesso: 300_000, ok: p.piani > 0 || aperte >= 2 };
  }
  function piano(s, p, quanti) {
    azioneGiorno(s, p);
    // un piano per mossa; dall'Attico (6 piani) in su c'e' il Cantiere grande: 2 o 3 piani insieme, ma il 2° costa +50% e il 3° +100%
    quanti = Math.max(1, Math.min(Math.floor(Number(quanti) || 1), p.piani >= N.cantiereGrande ? 3 : 1));
    if (p.piani + quanti > N.pianiMax) err("Il Palazzo arriva al massimo a " + N.pianiMax + " piani.");
    if (p.piani === 0 && !condizioniPalazzo(s, p).ok) err("Per il Palazzo servono almeno 2 attività aperte sul tabellone.");
    const permesso = p.piani === 0 && !p.permessoPalazzo && p.pacchetto !== "costruttore" ? 300_000 : 0;
    const costo = costoPiani(p, quanti);
    if (p.cash < costo + permesso) err((quanti === 1 ? "Il piano costa " : quanti + " piani costano ") + euro(costo) + (permesso ? " più il permesso (300.000 €)" : "") + ".");
    if (permesso) { p.cash -= permesso; p.permessoPalazzo = true; log(s, p.nome + " ottiene il permesso per costruire il suo Palazzo.", p.id); }
    stanzeDi(p);
    const prima = p.piani;
    p.cash -= costo; p.piani += quanti; p.azioneGiornoFatta = true;
    p.funzioniPiani = p.funzioniPiani || []; for (let k = 0; k < quanti; k++) p.funzioniPiani.push("appartamenti");
    p.fama += Math.floor(p.piani / 5) - Math.floor(prima / 5);
    for (const F of FASCE_PALAZZO.slice(1)) if (prima < F.da && p.piani >= F.da) {
      p.fama += F.fama;
      privato(s, p, "Vera: Il tuo Palazzo è diventato " + (F.nome === "Attico" ? "un Attico" : "un Grattacielo") + "! +" + F.fama + " fama. I piani nuovi rendono il " + Math.round((F.rend - 1) * 100) + "% in più e puoi comprare stanze nuove: " + F.fun.map((f) => STANZE[f].nome).join(", ") + ". Apri l'app Palazzo.");
      notizia(s, F.nome === "Attico" ? "Il Palazzo di " + p.nome + " ha ora un Attico con vista su tutta la Laguna." : "Il Palazzo di " + p.nome + " tocca il cielo: è un Grattacielo.", "fama");
    }
    log(s, p.nome + (quanti === 1 ? " aggiunge il piano " + p.piani : " aggiunge " + quanti + " piani (ora " + p.piani + ")") + " al suo Palazzo.", p.id);
    aggiornaSkyline(s);
  }
  function stanzePossibili(s, p) {
    const st = stanzeDi(p);
    return FASCE_PALAZZO.flatMap((F) => F.fun.map((f) => {
      const ce = st.includes(f), lic = STANZE[f].licenza && !s.licenze.includes(p.id), mancano = F.da - p.piani;
      return { id: f, fascia: F.nome, da: F.da, costo: costoStanza(p, f), ce, ok: !ce && mancano <= 0 && !lic,
        perche: ce ? "ce l'hai già" : mancano > 0 ? (mancano === 1 ? "manca 1 piano" : "mancano " + mancano + " piani") : lic ? "serve la licenza del casinò" : "" };
    }));
  }
  function compraStanza(s, p, f) {
    azioneGiorno(s, p);
    if (!STANZE[f]) err("Stanza sconosciuta.");
    const x = stanzePossibili(s, p).find((y) => y.id === f);
    if (!x.ok) err(STANZE[f].nome + ": " + x.perche + ".");
    if (p.cash < x.costo) err(STANZE[f].nome + " costa " + euro(x.costo) + ".");
    p.cash -= x.costo; stanzeDi(p).push(f); p.azioneGiornoFatta = true;
    log(s, p.nome + " apre nel suo Palazzo: " + STANZE[f].nome + ".", p.id);
    if (STANZE[f].quando === "notte") privato(s, p, "Vera: La stanza «" + STANZE[f].nome + "» funziona di notte, quando sei a casa tua nel Palazzo. " + STANZE[f].descr);
  }

  // ================================================================ I GRANDI AFFARI (Livello 4)
  // Di ognuno ce n'e' UNO SOLO in tutta la Laguna. Si prende all'asta, poi si puo' strappare con la scalata:
  // ha 10 quote, chi ne ha di piu' lo comanda (a parita' resta a chi lo comanda gia').
  const GRANDI = {
    tv: { nome: "La TV della Laguna", base: 12_000_000, pubblicita: 2_500_000, quotaLusso: 0.10, spesa: 1_000_000, quote: 10, quoteVincitore: 4, maxQuoteCiclo: 2 },
    banca: { nome: "La Banca della Laguna", base: 15_000_000, pubblicita: 2_000_000, spesa: 1_000_000, quote: 10, quoteVincitore: 4, maxQuoteCiclo: 2, riciclaMax: 3_000_000 },
  };
  const ORDINE_GRANDI = ["tv", "banca"];
  function partitaLunga(s) { return s.modoFine === "libera" || (s.modoFine === "obiettivo" && (s.obiettivo || 0) >= 100_000_000) || (s.modoFine !== "obiettivo" && s.modoFine !== "libera" && (s.cicli || N.cicli) >= 12); }
  function grande(s, k) { s.grandi = s.grandi || {}; if (!s.grandi[k]) s.grandi[k] = { stato: "chiusa", offerte: {}, quote: {}, mercato: 0, prezzoQuota: 0, capo: null, titoloneCiclo: -1, quoteCiclo: {} }; return s.grandi[k]; }
  function capoDi(s, k) { const g = s.grandi && s.grandi[k]; return g && g.capo ? giocatore(s, g.capo) : null; }
  function apriAsteGrandi(s) {
    if (!s.players.some((p) => (p.livello || 0) >= 4)) return;
    if (ORDINE_GRANDI.some((k) => s.grandi && s.grandi[k] && s.grandi[k].stato === "asta")) return; // un'asta alla volta
    for (const k of ORDINE_GRANDI) {
      const g = grande(s, k); if (g.stato !== "chiusa") continue;
      g.stato = "asta"; g.offerte = {};
      notizia(s, "All'Alba va all'asta " + GRANDI[k].nome + ". Possono offrire solo i più potenti della Laguna (Livello 4). Offerte segrete, base " + euro(GRANDI[k].base) + ".", "evento");
      for (const p of s.players) if ((p.livello || 0) >= 4) privato(s, p, "Vera: \"" + GRANDI[k].nome + " va all'asta all'Alba. Fai la tua offerta segreta dall'app Grandi Affari: vince la più alta. Chi vince prende 4 quote su 10 e la comanda.\"");
      return; // la prossima si apre dopo
    }
  }
  function offertaGrande(s, p, k, importo) {
    if (!GRANDI[k]) err("Affare sconosciuto.");
    const g = grande(s, k);
    if (g.stato !== "asta") err("Adesso non c'è nessuna asta per " + GRANDI[k].nome + ".");
    if (livelloSblocco(s, p) < 4) err("All'asta possono offrire solo i giocatori al Livello 4.");
    importo = round(Number(importo) || 0);
    if (importo === 0) { delete g.offerte[p.id]; return; } // ritira l'offerta
    if (importo < GRANDI[k].base) err("L'offerta minima è " + euro(GRANDI[k].base) + ".");
    if (importo > p.cash) err("Non hai " + euro(importo) + " puliti.");
    g.offerte[p.id] = importo;
  }
  function comprareQuote(s, p, k, n) {
    if (!GRANDI[k]) err("Affare sconosciuto.");
    const g = grande(s, k), G = GRANDI[k];
    if (g.stato !== "attiva") err(G.nome + " non è ancora di nessuno.");
    if (livelloSblocco(s, p) < 4) err("Le quote le comprano solo i giocatori al Livello 4.");
    n = Math.max(1, Math.min(2, Math.floor(+n || 1)));
    const gia = (g.quoteCiclo || {})[p.id] || 0;
    if (gia + n > G.maxQuoteCiclo) err("Puoi comprare al massimo " + G.maxQuoteCiclo + " quote per Ciclo.");
    if (g.mercato < n) err(g.mercato ? "Sul mercato ne è rimasta solo " + g.mercato + "." : "Non ci sono quote in vendita: sono tutte in mano ai giocatori.");
    let costo = 0; for (let i = 0; i < n; i++) costo += round(g.prezzoQuota * Math.pow(1.1, i));
    if (p.cash < costo) err("Ti servono " + euro(costo) + " puliti.");
    p.cash -= costo; flusso(s, p, null, costo, "quote di " + G.nome, true);
    for (let i = 0; i < n; i++) g.prezzoQuota = round(g.prezzoQuota * 1.1);
    g.mercato -= n; g.quote[p.id] = (g.quote[p.id] || 0) + n; g.quoteCiclo = g.quoteCiclo || {}; g.quoteCiclo[p.id] = gia + n;
    log(s, p.nome + " compra " + n + (n === 1 ? " quota" : " quote") + " di " + G.nome + " (" + euro(costo) + ").", p.id);
    controllaCapo(s, k);
  }
  function controllaCapo(s, k) {
    const g = grande(s, k), G = GRANDI[k];
    let best = g.capo, bq = g.capo ? g.quote[g.capo] || 0 : 0;
    for (const [id, q] of Object.entries(g.quote)) if (q > bq) { best = id; bq = q; }
    if (best !== g.capo) {
      const vecchio = g.capo ? giocatore(s, g.capo) : null, nuovo = giocatore(s, best);
      g.capo = best;
      notizia(s, "Scalata riuscita: " + nuovo.nome + " prende il comando di " + G.nome + (vecchio ? ", strappata a " + vecchio.nome : "") + ".", "affari");
      privato(s, nuovo, "Vera: \"Adesso " + G.nome + " la comandi tu. Apri l'app Grandi Affari.\"");
      if (vecchio) privato(s, vecchio, "Vera: \"Ti hanno strappato " + G.nome + ": " + nuovo.nome + " ha più quote di te. Puoi riprendertela comprando quote.\"");
    } else if (g.capo) {
      // avviso: qualcuno si avvicina
      const mie = g.quote[g.capo] || 0;
      for (const [id, q] of Object.entries(g.quote)) if (id !== g.capo && q >= mie - 1 && q > 0) privato(s, giocatore(s, g.capo), "Vera: \"Attento: " + giocatore(s, id).nome + " ha " + q + " quote di " + G.nome + ", tu " + mie + ". Se ti supera, è sua.\"");
    }
  }
  // IL TITOLONE: chi comanda la TV, una volta per Ciclo, sceglie la prima pagina
  function titolone(s, p, a) {
    const g = grande(s, "tv");
    if (g.capo !== p.id) err("Il titolone lo sceglie solo chi comanda la TV.");
    if (g.titoloneCiclo === s.ciclo) err("Il titolone di questo Ciclo l'hai già scelto.");
    if (a.scelta === "fama") {
      p.fama += 8;
      notizia(s, "TV della Laguna, prima serata: intervista esclusiva a " + p.nome + ", il volto che tutti vogliono.", "fama");
    } else if (a.scelta === "scandalo") {
      const b = giocatore(s, a.bersaglio);
      if (!b || b.id === p.id) err("Scegli un rivale.");
      controllaSilenzio(s, p, b.id);
      const credibile = b.tracce > 25 || b.stato >= 1 || (p.prove || []).some((x) => x.su === b.id);
      if (credibile) {
        b.fama = Math.max(0, b.fama - 15); b.tracce += 12;
        notizia(s, "TV della Laguna: inchiesta su " + b.nome + ". Soldi che non tornano e amici strani. La polizia prende nota.", "scandalo");
        privato(s, b, "La TV della Laguna ha fatto un'inchiesta su di te: -15 fama, e la polizia ora ti guarda di più.");
      } else if (rng(s) < 0.5) {
        p.fama = Math.max(0, p.fama - 10);
        notizia(s, "Smentita in diretta: l'inchiesta della TV su " + b.nome + " era falsa. Figuraccia per la TV.", "fama");
        privato(s, p, "Vera: \"" + b.nome + " era pulito: lo scandalo ti si è rivoltato contro. -10 fama.\"");
      } else {
        b.fama = Math.max(0, b.fama - 6);
        notizia(s, "TV della Laguna: voci su " + b.nome + ". Niente di provato, ma la gente mormora.", "voce");
      }
    } else if (a.scelta === "borsa") {
      if (!AZIENDE.includes(a.azienda)) err("Scegli un'azienda della Borsa.");
      g.borsaNews = { azienda: a.azienda, su: !!a.su };
      p.tracce += 6; // manipolare la Borsa lascia tracce
      notizia(s, "TV della Laguna: " + (a.su ? "grandi novità in arrivo per " + a.azienda + "." : "nubi nere su " + a.azienda + "."), "borsa");
    } else err("Scelta non valida.");
    g.titoloneCiclo = s.ciclo;
    log(s, p.nome + " sceglie il titolone della TV.", p.id);
  }

  // LA BANCA DELLA LAGUNA: chi la comanda decide il tasso, puo' bloccare un conto, e puo' ripulire (con la Finanza addosso)
  function tassoPrestiti(s, p) { const g = s.grandi && s.grandi.banca; return g && g.stato === "attiva" && g.capo && g.capo !== p.id ? (g.tasso || 10) / 100 : N.prestitoInt; }
  function capoBanca(s, p) {
    const g = grande(s, "banca");
    if (g.capo !== p.id) err("Solo chi comanda la Banca della Laguna può farlo.");
    if ((p.stato || 0) >= 3) err("Sei indagato: la Finanza ha commissariato la tua banca.");
    return g;
  }
  function tassoBanca(s, p, tasso) {
    const g = capoBanca(s, p); tasso = Number(tasso);
    if (![5, 10, 20].includes(tasso)) err("Il tasso può essere 5%, 10% o 20%.");
    if (g.tassoCiclo === s.ciclo) err("Il tasso si cambia una volta per Ciclo.");
    g.tasso = tasso; g.tassoCiclo = s.ciclo;
    notizia(s, "La Banca della Laguna " + (tasso > 10 ? "alza" : tasso < 10 ? "abbassa" : "riporta") + " il tasso dei prestiti al " + tasso + "%.", "affari");
  }
  function bloccaConto(s, p, idBersaglio) {
    const g = capoBanca(s, p), b = giocatore(s, idBersaglio);
    if (!b || b.id === p.id) err("Scegli un rivale.");
    if (g.bloccoCiclo === s.ciclo) err("Un conto bloccato per Ciclo.");
    b.contoBloccato = s.ciclo; g.bloccoCiclo = s.ciclo;
    privato(s, b, "La Banca della Laguna ti ha bloccato il conto: niente prestiti fino all'Alba.");
    log(s, p.nome + " blocca il conto di " + b.nome + " alla Banca della Laguna.", p.id);
  }
  function riciclaBanca(s, p, importo) {
    const g = capoBanca(s, p), G = GRANDI.banca;
    importo = round(Number(importo) || 0);
    const gia = g.riciclatoCiclo === s.ciclo ? g.riciclato || 0 : 0;
    if (importo <= 0) err("Quanto vuoi ripulire?");
    if (gia + importo > G.riciclaMax) err("Nella tua banca ripulisci al massimo " + euro(G.riciclaMax) + " per Ciclo (ti restano " + euro(G.riciclaMax - gia) + ").");
    if (p.sporchi < importo) err("Non hai " + euro(importo) + " sporchi.");
    p.sporchi -= importo; p.cash += round(importo * 0.9); p.riciclTot = (p.riciclTot || 0) + importo; p.ripulitiCiclo = (p.ripulitiCiclo || 0) + importo;
    p.tracce += 4 * importo / 1_000_000; p.calSoldi = Math.min(10, (p.calSoldi || 0) + 0.8 * importo / 1_000_000); p.pulitoCiclo = false; p.macchia = true; p.peggiorReato = peggio(p.peggiorReato, "media");
    g.riciclato = gia + importo; g.riciclatoCiclo = s.ciclo;
    privato(s, p, "Hai ripulito " + euro(importo) + " nella tua banca (ti restano " + euro(round(importo * 0.9)) + " puliti). La Finanza però guarda i conti delle banche: è una pista.");
  }
  function albaGrandi(s, riepilogo, lussoAltri) {
    if (!s.grandi) return;
    for (const [k, g] of Object.entries(s.grandi)) {
      const G = GRANDI[k]; if (!G) continue;
      if (g.stato === "asta") {
        const off = Object.entries(g.offerte || {}).map(([id, v]) => [giocatore(s, id), v]).filter(([q, v]) => q && q.cash >= v && q.faro === 0).sort((x, y) => y[1] - x[1]);
        if (!off.length) { notizia(s, "Nessuna offerta per " + G.nome + ": l'asta resta aperta.", "affari"); continue; }
        const [w, v] = off[0];
        w.cash -= v; flusso(s, w, null, v, "asta: " + G.nome, true);
        g.stato = "attiva"; g.offerte = {}; g.quote = { [w.id]: G.quoteVincitore }; g.mercato = G.quote - G.quoteVincitore; g.prezzoQuota = round(v / 8); g.capo = w.id; g.titoloneCiclo = -1;
        notizia(s, w.nome + " si aggiudica " + G.nome + " per " + euro(v) + ". Ha 4 quote su 10: le altre 6 sono in vendita.", "affari");
        privato(s, w, "Vera: \"" + G.nome + ": ora la comandi tu! Apri l'app Grandi Affari per usarla. Attento: 6 quote sono sul mercato. Se un rivale ne compra più di te, te la strappa.\"");
        for (const [q] of off.slice(1)) privato(s, q, "Hai perso l'asta per " + G.nome + ": ha vinto " + w.nome + ". Puoi ancora comprare quote e strappargliela.");
        continue;
      }
      if (g.stato !== "attiva") continue;
      // pubblicita': una base + una parte del lusso comprato dagli altri
      let lusso = 0; for (const p of s.players) if (p.id !== g.capo) lusso += lussoAltri[p.id] || 0;
      let utile = G.pubblicita + (k === "tv" ? G.quotaLusso * lusso : s.interessiBanca || 0);
      if (k === "banca") { s.interessiBanca = 0; const c0 = capoDi(s, k); if (c0 && (c0.stato || 0) >= 3) { utile = 0; notizia(s, "La Finanza commissaria la Banca della Laguna: chi la comanda, " + c0.nome + ", è indagato. Niente utili questo Ciclo.", "scandalo"); } }
      for (const [id, q] of Object.entries(g.quote)) {
        const p = giocatore(s, id); const div = round(utile * q / G.quote);
        p.cash += div; if (riepilogo[id]) riepilogo[id].tv = (riepilogo[id].tv || 0) + div;
      }
      // chi comanda paga la spesa: se non ce la fa, perde il comando
      const capo = capoDi(s, k);
      if (capo) {
        if (capo.cash >= G.spesa) { capo.cash -= G.spesa; if (riepilogo[capo.id]) riepilogo[capo.id].tvSpesa = (riepilogo[capo.id].tvSpesa || 0) + G.spesa; }
        else {
          notizia(s, capo.nome + " non paga i conti della " + G.nome + ": perde il comando.", "affari");
          privato(s, capo, "Non avevi " + euro(G.spesa) + " per la spesa della TV: hai perso il comando (le quote restano tue).");
          const altri = Object.entries(g.quote).filter(([id]) => id !== capo.id).sort((x, y) => y[1] - x[1]);
          g.capo = altri.length ? altri[0][0] : null;
          if (g.capo) privato(s, giocatore(s, g.capo), "Vera: \"La TV ora la comandi tu: chi la guidava non ha pagato i conti.\"");
        }
      }
      if (g.borsaNews) { const b = g.borsaNews; s.borsa[b.azienda] = Math.max(5, s.borsa[b.azienda] * (b.su ? 1.12 : 0.88)); g.borsaNews = null; }
      g.quoteCiclo = {};
    }
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
    p.cash -= prezzo; p.lussoCiclo = (p.lussoCiclo || 0) + prezzo; p.veicoli.push(tipo); p.fama += v.fama; p.azioneGiornoFatta = true;
    log(s, p.nome + " compra: " + v.nome + ".", p.id);
    notizia(s, "Avvistato alla Marina dei Re: il nuovo " + v.nome.toLowerCase() + " di " + p.nome + ".", "fama");
  }
  function prestito(s, p, importo) {
    azioneGiorno(s, p);
    if (p.contoBloccato === s.ciclo) err("La Banca della Laguna ti ha bloccato il conto: niente prestiti fino all'Alba.");
    importo = Math.floor(importo || 0);
    const cap = N.prestitoQuota * (p.pacchetto === "ereditiera" ? 2 : 1) * propri(s, p).reduce((a, l) => a + valoreLotto(l), 0) - p.debito;
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
    privato(s, p, "Hai ipotecato " + l.nome + ": ricevi " + euro(q) + ". Finché è ipotecato rende la metà e non ci puoi costruire. Per riscattarlo paghi " + euro(round(q * N.ipotecaRiscatto)) + " (il " + Math.round((N.ipotecaRiscatto - 1) * 100) + "% in più). RISCHIO: se non lo riscatti prima dell'Alba del Ciclo " + (s.ciclo + 1 + N.ipotecaCicli) + ", la Banca se lo prende e lo mette all'asta.");
    log(s, p.nome + " ipoteca " + l.nome + " e riceve " + euro(q) + ".", p.id);
    notizia(s, "Sul cartello di " + l.nome + " compare la scritta \"Ipotecato\".", "voce");
  }
  // l'ipoteca di un terreno in chiaro, per chi lo possiede e per chi lo sta comprando:
  //   { ipoteca, riscatto: quanto costa toglierla, scadeCiclo: all'Alba di questo Ciclo la Banca se lo prende, restano: Albe che mancano }
  function infoIpoteca(s, l) {
    if (!l || !l.ipoteca) return null;
    const scade = (l.ipotecaCiclo || 0) + N.ipotecaCicli; // l'Alba in cui scatta il sequestro e' quella del Ciclo (scade + 1) a schermo
    return { ipoteca: l.ipoteca, riscatto: round(l.ipoteca * N.ipotecaRiscatto), scadeCiclo: scade + 1, restano: Math.max(0, scade - s.ciclo + 1) };
  }
  function riscatta(s, p, idLotto) {
    const l = lotto(s, idLotto);
    if (l.owner !== p.id || !l.ipoteca) err("Niente da riscattare.");
    const c = round(l.ipoteca * N.ipotecaRiscatto);
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
    contaPasso(s, corrente(s)); // il Passo libero conta i turni di chi lo usa (anche al Faro)
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
    p.tracce += tracce; p.pulitoCiclo = false; p.macchia = true; segnaTraccia(s, p, tracce, A.nome);
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
    else if (chi === "doganiere") prezzo = N.corruz.doganiere[0];
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
    p.tracce += 4; p.pulitoCiclo = false; p.macchia = true;
    p.peggiorReato = peggio(p.peggiorReato, chi === "agente" || chi === "doganiere" ? "media" : "grave");
    privato(s, p, "Accordo fatto: ora hai dalla tua parte " + (chi === "agente" ? "l'agente di " + NOMI_ISOLE[isola] : chi === "commissario" ? "il Commissario Vargas" : chi === "doganiere" ? "il doganiere dell'Aeroporto" : "il banchiere Lenz") + ".");
    presentaContatto(s, p, chi);
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
    p.ripulitiCiclo = (p.ripulitiCiclo || 0) + importo;
    segnaTraccia(s, p, metodo === "copertura" ? N.ricCopTracce * Math.min(importo, 5e6) / 100_000 : metodo === "shadow" ? N.shadowTracce * importo / 100_000 : 0.2 * Math.min(importo, 5e6) / 100_000, metodo === "paradiso" ? "il viaggio nel paradiso fiscale" : "i soldi ripuliti al Casinò Reale");
    p.pulitoCiclo = false; p.macchia = true;
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
    controllaSilenzio(s, p, b.id);
    b.tracce += 35; b.stato = Math.min(4, b.stato + 1); segnaTraccia(s, b, 35, "una prova consegnata alla polizia da un rivale (" + (pr.cosa || "una foto") + ")");
    b.denunce = (b.denunce || []).filter((x) => x.ciclo >= s.ciclo - 2); b.denunce.push({ ciclo: s.ciclo });
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
    aeroporto: { nome: "Aeroporto della Laguna", isola: "Sole", sblocco: 2 },
  };
  const OGGETTI = {
    maschera: { nome: "Maschera", dove: "mercato", prezzo: 40_000, illegale: true, salva: ["testimone", "telecamere", "fotografo"], consuma: true, descr: "Telecamere e testimoni non ti riconoscono." },
    disturbatore: { nome: "Disturbatore radio", dove: "mercato", prezzo: 90_000, illegale: true, salva: ["allarme", "intercettazione", "radar"], consuma: true, descr: "Blocca allarmi, intercettazioni e radar per un colpo." },
    telefono: { nome: "Telefono usa-e-getta", dove: "mercato", prezzo: 20_000, salva: ["intercettazione"], consuma: true, descr: "Accetti un'offerta senza lasciare il tuo nome." },
    documenti: { nome: "Documenti falsi", dove: "mercato", prezzo: 150_000, illegale: true, salva: ["posto_di_blocco", "dogana"], consuma: true, descr: "Passi il Posto di blocco di giorno e la dogana dell'Aeroporto di notte." },
    furgone: { nome: "Furgone pulito", dove: "porto", prezzo: 120_000, salva: ["pattuglia", "cani"], notti: 3, descr: "Il carico non si perde con le pattuglie e i cani antidroga non sentono niente. Dura 3 notti." },
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
    dogana: { arriva: "la dogana apre le casse", salvo: "i documenti falsi dicono che è tutto in regola", danno: "perso" },
    cani: { arriva: "arrivano i cani antidroga", salvo: "il furgone pulito non lascia odori", danno: "riconosciuto" },
    radar: { arriva: "il radar segue il volo", salvo: "il disturbatore confonde il radar", danno: "allarme" },
  };
  // =====================================================================
  // STRUMENTI DEL MERCATO NERO A ROTAZIONE (v70)
  // Ogni notte 3 banchi (Mercato Nero, Porto, Casinò) mettono in vendita 3 strumenti a caso.
  // Uno per tipo: chi lo compra per primo lo porta via. Gli strumenti grossi occupano 2 posti.
  // eff: gu = meno guai, ga = piu' guadagno, tr = meno tracce (luoghi/occasioni dove vale)
  // =====================================================================
  const STRUMENTI = {
    guanti: { nome: "Guanti di lattice", banco: ["mercato"], prezzo: 25_000, consuma: true, eff: [{ k: "tr", m: 0.75 }], combo: { con: "maschera", eff: [{ k: "tr", m: 0.6 }] }, descr: "Un colpo lascia un quarto di Tracce in meno. Con la Maschera, ancora meno." },
    piede_porco: { nome: "Piede di porco", banco: ["mercato", "porto"], prezzo: 35_000, consuma: true, eff: [{ k: "ga", m: 1.3, occ: ["container", "colpo", "lingotti"] }], descr: "Container, Colpo alla villa e lingotti: +30% di bottino." },
    radio_polizia: { nome: "Radio della polizia", banco: ["mercato"], prezzo: 180_000, raro: 1, notti: 2, subitoInfo: "pericoli", eff: [{ k: "gu", m: 0.85 }], descr: "Senti dove passano: guai −15% ovunque per 2 notti, e appena la compri sai il pericolo di ogni posto." },
    cimice: { nome: "Cimice", banco: ["casino", "mercato"], prezzo: 120_000, subito: true, subitoInfo: "rivali", descr: "La usi subito: scopri dove sono gli altri giocatori in questo momento e chi ha più Tracce." },
    spray_cani: { nome: "Spray anti-cani", banco: ["porto"], prezzo: 50_000, consuma: true, salva: ["cani"], descr: "I cani antidroga non sentono niente." },
    gommone: { nome: "Gommone d'altura", banco: ["porto"], prezzo: 220_000, posti: 2, notti: 2, salva: ["guardia", "pattuglia"], descr: "Scappi dal mare e dalle pattuglie per 2 notti. Ingombrante: 2 posti." },
    tuta: { nome: "Tuta da portuale", banco: ["porto"], prezzo: 30_000, consuma: true, eff: [{ k: "gu", m: 0.7, luoghi: ["porto"] }], descr: "Al Porto sembri uno di loro: guai −30%." },
    sigilli: { nome: "Sigilli doganali falsi", banco: ["porto"], prezzo: 140_000, raro: 1, consuma: true, salva: ["dogana"], eff: [{ k: "ga", m: 1.2, luoghi: ["porto", "aeroporto"] }], descr: "Salva dalla dogana e al Porto o all'Aeroporto il carico vale +20%." },
    bilancino: { nome: "Bilancino truccato", banco: ["porto", "mercato"], prezzo: 60_000, consuma: true, eff: [{ k: "ga", m: 1.25, occ: ["pesce", "orologi", "refurtiva"] }], descr: "Peschereccio, orologi, merce rubata: +25%." },
    mazzo_segnato: { nome: "Mazzo segnato", banco: ["casino", "mercato"], prezzo: 90_000, consuma: true, eff: [{ k: "ga", m: 1.4, occ: ["tavolo"] }, { k: "tr", m: 1.3, occ: ["tavolo"] }], descr: "Al tavolo truccato della Bisca +40%, ma +30% di Tracce." },
    infrarossi: { nome: "Occhialini a infrarossi", banco: ["casino"], prezzo: 150_000, raro: 1, consuma: true, salva: ["telecamere", "allarme"], descr: "Vedi i raggi degli allarmi e le telecamere." },
    passaporto: { nome: "Passaporto diplomatico", banco: ["casino"], prezzo: 600_000, raro: 2, notti: 3, salva: ["dogana", "posto_di_blocco", "retata"], descr: "LEGGENDARIO. Per 3 notti la retata, la dogana e i posti di blocco non ti toccano." },
    doppiofondo: { nome: "Valigia a doppiofondo", banco: ["mercato"], prezzo: 200_000, raro: 1, posti: 2, eff: [{ k: "pq", m: 0.35 }], descr: "Perquisizioni meno probabili; se arrivano, prendono meno contanti e non trovano la valigetta. 2 posti." },
    timbro: { nome: "Timbro del Municipio", banco: ["mercato"], prezzo: 160_000, raro: 1, giorno: "permesso", descr: "Di giorno, quando chiedi un permesso, scegli tu se usarlo: il permesso passa subito (e senza bollo nelle partite nuove). Ma +6 Tracce. Se non lo usi resta in valigetta." },
    registratore: { nome: "Registratore a filo", banco: ["casino"], prezzo: 100_000, consuma: true, provaSicura: true, descr: "Agli affari che danno una Prova, la Prova la ottieni anche se qualcosa va storto." },
    santino: { nome: "Santino del Faro", banco: ["mercato", "porto"], prezzo: 15_000, consuma: true, eff: [{ k: "gu", m: 0.93 }], descr: "Superstizione. Ma i pescatori giurano che funziona: guai −7%." },
    drone: { nome: "Drone silenzioso", banco: ["porto"], prezzo: 260_000, raro: 1, posti: 2, notti: 2, eff: [{ k: "gu", m: 0.6, luoghi: ["villa", "porto"] }], descr: "Alla Villa e al Porto vedi tutto dall'alto: guai −40% per 2 notti. 2 posti." },
    smoking: { nome: "Smoking su misura", banco: ["casino"], prezzo: 120_000, notti: 3, eff: [{ k: "fa", m: 1.6 }], legale: true, descr: "Legale. Alle feste e in barca +60% di fama, per 3 notti." },
    kit_pulitore: { nome: "Kit del pulitore", banco: ["mercato"], prezzo: 110_000, consuma: true, eff: [{ k: "trGuaio", m: 0.5 }], descr: "Se qualcosa va storto, cancelli metà delle Tracce." },
    mappa_fogne: { nome: "Mappa delle fogne", banco: ["mercato"], prezzo: 130_000, raro: 1, consuma: true, salva: ["retata", "pattuglia"], descr: "Sparisci sotto Borgo Ambra: salva da retata e pattuglia." },
    contanti_puliti: { nome: "Mazzette di banconote nuove", banco: ["casino"], prezzo: 80_000, consuma: true, eff: [{ k: "ga", m: 1.15 }], descr: "Il venditore ti paga meglio se paghi con soldi puliti: +15% su un affare." },
    binocolo: { nome: "Binocolo notturno", banco: ["porto", "casino"], prezzo: 45_000, consuma: true, salva: ["testimone"], descr: "Vedi chi ti guarda prima che ti veda lui." },
    scanner: { nome: "Scanner di frequenze", banco: ["mercato", "casino"], prezzo: 95_000, raro: 1, notti: 2, salva: ["intercettazione", "radar"], descr: "Per 2 notti intercettazioni e radar non ti trovano." },
    fiaschetta: { nome: "Fiaschetta d'argento", banco: ["casino", "porto"], prezzo: 20_000, consuma: true, salva: ["rissa"], descr: "Offri da bere al più grosso: la rissa finisce prima di cominciare." },
  };
  const BANCHI = { mercato: "il banco del Mercato Nero", porto: "il banco del contrabbandiere al Porto", casino: "il retrobottega del Casinò" };
  function riempiBanchi(s) {
    s.notte.banco = {};
    for (const l of Object.keys(BANCHI)) {
      const pool = Object.entries(STRUMENTI).filter(([, O]) => O.banco.includes(l));
      const scelti = [];
      for (let k = 0; k < 3 && pool.length; k++) {
        const pesi = pool.map(([, O]) => [1, 0.4, 0.08][O.raro || 0] * (O.raro === 2 && s.ciclo < 2 ? 0 : 1));
        let x = rng(s) * pesi.reduce((a, b) => a + b, 0), i = 0;
        for (; i < pool.length - 1; i++) { x -= pesi[i]; if (x <= 0) break; }
        scelti.push(pool.splice(i, 1)[0][0]);
      }
      s.notte.banco[l] = scelti;
    }
  }
  function oggettoDef(id) { return OGGETTI[id] || STRUMENTI[id]; }
  function postiUsati(p) { return (p.valigetta || []).reduce((a, o) => a + ((oggettoDef(o.id) || {}).posti || 1), 0); }
  function prezzoOggetto(s, id) { const O = oggettoDef(id); return round(O.prezzo * sitMult(s, "pr")); }

  // =====================================================================
  // SITUAZIONI DELL'ALBA (v70): 100 cose che succedono nella Laguna.
  // Ogni Alba ne arriva almeno una. Meta' le annuncia la Gazzetta un Ciclo prima ("Si dice che..."),
  // le altre arrivano a sorpresa. Durano 1 o 2 Cicli e aiutano o colpiscono solo alcuni.
  // e: effetti che durano. af = affitti, re = rendite, gu = guai di notte, ga = bottino, tr = Tracce,
  //    ch = luogo chiuso, pr = prezzi della valigetta, pq = perquisizioni, pe = permessi, fa = fama alle feste,
  //    sa = uno strumento salva anche da un pericolo, in = uno strumento non serve.
  // x: cosa succede subito. chi = a chi tocca; euro (per lotto se perLotto), fama, tracce; bo = Borsa, va = valore isola.
  // =====================================================================
  const SITUAZIONI = [
    { id: "sciopero_porto", t: "Sciopero dei portuali: il Porto Container resta chiuso.", d: 1, e: [{ k: "ch", luogo: "porto" }, { k: "re", tipo: "magazzino", m: 1.6 }] },
    { id: "alta_marea_sole", t: "Alta marea eccezionale sul Distretto Sole: negozi allagati.", d: 1, e: [{ k: "af", isola: "Sole", m: 0.7 }, { k: "re", isola: "Sole", m: 0.8 }] },
    { id: "blackout_corona", t: "Black-out a Isola Corona: telecamere spente tutta la notte.", d: 1, e: [{ k: "gu", luoghi: ["casino", "redazione"], m: 0.6 }, { k: "in", ogg: "maschera" }] },
    { id: "finanza", t: "La Guardia di Finanza sbarca in Laguna: controlli su chi ha troppi contanti.", d: 1, x: { chi: "sporchi", tracce: 10 }, e: [{ k: "pq", m: 1.5 }] },
    { id: "turisti_usa", t: "Ondata di turisti americani: discoteche e beach club pieni.", d: 1, e: [{ k: "re", tipo: "discoteca", m: 1.5 }, { k: "re", tipo: "beachclub", m: 1.5 }] },
    { id: "festa_patrono", t: "Festa del patrono a Borgo Ambra: tre giorni di processioni.", d: 1, e: [{ k: "af", isola: "Ambra", m: 1.3 }, { k: "gu", luoghi: ["mercato", "bisca"], m: 1.3 }] },
    { id: "nuove_telecamere", t: "Il Comune installa telecamere nuove in tutta la Laguna.", d: 2, e: [{ k: "gu", m: 1.15 }, { k: "sa", ogg: "maschera", per: "telecamere" }] },
    { id: "cani_porto", t: "Arrivano le unità cinofile al Porto e all'Aeroporto.", d: 1, e: [{ k: "gu", luoghi: ["porto", "aeroporto"], m: 1.35 }] },
    { id: "crisi_lusso", t: "Crisi del lusso: i ricchi stringono la cinghia.", d: 2, e: [{ k: "re", tipo: "boutique", m: 0.6 }, { k: "re", tipo: "hotel", m: 0.8 }], x: { bo: "Flamingo Luxury", m: 0.85 } },
    { id: "boom_tech", t: "Boom delle startup al Distretto Sole: tutti vogliono un ufficio.", d: 2, e: [{ k: "re", tipo: "uffici", m: 1.5 }, { k: "af", isola: "Sole", m: 1.15 }], x: { bo: "SoleTech", m: 1.12 } },
    { id: "nebbia", t: "Nebbia fitta sulla laguna: la Guardia Costiera non vede a un metro.", d: 1, e: [{ k: "gu", luoghi: ["marina", "porto", "faro"], m: 0.55 }] },
    { id: "regata", t: "Regata internazionale alla Marina dei Re.", d: 1, e: [{ k: "re", tipo: "yachtclub", m: 1.8 }, { k: "fa", m: 1.4 }, { k: "gu", luoghi: ["marina"], m: 1.3 }] },
    { id: "pentito", t: "Un pentito parla con la Procura: chi ha tante Tracce trema.", d: 1, x: { chi: "tracce", tracce: 8, fama: -3 } },
    { id: "giudice_nuovo", t: "Arriva un giudice severo al tribunale della Laguna.", d: 2, e: [{ k: "pq", m: 1.25 }, { k: "tr", m: 1.15 }] },
    { id: "giudice_morbido", t: "Il giudice severo va in pensione: il sostituto chiude un occhio.", d: 2, e: [{ k: "pq", m: 0.7 }, { k: "tr", m: 0.85 }] },
    { id: "assessore_ferie", t: "L'assessore all'urbanistica è in ferie: pratiche ferme.", d: 1, e: [{ k: "pe", m: 0.4 }] },
    { id: "piano_casa", t: "Piano casa del Comune: permessi facili per tutti.", d: 1, e: [{ k: "pe", m: 1.6 }] },
    { id: "tempesta_palma", t: "Tempesta tropicale su Costa Palma: la villa resta isolata.", d: 1, e: [{ k: "ch", luogo: "villa" }, { k: "af", isola: "Palma", m: 0.75 }], x: { va: "Palma", d: -0.5 } },
    { id: "influencer", t: "Una famosa influencer filma la Laguna: tutti vogliono esserci.", d: 1, e: [{ k: "fa", m: 1.8 }, { k: "re", tipo: "ristorante", m: 1.3 }] },
    { id: "scandalo_banca", t: "Scandalo alla Corona Bank: conti sotto sequestro.", d: 1, x: { bo: "Corona Bank", m: 0.75, chi: "tipo:bancaprivata", euro: -250_000 } },
    { id: "mercato_retata", t: "La polizia sorveglia il Mercato Nero: i banchi vendono di nascosto e caro.", d: 1, e: [{ k: "pr", m: 1.4 }, { k: "gu", luoghi: ["mercato"], m: 1.4 }] },
    { id: "saldi_neri", t: "Il Mercato Nero è pieno di merce rubata: prezzi stracciati.", d: 1, e: [{ k: "pr", m: 0.65 }] },
    { id: "matrimonio", t: "Matrimonio dell'anno a Costa Palma: hotel e ristoranti al completo.", d: 1, e: [{ k: "re", tipo: "hotel", m: 1.4 }, { k: "re", tipo: "ristorante", m: 1.3 }, { k: "af", isola: "Palma", m: 1.2 }] },
    { id: "epidemia_influenza", t: "Influenza stagionale: la gente resta a casa.", d: 1, e: [{ k: "re", tipo: "discoteca", m: 0.6 }, { k: "re", tipo: "ristorante", m: 0.8 }, { k: "gu", m: 0.9 }] },
    { id: "crociera", t: "Tre navi da crociera attraccano insieme.", d: 1, e: [{ k: "re", tipo: "boutique", m: 1.5 }, { k: "af", isola: "Flamingo", m: 1.2 }, { k: "gu", luoghi: ["porto"], m: 1.2 }] },
    { id: "ispezione_sanitaria", t: "Ispezioni sanitarie a sorpresa in tutti i locali.", d: 1, x: { chi: "tipo:ristorante", euro: -60_000, perLotto: true }, e: [{ k: "re", tipo: "ristorante", m: 0.85 }] },
    { id: "lavori_ponte", t: "Lavori sul Ponte Sud: traffico in tilt.", d: 1, e: [{ k: "af", isola: "Ambra", m: 0.85 }, { k: "af", isola: "Sole", m: 0.85 }] },
    { id: "ponte_nuovo", t: "Inaugurato il nuovo pontile: Costa Palma è più vicina.", d: 2, x: { va: "Palma", d: 0.6 } },
    { id: "raffineria", t: "Incidente alla raffineria: Laguna Energy crolla.", d: 1, x: { bo: "Laguna Energy", m: 0.7 } },
    { id: "petrolio", t: "Il petrolio vola: Laguna Energy in festa.", d: 1, x: { bo: "Laguna Energy", m: 1.25 } },
    { id: "rotte_cina", t: "Nuove rotte commerciali: le navi della Marina Shipping sempre piene.", d: 2, e: [{ k: "re", tipo: "magazzino", m: 1.3 }], x: { bo: "Marina Shipping", m: 1.18 } },
    { id: "pirati", t: "Pirati avvistati al largo: le assicurazioni sui carichi raddoppiano.", d: 1, e: [{ k: "gu", luoghi: ["marina", "porto"], m: 1.25 }, { k: "ga", luoghi: ["marina", "porto"], m: 1.3 }] },
    { id: "commissario_ferie", t: "Il Commissario Vargas è in vacanza alle Maldive.", d: 1, e: [{ k: "gu", m: 0.85 }] },
    { id: "rinforzi", t: "Rinforzi dalla capitale: cento agenti in più per la notte.", d: 1, e: [{ k: "gu", m: 1.25 }, { k: "tr", m: 1.1 }] },
    { id: "giornalista_inchiesta", t: "La Gazzetta prepara un'inchiesta sui soldi sporchi.", d: 2, e: [{ k: "tr", m: 1.2 }, { k: "gu", luoghi: ["redazione"], m: 1.5 }] },
    { id: "elezioni_anticipate", t: "Si parla di elezioni anticipate: i politici cercano amici.", d: 1, e: [{ k: "fa", m: 1.3 }, { k: "pe", m: 1.25 }] },
    { id: "sindaco_sotto_accusa", t: "Il Sindaco sotto accusa per una tangente.", d: 1, x: { chi: "sindaco", fama: -8, tracce: 6 } },
    { id: "eredita", t: "Un vecchio armatore muore senza eredi: i suoi beni vanno al più povero della Laguna, per legge antica.", d: 1, x: { chi: "povero", euro: 400_000 } },
    { id: "tassa_lusso", t: "Il Comune mette una tassa sui grattacieli.", d: 1, x: { chi: "palazzo", euro: -300_000 } },
    { id: "premio_onesta", t: "Premio cittadino per chi non ha mai avuto guai con la legge.", d: 1, x: { chi: "pulito", fama: 6, euro: 150_000 } },
    { id: "blitz_setta", t: "La Procura indaga sulle confraternite segrete.", d: 1, x: { chi: "setta", tracce: 7 }, e: [{ k: "gu", luoghi: ["faro", "villa"], m: 1.4 }] },
    { id: "ondata_caldo", t: "Ondata di caldo record: spiagge piene, città vuota.", d: 1, e: [{ k: "re", tipo: "beachclub", m: 1.7 }, { k: "af", isola: "Corona", m: 0.85 }] },
    { id: "pioggia", t: "Una settimana di pioggia: i beach club chiudono.", d: 1, e: [{ k: "re", tipo: "beachclub", m: 0.4 }, { k: "re", tipo: "galleria", m: 1.4 }] },
    { id: "mostra", t: "Una grande mostra arriva in Laguna: le gallerie d'arte vendono tutto.", d: 1, e: [{ k: "re", tipo: "galleria", m: 1.8 }] },
    { id: "falsi_arte", t: "Scoperti quadri falsi in città: tutte le gallerie sotto controllo.", d: 1, e: [{ k: "re", tipo: "galleria", m: 0.6 }, { k: "gu", luoghi: ["club"], m: 1.3 }] },
    { id: "vip_arrestato", t: "Arrestato un VIP al Club Neon: i fotografi ovunque.", d: 1, e: [{ k: "gu", luoghi: ["club"], m: 1.4 }, { k: "in", ogg: "macchina" }] },
    { id: "casino_ispezione", t: "Ispezione dei Monopoli al Casinò Reale.", d: 1, e: [{ k: "gu", luoghi: ["casino"], m: 1.5 }], x: { chi: "tipo:casino", tracce: 5 } },
    { id: "jackpot", t: "Un turista vince il jackpot del secolo: tutti corrono al Casinò.", d: 1, e: [{ k: "re", tipo: "casino", m: 1.5 }] },
    { id: "bisca_chiusa", t: "La Bisca del Vicolo è sotto sequestro per una notte.", d: 1, e: [{ k: "ch", luogo: "bisca" }] },
    { id: "aeroporto_sciopero", t: "Sciopero dei controllori di volo.", d: 1, e: [{ k: "ch", luogo: "aeroporto" }, { k: "re", tipo: "hotel", m: 0.8 }] },
    { id: "radar_rotto", t: "Si rompe il radar dell'Aeroporto: tre giorni per ripararlo.", d: 1, e: [{ k: "gu", luoghi: ["aeroporto"], m: 0.5 }] },
    { id: "dogana_corrotta", t: "Arrestato un doganiere: i colleghi ora controllano tutto.", d: 2, e: [{ k: "gu", luoghi: ["aeroporto", "porto"], m: 1.3 }] },
    { id: "mareggiata_faro", t: "Mareggiata al Faro: nessuno può avvicinarsi.", d: 1, e: [{ k: "ch", luogo: "faro" }] },
    { id: "luna_nuova", t: "Luna nuova: notte senza luce sulla laguna.", d: 1, e: [{ k: "gu", m: 0.88 }, { k: "in", ogg: "binocolo" }] },
    { id: "luna_piena", t: "Luna piena: si vede tutto, anche quello che non si dovrebbe.", d: 1, e: [{ k: "gu", m: 1.12 }, { k: "sa", ogg: "binocolo", per: "fotografo" }] },
    { id: "boss_arrivato", t: "Un boss straniero cerca soci: i carichi valgono di più, ma la polizia lo segue.", d: 1, e: [{ k: "ga", m: 1.25 }, { k: "tr", m: 1.25 }] },
    { id: "guerra_bande", t: "Guerra tra bande a Borgo Ambra.", d: 1, e: [{ k: "gu", luoghi: ["mercato", "bisca"], m: 1.5 }, { k: "af", isola: "Ambra", m: 0.8 }, { k: "sa", ogg: "fiaschetta", per: "rissa" }] },
    { id: "tregua", t: "Tregua tra le bande: notti tranquille a Borgo Ambra.", d: 1, e: [{ k: "gu", luoghi: ["mercato", "bisca"], m: 0.6 }] },
    { id: "cripto_febbre", t: "Febbre delle cripto: tutti comprano FlamingoToken.", d: 1, x: { cripto: "FlamingoToken", m: 1.3 } },
    { id: "cripto_hack", t: "Hacker svuotano un exchange: le cripto crollano.", d: 1, x: { cripto: "FlamingoToken", m: 0.6 } },
    { id: "resort_premio", t: "Palma Resorts eletta catena dell'anno.", d: 1, x: { bo: "Palma Resorts", m: 1.15 } },
    { id: "resort_scandalo", t: "Cimici nei letti di Palma Resorts: prenotazioni annullate.", d: 1, x: { bo: "Palma Resorts", m: 0.8 }, e: [{ k: "re", tipo: "hotel", m: 0.85 }] },
    { id: "bolla_casa", t: "I prezzi delle case salgono ovunque.", d: 1, x: { va: "tutte", d: 0.3 }, e: [{ k: "re", tipo: "agenzia", m: 1.5 }] },
    { id: "crollo_casa", t: "Mutui più cari: il mercato delle case si ferma.", d: 2, e: [{ k: "re", tipo: "agenzia", m: 0.6 }, { k: "af", tipo: "residenze", m: 0.85 }] },
    { id: "studenti", t: "Apre l'università della Laguna: migliaia di studenti cercano casa.", d: 2, e: [{ k: "af", tipo: "residenze", m: 1.4 }, { k: "re", tipo: "residenze", m: 1.4 }] },
    { id: "causa_collettiva", t: "Pioggia di cause in tribunale: gli studi legali non dormono.", d: 1, e: [{ k: "re", tipo: "legale", m: 1.8 }] },
    { id: "amnistia_voce", t: "Si parla di un condono: chi ha soldi sporchi respira.", d: 1, e: [{ k: "pq", m: 0.6 }] },
    { id: "lavanderie_controllo", t: "Controlli sulle lavanderie: chi ripulisce deve stare attento.", d: 1, e: [{ k: "re", tipo: "lavanderia", m: 0.6 }], x: { chi: "tipo:lavanderia", tracce: 6 } },
    { id: "furto_villa", t: "Furto clamoroso in una villa: la polizia setaccia Costa Palma.", d: 1, e: [{ k: "gu", luoghi: ["villa"], m: 1.6 }, { k: "ga", occ: ["refurtiva"], m: 1.4 }] },
    { id: "gioielli_mercato", t: "I gioielli rubati arrivano al Mercato Nero: il Ricettatore paga bene.", d: 1, e: [{ k: "ga", luoghi: ["mercato"], m: 1.35 }] },
    { id: "ballo_beneficenza", t: "Ballo di beneficenza al Casinò Reale: chi dona diventa qualcuno.", d: 1, e: [{ k: "fa", m: 1.5 }], x: { chi: "pulito", fama: 3 } },
    { id: "spia_setta", t: "Una spia gira tra le confraternite.", d: 1, e: [{ k: "tr", luoghi: ["faro", "villa"], m: 1.5 }] },
    { id: "neve", t: "Nevica sulla Laguna per la prima volta in cent'anni.", d: 1, e: [{ k: "re", tipo: "beachclub", m: 0.3 }, { k: "re", tipo: "hotel", m: 1.3 }, { k: "fa", m: 1.2 }] },
    { id: "concerto", t: "Concerto di una popstar a Baia Flamingo.", d: 1, e: [{ k: "re", tipo: "discoteca", m: 1.6 }, { k: "af", isola: "Flamingo", m: 1.25 }, { k: "gu", luoghi: ["club"], m: 0.8 }] },
    { id: "rissa_club", t: "Maxi rissa al Club Neon: la polizia lo tiene d'occhio.", d: 1, e: [{ k: "gu", luoghi: ["club"], m: 1.5 }] },
    { id: "pescatori_protesta", t: "I pescatori bloccano il canale: le barche non escono.", d: 1, e: [{ k: "gu", luoghi: ["marina"], m: 0.8 }, { k: "ga", occ: ["pesce"], m: 0.5 }] },
    { id: "sub_spiaggia", t: "Casse misteriose sulla spiaggia: tutti cercano tesori.", d: 1, e: [{ k: "ga", luoghi: ["marina"], m: 1.3 }, { k: "gu", luoghi: ["marina"], m: 1.15 }] },
    { id: "satelliti", t: "La polizia usa i droni: dall'alto vedono tutto.", d: 2, e: [{ k: "gu", luoghi: ["porto", "villa", "marina"], m: 1.3 }, { k: "in", ogg: "drone" }] },
    { id: "intercettazioni", t: "La Procura mette sotto controllo i telefoni della Laguna.", d: 1, e: [{ k: "tr", m: 1.15 }, { k: "sa", ogg: "telefono", per: "intercettazione" }] },
    { id: "tribunale_sciopero", t: "Sciopero degli avvocati: i processi slittano.", d: 1, e: [{ k: "pq", m: 0.75 }] },
    { id: "anticorruzione", t: "Arriva l'ispettore anticorruzione: niente favori in Municipio.", d: 1, e: [{ k: "pe", m: 0.6 }], x: { chi: "sindaco", tracce: 5 } },
    { id: "fiera_affari", t: "Fiera degli affari al Distretto Sole: investitori ovunque.", d: 1, e: [{ k: "re", tipo: "uffici", m: 1.3 }, { k: "re", tipo: "bancaprivata", m: 1.3 }] },
    { id: "evasori_lista", t: "La Finanza pubblica la lista degli evasori.", d: 1, x: { chi: "evasore", fama: -5, tracce: 8 } },
    { id: "tasse_giu", t: "Il Comune taglia le tasse sulle botteghe del centro.", d: 1, e: [{ k: "re", isola: "Ambra", m: 1.25 }] },
    { id: "metropolitana", t: "Cantieri della metropolitana a Isola Corona.", d: 2, e: [{ k: "af", isola: "Corona", m: 0.8 }, { k: "pe", m: 0.85 }], x: { va: "Corona", d: 0.4 } },
    { id: "fuga_capitali", t: "Fuga di capitali: le banche private tremano.", d: 1, e: [{ k: "re", tipo: "bancaprivata", m: 0.6 }], x: { bo: "Corona Bank", m: 0.9 } },
    { id: "yacht_show", t: "Salone degli yacht alla Marina dei Re.", d: 1, e: [{ k: "re", tipo: "yachtclub", m: 1.6 }, { k: "fa", m: 1.3 }], x: { bo: "Flamingo Luxury", m: 1.08 } },
    { id: "sparatoria", t: "Colpi di pistola al Porto: zona rossa per la polizia.", d: 1, e: [{ k: "gu", luoghi: ["porto"], m: 1.8 }, { k: "ga", luoghi: ["porto"], m: 1.2 }] },
    { id: "carico_sequestrato", t: "Sequestrato un carico enorme: al Porto la merce scarseggia e vale oro.", d: 1, e: [{ k: "ga", luoghi: ["porto", "aeroporto"], m: 1.4 }, { k: "gu", luoghi: ["porto"], m: 1.2 }] },
    { id: "corruttore_scoperto", t: "Scoperto un giro di mazzette alla polizia.", d: 1, x: { chi: "corrotti", tracce: 8, fama: -2 } },
    { id: "testimone_protetto", t: "Un testimone entra nel programma di protezione.", d: 1, e: [{ k: "in", ogg: "maschera" }, { k: "tr", m: 1.1 }] },
    { id: "notte_bianca", t: "Notte bianca: tutti i locali aperti fino all'alba.", d: 1, e: [{ k: "fa", m: 1.4 }, { k: "gu", m: 0.9 }, { k: "re", tipo: "ristorante", m: 1.2 }] },
    { id: "coprifuoco", t: "Coprifuoco dopo una notte di disordini.", d: 1, e: [{ k: "gu", m: 1.35 }, { k: "ga", m: 1.2 }] },
    { id: "uragano_flamingo", t: "Uragano su Baia Flamingo: danni ai locali sul mare.", d: 1, x: { chi: "isola:Flamingo", euro: -80_000, perLotto: true, va: "Flamingo", d: -0.4 }, e: [{ k: "re", isola: "Flamingo", m: 0.7 }] },
    { id: "ricostruzione", t: "Fondi per la ricostruzione: il Comune paga i proprietari.", d: 1, x: { chi: "isola:Flamingo", euro: 70_000, perLotto: true } },
    { id: "gentrificazione", t: "Gli artisti scoprono Borgo Ambra: case contese.", d: 2, x: { va: "Ambra", d: 0.5 }, e: [{ k: "af", isola: "Ambra", m: 1.15 }] },
    { id: "zona_rossa_sole", t: "Il Distretto Sole diventa zona di controllo speciale.", d: 1, e: [{ k: "gu", luoghi: ["porto", "aeroporto"], m: 1.3 }, { k: "pe", m: 0.8 }] },
    { id: "premio_architettura", t: "Premio di architettura: i grattacieli della Laguna in copertina.", d: 1, x: { chi: "palazzo", fama: 5 } },
    { id: "invidia", t: "La gente mormora contro il più ricco della Laguna.", d: 1, x: { chi: "ricco", fama: -4, tracce: 4 } },
    { id: "simpatia", t: "Tutti tifano per chi sta rimontando.", d: 1, x: { chi: "povero", fama: 5 } },
    { id: "banchieri_cena", t: "Cena segreta dei banchieri: il denaro cerca dove nascondersi.", d: 1, e: [{ k: "re", tipo: "bancaprivata", m: 1.4 }, { k: "re", tipo: "casino", m: 1.2 }] },
    { id: "falsari", t: "Banconote false in circolazione: al Mercato Nero nessuno si fida.", d: 1, e: [{ k: "pr", m: 1.25 }, { k: "ga", luoghi: ["mercato", "bisca"], m: 0.85 }] },
    { id: "procuratore_malato", t: "Il Procuratore capo è in ospedale.", d: 1, e: [{ k: "pq", m: 0.5 }] },
    { id: "procuratore_furioso", t: "Il Procuratore capo giura: \"Ripulirò la Laguna\".", d: 2, e: [{ k: "pq", m: 1.4 }, { k: "gu", m: 1.1 }] },
  ];
  const DESCR_EFF = {
    af: (e) => "Affitti" + (e.isola ? " a " + NOMI_ISOLE[e.isola] : e.tipo ? " delle " + ATTIVITA[e.tipo].nome : ""),
    re: (e) => "Rendite" + (e.tipo ? " di " + ATTIVITA[e.tipo].nome : "") + (e.isola ? " a " + NOMI_ISOLE[e.isola] : ""),
    gu: (e) => "Guai di notte" + (e.luoghi ? " a " + e.luoghi.map((l) => LUOGHI[l].nome).join(", ") : ""),
    ga: (e) => "Bottino" + (e.luoghi ? " a " + e.luoghi.map((l) => LUOGHI[l].nome).join(", ") : e.occ ? " di " + e.occ.map((o) => (OCCASIONI.find((x) => x.id === o) || { nome: o }).nome).join(", ") : ""),
    tr: (e) => "Tracce" + (e.luoghi ? " a " + e.luoghi.map((l) => LUOGHI[l].nome).join(", ") : ""),
    pr: () => "Prezzi della valigetta", pq: () => "Rischio di perquisizione", pe: () => "Permessi approvati", fa: () => "Fama alle feste e in barca",
  };
  function descriviSituazione(S) {
    const r = [];
    for (const e of S.e || []) {
      if (e.k === "ch") r.push(LUOGHI[e.luogo].nome + " chiuso");
      else if (e.k === "sa") r.push((oggettoDef(e.ogg) || {}).nome + " salva anche da: " + e.per.replace(/_/g, " "));
      else if (e.k === "in") r.push((oggettoDef(e.ogg) || {}).nome + " non serve");
      else if (DESCR_EFF[e.k]) r.push(DESCR_EFF[e.k](e) + " " + (e.m >= 1 ? "+" : "−") + Math.round(Math.abs(e.m - 1) * 100) + "%");
    }
    const x = S.x;
    if (x) {
      const chi = { sporchi: "chi ha più di 3 M sporchi", tracce: "chi ha più di 25 Tracce", pulito: "chi gioca pulito", sindaco: "il Sindaco", povero: "il più povero", ricco: "il più ricco", palazzo: "chi ha un Palazzo di 5 piani o più", setta: "chi è in una setta", evasore: "chi evade le tasse", corrotti: "chi ha corrotto qualcuno" }[x.chi] || (x.chi && x.chi.startsWith("tipo:") ? "chi ha " + ATTIVITA[x.chi.slice(5)].nome : x.chi && x.chi.startsWith("isola:") ? "chi ha terreni a " + NOMI_ISOLE[x.chi.slice(6)] : "");
      const cosa = [];
      if (x.euro) cosa.push((x.euro > 0 ? "+" : "−") + euro(Math.abs(x.euro)) + (x.perLotto ? " per terreno" : ""));
      if (x.fama) cosa.push((x.fama > 0 ? "+" : "") + x.fama + " fama");
      if (x.tracce) cosa.push("+" + x.tracce + " Tracce");
      if (chi && cosa.length) r.push(chi.replace(/^./, (c) => c.toUpperCase()) + ": " + cosa.join(", "));
      if (x.bo) r.push(x.bo + " in Borsa " + (x.m >= 1 ? "+" : "−") + Math.round(Math.abs(x.m - 1) * 100) + "%");
      if (x.cripto) r.push(x.cripto + " " + (x.m >= 1 ? "+" : "−") + Math.round(Math.abs(x.m - 1) * 100) + "%");
      if (x.va) r.push("Valore di " + (x.va === "tutte" ? "tutte le isole" : NOMI_ISOLE[x.va]) + (x.d > 0 ? " sale" : " scende"));
    }
    return r.join(" · ");
  }
  function sitAttive(s) { return (s.situazioni || []).map((a) => SITUAZIONI.find((x) => x.id === a.id)).filter(Boolean); }
  // il moltiplicatore di tutte le situazioni attive per un tipo di effetto
  function sitMult(s, k, f) {
    f = f || {}; let m = 1;
    for (const S of sitAttive(s)) for (const e of S.e || []) {
      if (e.k !== k) continue;
      if (e.isola && e.isola !== f.isola) continue;
      if (e.tipo && e.tipo !== f.tipo) continue;
      if (e.luoghi && !e.luoghi.includes(f.luogo)) continue;
      if (e.occ && !e.occ.includes(f.occ)) continue;
      m *= e.m;
    }
    return m;
  }
  function sitChiuso(s, l) { return sitAttive(s).some((S) => (S.e || []).some((e) => e.k === "ch" && e.luogo === l)); }
  function sitInutile(s, ogg) { return sitAttive(s).some((S) => (S.e || []).some((e) => e.k === "in" && e.ogg === ogg)); }
  function sitSalvaExtra(s, peric) { const r = []; for (const S of sitAttive(s)) for (const e of S.e || []) if (e.k === "sa" && e.per === peric) r.push(e.ogg); return r; }
  // effetti degli strumenti che porti in un affare (quelli scelti + quelli a notti)
  function strumentiMult(s, p, k, usati, f) {
    let m = 1;
    const ids = new Set(usati || []); for (const o of p.valigetta || []) if ((oggettoDef(o.id) || {}).notti) ids.add(o.id);
    for (const id of ids) {
      const O = oggettoDef(id); if (!O || sitInutile(s, id)) continue;
      let effs = O.eff || [];
      if (O.combo && ids.has(O.combo.con)) effs = O.combo.eff;
      for (const e of effs) {
        if (e.k !== k) continue;
        if (e.luoghi && !e.luoghi.includes(f.luogo)) continue;
        if (e.occ && !e.occ.includes(f.occ)) continue;
        m *= e.m;
      }
    }
    return m;
  }
  function chiTocca(s, chi) {
    const vivi = s.players.filter((p) => !p.fallito);
    if (!chi || chi === "tutti") return vivi;
    if (chi === "sporchi") return vivi.filter((p) => p.sporchi > 3_000_000);
    if (chi === "tracce") return vivi.filter((p) => p.tracce > 25);
    if (chi === "pulito") return vivi.filter((p) => !p.peggiorReato && p.tracce < 10);
    if (chi === "sindaco") return vivi.filter((p) => s.sindaco === p.id);
    if (chi === "palazzo") return vivi.filter((p) => p.piani >= 5);
    if (chi === "setta") return vivi.filter((p) => inSetta(p));
    if (chi === "evasore") return vivi.filter((p) => p.evasione > 0);
    if (chi === "corrotti") return vivi.filter((p) => Object.keys(p.corrotti || {}).length > 0);
    if (chi === "povero" || chi === "ricco") { if (!vivi.length) return []; const pat = vivi.map((p) => patrimonio(s, p, false)); const v = chi === "povero" ? Math.min(...pat) : Math.max(...pat); return [vivi[pat.indexOf(v)]]; }
    if (chi.startsWith("tipo:")) return vivi.filter((p) => haAttivita(s, p, chi.slice(5)));
    if (chi.startsWith("isola:")) return vivi.filter((p) => propri(s, p).some((l) => l.isola === chi.slice(6)));
    return [];
  }
  function applicaSubito(s, S) {
    const x = S.x; if (!x) return;
    if (x.bo && s.borsa[x.bo] != null) s.borsa[x.bo] *= x.m;
    if (x.cripto && s.cripto && s.cripto[x.cripto] != null) s.cripto[x.cripto] *= x.m;
    if (x.va) for (const i of x.va === "tutte" ? ISOLE : [x.va]) s.valore[i] = clamp(Math.round((s.valore[i] + x.d) * 10) / 10, 1, 10);
    if (x.chi && (x.euro || x.fama || x.tracce)) for (const p of chiTocca(s, x.chi)) {
      if (x.euro) {
        const n = x.perLotto ? propri(s, p).filter((l) => x.chi.startsWith("tipo:") ? l.tipo === x.chi.slice(5) : x.chi.startsWith("isola:") ? l.isola === x.chi.slice(6) : true).length : 1;
        const v = Math.round(x.euro * n);
        if (v) { p.cash += v; flusso(s, v < 0 ? p : null, v > 0 ? p : null, Math.abs(v), S.t, true); }
      }
      if (x.fama) p.fama = Math.max(0, p.fama + x.fama);
      if (x.tracce) { p.tracce += x.tracce; segnaTraccia(s, p, x.tracce, "Gazzetta: " + S.t); }
      privato(s, p, "Gazzetta: " + S.t + " Ti tocca: " + descriviSituazione({ x }));
    }
  }
  // all'Alba: scadono le vecchie, arrivano quelle annunciate, se ne aggiunge una nuova (annunciata o a sorpresa)
  function albaSituazioni(s) {
    s.situazioni = (s.situazioni || []).filter((a) => a.fino > s.ciclo + 1);
    const usate = new Set([...(s.situazioni || []).map((a) => a.id), ...(s.sitProssime || []), ...(s.sitStoria || []).slice(-30)]);
    const attiva = (id) => {
      const S = SITUAZIONI.find((x) => x.id === id); if (!S) return;
      s.situazioni.push({ id, fino: s.ciclo + 1 + (S.d || 1) });
      s.sitStoria = [...(s.sitStoria || []), id].slice(-40);
      applicaSubito(s, S);
      notizia(s, S.t + " — " + descriviSituazione(S), "evento");
    };
    for (const id of s.sitProssime || []) attiva(id);
    s.sitProssime = [];
    const pesca = () => { const pool = SITUAZIONI.filter((x) => !usate.has(x.id)); if (!pool.length) return null; const S = pool[Math.floor(rng(s) * pool.length)]; usate.add(S.id); return S; };
    const nuove = rng(s) < 0.3 ? 2 : 1;
    for (let k = 0; k < nuove; k++) {
      const S = pesca(); if (!S) break;
      if (rng(s) < 0.5) { s.sitProssime.push(S.id); notizia(s, "Si dice che al prossimo Ciclo… " + S.t + " (" + descriviSituazione(S) + ")", "voce"); }
      else attiva(S.id);
    }
  }
  for (const O of Object.values(STRUMENTI)) if (O.illegale == null) O.illegale = !O.legale;
  for (const k of ["santino", "fiaschetta", "binocolo"]) STRUMENTI[k].illegale = false;
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
    { id: "cargo", luogo: "aeroporto", sblocco: 2, nome: "Il volo cargo", testo: "Un cargo dall'estero atterra a luci spente. Nella stiva c'è un carico di droga che nessuno deve vedere.", costo: 400_000, guadagno: [3_400_000, 5_000_000], pericoli: ["dogana", "cani"], tracce: 16, gravita: "grave" },
    { id: "spedizione", luogo: "aeroporto", sblocco: 2, nome: "La spedizione", testo: "Un pilota parte all'alba per l'estero. Ci metti un milione di merce: se passa i controlli, torna il doppio.", costo: 1_000_000, guadagno: [1_500_000, 1_700_000], pericoli: ["dogana", "radar"], tracce: 12, gravita: "grave" },
    { id: "confraternita", luogo: "faro", sblocco: 0, soloSetta: true, nome: "Il carico della confraternita", testo: "Una nave senza bandiera aspetta il segnale della lanterna. Il carico è per la setta: chi lo scarica si prende la sua parte.", costo: 500_000, guadagno: [5_000_000, 8_000_000], pericoli: ["guardia"], tracce: 16, gravita: "grave" },
    { id: "senatore", luogo: "faro", sblocco: 0, soloSetta: true, nome: "Il segreto del senatore", testo: "I confratelli hanno le foto di un senatore. Pagherà bene per farle sparire, se qualcuno va a chiederglielo.", costo: 200_000, guadagno: [3_000_000, 5_000_000], pericoli: ["intercettazione", "fotografo"], tracce: 12, gravita: "grave" },
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
    aeroporto: [["La pista è buia, solo le luci blu di bordo.", "Il controllore di volo sbadiglia nella torre."], ["Un'auto della Finanza è parcheggiata vicino all'hangar.", "I doganieri controllano a caso le valigie."], ["Cani antidroga sulla pista e luci accese ovunque.", "Due auto della polizia bloccano l'uscita merci."]],
    faro: [["Le onde coprono ogni rumore. Qui nessuno ascolta.", "Il guardiano del Faro guarda il mare, non te."], ["Sulla scogliera c'è una seconda barca ormeggiata.", "Senti delle voci dietro la torre."], ["Il guardiano parla al telefono e ti guarda.", "Sul molo ci sono impronte fresche di scarponi."]],
  };
  const LIVELLI_PERICOLO = ["tranquillo", "agitato", "pericoloso"];
  const P_GUAI = [0.10, 0.30, 0.55];

  // Il livello di ogni giocatore sale con i soldi: piu' sei ricco, piu' cose si aprono (non si torna indietro)
  const SOGLIE_LIVELLO = SOGLIE_BASE;
  function livelloPersonale(s, p) {
    const pat = patrimonio(s, p, true), SG = soglieLivello(s);
    let lv = 0; for (let i = 0; i < SG.length; i++) if (pat >= SG[i]) lv = i;
    if (lv > 3 && !partitaLunga(s)) lv = 3; // il Livello 4 esiste solo nelle partite lunghe
    if (lv > (p.livello || 0)) p.livello = lv;
    return p.livello || 0;
  }
  function livelloSblocco(s, p) { return p ? p.livello || 0 : 3; }
  function postiValigetta(s, p) { return [2, 4, 4, 6, 6][livelloSblocco(s, p)] + (p && p.pacchetto === "contrabbandiere" ? 1 : 0); }
  function luogoAperto(s, l, p) { return LUOGHI[l] && !(l !== "palazzo" && sitChiuso(s, l)) && (LUOGHI[l].sblocco <= livelloSblocco(s, p) || (l === "faro" && p && inSetta(p))); }
  function isolaCasa(s, p) { const l = s.lotti.find((x) => x.owner === p.id && x.isola); return l ? l.isola : "Corona"; }
  function isolaLuogo(s, p, l) { return l === "palazzo" ? isolaCasa(s, p) : LUOGHI[l].isola; }
  function oreViaggio(s, p, da, a) {
    if (a === "aeroporto" && p.veicoli.includes("jet")) return 1;
    { const cv = convocazioneDi(s, p); if (cv && a === cv.c.luogo && giocatore(s, cv.st.gm).veicoli.includes("jet")) return 1; } // il jet della setta passa a prenderti
    if (haOggetto(p, "motoscafo") || haPiano(p, "eliporto") || p.veicoli.some((v) => ["motoscafo", "yacht", "megayacht", "elicottero"].includes(v))) return 1;
    return isolaLuogo(s, p, da) === isolaLuogo(s, p, a) ? 1 : 2;
  }
  // La rete della polizia: chi hai comprato e dove ti copre. Gli Affari Interni possono beccarli.
  function nomeContatto(k) { return k.startsWith("agente_") ? "l'agente di " + NOMI_ISOLE[k.slice(7)] : k === "commissario" ? "il Commissario Vargas" : k === "doganiere" ? "il doganiere dell'Aeroporto" : k === "banchiere" ? "il banchiere Lenz" : k === "giudice" ? "il Giudice" : k; }
  function rischioContatto(s, p, k) {
    const c = p.corrotti[k]; if (!c) return 0;
    let r = 0.03 + 0.02 * Math.min(5, c.usi || 0) + Math.min(0.1, p.tracce / 1000);
    if (k.startsWith("agente_") && s.leggi.includes("polizia_doppia_" + k.slice(7))) r += 0.05;
    if (k === "commissario") r += 0.02;
    r += 0.03 * Math.min(4, c.servizi || 0); // ogni Servizio lo rende piu' nervoso (v75)
    return Math.min(0.35, r);
  }
  function affariInterni(s, p, k) {
    const c = p.corrotti[k]; if (!c) return;
    if (c.sospetto) {
      // un Ciclo di tempo per scaricarlo: se e' ancora li', meta' delle volte lo prendono
      if (rng(s) < 0.5) {
        delete p.corrotti[k];
        notizia(s, "Affari Interni: arrestato " + nomeContatto(k) + " per corruzione.", "scandalo");
        if (rng(s) < 0.5) { p.tracce += 15; p.stato = Math.min(4, p.stato + 1); privato(s, p, "Hanno arrestato " + nomeContatto(k) + ". Sotto interrogatorio ha fatto il tuo nome: la polizia sale di un gradino."); }
        else privato(s, p, "Hanno arrestato " + nomeContatto(k) + ". Non ha parlato, per ora. Ma la sua protezione è finita.");
      } else { c.sospetto = null; privato(s, p, "Le indagini su " + nomeContatto(k) + " si sono chiuse senza niente. Ti è andata bene."); }
      return;
    }
    if (rng(s) < rischioContatto(s, p, k)) { c.sospetto = s.ciclo; privato(s, p, "Vera: \"Gli Affari Interni indagano su " + nomeContatto(k) + ". Se lo scarichi adesso sei al sicuro; se lo tieni, all'Alba può fare il tuo nome.\" (app Soldi sporchi, La tua rete)"); }
  }
  function scaricaContatto(s, p, k) {
    if (!p.corrotti[k]) err("Non hai questo contatto.");
    delete p.corrotti[k];
    privato(s, p, "Chiudi l'accordo con " + nomeContatto(k) + ". Da ora non ti protegge più, ma non può farti il nome.");
  }
  function inSetta(p) { return (p.sette || []).length > 0; }
  function haPiano(p, f) { return stanzeDi(p).includes(f); }
  function haOggetto(p, id) { return (p.valigetta || []).some((o) => o.id === id); }
  function togliOggetto(p, id) { const i = (p.valigetta || []).findIndex((o) => o.id === id); if (i >= 0) p.valigetta.splice(i, 1); }
  function racconta(s, p, testo, dopo) { if (!s.notte) return; (s.notte.racconto[p.id] = s.notte.racconto[p.id] || []).push(ORE[s.notte.ora + (dopo ? 1 : 0)] + " — " + testo); }
  // I fatti che il giocatore deve leggere per primi all'Alba (NOT-04): sequestri, perquisizioni, sentenze, contatti persi...
  // Si raccolgono durante alba() e finiscono in ultimaAlba.riepilogo[id].fatti (che ognuno vede solo per se').
  // f = { k: tipo, testo, soldi?: puliti persi(-)/presi(+), sporchi?: idem, tracce?: Tracce in piu' }
  function fatto(s, p, f) { if (!s.fattiAlba) return; (s.fattiAlba[p.id] = s.fattiAlba[p.id] || []).push(f); }
  function indizio(s, l) { const lv = LIVELLI_PERICOLO.indexOf(s.notte.pericolo[l]); const arr = INDIZI[l] && INDIZI[l][lv]; return arr ? arr[Math.floor(rng(s) * arr.length)] : ""; }
  function pagaMisto(s, p, costo) { // prima gli sporchi, poi i puliti
    if (p.sporchi + p.cash < costo) err("Non hai abbastanza soldi: servono " + euro(costo) + ".");
    const ds = Math.min(p.sporchi, costo); p.sporchi -= ds; p.cash -= costo - ds;
    if (ds > 0) p.macchia = true; // anche 1 euro sporco macchia il Ciclo
  }

  const VERA = [
    null,
    "Vera: \"Sei diventato qualcuno. Un tipo del Porto ha chiesto di te. Di notte si aprono il Mercato Nero, la Bisca, il Porto e il Casinò Reale. Arrivano i primi affari sporchi. La valigetta ora ha 4 posti.\"",
    "Vera: \"Ormai sei ricco. Il banchiere Lenz vuole conoscerti: da oggi puoi usare Borsa, Cripto, Contratti e nascondere le tasse. Di notte si apre anche la Redazione della Gazzetta.\"",
    "Vera: \"Sei tra i più potenti della Laguna. È arrivato un biglietto senza firma: 'Al Faro, a mezzanotte'. Si aprono la Villa sulla scogliera e il Faro. La valigetta ora ha 6 posti.\"",
    "Vera: \"Sei entrato nel giro dei Grandi Affari. Di ognuno ce n'è uno solo in tutta la Laguna: prima la TV, poi la Banca della Laguna. Apri l'app Grandi Affari.\"",
  ];

  function iniziaNotte(s) {
    s.fase = "notte"; s.notteFatti = {};
    const lv = livelloSblocco(s);
    for (const p of s.players) { const prima = p.livello || 0, ora = livelloPersonale(s, p); if (ora > prima) { p.livelloNuovo = ora; privato(s, p, VERA[ora]); } }
    apriAsteGrandi(s);
    s.notte = { ora: 0, pericolo: {}, occasioni: [], chiuso: {}, viaggio: {}, dove: {}, fatto: {}, foto: {}, racconto: {}, pronto: {}, daScelta: {}, inizioRacc: {}, base: {}, inizio: 0, proposte: [], serate: {} };
    riempiBanchi(s);
    for (const l of Object.keys(LUOGHI)) {
      const x = rng(s);
      let lvp = x < 0.45 ? 0 : x < 0.8 ? 1 : 2;
      if (s.blackout && LUOGHI[l].isola === s.blackout) lvp = 0;
      if (s.retataAnnunciata) lvp = Math.min(2, lvp + 1);
      s.notte.pericolo[l] = LIVELLI_PERICOLO[lvp];
    }
    s.transenna = null; // la transenna finisce con la Notte
    retateNotte(s); // la retata di Vargas e i controlli dell'esposto
    // occasioni nascoste nei luoghi aperti
    let n = 1;
    for (const l of Object.keys(LUOGHI)) {
      if (!luogoAperto(s, l)) continue;
      const pool = OCCASIONI.filter((o) => o.luogo === l && o.sblocco <= lv && (!o.soloSetta || s.sette.length > 0));
      if (!pool.length) continue;
      const quante = rng(s) < 0.4 ? 1 : 2;
      for (let k = 0; k < quante && pool.length; k++) {
        const o = pool.splice(Math.floor(rng(s) * pool.length), 1)[0];
        const dalle = Math.floor(rng(s) * 3), alle = Math.min(6, dalle + 2 + Math.floor(rng(s) * 3));
        s.notte.occasioni.push({ n: n++, id: o.id, luogo: l, dalle, alle, preso: null, riservata: null });
      }
    }
    for (const p of s.players) {
      p.affariStanotte = []; p.pulitoCiclo = true; p.luoghiNotte = {};
      s.notte.dove[p.id] = "palazzo";
      if (p.faro > 0) { s.notteFatti[p.id] = true; racconta(s, p, "Passi la notte al Faro, in cella. Fuori la Laguna si muove senza di te."); continue; }
      racconta(s, p, "Esci dal tuo palazzo. La Laguna è accesa.");
      // una chiamata, a volte
      if (livelloSblocco(s, p) >= 1 && rng(s) < 0.45) {
        const lvp = livelloSblocco(s, p);
        const tutte = OCCASIONI.filter((o) => !o.legale && !o.soloSetta && o.sblocco <= lvp && luogoAperto(s, o.luogo, p));
        // ognuno ha il suo appuntamento: se si puo', in un posto diverso da quello degli altri
        const giaUsati = new Set(s.notte.occasioni.filter((x) => x.riservata).map((x) => x.luogo));
        const libere = tutte.filter((o) => !giaUsati.has(o.luogo));
        const pool = libere.length ? libere : tutte;
        const o = pool[Math.floor(rng(s) * pool.length)];
        const alle = 3 + Math.floor(rng(s) * 3);
        s.notte.occasioni.push({ n: n++, id: o.id, luogo: o.luogo, dalle: 0, alle, preso: null, riservata: p.id });
        const msg = "Chiamata da un numero sconosciuto: \"" + o.testo + " Vieni a " + LUOGHI[o.luogo].nome + " prima delle " + ORE[alle] + ".\"";
        racconta(s, p, msg); privato(s, p, msg);
      }
    }
    manoInizioNotte(s);
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
    if (N2.pronto[p.id]) for (const pr of (N2.proposte || []).filter((x) => x.a === p.id && x.stato === "attesa")) rispondiIncontro(s, p, pr.id, false); // gia' pronto e preme ancora: "no" alle proposte in sospeso
    N2.pronto[p.id] = true;
    controllaOra(s);
  }
  function tempoScaduto(s) {
    if (s.fase !== "notte" || !s.notte) err("Non è notte.");
    const N2 = s.notte;
    // il tempo finisce a fine ora, oppure (se tutti hanno gia' scelto) 30 secondi dopo una proposta rimasta senza risposta
    const aperte = proposteAperte(s), tuttiPronti = attivi(s).every((q) => N2.pronto[q.id]);
    const propostaVecchia = tuttiPronti && aperte.length && aperte.every((pr) => adesso() - (pr.quando || N2.inizio) >= TEMPO_PROPOSTA * 1000 - 1500);
    if (adesso() - N2.inizio < TEMPO_ORA * 1000 - 1500 && !propostaVecchia) err("Il tempo non è ancora finito.");
    chiudiTutteSM(s, true); // le mani ancora aperte: chi non ha finito "sta"
    for (const q of attivi(s)) {
      if (!N2.chiuso[q.id] && !N2.viaggio[q.id]) {
        N2.daScelta[q.id] = (N2.racconto[q.id] || []).length;
        N2.chiuso[q.id] = true;
        racconta(s, q, "Il tempo passa. Resti " + (N2.dove[q.id] === "palazzo" ? "nel Palazzo" : "a " + nomeLuogo(N2.dove[q.id])) + " senza fare niente.");
      }
      N2.pronto[q.id] = true;
    }
    if (s.fase === "notte" && s.notte === N2 && attivi(s).every((q) => N2.pronto[q.id])) risolviOra(s); // le proposte rimaste senza risposta scadono qui
  }
  // Lo sfarzo: piu' fama e ricchezza hai, piu' entri nelle sale lussuose (0 normale, 1 VIP, 2 riservato)
  function lustro(s, p) {
    const punti = p.fama + patrimonio(s, p) / 500_000;
    return punti >= 55 ? 2 : punti >= 30 ? 1 : 0;
  }
  function livelloPalazzo(p) { return p.piani >= FASCE_PALAZZO[2].da ? 2 : p.piani >= FASCE_PALAZZO[1].da ? 1 : 0; }
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
    aeroporto: { id: "voli", titolo: "Guarda i voli in arrivo", testo: "Dal bar dell'aeroporto si vede chi atterra e chi parte, e con quali valigie." },
    faro: { id: "mare", titolo: "Guarda chi arriva dal mare", testo: "Dall'alto del Faro si vedono tutte le luci della Laguna." },
  };
  function attivitaNotte(s, p, importo) {
    oraLibera(s, p);
    const N2 = s.notte, dove = N2.dove[p.id], A = ATTIVITA_NOTTE[dove];
    if (!A) err("Qui non c'è niente di speciale da fare.");
    const altroLuogo = () => { const ls = Object.keys(LUOGHI).filter((l) => l !== "palazzo" && l !== dove && luogoAperto(s, l, p)); return ls[Math.floor(rng(s) * ls.length)]; };
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
        const o = N2.occasioni.find((x) => !x.preso && !x.riservata && x.luogo !== "mercato" && x.alle > N2.ora && luogoAperto(s, x.luogo, p) && !OCCASIONI.find((y) => y.id === x.id).legale);
        if (o) racconta(s, p, "Il vecchio abbassa la voce: \"" + OCCASIONI.find((y) => y.id === o.id).nome + ", a " + LUOGHI[o.luogo].nome + ", tra le " + ORE[Math.max(o.dalle, N2.ora)] + " e le " + ORE[o.alle] + ".\"");
        else racconta(s, p, "Il vecchio scuote la testa: stanotte non gira niente di buono.");
        break;
      }
      case "carte": case "roulette": {
        // alla roulette si gioca solo con soldi puliti: altrimenti sarebbe un modo facile di ripulire gli sporchi
        if (A.id === "carte" && s.manoSM && s.manoSM[p.id]) err("Finisci prima la mano che hai in corso.");
        if (A.id === "roulette") { if (p.cash < importo) err("Al Casinò Reale si gioca solo con soldi puliti."); p.cash -= importo; }
        else pagaMisto(s, p, importo);
        if (A.id === "carte") {
          // alla Bisca si gioca a Sette e mezzo contro il banco: la mano la giochi tu
          p.tracce += 1;
          apriManoSM(s, p, { tipo: "bisca", posta: importo, puoRilanciare: false });
          racconta(s, p, "Ti siedi al tavolo della Bisca. Si gioca a Sette e mezzo, il banco è il padrone del locale.");
          break;
        }
        const vinto = rng(s) < 0.46;
        {
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
    // NOT-02: niente ripulitura gratis. L'ingresso pagato con soldi sporchi arriva sporco a chi ospita.
    if (paga > 0) { const sp0 = p.sporchi; pagaMisto(s, p, paga); const sp = sp0 - p.sporchi; host.sporchi += sp; host.cash += paga - sp; se.banco += paga; }
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
    if (s.manoSM && s.manoSM[p.id]) err("Finisci prima la mano che hai in corso.");
    importo = round(Number(importo) || 0);
    if (importo < 10_000) err("La puntata minima è 10.000 €.");
    if (importo * 2 > Math.max(0, host.cash)) err("Il banco di " + host.nome + " non copre una puntata così alta.");
    const sp0 = p.sporchi; pagaMisto(s, p, importo);
    apriManoSM(s, p, { tipo: "serata", host: idHost, posta: importo, puoRilanciare: false, sporchiPosta: sp0 - p.sporchi });
  }
  // ------------------------------------------------------------ Sette e mezzo
  // 40 carte: in ogni seme 1..7 valgono il loro numero, Fante, Cavallo e Re valgono mezzo punto.
  const SEMI_SM = ["denari", "coppe", "spade", "bastoni"], FIGURE_SM = ["Fante", "Cavallo", "Re"];
  function mazzoSM(s) { const m = [...Array(40).keys()]; for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(rng(s) * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; } return m; }
  function valoreSM(c) { const v = c % 10; return v < 7 ? v + 1 : 0.5; }
  function totaleSM(m) { return m.reduce((a, c) => a + valoreSM(c), 0); }
  function nomeCartaSM(c) { const v = c % 10; return (v < 7 ? String(v + 1) : FIGURE_SM[v - 7]) + " di " + SEMI_SM[Math.floor(c / 10)]; }
  function puntiSM(t) { return t === 0.5 ? "mezzo" : String(t).replace(".5", " e mezzo"); }
  function testoSM(m) { const t = totaleSM(m); return m.map(nomeCartaSM).join(", ") + " = " + puntiSM(t) + (t > 7.5 ? " (sballato)" : ""); }
  // chi vince: >0 vince a, <0 vince b, 0 pari. Chi sballa perde; se sballano tutti e due e' pari.
  function confrontaSM(a, b) {
    const ta = totaleSM(a), tb = totaleSM(b), sa = ta > 7.5, sb = tb > 7.5;
    if (sa && sb) return 0; if (sa) return -1; if (sb) return 1;
    if (ta !== tb) return ta - tb;
    return b.length - a.length; // a pari punti vince chi ha usato meno carte
  }
  // Il banco gioca con una regola vera (NOT-14): vede le tue carte scoperte (tutte tranne la prima).
  // Se hai sballato non pesca: hai gia' perso. Altrimenti pesca finche' non ha almeno 5 e finche' non supera le tue carte scoperte.
  function giocaBancoSM(mazzo, carte) {
    const m = [mazzo.pop()];
    if (carte && totaleSM(carte) > 7.5) return m;
    const scoperte = carte ? totaleSM(carte.slice(1)) : 0, soglia = Math.max(5, Math.min(7.5, scoperte + 0.5));
    while (totaleSM(m) < soglia && mazzo.length) m.push(mazzo.pop());
    return m;
  }
  function apriManoSM(s, p, dati) {
    const mazzo = dati.mazzo || mazzoSM(s);
    (s.manoSM = s.manoSM || {})[p.id] = { ...dati, mazzo, carte: [mazzo.pop()], rilancio: false };
  }
  function mossaSM(s, p, mossa) {
    const m = s.manoSM && s.manoSM[p.id];
    if (!m) err("Non hai una mano di carte aperta.");
    if (mossa === "carta") {
      m.carte.push(m.mazzo.pop());
      if (totaleSM(m.carte) > 7.5) return chiudiManoSM(s, p);
      if (totaleSM(m.carte) === 7.5) return chiudiManoSM(s, p);
      return;
    }
    if (mossa === "rilancia") {
      if (!m.puoRilanciare || m.rilancio) err("Non puoi rilanciare adesso.");
      const sp0 = p.sporchi; pagaMisto(s, p, m.posta); m.sporchiExtra = (m.sporchiExtra || 0) + sp0 - p.sporchi; m.posta *= 2; m.rilancio = true;
      return;
    }
    if (mossa === "sto") return chiudiManoSM(s, p);
    err("Mossa sconosciuta.");
  }
  function chiudiManoSM(s, p, fine) {
    const m = s.manoSM[p.id]; delete s.manoSM[p.id];
    const N2 = s.notte;
    if (m.tipo === "sfida") { // una mano della sfida tra due giocatori: si chiude quando hanno finito tutti e due
      const pr = N2 && (N2.proposte || []).find((x) => x.id === m.prop);
      if (!pr || pr.stato !== "in_gioco") return;
      const mani = (N2.maniSfida = N2.maniSfida || {}); (mani[pr.id] = mani[pr.id] || {})[p.id] = m.carte; // nascoste finche' non finisce anche l'altro
      const da = giocatore(s, pr.da), a = giocatore(s, pr.a), altro = p.id === da.id ? a : da;
      if (!mani[pr.id][altro.id]) { racconta(s, p, "Le tue carte: " + testoSM(m.carte) + ". Copri la mano e aspetti che " + altro.nome + " finisca la sua."); return; }
      const manoDa = mani[pr.id][da.id], manoA = mani[pr.id][a.id]; delete mani[pr.id];
      pr.stato = "finita"; pr.manoDa = manoDa; pr.manoA = manoA; // solo adesso le carte si vedono
      const esito = confrontaSM(manoDa, manoA); // >0 vince chi ha sfidato
      const piatto = pr.importo * 2, sporchiPiatto = (pr.sporchiDa || 0) + (pr.sporchiA || 0);
      const vince = esito > 0 ? da : esito < 0 ? a : null;
      const dett = da.nome + ": " + testoSM(manoDa) + " · " + a.nome + ": " + testoSM(manoA) + ".";
      if (vince) { vince.sporchi += sporchiPiatto; vince.cash += piatto - sporchiPiatto; }
      else { restituisci_(da, pr); a.sporchi += pr.sporchiA || 0; a.cash += pr.importo - (pr.sporchiA || 0); }
      for (const [x, y] of [[da, a], [a, da]]) {
        const mie = x === da ? manoDa : manoA, sue = x === da ? manoA : manoDa;
        (N2.ultimaMano = N2.ultimaMano || {})[x.id] = { gioco: "sm", id: "sf" + pr.id, mie, sue, totMie: totaleSM(mie), totSue: totaleSM(sue), avv: y.nome, importo: pr.importo, esito: !vince ? "pari" : vince === x ? "vinto" : "perso" };
        racconta(s, x, "Sette e mezzo con " + y.nome + ". " + dett + " " + (!vince ? "Pari: ognuno si riprende i suoi soldi." : vince === x ? "Hai vinto: ti porti via " + euro(piatto) + " (guadagno " + euro(pr.importo) + ")." : "Hai perso " + euro(pr.importo) + "."));
      }
      notizia(s, "Sette e mezzo tra " + da.nome + " e " + a.nome + " (" + nomeLuogo(N2.dove[a.id]) + "): " + (vince ? "vince " + vince.nome : "finisce pari") + ".", "voce");
      if (!fine) controllaOra(s);
      return;
    }
    if (m.tipo === "bisca") {
      const banco = giocaBancoSM(m.mazzo, m.carte), sballato = totaleSM(m.carte) > 7.5, esito = sballato ? -1 : confrontaSM(m.carte, banco), sette = totaleSM(m.carte) === 7.5 && m.carte.length === 2;
      const vinto = esito > 0, pari = esito === 0 && !sballato;
      const premio = vinto ? m.posta * (sette ? 3 : 2) : pari ? m.posta : 0;
      p.sporchi += premio; // alla Bisca si paga in contanti sporchi
      (N2.ultimaMano = N2.ultimaMano || {})[p.id] = { gioco: "sm", id: "bi" + s.ciclo + "_" + m.carte.join("."), mie: m.carte, sue: banco, totMie: totaleSM(m.carte), totSue: totaleSM(banco), avv: "il banco della Bisca", importo: m.posta, esito: vinto ? "vinto" : pari ? "pari" : "perso", sette };
      racconta(s, p, "Tu: " + testoSM(m.carte) + ". Il banco: " + testoSM(banco) + ". " + (vinto ? (sette ? "Sette e mezzo reale! " : "") + "Ti porti via " + euro(premio) + " in contanti sporchi." : pari ? "Pari: ti riprendi la puntata." : "Vince il banco: perdi " + euro(m.posta) + "."));
      return;
    }
    if (m.tipo === "serata") {
      const host = giocatore(s, m.host), banco = giocaBancoSM(m.mazzo, m.carte);
      const sballato = totaleSM(m.carte) > 7.5, esito = sballato ? -1 : confrontaSM(m.carte, banco), sette = totaleSM(m.carte) === 7.5 && m.carte.length === 2;
      const vinto = esito > 0, pari = false; // a pari punti vince il banco; chi sballa ha perso subito
      const premio = vinto ? (sette ? m.posta * 3 : m.posta * 2) : pari ? m.posta : 0;
      const netto = premio - m.posta, sp = Math.min(m.sporchiPosta || 0, m.posta);
      // NOT-02: la puntata resta del tipo di soldi con cui e' stata pagata (sporchi dentro, sporchi fuori).
      // Se vinci riprendi la tua puntata com'era e il banco ti paga il resto in puliti; se perdi, la tua puntata va al banco com'era.
      if (vinto) { p.sporchi += sp; p.cash += m.posta - sp + netto; host.cash -= netto; }
      else { host.sporchi += sp; host.cash += m.posta - sp; }
      if (N2.serate[m.host]) N2.serate[m.host].banco -= netto;
      (N2.ultimaMano = N2.ultimaMano || {})[p.id] = { gioco: "sm", id: "se" + s.ciclo + "_" + (N2.ora || 0) + "_" + m.carte.join("."), mie: m.carte, sue: banco, totMie: totaleSM(m.carte), totSue: totaleSM(banco), avv: "il banco di " + host.nome, importo: m.posta, esito: vinto ? "vinto" : pari ? "pari" : "perso", sette };
      racconta(s, p, "Sette e mezzo al tavolo di " + host.nome + ". Tu: " + testoSM(m.carte) + ". Il banco: " + testoSM(banco) + ". " + (vinto ? (sette ? "Sette e mezzo reale! Vinci " : "Vinci ") + euro(premio) + "." : pari ? "Pari: ti riprendi la puntata." : "Vince il banco: perdi " + euro(m.posta) + "."));
      racconta(s, host, p.nome + (netto > 0 ? " batte il tuo banco: paghi " + euro(netto) + "." : netto < 0 ? " perde " + euro(-netto) + " al tuo tavolo." : " pareggia al tuo tavolo."));
      if (!fine) { N2.chiuso[p.id] = true; controllaOra(s); }
    }
  }
  // all'Alba nessuna mano resta a meta': chi non ha finito, sta
  function chiudiTutteSM(s) { for (const id of Object.keys(s.manoSM || {})) { if (!s.manoSM[id]) continue; try { chiudiManoSM(s, giocatore(s, id), true); } catch (e) { if (!e || !e.gioco) throw e; delete s.manoSM[id]; } } }
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
      N2.proposte.push({ id: (N2.prossimaProposta = (N2.prossimaProposta || 0) + 1), da: p.id, a: q.id, tipo, importo: 0, stato: "attesa", quando: adesso(), ora: N2.ora });
      racconta(s, p, "Fai portare due bicchieri al tavolo di " + q.nome + ". Ora tocca a lui decidere.");
    } else if (tipo === "sfida") {
      importo = round(Number(importo) || 0);
      if (importo < 50_000) err("La sfida minima è 50.000 €.");
      if (s.manoSM && s.manoSM[p.id]) err("Finisci prima la mano che hai in corso.");
      const sp0 = p.sporchi; pagaMisto(s, p, importo);
      const id = (N2.prossimaProposta = (N2.prossimaProposta || 0) + 1);
      // PT-08: le carte si danno solo se l'altro accetta. Fino ad allora i soldi restano sul tavolo.
      N2.proposte.push({ id, da: p.id, a: q.id, tipo, importo, sporchiDa: sp0 - p.sporchi, stato: "attesa", quando: adesso(), ora: N2.ora });
      racconta(s, p, "Butti " + euro(importo) + " sul tavolo davanti a " + q.nome + ": \"Sette e mezzo. Chi si avvicina di più vince tutto.\" Ora tocca a lui: se accetta, giocate tutti e due.");
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
      controllaOra(s);
      return;
    }
    if (pr.tipo === "drink") {
      pr.stato = "si"; da.fama += 2; p.fama += 2;
      const tasche = p.sporchi > 2_000_000 ? "ha le tasche piene di contanti sporchi" : p.sporchi > 300_000 ? "maneggia qualche contante di troppo" : "sembra pulito, per ora";
      racconta(s, da, p.nome + " accetta il bicchiere. Si parla, si ride. Tra una frase e l'altra capisci che " + tasche + ". +2 fama.");
      racconta(s, p, "Bevi con " + da.nome + ". Una bella serata: +2 fama. Forse hai parlato un po' troppo.");
    } else {
      if (s.manoSM && (s.manoSM[p.id] || s.manoSM[da.id])) err("C'è una mano di carte ancora aperta: prima va finita.");
      if (p.sporchi + p.cash < pr.importo) err("Non hai abbastanza soldi per accettare: servono " + euro(pr.importo) + ".");
      const sp0 = p.sporchi; pagaMisto(s, p, pr.importo);
      pr.stato = "in_gioco"; pr.sporchiA = sp0 - p.sporchi;
      // un mazzo solo, diviso in due mucchi: nessuno dei due puo' pescare la carta dell'altro
      const mazzo = mazzoSM(s), mA = mazzo.filter((c, i) => i % 2 === 0), mB = mazzo.filter((c, i) => i % 2 === 1);
      apriManoSM(s, da, { tipo: "sfida", prop: pr.id, posta: pr.importo, puoRilanciare: false, mazzo: mA });
      apriManoSM(s, p, { tipo: "sfida", prop: pr.id, posta: pr.importo, puoRilanciare: false, mazzo: mB });
      racconta(s, da, p.nome + " accetta la sfida. Si danno le carte: giocate tutti e due, alla fine si scoprono.");
      racconta(s, p, "Accetti la sfida di " + da.nome + " e metti " + euro(pr.importo) + " sul tavolo. Si danno le carte.");
    }
    controllaOra(s);
  }
  // Le scelte dell'ora: al massimo 3, decise dal luogo e dall'ora
  // I personaggi che girano di notte: ogni ora sono in un locale diverso (lo stesso per tutti).
  // Se capiti dove sono, ti vengono incontro. Il Commissario rende il posto piu' pericoloso (se non e' tuo amico),
  // la giornalista fa pesare di piu' le Tracce degli affari sporchi fatti sotto i suoi occhi.
  const GIRO = {
    banchiere: { nome: "Il banchiere Lenz", casa: "casino", posti: ["casino", "club", "marina", "villa", "casino"] },
    commissario: { nome: "Il Commissario Vargas", casa: "club", posti: ["club", "bisca", "porto", "marina", "mercato"] },
    doganiere: { nome: "Il doganiere", casa: "aeroporto", posti: ["aeroporto", "porto", "bisca", "aeroporto", "marina"] },
    giornalista: { nome: "La giornalista della Gazzetta", casa: "redazione", posti: ["redazione", "club", "casino", "villa", "porto"] },
  };
  function dovePersonaggio(s, k) {
    const G = GIRO[k], ora = s.notte ? s.notte.ora : 0;
    let h = (s.seed || 7) ^ (s.ciclo * 2654435761) ^ (ora * 40503) ^ (k.length * 9973); h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    return G.posti[h % G.posti.length];
  }
  function personaggiQui(s, luogo) { return Object.keys(GIRO).filter((k) => dovePersonaggio(s, k) === luogo); }
  function scelteNotte(s, p) {
    const N2 = s.notte;
    if (!N2 || s.notteFatti[p.id] || p.faro > 0 || N2.chiuso[p.id] || N2.viaggio[p.id]) return [];
    const dove = N2.dove[p.id], lv = livelloSblocco(s, p);
    const occ = occasioniVisibili(s, p).sort((a, b) => (b.riservata ? 1 : 0) - (a.riservata ? 1 : 0)).map((o) => {
      const O = OCCASIONI.find((x) => x.id === o.id);
      return { k: "occ", n: o.n, titolo: O.nome, testo: O.testo, costo: O.costo || 0, legale: !!O.legale, riservata: !!o.riservata };
    });
    const sp = [];
    if (dove === "casino" && p.sporchi > 0) sp.push({ k: "ricicla", titolo: "Ripulisci i soldi sporchi", testo: "Il cassiere cambia le fiches senza fare domande. Una parte resta a lui." });
    if (dove === "aeroporto" && !p.corrotti.doganiere) sp.push({ k: "doganiere", titolo: "Una busta al doganiere", testo: "Il capo della dogana fa il turno di notte. Con lui i tuoi carichi rischiano la metà." });
    if (dove === "casino" && lv >= 1) sp.push({ k: "banchiere", titolo: "Un drink con il banchiere Lenz", testo: "Lenz siede sempre allo stesso tavolo. Con lui i soldi trovano strade nuove." });
    if (dove === "club" && lv >= 1) sp.push({ k: "polizia", titolo: "Parla con un agente fuori servizio", testo: "Al bancone c'è un poliziotto che beve da solo. Ha l'aria di chi cerca un extra." });
    if (dove === "marina" && s.ciclo % 3 === 2 && !(p.ballo === s.ciclo)) sp.push({ k: "ballo", titolo: "Il Ballo in Maschera", testo: "Stanotte alla Marina tutti hanno il viso coperto. Ingresso " + euro(N.costoBallo) + ": +4 fama, e dietro le maschere la gente parla. Potresti sentire un segreto su un rivale (una Prova)." });
    if (dove === "mercato" && !(p.refurtiva && p.refurtiva.ciclo === s.ciclo)) sp.push({ k: "ricettatore", titolo: "Il Ricettatore", testo: "Ha un magazzino pieno di merce rubata. La compri con soldi sporchi e all'Alba la rivendi al 160%. Ma 1 volta su 4 la Finanza la trova prima." });
    if (dove === "redazione") sp.push({ k: "articolo", titolo: "Una busta al caporedattore", testo: "Domattina la Gazzetta può parlare bene di te. O male di un altro." });
    // i personaggi in giro: se sono qui stanotte (e non a casa loro), ti vengono incontro
    for (const k of personaggiQui(s, dove)) {
      if (GIRO[k].casa === dove || dove === "palazzo") continue;
      if (k === "banchiere" && lv >= 1) sp.push({ k: "banchiere", chi: "banchiere", giro: true, titolo: "Il banchiere Lenz si siede al tuo tavolo", testo: "Stanotte è qui, lontano dal suo Casinò. Parla a bassa voce di conti che spariscono." });
      if (k === "commissario") sp.push({ k: "polizia", chi: "commissario", giro: true, titolo: "Il Commissario Vargas è al bancone", testo: p.corrotti.commissario ? "È dei tuoi: ti fa un cenno. Stanotte qui sei più tranquillo." : "Finché lui è qui, gli affari sporchi in questo posto sono più pericolosi. Puoi provare a comprarlo." });
      if (k === "doganiere" && !p.corrotti.doganiere) sp.push({ k: "doganiere", giro: true, titolo: "Il doganiere è qui, fuori servizio", testo: "Con lui i carichi rischiano la metà. Stanotte puoi parlargli senza andare all'Aeroporto." });
      if (k === "giornalista") sp.push({ k: "articolo", giro: true, titolo: "La giornalista della Gazzetta ti riconosce", testo: "Prende appunti. Gli affari sporchi fatti sotto i suoi occhi lasciano più Tracce. Una busta, però, le fa cambiare idea su chi scrivere." });
    }
    if (dove === "faro" && s.sette.some((st) => st.gm === p.id)) sp.push({ k: "setta", titolo: "Riunisci la setta", testo: "Tra le onde, i tuoi confratelli aspettano un ordine." });
    if (dove === "faro") for (const id of p.nascondigli || []) { const st = s.sette.find((x) => x.id === id); if (st && st.sepolto > 0) sp.push({ k: "scava", setta: id, titolo: "Scava sotto la scogliera", testo: "Sai dove la setta \"" + st.nome + "\" nasconde il suo tesoro. Metà è tua, ma lasci molte Tracce." }); }
    { const cv = convocazioneDi(s, p); if (cv && cv.st.gm !== p.id && dove !== cv.c.luogo && N2.ora >= cv.c.ora - 1 && giocatore(s, cv.st.gm).veicoli.includes("jet")) sp.push({ k: "jet", setta: cv.st.id, titolo: "Sali sul jet della setta", testo: "Il Gran Maestro manda il suo jet: arrivi subito a " + LUOGHI[cv.c.luogo].nome + " per il rito delle " + ORE[cv.c.ora] + "." }); }
    { const cv = convocazioneDi(s, p); if (cv && cv.st.gm === p.id && dove === cv.c.luogo && N2.ora >= cv.c.ora && quiConMe(s, p).some((x) => cv.st.membri.includes(x.id))) sp.push({ k: "rito", setta: cv.st.id, titolo: "Celebra il rito della setta", testo: "I confratelli arrivati qui: Tracce cancellate e protezione per il resto della notte." }); }
    const ospiteDi = N2.ospite && N2.ospite[p.id];
    if (ospiteDi) {
      const h = giocatore(s, ospiteDi);
      return [{ k: "tavolo", titolo: "Sette e mezzo al tavolo di " + h.nome, testo: "Giochi tu la mano contro il banco del padrone di casa. Se vinci ti paga il doppio.", puntata: true },
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
    const PRIMA = ["rito", "scava", "jet"], prima = sp.filter((x) => PRIMA.includes(x.k)), resto = sp.filter((x) => !PRIMA.includes(x.k)); // il rito della setta viene prima di tutto
    const tutte = fissa ? [...[...prima, ...occ, ...resto].slice(0, 2), fissa] : [...prima, ...occ, ...resto].slice(0, 3);
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
    const lvp = livelloSblocco(s, p);
    return s.notte.occasioni.filter((o) => !o.preso && o.luogo === dove && ora >= o.dalle && ora < o.alle && (!o.riservata || o.riservata === p.id) && (OCCASIONI.find((x) => x.id === o.id).sblocco <= lvp || l_ok(o)) && (!OCCASIONI.find((x) => x.id === o.id).soloSetta || inSetta(p)));
    function l_ok(o) { return OCCASIONI.find((x) => x.id === o.id).soloSetta; }
  }

  function vai(s, p, luogo) {
    oraLibera(s, p);
    if (!LUOGHI[luogo]) err("Luogo sconosciuto.");
    if (!luogoAperto(s, luogo, p)) err("Questo posto non si è ancora aperto per te: si apre quando diventi più ricco.");
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
    const O = oggettoDef(id); if (!O) err("Oggetto sconosciuto.");
    const nero = !!STRUMENTI[id];
    if (nero) {
      const qua = s.notte.dove[p.id];
      if (!O.banco.includes(qua) || !(s.notte.banco && (s.notte.banco[qua] || []).includes(id))) err("Stanotte questo strumento qui non c'è.");
    } else qui(s, p, O.dove, "Questo acquisto");
    p.valigetta = p.valigetta || [];
    const prezzo = prezzoOggetto(s, id);
    if (!O.subito && postiUsati(p) + (O.posti || 1) > postiValigetta(s, p)) err("Nella valigetta non c'è spazio (" + postiUsati(p) + " posti usati su " + postiValigetta(s, p) + (O.posti > 1 ? "; questo ne occupa " + O.posti : "") + ").");
    if (!O.notti && !O.consuma && !O.subito && haOggetto(p, id)) err("Ce l'hai già.");
    pagaMisto(s, p, prezzo);
    if (O.illegale) p.macchia = true;
    if (nero) { const b = s.notte.banco[s.notte.dove[p.id]]; b.splice(b.indexOf(id), 1); }
    if (!O.subito) p.valigetta.push({ id, notti: O.notti || null });
    racconta(s, p, "Compri: " + O.nome + (prezzo !== O.prezzo ? " (" + euro(prezzo) + ")" : "") + "." + (nero ? " Era l'unico: stanotte nessun altro lo trova." : ""));
    if (O.subitoInfo === "pericoli") racconta(s, p, "La radio gracchia: " + Object.keys(LUOGHI).filter((l) => l !== "palazzo" && luogoAperto(s, l, p)).map((l) => LUOGHI[l].nome + " " + s.notte.pericolo[l]).join(", ") + ".");
    if (O.subitoInfo === "rivali") { const altri = s.players.filter((x) => x.id !== p.id && !x.fallito); racconta(s, p, "La cimice parla: " + altri.map((x) => x.nome + " è " + (s.notte.viaggio[x.id] ? "in viaggio" : s.notte.dove[x.id] === "palazzo" ? "a casa" : "a " + LUOGHI[s.notte.dove[x.id]].nome)).join(", ") + ". Il più chiacchierato dalla polizia: " + (altri.slice().sort((a, b) => b.tracce - a.tracce)[0] || { nome: "nessuno" }).nome + "."); }
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
    if (!O.legale) { p.luoghiNotte = p.luoghiNotte || {}; p.luoghiNotte[o.luogo] = true; }
    racconta(s, p, O.legale ? O.nome + ": ci stai." : O.nome + ": accetti." + (oggetti.length ? " Porti con te: " + oggetti.map((x) => oggettoDef(x).nome.toLowerCase()).join(", ") + "." : ""));
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
    const pg = chi === "agente" ? null : chi, inGiro = pg && GIRO[pg] && dovePersonaggio(s, pg) === s.notte.dove[p.id] && !s.notte.viaggio[p.id];
    if (!sala && !inGiro) { if (chi === "banchiere") qui(s, p, "casino", "Incontrare il banchiere Lenz"); else if (chi === "doganiere") qui(s, p, "aeroporto", "Incontrare il doganiere"); else qui(s, p, "club", "Incontrare la polizia"); }
    const ok = corrompi(s, p, chi, isola, sporchi);
    s.notte.chiuso[p.id] = true;
    racconta(s, p, ok ? "Una stretta di mano in un angolo buio. Accordo fatto." : "Ti guarda, intasca i soldi e se ne va. Brutto segno.");
    controllaOra(s);
  }
  // il Ricettatore: compri merce rubata (sporchi), all'Alba la rivendi al 160%; 1 volta su 4 la Finanza la sequestra
  function ricettatore(s, p, importo) {
    oraLibera(s, p); qui(s, p, "mercato", "Comprare dal Ricettatore");
    importo = round(Number(importo) || 0);
    if (p.refurtiva && p.refurtiva.ciclo === s.ciclo) err("Stanotte hai già comprato dal Ricettatore.");
    if (importo < 100_000 || importo > 2_000_000) err("Il Ricettatore tratta da 100.000 € a 2 milioni.");
    if (p.sporchi < importo) err("Il Ricettatore vuole contanti sporchi: non ne hai abbastanza.");
    p.sporchi -= importo; p.refurtiva = { ciclo: s.ciclo, importo }; p.pulitoCiclo = false; p.macchia = true; p.peggiorReato = peggio(p.peggiorReato, "media");
    p.tracce += 3 * importo / 1_000_000; segnaTraccia(s, p, 3 * importo / 1_000_000, "Merce rubata (Mercato Nero)");
    s.notte.chiuso[p.id] = true;
    racconta(s, p, "Il Ricettatore conta i soldi due volte, poi ti indica un camion senza targa. " + euro(importo) + " di merce: all'Alba la rivendi, se la Finanza non arriva prima.");
    controllaOra(s);
  }
  // il Ballo in Maschera (ogni 3 Cicli, alla Marina): fama e, se va bene, una Prova su un rivale che ha qualcosa da nascondere
  function ballo(s, p) {
    oraLibera(s, p); qui(s, p, "marina", "Il Ballo in Maschera");
    if (s.ciclo % 3 !== 2) err("Il Ballo è solo una notte ogni 3 Cicli.");
    if (p.ballo === s.ciclo) err("Al Ballo ci sei già stato stanotte.");
    if (p.cash < N.costoBallo) err("L'ingresso costa " + euro(N.costoBallo) + ".");
    p.cash -= N.costoBallo; p.ballo = s.ciclo; p.fama += 4;
    const rivali = s.players.filter((q) => q.id !== p.id && (q.tracce || 0) > 10);
    if (rivali.length && rng(s) < 0.6) {
      const b = rivali.sort((x, y) => y.tracce - x.tracce)[Math.floor(rng(s) * Math.min(2, rivali.length))];
      p.prove.push({ su: b.id, ciclo: s.ciclo + 1, cosa: "confidenze al Ballo in Maschera" });
      racconta(s, p, "Sotto una maschera d'oro qualcuno beve troppo e parla di " + b.nome + ". Ora hai una Prova contro di lui. +4 fama.");
    } else racconta(s, p, "Valzer, champagne e maschere. Nessun segreto stanotte, ma tutti parlano della tua maschera. +4 fama.");
    s.notte.chiuso[p.id] = true; controllaOra(s);
  }
  function albaRefurtiva(s, r) {
    for (const p of s.players) {
      const x = p.refurtiva; if (!x || x.ciclo !== s.ciclo || x.fatto) continue; x.fatto = true;
      if (rng(s) < 0.25) { p.tracce += 8; privato(s, p, "La Finanza ha trovato il camion del Ricettatore: la merce (" + euro(x.importo) + ") è persa, e +8 Tracce."); notizia(s, "Sequestrato un camion di merce rubata vicino al Mercato Nero.", "scandalo"); }
      else { const g = round(x.importo * 1.6); p.sporchi += g; if (r[p.id]) r[p.id].refurtiva = g; privato(s, p, "Hai rivenduto la merce del Ricettatore: " + euro(g) + " sporchi."); }
    }
  }
  function articolo2(s, p, a) {
    oraLibera(s, p);
    if (!(dovePersonaggio(s, "giornalista") === s.notte.dove[p.id] && !s.notte.viaggio[p.id])) qui(s, p, "redazione", "Comprare un articolo");
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
    if (!attivi(s).every((p) => s.notte.pronto[p.id])) return;
    if (proposteAperte(s).length) return; // NOT-01: si aspetta la risposta (o la fine del tempo: tempoScaduto)
    risolviOra(s);
  }
  // le proposte che tengono aperta l'ora: quelle senza risposta fatte a chi e' ancora in giro, e le sfide che si stanno giocando
  const TEMPO_PROPOSTA = 30; // secondi: se sono tutti pronti e l'altro non risponde, dopo questo tempo la proposta scade
  function proposteAperte(s) {
    const N2 = s.notte; if (!N2) return [];
    return (N2.proposte || []).filter((pr) => (pr.stato === "attesa" && attivi(s).some((q) => q.id === pr.a)) || (pr.stato === "in_gioco" && s.manoSM && (s.manoSM[pr.da] || s.manoSM[pr.a])));
  }
  function risolviOccasione(s, p, f) {
    const o = s.notte.occasioni.find((x) => x.n === f.n);
    const O = OCCASIONI.find((x) => x.id === o.id);
    const usati = f.oggetti || [];
    for (const id of usati) if (oggettoDef(id).consuma) togliOggetto(p, id);
    if (O.legale) {
      p.fama += Math.round((O.fama + lustro(s, p)) * sitMult(s, "fa") * strumentiMult(s, p, "fa", usati, { luogo: o.luogo, occ: O.id }));
      racconta(s, p, O.id === "festa" ? "Alla festa stringi le mani giuste. La tua fama cresce." : "Champagne, stelle e armatori. Domani tutti parleranno di te.");
      return;
    }
    p.affariStanotte.push({ tipo: O.id }); p.pulitoCiclo = false; p.macchia = true; p.affariOk += 1; p.reputazione += 2;
    p.peggiorReato = peggio(p.peggiorReato, O.gravita);
    let tracce = O.tracce * 0.75 * (0.7 + 0.6 * rng(s));
    const isola = LUOGHI[o.luogo].isola;
    let pg = P_GUAI[LIVELLI_PERICOLO.indexOf(s.notte.pericolo[o.luogo])];
    if (p.corrotti["agente_" + isola]) { pg *= 0.6; p.corrotti["agente_" + isola].usi = (p.corrotti["agente_" + isola].usi || 0) + 1; }
    if (p.corrotti.commissario) { pg *= 0.8; p.corrotti.commissario.usi = (p.corrotti.commissario.usi || 0) + 1; }
    if (s.notte.rito && s.notte.rito[p.id]) pg *= 0.7; // la setta ti copre dopo il rito
    if ((p.sette || []).some((id) => { const st = s.sette.find((x) => x.id === id); return st && st.commissario; })) pg *= 0.85; // il Commissario e' della setta
    if (o.luogo === "aeroporto" && p.corrotti.doganiere) { pg *= 0.5; p.corrotti.doganiere.usi = (p.corrotti.doganiere.usi || 0) + 1; }
    if (s.leggi.includes("polizia_doppia_" + isola)) pg *= 1.4;
    if (poliziaOccupata(s, p)) pg *= N.occupata;
    pg *= 1 + N.pistaLuogoNotte * ((p.calore || {})[o.luogo] || 0);
    if (dovePersonaggio(s, "commissario") === o.luogo && !p.corrotti.commissario) pg *= 1.35; // il Commissario e' qui stanotte
    pg *= sitMult(s, "gu", { luogo: o.luogo }) * strumentiMult(s, p, "gu", usati, { luogo: o.luogo, occ: O.id }); // situazioni e strumenti
    pg = Math.min(0.95, pg);
    if (o.luogo === "porto" && operaAttiva(s, p, "porto")) pg = 0; // Grande Opera: il Porto e' della setta
    const guaio = O.pericoli.length && rng(s) < pg ? O.pericoli[Math.floor(rng(s) * O.pericoli.length)] : null;
    let guadagno = O.guadagno ? (O.guadagno[0] + rng(s) * (O.guadagno[1] - O.guadagno[0])) * (1 + 0.2 * lustro(s, p)) * N.bonusIllegale * moltIllegale(s, p) : 0;
    guadagno *= sitMult(s, "ga", { luogo: o.luogo, occ: O.id }) * strumentiMult(s, p, "ga", usati, { luogo: o.luogo, occ: O.id });
    if (guaio) {
      const G = PERICOLI[guaio];
      const extra = sitSalvaExtra(s, guaio);
      const salvatore = usati.find((id) => !sitInutile(s, id) && ((oggettoDef(id).salva || []).includes(guaio) || extra.includes(id))) || (p.valigetta || []).map((x) => x.id).find((id) => (oggettoDef(id) || {}).notti && !sitInutile(s, id) && (oggettoDef(id).salva || []).includes(guaio)) || (guaio === "guardia" && haOggetto(p, "motoscafo") ? "motoscafo" : null) || (guaio === "pattuglia" && haOggetto(p, "furgone") ? "furgone" : null);
      // la polizia impara i tuoi trucchi: ogni volta che lo stesso oggetto ti salva, la volta dopo funziona di meno
      p.trucchi = p.trucchi || {};
      const usiTrucco = salvatore ? p.trucchi[salvatore] || 0 : 0;
      const falla = salvatore && rng(s) < Math.min(0.55, N.oggettoFalla + 0.1 * usiTrucco);
      if (salvatore && !falla) {
        p.trucchi[salvatore] = usiTrucco + 1; p.tracce += 2; // ti salvi, ma qualcuno ha notato qualcosa
        racconta(s, p, "Mentre lavori " + G.arriva + ", ma " + G.salvo + "." + (usiTrucco >= 1 ? " Però la polizia comincia a conoscere questo trucco: la prossima volta funzionerà di meno." : ""));
      }
      else {
        racconta(s, p, "Mentre lavori " + G.arriva + "." + (falla ? " Contavi su: " + (oggettoDef(salvatore) ? oggettoDef(salvatore).nome.toLowerCase() : salvatore) + ", ma stavolta non basta." : ""));
        if (G.danno === "perso") { guadagno = 0; tracce += 6; racconta(s, p, "Molli tutto e scappi. Il carico è perso, e con lui i soldi che ci avevi messo."); }
        else if (G.danno === "riconosciuto") { tracce += 15; p.stato = Math.max(p.stato, 2); racconta(s, p, "Hai l'impressione di essere stato riconosciuto. Da domani qualcuno ti terrà d'occhio."); }
        else if (G.danno === "allarme") { guadagno = 0; tracce += 18; p.stato = Math.max(p.stato, 3); racconta(s, p, "Sirene in lontananza. Scappi a mani vuote, e la polizia ha un nome: il tuo."); notizia(s, "Tentato colpo a " + NOMI_ISOLE[isola] + ". La polizia segue una pista.", "scandalo"); }
        else if (G.danno === "foto") { tracce += 8; const altri = s.players.filter((x) => x.id !== p.id); if (altri.length) { const b = altri[Math.floor(rng(s) * altri.length)]; b.prove.push({ su: p.id, ciclo: s.ciclo + 1, cosa: O.nome }); privato(s, b, "Un fotografo ti vende una foto di " + p.nome + " durante \"" + O.nome + "\". È una Prova."); } racconta(s, p, "Qualcuno ora ha una tua foto. Non sai chi."); }
        else if (G.danno === "retata") { guadagno = 0; tracce += 10; const prima = (p.valigetta || []).length; if (!haPiano(p, "piani_segreti")) p.valigetta = (p.valigetta || []).filter((x) => !oggettoDef(x.id).illegale); racconta(s, p, "Ti perquisiscono e ti lasciano andare. Il carico è sequestrato" + (prima > p.valigetta.length ? ", e anche gli oggetti illegali della valigetta." : haPiano(p, "piani_segreti") ? ". Gli oggetti illegali però sono al sicuro nei piani segreti del tuo Palazzo." : ".")); }
        else if (G.danno === "meta") { guadagno *= 0.5; racconta(s, p, "Nella confusione ti porti via solo metà del bottino."); }
      }
    }
    if (O.prova && (!guaio || usati.includes("maschera") || usati.includes("registratore"))) {
      const altri = s.players.filter((x) => x.id !== p.id && x.tracce > 10);
      if (altri.length) { const b = altri[Math.floor(rng(s) * altri.length)]; p.prove.push({ su: b.id, ciclo: s.ciclo + 1, cosa: "confidenze del politico" }); racconta(s, p, "Il politico ti racconta segreti su " + b.nome + ". Ora hai una Prova."); }
      else racconta(s, p, "Il politico parla tanto ma non dice niente di utile.");
    }
    if (o.riservata === p.id && usati.includes("telefono")) tracce *= 0.5;
    if (inSetta(p)) tracce *= 0.7; // la setta copre i suoi
    if (operaAttiva(s, p, "amnistia")) tracce *= 1.3; // dopo l'Amnistia la Procura vi guarda
    if (dovePersonaggio(s, "giornalista") === o.luogo) tracce *= 1.25; // la giornalista prende appunti
    if (p.pacchetto === "contrabbandiere") tracce *= 0.7;
    if (s.leggi.includes("polizia_doppia_" + isola)) tracce *= 1.5;
    tracce *= sitMult(s, "tr", { luogo: o.luogo, occ: O.id }) * strumentiMult(s, p, "tr", usati, { luogo: o.luogo, occ: O.id }) * (guaio ? strumentiMult(s, p, "trGuaio", usati, {}) : 1);
    p.tracce += tracce; segnaTraccia(s, p, tracce, O.nome + " (" + nomeLuogo(o.luogo) + ")");
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
    // 2b. La Mano: chi ha promesso un appuntamento a quest'ora deve essere li'
    manoOra(s);
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
      racconta(s, da, giocatore(s, pr.a).nome + " non ti ha risposto in tempo." + (pr.importo ? " Ti riprendi i soldi." : ""));
    }
    // una sfida rimasta a meta' (non dovrebbe succedere: le mani si chiudono prima): i soldi tornano a tutti e due
    for (const pr of N2.proposte || []) if (pr.stato === "in_gioco") { pr.stato = "scaduta"; const da = giocatore(s, pr.da), a = giocatore(s, pr.a); restituisci_(da, pr); a.sporchi += pr.sporchiA || 0; a.cash += pr.importo - (pr.sporchiA || 0); if (s.manoSM) { delete s.manoSM[da.id]; delete s.manoSM[a.id]; } }
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
    chiudiTutteSM(s);
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
  function chiediPermesso(s, p, idLotto, usaTimbro) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err("Non è il tuo turno.");
    if (s.pending) err("Prima finisci la scelta in corso.");
    const l = lotto(s, idLotto);
    if (l.owner !== p.id || l.tipoCasella !== "lotto") err("Il permesso si chiede per un tuo lotto.");
    if (l.cantiere) err("C'è già un cantiere aperto.");
    if (l.permesso) err("Il permesso ce l'hai già: puoi costruire.");
    if (l.lvl >= 5) err("Il lotto è già al massimo.");
    const turno = s.ciclo * 100 + s.giorno * 10 + s.turno;
    if (p.permessoTurno === turno) err("Al Municipio si va una volta per turno.");
    if (p.rapidoTurno === turno) err("Oggi hai usato la mossa del giorno per il viaggio rapido: il permesso lo chiedi al prossimo turno.");
    const primo = s.principianti && !p.primoPermesso;
    // il Timbro falso si usa solo se lo chiedi tu (azione con timbro: true); se no resta in valigetta (v76)
    if (usaTimbro && !haOggetto(p, "timbro")) err("Non hai il Timbro del Municipio in valigetta.");
    const timbro = !!usaTimbro;
    if (gen2(s)) return permessoSicuro(s, p, l, primo, turno, timbro);
    p.permessoTurno = turno;
    p.primoPermesso = true;
    if (timbro) { togliOggetto(p, "timbro"); p.tracce += 6; segnaTraccia(s, p, 6, "Timbro falso del Municipio"); }
    const x = primo || timbro ? 0 : rng(s), soglia = Math.min(0.95, 0.55 * sitMult(s, "pe"));
    p.esitoPermesso = { n: (s.nPermessi = (s.nPermessi || 0) + 1), lotto: l.id, esito: x < soglia ? "approvato" : x < 0.85 ? "rimandato" : "negato", motivo: "", bollo: 0 };
    if (x < soglia) { l.permesso = true; l.negato = false; log(s, p.nome + " ottiene il permesso per costruire in " + l.nome + ".", p.id); return "approvato"; }
    if (x < 0.85) { privato(s, p, "Municipio: la tua pratica per " + l.nome + " è rimandata. Riprova al prossimo turno."); return "rimandato"; }
    l.negato = true;
    privato(s, p, "Municipio: permesso negato per " + l.nome + ". L'assessore però ha fatto capire che \"si può sempre parlare\".");
    return "negato";
  }
  // PERMESSI NELLE PARTITE NUOVE: niente esito a caso. Paghi il bollo e il permesso e' approvato.
  // Viene rimandato solo per un motivo scritto PRIMA (motivoRinvio): sei Indagato (o al Processo). Allora resta la busta all'assessore.
  // Gratis: il primo permesso della partita guidata, e tutti i permessi chiesti nel turno in cui sei fermo sul Municipio.
  function bolloPermesso(s, p, l) {
    if (!gen2(s) || p.municipioOggi || (s.principianti && !p.primoPermesso)) return 0;
    return Math.max(10_000, round(l.prezzo * num(s, "permessoBollo")));
  }
  function motivoRinvio(s, p) {
    if (!gen2(s)) return null;
    if ((p.stato || 0) >= 3) return { k: "indagine", testo: "Sei " + STATI[Math.min(4, p.stato)] + ": finché c'è l'indagine il Municipio tiene ferme le tue pratiche." };
    return null;
  }
  // cosa succede se chiedi il permesso adesso: { bollo, sicuro, rinvio: null | { k, testo }, gratisPerche }
  function infoPermesso(s, p, l) {
    const rinvio = motivoRinvio(s, p), bollo = bolloPermesso(s, p, l);
    return { bollo, sicuro: gen2(s) && !rinvio, rinvio, gratisPerche: !gen2(s) ? "" : p.municipioOggi ? "sei al Municipio di persona" : bollo === 0 ? "è il tuo primo permesso" : "" };
  }
  function permessoSicuro(s, p, l, primo, turno, timbro) {
    // il Timbro falso (se lo usi) salta la coda e il bollo (ma lascia Tracce); le situazioni dell'Alba rendono il Municipio piu' lento o piu' veloce
    const pe = sitMult(s, "pe");
    const rinvio = primo || timbro ? null : (pe < 1 && rng(s) > pe ? { testo: "L'ufficio è quasi fermo per via di quello che succede in città." } : motivoRinvio(s, p));
    const bollo = timbro ? 0 : round(bolloPermesso(s, p, l) * clamp(1 / pe, 0.5, 2.5));
    if (timbro && !rinvio) { togliOggetto(p, "timbro"); p.tracce += 6; segnaTraccia(s, p, 6, "Timbro falso del Municipio"); }
    const n = (s.nPermessi = (s.nPermessi || 0) + 1);
    if (rinvio) {
      p.permessoTurno = turno; l.negato = true; p.esitoPermesso = { n, lotto: l.id, esito: "rimandato", motivo: rinvio.testo, bollo: 0 };
      privato(s, p, "Municipio: la pratica per " + l.nome + " è RIMANDATA. " + rinvio.testo + " Non hai pagato niente. L'assessore però fa capire che con una busta si può parlare (lascia Tracce).");
      return "rimandato";
    }
    if (p.cash < bollo) err("Il permesso costa " + euro(bollo) + " di bollo (il " + Math.round(num(s, "permessoBollo") * 100) + "% del prezzo del terreno).");
    p.permessoTurno = turno; p.primoPermesso = true;
    p.cash -= bollo; if (bollo) flusso(s, p, null, bollo, "Permesso per " + l.nome, false);
    l.permesso = true; l.negato = false; p.esitoPermesso = { n, lotto: l.id, esito: "approvato", motivo: "", bollo };
    log(s, p.nome + " ottiene il permesso per costruire in " + l.nome + (bollo ? " (bollo " + euro(bollo) + ")" : "") + ".", p.id);
    return "approvato";
  }
  // Agenzia immobiliare (app del telefono): una volta per turno compri un terreno libero
  // dell'isola dove sei, anche senza fermarti sopra. Costa il 20% in più (prezzo pieno se sei passato da un'Agenzia).
  function prezzoAgenzia(s, p, l) { return p.agenziaSconto || haAttivita(s, p, "agenzia") ? l.prezzo : round(l.prezzo * 1.2); }
  function haAttivita(s, p, tipo) { return propri(s, p).some((l) => l.tipo === tipo && l.lvl >= 1 && !l.chiuso && !l.cantiere); }
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
    if (gen2(s)) { // partite nuove: licenza sicura se paghi; rimandata solo se sei Indagato (allora resta la busta)
      const rinvio = motivoRinvio(s, p);
      if (rinvio) { p.licenzaNegata = true; privato(s, p, "Municipio: la domanda di licenza è RIMANDATA. " + rinvio.testo + " Non hai pagato niente. Con una busta (650.000 €, lascia Tracce) si sistema."); return "rimandato"; }
      p.cash -= 500_000; s.licenze.push(p.id); p.licenzaNegata = false; log(s, p.nome + " ottiene la licenza per aprire un casinò.", p.id);
      privato(s, p, "Municipio: licenza del casinò APPROVATA. Pagati 500.000 € (allo sportello del Municipio, di persona, costa 400.000 €). Ora puoi costruire un casinò a Baia Flamingo o a Isola Corona.");
      return "approvato";
    }
    const x = rng(s) - Math.min(0.2, p.fama / 400);
    if (x < (p.pacchetto === "politico" ? 0.75 : 0.45)) { p.cash -= 500_000; s.licenze.push(p.id); p.licenzaNegata = false; log(s, p.nome + " ottiene la licenza per aprire un casinò.", p.id); privato(s, p, "Municipio: licenza del casinò APPROVATA. Pagati 500.000 €. Ora puoi costruire un casinò a Baia Flamingo o a Isola Corona."); return "approvato"; }
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
    p.tracce += 10; p.pulitoCiclo = false; p.macchia = true; p.peggiorReato = peggio(p.peggiorReato, "lieve");
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
    p.tracce += 6; p.pulitoCiclo = false; p.macchia = true; p.peggiorReato = peggio(p.peggiorReato, "lieve");
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
    if (livelloSblocco(s, p) < 1 || p.faro > 0) return;
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
    p.sporchi += pd.guadagno; p.tracce += tel ? 2 : 9; p.pulitoCiclo = false; p.macchia = true; p.peggiorReato = peggio(p.peggiorReato, "lieve");
    privato(s, p, "Lavoretto fatto: +" + euro(pd.guadagno) + " in contanti sporchi." + (tel ? " Il telefono usa-e-getta finisce in mare." : " Hai usato il tuo numero: qualcuno potrebbe ascoltare."));
  }
  // Le perquisizioni all'Alba: piu' Tracce lasci, piu' e' facile che la polizia entri nel tuo Palazzo.
  // Sequestra il 30% degli sporchi (caveau e cassetta di sicurezza ne salvano una parte) e gli oggetti illegali.
  function rischioPerquisizione(s, p) {
    if (p.fallito || p.faro > 0) return 0;
    const pr = Math.min(N.perqMax, Math.max(0, ((p.tracce || 0) - N.perqDa) / N.perqK) + (p.stato >= 2 ? 0.08 * (p.stato - 1) : 0));
    return Math.min(0.6, pr * (1 - protezione(s, p)) * (haPiano(p, "bunker") ? 0.6 : 1) * sitMult(s, "pq") * (haOggetto(p, "doppiofondo") ? 0.35 : 1));
  }
  // la pista piu' pesante: e' il "perche'" che la polizia ti dice quando ti viene a cercare
  function motivoPolizia(s, p) {
    const ps = piste(s, p).sort((a, b) => b.peso - a.peso);
    return ps.length ? ps[0].testo : "Troppi affari sporchi: in giro si parla di te.";
  }
  // Una perquisizione: la stessa regola all'Alba (nel Palazzo) e al Posto di blocco (in strada).
  // Sequestra il 30% degli sporchi non protetti e gli oggetti illegali. Ritorna null se non trovano niente.
  function perquisisci(s, p, dove) {
    const ill = (p.valigetta || []).filter((o) => oggettoDef(o.id).illegale);
    const salvi = Math.min(p.sporchi || 0, (haPiano(p, "caveau") ? 5_000_000 : 0) + (haOggetto(p, "cassetta") ? 1_000_000 : 0));
    const doppio = haOggetto(p, "doppiofondo"); // la Valigia a doppiofondo: meno contanti presi e gli strumenti restano
    const presi = round(Math.max(0, (p.sporchi || 0) - salvi) * N.perqSequestro * (haPiano(p, "bunker") ? 0.5 : 1) * (doppio ? 0.4 : 1));
    if (!presi && !ill.length) return null; // non trovano niente: la polizia se ne va (ma ti ha guardato)
    const perche = motivoPolizia(s, p);
    p.sporchi -= presi;
    const nascosti = haPiano(p, "piani_segreti") || doppio;
    if (!nascosti) p.valigetta = (p.valigetta || []).filter((o) => !oggettoDef(o.id).illegale);
    p.tracce += 4; p.stato = Math.max(p.stato || 0, 1); p.perquisito = s.ciclo;
    const cosa = (presi ? "Sequestrati " + euro(presi) + " in contanti sporchi" : "Niente contanti trovati") + (ill.length && !nascosti ? " e gli oggetti illegali della valigetta" : "") + "." + (salvi ? " Il caveau e la cassetta salvano " + euro(salvi) + "." : "") + (ill.length && nascosti ? " I piani segreti nascondono la valigetta." : "");
    privato(s, p, (dove === "blocco" ? "Al Posto di blocco la polizia ti perquisisce. " : "All'alba la polizia perquisisce il tuo Palazzo. ") + "Perché: " + perche + " " + cosa);
    fatto(s, p, { k: "perquisizione", testo: "La polizia ha perquisito il tuo Palazzo. " + cosa + " +4 Tracce.", sporchi: -presi, tracce: 4, perche });
    notizia(s, dove === "blocco" ? "Posto di blocco: perquisita l'auto di " + p.nome + ". Sequestrati contanti di dubbia provenienza." : "Perquisizione all'alba nel Palazzo di " + p.nome + ". Sequestrati contanti di dubbia provenienza.", "scandalo");
    return { presi, salvi, oggetti: nascosti ? 0 : ill.length, perche };
  }
  function perquisizioni(s) {
    for (const p of s.players) {
      const pr = rischioPerquisizione(s, p);
      if (!(pr > 0) || rng(s) >= pr) continue;
      perquisisci(s, p, "alba");
    }
  }

  // ------------------------------------------------------------ sette
  // Il livello della setta dipende da cosa FA, non da quanti sono: punti Influenza guadagnati usando il Tesoro
  // (operazioni riuscite, riti, personaggi reclutati, soldi ripuliti con la setta, Grandi Opere).
  function livelloVecchio(s, st) { // il vecchio sistema (membri + Tesoro), serve solo per passare le partite gia' iniziate
    let lv = 1;
    const membri = st.grazia != null && st.grazia >= s.ciclo ? Math.max(3, st.membri.length) : st.membri.length;
    if (st.tesoro >= 3_000_000 && membri >= 3) lv = 2;
    if (st.tesoro >= 8_000_000 && membri >= 3 && (st.pngReclutati || 0) >= 1) lv = 3;
    if (st.tesoro >= 20_000_000 && membri >= 3 && (st.pngReclutati || 0) >= 1) lv = 4;
    if (st.livelloNotificato > lv) lv = Math.min(4, st.livelloNotificato);
    return lv;
  }
  function influenzaDi(s, st) {
    if (!st) return 0;
    if (st.influenza != null) return st.influenza;
    // partita gia' iniziata: l'Influenza parte da Tesoro, operazioni e personaggi, e non e' mai sotto il livello che avevi
    const base = Math.round((st.tesoro || 0) / 1_000_000 + 5 * (st.operazioni || 0) + 6 * (st.pngReclutati || 0));
    return Math.max(base, N.settaInfluenza[livelloVecchio(s, st)]);
  }
  function livelloSetta(s, st) {
    if (!st) return 0;
    const inf = influenzaDi(s, st); let lv = 1;
    for (let i = 2; i <= 4; i++) if (inf >= N.settaInfluenza[i]) lv = i;
    return lv;
  }
  function guadagnaInfluenza(s, st, punti, motivo) {
    if (!st || !(punti > 0)) return;
    const prima = livelloSetta(s, st);
    st.influenza = Math.round((influenzaDi(s, st) + punti) * 10) / 10;
    st.infLog = st.infLog || []; st.infLog.push({ ciclo: s.ciclo, punti: Math.round(punti * 10) / 10, motivo }); if (st.infLog.length > 10) st.infLog.splice(0, st.infLog.length - 10);
    const dopo = livelloSetta(s, st);
    if (dopo > prima) { st.livelloNotificato = dopo; for (const id of st.membri) privato(s, giocatore(s, id), "La setta \"" + st.nome + "\" sale al livello " + dopo + " (" + Math.round(st.influenza) + " punti Influenza)."); }
  }
  // perdere Influenza (v76): non si scende mai sotto la soglia del livello che la setta ha adesso
  function perdiInfluenza(s, st, punti, motivo) {
    if (!st || !(punti > 0)) return 0;
    const inf = influenzaDi(s, st), pavimento = N.settaInfluenza[livelloSetta(s, st)] || 0;
    const dopo = Math.max(pavimento, Math.round((inf - punti) * 10) / 10), perso = Math.round((inf - dopo) * 10) / 10;
    st.influenza = dopo;
    if (perso > 0) { st.infLog = st.infLog || []; st.infLog.push({ ciclo: s.ciclo, punti: -perso, motivo }); if (st.infLog.length > 10) st.infLog.splice(0, st.infLog.length - 10); }
    return perso;
  }
  // ---- le Grandi Opere: costano tanto dal Tesoro e si fanno solo se i membri votano a favore
  const OPERE = {
    amnistia: { nome: "L'Amnistia", costo: 12_000_000, lv: 2,
      fa: "Tutti i membri: condanne cancellate (si riparte senza precedenti), indagini chiuse, chi è al Faro esce, il 70% delle Tracce sparisce.",
      rischio: "Tutta la Laguna ne parla: ogni membro perde 8 di fama, e per 2 Cicli la Procura vi guarda: ogni Traccia nuova pesa il 30% in più." },
    porto: { nome: "Il Porto è nostro", costo: 10_000_000, lv: 2,
      fa: "Per 3 Cicli, di notte al Porto Container i membri fanno affari senza nessun pericolo (niente pattuglie, niente guardie).",
      rischio: "Alla fine, 1 volta su 4 il doganiere comprato parla: ogni membro prende +15 Tracce e la polizia lo tiene d'occhio." },
    colpo: { nome: "Il Grande Colpo", costo: 15_000_000, lv: 3, bottino: 45_000_000,
      fa: "All'Alba la setta assalta il caveau della Banca della Laguna. Se riesce: 45 milioni sporchi divisi in parti uguali tra i membri.",
      rischio: "Riesce 45 volte su 100 (fino a 65 con il Commissario e 4 membri). Se fallisce: il Tesoro speso è perso, ogni membro +35 Tracce e finisce Indagato. Anche se riesce: +12 Tracce a testa." },
    giudice: { nome: "Il Giudice supremo", costo: 20_000_000, lv: 3,
      fa: "Per tutta la partita: ogni condanna dei membri scende di un gradino in più e metà degli sporchi si salva dalla confisca.",
      rischio: "A ogni Alba, 1 volta su 15 un giornalista lo scopre: il Giudice cade, ogni membro prende +15 Tracce e perde 10 di fama." },
    isola: { nome: "L'Isola della setta", costo: 30_000_000, lv: 3,
      fa: "Un'isola privata con i suoi traffici: a ogni Alba ogni membro riceve 800.000 € sporchi e il Tesoro 1,5 milioni.",
      rischio: "A ogni Alba, 1 volta su 8, blitz della Finanza: niente soldi quell'Alba e +10 Tracce a ogni membro. Al secondo blitz l'isola è sequestrata." },
  };
  function costoOpera(st, id) { return round(OPERE[id].costo * (st.membri.length <= 1 ? 1.5 : 1)); }
  function operaAttiva(s, p, id) {
    for (const sid of p.sette || []) { const st = s.sette.find((x) => x.id === sid); if (st && st.attive && st.attive[id] && (st.attive[id].fino == null || st.attive[id].fino >= s.ciclo)) return st; }
    return null;
  }
  function proponiOpera(s, p, idSetta, id) {
    const st = settaMia(s, p, idSetta), O = OPERE[id]; if (!O) err("Grande Opera sconosciuta.");
    if (st.opera) err("C'è già una Grande Opera da votare: \"" + OPERE[st.opera.id].nome + "\".");
    if ((st.opereFatte || []).includes(id)) err("La setta ha già fatto " + O.nome + ".");
    if (livelloSetta(s, st) < O.lv) err(O.nome + " richiede una setta di livello " + O.lv + ".");
    const costo = costoOpera(st, id); if (st.tesoro < costo) err("Il Tesoro non basta: servono " + euro(costo) + ".");
    st.opera = { id, ciclo: s.ciclo, voti: {}, costo, solo: st.membri.length <= 1 };
    if (st.opera.solo) privato(s, p, "Sei l'unico membro: decidi da solo. " + O.nome + " parte all'Alba e costa " + euro(costo) + " (il 50% in più).");
    else for (const id2 of st.membri) privato(s, giocatore(s, id2), id2 === p.id ? "Hai proposto " + O.nome + " (" + euro(costo) + " dal Tesoro). I membri votano fino all'Alba." : "Il Gran Maestro propone una Grande Opera: " + O.nome + " (" + euro(costo) + " dal Tesoro). Vota sì o no dall'app Setta entro l'Alba.");
  }
  function ritiraOpera(s, p, idSetta) { const st = settaMia(s, p, idSetta); if (!st.opera) err("Nessuna proposta."); st.opera = null; for (const id of st.membri) privato(s, giocatore(s, id), "Il Gran Maestro ha ritirato la proposta della Grande Opera."); }
  function votaOpera(s, p, idSetta, si, motivo) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    if (!st.opera) err("Non c'è niente da votare.");
    if (st.gm === p.id) err("Il Gran Maestro propone: votano gli altri membri (a parità decide lui).");
    if (st.opera.promessi && st.opera.promessi[p.id]) { const q = s.players.find((x) => x.id === st.opera.promessi[p.id]); err("Il tuo voto è promesso a " + (q ? q.nome : "un altro") + "."); }
    st.opera.voti[p.id] = !!si;
    if (motivo) msgSetta(s, p, idSetta, (si ? "Voto SÌ: " : "Voto NO: ") + String(motivo).slice(0, 120));
  }
  function contaVoti(st) {
    let si = 0, no = 0;
    for (const id of st.membri) { if (id === st.gm) continue; const v = st.opera.voti[id]; if (v === true) si++; else if (v === false) no++; }
    return { si, no, passa: st.opera.solo || si >= no };
  }
  function albaOpere(s, r) {
    for (const st of s.sette) {
      // le opere gia' attive
      const at = st.attive || {};
      const membri = st.membri.map((id) => giocatore(s, id));
      if (at.porto && at.porto.fino <= s.ciclo && !at.porto.chiuso) {
        at.porto.chiuso = true;
        if (rng(s) < 0.25) { for (const m of membri) { m.tracce += 15; m.stato = Math.max(m.stato, 1); privato(s, m, "Il Porto non è più vostro, e il doganiere ha parlato: +15 Tracce, la polizia ti tiene d'occhio."); } notizia(s, "Il doganiere del Porto Container parla con la Procura: \"Per settimane certe navi non le ho controllate.\"", "scandalo"); }
        else for (const m of membri) privato(s, m, "Il Porto è nostro: i 3 Cicli sono finiti. Il doganiere tiene la bocca chiusa.");
      }
      if (at.giudice && !at.giudice.caduto && rng(s) < 1 / 15) {
        at.giudice.caduto = true; at.giudice.fino = s.ciclo - 1;
        for (const m of membri) { m.tracce += 15; m.fama = Math.max(0, m.fama - 10); privato(s, m, "Un giornalista ha scoperto il Giudice supremo della setta. Il Giudice cade: +15 Tracce e −10 fama."); }
        notizia(s, "Scandalo in tribunale: un giudice prendeva ordini da una setta segreta.", "scandalo");
      }
      if (at.isola && !at.isola.sequestrata) {
        if (rng(s) < 1 / 8) {
          at.isola.blitz = (at.isola.blitz || 0) + 1;
          for (const m of membri) { m.tracce += 10; privato(s, m, at.isola.blitz >= 2 ? "Secondo blitz della Finanza: l'Isola della setta è sequestrata. +10 Tracce." : "Blitz della Finanza sull'Isola della setta: stanotte niente traffici, +10 Tracce. Al prossimo blitz la perdete."); }
          if (at.isola.blitz >= 2) { at.isola.sequestrata = true; at.isola.fino = s.ciclo - 1; }
          notizia(s, "Blitz della Finanza su un'isola privata della Laguna. Nessuno sa di chi sia.", "scandalo");
        } else {
          st.tesoro += 1_500_000;
          for (const m of membri) { m.sporchi += 800_000; m.pulitoCiclo = false; m.macchia = true; if (r[m.id]) r[m.id].isolaSetta = 800_000; }
        }
      }
      // la proposta da votare
      const op = st.opera; if (!op) continue;
      st.opera = null;
      const O = OPERE[op.id], gm = giocatore(s, st.gm), v = contaVoti({ ...st, opera: op });
      const dire = (t) => { for (const m of membri) privato(s, m, t); };
      if (!v.passa) { st.opBocciate = (st.opBocciate || 0) + 1; dire("Grande Opera \"" + O.nome + "\": bocciata (" + v.si + " sì, " + v.no + " no). Il Tesoro resta com'è."); continue; }
      if (st.tesoro < op.costo) { dire("Grande Opera \"" + O.nome + "\": approvata, ma nel Tesoro non ci sono più " + euro(op.costo) + ". Non si fa."); continue; }
      st.tesoro -= op.costo; st.opereFatte = st.opereFatte || []; st.opereFatte.push(op.id); st.opPassate = (st.opPassate || 0) + 1;
      st.attive = st.attive || {};
      const voti = op.solo ? "decisa dal Gran Maestro" : v.si + " sì, " + v.no + " no" + (v.si === v.no ? ", decide il Gran Maestro" : "");
      guadagnaInfluenza(s, st, op.costo / 1_000_000, O.nome);
      if (op.id === "amnistia") {
        st.attive.amnistia = { dal: s.ciclo, fino: s.ciclo + 2 };
        for (const m of membri) { m.condanne = 0; m.stato = 0; m.peggiorReato = null; m.tracce = round(m.tracce * 0.3); m.faro = 0; m.fama = Math.max(0, m.fama - 8); privato(s, m, "L'Amnistia (" + voti + "): fedina pulita, indagini chiuse, il 70% delle Tracce sparisce. Ma per 2 Cicli la Procura vi guarda: ogni Traccia nuova pesa il 30% in più."); }
        notizia(s, "Amnistia a sorpresa: cancellate le condanne di alcuni nomi illustri. La Laguna mormora.", "politica");
      } else if (op.id === "porto") {
        st.attive.porto = { dal: s.ciclo + 1, fino: s.ciclo + 3 };
        dire("Il Porto è nostro (" + voti + "): per i prossimi 3 Cicli, di notte al Porto Container, i membri lavorano senza pericoli.");
        notizia(s, "Al Porto Container cambiano i turni dei doganieri. Nessuno sa chi l'abbia deciso.", "voce");
      } else if (op.id === "colpo") {
        const commiss = st.commissario ? 0.1 : 0, piu = Math.min(0.1, 0.05 * Math.max(0, st.membri.length - 2));
        const ok = rng(s) < 0.45 + commiss + piu;
        if (ok) {
          const parte = round(O.bottino / membri.length);
          for (const m of membri) { m.sporchi += parte; m.tracce += 12; m.pulitoCiclo = false; m.macchia = true; m.peggiorReato = peggio(m.peggiorReato, "grave"); privato(s, m, "IL GRANDE COLPO (" + voti + ") è riuscito! Il caveau della Banca della Laguna è vuoto. La tua parte: " + euro(parte) + " sporchi. +12 Tracce."); }
          notizia(s, "SVALIGIATO IL CAVEAU DELLA BANCA DELLA LAGUNA. Spariti 45 milioni. La polizia brancola nel buio.", "scandalo");
        } else {
          for (const m of membri) {
            const contro = !op.solo && op.voti[m.id] === false; // chi aveva votato NO paga la meta'
            const tr = contro ? 18 : 35;
            m.tracce += tr; m.stato = Math.max(m.stato, contro ? 2 : 3); m.peggiorReato = peggio(m.peggiorReato, contro ? "media" : "grave"); segnaTraccia(s, m, tr, "il Grande Colpo fallito della setta");
            privato(s, m, "Il Grande Colpo (" + voti + ") è fallito: allarmi, sirene, fuga a mani vuote. Il Tesoro speso è perso. " + (contro ? "Avevi votato NO: paghi la metà. +18 Tracce e sei Osservato." : "+35 Tracce e sei Indagato."));
            fatto(s, m, { k: "colpo", testo: "Il Grande Colpo della setta è fallito: +" + tr + " Tracce" + (contro ? " (la metà: avevi votato NO)." : ", sei Indagato."), tracce: tr });
          }
          notizia(s, "Assalto fallito al caveau della Banca della Laguna. La polizia ha dei nomi.", "scandalo");
        }
      } else if (op.id === "giudice") {
        st.attive.giudice = { dal: s.ciclo, fino: null };
        dire("Il Giudice supremo (" + voti + ") ora è della setta: condanne più leggere di un gradino in più, e metà degli sporchi si salva dalla confisca.");
      } else if (op.id === "isola") {
        st.attive.isola = { dal: s.ciclo, fino: null, blitz: 0 };
        dire("L'Isola della setta (" + voti + ") è vostra. Da domani, a ogni Alba: 800.000 € sporchi a ogni membro e 1,5 milioni al Tesoro.");
        notizia(s, "Un'isola privata della Laguna è stata venduta a una società senza nome.", "voce");
      }
    }
  }
  // la Lavanderia della setta: un membro passa i suoi sporchi alla setta, la setta gli rende il 70% puliti dal Tesoro
  function lavaSetta(s, p, idSetta, importo) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    const max = 1_000_000 * livelloSetta(s, st), gia = p.lavatoCiclo === s.ciclo ? p.lavato || 0 : 0;
    importo = round(Number(importo) || 0); if (importo < 100_000) err("Almeno 100.000 €.");
    if (gia + importo > max) err("Con una setta di livello " + livelloSetta(s, st) + " ripulisci al massimo " + euro(max) + " per Ciclo (ti restano " + euro(Math.max(0, max - gia)) + ").");
    if (p.sporchi < importo) err("Non hai " + euro(importo) + " sporchi.");
    const resa = round(importo * 0.7); if (st.tesoro < resa) err("Il Tesoro non ha " + euro(resa) + " puliti da darti in cambio.");
    p.sporchi -= importo; st.tesoro += importo - resa; p.cash += resa; p.lavato = gia + importo; p.lavatoCiclo = s.ciclo;
    p.tracce += 2 * importo / 1_000_000; p.riciclTot = (p.riciclTot || 0) + importo; p.pulitoCiclo = false; p.macchia = true;
    guadagnaInfluenza(s, st, importo / 1_000_000, "Lavanderia (" + p.nome + ")");
    privato(s, p, "La setta ha ripulito " + euro(importo) + ": a te " + euro(resa) + " puliti, " + euro(importo - resa) + " restano nel Tesoro.");
  }
  function fondaSetta(s, p, nome, motto) {
    inNotte(s, p);
    if (p.settaFondata) err("Hai già fondato una setta.");
    if ((p.sette || []).length) err("Sei già in una setta: per fondarne una tua devi prima uscire.");
    if (marchiato(s, p)) err("Hai venduto una setta: fino al Ciclo " + (p.marchiatoFino + 1) + " nessuno ti segue in una setta nuova.");
    if (p.sporchi < N.settaSporchi) err("Per fondare una setta servono almeno " + euro(N.settaSporchi) + " in soldi sporchi.");
    if (!nome) err("Dai un nome alla setta.");
    p.sporchi -= N.settaCosto; // il patto di sangue: una parte va nel tesoro, il resto nel rito
    const st = { id: "s" + s.prossimoId++, nome: String(nome).slice(0, 40), motto: String(motto || "").slice(0, 80), gm: p.id, membri: [p.id], tesoro: N.settaTesoroIniziale, operazioni: 0, pngReclutati: 0, influenza: 0, ingressi: {} };
    s.sette.push(st); p.sette.push(st.id); p.settaFondata = st.id;
    privato(s, p, "Hai fondato la setta \"" + st.nome + "\". Sei il Gran Maestro. Invita altri membri.");
    notizia(s, "Strani simboli compaiono sui muri della Laguna. Qualcuno dice che è nata una nuova setta.", "voce");
  }
  // offerta > 0: regalo dal Tesoro a chi entra · offerta < 0: quota d'ingresso che paga chi entra
  function invitaSetta(s, p, idSetta, idInvitato, offerta) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro invita.");
    const q = giocatore(s, idInvitato); if (!q || q.id === p.id) err("Scegli chi invitare.");
    if (st.membri.includes(idInvitato)) err("È già un membro.");
    if (marchiato(s, q)) err(q.nome + " ha venduto una setta: fino al Ciclo " + (q.marchiatoFino + 1) + " nessuna setta lo prende.");
    offerta = Math.round(Number(offerta) || 0);
    if (Math.abs(offerta) > N.settaOffertaMax) err("L'offerta può essere al massimo di " + euro(N.settaOffertaMax) + ".");
    if (offerta > st.tesoro) err("Il Tesoro della setta non ha " + euro(offerta) + " da regalare.");
    s.inviti = s.inviti.filter((x) => !(x.setta === idSetta && x.a === idInvitato)); // un nuovo invito sostituisce il vecchio
    s.inviti.push({ setta: idSetta, a: idInvitato, da: p.id, offerta, ciclo: s.ciclo });
    const patto = offerta > 0 ? " Se entri, ricevi " + euro(offerta) + " in soldi sporchi." : offerta < 0 ? " Per entrare chiedono una quota di " + euro(-offerta) + "." : "";
    privato(s, q, "Hai ricevuto un invito segreto da una setta: \"" + st.nome + "\"." + patto + " Rispondi dall'app Setta.");
  }
  function rispondiInvito(s, p, idSetta, si, motivo) {
    const i = s.inviti.findIndex((x) => x.setta === idSetta && x.a === p.id); if (i < 0) err("Nessun invito.");
    const inv = s.inviti[i];
    const st = s.sette.find((x) => x.id === idSetta);
    const gm = st ? giocatore(s, st.gm) : null;
    if (!si || !st) { s.inviti.splice(i, 1); if (gm && st) privato(s, gm, p.nome + " ha rifiutato l'invito nella tua setta." + (motivo ? " " + String(motivo).slice(0, 120) : "")); return; }
    const off = inv.offerta || 0;
    if (off > 0 && st.tesoro < off) { s.inviti.splice(i, 1); privato(s, p, "Il Tesoro della setta non ha più i soldi promessi: l'invito non vale più."); privato(s, gm, "L'invito a " + p.nome + " è saltato: nel Tesoro mancano i soldi promessi."); return; }
    if (marchiato(s, p)) err("Hai venduto una setta: fino al Ciclo " + (p.marchiatoFino + 1) + " nessuna setta ti prende.");
    if (off < 0 && p.sporchi + p.cash < -off) err("Non hai abbastanza soldi per la quota d'ingresso (" + euro(-off) + ").");
    s.inviti.splice(i, 1);
    if (off > 0) { st.tesoro -= off; p.sporchi += off; }
    let quotaSporchi = 0;
    if (off < 0) { const daSporchi = Math.min(p.sporchi, -off); p.sporchi -= daSporchi; p.cash -= -off - daSporchi; st.tesoro += -off; quotaSporchi = daSporchi; }
    st.membri.push(p.id); p.sette.push(idSetta);
    // il patto: resta scritto quando sei entrato e con quali soldi (serve se esci o ti cacciano presto)
    st.ingressi = st.ingressi || {}; st.ingressi[p.id] = { ciclo: s.ciclo, regalo: off > 0 ? off : 0, quota: off < 0 ? -off : 0, quotaSporchi: quotaSporchi };
    const patto = off > 0 ? " Il patto: se esci o ti cacciano entro " + PATTO_CICLI + " Cicli, restituisci il regalo." : off < 0 ? " Il patto: se ti cacciano entro " + PATTO_CICLI + " Cicli, la quota ti torna indietro. Se esci tu, la perdi." : "";
    privato(s, p, "Sei entrato nella setta \"" + st.nome + "\"." + (off > 0 ? " Ricevi " + euro(off) + " in soldi sporchi." : off < 0 ? " Hai pagato la quota di " + euro(-off) + "." : "") + patto + " Da ora il " + Math.round(N.decima * 100) + "% delle tue rendite va al Tesoro.");
    privato(s, gm, p.nome + " è entrato nella tua setta." + (off < 0 ? " La quota di " + euro(-off) + " è nel Tesoro." : ""));
  }
  // Il patto d'ingresso e' vincolante (ILL-09): chi esce o e' cacciato entro PATTO_CICLI Cicli restituisce il regalo
  // (dagli sporchi, poi dai puliti, poi a debito); chi e' cacciato cosi' presto riprende la quota che aveva pagato.
  const PATTO_CICLI = 2;
  function sciogliPatto(s, st, m, cacciato) {
    const g = st.ingressi && st.ingressi[m.id];
    if (st.ingressi) delete st.ingressi[m.id];
    if (!g || s.ciclo - g.ciclo >= PATTO_CICLI) return;
    if (g.regalo > 0) {
      const ds = Math.min(m.sporchi, g.regalo); m.sporchi -= ds;
      if (g.regalo - ds > 0) paga(s, m, g.regalo - ds, null);
      st.tesoro += g.regalo;
      privato(s, m, "Il patto era chiaro: sei rimasto nella setta meno di " + PATTO_CICLI + " Cicli. Restituisci il regalo d'ingresso di " + euro(g.regalo) + (g.regalo - ds > 0 ? " (" + euro(ds) + " dagli sporchi, il resto dai tuoi soldi puliti o a debito)." : "."));
      privato(s, giocatore(s, st.gm), m.nome + " era nella setta da meno di " + PATTO_CICLI + " Cicli: il regalo d'ingresso di " + euro(g.regalo) + " torna nel Tesoro.");
    } else if (g.quota > 0 && cacciato) {
      const q = Math.min(st.tesoro, g.quota), qs = Math.min(q, g.quotaSporchi || 0);
      st.tesoro -= q; m.sporchi += qs; m.cash += q - qs;
      privato(s, m, "Ti hanno cacciato prima di " + PATTO_CICLI + " Cicli: per il patto la quota d'ingresso ti torna indietro (" + euro(q) + ").");
      privato(s, giocatore(s, st.gm), "Hai cacciato " + m.nome + " prima di " + PATTO_CICLI + " Cicli: per il patto la sua quota (" + euro(q) + ") esce dal Tesoro e torna a lui.");
    }
  }
  function espelliSetta(s, p, idSetta, idMembro) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro caccia i membri.");
    if (idMembro === p.id) err("Il Gran Maestro non può cacciare se stesso.");
    if (!st.membri.includes(idMembro)) err("Non è un membro.");
    const m = giocatore(s, idMembro);
    if (st.membri.length >= 3) st.grazia = s.ciclo + 1; st.membri = st.membri.filter((x) => x !== idMembro); m.sette = m.sette.filter((x) => x !== idSetta);
    privato(s, m, "Sei stato cacciato dalla setta \"" + st.nome + "\". Perdi tutti i suoi privilegi.");
    sciogliPatto(s, st, m, true);
    privato(s, p, m.nome + " non fa più parte della setta.");
    for (const id of st.membri) if (id !== p.id) privato(s, giocatore(s, id), m.nome + " è stato cacciato dalla setta.");
  }
  function lasciaSetta(s, p, idSetta) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    if (st.gm === p.id) err("Il Gran Maestro non può lasciare la sua setta.");
    if (st.membri.length >= 3) st.grazia = s.ciclo + 1; st.membri = st.membri.filter((x) => x !== p.id); p.sette = p.sette.filter((x) => x !== idSetta);
    privato(s, p, "Hai lasciato la setta \"" + st.nome + "\".");
    sciogliPatto(s, st, p, false);
    privato(s, giocatore(s, st.gm), p.nome + " ha lasciato la tua setta.");
  }
  function versaSetta(s, p, idSetta, importo, sporchi) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    importo = Math.floor(importo || 0); if (importo <= 0) err("Importo non valido.");
    if (sporchi) { if (p.sporchi < importo) err("Non hai abbastanza sporchi."); }
    else if (p.cash < importo) err("Non hai abbastanza soldi.");
    // sette nate prima della v59 (senza punti Influenza): il valore si ferma qui, PRIMA del versamento.
    // Cosi' i soldi versati non fanno mai salire di livello: l'Influenza si guadagna solo usando il Tesoro.
    if (st.influenza == null) st.influenza = influenzaDi(s, st);
    if (sporchi) {
      p.sporchi -= importo;
      // nascondere gli sporchi nel Tesoro lascia Tracce, come ripulirli (ILL-11)
      const tr = TRACCE_PASSAMANO * importo / 1_000_000; p.tracce += tr; p.pulitoCiclo = false; p.macchia = true; segnaTraccia(s, p, tr, "i soldi sporchi versati nel Tesoro della setta");
    } else p.cash -= importo;
    st.tesoro += importo;
  }
  const TRACCE_PASSAMANO = 2; // Tracce per ogni milione di sporchi che cambia mano (versato nel Tesoro, regalato, ricevuto)
  // la chat della setta: la leggono solo i membri
  function msgSetta(s, p, idSetta, testo) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    testo = String(testo || "").trim().slice(0, 160); if (!testo) err("Scrivi qualcosa.");
    st.chat = st.chat || []; st.chat.push({ da: p.id, nome: p.nome, testo, ciclo: s.ciclo, notte: s.fase === "notte" });
    if (st.chat.length > 40) st.chat.splice(0, st.chat.length - 40);
  }
  // la convocazione: il Gran Maestro sceglie un posto e un'ora di stanotte; il messaggio arriva solo ai membri
  function convoca(s, p, idSetta, luogo, ora) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro convoca la setta.");
    if (!LUOGHI[luogo] || luogo === "palazzo") err("Scegli un posto della Laguna.");
    ora = Math.floor(Number(ora)); if (!(ora >= 1 && ora <= 5)) err("Scegli un'ora tra le 23 e le 3.");
    if (s.fase === "notte" && s.notte && ora <= s.notte.ora) err("Quell'ora è già passata.");
    st.convocazione = { ciclo: s.ciclo, luogo, ora, fatto: false };
    for (const id of st.membri) privato(s, giocatore(s, id), (id === p.id ? "Hai convocato" : "Il Gran Maestro convoca") + " la setta \"" + st.nome + "\": stanotte alle " + ORE[ora] + ", " + LUOGHI[luogo].nome + "." + (id === p.id ? "" : " Chi viene partecipa al rito."));
  }
  // sotto il cappuccio (v76): stanotte, nel posto della convocazione, un membro che non e' il Gran Maestro
  // non vede chi sono gli altri confratelli (Gran Maestro compreso). Torna gli id da nascondere a p.
  function incappucciatiPer(s, p) {
    const N2 = s.notte; if (!N2 || N2.viaggio[p.id]) return [];
    const via = new Set();
    for (const id of p.sette || []) {
      const st = s.sette.find((x) => x.id === id), c = st && st.convocazione;
      if (!c || c.ciclo !== s.ciclo || st.gm === p.id || N2.dove[p.id] !== c.luogo) continue;
      for (const m of st.membri) if (m !== p.id && N2.dove[m] === c.luogo) via.add(m);
    }
    return [...via];
  }
  function convocazioneDi(s, p) { // la convocazione di stanotte per una setta di cui p fa parte
    for (const id of p.sette || []) { const st = s.sette.find((x) => x.id === id); const c = st && st.convocazione; if (c && c.ciclo === s.ciclo && !c.fatto) return { st, c }; }
    return null;
  }
  // il rito: chi e' al posto giusto all'ora giusta si fa cancellare un po' di Tracce e stanotte e' protetto
  // il giro in jet: se il Gran Maestro ha il jet, dall'ora prima della convocazione i membri ci arrivano subito
  function jetSetta(s, p, idSetta) {
    oraLibera(s, p);
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id) || st.gm === p.id) err("Il jet è per i confratelli.");
    const c = st.convocazione; if (!c || c.ciclo !== s.ciclo || c.fatto) err("Stanotte non c'è una convocazione.");
    if (!giocatore(s, st.gm).veicoli.includes("jet")) err("Il Gran Maestro non ha il jet.");
    if (s.notte.ora < c.ora - 1) err("Il jet parte un'ora prima del rito.");
    if (s.notte.dove[p.id] === c.luogo) err("Sei già lì.");
    s.notte.dove[p.id] = c.luogo;
    racconta(s, p, "Un'auto nera ti porta alla pista. Il jet della setta \"" + st.nome + "\" decolla, gira sopra la Laguna illuminata e atterra vicino a " + LUOGHI[c.luogo].nome + ". Sei arrivato per il rito.");
  }
  function rito(s, p, idSetta) {
    oraLibera(s, p);
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro celebra il rito.");
    const c = st.convocazione; if (!c || c.ciclo !== s.ciclo || c.fatto) err("Stanotte non hai convocato la setta.");
    const N2 = s.notte;
    if (N2.dove[p.id] !== c.luogo) err("Il rito si fa a " + LUOGHI[c.luogo].nome + ".");
    if (N2.ora < c.ora) err("È presto: hai convocato la setta alle " + ORE[c.ora] + ".");
    const presenti = [p, ...quiConMe(s, p).filter((x) => st.membri.includes(x.id))];
    if (presenti.length < 2) err("Non è ancora arrivato nessun confratello.");
    const costoRito = 250_000 * presenti.length;
    if (st.tesoro < costoRito) err("Il rito costa " + euro(costoRito) + " dal Tesoro (250.000 € a persona): nel Tesoro non bastano.");
    st.tesoro -= costoRito; c.fatto = true;
    guadagnaInfluenza(s, st, Math.min(7, 1 + presenti.length), "Rito (" + presenti.length + " presenti)");
    N2.rito = N2.rito || {};
    for (const m of presenti) {
      m.tracce = Math.max(0, m.tracce - 8); m.fama += 2; N2.rito[m.id] = true;
      // v76: i nomi dei presenti li sa solo il Gran Maestro; gli altri sanno solo quanti sono
      const chi = m.id === st.gm ? presenti.map((x) => x.nome).join(", ") + " sotto lo stesso cappuccio." : "Siete in " + presenti.length + " sotto il cappuccio.";
      racconta(s, m, "Il rito della setta \"" + st.nome + "\". " + chi + " Qualcuno fa sparire un po' delle tue Tracce, e per il resto della notte la setta ti copre: meno pericoli negli affari.");
    }
    const assenti = st.membri.filter((id) => !presenti.some((x) => x.id === id)).map((id) => giocatore(s, id).nome);
    if (assenti.length) racconta(s, p, "Non si sono presentati: " + assenti.join(", ") + ".");
    for (const id of st.membri) if (!presenti.some((x) => x.id === id)) privato(s, giocatore(s, id), "Stanotte non eri al rito della setta. Il Gran Maestro se n'è accorto.");
    N2.chiuso[p.id] = true; controllaOra(s);
  }
  // ---- il Tesoro sepolto: al Faro il Gran Maestro nasconde una parte del Tesoro. Non conta per il livello,
  // ma la Finanza e i traditori non lo trovano. Chi lo segue di notte pero' scopre il nascondiglio.
  function settaMia(s, p, idSetta) { const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro."); return st; }
  function seppellisci(s, p, idSetta, importo, indietro) {
    oraLibera(s, p);
    if (s.notte.dove[p.id] !== "faro") err("Il Tesoro si nasconde al Faro.");
    const st = settaMia(s, p, idSetta);
    importo = round(Number(importo) || 0); if (importo <= 0) err("Scegli quanto.");
    if (!indietro) {
      if (importo > st.tesoro) err("Nel Tesoro non ci sono " + euro(importo) + ".");
      st.tesoro -= importo; st.sepolto = (st.sepolto || 0) + importo;
      racconta(s, p, "Sotto la scogliera, al buio, sotterri " + euro(importo) + " del Tesoro. Nessuno li troverà. Spero.");
      for (const [chi, seguito] of Object.entries(s.notte.segue || {})) if (seguito === p.id && chi !== p.id) {
        const q = giocatore(s, chi); q.nascondigli = q.nascondigli || []; if (!q.nascondigli.includes(st.id)) q.nascondigli.push(st.id);
        racconta(s, q, "Dietro una roccia vedi " + p.nome + " scavare sotto la scogliera del Faro. Ora sai dove la setta nasconde i soldi.");
      }
    } else {
      if (importo > (st.sepolto || 0)) err("Sotto terra ci sono solo " + euro(st.sepolto || 0) + ".");
      st.sepolto -= importo; st.tesoro += importo;
      racconta(s, p, "Dissotterri " + euro(importo) + " e li rimetti nel Tesoro.");
    }
  }
  function scava(s, p, idSetta) {
    oraLibera(s, p); qui(s, p, "faro", "Scavare sotto la scogliera");
    const st = s.sette.find((x) => x.id === idSetta);
    if (!st || !(p.nascondigli || []).includes(idSetta)) err("Non sai dove scavare.");
    p.nascondigli = p.nascondigli.filter((x) => x !== idSetta);
    const preso = round((st.sepolto || 0) * 0.5);
    st.sepolto -= preso; p.sporchi += preso; p.tracce += 15;
    racconta(s, p, preso ? "Scavi nel buio finché la pala tocca il metallo. Ti porti via " + euro(preso) + " in contanti sporchi." : "Scavi, ma la buca è vuota: qualcuno è arrivato prima.");
    if (preso) { privato(s, giocatore(s, st.gm), "Qualcuno ha scavato sotto la scogliera del Faro: mancano " + euro(preso) + " dal Tesoro sepolto."); notizia(s, "Una buca fresca sotto la scogliera del Faro. I pescatori giurano di aver visto una pala, nella notte.", "voce"); }
    s.notte.chiuso[p.id] = true; controllaOra(s);
  }
  // ---- il Traditore: un membro vende la setta alla polizia. Succede all'Alba, a meno che il Gran Maestro lo scopra prima.
  function tradisci(s, p, idSetta) {
    const st = s.sette.find((x) => x.id === idSetta); if (!st || !st.membri.includes(p.id)) err("Non sei in questa setta.");
    if (st.gm === p.id) err("Il Gran Maestro non tradisce la sua setta.");
    if (st.tradimento) err("Qualcuno ha già parlato con la polizia.");
    { const g = st.ingressi && st.ingressi[p.id]; if (g && g.ciclo >= s.ciclo) err("Sei entrato da troppo poco: la polizia vuole uno che sa. Devi essere nella setta da almeno un'Alba."); }
    st.tradimento = { da: p.id, ciclo: s.ciclo };
    // il Gran Maestro ha un indizio (non il nome): cosi' la Prova di fedelta' e' una scelta, non una lotteria
    if (st.membri.length > 2) privato(s, giocatore(s, st.gm), "Vera: \"Un confratello della setta «" + st.nome + "» ha fatto una telefonata strana. Non so chi. Se è un traditore, all'Alba la polizia sa tutto. Con una Prova di fedeltà (" + euro(costoProvaFedelta(s, st)) + " dal Tesoro) puoi controllarne uno.\"");
    privato(s, p, "Hai chiamato un numero che non avresti dovuto conoscere. All'Alba la polizia avrà tutto sulla setta \"" + st.nome + "\": tu prendi un premio e ti cancellano molte Tracce. Se il Gran Maestro ti scopre prima con una Prova di fedeltà, sei finito.");
  }
  // quanto costa la prossima Prova di fedelta' (v76): il 10% del Tesoro, almeno 2 milioni;
  // nello stesso Ciclo la seconda costa il doppio, la terza il quadruplo (st.prove = { ciclo, n })
  const PROVA_FEDELTA_MIN = 2_000_000, PROVA_FEDELTA_PCT = 0.1, PROVA_FEDELTA_INFLUENZA = 3;
  function costoProvaFedelta(s, st) {
    const n = st.prove && st.prove.ciclo === s.ciclo ? st.prove.n || 0 : 0;
    return Math.max(PROVA_FEDELTA_MIN, round((st.tesoro || 0) * PROVA_FEDELTA_PCT)) * Math.pow(2, n);
  }
  function provaFedelta(s, p, idSetta, idMembro) {
    const st = settaMia(s, p, idSetta);
    if (!st.membri.includes(idMembro) || idMembro === p.id) err("Scegli un membro.");
    const costo = costoProvaFedelta(s, st); if (st.tesoro < costo) err("La Prova di fedeltà costa " + euro(costo) + " dal Tesoro.");
    st.tesoro -= costo;
    st.prove = { ciclo: s.ciclo, n: (st.prove && st.prove.ciclo === s.ciclo ? st.prove.n || 0 : 0) + 1 };
    const m = giocatore(s, idMembro);
    privato(s, m, "Il Gran Maestro ti ha messo alla prova.");
    if (st.tradimento && st.tradimento.da === idMembro) {
      st.tradimento = null;
      if (st.membri.length >= 3) st.grazia = s.ciclo + 1; st.membri = st.membri.filter((x) => x !== idMembro); m.sette = m.sette.filter((x) => x !== idSetta);
      m.tracce += 20; m.stato = Math.max(m.stato, 1); segnaTraccia(s, m, 20, "i segreti che la setta ha passato alla polizia");
      sciogliPatto(s, st, m, false);
      privato(s, p, "La Prova di fedeltà parla chiaro: " + m.nome + " stava vendendo la setta alla polizia. È fuori, e la setta ha fatto arrivare alla polizia le sue Tracce.");
      privato(s, m, "Il Gran Maestro ti ha scoperto. Sei fuori dalla setta, e qualcuno ha fatto arrivare alla polizia i tuoi segreti.");
      for (const id of st.membri) if (id !== p.id) privato(s, giocatore(s, id), m.nome + " ha tradito la setta ed è stato scoperto.");
    } else {
      const perso = perdiInfluenza(s, st, PROVA_FEDELTA_INFLUENZA, "Prova di fedeltà inutile su " + m.nome);
      privato(s, p, "La Prova di fedeltà su " + m.nome + ": è fedele. Ma l'ha capito, e la setta ne parla: " + (perso > 0 ? "−" + perso + " Influenza." : "per fortuna il livello della setta tiene."));
      privato(s, m, "Era una prova inutile: sei stato fedele.");
      m.provato = { setta: st.id, ciclo: s.ciclo }; // per i bot: un fedele messo alla prova a volte se ne va
    }
  }
  const MARCHIO_CICLI = 4;
  function marchiato(s, p) { return p.marchiatoFino != null && s.ciclo <= p.marchiatoFino; }
  function tradimentiAllAlba(s) {
    for (const st of s.sette) {
      const t = st.tradimento; if (!t) continue; st.tradimento = null;
      const tr = giocatore(s, t.da); if (!st.membri.includes(tr.id)) continue;
      const premio = Math.min(5_000_000, round(st.tesoro * 0.1)), sequestro = round(st.tesoro * 0.5);
      st.tesoro -= sequestro + premio; tr.cash += premio;
      tr.tracce = Math.max(0, tr.tracce - 30); tr.stato = Math.max(0, tr.stato - 1);
      if (st.membri.length >= 3) st.grazia = s.ciclo + 1; st.membri = st.membri.filter((x) => x !== tr.id); tr.sette = tr.sette.filter((x) => x !== st.id);
      sciogliPatto(s, st, tr, false);
      for (const id of st.membri) { const m = giocatore(s, id); m.tracce += 20; m.stato = Math.max(m.stato, 1); segnaTraccia(s, m, 20, "il traditore della setta"); privato(s, m, "Un traditore ha parlato: la polizia ha sequestrato " + euro(sequestro) + " del Tesoro della setta e ora ti tiene d'occhio. Il Tesoro sepolto è salvo."); fatto(s, m, { k: "traditore", testo: "Un traditore ha venduto la setta: sequestrati " + euro(sequestro) + " del Tesoro, +20 Tracce per te.", tracce: 20 }); }
      privato(s, tr, "Hai venduto la setta. Premio: " + euro(premio) + " puliti, e molte delle tue Tracce spariscono. Ora sei fuori, e loro lo sanno.");
      // la vendetta della setta (v76): il Gran Maestro tiene una Prova sul traditore, e per 4 Cicli nessuna setta lo prende
      const gm = giocatore(s, st.gm);
      if (gm && gm.id !== tr.id) { gm.prove = gm.prove || []; gm.prove.push({ su: tr.id, ciclo: s.ciclo + 1, cosa: "i segreti che ha lasciato nella setta" }); }
      tr.marchiatoFino = s.ciclo + MARCHIO_CICLI;
      for (const id of st.membri) privato(s, giocatore(s, id), tr.nome + " ci ha venduti. Il Gran Maestro ha una Prova su di lui.");
      privato(s, tr, "La setta ha tenuto qualcosa su di te. E per " + MARCHIO_CICLI + " Cicli nessuna setta ti vorrà.");
      notizia(s, "Un pentito parla: la Finanza sequestra " + euro(sequestro) + " a una setta segreta della Laguna.", "scandalo");
    }
  }
  function recluta(s, p, idSetta, chi) {
    inNotte(s, p);
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro recluta.");
    const prezzi = { commissario: 3_000_000, giudice: 3_500_000, banchiere: 2_500_000 };
    if (!prezzi[chi]) err("Personaggio sconosciuto.");
    if (st[chi]) err("È già della setta.");
    if (chi !== "banchiere" && livelloSetta(s, st) < 2) err("Il Commissario e il Giudice si reclutano dal livello 2. Il Banchiere già dal livello 1.");
    if (st.tesoro < prezzi[chi]) err("Il Tesoro non basta (" + euro(prezzi[chi]) + ").");
    st.tesoro -= prezzi[chi]; st.pngReclutati = (st.pngReclutati || 0) + 1; st[chi] = true;
    for (const id of st.membri) giocatore(s, id).tracce += 3;
    privato(s, p, "Il " + chi + " ora appartiene alla setta. +6 Influenza.");
    guadagnaInfluenza(s, st, 6, "Reclutato il " + chi);
  }
  const TETTO_SPINTA = 0.5;
  function operazione(s, p, idSetta, tipo, bersaglio, direzione) {
    inNotte(s, p);
    const st = s.sette.find((x) => x.id === idSetta); if (!st || st.gm !== p.id) err("Solo il Gran Maestro lancia le operazioni.");
    const lv = livelloSetta(s, st);
    const OPS = {
      manipola: { lv: 2, costo: 1_000_000, nome: "Manipolare un titolo" },
      blackout: { lv: 3, costo: 3_000_000, nome: "Blackout di un'isola" },
      evasione: { lv: 3, costo: 2_000_000, nome: "Evasione dal Faro" },
      fantoccio: { lv: 4, costo: 10_000_000, nome: "Sindaco fantoccio" },
      inchiesta: { lv: 4, costo: 4_000_000, nome: "Inchiesta pilotata" },
      sabotaggio: { lv: 2, costo: 1_500_000, nome: "Sabotare una setta rivale" },
    };
    const O = OPS[tipo]; if (!O) err("Operazione sconosciuta.");
    if (lv < O.lv) err(O.nome + " richiede una setta di livello " + O.lv + ".");
    if (st.tesoro < O.costo) err("Il Tesoro non basta (" + euro(O.costo) + ").");
    // il bersaglio si controlla PRIMA di spendere: un'operazione rifiutata non costa niente
    if (tipo === "manipola" && !AZIENDE.includes(bersaglio)) err("Scegli un titolo.");
    if (tipo === "blackout" && !ISOLE.includes(bersaglio)) err("Scegli un'isola.");
    if (tipo === "evasione") giocatore(s, bersaglio);
    if (tipo === "sabotaggio" && !s.sette.some((x) => x.id === bersaglio && x.id !== st.id)) err("Scegli una setta rivale.");
    if (tipo === "inchiesta" && giocatore(s, bersaglio).id === p.id) err("Scegli chi colpire.");
    // ILL-01: una sola operazione per setta per notte, e un titolo si muove una volta sola per notte (chiunque lo muova)
    if (st.opNotte === s.ciclo) err("La setta ha già fatto un'operazione stanotte: se ne fa una sola per notte.");
    const spinte = s.spinte && s.spinte.ciclo === s.ciclo ? s.spinte.titoli : {};
    if (tipo === "manipola" && spinte[bersaglio]) err("Stanotte qualcuno ha già mosso " + bersaglio + ": un titolo si muove una volta sola per notte.");
    st.tesoro -= O.costo; st.operazioni += 1; st.opNotte = s.ciclo;
    const riuscita = rng(s) < 0.75;
    // ILL-20: le Tracce dell'operazione le prende chi la ordina; agli altri membri ne resta una
    for (const id of st.membri) { const m = giocatore(s, id), tr = id === p.id ? 5 : 1; m.tracce += tr; if (id === p.id) m.pulitoCiclo = false; m.macchia = true; segnaTraccia(s, m, tr, "l'operazione della setta (" + O.nome + ")"); }
    if (!riuscita) { privato(s, p, O.nome + ": l'operazione è fallita. +1 Influenza (almeno ci avete provato)."); guadagnaInfluenza(s, st, 1, O.nome + " (fallita)"); notizia(s, "Fallito un misterioso piano nella Laguna.", "voce"); return; }
    if (tipo === "manipola") {
      const f = lv >= 3 ? num(s, "spintaForte") : 0.15;
      // il tetto: con le spinte un titolo non va oltre +50% / -50% rispetto all'ultima Alba
      const prezzo0 = s.borsa[bersaglio], ieri = (s.borsaIeri && s.borsaIeri[bersaglio]) || prezzo0;
      const nuovo = direzione === "giu" ? Math.min(prezzo0, Math.max(prezzo0 * (1 - f), ieri * (1 - TETTO_SPINTA))) : Math.max(prezzo0, Math.min(prezzo0 * (1 + f), ieri * (1 + TETTO_SPINTA)));
      s.borsa[bersaglio] = nuovo; s.spinte = { ciclo: s.ciclo, titoli: { ...spinte, [bersaglio]: true } };
      // i guadagni fatti cosi' "non tornano": la Finanza li conta come soldi senza spiegazione (pista dei soldi)
      if (nuovo > prezzo0) for (const id of st.membri) { const m = giocatore(s, id), g = (m.azioni[bersaglio] || 0) * (nuovo - prezzo0); if (g > 0) { m.ripulitiCiclo = (m.ripulitiCiclo || 0) + g; privato(s, m, "La setta ha spinto " + bersaglio + ": le tue azioni salgono di " + euro(g) + ". Attento: la Finanza guarda i guadagni che non si spiegano."); } }
      const mossa = Math.round((nuovo / prezzo0 - 1) * 100);
      notizia(s, "Movimento improvviso su " + bersaglio + " (" + (mossa >= 0 ? "+" : "") + mossa + "%). Nessuno sa spiegarlo.", "borsa");
    } else if (tipo === "blackout") {
      // ILL-03: il blackout vale da subito e per il resto di questa notte: i posti dell'isola tornano tranquilli e i guai li' si dimezzano
      if (s.notte) { s.notte.blackout = bersaglio; for (const l of Object.keys(LUOGHI)) if (LUOGHI[l].isola === bersaglio) s.notte.pericolo[l] = "tranquillo"; }
      notizia(s, "Blackout totale a " + (NOMI_ISOLE[bersaglio] || bersaglio) + ". Nessuno ha visto niente.", "evento");
    } else if (tipo === "evasione") {
      const b = giocatore(s, bersaglio); b.faro = 0; notizia(s, b.nome + " è evaso dal Faro!", "evento");
    } else if (tipo === "sabotaggio") {
      const r = s.sette.find((x) => x.id === bersaglio && x.id !== st.id); if (!r) err("Scegli una setta rivale.");
      const danno = Math.min(5_000_000, round(r.tesoro * 0.25)); r.tesoro -= danno;
      privato(s, giocatore(s, r.gm), "Qualcuno ha colpito la tua setta: " + euro(danno) + " del Tesoro sono andati in fumo. Il Tesoro sepolto è salvo.");
      notizia(s, "Incendio nella notte in un magazzino senza nome. Si parla di una guerra tra sette.", "voce");
    } else if (tipo === "inchiesta") {
      const b = giocatore(s, bersaglio); if (!b || b.id === p.id) err("Scegli chi colpire.");
      b.tracce += 25; b.stato = Math.max(b.stato, 1); segnaTraccia(s, b, 25, "un'inchiesta nata da una soffiata anonima");
      notizia(s, "La Procura apre un'inchiesta su " + b.nome + ". Una soffiata anonima, dicono.", "scandalo");
    } else if (tipo === "fantoccio") {
      s.sindaco = p.id; notizia(s, "Colpo di scena al Municipio: il Sindaco si dimette. Il nuovo Sindaco sembra sapere già cosa fare.", "politica");
    }
    const pt = 3 + O.costo / 1_000_000;
    privato(s, p, O.nome + ": riuscita. +" + pt + " Influenza.");
    guadagnaInfluenza(s, st, pt, O.nome);
  }

  // ------------------------------------------------------------ articoli e contratti
  function articolo(s, p, idBersaglio, tono, importo, testo, sporchi) {
    importo = Math.floor(importo || 0);
    if (importo < 125_000) err("Un articolo costa almeno 125.000 €.");
    const b = giocatore(s, idBersaglio); // prima si controlla di chi si parla, poi si paga
    if (tono === "scandalo") controllaSilenzio(s, p, b.id);
    if (sporchi) { if (p.sporchi < importo * 0.8) err("Non hai abbastanza sporchi."); p.sporchi -= importo * 0.8; p.tracce += 3; p.macchia = true; }
    else { if (p.cash < importo) err("Non hai abbastanza soldi."); p.cash -= importo; }
    const forza = Math.min(20, Math.round(importo / 50_000));
    // credibilita': uno scandalo su chi ha davvero tracce e' credibile; su chi e' pulito puo' ritorcersi
    if (tono === "scandalo" && haPiano(b, "ufficio_stampa") && rng(s) < 0.5) {
      p.fama = Math.max(0, p.fama - forza); privato(s, b, "Il tuo Ufficio stampa ha smontato uno scandalo contro di te prima che uscisse.");
      notizia(s, "Smentita: l'articolo contro " + b.nome + " era pieno di falsità. Brutta figura per chi lo ha pagato.", "fama"); return;
    }
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
  // Regole dei patti (valgono per tutte le partite):
  //  - non si promette piu' di quanto si possiede (il patrimonio pulito di chi paga), e mai sotto zero;
  //  - la garanzia e' un terreno di chi dovra' pagare; il terreno ceduto e' di uno dei due;
  //  - il notaio (2%) si paga solo se tutti e due hanno i contanti: altrimenti il contratto non si firma.
  function limitePatto(s, q) { return Math.max(0, Math.floor(patrimonio(s, q, false))); }
  function proponiContratto(s, p, c) {
    if (!c || typeof c !== "object") err("Contratto non valido.");
    const a = giocatore(s, c.a);
    if (a.id === p.id) err("Non puoi fare un contratto con te stesso.");
    const k = {
      id: null, da: p.id, a: a.id, tipo: c.tipo === "notarile" ? "notarile" : "parola",
      pagoOra: Math.max(0, Math.floor(c.pagoOra || 0)), chiPagaOra: c.chiPagaOra === "a" ? "a" : "da",
      pagoDopo: Math.max(0, Math.floor(c.pagoDopo || 0)), chiPagaDopo: c.chiPagaDopo === "da" ? "da" : "a",
      scadenza: s.ciclo + Math.max(1, Math.min(4, Math.floor(c.cicli || 1))), garanzia: c.garanzia || null,
      lottoCeduto: c.lottoCeduto || null, testo: String(c.testo || "").slice(0, 400), stato: "proposto",
    };
    // un Favore dentro il patto: favore = "voto"|"passo"|"silenzio"|"mano", favoreDeve = "da" (chi propone) | "a" (chi riceve)
    if (c.favore != null && c.favore !== "" && c.favore !== "nessuno") {
      const ft = tipoFavore(typeof c.favore === "object" ? c.favore.tipo : c.favore); if (!ft) err("Favore sconosciuto.");
      const chi = (typeof c.favore === "object" ? c.favore.deve : c.favoreDeve) === "a" ? "a" : "da";
      k.favore = { tipo: ft, deve: chi };
      const deve = chi === "da" ? p : a, ha = chi === "da" ? a : p;
      controllaFavore(s, deve, ha, ft);
    }
    // quello che prometto IO lo controllo subito (quello che chiedo all'altro lo controlla lui quando firma: i suoi conti sono segreti)
    if (k.chiPagaOra === "da" && k.pagoOra > p.cash) err("Non hai " + euro(k.pagoOra) + " puliti per il pagamento iniziale.");
    if (k.chiPagaDopo === "da" && k.pagoDopo > limitePatto(s, p)) err("Non puoi promettere più di quanto possiedi: al massimo " + euro(limitePatto(s, p)) + ".");
    if (k.garanzia) { const l = lotto(s, k.garanzia), deve = k.chiPagaDopo === "da" ? p : a; if (l.owner !== deve.id) err("La garanzia deve essere un terreno di chi dovrà pagare (" + deve.nome + ")."); }
    if (k.lottoCeduto) { const l = lotto(s, k.lottoCeduto); if (l.owner !== p.id && l.owner !== a.id) err("Il terreno da cedere deve essere tuo o di " + a.nome + "."); if (l.cantiere) err("C'è un cantiere aperto su quel terreno: aspetta l'Alba."); }
    k.id = "c" + s.prossimoId++;
    s.contratti.push(k);
    privato(s, a, p.nome + " ti propone un contratto. Guardalo nell'app Contratti.");
    return k.id;
  }
  function rispondiContratto(s, p, idC, si) {
    const k = s.contratti.find((x) => x.id === idC); if (!k || k.a !== p.id || k.stato !== "proposto") err("Contratto non trovato.");
    if (!si) { k.stato = "rifiutato"; privato(s, giocatore(s, k.da), p.nome + " ha rifiutato il tuo contratto."); return; }
    const da = giocatore(s, k.da), a = p;
    const pagatore = k.chiPagaOra === "da" ? da : a, ricevente = k.chiPagaOra === "da" ? a : da;
    const dopo = k.chiPagaDopo === "da" ? da : a;
    // tutti i controlli prima di muovere un solo euro
    const meta = k.tipo === "notarile" ? round(0.02 * (k.pagoOra + k.pagoDopo) / 2) : 0; // il notaio: 2%, meta' a testa
    const serve = (q) => meta + (q === pagatore ? k.pagoOra : 0);
    if (a.cash < serve(a)) err("Ti servono " + euro(serve(a)) + " puliti per firmare" + (meta ? " (il notaio costa " + euro(meta) + " a testa)" : "") + ".");
    if (da.cash < serve(da)) err(da.nome + " non ha i soldi per firmare adesso" + (meta ? " (pagamento iniziale e notaio)" : "") + ".");
    if (k.pagoDopo > limitePatto(s, dopo)) err(dopo === a ? "Non puoi promettere più di quanto possiedi: al massimo " + euro(limitePatto(s, a)) + "." : da.nome + " non può più garantire la cifra promessa.");
    if (k.garanzia) { const l = s.lotti.find((x) => x.id === k.garanzia); if (!l || l.owner !== dopo.id) err("La garanzia non è più un terreno di " + dopo.nome + "."); }
    if (k.lottoCeduto) { const l = s.lotti.find((x) => x.id === k.lottoCeduto); if (!l || (l.owner !== da.id && l.owner !== a.id)) err("Il terreno da cedere non è più di uno dei due."); if (l.cantiere) err("C'è un cantiere aperto su quel terreno: aspetta l'Alba."); }
    if (k.favore) controllaFavore(s, k.favore.deve === "da" ? da : a, k.favore.deve === "da" ? a : da, k.favore.tipo);
    da.cash -= meta; a.cash -= meta;
    pagatore.cash -= k.pagoOra; ricevente.cash += k.pagoOra; flusso(s, pagatore, ricevente, k.pagoOra, "Patto: pagamento iniziale", k.tipo === "notarile");
    if (k.lottoCeduto) { const l = lotto(s, k.lottoCeduto); if (l.owner === da.id) l.owner = a.id; else if (l.owner === a.id) l.owner = da.id; }
    k.stato = "attivo";
    if (k.favore) { const fv = nuovoFavore(s, k.favore.deve === "da" ? da : a, k.favore.deve === "da" ? a : da, k.favore.tipo, "patto"); k.favore.id = fv.id; }
    if (k.tipo === "notarile") notizia(s, "Firmato dal notaio un contratto tra " + da.nome + " e " + a.nome + ".", "affari");
    privato(s, da, a.nome + " ha accettato il contratto.");
  }
  // Patto sulla parola scaduto (v76): chi deve pagare ha tempo fino all'Alba dopo (app Banca o "Paga ora" in Contratti).
  // Se all'Alba dopo non ha pagato: rompe la parola (-8 fama, niente Favori per 2 Cicli, Gazzetta) e il patto e' "rotto".
  // I patti scaduti prima della v76 (senza k.scadutoCiclo) non hanno questa scadenza: si possono solo pagare.
  function pagatoreDi(s, k) { const da = giocatore(s, k.da), a = giocatore(s, k.a); return k.chiPagaDopo === "da" ? [da, a] : [a, da]; }
  function restoPatto(k) { return Math.max(0, (k.pagoDopo || 0) - (k.pagatoDopo || 0)); }
  function chiudiPattoPagato(s, k, pagatore, ricevente) {
    k.stato = "chiuso"; k.pagato = true;
    privato(s, ricevente, pagatore.nome + " ha mantenuto la parola: il patto è pagato (" + euro(k.pagoDopo) + ").");
    privato(s, pagatore, "Hai mantenuto la parola con " + ricevente.nome + ": il patto è chiuso.");
  }
  // un regalo in soldi puliti dall'app Banca conta come pagamento dei patti sulla parola scaduti verso quella persona
  function contaRegaloPatti(s, p, a, importo) {
    let resto = importo;
    for (const k of s.contratti || []) {
      if (resto <= 0) break;
      if (k.stato !== "scaduto" || k.tipo === "notarile" || !k.pagoDopo) continue;
      const [pg, rc] = pagatoreDi(s, k); if (pg.id !== p.id || rc.id !== a.id) continue;
      const quota = Math.min(resto, restoPatto(k)); k.pagatoDopo = (k.pagatoDopo || 0) + quota; resto -= quota;
      if (restoPatto(k) <= 0) chiudiPattoPagato(s, k, pg, rc);
    }
  }
  function pagaPatto(s, p, id) {
    if (s.fine || s.fase === "pacchetti") err("Adesso non si paga.");
    const k = (s.contratti || []).find((x) => x.id === id); if (!k) err("Patto non trovato.");
    if (k.stato !== "scaduto" || k.tipo === "notarile") err("Questo patto non è da pagare.");
    const [pg, rc] = pagatoreDi(s, k); if (pg.id !== p.id) err("Non sei tu che devi pagare questo patto.");
    const resto = restoPatto(k); if (p.cash < resto) err("Per pagare il patto servono " + euro(resto) + " puliti.");
    p.cash -= resto; rc.cash += resto; k.pagatoDopo = (k.pagatoDopo || 0) + resto;
    flusso(s, p, rc, resto, "Patto sulla parola: pagato", false);
    chiudiPattoPagato(s, k, p, rc);
  }
  function scadenzeContratti(s) {
    // prima: i patti sulla parola scaduti all'Alba scorsa e ancora non pagati diventano parola rotta
    for (const k of s.contratti) {
      if (k.stato !== "scaduto" || k.tipo === "notarile" || k.scadutoCiclo == null || s.ciclo <= k.scadutoCiclo) continue;
      if (restoPatto(k) <= 0) { k.stato = "chiuso"; continue; }
      const [pg, rc] = pagatoreDi(s, k);
      k.stato = "rotto";
      paroleRotta(s, pg, rc, "il patto sulla parola (" + euro(restoPatto(k)) + ")", "Non hai pagato il patto sulla parola.", false);
    }
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
        } else {
          // senza garanzia: chi deve pagare da' quello che ha (contanti, poi titoli venduti). La banca NON mette la differenza.
          raccogli(s, pagatore, k.pagoDopo - Math.max(0, pagatore.cash));
          const pagato = Math.max(0, Math.min(k.pagoDopo, Math.floor(pagatore.cash)));
          pagatore.cash -= pagato; ricevente.cash += pagato; k.stato = "chiuso"; k.nonPagato = k.pagoDopo - pagato;
          flusso(s, pagatore, ricevente, pagato, "Patto dal notaio: scadenza", true);
          privato(s, ricevente, pagatore.nome + " non aveva tutta la cifra del contratto: incassi " + euro(pagato) + " su " + euro(k.pagoDopo) + ". Senza garanzia, il resto è perso.");
          privato(s, pagatore, "Scade il contratto con " + ricevente.nome + ": non avevi tutta la cifra. Hai pagato " + euro(pagato) + " su " + euro(k.pagoDopo) + ".");
          notizia(s, pagatore.nome + " non onora per intero il contratto firmato dal notaio con " + ricevente.nome + ".", "affari");
        }
      } else {
        k.stato = "scaduto"; k.scadutoCiclo = s.ciclo;
        privato(s, ricevente, "Scade il patto sulla parola con " + pagatore.nome + ": " + euro(k.pagoDopo) + ". Ha tempo fino alla prossima Alba per pagarti. Se non paga, rompe la parola davanti a tutti.");
        privato(s, pagatore, "Scade il patto sulla parola con " + ricevente.nome + ": devi pagare " + euro(k.pagoDopo) + " entro la prossima Alba. Paga dall'app Contratti (\"Paga ora\") o dall'app Banca. Se non paghi: −" + FAMA_PAROLA_ROTTA + " fama, la Gazzetta lo scrive e per 2 Cicli nessuno si fida di te.");
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
    if (l.ipoteca) pr.ipoteca = infoIpoteca(s, l); // chi compra un terreno ipotecato lo vede PRIMA di dire si'
    s.proposte.push(pr);
    privato(s, a, p.nome + (compro ? " vuole comprare il tuo " + l.nome + " per " : " ti offre il suo " + l.nome + " per ") + euro(prezzo) + "." + (l.ipoteca && !compro ? " ATTENZIONE: è IPOTECATO. Se lo compri l'ipoteca passa a te: rende la metà finché non paghi " + euro(pr.ipoteca.riscatto) + " alla Banca, e se non la paghi entro 4 Cicli dall'acquisto la Banca se lo prende." : "") + " Rispondi dalla finestra o dall'app Contratti.");
    if (l.ipoteca && compro) privato(s, p, "Attento: " + l.nome + " è IPOTECATO. Se lo compri l'ipoteca passa a te: rende la metà finché non paghi " + euro(pr.ipoteca.riscatto) + " alla Banca, e se non la paghi entro 4 Cicli dall'acquisto la Banca se lo prende.");
    log(s, p.nome + " fa una proposta a " + a.nome + " per " + l.nome + ".", p.id);
    return pr.id;
  }
  function rispondiProposta(s, p, idP, si, motivo) {
    const pr = (s.proposte || []).find((x) => x.id === idP);
    if (!pr || pr.a !== p.id || pr.stato !== "proposta") err("Proposta non trovata.");
    const da = giocatore(s, pr.da), l = lotto(s, pr.lotto);
    if (!si) { pr.stato = "rifiutata"; pr.motivo = motivo ? String(motivo).slice(0, 160) : null; privato(s, da, p.nome + " ha rifiutato la tua proposta per " + l.nome + "." + (pr.motivo ? " " + pr.motivo : "")); log(s, p.nome + " rifiuta la proposta di " + da.nome + " per " + l.nome + ".", p.id); return; }
    const compratore = pr.compro ? da : p, venditore = pr.compro ? p : da;
    // la proposta non vale piu': scade e lo si dice a tutti e due. Non e' un errore, cosi' la scadenza resta salvata.
    const scade = (perche) => { pr.stato = "scaduta"; pr.motivo = perche; privato(s, p, "La proposta per " + l.nome + " non vale più: " + perche); privato(s, da, "La tua proposta per " + l.nome + " non vale più: " + perche); };
    if (l.owner !== venditore.id) return scade("il terreno non è più di " + venditore.nome + ".");
    if (l.cantiere) err("C'è un cantiere aperto su quel terreno: aspetta l'Alba.");
    if (compratore.cash < pr.prezzo) return scade(compratore.nome + " non ha più abbastanza soldi.");
    compratore.cash -= pr.prezzo; venditore.cash += pr.prezzo; l.owner = compratore.id; l.permesso = false; l.negato = false;
    if (l.ipoteca) { l.ipotecaCiclo = s.ciclo; privato(s, compratore, l.nome + " è ipotecato: l'ipoteca ora è tua. Per toglierla paghi " + euro(round(l.ipoteca * N.ipotecaRiscatto)) + " (app Banca). Hai tempo fino all'Alba del Ciclo " + (s.ciclo + 1 + N.ipotecaCicli) + ", poi la Banca se lo prende."); } // il conto dei Cicli riparte da chi compra
    pr.stato = "accettata";
    flusso(s, compratore, venditore, pr.prezzo, "Compravendita: " + l.nome, true);
    log(s, venditore.nome + " vende " + l.nome + " a " + compratore.nome + " per " + euro(pr.prezzo) + ".", p.id);
    notizia(s, venditore.nome + " vende " + l.nome + " a " + compratore.nome + ".", "affari");
    controllaValoreLusso(s, l);
  }
  function regala(s, p, idA, importo, sporchi) {
    importo = Math.floor(importo || 0); const a = giocatore(s, idA);
    if (a.id === p.id) err("Non puoi fare un regalo a te stesso.");
    if (importo <= 0) err("Importo non valido.");
    if (sporchi) {
      if (p.sporchi < importo) err("Non hai abbastanza sporchi."); p.sporchi -= importo; a.sporchi += importo;
      // una valigia di contanti sporchi che cambia mano lascia Tracce a tutti e due: non si nascondono dagli amici puliti
      const tr = Math.max(1, TRACCE_PASSAMANO * importo / 1_000_000);
      p.tracce += tr; p.pulitoCiclo = false; p.macchia = true; segnaTraccia(s, p, tr, "i contanti sporchi passati a " + a.nome);
      a.tracce += tr; a.pulitoCiclo = false; // chi riceve non si macchia (0.4)
      a.peggiorReato = peggio(a.peggiorReato, "lieve"); segnaTraccia(s, a, tr, "i contanti sporchi ricevuti da " + p.nome);
    }
    else { if (p.cash < importo) err("Non hai abbastanza soldi."); p.cash -= importo; a.cash += importo; }
    flusso(s, p, a, importo, sporchi ? "Regalo in contanti sporchi" : "Regalo", false);
    if (!sporchi) contaRegaloPatti(s, p, a, importo);
    p.haRegalato = true;
    privato(s, a, p.nome + " ti ha dato " + euro(importo) + (sporchi ? " in contanti sporchi. Attento: i soldi sporchi che passano di mano lasciano Tracce anche a chi li riceve." : "."));
  }

  // ------------------------------------------------------------ I FAVORI (dinamica 1) e IL RICATTO (dinamica 2)
  // Un Favore e' una promessa che il gioco fa rispettare. Nasce da un patto (proponiContratto) o da un ricatto.
  // Stato: s.favori = [{ id, deve, a, tipo, origine, nato, scade, stato, uso, prova }] (campo creato al volo: partite vecchie).
  // I cicli dentro lo stato sono quelli "veri" (da 0); a schermo si scrive sempre +1, come per i contratti.
  const FAVORI = {
    voto: { nome: "Il Voto", spiega: "Alle prossime elezioni la sua fama diventa punti per te. Oppure: il suo voto su una Grande Opera lo decidi tu." },
    passo: { nome: "Passo libero", spiega: "Per i tuoi prossimi 4 turni non paghi affitti né pedaggi sui suoi terreni." },
    silenzio: { nome: "Il Silenzio", spiega: "Brucia tutte le Prove che ha su di te. Fino alla fine del prossimo Ciclo non può denunciarti, ricattarti o pagare scandali su di te." },
    mano: { nome: "La Mano", spiega: "Stanotte deve farsi trovare nel posto e all'ora che dici tu." },
  };
  // la frase che spiega il Favore nella finestra del patto, con i nomi e il verso giusto (v76)
  // deveIo = lo devo io; altro = il nome dell'altro giocatore del patto. Sempre detta a chi guarda la finestra ("tu").
  function testoFavorePatto(tipo, deveIo, altro) {
    const T = {
      voto: deveIo ? ["Alle prossime elezioni la tua fama diventa punti per " + altro + ". Oppure: il tuo voto su una Grande Opera lo decide " + altro + "."]
        : ["Alle prossime elezioni la fama di " + altro + " diventa punti per te. Oppure: il voto di " + altro + " su una Grande Opera lo decidi tu."],
      passo: deveIo ? [altro + ", per i suoi prossimi 4 turni, non paga affitti né pedaggi sui tuoi terreni."]
        : ["Per i tuoi prossimi 4 turni non paghi affitti né pedaggi sui terreni di " + altro + "."],
      silenzio: deveIo ? ["Bruci tutte le Prove che hai su " + altro + ". Fino alla fine del prossimo Ciclo non puoi denunciare né ricattare " + altro + ", né pagare scandali su di lui o lei."]
        : [altro + " brucia tutte le Prove che ha su di te. Fino alla fine del prossimo Ciclo non può denunciarti, ricattarti o pagare scandali su di te."],
      mano: deveIo ? ["Una notte, quando lo chiede " + altro + ", devi farti trovare nel posto e all'ora che dice lui o lei."]
        : ["Una notte, quando vuoi tu, " + altro + " deve farsi trovare nel posto e all'ora che dici tu."],
    };
    return T[tipo] ? T[tipo][0] : "";
  }
  const MAX_FAVORI_APERTI = 3, FAVORI_CHIUSI_TENUTI = 40, FAMA_PAROLA_ROTTA = 8;
  function tipoFavore(t) { return typeof t === "string" && Object.prototype.hasOwnProperty.call(FAVORI, t) ? t : null; }
  function favori(s) { if (!Array.isArray(s.favori)) s.favori = []; return s.favori; }
  function ricatti(s) { if (!Array.isArray(s.ricatti)) s.ricatti = []; return s.ricatti; }
  function vivo(f) { return f.stato === "aperto" || f.stato === "attivo"; }
  function senzaParola(s, p) { return p.senzaParola != null && s.ciclo <= p.senzaParola; }
  // il motivo per cui "deve" non puo' promettere questo Favore ad "a" (null = puo')
  function motivoNoFavore(s, deve, a, tipo) {
    if (!tipoFavore(tipo)) return "Favore sconosciuto.";
    if (deve.fallito) return deve.nome + " è fallito: non può promettere niente.";
    if (deve.id === a.id) return "Non puoi fare un Favore a te stesso.";
    if (senzaParola(s, deve)) return "Nessuno si fida della parola di " + deve.nome + " fino al Ciclo " + (deve.senzaParola + 1) + ".";
    const fs = favori(s);
    if (fs.filter((f) => f.deve === deve.id && vivo(f)).length >= MAX_FAVORI_APERTI) return deve.nome + " ha già promesso troppo: 3 Favori aperti.";
    if (fs.some((f) => f.deve === deve.id && f.a === a.id && f.tipo === tipo && vivo(f))) return "Questo Favore te lo deve già.";
    return null;
  }
  function controllaFavore(s, deve, a, tipo) { const m = motivoNoFavore(s, deve, a, tipo); if (m) err(m); }
  // il Silenzio promesso: chi lo deve non puo' fare niente contro chi lo ha in mano
  function silenzioAttivo(s, p, idB) { return favori(s).find((f) => f.tipo === "silenzio" && f.stato === "attivo" && f.deve === p.id && f.a === idB) || null; }
  function controllaSilenzio(s, p, idB) {
    const f = silenzioAttivo(s, p, idB);
    if (f) err("Hai promesso il Silenzio a " + giocatore(s, idB).nome + " fino al Ciclo " + (f.uso.fino + 1) + ".");
  }
  function nuovoFavore(s, deve, a, tipo, origine, prova) {
    const f = { id: "f" + s.prossimoId++, deve: deve.id, a: a.id, tipo, origine, nato: s.ciclo, scade: s.ciclo + 4, stato: "aperto", uso: null, prova: prova || null };
    favori(s).push(f);
    privato(s, a, deve.nome + " ti deve un Favore: " + FAVORI[tipo].nome + ". Lo trovi in Rubrica, \"I miei fili\". Vale fino al Ciclo " + (f.scade + 1) + ".");
    privato(s, deve, "Devi un Favore a " + a.nome + ": " + FAVORI[tipo].nome + ". Se non lo mantieni, rompi la parola.");
    return f;
  }
  // la parola rotta: a mano (favore_rompi) o da sola (non ti presenti alla Mano)
  function rompiParola(s, f, perche) {
    const deve = giocatore(s, f.deve), a = giocatore(s, f.a);
    f.stato = "rotto";
    paroleRotta(s, deve, a, FAVORI[f.tipo].nome, perche, !!f.prova);
    if (f.origine === "ricatto" && f.prova) { a.prove = a.prove || []; a.prove.push({ ...f.prova, rifiutata: true }); f.prova = null; }
  }
  // le conseguenze della parola rotta, uguali per un Favore e per un patto sulla parola non pagato (v76):
  // -8 fama, niente Favori per 2 Cicli, notizia in Ultim'ora (tipo "parola") e un messaggio chiaro a tutti e due
  function paroleRotta(s, deve, a, cosa, perche, prova) {
    deve.fama = Math.max(0, (deve.fama || 0) - FAMA_PAROLA_ROTTA);
    deve.senzaParola = s.ciclo + 2;
    notizia(s, deve.nome + " non mantiene la parola data a " + a.nome + ".", "parola");
    privato(s, deve, (perche ? perche + " " : "") + "Hai rotto la parola con " + a.nome + ": −" + FAMA_PAROLA_ROTTA + " fama, e fino al Ciclo " + (deve.senzaParola + 1) + " nessuno accetterà Favori da te.");
    privato(s, a, deve.nome + " non ha mantenuto la parola: " + cosa + "." + (prova ? " La Prova torna a te." : ""));
  }
  function favoreMio(s, p, id) { const f = favori(s).find((x) => x.id === id); if (!f) err("Favore non trovato."); return f; }
  function usaFavore(s, p, a) {
    const f = favoreMio(s, p, a.id);
    if (f.a !== p.id) err("Questo Favore non è tuo da usare.");
    if (f.stato !== "aperto") err("Questo Favore è già stato usato o è chiuso.");
    const deve = giocatore(s, f.deve);
    if (f.tipo === "voto") {
      if (a.opera) {
        const st = s.sette.find((x) => x.opera && x.membri.includes(p.id) && x.membri.includes(deve.id));
        if (!st) err("Il Voto su una Grande Opera vale solo se siete tutti e due nella setta che sta votando.");
        if (st.gm === deve.id) err(deve.nome + " è il Gran Maestro: non vota la Grande Opera.");
        st.opera.voti[deve.id] = !!a.si; st.opera.promessi = st.opera.promessi || {}; st.opera.promessi[deve.id] = p.id;
        f.stato = "pagato"; f.uso = { opera: true, si: !!a.si };
        msgSetta(s, p, st.id, deve.nome + " vota " + (a.si ? "SÌ" : "NO") + " sulla Grande Opera: era una promessa.");
        privato(s, deve, p.nome + " ha usato il tuo Voto: sulla Grande Opera hai votato " + (a.si ? "SÌ" : "NO") + ".");
        return;
      }
      if (s.candidati[p.id] === undefined) err("Il Voto si usa quando sei candidato.");
      f.stato = "attivo"; f.uso = { elezione: true };
      notizia(s, deve.nome + " sostiene " + p.nome + " alle elezioni.", "politica");
      privato(s, deve, p.nome + " ha usato il tuo Voto: alle elezioni la tua fama conta per lui.");
      return;
    }
    if (f.tipo === "passo") {
      if (s.fase !== "giorno") err("Il Passo libero si usa di giorno.");
      f.stato = "attivo"; f.uso = { turni: 4 };
      notizia(s, deve.nome + " apre le porte a " + p.nome + ": Passo libero per 4 turni.", "affari");
      return;
    }
    if (f.tipo === "silenzio") {
      const prima = (deve.prove || []).length;
      deve.prove = (deve.prove || []).filter((x) => x.su !== p.id);
      const n = prima - deve.prove.length;
      f.stato = "attivo"; f.uso = { fino: s.ciclo + 1, bruciate: n };
      // i ricatti che aveva in corso contro di te si chiudono: la Prova e' bruciata
      for (const r of ricatti(s)) if (r.da === deve.id && r.a === p.id && r.stato === "attesa") { r.stato = "annullato"; r.prova = null; }
      privato(s, p, n ? deve.nome + " ha bruciato " + n + (n === 1 ? " Prova" : " Prove") + " su di te." : deve.nome + " non aveva niente su di te. Per ora.");
      privato(s, deve, p.nome + " ha usato il tuo Silenzio" + (n ? ": hai bruciato " + n + (n === 1 ? " Prova" : " Prove") + " su di lui" : "") + ". Fino alla fine del Ciclo " + (f.uso.fino + 1) + " non puoi fare niente contro di lui.");
      return;
    }
    if (f.tipo === "mano") {
      const ora = Math.floor(Number(a.ora));
      if (!(ora >= 1 && ora <= 5)) err("Scegli un'ora tra le 23:00 e le 03:00.");
      const luogo = typeof a.luogo === "string" && Object.prototype.hasOwnProperty.call(LUOGHI, a.luogo) ? a.luogo : null;
      if (!luogo || luogo === "palazzo") err("Scegli un posto della Laguna.");
      if (!luogoAperto(s, luogo, deve)) err(deve.nome + " non può entrare a " + nomeLuogo(luogo) + ".");
      if (deve.faro > 0) err(deve.nome + " è al Faro: stanotte non può venire.");
      if (s.fase === "notte") { if (!s.notte || ora < s.notte.ora + 2) err("È troppo tardi: servono almeno 2 ore per arrivare. Scegli un'ora dopo le " + ORE[Math.min(6, s.notte ? s.notte.ora + 1 : 1)] + "."); }
      else if (s.fase !== "giorno") err("Adesso non si può.");
      f.stato = "attivo"; f.uso = { luogo, ora, ciclo: s.ciclo };
      privato(s, deve, p.nome + " incassa La Mano: stanotte alle " + ORE[ora] + " devi essere a " + nomeLuogo(luogo) + ". Se non ci sei, rompi la parola.");
      privato(s, p, "Hai incassato La Mano: stanotte alle " + ORE[ora] + " " + deve.nome + " deve essere a " + nomeLuogo(luogo) + ".");
      return;
    }
    err("Favore sconosciuto.");
  }
  function rompiFavore(s, p, id) {
    const f = favoreMio(s, p, id);
    if (f.deve !== p.id) err("Questo Favore non lo devi tu.");
    if (f.stato !== "aperto") err("Questo Favore non si può più rompere.");
    rompiParola(s, f);
  }
  // Passo libero: chi lo ha in mano non paga affitti e pedaggi sui terreni del debitore
  function passoLibero(s, p, idOwner) { return favori(s).find((f) => f.tipo === "passo" && f.stato === "attivo" && f.a === p.id && f.deve === idOwner) || null; }
  function contaPasso(s, p) {
    for (const f of favori(s)) if (f.tipo === "passo" && f.stato === "attivo" && f.a === p.id) {
      f.uso.turni -= 1;
      if (f.uso.turni <= 0) { f.stato = "pagato"; privato(s, p, "Il Passo libero di " + giocatore(s, f.deve).nome + " è finito."); }
    }
  }
  // Il Voto alle elezioni: punti in piu' per il candidato (al massimo 2 Voti), in meno per chi lo deve se e' candidato anche lui
  function puntiVoti(s) {
    const punti = {}, usati = [];
    for (const f of favori(s)) {
      if (f.tipo !== "voto" || f.stato !== "attivo" || !(f.uso && f.uso.elezione)) continue;
      if (s.candidati[f.a] === undefined) continue;
      if (usati.filter((x) => x.a === f.a).length >= 2) continue;
      const deve = s.players.find((x) => x.id === f.deve); if (!deve) continue;
      const v = clamp(deve.fama || 0, 5, 40);
      punti[f.a] = (punti[f.a] || 0) + v;
      if (s.candidati[f.deve] !== undefined) punti[f.deve] = (punti[f.deve] || 0) - v;
      usati.push(f);
    }
    return punti;
  }
  function chiudiVotiElezioni(s) { for (const f of favori(s)) if (f.tipo === "voto" && f.stato === "attivo" && f.uso && f.uso.elezione) f.stato = "pagato"; }
  // La Mano: all'inizio della notte, chi e' al Faro non puo' venire (il Favore torna aperto)
  function manoInizioNotte(s) {
    for (const f of favori(s)) if (f.tipo === "mano" && f.stato === "attivo" && f.uso && f.uso.ciclo === s.ciclo) {
      const deve = giocatore(s, f.deve);
      if (deve.faro > 0) { f.stato = "aperto"; f.uso = null; privato(s, giocatore(s, f.a), deve.nome + " è al Faro: stanotte non può venire. La Mano resta da usare."); }
    }
  }
  // La Mano: quando si chiude l'ora dell'appuntamento si guarda chi c'e'
  function manoOra(s) {
    const N2 = s.notte; if (!N2) return;
    for (const f of favori(s)) if (f.tipo === "mano" && f.stato === "attivo" && f.uso && f.uso.ciclo === s.ciclo && f.uso.ora === N2.ora) {
      const deve = giocatore(s, f.deve), a = giocatore(s, f.a);
      const presente = !N2.viaggio[deve.id] && N2.dove[deve.id] === f.uso.luogo;
      if (presente) {
        f.stato = "pagato";
        racconta(s, deve, deve.nome + " è venuto, come promesso."); racconta(s, a, deve.nome + " è venuto, come promesso.");
      } else rompiParola(s, f, "Non ti sei presentato a " + nomeLuogo(f.uso.luogo) + " alle " + ORE[f.uso.ora] + ".");
    }
  }
  // all'Alba, subito dopo i contratti
  function scadenzeFavori(s) {
    // i ricatti senza risposta: valgono come un rifiuto
    for (const r of ricatti(s)) if (r.stato === "attesa") {
      const da = s.players.find((x) => x.id === r.da), a = s.players.find((x) => x.id === r.a);
      if (da && r.prova) { da.prove = da.prove || []; da.prove.push({ ...r.prova, rifiutata: true }); }
      r.prova = null; r.stato = "rifiutato";
      if (da) privato(s, da, (a ? a.nome : "La tua vittima") + " non ha risposto al ricatto prima dell'Alba: vale come un no. La Prova torna a te: ora puoi solo denunciarlo.");
      if (a) privato(s, a, "Non hai risposto al ricatto di " + (da ? da.nome : "un rivale") + ": vale come un no. Ora può denunciarti.");
    }
    for (const f of favori(s)) {
      const deve = s.players.find((x) => x.id === f.deve), a = s.players.find((x) => x.id === f.a);
      if (f.stato === "attivo" && f.tipo === "silenzio" && f.uso && s.ciclo >= f.uso.fino) { f.stato = "pagato"; f.prova = null; continue; }
      // una Mano rimasta attiva (non dovrebbe succedere: si controlla nella notte) torna da usare
      if (f.stato === "attivo" && f.tipo === "mano" && f.uso && f.uso.ciclo <= s.ciclo) { f.stato = "aperto"; f.uso = null; }
      if (f.stato === "aperto" && (f.scade <= s.ciclo || (deve && deve.fallito))) {
        f.stato = "scaduto"; f.prova = null;
        if (deve) privato(s, deve, "Il Favore che dovevi a " + (a ? a.nome : "?") + " (" + FAVORI[f.tipo].nome + ") è scaduto. Nessuna punizione.");
        if (a) privato(s, a, "Il Favore che ti doveva " + (deve ? deve.nome : "?") + " (" + FAVORI[f.tipo].nome + ") è scaduto: non l'hai usato in tempo.");
      }
      if (f.stato === "pagato") f.prova = null; // la Prova in pegno e' bruciata
    }
    const chiusi = s.favori.filter((f) => !vivo(f));
    if (chiusi.length > FAVORI_CHIUSI_TENUTI) { const via = new Set(chiusi.slice(0, chiusi.length - FAVORI_CHIUSI_TENUTI)); s.favori = s.favori.filter((f) => !via.has(f)); }
    const rc = ricatti(s).filter((r) => r.stato !== "attesa");
    if (rc.length > FAVORI_CHIUSI_TENUTI) { const via = new Set(rc.slice(0, rc.length - FAVORI_CHIUSI_TENUTI)); s.ricatti = s.ricatti.filter((r) => !via.has(r)); }
  }
  // condanna o archiviazione: i ricatti in attesa dove c'entra p si annullano, la Prova non prova piu' niente
  function annullaRicatti(s, p) {
    for (const r of ricatti(s)) if (r.stato === "attesa" && (r.da === p.id || r.a === p.id)) {
      r.stato = "annullato"; r.prova = null;
      const altro = s.players.find((x) => x.id === (r.da === p.id ? r.a : r.da));
      if (altro) privato(s, altro, "Il ricatto tra te e " + p.nome + " non vale più: la Procura ha chiuso il suo caso.");
    }
  }
  // IL RICATTO: mostri una Prova al rivale e gli chiedi un Favore. A viso aperto. Reato grave.
  function ricatto(s, p, idx, tipo) {
    if (s.fase !== "giorno" && s.fase !== "notte") err("Adesso non si può.");
    const pr = (p.prove || [])[idx]; if (!pr || typeof idx !== "number") err("Prova non trovata.");
    if (pr.rifiutata) err("Questa Prova l'ha già vista. Ora puoi solo denunciarlo.");
    tipo = tipoFavore(tipo); if (!tipo) err("Scegli il Favore che vuoi.");
    if (ricatti(s).some((r) => r.da === p.id && r.stato === "attesa")) err("Hai già un ricatto aperto.");
    const b = giocatore(s, pr.su);
    if (senzaParola(s, b)) err(b.nome + " non ha più una parola da dare. Puoi solo denunciarlo.");
    controllaFavore(s, b, p, tipo);
    controllaSilenzio(s, p, b.id);
    p.prove.splice(idx, 1);
    const prova = { su: pr.su, ciclo: pr.ciclo, cosa: pr.cosa };
    p.tracce += 6; segnaTraccia(s, p, 6, "un ricatto");
    p.peggiorReato = peggio(p.peggiorReato, "grave"); p.pulitoCiclo = false; p.macchia = true;
    const r = { id: "r" + s.prossimoId++, da: p.id, a: b.id, tipo, prova, ciclo: s.ciclo, stato: "attesa" };
    ricatti(s).push(r);
    if (haPiano(b, "ufficio_stampa") && rng(s) < 0.5) {
      r.stato = "smascherato"; r.prova = null;
      p.tracce += 10; segnaTraccia(s, p, 10, "il ricatto smascherato dall'Ufficio stampa di " + b.nome);
      p.fama = Math.max(0, (p.fama || 0) - 8);
      notizia(s, "L'Ufficio stampa di " + b.nome + " denuncia un tentato ricatto. Dietro c'è " + p.nome + ".", "scandalo");
      privato(s, p, "L'Ufficio stampa di " + b.nome + " ti ha smascherato: il ricatto è sulla Gazzetta. +10 Tracce, −8 fama, e la Prova è bruciata.");
      privato(s, b, "Il tuo Ufficio stampa ha smascherato " + p.nome + ": voleva ricattarti. La Prova su di te è bruciata.");
      return r.id;
    }
    privato(s, b, p.nome + " ha una Prova su di te (" + (prova.cosa || "una foto") + ", Ciclo " + prova.ciclo + "). In cambio del silenzio vuole: " + FAVORI[tipo].nome + ". Rispondi prima dell'Alba.");
    privato(s, p, "Hai mostrato la Prova a " + b.nome + ". Vuoi: " + FAVORI[tipo].nome + ". Deve rispondere prima dell'Alba.");
    return r.id;
  }
  function rispondiRicatto(s, p, id, scelta) {
    const r = ricatti(s).find((x) => x.id === id);
    if (!r || r.a !== p.id || r.stato !== "attesa") err("Ricatto non trovato.");
    const da = giocatore(s, r.da);
    if (scelta === "accetto") {
      controllaFavore(s, p, da, r.tipo);
      nuovoFavore(s, p, da, r.tipo, "ricatto", r.prova);
      r.stato = "accettato"; r.prova = null;
      privato(s, da, p.nome + " accetta: ti deve " + FAVORI[r.tipo].nome + ". La Prova resta in pegno finché non lo paga.");
      return;
    }
    if (scelta === "rifiuto") {
      da.prove = da.prove || []; da.prove.push({ ...r.prova, rifiutata: true });
      r.stato = "rifiutato"; r.prova = null;
      privato(s, da, p.nome + " rifiuta il ricatto. La Prova torna a te: ora puoi solo denunciarlo.");
      return;
    }
    if (scelta === "confesso") {
      p.tracce += 17; segnaTraccia(s, p, 17, "la tua confessione");
      da.tracce += 25; segnaTraccia(s, da, 25, "il ricatto confessato da " + p.nome); da.stato = Math.max(da.stato || 0, 1);
      da.peggiorReato = peggio(da.peggiorReato, "grave");
      r.stato = "confessato"; r.prova = null;
      notizia(s, p.nome + " confessa in Procura e fa un nome: " + da.nome + " lo ricattava.", "scandalo");
      privato(s, da, p.nome + " ha confessato e ha fatto il tuo nome: +25 Tracce, e la polizia ti guarda.");
      return;
    }
    if (scelta === "pari") {
      const i = (p.prove || []).findIndex((x) => x.su === da.id);
      if (i < 0) err("Non hai una Prova su " + da.nome + ".");
      p.prove.splice(i, 1);
      r.stato = "pari"; r.prova = null;
      privato(s, da, p.nome + " ti mostra una Prova su di te. Pari e patta: tutte e due le Prove sono bruciate.");
      privato(s, p, "Pari e patta con " + da.nome + ": tutte e due le Prove sono bruciate.");
      return;
    }
    err("Scelta non valida.");
  }
  // il rischio del ricatto: una pista fissa finche' il ricatto e' in piedi
  function pistaRicatto(s, p) {
    return ricatti(s).some((r) => r.da === p.id && r.stato === "attesa") || favori(s).some((f) => f.a === p.id && f.origine === "ricatto" && vivo(f));
  }

  // ------------------------------------------------------------ I SERVIZI DEI CONTATTI (v75)
  // Ogni contatto comprato fa un Servizio per Ciclo. Ogni Servizio lo rende piu' nervoso (rischioContatto sale).
  const SERVIZI = {
    agente: { nome: "La transenna", tracce: 3 },
    commissario: { nome: "Sposta la retata", tracce: 4 },
    banchiere: { nome: "Fammi vedere il conto", tracce: 2 },
    doganiere: { nome: "Cosa arriva stanotte?", tracce: 2 },
  };
  const PRESENTAZIONE = {
    agente: "Se ti serve un posto di blocco dove dico io, chiedi.",
    commissario: "Le retate le decido io. Anche dove.",
    banchiere: "I conti degli altri? Li vedo tutti.",
    doganiere: "So cosa arriva prima che arrivi.",
  };
  const MITTENTE_CONTATTO = { agente: "L'agente", commissario: "Vargas", banchiere: "Lenz", doganiere: "Il doganiere" };
  // la prima volta che compri un contatto, lui si presenta (una volta sola per tipo)
  function presentaContatto(s, p, chi) {
    p.presentati = p.presentati || {};
    if (p.presentati[chi] || !PRESENTAZIONE[chi]) return;
    p.presentati[chi] = true;
    privato(s, p, MITTENTE_CONTATTO[chi] + ": «" + PRESENTAZIONE[chi] + "» (app Soldi sporchi, La tua rete)");
  }
  function mioTurnoDiGiorno(s, p, cosa) {
    if (s.fase !== "giorno" || corrente(s).id !== p.id) err((cosa || "Questa cosa") + " si fa nel tuo turno, di giorno.");
    if (p.faro > 0) err("Sei al Faro.");
  }
  function servizio(s, p, a) {
    const chi = a.chi;
    if (!Object.prototype.hasOwnProperty.call(SERVIZI, chi || "")) err("Contatto sconosciuto.");
    if (chi === "agente" && !ISOLE.includes(a.isola)) err("Scegli l'isola dell'agente.");
    const k = chi === "agente" ? "agente_" + a.isola : chi;
    const c = (p.corrotti || {})[k];
    if (!c) err("Non hai questo contatto.");
    if (p.faro > 0) err("Sei al Faro.");
    if (c.sospetto != null) err("È sotto inchiesta: non risponde al telefono.");
    // il doganiere: la seconda telefonata (quale carico tenere da parte) fa parte dello stesso Servizio
    if (chi === "doganiere" && a.n != null) return riservaCarico(s, p, a.n);
    if (c.servizioCiclo === s.ciclo) err("Questo Ciclo ti ha già fatto un Servizio.");
    if (chi === "agente") {
      mioTurnoDiGiorno(s, p, "La transenna");
      if (s.pending) err("Prima finisci la scelta in corso.");
      if (s.ciclo - (c.dal || 0) < 2) err("L'agente non si fida ancora: deve passare un altro Ciclo.");
      const l = s.lotti.find((x) => x.giro === "o" && x.idx === a.pos);
      if (!l || l.tipoCasella !== "lotto" || l.isola !== a.isola) err("Scegli una via di " + NOMI_ISOLE[a.isola] + ".");
      if (s.players.some((q) => !q.fallito && !q.inner && q.pos === a.pos)) err("Lì adesso c'è una pedina: scegli un'altra casella.");
      if (s.transennaCiclo === s.ciclo) err("In questo Ciclo c'è già stata una transenna.");
      s.transenna = { pos: a.pos, isola: a.isola, da: p.id };
      s.transennaCiclo = s.ciclo;
      notizia(s, "Posto di blocco a sorpresa in " + l.nome + ", " + NOMI_ISOLE[a.isola] + ". Chi ci si ferma viene controllato.", "evento");
      log(s, "Posto di blocco a sorpresa in " + l.nome + ".");
      privato(s, p, "L'agente di " + NOMI_ISOLE[a.isola] + ": «Fatto. In " + l.nome + " c'è la transenna fino al tuo prossimo turno. Attento: vale anche per te.»");
    } else if (chi === "commissario") {
      mioTurnoDiGiorno(s, p, "La retata");
      if (s.pending) err("Prima finisci la scelta in corso.");
      if (!LUOGHI[a.luogo] || a.luogo === "palazzo") err("Scegli un posto della notte.");
      if (s.ordineVargas && s.ordineVargas.ciclo === s.ciclo) err("Stanotte Vargas ha già altri ordini.");
      s.ordineVargas = { luogo: a.luogo, da: p.id, ciclo: s.ciclo };
      privato(s, p, "Vargas: «Stanotte a " + nomeLuogo(a.luogo) + " ci saranno i miei uomini. Per tutti.»");
    } else if (chi === "banchiere") {
      if (s.fase === "notte") inNotte(s, p);
      else if (s.fase !== "giorno") err("Adesso non si può.");
      const b = s.players.find((x) => x.id === a.bersaglio);
      if (!b || b.id === p.id || b.fallito) err("Scegli un rivale.");
      p.contiVisti = p.contiVisti || {};
      const cv = { ciclo: s.ciclo, puliti: Math.round((b.cash || 0) / 1e6), sporchi: Math.round((b.sporchi || 0) / 1e6) };
      p.contiVisti[b.id] = cv;
      privato(s, p, "Lenz: «" + b.nome + " ha circa " + cv.puliti + " milioni puliti e circa " + cv.sporchi + " milioni sporchi. Io non ti ho detto niente.»");
    } else if (chi === "doganiere") {
      inNotte(s, p);
      const lv = livelloSblocco(s, p);
      const lista = s.notte.occasioni.filter((o) => (o.luogo === "porto" || o.luogo === "aeroporto") && !o.preso && (!o.riservata || o.riservata === p.id)).filter((o) => {
        const O = OCCASIONI.find((x) => x.id === o.id); return O && O.sblocco <= lv && (!O.soloSetta || inSetta(p)) && o.alle > s.notte.ora;
      }).map((o) => ({ n: o.n, nome: OCCASIONI.find((x) => x.id === o.id).nome, luogo: o.luogo, dalle: o.dalle, alle: o.alle }));
      p.arrivi = { ciclo: s.ciclo, lista, riservato: null };
      privato(s, p, lista.length ? "Il doganiere: «Stanotte arrivano: " + lista.map((x) => x.nome + " (" + nomeLuogo(x.luogo) + ", dalle " + ORE[x.dalle] + " alle " + ORE[x.alle] + ")").join("; ") + ". Dimmi quale tengo da parte per te.»" : "Il doganiere: «Stanotte non arriva niente per te. Riprova domani.»");
    }
    c.servizioCiclo = s.ciclo; c.servizi = (c.servizi || 0) + 1;
    const tr = SERVIZI[chi].tracce;
    p.tracce += tr; segnaTraccia(s, p, tr, "un Servizio di " + nomeContatto(k));
    p.pulitoCiclo = false; p.macchia = true;
    return true;
  }
  function riservaCarico(s, p, n) {
    inNotte(s, p);
    const ar = p.arrivi;
    if (!ar || ar.ciclo !== s.ciclo) err("Prima chiedi al doganiere cosa arriva stanotte.");
    if (ar.riservato != null) err("Il doganiere ti ha già tenuto da parte un carico.");
    if (!ar.lista.some((x) => x.n === n)) err("Questo carico non era nella lista.");
    const o = s.notte.occasioni.find((x) => x.n === n);
    if (!o || o.preso) err("Troppo tardi: qualcuno l'ha già preso.");
    if (o.riservata && o.riservata !== p.id) err("Troppo tardi: è già di un altro.");
    o.riservata = p.id; ar.riservato = n;
    privato(s, p, "Il doganiere: «Tengo da parte " + OCCASIONI.find((x) => x.id === o.id).nome + " per te. " + nomeLuogo(o.luogo) + ", prima delle " + ORE[o.alle] + ".»");
    return true;
  }
  // la contromossa del Sindaco: gratis, una volta per Ciclo, nel suo turno
  function togliTransenna(s, p) {
    mioTurnoDiGiorno(s, p, "Togliere la transenna");
    if (s.sindaco !== p.id) err("Solo il Sindaco può far togliere una transenna.");
    if (!s.transenna) err("Non c'è nessuna transenna.");
    if (p.togliCiclo === s.ciclo) err("In questo Ciclo hai già fatto togliere una transenna.");
    const l = s.lotti.find((x) => x.giro === "o" && x.idx === s.transenna.pos);
    p.togliCiclo = s.ciclo; s.transenna = null;
    notizia(s, "Il Sindaco fa togliere la transenna di " + (l ? l.nome : "via") + ".", "evento");
    log(s, "Il Sindaco " + p.nome + " fa togliere la transenna di " + (l ? l.nome : "via") + ".");
  }
  // l'umore dei contatti, per la vista (calcolato senza scrivere)
  function umoreContatti(s, p) {
    const u = {};
    for (const k of Object.keys(p.corrotti || {})) {
      const c = p.corrotti[k];
      if (c && c.sospetto != null) { u[k] = "inchiesta"; continue; }
      const r = rischioContatto(s, p, k);
      u[k] = r < 0.08 ? "tranquillo" : r <= 0.15 ? "teso" : "nervoso";
    }
    return u;
  }

  // ------------------------------------------------------------ LA FEDINA PULITA (v75)
  // Ogni Ciclo senza macchie: +1. A 2 l'Esposto, a 4 l'Inchiesta, a 6 l'Opera pubblica. Un atto sporco: si riparte da 0.
  const POTERI_FEDINA = {
    2: "Vera: «Sei pulito da 2 Cicli: ora la polizia ti ascolta. Dal Municipio, \"Cittadino onesto\", puoi firmare un esposto su un posto della notte.»",
    4: "Vera: «4 Cicli puliti. Ora in Procura ti credono: dal Municipio puoi aprire un'Inchiesta vera su un rivale.»",
    6: "Vera: «6 Cicli puliti: sei il cittadino modello della Laguna. Dal Municipio puoi donare un'opera alla città, con il tuo nome sopra.»",
  };
  const OPERE_PUBBLICHE = { teatro: { nome: "Teatro", art: "il " }, parco: { nome: "Parco", art: "il " }, scuola: { nome: "Scuola", art: "la " } };
  const COSTO_OPERA_PUBBLICA = 3_000_000;
  function opere(s) { if (!Array.isArray(s.opere)) s.opere = []; return s.opere; }
  function fedinaSporca(s, p) { return !!p.macchia || inSetta(p) || Object.keys(p.corrotti || {}).length > 0 || (p.evasione || 0) > 0; }
  // all'Alba, dopo le rate dei contatti: il contatore della Fedina
  function albaFedina(s, p) {
    const prima = p.fedina || 0;
    p.fedina = fedinaSporca(s, p) ? 0 : prima + 1;
    p.macchia = false;
    if (prima > 0 && p.fedina === 0) { privato(s, p, "Vera: «La tua Fedina pulita è andata. Si ricomincia da zero.»"); ritiraFascicolo(s, p); }
    if (p.fedina !== prima && POTERI_FEDINA[p.fedina]) privato(s, p, POTERI_FEDINA[p.fedina]);
  }
  // la Fedina scende sotto 4 con un fascicolo aperto: accuse ritirate
  function ritiraFascicolo(s, p) {
    if (!p.fascicolo) return;
    const b = s.players.find((x) => x.id === p.fascicolo.su);
    p.inchiestaBlocco = p.inchiestaBlocco || {}; p.inchiestaBlocco[p.fascicolo.su] = s.ciclo + 2;
    p.fascicolo = null;
    p.fama = Math.max(0, (p.fama || 0) - 5);
    notizia(s, p.nome + " ritira le accuse contro " + (b ? b.nome : "un rivale") + ": non è più credibile.", "voce");
    privato(s, p, "Il tuo fascicolo è chiuso: senza Fedina pulita in Procura non ti credono più. −5 fama.");
  }
  function controllaFedina(p, quanto) { if ((p.fedina || 0) < quanto) err("Ti serve Fedina pulita " + quanto + "."); }
  function luogoEsposto(l) { return !!LUOGHI[l] && l !== "palazzo" && l !== "faro"; }
  function esposto(s, p, luogo) {
    mioTurnoDiGiorno(s, p, "L'esposto");
    controllaFedina(p, 2);
    if (!luogoEsposto(luogo)) err("Scegli un posto della notte.");
    if (p.espostoCiclo === s.ciclo) err("In questo Ciclo hai già firmato un esposto.");
    if (p.espostoStop != null && p.espostoStop >= s.ciclo) err("Dopo l'allarme inutile, la polizia per ora non ti ascolta.");
    if (s.esposto && s.esposto.ciclo === s.ciclo) err("La polizia ha già una segnalazione per stanotte.");
    s.esposto = { luogo, da: p.id, ciclo: s.ciclo };
    p.espostoCiclo = s.ciclo;
    notizia(s, "Un cittadino ha segnalato movimenti sospetti. Stanotte la polizia promette controlli.", "voce");
    privato(s, p, "Esposto firmato: stanotte la polizia sarà a " + nomeLuogo(luogo) + ". Se nessuno fa affari lì, perdi 4 di fama.");
  }
  // all'inizio dell'Alba, prima che aggiornaPiste() svuoti luoghiNotte
  function esitoEsposto(s) {
    const e = s.esposto; if (!e) return;
    s.esposto = null;
    const p = s.players.find((x) => x.id === e.da); if (!p) return;
    const colti = s.players.filter((q) => q.id !== p.id && (q.luoghiNotte || {})[e.luogo]).length;
    if (colti > 0) {
      p.fama = (p.fama || 0) + 4;
      privato(s, p, "Il tuo esposto ha colto nel segno: stanotte a " + nomeLuogo(e.luogo) + " c'era chi faceva affari (" + colti + (colti === 1 ? " persona" : " persone") + "). +4 fama.");
      notizia(s, "I controlli di stanotte a " + nomeLuogo(e.luogo) + " hanno dato frutti.", "voce");
    } else {
      p.fama = Math.max(0, (p.fama || 0) - 4); p.espostoStop = s.ciclo + 1;
      privato(s, p, "Esposto a vuoto: a " + nomeLuogo(e.luogo) + " stanotte non c'era nessuno. −4 fama, e per un Ciclo la polizia non ti ascolta.");
      notizia(s, "Controlli a vuoto stanotte a " + nomeLuogo(e.luogo) + ". Allarme inutile.", "voce");
    }
  }
  // all'inizio della notte: la retata di Vargas e i controlli dell'esposto (il blackout vince)
  function retateNotte(s) {
    const metti = (luogo, chi, msg) => {
      if (!LUOGHI[luogo]) return;
      if (s.blackout && LUOGHI[luogo].isola === s.blackout) { if (chi) privato(s, chi, msg); return; }
      s.notte.pericolo[luogo] = "pericoloso";
    };
    const ov = s.ordineVargas;
    if (ov && ov.ciclo === s.ciclo) metti(ov.luogo, s.players.find((x) => x.id === ov.da), "Vargas: «Col blackout, niente retata.»");
    const e = s.esposto;
    if (e && e.ciclo === s.ciclo) metti(e.luogo, s.players.find((x) => x.id === e.da), "Col blackout la polizia non va a " + nomeLuogo(e.luogo) + " stanotte. L'esposto conta lo stesso all'Alba.");
  }
  // L'Inchiesta: un fascicolo alla volta, un indizio vero a ogni Alba (se c'e')
  function chiavePista(x) { return x.k + (x.luogo ? ":" + x.luogo : ""); }
  function testoIndizio(s, b, x) {
    if (x.k === "voci") {
      const st = (b.storiaTracce || []).filter((y) => y.ciclo >= s.ciclo - 2).sort((m, n) => n.quanto - m.quanto)[0];
      return st ? b.nome + " è stato collegato a «" + st.cosa + "» nel Ciclo " + (st.ciclo + 1) + "." : b.nome + " fa troppi affari sporchi: in giro se ne parla.";
    }
    if (x.k === "luogo") return b.nome + " è stato visto troppe notti a " + nomeLuogo(x.luogo) + ".";
    if (x.k === "soldi") return b.nome + " ha ripulito e speso più di quanto rendono i suoi locali.";
    if (x.k === "complici") return "Un contatto di " + b.nome + " è sotto inchiesta e sta parlando.";
    if (x.k === "ricatto") return b.nome + " tiene qualcuno in pugno con un ricatto.";
    return b.nome + " ha qualcosa da nascondere.";
  }
  const PISTE_INDIZIO = ["voci", "luogo", "soldi", "complici", "ricatto"];
  function inchiestaApri(s, p, idB) {
    mioTurnoDiGiorno(s, p, "L'inchiesta");
    controllaFedina(p, 4);
    if (p.fascicolo) err("Hai già un fascicolo aperto: un'inchiesta alla volta.");
    const b = s.players.find((x) => x.id === idB);
    if (!b || b.id === p.id) err("Scegli un rivale.");
    if (b.fallito) err(b.nome + " è fallito.");
    if ((p.inchiestaBlocco || {})[b.id] > s.ciclo) err("Su di lui hai già indagato da poco.");
    controllaSilenzio(s, p, b.id);
    p.fascicolo = { su: b.id, aperto: s.ciclo, albe: 0, indizi: [] };
    b.sottoInchiesta = s.ciclo;
    privato(s, b, "Vera: «Qualcuno fa domande su di te in Procura. Non so chi.»");
    privato(s, p, "Hai aperto un fascicolo su " + b.nome + ". Ogni Alba un indizio vero, se c'è. Con due indizi pubblichi. Lui sa che qualcuno indaga, non sa chi.");
  }
  // all'Alba, dopo aggiornaPiste() di tutti e prima dei processi
  function albaFascicoli(s) {
    for (const p of s.players) {
      const f = p.fascicolo; if (!f) continue;
      const b = s.players.find((x) => x.id === f.su);
      if (!b) { p.fascicolo = null; continue; }
      f.albe += 1;
      if (f.indizi.length < 2) {
        const presi = new Set(f.indizi.map(chiavePista));
        const ps = piste(s, b).filter((x) => PISTE_INDIZIO.includes(x.k) && x.peso > 0 && !presi.has(chiavePista(x)));
        if (ps.length) {
          let r = rng(s) * ps.reduce((a, y) => a + y.peso, 0), scelta = ps[0];
          for (const y of ps) { r -= y.peso; if (r <= 0) { scelta = y; break; } }
          const testo = testoIndizio(s, b, scelta);
          f.indizi.push({ k: scelta.k, luogo: scelta.luogo || null, testo, ciclo: s.ciclo });
          privato(s, p, "Fascicolo su " + b.nome + ": nuovo indizio. " + testo);
        } else privato(s, p, f.albe === 1 && !f.indizi.length ? "Fascicolo su " + b.nome + ": su di lui non c'è niente da trovare. Per ora." : "Fascicolo su " + b.nome + ": stanotte niente di nuovo.");
      }
      if (f.albe >= 4) {
        p.fascicolo = null;
        p.inchiestaBlocco = p.inchiestaBlocco || {}; p.inchiestaBlocco[b.id] = s.ciclo + 2;
        privato(s, p, "Fascicolo su " + b.nome + " archiviato: troppo tempo senza pubblicare.");
      }
    }
  }
  function effettoInchiesta(n) { return n >= 2 ? { fama: 15, tracce: 25, stato: 1, mia: 6 } : { fama: 6, tracce: 10, stato: 0, mia: 2 }; }
  function inchiestaPubblica(s, p) {
    mioTurnoDiGiorno(s, p, "Pubblicare l'inchiesta");
    const f = p.fascicolo;
    if (!f || !f.indizi.length) err("Ti serve almeno un indizio.");
    const b = giocatore(s, f.su);
    controllaSilenzio(s, p, b.id);
    const e = effettoInchiesta(f.indizi.length);
    b.fama = Math.max(0, (b.fama || 0) - e.fama);
    b.tracce = (b.tracce || 0) + e.tracce; segnaTraccia(s, b, e.tracce, "l'inchiesta di " + p.nome);
    if (e.stato && (b.stato || 0) < 3) {
      b.stato = Math.min(3, (b.stato || 0) + 1);
      b.ultimaPista = { k: "inchiesta", testo: "L'inchiesta di " + p.nome + " sulla Gazzetta.", ciclo: s.ciclo + 1 };
    }
    p.fama = (p.fama || 0) + e.mia;
    if (f.indizi.length >= 2) notizia(s, "INCHIESTA di " + p.nome + " su " + b.nome + ". " + f.indizi[0].testo + " " + f.indizi[1].testo, "scandalo");
    else notizia(s, p.nome + " accusa " + b.nome + ": " + f.indizi[0].testo.replace(/\.$/, "") + ". Per ora è un indizio solo.", "scandalo");
    privato(s, b, p.nome + " ha pubblicato un'inchiesta su di te: −" + e.fama + " fama" + (e.stato ? " e la polizia sale di un gradino" : "") + ".");
    privato(s, p, "Inchiesta pubblicata: +" + e.mia + " fama.");
    p.inchiestaBlocco = p.inchiestaBlocco || {}; p.inchiestaBlocco[b.id] = s.ciclo + 3;
    p.fascicolo = null;
  }
  function nomeOpera(o) { const O = OPERE_PUBBLICHE[o.opera] || { nome: "Opera", art: "l'" }; return O.nome; }
  function operaPubblica(s, p, isola, tipo) {
    mioTurnoDiGiorno(s, p, "L'opera pubblica");
    controllaFedina(p, 6);
    if (p.operaFatta) err("Hai già donato un'opera alla città: una sola a partita.");
    if (!Object.prototype.hasOwnProperty.call(OPERE_PUBBLICHE, tipo || "")) err("Scegli teatro, parco o scuola.");
    if (!ISOLE.includes(isola)) err("Scegli un'isola.");
    const gia = opere(s).find((o) => o.isola === isola);
    if (gia) err("Qui c'è già " + OPERE_PUBBLICHE[gia.opera].art + nomeOpera(gia) + (gia.nome ? " di " + gia.nome : "") + ".");
    if (p.cash < COSTO_OPERA_PUBBLICA) err("Servono " + euro(COSTO_OPERA_PUBBLICA) + " puliti.");
    p.cash -= COSTO_OPERA_PUBBLICA;
    flusso(s, p, null, COSTO_OPERA_PUBBLICA, "Opera pubblica a " + NOMI_ISOLE[isola], true);
    opere(s).push({ isola, opera: tipo, di: p.id, nome: p.nome, ciclo: s.ciclo });
    s.valore[isola] = clamp(s.valore[isola] + 1, 1, 10);
    p.fama = (p.fama || 0) + 8; p.operaFatta = true;
    notizia(s, p.nome + " dona alla città " + OPERE_PUBBLICHE[tipo].art + OPERE_PUBBLICHE[tipo].nome + " di " + NOMI_ISOLE[isola] + ". L'isola vale di più per tutti.", "evento");
    log(s, p.nome + " dona alla città " + OPERE_PUBBLICHE[tipo].art + OPERE_PUBBLICHE[tipo].nome + " di " + NOMI_ISOLE[isola] + ".");
  }
  // condanna: Fedina a zero, fascicolo ritirato, targhe tolte
  function fedinaCondanna(s, p) {
    p.fedina = 0;
    ritiraFascicolo(s, p);
    for (const o of opere(s)) if (o.di === p.id) {
      o.di = null; o.nome = null;
      notizia(s, "Tolta la targa " + (o.opera === "scuola" ? "dalla Scuola" : "dal " + nomeOpera(o)) + " di " + NOMI_ISOLE[o.isola] + ".", "scandalo");
    }
  }
  // l'azione macchia la Fedina? (per l'avviso "perdi la Fedina pulita" prima di confermare). Non scrive niente.
  function macchiaAzione(s, p, a) {
    if (!a || !p) return false;
    switch (a.tipo) {
      case "corrompi": case "ricicla": case "ricicla_banca": case "ricettatore": case "busta_licenza": case "regalo_assessore":
      case "ricatto": case "servizio": case "fonda_setta": case "lava_setta": return true;
      case "chiamata": return !!a.si;
      case "rispondi_invito": return !!a.si;
      case "evasione": return (Number(a.quota) || 0) > 0;
      case "articolo": case "regala": case "versa_setta": return !!a.sporchi;
      case "compra_oggetto": { const O = oggettoDef(a.oggetto); return !!(O && O.illegale) || (p.sporchi || 0) > 0; }
      case "occasione": { const o = s.notte && s.notte.occasioni.find((x) => x.n === a.n); const O = o && OCCASIONI.find((x) => x.id === o.id); return !!(O && (!O.legale || (O.costo > 0 && (p.sporchi || 0) > 0))); }
      // di notte si paga prima con gli sporchi (pagaMisto): anche 1 euro sporco macchia
      case "attivita": case "spa": case "vai_serata": case "gioca_serata": case "incontro": case "rispondi_incontro": return (p.sporchi || 0) > 0 && (a.tipo !== "rispondi_incontro" || !!a.si);
      default: return false;
    }
  }

  // ------------------------------------------------------------ pagamenti e debiti
  // Il tasso VERO che un giocatore paga sul suo debito a ogni Alba (lo stesso numero ovunque: app Banca, finestre, messaggi).
  //   debito d'emergenza 25% · Ereditiera 0% · altrimenti il tasso dei prestiti (10%, o quello deciso da chi comanda la Banca della Laguna)
  function tassoDebito(s, p) { return p.emergenza ? N.emergenzaInt : p.pacchetto === "ereditiera" ? 0 : tassoPrestiti(s, p); }
  function paga(s, p, importo, a) {
    const investiti0 = p.cash < importo ? valoreTitoli(s, p) : 0, cash0 = p.cash;
    if (p.cash < importo) raccogli(s, p, importo - p.cash);
    const pagato = Math.min(importo, Math.max(0, p.cash));
    p.cash -= pagato; if (a) a.cash += pagato;
    const venduto = cash0 < importo ? round(investiti0 - valoreTitoli(s, p)) : 0;
    if (pagato < importo) {
      const resto = importo - pagato;
      p.debito += resto; if (a) a.cash += resto;
      p.emergenza = true;
      notizia(s, "Voci di corridoio: " + p.nome + " ha chiesto un prestito d'emergenza alla Banca Centrale.", "voce");
    }
    // chi non aveva abbastanza contanti lo deve sapere subito: cosa e' stato venduto, quanto debito, a che tasso
    if (cash0 < importo && importo > 0) {
      const resto = round(importo - pagato), tasso = Math.round(tassoDebito(s, p) * 100);
      p.avvisoDebito = { n: (s.nAvvisi = (s.nAvvisi || 0) + 1), ciclo: s.ciclo + 1, giorno: s.giorno + 1, dovuto: round(importo), contanti: round(Math.max(0, cash0)), venduto, debito: resto, debitoTotale: round(p.debito), tasso, a: a ? a.id : null };
      privato(s, p, "Non avevi abbastanza contanti per pagare " + euro(importo) + (a ? " a " + a.nome : "") + "." + (venduto > 0 ? " La Banca ha venduto " + euro(venduto) + " delle tue azioni e cripto." : "") + (resto > 0 ? " Il resto (" + euro(resto) + ") è diventato un DEBITO D'EMERGENZA: costa il " + tasso + "% a ogni Alba su tutto il tuo debito (ora " + euro(p.debito) + "), e a ogni Alba la Banca si prende metà dei tuoi contanti finché non è pagato. Restituiscilo dall'app Banca appena puoi." : ""));
    }
  }
  function valoreTitoli(s, p) { let v = 0; for (const a of AZIENDE) v += (p.azioni[a] || 0) * s.borsa[a]; for (const m of MONETE) v += (p.cripto[m] || 0) * s.cripto[m]; return v; }
  function raccogli(s, p, need) {
    for (const a of AZIENDE) { if (need <= 0) return; const v = (p.azioni[a] || 0) * s.borsa[a]; const q = Math.min(v, need); if (q > 0) { p.azioni[a] -= q / s.borsa[a]; p.cash += q; need -= q; } }
    for (const m of MONETE) { if (need <= 0) return; const v = (p.cripto[m] || 0) * s.cripto[m]; const q = Math.min(v, need); if (q > 0) { p.cripto[m] -= q / s.cripto[m]; p.cash += q; need -= q; } }
    if (need > 0 && p.sporchi > 0) { /* gli sporchi non pagano affitti puliti */ }
  }

  // ------------------------------------------------------------ indagini e pene
  // quanto ti proteggono poliziotti comprati e sette (0 = niente, 0,7 = il massimo)
  function protezione(s, p) {
    let prot = 0;
    if (Object.keys(p.corrotti).some((k) => k.startsWith("agente_"))) prot += N.prot.agente;
    if (p.corrotti.commissario) prot += N.prot.commissario;
    // ILL-12: chi e' in piu' sette conta solo la protezione della setta migliore, non la somma
    let setta = 0;
    for (const id of p.sette) { const st = s.sette.find((x) => x.id === id); const lv = livelloSetta(s, st); setta = Math.max(setta, [0, 0.1, 0.2, 0.3, 0.3][lv] + (st && st.commissario ? 0.3 : 0)); }
    return Math.min(N.prot.max, prot + setta);
  }
  // La Resa dei conti: prima della fine la Procura apre l'inchiesta finale, a tutti viene detto.
  // All'ultima Alba chi ha lasciato Tracce rischia una multa sul patrimonio (niente prigione: la partita e' finita).
  function annunciaResa(s) {
    if (s.resaAnnunciata) return;
    s.resaAnnunciata = true;
    notizia(s, "La Procura apre l'inchiesta finale: all'ultima Alba controllerà i conti di tutti. Chi ha lasciato Tracce rischia grosso.", "scandalo");
    for (const p of s.players) privato(s, p, "Vera: \"Ultima chiamata. La Procura apre l'inchiesta finale: all'ultima Alba guarda i conti di tutti. Se hai fatto affari sporchi, adesso è il momento di stare puliti, ripulire i soldi e scaricare i contatti a rischio.\"");
  }
  // Un'inchiesta tiene occupata la polizia: se un altro giocatore e' Indagato (o al Processo),
  // per tutti gli altri la notte e i controlli dell'Alba sono un po' meno pericolosi.
  function poliziaOccupata(s, p) {
    const su = s.players.filter((q) => q.id !== p.id && !q.fallito && !(q.faro > 0) && (q.stato || 0) >= 3).sort((a, b) => b.stato - a.stato)[0];
    return su || null;
  }
  function rischioResa(s, p) {
    if (!p.peggiorReato && !(p.sporchi > 0)) return 0;
    const tr = p.tracce * (p.fama >= 60 ? 1.25 : 1);
    return clamp(tr / (tr + N.resaK) * (1 - protezione(s, p)) + N.resaStato * (p.stato || 0), 0, N.resaMax);
  }
  function resaDeiConti(s) {
    s.resa = [];
    for (const p of s.players) {
      if (p.fallito || (!p.peggiorReato && !(p.sporchi > 0))) continue;
      if (p.ultimaSentenza && p.ultimaSentenza.ciclo === s.ciclo - 1 && !p.peggiorReato) { privato(s, p, "Resa dei conti: sei appena stato condannato all'ultima Alba. La Procura non ti processa due volte."); continue; } // ILL-23
      if (rng(s) >= rischioResa(s, p)) { privato(s, p, "Resa dei conti: la Procura non trova niente su di te."); continue; }
      const gf = gravitaFinale(s, p, p.peggiorReato || "lieve", { senzaRecidiva: true }), gravita = gf.gravita;
      if (gf.avvocato) togliOggetto(p, "avvocato");
      const multa = round(Math.min(0.6, PENE[gravita].multa * N.resaMulta) * Math.max(0, patrimonio(s, p, false)) * (haAttivita(s, p, "legale") ? 0.7 : 1));
      const protetti = Math.min(p.sporchi, (haPiano(p, "caveau") && gravita !== "gravissima" ? 5_000_000 : 0) + (haOggetto(p, "cassetta") ? 1_000_000 : 0));
      const sporchiPersi = round(p.sporchi - protetti);
      p.sporchi = protetti; paga(s, p, multa, null); p.fama = Math.max(0, p.fama - PENE[gravita].fama);
      s.resa.push({ id: p.id, nome: p.nome, gravita, multa, sporchi: sporchiPersi });
      privato(s, p, "Resa dei conti (" + gravita + "): multa di " + euro(multa) + (sporchiPersi ? " e confisca di " + euro(sporchiPersi) + " sporchi" : "") + ".");
      notizia(s, "Resa dei conti: la Procura condanna " + p.nome + " (reato " + gravita + "). Multa di " + euro(multa) + ".", "scandalo");
    }
  }
  // ------------------------------------------------------------ le piste
  function nomeLuogo(l) { return (LUOGHI[l] || { nome: l }).nome; }
  // ricordo da cosa vengono le Tracce: quando la polizia sale, sa dirti quale affare ti ha tradito
  function segnaTraccia(s, p, quanto, cosa) {
    if (!(quanto > 0)) return;
    p.storiaTracce = (p.storiaTracce || []).filter((x) => x.ciclo >= s.ciclo - 2);
    p.storiaTracce.push({ cosa, quanto: Math.round(quanto), ciclo: s.ciclo });
    if (p.storiaTracce.length > 12) p.storiaTracce.shift();
  }
  // all'Alba: i posti dove hai fatto affari stanotte si scaldano, gli altri si raffreddano;
  // i soldi ripuliti o spesi in lusso oltre quello che rendono i tuoi locali accendono la Finanza.
  function aggiornaPiste(s, p, renditeLegali) {
    p.calore = p.calore || {};
    const stanotte = p.luoghiNotte || {};
    for (const l of new Set([...Object.keys(p.calore), ...Object.keys(stanotte)])) {
      p.calore[l] = Math.max(0, (p.calore[l] || 0) + (stanotte[l] ? 1 : -1));
      if (!p.calore[l]) delete p.calore[l];
    }
    for (const l of Object.keys(stanotte)) {
      const c = p.calore[l];
      if (c === 1) privato(s, p, "Vera: \"" + nomeLuogo(l) + ": qualcuno ha notato la tua faccia. Se ci torni stanotte, ti riconoscono più facilmente.\"");
      else if (c === 2) privato(s, p, "Vera: \"" + nomeLuogo(l) + ": c'è una macchina civetta che ieri non c'era. Tornarci adesso è un rischio vero.\"");
      else if (c >= 3) privato(s, p, "Vera: \"" + nomeLuogo(l) + ": ormai ti conoscono tutti. Tornarci è come firmare.\"");
    }
    p.luoghiNotte = {};
    // la Finanza: soldi ripuliti e lusso comprato contro quello che rendono le attivita' pulite
    const sporco = p.sporchi > 0 || p.riciclTot > 0 || p.peggiorReato;
    const eccesso = (p.ripulitiCiclo || 0) + 0.5 * (p.lussoCiclo || 0) - (2 * (renditeLegali || 0) + 500_000);
    p.calSoldi = (p.calSoldi || 0) * 0.6;
    if (sporco && eccesso > 0) {
      p.calSoldi = Math.min(10, p.calSoldi + eccesso / 1_000_000);
      if (p.corrotti && p.corrotti.banchiere) p.corrotti.banchiere.usi = (p.corrotti.banchiere.usi || 0) + 1;
      if (p.calSoldi >= 1) privato(s, p, "Il banchiere Lenz: \"La Finanza guarda i tuoi conti. Hai ripulito e speso più di quanto rendono i tuoi locali. Rallenta, o apri attività che giustifichino quei soldi.\"");
    }
    if (p.calSoldi < 0.2) p.calSoldi = 0;
    p.ripulitiCiclo = 0; p.lussoCiclo = 0;
  }
  // le piste che la polizia segue, con il loro peso (in Tracce)
  function piste(s, p) {
    const out = [];
    if (p.tracce > 0) {
      const st = (p.storiaTracce || []).filter((x) => x.ciclo >= s.ciclo - 2).sort((a, b) => b.quanto - a.quanto)[0];
      out.push({ k: "voci", peso: p.tracce, testo: st ? "La polizia ha collegato a te " + (st.cosa.startsWith("i ") || st.cosa.startsWith("il ") ? st.cosa : "«" + st.cosa + "»") + (st.ciclo === s.ciclo ? ", di questo Ciclo." : ", del Ciclo " + (st.ciclo + 1) + ".") : "Troppi affari sporchi: in giro si parla di te." });
    }
    for (const [l, c] of Object.entries(p.calore || {})) if (c >= 1) out.push({ k: "luogo", luogo: l, calore: c, peso: N.pistaLuogo * c * c, testo: "Ti hanno riconosciuto: troppe notti nello stesso posto (" + nomeLuogo(l) + ")." });
    // ILL-02: il banchiere Lenz, se e' dei tuoi, fa sparire meta' dei conti che non tornano
    if (p.calSoldi > 0) out.push({ k: "soldi", peso: N.pistaSoldi * p.calSoldi * (p.corrotti && p.corrotti.banchiere ? LENZ_COPRE : 1), testo: "La Finanza ha visto i tuoi conti: i tuoi soldi non tornano con quello che rendono i tuoi locali." + (p.corrotti && p.corrotti.banchiere ? " Il banchiere Lenz ne copre la metà." : "") });
    // ILL-19: una Prova pesa solo quando viene CONSEGNATA alla polizia (la denuncia). Finche' resta in tasca a un rivale non conta.
    const denunce = (p.denunce || []).filter((x) => x.ciclo >= s.ciclo - 2).length;
    if (denunce) out.push({ k: "rivali", peso: N.pistaRivale * denunce, testo: "Qualcuno ha consegnato alla polizia una prova contro di te. Non sai chi." });
    // il ricatto in piedi: una pista fissa (non si somma), sparisce quando il Favore e' pagato, scaduto o rotto
    if (pistaRicatto(s, p)) out.push({ k: "ricatto", peso: 10, testo: "Qualcuno ha parlato di un ricatto: la polizia vuole sapere chi tiene in pugno chi." });
    const nervosi = Object.keys(p.corrotti || {}).filter((k) => p.corrotti[k] && p.corrotti[k].sospetto != null);
    if (nervosi.length) out.push({ k: "complici", peso: N.pistaComplice * nervosi.length, testo: "Un tuo complice è sotto inchiesta e ha parlato troppo." });
    // chi e' molto famoso e' piu' guardato: prima era un +25% nascosto, ora e' una pista scritta come le altre
    if (p.fama >= 60 && out.length) out.push({ k: "fama", peso: 0.25 * out.reduce((a, x) => a + x.peso, 0), testo: "Sei troppo famoso: giornali e polizia guardano tutto quello che fai." });
    return out;
  }
  const LENZ_COPRE = 0.5;
  // Le Tracce come le vede il giocatore: una barra da 0 a 5 tacche, mai il numero.
  const TACCHE = [1, 10, 25, 45, 70];
  function tacche(p) { const t = (p && p.tracce) || 0; return TACCHE.filter((x) => t >= x).length; }
  // Il controllo di fine giornata (ce ne sono 4 a Ciclo, uno a fine di ogni Giorno): quanto e' probabile che la polizia
  // salga di un gradino. UNA sola funzione: la usano il tiro vero e la vista.
  function rischioControllo(s, p) {
    if (p.faro > 0) return { su: 0, tr: 0, piste: [] };
    const ps = piste(s, p), tr = ps.reduce((a, x) => a + x.peso, 0);
    return { su: tr > 0 ? tr / (tr + N.indagineK) * (1 - protezione(s, p)) * (poliziaOccupata(s, p) ? N.occupata : 1) : 0, tr, piste: ps };
  }
  function tiroIndagine(s, p) {
    if (p.faro > 0) return;
    const rc = rischioControllo(s, p), ps = rc.piste, tr = rc.tr, pUp = rc.su;
    const vecchio = p.stato;
    if (tr > 0 && rng(s) < pUp) p.stato = Math.min(4, p.stato + 1);
    else if (p.pulitoCiclo && p.stato > 0 && rng(s) < N.scendi) p.stato -= 1;
    if (p.stato !== vecchio) {
      const segnali = ["Ti senti più tranquillo: nessuno parla di te.", "Un personaggio ti dice: \"Si parla di te, in giro.\"", "Vedi spesso un'auto della polizia vicino ai tuoi locali.", "La Gazzetta fa il tuo nome. I tuoi conti sono sotto controllo.", "Ricevi una convocazione del Giudice per l'Alba."];
      // quando sali, il gioco ti dice quale pista ti ha tradito
      let perche = "";
      if (p.stato > vecchio && ps.length) {
        let x = rng(s) * ps.reduce((a, y) => a + y.peso, 0), scelta = ps[0];
        for (const y of ps) { x -= y.peso; if (x <= 0) { scelta = y; break; } }
        perche = " Perché: " + scelta.testo;
        p.ultimaPista = { k: scelta.k, testo: scelta.testo, ciclo: s.ciclo + 1 };
      }
      privato(s, p, segnali[p.stato] + perche);
      if (p.stato === 1) notizia(s, "Si mormora su certi affari di " + p.nome + ".", "voce");
      if (p.stato === 3) notizia(s, p.nome + " è sotto indagine. Mezzo commissariato lavora solo su di lui: per gli altri, stanotte, le strade sono più libere.", "scandalo");
    }
  }
  function mandaAlFaro(s, p, turni, motivo) {
    p.faro = Math.max(p.faro, turni); p.arresti += 1;
    p.inner = false; p.pos = POS_FARO;
    log(s, p.nome + " va al Faro per " + turni + " turni (" + motivo + ").", p.id);
    notizia(s, p.nome + " è stato portato al Faro.", "scandalo");
  }
  // ---- LE PENE. Due funzioni dicono tutto: gravitaFinale (recidiva e sconti) ed effettiPena (cosa perdi).
  // Le usano la condanna vera, la Resa dei conti e la vista (descriviPena): la pena scritta e' sempre quella vera.
  const TETTO_SCONTI = 2; // setta, Giudice, Giudice supremo e avvocato insieme: mai piu' di 2 gradini in meno (ILL-12)
  // la multa e' una parte di TUTTO quello che possiedi (ILL-10): non si evita spendendo i contanti prima del Processo
  const MULTA_CONDANNA = { lieve: 0.04, media: 0.08, grave: 0.16, gravissima: 0.30 };
  const QUOTA_TESORO_CONDANNA = 0.3; // partite nuove: se condannano il Gran Maestro, la Procura prende una parte del Tesoro (non di quello sepolto)
  function gravitaFinale(s, p, gravita, opz) {
    let g = gravita || "lieve"; const note = [];
    if (!(opz && opz.senzaRecidiva) && p.condanne > 0 && g !== "gravissima") { g = ORDINE_GRAVITA[ORDINE_GRAVITA.indexOf(g) + 1]; note.push({ k: "recidiva", testo: "Hai già una condanna: la pena sale di un gradino." }); }
    const sconti = [];
    if (inSetta(p)) sconti.push({ k: "setta", testo: "Gli avvocati della setta lavorano nell'ombra: la pena scende di un gradino." });
    if ((p.sette || []).some((id) => { const st = s.sette.find((x) => x.id === id); return st && st.giudice; })) sconti.push({ k: "giudice", testo: "Il Giudice è della setta: la pena scende di un gradino." });
    if (operaAttiva(s, p, "giudice")) sconti.push({ k: "supremo", testo: "Il Giudice supremo della setta firma la sentenza: un gradino in meno." });
    if (haOggetto(p, "avvocato")) sconti.push({ k: "avvocato", testo: "Il tuo avvocato fa il suo lavoro: la pena scende di un gradino." });
    let usati = 0, avvocato = false;
    for (const x of sconti) {
      if (g === "lieve") break;
      if (usati >= TETTO_SCONTI) { note.push({ k: "tetto", testo: "Più di " + TETTO_SCONTI + " gradini di sconto non si possono avere." }); break; }
      g = ORDINE_GRAVITA[ORDINE_GRAVITA.indexOf(g) - 1]; usati++; note.push(x); if (x.k === "avvocato") avvocato = true;
    }
    return { gravita: g, note, avvocato };
  }
  // che cosa succede a p con una condanna di questa gravita' (gia' finale). Non scrive niente.
  function effettiPena(s, p, gravita) {
    const pena = PENE[gravita], supremo = operaAttiva(s, p, "giudice"), sporchi = p.sporchi || 0;
    const salvi = Math.min(sporchi, (haPiano(p, "caveau") && gravita !== "gravissima" ? 5_000_000 : 0) + (haOggetto(p, "cassetta") ? 1_000_000 : 0) + (supremo ? round(sporchi * 0.5) : 0));
    const multa = round(MULTA_CONDANNA[gravita] * Math.max(0, patrimonio(s, p, false)) * (haAttivita(s, p, "legale") ? 0.7 : 1));
    const aRischio = propri(s, p).filter((l) => l.tipo && ["copertura", "notte", "rischio"].includes(ATTIVITA[l.tipo].gruppo));
    const tocca = !!pena.attivita && (p.riciclTot > 0 || gravita !== "media");
    const chiusi = tocca && pena.attivita === "chiusa" ? aRischio : [], sequestrati = tocca && pena.attivita !== "chiusa" ? aRischio.slice() : [];
    let pianiPersi = 0, stanzePerse = [];
    if (tocca && pena.attivita === "confisca+") {
      const prezioso = propri(s, p).filter((l) => !sequestrati.includes(l)).sort((a, b) => valoreLotto(b) - valoreLotto(a))[0];
      if (prezioso) sequestrati.push(prezioso);
      if (p.piani > 4) { pianiPersi = 4; stanzePerse = stanzeDi(p).filter((f) => { const F = FASCE_PALAZZO.find((x) => x.fun.includes(f)); return F && F.da > p.piani - 4; }); }
    }
    const tesori = gen2(s) ? s.sette.filter((st) => st.gm === p.id && st.tesoro > 0).map((st) => ({ setta: st.id, nome: st.nome, importo: round(st.tesoro * QUOTA_TESORO_CONDANNA) })) : [];
    return { gravita, faro: pena.faro, blocco: pena.blocco, fama: pena.fama, multa, multaQuota: MULTA_CONDANNA[gravita] * (haAttivita(s, p, "legale") ? 0.7 : 1),
      sporchiPersi: sporchi - salvi, sporchiSalvi: salvi, chiusi: chiusi.map((l) => l.id), sequestrati: sequestrati.map((l) => l.id), pianiPersi, stanzePerse,
      contatti: Object.keys(p.corrotti || {}).length, tesori };
  }
  // La pena raccontata al giocatore PRIMA: cosa succede oggi a p se lo condannano per un reato di questa gravita'.
  // reato = la gravita' del reato (se manca: il suo reato peggiore). Ritorna numeri e frasi pronte da mostrare.
  function descriviPena(s, p, reato) {
    const gf = gravitaFinale(s, p, reato || p.peggiorReato || "lieve"), e = effettiPena(s, p, gf.gravita);
    const nomi = (ids) => ids.map((id) => lotto(s, id).nome);
    const righe = [];
    righe.push("Confisca di TUTTI i soldi sporchi che hai in quel momento" + (e.sporchiPersi > 0 || e.sporchiSalvi > 0 ? " (oggi: " + euro(e.sporchiPersi) + (e.sporchiSalvi ? ", " + euro(e.sporchiSalvi) + " si salvano" : "") + ")" : "") + ".");
    righe.push("Multa: il " + Math.round(e.multaQuota * 100) + "% di tutto quello che possiedi (oggi " + euro(e.multa) + "). Se non hai i contanti la banca vende i tuoi titoli, poi va a debito.");
    if (e.faro) righe.push(e.faro + " turni di dadi in cella al Faro: non ti muovi sul tabellone" + (e.faro > N.giorni ? " e salti la prossima notte." : " (" + N.giorni + " turni = 1 Ciclo)."));
    if (e.blocco) righe.push("Entrate dimezzate e niente Stipendio per " + e.blocco + (e.blocco === 1 ? " Ciclo." : " Cicli."));
    if (e.chiusi.length) righe.push("Chiusi per un Ciclo: " + nomi(e.chiusi).join(", ") + ".");
    if (e.sequestrati.length) righe.push("Sequestrati e messi all'asta (tornano terreni vuoti): " + nomi(e.sequestrati).join(", ") + ".");
    if (e.pianiPersi) righe.push("Perdi " + e.pianiPersi + " piani del Palazzo" + (e.stanzePerse.length ? " e le stanze: " + e.stanzePerse.map((f) => STANZE[f].nome).join(", ") : "") + ".");
    if (e.contatti) righe.push("Perdi tutti i contatti che hai comprato (" + e.contatti + ").");
    for (const t of e.tesori) righe.push("Sei il Gran Maestro: la Procura sequestra " + euro(t.importo) + " del Tesoro di «" + t.nome + "». Il Tesoro sepolto è salvo.");
    righe.push("Perdi " + e.fama + " di fama. La prossima condanna sale di un gradino.");
    return { reato: reato || p.peggiorReato || "lieve", ...e, chiusiNomi: nomi(e.chiusi), sequestratiNomi: nomi(e.sequestrati), note: gf.note.map((x) => x.testo), righe };
  }
  function condanna(s, p, gravita, motivo) {
    const gf = gravitaFinale(s, p, gravita);
    gravita = gf.gravita;
    for (const x of gf.note) if (x.k !== "recidiva") privato(s, p, x.testo);
    if (gf.avvocato) togliOggetto(p, "avvocato");
    const e = effettiPena(s, p, gravita), pena = PENE[gravita];
    const confiscati = e.sporchiPersi; p.sporchi = e.sporchiSalvi;
    const multa = e.multa;
    paga(s, p, multa, null);
    for (const id of e.chiusi) lotto(s, id).chiuso = 1;
    const nomiSeq = e.sequestrati.map((id) => lotto(s, id).nome);
    for (const id of e.sequestrati) sequestra(s, lotto(s, id), p);
    if (e.pianiPersi) { p.piani -= e.pianiPersi; (p.funzioniPiani || []).splice(-e.pianiPersi); p.stanze = stanzeDi(p).filter((f) => !e.stanzePerse.includes(f)); aggiornaSkyline(s); }
    // partite nuove: se cade il Gran Maestro, la Procura mette le mani sul Tesoro (solo quello sepolto e' al sicuro)
    for (const t of e.tesori) {
      const st = s.sette.find((x) => x.id === t.setta); if (!st) continue;
      const q = Math.min(st.tesoro, t.importo); st.tesoro -= q;
      for (const id of st.membri) privato(s, giocatore(s, id), "Il Gran Maestro della setta \"" + st.nome + "\" è stato condannato: la Procura sequestra " + euro(q) + " del Tesoro. Il Tesoro sepolto è salvo.");
    }
    if (pena.faro > 0) mandaAlFaro(s, p, pena.faro, "condanna");
    p.blocco = pena.blocco; p.fama = Math.max(0, p.fama - pena.fama);
    annullaRicatti(s, p);
    p.condanne += 1; p.stato = 0; p.tracce = 15; p.peggiorReato = null; p.riciclTot = 0;
    p.corrotti = {};
    fedinaCondanna(s, p);
    if (gravita === "grave" || gravita === "gravissima") { p.cerchie = []; }
    p.ultimaSentenza = { gravita, multa, confiscati, faro: pena.faro, blocco: pena.blocco, motivo: motivo || "", ciclo: s.ciclo, chiusi: e.chiusi.length, sequestrati: nomiSeq, piani: e.pianiPersi, contatti: e.contatti, sconti: gf.note.map((x) => x.testo) };
    const testo = "Sentenza (" + gravita + "): confiscati " + euro(confiscati) + " di soldi sporchi, multa " + euro(multa) + (pena.faro ? ", " + pena.faro + " turni al Faro" : "") + (pena.blocco ? ", entrate dimezzate per " + pena.blocco + " Cicli" : "") + (e.chiusi.length ? ", " + e.chiusi.length + " locali chiusi per un Ciclo" : "") + (nomiSeq.length ? ", sequestrati: " + nomiSeq.join(", ") : "") + (e.pianiPersi ? ", " + e.pianiPersi + " piani del Palazzo persi" : "") + (e.contatti ? ", contatti comprati persi" : "") + ".";
    privato(s, p, testo);
    fatto(s, p, { k: "sentenza", testo, soldi: -multa, sporchi: -confiscati });
    notizia(s, "Condannato " + p.nome + " (" + gravita + ").", "scandalo");
  }

  // ------------------------------------------------------------ alba
  function alba(s) {
    for (const p of s.players) if (p.trucchi) for (const k of Object.keys(p.trucchi)) p.trucchi[k] = Math.max(0, p.trucchi[k] - 0.5); // col tempo la polizia dimentica
    s.fase = "alba";
    const riepilogo = {};
    const lussoAltri = {}; for (const p of s.players) lussoAltri[p.id] = p.lussoCiclo || 0; // per la pubblicita' della TV
    esitoEsposto(s); // prima che aggiornaPiste() svuoti luoghiNotte
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
        if (l.ipoteca && s.ciclo - l.ipotecaCiclo >= N.ipotecaCicli) { notizia(s, "La Banca si riprende " + l.nome + ": ipoteca non riscattata.", "affari"); sequestra(s, l, giocatore(s, l.owner)); }
      }
      // palazzo
      stanzeDi(p);
      const pal = renditaPalazzo(p, s);
      r.palazzo = round(pal);
      // veicoli a noleggio
      const yc = haAttivita(s, p, "yachtclub") ? 1.25 : 1;
      for (const v of p.veicoli) r.veicoli += N.veicoli[v].prezzo * N.veicoli[v].rend * (haPiano(p, "garage") ? 1.5 : 1) * yc;
      if (haAttivita(s, p, "beachclub")) p.fama += 2;
      if (haPiano(p, "ristorante_panoramico")) p.fama += 1;
      if (haPiano(p, "suite")) p.fama += 3;
      if (gen2(s)) { const f = Math.min(3, propri(s, p).filter((l) => l.lvl >= 1 && !l.chiuso && !l.cantiere && lussoFama(ATTIVITA[l.tipo])).length); if (f) { p.fama += f; r.famaLusso = f; } } // Hotel e Boutique: +1 fama l'uno a ogni Alba (al massimo 3)
      const rendAtt = rend, bloccato = p.blocco > 0;
      rend += pal + r.veicoli;
      if (p.faro > 0) rend *= 0.7;
      if (p.blocco > 0) { rend *= 0.5; p.blocco -= 1; }
      const zona = s.leggi.includes("zona_franca") ? propri(s, p).filter((l) => l.isola === "Sole").reduce((a, l) => a + rendita(s, l), 0) : 0;
      const evasa = rend * clamp(p.evasione || 0, 0, N.evasioneMax);
      if (evasa > 0) { p.sporchi += evasa; p.tracce += 2 * (evasa > 0 ? 1 : 0); p.pulitoCiclo = false; p.macchia = true; p.peggiorReato = peggio(p.peggiorReato, "lieve"); }
      const tassa = Math.max(0, (rend - evasa - zona) * s.tassa);
      // decima della setta
      let decima = 0;
      // partite nuove: la decima si paga solo sulle rendite delle attivita' (non su Palazzo e mezzi), con un tetto per Alba
      const quotaAtt = gen2(s) && rend > 0 ? clamp(rendAtt * (p.faro > 0 ? 0.7 : 1) * (bloccato ? 0.5 : 1) / rend, 0, 1) : 1;
      for (const id of p.sette) { const st = s.sette.find((x) => x.id === id); if (st) { let d = (rend - evasa - tassa) * quotaAtt * N.decima / p.sette.length; if (gen2(s)) d = Math.min(d, num(s, "decimaMax") * Math.max(1, livelloSetta(s, st)) / p.sette.length); st.tesoro += d; decima += d; } }
      p.cash += rend - evasa - tassa - decima;
      if ((p.sette || []).some((id) => { const st = s.sette.find((x) => x.id === id); return st && st.banchiere; }) && p.sporchi > 0) {
        const q = Math.min(500_000, round(p.sporchi * 0.1)); p.sporchi -= q; p.cash += q; r.banchiereSetta = q; // il Banchiere della setta ripulisce un po' ogni Alba
        const stB = s.sette.find((x) => p.sette.includes(x.id) && x.banchiere); guadagnaInfluenza(s, stB, q / 1_000_000, "Il Banchiere ripulisce");
      }
      for (const st of s.sette) if (st.gm === p.id && st.tesoro > 0) { const quota = round(st.tesoro * 0.05); st.tesoro -= quota; p.sporchi += quota; r.tesoroSetta = quota; }
      r.rendite = round(rend); r.tasse = round(tassa); r.evasa = round(evasa); r.decima = round(decima);
      // sindaco
      if (s.sindaco === p.id) { p.cash += N.stipendioSindaco; r.stipendioSindaco = N.stipendioSindaco; }
      // vantaggi delle classi
      if (p.pacchetto === "investitore") { const div = round(num(s, "dividendoInv") * Object.entries(p.azioni).reduce((t, [k, q]) => t + q * s.borsa[k], 0)); if (div > 0) { p.cash += div; r.dividendo = div; } }
      if (p.pacchetto === "playboy") p.fama += 2;
      if (p.pacchetto === "speculatore") for (const m of Object.keys(p.cripto)) p.cripto[m] *= 1.05;
      // debiti
      if (p.debito > 0) {
        const tasso = tassoDebito(s, p);
        const int = p.debito * tasso; p.debito += int; r.interessi = round(int); r.tassoDebito = tasso;
        { const gb = s.grandi && s.grandi.banca; if (gb && gb.stato === "attiva" && gb.capo && gb.capo !== p.id) s.interessiBanca = (s.interessiBanca || 0) + int; }
        const pagabile = Math.min(p.cash * N.debitoAlba, p.debito); p.cash -= pagabile; p.debito -= pagabile; r.debitoPagato = round(pagabile); r.debitoResta = round(p.debito);
        if (p.debito < 1) { p.debito = 0; p.emergenza = false; }
      }
      // corruzione: rate e pentiti
      for (const k of Object.keys(p.corrotti)) {
        const base = k.startsWith("agente_") ? N.corruz.agente[1] : N.corruz[k] ? N.corruz[k][1] : 0;
        if (p.sporchi >= base) p.sporchi -= base; else if (p.cash >= base) p.cash -= base; else { delete p.corrotti[k]; privato(s, p, "Non hai pagato: hai perso un contatto corrotto."); continue; }
        r.corruzione += base;
        affariInterni(s, p, k);
      }
      albaFedina(s, p); // la Fedina pulita: dopo le rate dei contatti
      // tracce che calano
      p.tracce *= 1 - (p.pulitoCiclo ? N.decayPulito : N.decaySporco);
      if (p.pulitoCiclo) p.ombraCicli = (p.ombraCicli || 0) + 1; else p.ombraCicli = 0;
      p.copUsata = 0;
      riepilogo[p.id] = r;
      aggiornaPiste(s, p, r.rendite);
      r.consiglio = consiglioVera(s, p);
    }
    albaFascicoli(s); // l'Inchiesta: un indizio a fascicolo, prima dei processi
    s.ordineVargas = null;
    // processo per chi e' arrivato allo stato 4
    for (const p of s.players) if (p.stato >= 4) {
      if (!p.peggiorReato) { annullaRicatti(s, p); p.stato = 1; p.tracce *= 0.5; privato(s, p, "Il Giudice archivia: non ci sono reati provati."); notizia(s, "Archiviata l'indagine su " + p.nome + ".", "voce"); }
      else condanna(s, p, p.peggiorReato, "processo");
    }
    // borsa e cripto (la Gazzetta mostra di quanto sono salite o scese)
    s.borsaIeri = { ...s.borsa }; s.criptoIeri = { ...s.cripto };
    for (const a of AZIENDE) {
      let mu = num(s, "borsaMu") / 3; // la crescita media si divide anche sui giorni
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
    scadenzeFavori(s);
    regista(s);
    albaSituazioni(s);
    tradimentiAllAlba(s);
    // sette: livelli
    for (const st of s.sette) {
      const lv = livelloSetta(s, st);
      if (lv > (st.livelloNotificato || 1)) { st.livelloNotificato = lv; privato(s, giocatore(s, st.gm), "La tua setta sale al livello " + lv + "."); }
      // chi sta nell'ombra troppo a lungo perde i bonus
      for (const id of st.membri) { const m = giocatore(s, id); if (m.ombraCicli >= 3 && id !== st.gm) privato(s, giocatore(s, st.gm), m.nome + " sta nell'ombra da 3 Cicli e non lavora per la setta: puoi cacciarlo dall'app Setta."); }
    }
    albaOpere(s, riepilogo);
    albaRefurtiva(s, riepilogo);
    if ((s.ciclo + 1) % 3 === 2) notizia(s, "Stanotte alla Marina dei Re: il Ballo in Maschera. Ingresso " + euro(N.costoBallo) + ", maschera obbligatoria.", "evento");
    // elezioni ogni 2 cicli
    if (s.ciclo % 2 === 1) elezioni(s);
    albaGrandi(s, riepilogo, lussoAltri);
    s.ultimaAlba = { ciclo: s.ciclo + 1, riepilogo };
    s.blackout = null;
    s.leggi = s.leggi.filter((x) => !x.startsWith("giro_cripto"));
    // cicli
    s.ciclo += 1;
    if (finisceQui(s)) return fine(s);
    if ((s.modoFine || "cicli") === "cicli" && s.ciclo === (s.cicli || N.cicli) - 1) annunciaResa(s);
    s.fase = "giorno"; s.giorno = 0; s.turno = 0;
    notizia(s, "Sorge il sole sul Ciclo " + (s.ciclo + 1) + ".", "evento");
    iniziaTurno(s);
  }

  // quando si vota la prossima volta (numero del Ciclo, come si legge a schermo): si vota all'Alba dei Cicli pari
  function prossimeElezioni(s) { return s.ciclo + 1 + ((s.ciclo + 1) % 2); }
  // le leggi in vigore adesso, pronte da mostrare: [{ id, nome, descr, isola, finoA: Ciclo delle prossime elezioni }]
  function leggiInVigore(s) {
    return [...new Set(s.leggi || [])].map((x) => {
      const isola = x.startsWith("polizia_doppia_") ? x.slice(15) : x.startsWith("stop_cantieri_") ? x.slice(14) : null;
      const id = isola ? x.slice(0, x.length - isola.length - 1) : x, L0 = LEGGI[id] || { nome: id, descr: "" };
      return { id, chiave: x, nome: L0.nome + (isola ? " a " + NOMI_ISOLE[isola] : ""), descr: L0.descr, isola, finoA: id === "giro_cripto" ? s.ciclo + 1 : prossimeElezioni(s) };
    });
  }
  function elezioni(s) {
    // con le elezioni decadono le leggi del Sindaco di prima: chi vince ricomincia da capo
    if ((s.leggi || []).length) { notizia(s, "Giorno di elezioni: decadono le leggi in vigore (" + leggiInVigore(s).map((x) => x.nome).join(", ") + ").", "politica"); s.leggi = []; }
    const cand = Object.keys(s.candidati);
    if (cand.length === 0) { notizia(s, "Nessun giocatore si candida: resta in carica il Sindaco Albertini.", "politica"); return; }
    let best = null, bestV = -Infinity;
    const voti = puntiVoti(s); // i Favori "Il Voto" usati: la fama di chi lo deve diventa punti
    // la fama conta, ma chi e' gia' Sindaco stanca gli elettori (−15 punti per ogni mandato gia' fatto):
    // cosi' nessuno resta Sindaco per sempre solo perche' e' partito famoso
    for (const id of cand) { const p = giocatore(s, id); const v = p.fama * 2 + (s.candidati[id] || 0) / 100_000 + rng(s) * 10 - 15 * (p.mandati || 0) + (voti[id] || 0); if (v > bestV) { bestV = v; best = p; } }
    chiudiVotiElezioni(s);
    const rieletto = s.sindaco === best.id;
    s.sindaco = best.id; s.candidati = {};
    best.mandati = (best.mandati || 0) + 1;
    if (!rieletto) best.fama += 10;
    notizia(s, best.nome + " è il nuovo Sindaco della Laguna!", "politica");
    privato(s, best, "Sei il Sindaco. Puoi fare una legge per Ciclo e cambiare le tasse dall'app Municipio. Le leggi durano fino alle prossime elezioni (Ciclo " + prossimeElezioni({ ciclo: s.ciclo + 1 }) + "), poi decadono.");
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
    if (idLegge === "polizia_doppia" && !ISOLE.includes(isola)) err("Scegli l'isola.");
    const chiave = idLegge === "polizia_doppia" ? "polizia_doppia_" + isola : idLegge;
    if (s.leggi.includes(chiave)) err("Questa legge è già in vigore" + (idLegge === "giro_cripto" ? " fino all'Alba." : ": dura fino alle elezioni del Ciclo " + prossimeElezioni(s) + "."));
    s.leggeCiclo = s.ciclo;
    if (idLegge === "amnistia") { for (const x of s.players) x.tracce *= 0.7; }
    else s.leggi.push(chiave);
    notizia(s, "Il Sindaco " + p.nome + " firma una nuova legge: " + LEGGI[idLegge].nome + (idLegge === "polizia_doppia" ? " a " + NOMI_ISOLE[isola] : "") + "." + (idLegge === "amnistia" ? "" : idLegge === "giro_cripto" ? " Vale fino all'Alba." : " Vale fino alle elezioni del Ciclo " + prossimeElezioni(s) + "."), "politica");
  }
  function tasse(s, p, q) {
    if (s.sindaco !== p.id) err("Solo il Sindaco cambia le tasse.");
    if (typeof q !== "number") err("Scegli la tassa: dal 10% al 30%.");
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

  // all'Alba: la partita finisce qui?
  function finisceQui(s) {
    const modo = s.modoFine || "cicli";
    if (modo === "libera") return !!s.chiusura;
    if (modo === "obiettivo") {
      const vivi = s.players.filter((p) => !p.fallito);
      if (vivi.some((p) => patrimonio(s, p, true) >= s.obiettivo)) return true;
      // chi si avvicina al traguardo finisce sulla Gazzetta: gli altri hanno tempo per reagire
      s.quasi = s.quasi || {};
      for (const p of vivi) if (!s.quasi[p.id] && patrimonio(s, p, true) >= s.obiettivo * N.quasiTraguardo) {
        s.quasi[p.id] = true;
        notizia(s, "In Laguna si dice che " + p.nome + " sia vicino ai " + euro(s.obiettivo) + ". Se ci arriva, la partita finisce.", "evento");
        annunciaResa(s);
        for (const q of vivi) if (q.id !== p.id) privato(s, q, p.nome + " è vicino al traguardo dei " + euro(s.obiettivo) + ". Se vuoi fermarlo, è il momento.");
      }
      return false;
    }
    return s.ciclo >= (s.cicli || N.cicli);
  }
  // partita libera: chi l'ha creata (il primo giocatore) la chiude; la classifica arriva all'Alba dopo
  function chiudiPartita(s, p, si) {
    if ((s.modoFine || "cicli") !== "libera") err("Questa partita finisce da sola: non si può chiudere a mano.");
    if (p.id !== s.players[0].id) err("Solo chi ha creato la partita la può chiudere.");
    if (s.chiusura === !!si) return;
    s.chiusura = !!si;
    if (si) { notizia(s, p.nome + " ha deciso: questa è l'ultima notte della Laguna. All'Alba la classifica finale.", "evento"); annunciaResa(s); }
    else { notizia(s, "Contrordine: la Laguna non chiude. Si va avanti.", "evento"); s.resaAnnunciata = false; }
  }

  function fine(s) {
    s.fase = "fine"; s.fine = true;
    const arrivato = s.modoFine === "obiettivo" ? s.players.filter((p) => !p.fallito).sort((a, b) => patrimonio(s, b, true) - patrimonio(s, a, true))[0] : null;
    resaDeiConti(s);
    // partite nuove: il Tesoro della setta alla fine e' di qualcuno: meta' al Gran Maestro, meta' divisa tra gli altri membri
    // (soldi sporchi: nel patrimonio contano il 25%). Se il Gran Maestro e' solo, lo prende tutto lui.
    const spartito = {};
    if (gen2(s)) for (const st of s.sette) {
      const t0 = round((st.tesoro || 0) + (st.sepolto || 0)); if (!(t0 > 0)) continue;
      const altri = st.membri.filter((id) => id !== st.gm), qGm = altri.length ? round(t0 / 2) : t0, qM = altri.length ? Math.floor((t0 - qGm) / altri.length) : 0;
      spartito[st.id] = { gm: qGm, membro: qM };
      const gm = s.players.find((x) => x.id === st.gm); if (gm) gm.sporchi += qGm;
      for (const id of altri) { const m = s.players.find((x) => x.id === id); if (m) m.sporchi += qM; }
      st.tesoroFinale = t0; st.tesoro = 0; if (st.sepolto) st.sepolto = 0;
    }
    const cl = s.players.map((p) => ({ id: p.id, nome: p.nome, patrimonio: round(patrimonio(s, p, true)), fama: p.fama, arresti: p.arresti, tracce: round(p.tracce), piani: p.piani, riciclTot: p.riciclTot }))
      .sort((a, b) => b.patrimonio - a.patrimonio);
    s.motivoFine = s.modoFine === "obiettivo" ? (arrivato ? arrivato.nome : cl[0].nome) + " ha superato i " + euro(s.obiettivo) + "." + (arrivato && arrivato.id !== cl[0].id ? " Ma dopo la Resa dei conti il più ricco è " + cl[0].nome + "." : "") : s.modoFine === "libera" ? "La partita è stata chiusa dopo " + s.ciclo + " Cicli." : "Sono finiti i " + (s.cicli || N.cicli) + " Cicli.";
    const titoli = [];
    titoli.push({ titolo: "Re della Laguna", a: cl[0].nome });
    const stella = [...cl].sort((a, b) => b.fama - a.fama)[0]; titoli.push({ titolo: "La Stella", a: stella.nome });
    const pulito = cl.filter((x) => x.arresti === 0).sort((a, b) => a.tracce - b.tracce)[0]; if (pulito) titoli.push({ titolo: "Mani Pulite", a: pulito.nome });
    const best = s.sette.map((st) => ({ st, v: (st.tesoroFinale || st.tesoro) + 1e6 * st.operazioni })).sort((a, b) => b.v - a.v)[0];
    if (best) titoli.push({ titolo: "Gran Burattinaio", a: giocatore(s, best.st.gm).nome + " (setta \"" + best.st.nome + "\")" });
    s.classifica = cl; s.titoli = titoli;
    s.rivelazione = s.sette.map((st) => ({ setta: st.nome, gm: giocatore(s, st.gm).nome, membri: st.membri.map((id) => giocatore(s, id).nome), tesoro: round(st.tesoroFinale || st.tesoro), spartito: spartito[st.id] || null }));
    notizia(s, "Fine della partita. " + cl[0].nome + " è il Re della Laguna.", "evento");
  }

  // ------------------------------------------------------------ scoperte
  // Le cose che si possono fare nella Laguna. Chi non le conosce non le usa: per questo
  // Vera da' un consiglio a ogni Alba (una cosa mai fatta che adesso si puo' fare),
  // la prima volta che provi una cosa nuova ricevi +1 fama, e quando un altro fa una cosa
  // che si vede (un piano, uno yacht, una candidatura) chi non l'ha mai fatta lo scopre.
  // gruppo: giorno · notte · potere. lv: livello dal quale l'indizio e' visibile.
  const SCOPERTE = [
    { id: "agenzia", gruppo: "giorno", lv: 0, nome: "Comprare all'Agenzia", fatto: (a) => a.tipo === "agenzia", pubblico: "ha comprato un terreno all'Agenzia senza aspettare i dadi",
      indizio: "Non serve aspettare di finire su un terreno libero.", spiega: "Dall'app Agenzia compri un terreno libero dell'isola dove sei, quando vuoi.",
      quando: (s, p) => p.cash > 1_200_000 && s.lotti.some((l) => !l.owner && l.tipoCasella === "lotto"), consiglio: "Non aspettare i dadi: dall'app Agenzia compri un terreno libero dell'isola dove sei. Costa un po' di più, ma lo scegli tu." },
    { id: "permesso", gruppo: "giorno", lv: 0, nome: "Aprire un'attività", fatto: (a) => a.tipo === "permesso" || a.tipo === "costruisci",
      indizio: "Un terreno vuoto rende pochissimo.", spiega: "Chiedi il permesso al Municipio, poi apri il cantiere: all'Alba l'attività rende.",
      quando: (s, p) => propri(s, p).some((l) => l.tipoCasella === "lotto" && l.lvl === 0 && !l.cantiere) && p.cash > 400_000, consiglio: "Hai terreni vuoti: così non rendono quasi niente. Dall'app Imprese chiedi il permesso e apri un'attività. Le rendite arrivano a ogni Alba." },
    { id: "piano", gruppo: "giorno", lv: 0, nome: "Alzare il tuo Palazzo", fatto: (a) => a.tipo === "piano", pubblico: "ha alzato un nuovo piano del suo Palazzo",
      indizio: "Il tuo Palazzo può crescere piano dopo piano.", spiega: "I piani rendono a ogni Alba (uno per mossa, ognuno costa un po' più del precedente). A 6 piani diventa un Attico, a 15 un Grattacielo: si aprono stanze speciali da comprare a parte.",
      quando: (s, p) => p.cash > costoPiano(p) * 3, consiglio: "Hai soldi fermi. I piani del tuo Palazzo rendono a ogni Alba e si ripagano in poco più di due Cicli. Apri l'app Palazzo: vedi subito quanto costano e quanto rendono." },
    { id: "veicolo", gruppo: "giorno", lv: 0, nome: "Comprare un mezzo", fatto: (a) => a.tipo === "veicolo", pubblico: "si è comprato un mezzo di lusso",
      indizio: "Yacht, motoscafi, elicotteri: non sono solo per farsi vedere.", spiega: "I mezzi si noleggiano ai turisti e rendono a ogni Alba. Di notte ti portano più veloce.",
      quando: (s, p) => p.cash > 4_000_000 && !p.veicoli.length, consiglio: "Uno yacht non è solo lusso: lo noleggi ai turisti e rende a ogni Alba. Guarda l'app Lusso." },
    { id: "viaggio_rapido", gruppo: "giorno", lv: 0, nome: "Viaggio rapido", fatto: (a) => a.tipo === "viaggio_rapido", pubblico: "ha preso il traghetto invece di tirare i dadi",
      indizio: "I dadi non sono l'unico modo per muoversi.", spiega: "Una volta per Ciclo, invece dei dadi, vai dove vuoi col traghetto da un Molo o con i tuoi mezzi.",
      quando: (s, p) => s.ciclo >= 1 && destinazioniRapide(s, p).length > 0, consiglio: "Vuoi arrivare su un'isola precisa? Una volta ogni 2 Cicli, invece dei dadi, puoi fare un viaggio rapido col tuo mezzo. Costa il carburante e la mossa del giorno. Cerca il tasto vicino ai dadi." },
    { id: "prestito", gruppo: "giorno", lv: 0, nome: "Chiedere un prestito", fatto: (a) => a.tipo === "prestito" || a.tipo === "ipoteca",
      indizio: "Quando mancano i contanti, c'è chi li presta.", spiega: "La Banca presta fino al 30% di quello che hai. Gli interessi si pagano a ogni Alba.",
      quando: (s, p) => p.cash < 300_000 && propri(s, p).length >= 2, consiglio: "Sei a corto di contanti. La Banca ti presta una parte di quello che hai, o ti dà soldi su un terreno con l'ipoteca. App Banca." },
    { id: "proposta", gruppo: "giorno", lv: 0, nome: "Comprare da un altro giocatore", fatto: (a) => a.tipo === "proponi_lotto",
      indizio: "Ogni terreno ha un prezzo, anche quelli già presi.", spiega: "Puoi offrire soldi a un altro giocatore per un suo terreno. Lui accetta o rifiuta.",
      quando: (s, p) => s.lotti.some((l) => l.owner && l.owner !== p.id && l.serie && s.lotti.filter((x) => x.serie === l.serie && x.id !== l.id).every((x) => x.owner === p.id)), consiglio: "Ti manca un solo terreno per completare un gruppo, ma ce l'ha un altro. Fagli un'offerta: toccalo sulla mappa." },
    { id: "candidati", gruppo: "potere", lv: 0, nome: "Candidarti a Sindaco", fatto: (a) => a.tipo === "candidati" || (a.tipo === "municipio" && a.scelta === "candidati"), pubblico: "si è candidato a Sindaco",
      indizio: "Il Sindaco fa le leggi e decide le tasse.", spiega: "Ci si candida al Municipio. Vince chi ha più fama e spende di più in campagna. Il Sindaco prende uno stipendio e fa una legge per Ciclo.",
      quando: (s, p) => p.fama >= 25 && p.cash > N.candidatura * 2 && s.candidati[p.id] === undefined, consiglio: "Con la tua fama potresti diventare Sindaco: fai le leggi e decidi le tasse. Ti candidi dall'app Municipio." },
    { id: "investi", gruppo: "giorno", lv: 2, nome: "Borsa e cripto", fatto: (a) => a.tipo === "investi",
      indizio: "I soldi possono lavorare da soli.", spiega: "Le azioni crescono piano; le cripto salgono e crollano. Si vendono quando vuoi.",
      quando: (s, p) => p.cash > 2_500_000, consiglio: "Lenz dice che i soldi fermi perdono valore. In Borsa crescono piano, le cripto salgono e crollano. App Borsa." },
    { id: "contratto", gruppo: "potere", lv: 2, nome: "Un contratto con un rivale", fatto: (a) => a.tipo === "contratto",
      indizio: "Un patto scritto vale più di una stretta di mano.", spiega: "Scrivi tu i patti: chi paga cosa, oggi e fra qualche Ciclo, e anche terreni ceduti.",
      quando: (s, p) => s.players.length > 1, consiglio: "Con l'app Contratti scrivi un patto con un altro giocatore: soldi oggi in cambio di soldi domani, un terreno, quello che vuoi tu." },
    { id: "evasione", gruppo: "potere", lv: 2, nome: "Nascondere le tasse", fatto: (a) => a.tipo === "evasione" && a.quota > 0,
      indizio: "Le tasse si possono pagare… di meno.", spiega: "Una parte delle rendite non la dichiari: diventa contante sporco da usare di notte. Lascia Tracce.",
      quando: (s, p) => propri(s, p).some((l) => l.lvl > 0), consiglio: "Paghi tasse su tutto. Una parte delle rendite la puoi nascondere: diventa contante sporco da spendere di notte. Con un po' di rischio. App Banca." },
    { id: "occasione", gruppo: "notte", lv: 1, nome: "Un affare della notte", fatto: (a) => a.tipo === "occasione",
      indizio: "Di notte, al Porto e al Mercato, c'è chi paga bene.", spiega: "Gli affari della notte rendono tanto ma lasciano Tracce. Prima di accettare guardi sempre il rischio.",
      quando: (s, p) => true, consiglio: "Stanotte al Porto c'è chi paga bene per un carico. Rende molto più di un affitto, ma lascia Tracce. Vai e guarda il rischio prima di dire sì." },
    { id: "oggetto", gruppo: "notte", lv: 1, nome: "Riempire la valigetta", fatto: (a) => a.tipo === "compra_oggetto",
      indizio: "Al Mercato Nero vendono cose che salvano la pelle.", spiega: "Gli oggetti della valigetta ti proteggono dai pericoli della notte: maschera, motoscafo, telefono sicuro…",
      quando: (s, p) => (p.valigetta || []).length === 0, consiglio: "Al Mercato Nero compri oggetti per la valigetta. La maschera, per esempio, ti salva dai fotografi durante un affare." },
    { id: "ricicla", gruppo: "notte", lv: 1, nome: "Ripulire i soldi sporchi", fatto: (a) => a.tipo === "ricicla",
      indizio: "I soldi sporchi pesano, e a fine partita valgono poco.", spiega: "Al Casinò Reale li cambi in soldi puliti. Ne perdi una parte, ma diventano tuoi davvero.",
      quando: (s, p) => p.sporchi > 500_000, consiglio: "Hai soldi sporchi. A fine partita valgono solo un quarto e una condanna li porta via. Di notte, al Casinò Reale, li ripulisci." },
    { id: "corrompi", gruppo: "notte", lv: 1, nome: "Comprare un poliziotto", fatto: (a) => a.tipo === "corrompi",
      indizio: "Anche la polizia ha un prezzo.", spiega: "Un agente comprato abbassa il rischio nella sua isola. Si paga a ogni Alba, e può essere beccato.",
      quando: (s, p) => (p.stato || 0) >= 1 || p.tracce > 30, consiglio: "Si parla di te. Un agente comprato, al Club, abbassa il rischio di guai nella sua isola. Costa a ogni Alba." },
    { id: "foto", gruppo: "notte", lv: 1, nome: "Fotografare un rivale", fatto: (a) => a.tipo === "foto" || a.tipo === "soffiata",
      indizio: "Chi fa affari sporchi lascia prove. Anche gli altri.", spiega: "Se un rivale fa affari loschi vicino a te, puoi fotografarlo: è una Prova da usare contro di lui.",
      quando: (s, p) => s.ciclo >= 2, consiglio: "Gli altri non sono santi. Di notte, se uno fa un affare dove sei tu, puoi fotografarlo: una Prova contro di lui." },
    { id: "denuncia", gruppo: "potere", lv: 1, nome: "Denunciare un rivale", fatto: (a) => a.tipo === "denuncia",
      indizio: "Una Prova nel cassetto non serve a niente.", spiega: "Una Prova consegnata alla polizia fa salire il rivale verso il Processo.",
      quando: (s, p) => (p.prove || []).length > 0, consiglio: "Hai una Prova contro un rivale. Dall'app Prove la consegni alla polizia: per lui il Processo si avvicina." },
    { id: "favore", gruppo: "potere", lv: 1, nome: "Chiedere un Favore", fatto: (a) => a.tipo === "contratto" && !!a.contratto && !!a.contratto.favore && a.contratto.favore !== "nessuno",
      indizio: "Non tutto si paga in soldi.", spiega: "In un patto puoi chiedere un Favore: un voto, un passaggio gratis, un silenzio, un appuntamento. Il gioco lo fa rispettare.",
      quando: (s, p) => !!p.haRegalato && !(s.favori || []).some((f) => f.a === p.id), consiglio: "Hai fatto un regalo e non hai chiesto niente. La prossima volta, nell'app Contratti, chiedi un Favore in cambio." },
    { id: "ricatto", gruppo: "potere", lv: 1, nome: "Usare una Prova", fatto: (a) => a.tipo === "ricatto",
      indizio: "Una Prova consegnata vale una volta sola.", spiega: "Con una Prova puoi denunciare un rivale, oppure mostrargliela e chiedergli un Favore. È un reato grave.",
      quando: (s, p) => (p.prove || []).length > 0, consiglio: "Hai una Prova in tasca. Puoi mandarla alla polizia, oppure usarla: app Prove." },
    { id: "servizio", gruppo: "notte", lv: 1, nome: "Chiedere un Servizio", fatto: (a) => a.tipo === "servizio",
      indizio: "Un poliziotto comprato non serve solo a chiudere un occhio.", spiega: "Ogni contatto comprato ti fa un Servizio per Ciclo. Ma ogni Servizio lo rende più nervoso.",
      quando: (s, p) => Object.keys(p.corrotti || {}).length > 0, consiglio: "Hai un contatto a libro paga e non gli hai mai chiesto niente. App Soldi sporchi, La tua rete." },
    { id: "fedina", gruppo: "potere", lv: 0, nome: "La Fedina pulita", fatto: (a) => a.tipo === "esposto" || a.tipo === "inchiesta_apri" || a.tipo === "opera_pubblica",
      indizio: "Chi non si sporca mai, prima o poi viene ascoltato.", spiega: "Ogni Ciclo senza atti sporchi fa crescere la Fedina. A 2, 4 e 6 Cicli si aprono poteri solo per chi è pulito.",
      quando: (s, p) => (p.fedina || 0) >= 2 && p.espostoCiclo == null, consiglio: "Sei pulito da 2 Cicli: ora la polizia ti ascolta. Dal Municipio puoi firmare un esposto su un posto della notte." },
    { id: "incontro", gruppo: "notte", lv: 0, nome: "Incontrare un rivale di notte", fatto: (a) => a.tipo === "incontro",
      indizio: "Di notte gli altri giocatori sono in giro come te.", spiega: "Se sei nello stesso posto di un altro puoi offrirgli un drink, sfidarlo o proporgli un affare.",
      quando: (s, p) => s.ciclo >= 1, consiglio: "Di notte, se finisci nello stesso posto di un altro giocatore, lo vedi. Puoi offrirgli un drink o sfidarlo." },
    { id: "articolo", gruppo: "potere", lv: 2, nome: "Comprare un articolo", fatto: (a) => a.tipo === "articolo",
      indizio: "La Gazzetta scrive quello che le paghi.", spiega: "Alla Redazione compri un articolo: fama per te o fango su un rivale.",
      quando: (s, p) => true, consiglio: "La Gazzetta si compra. Di notte, alla Redazione, paghi un articolo su di te (fama) o contro un rivale." },
    { id: "serata", gruppo: "potere", lv: 0, nome: "Una serata nel tuo Casinò", fatto: (a) => a.tipo === "serata", pubblico: "ha aperto una serata nel suo Casinò privato",
      indizio: "Un Palazzo con il casinò privato è una calamita.", spiega: "Di notte apri il tuo Casinò privato: gli altri pagano l'ingresso e il banco sei tu.",
      quando: (s, p) => haPiano(p, "casino_privato"), consiglio: "Hai un Casinò privato. Stanotte, dal tuo Palazzo, apri una serata: chi viene paga l'ingresso e il banco sei tu." },
    { id: "fonda_setta", gruppo: "potere", lv: 1, nome: "Fondare una setta", fatto: (a) => a.tipo === "fonda_setta",
      indizio: "Si dice che i più sporchi si riuniscano al Faro.", spiega: "Con 8 milioni sporchi fondi una setta: meno Tracce, condanne più leggere, affari solo per i membri.",
      quando: (s, p) => p.sporchi >= N.settaSporchi && !p.settaFondata, consiglio: "Hai abbastanza soldi sporchi per fondare una setta. Stanotte, dall'app Setta. Meno Tracce, condanne più leggere, affari segreti." },
    { id: "invita_setta", gruppo: "potere", lv: 1, nome: "Portare qualcuno nella setta", fatto: (a) => a.tipo === "invita_setta",
      indizio: "Una setta con più membri ha più decima e più voti.", spiega: "Più membri = più decima nel Tesoro, riti più forti e più voti sulle Grandi Opere. Il livello sale con l'Influenza. L'invito è senza firma; puoi offrire soldi o chiedere una quota.",
      quando: (s, p) => s.sette.some((st) => st.gm === p.id && st.membri.length < 3), consiglio: "Da solo la setta guadagna poco: ogni membro versa il 15% delle sue rendite nel Tesoro. Invita qualcuno dall'app Setta: puoi anche offrirgli soldi." },
  ];
  function primaVolta(s, p, a) {
    p.scoperte = p.scoperte || {};
    for (const sc of SCOPERTE) {
      if (p.scoperte[sc.id] !== undefined || !sc.fatto(a)) continue;
      p.scoperte[sc.id] = s.ciclo + 1;
      p.fama += 1;
      if (s.consigli !== false) privato(s, p, "Nuova scoperta (+1 fama): " + sc.nome + ". " + sc.spiega);
      // chi non l'ha mai fatto lo vede fare (solo le cose che si vedono in pubblico)
      if (sc.pubblico && s.consigli !== false) for (const q of s.players) if (q.id !== p.id && !q.bot && !(q.scoperte || {})[sc.id] && !(q.visteFare || {})[sc.id]) {
        q.visteFare = q.visteFare || {}; q.visteFare[sc.id] = true;
        privato(s, q, "Vera: \"Hai visto? " + p.nome + " " + sc.pubblico + ". Anche tu puoi: " + sc.spiega + "\"");
      }
    }
  }
  // all'Alba: un consiglio di Vera su una cosa mai fatta che adesso si puo' fare
  function consiglioVera(s, p) {
    if (p.bot || s.consigli === false) return null;
    p.scoperte = p.scoperte || {}; p.consigliati = p.consigliati || {};
    const lv = livelloSblocco(s, p);
    const ok = SCOPERTE.filter((sc) => sc.lv <= lv && p.scoperte[sc.id] === undefined && (p.consigliati[sc.id] || 0) < 2 && (() => { try { return sc.quando(s, p); } catch (e) { return false; } })());
    if (!ok.length) return null;
    // prima le cose mai consigliate, poi quelle consigliate una volta
    ok.sort((x, y) => (p.consigliati[x.id] || 0) - (p.consigliati[y.id] || 0));
    const sc = ok[0];
    p.consigliati[sc.id] = (p.consigliati[sc.id] || 0) + 1;
    privato(s, p, "Vera: \"" + sc.consiglio + "\"");
    return { id: sc.id, nome: sc.nome, testo: sc.consiglio };
  }

  // ------------------------------------------------------------ ingresso unico
  // ---- I miei conti: ogni movimento di soldi viene annotato con il suo motivo (per il Ciclo in corso e quello prima)
  // Una riga per tema: chi aggiunge un'azione che muove soldi mette il suo motivo nella riga del suo tema.
  const MOTIVO = {
    // giorno: dadi, terreni, aste, scambi
    tira: "Dadi: caselle, affitti, stipendio", viaggio_rapido: "Viaggio rapido", compra: "Terreni comprati", agenzia: "Agenzia immobiliare", offerta: "Aste",
    proponi_lotto: "Scambi di terreni", rispondi_proposta: "Scambi di terreni",
    // costruire, Palazzo, lusso
    costruisci: "Cantieri e attività", attivita: "Cantieri e attività", permesso: "Permessi", piano: "Palazzo", stanza: "Palazzo", veicolo: "Veicoli e lusso",
    // banca e Borsa
    investi: "Borsa e cripto", vendi: "Borsa e cripto", prestito: "Prestiti", restituisci: "Prestiti", ipoteca: "Ipoteche", riscatta: "Ipoteche",
    // caselle speciali e Municipio
    gala: "Gala", casino_reale: "Casinò Reale", roulette: "Roulette", municipio: "Municipio", licenza: "Licenze", busta_licenza: "Bustarelle", regalo_assessore: "Bustarelle",
    // politica
    campagna: "Campagna elettorale", candidati: "Candidatura",
    // tra giocatori
    articolo: "Gazzetta", regala: "Regali", contratto: "Contratti", rispondi_contratto: "Contratti", denuncia: "Denunce",
    favore_usa: "Favori", favore_rompi: "Favori", ricatto: "Ricatti", rispondi_ricatto: "Ricatti",
    // notte: affari, soldi sporchi, contatti
    occasione: "Affari della notte", ricettatore: "Ricettatore (merce rubata)", ballo: "Ballo in Maschera", ricicla: "Soldi ripuliti", ricicla_banca: "Soldi ripuliti",
    corrompi: "Corruzione", scarica_contatto: "Corruzione", servizio: "Corruzione", togli_transenna: "Corruzione", opera_pubblica: "Opere pubbliche", compra_oggetto: "Mercato Nero", chiamata: "Lavoretti al telefono", soffiata: "Soffiate", spa: "Notte",
    // serate e carte
    sm: "Sette e mezzo", carte: "Sette e mezzo", serata: "Serate", gioca_serata: "Serate", vai_serata: "Serate",
    // setta
    fonda_setta: "Setta", versa_setta: "Setta", lava_setta: "Setta: Lavanderia", rispondi_invito: "Setta", scava: "Setta", seppellisci: "Setta", tradisci: "Setta",
    // Grandi Affari
    offerta_grande: "Grandi Affari", quote_grande: "Grandi Affari", titolone: "Grandi Affari", tasso_banca: "Grandi Affari", blocca_conto: "Grandi Affari",
  };
  // lo stesso movimento, visto da chi lo riceve senza averlo fatto
  const MOTIVO_ALTRI = {
    tira: "Affitti e pedaggi incassati", offerta: "Aste", proponi_lotto: "Scambi di terreni", rispondi_proposta: "Scambi di terreni",
    regala: "Regali ricevuti", rispondi_contratto: "Contratti", contratto: "Contratti",
    sm: "Sette e mezzo", carte: "Sette e mezzo",
    rispondi_invito: "Setta",
  };
  // Al Faro, di giorno, queste azioni contano come "la telefonata del turno" (una sola). Una riga per tema.
  const AZIONI_TELEFONO_FARO = [
    "investi", "vendi", "restituisci", "ipoteca", "riscatta",                       // banca e Borsa
    "articolo", "contratto", "rispondi_contratto", "regala", "paga_patto", "denuncia",            // tra giocatori
    "favore_usa", "favore_rompi", "ricatto", "rispondi_ricatto",                    // Favori e ricatti
    "versa_setta", "lava_setta", "proponi_opera", "vota_opera", "rispondi_invito", "invita_setta", "espelli_setta", "lascia_setta", // setta
    "campagna", "legge", "tasse", "evasione",                                       // politica e tasse
  ];
  function registraConti(s, idG, a, prima, ciclo0) {
    const alba = s.ciclo !== ciclo0;
    s.players.forEach((p, i) => {
      const dc = Math.round((p.cash || 0) - prima[i][0]), ds = Math.round((p.sporchi || 0) - prima[i][1]);
      if (!dc && !ds) return;
      const motivo = alba ? "All'Alba: rendite, tasse, interessi, setta" : p.id === idG ? MOTIVO[a.tipo] || "Altro" : MOTIVO_ALTRI[a.tipo] || "Per mano di altri";
      p.conti = p.conti || {};
      const c = p.conti[ciclo0] = p.conti[ciclo0] || {}, v = c[motivo] = c[motivo] || [0, 0];
      v[0] += dc; v[1] += ds;
      for (const k of Object.keys(p.conti)) if (+k < ciclo0 - 1) delete p.conti[k];
    });
  }
  // ---- Controllo dei valori in ingresso: tutto quello che arriva da fuori passa di qui PRIMA di toccare lo stato.
  // Regole uguali per tutte le azioni, presenti e future:
  //  - un numero deve essere un numero vero (NaN e Infinito diventano "vuoto", come succede quando passano dal server);
  //  - i campi di CAMPI_NUMERO accettano solo numeri (o scritte fatte di sole cifre, es. "100000");
  //  - i soldi (CAMPI_SOLDI) non sono mai sotto zero, e nessun numero supera MAX_NUMERO;
  //  - una scritta non puo' essere una parola riservata di JavaScript (constructor, __proto__...): servono a cercare
  //    nelle tabelle (STANZE, LUOGHI...) e farebbero trovare cose che non esistono. Fanno eccezione i testi liberi;
  //  - liste e oggetti solo dove sono previsti (oggetti, contratto).
  // Chi aggiunge un'azione con un campo-numero nuovo lo scrive in CAMPI_NUMERO (e in CAMPI_SOLDI se sono soldi).
  const CAMPI_NUMERO = ["importo", "prezzo", "offerta", "ingresso", "quota", "tasso", "n", "quanti", "idx", "ora", "prova", "pagoOra", "pagoDopo", "cicli", "pos"];
  const CAMPI_SOLDI = ["importo", "prezzo", "ingresso", "pagoOra", "pagoDopo"];
  const CAMPI_TESTO = ["testo", "motto", "motivo"]; // scritti dal giocatore: non si usano mai per cercare in una tabella
  const CAMPI_LISTA = ["oggetti"], CAMPI_OGGETTO = ["contratto"];
  const MAX_NUMERO = 1e12, MAX_TESTO = 2000, MAX_LISTA = 20;
  function parolaRiservata(v) { return typeof v === "string" && v in Object.prototype; }
  function valoreSicuro(k, v, dentro) {
    if (v === undefined || v === null) return v;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) return null;
    } else if (CAMPI_NUMERO.includes(k)) {
      if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) v = Number(v);
      else err("Valore non valido: qui serve un numero.");
    }
    if (typeof v === "number") {
      if (Math.abs(v) > MAX_NUMERO) err("Numero troppo grande.");
      if (v < 0 && CAMPI_SOLDI.includes(k)) err("Importo non valido.");
      return v;
    }
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      if (v.length > MAX_TESTO) err("Testo troppo lungo.");
      if (!CAMPI_TESTO.includes(k) && parolaRiservata(v)) err("Valore non valido.");
      return v;
    }
    if (Array.isArray(v)) {
      if (dentro || !CAMPI_LISTA.includes(k) || v.length > MAX_LISTA || v.some((x) => typeof x !== "string" || x.length > MAX_TESTO || parolaRiservata(x))) err("Valore non valido.");
      return v.slice();
    }
    if (typeof v === "object" && !dentro && CAMPI_OGGETTO.includes(k)) return oggettoSicuro(v, true);
    err("Valore non valido.");
  }
  function oggettoSicuro(a, dentro) {
    if (!a || typeof a !== "object" || Array.isArray(a)) err("Azione non valida.");
    const b = {};
    for (const k of Object.keys(a)) { if (parolaRiservata(k)) err("Azione non valida."); b[k] = valoreSicuro(k, a[k], dentro); }
    return b;
  }
  // l'azione ripulita: una copia, quella ricevuta non viene toccata
  function normalizza(a) {
    const b = oggettoSicuro(a, false);
    if (typeof b.tipo !== "string") err("Azione sconosciuta.");
    return b;
  }
  // ---- Cintura di sicurezza: se dopo un'azione i conti non sono piu' numeri, e' un errore del codice (NON di gioco).
  // Il server in questo caso non salva; applicaSicura rimette lo stato com'era.
  function controllaNumeri(s, a) {
    const rotto = (dove) => { throw new Error("Errore del gioco: dopo l'azione \"" + (a && a.tipo) + "\" " + dove + " non è più un numero. La mossa non è stata salvata."); };
    // un campo che in una partita vecchia non c'e' (undefined) non e' un errore: lo e' un numero diventato NaN o Infinito
    const male = (x, obbligatorio) => x === undefined ? obbligatorio : !Number.isFinite(x);
    for (const p of s.players) for (const k of ["cash", "sporchi", "debito", "fama", "tracce"]) if (male(p[k], k === "cash" || k === "sporchi" || k === "debito")) rotto("\"" + k + "\" di " + p.nome);
    if (male(s.tassa, true)) rotto("la tassa");
    for (const st of s.sette) if (male(st.tesoro, true)) rotto("il Tesoro della setta " + st.nome);
    for (const k of Object.keys(s.borsa || {})) if (male(s.borsa[k], false)) rotto("il prezzo di " + k);
    for (const k of Object.keys(s.cripto || {})) if (male(s.cripto[k], false)) rotto("il prezzo di " + k);
  }
  function applica(s, idGiocatore, a) {
    a = normalizza(a);
    const N0 = s.fase === "notte" && s.notte, ora0 = N0 ? N0.ora : -1, eraChiuso = N0 ? !!N0.chiuso[idGiocatore] : true;
    const len0 = N0 ? (N0.racconto[idGiocatore] || []).length : 0;
    const primaConti = s.players.map((p) => [p.cash || 0, p.sporchi || 0]), ciclo0 = s.ciclo;
    const pA = s.players.find((x) => x.id === idGiocatore), tr0 = pA ? pA.tracce || 0 : 0, st0 = pA ? pA.stato || 0 : 0;
    const r = applica0(s, idGiocatore, a);
    controllaNumeri(s, a);
    if (a && a.tipo) registraConti(s, idGiocatore, a, primaConti, ciclo0);
    // di notte, dopo ogni azione: il riquadro "com'e' andata" (soldi, Tracce lasciate, polizia)
    if (N0 && pA && s.ciclo === ciclo0 && !["pronto", "avanti", "aspetta", "vai", "msg_setta", "preferenze"].includes(a.tipo)) {
      const i = s.players.indexOf(pA), dc = Math.round(pA.cash - primaConti[i][0]), ds = Math.round(pA.sporchi - primaConti[i][1]), dtr = (pA.tracce || 0) - tr0;
      if (dc || ds || dtr > 0.5 || pA.stato > st0) pA.ultimoEsito = { ciclo: s.ciclo, ora: ora0, tipo: a.tipo, dc, ds, tr: dtr <= 0.5 ? 0 : dtr < 5 ? 1 : dtr < 12 ? 2 : 3, sale: (pA.stato || 0) > st0 ? pA.stato : 0 };
    }
    if (a && a.tipo && !(a.tipo === "compra" && !a.si)) { const p = s.players.find((x) => x.id === idGiocatore); if (p) primaVolta(s, p, a); }
    if (N0 && s.notte === N0 && N0.ora === ora0 && !eraChiuso && N0.chiuso[idGiocatore] && N0.daScelta[idGiocatore] === undefined) N0.daScelta[idGiocatore] = len0;
    return r;
  }
  // Come applica, ma se l'azione viene rifiutata o va in errore lo stato torna ESATTAMENTE com'era.
  // La usano la partita locale e i giocatori-computer, dove lo stato resta in memoria tra una mossa e l'altra.
  function applicaSicura(s, idGiocatore, a) {
    const foto = JSON.stringify(s);
    try { return applica(s, idGiocatore, a); }
    catch (e) { const com_era = JSON.parse(foto); for (const k of Object.keys(s)) delete s[k]; Object.assign(s, com_era); throw e; }
  }
  function applica0(s, idGiocatore, a) {
    if (s.fine && a.tipo !== "nulla") err("La partita è finita.");
    const p = giocatore(s, idGiocatore);
    // Al Faro, di giorno, una sola telefonata per turno. Si segna usata solo se l'azione riesce: se viene rifiutata non la perdi.
    const telefonata = p.faro > 0 && s.fase === "giorno" && corrente(s).id === p.id && AZIONI_TELEFONO_FARO.includes(a.tipo);
    const turno = s.ciclo * 10 + s.giorno;
    if (telefonata && p.telefonataUsata === turno) err("Al Faro hai una sola telefonata per turno.");
    const r = esegui(s, p, a);
    if (telefonata) p.telefonataUsata = turno;
    return r;
  }
  function esegui(s, p, a) {
    // Un'azione per riga, raggruppate per tema: chi aggiunge un'azione la mette in fondo al gruppo del suo tema.
    switch (a.tipo) {
      // ---- inizio e giorno: dadi, caselle, aste
      case "pacchetto": return scegliPacchetto(s, p, a.id);
      case "tira": return tira(s, p);
      case "viaggio_rapido": return viaggioRapido(s, p, a.idx);
      case "compra": return compra(s, p, !!a.si);
      case "agenzia": return agenzia(s, p, a.lotto);
      case "offerta": return offerta(s, p, a.importo);
      case "fine_turno": return fineTurno(s, p);
      case "gala": return gala(s, p, a.importo);
      case "casino_reale": return casinoReale(s, p, a.importo);
      case "municipio": return municipio(s, p, a.scelta);
      case "chiamata": return rispondiChiamata(s, p, !!a.si, !!a.telefono);
      // ---- scambi di terreni
      case "proponi_lotto": return proponiLotto(s, p, a.a, a.lotto, a.prezzo, a.compro);
      case "rispondi_proposta": return rispondiProposta(s, p, a.id, !!a.si, a.motivo);
      // ---- costruire, Palazzo, lusso
      case "permesso": return chiediPermesso(s, p, a.lotto, a.timbro === true);
      case "regalo_assessore": return regaloAssessore(s, p, a.lotto);
      case "costruisci": return costruisci(s, p, a.lotto, a.attivita);
      case "licenza": return chiediLicenza(s, p);
      case "busta_licenza": return bustaLicenza(s, p);
      case "piano": return STANZE[a.funzione] ? compraStanza(s, p, a.funzione) : piano(s, p, a.quanti);
      case "stanza": return compraStanza(s, p, a.stanza);
      case "veicolo": return compraVeicolo(s, p, a.veicolo);
      // ---- banca, Borsa, tasse
      case "prestito": return prestito(s, p, a.importo);
      case "restituisci": return restituisci(s, p, a.importo);
      case "ipoteca": return ipoteca(s, p, a.lotto);
      case "riscatta": return riscatta(s, p, a.lotto);
      case "investi": return investi(s, p, a.cosa, a.nome, a.importo);
      case "vendi": return vendi(s, p, a.cosa, a.nome, a.quota);
      case "evasione": p.evasione = clamp(Number(a.quota) || 0, 0, N.evasioneMax); return;
      // ---- Grandi Affari
      case "offerta_grande": return offertaGrande(s, p, a.affare, a.importo);
      case "quote_grande": return comprareQuote(s, p, a.affare, a.n);
      case "titolone": return titolone(s, p, a);
      case "tasso_banca": return tassoBanca(s, p, a.tasso);
      case "blocca_conto": return bloccaConto(s, p, a.bersaglio);
      case "ricicla_banca": return riciclaBanca(s, p, a.importo);
      // ---- tra giocatori: Gazzetta, contratti, regali, denunce
      case "articolo": return s.fase === "notte" ? articolo2(s, p, a) : articolo(s, p, a.bersaglio, a.tono, a.importo, a.testo, !!a.sporchi);
      case "contratto": return proponiContratto(s, p, a.contratto);
      case "rispondi_contratto": return rispondiContratto(s, p, a.id, !!a.si);
      case "regala": return regala(s, p, a.a, a.importo, !!a.sporchi);
      case "paga_patto": return pagaPatto(s, p, a.id);
      case "denuncia": return denuncia(s, p, a.prova);
      case "favore_usa": return usaFavore(s, p, a);
      case "favore_rompi": return rompiFavore(s, p, a.id);
      case "ricatto": return ricatto(s, p, a.prova, a.favore);
      case "rispondi_ricatto": return rispondiRicatto(s, p, a.id, a.scelta);
      // ---- Servizi dei contatti e Fedina pulita (v75)
      case "servizio": return servizio(s, p, a);
      case "togli_transenna": return togliTransenna(s, p);
      case "esposto": return esposto(s, p, a.luogo);
      case "inchiesta_apri": return inchiestaApri(s, p, a.bersaglio);
      case "inchiesta_pubblica": return inchiestaPubblica(s, p);
      case "opera_pubblica": return operaPubblica(s, p, a.isola, a.opera);
      // ---- politica
      case "candidati": return candidati(s, p, true); // dall'app Municipio: costa il doppio, se non sei sul Municipio oggi
      case "campagna": return campagna(s, p, a.importo);
      case "legge": return legge(s, p, a.legge, a.isola);
      case "tasse": return tasse(s, p, a.quota);
      // ---- notte: muoversi e orologio
      case "vai": return vai(s, p, a.luogo);
      case "aspetta": return aspetta(s, p);
      case "avanti": return avanti(s, p);
      case "tempo_scaduto": return tempoScaduto(s);
      case "pronto": case "torna_a_casa": return tornaACasa(s, p);
      // ---- notte: affari, oggetti, contatti, soldi sporchi
      case "occasione": return prendiOccasione(s, p, a.n, a.oggetti);
      case "compra_oggetto": return compraOggetto(s, p, a.oggetto);
      case "soffiata": return soffiata(s, p, a.luogo);
      case "foto": return fotografa(s, p, a.bersaglio);
      case "corrompi": return corrompi2(s, p, a.chi, a.isola, !!a.sporchi);
      case "scarica_contatto": return scaricaContatto(s, p, a.chiave);
      case "ricicla": return ricicla2(s, p, a.metodo, a.importo);
      case "ricettatore": return ricettatore(s, p, a.importo);
      case "ballo": return ballo(s, p);
      // ---- notte: Palazzo, serate, carte, incontri
      case "attivita": return attivitaNotte(s, p, a.importo);
      case "spa": return spa(s, p);
      case "serata": return apriSerata(s, p, a.ingresso);
      case "vai_serata": return vaiSerata(s, p, a.host);
      case "gioca_serata": return giocaSerata(s, p, a.importo);
      case "sm": return mossaSM(s, p, a.mossa);
      case "incontro": return incontro(s, p, a.a, a.cosa, a.importo);
      case "rispondi_incontro": return rispondiIncontro(s, p, a.id, !!a.si);
      // ---- setta
      case "fonda_setta": return fondaSetta(s, p, a.nome, a.motto);
      case "invita_setta": return invitaSetta(s, p, a.setta, a.invitato, a.offerta);
      case "rispondi_invito": return rispondiInvito(s, p, a.setta, !!a.si, a.motivo);
      case "espelli_setta": return espelliSetta(s, p, a.setta, a.membro);
      case "lascia_setta": return lasciaSetta(s, p, a.setta);
      case "versa_setta": return versaSetta(s, p, a.setta, a.importo, !!a.sporchi);
      case "lava_setta": return lavaSetta(s, p, a.setta, a.importo);
      case "msg_setta": return msgSetta(s, p, a.setta, a.testo);
      case "recluta": return settaAlFaro(s, p, () => recluta(s, p, a.setta, a.chi));
      case "operazione": return settaAlFaro(s, p, () => operazione(s, p, a.setta, a.op, a.bersaglio, a.direzione));
      case "convoca": return convoca(s, p, a.setta, a.luogo, a.ora);
      case "rito": return rito(s, p, a.setta);
      case "jet_setta": return jetSetta(s, p, a.setta);
      case "seppellisci": return seppellisci(s, p, a.setta, a.importo, !!a.indietro);
      case "scava": return scava(s, p, a.setta);
      case "tradisci": return tradisci(s, p, a.setta);
      case "prova_fedelta": return provaFedelta(s, p, a.setta, a.membro);
      case "proponi_opera": return proponiOpera(s, p, a.setta, a.opera);
      case "ritira_opera": return ritiraOpera(s, p, a.setta);
      case "vota_opera": return votaOpera(s, p, a.setta, !!a.si, a.motivo);
      // ---- partita
      case "chiudi_partita": return chiudiPartita(s, p, a.si !== false);
      case "preferenze": if (a.corona !== undefined) p.vuoleCorona = !!a.corona; if (a.uscire !== undefined) p.vuoleUscire = !!a.uscire; return;
      default: err("Azione sconosciuta: " + a.tipo);
    }
  }

  // ------------------------------------------------------------ cosa vede ognuno
  // vista(s, id) e' quello che un giocatore puo' sapere: e' l'UNICA cosa che esce dal server e dalla partita locale.
  // Regola: degli ALTRI giocatori passa SOLO quello che sta in CAMPI_PUBBLICI. Un campo nuovo e' segreto da solo:
  // per farlo vedere a tutti va aggiunto qui (una riga per tema). Il resto dello stato invece e' copiato intero:
  // una cosa nuova e segreta che NON sta dentro un giocatore va tolta a mano piu' sotto (come manoSM).
  const CAMPI_PUBBLICI = [
    "id", "nome", "bot", "colore", "assente", "uscito",                   // chi e' (assente/uscito: al suo posto gioca il computer)
    "pos", "inner", "ipos", "dadi", "doppi", "haTirato", "azioneGiornoFatta", // tabellone e turno
    "faro", "fallito", "arresti", "condanne",                             // fatti pubblici: prigione, fallimento, condanne
    "fama", "pacchetto", "veicoli",                                       // quello che tutti vedono
    "piani", "funzioniPiani", "stanze",                                   // il Palazzo (le stanze segrete vengono coperte)
    "senzaParola", "fedina", "operaFatta",                                // Favori e Fedina: gia' usciti sulla Gazzetta
  ];
  const PIANI_SEGRETI = ["caveau", "piani_segreti", "sala_insonorizzata", "bunker", "osservatorio"];
  // dalla cronaca pubblica si tolgono le operazioni private degli altri (riconosciute dalle parole della frase)
  const CRONACA_PRIVATA = /prestito|restituisce|investe|vende|ipoteca|riscatta/;
  // ATTENZIONE: la vista puo' avere pezzi in comune con lo stato vero. Chi la riceve non la deve modificare
  // (il server la manda in JSON, gioco.js ne fa una copia). vista() stessa non scrive MAI nello stato.
  function vista(s, idGiocatore) {
    const v = JSON.parse(JSON.stringify(s));
    delete v.rngState; delete v.seed;
    delete v.manoSM; // le mani di Sette e mezzo (con il mazzo!): la tua, senza mazzo, sta in v.notte.manoSM
    v.versioneMotore = VERSIONE; v.versioneRegole = VERSIONE_REGOLE; v.gen = s.gen || 1; // con che motore e' stata calcolata questa vista, e di che generazione e' la partita
    v.players = v.players.map((p) => {
      if (p.id === idGiocatore) { delete p.tracce; return p; } // le proprie Tracce non si vedono come numero
      const q = {};
      for (const k of CAMPI_PUBBLICI) if (p[k] !== undefined) q[k] = p[k];
      if (Array.isArray(q.funzioniPiani)) q.funzioniPiani = q.funzioniPiani.map((f) => PIANI_SEGRETI.includes(f) ? "riservato" : f);
      if (Array.isArray(q.stanze)) q.stanze = q.stanze.filter((f) => !PIANI_SEGRETI.includes(f));
      q.fascia = fascia(s, s.players.find((x) => x.id === p.id)); // l'unica cosa pubblica sulla ricchezza: Benestante, Ricco...
      return q;
    });
    v.log = v.log.filter((r) => !r.chi || r.chi === idGiocatore || !CRONACA_PRIVATA.test(r.testo));
    { const mio = v.players.find((x) => x.id === idGiocatore), vero = s.players.find((x) => x.id === idGiocatore); if (mio && vero) mio.umoreContatti = umoreContatti(s, vero); }
    { const mio = v.players.find((x) => x.id === idGiocatore), vero = s.players.find((x) => x.id === idGiocatore); if (mio && vero) { mio.rischioPerq = Math.round(rischioPerquisizione(s, vero) * 100); if (s.notte && haPiano(vero, "osservatorio")) mio.giroPg = Object.fromEntries(Object.keys(GIRO).map((k) => [k, dovePersonaggio(s, k)])); } }
    // le offerte all'asta sono segrete: vedi solo la tua
    if (v.grandi) for (const g of Object.values(v.grandi)) if (g.offerte) g.offerte = g.offerte[idGiocatore] ? { [idGiocatore]: g.offerte[idGiocatore] } : {};
    v.sette = s.sette.filter((st) => st.membri.includes(idGiocatore)).map((st) => { const c = { ...st }; if (!(st.tradimento && st.tradimento.da === idGiocatore)) delete c.tradimento; else c.tradimento = { mio: true }; if (st.gm !== idGiocatore) delete c.sepolto; return c; });
    v.setteRivali = s.sette.filter((st) => !st.membri.includes(idGiocatore)).map((st) => ({ id: st.id, nome: st.nome }));
    // l'invito non ha firma: chi lo riceve vede la setta e il patto, non chi lo manda
    v.inviti = s.inviti.filter((x) => x.a === idGiocatore).map((x) => { const st = s.sette.find((y) => y.id === x.setta); return { setta: x.setta, offerta: x.offerta || 0, nome: st ? st.nome : "?", motto: st ? st.motto : "", livello: livelloSetta(s, st), membri: st ? st.membri.length : 0 }; });
    v.flussi = (s.flussi || []).filter((f) => f.pubblico || f.da === idGiocatore || f.a === idGiocatore);
    v.proposte = (s.proposte || []).filter((x) => x.da === idGiocatore || x.a === idGiocatore);
    // Favori: i tuoi interi; degli altri solo Voto (elezioni) e Passo libero attivi, che sono pubblici. Silenzio e Mano mai.
    v.favori = (s.favori || []).filter((f) => f.deve === idGiocatore || f.a === idGiocatore || (f.stato === "attivo" && (f.tipo === "passo" || (f.tipo === "voto" && f.uso && f.uso.elezione))))
      .map((f) => f.deve === idGiocatore || f.a === idGiocatore ? f : { id: f.id, deve: f.deve, a: f.a, tipo: f.tipo, stato: f.stato, uso: f.uso });
    // ricatti: solo quelli dove sei tu (chi ricatta o chi e' ricattato)
    v.ricatti = (s.ricatti || []).filter((r) => r.da === idGiocatore || r.a === idGiocatore);
    // v75: la transenna la vedono tutti, ma chi l'ha messa solo lui; l'ordine di Vargas solo chi l'ha dato;
    // dell'esposto gli altri sanno solo che c'e' (non dove ne' di chi). Le opere pubbliche sono di tutti.
    if (s.transenna) v.transenna = s.transenna.da === idGiocatore ? { ...s.transenna } : { pos: s.transenna.pos, isola: s.transenna.isola }; else delete v.transenna;
    if (!(s.ordineVargas && s.ordineVargas.da === idGiocatore)) delete v.ordineVargas;
    if (s.esposto) v.esposto = s.esposto.da === idGiocatore ? { ...s.esposto } : { ciclo: s.esposto.ciclo }; else delete v.esposto;
    v.opere = (s.opere || []).map((o) => ({ ...o }));
    v.contratti = s.contratti.filter((k) => k.da === idGiocatore || k.a === idGiocatore || (k.tipo === "notarile" && k.stato !== "proposto")).map((k) => (k.da === idGiocatore || k.a === idGiocatore) ? k : { id: k.id, da: k.da, a: k.a, tipo: k.tipo, stato: k.stato });
    if (v.pending && v.pending.tipo === "asta") v.pending.offerte = Object.fromEntries(Object.keys(s.pending.offerte).map((k) => [k, k === idGiocatore ? s.pending.offerte[k] : "segreta"]));
    if (v.ultimaAlba) v.ultimaAlba.riepilogo = { [idGiocatore]: s.ultimaAlba.riepilogo[idGiocatore] };
    if (v.pending && v.pending.tipo === "chiamata" && v.pending.giocatore !== idGiocatore) v.pending = { tipo: "chiamata", giocatore: v.pending.giocatore };
    for (const l of v.lotti) if (l.owner !== idGiocatore) { delete l.negato; }
    if (s.notte) {
      const me = s.players.find((x) => x.id === idGiocatore);
      v.notte = {
        ora: s.notte.ora, dove: { ...s.notte.dove },
        viaggio: Object.fromEntries(Object.entries(s.notte.viaggio).map(([k, x]) => [k, { verso: k === idGiocatore ? x.verso : null, restano: k === idGiocatore ? x.restano : null, serata: k === idGiocatore ? x.serata || null : null }])),
        chiuso: { [idGiocatore]: !!s.notte.chiuso[idGiocatore] }, racconto: s.notte.racconto[idGiocatore] || [],
        pronto: { [idGiocatore]: !!(s.notte.pronto && s.notte.pronto[idGiocatore]) }, inizio: s.notte.inizio, tempo: TEMPO_ORA, adesso: adesso(),
        daScelta: s.notte.daScelta[idGiocatore], inizioRacc: s.notte.inizioRacc[idGiocatore] || 0,
        scelte: me ? scelteNotte(s, me) : [],
        qui: me ? quiConMe(s, me).map((x) => x.id) : [],
        incappucciati: 0,
        // v76: di notte non si sa chi stai aspettando: arriva solo quanti non hanno ancora finito l'ora (te escluso)
        mancano: attivi(s).filter((x) => x.id !== idGiocatore && !(s.notte.pronto && s.notte.pronto[x.id])).length,
        caloreQui: me ? ((me.calore || {})[s.notte.dove[idGiocatore]] || 0) : 0,
        pericoloQui: me && !s.notte.viaggio[idGiocatore] && s.notte.dove[idGiocatore] !== "palazzo" ? s.notte.pericolo[s.notte.dove[idGiocatore]] : null,
        protezione: me ? (me.corrotti && me.corrotti["agente_" + (LUOGHI[s.notte.dove[idGiocatore]] || {}).isola] ? 0.6 : 1) * (me.corrotti && me.corrotti.commissario ? 0.8 : 1) * (poliziaOccupata(s, me) ? N.occupata : 1) * (dovePersonaggio(s, "commissario") === s.notte.dove[idGiocatore] && !(me.corrotti || {}).commissario ? 1.35 : 1) * sitMult(s, "gu", { luogo: s.notte.dove[idGiocatore] }) : 1,
        ospite: s.notte.ospite ? s.notte.ospite[idGiocatore] || null : null,
        banco: me && !s.notte.viaggio[idGiocatore] && s.notte.banco && BANCHI[s.notte.dove[idGiocatore]] ? (s.notte.banco[s.notte.dove[idGiocatore]] || []).map((id) => ({ id, prezzo: prezzoOggetto(s, id) })) : null,
        serate: Object.entries(s.notte.serate || {}).map(([id, se]) => { const h = s.players.find((x) => x.id === id); return { host: id, nome: h.nome, piani: h.piani, livello: livelloPalazzo(h), ingresso: se.ingresso, ospiti: se.ospiti.length, banco: id === idGiocatore ? se.banco : undefined }; }),
        proposte: (s.notte.proposte || []).filter((x) => (x.a === idGiocatore && x.stato !== "preparazione") || x.da === idGiocatore).map((x) => { const y = { ...x }; delete y.mazzo; if (y.da !== idGiocatore && y.stato !== "finita") delete y.manoDa; return y; }),
        convocazione: me ? (() => { const cv = convocazioneDi(s, me); return cv ? { luogo: cv.c.luogo, ora: cv.c.ora, nome: cv.st.nome, gm: cv.st.gm === idGiocatore, jet: giocatore(s, cv.st.gm).veicoli.includes("jet") } : null; })() : null,
        manoSM: s.manoSM && s.manoSM[idGiocatore] ? (({ mazzo, ...r }) => ({ ...r, totale: totaleSM(r.carte) }))(s.manoSM[idGiocatore]) : null,
        ultimaMano: s.notte.ultimaMano ? s.notte.ultimaMano[idGiocatore] || null : null,
        occasioni: me ? occasioniVisibili(s, me).map((o) => ({ ...o, ...OCCASIONI.find((x) => x.id === o.id), n: o.n })) : [],
        piuTardi: me && !s.notte.viaggio[idGiocatore] ? s.notte.occasioni.filter((o) => !o.preso && o.luogo === s.notte.dove[idGiocatore] && o.dalle > s.notte.ora && (!o.riservata || o.riservata === idGiocatore)).length : 0,
        chiamate: s.notte.occasioni.filter((o) => o.riservata === idGiocatore && !o.preso).map((o) => ({ n: o.n, luogo: o.luogo, alle: o.alle, nome: OCCASIONI.find((x) => x.id === o.id).nome })),
      };
      // sotto il cappuccio: i confratelli al rito non hanno nome (ne' posto) per chi non e' il Gran Maestro; resta solo quanti sono
      v.notteFatti = { [idGiocatore]: !!(s.notteFatti && s.notteFatti[idGiocatore]) }; // chi e' gia' a casa non si sa
      if (me) { const via = incappucciatiPer(s, me); if (via.length) { for (const id of via) v.notte.dove[id] = null; v.notte.qui = v.notte.qui.filter((id) => !via.includes(id)); v.notte.incappucciati = via.length; } }
    }
    if (s.riepOra) v.riepOra = { n: s.riepOra.n, ciclo: s.riepOra.ciclo, da: s.riepOra.da, a: s.riepOra.a, mio: s.riepOra.per[idGiocatore] || null };
    { const me = s.players.find((x) => x.id === idGiocatore); if (me) { v.lustro = lustro(s, me); v.livelloPalazzo = livelloPalazzo(me); const su = poliziaOccupata(s, me); v.poliziaSu = su ? su.nome : null; } }
    { const me = s.players.find((x) => x.id === idGiocatore); v.sblocco = me ? livelloSblocco(s, me) : 3; v.postiValigetta = me ? postiValigetta(s, me) : 6; v.postiUsati = me ? postiUsati(me) : 0; v.situazioniAttive = sitAttive(s).map((S) => ({ id: S.id, t: S.t, spiega: descriviSituazione(S), fino: (s.situazioni.find((x) => x.id === S.id) || {}).fino })); v.sitProssime = (s.sitProssime || []).length; v.soglieLivello = soglieLivello(s); }
    // di notte non sai dove sono gli altri: vedi solo chi e' nel tuo stesso posto
    if (v.notte && v.notte.dove && s.notte) {
      const mio = s.notte.dove[idGiocatore], mioViaggio = s.notte.viaggio && s.notte.viaggio[idGiocatore];
      for (const id of Object.keys(v.notte.dove)) {
        if (id === idGiocatore) continue;
        const insieme = !mioViaggio && !(s.notte.viaggio && s.notte.viaggio[id]) && mio && mio !== "palazzo" && s.notte.dove[id] === mio;
        if (!insieme) v.notte.dove[id] = null;
        if (v.notte.viaggio && v.notte.viaggio[id]) v.notte.viaggio[id] = { nascosto: true };
      }
    }
    return v;
  }

  // Cosa esce dal motore (window.Laguna nel browser, require() in Node, globalThis.Laguna sul server).
  // Una riga per tema: chi aggiunge una funzione la mette nella riga del suo tema.
  const API = {
    // l'ingresso
    nuovaPartita, applica, applicaSicura, vista, vistaSicura: vista, CAMPI_PUBBLICI,
    // versione del motore e generazione delle partite (regole G1 e G2)
    VERSIONE, GEN, gen2, num, N_GEN2,
    // numeri e tabelle del gioco
    N, ATTIVITA, AFFARI, PACCHETTI, AZIENDE, MONETE, ISOLE, NOMI_ISOLE, STATI, LEGGI, PENE, ORDINE_GRAVITA,
    // tabellone e giorno
    CASELLE, SEZIONE, ORDINE_ISOLE, isolaDiPos, casella, corrente, haSerie, propri, haAttivita, prezzoAgenzia, destinazioniRapide,
    // soldi e valori
    euro, giocatore, patrimonio, fascia, affitto, rendita, copertura, valoreLotto, valorePalazzo, valoreInvestimenti, tassoPrestiti,
    // Palazzo
    costoCantiere, guadagnoLivello, puoSalire, vieGruppo, infoPermesso, bolloPermesso, infoIpoteca, tassoDebito, leggiInVigore, prossimeElezioni, soglieLivello, moltIllegale,
    costoPiano, costoPiani, costoStanza, renditaPalazzo, renditaPiani, condizioniPalazzo, fasciaPalazzo, FASCE_PALAZZO, STANZE, stanzePossibili, livelloPalazzo, lustro,
    // Grandi Affari e durata della partita
    GRANDI, ORDINE_GRANDI, partitaLunga,
    // notte: luoghi, oggetti, occasioni, scelte
    ORE, LUOGHI, OGGETTI, OCCASIONI, PERICOLI, P_GUAI, TEMPO_ORA, occasioniVisibili, scelteNotte, oreViaggio, luogoAperto, livelloSblocco, postiValigetta,
    personaggiQui, GIRO, rischioContatto, nomeContatto,
    // carte e serate
    punteggio, apriSerataProva: (s, id, ingresso) => apriSerataSenzaOra(s, giocatore(s, id), ingresso),
    // polizia e pene
    descriviPena, rischioPostoDiBlocco, rischioControllo: (s, p) => rischioControllo(s, p).su, tacche, TETTO_SCONTI, MULTA_CONDANNA,
    rischioResa, rischioPerquisizione, piste: (s, p) => piste(s, p).filter((x) => x.k !== "rivali"),
    // setta
    livelloSetta, influenzaDi, OPERE, costoOpera,
    // scoperte e consigli
    SCOPERTE: SCOPERTE.map(({ id, gruppo, lv, nome, indizio, spiega }) => ({ id, gruppo, lv, nome, indizio, spiega })),
    // mercato nero a rotazione e situazioni dell'Alba (v70)
    STRUMENTI, BANCHI, SITUAZIONI, descriviSituazione, sitAttive, oggettoDef, postiUsati, prezzoOggetto, VERSIONE_REGOLE, costoProvaFedelta, costoCandidatura, cicliAlRapido, motivoNoRapido, testoFavorePatto, restoPatto,
    // Favori e ricatti (v74)
    FAVORI, motivoNoFavore: (s, idDeve, idA, tipo) => motivoNoFavore(s, giocatore(s, idDeve), giocatore(s, idA), tipo),
    // Servizi dei contatti e Fedina pulita (v75)
    SERVIZI, OPERE_PUBBLICHE, COSTO_OPERA_PUBBLICA, effettoInchiesta, umoreContatti,
    macchiaAzione: (s, id, a) => { const p = s.players.find((x) => x.id === id); return !!p && macchiaAzione(s, p, a); },
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.Laguna = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
