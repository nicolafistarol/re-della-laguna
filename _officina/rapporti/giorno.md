# Rapporto settore "GIORNO" — Re della Laguna (fase 1, solo analisi)

Cosa ho fatto:
- Ho letto la parte del giorno di motore.js (righe 265-1010, 2102-2215, 2751-2800, 2939-3100, 3299-3480) e le parti di gioco.js su dadi, finestre, Imprese, Agenzia, Municipio, Palazzo e Guida.
- Ho simulato in Node con 4 bot: 40 partite in tutto (12 e 16 Cicli), più le prove sui casi limite (`/home/claude/prove/giorno/edge.js`).
- Ho giocato nel browser con lo strumento: inizio partita, 3 turni completi, e un turno a metà partita (Ciclo 6) e a fine partita (Ciclo 10) caricando stati creati coi bot. Ho provato PC 1280x800 e telefono 390x844.
- Script e foto: `/home/claude/prove/giorno/` (sim.js, sim2..6.js, asta.js, edge.js, crea_stato.js, foto2.js = foto.js che fa più foto e carica uno stato).
- Nota: col 3D software (swiftshader) il browser è circa 10 volte più lento. Per le prove di flusso ho usato `?2d` (le animazioni restano attive).

---

## LE 5 COSE PIÙ IMPORTANTI

1. **GIO-01. I livelli 3, 4 e 5 non si raggiungono quasi mai.** In 10 partite da 16 Cicli coi bot non c'è mai stato un lotto al livello 3. In media si chiudono 1,3 gruppi su 20. A fine partita il 40% dei terreni comprati è ancora vuoto. Così non scattano mai i vantaggi "lusso" (Hotel, Boutique), l'Icona, la Banca privata e gli affitti alti.
2. **GIO-02. Il tabellone pesa poco sui soldi.** A fine partita gli affitti sono circa l'1-3% delle entrate (circa 1 M a Ciclo per tutti insieme, contro circa 70 M di rendite all'Alba). Le carte Gazzetta valgono 30-250 mila € fissi e dal Ciclo 4 non contano. Il turno tipico di fine partita è sempre "tira → un piano del Palazzo → fine". Per i dadi non c'è più niente da decidere.
3. **GIO-03. Il passaggio ai bot si capisce male (è la lamentela di Nicola).** Premi "Fine turno" e i dadi del prossimo partono subito. In alto resta scritto "Tocca a te". I soldi della tua ultima mossa stanno ancora volando sullo schermo (foto `t2_fine_0_3s.png`). La carta in basso mostra solo "…". Non c'è un momento chiaro che dica "adesso tocca a Vera".
4. **GIO-04. Una sola mossa per turno, più permessi a caso, rende il Palazzo l'unica scelta.** In un Ciclo un giocatore ha 4 mosse. Il permesso riesce 1 volta su 2 (55%). Con 15-20 terreni non si riesce a costruirli. Il Palazzo invece non chiede permesso, rende il 62-93% del suo costo a ogni Alba e nel patrimonio vale il 100% di quello che è costato. Quindi spendere tutto in piani non ha mai un rischio: a fine partita non c'è una decisione vera.
5. **GIO-05. Diversi testi dicono il contrario del codice.**
   - "Gruppo completo = affitti doppi": vale solo per i terreni vuoti.
   - "Moli: chi ci passa paga": paga solo chi si ferma.
   - "Ogni isola ha 2 gruppi": sono 4.
   - "La Borsa: senza commissioni": le commissioni non esistono.
   - "Banca Centrale: prestito con l'Azione del giorno": il prestito si chiede da ovunque.
   - "Asta del Comune": non è un'asta.
   - La licenza del casinò costa 400.000 € sicura sulla casella e 500.000 € a caso dall'app.
   - Le schede di Faro, Ingresso di Corona e Posto di blocco sono vuote (numeri delle caselle del vecchio tabellone).

**Decisioni di Nicola che servono: 7** (GIO-01, 02, 04, 08, 09, 11, 17).

---

## ELENCO COMPLETO

