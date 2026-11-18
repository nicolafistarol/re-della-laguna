# Rapporto settore CHIAREZZA — Re della Laguna (v65)

Critico: chiarezza per un giocatore nuovo (es. la sorella di Nicola).
Come ho provato: partita "Prova da solo" nel browser (PC 1280x800 e telefono 390x844), con clic veri su slide, storie, dadi, compra, Imprese, permesso, notte. Per le fasi avanzate ho fatto giocare il mio giocatore a un bot in Node (motore.js + bot.js) e ho caricato la partita nel browser (Ciclo 1, 2, 4, 7, 10 e due notti), aprendo il telefono e TUTTE le app. Ho letto i testi in gioco.js e li ho confrontati con le regole vere in motore.js.
Foto: /home/claude/prove/chiarezza/ (elenco in fondo). Strumenti: foto2.js (più foto per passo), gen.js (crea partite avanzate), carica.sh.
Nota: Chrome di prova usa WebGL software, quindi le animazioni sono molto più lente che sul Mac di Nicola. I tempi li segnalo solo come indizio.

---

## LE 5 COSE PIÙ IMPORTANTI

1. **La guida dice regole sbagliate (CH-02).** Le slide e le finestre spiegano 6 regole in modo diverso da come funziona davvero il gioco: permesso, gruppi di vie, moli, viaggio rapido, "poker", anni di cella. Chi impara dalle slide sbaglia e pensa che il gioco abbia un difetto.
2. **"Vera" sono due persone diverse (CH-01).** Nella prova da solo Vera è un'avversaria al tavolo e ANCHE la consigliera che ti scrive. Nel telefono i messaggi finiscono nella stessa chat. Una principiante non capisce chi è chi.
3. **Troppe cose subito (CH-03, CH-04).** Prima di giocare: 6 slide, 719 parole, 49 parole-chiave, tanti numeri. Poi il telefono ha già **13 app al Livello 0**: non è vero che "le app arrivano piano piano". La partita guidata non cambia quali app vedi.
4. **Sul telefono le cose si coprono (CH-16).** A 390 px il quarto giocatore (Dario) non si vede. Ciclo, Legenda e soldi sono uno sopra l'altro. La Legenda e "Cosa ho" finiscono sotto la carta del turno. Sul PC le etichette del tabellone si accavallano, i nomi delle isole sono tagliati e il testo 3D della Legenda è rotto.
5. **Informazioni importanti nascoste o sbagliate nei momenti chiave (CH-05, CH-17).** Quando sali di livello, la finestra mostra il messaggio sbagliato di Vera (es. "Club Neon: qualcuno ha notato la tua faccia"). Il terreno avuto a sorte, con l'attività già aperta, lo dice solo un messaggio nel telefono. Lo stipendio di 600.000 € non lo spiega nessuno. Si può fare un affare con un altro giocatore toccando il suo nome, ma lo dice solo un suggerimento che compare col mouse (sul telefono non c'è).

Decisioni di Nicola che servono: **7** (CH-01, CH-02b, CH-03, CH-04, CH-06, CH-07b, CH-26).

---

## PROBLEMI (in ordine di gravità)

### CH-01 — Due "Vera": la consigliera e l'avversaria
- **Gravità:** ALTA
- **Dove:** locale.js:39 (avversari "Rocco, Vera, Dario"); motore.js (20 messaggi "Vera: …"); gioco.js:1448 (MITTENTI /^Vera:/), gioco.js:1468 conversazioni() (le chat si raggruppano per nome), Rubrica ("Vera — La tua consigliera"), esempio della Banca gioco.js:2654 ("Vera ha un grosso debito…").
- **Come si vede:** nella prova da solo l'avversaria Vera compra terreni e ti fa pagare l'affitto. Intanto un'altra "Vera" ti scrive "Hai visto? Rocco ha comprato…". Nella Gazzetta "1. Vera · Ricco · fama 19" è l'avversaria; nella Rubrica Vera è "la tua consigliera". Tutte e due finiscono nella chat "Vera". La spunta all'avvio dice "Partita guidata: Vera ti dà consigli", proprio sotto "Tu contro Rocco, Vera e Dario".
- **Proposta:** cambiare il nome della consigliera (oppure quello del bot). Cambiare anche l'esempio nell'app Banca. Lavoro piccolo: costante nome + testi.
- **Decisione di Nicola:** SÌ. "La consigliera e una delle avversarie si chiamano tutte e due Vera. Cosa preferisci? (a) La consigliera cambia nome (es. Bianca, la tua segretaria); (b) l'avversaria cambia nome (es. Greta); (c) la consigliera diventa 'Il tuo avvocato' senza nome."

