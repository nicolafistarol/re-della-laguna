# Direttore artistico 3D — come rifare il tabellone perché sembri LA FOTO

Giudizio di Nicola da cui parto: «il 3D fa veramente schifo, è un gioco diverso. Lo stile della foto del tabellone va benissimo: bisogna ricrearlo in 3D nel modo migliore possibile».

Ho costruito tre prototipi veri (pagine che girano nel browser) e li ho confrontati guardando le foto.
Niente è stato toccato in `/home/claude/re-della-laguna`. Tutto sta in `/home/claude/prove/arte3d/`.

## Le 5 cose più importanti

1. **La strada giusta è usare la foto stessa, non rimodellare il mondo.** La foto, messa "in rilievo" con una mappa di profondità, dalla vista di partenza è identica alla foto (pixel per pixel) e ha volume vero. Voto somiglianza 9/10. Il mondo rifatto a modelli (anche con pacchetti gratuiti di qualità) resta un giocattolo low-poly: 3/10.
2. **Il limite vero è l'angolo.** Guardarsi intorno e fare zoom non deformano mai. Girare attorno al mondo invece regge solo fino a circa 3-4 gradi (pulito), 5-7 gradi (accettabile in movimento). Oltre, i grattacieli e i piloni dei ponti si "stirano". La vista "Alto" a piombo e la rotazione libera NON sono possibili con questa strada.
3. **Per "sentirsi dentro il mondo" la risposta sono i livelli, non la rotazione.** Si tocca un'isola, la camera ci vola sopra e si entra nella foto dell'isola (anche questa in rilievo, con parallasse). Le foto delle isole esistono già (`img/ambra.jpg`, `flamingo.jpg`...) e l'effetto è il migliore di tutti i prototipi.
4. **I pezzi di gioco sono il punto debole.** Caselle, edifici e pedine in 3D sopra la foto si leggono bene, ma sembrano ancora pezzi di plastica accanto a una foto ricchissima. Qui servono modelli fatti apposta (generatori di modelli 3D da immagine o Blender): è il lavoro artistico che resta.
5. **Con 4-6 immagini generate in più il risultato sale molto**: foto più definita (zoom nitido), versione notte vera (oggi la notte è un filtro), una veduta aerea per ogni isola. Costa crediti: decide Nicola.

Decisioni che servono da Nicola: **4** (in fondo).

---

## Com'è oggi (per confronto)

- Foto pulita del 3D attuale: `/home/claude/prove/arte3d/att/attuale-alto.png`. Isole piatte color plastica, cubetti, mare scuro. Nicola ha ragione: è un altro gioco.
- La foto di riferimento: `/home/claude/re-della-laguna/img/mappa-hd.jpg` (2048x1152).

Cosa ho capito della foto studiandola:
- Non è una mappa dall'alto. È una veduta aerea obliqua (camera inclinata di circa 21 gradi verso il basso, campo visivo circa 55 gradi). Con questi numeri l'anello dei ponti risulta rotondo: il modello di camera è coerente.
- Le coordinate delle caselle esistono già e sono giuste: `gioco.js` righe 355-369 (`TRATTI`, `PUNTI_ESTERNI`, `POS_CASA`, `POS_LUOGO`), in percentuale della foto. Le ho riusate uguali.

---

## Proto 1 — "Foto in rilievo"

Cartella: `/home/claude/prove/arte3d/proto1/` (`index.html`, `rilievo.js`, `pezzi.js`, `geo.png`, `geo.json`, `mare-base.png`).

**Come funziona**
- Una rete di stima della profondità (Depth Anything V2, installata e fatta girare qui su CPU, 24 secondi) dà la distanza di ogni punto della foto.
- La calibro sul mare: il mare è un piano, quindi so la distanza vera di ogni riga d'acqua. Uso l'acqua come "metro" per tutta la foto.
- Ogni punto della foto viene rimesso nello spazio lungo il raggio della camera che ha "scattato" la foto. Risultato: una sola superficie 3D con la foto sopra.
- Il mare è animato da uno shader che sposta di pochissimo la foto dell'acqua (i colori di barriera e bassi fondali restano quelli veri) più scintille verso il sole. La maschera acqua/terra è ricavata da colore + profondità.
- Fuori dai bordi della foto il mare e il cielo continuano con gli stessi colori (serve sul telefono in piedi).
- Sopra ci sono solo gli elementi di gioco in 3D: 80 caselle sul percorso vero, edifici che crescono (5 livelli) nello stile dell'isola (tetti rossi ad Ambra, rosa a Flamingo, vetro a Corona e Sole), bandiere e anelli col colore del proprietario, pedine, torri dei Palazzi. Gli oggetti finiscono davvero dietro ai grattacieli della foto.
- Giorno/notte con un filtro (blu notte + finestre accese).

