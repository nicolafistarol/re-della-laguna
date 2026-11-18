# Rapporto ECONOMIA e BILANCIAMENTO — Re della Laguna (fase 1, solo analisi)

Settore: economia. Ho scritto un simulatore in Node che usa il motore vero (`motore.js`) e i bot veri (`bot.js`).
Ho fatto girare **circa 8.300 partite di soli bot** (4 giocatori), con 6/8/12/16/20 Cicli, a obiettivo (50/100/200 M), con pacchetti scelti dai bot, assegnati a caso, tutti e 8, e partite "specchio" (4 bot identici).
Non ho modificato niente in `/home/claude/re-della-laguna`. Le prove dei ritocchi le ho fatte su una **copia** del motore nella mia cartella.

---

## Le 5 cose più importanti

1. **I soldi esplodono per colpa del Palazzo (ECO-01).** Ogni piano rende ogni Alba il 62% di quello che costa (93% da Grattacielo), sempre, senza rischio. Il vincitore passa da 33 M (8 Cicli) a 452 M (16) a **1,75 miliardi (20 Cicli)**. Nelle partite lunghe il Palazzo fa l'89% di tutte le entrate e restano 600 M di contanti fermi a testa. Livelli, obiettivi, multe, Grandi Affari e costi fissi perdono senso.
2. **Nelle partite lunghe la vita sporca non paga, anche giocata bene (ECO-02, ECO-06).** Gli affari della notte danno cifre fisse (0,6–8 M a colpo), mentre multe, blocchi delle rendite e decima della setta crescono con la ricchezza. A 8 Cicli lo sporco vince di più (Spavaldo 44–46%). A 16–20 Cicli i soldi della notte sono lo 0–1% delle entrate e lo sporco vince meno (14–16% a testa contro 34–37% del pulito). Questo va contro la decisione di Nicola: la sporca deve pagare di più se giocata bene.
3. **Conta più la fortuna della strategia (ECO-03).** A 8 Cicli il carattere/pacchetto spiega solo il **5–13%** delle differenze tra i giocatori. 4 bot identici finiscono distanti quanto 4 bot diversi. I dadi in sé non c'entrano (correlazione 0,00). Pesano il **permesso del Municipio** (55% sì, 30% rimandato, 15% no) e il **terreno iniziale**: chi ha i permessi più fortunati vince il 43%, chi li ha più sfortunati il 3%.
4. **Due bug con i soldi (ECO-10, ECO-09).** Il contratto notarile accetta promesse senza limite. La tassa del notaio si paga anche senza soldi, quindi il contante va sotto zero; con numeri enormi lo stato si rompe. Chi non paga fa incassare lo stesso l'altro, con soldi creati dalla banca: si può "regalare la vittoria" a un amico. La Resa dei conti toglie la multa senza controllo e lascia contanti negativi in classifica finale (26 partite su 1.500).
5. **Livelli e app non vanno al passo con la durata (ECO-04), e la Borsa non serve (ECO-05).** I livelli si aprono quasi a orologio: Liv.1 al Ciclo 2, Liv.2 al 4–5, Liv.3 al 7, Liv.4 all'11–12. In una partita da 6 Cicli l'80% non vede mai Villa e Faro. In una da 12 Cicli i Grandi Affari durano 1 Ciclo. La Borsa rende +7% a Ciclo contro il 62–190% di Palazzo e attività: chi ci investe perde (il bot Investitore vince lo 0–2% nelle partite lunghe).

**Decisioni di Nicola che servono: 6** (ECO-01, ECO-02, ECO-03, ECO-04, ECO-06, ECO-12).

---

## Come ho provato (per rifare le prove)

Cartella: `/home/claude/prove/economia/`
- `sim.js`: gioca una partita di soli bot e misura tutto. Separa i soldi per fonte: affitti, stipendio, rendite di attività, Palazzo e mezzi, tasse, affari della notte, riciclo, setta, condanne, Resa. Controlla anche le regole del motore: niente NaN, contanti e sporchi mai sotto zero, partite che finiscono, eccezioni, mosse rifiutate.
- `motore_strum.js`: copia del motore con 2 righe in più (un "gancio" all'inizio e alla fine dell'Alba). Ho verificato che con lo stesso seme dà **risultati identici** al motore vero.
- `motore_var.js`: copia usata solo per provare i ritocchi (permessi, terreno iniziale, piani del Palazzo, guadagni illegali).
- `run.js <esperimento>`: lancia gli esperimenti `standard`, `pacchetti`, `tutti8`, `specchio`, `obiettivo` e `pulitiSporchi` (risultati in `dati/*.jsonl`). `analisi.js <esperimento>` stampa le tabelle (`out_*.md`).
- `fortuna.js` e `fonti_fortuna.js`: quanto pesano la fortuna e le sue fonti. `pulito_sporco.js`: vita pulita contro vita sporca.
- `varianti.js <nome>` + `confronto.js`: ritocchi provati (`out_varianti.md`, `out_varianti2.md`).
- `fuzz.js` e `vietate.js`: mosse strane e vietate mandate al motore.

