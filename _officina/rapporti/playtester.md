# Rapporto PLAYTESTER — Re della Laguna (v65, sito vero)

Come ho giocato: sul Mac di Nicola, nel browser integrato (Chromium, finestra 1024x768), scheda "seed", partita locale `?locale` con il giocatore "Prova" contro 3 bot (Rocco, Vera, Dario). Ho giocato **Ciclo 1 e Ciclo 2 completi** (4 giorni con i dadi, la notte, l'Alba) e l'inizio del Ciclo 3.
Ho provato: comprare, rifiutare e mandare all'asta, Asta segreta (vinta una, persa una), Agenzia dal telefono, permessi del Municipio (ok, rimandato, negato), cantieri (Lavanderia, Ristorante liv.2, Hotel di lusso), primo piano del Palazzo, Banca (debito automatico e prestito), Viaggio rapido, due notti (Club Neon, Marina dei Re, punti cliccabili, Guarda la merce, festa privata, brindisi, Sette e mezzo), Alba, Guida, Legenda, Cosa ho, Messaggi, visuali Segui/Libera/Alto/2D, pulsante musica.
Non ho potuto provare: soldi sporchi, affari loschi, setta, polizia, perquisizioni. Dopo 2 Cicli **nessuno** dei 4 giocatori aveva soldi sporchi e i luoghi loschi erano ancora chiusi (si aprono al "Livello 1", quando qualcuno arriva a 3,5 M).
La musica non l'ho potuta ascoltare (non sento l'audio): il pulsante funziona (salva `laguna_audio`), l'ho rimesso acceso come l'ho trovato.
Errori nella console: **0** in tutta la partita.

Prove (foto): `/home/claude/prove/playtester/` (01…15). Diario completo minuto per minuto: `/home/claude/prove/playtester/diario.md` (51 note).

---

## Le 5 cose più importanti

1. **Il cuore del gioco (soldi sporchi e potere) nei primi 2 Cicli non si vede mai** (PT-01). Due notti con solo Club Neon e Marina, nessun affare losco, nessuno con soldi sporchi. Il titolo promette "denaro e potere", le prime 2 ore sono un Monopoly con il telefono. Chi prova il gioco per la prima volta si annoia prima di arrivare al bello.
2. **L'Asta è rotta: rifiutare e ricomprare all'asta conviene sempre** (PT-02). Piazza Corona (valore 1 M) vinta a 650 k; Torre Sovrana (1,6 M) a 444 k (28%); Villa Rosa (460 k) a 204 k. I bot rifiutano quasi tutto, quindi a fine giro c'è una raffica di aste regalate. Comprare a prezzo pieno è da polli.
3. **Molti esiti importanti succedono "in silenzio"** (PT-03, PT-04, PT-05). Permesso rimandato o negato: la notizia va solo nei Messaggi, a schermo non succede niente e sembra un bottone rotto. Affitto più alto dei soldi: ti ritrovi a 0 € con un debito al 10% e nessun avviso. Compro senza soldi: il click non fa nulla.
4. **La vista "2D" è la cosa più bella del gioco, ed è nascosta** (PT-06). È una foto realistica dell'arcipelago (grattacieli, porto, yacht): dà subito la sensazione di "essere dentro" che Nicola cerca. Il 3D invece sembra un plastico, con etichette che si coprono. Il nome "2D" la fa sembrare la versione povera.
5. **La notte è bellissima da vedere ma ha poche scelte vere, e alcune promettono cose che non fa** (PT-07, PT-08, PT-09). Le foto (salotto, motoscafo, discoteca, marina) creano tanta atmosfera. Però: Privé e megayacht sempre chiusi senza dire quanto manca; "Esci sulla spiaggia" apre solo il menu viaggi; a Sette e mezzo sballo e mi ridanno i soldi perché il bot rifiuta, e non vedo mai l'avversario giocare.

Decisioni di Nicola servono per: PT-01, PT-02, PT-06, PT-08, PT-12, PT-13, PT-21 (**7 domande**).