**Foto**
- Vista base PC: `/home/claude/prove/arte3d/foto/p1-base.png`
- Senza pezzi (è la foto, ma è 3D): `/home/claude/prove/arte3d/foto/p1-nudo.png`
- Zoom 2,6x su Ambra: `/home/claude/prove/arte3d/foto/p1-zoom-ambra.png`
- Notte: `/home/claude/prove/arte3d/foto/p1-notte.png`
- Telefono 390x844: `/home/claude/prove/arte3d/foto/p1-tel.png`
- Prova dell'angolo su Corona (4, 7, 12 gradi affiancati): `/home/claude/prove/arte3d/foto/p1-corona-confronto.png`
- Orbita 7 gradi: `/home/claude/prove/arte3d/foto/p1-az7.png` · 12 gradi: `/home/claude/prove/arte3d/foto/p1-az12.png` · 25 gradi (rotto): `/home/claude/prove/arte3d/foto/p1-az25.png`

**Voti e numeri**
- Somiglianza alla foto: **9/10** il mondo (è la foto). **6/10** con i pezzi sopra: i pezzi stonano ancora.
- Angolo: guardarsi intorno (ruotare lo sguardo) e zoom = **nessuna deformazione, mai**, perché la camera resta nel punto dello scatto. Girare attorno: **pulito fino a 3-4 gradi**, accettabile a 5-7, brutto da 10 in su. Ho aggiunto un taglio dei "teli stirati" che aiuta poco. Per questo nel prototipo la parallasse è piccola e automatica (la camera "respira").
- Zoom: fino a circa 2,5x regge. Oltre si vede che la foto è da 2048 punti (morbida). Le isole lontane (Palma, Flamingo) sono le più povere.
- Prestazioni: mondo = **3 draw call, 459 mila triangoli** (225 mila sul telefono), una texture. Con i pezzi 520 draw call (non ottimizzati: con le istanze scendono a poche decine).
- Peso: **0,96 MB** in tutto (foto 576 KB già nel gioco + 320 KB profondità + 32 KB mare + codice). three.js è già caricato dal gioco.
- Velocità vera: **non misurata**. Qui c'è solo un Chrome senza scheda video (0-3 fps, non vuol dire niente). Per com'è fatto (una superficie, shader leggero, niente ombre) mi aspetto 60 fps su Mac M1 e telefoni recenti, ma va provato sul Mac di Nicola.
- Non verificato: il movimento del mare (nelle foto ferme non si vede), i gesti a due dita su un telefono vero.