### GIO-01 — Livelli 3-5 e gruppi di vie: quasi irraggiungibili
- **Gravità:** ALTA
- **Dove:** motore.js:617 (`next >= 3 && !haSerie`), bot.js (i bot non propongono mai scambi).
- **Come si vede:**
  - Partite simulate coi bot (sim6.js): 10 partite da 16 Cicli.
  - 0 lotti al livello 3 o più. In media 1,3 gruppi completi su 20.
  - Il 40% dei terreni posseduti è ancora vuoto a fine partita (241 su 600).
  - Ogni gruppo ha 3 vie e ci sono 4 giocatori che comprano. I bot non vendono quasi mai (vogliono 3 volte il valore se hanno il gruppo) e non propongono mai scambi.
- **Conseguenze:**
  - "Hotel/Boutique di lusso: dal livello 3 ti dà fama" non succede mai. In pratica l'Hotel è un Ristorante.
  - L'Icona (livello 5, fama 50) e la Banca privata (serve il gruppo) restano sulla carta.
  - Gli affitti restano bassi (vedi GIO-02).
  - Contro i bot è peggio ancora, perché i bot non scambiano.
- **Proposta (media):**
  - Livello 3 con 2 vie su 3 del gruppo; livello 4-5 con il gruppo intero.
  - Oppure lasciare la regola com'è ma rendere lo scambio una cosa normale: i bot propongono e accettano scambi a prezzi giusti, e c'è un tasto "Completa il gruppo" sulla scheda della via che manca.
- **Decisione di Nicola: SÌ.**
  > "Oggi quasi nessuno arriva al livello 3 perché servono tutte e 3 le vie del gruppo. Cosa preferisci?
  > A) Livello 3 con 2 vie su 3, gruppo intero per i livelli 4 e 5.
  > B) Regola uguale, ma gli scambi tra giocatori (e coi bot) diventano facili e frequenti.
  > C) Gruppi da 2 vie invece che da 3.
  > D) Lasciare così: il livello 3 è una cosa rara."

### GIO-02 — I dadi e il tabellone contano poco
- **Gravità:** ALTA (divertimento)
- **Dove:** motore.js:229-237 (`affitto`), 482-497 (carte Gazzetta), costanti `affVuoto 0.15`, `affLvl [1,1,4,…]`.
- **Come si vede:**
  - Simulazione sim3.js, soldi passati di mano per Ciclo:
    - affitti 0,4-1,5 M a Ciclo, per tutti e 4 insieme;
    - stipendi 0,6-2,4 M;
    - rendite all'Alba a fine partita (sim2.js): 60-75 M a Ciclo.
  - Un affitto al livello 2 vale il 60% del prezzo del terreno; la rendita all'Alba vale il 209%.
  - Le carte Gazzetta danno o tolgono 30.000-250.000 € fissi, anche quando hai 30 M.
  - Forme dei turni dei bot nel Ciclo 9-12: le più frequenti sono "tira, piano" e "tira, permesso".
  - Dal Ciclo 8-9 non ci sono più terreni liberi, quindi anche "Compro / Lascio stare" e l'Agenzia spariscono.
- **Proposta (media):**
  - Affitto delle attività legato alla rendita (per esempio il 40-60% della rendita all'Alba di quel lotto), così finire sul Casinò di un rivale fa male anche a fine partita.
  - Bonus del gruppo anche sui lotti costruiti.
  - Carte Gazzetta in percentuale del patrimonio, e metà carte con una scelta ("Paghi 3% o rischi...").
  - Eventi del giorno legati all'isola (per esempio "settimana della moda a Flamingo: affitti x2 per un giorno").
  - Non rende il gioco più facile: rende i dadi importanti.
- **Decisione di Nicola: SÌ.**
  > "A fine partita gli affitti e le carte della Gazzetta non contano quasi niente. Vuoi che:
  > A) gli affitti crescano con l'attività (finire sul locale di un rivale fa male),
  > B) le carte Gazzetta diventino scelte con importi in percentuale,
  > C) tutte e due,
  > D) va bene così, il giorno serve solo a costruire."

