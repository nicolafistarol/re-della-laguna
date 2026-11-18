# Rapporto: dinamica 3 (I Servizi dei contatti) e dinamica 4 (La Fedina pulita)

Ramo `dinamiche`, 4 commit dopo 565c1b6: fb9a83b (motore), f072b3b (bot), ee86c61 (interfaccia), 8f42181 (Fedina accanto ai nomi). Niente push, `server/` non toccato.

## Cosa ho fatto

**Motore (motore.js)**
- `rischioContatto`: + 0,03 × min(4, servizi). Tetto 0,35 invariato.
- Azione `servizio` (agente, commissario, banchiere, doganiere) con tutti i controlli della specifica: contatto in `p.corrotti`, sotto inchiesta, uno per Ciclo (`servizioCiclo`), Tracce dalla tabella con `segnaTraccia("un Servizio di …")`, `macchia`, `servizi + 1`.
  - Transenna: dopo 2 Cicli dall'acquisto, solo via (`lotto`) dell'isola, mai su una pedina, una per Ciclo in tutta la Laguna (`s.transennaCiclo`). Notizia pubblica. In `atterra()`, come prima cosa, chiama `postoDiBlocco(s, p, nomeCasella)` senza cambiarlo. Sparisce in `iniziaTurno()` di chi l'ha messa e in `iniziaNotte()`. Chi viene fermato lì ha `ultimaPista.k = "transenna"`, e l'agente prende `servizi + 1`.
  - `togli_transenna`: solo il Sindaco, nel suo turno, una volta per Ciclo, gratis, con notizia.
  - Vargas: `s.ordineVargas`, uno per notte. In `iniziaNotte()` dopo il sorteggio il posto diventa "pericoloso". Col blackout: "Vargas: «Col blackout, niente retata.»". All'Alba torna `null`.
  - Lenz: `p.contiVisti[bersaglio]` e messaggio privato "Lenz: «…»", di giorno o di notte. Lo spiato non sa niente.
  - Doganiere: solo di notte. Senza `n` dà la lista (Porto e Aeroporto, non presi, non riservati ad altri, del suo livello, non ancora scaduti) in `p.arrivi`. Con `n` riserva un carico (`o.riservata`), una volta per Ciclo.
  - Il contatto si presenta con un messaggio privato la prima volta che lo compri (`p.presentati`).
