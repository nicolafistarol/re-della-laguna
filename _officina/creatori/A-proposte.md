# Creatore A — l'Inventore. Proposte per dare un SENSO a "Re della Laguna"

Scritto dopo aver letto motore.js, gioco.js e bot.js (versione v65). Non ho toccato niente nel gioco.
Tutti i nomi di funzioni e campi citati esistono davvero nel motore, salvo dove scrivo "nuovo".

---

## 0. Cosa ho visto nel gioco di oggi (in breve)

Il gioco ha tantissime cose. Ma tre problemi di fondo:

1. **Si vince solo coi soldi.** `fine()` ordina per `patrimonio`. I titoli (La Stella, Mani Pulite, Gran Burattinaio) sono solo una riga in fondo. Quindi tutto quello che fai serve a una cosa sola: fare soldi.
2. **Gli altri giocatori sono quasi degli sconosciuti.** Li tocchi solo così: affitti, aste, una foto, una denuncia, un articolo, la setta. Sono colpi singoli. Non nasce mai un *rapporto* che dura (un debito, un patto, un segreto condiviso).
3. **L'illegale paga solo in soldi.** `N.bonusIllegale = 1.4`, i guadagni delle `OCCASIONI`, il Grande Colpo: sempre milioni sporchi. L'unica eccezione vera è la setta (operazioni, Grandi Opere). Chi fa il criminale da solo non ottiene "poteri", ottiene un numero più grande.

Cose belle che già esistono e che uso come base (non invento da zero):
- le **Prove** (`p.prove`), che oggi servono solo a `denuncia()`;
- il **pedinamento** (`incontro` tipo "segui", `N2.segue`), che oggi dice solo dove va uno;
- le **piste** (`piste(s,p)`), che spiegano sempre perché ti scoprono;
- i **Cicli puliti** (`p.pulitoCiclo`), che oggi servono solo a far scendere lo stato di polizia;
- l'app **"Da scoprire"** (`SCOPERTE`), perfetta per sbloccare le funzioni nuove con un indizio, senza menu;
- la **Rubrica** (app già presente), che può diventare il posto dove vedi i tuoi legami con gli altri;
- i **nascondigli** della setta (`seppellisci`, `scava`, `p.nascondigli`): chi ti segue scopre dove scavi. È già un piccolo gioiello.

---

## 1. IL SENSO DEL GIOCO

### La frase che lo riassume

> **"La Laguna è piccola. Per diventare Re non basta essere ricco: devi arrivare all'ultima Alba ancora in piedi, in una città dove tutti sanno qualcosa di te."**

Oggi giochi *accanto* agli altri. Io propongo che giochi *intrecciato* agli altri.
I soldi restano il punteggio (non cambio come si vince). Ma **i soldi diventano il risultato, non il mezzo**. Il mezzo sono tre cose che non sono soldi:

- **Segreti** — cosa sai degli altri (e cosa loro sanno di te).
- **Favori** — cosa gli altri ti devono (e cosa devi tu).
- **Accessi** — posti, persone e mosse che solo tu puoi usare.

### Le due strade danno poteri diversi, non stipendi diversi

| | Vita sporca | Vita pulita |
|---|---|---|
| Ti dà | **potere nascosto**: sai, ricatti, ti nascondi, pieghi le regole | **potere pubblico**: indaghi, blocchi, proteggi, decidi alla luce del sole |
| Come si paga | Tracce, piste, complici che parlano | tempo, fama, e la rinuncia agli affari grossi |
| Come si perde | ti scoprono (sempre per un motivo) | ti sporchi anche una volta sola |

Così la scelta non è "rischio per più soldi". È **"che tipo di potente voglio essere?"**

### L'arco di una partita: tre atti (2 ore)

I tre atti esistono già quasi da soli, basta dar loro un nome e farli sentire:

- **Atto I — Gli Arrivi** (primi Cicli, Livello 0-1). Compri, costruisci, impari. Nessuno ha ancora niente su nessuno. *Nasce l'Ambizione segreta di ognuno (dinamica 12).*
- **Atto II — Gli Intrecci** (Cicli centrali, Livello 2-3). Si aprono le funzioni nuove. Nascono i primi Favori, i primi ricatti, i primi complici. *Il Mistero della Laguna comincia a venire a galla (dinamica 11).*
- **Atto III — La Resa dei conti** (esiste già: `annunciaResa`). Tutti i fili si tirano: chi incassa i Favori, chi brucia le Prove, chi tradisce il complice. L'ultima notte deve essere la più tesa.

### Cosa rende ogni partita una storia diversa

1. Il **Mistero della Laguna** cambia a ogni partita (dinamica 11).
2. L'**Ambizione segreta** di ognuno cambia (dinamica 12).
3. I **legami** tra i giocatori (Favori, ricatti, complici) nascono da quello che è successo davvero. Non sono mai uguali.
4. Alla fine la **Cronaca** racconta la partita come una storia, non come una classifica.

