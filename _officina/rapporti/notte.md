# Rapporto settore NOTTE — Re della Laguna (v65)

Cartella prove: `/home/claude/prove/notte/` (foto `*.png`, script `sim.js`, `ev.js`, `exploit.js`, `proposta.js`, `incontri.js`, `crea.js`, `modifica.js`, `foto2.js` = foto.js con più foto e caricamento di una partita salvata).
Come ho provato: partite intere coi bot in Node (6 semi, 48 notti), stati di partita avanzati (Ciclo 3 e 5, Livello 2) caricati nel browser, scene provate a 1280x800 e 390x844 (telefono): Palazzo, Club, Mercato Nero, Bisca, Marina con un altro giocatore, serata nel Casinò privato, Ricettatore, Ballo in Maschera, sfida a Sette e mezzo, Alba.

---

## LE 5 COSE PIÙ IMPORTANTI

1. **Le proposte agli altri giocatori spariscono prima che l'altro le veda** (NOT-01). Se l'altro ha già premuto Avanti, il tuo "offro da bere" o la tua sfida scadono subito. Online, l'interazione tra giocatori quasi non funziona. I bot poi non propongono mai niente tra loro e lo fanno con te al massimo una volta per notte.
2. **Il Casinò privato pulisce gratis i soldi sporchi** (NOT-02). L'ingresso e le puntate si pagano con gli sporchi, le vincite tornano pulite e l'ingresso arriva pulito a chi ospita. Due amici (es. Nicola e la sorella) ripuliscono milioni a costo zero. Provato: 2 M sporchi diventati 2,1 M puliti in una notte.
3. **Si vedono le carte degli altri e il mazzo** (NOT-03). `vista()` manda a tutti `manoSM` intero: le carte di chi sfida e l'ordine del mazzo (anche la tua prossima carta). È il contrario di "le carte si giocano davvero".
4. **L'Alba e il riquadro "Com'è andata" non dicono le cose importanti** (NOT-04/05). Il Ricettatore sequestrato (−1 M, +8 Tracce) e le perquisizioni compaiono solo nei messaggi. L'Alba scrive "Tranquillo, nessun guaio stanotte". "Com'è andata" mostra la vincita lorda (+100.000 quando il guadagno vero è +50.000) e non mostra mai la fama.
5. **Ritmo e sorpresa** (NOT-10…14). Ogni affare si risolve in un clic, senza suspense. Il 22% delle ore si passa in viaggio davanti a uno schermo vuoto con solo "Avanti". Dalle 22:00 al Palazzo c'è una sola scelta. Sullo schermo arrivano insieme finestre del giorno, avvisi e riquadri. Le scelte oltre le 3 spariscono senza avviso (es. il Ballo in Maschera sparisce quando arriva il "carico dal mare"). Le sale VIP/riservate sono solo foto diverse. Il "poker" annunciato è in realtà Sette e mezzo.

Decisioni di Nicola necessarie: **7** (elencate in fondo).

---

## BUG E PROBLEMI (dettaglio)