**Limiti**
- Niente vista "Alto" a piombo, niente rotazione libera.
- La notte a filtro è da 6/10: le finestre della foto non si accendono davvero e in alto a sinistra resta il bagliore del sole.
- Qualche disco delle caselle viene "morso" dal rilievo (la profondità ha un po' di rumore su ponti e strade).
- Ho provato a ricavare dalla foto una mappa dall'alto per avere un mondo vero: **fallito**, viene una macchia stirata (`/home/claude/prove/arte3d/foto/dallalto-fallito.png`). La profondità stimata basta per la parallasse, non per ricostruire il mondo.

**Lavoro per metterlo nel gioco vero**
- `rilievo.js` prende il posto di `mondo3d.js`. In `tre.js` cambiano: creazione del mondo, camera e comandi, conversione delle coordinate (`daMappa(x,y)` diventa `R.suolo(x,y)`), tocco sulle caselle. `aggiorna({caselle, torri, giocatori})` resta uguale: il prototipo usa già la stessa forma di dati. Le etichette HTML proiettate restano come oggi.
- "Segui" diventa: zoom + sguardo sulla pedina (non deforma). "Libera" = trascina e zoom. "Alto" va tolto o diventa "Tutta la laguna".
- Stima: **medio, 3-4 giorni** (2 per il cuore, 1-2 per pezzi/etichette/telefono), più la prova sul Mac M1.
- La mappa di profondità si prepara una volta sola, fuori dal gioco (script in `/home/claude/prove/arte3d/tools/prepara.py`).
- Nota licenze: per la mappa finale ho usato il modello "Base" (licenza non commerciale). Il modello "Small" (Apache 2.0, libero) dà quasi lo stesso risultato (uguale al 99,8%): nella versione vera si usa quello.

---

## Proto 2 — "Modelli pronti CC0"

Cartella: `/home/claude/prove/arte3d/proto2/`.

**Cosa sono riuscito a scaricare** (la rete qui permette solo GitHub e i registri di pacchetti):
- KayKit City Builder Bits (edifici A-H, auto) da GitHub `KayKit-Game-Assets`.
- Kenney Starter Kit City Builder e Racing (casette, alberi, veicoli) da GitHub `KenneyNL`.
- **Non raggiungibili**: kenney.nl, quaternius.com, poly.pizza, opengameart.org, sketchfab.com, polyhaven.com (tutti rifiutati). Quindi mancano proprio i pacchetti che servirebbero di più: Kenney "Watercraft Kit" (yacht), "City Kit Commercial/Suburban/Industrial", "Nature Kit" (palme), e tutto Quaternius. Su npm non c'è niente di utile. Per averli basta che Nicola li scarichi dal sito (sono gratis) e li metta in una cartella.

**Cosa ho costruito**: isole con la forma presa dalla foto, colori campionati dalla foto, mare con shader (turchese vicino a riva, blu fuori, barriera, schiuma, riflesso del sole), strada ad anello sulle caselle con ponti e piloni bianchi, città diverse per isola (5.250 oggetti in istanze), yacht, faro, palme, luci calde, nebbia, tonemapping. Stessi pezzi di gioco del Proto 1.

**Foto**
- Stessa inquadratura della foto: `/home/claude/prove/arte3d/foto/p2-foto.png`
- Dall'alto: `/home/claude/prove/arte3d/foto/p2-alto.png`
- Vicino ad Ambra: `/home/claude/prove/arte3d/foto/p2-ambra.png`
- Telefono: `/home/claude/prove/arte3d/foto/p2-tel.png`

**Voti e numeri**
- Somiglianza: **3/10**. Si riconosce la disposizione e i colori sono giusti, ma è un giocattolo low-poly: di nuovo "un gioco diverso". Meglio del 3D di oggi, lontanissimo dalla foto.
- Angolo: **libero**, anche dall'alto e raso terra. È il suo unico vero vantaggio.
- Prestazioni: 490 draw call, 475 mila triangoli, ombre. Peso 2,6 MB con three.js (modelli 1,4 MB).
- Lavoro per portarlo a un livello decente: **grande (2-3 settimane)**, e con i pacchetti gratuiti il tetto resta uno stile cartone (5/10). Per arrivare alla foto servirebbero modelli realistici fatti apposta: mesi, non settimane.

**Giudizio**: strada da non prendere per il mondo. I pacchetti servono solo per piccoli oggetti (automobiline come pedine).

---

## Proto 3 — "Diorama a livelli" (la mia proposta)

Cartella: `/home/claude/prove/arte3d/proto3/` (usa `rilievo.js` e `pezzi.js` del Proto 1, più `foto3d.js`).

**Idea**: invece di girare attorno al mondo (che non regge), si scende di livello.
- Livello 1: l'arcipelago in rilievo (Proto 1), con i nomi delle isole da toccare.
- Livello 2: tocchi un'isola, la camera ci vola sopra (zoom + sguardo, senza deformare) e sfuma **dentro la foto dell'isola**, anche lei in rilievo: muovendo il dito o il mouse la scena ha parallasse. "Arcipelago" per tornare su.
- Pedine = automobiline vere (modelli KayKit, CC0) tinte col colore del giocatore.

**Foto**
- Arcipelago con i nomi: `/home/claude/prove/arte3d/foto/p3-arcipelago.png`
- In volo verso Flamingo: `/home/claude/prove/arte3d/foto/p3-flamingo-volo.png`
- Dentro Flamingo: `/home/claude/prove/arte3d/foto/p3-flamingo-dentro.png`
- Dentro Corona: `/home/claude/prove/arte3d/foto/p3-corona-dentro.png`
- Dentro Ambra, telefono: `/home/claude/prove/arte3d/foto/p3-tel-ambra-dentro.png`
- Flamingo di notte (filtro): `/home/claude/prove/arte3d/foto/p3-flamingo-notte.png`

**Voti e numeri**
- Somiglianza: **9/10** (sono le foto di Nicola, vive). È l'unico prototipo che dà la sensazione "sono dentro il mondo".
- Angolo: come il Proto 1 nell'arcipelago. Dentro l'isola piccoli movimenti (pochi gradi), sufficienti per sentire il volume.
- Prestazioni: come il Proto 1; dentro l'isola **1 draw call, 73 mila triangoli**. Peso in più: circa 300 KB per isola (1,5 MB per cinque).
- Limiti: durante il volo verso le isole lontane la foto diventa morbida e a destra si vede il bordo (nella foto "in volo"). Dentro l'isola oggi non ci sono le caselle: le foto attuali sono a livello strada, con un personaggio di spalle. Per giocarci dentro servono vedute aeree delle isole (vedi sotto).
- Lavoro in più rispetto al Proto 1: **piccolo-medio, 1-2 giorni** per i livelli; **medio** in più se si vogliono le caselle anche dentro le isole (16 coordinate per isola da segnare a mano).

---

## Cosa si otterrebbe con strumenti esterni (opzioni per Nicola)

### Generazione di immagini (ElevenLabs, già collegato, a crediti — NON usato)
Cosa farei generare, in ordine di utilità:
1. **Versione notte della stessa identica foto** (modifica dell'immagine: stessa inquadratura, finestre accese, luna, ponti illuminati). Siccome combacia punto per punto, uso la stessa profondità e sfumo giorno/notte. Toglie il difetto più visibile.
2. **Foto del tabellone a risoluzione doppia o quadrupla** (4096 o più, stessa immagine ingrandita). Zoom nitido fino a 5x.
3. **Una veduta aerea per ogni isola** (5 immagini, stesso stile, tre quarti dall'alto, partendo dal ritaglio della foto). Diventano il livello 2 con le caselle sopra, al posto delle foto a livello strada.
4. **Foglio di modelli per i pezzi**: per ogni isola l'edificio ai 5 livelli su fondo neutro, e le pedine (auto, yacht). Servono come base per i generatori di modelli 3D qui sotto.
5. Non servono: "foto perfettamente dall'alto" (toglierebbe proprio lo stile che piace) e "mappa di profondità generata" (quella calcolata qui è già buona e gratis).

### Generatori di modelli 3D da immagine
Informazioni lette oggi (18/11/2026) su pagine pubbliche, da riverificare sui siti prima di decidere. Fonti: [documentazione Meshy](https://docs.meshy.ai/en/webapp/pricing), [confronto prezzi 3D AI Studio](https://www.3daistudio.com/3d-generator-ai-comparison-alternatives-guide/ai-3d-generator-pricing-compared), [Hunyuan3D 2.1 per Mac](https://raw.githubusercontent.com/VladimirTalyzin/hunyuan3d-2.1-mac/main/README.md).
- **Meshy**: piano gratuito con 100 crediti al mese; un modello da immagine costa 20 crediti (10 con la versione Lite), quindi 5-10 modelli al mese. I modelli fatti col piano gratuito portano la licenza CC BY 4.0: uso libero citando l'autore. Una fonte dice che col piano gratuito lo scaricamento è limitato: da controllare.
- **Tripo**: nel piano gratuito i modelli risultano pubblici e non per uso commerciale. Per un gioco tra amici va bene.
- **Hunyuan3D** (Tencent, codice aperto): sul Mac gira, ma l'unica prova documentata è su un M4 Pro con 24 GB, con circa 6 minuti per la forma e 8 e mezzo per i colori. Sul Mac M1 2020 di Nicola lo sconsiglio. In più la licenza non vale nell'Unione Europea: per noi è da scartare.
- **Come entrerebbero**: immagine del pezzo → generatore → file GLB → riduzione dei triangoli → nel gioco al posto dei miei edifici procedurali (`pezzi.js` ha già il punto d'innesto `modelli.edificio` / `modelli.pedina`). Servono circa 25 edifici (5 isole x 5 livelli) e 4-6 pedine.
- **Isole intere generate in 3D**: possibile ma rischioso. Questi generatori fanno bene un oggetto singolo; una città intera esce impastata da vicino. Da provare su un'isola sola prima di crederci. Se riuscisse, darebbe la rotazione libera con lo stile della foto.

### Blender sul Mac di Nicola
- Gratis e gira sull'M1. Utile per: ridurre e sistemare i modelli generati, e per fare a mano i pezzi di gioco.
- Per rifare tutto l'arcipelago a mano a livello della foto: no, è lavoro da professionisti per settimane.

---

## Raccomandazione finale

**Strada: Proto 3 "Diorama a livelli", costruito sul Proto 1.**

Perché:
- È l'unica che sembra davvero la foto (9 contro 3).
- Pesa meno di 1 MB e disegna 3 oggetti: va su Mac M1 e telefoni (da confermare sul Mac vero).
- Mantiene l'interfaccia di oggi verso `gioco.js` e le coordinate delle caselle che esistono già.
- Rispetta la richiesta di Nicola "sentirmi dentro il mondo" meglio di una camera che gira.

Cosa si perde, detto chiaro: la vista a piombo e la rotazione libera. Nicola aveva chiesto di "esplorare dall'alto": qui si esplora con zoom, sguardo e discesa nelle isole, non girando attorno.

Quanto lavoro:
- Tappa A (3-4 giorni): foto in rilievo nel gioco al posto di `mondo3d.js`, mare vivo, caselle, edifici, pedine, Segui/Libera, telefono.
- Tappa B (1-2 giorni): livelli delle isole.
- Tappa C (dipende dalle scelte di Nicola): notte vera, foto più definita, vedute aeree delle isole, pezzi di gioco fatti apposta.

Le 3 foto da far vedere a Nicola:
1. `/home/claude/prove/arte3d/foto/p3-arcipelago.png`
2. `/home/claude/prove/arte3d/foto/p3-flamingo-dentro.png`
3. `/home/claude/prove/arte3d/foto/p2-foto.png` (per capire perché NON rimodellare)

Per aprire i prototipi in un browser vero: `node /home/claude/prove/arte3d/servi.js` e poi `http://localhost:8123/proto3/index.html`. Per rifare le foto: `node /home/claude/prove/arte3d/scatta.js /home/claude/prove/arte3d/lavF.json`.

---

## Decisioni che servono da Nicola

**D1 — La strada.** «Il tabellone può essere la tua foto resa viva e in rilievo. In cambio non si può più girare attorno al mondo né guardarlo a piombo. Va bene?»
- A) Sì, foto in rilievo + discesa nelle isole (consigliata).
- B) No, voglio poter girare liberamente: allora mondo a modelli, stile cartone, molto più lavoro.
- C) Prima fammi provare i due prototipi sul mio Mac.

**D2 — Immagini nuove (costano crediti ElevenLabs).** «Vuoi che generiamo qualche immagine in più per migliorare il tabellone?»
- A) Solo la versione notte della foto.
- B) Notte + foto più definita.
- C) Notte + foto più definita + una veduta aerea per ogni isola.
- D) Niente, usiamo solo quello che c'è.

