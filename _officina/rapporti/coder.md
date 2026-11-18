# Rapporto del Coder capo — l'officina di "Re della Laguna"

Data: 18/11/2026. Repo guardato: `/home/claude/re-della-laguna` al commit `f61a55a` (v65). **Non ho modificato niente nel repo, nessun commit, nessun deploy.**
Tutto quello che ho scritto sta in `/home/claude/prove/coder/`.

## Le 5 cose più importanti

1. **La rete di sicurezza c'è e oggi dice VIA LIBERA.** Un comando solo: `/home/claude/prove/coder/controlla.sh`. Sul repo di oggi: sintassi ok, 0 eccezioni nelle partite di bot, invarianti rispettati, gioco nel browser ok su PC e telefono. Numeri di base uguali al riferimento: 12 Cicli = 102,6 M, 16 Cicli = 438,5 M.
2. **COD-01 (ALTA): un'azione con un valore sbagliato rompe la partita online per sempre.** Il motore non controlla i numeri che arrivano. Esempio: "regala" con una scritta al posto dell'importo → i soldi diventano "NaN" → da lì `vista()` va in errore per tutti. Sul server lo stato rotto viene salvato prima delle viste: la partita resta bloccata. Dall'interfaccia normale è difficile che succeda; dalla console del browser basta una riga.
3. **COD-02 (MEDIA): a Sette e mezzo il mazzo esce dal server.** `vista()` lascia passare `manoSM` (carte e mazzo) a tutti. Chi sa aprire la console vede la prossima carta. Contraddice "i giochi di carte si giocano davvero".
4. **COD-07 (MEDIA): più di metà delle azioni non è mai provata.** I bot usano circa 40 tipi di azione su 88. Prestiti, contratti, regali, articoli, leggi, tasse, serate, sfide non passano mai dalla simulazione. Per questo ho aggiunto il "giocatore matto" (azioni a caso): ha trovato lui COD-01, 02, 03, 04.
5. **Prima di mettere più coder in parallelo servono 4 piccoli lavori di preparazione** (sezione 5). Senza, due coder che aggiungono un campo segreto o un'azione nuova si scontrano sulla stessa riga lunga 600 caratteri.

