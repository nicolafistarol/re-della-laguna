# Rapporto settore ONLINE — Re della Laguna (18/11/2026)

Analisi in sola lettura. Niente è stato modificato su Supabase né nella partita vera.
Prove e script: `/home/claude/prove/online/script/` (equivalenza.js, equivalenza6.js, falle.js, fuzz.js, manoSM.js, tempi.js).
Copia completa della storia git: `/home/claude/prove/online/repo/`.

> Nota onesta: all'inizio ho lanciato per errore `git fetch` dentro `/home/claude/re-della-laguna` (ha scaricato la storia in `.git`, senza toccare file, branch o lavoro). Poi ho lavorato solo sulla copia in `/home/claude/prove/online/repo`.

---

## LE 5 COSE PIÙ IMPORTANTI

1. **ON-01 (ALTA, imbroglio)** — A Sette e mezzo **si vede il mazzo**: la mano aperta (con le carte che arriveranno) finisce nella "vista" di tutti, anche degli avversari. Chi apre gli strumenti del browser sa la prossima carta e le carte degli altri.
2. **ON-02 (ALTA)** — **Chi esce dalla partita (o perde il collegamento del browser) non può più rientrare**, anche se il gioco gli dice "potrai rientrare se ti mandano il codice". Il server rifiuta: "La partita è già iniziata".
3. **ON-03 (ALTA)** — **Un giocatore assente blocca tutti**: di giorno non c'è nessun tempo massimo per il turno e nessun modo di farlo giocare a un computer. Una partita "libera" di più sere si ferma se uno non torna.
4. **ON-04 (ALTA)** — **La partita vera è stata giocata su 7 versioni diverse del server** (v36→v42 tra le 21:10 e le 22:31 del 17/11) e ora gira sulla v49: le regole sono cambiate **a metà partita**. Il browser e il server oggi sono uguali (verificato), ma non c'è nessun controllo automatico che lo garantisca.
5. **ON-05 (MEDIA-ALTA)** — **Troppi dati sul telefono**: ogni 8 secondi il browser riscarica tutta la vista (~115 KB nella partita vera) anche se non è cambiato niente, più ~115 KB per ogni mossa. Stima: ~200-250 MB per giocatore in una serata di 3 ore. Lento su telefono e rischio di superare i limiti gratuiti di Supabase.

Decisioni da chiedere a Nicola: **3** (ON-03, ON-04, ON-02 come rientro su un altro dispositivo).

---

## Cosa funziona bene (verificato)

- **Browser e server hanno lo stesso motore (v65 = commit a8f7fef).** La funzione pubblicata (v49) è identica a `server/index.ts` e importa `server/motore.js` e `server/bot.js` del commit a8f7fef, che contiene già il motore nuovo (il file minimizzato cambia nello stesso commit). Prova: `equivalenza.js` gioca la stessa partita con il motore del browser e con quello del server, stessi semi, confrontando **tutto lo stato dopo ogni mossa**: 6 partite da 4 giocatori × 12 Cicli e 3 partite da 6 giocatori × 16 Cicli, **identiche al 100%** (≈1.000-2.100 mosse ciascuna, 0 differenze). Patrimoni dei vincitori in linea col riferimento (12 Cicli 110-169 M; 16 Cicli 569-1030 M con 6 giocatori).
- **Database protetto bene.** RLS attiva ovunque. Un giocatore può leggere solo la propria riga di `viste`; `partite` (con lo stato completo e i segreti) non è leggibile da nessun giocatore; `partite_pubbliche` mostra solo id/codice/stato, senza lo stato di gioco; `azioni` non è leggibile. Realtime manda a ciascuno solo la sua vista.
- **Non si può agire al posto di un altro**: il server ricava chi sei dal tuo accesso, non da quello che mandi. Il motore controlla che contratti, proposte, inviti, voti, offerte all'asta siano davvero tuoi.
- **Prova "da imbroglione" (fuzz.js)**: ho mandato al motore del server tutte le 84 azioni con importi negativi, NaN, Infinito, 1e15, testi enormi, id di altri giocatori, `__proto__`… su 19 momenti diversi della partita: **nessuna mossa accettata ha creato soldi, tolto soldi agli altri o rotto i numeri**. Solo 2 errori di programma (contratto senza dati, corrompi con id strano) che danno "errore del server" ma non rovinano nulla.
- **Il seme dei dadi (rngState) è tolto dalla vista**: non si possono prevedere i dadi.
- **La vista non modifica lo stato vero** (controllato a ogni passo in falle.js).
- **Log del server (ultime 24 ore)**: 0 errori 500, 0 crash. 1.082 mosse riuscite, 83 rifiutate dal motore (normali), 3 conflitti 409, 1 accesso non valido. Tempo medio di una mossa 0,54 s (p95 0,74 s, massimo 1,1 s).
- **La partita vera 8e8dfc20 è in uno stato valido** (letta in sola lettura): Ciclo 14 (ciclo=13), Giorno 3, fase giorno, tocca a fista (ha tirato, deve finire il turno), nessuna finestra in sospeso. Ordine dei turni valido, tutte le proprietà hanno proprietari esistenti, quote TV 10/10 e Banca 10/10, membri delle sette coerenti con le schede dei giocatori, nessun numero rotto (NaN/null). Viste di tutti e 5 alla stessa versione 769 dello stato. È "partita libera" (la chiude solo fista). Il motore nuovo la accetta (100 caselle, valigetta presente) e converte le sette vecchie al sistema Influenza (Comandatori: Tesoro 70 M → Influenza ~82 → livello 4, che era già il loro livello).