**Limite importante:** i bot giocano in modo semplice. Non usano prestiti, contratti, evasione, denunce, foto, articoli, serate, Ballo e Ricettatore. I bot sporchi smettono appena la polizia li "osserva", e il 84–92% finisce condannato o colpito dalla Resa. I numeri sulla vita sporca sono quindi un limite basso. Ma il motivo per cui non scala (cifre fisse contro penalità proporzionali) è nel motore, non nei bot.

Motore: in 8.300 partite **0 eccezioni, 0 NaN, 0 partite bloccate, tutte finite**.

---

## Tabelle principali

### Vittorie per carattere dei bot (il pacchetto lo sceglie il bot) — 300 partite per colonna, atteso 25%
| Carattere (pacchetto) | 6 Cicli | 8 | 12 | 16 | 20 |
|---|---|---|---|---|---|
| Legale (Commerciante) | 6% | 17% | 22% | 35% | 49% |
| Costruttore (Costruttore) | 10% | 12% | 44% | 53% | 63% |
| Investitore (Investitore) | 19% | 26% | 31% | 2% | 0% |
| Furbo (Contrabbandiere) | 37% | 25% | 19% | 19% | 13% |
| Spavaldo (Playboy) | 51% | 44% | 20% | 17% | 8% |
| Esperto (Politico) | 30% | 26% | 16% | 26% | 20% |

Nelle partite brevi vince lo sporco, in quelle lunghe chi costruisce il Palazzo. Quasi nessuna partita è equilibrata.

### Vittorie per pacchetto, assegnato a caso (per togliere l'effetto del carattere) — 400/300 partite
| Pacchetto | 8 Cicli | 16 Cicli | 8 Cicli (tutti e 8 offerti) | 16 Cicli (tutti e 8) |
|---|---|---|---|---|
| Commerciante | 23% | 21% | 28% | 26% |
| Costruttore | 27% | **45%** | 27% | **41%** |
| Investitore | 22% | 19% | 22% | 21% |
| Playboy | 30% | 28% | 30% | 20% |
| Contrabbandiere | 23% | 22% | 16% | 21% |
| Politico | 26% | 16% | 22% | 22% |
| Ereditiera | non offerto | non offerto | 28% | 24% |
| Speculatore | non offerto | non offerto | 27% | 25% |

I pacchetti sono equilibrati nelle partite brevi. Nelle lunghe il Costruttore domina: lo sconto del 15% sui piani si somma Ciclo dopo Ciclo.

### Patrimonio del primo, a fine Ciclo (mediana, 300 partite da 20 Cicli)
| Ciclo | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 18 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| Primo (M €) | 6,1 | 12,1 | 21,7 | 35,4 | 57,3 | 101,9 | 213,8 | 468,8 | 1.016,6 | 1.738,8 |

Dal Ciclo 11 in poi i soldi crescono di circa ×1,45 a Ciclo. Questo coincide con il riferimento dello STATO (12 Cicli ~100 M, 16 Cicli ~450 M).