- Fedina (`albaFedina`, chiamata in `alba()` subito dopo le rate dei contatti): +1 se pulito, altrimenti 0. Sporco vuol dire macchia, setta, contatti o evasione. **`p.macchia` torna `false` qui** (sospeso dal programmatore prima). Vera avvisa a 0 e a 2, 4, 6. `condanna()` azzera la Fedina, ritira il fascicolo e toglie le targhe.
- `esposto`: Fedina ≥ 2, solo posti della notte (non Palazzo e Faro), uno a testa per Ciclo, uno per notte in tutta la Laguna, stop di un Ciclo dopo un esposto a vuoto. `esitoEsposto()` gira all'inizio di `alba()`, prima che `aggiornaPiste()` svuoti `luoghiNotte`.
- `inchiesta_apri`: Fedina ≥ 4, un fascicolo alla volta, `inchiestaBlocco`, **il Silenzio la blocca sul creditore** (sospeso dal programmatore prima: `controllaSilenzio`). Il bersaglio riceve "Qualcuno fa domande…" e `sottoInchiesta`. `albaFascicoli()` gira dopo il giro di tutti i giocatori e prima dei processi: un indizio pesato con `rng`, i testi in terza persona, archiviato dopo 4 Albe. Se la Fedina scende sotto 4: fascicolo chiuso, −5 fama, notizia "ritira le accuse".
- `inchiesta_pubblica`: tabella della specifica (con 2 indizi la polizia sale al massimo fino a 3). L'Ufficio stampa non la ferma.
- `opera_pubblica`: Fedina ≥ 6, una a testa, una per isola, 3.000.000 € puliti (flusso pubblico), valore +1, fama +8, notizia.
- `vista()`: `transenna` = `{pos, isola}` per gli altri (`da` solo per chi l'ha messa); `ordineVargas` solo a chi l'ha dato; `esposto` = `{ciclo}` per gli altri; `opere` pubbliche; `umoreContatti` per sé (calcolato senza scrivere). I campi privati nuovi (fascicolo, contiVisti, arrivi, sottoInchiesta…) restano segreti da soli: non sono in `CAMPI_PUBBLICI`.
- Altro: `MOTIVO` (servizio, togli_transenna → Corruzione; opera_pubblica → Opere pubbliche), 2 `SCOPERTE`, `"pos"` in `CAMPI_NUMERO`, `macchiaAzione()` esportata per l'avviso, `VERSIONE_REGOLE` 75.

**Bot (bot.js)**: seguono la specifica.
- Servizi solo per Furbo, Spavaldo ed Esperto, e solo con contatti non sotto inchiesta.
- Vargas a Cicli pari, sul posto più caldo dei rivali (altrimenti il Porto).
- La transenna quando un rivale con stato ≥ 2 è a 10-11 caselle da una via dell'isola dell'agente.
- Il doganiere quando il bot è al Porto o all'Aeroporto: chiede la lista, poi tiene il carico che rende di più.
- Lenz mai.
- Il Sindaco toglie la transenna se è entro 18 caselle e ha Tracce > 25.
- Esposto sul posto con più `calore` dei rivali, mai a zero.
- Inchiesta sul rivale con lo stato più alto (oppure sul primo in classifica con Tracce > 20). Pubblica con 2 indizi, o con 1 dalla terza Alba.
- Opera sull'isola dove il bot ha più terreni.
- Con un esposto in giro, Furbo ed Esperto restano a casa 1 volta su 2. Sotto inchiesta saltano gli affari.

**Interfaccia (gioco.js, stile.css)**
- Soldi sporchi › La tua rete: per ogni contatto l'umore a colori e il pulsante del Servizio, con i testi della specifica.
  - Finestre: transenna (scelta della via e avviso per l'ultimo giro del giorno 4), Vargas (posto), Lenz (rivale; il risultato resta scritto). Per il doganiere la lista dei carichi esce con il pulsante "Tienilo per me".
- Municipio: "Cittadino onesto". I poteri sono grigi finché non li hai ("Ti serve Fedina pulita N."). C'è l'esposto con la sua scelta. Il fascicolo mostra Albe e indizi, con "Pubblica": una finestra con indizi ed effetti prima di confermare. Poi "Dona un'opera" e la lista delle opere della città. Il Sindaco ha "Fai togliere la transenna".
- I miei conti: in cima "Fedina pulita: N Cicli", con le tre tacche 2 · 4 · 6, il prossimo potere e il perché, se resta a zero.
- Accanto ai nomi in alto: "⚖️ Fedina N" (da 2 in su), su una riga a parte, così le schede non vanno a capo.
- Avviso: in `agisci()`, se la Fedina è ≥ 2 e l'azione macchia (`L.macchiaAzione`), prima esce "Attenzione: perdi la Fedina pulita (N Cicli)". Le finestre dei Servizi e del Ricatto hanno già la riga dentro, e non chiedono due volte.
- Tabellone: un segno HTML 🚧 "Transenna" sulla casella e 🎭/🌳/🏫 "Teatro Nome" sull'isola. **tre.js non è toccato.** Il 3D mette già al loro posto sulla foto gli elementi scritti in `#mappa` (punto 4 di `disponi()`): li ho visti in 3D (screenshot). Non è un oggetto 3D vero, è un'etichetta.
- Mittenti nuovi nei Messaggi (Lenz, Vargas, doganiere, agente, Procura). NOVITA[75], 4 frasi.

## Scelte e cose NON fatte
- **"Condannato alla transenna"**: `postoDiBlocco()` non condanna mai subito, alza lo stato di un gradino. Quindi `servizi + 1` scatta quando qualcuno viene *fermato* alla transenna. Il controllo `p.faro > 0` c'è, ma oggi non scatta mai.
- **Le piste "rivali" e "fama" non danno indizi**: la specifica non ha un testo per loro. Gli indizi vengono da voci, luogo, soldi, complici e ricatto.
- **Il Silenzio blocca anche `inchiesta_pubblica`**, non solo l'apertura (scelta più sicura).
- Il fascicolo ritirato mette anche `inchiestaBlocco` a +2 Cicli (come l'archiviazione).
- I Servizi non si chiedono dal Faro. La riserva del doganiere fa parte dello stesso Servizio: niente Tracce in più.
- `macchiaAzione()` è un'approssimazione per l'avviso. Copre le azioni sporche e quelle notturne pagate con sporchi. Il Sette e mezzo non avvisa. Il motore resta quello che decide.
- Nessun oggetto 3D vero dentro tre.js (troppo rischioso): solo il segno HTML, che però si vede anche nel 3D.
- `server/` va rigenerato (terser).

## Prove
- `node --check` su motore.js, bot.js e gioco.js (.mjs): ok.
- **Simulazione 200 partite, 12 Cicli: 0 errori** (sim.js e la mia sim-fedina.js, che conta anche Servizi e Fedina).
  - Prima (565c1b6): mediana del vincitore 117 / 117 / 117 / 117 M. Media per carattere: Furbo 64-67, Legale 95-101, Costruttore 93-94, Spavaldo 74-81, Esperto 63-66, Investitore 107-109. Condanne ~559.
  - Dopo: mediana 112 / 113 / 114 / 116 / 117 M (circa −2%). Furbo 61-69, Legale 94-99, Costruttore 86-91, Spavaldo 64-73, Esperto 62-67, Investitore 103-111. Condanne ~605-630 (+10%).
  - Su 200 partite: ~840 esposti, ~1115 inchieste aperte, ~720 pubblicate, ~400 opere. Servizi dei bot: 3-6 transenne e 0-2 doganieri. Vargas 0: i bot non comprano mai il Commissario. Sindaco che toglie: 0.
  - **Condanne nate dalla transenna: 0-1 su 200 partite** (fermati alla transenna: 0-2). La transenna non sbilancia niente.
- `vecchia.js`: 10 partite su 10 senza errori.
- `casi-favori.js`: 62 ok, 0 sbagliati.
- **`casi-fedina.js` (nuova): 113 ok, 0 sbagliati.**
  - Usa ogni Servizio con i suoi rifiuti: transenna, retata, conto di giorno e di notte, lista e riserva del doganiere.
  - Bruno cade sulla transenna con un tiro vero; il Sindaco la toglie; la transenna sparisce al turno dopo di chi l'ha messa.
  - L'esposto a segno e a vuoto, con lo stop. L'inchiesta con 2 indizi diversi e la pubblicazione. Il Silenzio blocca l'inchiesta. Le accuse ritirate e l'archiviazione.
  - L'Opera pubblica, una per isola e una a testa, e la targa tolta dopo la condanna. La macchia che torna falsa all'Alba.
  - La vista di Dario (terzo giocatore) non ha: `da` della transenna, luogo e firma dell'esposto, `ordineVargas`, fascicolo, contiVisti, arrivi, sottoInchiesta, macchia.
  - `vista()` non cambia lo stato. Una partita vecchia senza i campi nuovi gioca un Ciclo intero.
- `gioca.py 200`: nessun errore della pagina (rifatto anche dopo l'ultima modifica all'interfaccia). Il giocatore automatico a un certo punto resta fermo ("nessuno" nel suo output, carta con "…"): succede uguale sul codice di prima (565c1b6, provato), quindi è un limite della prova, non della modifica.
- Screenshot guardati in /tmp/foto/:
  - rete.png: La tua rete, con umore e pulsanti;
  - transenna-fin.png: la scelta della via;
  - municipio.png: Cittadino onesto, con fascicolo e indizio;
  - conti.png: la Fedina con le tacche;
  - mappa.png: transenna e Teatro nel 3D;
  - chips-zoom.png: "Fedina N" accanto ai nomi;
  - avviso.png: "perdi la Fedina pulita".
  - Ho provato nel browser anche "Mettila" e "Firma un esposto": funzionano.

## Rischi
- **Le inchieste dei bot puliti sono tante**: circa 3-4 pubblicate a partita, ognuna con +25 Tracce e un gradino al rivale. Lo Spavaldo perde ~10% e le condanne salgono ~10%. Se dà fastidio: i bot pubblicano solo con 2 indizi, o aprono un'inchiesta al massimo ogni 2 Cicli.
- **Il Costruttore perde ~6%**: compra l'Opera (3 M) appena può. Nelle partite brevi conviene poco. Si può alzare la soglia del bot (es. soldi > 10 M).
- I Servizi tra bot quasi non succedono: Vargas mai, la transenna pochissimo. La parte vera la faranno le persone: va guardata in partite vere.
- L'avviso Fedina può uscire anche per spese notturne piccole (un drink pagato con sporchi), perché anche 1 € sporco macchia. È voluto, ma può sembrare fastidioso.
- `server/` non è aggiornato.
