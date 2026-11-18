# Rapporto ESTETICA — Re della Laguna (v65)

Settore: aspetto dell'interfaccia (pannelli, pulsanti, caratteri, colori, sovrapposizioni, animazioni dell'interfaccia, telefono) + audio.
Il mondo 3D in sé l'ho guardato solo dove si scontra con l'interfaccia.

Materiale nella mia cartella `/home/claude/prove/estetica/`:
- `shot/` — 109 foto. Nomi: `<dimensione>-g-*` giorno, `-n*` notte/alba, `-f*` fine partita, `-m*` telefono piccolo e orizzontale, `DOPO-*` = le stesse schermate con i miei ritocchi CSS applicati a una copia.
- `stati/*.json` — partite a punti diversi (inizio, Ciclo 3, Ciclo 4, notte, fine), generate coi bot (`genera.js`).
- `giro.js` — strumento a più passi (carica una partita, clicca, fa le foto; carica anche i font veri, Manrope e DM Serif Display, da npm).
- `ritocchi.css` — i ritocchi proposti, **già provati** su una copia (`copia/`). Il gioco vero non è stato toccato.
- `spettro-*.png`, `onda-*.png` — analisi delle musiche.

Dimensioni provate: 1280x800, 1440x900, 1024x768 (la finestra del Mac di Nicola), telefono 390x844, 360x740, e in orizzontale 844x390.

---

## LE 5 COSE PIÙ IMPORTANTI

1. **Sul telefono l'interfaccia si rompe** (EST-01, EST-02, EST-03). In verticale: Dario sparisce, la Legenda copre il pannello dei soldi e la fase, i 3 dadi escono dallo schermo, l'etichetta dei soldi diventa una colonna stretta. In orizzontale il gioco è quasi inutilizzabile. Ho scritto e provato il CSS che lo sistema (`ritocchi.css`, foto `DOPO-390x844-*`).
2. **Sull'iPhone la musica non funziona come previsto** (AUD-01): Safari su iPhone non lascia cambiare il volume da codice. Quindi niente dissolvenza, musica a volume pieno, e passando dal giorno alla notte **suonano tutti e due i brani insieme**. In più il loop in MP3 ha un piccolo buco (AUD-02), e i brani sono corti e "ovattati" (AUD-03).
3. **Sulla finestra del Mac (1024x768) i pannelli si accavallano** (EST-04, EST-05, EST-06): il registro a sinistra finisce sotto la carta, il telefono tocca il pannello dei soldi e copre "Fine turno", il cartello 3D gigante ("Spezie") passa sotto la fase. Tre avvisi diversi compaiono nello stesso punto in alto.
4. **Stile poco coerente, quindi poco "lusso"** (EST-07, EST-08): 63 colori diversi nel CSS (6 ori diversi), 28 grandezze di carattere, 18 arrotondamenti, 368 `style="..."` scritti dentro gioco.js, emoji mescolate alle icone disegnate. Il lusso viene dalla disciplina: un oro solo, una scala di caratteri, icone di un solo tipo.
5. **I momenti importanti non hanno festa né suono** (EST-09, EST-10, AUD-04): la fine della partita è una tabellina uguale a ogni altra finestra; il passaggio di livello mostra un testo sbagliato; mancano i suoni di acquisto, affitto, Alba, arresto, vittoria. Le finestre compaiono di colpo, senza animazione.

Decisioni da chiedere a Nicola: **5** (D1–D5, in fondo).

---

## DIREZIONE ESTETICA PROPOSTA: "Oro e Inchiostro" (Riviera di notte)

Un'idea sola, da applicare ovunque: **lusso discreto da yacht club**, con pannelli di vetro scuro, un solo oro e i soldi scritti come su un assegno.