---

## Problemi trovati

### ON-01 — A Sette e mezzo si vedono il mazzo e le carte degli altri
- **Gravità:** ALTA (imbroglio facile, e rompe "i giochi di carte si giocano davvero")
- **Dove:** `motore.js:3416-3418` (funzione `vista`): copia tutto lo stato e non cancella `s.manoSM`; la mano viene creata in `motore.js:1566-1568` (`apriManoSM`) con dentro il `mazzo` mescolato.
- **Come si vede:** `node /home/claude/prove/online/script/manoSM.js` → la vista dell'avversario contiene `manoSM: {g1: {mazzo:[12,33,7,21], carte:[5], posta:50000…}}`; anche la mia vista contiene il mio mazzo: la prossima carta è l'ultima della lista. Basta aprire gli strumenti del browser (scheda Rete) per sapere se conviene chiedere carta, e cosa pescherà il banco (`giocaBancoSM` usa lo stesso mazzo). Vale per Bisca, serate nel Casinò privato e sfide.
- **Proposta:** in `vista()` aggiungere `delete v.manoSM;` (la versione pulita esiste già in `v.notte.manoSM`, senza mazzo). In più, in `index.ts` togliere per sicurezza `manoSM` dalla vista. Lavoro: **piccolo**. Poi pubblicare il server.
- **Decisione di Nicola:** NO.

### ON-02 — Chi esce dalla partita non può più rientrare
- **Gravità:** ALTA
- **Dove:** `server/index.ts`, comando `entra`: prima controlla `if (partita.in_corso) → "La partita è già iniziata."` e solo dopo controlla se sei già un giocatore (`gia`). `gioco.js:1644` dice invece: "Potrai rientrare solo se qualcuno ti manda di nuovo il codice."
- **Come si vede:** leggendo il codice: tasto "Esci" → si cancella `laguna_online` dal browser → per tornare serve il codice → il server risponde "La partita è già iniziata" anche se il tuo account è proprio quello di quel posto. Stessa cosa se il browser perde i dati (pulizia cache, Safari che cancella i dati dei siti non visitati da 7 giorni, finestra privata). Nel gioco non c'è nemmeno una lista "Le mie partite" (la funzione `laguna.mie_partite()` esiste già nel database ma il browser non la usa).
- **Proposta:** (a) in `entra` spostare il controllo `gia` PRIMA di `in_corso` (5 righe, **piccolo**); (b) nella schermata iniziale mostrare "Le tue partite in corso" usando `partite_pubbliche` (**piccolo-medio**). Per giocare dallo stesso posto su un altro dispositivo (PC e telefono) serve una decisione (vedi domanda).
- **Decisione di Nicola:** SÌ (solo per l'altro dispositivo).
  Domanda: "Se vuoi continuare la partita dal telefono invece che dal computer, come preferisci rientrare?"
  1) Un **codice personale di rientro** (es. FISTA-7391) che il gioco ti mostra e che scrivi sull'altro dispositivo.
  2) Entri con la tua **email** (ti arriva un link), così sei tu su ogni dispositivo.
  3) Va bene così: si gioca sempre dallo stesso dispositivo.

