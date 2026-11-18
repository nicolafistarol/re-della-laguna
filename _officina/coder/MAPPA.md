# Mappa del codice di Re della Laguna

Fatta in automatico da `mappa.js` sul repo `/home/claude/re-della-laguna`. Dopo ogni modifica: `node mappa.js > MAPPA.md`.
Scrittura `nome:123` = funzione `nome` alla riga 123. In grassetto le funzioni lunghe (40 righe o più).

## motore.js

Tutte le regole. Un solo blocco `(function(root){...})`: le funzioni sono rientrate di 2 spazi. Gira uguale nel browser, in Node e sul server — 3722 righe, 281 KB, 270 funzioni.

**versione del motore e generazione delle partite** (righe 14-27)

`gen2`:26

**numeri del gioco** (righe 28-204)

`num`:87 · `isolaDiPos`:185

**utilita'** (righe 205-288)

`rng`:206 · `gauss`:212 · `dado`:216 · `euro`:217 · `round`:218 · `clamp`:219 · `err`:220 · `peggio`:221 · `giocatore`:223 · `lotto`:224 · `propri`:225 · `moliDi`:226 · `serieLotti`:227 · `haSerie`:228 · `vmult`:229 · `corrente`:230 · `valoreLotto`:232 · `valorePalazzo`:237 · `valoreInvestimenti`:238 · `patrimonio`:246 · `fascia`:252 · `affitto`:254 · `rendita`:263 · `copertura`:270 · `log`:277 · `notizia`:278 · `flusso`:281 · `privato`:287

**nuova partita** (righe 289-359)

`nuovaPartita`:290 **(41 righe)** · `cella`:333 · `scegliPacchetto`:339

**giorno** (righe 360-744) — sotto-parti: azioni del giorno (una grande per turno) :624

`terreniIniziali`:362 · `sequestra`:374 · `avviaAstaSequestro`:379 · `iniziaTurno`:388 · `tira`:400 · `idxCasella`:416 · `destinazioniRapide`:417 · `viaggioRapido`:431 · `muovi`:446 · `passo`:452 · `casella`:459 · `atterra`:461 **(45 righe)** · `cartaGazzetta`:525 · `postoDiBlocco`:535 · `compra`:544 · `offerta`:559 · `chiudiAsta`:569 · `gala`:583 · `casinoReale`:593 · `municipio`:603 · `candidati`:615 · `azioneGiorno`:625 · `costruisci`:630 · `controllaValoreLusso`:661 · `stanzeDi`:686 · `fasciaPalazzo`:687 · `baseRendPiano`:688 · `renditaPiani`:689 · `renditaPalazzo`:690 · `costoPiano`:691 · `costoPiani`:692 · `costoStanza`:697 · `condizioniPalazzo`:699 · `piano`:703 · `stanzePossibili`:726 · `compraStanza`:734

**I GRANDI AFFARI (Livello 4)** (righe 745-1031)

`partitaLunga`:753 · `grande`:754 · `capoDi`:755 · `apriAsteGrandi`:756 · `offertaGrande`:767 · `comprareQuote`:778 · `controllaCapo`:795 · `titolone`:812 · `tassoPrestiti`:846 · `capoBanca`:847 · `tassoBanca`:853 · `bloccaConto`:860 · `riciclaBanca`:868 · `albaGrandi`:880 **(40 righe)** · `aggiornaSkyline`:920 · `compraVeicolo`:925 · `prestito`:936 · `restituisci`:946 · `ipoteca`:953 · `riscatta`:962 · `investi`:971 · `vendi`:986 · `fineTurno`:1003 · `prossimoTurno`:1010 · `fineGiorno`:1021

**notte** (righe 1032-1175)

`inNotte`:1033 · `affare`:1038 **(59 righe)** · `isolaDiNotte`:1097 · `corrompi`:1101 · `ricicla`:1126 · `spia`:1155 · `denuncia`:1162 · `pronto`:1170

**la notte come viaggio (v2)** (righe 1176-1573)

`livelloPersonale`:1255 · `livelloSblocco`:1262 · `postiValigetta`:1263 · `luogoAperto`:1264 · `isolaCasa`:1265 · `isolaLuogo`:1266 · `oreViaggio`:1267 · `nomeContatto`:1274 · `rischioContatto`:1275 · `affariInterni`:1282 · `scaricaContatto`:1296 · `inSetta`:1301 · `haPiano`:1302 · `haOggetto`:1303 · `togliOggetto`:1304 · `racconta`:1305 · `indizio`:1306 · `pagaMisto`:1307 · `iniziaNotte`:1320 **(51 righe)** · `adesso`:1373 · `apriOra`:1374 · `avanti`:1383 · `tempoScaduto`:1390 · `lustro`:1405 · `livelloPalazzo`:1409 · `attivitaNotte`:1423 **(72 righe)** · `aCasaSua`:1496 · `spa`:1497 · `apriSerata`:1505 · `apriSerataSenzaOra`:1519 · `vaiSerata`:1525 · `arrivaSerata`:1536 · `mano`:1549 · `punteggio`:1550 · `confronta`:1561 · `testoMano`:1562 · `giocaSerata`:1563

**Sette e mezzo** (righe 1574-2126)