### Cosa lega i giocatori

La **Rubrica** diventa "I miei fili". Per ogni altro giocatore vedi: cosa ti deve, cosa gli devi, cosa sai di lui, cosa (forse) sa di te. È la schermata che dice a colpo d'occhio: *con questa persona ho una storia.*

---

## 2. LE 12 DINAMICHE

Legenda lavoro: **piccolo** = poche ore, **medio** = un paio di giorni, **grande** = una settimana o più.
Sei sono ricompense della vita sporca (2-7), tre sono esclusive della vita pulita (8-10), tre sono di tutti e danno il senso (1, 11, 12).

---

### 1. I FAVORI — *di tutti: è la colla tra i giocatori*

**Cosa fa.** Un Favore è una promessa che il gioco fa rispettare una volta: non sono soldi, è una *mossa* che l'altro ti deve.

**I quattro Favori possibili** (pochi, facili da ricordare):
- **Il Voto** — alle prossime elezioni o al voto di una Grande Opera, il suo voto va dove dici tu.
- **La Porta aperta** — una volta, passi su un suo terreno senza pagare l'affitto.
- **Il Silenzio** — brucia una Prova che ha contro di te.
- **La Mano** — una notte viene dove gli dici tu, all'ora che dici tu (serve per i colpi a due, i riti, gli alibi).

**Esempio raccontato.** Tua sorella è al Faro per 4 turni. Tu sei Sindaco e hai l'Amnistia. Le scrivi: "Ti tiro fuori. Mi devi un Voto." Lei accetta. Due Cicli dopo ci sono le elezioni: lei è più famosa di te e si è candidata. Tu incassi il Favore. La sua fama, in quella elezione, conta per te. La Gazzetta scrive: "Colpo di scena: X ritira la candidatura e appoggia Y." Lei ti odia. Ma lo sapeva.

**Come si sblocca.** Subito, dal Livello 1. Il primo Favore nasce da solo: la prima volta che fai un regalo (`regala`) o accetti un drink (`incontro` tipo "drink"), Vera ti dice: "Potevi chiedergli qualcosa in cambio."

**Rischio / contromossa.** Chi deve un Favore può **rifiutarsi di pagarlo**: ma allora tutti lo leggono sulla Gazzetta ("X non mantiene la parola") e perde fama, e per 2 Cicli nessuno può accettare Favori da lui. Un Favore si può anche **vendere** a un terzo giocatore (e qui nascono le sorprese).

**Aggancio al motore.** I contratti esistono già (`proponiContratto`, `rispondiContratto`, `scadenzeContratti`): oggi hanno solo `pagoOra`, `pagoDopo`, `lottoCeduto`. Aggiungo un campo nuovo `favore` (uno dei 4 tipi). Stato nuovo `s.favori` (chi deve cosa a chi). Il Voto si aggancia a `elezioni()` (somma della fama) e a `votaOpera()`. La Porta aperta si aggancia a `atterra()` dove calcola `affitto()`. Il Silenzio toglie una voce da `p.prove`. La Mano usa lo stesso meccanismo di `convoca()`/`convocazioneDi()`.

**Lavoro.** Medio.

**Bot.** Accettano un Favore se quello che ricevono vale più del rischio (stessa logica di `rispostaInvito` in bot.js). Lo pagano quasi sempre; i bot "sporchi" 1 volta su 5 non pagano. Incassano il Voto quando si candidano e la Porta aperta sull'affitto più caro.

---

### 2. IL RICATTO — *vita sporca · modo di influenzare gli altri*

**Cosa fa.** Invece di denunciare un rivale con una Prova, gliela mostri: da quel momento lui ti deve un Favore a ogni Ciclo, finché tieni la Prova.

**Esempio raccontato.** Di notte al Porto fotografi Marco mentre scarica il peschereccio. Hai una Prova. Oggi puoi solo denunciarlo (+35 Tracce a lui, e fine). Con il Ricatto gli mandi un messaggio dal telefono usa-e-getta: *"So del peschereccio."* Lui non sa chi sei. Ogni Alba riceve la tua richiesta: stavolta "la Porta aperta" sul suo hotel in Isola Corona. Marco ha tre strade: obbedire, rischiare la denuncia, oppure scoprire chi sei.

**Come si sblocca.** La prima volta che hai una Prova e **non** la denunci per un Ciclo intero. Vera: "Una Prova consegnata vale una volta. Una Prova tenuta in tasca vale tutte le notti."

**Rischio (chiaro, scritto prima di confermare).** Il ricatto è un reato: +6 Tracce a ogni richiesta, gravità "media" (`peggiorReato`). Senza telefono usa-e-getta il ricattato sa subito chi sei.