### ON-03 — Un giocatore assente blocca la partita per tutti
- **Gravità:** ALTA
- **Dove:** `server/index.ts` (nessun comando per "salta turno" o "sostituisci con il computer"); motore: di giorno nessun tempo massimo per il turno (la notte invece ha l'orologio di 120 s per ora).
- **Come si vede:** nella partita vera adesso tocca a fista con i dadi già tirati: finché fista non preme "Fine turno", Sabri non può fare niente (i bot giocano solo quando tocca a loro). Se un amico chiude il browser durante il suo turno, tutti aspettano per sempre.
- **Proposta:** un "tempo massimo del turno" di giorno (es. 2-3 minuti, con conto alla rovescia visibile) e/o un tasto per chi ha creato la partita: "Fai giocare il computer al posto di X" (il campo `bot` e la strategia esistono già, basta cambiarli sul giocatore assente e farlo tornare umano quando rientra). Lavoro: **medio**.
- **Decisione di Nicola:** SÌ.
  Domanda: "Se un amico sparisce a metà partita, cosa deve succedere?"
  1) Dopo qualche minuto **il computer gioca al suo posto** (prudente) finché non torna.
  2) Il suo turno viene **saltato** dopo qualche minuto, ma non perde niente.
  3) **Chi ha creato la partita decide** con un tasto (aspettare / far giocare il computer).
  4) Si aspetta sempre (come ora).

### ON-04 — Le regole cambiano a metà partita; nessun controllo "browser = server"
- **Gravità:** ALTA
- **Dove:** funzione Supabase (versioni) e `server/index.ts` (import fissato a un commit); `index.html` carica `motore.js?v=65` da GitHub Pages.
- **Come si vede:** log delle funzioni: durante la partita vera (iniziata alle 20:01 UTC del 17/11) il server è stato ripubblicato come v36 (21:10), v37 (22:02), v38 (22:11), v39 (22:19), v40 (22:24), v41 (22:25), v42 (22:31); ora è v49. Nella storia git ci sono periodi in cui il server è stato tenuto apposta su un motore più vecchio del browser ("Server: resta sul motore c79c36a" mentre il browser aveva già 441c8ec/b7dac01): in quei momenti il telefono può mostrare costi/regole diversi da quelli che il server applica. Oggi sono identici (vedi "Cosa funziona bene"), ma nessuno lo controlla in automatico: il motore non ha un numero di versione.
- **Proposta:** (a) aggiungere `VERSIONE` dentro `motore.js` (es. "65"); il server la scrive nella vista; il browser la confronta con la sua e, se diversa, mostra "È uscita una versione nuova: ricarica la pagina" (**piccolo**). (b) Salvare nello stato la versione con cui è nata la partita e avvisare quando le regole cambiano (**piccolo**). (c) Tenere `equivalenza.js` come prova da lanciare prima di ogni pubblicazione del server (**piccolo**).
- **Decisione di Nicola:** SÌ.
  Domanda: "Quando miglioriamo il gioco mentre una partita è in corso, cosa preferisci?"
  1) **Le partite in corso si aggiornano subito** (come ora) con un avviso nella Gazzetta: "Da stasera cambia la regola X".
  2) **Le partite in corso restano con le regole con cui sono nate**; le novità valgono solo per le partite nuove (più lavoro: serve tenere più versioni del server).
  3) Si aggiornano, ma **solo all'inizio di un nuovo Ciclo**, mai a metà di una notte o di un turno.

### ON-05 — Troppi dati scaricati (telefono lento, limiti di Supabase)
- **Gravità:** MEDIA-ALTA
- **Dove:** `gioco.js:176-178` (`setInterval(caricaVista, 8000)` scarica sempre tutta la vista) e `gioco.js:161` (`select("vista,versione")` senza guardare la versione); server: ogni mossa scrive lo stato + una vista intera per ogni giocatore.
- **Come si vede:** partita vera: viste di 112-115 KB, stato 164 KB, 769 versioni. Ogni giocatore riceve ~115 KB per ogni versione (≈ 88 MB) + 115 KB ogni 8 s di polling (3 ore ≈ 1.350 richieste ≈ 155 MB). Con 8 giocatori il server scrive ~1 MB per ogni mossa (misurato con tempi.js: mediana 969 KB, massimo 1.080 KB), e calcolare le 8 viste prende in mediana 51 ms (punte di 0,5 s).
- **Proposta:** (a) il polling chiede solo il numero `versione` (pochi byte) e scarica la vista solo se è cambiata; polling ogni 15-20 s visto che c'è già Realtime (**piccolo**). (b) Togliere dalla vista le cose che il giocatore non usa (es. log intero di 400 righe → ultime 60; `lotti` hanno campi ripetuti) (**medio**). (c) Più avanti: mandare solo le differenze (**grande**, non urgente).
- **Decisione di Nicola:** NO.