### CH-02 — Slide e finestre spiegano regole diverse da quelle vere
- **Gravità:** ALTA
- **Dove e prova (testo ↔ motore):**
  - **a) Permesso.** Slide 2 (gioco.js:2524): "Ogni giorno hai 1 mossa: permesso del Municipio → cantiere". Carta del turno (gioco.js:923): "Oggi puoi fare una mossa: chiedere un permesso…". **Nel motore** (motore.js:2102-2120) il permesso NON usa la mossa: lo chiedi e poi apri anche il cantiere nello stesso turno (i bot lo fanno: "Rocco ottiene il permesso… Rocco apre il cantiere" nello stesso turno). Inoltre il permesso **non è sicuro**: 55% sì, 30% rimandato, 15% negato. E ne serve uno nuovo per ogni livello. Nella partita guidata il primo è sempre sì, quindi la principiante impara "è sicuro" e poi si sorprende. Nel Ciclo 7 di prova: 12 messaggi "pratica rimandata".
  - **b) Gruppi di vie.** Slide 2 (2526), finestra Compro (gruppo(), gioco.js:714) e glossario (1903) dicono "se le hai tutte, gli affitti raddoppiano". **Nel motore** (motore.js:234-236) il doppio vale SOLO per i terreni vuoti. Con un'attività aperta il gruppo completo non raddoppia niente: serve solo per i livelli 3-5.
  - **c) Moli.** Slide 2 (2528), "Cosa ho" (691) e Il mio impero (1831, "Terreno: chi ci passa paga un piccolo pedaggio") dicono "chi ci passa paga". **Nel motore** (atterra, motore.js:441) paga solo chi si ferma lì. E un terreno vuoto fa pagare l'affitto (15%), non un "pedaggio".
  - **d) Viaggio rapido.** Slide 2: "una volta per Ciclo vai dove vuoi invece dei dadi". **Nel motore** (destinazioniRapide, motore.js:389) all'inizio puoi solo prendere il taxi per il Municipio (250.000 €) o il traghetto da un Molo. Il resto si apre coi mezzi (foto v02_rapido.png).
  - **e) "Poker".** Slide 4 (2545), stanza Casinò privato (motore.js:651), invito (motore.js:1496): "serate di poker". **Il gioco vero è Sette e mezzo** (apriManoSM tipo "serata", motore.js:1546; tavoloSM).
  - **f) Cella al Faro.** Il riquadro del rischio (testoPena, gioco.js:2206) dice "2 Cicli in cella al Faro". **Nel motore** i numeri sono turni (p.faro = turni, motore.js:2891; la sentenza dice "2 turni al Faro"). Quindi il rischio sembra 4 volte più grave di quello che è, e Nicola vuole il rischio sempre chiaro.
  - **g) Glossario** (1903): "Ogni isola ha 2 gruppi di vie". Ne ha 4 (es. Ambra: Spezie, Lanterne, Terracotta, Salina).
  - **h) Livello 2** (SBLOCCHI 1897 e messaggio di Vera): dice "di notte anche la Redazione". Si apre anche l'**Aeroporto** (LUOGHI, motore.js:1165), come dice la slide 4.
  - **i) Storie.** L'Investitore ("le tue azioni ti pagano il 4%") e lo Speculatore (cripto) dipendono da Borsa e cripto, che si vedono solo dal Livello 2 (7 M). La scheda non lo dice. Il Playboy: "e gli amici dello yacht" non vuol dire niente di preciso.
  - **j) Partita guidata.** La spunta dice "le cose si scoprono piano piano". Nel codice la partita guidata cambia solo: consigli, primo permesso sicuro, niente affari illegali nel Ciclo 1 (motore.js:1014). Le app si aprono allo stesso modo anche senza consigli. Che nel Ciclo 1 non ci sono affari illegali non è scritto da nessuna parte prima di giocare.
- **Proposta:** correggere i testi perché dicano la regola vera (lavoro piccolo, solo testi). Testi pronti nella sezione "Testi riscritti". Per (b) però serve una scelta di Nicola: correggere il testo o cambiare la regola.
- **Decisione di Nicola:** SÌ, solo per (b). "Con tutte le vie di un gruppo, oggi raddoppia solo l'affitto dei terreni vuoti. Cosa vuoi? (a) Lasciamo la regola e correggiamo il testo; (b) raddoppiano anche gli affitti delle attività (il gioco cambia molto); (c) con il gruppo completo le attività prendono +50%."

### CH-03 — Le app non arrivano "piano piano": 13 app subito
- **Gravità:** ALTA
- **Dove:** gioco.js:1425-1445 (APPS: 13 app con lv 0), GRUPPI_APP 1550, appVisibile 1477.
- **Come si vede:** al primo turno il telefono ha Il mio impero, I miei conti, Da scoprire, Imprese, Agenzia, Banca, Gazzetta, Messaggi, Valigetta, Palazzo, Lusso, Rubrica, Municipio (c3_tel_home.png). Al Livello 1 sono 15, al Livello 2 sono 17. Valigetta, Palazzo (servono 2 attività), Lusso (servono milioni) e Municipio non servono nei primi Cicli. "I miei conti" e "Da scoprire" restano "NUOVA" per sempre finché non le apri (APP_SEMPRE 1553). Questo va contro la decisione di Nicola: "App del telefono sbloccate man mano, chiare".
- **Proposta:** le app si aprono **quando servono**, non a livello. Elenco nella sezione "Percorso di scoperta". Ogni volta una piccola finestra "Nuova app: X — a cosa serve — prova adesso" con un tasto Apri. Nella partita senza consigli si possono vedere tutte subito. Lavoro medio (regole in appVisibile + finestra).
- **Decisione di Nicola:** SÌ. "Quante app vuoi sul telefono al primo turno? (a) 5 (Imprese, Agenzia, Messaggi, Gazzetta, Il mio impero) e le altre arrivano quando servono; (b) come oggi, a livelli; (c) 5 nella partita guidata, tutte in quella senza consigli."

### CH-04 — 6 slide lunghe prima di giocare
- **Gravità:** ALTA
- **Dove:** gioco.js:2512-2565 (datiGuida). Si aprono da sole sopra la schermata d'inizio (221, 279).
- **Come si vede:** 6 slide, **719 parole** (135, 120, 105, 109, 112, 138), 49 etichette. Ci sono tanti numeri tutti insieme (3,5/7/15/40 M; 6-20 Cicli; 50/100/200 M; 15/25/30%; 8 M e 5 M; 22 cose). Molte parole compaiono prima di essere spiegate: "Tracce" (nelle storie) non è nelle slide; "fama", "valigetta", "Resa dei conti", "piste", "Influenza". La slide 6 ha 8 punti ("Tutto il resto"). Sul telefono ogni slide va fatta scorrere (tel_slide1.png). Una principiante legge la prima e chiude.
- **Proposta:** prima di giocare **una sola carta** (3 frasi + "Giochiamo"). Le 6 slide restano nel tasto Guida, ma arrivano **a pezzi quando servono**: la slide "Notte" quando cala la prima notte, "Soldi sporchi" al Livello 1, "Palazzo" quando hai 2 attività, "Potere" al Livello 2. Testi brevi pronti più sotto. Lavoro medio.
- **Decisione di Nicola:** SÌ. "Prima di giocare vuoi (a) una sola carta corta e il resto della guida durante il gioco; (b) le 6 slide come oggi, ma più corte; (c) un video/animazione di 30 secondi?"