### Da dove vengono i soldi (media per giocatore, M €)
| Fonte | 8 Cicli Legale | 8 Cicli Spavaldo | 16 Cicli Costruttore | 16 Cicli Spavaldo | 20 Cicli Legale | 20 Cicli Spavaldo |
|---|---|---|---|---|---|---|
| Rendite attività | 24,2 | 36,1 | 99,1 | 106,3 | 145,1 | 137,4 |
| Rendite Palazzo | 0,5 | 2,7 | **466,2** | 354,1 | **1.830,6** | 1.389,4 |
| Affitti incassati / pagati | +1,3 / −1,2 | +1,3 / −1,0 | +3,9 / −4,3 | +4,2 / −3,3 | +7,4 / −5,9 | +5,5 / −5,1 |
| Stipendio | 1,6 | 1,2 | 3,3 | 2,2 | 3,6 | 2,6 |
| Affari della notte (netto) | −0,1 | **+9,7** | −0,3 | +21,9 | −0,4 | +24,7 |
| Decima alla setta | 0 | −0,4 | 0 | −28,0 | 0 | **−110,0** |
| Condanne, perquisizioni, blocchi (all'Alba) | 0 | −5,5 | −9,0 | −80,6 | −3,5 | **−217,3** |
| Resa dei conti | 0 | −4,4 | 0 | −14,8 | 0 | −41,6 |
| Tasse | −5,0 | −7,5 | −115,6 | −82,7 | −396,2 | −273,5 |

Gli affitti contano pochissimo (1–3% delle entrate). Il tabellone "alla Monopoly" pesa poco: contano le rendite all'Alba.

### Vita pulita contro vita sporca (2 puliti + 2 sporchi per tavolo, pacchetti a caso, 200 partite per riga)
| Cicli | vince un pulito (patr. mediano) | vince uno sporco | sporchi MAI condannati | sporchi condannati o colpiti dalla Resa |
|---|---|---|---|---|
| 8 | 15% (22,5 M) | **35%** (28,2 M) | 47% (32,4 M) — solo il 16% degli sporchi | 33% |
| 12 | 26% (70,9 M) | 24% (69,7 M) | 50% (102 M) — solo l'8% | 22% |
| 16 | 25% (259 M) | 26% (268 M) | 37% (352 M) — solo il 14% | 24% |

Quota di vittoria **per giocatore** (atteso 25%). Lo sporco "giocato bene" (mai preso) vince il 37–50%: in questo senso la decisione di Nicola regge. Però a 12 Cicli e oltre lo sporco ci arriva con le rendite delle sue attività, non con la notte: gli affari della notte sono solo l'1–5% delle entrate (vedi ECO-02).

### La fortuna
| Misura | 6 C | 8 C | 12 C | 16 C | 20 C |
|---|---|---|---|---|---|
| Differenze tra giocatori spiegate da carattere+pacchetto | 24% | 9% | 11% | 22% | 38% |
| Primo a fine Ciclo 2 che poi vince | 50% | 44% | 27% | 28% | 21% |
| Primo a metà partita che vince | 63% | 50% | 31% | 40% | 41% |
| Ultimo a metà partita che vince | 5% | 7% | 11% | 6% | 7% |
| La Resa toglie la vittoria al primo | 17% | 19% | 9% | 3% | 3% |
| Primo / ultimo (patrimonio, mediana) | 1,76 | 1,77 | 2,37 | 3,74 | 4,38 |

Partite specchio (4 bot identici, stesso pacchetto, 120 partite): la dispersione dei patrimoni (deviazione del logaritmo) è 0,21–0,29 a 8 Cicli, praticamente uguale a quella dei tavoli misti (0,26–0,28).
Da cosa dipende chi vince tra 4 Legali identici a 8 Cicli (250 partite):
| Fonte di fortuna | correlazione col patrimonio finale | vittorie |
|---|---|---|
| Media dei dadi | −0,07 | — |
| Ordine di turno | 0,09 | — |
| Percentuale di permessi riusciti | **0,53** | 43% chi ha >60% di sì, **3%** chi ha <45% |
| Prezzo del terreno iniziale | 0,28 | 33% con terreno da 400–600 mila, 17% con 150–250 mila |
| Affitti netti (dove cadi) | 0,50 | — |

Ci sono buone rimonte (nelle partite lunghe chi è primo al Ciclo 2 vince solo 1 volta su 4–5) e nessuna partita è decisa troppo presto. Però la partita breve è quasi una lotteria, e in quella lunga l'ultimo finisce con 1/4 dei soldi del primo.

### Livelli (soglie 3,5 / 7 / 15 / 40 M) — Ciclo in cui si arriva
| Livello | 6 Cicli | 8 Cicli | 12 Cicli | 16 Cicli |
|---|---|---|---|---|
| 1 (3,5 M) | 100%, C2 | 100%, C2 | 100%, C2 | 100%, C2 |
| 2 (7 M) | 97%, C5 | 100%, C5 | 100%, C5 | 100%, C5 |
| 3 (15 M) | **20%**, C6 | 79%, C7 | 100%, C7 | 100%, C7 |
| 4 (40 M, solo lunghe) | — | — | 70%, **C11** | 98%, C12 |

Tra il primo e l'ultimo del tavolo ci sono 1–3 Cicli di distacco: il livello va quasi a orologio. Il Livello 1 lo prendono tutti al Ciclo 2–3, anche chi gioca male.

### Cose che (quasi) nessuno usa o che non servono
- **Ereditiera e Speculatore non vengono mai offerti** con 2–6 giocatori (ECO-12), anche se sono equilibrati (24–28%).
- Stanze del Palazzo (1.200 giocatori, 20 Cicli): Ristorante panoramico 1.200, Suite 1.157, Garage 1.043, Caveau 324. Mai comprate dai bot: Spa, Sala insonorizzata, Casinò privato (serve la licenza), Bunker, Ufficio stampa, Eliporto, Piani segreti, Terrazza col cannocchiale. Per molte manca la logica nei bot, ma nessuna rende soldi, mentre un piano rende il 62% (vedi ECO-01): rispetto ai piani nessuna "conviene".
- Mezzi: Megayacht ed Elicottero mai comprati. Il noleggio (8–20% del prezzo, e nel patrimonio contano solo l'80%) rende molto meno di un piano.
- Prestiti e interessi: 0 (i bot non chiedono prestiti). **Rischio per i giocatori veri:** il prestito costa il 10% a Ciclo, mentre un'attività rende il 100–190% di quello che costa. Prendere a prestito il massimo e costruire subito è quasi sempre giusto (non l'ho simulato coi bot).
- Grandi Opere: a 12 Cicli quasi mai (11 Porto su 300 partite). A 20 Cicli tutte, ma con costi fissi (10–20 M) quando i Tesori arrivano a 180 M.
- Sindaco: lo stipendio di 750 mila € a Ciclo è irrilevante dopo il Ciclo 8.

---

## Problemi (dettaglio)

### ECO-01 — L'economia esplode: il Palazzo rende sempre di più, senza limiti
- **Gravità:** ALTA
- **Dove:** `motore.js:32` (`pianoCost 400_000, pianoGrow 1.08, pianoRend 0.62, pianiMax 60`), `motore.js:662` (`baseRendPiano`: la rendita del piano cresce con il suo costo, quindi il guadagno in percentuale non scende mai e sale con Attico ×1,3 e Grattacielo ×1,5).
- **Come si vede:** tabelle sopra. A 20 Cicli il vincitore ha in mediana 1.739 M, l'89% delle entrate viene dal Palazzo, i piani medi sono 52–59 (tetto di 60), e restano 620 M di contanti medi fermi senza niente da comprare. I bot provano 4.388 volte a costruire oltre il 60° piano (mossa rifiutata). Le cose a cifra fissa diventano irrilevanti: stipendio 600 mila, multe Gazzetta, corruzione 250 mila, oggetti, Grandi Affari (asta base 12–15 M), Grande Colpo (45 M), fasce pubbliche ("Sovrano" da 30 M: dal Ciclo 12 sono tutti Sovrani, quindi la fascia non dice più niente agli altri). L'obiettivo 200 M si raggiunge al Ciclo 14 (mediana).
- **Proposta (piccolo lavoro):** la rendita del piano non deve crescere come il suo costo. In `baseRendPiano` si usa una costante nuova `N.pianoRendGrow` al posto di `N.pianoGrow`. Risultati provati (120 partite per cella, vincitore mediano):

| Ritocco | 12 Cicli | 16 Cicli | 20 Cicli | quota Palazzo a 20 C | contanti fermi a 20 C |
|---|---|---|---|---|---|
| attuale | 108 M | 452 M | 1.746 M | 89% | 620 M |
| `pianoRend` 0,62 → 0,35 | 85 | 240 | 712 | 72% | 135 |
| `pianoRendGrow` = **1,05** | 87 | 233 | **548** | 65% | 77 |
| `pianoRendGrow` = 1,02 | 78 | 181 | 346 | 44% | 34 |

Consiglio `pianoRendGrow = 1.05`: il Palazzo resta il motore delle partite lunghe ma non schiaccia tutto, e le partite brevi non cambiano (8 Cicli: 33 M come ora). Attenzione: con 1,02 la Borsa diventa la cosa migliore (vince l'Investitore al 53–63%), quindi meglio non esagerare.
- **Serve una decisione di Nicola? SÌ.** Domanda: "In una partita lunga (16–20 Cicli), quanto deve diventare ricco il vincitore?"
  - A) Miliardi, come adesso: i numeri grandi sono divertenti, pazienza se multe e prezzi fissi non contano più.
  - B) Qualche centinaio di milioni (consigliato: piani che rendono un po' meno man mano che salgono).
  - C) Poche decine di milioni anche nelle partite lunghe: allora vanno abbassate molto tutte le rendite.