---

## Problemi

### PT-01 — Nelle prime 2 notti non c'è niente di losco: il gioco "di soldi e potere" parte troppo tardi
- **Gravità:** ALTA (game design)
- **Dove:** motore.js:1154-1165 (LUOGHI con `sblocco`), gioco.js:613 / 1339 (`L.LUOGHI[l].sblocco <= S.sblocco`), ATTIVITA/OCCASIONI con `sblocco: 1`.
- **Come si vede:** Notte 1 e Notte 2: "Dove vai?" offre solo Club Neon e Marina dei Re (foto 07, 08). La Gazzetta della prima notte dice "Gli affari loschi arriveranno presto". Dopo 2 Cicli e mezzo nel salvataggio tutti hanno `sporchi: 0`. Il patrimonio più alto era ~2,5 M, quindi il Livello 1 (3,5 M) era ancora lontano. Nella finestra "Dove vai?" i luoghi chiusi (Bisca, Porto, Casinò, Mercato Nero) non compaiono proprio: non so che esistono né quando si aprono.
- **Proposta:** (a) mostrare i luoghi chiusi con il lucchetto e la frase "Si apre al Livello 1: quando qualcuno arriva a 3,5 M" (piccolo); (b) aprire **un** piccolo affare losco già dalla Notte 1 (es. "Il VIP ubriaco" o "Il container dimenticato"), così il giocatore assaggia il rischio subito (piccolo, ma cambia il bilanciamento: va provato con la simulazione dei bot).
- **Decisione di Nicola: SÌ.** "Le prime notti adesso sono solo feste e chiacchiere. Gli affari sporchi arrivano quando qualcuno ha 3,5 milioni (di solito dopo 3 o più Cicli). Cosa preferisci? A) Va bene così, ma i posti chiusi si vedono con il lucchetto. B) Già dalla prima notte c'è un affare losco piccolo (poco guadagno, poco rischio). C) Il Livello 1 arriva prima (per esempio a 2,5 M)."