### CH-05 — La finestra "Sei salito di livello" mostra il messaggio sbagliato
- **Gravità:** ALTA (è un errore, facile da correggere)
- **Dove:** gioco.js:2064 (`const vera = …filter(startsWith("Vera:")).slice(-1)`).
- **Come si vede:** foto tc3_01_alba.png. Titolo "Livello 1", testo "Club Neon: qualcuno ha notato la tua faccia. Se ci torni stanotte, ti riconoscono più facilmente." Il messaggio giusto ("Sei diventato qualcuno… si aprono il Mercato Nero, la Bisca, il Porto e il Casinò Reale…") è più indietro. La finestra prende l'ultimo messaggio di Vera, qualunque sia.
- **Proposta:** usare il testo del livello (VERA[livello] in motore, oppure SBLOCCHI[livello]) e non l'ultimo messaggio. Aggiungere sotto "Di notte si aprono: …" e le app nuove con il tasto "Apri". Lavoro piccolo.
- **Decisione:** NO.

### CH-16 — Cose che si coprono a schermo
- **Gravità:** ALTA sul telefono, MEDIA sul PC
- **Telefono 390x844:**
  - La fila dei giocatori esce dallo schermo: **Dario non si vede** (tel_dopo_storia.png, tc3_02_giorno.png).
  - Legenda/Cosa ho, la barra "Ciclo 4 di 12…" e il pannello dei soldi sono uno sopra l'altro e coprono metà del tabellone. I tasti della vista (Segui/Libera/Alto/+/−) coprono il lato destro.
  - I pannelli **Legenda** e **Cosa ho** finiscono sotto la carta del turno: il testo si taglia (tc3_07_legenda.png, tc3_08_cosaho.png).
  - Alba: il tasto "Inizia il giorno" è fuori schermo e bisogna scorrere (tc3_02, foto prima della chiusura).
  - Schermata d'inizio: la tendina "Dopo un numero di Cicli" esce dal riquadro (tel_start.png).
  - Toast e cartellino dei soldi ("la Banca → Tu 600.000 € Stipendio") uno sopra l'altro in alto (tc3_09_dopotiro.png).
- **PC 1280x800:**
  - Etichette del tabellone accavallate: "Scalinata dei Gatti" scritta due volte, "Ponte Sud — Partenza" doppio, cartelli "vuoto" sovrapposti, i grandi cartelli dei gruppi ("Perla 3 vie" e "Velluto") uno dentro l'altro e tagliati dalla barra in alto (c6_app_contratti.png, v05_imprese.png).
  - Il nome dell'isola in grande ("Borgo Ambra", "Gala Flamingo") è tagliato dietro i pannelli in alto (v06, c6).
  - Il registro in basso a sinistra copre le icone del tabellone (v06_dopo_permesso.png).
  - Il telefono aperto copre il lato destro della carta del turno ("Fine turno" coperto a metà).
  - **Legenda:** il paragrafo "Nel mondo 3D" va a capo in una colonna strettissima (pc_legenda.png). È un errore di impaginazione: `<b>` e testo dentro un contenitore flex.
  - **Notte:** la scritta "Trascina per guardarti intorno" copre le etichette dei punti da toccare. Alcuni punti stanno sotto i pannelli di testo ("Il divano", "Il registro delle navi") o sopra il titolo del luogo (n00_n02_scena.png, n4_06.png).
- **Proposta:** sul telefono una sola barra in alto (giocatori come pallini piccoli che scorrono, Ciclo e soldi su una riga). Legenda e Cosa ho come foglio che sale dal basso, sopra la carta del turno. I tasti della vista dentro un solo tasto "Vista". Sul PC: un'etichetta per casella, e solo per le caselle vicine. Lavoro medio-grande (si incrocia col settore 3D/estetica).
- **Decisione:** NO.

### CH-17 — Informazioni importanti nascoste
- **Gravità:** ALTA (le prime due), MEDIA (le altre)
- **Dove e prova:**
  - **Terreno a sorte.** Dopo la scelta della storia i soldi salgono da 1.500.000 a 1.790.000 € senza spiegazione (pc_g02_turno.png). Cosa ti è toccato lo dice solo un messaggio nel telefono: "Ti tocca in sorte Belvedere delle Palme (Costa Palma), con un ristorante già aperto, più 290.000 €…". La slide dice "un terreno a sorte", non "un'attività già aperta".
  - **Stipendio 600.000 € al Ponte Sud**: non è in nessuna slide. Si vede solo volare la moneta.
  - **Affari con un rivale toccando il suo nome** (gioco.js:567): lo dice solo il suggerimento che compare col mouse ("title"). Sul telefono non esiste.
  - **3 dadi; con tre numeri uguali si ritira** (motore.js:380): mai detto. Il registro dice "Rocco tira 5 e 2 e 1".
  - **+1 fama a ogni cosa scoperta**: la fama sale (10 → 11) senza un avviso a schermo. L'avviso finisce in "Notifiche".
  - **Il livello sale solo quando cala la notte** (motore.js:1297). In "Il mio impero" vedi un patrimonio di 16,9 M e il Livello 3 (15 M) non è spuntato (c6_impero.png).
  - Livello 5 di un'attività: serve fama 50. Costruire sulla casella dove sei costa il 10% in meno. Nessuna delle due cose è scritta.
  - **La riga sotto la fama "Nessuno parla di te."** riguarda la polizia, ma non lo dice. "Benestante/Ricco/Milionario" sotto ogni nome non sono spiegati.
- **Proposta:** dopo la scelta della storia una finestra "Ti è toccato: Belvedere delle Palme, Costa Palma — Ristorante già aperto, rende 294.500 € a ogni Alba. + 290.000 € per pareggiare" con il tasto "Fammelo vedere" (porta la vista lì). Stipendio in una riga della slide 1. Sotto i nomi dei rivali un piccolo "Affari ›" visibile anche sul telefono. "Polizia: tranquilla" al posto di "Nessuno parla di te.". In Il mio impero: "Il livello si controlla quando cala la notte. Ti mancano X €". Lavoro piccolo-medio.
- **Decisione:** NO.