### ECO-02 — La vita sporca non cresce con la partita: nelle partite lunghe non paga
- **Gravità:** ALTA (contraddice la decisione "la sporca paga di più se giocata bene")
- **Dove:** `motore.js` OCCASIONI (~riga 1194: guadagni fissi 0,6–8,4 M), `motore.js:33` (`bonusIllegale 1.4`), `motore.js:1971` (il guadagno cresce solo con il "lustro", al massimo +40%). Le penalità invece sono in percentuale: condanna `motore.js:2914` (multa 6–40% di contanti+investimenti), blocco delle rendite al 50% per 1–3 Cicli, Faro con rendite ×0,7, Resa `motore.js:2802` (multa fino al 60% del patrimonio), decima della setta 15% di **tutte** le rendite, anche quelle del Palazzo.
- **Come si vede:** a 8 Cicli gli affari della notte sono l'8% delle entrate e lo sporco vince (Spavaldo 44–46%). A 16 Cicli sono l'1–3%, a 20 Cicli lo 0–1%. Lo Spavaldo a 20 Cicli guadagna di notte +24,7 M, ma perde −217 M per condanne e blocchi, −110 M di decima e −41,6 M di Resa. Il colpo migliore (Villa, 5,7–8,4 M) vale meno di un'Alba di Palazzo di chi è in testa già dal Ciclo 10. Ho provato a far crescere il guadagno con la radice del patrimonio: coi bot non cambia quasi niente, perché i bot sporchi smettono di fare affari appena la polizia li osserva (fanno 6–7 affari in 20 Cicli). Il problema però si vede dai conti: il premio è fisso, il castigo cresce.
- **Proposta (piccolo lavoro):** il guadagno degli affari cresce con il Livello: `guadagno × [1; 1; 1,5; 2,5; 4][livello]` (tabella nuova `N.illegaleLivello`). Oppure, legato a ECO-01, cresce con il patrimonio: `× max(1, √(patrimonio / 15 M))`. Conviene anche togliere il Palazzo dalla decima (ECO-06). Risultato atteso: a 16–20 Cicli una notte buona vale circa un'Alba di rendite (10–30% delle entrate per chi gioca sporco), e il rischio resta lo stesso. Da riverificare con bot più coraggiosi.
- **Serve una decisione di Nicola? SÌ.** Domanda: "Nelle partite lunghe un colpo riuscito di notte quanto deve valere?"
  - A) Una cifra fissa come adesso (dopo metà partita conta poco).
  - B) Più cresci di Livello, più valgono gli affari (consigliato).
  - C) Una parte del tuo patrimonio (i ricchi fanno colpi più grandi).