### NOT-01 — Le proposte scadono prima che l'altro possa rispondere
- **Gravità:** BLOCCANTE (per il gioco online tra amici)
- **Dove:** motore.js:2053-2058 (`risolviOra` segna "scaduta" ogni proposta in attesa), motore.js:1940-1944 (`controllaOra` chiude l'ora appena sono tutti pronti), motore.js:1650-1675 (`incontro`)
- **Come si vede:** `proposta.js`. Rocco sceglie e preme Avanti. Io gli offro da bere e premo Avanti: l'ora si chiude subito e la proposta risulta "scaduta". Rocco non l'ha mai vista. Nel mio racconto c'è anche l'ordine sbagliato: "23:00 incroci Rocco. Vi guardate un attimo" e poi "22:00 Rocco non ti ha risposto". Eravamo insieme già dalle 22.
- **Altri problemi dell'incontro:**
  - I bot non si propongono mai tra loro (bot.js:352-355).
  - Con un umano propongono qualcosa una sola volta per notte, con probabilità 35%.
  - Nelle simulazioni il giocatore incontra qualcuno solo nel 27% delle ore passate fuori, e solo in 22 notti su 48 (`incontri.js`).
  - Ci sono solo 3 cose da fare con l'altro: bere, sfidare, seguire.
- **Proposta:** finché c'è una proposta per te in attesa, l'ora non si chiude. Ti arriva una finestra e hai 20-30 secondi per rispondere; se non rispondi, decide il "no". Oppure la proposta resta valida fino alla fine dell'ora dopo. Nuovi incontri (dettagli in fondo, PROPOSTE). Lavoro: medio.
- **Decisione di Nicola:** SÌ (D2).

### NOT-02 — Il Casinò privato ripulisce gli sporchi a costo zero
- **Gravità:** ALTA
- **Dove:**
  - motore.js:1514-1515 (`arrivaSerata`: l'ospite paga con `pagaMisto`, cioè prima gli sporchi, e chi ospita riceve `host.cash`, cioè puliti)
  - motore.js:1545 (puntata con `pagaMisto`)
  - motore.js:1633 (vincita in `p.cash`, puliti)
- **Come si vede:** `exploit.js`. Ospite con 2 M sporchi e 0,1 M puliti. Paga 500.000 di ingresso e gioca 5 mani. Alla fine ha 2,1 M puliti e 0 sporchi. Chi ospita ha incassato 500.000 puliti dagli sporchi dell'altro. Al Casinò Reale lo stesso cambio costa dal 15 al 25%, e la Lavanderia della setta ha un tetto.
  - Il Sette e mezzo contro il banco è quasi alla pari: −1,9% se stai a 4, +0,8% se stai a 2 (`ev.js`).
  - Quindi due alleati ripuliscono quanto vogliono, senza Tracce.
- **Proposta:** si paga e si vince nello stesso tipo di soldi (sporchi dentro, sporchi fuori). Oppure chi ospita prende Tracce e "calore Finanza" per i soldi sporchi che incassa. Piccolo.
- **Decisione di Nicola:** SÌ (D1).

### NOT-03 — Le carte e il mazzo sono visibili a tutti
- **Gravità:** ALTA
- **Dove:** motore.js:3417 (`vista` copia tutto lo stato). `s.manoSM` non viene mai tolto: solo `v.notte.manoSM` è filtrato (3458). Nemmeno locale.js `vistaSicura` lo toglie.
- **Come si vede:** `proposta.js`. Nella vista di Rocco c'è `manoSM.g1` con le mie carte e il mazzo intero. Nella mia vista c'è il mio mazzo, cioè la prossima carta ("prossima carta: 24"). Chi apre gli strumenti del browser sa sempre se pescare.
- **Proposta:** in `vista()` fare `delete v.manoSM`. Piccolo. Va fatto anche nella funzione del server, se usa `vista`.
- **Decisione di Nicola:** NO.

### NOT-04 — L'Alba non racconta i fatti più importanti
- **Gravità:** ALTA (chiarezza)
- **Dove:**
  - gioco.js:2161-2186 (`finestraAlba` legge solo `raccontoNotte`)
  - motore.js:1915-1921 (`albaRefurtiva` usa `privato`)
  - motore.js:2216-2231 (perquisizioni con `privato`). All'Alba `s.notte` è già null, quindi `racconta` non scrive niente.
- **Come si vede:** foto `h01_alba.png`. La Finanza ha preso il camion del Ricettatore (−1.000.000, +8 Tracce). L'Alba scrive "Polizia: Tranquillo · nessun guaio stanotte" e "Vera ti suggerisce: Hai soldi fermi…". La notizia si trova solo nei messaggi del telefono.
  - Anche "Rendite del mattino" conta solo i puliti: gli sporchi incassati all'Alba non ci sono.
  - La riga "Ti porti via 100.000 €" viene segnata come neutra (•) invece che positiva (✓). La regex `/ti porti via/` non riconosce la "T" maiuscola (gioco.js:2158).
- **Proposta:** un elenco `fattiAlba[p.id]` (refurtiva, perquisizione, Affari Interni, contatti persi, sentenze) mostrato per primo, con icone. Un riquadro "Soldi sporchi stanotte: +X / −Y". Il consiglio di Vera deve tenere conto di cosa è appena successo. Medio.
- **Decisione di Nicola:** NO.

### NOT-05 — "Com'è andata" dà cifre sbagliate o incomplete
- **Gravità:** MEDIA
- **Dove:** motore.js:3307-3309 (l'esito è per singola azione, non per ora), gioco.js:1220-1227
- **Come si vede:**
  - Foto `d05_dopo_mano.png`: alla Bisca punto 50.000 e vinco. Il riquadro dice "+100.000 € sporchi" (era "−50.000" prima di chiudere la mano). Il guadagno vero è +50.000.
  - Stessa cosa al tavolo della serata ("Vinci 100.000 €").
  - Il riquadro dice "nessuna traccia" anche se le carte alla Bisca danno +1 Traccia: viene aggiunta quando apri la mano, il riquadro la conta quando la chiudi.
  - La fama non compare mai: Ballo +4, giro offerto, festa. Foto `e07_ballo.png`: "−300.000 €, nessuna traccia" e basta.
  - Italiano: "Hai lasciato nessuna traccia" (deve essere "Non hai lasciato Tracce"). "Reato Media" (deve essere "Reato medio") (gioco.js:2229).
- **Proposta:** calcolare l'esito dall'inizio dell'ora (`N2.base` esiste già) e mostrare soldi netti, sporchi, fama e Tracce. Piccolo.
- **Decisione di Nicola:** NO.

### NOT-06 — Il rischio mostrato non è quello vero
- **Gravità:** ALTA (Nicola: "il rischio dell'illegale sempre chiaro")
- **Dove:** gioco.js:2214-2216 (`boxRischio`) contro motore.js:1959-1969 e 1998-2003
- **Come si vede:** la percentuale "guai: 30%" non conta:
  - il Commissario Vargas nel locale (×1,35), che la scena pure mostra ("Il Commissario Vargas è al bancone", foto `d01_bisca`);
  - il doganiere comprato (×0,5);
  - il rito della setta (×0,7);
  - il Commissario della setta (×0,85);
  - la legge "polizia doppia" (×1,4);
  - la giornalista nel locale (Tracce ×1,25).
  - "Ti salva quasi sempre: maschera" resta scritto anche quando la polizia ha già imparato il trucco: dopo 4 usi l'oggetto fallisce fino al 55% delle volte (motore.js:1978).
- **Proposta:** il motore deve dare una funzione `rischioOccasione(s,p,o)` (probabilità e Tracce previste) che la UI mostra così com'è, con le cause scritte ("Vargas è qui: +35%"). Per gli oggetti: "funziona circa X volte su 10". Medio.
- **Decisione di Nicola:** NO.

### NOT-07 — Le scelte oltre la terza spariscono senza avviso
- **Gravità:** ALTA
- **Dove:** motore.js:1762 (`[...prima, ...occ, ...resto].slice(0, 2)` più la scelta fissa)
- **Come si vede:** alla Marina, Ciclo 6. Alle 22 ci sono "Giro in barca", "Ballo in Maschera" e "Passeggia". Alle 00:00 arriva "Il carico dal mare" e **il Ballo sparisce** (verificato con `scelteNotte`, ora 2).
  - Con 2 occasioni spariscono anche Ricettatore, Lenz, Vargas, la giornalista, il doganiere in giro e la macchina fotografica.
  - Nessuno ti dice che c'era altro.
- **Proposta:** mostrare 3 scelte grandi più "Altro qui (2)", oppure scelte a scorrimento. In alternativa lasciare sempre il posto agli eventi speciali (Ballo, personaggi). Piccolo.
- **Decisione di Nicola:** SÌ (D7).

### NOT-08 — Le finestre del giorno compaiono di notte, e gli avvisi vecchi tornano
- **Gravità:** MEDIA
- **Dove:** gioco.js:2102 (`ultimaCarta`) e 2094-2095 (`riepOra`). `visti` è in memoria e si azzera a ogni ricarica della pagina.
- **Come si vede:**
  - La carta Gazzetta del giorno ("Un informatore ti vende una soffiata…") esce alle 22:00 e di nuovo alle 23:00. Foto `a02_palazzo.png`, `a04_dopo_vai.png`, log di `s4.js`.
  - Sul telefono, alle 22:00 della notte nuova compare il riepilogo "03:00 → 04:00 −55.650 €" della notte prima. Foto `f01_mobile_mercato.png`. Copre anche il riquadro dei soldi.
- **Proposta:** di notte non mostrare `ultimaCarta`. Mostrare `riepOra` solo se `fase==="notte"` e se riguarda la notte in corso. Ricordare `visti` in sessionStorage. Piccolo.
- **Decisione di Nicola:** NO.

### NOT-09 — Il timer dice "Tempo finito" anche nella partita da soli
- **Gravità:** BASSA
- **Dove:** gioco.js:1190, 1228, 1284 (in locale `tempo_scaduto` non viene mai inviato)
- **Come si vede:** foto `d05`, `g02`. "Tempo finito: chi non ha scelto resta dov'è", ma non succede niente.
- **Proposta:** in `?locale` nascondere la barra del tempo, oppure farla funzionare davvero. Piccolo.
- **Decisione di Nicola:** NO.

### NOT-10 — Gli affari si risolvono in un clic, senza suspense né scelte
- **Gravità:** ALTA (design: "mancanza di avventura")
- **Dove:** motore.js:1841-1855 (`prendiOccasione` chiama subito `risolviOccasione`)
- **Come si vede:** foto `f04_mobile_esito.png`. "Accetto" e nello stesso istante tre righe: "accetti / arriva una retata / il carico è sequestrato".
  - Nessun momento di tensione.
  - Nessuna decisione quando arriva il pericolo.
  - La retata e la rissa non si possono evitare in nessun modo.
  - Il commento nel codice (riga 1151) dice "poi l'ora si chiude e si scopre cosa è successo", ma non è così.
- **Proposta:** l'affare in 3 battute animate.
  1. Preparazione: foto e testo.
  2. Il pericolo arriva e **tu scegli** fra 3 cose:
     - "Scappa dal retro": salvi te, perdi il carico;
     - "Usa la maschera": se ce l'hai;
     - "Tieni duro": più soldi, più rischio.
  3. L'esito, con una piccola animazione (carta che si gira, sirena, flash).
  - La probabilità resta la stessa, ma il giocatore partecipa. Medio.
- **Decisione di Nicola:** SÌ (rientra in "scene animate", D-extra in fondo).

### NOT-11 — Troppo tempo morto: viaggi e Palazzo vuoto
- **Gravità:** MEDIA
- **Dove:** motore.js:1241-1246 (2 ore se cambi isola), gioco.js:1208 (viaggio: solo "Avanti")
- **Come si vede:**
  - Simulazione (`incontri.js`): il 22% delle ore attive si passa "In viaggio". Lo schermo mostra solo "Arrivi tra un'ora. [Avanti]" (foto `a05_club`, `g01`).
  - Alla prima notte il Club Neon è a 2 ore su 6.
  - Alle 22:00 il Palazzo offre una sola scelta, "Resta a casa un'ora" (foto `a02`, `c01`), anche se il testo dice "Esci dal tuo palazzo. La Laguna è accesa." (contraddizione).
- **Proposta:**
  - Il viaggio diventa una piccola scena: incontri per strada, posto di blocco notturno, telefonata, "vedi l'auto di X passare sul ponte" (indizio su un rivale).
  - A casa alle 22:00 ci sono sempre 3 cose: "telefona a un contatto", "guarda la Gazzetta di domani", "prepara la valigetta".
  - Togliere "Esci dal tuo palazzo" finché non esci davvero.
  - Lavoro medio.
- **Decisione di Nicola:** NO, solo per il contenuto (la direzione è nelle PROPOSTE).

### NOT-12 — Schermo affollato: troppi bottoni e scritte sovrapposte
- **Gravità:** MEDIA (la critica "incasinato")
- **Dove:** gioco.js:1185-1216, 1127-1161 (punti del panorama), panorama.js
- **Come si vede:**
  - "Massimo 3 scelte" non è vero: ci sono 3 scelte, 5 bottoni sotto (Guarda la merce, Soffiata, Resta qui, Vai altrove, Torna a casa), le persone presenti, 3-5 cerchi luminosi del panorama che rifanno le stesse cose e la scritta "Trascina per guardarti intorno".
  - Le etichette dei cerchi finiscono sotto il titolo: "Il padrone dei sigari" sopra "Bisca del Vicolo" (foto `d05`); "Rocco è qui" sopra "Marina dei Re" (`e01`); "Il tavolo dei soldi · La merce rubata" dietro il racconto (`c04`).
  - Sul telefono il bottone del telefono copre "Resta qui" (`f01`) e il riquadro dei soldi copre l'orologio della notte.
  - Alcune scelte vanno toccate due volte ("Tocca ancora per farlo": attività fissa, Ballo, Ricettatore, Spa, Resta), altre una volta (affari, corruzione).
  - Il Ballo al secondo tocco spende 300.000 € senza conferma, mentre gli affari chiedono conferma.
- **Proposta:**
  - Una sola regola: un tocco apre la scheda con costo e rischio, "Fallo" conferma.
  - I bottoni secondari vanno in un menu "⋯".
  - I cerchi del panorama non si mostrano nella fascia bassa dove c'è il testo.
  - Piccolo/medio.
- **Decisione di Nicola:** NO.

### NOT-13 — Il cambio d'ora è brusco: niente transizione
- **Gravità:** MEDIA
- **Dove:** motore.js:2011-2087, gioco.js:1350-1363 (avviso di 7 secondi in alto a sinistra)
- **Come si vede:** coi bot, appena premi Avanti l'ora scatta: cambiano subito sfondo, testi e luogo. Il riepilogo dell'ora è un biglietto che sparisce in 7 secondi. Insieme possono uscire avviso, finestra Gazzetta, esito delle carte e riquadro "Com'è andata". Da qui il "troppo veloce / incasinato".
- **Proposta:** una transizione di 2-3 secondi a schermo intero. L'orologio ruota "23:00 → 00:00", sotto c'è una riga sola con cosa è successo e chi hai visto, poi entra la scena nuova. Una sola cosa alla volta, con una coda delle finestre: prima le risposte agli altri, poi l'esito, poi il resto. Medio.
- **Decisione di Nicola:** SÌ (D6: quanto dura un'ora).

### NOT-14 — Il "poker" è in realtà Sette e mezzo, e il banco gioca alla cieca
- **Gravità:** MEDIA
- **Dove:**
  - Testi "poker": motore.js:651 (stanza Casinò privato: "serate di poker"), 1496-1497, gioco.js:2078, 2089-2090, locale.js:47.
  - Codice del poker scritto ma mai usato: motore.js:1520-1536 (`mano`, `punteggio`, `NOMI_MANI`).
  - Il banco pesca fino a 5 e mezzo senza guardare le tue carte (motore.js:1565).
- **Come si vede:**
  - Foto `d04`: sto con un Fante (mezzo punto) e vinco, perché il banco sballa.
  - Calcolo `ev.js`: fermarsi a 2 punti è la strategia migliore (+0,8%); fermarsi a 6 rende −13%. Al giocatore conviene "non giocare". Nel Sette e mezzo vero il banco vede le tue carte scoperte e decide.
  - Al tavolo della serata il titolo dice "IL TUO PALAZZO" anche se sei a casa di Rocco (foto `g03`, `nomeLuogo('palazzo')`).
  - "Il tavolo truccato" (Bisca) è un affare deciso a caso, non una mano di carte.
  - La roulette "Rosso o nero?" non fa scegliere niente.
- **Proposta:**
  - Il banco gioca vedendo le tue carte scoperte (tutte tranne la prima), come nel gioco vero.
  - Il tavolo truccato diventa una mano in cui sai la carta del banco.
  - Alla roulette scegli rosso/nero/numero.
  - Nel Casinò privato, poker vero tra i giocatori presenti (il codice c'è già), oppure cambiare tutti i testi in "Sette e mezzo".
  - Piccolo (testi), medio (poker vero).
- **Decisione di Nicola:** SÌ (D3).

### NOT-15 — I personaggi famosi sono in due posti alla volta
- **Gravità:** MEDIA
- **Dove:** motore.js:1705-1716 (`GIRO`) contro 1726-1729 (Lenz sempre al Casinò, doganiere sempre all'Aeroporto, agente/Vargas sempre al Club). gioco.js:1342 (in "Vai altrove" i volti sono fissi a casa loro) e 1846-1884 (la Rubrica dice "È qui con te" sempre al posto fisso).
- **Come si vede:**
  - Il cannocchiale dice "Lenz → Marina", ma al Casinò c'è comunque "Un drink con il banchiere Lenz".
  - Vargas è "al bancone della Bisca" e allo stesso tempo si compra al Club.
  - La lista "Vai altrove" mostra le facce dei personaggi nei posti fissi, quindi ti dice dove sono anche se in realtà girano.
  - `GIRO.banchiere.posti` ha "casino" due volte.
- **Proposta:** ogni personaggio sta in un posto per ora, e solo lì lo incontri. Il cannocchiale e le soffiate servono a sapere dove. Ogni incontro è una piccola scena con 2-3 battute (favore, ricatto, informazione), e il personaggio si ricorda di te (fiducia o sospetto). Medio.
- **Decisione di Nicola:** SÌ (D4).

### NOT-16 — Il Faro non compare in "Vai altrove" per chi è nella setta
- **Gravità:** MEDIA
- **Dove:** gioco.js:1339 (`L.LUOGHI[l].sblocco <= S.sblocco`) contro motore.js:1238 (`luogoAperto`: il Faro è aperto per chi è nella setta)
- **Come si vede:** un membro della setta di Livello 1-2 non trova il Faro nella lista. Ci arriva solo dal banner della convocazione.
- **Proposta:** usare `L.luogoAperto(S, l, me)`. Piccolo.
- **Decisione di Nicola:** NO.

### NOT-17 — Il Ballo in Maschera è da soli
- **Gravità:** MEDIA (opportunità persa)
- **Dove:** motore.js:1901-1914
- **Come si vede:**
  - Si paga 300.000 € (solo puliti; il testo non lo dice e chi ha solo sporchi riceve l'errore "L'ingresso costa…") e si ottiene +4 fama e forse una Prova.
  - Gli altri giocatori al Ballo non si incontrano in modo speciale.
  - L'annuncio parla di "maschera obbligatoria", ma la Maschera della valigetta non serve.
  - È un clic, come "offri un giro".
- **Proposta:** dettagli nelle PROPOSTE (Ballo anonimo tra giocatori). Medio.
- **Decisione di Nicola:** SÌ (D5).

### NOT-18 — Sale VIP e riservate: solo cosmetiche
- **Gravità:** MEDIA
- **Dove:** gioco.js:960-1110 (PANORAMI), motore.js:1379-1382 (`lustro`)
- **Come si vede:**
  - Privé, Molo degli yacht, Tavolo dei grandi, Retrobottega… cambiano solo la foto e il nome dei cerchi. Le scelte sono identiche.
  - Il lustro dà solo +fama e +20% sui guadagni, in silenzio.
  - Il livello "riservato" (lustro 2) non ha panorami. La "porta d'oro" della Terrazza VIP dice "arriva presto" (gioco.js:1147).
  - Chi ha il lustro entra già nella sala migliore, quindi non vede mai la differenza.
- **Proposta:** ogni sala ha 1 cosa sua.
  - Privé: chi c'è stanotte nella Laguna.
  - Tavolo dei grandi: puntate alte.
  - Salone del Re: il tavolo di Lenz.
  - Ponte del megayacht: affari col boss straniero.
  - Davanti alla porta chiusa si legge "Ti servono 30 punti di fama, ne hai 22". Medio.
- **Decisione di Nicola:** NO.

### NOT-19 — Le soffiate al Mercato costano meno delle attività dei locali
- **Gravità:** BASSA
- **Dove:** motore.js:1832-1840 (`soffiata` non usa l'ora) contro 1413-1416 ("Passeggia tra gli yacht" usa l'ora e dà un posto a caso)
- **Come si vede:** per 50.000 € e senza perdere l'ora sai com'è un posto a tua scelta, quante volte vuoi. "Passeggia tra gli yacht" e "Chiedi in giro" costano un'ora intera per un'informazione a caso. Anche gli oggetti si comprano senza usare l'ora.
- **Proposta:** al massimo 1 soffiata per ora, oppure il prezzo sale a ogni soffiata. Le attività fisse devono dare qualcosa in più (es. un nome di giocatore). Piccolo.
- **Decisione di Nicola:** NO.

### NOT-20 — Ripetitività: le stesse frasi e le stesse occasioni
- **Gravità:** MEDIA
- **Dove:** motore.js:1194-1223 (15 occasioni, 2 frasi di indizio per livello per luogo), 1386-1396
- **Come si vede:** in 3 notti della prova ho rivisto "Metà dei banchi ha già chiuso", "La merce rubata", "Il carico dal mare". Ogni luogo ha 1-3 occasioni possibili. Dopo 4-5 notti un giocatore le conosce tutte. I bot fanno sempre le stesse cose (in 48 notti: vai, occasione, torna a casa, compra, ricicla; mai carte, roulette, Ballo o Ricettatore).
- **Proposta:**
  - Varianti per ogni occasione (stesso affare, 3 storie).
  - Un "evento della notte" comune a tutti (vedi PROPOSTE).
  - Occasioni a catena, cioè che continuano la notte dopo.
  - Bot che usano carte, Ballo e Ricettatore, così il giocatore li vede usare.
  - Medio.
- **Decisione di Nicola:** NO.

### NOT-21 — Piccole cose di testo
- **Gravità:** BASSA
- **Dove e cosa:**
  - "In viaggio verso Club Neon": manca l'articolo ("verso il Club Neon").
  - "Rocco ti invita a poker" (vedi NOT-14).
  - La Rubrica: "Vai da lui" anche per la giornalista ("da lei").
  - "Hai soldi fermi" detto da Vera subito dopo un sequestro (NOT-04).
  - L'avviso "Restano 13 secondi" mentre sei già in viaggio.
- **Proposta:** ripasso dei testi. Piccolo.
- **Decisione di Nicola:** NO.

---

## PROPOSTE: COME FARE DELLA NOTTE IL MOMENTO PIÙ BELLO

1. **Scene animate in 3 battute** (vedi NOT-10). Arrivi (foto che si muove, una riga di indizio), scegli, poi l'esito con un effetto: carta che si gira, flash del fotografo, sirene blu sullo schermo, contanti che contano. Ogni affare ha un momento di decisione quando arriva il pericolo.
2. **Transizione d'ora** (NOT-13): orologio a schermo intero, i fatti dell'ora in una riga, poi la scena nuova. Una finestra alla volta.
3. **Un evento comune ogni notte**, annunciato dalla Gazzetta all'Alba prima o a sorpresa alle 00:00. Esempi:
   - temporale: i ponti chiusi, i viaggi durano 2 ore;
   - retata annunciata al Porto alle 02:00;
   - festa sul megayacht di un miliardario;
   - blackout a Borgo Ambra;
   - nave della Marina in porto.
   Tutti ne parlano, quindi si crea sorpresa e ci si incontra.
4. **Incontri veri tra giocatori** (NOT-01):
   - proponi un **colpo in coppia** (soldi divisi, tutti e due rischiano, uno dei due può tradire e chiamare la polizia);
   - **ricatta** con una Prova ("pagami o domani va alla Gazzetta");
   - **scambia o vendi** un oggetto della valigetta;
   - **fai una soffiata contro** chi è nel locale (il suo rischio sale per un'ora);
   - **borseggio**: prendi un oggetto dalla valigetta altrui, con il rischio di essere visto.
   Una proposta non si perde finché l'altro non risponde.
5. **Ballo in Maschera tra giocatori** (NOT-17). Al Ballo tutti sono anonimi ("Maschera d'oro", "Maschera di corvo"). Puoi bere, sfidare o fare affari senza sapere con chi. Alle 03:00 cadono le maschere e si scopre chi era chi. La Maschera della valigetta ti lascia restare anonimo anche dopo.
6. **Carte vere**: banco del Sette e mezzo che vede le tue carte, tavolo truccato giocato come mano, poker a 5 carte tra giocatori nel Casinò privato (il codice c'è già), roulette con scelta del colore e del numero.
7. **Personaggi con memoria** (NOT-15). Lenz, Vargas, il doganiere e la giornalista stanno in un posto per ora. Ogni incontro è una scena con battute. Si ricordano di te: se li paghi spesso si fidano; se li tradisci, una notte ti aspettano.
8. **Luoghi interattivi**: i cerchi del panorama aprono mini-scene diverse dalle 3 scelte. Esempi: frugare nel cassetto del capo porto per sapere quale nave arriva; guardare dal buco della serratura del Privé chi parla con chi; dare la mancia al barista per una voce su un rivale. Ogni sala VIP ha una cosa sua (NOT-18).
9. **L'Alba come "giornale della notte"** (NOT-04): prima i tuoi fatti (vinto, perso, sequestrato, perquisito), poi chi hai visto e chi ti ha visto, poi le rendite. Con un'animazione breve e chiara.

---

## DECISIONI PER NICOLA (7)

**D1 — Il Casinò privato pulisce i soldi sporchi?**
Oggi chi paga l'ingresso o gioca con soldi sporchi riceve vincite pulite, e chi ospita incassa puliti: è un modo per ripulire gratis.
- a) Si paga e si vince con lo stesso tipo di soldi (sporchi restano sporchi).
- b) Si può ripulire, ma chi ospita prende Tracce e la Finanza lo guarda.
- c) Va bene così: è il premio per chi costruisce il Casinò privato.

**D2 — Quando un amico ti offre da bere o ti sfida, quanto tempo hai per rispondere?**
Oggi la proposta sparisce se hai già premuto Avanti.
- a) L'ora non finisce finché non rispondi (massimo 30 secondi).
- b) La proposta resta valida anche nell'ora dopo.
- c) Puoi rispondere anche dopo Avanti, ma l'ora aspetta solo 15 secondi.

**D3 — A che carte si gioca di notte?**
- a) Solo Sette e mezzo dappertutto (si cambiano i testi "poker"), con il banco che gioca vedendo le tue carte.
- b) Sette e mezzo alla Bisca, poker vero tra giocatori nel Casinò privato.
- c) Poker anche alla Bisca contro il banco.