### CH-06 — "Livello" vuol dire quattro cose diverse
- **Gravità:** MEDIA
- **Dove:** Livello del giocatore 0-4 (SBLOCCHI); livello dell'attività 1-5 ("Livello 4 · Lusso", "Livello 5 · Icona", gioco.js:1831ss); livello della setta (Influenza 12/35/70); "sale" più lussuose dei luoghi. In più "Lusso" è sia un livello dell'attività sia un tipo di attività sia un'app.
- **Come si vede:** nella Rubrica il Giudice "solo una setta di livello 2… Lo incontri dal Livello 3": tre livelli in due righe. "Livello 4" vuol dire sia "40 milioni" sia "attività di lusso".
- **Proposta:** il Livello resta solo per il giocatore. Le attività usano le **stelle** (★1-★5; "Icona" = 5 stelle). La setta usa il **Grado** (Grado 1-4). Lavoro piccolo-medio (testi).
- **Decisione di Nicola:** SÌ. "Per non confondere, vuoi (a) Livello solo per te, stelle per le attività, Grado per la setta; (b) lasciare tutto 'livello'; (c) altri nomi che preferisci?"

### CH-07 — Gazzetta: si apre vuota, e "Gazzetta" è anche una casella-imprevisto
- **Gravità:** MEDIA
- **Dove:** appGazzetta gioco.js:1523, primaPagina 1502 (scelgo il Ciclo più recente, che di giorno è ancora vuoto); casella "Gazzetta" in OUTER (motore.js:120ss); finestra con l'etichetta "Gazzetta" in finestreAutomatiche (2101).
- **Come si vede:** apri la Gazzetta di giorno e leggi "Ciclo 4 — Niente di nuovo, per ora. Ma la notte è lunga." (c3_app_gazzetta.png, c6_app_gazzetta.png). Per leggere le notizie devi premere "‹ Ciclo prima". Intanto sul tabellone "Sara pesca una Gazzetta: Un vecchio debito ti viene restituito" (tc3_09): la stessa parola indica il giornale e le carte degli imprevisti. Nella finestra dell'Alba "La Gazzetta parla di te" mostra solo righe come "Sara compra Viale Neon".
- **Proposta:** aprire sempre l'ultima edizione con delle notizie. Come titolone usare la notizia più grossa, non gli acquisti. **b)** Dare un altro nome alle caselle (es. "Imprevisto" o "Voci di piazza").
- **Decisione di Nicola:** SÌ per (b). "Le caselle 'Gazzetta' sul tabellone sono come gli Imprevisti del Monopoly, ma hanno lo stesso nome del giornale. Le chiamiamo (a) Imprevisto; (b) Voci di piazza; (c) restano Gazzetta?"

### CH-08 — Parole diverse per la stessa cosa
- **Gravità:** MEDIA
- **Dove e prova:**
  - "mossa" (slide, carta del turno) ↔ "Azione del giorno" (errore motore.js:601; messaggio "puoi chiedere un prestito con l'Azione del giorno").
  - "storia" (finestra, slide) ↔ "pacchetto" (registro: "Dario sceglie il pacchetto Il Costruttore").
  - "gruppo di vie" ↔ "serie" (errori motore.js:621-623 "serve la serie completa"; "La banca privata richiede la serie completa").
  - "Municipio" ↔ "Comune" (Palazzo: "Permesso del Comune"; "Asta del Comune").
  - "a ogni Alba" ↔ "a Ciclo" (Imprese: "rende 294.500 € a Ciclo"; Il mio impero: "rendita a Ciclo").
  - "Tracce" ↔ "piste" ↔ "tracce" minuscolo (riquadroEsito "nessuna traccia").
  - "Il Faro" = prigione, = luogo della notte (Livello 3), = angolo del tabellone "Ponte Ovest — Il Faro", = covo della setta.
  - "Sindaco: nessuno" nell'app Municipio (1758) ↔ "Sindaco Albertini" nella casella del telefono (1578) e nella Rubrica.
- **Proposta:** una tabella di parole fisse (vedi "Glossario unico") e un giro di sostituzioni. Lavoro piccolo.
- **Decisione:** NO (tranne il Faro, che sta già dentro CH-06/CH-07 se Nicola vuole).

### CH-10 — Durante le animazioni la carta in basso è vecchia o vuota
- **Gravità:** MEDIA
- **Dove:** disegna() gioco.js:584 (`animando ? "…"`); riceviVista/eseguiCoda 387-426 (lo stato S si aggiorna solo alla fine delle animazioni).
- **Come si vede:** dopo aver scelto la storia, la carta continua a dire "Scegli come iniziare — Vedi le storie di partenza" mentre i bot tirano i dadi (pc_g01d.png). Nel mio Chrome lento è durato 93 secondi; sul Mac saranno alcuni secondi, ma il tasto resta lì e si può premere. Durante altre animazioni la carta mostra solo "…" (tc3_09_dopotiro.png).
- **Proposta:** durante le animazioni scrivere chi sta facendo cosa ("Rocco tira i dadi…", "Vera compra Corte dei Mosaici") e togliere i tasti vecchi. Lavoro piccolo.
- **Decisione:** NO.

### CH-11 — Numeri del telefono che non tornano
- **Gravità:** MEDIA
- **Dove:** statoApp "borsa" gioco.js:1565 usa valoreInvestimenti (motore.js), che conta anche i mezzi e le quote TV/Banca.
- **Come si vede:** al Ciclo 7 la casella Borsa dice "1,6 mln investiti", ma dentro l'app ogni azione e ogni cripto dice "Ne hai per 0 €" (c6_tel_home.png, c6_app_borsa.png). Quell'1,6 mln è lo yacht (2 M × 0,8).
- **Proposta:** nella casella contare solo azioni e cripto. Lavoro piccolo.
- **Decisione:** NO.