`mazzoSM`:1577 · `valoreSM`:1578 · `totaleSM`:1579 · `nomeCartaSM`:1580 · `puntiSM`:1581 · `testoSM`:1582 · `confrontaSM`:1584 · `giocaBancoSM`:1591 · `apriManoSM`:1592 · `mossaSM`:1596 · `chiudiManoSM`:1613 **(53 righe)** · `chiudiTutteSM`:1667 · `quiConMe`:1669 · `incontro`:1676 · `restituisci_`:1702 · `rispondiIncontro`:1703 · `dovePersonaggio`:1737 · `personaggiQui`:1742 · `scelteNotte`:1743 **(52 righe)** · `inNotte2`:1796 · `oraLibera`:1801 · `qui`:1806 · `occasioniVisibili`:1810 · `vai`:1818 · `aspetta`:1831 · `nomeLuogo`:1838 · `tornaACasa`:1839 · `compraOggetto`:1847 · `soffiata`:1858 · `prendiOccasione`:1867 · `fotografa`:1882 · `ricicla2`:1892 · `corrompi2`:1903 · `ricettatore`:1914 · `ballo`:1927 · `albaRefurtiva`:1941 · `articolo2`:1948 · `settaAlFaro`:1956 · `attivi`:1965 · `controllaOra`:1966 · `risolviOccasione`:1971 **(66 righe)** · `risolviOra`:2037 **(77 righe)** · `fineNotte`:2114

**permessi e cantieri (stile Hotel)** (righe 2127-2217)

`chiediPermesso`:2128 · `prezzoAgenzia`:2150 · `haAttivita`:2151 · `agenzia`:2152 · `chiediLicenza`:2171 · `bustaLicenza`:2186 · `regaloAssessore`:2195 · `chiudiCantieri`:2206

**imprevisti di giorno** (righe 2218-2258)

`chiamataLampo`:2219 · `rispondiChiamata`:2225 · `rischioPerquisizione`:2237 · `perquisizioni`:2242

**sette** (righe 2259-2669) — sotto-parti: le Grandi Opere: costano tanto dal Tesoro e si fanno solo se :2292; il Tesoro sepolto: al Faro il Gran Maestro nasconde una part :2537; il Traditore: un membro vende la setta alla polizia. Succede :2570

`livelloVecchio`:2262 · `influenzaDi`:2271 · `livelloSetta`:2278 · `guadagnaInfluenza`:2284 · `costoOpera`:2310 · `operaAttiva`:2311 · `proponiOpera`:2315 · `ritiraOpera`:2325 · `votaOpera`:2326 · `contaVoti`:2333 · `albaOpere`:2338 **(66 righe)** · `lavaSetta`:2405 · `fondaSetta`:2417 · `invitaSetta`:2430 · `rispondiInvito`:2442 · `espelliSetta`:2458 · `lasciaSetta`:2468 · `versaSetta`:2475 · `msgSetta`:2483 · `convoca`:2490 · `convocazioneDi`:2498 · `jetSetta`:2504 · `rito`:2514 · `settaMia`:2539 · `seppellisci`:2540 · `scava`:2559 · `tradisci`:2571 · `provaFedelta`:2578 · `tradimentiAllAlba`:2593 · `recluta`:2606 · `operazione`:2619 **(50 righe)**

**articoli e contratti** (righe 2670-2813)

`articolo`:2671 · `limitePatto`:2700 · `proponiContratto`:2701 · `rispondiContratto`:2722 · `scadenzeContratti`:2743 · `proponiLotto`:2772 · `rispondiProposta`:2786 · `regala`:2804

**pagamenti e debiti** (righe 2814-2831)

`paga`:2815 · `raccogli`:2826

**indagini e pene** (righe 2832-2877)

`protezione`:2834 · `annunciaResa`:2843 · `poliziaOccupata`:2851 · `rischioResa`:2855 · `resaDeiConti`:2860

**le piste** (righe 2878-3001)

`nomeLuogo`:2879 · `segnaTraccia`:2881 · `aggiornaPiste`:2889 · `piste`:2915 · `tiroIndagine`:2929 · `mandaAlFaro`:2954 · `condanna`:2960 **(41 righe)**

**alba** (righe 3002-3240)

`alba`:3003 **(124 righe)** · `elezioni`:3128 · `campagna`:3142 · `legge`:3147 · `tasse`:3158 · `regista`:3166 · `finisceQui`:3195 · `chiudiPartita`:3214 · `fine`:3223

**scoperte** (righe 3241-3343)

`primaVolta`:3315 · `consiglioVera`:3330

**ingresso unico** (righe 3344-3603) — sotto-parti: I miei conti: ogni movimento di soldi viene annotato con il  :3345; Controllo dei valori in ingresso: tutto quello che arriva da :3397; Cintura di sicurezza: se dopo un'azione i conti non sono piu :3450; inizio e giorno: dadi, caselle, aste :3501; scambi di terreni :3513; costruire, Palazzo, lusso :3516; banca, Borsa, tasse :3525; Grandi Affari :3533; tra giocatori: Gazzetta, contratti, regali, denunce :3540; politica :3546; notte: muoversi e orologio :3551; notte: affari, oggetti, contatti, soldi sporchi :3557; notte: Palazzo, serate, carte, incontri :3567; setta :3576; partita :3597

`registraConti`:3385 · `parolaRiservata`:3411 · `valoreSicuro`:3412 · `oggettoSicuro`:3438 · `normalizza`:3445 · `controllaNumeri`:3452 · `applica`:3462 · `applicaSicura`:3482 · `applica0`:3487 · `esegui`:3498 **(105 righe)**

**cosa vede ognuno** (righe 3604-3722)

`vista`:3621 **(68 righe)**

Le più grosse: `alba` (riga 3003, 124 righe, 8 KB), `vista` (riga 3621, 68 righe, 7 KB), `scelteNotte` (riga 1743, 52 righe, 7 KB), `risolviOccasione` (riga 1971, 66 righe, 6 KB), `esegui` (riga 3498, 105 righe, 6 KB), `albaOpere` (riga 2338, 66 righe, 6 KB), `chiudiManoSM` (riga 1613, 53 righe, 5 KB), `attivitaNotte` (riga 1423, 72 righe, 5 KB).

## gioco.js

Tutta l'interfaccia (schermate, tabellone, notte, telefono, finestre). Modulo ES — 2713 righe, 286 KB, 192 funzioni.