Decisioni che servono da Nicola: **1** (COD-07b, l'ipoteca senza pulsante).

---

## 1. Risultati di base (repo di oggi)

Tutti i file dei risultati sono in `/home/claude/prove/coder/risultati/`.

| Prova | Comando | Risultato |
|---|---|---|
| Un comando solo | `./controlla.sh` | **VIA LIBERA**, 1 avviso (i buchi del giocatore matto). File `base-controlla.txt` |
| Sim 12 Cicli, 4 bot, 60 partite | `node sim.js 60 12` | 60/60 finite, **0 eccezioni, 0 blocchi**, vincitore mediana **102,6 M** (min 53, max 194). Riferimento 100-105 M: **giusto** |
| Sim 16 Cicli, 4 bot, 60 partite | `node sim.js 60 16` | 60/60 finite, 0 eccezioni, mediana **438,5 M** (min 147, max 967). Riferimento 440-520 M: **sul bordo basso** |
| Sim 8 Cicli, 4 bot, 30 partite | `node sim.js 30 8` | mediana 33,0 M |
| Sim 12 Cicli, 6 bot, 30 partite | `node sim.js 30 12 6` | mediana 178,3 M (con più giocatori girano molti più soldi) |
| Invarianti, partite normali | `node invarianti.js 14 12 4 100 --senza-matto` | 14 partite, 15.442 mosse controllate una per una: **0 violazioni** |
| Salva e ricarica | (dentro invarianti.js) | 3/3 partite finiscono uguali anche rileggendo lo stato da JSON ogni 7 mosse |
| Giocatore matto | `node invarianti.js 8 10 4 7000 --solo-matto` | 7.177 azioni a caso: **33 tipi di buchi** (COD-01..05). File `base-matto.txt` |
| Browser PC 1280x800 e telefono 390x844 | `node fumo.js` | **OK**: 0 errori di pagina, 0 console.error, 0 file mancanti. Foto in `coder/foto/` |
| Sintassi, `//` nei template, versione, server | (dentro controlla.sh) | tutto ok; `server/motore.js` e `server/bot.js` sono identici a `terser -c -m` dei due file |

Vittorie a 12 Cicli (60 partite, 4 bot): Costruttore 58%, Legale 33%, Spavaldo 23%, Esperto 18%, Investitore 15%, Furbo 5%.
**Attenzione a come leggere questo numero**: ogni bot sceglie sempre la stessa storia (il Costruttore prende "costruttore", il Furbo "contrabbandiere"...). Quindi "storia" e "carattere" sono la stessa colonna. Con `node sim.js 40 12 4 1000 --storie-a-caso` le storie vincono tutte tra 17% e 33%: la differenza grande è nel **carattere del bot**, non nella storia. Lo lascio al critico dell'economia.

Mosse dei bot rifiutate dal motore: 0 a 12 Cicli, 5 a 16 Cicli (vedi COD-08).

Nota sulla macchina di prova: è lenta e senza scheda grafica. `controlla.sh` completo dura circa 6-8 minuti, quasi tutti nel browser. `./controlla.sh veloce` (senza browser) dura 30 secondi.

---

## 2. Gli attrezzi (tutti in `/home/claude/prove/coder/`)

Tutti leggono la variabile `REPO`. Per provare una copia di lavoro: `REPO=/percorso/della/copia ./controlla.sh`. Nessuno scrive nel repo.

| File | A cosa serve | Come si lancia |
|---|---|---|
| `controlla.sh` | **Il comando unico.** 6 passi: sintassi (gioco.js e gli altri moduli copiati in `.mjs`), `//` dentro `${...}`, coerenza di `?v=` e del server, sim, invarianti, browser. Alla fine scrive VIA LIBERA oppure NON PUBBLICARE. Codice di uscita 0 o 1. | `./controlla.sh` · `./controlla.sh veloce` · `./controlla.sh completo` |
| `sim.js` | Partite di soli bot. Stampa eccezioni, blocchi, mosse rifiutate, vittorie per storia e carattere, mediana del vincitore. Esce con 1 se c'è un'eccezione o una partita che non finisce. | `node sim.js <partite> <cicli> [giocatori=4] [seme] [--breve] [--storie-a-caso]` |
| `invarianti.js` | Dopo ogni mossa controlla le cose che devono essere sempre vere (elenco sotto). Poi fa giocare il "giocatore matto". | `node invarianti.js [partite] [cicli] [giocatori] [seme]` + `--senza-matto`, `--solo-matto`, `--severo`, `--diario`, `--tutto` |
| `fumo.js` | Il gioco vero in Chrome: apre `?locale&nuova`, chiude le slide, Inizia, sceglie una storia, tira, compra, fine turno, apre il telefono e un'app, salta alla notte con i bot (`window.Laguna`), apre la notte. Fallisce con errori di pagina, `console.error`, file del gioco mancanti (404), passi obbligatori non riusciti. Una foto per passo. | `node fumo.js [cartella-foto]` · `SCHERMO=pc node fumo.js` |
| `commenti.js` | Cerca `//` dentro un `${...}` scritto su una riga (regola di STATO.md). Legge il file tenendo conto di stringhe, template ed espressioni regolari. | `node commenti.js file.js ...` |
| `mappa.js` | Rifà la mappa del codice dal codice vero (le righe cambiano a ogni modifica). | `node mappa.js > MAPPA.md` |
| `pubblica.sh` | Pubblicare una versione. **Non eseguito.** Spiegato nella sezione 7. | `./pubblica.sh "frase"` (prova) · `... --davvero` |
| `laguna.js` | Pezzi comuni: carica motore e bot da `REPO`, gioca una partita. | (usato dagli altri) |

**Gli invarianti controllati** (sigla tra parentesi quadre nell'uscita):
- [NUM] niente NaN, Infinity o undefined in nessun punto dello stato.
- [JSON] lo stato si salva e si rilegge in JSON uguale.
- [SOLDI] soldi, sporchi, debiti, Tesoro, ipoteche mai sotto zero; prezzi di Borsa sopra zero.
- [PROP] ogni terreno ha un solo padrone che esiste; niente padroni su caselle non in vendita; niente edifici senza padrone; quote dei Grandi Affari mai oltre il totale; sette coerenti (membri veri, Gran Maestro dentro, ognuno sa di esserci).
- [VISTA] `vista()` non cambia lo stato vero (JSON prima = JSON dopo) e non va in errore.
- [SEGR] `vista(s, id)` non contiene i segreti degli altri. Metodo del "canarino": su una copia metto numeri e scritte riconoscibili nei segreti degli altri (soldi, sporchi, debito, messaggi, conti, racconto della notte, mano di carte, offerte segrete, Tesoro e chat delle sette rivali, passaggi privati) e li cerco nella vista. Controlla anche che di notte non si veda dove sono gli altri e che non esca mai un "mazzo".
- [FINE] la partita finisce e la classifica è fatta di numeri veri.
- [CARICA] la stessa partita, salvata e riletta ogni 7 mosse come fa il server, finisce uguale.
- [A-META] un'azione rifiutata ("non puoi") non deve aver cambiato niente.
- [ROTTO] un'azione sbagliata può essere rifiutata, ma non deve mandare in errore il motore.

**Cosa blocca e cosa no.** Le violazioni nelle partite normali bloccano sempre (oggi sono zero: se compaiono, le ha introdotte la modifica). I buchi del giocatore matto oggi sono solo un avviso, perché ci sono già. **Appena COD-01..04 sono corretti si lancia `SEVERO=1 ./controlla.sh`** e bloccano anche loro.

**Un trucco utile per chi ristruttura.** La simulazione è ripetibile (ho sostituito `Math.random` dei bot con un seme). Se una modifica non deve cambiare le regole (spostare codice, rinominare), `node sim.js 20 12 > prima.txt` e poi `> dopo.txt` devono essere **identici** (a parte la riga del tempo). Se cambia un numero, la modifica ha toccato le regole.

---

## 3. Mappa del codice

La mappa completa (tutte le 260 funzioni del motore e le 179 dell'interfaccia con la riga, tutti gli 88 tipi di azione con funzione, campi, "ha un pulsante?", "i bot la usano?", e tutti i campi dello stato) è in **`/home/claude/prove/coder/MAPPA.md`**. Si rifà con `node mappa.js > MAPPA.md`.

Qui sotto la versione "trova in un minuto".

### 3.1 Chi fa cosa

| File | Righe | Cosa c'è |
|---|---|---|
| `motore.js` | 3.491 | **Tutte le regole.** Un blocco unico, funzioni rientrate di 2 spazi. Gira uguale nel browser (`window.Laguna`), in Node (`require`), sul server. |
| `gioco.js` | 2.684 | **Tutta l'interfaccia.** Modulo. Riceve la vista e disegna. Manda le azioni con `agisci({tipo, ...})`. |
| `bot.js` | 426 | I giocatori-computer: `LagunaBot.prossima(stato, giocatore)` ritorna un'azione oppure null. |
| `locale.js` | 93 | Partita da soli (`?locale`): stato in `localStorage["laguna_locale"]`, fa giocare i bot. |
| `tre.js` | 539 | Tabellone 3D: camera, visuali Segui/Libera/Alto, pedine, etichette, luci. |
| `mondo3d.js` | 150 | Costruisce il mondo 3D: isole, strada, lotti, mare. |
| `panorama.js` | 113 | Foto a 360° della notte. |
| `server/index.ts` | 195 | Funzione Supabase: `crea`, `entra`, `inizia`, `azione`. Carica `server/motore.js` e `server/bot.js` da jsDelivr a un commit preciso. |
| `server/motore.js`, `server/bot.js` | 1 riga | Copie compresse (terser). **Non si toccano a mano.** |

### 3.2 motore.js: dove intervenire

| Devo cambiare... | Righe | Funzioni principali |
|---|---|---|
| Un numero del gioco (prezzi, rendite, rischi, soglie) | 14-179 | `N` (riga 15), `PACCHETTI` (92), `ATTIVITA`, `STANZE`, `GRANDI`, `LEGGI`, `PENE` |
| Soldi, patrimonio, affitto, rendita | 180-263 | `patrimonio`:221 `fascia`:227 `affitto`:229 `rendita`:238 `copertura`:245 `flusso`:256 |
| Nuova partita, scelta della storia | 264-333 | `nuovaPartita`:265 `scegliPacchetto`:313 |
| Giorno: dadi, caselle, comprare, aste | 334-597 | `iniziaTurno`:362 `tira`:374 `viaggioRapido`:405 `atterra`:435 `compra`:518 `offerta`:533 `chiudiAsta`:543 `gala`:557 `casinoReale`:567 `municipio`:577 |
| Costruire, Palazzo, stanze | 598-718 | `costruisci`:604 `piano`:677 `stanzePossibili`:700 `compraStanza`:708 |
| Grandi Affari (TV, Banca) | 719-898 | `apriAsteGrandi`:730 `offertaGrande`:741 `comprareQuote`:752 `titolone`:786 `tassoBanca`:827 `bloccaConto`:834 `albaGrandi`:854 |
| Banca, Borsa, veicoli, fine turno | 899-1005 | `compraVeicolo`:899 `prestito`:910 `restituisci`:920 `ipoteca`:927 `investi`:945 `vendi`:960 `fineTurno`:977 `fineGiorno`:995 |
| Notte vecchia (v1), in parte morta | 1006-1149 | `corrompi`:1075 e `ricicla`:1100 servono ancora; `affare`:1012 `spia`:1129 `pronto`:1144 non le chiama più nessuno |
| Notte: luoghi, oggetti, occasioni (dati) | 1150-1228 | `ORE`, `LUOGHI`, `OGGETTI`, `PERICOLI`, `OCCASIONI`, `INDIZI`, `SOGLIE_LIVELLO` |
| Notte: inizio, orologio, ore | 1294-1378, 1939-2100 | `iniziaNotte`:1294 `apriOra`:1348 `avanti`:1357 `tempoScaduto`:1364 `controllaOra`:1940 `risolviOccasione`:1945 `risolviOra`:2011 `fineNotte`:2088 |
| Notte: cosa puoi fare dove sei | 1717-1938 | `scelteNotte`:1717 `vai`:1792 `aspetta`:1805 `tornaACasa`:1813 `compraOggetto`:1821 `prendiOccasione`:1841 `fotografa`:1856 `ricicla2`:1866 `corrompi2`:1877 `ricettatore`:1888 `ballo`:1901 |
| Palazzo di notte, serate, carte | 1379-1710 | `attivitaNotte`:1397 `spa`:1471 `apriSerata`:1479 `giocaSerata`:1537 Sette e mezzo: `apriManoSM`:1566 `mossaSM`:1570 `chiudiManoSM`:1587 `incontro`:1650 `rispondiIncontro`:1677 |
| Permessi, cantieri, licenze, agenzia | 2101-2191 | `chiediPermesso`:2102 `agenzia`:2126 `chiediLicenza`:2145 `chiudiCantieri`:2180 |
| Chiamate di giorno, perquisizioni | 2192-2232 | `rispondiChiamata`:2199 `rischioPerquisizione`:2211 `perquisizioni`:2216 |
| Setta | 2233-2637 | `influenzaDi`:2245 `livelloSetta`:2252 `guadagnaInfluenza`:2258 Opere: `proponiOpera`:2289 `votaOpera`:2300 `albaOpere`:2312 · `lavaSetta`:2379 `fondaSetta`:2391 `invitaSetta`:2404 `rispondiInvito`:2416 `espelliSetta`:2432 `versaSetta`:2449 `convoca`:2464 `rito`:2488 `seppellisci`:2514 `tradisci`:2545 `recluta`:2580 `operazione`:2593 |
| Gazzetta, contratti, scambi, regali | 2638-2749 | `articolo`:2639 `proponiContratto`:2664 `rispondiContratto`:2678 `proponiLotto`:2711 `rispondiProposta`:2725 `regala`:2741 |
| Pagare e debiti | 2750-2767 | `paga`:2751 `raccogli`:2762 |
| Polizia, piste, condanne, Resa dei conti | 2768-2937 | `protezione`:2770 `rischioResa`:2791 `resaDeiConti`:2796 `segnaTraccia`:2817 `aggiornaPiste`:2825 `piste`:2851 `tiroIndagine`:2865 `mandaAlFaro`:2890 `condanna`:2896 |
| Alba (rendite, tasse, interessi, tutto) | 2938-3063 | `alba`:2939 (124 righe: la più grossa del motore) |
| Politica, eventi, fine partita | 3064-3174 | `elezioni`:3064 `campagna`:3078 `legge`:3083 `tasse`:3093 `regista`:3100 `finisceQui`:3129 `fine`:3157 |
| Scoperte e consigli di Vera | 3175-3277 | `SCOPERTE`, `primaVolta`:3249 `consiglioVera`:3264 |
| **Ingresso unico** | 3278-3415 | `MOTIVO`:3280 ("I miei conti") `registraConti`:3287 **`applica`:3299** **`applica0`:3315** (lo `switch` con tutti i tipi) |
| **Cosa vede ognuno** | 3416-3479 | **`vista`:3416** |
| Cosa esce dal motore | 3481-3487 | `API` (una riga di 609 caratteri) |

### 3.3 gioco.js: dove intervenire

| Devo cambiare... | Righe | Funzioni principali |
|---|---|---|
| Opzioni dell'indirizzo, durata | 1-71 | `VELOCE`, `LOCALE`, `vuole3D`:18 `toast`:59 |
| Suoni e musica | 72-136 | `brano` (riga 102) |
| Parlare col server | 137-176 | `chiama`:138 `agisci`:149 `inviaAzione`:150 `caricaVista`:159 `ascolta`:166 |
| Schermate d'ingresso, sala d'attesa | 177-338 | `avvio`:178 `schermataProvaLocale`:210 `schermataNome`:238 `schermataCasa`:254 `sala`:297 |
| Animazioni (dadi, pedine, soldi che volano) | 376-544 | `riceviVista`:387 `eseguiCoda`:394 `volaSoldi`:439 `mostraDadi`:503 `cammina`:520 |
| Schermo principale e tabellone | 545-903 | `disegna`:546 `disegnaMappa`:594, zoom e spostamento da 777 |
| La carta in basso (cosa fare ora) | 904-957 | |
| Notte: scene dei luoghi | 958-1421 | `scenaNotte`:1168 `collegaScena`:1230 |
| Telefono e Gazzetta | 1422-1548 | |
| Telefono: home e tutte le app | 1549-1988 | **`contenutoApp`:1684** (146 righe, 28 KB: tutte le app in una funzione) `collegaApp`:1940 |
| Finestre, Sette e mezzo, finestre automatiche | 1989-2510 | `finestra`, `finestreAutomatiche`:2053 (storia: 2113, compra: 2132, chiamata: 2141) `appPalazzo`:2422 |
| Le slide "Come si gioca" | 2511-2598 | `datiGuida`:2512 `apriGuida`:2566 |
| App TV / Grandi Affari | 2599-2669 | `appAffare`:2606 |
| Schede delle attività | 2670-2684 | |

### 3.4 Com'è fatto lo stato

Lo stato è un solo oggetto JSON. Elenco completo dei campi in MAPPA.md. L'essenziale:

- **partita** (`s`): `fase` ("pacchetti" → "giorno" → "notte" → ... → "fine"), `ciclo` (da 0), `giorno` (0-3), `turno` + `ordine`, `players`, `lotti`, `sette`, `pending` (la domanda aperta di giorno: `compra`, `asta`, `gala`, `chiamata`, `casino_reale`, `municipio`), `notte` (solo di notte), `notteFatti`, `grandi` (TV e Banca), `borsa`, `cripto`, `valore` (delle isole), `sindaco`, `leggi`, `tassa`, `contratti`, `proposte`, `inviti`, `flussi`, `log`, `gazzetta`, `rngState` (il seme: mai nella vista), `modoFine` / `cicli` / `obiettivo`, alla fine `classifica`, `titoli`, `resa`.
- **giocatore** (`p`, circa 90 campi): `id` ("g1" è chi ha creato la partita), `cash`, `sporchi`, `debito`, `prestiti`, `tracce`, `stato` (gradino dell'indagine), `faro` (turni di prigione), `fama`, `pacchetto` (= la **storia**), `strat` (= il **carattere** del bot), `pos`, `haTirato`, `azioneGiornoFatta`, `piani`, `stanze`, `veicoli`, `azioni`, `cripto`, `sette`, `valigetta`, `prove`, `corrotti`, `messaggi`, `conti`. I campi che cominciano con `_` (`_n`, `_investito`, `_lavaCiclo`...) sono la memoria dei bot.
- **casella** (`l`, in `s.lotti`, sono 88): `id` ("o0"..."o87"), `tipoCasella` ("lotto" e "molo" si comprano), `serie` (il quartiere), `isola`, `prezzo`, **`owner`** (un id oppure null: per costruzione un solo padrone), `lvl` (0-5), `tipo` (attività), `ipoteca`, `chiuso`, `cantiere`, `permesso`.
- **setta** (`st`): `id`, `nome`, `motto`, `gm`, `membri`, `tesoro`, `influenza` (livelli a 12/35/70), `sepolto`, `chat`, `opera`, `opereFatte`, `tradimento`, `convocazione`.
- **notte** (`s.notte`): `ora` (0-6), `dove`, `viaggio`, `chiuso`, `pronto`, `occasioni`, `pericolo`, `racconto`, `inizio` (ora vera: l'orologio dei 120 secondi).

### 3.5 Tutti i tipi di azione di applica()

Sono 88. Tabella completa in MAPPA.md. Per gruppi:

- **Inizio e giorno**: `pacchetto` `tira` `viaggio_rapido` `compra` `offerta` `agenzia` `fine_turno` `gala` `casino_reale` `municipio` `chiamata`
- **Costruire**: `permesso` `regalo_assessore` `costruisci` `piano` `stanza` `licenza` `busta_licenza` `veicolo`
- **Soldi**: `prestito` `restituisci` `ipoteca` `riscatta` `investi` `vendi` `regala` `evasione`
- **Tra giocatori**: `proponi_lotto` `rispondi_proposta` `contratto` `rispondi_contratto` `articolo` `denuncia`
- **Politica**: `candidati` `campagna` `legge` `tasse`
- **Grandi Affari**: `offerta_grande` `quote_grande` `titolone` `tasso_banca` `blocca_conto` `ricicla_banca`
- **Notte**: `vai` `aspetta` `avanti` `pronto` `torna_a_casa` `tempo_scaduto` `occasione` `compra_oggetto` `soffiata` `foto` `corrompi` `scarica_contatto` `ricicla` `ricettatore` `ballo` `attivita` `spa`
- **Serate e carte**: `serata` `vai_serata` `gioca_serata` `sm` `incontro` `rispondi_incontro`
- **Setta**: `fonda_setta` `invita_setta` `rispondi_invito` `espelli_setta` `lascia_setta` `versa_setta` `lava_setta` `msg_setta` `recluta` `operazione` `convoca` `rito` `jet_setta` `seppellisci` `scava` `tradisci` `prova_fedelta` `proponi_opera` `ritira_opera` `vota_opera`
- **Altro**: `chiudi_partita` `preferenze`

### 3.6 Cosa nasconde vista()

`vista(s, id)` (motore.js:3416) fa una copia intera dello stato e poi toglie. **Regola da ricordare: tutto quello che non viene tolto a mano, passa.** Ogni campo nuovo e segreto va aggiunto lì.

1. Sempre: `rngState` e `seed`.
2. Degli altri giocatori (riga 3424): `cash`, `sporchi`, `tracce`, `stato`, `debito`, `corrotti`, `prove`, `messaggi`, `azioni`, `cripto`, `evasione`, `sette`, `settaFondata`, `valigetta`, `conti`, `ultimoEsito`, `reputazione`, `peggiorReato`, `riciclTot`, `ultimaSentenza`, `calore`, `luoghiNotte`, `storiaTracce`, `scoperte`... (36 campi). Al loro posto mette `fascia` (Benestante, Ricco...).
3. Offerte segrete di aste e Grandi Affari: resta solo la tua.
4. Sette: solo quelle dove sei membro (senza `tradimento`, senza `sepolto` se non sei Gran Maestro). Delle altre solo id e nome. Inviti senza firma.
5. `flussi`: i pubblici e i tuoi. `proposte` e `contratti`: i tuoi.
6. `ultimaAlba.riepilogo` e `riepOra`: solo la tua parte.
7. Notte: ricostruita da capo. Dove sono gli altri solo se siete nello stesso posto.
8. **Secondo strato fuori dal motore** (`vistaSicura`, server/index.ts:44 e copia in locale.js:13): toglie altri 17 campi (`prestiti`, `mosseNotte`, `trucchi`...), nasconde i piani segreti, toglie a te le tue `tracce`, ripulisce la cronaca.

**Cosa NON nasconde e dovrebbe**: `manoSM` (COD-02).

---

## 4. Errori trovati

### COD-01 — Un valore sbagliato in un'azione rompe la partita per sempre
- **Gravità: ALTA**
- **Dove**: `motore.js:3315` (`applica0` non controlla i valori). Funzioni colpite: `regala`:2741, `restituisci`:920, `vendi`:960, `prestito`:910, `proponiContratto`:2664, `proponiLotto`:2711, `articolo`:2639, `evasione`:3409, `tasse`:3093. Sul server: `server/index.ts:181-185`.
- **Come si vede**: `node invarianti.js 8 10 4 7000 --solo-matto`. Esempi veri:
  - `{tipo:"regala", a:"g2", importo:{}}` → i soldi di chi regala diventano NaN.
  - `{tipo:"restituisci", importo:"abc"}` → debito NaN.
  - `{tipo:"vendi", cosa:"borsa", nome:"Laguna Energy", quota:"abc"}` → azioni e soldi NaN.
  - `{tipo:"prestito", importo:"abc"}`, `{tipo:"evasione", quota:{}}`, contratti con `pagoOra:{}`.
  - Da quel momento `vista()` va in errore per **tutti** (`motore.js:227`, la fascia non si calcola).
  - Sul server l'ordine è: applica → salva lo stato → calcola le viste. Lo stato rotto viene salvato, le viste no. Ogni azione dopo dà "Errore del server". La partita si sblocca solo a mano nel database.
  - Perché succede: `Math.floor(x || 0)` trasforma una scritta o un oggetto in NaN, e poi `NaN <= 0` e `soldi < NaN` sono falsi, quindi i controlli passano.
- **Quanto è probabile**: dall'interfaccia normale poco (manda numeri). Da un amico che apre la console, una riga. Da un pulsante nuovo scritto male, possibile.
- **Proposta** (lavoro piccolo, 3 pezzi):
  1. In cima ad `applica0` una sola tabella di controllo per nome del campo: `importo`, `prezzo`, `offerta`, `ingresso`, `quota`, `tasso`, `n`, `quanti`, `idx`, `ora` devono essere numeri veri (niente NaN, Infinity, scritte, oggetti); `contratto` deve essere un oggetto. Altrimenti `err("Valore non valido.")`. I nomi dei campi sono già uguali in tutte le azioni, basta una tabella di 15 righe.
  2. Cintura di sicurezza in fondo ad `applica`: se dopo l'azione un giocatore ha `cash`, `sporchi` o `debito` non numerici, lanciare un errore vero. Il server in quel caso **non salva**.
  3. Nel server calcolare le viste **prima** di salvare lo stato (vedi COD-11).
- **Decisione di Nicola**: NO.

### COD-02 — A Sette e mezzo il mazzo e le mani escono dal server
- **Gravità: MEDIA** (ALTA se tra amici qualcuno sa usare la console)
- **Dove**: `motore.js:3416` (`vista`). La mano nasce in `apriManoSM`:1568 dentro `s.manoSM[id]` con il `mazzo`. La vista mette la versione pulita in `v.notte.manoSM` (riga 3458) ma **non cancella `v.manoSM`**, che resta nella copia intera.
- **Come si vede**: l'invariante [SEGR] in `base-matto.txt`: "nella vista c'è un mazzo di carte" e "il server manda a un giocatore: mano di Sette e mezzo di un altro". Mentre una mano è aperta, ogni giocatore riceve carte e mazzo di chi gioca. Chi gioca riceve anche il proprio mazzo: sa quale carta esce se chiede "carta".
- **Proposta** (piccolo): in `vista` aggiungere `delete v.manoSM;`. L'interfaccia usa già solo `S.notte.manoSM` (gioco.js:2008). L'invariante c'è già e lo controllerà.
- **Decisione di Nicola**: NO.

### COD-03 — Azioni malformate mandano in errore il motore
- **Gravità: MEDIA**
- **Dove e come si vede** (`base-matto.txt`, sigla [ROTTO]):
  - `{tipo:"contratto", contratto:null}` → `motore.js:2665` "Cannot read properties of null".
  - `{tipo:"stanza", stanza:"constructor"}` oppure `{tipo:"piano", funzione:"__proto__"}` → `motore.js:712`. `STANZE["constructor"]` esiste (è una cosa di JavaScript, non una stanza) e il controllo "stanza sconosciuta" passa.
  - `{tipo:"corrompi", chi:"__proto__"}` → `motore.js:1714`.
- **Effetto**: sul server risposta "Errore del server: Cannot read properties..." (non salva, quindi niente danni). Nella partita locale l'errore sparisce in silenzio (gioco.js:149, il `.catch(() => {})`).
- **Proposta** (piccolo): per cercare in una tabella usare `Object.hasOwn(STANZE, f)` al posto di `STANZE[f]`; controllare `contratto` nella tabella di COD-01.
- **Decisione di Nicola**: NO.

### COD-04 — Azioni rifiutate ma fatte a metà
- **Gravità: MEDIA** nella partita locale e per i bot, nessun effetto per le persone online (il server non salva se l'azione è rifiutata)
- **Dove e come si vede** (sigla [A-META]):
  - `articolo` (motore.js:2642-2644): prima toglie i soldi, poi cerca il bersaglio. Con un bersaglio sbagliato: "Giocatore non trovato", ma i 300.000 € sono già spariti (visto: 316.504 → 16.504).
  - Telefonata dal Faro (motore.js:3319-3321): la telefonata del turno viene segnata come usata **prima** di provare l'azione. Se l'azione viene rifiutata, la telefonata è persa.
  - Grandi Affari: `grande()` (riga 728) crea `s.grandi` anche quando l'azione viene rifiutata. Innocuo.
- **Proposta** (piccolo): in `articolo` spostare `giocatore(s, idBersaglio)` prima del pagamento; al Faro segnare la telefonata dopo che l'azione è riuscita. Regola per tutto il codice nuovo: **prima tutti i controlli, poi le modifiche**.
- **Decisione di Nicola**: NO.

### COD-05 — Soldi sotto zero dopo la Resa dei conti
- **Gravità: BASSA**
- **Dove**: `motore.js:2808`, `p.cash -= multa`. La multa è fino al 60% del patrimonio, ma viene tolta tutta dai contanti.
- **Come si vede**: partita con seme 7501 (giocatore matto): a fine partita un giocatore con -883.193 € in contanti. Nelle partite normali di bot non è mai successo (in 28 partite controllate con gli invarianti), perché i bot hanno sempre tanti contanti.
- **Effetto**: la classifica resta giusta (il patrimonio conta i contanti negativi). È brutto da vedere nel riepilogo.
- **Proposta** (piccolo): usare `paga()` (vende titoli, poi debito) oppure limitare la multa. In generale nel motore ci sono 40 punti con `cash -=` scritto a mano e solo 6 che usano `paga()`: ogni nuovo pagamento "che può non bastare" deve passare da `paga()`.
- **Decisione di Nicola**: NO.

### COD-06 — Lo stesso codice copiato in più posti, già diverso
- **Gravità: MEDIA**
- **Dove**: `vistaSicura` in `server/index.ts:44` e in `locale.js:13`. La lista `ALTRI_SEGRETI` del server ha `licenzaNegata` e `trucchi`, quella di locale.js no. In locale.js manca tutta la parte dei piani segreti (`PIANI_SEGRETI`). `giocaBot` è copiato uguale in `server/index.ts:72`, `locale.js:22`, di nuovo in `locale.js:54`.
- **Come si vede**: avviso [DOPPIONE] di invarianti.js.
- **Effetto oggi**: nella prova da soli vedi dei bot cose che online sarebbero nascoste. Poco grave. Il rischio vero è domani: chi aggiunge un segreto lo mette in un posto e dimentica l'altro.
- **Proposta** (piccolo-medio): spostare `vistaSicura` dentro il motore (diventa `Laguna.vistaSicura`) e `giocaBot` dentro bot.js (`LagunaBot.gioca`). Server e locale.js li chiamano e basta. Così c'è una sola lista di segreti.
- **Decisione di Nicola**: NO.

### COD-07 — Più di metà delle azioni non è mai provata dai bot
- **Gravità: MEDIA**
- **Dove**: `bot.js`. Tabella in MAPPA.md, colonna "bot".
- **Come si vede**: in 6 partite i bot usano circa 40 tipi su 88. **Mai usate**: `prestito`, `vendi`, `ipoteca`, `riscatta`, `regala`, `contratto`, `proponi_lotto`, `articolo`, `denuncia`, `campagna`, `legge`, `tasse`, `evasione`, `licenza`, `busta_licenza`, `blocca_conto`, `attivita`, `spa`, `serata`, `soffiata`, `foto`, `ricettatore`, `ballo`, `versa_setta`, `msg_setta`, `seppellisci`, `scava`, `espelli_setta`, `lascia_setta`, `ritira_opera`, `jet_setta`, `operazione`.
- **Effetto**: "0 errori nella sim" vuol dire "0 errori nella metà del gioco che i bot giocano". Il riferimento economico (100-105 M) è misurato senza prestiti, contratti, politica attiva, serate.
- **Proposta**: (a) tenere il giocatore matto nei controlli (fatto); (b) lavoro medio: un carattere di bot "Curioso" solo per le prove, che prova ogni Ciclo le azioni che gli altri non fanno; (c) quando si aggiunge un'azione nuova, aggiungerla anche a un bot.
- **Decisione di Nicola**: NO.

### COD-07b — Azioni che esistono nel motore ma non hanno un pulsante
- **Gravità: BASSA**
- **Dove**: `ipoteca` (motore.js:927) e `riscatta` (936): in gioco.js non c'è nessun pulsante che le manda. `preferenze` (3410, `vuoleCorona`, `vuoleUscire`): nessuno le manda e nessuno le legge.
- **Decisione di Nicola**: **SÌ**. Domanda: "Nel gioco esiste l'ipoteca (dai un terreno in pegno alla banca e prendi soldi subito), ma non c'è il pulsante per usarla. Cosa facciamo?"
  1. La togliamo: c'è già il prestito, una cosa in meno da spiegare.
  2. Mettiamo il pulsante nell'app Banca, con il rischio scritto chiaro.
  3. La lasciamo dormire e decidiamo più avanti.

### COD-08 — I bot al Faro provano due telefonate nello stesso turno
- **Gravità: BASSA**
- **Dove**: `bot.js` (parte setta: `operaBot`:111, `votoBot`:97) contro `motore.js:3319`.
- **Come si vede**: `node sim.js 60 16`: 5 mosse rifiutate, "proponi_opera / vota_opera: Al Faro hai una sola telefonata per turno". Il bot poi passa il turno con la via d'uscita.
- **Proposta** (piccolo): il bot controlla `p.telefonataUsata` prima di proporre.
- **Decisione di Nicola**: NO.

### COD-09 — bot.js è per metà codice compresso, usa il caso vero e cambia lo stato mentre "pensa"
- **Gravità: MEDIA** (è debito: rallenta ogni lavoro sui bot)
- **Dove**: `bot.js:1-40` e `198-426`: nomi di una lettera (`o` = stato, `i` = giocatore, `t` = motore, `n`, `e`, `r`...), cioè codice passato da terser e poi rimesso in colonna. Le parti nuove (sette, Grandi Affari, righe 41-197) sono scritte in chiaro ma dentro lo stesso stile. `grandiBot`:156 è lunga 271 righe.
- 19 chiamate a `Math.random()`: una partita online con bot non si può rigiocare uguale per capire un errore. Il motore invece ha il suo seme (`rng(s)`).
- `prossima()` scrive nello stato prima che l'azione sia accettata (es. `i._investito = true`, riga 331; la memoria della notte `_n`). Se la chiedi due volte, la seconda risposta è diversa. Server e locale.js lo sanno (commento "una sola domanda al bot") ma è una trappola per chi scrive codice nuovo.
- **Proposta** (medio): rinominare le variabili di una lettera (`o→s`, `i→p`, `t→L`) usando il trucco "sim identica prima e dopo"; passare a `rng` con un seme proprio del bot. Da fare **solo se** nella prossima fase si lavora sui bot.
- **Decisione di Nicola**: NO.

### COD-10 — Codice morto e nomi doppi nel motore
- **Gravità: BASSA**
- **Dove**: la "notte vecchia" (motore.js:1006-1149): `affare`:1012 (59 righe), `spia`:1129, `pronto`:1144 non sono più chiamate da nessuno. `corrompi`:1075 e `ricicla`:1100 servono ancora, ma solo passando da `corrompi2`:1877 e `ricicla2`:1866. `nomeLuogo` è definita due volte (1812 e 2815: vince la seconda). `livelloVecchio`:2236 serve solo per partite iniziate prima di v59.
- **Rischio**: chi cerca "dove si ricicla" trova due funzioni e può correggere quella sbagliata.
- **Proposta** (piccolo): togliere `affare`, `spia`, `pronto` e una `nomeLuogo`; verificare con la sim identica.
- **Decisione di Nicola**: NO.

### COD-11 — Il server nasconde gli errori dei bot e salva in due tempi
- **Gravità: MEDIA**
- **Dove**: `server/index.ts:79` e `:85`: `catch (_e)` prende **tutti** gli errori dei bot, anche quelli veri del codice, e va avanti con una mossa di ripiego. Uguale in `locale.js:29`. `server/index.ts:181-185`: prima salva lo stato, poi calcola e salva le viste.
- **Effetto**: un errore del codice in una mossa dei bot non si vede mai (né nei log né a schermo). Se il calcolo delle viste fallisce, lo stato è già andato avanti e i giocatori restano con la vista vecchia.
- **Proposta** (piccolo): nel `catch` distinguere `e.gioco` (mossa non valida: normale) dagli altri (`console.error` con seme, Ciclo, azione). Calcolare tutte le viste prima di scrivere; se fallisce, non salvare niente.
- **Nota**: la funzione Supabase non si può provare da qui. `controlla.sh` ne controlla solo le parentesi (manca `deno`).
- **Decisione di Nicola**: NO.

### COD-12 — Il browser e il server possono avere due motori diversi
- **Gravità: MEDIA** (rischio di procedura)
- **Dove**: il browser scarica `motore.js` da GitHub Pages (subito dopo il push). Il server usa il motore del commit scritto in `server/index.ts:13-14` e cambia solo quando la funzione viene ripubblicata.
- **Effetto**: tra il push e la pubblicazione su Supabase il gioco mostra con le regole nuove e il server decide con le vecchie. Inoltre gioco.js chiama circa 20 funzioni del motore sulla vista (`L.patrimonio(S, ...)`, `L.rendita`, `L.affitto`, `L.livelloSetta`...): funzionano solo se toccano campi tuoi o pubblici. Su un campo nascosto danno NaN.
- **Proposta**: pubblicare sempre con `pubblica.sh` e subito dopo la funzione; mai mentre la partita di Nicola è in corso. Regola per il codice nuovo: l'interfaccia deve reggere una vista senza i campi nuovi (`x || 0`).
- **Decisione di Nicola**: NO.

### COD-13 — L'interfaccia e il server leggono le frasi della cronaca
- **Gravità: BASSA**
- **Dove**: `gioco.js:402` (i dadi animati partono se una riga finisce con " tira 3 e 4."), `gioco.js:423` (annuncio d'asta se la riga comincia con "Asta"), `gioco.js:430`, `gioco.js:379`, `server/index.ts:55` e `locale.js:19` (righe private riconosciute dalle parole "prestito", "investe", "vende"...).
- **Rischio**: chi rende più chiara una frase nel motore può spegnere l'animazione dei dadi o far uscire una riga privata, senza nessun errore.
- **Proposta** (medio, da fare quando si tocca la cronaca): aggiungere a ogni riga un campo `k` (es. "tiro", "asta", "privata") e leggere quello.
- **Decisione di Nicola**: NO.

### COD-14 — Note dalla prova nel browser (da passare ai critici dell'interfaccia)
- **Gravità: BASSA**, non verificate a fondo
- Di notte, su PC e telefono, il pulsante "Vai altrove" risulta coperto da un altro elemento nel suo punto centrale (`fumo.js` lo segnala come nota). Foto: `coder/foto/telefono-13-una-mossa-di-notte.png`.
- La finestra "Compro / Lascio stare" compare solo quando la pedina ha finito di muoversi. Nel browser di prova (lentissimo) sono 25 secondi; nel frattempo in basso c'è solo "...". Foto: `coder/foto/pc-06-tiro-dei-dadi.png`.
- **Decisione di Nicola**: NO.

### Cose controllate e trovate a posto
- `vista()` non modifica mai lo stato (15.000 mosse controllate, giorno e notte).
- `influenzaDi()` non scrive.
- Nessun `//` dentro `${...}` su una riga, in nessun file.
- Nessuna memoria nascosta fuori dallo stato: salvare e rileggere non cambia la partita.
- Segreti degli altri: soldi, sporchi, debito, messaggi, conti, racconto della notte, offerte segrete, Tesoro e chat delle sette rivali, passaggi privati non escono mai. Unica eccezione COD-02.
- `server/motore.js` e `server/bot.js` corrispondono ai sorgenti; `server/index.ts` punta al commit `a8f7fef`, che ha il motore di oggi.

---

## 5. Debito tecnico e cosa sistemare PRIMA di aggiungere funzioni

### 5.1 Da fare prima (convengono davvero)

| # | Lavoro | Perché adesso | Quanto |
|---|---|---|---|
| P1 | **Controllo dei valori in ingresso** in `applica0` + cintura di sicurezza (COD-01, COD-03) | Ogni azione nuova eredita la protezione. Poi `SEVERO=1`. | piccolo |
| P2 | **Spezzare le righe-lista** su più righe, una per tema: la lista dei segreti in `vista` (riga 3424, 482 caratteri), `API` (3487, 609 caratteri), `MOTIVO` (3280-3286), `giorniAzioniTelefono` (3318) | Sono i punti dove tutti aggiungono qualcosa. Su una riga sola, due coder = conflitto sicuro. Su più righe git le unisce da solo. | piccolo |
| P3 | **Una sola `vistaSicura` e un solo `giocaBot`** (COD-06), più `delete v.manoSM` (COD-02) | Una sola lista di segreti prima che ne arrivino di nuovi. | piccolo-medio |
| P4 | **Dividere `contenutoApp`** (gioco.js:1684, 28 KB, tutte le app del telefono in una funzione) in una funzione per app | Il problema numero uno di Nicola è la chiarezza del telefono: lì lavoreranno in tanti. Spostamento meccanico. | medio |

Per P2, P3 e P4 la prova è: `node sim.js 20 12` identica prima e dopo, più `controlla.sh`.

### 5.2 Da fare solo se si tocca quella zona
- Rinominare le variabili di bot.js (COD-09): solo se si lavora sui bot.
- Togliere il codice morto della notte vecchia (COD-10): 10 minuti, quando si tocca la notte.
- Dare un tipo alle righe della cronaca (COD-13): quando si riscrivono i testi.
- `alba` (motore.js:2939, 124 righe): se si aggiungono cose all'Alba, prima dividerla in passi (`albaRendite`, `albaTasse`, `albaPolizia`...). L'ordine dei passi conta: va tenuto uguale.

### 5.3 Da NON fare
- **Non dividere motore.js in più file.** Server, browser e prove lo caricano come file unico, senza "build". Dividerlo vuol dire introdurre un passo di costruzione: più cose che si rompono, nessun vantaggio per chi gioca.
- Non passare a TypeScript, non introdurre framework.
- Non riformattare i file (niente "prettier" su tutto): cambierebbe ogni riga e renderebbe impossibile unire il lavoro degli altri.

### 5.4 Punti fragili da conoscere
- `vista()` copia tutto e toglie: **un campo nuovo è pubblico finché non lo nascondi**.
- Dentro `vista()` si chiamano funzioni del motore sullo stato vero (`scelteNotte`, `quiConMe`, `rischioPerquisizione`, `lustro`...). Se una di queste scrive, si rompe la regola di STATO.md. L'invariante [VISTA] lo scopre.
- L'orologio della notte usa l'ora vera (`adesso()`, motore.js:1347). È l'unico punto del motore che dipende dal tempo. Nelle prove lo sostituisco.
- Nel motore ci sono 40 `cash -=`, 37 `cash +=`, 32 modifiche a `sporchi` scritte a mano. "I miei conti" funziona lo stesso perché `registraConti` (3287) confronta prima e dopo. Ma un motivo nuovo va aggiunto in `MOTIVO`, altrimenti finisce sotto "Altro".
- In gioco.js ci sono 89 righe più lunghe di 400 caratteri (fino a 1.203) e 363 oltre i 200: HTML dentro template. È lì che la regola del `//` fa più male. `commenti.js` le controlla.
- Le versioni `?v=` vanno alzate insieme in tre file (index.html, gioco.js, tre.js). Se ne resta indietro una, il browser tiene il file vecchio. `controlla.sh` passo 3 lo segnala; `pubblica.sh` lo fa da solo.
- I bot ricordano dentro il giocatore (campi con `_`). Quei campi viaggiano nello stato e nella vista: non metterci cose segrete.

### 5.5 Convenzioni da seguire
- **Nomi in italiano**, come adesso: funzioni con il verbo (`compraStanza`, `chiudiAsta`), tipi di azione con il trattino basso (`fine_turno`), costanti in maiuscolo (`LUOGHI`), numeri del gioco dentro `N`.
- **Ogni azione**: una riga `case` in `applica0`, una funzione `nome(s, p, ...)`, una voce in `MOTIVO` se muove soldi. Dentro la funzione: **prima tutti i controlli con `err("frase in italiano semplice")`, poi le modifiche.**
- `err()` = "non puoi" (errore di gioco, il giocatore lo legge). Qualsiasi altro errore è un errore del codice.
- I numeri a caso del motore **solo** con `rng(s)`. Mai `Math.random()` nel motore.
- Lo stato resta JSON puro: niente date, funzioni, Map, Set, undefined, NaN.
- Soldi: `round()` sugli importi, `paga()` per i pagamenti che possono non bastare, `flusso()` per farli comparire, `euro()` per scriverli.
- Testi: `log()` cronaca, `notizia()` Gazzetta, `privato()` messaggio, `racconta()` racconto della notte. Italiano semplice, frasi brevi, e il rischio dell'illegale sempre scritto.
- Interfaccia: testo scritto dai giocatori sempre dentro `esc()`. Niente `//` dentro `${...}` su una riga.
- Regole di STATO.md, in breve: `vista()` non scrive mai; `influenzaDi()` non scrive mai; non contraddire le decisioni di Nicola; il gioco deve diventare più chiaro, non più facile.
- **Non toccare a mano**: `server/motore.js`, `server/bot.js`, i numeri `?v=`, il commit in `server/index.ts`. Li cambia solo `pubblica.sh`.
- Dopo ogni modifica: `./controlla.sh veloce`. Prima di unire: `./controlla.sh`. Se la modifica cambia l'economia (la mediana esce da 80-130 M a 12 Cicli) `controlla.sh` avvisa: va detto nel messaggio del commit se è voluto.

---

## 6. Come dividere il lavoro tra più coder senza conflitti

### 6.1 Regole
1. Ogni coder lavora su **una sua copia** (`git worktree add ../laguna-<nome> -b <nome>` oppure una copia della cartella), mai sul repo principale. Prova con `REPO=<la sua copia> ./controlla.sh`.
2. Ogni coder ha **le sue righe** (tabella sotto). Fuori da lì non scrive: chiede al Coder capo.
3. Nessuno tocca `?v=`, `server/`, né riformatta.
4. I punti in comune (lo `switch` di `applica0`, la lista dei segreti di `vista`, `API`, `MOTIVO`, `N`) dopo P2 sono su più righe per tema: ognuno aggiunge nella riga del suo tema.
5. Unisce solo il Coder capo, uno alla volta, e dopo ogni unione lancia `./controlla.sh veloce`. Una sola pubblicazione alla fine.

### 6.2 Tappa 0, da solo, prima di tutti (Coder capo)
P1, P2, P3 e le correzioni COD-01, 02, 03, 04. Toccano `applica0`, `vista`, server e locale.js: il cuore che tutti usano. Mezza giornata. Solo dopo partono gli altri, tutti dalla stessa base.

### 6.3 Tappa 1, in parallelo

| Coder | File e righe sue | Cosa fa | Non tocca |
|---|---|---|---|
| **A — Giorno ed economia** | motore.js 14-179 (numeri) e 334-1005 | correzioni di giorno, economia, Palazzo, Grandi Affari, COD-05 | notte, setta, vista |
| **B — Notte, polizia, setta** | motore.js 1006-2937 | correzioni di notte, illegale, piste, setta, COD-10 | giorno, alba |
| **C — Alba, politica, fine** | motore.js 2938-3277 | alba, elezioni, regista, scoperte, consigli di Vera | il resto |
| **D — 3D** | tre.js, mondo3d.js, panorama.js | tutto il tabellone 3D e le prestazioni | motore, gioco.js |
| **E — Interfaccia: tabellone, giorno, scene della notte** | gioco.js 339-1421 e 1989-2598; stile.css (parte tabellone e scene) | finestre, carta in basso, scene, animazioni | il telefono |
| **F — Interfaccia: telefono e app** | gioco.js 1422-1988 e 2599-2684; stile.css (parte telefono) | P4, poi telefono chiaro, Gazzetta, app | il resto di gioco.js |
| **G — Bot** (parte dopo A, B, C) | bot.js | COD-08, COD-09, bot che usano le funzioni nuove | motore |

Se servono meno persone: A+C insieme, E+F insieme (uno dopo l'altro), G lo fa chi ha finito prima.

stile.css è un file solo: E e F aggiungono le regole nuove **in fondo**, ognuno sotto un suo commento-titolo, e non riordinano l'esistente.

### 6.4 Ordine di unione
1. **Tappa 0** (Coder capo). Controllo completo.
2. **D (3D)**: non dipende da nessuno, si può unire in qualsiasi momento.
3. **A**, poi **B**, poi **C** (motore, dal giorno all'alba). Dopo ognuno: `controlla.sh veloce` e confronto della mediana.
4. **G (bot)**: dopo il motore, perché deve conoscere le azioni nuove. Qui la mediana può cambiare: va guardata con il critico dell'economia.
5. **F (telefono)**, poi **E (tabellone e scene)**: l'interfaccia per ultima, perché mostra i campi che il motore ha appena aggiunto.
6. `./controlla.sh completo`, poi **una** `pubblica.sh`, poi la funzione su Supabase.

Una funzione nuova che attraversa tutto (es. un'azione nuova con pulsante) si divide così: prima il coder del motore aggiunge azione e campo nella vista e li unisce; poi il coder dell'interfaccia aggiunge il pulsante. Mai i due insieme sulla stessa funzione.

---

## 7. pubblica.sh, spiegato (NON eseguito)

Ho ricostruito la procedura dalla storia git (50 commit). Ogni versione sono **due commit**. Esempio v65: `a8f7fef` (il gioco) e `f61a55a` ("Server: motore a8f7fef4b2...").

Senza `--davvero` lo script dice solo cosa farebbe. Con `--davvero`:

0. Lancia `controlla.sh`. Se non dà VIA LIBERA si ferma. Controlla anche di essere su `main`, che GitHub non abbia cose più nuove, che non ci siano file nuovi dimenticati.
1. **Alza la versione** `?v=65` → `?v=66` in: `index.html` (stile.css, motore.js, bot.js, gioco.js), `gioco.js` (import di `tre.js` e `locale.js`), `tre.js` (import di `mondo3d.js`). `icone.js`, `panorama.js` e la musica hanno un numero loro (oggi 51, 51, 64) e si alzano solo se quei file sono cambiati: lo script lo vede da git.
2. **Comprime** `motore.js` e `bot.js` in `server/` con `terser -c -m`. Ho verificato che con terser 5.51.2 il risultato è identico, byte per byte, ai file di oggi.
3. **Primo commit** con la frase che gli passi, e push.
4. **Secondo commit**: scrive il codice lungo (40 caratteri) del primo commit nei due `import` di `server/index.ts` (righe 13-14), messaggio `Server: motore <codice>`, push. Se motore e bot non sono cambiati, questo passo si salta (come i vecchi commit "Server: resta sul motore c79c36a").
5. Scrive cosa resta da fare a mano: aspettare che jsDelivr dia il file nuovo, **pubblicare la funzione "laguna" su Supabase**, provare una partita online nuova, aggiornare STATO.md.

Perché due commit: il server scarica il motore da `cdn.jsdelivr.net/gh/nicolafistarol/re-della-laguna@<commit>/server/motore.js`, e il codice del commit esiste solo dopo averlo fatto.

La firma in fondo ai messaggi (`Co-Authored-By`, `Claude-Session`) si passa con la variabile `FIRMA`.

Cosa lo script **non** fa: non pubblica su Supabase e non tocca il database.

---

## 8. Cosa non ho potuto fare
- Provare `server/index.ts` davvero (serve Deno e un database): COD-11 e COD-12 vengono dalla lettura del codice.
- Provare Safari e un Mac M1 vero: `fumo.js` usa Chrome con grafica via software. Dice "il gioco parte e non dà errori", non "si vede bene".
- Il documento del Project `claude/re-della-laguna-stato.md` non è raggiungibile da qui: ho usato la copia `/home/claude/prove/STATO.md`.
- Il giocatore matto riesce a far accettare solo 554 azioni su 7.177, e circa 25 tipi non riescono mai (servono condizioni precise: essere in un posto, avere una mano aperta). Quelle zone restano poco provate: è il motivo della proposta (b) di COD-07.