### CH-13 — Elenco "Cosa si apre, e quando": numeri sbagliati
- **Gravità:** BASSA
- **Dove:** gioco.js:1938 (`S.sblocco >= i ? "✓" : i + 1`).
- **Come si vede:** il Livello 3 ancora chiuso ha il numero "4" e il Livello 4 ha "5" (c6_impero.png).
- **Proposta:** mostrare `i` (oppure un lucchetto). Lavoro piccolo.
- **Decisione:** NO.

### CH-14 — Troppi messaggi, mescolati
- **Gravità:** MEDIA
- **Dove:** privato() in motore.js; conversazioni() gioco.js:1468.
- **Come si vede:** nella partita di prova arrivano circa 5 messaggi a Ciclo (48 al Ciclo 10). Al Ciclo 7 il pallino segna **31 non letti**. Cose gravi (convocazione del Giudice, sentenza, appuntamenti della notte) sono mescolate a cose senza importanza ("pratica rimandata" 12 volte, "Nuova scoperta (+1 fama)"). Esistono le chat "Notifiche" e "Un amico fidato", e anche "Municipio" in cui il testo inizia minuscolo ("la tua pratica…") perché il prefisso viene tolto.
- **Proposta:** tre livelli. **Urgente** = finestra (Giudice, sentenza, inviti, appuntamenti). **Utile** = messaggio. **Cronaca** = solo toast/registro (pratica rimandata, scoperte). Il pallino rosso conta solo urgenti e utili. Lavoro medio.
- **Decisione:** NO.