### GIO-03 — Passaggio del turno ai bot: dadi del prossimo mentre la tua mossa finisce
- **Gravità:** ALTA
- **Dove:** gioco.js:393-424 (`eseguiCoda`), 404 (`disegna()` con lo stato vecchio), 1393 (tasto Fine).
- **Come si vede:**
  - Foto `t2_fine_0_3s.png`: appena premuto "Fine turno", in alto resta "Ciclo 1 · Giorno 3 · **Tocca a te**", vola ancora "Tu → la Banca 300.000 € Acquisto di Sentiero delle Palme" e i 3 dadi del prossimo stanno già girando.
  - Foto `t2_fine_1_8s.png`: "VERA TIRA I DADI", ma in alto c'è ancora "Tocca a te".
  - La carta in basso resta "…" per 8-14 secondi.
  - Lo stato (S) viene aggiornato solo dopo le animazioni di tutti i bot. Fino ad allora intestazione, saldi e telefono mostrano il turno vecchio: si può aprire il telefono e premere tasti su dati vecchi.
  - Le finestre aperte bloccano i dadi dei bot (gioco.js:406), però la carta e l'intestazione restano comunque ferme e vecchie. Se si riapre "Vedi le storie di partenza" con il tasto vecchio, tutto resta fermo finché non si chiude.
- **Proposta (media):**
  1. Prima di ogni bot, 0,6 secondi di cartello "Tocca a Vera" e intestazione aggiornata a ogni passo: si applica lo stato a pezzi, o almeno si aggiornano "chi tocca" e la pedina.
  2. Aspettare che finiscano le monete e i toast della mia mossa prima dei dadi del prossimo.
  3. Nella carta in basso: "Turno di Vera… (2 di 3)" invece di "…".
  4. Una riga "Mentre aspettavi" per bot (c'è già, è da tenere).
- **Decisione di Nicola:** NO (forse solo: vuole un tasto "bot veloci"?).

### GIO-04 — Una mossa per turno + permessi a caso: il Palazzo vince sempre
- **Gravità:** ALTA (strategia)
- **Dove:** motore.js:599-603 (`azioneGiorno`), 2102-2121 (`chiediPermesso`: 55% sì, 30% rimandato, 15% negato), 662-698 (Palazzo), 207-226 (patrimonio: lotti e piani al 100% del costo).
- **Come si vede:**
  - Con 20 terreni servono 40 mosse per arrivare al livello 2; in 16 Cicli ci sono 64 mosse, e circa metà dei permessi fallisce. Nel Ciclo 10 il giocatore dello stato `stato_c9.json` ha 20 terreni, di cui 7 vuoti.
  - Il guadagno a ogni Alba, rispetto al costo:
    - livello 1 → 2: +228%;
    - piano del Palazzo: 62% (93% dopo il piano 15).
  - Però il Palazzo non chiede permesso e non ha limiti. Quando i terreni sono finiti o bloccati (livelli 3-5 irraggiungibili, GIO-01), resta solo "un piano".
  - Ogni piano conta nel patrimonio quanto è costato: comprare piani all'ultimo turno non costa niente. Nessuna tensione su "spendo o tengo".
- **Proposta (media):**
  - La casella Municipio dà un permesso sicuro (vedi GIO-21).
  - Il permesso vale per 2 livelli dello stesso lotto, oppure "permesso + cantiere" con un solo tasto.
  - Nel patrimonio i piani e i livelli contano il 70-80% (come i mezzi, che contano l'80%), così spendere ha un prezzo vero.
  - Il Palazzo che rende meno man mano che sale, oppure che rende di più se hai attività sulla sua isola.
- **Decisione di Nicola: SÌ.**
  > "Oggi a fine partita la mossa migliore è sempre 'un piano del Palazzo'. Cosa cambiamo?
  > A) I permessi meno a caso (il Municipio te lo dà sicuro, o il permesso vale 2 livelli).
  > B) Piani e attività valgono meno del costo nel patrimonio finale (il 75%).
  > C) Due mosse per turno: una per i terreni e una per il Palazzo.
  > D) Va bene così."