- **Fondo**: inchiostro blu-notte (`#0a0f1a`), vetro scuro al 74%, **filo d'oro sottile** (1px, oro al 30%) sui pannelli importanti (soldi, carta, finestre, telefono).
- **Un solo oro** (`--oro:#f3c56b`, più una variante scura `--oro-scuro:#c9a24a`). L'oro vuol dire solo tre cose: **è tuo**, **azione principale**, **soldi**. Verde e rosso solo per soldi che entrano o escono. Viola solo per la setta. Azzurro solo per la notte.
- **Caratteri**: DM Serif Display per nomi di luoghi, cifre dei soldi e titoli. Manrope per il resto. Scala fissa: 11 / 13 / 15 / 20 / 28 / 40 px. Numeri sempre in colonna (`font-variant-numeric: tabular-nums`), così le cifre non ballano quando cambiano.
- **Icone**: solo le icone a linea già presenti (Lucide, in icone.js), in bianco o oro. **Zero emoji** nell'interfaccia.
- **Forme**: 3 arrotondamenti (10 pulsanti e chip, 16 schede, 24 finestre), un'ombra sola.
- **Movimento**: le finestre salgono in 0,25 s; i soldi contano su e giù; le monete volano (c'è già); un lampo d'oro per livello, Alba e vittoria. Si rispetta "riduci movimento".
- **Giorno e notte con gli stessi pannelli**: cambia solo il colore d'accento (giorno oro caldo, notte azzurro/neon). Basta `body.di-notte{--accento:var(--cielo)}`.
- Cose già buone da tenere: la Gazzetta color avorio con il rosso, le foto delle scene notturne, la schermata "Dove vai?" con le foto dei luoghi, il totale dei soldi in serif verde, la guida a slide.

---

## PROBLEMI

### EST-01 — Telefono in verticale: l'HUD si accavalla
- **Gravità**: ALTA
- **Dove**: stile.css:163 (`@media(max-width:900px)`), :64-75 (hud), :232 (legenda top:62px), :266 (audio top:132px).
- **Come si vede**: `shot/390x844-g01-giorno.png`, `360x740-m01-giorno.png`. Le chip dei giocatori vanno a capo e Dario finisce sotto la Legenda. Anche la fase ("Ciclo 4 di 6…") va sotto la Legenda. Il pannello soldi è alto 100 px e copre la mappa. A 360 px si vede male anche il nome del luogo nella carta.
- **Proposta** (provata, `DOPO-390x844-e01-giorno.png`). Sul telefono le chip diventano solo pallini con l'iniziale; soldi compatti a destra; fase sotto; Legenda, audio e comandi più in basso. Codice in `ritocchi.css`, blocco `@media(max-width:700px)` più la correzione finale (`.legenda{top:130px}` ecc.). Lavoro: **piccolo**.
- **Decisione di Nicola**: NO.

### EST-02 — Telefono: i 3 dadi escono dallo schermo, l'etichetta dei soldi si schiaccia
- **Gravità**: ALTA
- **Dove**: stile.css:147-159 (`.cubo` 96 px, spazio 46 px: con 3 dadi servono ~380 px); :245 (`.flusso-etichetta` senza larghezza minima).
- **Come si vede**: `390x844-g05-dadi.png` (il primo e il terzo dado sono tagliati); `390x844-g06-dopo-dadi.png` ("la Banca → Tu 250.000 €" diventa una colonna di 8 righe sopra il pannello soldi).
- **Proposta** (provata, `DOPO-390x844-d02-dadi.png`): dadi da 62 px, spazio 16 px, `translateZ(31px)`; etichetta con `width:max-content;max-width:calc(100vw - 24px);flex-wrap:wrap;top:96px`. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-03 — Telefono in orizzontale (844x390): quasi inutilizzabile
- **Gravità**: ALTA (gli amici giocano anche da telefono, e spesso lo girano)
- **Dove**: nessuna regola per schermi bassi; stile.css:172 (comandi vista in colonna, 9 pulsanti, ~380 px); :95 (telefono alto `100vh-32px`).
- **Come si vede**: `844x390-m01-giorno.png`: la colonna dei comandi esce sopra lo schermo, la carta copre il centro, il pannello soldi è coperto dalla Legenda. `844x390-m02-telefono.png`: nel telefono si vede una sola fila di app; "Cambia nome" ed "Esci dalla partita" stanno sempre fuori dalla parte che scorre e si mangiano metà spazio.
- **Proposta**: blocco `@media(max-height:500px) and (orientation:landscape)` in `ritocchi.css`: carta in basso a sinistra, comandi in riga in basso a destra, registro nascosto, telefono a tutto schermo (`DOPO-844x390-e01-giorno.png`). In più (gioco.js:1628) spostare "Cambia nome"/"Esci dalla partita" **dentro** `.home2`, in fondo alla lista che scorre, o in un'app "Impostazioni". Lavoro: **medio** (serve un altro giro di prove sul telefono vero).
- **Decisione**: NO.

### EST-04 — 1024x768: il registro finisce sotto la carta
- **Gravità**: ALTA (è la finestra di Nicola)
- **Dove**: stile.css:76 (`.carta` centrata, 620 px) e :81 (`.ticker` 300 px a sinistra). Tra 701 e 1240 px si accavallano.
- **Come si vede**: `1024x768-g-01-giorno.png`: le righe del registro sono tagliate a metà ("Rocco apre il cantiere: Discoteca…").
- **Proposta** (provata, `DOPO-1024x768-d01-giorno.png`):
  ```css
  @media(min-width:701px) and (max-width:1180px){.ticker{width:250px}.carta{left:calc(278px + (100vw - 374px)/2);width:min(600px,calc(100vw - 374px))}}
  ```
  Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-05 — Il telefono tocca il pannello soldi e copre "Fine turno"
- **Gravità**: MEDIA
- **Dove**: stile.css:95 (`.tel{height:min(660px,calc(100vh - 32px))}`).
- **Come si vede**: `1280x800-g-08-telefono.png`: il bordo alto del telefono tocca il pannello soldi; il telefono copre l'angolo destro della carta (metà di "Fine turno") e tutti i comandi della vista.
- **Proposta**: `.tel{height:min(660px,calc(100vh - 150px))}`; quando il telefono è aperto su PC, la carta si sposta a sinistra (`body.tel-aperto .carta{left:calc(50% - 190px)}`, serve una classe messa da gioco.js). Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-06 — Tre avvisi diversi nello stesso punto; cartello 3D sotto l'HUD
- **Gravità**: MEDIA
- **Dove**: stile.css:136 (`#toasts` top 72), :245 (`.flusso-etichetta` top 76), :450 (`.ultimora` top 64), :160 (`.delta` top 150, sopra il pulsante audio a top 132).
- **Come si vede**: `1280x800-g-07-scelta.png`: l'etichetta "la Banca → Tu" copre il cartello 3D "Spezie", che a sua volta passa sotto la fase. Se arrivano insieme un toast e l'Ultim'ora, si sovrappongono.
- **Proposta**: una sola **fila di avvisi** in alto al centro (contenitore flex in colonna con `gap:6px`), dove entrano toast, Ultim'ora e soldi uno sotto l'altro. Il `+€` del saldo va attaccato al pannello soldi (`position:absolute` dentro `.saldo`). I cartelli 3D dei gruppi di vie (li disegna il 3D) non devono mai entrare nella fascia alta di 110 px (al critico 3D). Lavoro: **medio**.
- **Decisione**: NO.

### EST-07 — Troppi colori, caratteri e stili sparsi: l'insieme sembra "fatto a mano", non di lusso
- **Gravità**: MEDIA (impatto alto sulla sensazione di lusso)
- **Dove**: stile.css intero; gioco.js (368 `style="..."` dentro i testi HTML).
- **Numeri**: 63 colori esadecimali diversi; ori diversi: `#f3c56b`, `#f5c84c`, `#d4a017`, `#c9a24a`, `#e0a526`, `#ffd27a`; 28 grandezze di carattere (da 8,5 a 76 px, anche 9 / 9,5 / 10 / 11 / 11,5 / 12 / 12,5…); 18 arrotondamenti diversi; z-index da 1 a 9001 senza un ordine.
- **Proposta**: variabili (`--oro`, `--oro-scuro`, `--filo`, `--t-xs…--t-xl`, `--r1/2/3`, livelli `--z-hud:20; --z-tel:30; --z-fin:50; --z-avvisi:60`), poi sostituire i valori sparsi. Spostare gli `style=""` più ripetuti in classi (`.c-oro`, `.c-muted`, `.c-sporco`, `.riga.tra` per `justify-content:space-between`). Lavoro: **medio** (lavoro di pulizia, senza rischi per le regole).
- **Decisione**: SÌ → D1 (la direzione).

### EST-08 — Emoji mescolate alle icone disegnate
- **Gravità**: MEDIA
- **Dove**: gioco.js: 📱 tasto telefono (1621), 🔊/🔇 audio (579), 🚗🧭🗺️ comandi vista (878), 📖 Guida (666), ⭐ ⚠️ nelle Imprese, 📰 all'Alba, 🔒 al Faro, 👥 nella schermata iniziale, 🃏🪙🏆⚔️🪵 a Sette e mezzo… In tutto ~45 emoji diverse.
- **Come si vede**: `1280x800-g-01-giorno.png` (comandi vista con emoji colorate accanto a icone bianche a linea), `1280x800-g-07b-imprese.png` (stelline gialle e triangoli emoji nel testo).
- **Problema**: le emoji cambiano aspetto tra Mac, Windows (gli amici) e Android, e danno un'aria da chat, non da club esclusivo.
- **Proposta**: usare `ico()` ovunque (le icone ci sono già quasi tutte: `telefono`, `mappa`, `stella`, `gazzetta`, `sole`, `luna`…); aggiungere da Lucide `volume-2`, `volume-x`, `car`, `compass`, `book-open`, `lock`, `alert-triangle`. Per le carte da gioco si possono tenere i semi disegnati. Lavoro: **piccolo-medio**.
- **Decisione**: NO.

### EST-09 — La fine della partita non è una festa
- **Gravità**: MEDIA
- **Dove**: gioco.js:2494 `fine()`; nessun cambio di musica.
- **Come si vede**: `1280x800-f01-fine.png`, `390x844-f01-fine.png`: una tabellina dentro la solita finestra, "Fine della serata" come titoletto, il vincitore è solo la riga 1. Sotto resta il tabellone col turno e "La partita è finita" nella carta. Nessun suono.
- **Proposta**: schermata a tutto schermo "Il Re della Laguna": foto di sfondo (penthouse o yacht di notte), corona d'oro, nome del vincitore grande in serif con il patrimonio che conta fino alla cifra finale; sotto il podio 2°-3°-4°; poi i titoli come "medaglie" (Mani Pulite, La Stella…); la Resa dei conti e le sette come "rivelazioni" che si aprono una alla volta. Musica: breve fanfara/jingle, poi il tema del giorno. Lavoro: **medio**.
- **Decisione**: SÌ → D4.

### EST-10 — Finestra "Sei salito di livello": testo sbagliato e impaginazione vuota
- **Gravità**: MEDIA
- **Dove**: gioco.js:2064-2066. Prende **l'ultimo messaggio di Vera, qualunque sia**.
- **Come si vede**: `1280x800-g-00-popup.png`: titolo "Livello 1", ma il testo è "Club Neon: qualcuno ha notato la tua faccia. Se ci torni stanotte, ti riconoscono più facilmente." (non c'entra niente). Le icone delle app nuove sono allineate a sinistra in una griglia da 4, con un grande vuoto a destra. Si vede ogni volta che si apre la partita su un browser nuovo (il "già visto" è salvato solo nel browser).
- **Proposta**: usare il testo del livello (`SBLOCCHI[S.sblocco]`), non l'ultimo messaggio; icone centrate (`justify-content:center`, griglia `repeat(auto-fit,72px)`); kick "Livello raggiunto" con un lampo d'oro e un suono. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-11 — Le finestre compaiono di colpo; niente tasto Esc
- **Gravità**: BASSA
- **Dove**: gioco.js:1990 `finestra()`; stile.css:123-124.
- **Come si vede**: ogni finestra appare istantanea su un velo semi-trasparente; con Esc o toccando fuori non si chiude (le informative "Ok"/"Andiamo"); non ha `role="dialog"`.
- **Proposta** (provata):
  ```css
  .velo{backdrop-filter:blur(3px);animation:veloIn .18s ease-out}
  .fin{animation:finIn .26s cubic-bezier(.2,.8,.2,1);border-color:var(--filo)}
  @keyframes veloIn{from{opacity:0}}@keyframes finIn{from{opacity:0;transform:translateY(12px) scale(.98)}}
  button:active{transform:translateY(1px);filter:brightness(.95)}
  ```
  E in JS: `role="dialog" aria-modal="true"`, Esc chiude le finestre che hanno un solo pulsante. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-12 — Legenda: la nota "Nel mondo 3D" si spezza in colonne
- **Gravità**: BASSA
- **Dove**: stile.css:235 (`.legenda .leg-dentro>div{display:flex}` vale anche per la nota con `<b>`).
- **Come si vede**: `1280x800-g-03-legenda.png`: "Nel mondo 3D:" diventa una colonna stretta a sinistra e il testo una colonna a destra. La Legenda aperta copre anche il registro.
- **Proposta**: `.legenda .leg-dentro>div.sub{display:block}` (provata). Inoltre la legenda mostra simboli 2D (etichetta "60k", quadratino "T") che nel mondo 3D non si vedono così: da rifare insieme al critico 3D. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-13 — Il telefono del gioco dentro un telefono vero
- **Gravità**: MEDIA
- **Dove**: stile.css:95-96 (cornice nera, angoli di 42 px, "barretta" in basso), :163 (`.tel{width:calc(100vw - 32px)}`).
- **Come si vede**: `390x844-g08-telefono.png`: sopra si vedono ancora chip e fase, la cornice spreca ~40 px per lato, il pulsante "✕ Chiudi" è piccolo.
- **Proposta**: sotto i 700 px il telefono del gioco **diventa lo schermo** (a tutto schermo, senza cornice, rispettando la tacca dell'iPhone con `env(safe-area-inset-*)`). Provato: `DOPO-390x844-d04-telefono.png`. Su PC la cornice resta (fa scena). Lavoro: **piccolo**.
- **Decisione**: SÌ → D2.

### EST-14 — Carta del giorno vuota con "…" durante i turni degli altri
- **Gravità**: BASSA
- **Dove**: gioco.js:582 (`animando ? '<div class="sub">…</div>'`).
- **Come si vede**: `1024x768-g-16-dopo-fine-turno.png`, `390x844-g06-dopo-dadi.png`: un grande riquadro di vetro vuoto con tre puntini. Sembra un errore.
- **Proposta**: mostrare "Turno di Rocco" con il suo pallino colorato e un indicatore che si muove (tre puntini animati), oppure nascondere la carta mentre si anima. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-15 — Comandi della vista: 9 pulsanti in colonna, pulsante audio da solo
- **Gravità**: BASSA
- **Dove**: stile.css:172-173, :266; gioco.js:877-878.
- **Come si vede**: colonna di 9 pulsanti a destra (Segui/Libera/Alto con emoji, poi + − ⟲ ⟳ ◎ 2D); il pulsante audio sta "volante" a metà schermo, sotto il pannello soldi.
- **Proposta**: in alto i 3 modi (Segui/Libera/Alto) come un unico interruttore a tre posizioni; zoom e rotazione sotto, più piccoli; "2D" e audio in un piccolo menu "⚙ Impostazioni" (con anche volume musica / volume effetti, vedi AUD-05). Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-16 — Leggibilità: caratteri piccoli e grigio su vetro
- **Gravità**: BASSA
- **Dove**: `.app-riga` 10 px, `.nuova` 8,5 px, `.livc.vuoto` 9,5 px, `.chip .s` 11 px; `--muted` (bianco al 72%) su vetro trasparente al 62% sopra un 3D che cambia colore.
- **Come si vede**: `1280x800-g-01-giorno.png` (sottotitoli delle chip), `390x844-g08-telefono.png` (righe sotto le app).
- **Proposta**: minimo 11 px ovunque, 12 px su telefono; vetro più coprente (`--vetro:rgba(9,13,22,.74)`) così il contrasto non dipende da cosa c'è sotto. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-17 — Prestazioni: tanto vetro sfocato sopra un 3D che si muove
- **Gravità**: BASSA-MEDIA (Mac M1 e Safari)
- **Dove**: `.vetro{backdrop-filter:blur(14px) saturate(1.2)}`: di giorno ~12 riquadri sfocati sopra la tela 3D, che viene ridisegnata a ogni fotogramma. La sfocatura viene ricalcolata ogni volta.
- **Proposta**: sfocatura a 10 px (provata, non si nota la differenza); per le cose piccole (chip, pulsanti dei comandi, audio, tasto telefono) niente sfocatura, solo fondo pieno `rgba(9,13,22,.82)`. Misurare prima/dopo sul Mac di Nicola. Lavoro: **piccolo**.
- **Decisione**: NO.

### EST-18 — Pulsante oro "piatto"
- **Gravità**: BASSA (gusto)
- **Proposta** (provata, `DOPO-*`): `button.oro{background:linear-gradient(180deg,#f7d58a,#e6b552);box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 6px 18px rgba(243,197,107,.25)}`: sembra una placca d'oro vera, non un rettangolo giallo. Lavoro: **piccolo**.
- **Decisione**: fa parte di D1.

---

## AUDIO

Misure (ffmpeg, EBU R128):

| Brano | Durata | Loudness | Picco | Ampiezza (LRA) | Clipping |
|---|---|---|---|---|---|
| giorno.mp3 | 83,5 s | −16,5 LUFS | −5,1 dBFS | 2,4 LU | no |
| notte.mp3 | 101,1 s | −16,0 LUFS | −1,8 dBFS | 7,1 LU | no |

Entrambi MP3 128 kbps, 44,1 kHz, stereo. Nel gioco suonano al 38% (`VOL_MUSICA = 0.38`), cioè circa −24 LUFS: un volume giusto per fare da sottofondo.

Dove parte e si ferma nel codice (gioco.js:73-137):
- L'audio si sblocca al primo tocco o tasto (`pointerdown`/`keydown`).
- La musica parte solo da `disegna()` → `Suono.ambiente("giorno"|"notte")`: quindi **nella schermata iniziale e nella guida non c'è musica**.
- Il cambio giorno/notte fa una dissolvenza di circa 1,3 s (passi da 0,02 ogni 70 ms).
- All'Alba e alla fine della partita la musica non cambia: continua quella del giorno.
- Il pulsante audio spegne tutto (musica + effetti); non ci sono volumi separati.
- Effetti sintetizzati (Web Audio): `dado` (9 colpetti di rumore), `passo` (un "bip" a onda quadra per **ogni** casella), `soldi` (arpeggio su o giù), `avviso` (toast), `telefono` (squillo). Codice morto: `PENTA` (riga 98) non è usato.

### AUD-01 — iPhone/iPad: niente dissolvenza, musica a volume pieno, due brani insieme
- **Gravità**: ALTA (per chi gioca da iPhone)
- **Dove**: gioco.js:101-117 (`a.volume = …` su elementi `<audio>`).
- **Perché**: su iOS Safari il volume di un elemento `<audio>` non si può cambiare da codice (resta sempre 1). Quindi: la musica parte al 100% invece che al 38%. Il ciclo di dissolvenza non finisce mai (il `setInterval` gira per sempre, ogni 70 ms). Il brano vecchio non arriva mai a 0, quindi **non viene messo in pausa**: dalla prima notte in poi giorno e notte suonano insieme. Gli effetti invece passano dal `master` e si sentono più piano della musica.
- **Proposta**: caricare i brani con Web Audio (`fetch` → `decodeAudioData` → `AudioBufferSourceNode` con `loop=true`) e fare la dissolvenza su un `GainNode` collegato al `master`. Si risolvono insieme AUD-01, AUD-02 e il pulsante unico del volume. In alternativa più piccola: `ctx.createMediaElementSource(a)` → gain. Lavoro: **piccolo-medio**. Da provare su un iPhone vero.
- **Decisione**: NO.

### AUD-02 — Il loop dell'MP3 "salta"
- **Gravità**: MEDIA
- **Dove**: musica/*.mp3 + `a.loop = true`.
- **Come si vede**: l'MP3 ha un ritardo iniziale (start_time 0,025 s) e un riempimento finale (durata 83,513 s contro gli 83,478 s del brano composto). Con `<audio loop>` a ogni giro si sente un piccolo buco o "tic", ogni 83 s di giorno e ogni 101 s di notte. Il compositore aveva fatto bene il lavoro: la coda del riverbero è riportata all'inizio (compositore.py:215-217). È il formato MP3 a rovinarlo.
- **Proposta**: con la soluzione di AUD-01 impostare `loopStart`/`loopEnd` esatti (0 e 32 battute), oppure esportare in `.m4a` (AAC con dati per il loop senza buchi) o `.ogg` e mettere l'MP3 come riserva. Lavoro: **piccolo**.
- **Decisione**: NO.

### AUD-03 — Brani corti, ripetitivi e "ovattati"
- **Gravità**: MEDIA (Nicola vuole musica "intrigante")
- **Come si vede**:
  - Il giorno dura 83 s e un Ciclo ~15 minuti: lo stesso brano gira ~10 volte per Ciclo. Ogni brano ha la forma intro → tema → tema+ → coda: a ogni giro **ricomincia dall'intro spoglia**, quindi l'energia cala e risale ogni 1-2 minuti. L'ampiezza del giorno è 2,4 LU, cioè molto piatta.
  - Notte: alla giunta del loop si passa da −23 dB (fine) a −9 dB (primo "colpo grave"). È un "boom" voluto, ma arriva ogni 101 s, sempre uguale.
  - Timbro: quasi niente sopra i 5 kHz (−50 dB, vedi `spettro-notte.png`); il grosso dell'energia è sotto i 120 Hz (basso, cassa, pulsazione, −19/−21 dB) e poco sui medi a 1 kHz (−28 dB di giorno). Sulle casse del MacBook e del telefono, che i bassi quasi non li riproducono, la musica suonerà **piatta, lontana, "dietro una porta"**. È questo che la fa sembrare poco intrigante.
- **Proposta**: (a) brani da 3-4 minuti, oppure 3-4 varianti per fase scelte a caso; (b) il loop riparte dalla parte "tema", non dall'intro (l'intro solo la prima volta); (c) nel mix: più presenza sui medi per vibrafono e celesta, filtro meno chiuso sulle spazzole e sul ride, un po' di "aria" sopra gli 8 kHz; il basso va tagliato sotto i 40 Hz e lasciato più armonico, così si sente anche sulle casse piccole; (d) un tema per l'Alba (30 s) e uno per la fine partita. Lavoro: **medio** (si rifà con compositore.py).
- **Decisione**: SÌ → D3.

### AUD-04 — Mancano molti effetti sonori
- **Gravità**: MEDIA
- **Ci sono**: dadi, passo, soldi su/giù, avviso, squillo del telefono.
- **Mancano** (in ordine di importanza):
  1. **Acquisto** di un terreno o di un piano ("cha-ching" di registratore + timbro).
  2. **Affitto pagato o incassato** (ora `soldi()` è uguale per tutto: uno stipendio da 600.000 € e un affitto da 5.000 € fanno lo stesso suono). Servono suoni più ricchi per cifre più alte.
  3. **Alba**: un piccolo tema (gallo lontano, campane, risacca) + conteggio delle rendite.
  4. **Livello raggiunto / app nuova**: lampo d'oro.
  5. **Arrivo della notte** (porta che si chiude, un accordo) e **arrivo in un luogo** (ambiente: musica del club ovattata, vento del faro, onde della marina).
  6. **Polizia / perquisizione / Faro** (sirena lontana, serratura che scatta).
  7. **Asta** (martelletto), **cantiere aperto** (gru/martello), **carte** a Sette e mezzo (carta distribuita, fiches).
  8. **Fine partita**: fanfara del vincitore.
  9. Click leggero sui pulsanti principali (Tira i dadi, Fine turno).
- Da ammorbidire: `passo` è un bip a onda quadra per ogni casella (con 3 dadi fino a 18 bip di fila), anche per gli altri giocatori. Meglio un "tic" morbido (sinusoide breve + filtro), solo per le tue mosse.
- **Proposta**: si possono generare tutti con lo stesso metodo di compositore.py (file corti `.ogg`/`.m4a`) o con Web Audio come ora. Lavoro: **medio**.
- **Decisione**: SÌ → D3 (stile dei suoni).

### AUD-05 — Un solo pulsante per tutto
- **Gravità**: BASSA
- **Proposta**: nel menu Impostazioni (EST-15) due cursori: "Musica" e "Effetti"; salvati in localStorage. Quando la scheda del browser è nascosta (`visibilitychange`) abbassare la musica, ma lasciare il suono dell'avviso "tocca a te". Lavoro: **piccolo**.
- **Decisione**: NO.

### AUD-06 — Nessuna musica nella schermata iniziale
- **Gravità**: BASSA
- **Proposta**: far partire il tema del giorno (piano) al primo tocco già nella schermata "Prova da solo" / sala d'attesa: la prima impressione è lì. Lavoro: **piccolo**.

---

## RITOCCHI CSS ORDINATI PER IMPATTO

Tutti in `/home/claude/prove/estetica/ritocchi.css` (da aggiungere in fondo a stile.css). Provati su copia: foto `shot/DOPO-*`.

1. **Telefono in verticale** (EST-01/02/13): blocco `@media(max-width:700px)` + correzione finale. Fa sparire tutte le sovrapposizioni dell'HUD, rimette i dadi dentro lo schermo, porta il telefono a tutto schermo.
2. **1024x768** (EST-04): `.ticker{width:250px}` + carta spostata nello spazio libero.
3. **Telefono in orizzontale** (EST-03): blocco `@media(max-height:500px) and (orientation:landscape)` (serve un'ultima rifinitura sul telefono vero + spostare "Esci"/"Cambia nome" in JS).
4. **Telefono su PC** (EST-05): `.tel{height:min(660px,calc(100vh - 150px))}`.
5. **Finestre che entrano** + pulsanti che si "premono" (EST-11).
6. **Vetro più coprente e meno sfocato** + filo d'oro su soldi/carta/finestre (EST-16/17, direzione): `--vetro:rgba(9,13,22,.74)`, `blur(10px)`, `border-color:var(--filo)`.
7. **Numeri in colonna**: `.saldo .tot,.miei-cifre b,.cifre b,.alba-numeri b,table.cl td{font-variant-numeric:tabular-nums}`.
8. **Pulsante oro "a placca"** (EST-18).
9. **Legenda** (EST-12): `.legenda .leg-dentro>div.sub{display:block}`.
10. Poi il lavoro più lungo: variabili e pulizia dei colori e dei caratteri (EST-07), emoji → icone (EST-08), fila unica degli avvisi (EST-06), schermata di vittoria (EST-09).

---

## DECISIONI PER NICOLA

**D1 — Che "lusso" vuoi?**
Oggi il gioco mescola tanti stili. Ne scegliamo uno e lo usiamo dappertutto.
- A) **Oro e Inchiostro** (consigliata): blu notte, un oro solo, linee sottili, caratteri eleganti. Come un club privato o uno yacht di notte.
- B) **Monte Carlo classico**: più oro, legno scuro, avorio, cornici. Come un casinò d'altri tempi.
- C) **Miami neon**: rosa e azzurro accesi, tanto bagliore. Più festa, meno eleganza.

**D2 — Sul telefono vero, il telefono del gioco come deve apparire?**
- A) **A tutto schermo**, come se fosse il tuo telefono (consigliata: più spazio, si legge meglio).
- B) Con la cornice del telefono disegnata, come su PC (più scenografico, ma piccolo).

**D3 — Musica e suoni: quanto lavoro ci mettiamo?**
- A) Sistemo solo i difetti (iPhone, loop, volume separato) e aggiungo i suoni che mancano (acquisto, Alba, livello, polizia, vittoria).
- B) Come A, e rifaccio le due musiche più lunghe, più chiare e con più varianti (consigliata).
- C) Come B, e in più un sottofondo diverso per ogni luogo della notte (club, marina, faro…).
E i suoni come li vuoi? 1) **veri** (registratore di cassa, sirena, carte) oppure 2) **musicali**, tipo campanelle e accordi (più eleganti, meno realistici).

**D4 — La fine della partita**
- A) Grande schermata del vincitore: corona, patrimonio che conta, podio, musica di festa (consigliata).
- B) Come A, ma le rivelazioni (setta, Resa dei conti, titoli) si scoprono una alla volta, come in TV.
- C) Va bene così (solo la tabella).

**D5 — Su schermi piccoli (la tua finestra del Mac) il registro a sinistra (le ultime 4 cose successe)…**
- A) Resta, più stretto (consigliata, già provata).
- B) Si nasconde e si apre con un pulsante "Cosa è successo".
- C) Si toglie: tanto c'è la Gazzetta.

---

## NOTE PER GLI ALTRI CRITICI
- **3D**: i cartelli giganti dei gruppi di vie ("Spezie / tue 1 vie su 3") finiscono dietro la fase e il pannello soldi (`1280x800-g-01-giorno.png`); l'etichetta "Gazzetta" appare due volte vicino alla pedina (`1280x800-g-08-telefono.png`); la legenda descrive simboli 2D.
- **Notte**: alcuni punti del panorama ("Il divano", "Il carrello dei liquori") stanno sotto i pannelli del testo (`1280x800-n01-palazzo.png`, `390x844-n01-palazzo.png`); il tasto del telefono copre l'angolo di "Resta a casa un'ora" su telefono.
- Le foto sono fatte con WebGL software (SwiftShader): i colori del 3D possono essere un po' diversi da quelli del Mac.