**D4 — I personaggi famosi (Lenz, Vargas, doganiere, giornalista):**
- a) Stanno sempre nel loro posto: semplice da capire.
- b) Girano: ogni ora in un posto diverso, e per trovarli servono cannocchiale o soffiate.
- c) Hanno un posto fisso, ma una volta a notte si fanno vedere in un altro locale (sorpresa).

**D5 — Il Ballo in Maschera:**
- a) Resta com'è: entri, fama, forse una Prova.
- b) Diventa una festa tra giocatori anonimi: alle 3 cadono le maschere.
- c) Come b), e chi ha la Maschera della valigetta resta anonimo anche dopo.

**D6 — Quanto dura un'ora di notte, online?**
- a) 60 secondi.
- b) 90 secondi.
- c) 120 secondi come oggi, con una pausa di 3 secondi tra un'ora e l'altra per vedere cosa è successo.

**D7 — Quando in un posto ci sono più di 3 cose da fare:**
- a) 3 grandi più un bottone "Altro qui".
- b) Tutte, una sotto l'altra, da scorrere.
- c) 3, ma gli eventi speciali (Ballo, personaggi, appuntamento) hanno sempre il posto.

**Extra (scene animate):** quale preferisci per prima?
- a) Gli affari con la scelta quando arriva la polizia.
- b) Il cambio d'ora con l'orologio.
- c) L'Alba come giornale.