### GIO-05 — Testi che dicono il contrario del gioco
- **Gravità:** MEDIA-ALTA (chiarezza: è il problema n.1 di Nicola)
- **Correzione:** piccola (testi). Decisione: NO.
- **Dove e come si vede:**
  - gioco.js:744: schede degli angoli con i numeri del vecchio tabellone (`{0,16,32,64}`). Con 100 caselle gli angoli sono 0, 20, 40 e 80: la casella 16 è "Calle dei Salinari", la 64 è "Via delle Orchidee". La scheda di "Ponte Ovest — Il Faro", "Ingresso di Isola Corona" e "Ponte Est — Posto di blocco" è vuota. Correzione: `{0, 20, 40, 80}`.
  - Finestra di acquisto e Guida: "Se le hai tutte, gli affitti raddoppiano". Il codice (motore.js:233) raddoppia solo i terreni vuoti.
  - gioco.js:2528 (Guida): "Moli: chi ci passa ti paga". Si paga solo se ti fermi (motore.js:436-444).
  - gioco.js:1903 (Glossario): "Ogni isola ha 2 gruppi di vie". Sono 4 per isola (20 in tutto).
  - motore.js:473: "Alla Borsa: le tue prossime operazioni oggi sono senza commissioni". Le commissioni non esistono.
  - motore.js:475: "Banca Centrale: puoi chiedere un prestito con l'Azione del giorno". Il prestito si chiede da qualsiasi casella.
  - Municipio: la finestra della casella dice "licenza sicura a 400.000 €", l'app dice "500.000 €, approvata/rimandata/negata". Due regole diverse per la stessa cosa. Se resta così, va detto chiaro in tutti e due i posti che passare dal Municipio conviene.
  - Casella "Asta del Comune": il nome promette un'asta, ma fa la stessa cosa dell'Agenzia (prezzo pieno). Le aste dei sequestri partono all'inizio di un turno qualsiasi, non quando ci si ferma lì. Proposta: o si chiama "Ufficio del Comune", o le aste dei sequestri partono quando qualcuno si ferma su quella casella.
  - gioco.js:2475: "Prestito... da restituire entro 3 Cicli". Nessuna scadenza nel codice (motore.js:917 la salva e basta).
  - motore.js:622: messaggio "(non ancora disponibile nella prova)" quando si cerca di cambiare attività.
  - Livello 5 (Icona) richiede fama 50: l'app Imprese non lo dice, lo scopri solo dall'errore.
  - Commenti nel motore: "un unico giro da 80 caselle", "Borgo Ambra (0-15)". Sono interni ma ingannano chi corregge.

### GIO-06 — Finestre nell'ordine sbagliato a inizio giorno
- **Gravità:** MEDIA
- **Dove:** gioco.js:2057-2101.
- **Come si vede:**
  - Con gli stati `stato_c5.json` e `stato_c9.json`, a inizio giorno esce prima "Sei salito di livello", poi "L'Alba · Com'è andata stanotte".
  - L'asta di un terreno sequestrato e la "chiamata dal numero sconosciuto" hanno la precedenza sul riepilogo dell'Alba: vedi l'asta di un terreno prima di sapere che il Giudice l'ha sequestrato.
- **Ordine proposto:** Alba → livello nuovo → aste → chiamata → carta Gazzetta.
- **Correzione:** piccola. Decisione: NO.

### GIO-07 — Aste: a raffica e senza prezzo minimo
- **Gravità:** MEDIA
- **Dove:** motore.js:348-361 (sequestri), 527-555 (asta del terreno rifiutato).
- **Come si vede:**
  - Seme 3 (sim5.js): all'inizio del Ciclo 12 ci sono 10 aste di sequestro una dietro l'altra. Per un umano sono 10 finestre "offerta segreta" più 10 finestre "Risultato dell'asta" con Ok: 20 clic di fila. In un'altra partita, 12 terreni sequestrati all'ultima Alba non vanno mai all'asta.
  - L'asta del terreno rifiutato non ha base: tra umani si può rifiutare e poi vincere a 1 €. Coi bot no: offrono sempre (asta.js, 73 prove, 0 vinte a 10.000 €).
  - A parità di offerta vince chi ha offerto per primo: regola nascosta.
- **Proposta (piccola):**
  - Una finestra sola "Asta del Comune: 10 terreni", con un'offerta per ognuno, e un riepilogo unico dei risultati.
  - Base del 50% anche per l'asta del terreno rifiutato.
  - A parità di offerta: si dice chi vince, oppure si rifà l'asta.
- **Decisione:** NO.

### GIO-08 — Online: di giorno nessuno ha un tempo limite
- **Gravità:** MEDIA (per le partite con la sorella e gli amici)
- **Dove:** motore.js:533-542 (l'asta aspetta tutti i partecipanti), server/index.ts (nessun timer di giorno). Di notte invece c'è il timer (TEMPO_ORA).
- **Come si vede:** se un amico non guarda lo schermo, un'asta del giorno resta aperta per sempre e nessuno può tirare. Lo stesso succede se il giocatore di turno si allontana.
- **Proposta (media):** 60 secondi per l'offerta d'asta (poi conta 0) e un avviso "Tocca a te" con suono. Dopo X minuti, gli altri possono "saltare" il turno di chi è assente.
- **Decisione di Nicola: SÌ.**
  > "Di giorno, se un amico non risponde a un'asta, la partita si ferma. Mettiamo un tempo?
  > A) 1 minuto per le aste, poi conta 'non offro'.
  > B) 1 minuto per le aste e 3 minuti per il turno, poi si salta.
  > C) Nessun tempo, ci chiamiamo al telefono."

