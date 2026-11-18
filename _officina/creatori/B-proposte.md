# Creatore B — il Designer critico
## Proposte di dinamiche nuove per "Re della Laguna"

Ho letto motore.js, gioco.js e bot.js (solo lettura). Non ho giocato una partita lunga: la diagnosi viene dal codice delle regole.

---

## 1. Diagnosi: perché oggi il gioco "non ha un senso"

**D1 — Tutto finisce in un solo numero.**
Vince chi ha più patrimonio (`fine()`, riga 3157: la classifica è ordinata solo per patrimonio). I titoli finali (La Stella, Mani Pulite, Gran Burattinaio) sono scritte, non valgono niente. Quindi ogni sistema (fama, setta, Sindaco, notte) è solo un altro modo di fare soldi. Per questo le scelte sembrano tutte uguali.

**D2 — Le Prove sono l'arma più bella e la meno usata.**
Oggi una Prova serve a una cosa sola: `denuncia()` (+35 Tracce all'altro). In più pesa da sola: basta che un rivale la tenga in tasca e a te salgono le piste (`piste()`, `pistaRivale: 8`). Non c'è trattativa. Nel codice la parola "ricatto" non esiste. E tre Prove su cinque arrivano su un rivale **a caso** (carta Gazzetta riga 492, Ballo riga 1910, VIP ubriaco riga 1995): non sono frutto di una scelta.

**D3 — La fama è un contatore, non un potere.**
Serve per: candidarsi (40), livello Icona (50), entrare nelle sale VIP (`lustro()`). Sopra 60 è perfino un danno (Tracce ×1,25). Nessun giocatore usa la fama **contro o con** un altro giocatore.

**D4 — Il Sindaco lo elegge una formula, non i giocatori.**
`elezioni()`: fama×2 + soldi di campagna + un dado. Gli altri giocatori non votano. È l'occasione più grossa persa per legare i giocatori. Le 6 leggi colpiscono "tutti" o "un'isola": non sono mai una leva su una persona.

**D5 — La vita pulita non ha funzioni sue.**
Chi resta pulito ha solo: Tracce che scendono più in fretta e un titolo finale. Il motore conta già i Cicli puliti di fila (`p.ombraCicli`) ma li usa solo per dire al Gran Maestro "puoi cacciarlo". Nicola ha deciso che pulita e sporca devono pagare bene tutte e due: oggi la pulita è solo "non fare".

**D6 — La carriera criminale non sblocca niente.**
`p.reputazione` sale di 2 a ogni affare riuscito e dà solo +50.000 € di carico ogni 10 punti. Tutti gli sblocchi veri (`SOGLIE_LIVELLO`) dipendono dal patrimonio. Quindi "illegale" = "più soldi". È il contrario di quello che chiede Nicola.

**D7 — I contatti corrotti sono percentuali.**
Agente, Commissario, banchiere, doganiere: paghi e hai uno sconto sul rischio. Non fai mai niente **con** loro. Però hanno già il lato rischio fatto bene (`sospetto`, Affari Interni, pista "complice").

**D8 — I patti tra giocatori sono solo soldi e terreni.**
`proponiContratto()` sposta soldi e un lotto. Il testo libero non è fatto rispettare dal gioco. Tra giocatori non si può scambiare un voto, un silenzio, un passaggio.

**D9 — Incontri di notte poveri.**
Se trovi un altro giocatore puoi: seguirlo, offrirgli da bere (+2 fama), sfidarlo a carte. Trovarsi nello stesso locale dovrebbe essere il momento più teso della notte.

**Scelte finte che ho trovato**
- Denunciare o tenere la Prova: tenerla fa già danno, denunciare non dà niente a te. Scelta vuota.
- Legge del Sindaco: quasi sempre conviene la stessa (Amnistia se sei sporco, Condono se costruisci).
- Fama sopra 60: è una punizione senza contropartita.

**In una frase:** mancano le **leve tra persone**. Il gioco ha tanti sistemi, ma ognuno gioca da solo contro la banca. Le idee qui sotto usano quasi solo pezzi che ci sono già.

---

## 2. Le mie 7 proposte

Legenda: **[SPORCA]** = ricompensa dell'illegale come funzione · **[PULITA]** = funzione solo per chi è pulito · **[TUTTI]**.

---

### B1 — Il Favore (la seconda moneta) **[TUTTI]** — la base di tutto

**In una frase:** tra giocatori non si scambiano solo soldi ma "Favori": promesse che il gioco fa rispettare da solo.

**I 5 Favori possibili (lista chiusa, niente testo libero):**
1. **Passo libero** — per 1 Ciclo non paghi affitto sui suoi terreni.
2. **Il voto** — alle prossime elezioni (o alla prossima Opera della setta) vota come dici tu.
3. **La porta aperta** — per una notte usi una sua stanza del Palazzo o un suo contatto corrotto.
4. **Silenzio** — per 2 Cicli non può denunciarti né pagare articoli contro di te.
5. **Una mano** — ti cede il suo turno all'Asta del Comune (non rilancia contro di te).

**Esempio di gioco:** Giulia è al Faro. Nicola paga la sua cauzione. In cambio non chiede soldi: chiede "Il voto". Due Cicli dopo ci sono le elezioni: il voto di Giulia va a Nicola in automatico, e tutti leggono sulla Gazzetta "Giulia sostiene Nicola". Giulia non può tirarsi indietro.

**Come si sblocca:** al primo patto tra due giocatori (la prima volta Vera lo spiega in due righe). Compare nell'app Contratti, come terzo tipo dopo "parola" e "notarile".

**Rischio / contromossa:** un Favore è un debito: chi lo deve può **riscattarlo** pagando una penale fissa (es. 500.000 €) e perdendo 5 fama ("non mantiene la parola", va in Gazzetta). Così nessuno resta incastrato, ma tradire costa la faccia.

**Aggancio al motore:** `s.contratti` (aggiungere `tipo: "favore"`, `clausola`, `scadenza`); controlli in `affitto()`/`atterra()`, `elezioni()`, `votaOpera()`, `denuncia()`, `articolo()`, `offerta()`. `scadenzeContratti()` li chiude.

**Lavoro:** medio (5 controlli piccoli in funzioni che esistono + una schermata).

**Bot:** accettano di dare un Favore se quello che ricevono vale più della penale; lo chiedono quando hanno un credito (cauzione pagata, prestito fatto). Il Legale non dà mai "Silenzio".

---

### B2 — Il Ricatto **[SPORCA]**

**In una frase:** una Prova non serve più solo a denunciare: la mostri alla vittima e le chiedi un Favore (B1) in cambio del silenzio.

**Esempio di gioco:** di notte Marco fotografa Sara al Porto con il carico di orologi. All'Alba le manda la foto: "Passo libero sui tuoi terreni di Corona, o domani è sulla scrivania di Vargas." Sara ha tre uscite: accetta; rifiuta e si prende la denuncia; oppure **confessa** da sola.

**Come si sblocca:** alla prima Prova che ottieni (Vera: "Una Prova si può denunciare. Oppure si può usare.").

**Rischio chiaro, scoperta motivata:**
- Ricattare è un reato **grave**. Finché il ricatto è aperto, il ricattatore ha una pista nuova: "Qualcuno ha parlato di un ricatto" (peso fisso, visibile a lui nell'app delle piste).
- **Contromossa 1 — Confesso:** la vittima va dalla polizia. Si prende metà delle Tracce di una denuncia (17 invece di 35) ma la Prova si brucia e al ricattatore arrivano +25 Tracce e il suo nome sulla Gazzetta.
- **Contromossa 2 — Pari e patta:** se la vittima ha una Prova sul ricattatore, le due si annullano. Vale la pena fotografare chi ti ricatta.
- **Contromossa 3 — Ufficio stampa** (stanza che c'è già): 1 volta su 2 il ricatto esce in pubblico.

**Correzioni che servono insieme:**
- Una Prova in tasca **non deve più pesare da sola** sulle piste (oggi pesa 8). Pesa solo se usata. Altrimenti il ricatto non ha senso: il danno c'è già.
- Le Prove "a caso" (Ballo, VIP, carta Gazzetta) devono dare una Prova su chi **era davvero lì** o ha davvero Tracce, con il motivo scritto ("ha parlato troppo al Ballo").

**Aggancio:** `p.prove`, `denuncia()`, `piste()` (nuova voce `k: "ricatto"`), `condanna()` con gravità "grave", `haPiano(b, "ufficio_stampa")`, contratti di B1.

**Lavoro:** medio (piccolo se B1 c'è già).

**Bot:** Furbo e Spavaldo ricattano se hanno una Prova e la vittima ha stato ≥ 1 (ha paura). Vittima bot: accetta se è Indagata o peggio, confessa se è quasi pulita, usa "pari e patta" se può. Il Legale non ricatta mai: denuncia.

---

### B3 — Il Nome (la carriera criminale apre funzioni, non soldi) **[SPORCA]**

**In una frase:** ogni affare riuscito fa crescere il tuo Nome nella malavita; a tre soglie si apre un potere nuovo, e a ogni soglia la polizia ti conosce un po' di più.

| Nome | Soglia (reputazione) | Funzione |
|---|---|---|
| **Uno del giro** | 6 (3 affari) | **L'informatore.** All'Alba scegli un rivale: sai in quale locale ha fatto affari stanotte (non cosa). |
| **Rispettato** | 14 (7 affari) | **Il prestanome.** Intesti un'attività di copertura a un altro nome: non attira più la polizia. Se ti condannano, quella è la prima confiscata. |
| **Il Boss** | 24 (12 affari) | **L'uomo dentro.** Una volta per Ciclo leggi le piste di un rivale: sai per quale motivo la polizia lo segue. È l'informazione perfetta per ricattarlo o per stargli lontano. |

**Esempio di gioco:** Sara è "Rispettata". Intesta la sua discoteca a un prestanome: di colpo le sue Tracce pesano meno. Marco, che è "Uno del giro", scopre che lei va al Porto tutte le notti e ci si apposta con la macchina fotografica.

**Come si sblocca:** da solo, giocando la notte. Ogni soglia è annunciata da Vera e da una voce anonima sulla Gazzetta ("Nella malavita gira un nome nuovo").

**Rischio chiaro:** ogni grado aggiunge una pista fissa "Il tuo nome gira troppo" (peso 4 / 8 / 14). Non si toglie restando puliti: si toglie solo con un'Amnistia o scendendo di grado dopo una condanna. Chi diventa Boss sa che sarà il primo guardato.

**Attenzione alla regola di Nicola** ("di notte non si sa chi c'è in un locale prima di arrivarci"): l'informatore dice dove uno **è stato**, mai dove **è adesso**. La regola resta intera.

**Aggancio:** `p.reputazione` (c'è, sale già di 2 per affare), `p.luoghiNotte` (da leggere all'Alba prima che `aggiornaPiste()` lo svuoti), `ATTIVITA[...].att`, `piste()`, `condanna()`.

**Lavoro:** medio (tre funzioni piccole + una riga nella vista).

**Bot:** usano l'informatore sul giocatore più ricco; intestano al prestanome l'attività con `att` più alta; il Boss bot legge le piste di chi ha già una Prova contro.

---

### B4 — La Fedina pulita (funzioni solo per chi non sporca) **[PULITA]**

**In una frase:** i Cicli puliti di fila diventano un potere: la legge sta dalla tua parte, e la puoi usare come arma.

| Cicli puliti di fila | Funzione |
|---|---|
| **2** | **Notaio di fiducia.** I contratti notarili non ti costano la commissione, e un Favore (B1) fatto a te ha penale doppia per chi lo rompe. |
| **4** | **L'Esposto.** Una volta per Ciclo firmi un esposto contro un rivale: se ha davvero una pista, la più pesante finisce sulla Gazzetta con il motivo e lui prende +15 Tracce. Se è pulito, perdi 8 fama tu. È **firmato**: lui sa che sei stato tu. |
| **6** | **Cittadino onorario.** Il tuo voto alle elezioni vale doppio (B5) e sei immune alle perquisizioni all'Alba. |

**Esempio di gioco:** Giulia non ha mai toccato un soldo sporco. Al quinto Ciclo firma un esposto contro Marco: sulla Gazzetta esce "La Finanza guarda i conti di Marco: soldi che non tornano". Marco adesso sa due cose: quale pista lo sta bruciando, e che Giulia è la sua nemica. Marco prova a corromperla con un regalo sporco: se lei lo accetta, perde tutto.

**Come si sblocca:** da solo. Un contatore "Fedina pulita: 3 Cicli" nell'app I miei conti. Vera avvisa alla soglia.

**Rischio / contromossa:** **un solo atto sporco azzera tutto** (anche accettare soldi sporchi in regalo, anche entrare in una setta). È il prezzo, ed è chiaro. Contromossa dei rivali: tentarti. Chi firma esposti si fa nemici visibili.

**Aggancio:** `p.ombraCicli` e `p.pulitoCiclo` (ci sono già, azzeramento compreso alla riga 3009), `piste()` (per scegliere la pista più pesante), `notizia()`, `rischioPerquisizione()`, `rispondiContratto()` (commissione).

**Lavoro:** piccolo.

**Bot:** il Legale e il Costruttore proteggono la serie; firmano l'esposto contro chi ha stato ≥ 2 (vanno sul sicuro). Furbo e Spavaldo regalano sporchi ai puliti con serie alta per romperla (di rado).

---

### B5 — Elezioni vere: si vota, si promette, si compra **[TUTTI + SPORCA]**

**In una frase:** il Sindaco lo scelgono i giocatori con un voto che pesa secondo la fama, e ogni candidato dichiara prima cosa farà.

**Come funziona:**
- Ogni giocatore vota. Peso del voto: 1, più 1 ogni 20 di fama. **La fama diventa una funzione:** un giocatore famoso che non si candida è il grande elettore che tutti corteggiano.
- Chi si candida sceglie **una promessa** dalla lista delle leggi (più le tasse). Esce sulla Gazzetta. Se entro il Ciclo dopo non la mantiene: −10 fama e "promessa tradita" in prima pagina.
- Restano i "voti del popolo" (la formula di oggi, dimezzata), così anche in 4 giocatori il risultato non è scontato.
- Due leggi nuove **su una persona**: **Ispezione** (la Finanza controlla un giocatore: se ha una pista di soldi, esce in pubblico) e **Concessione** (il Sindaco firma lui la licenza del casinò a chi vuole).

**Lato sporco — comprare un voto:** offri una busta di soldi sporchi a un elettore. Lui vota per te. Ma chi vende il voto riceve **in automatico una Prova** su chi l'ha comprato ("la busta di Marco"). È il motivo per cui un giorno ti scoprono: l'hai messo tu in mano a qualcuno.

**Esempio di gioco:** Sara (fama 62) non si candida. Marco e Giulia sì. Marco le offre una busta; Giulia le promette la Concessione del casinò. Sara prende la busta di Marco, lo vota, e tre Cicli dopo usa quella Prova per ricattarlo.

**Come si sblocca:** alla prima candidatura di qualcuno, l'app Municipio mostra a tutti la scheda con i candidati e le promesse.

**Rischio / contromossa:** Sindaco che non mantiene = fama giù e rielezione più dura (c'è già il malus `mandati`). Voto comprato = Prova in mano a un rivale.

**Aggancio:** `elezioni()`, `s.candidati` (aggiungere `promessa`), `LEGGI` (+2), `legge()`, `s.licenze`, `p.prove`, `regala(…, sporchi)`.

**Lavoro:** medio. Punto delicato: online il voto deve avere una scadenza (chi non vota entro il suo turno si astiene), se no la partita si ferma.

**Bot:** votano chi promette la legge che gli conviene (tabella per carattere, come `GUSTO_OPERA` che c'è già); lo Spavaldo vende il voto, il Legale mai.

---

### B6 — I contatti fanno cose (un favore per Ciclo) **[SPORCA]**

**In una frase:** ogni contatto corrotto, oltre allo sconto sul rischio, ti fa **un favore attivo** per Ciclo; ogni favore lo rende più nervoso.

| Contatto | Favore |
|---|---|
| **Agente** | "Chi ha parlato?" — ti dice **chi** tiene una Prova su di te. |
| **Commissario Vargas** | "Sposta la retata" — scegli tu quale locale stanotte è pericoloso. Chi ci va, rischia. |
| **Banchiere Lenz** | "Fammi vedere il conto" — vedi soldi puliti e sporchi di un rivale, al milione. |
| **Doganiere** | "Cosa arriva stanotte?" — vedi prima degli altri le occasioni di Porto e Aeroporto e te ne riservi una. |

**Esempio di gioco:** Marco sa (dall'informatore, B3) che Sara va al Porto ogni notte. Chiede a Vargas di spostare la retata al Porto. Sara, che ha comprato la soffiata al Mercato, lo scopre in tempo e cambia strada: i 50.000 € della soffiata, che oggi quasi nessuno spende, diventano preziosi.

**Come si sblocca:** quando compri il contatto. La prima volta lui stesso ti dice cosa può fare ("Se ti serve sapere chi ha parlato, chiedi a me").

**Rischio chiaro:** ogni favore fa salire il rischio che gli Affari Interni indaghino su di lui (c'è già: `rischioContatto()`, `sospetto`, pista "complice" da 12). Più lo usi, prima canta. Si legge nell'app: "Vargas: nervoso".

**Contromossa:** la soffiata al Mercato rivela la retata spostata; la Terrazza col cannocchiale (stanza che c'è già) mostra dov'è Vargas; chi ha Fedina pulita 6 non subisce perquisizioni.

**Aggancio:** `p.corrotti[k]` (aggiungere `favoreCiclo`, c'è già `usi` per il doganiere), `s.notte.pericolo[luogo]`, `occasioni[].riservata` (c'è), `p.prove`, `rischioContatto()`.

**Lavoro:** piccolo–medio (quattro azioni corte).

**Bot:** usano il favore appena disponibile se il contatto non è già sotto inchiesta; Vargas contro il giocatore con più patrimonio.

---

### B7 — Le Cariche (i titoli finali diventano poteri durante la partita) **[TUTTI]**

**In una frase:** i titoli che oggi compaiono solo a fine partita si assegnano a ogni Alba, e chi ne tiene uno ha un potere finché lo tiene.

| Carica | A chi va | Potere |
|---|---|---|
| **La Stella** | più fama | Un articolo gratis sulla Gazzetta per Ciclo (elogio o scandalo). |
| **Mani Pulite** | più Cicli puliti di fila | Nomina il **garante**: sceglie chi tra due parti ha ragione quando un Favore viene rotto (la penale va a chi dice lui). |
| **Il Padrino** | Nome più alto (B3) | Decide chi può comprare al Mercato Nero stanotte: può chiudere la porta a un giocatore. |
| **Il Re del mattone** | Palazzo più alto | Alle Aste del Comune parla per ultimo (vede le offerte degli altri). |

**Esempio di gioco:** Sara è la Stella da tre Cicli. Giulia compra uno yacht e due serate alla Spa solo per superarla di fama: all'Alba la Gazzetta titola "La Laguna ha una nuova Stella". Adesso l'articolo gratis è di Giulia, e lo usa subito.

**Come si sblocca:** la prima Carica si assegna all'Alba del Ciclo 3, una per volta (Stella, poi le altre), annunciate in Gazzetta con una scena. Le Cariche che richiedono B3 arrivano solo se B3 c'è.

**Rischio / contromossa:** le Cariche sono pubbliche: tutti sanno chi comanda cosa e come strappargliela. La Stella con fama ≥ 60 ha già oggi Tracce ×1,25: resta, è il suo prezzo. Il Padrino è per definizione il più conosciuto dalla polizia.

**Aggancio:** il calcolo c'è già dentro `fine()` (stella, pulito, burattinaio): va spostato in una funzione `cariche(s)` chiamata in `alba()`. `articolo()`, `compraOggetto()`, `offerta()`.

**Lavoro:** medio (la parte lunga è la scena in Gazzetta, non le regole).

**Bot:** nessuna logica nuova per ottenerle (arrivano da quello che fanno già). Usano il potere quando ce l'hanno: Stella bot = scandalo contro il primo in classifica.

**Critica a me stesso:** è la proposta con più rischio di "sistema in più da imparare". La farei per ultima e solo con 2 Cariche (Stella e Mani Pulite) all'inizio.

---

## 3. Conti in tasca alle mie proposte

- **Riuso:** B2, B3, B4, B6 usano campi che esistono e sono quasi fermi (`prove`, `reputazione`, `ombraCicli`, `corrotti`). Nessuna richiede un'app nuova nel telefono.
- **Ricompense dell'illegale come funzioni:** B2, B3, B6 e il voto comprato di B5 (4 su 7). Nessuna aggiunge soldi.
- **Vita pulita con funzioni sue:** B4 intera, la Carica Mani Pulite in B7, il voto doppio in B5.
- **Bilanciamento soldi:** nessuna cambia rendite o guadagni. I numeri di riferimento delle prove coi bot (12 Cicli ~100–105 M) non dovrebbero muoversi molto; da verificare con la simulazione.
- **Rischio vero:** il gioco è già grande e il problema dichiarato di Nicola è che i giocatori **non conoscono le funzioni**. Sette dinamiche nuove tutte insieme peggiorano il problema. Vanno messe una alla volta, e alcune sostituiscono qualcosa (il Ricatto sostituisce il peso passivo delle Prove; le Elezioni vere sostituiscono la formula).

## 4. Decisioni che servono a Nicola

1. **Chi vince?** Resta "il più ricco", o le Cariche contano nel punteggio finale? (Io: resta il più ricco. Le Cariche danno poteri, non punti.)
2. **Il voto online:** se uno non vota in tempo, si astiene? (Io: sì.)
3. **La Prova in tasca non pesa più da sola?** È un cambio a una regola che c'è. (Io: sì, altrimenti il ricatto non serve.)
4. **Fedina pulita e setta:** entrare in una setta azzera la Fedina anche se non fai affari? (Io: sì.)

---

# Risposta ad A

Ho letto A-proposte.md per intero e ho controllato nel motore gli agganci che cita (esistono: `postoDiBlocco()`, `p.nascondigli`, `SCOPERTE`, `s.notte.racconto`, `agente_<isola>`).

**Dove siamo d'accordo senza saperlo.** A e io abbiamo scritto, separati, le stesse due cose: i Favori e il Ricatto. Anche Prestanome ed Esposto sono usciti a tutti e due. Quando due teste diverse arrivano allo stesso punto, quel punto è quasi certamente giusto.

**Dove non sono d'accordo, in generale.** 12 dinamiche sono troppe per un gioco in cui il problema dichiarato è "i giocatori non conoscono le funzioni". E A mette tre sistemi di "segreti personali" (Ricatto, Mistero, Ambizione) più tre "cariche" (Sindaco, Chiavi, Gran Maestro). In 2 ore con 4-8 persone ne reggono metà.

## Giudizio idea per idea

### A1 — I Favori → **TENERE, cambiare così**
È la mia B1. Unisco le due liste:
- Tengo di A: **La Mano** (venire in un posto a un'ora). È il Favore più bello: crea incontri di notte.
- Tengo di mio: **Passo libero per 1 Ciclo** al posto di "una volta sola" (una volta sola vale troppo poco per essere chiesto).
- **Il Silenzio**: quello di A brucia la Prova (definitivo), il mio vieta di usarla per 2 Cicli. Meglio quello di A: è più chiaro.
- **SCARTO "vendere il Favore a un terzo"**: confonde ("a chi devo cosa?") e in famiglia fa litigare davvero. Al massimo più avanti.
- Chi non paga: A dice "per 2 Cicli nessuno accetta Favori da lui". Tengo questo e tolgo la mia penale in soldi: è più pulito e non aggiunge soldi.

**Rischio di bilanciamento:** "Il Voto" in 4 giocatori decide da solo un'elezione. Va bene, ma solo se le elezioni si votano davvero (mia B5); con la formula di oggi il Voto non ha niente a cui agganciarsi tranne le Opere della setta.
**Rischio di confusione:** basso se i Favori restano 4 e stanno in una schermata sola (la Rubrica "I miei fili" di A è l'idea giusta).

### A2 — Il Ricatto → **TENERE, cambiare così**
- **"Un Favore a ogni Ciclo finché tieni la Prova" è troppo.** Una foto diventa una rendita per mezza partita: chi viene fotografato al Ciclo 4 smette di divertirsi. Propongo: **una Prova = un Favore**. Poi la Prova si brucia.
- **Ricatto anonimo col telefono usa-e-getta: lo tengo**, è la parte più bella di A (dà senso a un oggetto che oggi vale poco). Ma lo metto come **secondo passo**: prima versione a viso aperto, anonimo dopo.
- **"Rubare la Prova entrando nel Palazzo": SCARTO per ora.** È un sistema nuovo intero (entrare in casa d'altri) per un caso raro.
- Tengo le mie tre uscite della vittima: **Confesso** (mezza pena, il ricattatore prende Tracce), **Pari e patta** (Prova contro Prova), Ufficio stampa.
- Tengo di A gli **indizi veri a ogni richiesta**: è "ti scoprono sempre per un motivo" applicato bene.
- Insisto sulla mia correzione: **la Prova in tasca non deve più pesare da sola** (`pistaRivale`). Se no il danno c'è già e non c'è niente da trattare.

**Rischio di bilanciamento:** +6 Tracce e gravità "media" sono poche per un potere così. Io dico gravità **grave**.
**Rischio umano:** il dubbio n.2 di A è giusto. Tra fratelli il ricatto anonimo ripetuto fa arrabbiare. "Una Prova, un Favore" lo risolve.

### A3 — La Cimice → **CAMBIARE, e rimandare**
L'idea è forte, ma:
- Leggere **tutto** il "Com'è andata" di un altro per 2 Cicli è troppa informazione: toglie il mistero della notte, che è una decisione di Nicola ("non si sa chi c'è in un locale").
- Versione che terrei: la cimice ti dice **solo i luoghi** dove è stato, per **1 notte**. È quasi il mio "informatore" (B3), che costa meno codice e non aggiunge oggetti.
- Lo sblocco "dopo aver usato il disturbatore" è oscuro: nessuno ci arriva.

**Proposta:** fondere con B3. L'informatore è il grado 1 del Nome; la cimice (più precisa, con rischio di essere trovata) può essere il grado 2 al posto del mio prestanome.

### A4 — Le Grotte → **SCARTARE per ora**
- Fa 4 cose insieme (nascondere, passare sotto, sparire, incontrarsi): sono 4 dinamiche, non una.
- Doppia cose che ci sono già: Bunker e Piani segreti (perquisizioni), Eliporto e motoscafo (1 ora), Caveau (salvare sporchi). Svaluta stanze che il giocatore ha pagato milioni.
- "Latitante un Ciclo" indebolisce il Faro, cioè il rischio. Va contro "il rischio ha gusto".
- Lavoro medio-grande più una scena nuova.

Tengo un pezzo solo, per dopo: **un posto segreto che si scopre pedinando**. È una bella ricompensa per il pedinamento, che oggi rende poco.

### A5 — Il Prestanome → **TENERE in piccolo** (versione mia), la versione di A dopo
- La versione di A (terreno anonimo sulla mappa) è più divertente della mia. Ma tocca `vista()`, i flussi, il cartello 3D, la condanna e l'asta: è un lavoro grosso con molti punti dove si può rompere.
- **Problema serio:** un proprietario nascosto va contro "soldi visibili per affitti e cose pubbliche" (decisione di Nicola). Pagare un affitto senza sapere a chi è proprio un affitto nascosto. **Serve una domanda a Nicola.**
- Lo sblocco di A (banchiere comprato + aver ripulito) è giusto: lo adotto.

### A6 — La Divisa amica → **TENERE, cambiare così**
È l'idea migliore di A per rapporto effetto/lavoro, e fa una cosa che nessuna delle mie fa: **porta la notte dentro il giorno**, sul tabellone 3D, davanti a tutti.
Ma attenzione: ho letto `postoDiBlocco()`. Chi ha stato ≥ 2 viene **condannato subito**, senza tiro. Una transenna a 7 caselle da un Indagato è una condanna quasi a comando (7 è il tiro più probabile).
Correzioni:
- La transenna si mette **nel turno prima** e resta **un giro**: tutti la vedono e hanno tempo di reagire (documenti falsi, Viaggio rapido).
- **Una per Ciclo in tutta la Laguna**, non una per agente.
- Non sulle caselle speciali né entro 3 caselle dal bersaglio.
- Sblocco: lascio quello di A (2 Cicli con lo stesso agente).
La unisco alla mia B6 (i contatti fanno cose): la transenna **è** il favore attivo dell'agente. Così B6 diventa: agente = transenna, Vargas = sposta la retata, Lenz = vedi il conto, doganiere = riserva l'occasione.

### A7 — Il Colpo a due e i Complici → **TENERE, più avanti**
Bello e lega davvero due persone. Problemi:
- Online, "essere in due posti alla stessa ora" con l'orologio del server è difficile da coordinare: basta che uno abbia la connessione lenta e il colpo salta. Frustrazione, non tensione.
- I tre poteri dei complici (passarsi oggetti, alibi, vedere lo stato) sono tre regole in più.
**Come lo terrei:** una sola occasione "a due" (il Colpo alla villa), il palo deve solo **essere già lì** da un'ora prima (non serve la sincronia al minuto), e l'unico potere dei complici è **l'alibi**. Dopo i Favori, perché "La Mano" serve a questo.

### A8 — L'Inchiesta → **FONDERE con il mio Esposto (B4)**
Stessa idea: chi è pulito usa `piste()` vere contro un rivale.
- La versione di A (3 indizi in 3 Albe, il bersaglio può raffreddarsi) è più bella: c'è una gara tra chi indaga e chi si nasconde.
- La mia è più corta (un colpo, una volta per Ciclo).
**Scelta:** tengo la versione di A come potere dei 4 Cicli puliti, con un taglio: **2 indizi invece di 3**. In una partita da 8-12 Cicli, tre Albe di attesa dopo quattro Cicli puliti vuol dire usarla una volta sola.
**Rischio:** `piste()` di un giocatore pulito è vuota: l'Inchiesta su un pulito non dà niente. Va detto prima ("su di lui non c'è niente da trovare"), se no sembra un errore.

### A9 — L'Esposto (di A: controllo su un posto) → **TENERE**
Attenzione ai nomi: il mio "Esposto" e quello di A sono due cose diverse. Quello di A rende un **luogo** pericoloso stanotte. È lo specchio pulito del mio "Vargas sposta la retata".
- Piccolo, usa `s.notte.pericolo` e gli `INDIZI` che ci sono già. Dà valore alla soffiata del Mercato.
- Il costo "se non succede niente perdi fama" è giusto: obbliga a osservare.
- Lo metto come potere dei **2 Cicli puliti** nella Fedina (B4), al posto del mio "Notaio di fiducia" che era debole.
**Rischio:** se esistono insieme l'Esposto pulito e la retata di Vargas, in una notte ci possono essere 2 posti forzati a "pericoloso" su 10. Va bene. Con 3 o più la notte diventa una lotteria: **massimo uno per tipo per notte**.

### A10 — Le Chiavi della Città → **SCARTARE come carica a parte, tenerne un pezzo**
- Terza carica pubblica dopo Sindaco e capi dei Grandi Affari. A stesso lo mette tra i dubbi.
- Il **veto** su permessi e licenze blocca un altro giocatore senza che lui possa fare niente nel suo turno: è frustrante, non teso.
- Tengo l'**opera pubblica con il tuo nome in 3D**: è quello che Nicola vuole ("sentirsi dentro il mondo"). La do come potere dei **6 Cicli puliti** nella Fedina, al posto del mio "voto doppio".

### A11 — Il Mistero della Laguna → **TENERE come idea, costruire per ultimo e in piccolo**
È l'idea più originale dei due file e quella che risponde meglio a "ogni partita una storia". Ma:
- Lavoro grande, e tanti testi da scrivere.
- "Metà dei pezzi solo nella vita sporca, metà solo nella pulita" obbliga a fare tutte e due le vite o a trattare: bello, ma chi gioca solo pulito resta fuori senza colpa.
- Pezzi **falsi** inventati dai giocatori: no. Confusione e litigi.
- Alcuni premi sono troppo forti ("annulla un'indagine", "Sindaco senza elezioni").
**Versione piccola:** 2 Misteri, 3 pezzi ciascuno, tutti pubblici o semi-pubblici (Gazzetta, Ballo, personaggi di notte), premio = un accesso (i passaggi sotto il Faro). Solo dopo che il resto funziona.

### A12 — Ambizione segreta e Cronaca → **Cronaca: TENERE subito. Ambizione: CAMBIARE.**
- **La Cronaca** è la proposta più economica per dare "senso": non cambia nessuna regola, non c'è niente da imparare, e trasforma la fine da classifica a storia. La voglio tra le prime.
- **L'Ambizione**: le "mosse uniche" sono pericolose. "Decidi tu dove va un altro giocatore" e "sparisci dalla classifica" tolgono il controllo a una persona vera nell'ultima notte, cioè nel momento in cui tiene di più alla partita. E sei Ambizioni con sei mosse sono sei regole speciali da provare e bilanciare.
- Metà delle Ambizioni dipendono da dinamiche che ancora non ci sono (Chiavi, Prestanome, Inchiesta).
- "Indovinare l'Ambizione dell'altro per bruciarla" è carino ma è un'altra regola.
**Come la terrei:** le Ambizioni come **obiettivi dichiarati nella Cronaca finale** ("voleva essere l'Intoccabile: ci è riuscita"), senza mossa unica. Costo quasi zero, danno il senso, non sbilanciano. Le mie Cariche (B7) fanno il lavoro dei "poteri" in modo pubblico e reversibile.

## Rischi che valgono per tutto

1. **Troppa roba.** La regola che propongo: una dinamica nuova entra solo se **sostituisce o riempie** qualcosa che c'è. Favori → riempiono i Contratti. Ricatto → sostituisce il peso passivo delle Prove. Fedina → riempie `ombraCicli`. Contatti → riempiono `corrotti`. Cronaca → riempie `fine()`.
2. **Informazione.** Informatore, cimice, Lenz, "uomo dentro", Inchiesta: cinque modi di sapere cose degli altri. Se entrano tutti, la notte non ha più segreti. Ne terrei **tre**: uno sporco leggero (informatore), uno sporco pesante (Lenz o uomo dentro), uno pulito (Inchiesta).
3. **Il più ricco prende tutto.** Molti poteri finiscono a chi è già avanti. Controllo: Favori e Ricatto colpiscono soprattutto chi ha tanto da perdere, cioè il primo. Bene. Le Cariche invece premiano il primo: per questo le lascio in fondo.
4. **I bot.** Ogni dinamica tra persone ha bisogno che i bot dicano sì o no in modo credibile. I Favori hanno già un modello in bot.js (`rispostaInvito`, `votoBot`). Il Colpo a due e il Mistero no.
5. **Prove coi bot.** Nessuna idea tocca i soldi direttamente, ma Passo libero e transenna spostano milioni di fatto. Rifare la simulazione dopo ogni dinamica (riferimento: 12 Cicli ~100-105 M).

---

# CLASSIFICA UNICA — le 6 dinamiche da costruire, in ordine

| # | Dinamica | Di chi | Lavoro | Perché in questa posizione |
|---|---|---|---|---|
| **1** | **I Favori** (4 tipi: Voto, Passo libero, Silenzio, Mano) con la Rubrica "I miei fili" | A1 + B1 | medio | È la colla. Ci siamo arrivati tutti e due da soli. Ricatto, elezioni e complici senza questa non stanno in piedi. |
| **2** | **Il Ricatto** — una Prova = un Favore; la Prova in tasca non pesa più da sola; uscite: Confesso, Pari e patta | A2 + B2 | piccolo dopo la 1 | Prima ricompensa dell'illegale che è una leva e non soldi. Ripara una scelta finta che c'è oggi (denunciare o no). |
| **3** | **I contatti fanno cose** — agente: la transenna sul tabellone (Divisa amica); Vargas: sposta la retata; Lenz: vedi un conto; doganiere: riserva un carico | A6 + B6 | piccolo-medio | Poco codice, tanto effetto, si vede in 3D di giorno. Il rischio c'è già scritto (Affari Interni, pista "complice"). |
| **4** | **La Fedina pulita** — 2 Cicli puliti: Esposto su un luogo; 4: Inchiesta con indizi veri (2 indizi); 6: opera pubblica col tuo nome | B4 + A8 + A9 + pezzo di A10 | medio | Dà alla vita pulita funzioni solo sue, subito dopo quelle sporche: così le due strade crescono pari. Usa `ombraCicli` e `piste()` che ci sono. |
| **5** | **Elezioni vere + la Cronaca finale** — si vota (peso dalla fama), i candidati promettono, un voto comprato lascia una Prova; a fine partita il racconto di ognuno | B5 + metà di A12 | medio + piccolo | La fama diventa un potere e il Favore "Voto" trova il suo posto. La Cronaca dà il senso senza aggiungere regole. |
| **6** | **Il Nome** — la carriera criminale a 3 gradi: informatore, prestanome (versione piccola) o cimice leggera, uomo dentro | B3 + A3 + A5 | medio | Ultima perché aggiunge informazione: va dosata guardando come si gioca con le prime cinque. |

**Dopo, se le prime sei funzionano:** Colpo a due (A7, semplificato) · Mistero della Laguna in piccolo (A11) · Le Cariche (B7) · Prestanome grande sulla mappa (A5).
**Scartate per ora:** Grotte (A4), Chiavi come carica (A10), mosse uniche delle Ambizioni (A12), vendere i Favori, rubare la Prova in casa.

## Domande per Nicola (una alla volta)

1. La Prova in tasca oggi fa danno da sola. Va bene toglierlo, così la Prova diventa una cosa da **usare** (denuncia o ricatto)?
2. Il ricatto: a viso aperto, oppure anonimo con il telefono usa-e-getta?
3. Le elezioni: votano i giocatori (chi non vota in tempo si astiene) o resta il calcolo automatico?
4. Entrare in una setta azzera la Fedina pulita anche se non fai affari?
5. Prestanome: un terreno con il proprietario nascosto ti piace, anche se chi paga l'affitto non sa a chi lo paga? (Oggi la tua regola dice: affitti visibili.)