### ECO-03 — La fortuna pesa più delle scelte (permessi e terreno iniziale)
- **Gravità:** ALTA (Nicola vuole un gioco chiaro: oggi chi perde non capisce perché)
- **Dove:** `motore.js:2116–2117` (permesso: 55% sì, 30% rimandato, 15% negato, a ogni richiesta). `motore.js:337–343` (terreno iniziale da 150 a 600 mila con attività già aperta: la differenza si paga in contanti una volta sola, ma il terreno caro rende il 95% del suo prezzo **a ogni Alba**).
- **Come si vede:** tabella "La fortuna". A 8 Cicli il carattere spiega il 5–13% delle differenze. Tra bot identici vince chi ha avuto più permessi (43% contro 3%) e il terreno iniziale caro (33% contro 17%). I dadi in sé no.
- **Proposta (piccolo lavoro):**
  - permesso "rimandato" = approvato sicuro al tentativo dopo; nuove costanti `N.permessoOk` 0,55 → 0,70 e "negato" dal 15% al 5% (provato così: variante `permessi`).
  - terreno iniziale da 350 a 600 mila (oggi da 150), oppure pareggio pagato in rendita (+0,95 × differenza per i primi 3 Cicli) invece che in contanti.
  - Provato: con permessi più facili il vincitore a 8 Cicli sale da 33 a 40 M (gli unici a guadagnarci sono i puliti, perché gli sporchi già pagano l'assessore). La fortuna da sola non sparisce: è sparsa in tanti piccoli tiri (permessi, caselle, aste). Quanta fortuna lasciare è una scelta.
- **Serve una decisione di Nicola? SÌ.** Domanda: "In una partita corta, quanto deve contare la fortuna?"
  - A) Tanto, come adesso: chiunque può vincere (gioco di festa).
  - B) Un po' meno: permessi più sicuri e terreni iniziali uguali (consigliato).
  - C) Pochissimo: permesso sempre approvato se paghi, terreno iniziale uguale per tutti.

### ECO-04 — Livelli quasi "a orologio" e poco adatti alla durata
- **Gravità:** MEDIA
- **Dove:** `motore.js:1228` (`SOGLIE_LIVELLO [0, 3,5, 7, 15, 40 M]`), `motore.js:1232` (Livello 4 solo nelle partite lunghe), `motore.js:1154–1166` (Villa e Faro al Liv.3, Redazione e Aeroporto al Liv.2), `gioco.js:1894` (testi degli sblocchi; al Liv.2 non nomina l'Aeroporto).
- **Come si vede:** tabella Livelli. Partita da 6 Cicli: l'80% non arriva al Liv.3. Da 8 Cicli: Liv.3 al Ciclo 7–8, cioè 1–2 notti per Villa e Faro. Da 12 Cicli: Liv.4 al Ciclo 11, quindi un solo Ciclo di Grandi Affari. Da 16 Cicli: Liv.4 al Ciclo 12. Tra primo e ultimo ci sono solo 1–3 Cicli: i livelli premiano poco chi gioca meglio, ma almeno nessuno resta indietro.
- **Proposta (piccolo lavoro):** soglie scalate con la durata, `SOGLIE × fattore` con fattore 0,6 (6 Cicli), 0,75 (8), 1 (12), 1,5 (16), 2,5 (20). Liv.4 anche a 8 Cicli con soglia 25 M. Risultato atteso: in ogni durata Liv.3 a circa metà partita e Liv.4 a circa 2/3. Se si fa ECO-01 le soglie lunghe vanno ricalcolate (con `pianoRendGrow` 1,05 il Liv.4 arriva comunque al Ciclo 11–12).
- **Serve una decisione di Nicola? SÌ.** Domanda: "Quando si aprono le cose nuove del telefono?"
  - A) Con i soldi, come adesso (nelle partite corte alcune cose non si vedono mai).
  - B) Con i soldi, ma soglie più basse nelle partite corte (consigliato).
  - C) A tempo: ogni 2 Cicli si apre un livello, uguale per tutti.