**Contromosse del ricattato (ognuna ha un motivo).**
- **Scoprirti**: ogni richiesta lascia un indizio vero su di te ("la voce era di qualcuno che sta in Baia Flamingo", "aveva una macchina fotografica al Porto il Ciclo 4"). Dopo 3 indizi sa chi sei.
- **Rubare la Prova**: se ti pedina (`segui`) e scopre dove dormi, può venire al tuo Palazzo di notte quando non ci sei. Se hai il Caveau, non ci riesce.
- **Denunciarti**: se sa chi sei, la sua parola diventa una Prova contro di te.
- **Togliersi il motivo**: se viene assolto o condannato, la Prova non vale più niente.

**Aggancio al motore.** `p.prove` (oggetto `{su, ciclo, cosa}`: aggiungo `mostrata: true`), `denuncia()` resta come minaccia finale, oggetto `telefono` già in `OGGETTI` (salva da "intercettazione"), `privato()` per i messaggi, `MITTENTI` in gioco.js ha già "Numero sconosciuto". Le richieste usano i Favori della dinamica 1. La pista per chi ricatta entra in `piste()` come voce nuova "ricatto".

**Lavoro.** Medio (dopo la dinamica 1).

**Bot.** Un bot con una Prova ricatta se il bersaglio è più ricco di lui, altrimenti denuncia. Un bot ricattato obbedisce 2 volte, poi prova a scoprire chi è. I bot non ricattano mai il giocatore in modalità guidata nei primi 3 Cicli.

---

### 3. LA CIMICE — *vita sporca · informazioni sugli altri*

**Cosa fa.** Nascondi una cimice addosso a un rivale: per 2 Cicli leggi il suo "Com'è andata" della notte, come se fosse il tuo.

**Esempio raccontato.** Al Mercato Nero compri una cimice. Alle 23 sei al Club Neon e c'è Giulia. Le offri un drink: lei accetta, e mentre brinda la cimice finisce nella sua borsa. La notte dopo, nel tuo telefono, appare una pagina nuova: *"Giulia — 00:00 arriva al Porto. 01:00 carica gli orologi. 02:00 torna a casa con 2 milioni sporchi."* Ora sai dove sarà domani notte. E puoi essere lì con la macchina fotografica.

**Come si sblocca.** Dopo che hai usato almeno una volta il disturbatore radio in un affare. Al Mercato appare un venditore nuovo: "Tu di radio te ne intendi."

**Rischio.** La cimice è un oggetto illegale in valigetta (sparisce nelle perquisizioni). Piazzarla: 1 volta su 4 la vittima sente "qualcosa nella borsa" e la trova. Se la trova, **ha una Prova contro di te** (sa che eri lì: è il motivo).