### GIO-09 — Soldi che non bastano: debito automatico, nessun fallimento, niente spiegazioni
- **Gravità:** MEDIA
- **Dove:** motore.js:2751-2769 (`paga`, `raccogli`), 2992-2999 (interessi all'Alba). `fallito` non diventa mai vero.
- **Come si vede (edge.js prova 1):**
  - Con 10.000 € e 300.000 € in azioni finisco su un affitto di 1.500.000 €.
  - Le azioni vengono vendute da sole, senza messaggio.
  - Il resto (1.190.000 €) diventa un "debito d'emergenza" al 25% a Ciclo. Il proprietario incassa lo stesso tutto.
  - Io ricevo solo una voce pubblica sulla Gazzetta, nessun messaggio privato.
  - All'Alba la Banca prende da sola il 50% dei contanti finché il debito non è pagato.
  - Non si fallisce mai: il patrimonio può andare sotto zero e si continua a giocare.
  - I soldi non vanno mai sotto zero (bene), però il giocatore non capisce cosa è successo.
- **Proposta (piccola):**
  - Finestra "Non hai abbastanza: vendute azioni per X, debito d'emergenza Y al 25%", con i tasti "Ipoteca un terreno" e "Vendi un mezzo".
  - Decidere se esiste il fallimento.
- **Decisione di Nicola: SÌ.**
  > "Se un giocatore non può pagare, cosa succede?
  > A) Come ora: debito automatico al 25%, si continua sempre.
  > B) Prima vende da solo azioni, mezzi e ipoteca i terreni, poi debito.
  > C) Sotto zero di patrimonio è fallito ed esce, o diventa 'spettatore' che gioca solo di notte."

### GIO-10 — Comprare un terreno ipotecato: il compratore eredita l'ipoteca senza saperlo
- **Gravità:** MEDIA
- **Dove:** motore.js:2725-2740 (`rispondiProposta` non tocca `l.ipoteca` e `ipotecaCiclo`), 927-935 (ipoteca senza controllo di fase o turno).
- **Come si vede (edge.js prova 2):**
  - Ipoteco un terreno (incasso il 50%) e lo vendo: il compratore ha `ipoteca 375.000`, con il conteggio dei 4 Cicli già partito.
  - All'Alba la Banca può sequestrarglielo.
  - La finestra della proposta (gioco.js finestraProposta) non dice che il terreno è ipotecato.
  - L'ipoteca si fa anche di notte e fuori dal proprio turno (prova 3).
- **Proposta (piccola):** vietare la vendita dei terreni ipotecati, oppure scriverlo grande nella proposta e far ripartire il conteggio. Decidere se l'ipoteca è solo di giorno.
- **Decisione:** NO.

### GIO-11 — Leggi del Sindaco: restano per sempre, si possono doppiare
- **Gravità:** MEDIA
- **Dove:** motore.js:3083-3092, 177, 627.
- **Come si vede (edge.js prove 6 e 9):**
  - "Condono edilizio: il prossimo livello costa la metà" resta attivo per sempre per tutti. Si può firmare due volte: `leggi: ['condono','condono']`.
  - Tassa sul lusso e Zona franca: anche loro per sempre e non si possono togliere.
  - Se si firma "Polizia raddoppiata" senza scegliere l'isola, si perde la legge del Ciclo (il Ciclo viene segnato prima dell'errore).
  - L'app non dice quali leggi sono attive.
- **Proposta (piccola):** ogni legge dura 2 Cicli (fino alle prossime elezioni), un elenco "Leggi in vigore" nell'app Municipio, nessun doppione, controllo dell'isola prima di segnare il Ciclo.
- **Decisione di Nicola: SÌ.**
  > "Le leggi del Sindaco oggi restano per sempre. Vuoi:
  > A) che durino fino alle prossime elezioni,
  > B) che durino 1 Ciclo,
  > C) che restino ma il nuovo Sindaco le possa cancellare?"