### ECO-05 — Borsa e cripto non convengono mai (e la LagunaCoin batte le azioni)
- **Gravità:** MEDIA
- **Dove:** `motore.js:34` (`borsaMu 0.21` diviso 3 = +7% a Ciclo, `borsaSd 0.16`; cripto `criptoMu 0.40/2`, LagunaCoin con rischio ×0,4 e crolli ×0,3), `motore.js:3023–3033`.
- **Come si vede:** simulazione delle formule (20.000 prove): azioni ×1,72 in 8 Cicli (perdi nel 15% dei casi); LagunaCoin ×3,4 in 8 Cicli con meno rischio; ShadowCoin e FlamingoToken perdono 6–7 volte su 10. Un piano invece ripaga il 62–93% a Ciclo, un'attività il 100–190%. Il bot Investitore, che mette il 60% dei contanti in SoleTech, vince lo 0–2% a 16–20 Cicli. Il dividendo del pacchetto Investitore (4%) non cambia niente. Il consiglio di Lenz "i soldi fermi perdono valore" è falso nel motore: non c'è inflazione.
- **Proposta (piccolo lavoro):** dopo ECO-01, `borsaMu` 0,21 → 0,36 (+12% a Ciclo). LagunaCoin con rischio ×0,6 invece di ×0,4 e crolli ×0,5 invece di ×0,3, così non batte più le azioni. La Borsa diventa "il parcheggio sicuro per quando non puoi più costruire", e il consiglio di Lenz va riscritto in modo vero ("rende poco ma sempre"). NO decisione: è un ritocco di numeri.

### ECO-06 — La setta mangia i soldi: decima sul Palazzo e Tesoro che non serve a nessuno
- **Gravità:** MEDIA
- **Dove:** alba, `motore.js:2978` (decima 15% delle rendite **compreso il Palazzo**), `motore.js:2984` (al Gran Maestro va solo il 5% del Tesoro a ogni Alba). Il Tesoro non conta nel patrimonio di nessuno.
- **Come si vede:** a 20 Cicli il Tesoro mediano è di **180 M** fermi. Gli sporchi pagano 76–110 M di decima a testa e ne riprendono 4–15. Opere a costo fisso (10–20 M), Isola della setta 800 mila sporchi ad Alba. Entrare in una setta in una partita lunga è un buco di soldi: è una "strategia" che conviene sempre evitare.
- **Proposta (piccolo lavoro):** decima solo sulle rendite delle attività (non sul Palazzo), con un tetto per Alba (`N.decimaMax` = 1 M × livello setta). Oppure il Tesoro conta a fine partita: metà al Gran Maestro e metà divisa tra i membri. Opere e bottino del Grande Colpo in percentuale del Tesoro invece che fissi.
- **Serve una decisione di Nicola? SÌ.** Domanda: "Alla fine della partita, il Tesoro della setta di chi è?"
  - A) Di nessuno, come adesso (si spende o si perde).
  - B) Del Gran Maestro.
  - C) Diviso tra Gran Maestro (metà) e membri (consigliato: così entrare conviene).

### ECO-07 — Il Costruttore domina le partite lunghe, il Politico è il più debole
- **Gravità:** MEDIA
- **Dove:** `motore.js:669` (piani −15% per il Costruttore), `motore.js:98` (Politico).
- **Come si vede:** pacchetti a caso: Costruttore 45% (16 Cicli) e 41% (16 Cicli con tutti e 8 i pacchetti); Politico 16%. A 8 Cicli sono tutti tra il 22 e il 30%.
- **Proposta (piccolo lavoro):** prima ECO-01, poi ricontrollare. Se resta sopra il 35%: sconto del Costruttore sui piani 15% → 8% (cantieri ancora −15%). NO decisione.