### CH-15 — La notte: pulsanti e testi che non corrispondono
- **Gravità:** MEDIA
- **Dove e prova:**
  - Finestra iniziale (gioco.js:2081): "Ogni ora scegli una cosa, poi premi **Avanti**". Il tasto Avanti non c'è finché non scegli. Il pulsante della finestra si chiama "Esco": sembra "esco di casa", invece chiude la finestra (n00_n01.png).
  - Al tuo Palazzo c'è "Torna a casa": vuol dire "finisco la notte", ma tu sei già a casa.
  - Al Livello 0 i soli posti (Club, Marina) sono a 2 ore: due "Avanti" senza fare niente (n00_n04_viaggio.png).
  - "A Club Neon incroci Rocco e Dario" ma sopra i loro nomi c'è scritto "a casa", e non compare il tasto per parlarci (n00_n06_club.png).
  - Appuntamento impossibile ancora proposto: al Porto alle 00:00 "Bisca del Vicolo, entro le 01:00. Ci vogliono 2 ore. [Vai]" (n4_03_porto.png; gioco.js:1385).
  - "Parla con i gruisti" → "stanotte non arriva più niente" (un'ora persa), e poi te lo propone di nuovo (n4_05/n4_06).
  - Nella partita da solo la barra del tempo dice "Tempo finito: chi non ha scelto resta dov'è", ma lì il tempo non conta.
  - "Dove vai?" mostra solo i posti aperti. Quelli chiusi non si vedono, quindi la principiante non sa che esistono (n00_n03_dovevai.png).
- **Proposta:** finestra iniziale "Ogni ora: tocca un posto o una cosa da fare. Quando hai scelto, premi Avanti." con il pulsante "Ho capito". Al Palazzo il tasto diventa "Vado a dormire (fine notte)". Togliere gli appuntamenti impossibili. Mostrare i giocatori presenti solo se ci sono ancora. Posti chiusi in grigio con "dal Livello 1". Nella partita da solo niente barra del tempo. Lavoro piccolo-medio.
- **Decisione:** NO.

### CH-18 — App vuote o con poche spiegazioni
- **Gravità:** MEDIA
- **Come si vede:**
  - **Contratti:** solo il tasto "Proponi un patto", nessuna spiegazione (c6_app_contratti.png).
  - **Prove:** "Nessuna prova. Una macchina fotografica aiuta." App inutile finché non hai prove.
  - **Borsa:** nessuna riga che spieghi le azioni (le cripto invece ce l'hanno). Non si vede se un'azione è salita o scesa.
  - **Da scoprire:** 22 righe, quasi tutte intitolate "Da scoprire" con un indovinello ("I dadi non sono l'unico modo per muoversi."), senza dire dove andare (c3_app_scoperte.png).
  - **Valigetta** al Livello 0: quattro "Posto libero" e niente su dove comprare.
  - **Lusso:** "I mezzi si comprano con la mossa del giorno." e basta.
- **Proposta:** ogni app ha in cima 1 riga "A cosa serve" e 1 riga "Prova:" con un tasto. Prove compare alla prima prova. Da scoprire mostra il nome della cosa + "→ app X". Lavoro piccolo-medio.
- **Decisione:** NO.

### CH-19 — Agenzia: "quando vuoi" o "prima tira i dadi"?
- **Gravità:** BASSA
- **Dove:** Vera/scoperte ("compri un terreno libero dell'isola dove sei, quando vuoi") ↔ app Agenzia ("Prima tira i dadi: l'Agenzia vende sull'isola dove arrivi").
- **Proposta:** "Dopo aver tirato i dadi, compri un terreno libero dell'isola dove sei (+20%)."
- **Decisione:** NO.

### CH-20 — L'ora del telefono non segue i giorni
- **Gravità:** BASSA
- **Dove:** disegnaTelefono gioco.js:1624 (`["9:00","13:00","18:00"][S.giorno]`).
- **Come si vede:** un Ciclo ha 4 giorni ma ci sono solo 3 orari, quindi il giorno 4 torna alle 9:00. Il gioco chiama "giorno" quello che il telefono tratta come un'ora.
- **Proposta:** in alto nel telefono scrivere "Giorno 2/4".
- **Decisione:** NO.

### CH-21 — Finestra dell'Alba lunga e poco chiara
- **Gravità:** MEDIA (sul telefono)
- **Come si vede:** sul telefono il tasto "Inizia il giorno" è sotto, bisogna scorrere. "I fatti della notte" ha righe troppo corte ("00:00 Il VIP ubriaco: accetti."). "La Gazzetta parla di te" elenca solo i tuoi acquisti.
- **Proposta:** il tasto "Inizia il giorno" sempre fisso in basso. Tre righe grandi (Hai incassato / Polizia / La notizia del giorno), il resto chiuso sotto "Dettagli". Lavoro piccolo.
- **Decisione:** NO.

### CH-22 — La Rubrica dice nomi di pulsanti che non ci sono
- **Gravità:** BASSA
- **Dove:** Rubrica: "Di notte al Mercato Nero: tocca la bancarella". Il pulsante vero si chiama "Guarda la merce". Giudice: "setta di livello 2" e "Lo incontri dal Livello 3" nella stessa scheda.
- **Proposta:** usare gli stessi nomi dei pulsanti.
- **Decisione:** NO.

### CH-23 — Finestra "Compro": mancano le cose per decidere
- **Gravità:** BASSA-MEDIA
- **Come si vede:** prezzo e gruppo ci sono. Mancano: quanto rende un'attività lì, quanto paga chi si ferma, e che all'asta puoi offrire anche tu ("Se non lo compri, va all'asta tra tutti").
- **Proposta:** aggiungere "Con un ristorante renderebbe circa X € a ogni Alba" e "Se lo lasci, va all'asta: puoi offrire anche tu (anche meno)". Lavoro piccolo.
- **Decisione:** NO.

### CH-25 — Il tasto "Viaggio rapido" al primo turno è una trappola
- **Gravità:** BASSA
- **Come si vede:** compare al primo tiro. Dentro c'è solo "Taxi per il Municipio 250.000 €" (v02_rapido.png). Una principiante lo prova e spende il 17% dei soldi.
- **Proposta:** mostrarlo solo quando c'è almeno una meta gratis, o quando sei su un Molo. Oppure scrivere sotto "taxi 250.000 €".
- **Decisione:** NO.

### CH-26 — "Tracce": il gioco le cita con i numeri ma non si vedono
- **Gravità:** MEDIA
- **Dove:** glossario 1904 ("Non le vedi"); storie ("30% di Tracce in meno"); riquadro del rischio ("Lascia circa 7 Tracce"); messaggi ("+8 Tracce", "+15 Tracce"); TV ("+12 Tracce").
- **Come si vede:** la principiante legge "+15 Tracce" ma non sa se sono tante. Nella slide 5 la parola "Tracce" non compare (si parla di "piste").
- **Proposta:** nell'app Soldi sporchi un indicatore a 5 tacche ("Tracce: poche / medie / tante"), senza il numero esatto. Nei testi parole al posto dei numeri ("lascia parecchie Tracce"). Nella slide 5: "Ogni affare sporco lascia Tracce. Più Tracce, più la polizia ti cerca."
- **Decisione di Nicola:** SÌ. "Le Tracce (quanto la polizia sa di te) oggi non si vedono. Vuoi (a) una barra a 5 tacche senza numero; (b) restano nascoste ma togliamo i numeri dai testi; (c) il numero esatto?"

### CH-09 — Errori di italiano
- **Gravità:** BASSA (tanti, ma tutti piccoli)
- **Elenco:**
  - Nome predefinito "Tu" (gioco.js:208) → "Tu (tu)", "Tu sceglie il pacchetto", "Tu riceve…", "Tu compra…" (pc_g02_turno.png). Proposta: nome predefinito "Giocatore" oppure obbligare a scriverlo.
  - Banca: "Agenzia: Viale Neon **a la Banca**", "Asta vinta: … a la Banca" (gioco.js:1711, nomeDi → "la Banca"). Deve essere "alla Banca".
  - "Ci vogliono **1 ora**" (1385) → "Ci vuole 1 ora".
  - "POLIZIA **TRANQUILLO / PERICOLOSO**" (scena della notte) → "polizia tranquilla / agitata / pericolosa".
  - Cartelli 3D "tue **1 vie** su 3" (tre.js:376) → "1 via su 3 è tua".
  - "entrate bloccate per **1 Cicli**" (sentenza, motore) → "1 Ciclo".
  - Articoli: "Vieni **a Porto** Container", "**a Aeroporto** della Laguna", "Arrivi a Porto Container", "**A Club** Neon incroci" → "al Porto", "all'Aeroporto", "Al Club Neon".
  - "Anche tu puoi: **Dall'app**…" (maiuscola dopo i due punti).
  - Chat Municipio: "la tua pratica…" (minuscola dopo aver tolto il prefisso).
  - "Cala la **Notte** sul Ciclo 1" (maiuscola), registro.
  - Molo: il registro dice "paga X di **affitto**" anche per il pedaggio del molo.
  - Messaggio Attico di Vera senza virgolette, gli altri con le virgolette.
- **Proposta:** un giro di correzioni (1-2 ore).
- **Decisione:** NO.

### CH-12 / CH-24 — Piccole cose
- **Sindaco nessuno/Albertini:** vedi CH-08. BASSA.
- **cartaNotte (gioco.js:926):** è codice vecchio che non si usa più, con nomi di pulsanti diversi ("Parla con la polizia"). Non si vede, ma chi corregge i testi può sbagliare e modificare quello. Toglierlo. BASSA.

---

## SCHERMATA PER SCHERMATA: cosa capisce e cosa no una principiante

| Schermata | Capisce | Non capisce / problema |
|---|---|---|
| Ingresso (00_home) | Scrivere il nome, Entra. Chiaro e bello. | — |
| Prova da solo (pc_start, tel_start) | Nome, Inizia. | "Ciclo" non spiegato vicino alla tendina ("8 Cicli · circa 2 ore": va bene). Spunta guidata: promette "le cose si scoprono piano piano", ma non è vero (CH-02j). Su telefono la tendina esce dal riquadro. |
| 6 slide (pc_slide1-6, tel_slide1) | La slide 1 a metà. | Troppo lunghe (CH-04). Regole sbagliate (CH-02). |
| Storie (pc_g00_storie, tel_storie) | Sei carte, ognuna con un vantaggio. | "Tracce", "fama", "valigetta", "Moli", "dividendo", "azioni" non sono ancora spiegati. Non sa che Borsa e Cripto arrivano al Livello 2. Su PC dietro la finestra compaiono il cartello "Spezie 3 vie" e un'altra carta "Scegli come iniziare". |
| Dopo la storia (pc_g01d, pc_g02_turno) | "Tocca a te", "Tira i dadi". | Perché ha 290.000 € in più? Dov'è il suo terreno? Cosa sono il "Viaggio rapido" e il "2" rosso sul telefono? Nel frattempo la carta dice ancora "Scegli come iniziare" (CH-10). |
| Finestra Compro (v03, tel_compra) | Prezzo, Compro/Lascio stare. | "Affitti raddoppiano": falso con le attività. Non sa quanto renderà, né che all'asta può offrire anche lei. |
| Carta del turno (v04) | Le mie imprese, Fine turno. | "Oggi puoi fare una mossa: chiedere un permesso…": falso, il permesso è gratis ma a sorte (CH-02a). |
| Imprese / scelta attività (v05, v06) | 4 passaggi, schede con Rende / Affitto / Polizia: **buone**. | "Rende X € a Ciclo" e altrove "a ogni Alba". "Chiedi il permesso" su un'attività già aperta senza dire "per salire al livello 2". |
| Alba (c1_01_alba) | Rendite, Polizia, fatti. | La riga "Gazzetta parla di te" sono solo acquisti. Su telefono va fatta scorrere. |
| Livello nuovo (tc3_01_alba) | "Livello 1". | Testo sbagliato (CH-05). |
| Telefono home (c3_tel_home) | Gruppi Soldi / Costruire / Persone / Notte / Città: buona idea. "Adesso puoi" buona. | 13-17 app. "NUOVA" su app vecchie. Borsa "1,6 mln investiti" falso. Pallino 15/31 messaggi. |
| App (c3_app_*, c6_app_*) | Palazzo e Soldi sporchi sono molto chiare (esempi concreti, piste). Rubrica utile. | Contratti, Prove, Borsa, Lusso, Valigetta vuote o povere (CH-18). Municipio "Sindaco: nessuno". Glossario con errori. |
| Gazzetta (c3_app_gazzetta) | La testata, "I più potenti". | Si apre vuota (CH-07). |
| Messaggi (c3_app_messaggi) | Chat per persona: buona idea. | Due Vera. Troppi messaggi. "Notifiche" è una persona? |
| Legenda (pc_legenda, tc3_07) | Simboli 2D. | Il paragrafo 3D è rotto. Su telefono il testo finisce sotto la carta. |
| Cosa ho (tc3_08) | Numeri e lista: **buono**. | Su telefono coperto. "chi ci passa paga il pedaggio": falso. |
| Registro in basso a sinistra | Ultime 4 cose. | Copre il tabellone. "Tu sceglie il pacchetto". Mostra azioni dei rivali (permessi, cantieri) che a lei non servono. |
| Notte: inizio (n00_n01) | "La Laguna è tua". | "Premi Avanti" ma non c'è Avanti. "Esco" ambiguo. |
| Notte: Dove vai? (n00_n03, n4_02) | Posti, ore di viaggio, "appuntamento": chiaro. | I posti chiusi non si vedono. |
| Notte: luogo (n00_n06, n4_06) | Scelte grandi con il costo, "Tocca ancora per farlo". | Etichette e punti sotto i testi. "polizia tranquillo". Rivali "incrociati" ma già a casa. Appuntamento impossibile con il tasto Vai. |
| Occasione illegale (boxRischio) | Riquadro del rischio molto buono: % guai, cosa ti salva, reato. | "Cicli in cella" sbagliato (sono turni). "Lascia circa 7 Tracce": quanto è? |

---

## PERCORSO DI SCOPERTA PROPOSTO (partita guidata)

Idea: si impara facendo. Ogni cosa nuova arriva **quando serve**, con **una** finestrella (titolo + 2 frasi + tasto "Prova"), e il tasto da premere si illumina.

**Prima di giocare (1 carta):**
> "Sei appena arrivato nella Laguna con 1,5 milioni. Di giorno tiri i dadi, compri terreni e apri attività. Di notte giri per i locali: affari puliti o sporchi. Vince chi è più ricco alla fine."

**Ciclo 1, giorno 1 (un passo per volta, il tasto giusto brilla):**
1. Scelta della storia, poi la finestra "Ti è toccato: X, con un Ristorante già aperto" → [Fammelo vedere].
2. "Tira i dadi" (brilla).
3. Su un terreno libero: "Compralo: poi ci apri un'attività".
4. "Apri l'app Imprese → Chiedi il permesso. Il Municipio a volte dice di no o rimanda: riprova al turno dopo."
5. "Permesso ok → scegli l'attività. Apre all'Alba."
6. "Fine turno."
   Telefono con 5 app: Il mio impero, Imprese, Agenzia, Messaggi, Gazzetta.

**Ciclo 1, giorni 2-4:** Agenzia (la prima volta che sei su un'isola con terreni liberi). Primo affitto pagato o incassato: "Ecco l'affitto: chi si ferma sul tuo terreno ti paga".

**Prima notte:** slide breve "La notte" (4 righe). Si aprono **Valigetta** e **Rubrica**. Si vede che Mercato, Bisca, Porto e Casinò sono "chiusi fino al Livello 1".

**Prima Alba:** finestra dell'Alba con 3 righe. Si apre **I miei conti**.

**Quando hai 2 attività aperte:** si apre **Palazzo** (con la sua slide).
**Quando hai 3 M in contanti o sei in difficoltà:** si apre **Banca**.
**Quando arrivi sulla casella Municipio o hai fama 25:** si apre **Municipio**.
**Quando hai 4 M:** si apre **Lusso**.
**Livello 1:** finestra giusta (CH-05) + slide "Soldi sporchi" + app **Soldi sporchi**. **Prove** si apre alla prima prova.
**Livello 2:** **Borsa**, **Contratti**, slide "Potere e affari".
**Livello 3 / setta / Livello 4:** come oggi, ognuno con la sua finestra.
**Da scoprire:** resta, ma ogni voce dice dove si fa ("→ app Palazzo").

Partita **senza consigli**: tutte le app subito, niente finestrelle, la Guida completa nel tasto 📖.

---

## TESTI RISCRITTI (pronti da incollare)

**Slide 1 – Lo scopo** (al posto dei 7 punti)
- Parti con 1.500.000 € e un'attività già aperta, a sorte.
- Un **Ciclo** = 4 giri di dadi, poi una **notte**, poi l'**Alba**: all'Alba incassi.
- Ogni volta che passi dal Ponte Sud prendi 600.000 €.
- Vince chi ha il **patrimonio** più alto. I soldi sporchi valgono solo un quarto.
- Più sei ricco, più si apre: nuovi posti di notte, nuove app.

**Slide 2 – Il giorno**
- Terreno libero: lo compri. Terreno di un altro: paghi l'affitto se ti fermi lì.
- Per aprire un'attività: chiedi il **permesso** (a volte il Municipio rimanda o dice no), poi apri il **cantiere** (è la tua mossa del giorno). Apre all'Alba.
- Ogni livello in più vuole un nuovo permesso. Dal livello 3 servono tutte le vie dello stesso colore.
- Moli: chi si ferma sul tuo molo ti paga.
- Agenzia: dopo i dadi compri un terreno libero dell'isola dove sei (+20%).

**Slide 4 – La notte (estratto)**
- Di notte giocate tutti insieme, dalle 22 alle 4. Ogni ora: scegli un posto o una cosa da fare, poi premi Avanti.
- Non sai chi c'è in un locale finché non arrivi.
- Serate: col Casinò privato inviti gli altri a **Sette e mezzo**.

**Slide 5 – Soldi sporchi (estratto)**
- Ogni affare sporco lascia **Tracce**. Più Tracce, più la polizia ti cerca.
- Polizia: Tranquilla → Voci → Osservato → Indagato → Processo. Al Processo: multa, turni al Faro (la prigione), sequestri.

**Finestra Compro (riga del gruppo)**
"Gruppo «Lanterne»: 3 vie a Borgo Ambra, tu ne hai 0. Con tutte e 3: affitto doppio sui terreni vuoti, e le tue attività possono salire fino a 5 stelle."

**Carta del turno**
"Mossa del giorno: apri un cantiere, alza il Palazzo, compra un mezzo o chiedi un prestito. Il permesso si chiede a parte."

**Finestra della notte**
"Cala la notte. Fino alle 4, ogni ora: tocca un posto sulla mappa o una cosa da fare qui. Poi premi Avanti." [Ho capito]

**Riga della polizia sotto la fama**
"Polizia: tranquilla" / "Polizia: girano voci su di te" / "Polizia: ti osserva" / "Polizia: sei indagato" / "Domani il Giudice".

**Gazzetta senza notizie**
Non mostrarla. Aprire l'ultima edizione con delle notizie.

**Glossario – Gruppo di vie**
"Ogni isola ha 4 gruppi di 3 vie dello stesso colore. Se le hai tutte: affitto doppio sui terreni vuoti e attività fino a 5 stelle."

**Glossario – Il Faro**
"Il Faro: di giorno è la prigione (stai fermo qualche turno). Di notte, dal Livello 3, è un posto dove si incontrano le sette."

**Rischio (testoPena)**
"2 turni fermo al Faro" (non "2 Cicli in cella").

---

## GLOSSARIO UNICO (una parola = una cosa)

| Usare | Al posto di |
|---|---|
| mossa del giorno | Azione del giorno |
| storia | pacchetto |
| gruppo di vie | serie |
| Municipio | Comune |
| a ogni Alba | a Ciclo |
| Tracce (sempre maiuscolo) | tracce, piste (le piste = i motivi per cui ti scoprono) |
| Livello (solo tuo) | livello attività → stelle; livello setta → Grado |
| Sette e mezzo | poker |
| turni al Faro | Cicli in cella |
| chi si ferma | chi ci passa |
| Imprevisto (casella) | Gazzetta (casella) |

---

## DECISIONI PER NICOLA (7)

1. **CH-01** Nome della consigliera: (a) Bianca/altro nome; (b) l'avversaria cambia nome; (c) "Il tuo avvocato".
2. **CH-02b** Gruppo completo: (a) correggo solo il testo; (b) raddoppiano anche le attività; (c) attività +50%.
3. **CH-03** App all'inizio: (a) 5 app e le altre quando servono; (b) come oggi; (c) 5 nella guidata, tutte senza consigli.
4. **CH-04** Prima di giocare: (a) 1 carta e guida a pezzi; (b) 6 slide più corte; (c) video breve.
5. **CH-06** Nomi dei livelli: (a) Livello / stelle / Grado; (b) tutto "livello"; (c) altri nomi.
6. **CH-07b** Casella "Gazzetta": (a) Imprevisto; (b) Voci di piazza; (c) resta.
7. **CH-26** Tracce: (a) barra a 5 tacche; (b) nascoste ma senza numeri nei testi; (c) numero esatto.

---

## FOTO (in /home/claude/prove/chiarezza/)
- Inizio: 00_home, pc_start, tel_start, pc_slide1-6, tel_slide1-2, pc_g00_storie, tel_storie, pc_g01a-d (carta vecchia), pc_g02_turno, tel_dopo_storia.
- Primo turno: v01_turno, v02_rapido, v03_dopo_tiro, v05_imprese, v06_dopo_permesso, tel_compra, pc_compra2, pc_legenda.
- Alba e livello: c1_01_alba, c1_03_dopo_alba, tc3_01_alba (livello con il messaggio sbagliato).
- Telefono e app: c3_tel_home(2), c3_app_* (tutte), c6_tel_home(2), c6_app_* (Borsa, Contratti, ecc.), c6_impero, tc3_02..09 (telefono 390).
- Notte: n00_n01..n07 (prima notte), n4_01..n4_07 (notte al Livello 2, Porto).
- Testi completi delle app: out_c3.txt, out_c6.txt.