### GIO-12 — Errori che "mangiano" la finestra (partita da solo e bot sul server)
- **Gravità:** MEDIA
- **Dove:** motore.js:567-588 (`casinoReale` e `municipio` tolgono la finestra prima di controllare), locale.js:83-87 (`azione` non torna indietro dopo un errore), server/index.ts:78-85 (i bot dopo un errore continuano sullo stato già cambiato).
- **Come si vede (edge.js prove 7 e 8):**
  - Municipio, "Mi candido" con fama sotto 40: esce l'errore e la finestra sparisce (`pending: null`). Non puoi più scegliere "Licenza casinò".
  - Casinò Reale con puntata troppo alta: la finestra sparisce e perdi la giocata.
  - Online, per gli umani, il server non salva dopo un errore (va bene); nella prova da solo e per i bot invece sì.
- **Proposta (piccola):** prima i controlli, poi `s.pending = null`. In locale.js, copiare lo stato prima di applicare l'azione e tornare alla copia se c'è un errore. Nella finestra del Municipio, "Mi candido" disattivato se la fama è sotto 40, con scritto il perché.
- **Decisione:** NO.

### GIO-13 — Carta Gazzetta "Il tuo quartiere va di moda" premia sempre Isola Corona
- **Gravità:** BASSA-MEDIA (bug)
- **Dove:** motore.js:494: `const i = c.isola || "Corona"`. La casella Gazzetta non ha isola (`isola: null`), quindi vince sempre Corona.
- **Proposta (piccola):** usare `isolaDiPos(p.pos)`.
- **Decisione:** NO.

### GIO-14 — Il prezzo del cantiere nell'app non è quello che paghi
- **Gravità:** BASSA
- **Dove:** motore.js:628 (sconto 10% se costruisci sulla casella dove sei), 627 (condono). gioco.js:1693 (il costo mostrato non ha né lo sconto né il condono).
- **Come si vede:** edge.js prova 5: ho pagato 191.250 €, l'app mostrava un altro costo. Lo sconto del 10% "sono sulla mia casella" non è spiegato da nessuna parte: un giocatore non lo scoprirebbe mai.
- **Proposta (piccola):** l'app usa lo stesso calcolo del motore (esportare una funzione `costoCantiere`) e scrive "−10% perché sei qui".
- **Decisione:** NO.

### GIO-15 — Fine turno senza aver fatto la mossa: nessun avviso
- **Gravità:** BASSA
- **Dove:** gioco.js:924 e 1393.
- **Come si vede:** con "Hai un permesso pronto: puoi aprire un cantiere" (foto `c9_dopo_tiro`), "Fine turno" chiude subito e la mossa è persa.
- **Proposta (piccola):** sotto il tasto una riga "Non hai fatto la mossa di oggi" (senza bloccare). È chiarezza, non lo rende più facile.
- **Decisione:** NO.

### GIO-16 — Alzare un livello: l'app non dice quanto renderà
- **Gravità:** MEDIA (scelta informata)
- **Dove:** gioco.js:1700 (tasto "Apri il cantiere · costo").
- **Come si vede:** per aprire un'attività ci sono le schede con rendita, affitto e polizia (bene). Per alzare dal livello 1 al 2 c'è solo il costo. L'app Palazzo invece scrive "Rende +267.840 € a ogni Alba, si ripaga in circa 2 Cicli". Con 20 terreni, chi gioca non sa quale conviene alzare.
- **Proposta (piccola):** "Livello 2: rende +X a ogni Alba, si ripaga in Y Cicli" su ogni tasto, e in cima a Imprese un ordine "i migliori da alzare". Senza consigli se la partita è senza consigli: ci sono solo i numeri.
- **Decisione:** NO.

### GIO-17 — "Cantiere grande" (2-3 piani in una mossa) contro la decisione "un piano per mossa"
- **Gravità:** MEDIA (coerenza con le decisioni)
- **Dove:** motore.js:679 (`p.piani >= N.cantiereGrande ? 3 : 1`), app Palazzo ("Cantiere grande: +2 piani / +3 piani").
- **Come si vede:** STATO.md dice "Palazzo: un piano per mossa, prezzo che sale". Dall'Attico (6 piani) il codice permette 2 o 3 piani insieme, pagando il 50% e il 100% in più per il secondo e il terzo.
- **Decisione di Nicola: SÌ.**
  > "Avevi deciso 'un piano per mossa'. Oggi dall'Attico si possono fare 2 o 3 piani insieme pagando di più. Lo teniamo?
  > A) Sì, è una scelta in più.
  > B) No, sempre un piano per mossa."