### ECO-08 — In partita lunga l'ultimo resta molto indietro
- **Gravità:** BASSA (non è un bug: è l'effetto di ECO-01)
- **Come si vede:** rapporto primo/ultimo 1,8 a 8 Cicli → 4,4 a 20 Cicli. Le rimonte ci sono (il primo a metà partita vince solo il 40%), ma l'ultimo a metà partita vince il 5–11%.
- **Proposta:** risolto in buona parte da ECO-01 (con 1,05 i soldi crescono più piano). In più, il "Controllo della Finanza" del Regista sul primo (`motore.js` regista) oggi colpisce solo chi ha reati o evasione: va bene così, non renderei il gioco più facile. NO decisione.

### ECO-09 — Bug: la Resa dei conti lascia contanti negativi in classifica
- **Gravità:** MEDIA
- **Dove:** `motore.js:2808` (`p.cash -= multa` senza controllo).
- **Come si vede:** 26 partite su 1.500 (sempre Spavaldo, Furbo o Esperto). Esempio con seme 30, 4 bot sporchi, 12 Cicli: "Resa dei conti (grave): multa di 26.827.009 €" e contanti da 6.322.267 a **−7.973.485 €**. Il patrimonio è giusto, ma nel riepilogo finale si vedono contanti con il meno.
- **Proposta (piccolo):** usare `paga(s, p, multa, null)` (prima vende azioni, poi mette il resto a debito), come nelle condanne. NO decisione.

### ECO-10 — Bug: il contratto notarile accetta cifre senza limite e la tassa del notaio manda sotto zero
- **Gravità:** ALTA
- **Dove:** `motore.js:2664–2676` (proposta: `pagoOra`/`pagoDopo` senza tetto, `garanzia` e `lottoCeduto` non controllati), `motore.js:2684` (tassa del 2% tolta a tutti e due senza controllare i soldi), `motore.js:2702` (chi non paga: `paga()` dà lo stesso tutta la cifra a chi riceve, e mette a debito chi paga).
- **Come si vede (`vietate.js`, valori possibili in JSON come dal server):**
  - promessa di 1 miliardo fra 1 Ciclo: accettata. Subito tutti e due pagano 10 M di tassa e vanno a −7,0 M e −5,7 M.
  - `pagoDopo: 1e308`: accettata. Contanti a −1e306 per tutti e due: la partita è rotta.
  - garanzia = terreno di un terzo giocatore: accettata, ma la garanzia non vale niente (chi accetta viene ingannato).
  - `lottoCeduto` di un terzo: accettato, non succede niente.
  - "regalare la vittoria": chi è ultimo firma una promessa enorme. Alla scadenza l'amico incassa tutta la cifra (la paga la banca) e lui finisce con un debito.
- **Proposta (piccolo):** tetto a `pagoOra` e `pagoDopo` (al massimo il patrimonio di chi paga); tassa solo se c'è il contante, altrimenti il contratto viene rifiutato; garanzia solo su un terreno di chi paga; `lottoCeduto` solo di uno dei due. Se chi paga non ha i soldi, chi riceve prende solo quello che c'è più la garanzia, non i soldi della banca. NO decisione.

### ECO-11 — Multa della condanna solo su contanti e investimenti: basta "nascondere" i soldi nel Palazzo
- **Gravità:** BASSA
- **Dove:** `motore.js:2914` (`pena.multa × (cash + investimenti)`). La Resa invece usa tutto il patrimonio (`motore.js:2802`).
- **Come si vede:** chi sa di essere vicino al Processo spende tutto in piani e la multa crolla. È una regola "da esperti" che un giocatore nuovo non capisce.
- **Proposta (piccolo):** stessa base della Resa: `patrimonio(s, p, false)`, con percentuali un po' più basse se serve (lieve 4%, media 8%, grave 16%, gravissima 30%). Il rischio resta chiaro: "la multa è una parte di tutto quello che hai". NO decisione.

### ECO-12 — Due pacchetti non escono mai
- **Gravità:** BASSA
- **Dove:** `motore.js:301` (`PACCHETTI.slice(0, Math.max(6, giocatori))`): Ereditiera e Speculatore compaiono solo con 7–8 giocatori.
- **Come si vede:** provati comunque: Ereditiera 28% / 24%, Speculatore 27% / 25% (8 / 16 Cicli). Sono equilibrati.
- **Proposta (piccolo):** offrire sempre tutti e 8, oppure 6 pescati a caso a ogni partita.
- **Serve una decisione di Nicola? SÌ.** Domanda: "L'Ereditiera (prestiti doppi senza interessi) e lo Speculatore (cripto +5% ogni Alba) li vuoi nel gioco?"
  - A) Sì, sempre tutti e 8 (consigliato).
  - B) Sì, ma ogni partita ne escono 6 a caso.
  - C) No, li tolgo.

### ECO-13 — Ordine di turno: nelle partite lunghe chi gioca per ultimo vince un po' di più
- **Gravità:** BASSA
- **Come si vede:** su 2.769 partite da 12 Cicli o più: 1° di turno 22,9%, 2° 23,5%, 3° 25,9%, 4° **27,7%**. Nelle brevi non c'è differenza (24,5–25,5%). La causa non l'ho trovata con certezza: forse chi gioca per ultimo nel Giorno 4 decide sapendo già cosa hanno fatto gli altri, oppure un effetto delle aste.
- **Proposta:** da indagare (medio). NO decisione.