**Inizio del file (righe 1-71)** — `vuole3D`:18 · `leggiDurata`:28 · `salvaDurata`:32 · `sceltaDurataHtml`:34 · `testoOre`:47 · `collegaDurata`:48 · `testoDurata`:52 · `toast`:59 · `esciDallaPartita`:60 · `salvaLocale`:68 · `leggiLocale`:69 · `sfondo`:70

**suoni (generati dal browser) e musica (due brani originali in musica/)** (righe 72-136)

**server** (righe 137-176)

`chiama`:138 · `agisci`:149 · `inviaAzione`:150 · `caricaVista`:159 · `ascolta`:166

**ingresso** (righe 177-338)

`avvio`:178 · `nomeLocale`:208 · `schermataProvaLocale`:210 · `schermoIngresso`:229 · `codiceDalLink`:231 · `entraConCodice`:232 · `schermataNome`:238 · `nomeMio`:253 · `schermataCasa`:254 **(43 righe)** · `sala`:297 · `testoCiclo`:333

**chi deve agire** (righe 339-352)

`io`:342 · `mioTurno`:343 · `tocca`:344 · `casellaDi`:351

**geografia della mappa (in % dell'immagine)** (righe 353-375)

`lungo`:356 · `puntoMappa`:365 · `isolaCasa`:372 · `posLuogo`:373 · `nomeLuogo`:374

**animazioni (dadi, pedine)** (righe 376-544)

`copiaPos`:380 · `nuoviLog`:381 · `riceviVista`:387 · `eseguiCoda`:394 · `avvisoPerMe`:428 · `nomeDi`:432 · `puntoDi`:433 · `volaSoldi`:439 · `finestraTratta`:458 · `finestraProposta`:477 · `annuncioAsta`:487 · `mostraDelta`:494 · `cubo`:502 · `mostraDadi`:503 · `cammina`:520 · `disegnaScia`:539

**disegno** (righe 545-776)

`disegna`:546 **(47 righe)** · `disegnaMappa`:594 · `icoAngolo`:640 · `kEuro`:641 · `casellaHtml`:642 · `legenda`:665 · `pannelloMiei`:681 · `aggiorna3D`:696 · `gruppo`:708 · `nomiIsole`:716 · `schedaCasella`:720 · `edifici`:759 · `torri`:767

**esplorare la mappa: zoom e spostamento** (righe 777-903)

`applicaVista`:779 · `zoomA`:789 · `centraSu`:796 · `scorriAlBordo`:803 · `apriMappaVicino`:825 · `collegaEsplora`:831 **(46 righe)** · `comandiVista`:877 · `notteOra`:881 · `collegaComandiVista`:883

**la carta principale (in basso)** (righe 904-957)

`cartaGiorno`:905 · `cartaNotte`:926

**la notte: una scena per ogni luogo** (righe 958-1421)

`fotoLivello`:963 · `serataOspite`:1113 · `livelloPalazzoQui`:1114 · `puntoCorrente`:1116 · `aggiornaPanorama`:1127 · `righeNotte`:1163 · `oraServer`:1166 · `restoOra`:1167 · `scenaNotte`:1168 **(50 righe)** · `riquadroEsito`:1220 · `testoTempo`:1228 · `collegaScena`:1230 **(57 righe)** · `finestraPuntata`:1288 · `finestraIncontro`:1298 · `finestraProposteNotte`:1322 · `finestraAltrove`:1337 · `avviso`:1350 · `avvisoRiepilogo`:1356 · `finestraRiepilogo`:1364 · `appuntamenti`:1379 · `collegaCarta`:1388 · `chiediViaggio`:1412

**il telefono** (righe 1422-1481)

`mittente`:1462 · `conversazioni`:1467 · `lettiChat`:1473 · `segnaChat`:1474 · `letti`:1475 · `segnaLetti`:1476 · `appVisibile`:1477

**la Gazzetta della Laguna** (righe 1482-1548)

`fotoNotizia`:1488 · `titolone`:1496 · `primaPagina`:1500 · `potentiHtml`:1517 · `appGazzetta`:1523 · `ultimOra`:1531 · `mostraUltimOra`:1539

**telefono: home chiara** (righe 1549-2016) — sotto-parti: Il contenuto di ogni app del telefono: UNA FUNZIONE PER APP  :1684

`appViste`:1554 · `segnaAppVista`:1555 · `appNuova`:1556 · `contrattiPerMe`:1557 · `statoApp`:1559 · `adessoPuoi`:1589 · `homeTelefono`:1601 · `apriApp`:1616 · `disegnaTelefono`:1617 · `tappe`:1648 · `riepilogoGiro`:1654 · `rivalita`:1665 · `agenziaDisponibile`:1678 · `miTurnoApp`:1683 · `appImprese`:1688 · `appBanca`:1708 · `appMessaggi`:1716 · `appValigetta`:1728 · `appLusso`:1735 · `appProve`:1738 · `appBorsa`:1741 · `appContratti`:1746 · `appAgenzia`:1750 · `appMunicipio`:1760 · `appSporchi`:1769 · `appScoperte`:1787 · `appSetta`:1798 · `contenutoApp`:1852 · `volto`:1893 · `laTuaRete`:1894 · `rubrica`:1901 · `appConti`:1941 · `impero`:1956 · `collegaApp`:1968 **(48 righe)**

**finestre** (righe 2017-2024)

`finestra`:2018

**Sette e mezzo** (righe 2025-2538)

`cartaSM`:2027 · `tavoloSM`:2035 · `esitoSM`:2068 · `finestreAutomatiche`:2081 **(52 righe)** · `extraTesto`:2133 · `finestraPacchetti`:2139 · `finestraAsta`:2144 · `finestraPending`:2153 · `tipoRiga`:2183 · `finestraAlba`:2189 · `schedaPiste`:2217 · `testoPena`:2231 · `boxRischio`:2242 · `boxReato`:2260 · `finestraOccasione`:2264 · `finestraNegozio`:2278 · `finestraSoffiata`:2290 · `finestraRicicla`:2296 · `finestraCorrompi`:2307 · `finestraRapido`:2318 · `finestraDoganiere`:2330 · `finestraArticolo`:2338 · `requisitiSetta`:2360 · `schedaInfluenza`:2366 · `statoOpera`:2375 · `schedaOpere`:2384 · `schedaLavanderia`:2405 · `finestraSetta`:2411 · `cicliRipaga`:2448 · `finestraPalazzo`:2449 · `appPalazzo`:2450 **(47 righe)** · `finestraVeicolo`:2497 · `finestraPrestito`:2501 · `finestraContratto`:2507 · `fine`:2522

**COME SI GIOCA: 6 slide, prima di giocare e durante** (righe 2539-2626)

`datiGuida`:2540 **(83 righe)** · `apriGuida`:2594 · `guidaMaiVista`:2623 · `tastoGuida`:2624 · `collegaTastoGuida`:2625

**APP TV: il primo Grande Affare (Livello 4)** (righe 2627-2697)

`appGrandi`:2628 · `appAffare`:2634 **(55 righe)** · `collegaTV`:2689

**scegliere un'attivita': schede chiare (rende, affitto, vantaggio, rischio)** (righe 2698-2713)

`sceltaAttivita`:2700

Le più grosse: `appAffare` (riga 2634, 55 righe, 10 KB), `appSetta` (riga 1798, 32 righe, 9 KB), `datiGuida` (riga 2540, 83 righe, 8 KB), `appPalazzo` (riga 2450, 47 righe, 8 KB), `scenaNotte` (riga 1168, 50 righe, 7 KB), `finestreAutomatiche` (riga 2081, 52 righe, 6 KB), `collegaApp` (riga 1968, 48 righe, 6 KB), `collegaScena` (riga 1230, 57 righe, 6 KB).

## bot.js

I giocatori-computer. ATTENZIONE: la prima metà è codice già compresso e poi rimesso in colonna (nomi di una lettera: o = stato, i = giocatore, t = motore) — 456 righe, 31 KB, 8 funzioni.

**sette** (righe 41-456)

`rispostaInvito`:45 · `invitoBot`:61 · `votoBot`:97 · `operaBot`:111 · `lavaBot`:124 · `convocazioneBot`:133 · `settaNotteBot`:143 · `grandiBot`:156 **(300 righe)**

Le più grosse: `grandiBot` (riga 156, 300 righe, 21 KB).

## locale.js

Partita da soli nel browser (?locale): tiene lo stato in localStorage, fa giocare i bot. Copia in piccolo di quello che fa il server — 61 righe, 3 KB, 9 funzioni.

**Inizio del file (righe 1-61)** — `giocaBot`:13 · `salva`:17 · `nuova`:19 · `nuovaProva`:27 · `carica`:45 · `azione`:50 · `rinomina`:58 · `vista`:59 · `grezzo`:60

`giocaBot`:13 · `salva`:17 · `nuova`:19 · `nuovaProva`:27 · `carica`:45 · `azione`:50 · `rinomina`:58 · `vista`:59 · `grezzo`:60

## tre.js

Il tabellone 3D (three.js): camera, visuali, pedine, etichette, luci giorno/notte — 540 righe, 36 KB, 36 funzioni.

**Inizio del file (righe 1-101)** — `mondoNuovo`:14 · `modoVista`:20 · `supportato`:31 · `avvia`:35 **(65 righe)** · `attivoOra`:100

**comandi della vista** (righe 102-147)

`vola`:103 · `avvicina`:112 · `tutto`:117 · `ruota`:118 · `sposta`:124 · `apriVicino`:133 · `centraSu`:142

**giorno e notte** (righe 148-163)

`impostaNotte`:149 · `accendiFinestre`:160

**oggetti** (righe 164-296)

`texFinestre`:166 · `matEdificio`:174 · `edificio`:181 · `pezzo`:203 · `torre`:227 · `pedina`:237 · `svuota`:252 · `aggiorna`:257

**il mondo modellato** (righe 297-425)

`costruisciMondo`:299 · `etichettaTesto`:325 · `disegnaLotti`:336 **(44 righe)** · `auto`:380 · `collegaTocchi`:395 · `impostaModo`:406 · `dietroA`:418 · `seguiPedina`:422

**ogni frame** (righe 426-540)

`angoliSulPiano`:431 · `avvicinaDi`:437 · `adattaVista`:438 · `frame`:453 · `frameMondo`:473 · `proiettaHtml`:509

Le più grosse: `disegnaLotti` (riga 336, 44 righe, 4 KB), `avvia` (riga 35, 65 righe, 3 KB), `frameMondo` (riga 473, 34 righe, 2 KB), `aggiorna` (riga 257, 39 righe, 2 KB), `proiettaHtml` (riga 509, 31 righe, 2 KB).

## mondo3d.js

Costruisce il mondo 3D: isole, strada ad anello, lotti, mare — 151 righe, 9 KB, 7 funzioni.

**Inizio del file (righe 1-151)** — `guscio`:20 · `contorno`:30 · `dentro`:37 · `lastra`:46 · `caso`:55 · `costruisci`:58 **(79 righe)** · `mare`:139

`guscio`:20 · `contorno`:30 · `dentro`:37 · `lastra`:46 · `caso`:55 · `costruisci`:58 **(79 righe)** · `mare`:139

Le più grosse: `costruisci` (riga 58, 79 righe, 5 KB).

## panorama.js

Le foto a 360° della notte — 114 righe, 6 KB, 9 funzioni.

**Inizio del file (righe 1-114)** — `crea`:16 · `limita`:48 · `misura`:57 · `direzione`:62 · `gira`:66 · `mostra`:86 · `nascondi`:110 · `guarda`:111 · `daFoto`:113

`crea`:16 · `limita`:48 · `misura`:57 · `direzione`:62 · `gira`:66 · `mostra`:86 · `nascondi`:110 · `guarda`:111 · `daFoto`:113

Le più grosse: `crea` (riga 16, 31 righe, 2 KB).

## server/index.ts

La funzione Supabase: crea / entra / inizia / azione. Carica motore e bot da jsDelivr a un commit preciso — 175 righe, 10 KB, 5 funzioni.

**Inizio del file (righe 1-175)** — `nuovoCodice`:33 · `calcolaViste`:47 · `salvaViste`:54 · `giocaBot`:62 · `durataPulita`:69

`nuovoCodice`:33 · `calcolaViste`:47 · `salvaViste`:54 · `giocaBot`:62 · `durataPulita`:69

## Telefono: una funzione per app (gioco.js)

`CONTENUTO_APP` (riga 1830) dice quale funzione disegna ogni app. `contenutoApp(me, k)` sceglie solo la funzione. I pulsanti delle app si collegano in `collegaApp` (riga 1968).

| app | funzione | riga | righe |
|---|---|---|---|
| `impero` | `impero` | 1956 | 12 |
| `conti` | `appConti` | 1941 | 15 |
| `imprese` | `appImprese` | 1688 | 20 |
| `banca` | `appBanca` | 1708 | 8 |
| `gazzetta` | `appGazzetta` | 1523 | 6 |
| `messaggi` | `appMessaggi` | 1716 | 12 |
| `valigetta` | `appValigetta` | 1728 | 7 |
| `palazzo` | `appPalazzo` | 2450 | 47 |
| `grandi` | `appGrandi` | 2628 | 5 |
| `tv` | `appGrandi` | 2628 | 5 |
| `lusso` | `appLusso` | 1735 | 3 |
| `prove` | `appProve` | 1738 | 3 |
| `borsa` | `appBorsa` | 1741 | 5 |
| `contratti` | `appContratti` | 1746 | 4 |
| `agenzia` | `appAgenzia` | 1750 | 10 |
| `municipio` | `appMunicipio` | 1760 | 9 |
| `rubrica` | `rubrica` | 1901 | 21 |
| `sporchi` | `appSporchi` | 1769 | 18 |
| `scoperte` | `appScoperte` | 1787 | 11 |
| `setta` | `appSetta` | 1798 | 32 |

## Tutti i tipi di azione accettati da applica()

Tutto passa da `applica(s, idGiocatore, a)` (riga 3462) che chiama `applica0` (riga 3487) e poi `esegui` (riga 3498): un `switch` su `a.tipo`, raggruppato per tema.
Colonne: campi letti da `a` · funzione del motore chiamata (riga) · l'interfaccia la manda? · i bot la usano? (quante volte in 6 partite di prova).
**Se i bot non la usano, la simulazione non la prova mai**: resta solo il "giocatore matto" di invarianti.js.

| tipo | campi | funzione (riga) | interfaccia | bot |
|---|---|---|---|---|
| `pacchetto` | id | `scegliPacchetto`:339 | sì | 30 |
| `tira` | — | `tira`:400 | sì | 1110 |
| `viaggio_rapido` | idx | `viaggioRapido`:431 | sì | 95 |
| `compra` | si | `compra`:544 | sì | 160 |
| `agenzia` | lotto | `agenzia`:2152 | sì | 202 |
| `offerta` | importo | `offerta`:559 | sì | 508 |
| `fine_turno` | — | `fineTurno`:1003 | sì | 1200 |
| `gala` | importo | `gala`:583 | sì | 12 |
| `casino_reale` | importo | `casinoReale`:593 | sì | 10 |
| `municipio` | scelta | `municipio`:603 | sì | 11 |
| `chiamata` | si, telefono | `rispondiChiamata`:2225 | sì | 87 |
| `proponi_lotto` | a, lotto, prezzo, compro | `proponiLotto`:2772 | sì | **mai** |
| `rispondi_proposta` | id, si, motivo | `rispondiProposta`:2786 | sì | raro |
| `permesso` | lotto | `chiediPermesso`:2128 | sì | 814 |
| `regalo_assessore` | lotto | `regaloAssessore`:2195 | sì | 49 |
| `costruisci` | lotto, attivita | `costruisci`:630 | sì | 511 |
| `licenza` | — | `chiediLicenza`:2171 | sì | **mai** |
| `busta_licenza` | — | `bustaLicenza`:2186 | sì | **mai** |
| `piano` | funzione, quanti | `compraStanza`:734, `piano`:703 | sì | 269 |
| `stanza` | stanza | `compraStanza`:734 | sì | 60 |
| `veicolo` | veicolo | `compraVeicolo`:925 | sì | 22 |
| `prestito` | importo | `prestito`:936 | sì | **mai** |
| `restituisci` | importo | `restituisci`:946 | sì | raro |
| `ipoteca` | lotto | `ipoteca`:953 | **no** | **mai** |
| `riscatta` | lotto | `riscatta`:962 | **no** | **mai** |
| `investi` | cosa, nome, importo | `investi`:971 | sì | 62 |
| `vendi` | cosa, nome, quota | `vendi`:986 | sì | **mai** |
| `evasione` | quota | (dentro lo switch, riga 3532) | sì | **mai** |
| `offerta_grande` | affare, importo | `offertaGrande`:767 | sì | raro |
| `quote_grande` | affare, n | `comprareQuote`:778 | sì | raro |
| `titolone` | — | `titolone`:812 | sì | raro |
| `tasso_banca` | tasso | `tassoBanca`:853 | sì | raro |
| `blocca_conto` | bersaglio | `bloccaConto`:860 | sì | **mai** |
| `ricicla_banca` | importo | `riciclaBanca`:868 | sì | raro |
| `articolo` | bersaglio, tono, importo, testo, sporchi | `articolo2`:1948, `articolo`:2671 | sì | **mai** |
| `contratto` | contratto | `proponiContratto`:2701 | sì | **mai** |
| `rispondi_contratto` | id, si | `rispondiContratto`:2722 | sì | raro |
| `regala` | a, importo, sporchi | `regala`:2804 | sì | **mai** |
| `denuncia` | prova | `denuncia`:1162 | sì | **mai** |
| `candidati` | — | `candidati`:615 | **no** | **mai** |
| `campagna` | importo | `campagna`:3142 | sì | **mai** |
| `legge` | legge, isola | `legge`:3147 | sì | **mai** |
| `tasse` | quota | `tasse`:3158 | sì | **mai** |
| `vai` | luogo | `vai`:1818 | sì | 386 |
| `aspetta` | — | `aspetta`:1831 | sì | raro |
| `avanti` | — | `avanti`:1383 | sì | 723 |
| `tempo_scaduto` | — | (dentro lo switch, riga 3555) | sì | **mai** |
| `pronto` | — | `tornaACasa`:1839 | **no** | raro |
| `torna_a_casa` | — | `tornaACasa`:1839 | sì | 285 |
| `occasione` | n, oggetti | `prendiOccasione`:1867 | sì | 90 |
| `compra_oggetto` | oggetto | `compraOggetto`:1847 | sì | 75 |
| `soffiata` | luogo | `soffiata`:1858 | sì | **mai** |
| `foto` | bersaglio | `fotografa`:1882 | sì | **mai** |
| `corrompi` | chi, isola, sporchi | `corrompi2`:1903 | sì | 1 |
| `scarica_contatto` | chiave | `scaricaContatto`:1296 | sì | raro |
| `ricicla` | metodo, importo | `ricicla2`:1892 | sì | 50 |
| `ricettatore` | importo | `ricettatore`:1914 | sì | **mai** |
| `ballo` | — | `ballo`:1927 | sì | **mai** |
| `attivita` | importo | `attivitaNotte`:1423 | sì | **mai** |
| `spa` | — | `spa`:1497 | sì | **mai** |
| `serata` | ingresso | `apriSerata`:1505 | sì | **mai** |
| `vai_serata` | host | `vaiSerata`:1525 | sì | raro |
| `gioca_serata` | importo | `giocaSerata`:1563 | sì | raro |
| `sm` | mossa | `mossaSM`:1596 | sì | raro |
| `incontro` | a, cosa, importo | `incontro`:1676 | sì | raro |
| `rispondi_incontro` | id, si | `rispondiIncontro`:1703 | sì | raro |
| `fonda_setta` | nome, motto | `fondaSetta`:2417 | sì | 3 |
| `invita_setta` | setta, invitato, offerta | `invitaSetta`:2430 | sì | 3 |
| `rispondi_invito` | setta, si, motivo | `rispondiInvito`:2442 | sì | 3 |
| `espelli_setta` | setta, membro | `espelliSetta`:2458 | sì | **mai** |
| `lascia_setta` | setta | `lasciaSetta`:2468 | sì | **mai** |
| `versa_setta` | setta, importo, sporchi | `versaSetta`:2475 | sì | **mai** |
| `lava_setta` | setta, importo | `lavaSetta`:2405 | sì | 1 |
| `msg_setta` | setta, testo | `msgSetta`:2483 | sì | **mai** |
| `recluta` | setta, chi | `settaAlFaro`:1956, `recluta`:2606 | sì | 2 |
| `operazione` | setta, op, bersaglio, direzione | `settaAlFaro`:1956, `operazione`:2619 | sì | **mai** |
| `convoca` | setta, luogo, ora | `convoca`:2490 | sì | raro |
| `rito` | setta | `rito`:2514 | sì | raro |
| `jet_setta` | setta | `jetSetta`:2504 | sì | **mai** |
| `seppellisci` | setta, importo, indietro | `seppellisci`:2540 | sì | **mai** |
| `scava` | setta | `scava`:2559 | sì | **mai** |
| `tradisci` | setta | `tradisci`:2571 | sì | raro |
| `prova_fedelta` | setta, membro | `provaFedelta`:2578 | sì | raro |
| `proponi_opera` | setta, opera | `proponiOpera`:2315 | sì | raro |
| `ritira_opera` | setta | `ritiraOpera`:2325 | sì | **mai** |
| `vota_opera` | setta, si, motivo | `votaOpera`:2326 | sì | raro |
| `chiudi_partita` | si | `chiudiPartita`:3214 | sì | **mai** |
| `preferenze` | corona, uscire | (dentro lo switch, riga 3599) | **no** | **mai** |

In tutto 88 tipi di azione.

## Cosa vede ognuno: vista() / vistaSicura()

`vista(s, idGiocatore)` è alla riga 3621 di motore.js. `Laguna.vistaSicura` è **la stessa funzione**: è l'unica cosa che esce dal server (server/index.ts) e dalla partita locale (locale.js).

**Regola numero uno: degli ALTRI giocatori passa SOLO quello che sta in `CAMPI_PUBBLICI` (riga 3609).** Un campo nuovo dentro un giocatore è segreto da solo. Per farlo vedere a tutti va aggiunto lì (una riga per tema).

Campi pubblici oggi: `id`, `nome`, `bot`, `colore`, `pos`, `inner`, `ipos`, `dadi`, `doppi`, `haTirato`, `azioneGiornoFatta`, `faro`, `fallito`, `arresti`, `condanne`, `fama`, `pacchetto`, `veicoli`, `piani`, `funzioniPiani`, `stanze`, più `fascia` (Benestante, Ricco...: l'unica cosa pubblica sulla ricchezza).

**Regola numero due: il resto dello stato è copiato intero.** Una cosa nuova e segreta che NON sta dentro un giocatore (come `manoSM`) va tolta a mano dentro `vista()`.

Cosa fa, in ordine:
1. Toglie sempre `rngState`, `seed` (il seme dei dadi) e `manoSM` (le mani di Sette e mezzo con il mazzo). Aggiunge `versioneMotore` e `gen`.
2. Altri giocatori: solo i campi pubblici; le stanze segrete (caveau, bunker...) diventano "riservato" o spariscono. Te stesso: tutto, tranne `tracce` (non si vedono in numero).
3. Cronaca (`log`): via le righe private degli altri (prestito, investe, vende, ipoteca...: riconosciute dalle parole, vedi `CRONACA_PRIVATA`).
4. Aste e Grandi Affari: delle offerte segrete resta solo la tua.
5. Sette: in `sette` solo quelle di cui sei membro (senza `tradimento`, senza `sepolto` se non sei il Gran Maestro); delle altre in `setteRivali` solo `id` e `nome`. Inviti: solo i tuoi, senza chi li manda.
6. `flussi`: i pubblici e quelli dove sei tu. `proposte`, `contratti`: solo i tuoi (i contratti notarili firmati dagli altri si vedono senza cifre).
7. `ultimaAlba.riepilogo`, `riepOra`: solo la tua parte. La `chiamata` in attesa di un altro: senza testo e guadagno.
8. Notte (`v.notte` è ricostruita da capo): `dove` degli altri solo se siete nello stesso posto (e non al Palazzo), `viaggio` degli altri nascosto; `racconto`, `occasioni`, `scelte`, `manoSM` (senza mazzo) solo tuoi.
9. Aggiunge cose calcolate solo per te: `rischioPerq`, `lustro`, `livelloPalazzo`, `sblocco`, `postiValigetta`, `poliziaSu`, `giroPg` (con l'Osservatorio).

Attenzione: la vista può avere pezzi in comune con lo stato vero. Chi la riceve non la deve modificare (il server la manda in JSON, gioco.js ne fa una copia).

## L'ingresso delle azioni: controlli, cintura di sicurezza, generazione

Ogni azione fa questo percorso: `applica`:3462 → `normalizza`:3445 (controllo dei valori) → `applica0`:3487 (telefonata dal Faro) → `esegui`:3498 (lo `switch` con tutti i tipi) → `controllaNumeri`:3452 (cintura di sicurezza) → `registraConti`:3385 ("I miei conti").

- **Controllo dei valori** (`valoreSicuro`:3412, costanti `CAMPI_NUMERO`, `CAMPI_SOLDI`, `CAMPI_TESTO`, `CAMPI_LISTA`, `CAMPI_OGGETTO` alla riga 3406): numeri veri, soldi mai negativi né oltre `MAX_NUMERO`, niente parole riservate di JavaScript, liste e oggetti solo dove previsti. **Un campo-numero nuovo va aggiunto a `CAMPI_NUMERO`** (e a `CAMPI_SOLDI` se sono soldi).
- **Cintura di sicurezza** (`controllaNumeri`:3452): se dopo un'azione contanti, sporchi, debito, fama, Tracce, tassa, Tesoro o prezzi non sono più numeri, errore vero (non di gioco). Il server non salva.
- `applicaSicura`:3482: come `applica`, ma se l'azione è rifiutata o va in errore lo stato torna com'era. La usano locale.js e `LagunaBot.gioca`.
- **Generazione** (riga 25): `VERSIONE`, `GEN`, `gen2`:26, `N_GEN2` (riga 79) e `num`:87. I numeri che cambiano solo per le partite nuove si scrivono in `N_GEN2` e si leggono con `num(s, "chiave")`; le regole nuove dentro `if (gen2(s))`.
- Liste da tenere aggiornate quando si aggiunge un'azione: lo `switch` in `esegui`:3498 (gruppi per tema), `MOTIVO` (riga 3347) se muove soldi, `AZIONI_TELEFONO_FARO` (riga 3379) se si può fare dal Faro, `API` (riga 3692) se serve fuori dal motore.

Il giro dei bot è uno solo: `LagunaBot.gioca(stato, opz)` in bot.js. Lo usano server/index.ts e locale.js.

## Com'è fatto lo stato (campi visti davvero giocando 8 partite di bot)

**partita** (52 campi)

- `versione` (numero): versione del formato dello stato (sempre 1): NON e' la versione del gioco
- `gen` (numero): generazione: 2 per le partite nate dalla Tappa 0 in poi; se manca vale 1 (vedi gen2)
- `motoreNascita` (numero): VERSIONE del motore con cui e' nata la partita
- `rngState` (numero): il seme dei dadi: MAI nella vista
- `ciclo` (numero): da 0 (a schermo +1)
- `giorno` (numero): 0-3: quattro giri di dadi per Ciclo
- `fase` (testo): "pacchetti" (scelta della storia) → "giorno" → "notte" → ... → "fine"
- `turno` (numero): posizione dentro `ordine`
- `ordine` (lista): indici di `players` nell'ordine di gioco
- `lotti` (lista): le caselle del tabellone, tutte (anche quelle non in vendita)
- `valore` (oggetto): valore di ogni isola (5 = normale)
- `borsa` (oggetto): prezzi delle aziende
- `cripto` (oggetto): prezzi delle monete
- `sette` (lista): tutte le sette
- `inviti` (lista): inviti alle sette
- `gazzetta` (lista): notizie (max 120)
- `log` (lista): cronaca (max 400)
- `sindaco` (testo): id del Sindaco
- `pending` (oggetto): la domanda aperta che blocca il giorno (vedi sotto)
- `notteFatti` (oggetto): chi ha finito la notte
- `flussi` (lista): ultimi 160 passaggi di soldi con motivo
- `proposte` (lista): scambi di terreni proposti
- `grandi` (oggetto): i Grandi Affari (tv, banca): nasce alla prima richiesta
- `modoFine` (testo): cicli / obiettivo / libera
- `notte` (oggetto): esiste solo di notte
- altri: `seed`, `players`, `contratti`, `candidati`, `leggi`, `tassa`, `licenze`, `prossimoId`, `principianti`, `fine`, `cicli`, `obiettivo`, `chiusura`, `consigli`, `sceltaPacchetti`, `pacchettiDisponibili`, `nFlussi`, `riepOra`, `retataAnnunciata`, `borsaIeri`, `criptoIeri`, `ultimaAlba`, `blackout`, `ultimaCarta`, `skyline`, `resaAnnunciata`, `sequestrati`

**giocatore** (87 campi)

- `id` (testo): "g1", "g2"... g1 è chi ha creato la partita
- `strat` (testo): il CARATTERE del bot (Legale, Furbo...)
- `cash` (numero): soldi puliti
- `sporchi` (numero): soldi sporchi
- `azioni` (oggetto): quote di Borsa
- `pos` (numero): casella dove si trova
- `tracce` (numero): 0-100+: quanto ti cerca la polizia
- `stato` (numero): 0 pulito ... gradini dell'indagine
- `faro` (numero): turni di prigione rimasti
- `corrotti` (oggetto): contatti corrotti
- `piani` (numero): piani del Palazzo
- `stanze` (lista): stanze speciali comprate
- `pacchetto` (testo): la STORIA scelta (commerciante, costruttore...)
- `prove` (lista): prove raccolte sugli altri
- `messaggi` (lista): messaggi privati (max 60)
- `sette` (lista): id delle sette di cui è membro
- `valigetta` (lista): oggetti del Mercato Nero
- `conti` (oggetto): "I miei conti": movimenti per Ciclo e motivo
- `_investito` (sì/no): memoria del bot (tutti i campi con _ sono del bot)
- `_n` (oggetto): memoria del bot per la notte
- altri: `nome`, `bot`, `colore`, `cripto`, `veicoli`, `inner`, `ipos`, `condanne`, `blocco`, `fama`, `reputazione`, `affariOk`, `funzioniPiani`, `debito`, `prestiti`, `pulitoCiclo`, `peggiorReato`, `riciclTot`, `evasione`, `fallito`, `arresti`, `mosseNotte`, `dadi`, `azioneGiornoFatta`, `haTirato`, `doppi`, `ombraCicli`, `scoperte`, `agenziaUsata`, `agenziaSconto`, `municipioOggi`, `_tradCiclo`, `permessoTurno`, `primoPermesso`, `scontoCarico`, `_lavaCiclo`, `ultimaPista`, `affariStanotte`, `luoghiNotte`, `raccontoNotte`, `copUsata`, `calore`, `calSoldi`, `ripulitiCiclo`, `lussoCiclo`, `livello`, `livelloNuovo`, `trucchi`, `storiaTracce`, `ultimoEsito`, `offertaBoss`, `perquisito`, `rapidoCiclo`, `permessoPalazzo`, `mandati`, `botGrandi`, `cerchie`, `ultimaSentenza`, `_fondaCiclo`, `settaFondata`, `_invCiclo`, `_operaCiclo`, `_recCiclo`, `emergenza`, `lavato`, `lavatoCiclo`, `telefonataUsata`

**casella** (16 campi)

- `id` (testo): "o0"..."o87"
- `serie` (testo): il quartiere (gruppo di vie); "Moli" per i moli
- `tipoCasella` (testo): "lotto", "molo" (si comprano) oppure via, gazzetta, asta, faro...
- `owner` (testo): id del padrone oppure null: UNO solo
- `lvl` (numero): 0-5 livello dell'edificio
- `tipo` (testo): attività costruita
- `chiuso` (numero): Cicli di chiusura rimasti
- `cantiere` (oggetto): lavori in corso
- altri: `giro`, `idx`, `nome`, `isola`, `prezzo`, `ipoteca`, `permesso`, `negato`

**setta** (17 campi)

- `gm` (testo): id del Gran Maestro
- `membri` (lista): lista di id
- `influenza` (numero): punti: livello a 12/35/70
- `opera` (oggetto): Grande Opera in votazione
- altri: `id`, `nome`, `motto`, `tesoro`, `operazioni`, `pngReclutati`, `banchiere`, `infLog`, `livelloNotificato`, `convocazione`, `commissario`, `chat`, `giudice`

**notte** (18 campi)

- `ora` (numero): 0-6 (22:00-04:00)
- `pericolo` (oggetto): livello di pericolo di ogni posto
- `occasioni` (lista): affari nascosti nei posti
- `chiuso` (oggetto): chi ha già scelto in quest'ora
- `viaggio` (oggetto): chi è in viaggio e verso dove
- `dove` (oggetto): posto di ogni giocatore
- `racconto` (oggetto): il racconto di ognuno
- `pronto` (oggetto): chi ha premuto Avanti
- `base` (oggetto): soldi a inizio ora per il riepilogo
- `inizio` (numero): ora vera (Date.now) di inizio dell'ora: l'orologio dei 120 secondi
- altri: `fatto`, `foto`, `daScelta`, `inizioRacc`, `proposte`, `serate`, `segue`, `rito`

**pending** (la domanda aperta di giorno): `compra` {lotto, giocatore} · `asta` {lotto, offerte, giocatore, partecipanti} · `gala` {giocatore} · `chiamata` {giocatore, guadagno, testo} · `casino_reale` {giocatore} · `municipio` {giocatore}