### PT-02 — Aste regalate: rifiutare e ricomprare all'asta è sempre la mossa migliore
- **Gravità:** ALTA (bilanciamento)
- **Dove:** schermata "Asta" e bot (bot.js: offerte all'asta); log del Ciclo 1 G4 e del Ciclo 2 G3.
- **Come si vede:** Via delle Onde 200 k → Vera 188 k. Via degli Smeraldi 1,1 M → Rocco 678 k. **Piazza Corona 1 M → io con 650 k.** Torre Sovrana 1,6 M → Dario 443.875 €. Viale del Tramonto 560 k → 442 k. Villa Rosa 460 k → 203.890 €. Anche i bot rifiutano in massa ("Dario rinuncia", "Vera rinuncia"). In più l'asta finisce all'istante: non vedo le offerte degli altri, non c'è rilancio, non c'è tensione.
- **Proposta:** (1) prezzo minimo all'asta (es. 70-80% del valore; se nessuno ci arriva il terreno resta alla Banca) (piccolo); (2) dopo l'asta mostrare tutte le offerte segrete ("Rocco 610 k, Vera 0, Dario 520 k") così c'è il brivido del "per un pelo" (piccolo); (3) se ho 0 € l'asta non deve chiedermi un'offerta (ora la chiede con "Hai 0 €") (piccolo).
- **Decisione di Nicola: SÌ.** "All'asta i terreni si vendono anche al 30% del prezzo, quindi conviene sempre dire 'Lascio stare' e ricomprarli all'asta. Come lo sistemiamo? A) Prezzo minimo: sotto il 75% del valore il terreno non si vende. B) Chi rifiuta di comprare non può partecipare a quell'asta. C) Tutti e due. D) Va bene così, è una furbizia permessa."

### PT-03 — Permesso del Municipio "rimandato" o "negato": a schermo non succede niente
- **Gravità:** ALTA (chiarezza: sembra un bug)
- **Dove:** motore.js:2112-2120 (`chiediPermesso`: 55% ok, 30% rimandato, 15% negato; rimandato/negato vanno in `privato()`); app Imprese.
- **Come si vede:** C1 G2 clicco "Chiedi il permesso al Municipio": non succede nulla. Riclicco: compare piccolo "Al Municipio si va una volta per turno." (ma era un giorno nuovo!). Solo dopo, nei Messaggi, trovo "la tua pratica per Golf delle Palme è rimandata" (foto 06, 11). Mi è successo 2 volte su 5. Il "negato" fa comparire un bottone nuovo, "Una busta all'assessore (50.000 €)", senza spiegare perché è comparso. I messaggi del Municipio iniziano con la minuscola ("la tua pratica…", "permesso negato per…").
- **Proposta:** finestra o toast grande con l'esito: "Il Municipio ha RIMANDATO la tua pratica (succede 3 volte su 10). Riprova domani." / "NEGATO. L'assessore fa capire che con una busta si può parlare →". Scrivere vicino al bottone, prima del click: "Esito: 55% sì, 30% rimandato, 15% no". Dopo il primo tentativo del giorno, bottone grigio con "Domani". Lettera maiuscola nei messaggi. (piccolo)
- **Decisione di Nicola:** NO (è chiarezza, la regola resta uguale).

### PT-04 — Debito automatico senza nessun avviso
- **Gravità:** ALTA
- **Dove:** pagamento affitti (motore), riquadro "I tuoi soldi", app Banca.
- **Come si vede:** C2 G2: avevo 142.660 € e pago 232.800 € di affitto a Rocco. Risultato: "0 €" e un debito di 90.140 € al 10% a ogni Alba. Si vede solo "debito 90k" scritto piccolo sotto l'icona Banca (foto 10). Il toast dice solo "Prova paga 232.800 €".
- **Proposta:** quando i soldi non bastano: finestra rossa "Non avevi abbastanza: la Banca ha coperto 90.140 € — debito al 10% a ogni Alba". Nel riquadro soldi una riga rossa "Debito 90.140 €" sempre visibile finché non lo restituisci. (piccolo)
- **Decisione di Nicola:** NO.

### PT-05 — Azioni che non partono, senza nessuna spiegazione
- **Gravità:** MEDIA
- **Dove:** finestra di acquisto, app Imprese, app Palazzo.
- **Come si vede:** (a) Viale del Tramonto 560 k con 0 € in tasca: "Compro" sembra un po' spento ma è cliccabile, non fa nulla e non dice nulla. (b) In Imprese i bottoni "Chiedi il permesso al Municipio" restano gialli e attivi dopo che ho già fatto la mossa del giorno. (c) Ci sono 3 bottoni identici "Chiedi il permesso al Municipio", uno per terreno, **senza il nome del terreno**: ho chiesto il permesso per il Golf invece che per il Sentiero.
- **Proposta:** bottone grigio con il motivo ("Ti mancano 560.000 €", "Hai già fatto la mossa di oggi", "Al Municipio torni domani"). Scrivere il nome del terreno nel bottone ("Permesso per Sentiero delle Mangrovie"). (piccolo)
- **Decisione di Nicola:** NO.

### PT-06 — La vista "2D" (foto realistica) è molto più bella del 3D ma ha un nome che la sminuisce
- **Gravità:** ALTA (sensazione di "essere dentro il mondo")
- **Dove:** pulsante "2D" nella colonna delle visuali; panorama.js.
- **Come si vede:** foto 05: l'arcipelago fotorealistico, con grattacieli sull'isola centrale, porto, yacht e case rosse. È esattamente il mondo che descrive Nicola. In confronto il 3D (foto 01, 02, 04) sembra un plastico di cartone: edifici marroni a blocchi tutti uguali, auto come mattoncini, isole che si fondono. Però nella vista foto le etichette sono minuscole (testo di circa 8 px) e affollate, e la pedina si vede poco.
- **Proposta:** rinominare "2D" in "Foto" o "Città"; ingrandire le etichette e far vedere i nomi solo passando sopra o con lo zoom; valutare di usarla come vista principale quando non si muovono le pedine (medio). Tornando al 3D la camera dovrebbe ricordare la visuale scelta prima (adesso torna sempre a "Segui").
- **Decisione di Nicola: SÌ.** "Il tabellone ha due facce: il 3D (modellini) e la 'foto' dell'arcipelago (pulsante 2D), che è molto più bella e realistica. Quale vuoi come vista principale? A) Il 3D, e la foto resta un extra col nome 'Foto'. B) La foto come vista principale, il 3D quando si tirano i dadi. C) Lavoriamo per far assomigliare il 3D alla foto (lavoro grande)."

### PT-07 — "Sali al Privé" e "Sali sul megayacht" sempre chiusi, senza numeri
- **Gravità:** MEDIA
- **Dove:** gioco.js:1140-1142 (punto bloccato se `P[chi].lv > S.lustro`); motore.js:1379 `lustro = fama + patrimonio/500.000 ≥ 30 → 1`.
- **Come si vede:** toast "Il buttafuori ti ferma: qui entra solo chi ha più fama e più soldi". Lo stesso testo esce anche sul megayacht (un buttafuori su uno yacht?). Con fama 23 io ero a circa 28 punti su 30, ma il gioco non lo dice: non so cosa fare per entrare né quanto mi manca.
- **Proposta:** "Per il Privé servono 30 punti di prestigio (fama + 1 ogni 500 k di patrimonio). Tu ne hai 28." Testo diverso per la Marina ("Il marinaio di guardia…"). (piccolo)
- **Decisione di Nicola:** NO.

### PT-08 — Sette e mezzo contro un bot: sballo e mi ridanno i soldi; non vedo mai l'altro giocare
- **Gravità:** MEDIA
- **Dove:** motore.js:1662-1686 (`sfida` → `rispondiIncontro`: se rifiuta, `restituisci_`); bot.js:354.
- **Come si vede:** punto 50.000 €, pesco 2 di bastoni + 6 di coppe = 8 "(sballato)". Poi "Dario non accetta la sfida. Ti riprendi i soldi". Il riquadro "Com'è andata" scrive **"−50.000 €"**, ma i soldi mi sono tornati (foto 12). Il tavolo verde con le carte vere è bellissimo (foto 13), però la partita non è mai avvenuta: zero emozione.
- **Proposta:** (a) correggere "Com'è andata" (bug, piccolo); (b) chiedere all'avversario PRIMA di dare le carte ("Dario accetta il tavolo") e poi giocare tutti e due davvero, mostrando le carte del bot alla fine (medio).
- **Decisione di Nicola: SÌ.** "A Sette e mezzo adesso giochi tu, e solo dopo l'altro decide se accettare. Se rifiuta, anche se hai sballato, riprendi i soldi e non vedi le sue carte. Come preferisci? A) Prima l'altro accetta, poi giocate tutti e due e alla fine si vedono le carte. B) Resta così (è il bluff), ma alla fine si vede almeno cosa avrebbe avuto."

### PT-09 — Punti luminosi della notte che promettono una cosa e ne fanno un'altra
- **Gravità:** MEDIA
- **Dove:** scene notturne (panorama.js, gioco.js:1135-1150).
- **Come si vede:** "Esci sulla spiaggia" apre solo il menu "Dove vai?" (nessuna spiaggia). "In fondo al pontile" è grigio e non si capisce perché. "Resta qui e guardati intorno" chiede due tocchi e poi non succede niente di visibile. La foto gira da sola, e i punti luminosi scappano mentre provi a cliccarli. La giornalista "ti riconosce" e sparisce all'ora dopo senza che si capisca cosa volesse.
- **Proposta:** rinominare i punti come portali ("Vai altrove: spiaggia…") oppure aprire davvero una scena; bloccare la rotazione automatica quando il mouse è sopra un punto; dopo "Guardati intorno" scrivere sempre cosa hai visto (anche "Niente di strano: 3 turisti, il barista"). (piccolo/medio)
- **Decisione di Nicola:** NO.

### PT-10 — Incoerenze nella notte: "incroci Rocco/Dario" ma loro risultano "a casa"
- **Gravità:** MEDIA
- **Dove:** racconto della notte contro lo stato dei giocatori in alto a sinistra.
- **Come si vede:** Notte 1, ore 00: "A Club Neon incroci Rocco", ma in alto "Rocco · a casa". Notte 2, ore 01: "A Club Neon incroci Dario. Vi guardate un attimo", ma in alto "Dario · a casa". Il gioco dice che "di notte non si sa chi c'è", ma qui si contraddice da solo. Anche "Il tuo Palazzo" la Notte 1, quando il Palazzo non ce l'avevo (0 piani).
- **Proposta:** il racconto "incroci X" solo se X è davvero lì in quell'ora; scena di casa "Il tuo appartamento" finché i piani sono 0. (piccolo)
- **Decisione di Nicola:** NO.

### PT-11 — La barra in alto dice "Tocca a te" durante il turno dei bot; la camera non segue i bot
- **Gravità:** MEDIA
- **Dove:** intestazione "Ciclo · Giorno · Tocca a te"; camera "Segui".
- **Come si vede:** C1 G1: mentre Dario tira i dadi, in alto c'è ancora "Tocca a te" (poi a volte diventa giusto: "Turno di Vera"). La camera resta sulla mia macchina: dei bot vedo solo toast e il registro piccolo a sinistra, non dove vanno né cosa comprano. Alcune pedine dei bot (fumetti "Rocco", "Vera") restano sospese nel buio o sul mare, lontano dalla strada.
- **Proposta:** intestazione aggiornata subito; camera che segue chi muove (con un pulsante "torna a me"); pedine sempre appoggiate sulla strada. (piccolo/medio)
- **Decisione di Nicola:** NO.

### PT-12 — Il "Viaggio rapido" promette "Dove vuoi andare?" ma porta solo al Municipio
- **Gravità:** MEDIA
- **Dove:** gioco.js:2292 (`MEZZO`: le mete dipendono dai mezzi posseduti; senza mezzi solo il taxi per il Municipio a 250 k).
- **Come si vede:** finestra "Dove vuoi andare?" con una sola voce. All'Alba Vera mi scrive: "Vuoi arrivare su un'isola precisa? … viaggio rapido": non è vero, finché non compri un mezzo nell'app Lusso, ma nessuno lo dice.
- **Proposta:** nella finestra mostrare anche le mete chiuse ("Marina - serve il Traghetto, app Lusso", "Elicottero → Palazzo"…) e correggere il consiglio di Vera. (piccolo)
- **Decisione di Nicola: SÌ.** "Il Viaggio rapido adesso porta solo al Municipio, finché non compri un mezzo (traghetto, motoscafo, elicottero, jet). Preferisci: A) Così, ma la finestra mostra le mete chiuse e cosa serve. B) Sempre almeno 'un'isola a scelta' anche senza mezzi, a pagamento."

### PT-13 — Scelte finte tra le attività: Ristorante e Hotel di lusso battono tutto
- **Gravità:** MEDIA (decisione di Nicola: "ogni attività vantaggi diversi e chiari")
- **Dove:** app Imprese, lista "Scegli cosa aprire".
- **Come si vede:** su un terreno da 150 k: Ristorante rende 142.500; Agenzia, Lavanderia e Magazzino 85.500; Residenze 64.125. Su Piazza Corona Hotel di lusso = stessa rendita del Ristorante (950 k) **più** 2 fama **più** fa salire il valore dell'isola: è meglio del Ristorante in tutto. Inoltre la Lavanderia "ripulisce i soldi sporchi", ma i soldi sporchi nei primi Cicli non esistono (PT-01), quindi nei primi Cicli è solo una perdita.
- **Proposta:** dare a ogni attività un "perché sceglierla" concreto e un costo vero (es. Hotel: rende il 15% in meno ma +fama; Lavanderia: rende poco ma da subito dà qualcosa). Da verificare con la simulazione. (medio)
- **Decisione di Nicola: SÌ.** "L'Hotel di lusso rende quanto il Ristorante e in più dà fama: nessuno sceglie più il Ristorante. Cosa preferisci? A) L'Hotel rende meno del Ristorante (es. −15%) ma dà fama. B) L'Hotel costa di più da aprire. C) Va bene così, l'Hotel è il premio dei terreni cari."

### PT-14 — Prezzi del cantiere incoerenti
- **Gravità:** BASSA
- **Dove:** app Imprese.
- **Come si vede:** il bottone dice "Apri Lavanderia · 75.000 €", il registro dice "(67.500 €)". Dario apre cantieri a 29.750 €, Vera a 175.000 €: nessuna spiegazione dello sconto o della formula.
- **Proposta:** il bottone deve mostrare il prezzo vero, con lo sconto spiegato ("−10%: Agenzia" o simile). (piccolo)
- **Decisione di Nicola:** NO.

### PT-15 — Il prestito consuma la mossa del giorno, senza dirlo
- **Gravità:** MEDIA
- **Dove:** app Banca, "Chiedi un prestito".
- **Come si vede:** prima "Oggi puoi fare una mossa", dopo il prestito "Hai già fatto la tua mossa di oggi". La finestra del prestito non lo dice. Il tasso è scritto in due modi diversi ("10% a Ciclo, da restituire entro 3 Cicli" e "Interesse a ogni Alba: 10%"). Nella Banca, "Ultimi movimenti" non contiene i cantieri (67,5 k, 165 k, 500 k), il Palazzo, la macchina fotografica e la restituzione del debito: il conto non torna. Grammatica: "a la Banca" invece di "alla Banca".
- **Proposta:** scritta "Usa la tua mossa di oggi" sul bottone (oppure renderlo gratis); una sola frase per il tasso; tutti i movimenti nella lista. (piccolo)
- **Decisione di Nicola:** NO (se il prestito debba costare la mossa è una regola: l'importante è che sia scritto).

### PT-16 — Etichette sovrapposte e camera "Segui" troppo vicina
- **Gravità:** MEDIA (conferma quello che ha visto l'orchestratore)
- **Dove:** tre.js / mondo3d.js, etichette HTML sopra il 3D.
- **Come si vede:** foto 01, 04, 10: "190k" sopra "70k", "Corte dei Mosaici" coperta dall'icona Agenzia, il nome della casella coperto dal fumetto della pedina. Su Baia Flamingo 8-10 prezzi si accavallano. Zoomando indietro compaiono cartelloni enormi ("Terracotta / tue 1 vie su 3") che coprono tutto. Nella vista Libera il trascinamento muove pochissimo. Dopo aver costruito il **primo piano del Palazzo non sono riuscito a trovarlo sul tabellone**: nessuna animazione, nessuna voce "Palazzo" nella Legenda.
- **Proposta:** nascondere i prezzi lontani (mostrarli solo vicino alla camera o passando sopra), un solo cartello per gruppo, camera Segui più alta; quando alzi il Palazzo, la camera ci vola sopra e lo mostra crescere. (medio)
- **Decisione di Nicola:** NO.

### PT-17 — Il riquadro "Rivali" ripete la stessa frase per 8 turni
- **Gravità:** BASSA
- **Dove:** pannello in basso prima di tirare i dadi.
- **Come si vede:** "Vera ha 2 vie su 3 del gruppo Sabbia: l'ultima è di Dario" sempre uguale dal C1 G3 al C3 G1. Diventa rumore, e quando compare sposta il bottone "Tira i dadi" (ho cliccato a vuoto).
- **Proposta:** ruotare le notizie, mostrarla una volta sola, non spostare il bottone. (piccolo)
- **Decisione di Nicola:** NO.

### PT-18 — "MENTRE ASPETTAVI −650.000 €" a inizio turno è fuorviante
- **Gravità:** BASSA
- **Dove:** pannello inizio turno C2 G1.
- **Come si vede:** quei 650 k erano la MIA asta vinta il giorno prima, non qualcosa successo mentre aspettavo. Inoltre, dopo l'asta vinta, il riquadro soldi resta a 702.500 € finché non chiudi il risultato.
- **Proposta:** scrivere "Asta vinta: Piazza Corona −650.000 €"; aggiornare i soldi subito. (piccolo)
- **Decisione di Nicola:** NO.

### PT-19 — Riepilogo dell'Alba: piccole contraddizioni
- **Gravità:** BASSA
- **Dove:** finestra "Com'è andata stanotte".
- **Come si vede:** "POLIZIA: Tranquillo — 1 guaio stanotte" (il "guaio" era aver comprato una macchina fotografica). Molo Palma non compare nei conti (rende? il pedaggio dove va?). La Gazzetta "parla di te" ma non cita la mia vittoria all'asta di un terreno da 1 M. L'ULTIM'ORA "Crollo della Borsa −30%" arriva senza che io abbia mai visto la Borsa.
- **Proposta:** chiamare "guaio" solo le cose rischiose; mostrare i Moli nei conti ("pedaggi incassati: X"); notizia dell'asta in Gazzetta; dopo un evento di Borsa un collegamento "Cos'è la Borsa". (piccolo)
- **Decisione di Nicola:** NO.

### PT-20 — Molo e terreni speciali senza spiegazione in Imprese
- **Gravità:** BASSA
- **Dove:** app Imprese, voce "Molo Palma · Terreno vuoto".
- **Come si vede:** nessun bottone, nessuna spiegazione. Solo in "Cosa ho" c'è scritto "chi ci passa paga il pedaggio".
- **Proposta:** stessa riga anche in Imprese: "Molo: non si costruisce, chi passa paga il pedaggio (X €)". (piccolo)
- **Decisione di Nicola:** NO.

### PT-21 — Tre dadi: non si capisce come si contano
- **Gravità:** BASSA
- **Dove:** animazione dei dadi; riquadro con i 3 numeri.
- **Come si vede:** escono tre dadi grandi (il terzo coperto o tagliato) e un "10". Poi il riquadro mostra "4 5 1", "6 6 1", "2 3 1". La Guida non dice perché sono tre né se il terzo è speciale.
- **Proposta:** se il terzo dado è speciale, colorarlo diversamente e spiegarlo in una riga; altrimenti mostrare la somma "4+5+1 = 10". (piccolo)
- **Decisione di Nicola: SÌ (solo se il terzo dado ha un significato).** "Si tirano 3 dadi. Il terzo ha un ruolo speciale? A) No, si sommano tutti e tre: scriviamo la somma. B) Sì: lo coloriamo e spieghiamo a cosa serve."

### PT-22 — Legenda che esce dal riquadro; Messaggi che sono solo notifiche
- **Gravità:** BASSA
- **Dove:** pannello Legenda (foto 15); app Messaggi.
- **Come si vede:** il testo "Nel mondo 3D: …" della Legenda va sopra il pannello delle azioni e viene tagliato. "Messaggi" contiene soprattutto notifiche di sistema ("Nuova scoperta +1 fama"). La chat di Vera che spiega l'Agenzia ("Hai visto? Rocco ha comprato…") è un'ottima idea, ma non si può rispondere. La nuova sezione "NOTTE" (valigetta) compare nel telefono senza nessun avviso.
- **Proposta:** Legenda scorrevole dentro il suo riquadro; separare "Notifiche" e "Chat"; avviso "Nuova app: Valigetta". (piccolo)
- **Decisione di Nicola:** NO.

### PT-23 — Due "Avanti" per un viaggio notturno con la stessa schermata
- **Gravità:** BASSA (ritmo)
- **Dove:** scena "In viaggio verso…".
- **Come si vede:** per andare al Club Neon servono 2 ore: 2 click su "Avanti" con la stessa foto identica (22→23→00). Il testo dice "attraverso i ponti" ma la foto è un motoscafo.
- **Proposta:** viaggio in un solo passo, con un'animazione breve o una seconda foto; testo coerente con l'immagine. (piccolo)
- **Decisione di Nicola:** NO.

---

## Cose belle (da non perdere)
- **Le foto della notte** (salotto, motoscafo al buio, Club Neon con i laser, Marina con gli yacht): l'atmosfera è da film. Qui sì che ci si sente "dentro".
- **Il riepilogo dell'Alba** (rendite, tasse, fatti della notte, Gazzetta): chiaro e soddisfacente, il momento migliore del Ciclo.
- **Il telefono**: home ordinata (Soldi / Costruire / Persone), "Cosa ho" ottimo, Palazzo con stanze molto evocative (Terrazza col cannocchiale, Caveau, Bunker, Casinò privato).
- **Incontri della Notte 2**: "Dario ti offre da bere", "Dario è qui con te: toccalo" → offrigli da bere, sfidalo, seguilo, fotografalo. È il pezzo più "gioco di potere" che ho visto.
- **Sette e mezzo con le carte vere** e il bottone "Rilancia (bluff o mano buona?)".
- **"Una busta all'assessore"** dopo un permesso negato: corruzione tematica e divertente.
- La Guida (6 pagine con foto) è breve e chiara.
- 0 errori nella console, i bot giocano in circa 15 secondi.

---

## Esperienza complessiva (sincera)

**È divertente?** A metà. Il primo Ciclo è un Monopoly lento: tiri i dadi, compri, chiedi un permesso, aspetti 15 secondi i bot, e intanto non vedi cosa fanno. Il momento in cui mi sono divertito davvero è stato quando ho capito il trucco delle aste ("compro Piazza Corona al 65%!"). Però subito dopo ho pensato "allora il gioco è rotto". La seconda notte (Dario che offre da bere, Sette e mezzo, la festa) è il primo momento in cui ho sentito curiosità vera. Poi la mano a carte è finita nel nulla e mi sono un po' sgonfiato.

**Ci si sente dentro un mondo di soldi e potere?** Dentro un mondo **sì, di notte**: le foto sono bellissime. Di soldi e potere **non ancora**: dopo 2 Cicli nessuno aveva un euro sporco, nessuno mi ha minacciato, la polizia è sempre "Tranquillo", non ho corrotto nessuno (a parte la busta, che non potevo pagare). Il "potere" adesso è solo avere più rendite all'Alba. Di giorno il 3D sembra un plastico, e la vista "foto" (pulsante 2D), che è magnifica, la scopre solo chi è curioso.

**Cosa manca per renderlo un videogioco vero?**
1. **Un rischio e una tentazione dalla prima notte**: un piccolo affare sporco subito, con il rischio scritto chiaramente. Il sapore del gioco deve arrivare nei primi 10 minuti, non dopo un'ora.
2. **Rivali vivi**: i bot devono fare cose che ti riguardano (offerte, minacce, ricatti, "ti ho visto al Porto") e devi VEDERLI muoversi sul tabellone, con la camera che li segue.
3. **Ogni azione con una reazione visibile**: esito del Municipio a schermo, debito in rosso, Palazzo che cresce davanti ai tuoi occhi con la camera che ci vola sopra.
4. **Tensione nelle sfide**: aste con le offerte svelate e un prezzo minimo, carte giocate da tutti e due.
5. **Un mondo coerente**: chi "incroci" deve essere davvero lì, i punti luminosi devono portare dove dicono.

In una frase: **la vetrina c'è (soprattutto di notte), il motore c'è (tante regole profonde), ma le prime 2 ore non fanno vedere il gioco che Nicola ha in testa.** Il lavoro più utile adesso è rendere i primi 2 Cicli più tesi e più chiari, non aggiungere funzioni nuove.
