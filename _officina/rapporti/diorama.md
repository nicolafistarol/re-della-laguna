# Diorama — il tabellone è la foto, in 3D (rapporto del Coder 3D)

**Stato: IN CORSO (prima versione funzionante, commit 5600703 sul ramo `lav-3d`).** Questo file viene aggiornato a ogni passo.

Cartella di lavoro: `/home/claude/lav-3d` (ramo `lav-3d`, solo commit locali). Strumenti di prova: `/home/claude/prove/diorama/` (`scatta.js`, `genera.js`, `ricca.js`, stati in `stati/`).

## Cosa c'è già
- **Il tabellone è la foto** (`img/mappa-hd.jpg`) messa in rilievo. `tre.js` è il nuovo tabellone, `mondo3d.js` il mondo (foto, mare che si muove, cielo, notte). Stessa interfaccia verso `gioco.js` di prima.
- **Caselle** sulle coordinate vere della foto (quelle di `gioco.js`). Ogni casella è una piazzola dipinta sulla strada. Tocco = scheda.
- **Pezzi**: edifici nello stile e coi colori dell'isola (5 livelli, cantiere con la gru), bandiera e alone del colore del giocatore (cerchio d'oro in più sui tuoi), Palazzi a gradoni, auto sportive con la targa col nome.
- **Etichette** poche e mai sovrapposte: nome della casella dove sei o che tocchi, prezzi dei terreni liberi vicini, icone dei posti speciali solo da vicino.
- **Visuali**: Arcipelago, Segui, volo dentro un'isola toccando il suo nome (con le sue caselle visibili), e da lì "Scendi in strada".
- **Robustezza**: three.js in `vendor/`, caricamento a parte con tempo massimo, avviso col motivo se il 3D non parte, chiave nuova `laguna_vista`, un solo selettore "Vista". Vecchio mondo solo con `?cubetti`.
- **Finestre di scelta** di lato, senza velo.

## Ancora da fare / da verificare
- Prove vere: tiro dei dadi e movimento, acquisto, ripiego senza WebGL, 1024x768 e telefono, notte→alba.
- Rifinitura dei pezzi, conteggio di draw call e triangoli, `controlla.sh`.
- Elenco delle immagini da generare, foto finali in `/home/claude/prove/arte3d/finale/`.

## File toccati
`tre.js` (nuovo), `mondo3d.js` (nuovo), `cubetti.js` e `cubetti-mondo.js` (i vecchi tre.js e mondo3d.js rinominati), `index.html` (import map verso `vendor/`), `vendor/three/…`, `img/rilievo.webp`, `img/mare-base.webp`, `img/prof/*.webp`, `stile.css` (solo in fondo), `gioco.js` (solo: caricamento del 3D, `vuole3D`, avvio, selettore Vista, `finestra`/`diLato`).