**D3 — I pezzi di gioco (edifici e pedine).** «Come li vuoi?»
- A) Semplici ma curati, fatti in codice nello stile di ogni isola (come nel prototipo, migliorati).
- B) Modelli veri generati da immagine con un servizio gratuito (Meshy o Tripo): più belli, serve un tuo account e un po' di prove.
- C) Li disegna qualcuno in Blender.

**D4 — Il pulsante "Alto".** «Con la foto in rilievo la vista a piombo non esiste. Cosa mettiamo al suo posto?»
- A) "Tutta la laguna" (la veduta intera della foto).
- B) Una mappa 2D semplice, solo per orientarsi.
- C) Tutte e due.

---

## Note tecniche e cose lasciate in giro
- Strumenti: `/home/claude/prove/arte3d/tools/` (`profondita.py`, `prepara.py`, `prof_isole.py`, `impronte.py`). `dallalto.py` è il tentativo fallito, tenuto come prova.
- `/home/claude/prove/arte3d/dl/` pesa 750 MB (modelli di profondità e pacchetti scaricati): si può cancellare quando non serve più.
- Depth Anything V2 scaricato da GitHub (`fabio-sim/Depth-Anything-ONNX`), girato con `onnxruntime` installato con pip. Hugging Face non è raggiungibile da qui. Anche MiDaS small è stato scaricato ma non è servito.