**Contromossa.** Chi ha la **Sala insonorizzata** nel Palazzo è immune a casa sua. Chiunque può fare la "bonifica" al Mercato (costa, prende un'ora). E chi sospetta può usarla al contrario: fare apposta una cosa finta per attirarti in una trappola.

**Aggancio al motore.** Nuovo oggetto in `OGGETTI` (`dove: "mercato"`, `illegale: true`). Si piazza con `incontro` (stesso controllo `quiConMe`) o quando sei ospite a una serata (`N2.ospite`). Quello che leggi è già scritto: `s.notte.racconto[idVittima]`. In `vista()` basta aggiungere il racconto della vittima a chi ha la cimice attiva (campo nuovo `p.cimici = [{su, fino}]`). Attenzione: `vista()` non deve modificare lo stato.

**Lavoro.** Medio.

**Bot.** I bot sporchi la comprano dal Livello 2 e la mettono al giocatore più ricco. Usano quello che sentono per andare a fotografarlo la notte dopo. 1 bot su 3 fa la bonifica quando gli sale lo stato di polizia senza capire perché.

---

### 4. LE GROTTE — *vita sporca · luogo segreto*

**Cosa fa.** Un posto della notte che sulla mappa non c'è: lo conosce solo chi l'ha trovato, e lì dentro la polizia non arriva.

**Cosa ci fai (funzioni, non soldi).**
- **Nascondi** soldi sporchi e oggetti: le perquisizioni all'Alba non li trovano.
- **Passi sotto**: dalle Grotte arrivi in 1 ora alla Marina, al Porto o alla Villa, e nessuno ti vede partire.
- **Sparisci**: se ti condannano mentre sei lì, puoi restare latitante un Ciclo (niente Faro, ma non puoi usare il Palazzo né muoverti di giorno).
- **Ti incontri**: è l'unico posto dove due giocatori possono scambiarsi oggetti e Prove senza testimoni.

**Esempio raccontato.** Alla Marina arriva la Guardia Costiera. Tu hai il motoscafo e sparisci nel buio. Stavolta però il racconto continua: *"Dietro lo scoglio c'è un'apertura nella roccia. Dentro, una scala bagnata e una lampada accesa."* Nel telefono compare un posto nuovo, solo sul tuo. Tre Cicli dopo, tua sorella ti pedina per caso. Vede che vai "verso la scogliera". Ora le Grotte le conosce anche lei. E dentro c'è il tuo milione.

**Come si sblocca.** Scappando da un pericolo "guardia" con il motoscafo (già previsto in `PERICOLI.guardia.salvo`). Oppure pedinando chi ci va. Oppure comprando l'informazione da chi la sa (un Favore).

**Rischio.** Ogni notte passata lì scalda il posto come tutti gli altri (`p.calore`). Se il calore arriva a 3, la polizia trova l'ingresso: tutto quello che è nascosto viene sequestrato e **tutti** quelli che conoscono le Grotte prendono Tracce. Quindi più gente lo sa, più è pericoloso. Il segreto va protetto.

**Contromossa.** Pedinare (`segui`). Rubare quello che c'è nascosto (come `scava()` oggi: metà bottino, molte Tracce). Fare una soffiata alla polizia.

**Aggancio al motore.** Nuovo luogo in `LUOGHI` con `sblocco` alto, aperto in `luogoAperto()` solo se `p.segreti.grotte` è vero (stessa eccezione che c'è già per il Faro e chi è in setta). Il nascondiglio copia `seppellisci`/`scava`/`p.nascondigli` (che oggi esistono solo per il Gran Maestro). Il pedinamento è in `risolviOra` (riga del `N2.segue`). Le perquisizioni: una riga in `perquisizioni()`.

**Lavoro.** Medio-grande (serve anche la scena).

**Bot.** Un bot che scopre le Grotte ci nasconde gli sporchi quando `rischioPerquisizione` supera il 15%. Non ci torna due notti di fila. Un bot che pedina e le scopre, 1 volta su 2 ruba e 1 volta su 2 tiene il segreto per chiedere un Favore.

---

### 5. IL PRESTANOME — *vita sporca · possibilità nuova*

**Cosa fa.** Compri un terreno a nome di un altro: sulla mappa risulta di "Società Anonima", nessuno sa che è tuo, e se ti condannano non te lo sequestrano.

**Esempio raccontato.** A Isola Corona c'è un gruppo di tre vie. Marco ne ha due. La terza la compra una "Società Anonima". Marco paga l'affitto ogni volta che ci passa e non sa a chi. Sospetta di Giulia. Litigano. In realtà sei tu. Al Ciclo 9 Marco compra la Terrazza col cannocchiale, guarda dove vanno i soldi, e la Gazzetta titola: *"Dietro la Società Anonima c'è…"*

**Come si sblocca.** Dopo aver comprato il banchiere Lenz (`p.corrotti.banchiere`) e aver ripulito almeno una volta. Lenz: "Hai mai pensato di non esistere?"

**Rischio.** Il prestanome prende una parte della rendita. E parla: ogni Alba entra nelle piste come un complice (`pistaComplice`). Se il banchiere finisce sotto inchiesta (`affariInterni`), il nome esce.

**Contromossa.** Chi ha una Prova contro di te, o l'osservatorio, o fa un'Inchiesta (dinamica 8), può **smascherare** la Società: il terreno va all'asta del Comune (`avviaAstaSequestro` esiste già) e tu prendi Tracce.

**Aggancio al motore.** Campo nuovo sul lotto: `l.prestanome = true`. In `vista()` l'owner viene nascosto agli altri (c'è già la lista dei campi privati alla riga della `vista`). `flusso()` ha già il parametro `pubblico`: basta metterlo falso. In `condanna()` i lotti col prestanome saltano `sequestra()`. Rispetta la decisione di Nicola: "soldi nascosti per affari loschi".

**Lavoro.** Medio-grande (tocca la mappa 3D: il cartello del lotto).

**Bot.** I bot sporchi lo usano solo per completare un gruppo di vie di un rivale (per dare fastidio) o per salvare il loro lotto migliore prima della Resa dei conti.

---

### 6. LA DIVISA AMICA — *vita sporca · cambiare le regole (sul tabellone, di giorno)*

**Cosa fa.** Se hai comprato un poliziotto, di giorno puoi dirgli dove mettere il prossimo Posto di blocco.

**Esempio raccontato.** Sai (dalla cimice) che Giulia gira con 3 milioni sporchi. Di giorno, nel tuo turno, tocchi una casella dell'isola dove hai l'agente: compare una transenna. Chi ci finisce sopra viene controllato come al Posto di blocco vero. Giulia tira i dadi. Tutti guardano. Fa 7. Si ferma una casella prima. Respira. Adesso però sa che qualcuno ce l'ha con lei.

**Come si sblocca.** Dopo 2 Cicli di fila con lo stesso agente a libro paga in un'isola.

**Rischio.** La transenna è visibile a tutti (non il nome di chi l'ha chiesta). Vale per **tutti**, anche per te se ci finisci sopra con le Tracce alte. L'agente rischia di più: il suo `rischioContatto` sale, e se lo beccano la pista porta a te.

**Contromossa.** I documenti falsi funzionano come al Posto di blocco vero. Il Sindaco può far togliere la transenna. Chi ha il Commissario batte chi ha un agente.

**Aggancio al motore.** `postoDiBlocco(s,p)` esiste e fa già tutto. Serve solo: campo nuovo `s.transenna = {pos, fino}` e in `atterra()` una riga "se `p.pos === s.transenna.pos` chiama `postoDiBlocco`". Chi può: `p.corrotti["agente_" + isola]`. In 3D è un oggetto in più sulla casella.

**Lavoro.** Piccolo. È la dinamica con il miglior rapporto effetto/lavoro: porta la notte dentro il giorno e fa urlare il tavolo.

**Bot.** Un bot la mette davanti al giocatore con lo stato di polizia più alto, a 6-8 caselle di distanza (le più probabili coi dadi).

---

### 7. IL COLPO A DUE e I COMPLICI — *vita sporca · lega i giocatori*

**Cosa fa.** Certi colpi grossi si fanno solo in due: uno entra, l'altro fa il palo in un altro posto, alla stessa ora. Chi ci riesce diventa **complice** dell'altro.

**Cosa ti dà essere complici (funzioni).**
- Vi passate oggetti della valigetta anche a distanza.
- Potete darvi l'**alibi**: "era con me" toglie una pista di luogo all'altro (una volta per Ciclo).
- Vedete lo stato di polizia l'uno dell'altro.

**Esempio raccontato.** Il Colpo alla villa. Tu entri alle 02:00. Tuo cugino, alla stessa ora, deve essere alla Redazione a tenere occupata la giornalista. Vi mettete d'accordo a voce. Lui arriva in ritardo di un'ora: l'allarme suona e tu sei dentro. Oppure arriva puntuale, tutto fila, e da quel momento siete legati. Fino all'ultima notte, quando uno dei due può scegliere "Parla con il Commissario".

**Come si sblocca.** Al Livello 2 compare la prima occasione "a due" (la riconosci perché dice: "Da solo non ce la fai").

**Rischio.** Il complice **sa tutto di te**. Se viene condannato, 1 volta su 2 fa il tuo nome (pista "complici", `N.pistaComplice` esiste già). Se tradisce apposta, ottiene uno sconto di pena e tu prendi una Prova contro.

**Contromossa.** "Scaricare" il complice per tempo (come `scaricaContatto` oggi per i personaggi). Tenere una Prova contro di lui come assicurazione.

**Aggancio al motore.** `OCCASIONI` ha già `pericoli`; aggiungo `palo: {luogo, ...}`. In `risolviOccasione()` controllo se un altro giocatore ha scelto "fai il palo" in quel luogo in quell'ora (`N2.dove`, `N2.ora`). Campo nuovo `p.complici = [id]`. La pista usa quella dei complici già scritta in `piste()`. La "Mano" dei Favori serve proprio a questo.

**Lavoro.** Medio.

**Bot.** Accettano di fare il palo se il rischio loro è basso e se devono un Favore o hanno buoni rapporti. Tradiscono solo se sono Indagati (stato ≥ 3).

---

### 8. L'INCHIESTA — *vita pulita · informazioni sugli altri*

**Cosa fa.** Chi è pulito può aprire un fascicolo su un rivale: ogni Alba il gioco gli consegna un indizio **vero**, e con tre indizi pubblica la verità sulla Gazzetta.

**Perché è diversa dall'articolo pagato.** Lo scandalo pagato di oggi (`articolo` con tono "scandalo") può essere falso e ritorcersi. L'Inchiesta è vera: non si ritorce mai. Ma è lenta e si fa a viso aperto.

**Esempio raccontato.** Sei pulito da tre Cicli. Apri un fascicolo su Marco. Prima Alba: *"Marco è stato visto tre notti al Porto."* Seconda: *"Ha ripulito più soldi di quanto rendono i suoi locali."* Marco riceve da Vera: "Qualcuno fa domande su di te." Cambia zona, smette di ripulire. Terza Alba: niente indizio, si è raffreddato. Hai due indizi su tre. Pubblichi lo stesso (effetto piccolo) o aspetti?

**Come si sblocca.** 3 Cicli puliti di fila (`p.pulitoCiclo`), nessuna condanna, e uno Studio legale o fama ≥ 30.

**Rischio / costo.** Un solo fascicolo alla volta. Se ti sporchi, il fascicolo si chiude e la Gazzetta lo dice ("l'accusatore non è più credibile"). Il rivale sa che c'è un'Inchiesta (non sempre sa di chi).

**Contromossa.** Raffreddare le piste (cambiare posto, smettere di ripulire, scaricare i contatti). Comprare la giornalista. Sporcare l'accusatore: basta una Prova contro di lui.

**Aggancio al motore.** Gli indizi sono già calcolati: `piste(s, bersaglio)` restituisce le piste vere con il testo pronto. Ogni Alba ne consegno una a caso pesata (stesso metodo di `tiroIndagine`). Stato nuovo `p.fascicolo = {su, indizi: []}`. La pubblicazione usa `notizia()` e gli effetti di `titolone` "scandalo" credibile. Serve un contatore nuovo `p.cicliPuliti`.

**Lavoro.** Medio.

**Bot.** I bot puliti aprono il fascicolo su chi ha lo stato di polizia più alto o sul primo in classifica. I bot sporchi sotto Inchiesta stanno fermi un Ciclo.

---

### 9. L'ESPOSTO — *vita pulita · cambiare le regole della notte*

**Cosa fa.** Chi è pulito può chiedere alla polizia un controllo su un posto: stanotte quel posto diventa "pericoloso" per tutti.

**Esempio raccontato.** Hai capito (leggendo la Gazzetta e guardando le auto sulla mappa) che Giulia fa i suoi carichi alla Marina. Di giorno firmi un Esposto. La Gazzetta della sera scrive solo: *"Un cittadino ha segnalato movimenti sospetti. La polizia promette controlli."* Non dice dove. Giulia deve decidere: rischio o salto la notte? Se va, trova la Guardia Costiera col faro acceso. E l'indizio in scena glielo dice prima ("Un faro spazza il porto ogni pochi minuti"): può ancora andarsene.

**Come si sblocca.** 2 Cicli puliti di fila e fama ≥ 25. Si perde appena ti sporchi.

**Rischio / costo.** Un Esposto per Ciclo. Se quella notte in quel posto non succede niente di illegale, perdi fama ("allarme inutile") e per un Ciclo non puoi farne altri. Quindi devi **indovinare**, cioè osservare gli altri.

**Contromossa.** Leggere la Gazzetta. Comprare una soffiata al Mercato (`soffiata()` esiste e dice proprio il livello di pericolo). Avere il Commissario. Andare in un altro posto.

**Aggancio al motore.** `iniziaNotte()` decide `s.notte.pericolo[luogo]`; l'Esposto lo forza a "pericoloso". Gli `INDIZI` di livello 3 e `P_GUAI` fanno già il resto. Notizia con `notizia(..., "voce")`.

**Lavoro.** Piccolo.

**Bot.** I bot puliti lo fanno sul posto dove il rivale più ricco ha più `calore` (se lo conoscono da foto o pedinamenti), altrimenti sul Porto. I bot sporchi comprano la soffiata se la Gazzetta parla di un Esposto.

---

### 10. LE CHIAVI DELLA CITTÀ — *vita pulita · potere pubblico*

**Cosa fa.** Il cittadino più stimato riceve le Chiavi: può mettere un **veto** per Ciclo su un permesso, una licenza o una legge, e sceglie un'**opera pubblica** che cambia un'isola.

**Esempio raccontato.** Marco chiede la licenza per il Casinò. Sul tuo telefono arriva: "Il Municipio chiede il tuo parere." Dici no. Marco lo sa (è pubblico). Può aspettare un Ciclo, convincerti (un Favore?), oppure passare dalla porta di servizio: la busta all'assessore, con le Tracce che ne vengono. Intanto tu fai costruire il Teatro a Borgo Ambra: sale il valore di tutta l'isola, per tutti quelli che ci hanno un terreno. In 3D compare l'edificio con il tuo nome.

**Come si sblocca.** Le Chiavi le ha **un solo giocatore alla volta**: quello con più fama tra chi non ha condanne e ha almeno 3 Cicli puliti. Passano di mano all'Alba.

**Rischio / costo.** Sei un bersaglio: basta una Prova contro di te o una condanna e le perdi con uno scandalo doppio. Un veto usato male ti fa dei nemici.

**Contromossa.** `bustaLicenza` e `regaloAssessore` esistono già: sono la via sporca per saltare il veto. Uno scandalo vero (Inchiesta) te le toglie. Superarti in fama.

**Aggancio al motore.** `chiediPermesso()` e `chiediLicenza()` hanno già gli esiti "rimandato/negato": il veto forza "negato". `legge()` del Sindaco: il veto la blocca una volta. L'opera pubblica alza `s.valore[isola]` (come fanno già `regista()` e `controllaValoreLusso`). Stato nuovo `s.chiavi = idGiocatore`. Si affianca al Sindaco senza doppiarlo: il Sindaco **fa**, le Chiavi **fermano**.

**Lavoro.** Medio.

**Bot.** Il bot con le Chiavi mette il veto sulla licenza del casinò del primo in classifica e sceglie l'opera nell'isola dove ha più terreni.

---

### 11. IL MISTERO DELLA LAGUNA — *di tutti · ogni partita è una storia diversa*

**Cosa fa.** Ogni partita nasconde un segreto diverso, che esce a pezzi; chi lo ricompone per primo ottiene un potere unico per quella partita.

**Esempi di Misteri** (ne bastano 5-6 per cominciare, uno a sorte per partita):
- **"Il Commissario ha un padrone."** Chi lo scopre può far chiudere un occhio una volta: annulla un'indagine, sua o di un altro (un Favore enorme da vendere).
- **"Sotto il Faro c'è il tesoro del vecchio Re."** Chi lo trova non prende soldi: prende **la mappa dei passaggi**, cioè si muove di notte in 1 ora per tutta la partita.
- **"Il Sindaco Albertini sta per scappare."** Chi lo sa per primo può prendere il suo posto senza elezioni per un Ciclo.
- **"La Banca è vuota."** Chi lo sa può avvisare (tutti salvano i conti) o tacere (e spostare i suoi prima del crollo).
- **"C'è una talpa tra voi."** Uno dei personaggi comprati lavora per la polizia: chi capisce quale, può dargli in pasto un rivale.

**Esempio raccontato.** Ciclo 2, Gazzetta: *"Luci strane al Faro. I pescatori dicono di aver visto scavare."* Ciclo 4, al Ballo in Maschera qualcuno ti sussurra: "Il vecchio Re non si fidava delle banche." Ciclo 5, il doganiere ubriaco alla Bisca: "Quella cassa è passata di qui trent'anni fa." Tu hai tre pezzi. Tua sorella ne ha due, ma uno è quello che ti manca. Scambiate? O vai a scavare stanotte e speri?

**Come si sblocca.** È sempre attivo. I pezzi arrivano dalle cose che fai: Gazzetta (pubblico), personaggi in giro di notte, Ballo in Maschera, occasione "VIP ubriaco", pedinamenti. **Metà dei pezzi si trovano solo nella vita sporca, metà solo in quella pulita**: per ricomporlo da solo devi fare entrambe, oppure devi trattare con qualcuno.

**Rischio.** Agire sul Mistero con i pezzi sbagliati costa caro (scavi nel posto sbagliato = una notte persa e Tracce). I pezzi si possono rubare, vendere, e anche inventare.

**Contromossa.** Scambiare pezzi (anche falsi). Pedinare chi sembra saperne di più. Arrivare prima.

**Aggancio al motore.** `s.seed` sceglie il Mistero in `nuovaPartita()`. I pezzi pubblici escono da `regista()` con `notizia(..., "voce")`. Quelli privati da `ballo()`, dall'occasione "vip" (che oggi dà una Prova a caso), dai personaggi di `GIRO` in `scelteNotte()`. Stato nuovo `s.mistero = {id, pezzi}` e `p.pezzi = []`. Il premio usa cose già esistenti (per esempio "1 ora ovunque" è già l'effetto dell'eliporto e del motoscafo).

**Lavoro.** Grande (ma si può partire con 2 Misteri soli e aggiungerne dopo).

**Bot.** I bot raccolgono pezzi senza cercarli. Quando ne hanno 2 li offrono in cambio di un Favore. Un bot non risolve mai il Mistero prima del Ciclo 6, per lasciare spazio alle persone.

---

### 12. L'AMBIZIONE SEGRETA e LA CRONACA — *di tutti · perché si gioca*

**Cosa fa.** All'inizio ognuno sceglie in segreto che tipo di Re vuole diventare; quando ci riesce si scopre, e riceve una mossa unica, da usare una volta sola. A fine partita il gioco racconta la storia di tutti.

**Esempi di Ambizioni** (ne peschi 3, ne scegli 1):
- **Il Burattinaio** — tre giocatori diversi ti devono un Favore nello stesso momento. *Mossa unica: "Tirare i fili": per una notte decidi tu dove va un altro giocatore.*
- **L'Intoccabile** — arrivi al Processo e ne esci assolto. *Mossa unica: una condanna futura la sconta un altro (se hai una Prova su di lui).*
- **Il Benefattore** — tieni le Chiavi della Città per 3 Cicli. *Mossa unica: un'Amnistia solo per chi scegli tu.*
- **Il Fantasma** — possiedi 3 terreni con il Prestanome e nessuno ti smaschera. *Mossa unica: sparisci dalla classifica fino alla fine (nessuno sa quanto hai).*
- **Il Padrone del Porto** — fai un affare in tutti i luoghi della notte. *Mossa unica: chiudi un luogo a tutti gli altri per una notte.*
- **Il Giusto** — pubblichi due Inchieste vere. *Mossa unica: la Resa dei conti, per un rivale a scelta, è certa.*

**Esempio raccontato.** Tua sorella sembra giocare male: regala soldi, tira fuori gente dal Faro, perde aste. Al Ciclo 8 la Gazzetta esce a tutta pagina: *"Tre potenti della Laguna devono qualcosa alla stessa persona."* Lei è il Burattinaio. E l'ultima notte, quando vai a fare il colpo che ti farebbe vincere, il tuo motoscafo ti porta alla Redazione. Ha tirato i fili.

**La Cronaca finale.** Oggi `fine()` dà 4 titoli. Propongo che scriva un racconto breve per ognuno, con i fatti veri della partita: *"Marco arrivò in Laguna come Costruttore. Al Ciclo 5 fu fotografato al Porto. Ricattato per tre Cicli da una voce sconosciuta (era Giulia). Finì al Faro, ne uscì grazie a un Favore, e all'ultima Alba aveva il grattacielo più alto dell'arcipelago."* È la cosa che la gente si rimanda il giorno dopo.

**Come si sblocca.** L'Ambizione si sceglie dopo il pacchetto. Le mosse uniche si sbloccano solo compiendola.

**Rischio / contromossa.** Gli altri possono **indovinare** la tua Ambizione guardando come giochi, e mettersi di traverso. Chi la indovina (una sola dichiarazione a partita) la brucia: non prendi la mossa unica.

**Aggancio al motore.** `scegliPacchetto()` è il punto giusto per la scelta (`p.ambizione`). I controlli si fanno in `alba()`. La Cronaca ha già quasi tutto: `s.log` (400 righe), `s.gazzetta`, `p.arresti`, `p.condanne`, `p.ultimaSentenza`, `s.rivelazione`. Basta marcare 10-15 "fatti importanti" mentre succedono (campo nuovo `p.storia`).

**Lavoro.** Cronaca: piccolo-medio. Ambizioni: medio (dipende da quante).

**Bot.** Ogni bot ha un'Ambizione coerente con la sua indole. Provano a indovinare quella del giocatore solo dopo il Ciclo 8 e solo con indizi forti.

---

## 3. COME STANNO INSIEME (e perché il gioco non diventa più facile)

- **Ogni potere sporco ha un potere pulito che lo ferma.** Cimice ↔ Sala insonorizzata e bonifica. Prestanome ↔ Inchiesta. Colpo a due ↔ Esposto. Divisa amica ↔ documenti falsi e Sindaco. Busta all'assessore ↔ Chiavi della Città.
- **Nessuna dinamica dà soldi.** Danno informazioni, mosse, accessi. I soldi arrivano dopo, se li usi bene.
- **Il gioco diventa più difficile, non più facile:** ogni funzione nuova apre anche un modo nuovo di farsi male. Chi ricatta lascia indizi. Chi ha un complice ha qualcuno che può parlare. Chi ha le Chiavi è un bersaglio.
- **Tutto si scopre per un motivo.** Ogni contromossa parte da una pista vera (un indizio, un pedinamento, una foto). Niente tiri di dado ciechi.
- **Niente menu nuovi.** Tutto entra da cose che ci sono già: l'app "Da scoprire" per gli sblocchi, la Rubrica per i fili, i Messaggi per ricatti e richieste, le scene della notte per Grotte, cimice e colpo a due. Zero app nuove.
- **4-8 giocatori, 2 ore.** Le azioni nuove sono quasi tutte dentro turni che esistono già (un'ora di notte, una mossa di giorno) o sono risposte sì/no dal telefono. Non allungano il turno. In 4 giocatori i Favori e i ricatti funzionano; in 8 diventano una ragnatela.

## 4. I MIEI DUBBI (da discutere con il Creatore B)

1. **Troppe cose da imparare?** È il problema numero uno di Nicola. Per questo le sblocco con un fatto di gioco e un indizio, mai tutte insieme. Ma 12 sono tante: forse ne servono 5 per cominciare.
2. **Il Ricatto anonimo può far arrabbiare** chi gioca tra amici e fratelli. Serve che la via d'uscita (scoprire chi è) sia davvero giocabile.
3. **Il Mistero è il più bello e il più costoso.** Si può rimandare.
4. **Sindaco + Chiavi + Gran Maestro:** tre "cariche". Vanno tenute ben distinte o confondono.
5. **I Favori dipendono dal server:** il Voto e la Porta aperta devono essere applicati dal motore, non dalla buona volontà.

## 5. ORDINE CHE PROPONGO

1. **I Favori** (1) — senza questi, gli altri non hanno colla.
2. **La Divisa amica** (6) e **L'Esposto** (9) — piccoli, subito divertenti, uno sporco e uno pulito.
3. **Il Ricatto** (2) e **L'Inchiesta** (8) — danno finalmente un secondo uso alle Prove e alle piste.
4. **La Cronaca** (metà della 12) — poco lavoro, grande effetto sul "senso".
5. Poi: Cimice, Colpo a due, Chiavi, Grotte, Prestanome, Ambizioni, Mistero.

**La mia preferita: I Favori + Il Ricatto.** Trasformano una Prova da "bottone che fa +35 Tracce" in una storia che dura mezza partita tra due persone vere.