### ON-06 — Doppio clic = mossa mandata due volte
- **Gravità:** MEDIA
- **Dove:** `gioco.js:148-157` (`agisci` mette in fila ogni clic, anche quando la mossa precedente è ancora in viaggio, e i pulsanti restano attivi).
- **Come si vede:** tabella `azioni` della partita vera: **24 volte la stessa mossa identica mandata due volte entro 3 secondi** (permesso ×10, tira ×3, costruisci ×2, attività ×2, versa_setta, piano, fine_turno, aspetta…). Il motore le ha quasi tutte rifiutate e il giocatore ha visto un messaggio d'errore incomprensibile ("Al Municipio si va una volta per turno."). Ma per le azioni ripetibili (investi, compra oggetto, regala, versa nella setta) il secondo clic **paga due volte**: in un caso `versa_setta` doppio è stato fermato solo perché gli sporchi erano finiti. 3 volte anche "avanti" doppio accettato (rischio di saltare un'ora di notte senza volerlo).
- **Proposta:** mentre una mossa è in viaggio, disattivare i pulsanti (o ignorare un clic uguale entro 1,5 s); mandare con ogni mossa un numero unico così il server può scartare i doppioni. Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-07 — I bot rivelano i loro segreti nella vista
- **Gravità:** MEDIA
- **Dove:** `bot.js` scrive "promemoria" dentro la scheda del giocatore (`_n`, `_lavaCiclo`, `_tradCiclo`, `_fondaCiclo`, `_investito`, `botGrandi`, `_invCiclo`); `vista()` e `vistaSicura()` non li tolgono.
- **Come si vede:** falle.js: nella vista di un umano, la scheda di ogni bot contiene `_n: {visti:["palazzo","marina"], ric:false, corr:false…}` = **dove è andato il bot stanotte**, se ha **riciclato al casinò** (`ric`), se ha corrotto (`corr`); `_lavaCiclo` = ha lavato soldi nella setta in questo Ciclo. Nella partita vera è visibile, per esempio, che i bot Costruttore e Investitore sono stati a palazzo e alla Marina. Contraddice "di notte non si sa chi c'è in un locale".
- **Proposta:** in `vista()` cancellare dagli altri giocatori tutte le chiavi che iniziano con `_` più `botGrandi` (meglio ancora: passare a una **lista di campi ammessi** invece di una lista di campi vietati, così un campo nuovo non sfugge più). Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-08 — Due amici che entrano insieme possono prendersi lo stesso posto
- **Gravità:** MEDIA
- **Dove:** `server/index.ts`, `entra`: cerca il primo posto libero e poi lo aggiorna senza controllare che sia ancora libero (`update(...).eq("player_id", …)` senza `.is("user_id", null)`).
- **Come si vede:** se due amici cliccano il link di WhatsApp nello stesso secondo, ricevono lo stesso posto; il secondo sovrascrive il primo. Il primo vede "(tu)" su un posto che non è più suo e le sue mosse daranno "Non giochi in questa partita".
- **Proposta:** aggiungere `.is("user_id", null)` all'update e, se non aggiorna nessuna riga, riprovare col posto libero successivo. Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-09 — "Un altro giocatore ha appena agito: riprova" e mossa persa
- **Gravità:** MEDIA (cresce con più amici di notte)
- **Dove:** `server/index.ts` (409 se nel frattempo qualcuno ha scritto) e `gioco.js:153-154` (un solo nuovo tentativo).
- **Come si vede:** 3 conflitti nella partita vera con solo 2 persone. Di notte agiscono tutti insieme e ogni mossa dura ~0,5 s tra lettura e scrittura: con 4-6 amici i conflitti aumentano; al secondo conflitto la mossa si perde e compare il messaggio.
- **Proposta:** far riprovare il **server** da solo (rileggere lo stato e riapplicare la mossa, fino a 4-5 volte) invece del browser. Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-10 — La vista può tornare indietro per un attimo
- **Gravità:** BASSA-MEDIA
- **Dove:** `gioco.js` `riceviVista` non guarda il numero di versione; sul server `salvaViste` scrive le viste senza controllare di non sovrascrivere una versione più nuova.
- **Come si vede:** dal codice: se la lettura periodica (partita prima) arriva dopo l'aggiornamento Realtime (più nuovo), lo schermo torna allo stato vecchio fino al prossimo aggiornamento (fino a 8 s). Sul server, con due mosse quasi insieme, la scrittura delle viste della mossa più vecchia può arrivare dopo quella più nuova. Nella partita vera oggi le 5 viste sono tutte alla versione giusta (769), quindi non è successo in modo permanente.
- **Proposta:** il browser ignora una vista con `versione` minore di quella che ha; il server scrive le viste solo se `versione` è maggiore (upsert condizionato o funzione SQL). Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-11 — Chi ha creato la partita può ricominciarla da capo
- **Gravità:** MEDIA
- **Dove:** `server/index.ts`, `inizia`: non controlla se la partita è già in corso.
- **Come si vede:** dal codice: una seconda chiamata "inizia" crea uno stato nuovo e rimette la versione a 1, cancellando la partita in corso (anche per sbaglio con un doppio clic su "Inizia", che non viene disattivato durante l'attesa).
- **Proposta:** `if (partita.in_corso) return errore`, e disattivare il pulsante dopo il primo clic. Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-12 — La notte avanza solo se qualcuno è collegato
- **Gravità:** BASSA
- **Dove:** `gioco.js:1284` (il browser manda `tempo_scaduto`); il server non ha un orologio suo che faccia avanzare l'ora.
- **Come si vede:** se di notte tutti chiudono il browser, l'ora resta ferma; quando qualcuno rientra riparte. In più, finito il tempo, ogni browser collegato manda `tempo_scaduto` ogni 4 s (scritture inutili e conflitti). Va bene per il gioco tra amici, ma va saputo.
- **Proposta:** per ora niente; eventualmente un controllo programmato su Supabase (cron) ogni minuto. Lavoro: **medio**.
- **Decisione di Nicola:** NO.

### ON-13 — Nomi senza limiti all'ingresso
- **Gravità:** BASSA
- **Dove:** `server/index.ts`, `entra`: `nome: body.nome ?? …` senza `String(...).slice(0, 30)` (in `crea` invece c'è).
- **Come si vede:** dal codice: un nome lunghissimo o non di testo finisce nello stato e in tutte le viste. Il browser usa bene `esc()` (non ho trovato punti dove un nome venga mostrato senza protezione), quindi niente codice cattivo, ma si può gonfiare la partita.
- **Proposta:** `String(body.nome ?? "").trim().slice(0, 30) || liberi[0].nome`. Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-14 — Due errori di programma con dati strani
- **Gravità:** BASSA
- **Dove:** azione `contratto` senza il campo `contratto` ("Cannot read properties of undefined (reading 'a')") e `corrompi` con id inesistente ("…reading 'length'").
- **Come si vede:** fuzz.js. Il server risponde "Errore del server" (500) e non salva niente, quindi nessun danno; il gioco normale non manda mai questi dati.
- **Proposta:** controllare i parametri all'inizio delle due funzioni con `err("…")`. Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-15 — La partita "da solo" nasconde meno cose di quella online
- **Gravità:** BASSA
- **Dove:** `locale.js:11-21`: la sua `vistaSicura` non toglie `licenzaNegata`, `trucchi` e non nasconde le stanze segrete; quella del server sì.
- **Come si vede:** confronto dei due file. Non è una falla (sono bot), ma le prove fatte "da solo" non mostrano esattamente quello che vedrà un giocatore online.
- **Proposta:** spostare `vistaSicura` dentro `motore.js` e usarla sia in `locale.js` sia nel server (una sola copia). Lavoro: **piccolo**.
- **Decisione di Nicola:** NO.

### ON-16 — Avvisi di sicurezza di Supabase (nessuno grave per la Laguna)
- **Gravità:** BASSA
- **Dove:** consulente di sicurezza Supabase.
- **Come si vede:** segnala `laguna.partite_pubbliche` come "SECURITY DEFINER view" (ERRORE): l'ho controllata, mostra solo id/codice/in_corso/finita/creata_il delle **tue** partite, quindi non espone segreti. Segnala anche, fuori dal mio settore ma nello stesso progetto Supabase, le funzioni `public.room_create/room_get/room_join/room_save` (probabilmente del gioco Re di Belluno) **chiamabili da chiunque senza accesso**: chi conosce un codice stanza può sovrascriverne lo stato.
- **Proposta:** per la Laguna: trasformare la vista in `security_invoker` con una regola RLS su `partite` solo per quelle colonne (**piccolo**, facoltativo). Per le `room_*`: avvisare chi segue Re di Belluno.
- **Decisione di Nicola:** NO.

---

## Numeri utili
- Server: funzione `laguna` v49, motore a8f7fef (= sito v65). Durata mossa: media 543 ms, p95 743 ms, max 1,1 s (log 24 h).
- Partita vera: versione 769, Ciclo 14 Giorno 3, 5 giocatori (fista, Sabri, 3 computer), stato 164 KB, viste ~115 KB l'una.
- Errori registrati nella partita vera (tabella azioni): 43 mosse rifiutate dal motore, di cui 24 doppi clic; nessun errore del server.