### GIO-18 — Troppi messaggi automatici dalle caselle
- **Gravità:** BASSA-MEDIA
- **Dove:** motore.js:441-475 (Agenzia, Asta, Eliporto, Aeroporto, Borsa, Banca, Mercato Nero, Porto: ognuna manda un messaggio privato).
- **Come si vede:** foto `c9_telefono_home.png`: "Hai 50 messaggi nuovi" al Ciclo 10. I messaggi importanti (permesso negato, prestito) si perdono.
- **Proposta (piccola):** i messaggi delle caselle diventano un toast che sparisce, e il telefono tiene solo quelli che chiedono un'azione.
- **Decisione:** NO.

### GIO-19 — "Tu compra", "Tu riceve"
- **Gravità:** BASSA
- **Dove:** il nome di default della prova da solo è "Tu" e i log usano `p.nome + " compra"`.
- **Come si vede:** foto `t2_fine_0_3s.png`, riga in basso a sinistra: "Tu compra Sentiero delle Palme per 300.000 €".
- **Proposta (piccola):** nome di default "Giocatore", oppure i log del giocatore stesso alla seconda persona ("Compri…").
- **Decisione:** NO.

### GIO-20 — I bot non scambiano e non vanno oltre il livello 2
- **Gravità:** MEDIA (la prova da solo non insegna il gioco vero)
- **Dove:** bot.js. Non c'è mai un `proponi_lotto`; i bot accettano solo se il prezzo è almeno il valore x3 quando hanno il gruppo.
- **Proposta (media):** i bot cercano di completare i gruppi comprando o scambiando con gli altri (anche con l'umano, con una proposta che arriva come finestra).
- **Decisione:** NO.

### GIO-21 — La casella "Il Municipio" non c'entra coi permessi del Municipio
- **Gravità:** MEDIA (cose che non si capiscono)
- **Dove:** motore.js:474 (casella: solo candidatura e licenza), 2102 (permesso: si chiede dal telefono da ovunque, una volta per turno).
- **Come si vede:** tutti i testi dicono "permesso del Municipio". Un giocatore pensa di dover andare al Municipio, ma la casella non dà permessi.
- **Proposta (piccola, legata a GIO-04):** fermarsi o arrivare in taxi al Municipio dà un permesso sicuro per un terreno, a scelta. Così la casella diventa una meta strategica e il Viaggio rapido in taxi ha senso.
- **Decisione:** dentro GIO-04.

### GIO-22 — "Viaggio rapido" sempre visibile
- **Gravità:** BASSA
- **Dove:** motore.js:401 (il taxi per il Municipio è sempre nella lista), gioco.js:916.
- **Come si vede:** il tasto c'è a ogni turno di ogni giocatore, anche quando l'unica meta è il Municipio a 250.000 €. È rumore vicino a "Tira i dadi".
- **Proposta (piccola):** mostrarlo grande solo se c'è un mezzo; altrimenti un link piccolo "Taxi per il Municipio".
- **Decisione:** NO.

### GIO-23 — Il Sindaco pesa poco a fine partita
- **Gravità:** BASSA (dinamica)
- **Dove:** motore.js:3064-3098.
- **Come si vede:**
  - Lo stipendio del Sindaco è 750.000 € contro decine di milioni di rendite.
  - Le tasse (10-30%) colpiscono tutti allo stesso modo, Sindaco compreso: non sono un'arma.
  - Le elezioni si vincono soprattutto con la fama (fama x2, 1 punto ogni 100.000 € di campagna).
- **Proposta (media):** tasse per isola (il Sindaco può tassare l'isola di un rivale), leggi che toccano una persona o un'isola, stipendio in percentuale delle tasse incassate. Cose da discutere dopo GIO-11.
- **Decisione:** NO per ora.

### GIO-24 — Telefono 390x844: il 4° giocatore non si vede
- **Gravità:** BASSA (grafica)
- **Come si vede:** foto `tel_inizio.png`: nella barra in alto si vedono Nicola, Rocco e Vera; Dario è tagliato fuori. L'intestazione "Ciclo · Giorno" copre l'etichetta di una casella.
- **Proposta (piccola):** la barra dei giocatori scorre o diventa più piccola.
- **Decisione:** NO.

### GIO-25 — La Gazzetta del giorno non ha scena
- **Gravità:** MEDIA (Nicola vuole una "Gazzetta scenica")
- **Dove:** motore.js:482-505 (12 carte, tutte senza scelte), gioco.js:2099 (finestra con solo titolo e Ok).
- **Come si vede:**
  - Sul tabellone ci sono 10 caselle Gazzetta, quindi circa 1,5 carte a Ciclo a testa: in un'ora di gioco le 12 carte si ripetono.
  - "Controllo fiscale" e "Soffiata" non dicono se è successo qualcosa.
  - "Avanzi fino al Ponte Sud e incassi lo Stipendio" lo dice anche quando lo stipendio è bloccato.
- **Proposta (media):** 30-40 carte; una prima pagina con titolone e foto come la Gazzetta dell'Alba; metà carte con scelta; importi in percentuale; il risultato sempre scritto ("La Finanza non trova niente").
- **Decisione:** dentro GIO-02.

---

## Valutazione: il giorno è divertente e strategico?

- **Ciclo 1-4: sì, abbastanza.** Ogni turno ha una decisione: compro o lascio, quale terreno all'Agenzia, permesso e cantiere, quale attività aprire. Le schede delle attività sono chiare, con rendita, affitto e pallini della polizia: ben fatte. La busta all'assessore (permesso negato → paghi e lasci Tracce) è una bella scelta di rischio.
- **Ciclo 5-8: cala.** Le scelte diventano "quale lotto alzare", ma senza i numeri del guadagno (GIO-16). I permessi a caso fanno perdere turni senza una scelta (55% sì): è frustrazione, non strategia.
- **Ciclo 8 in poi: è una routine.** I terreni sono finiti, gli affitti e la Gazzetta non pesano, i livelli 3-5 non si raggiungono e il turno è "tira → piano → fine". Il giorno diventa un'attesa della notte.
- **Durata del turno:**
  - tiro e cammino della mia pedina: circa 5 secondi;
  - i 3 bot: 8-14 secondi, più un Ok per ogni asta;
  - clic per un turno con cantiere: Tira, (Compro), Le mie imprese, Chiedi permesso, Apri attività, chiudi telefono, Fine turno = 6-7 clic. È accettabile; con "Permesso e cantiere" in un tasto solo diventano 4.

**Proposte di dinamica in ordine di effetto:**
1. affitti legati alla rendita (GIO-02);
2. livello 3 con 2 vie su 3 o scambi coi bot (GIO-01);
3. Municipio = permesso sicuro (GIO-21/04);
4. patrimonio che conta piani e livelli al 75% (GIO-04);
5. Gazzetta con scelte in percentuale (GIO-25);
6. eventi di giornata per isola, così conta dove costruisci.

Nessuna di queste rende il gioco più facile: danno più decisioni e più rischio.

## Cose che funzionano bene (da non rompere)
- Tre dadi, tris che fa ritirare una volta sola (anche dopo il Faro): giusto.
- "Mentre aspettavi +16.500 € (dettagli nell'app Banca)": ottimo.
- Le schede delle attività quando ne apri una (rendita, affitto, polizia, vantaggio, rischio).
- L'app Palazzo: chiarissima ("costa X, rende Y, si ripaga in Z Cicli", prossimo traguardo).
- Il suggerimento "Rivali: Rocco ha 2 vie su 3 del gruppo Platino: se compri Piazza dei Re lo blocchi".
- Nei casi limite i soldi non vanno mai sotto zero.
- Nessun errore e nessun blocco in 40 partite simulate.

## Foto utili (/home/claude/prove/giorno/)
- `t2_fine_0_3s.png`, `t2_fine_1_8s.png`: GIO-03 (dadi del bot con "Tocca a te" e i soldi che volano ancora).
- `t0_scelta0.png`: finestra di acquisto (testo "affitti raddoppiano").
- `c5_imprese.png`: elenco Imprese lungo, "Chiedi il permesso" su tutti i terreni, livello nuovo sopra il telefono.
- `c9_palazzo.png`, `c9_telefono_home.png`: Palazzo e 50 messaggi.
- `tel_inizio.png`, `tel_dopo_tiro.png`: telefono 390x844.
