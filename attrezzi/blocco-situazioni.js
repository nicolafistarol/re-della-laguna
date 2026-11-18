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
    doppiofondo: { nome: "Valigia a doppiofondo", banco: ["mercato"], prezzo: 200_000, raro: 1, posti: 2, eff: [{ k: "pq", m: 0.35 }], descr: "Se ti perquisiscono all'Alba, sequestrano molto meno. Resta finché non la perdi. 2 posti." },
    timbro: { nome: "Timbro del Municipio", banco: ["mercato"], prezzo: 160_000, raro: 1, giorno: "permesso", descr: "Di giorno: il prossimo permesso è sicuro. Ma +6 Tracce quando lo usi." },
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