### ECO-14 — Mosse che il motore accetta anche se strane (niente di grave)
- **Gravità:** BASSA
- **Come si vede (`fuzz.js`, 120 partite con il 8% di mosse strane):** con valori JSON **0 crash e 0 stati rotti** (a parte ECO-10). Accettate ma innocue: regalo a se stessi (non fa niente); regali, investimenti, evasione, candidatura e offerte per i Grandi Affari anche fuori turno e di notte (sono azioni dal telefono: ok, ma il regalo libero aiuta a "fare il re" a favore di un amico); `piano` con quantità negativa (diventa 1 piano); importo in stringa "100000" (letto come numero).
- **Proposta (piccolo):** rifiutare il regalo a se stessi. Decidere se i regali si possono fare anche di notte (oggi sì). NO decisione obbligatoria.

### ECO-15 — Chiarezza: testi che non tornano con i numeri
- **Gravità:** BASSA
- **Dove:** consiglio Lenz in SCOPERTE ("i soldi fermi perdono valore", `motore.js:3208`), mentre nel motore non c'è inflazione. `gioco.js:1897` Livello 2 non dice che si apre anche l'Aeroporto (cargo e spedizioni, `motore.js:1165`). Lo stipendio del Sindaco e i costi fissi non dicono che a fine partita contano poco.
- **Proposta (piccolo):** correggere i testi. NO decisione.

---

## Ritocchi proposti, in ordine (costante → da / a → risultato atteso)

| # | Dove | Da | A | Risultato atteso (dalle simulazioni) |
|---|---|---|---|---|
| 1 | `baseRendPiano` (riga 662): costante nuova `N.pianoRendGrow` | (= pianoGrow 1,08) | **1,05** | vincitore a 20 Cicli 1.746 → 548 M; Palazzo 89% → 65% delle entrate; contanti fermi 620 → 77 M; partite brevi uguali |
| 2 | `chiediPermesso` (riga 2116) | sì 0,55 / rimandato 0,30 / no 0,15 | sì 0,70 / rimandato 0,25 / no 0,05 (provato così) | meno fortuna sui permessi; a 8 Cicli Legale 17% → 24%, Spavaldo 46% → 26% |
| 3 | `terreniIniziali` (riga 338) | prezzo da 150.000 | da 350.000 | toglie la differenza 17% / 33% sul terreno iniziale |
| 4 | Guadagno affari della notte (riga 1971): tabella nuova `N.illegaleLivello` | ×1 | ×[1; 1; 1,5; 2,5; 4] per Livello | la notte resta il 10–30% delle entrate di chi gioca sporco anche a 16–20 Cicli (da riverificare con bot più coraggiosi) |
| 5 | Decima (alba, riga 2978) | 15% di tutte le rendite | 15% solo delle attività, tetto 1 M × livello setta | Tesori da 180 M a qualche decina; entrare in setta non è più una perdita sicura |
| 6 | `SOGLIE_LIVELLO` (riga 1228) | fisse | × 0,6 / 0,75 / 1 / 1,5 / 2,5 per 6 / 8 / 12 / 16 / 20 Cicli | Liv.3 a metà partita, Liv.4 a 2/3, in ogni durata |
| 7 | `borsaMu` (riga 34) | 0,21 | 0,36 (solo insieme al n. 1) | Borsa = parcheggio sicuro (+12% a Ciclo) |
| 8 | Resa (riga 2808) | `p.cash -= multa` | `paga(s, p, multa, null)` | niente contanti negativi |
| 9 | Contratti (righe 2664–2702) | senza limiti | tetti, tassa solo se c'è il contante, garanzia vera | niente stati rotti, niente "regali" pagati dalla banca |
| 10 | `PACCHETTI.slice` (riga 301) | 6 pacchetti | tutti e 8 | Ereditiera e Speculatore in gioco (equilibrati) |

Pacchetto combinato provato (`proposta` in `out_varianti2.md`: rendite dei piani 1,02, permessi, terreno, illegale): vincitore a 20 Cicli 384 M e partite brevi uguali. Però così il pulito domina (8% di vittorie a testa per lo sporco contro 42–45% del pulito) e l'Investitore vince il 63–65%. Per questo consiglio **1,05** (non 1,02) e di toccare la notte (n. 4 e 5) **insieme** al Palazzo, altrimenti lo sporco perde ancora di più.

---

## Cose da ricordare per le altre fasi
- Il riferimento dello STATO ("12 Cicli ~100–105 M, 16 Cicli ~440–520 M") è confermato: 108 M e 452 M di mediana. Se si cambia l'economia, va aggiornato.
- Per provare un ritocco senza toccare il gioco: `node /home/claude/prove/economia/varianti.js <nome>` e poi `node confronto.js base <nome>`. Le costanti di `N` si cambiano al volo perché `Laguna.N` è lo stesso oggetto che usa il motore.
