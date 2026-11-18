# Rapporto: dinamica 1 (I Favori) e dinamica 2 (Il Ricatto)

Ramo `dinamiche`, 4 commit (bfdc3f6, 02fc227, 83d808e, 565c1b6). Niente push.

## Cosa ho fatto

**0.4 Il campo `macchia`.** Messo a `true` in tutti i 17 punti dove c'era `pulitoCiclo = false`, tranne chi *riceve* sporchi in `regala` (lì macchia solo chi dà, come chiede la specifica). In più: `pagaMisto` quando usa sporchi, `compraOggetto` se l'oggetto è illegale, `articolo` pagato con sporchi, `ricatto`. Per ora nessuno lo rimette a `false`: quel passaggio va fatto all'Alba insieme alla Fedina (4.1), che lo deve leggere prima.

**Motore (motore.js)**
- Stato nuovo `s.favori`, `s.ricatti`, `p.senzaParola`, `p.haRegalato`, sempre creati al volo (funzioni `favori(s)` e `ricatti(s)`).
- `FAVORI` (nome e spiegazione dei 4 tipi), esportato. Esportato anche `motivoNoFavore(s, idDeve, idA, tipo)`: lo usano i bot.
- Patti: `proponiContratto` accetta `contratto.favore` ("voto"|"passo"|"silenzio"|"mano") e `contratto.favoreDeve` ("da"|"a"). I controlli girano in proposta e di nuovo alla firma, con i messaggi della specifica. Il Favore nasce in `rispondiContratto`.
- Azioni nuove in `applica`: `favore_usa`, `favore_rompi`, `ricatto`, `rispondi_ricatto`. Tutti e 4 i tipi e tutte e 4 le risposte seguono la specifica.
- Il Voto: in `elezioni()` si sommano i punti (al massimo 2 Voti, `clamp(fama, 5, 40)`). Chi deve il Voto, se è candidato anche lui, perde gli stessi punti. Dopo le elezioni il Voto è "pagato". Sulla Grande Opera usa `st.opera.promessi`; se il voto è promesso, `votaOpera` dice "Il tuo voto è promesso a X."
- Passo libero: in `atterra()` non si paga affitto né pedaggio sui terreni che il debitore possiede *in quel momento*. Il conteggio dei turni è in `prossimoTurno()`.
- Silenzio: brucia le Prove e blocca `denuncia`, `ricatto`, `articolo` scandalo (anche di notte) e `titolone` scandalo. Si chiude all'Alba che finisce il Ciclo dopo.
- La Mano: controllo in `risolviOra()` subito dopo i viaggi. Al Faro a inizio notte il Favore torna "aperto" (`manoInizioNotte` in `iniziaNotte`). Chi non si presenta rompe la parola da solo.
- `scadenzeFavori(s)` va subito dopo `scadenzeContratti`. Fa quattro cose: i ricatti senza risposta valgono come rifiuto, i Favori scaduti si chiudono, il Silenzio finisce, si tengono gli ultimi 40 chiusi.
- Ricatto: +6 Tracce, reato grave, macchia, Ufficio stampa al 50%, un ricatto aperto alla volta, Prova `rifiutata`. Condanna e archiviazione annullano i ricatti in attesa.
- Pista nuova `ricatto` (peso fisso 10) in `piste()`.
- `vista()`: `v.favori` contiene i tuoi Favori interi; degli altri passano solo Voto (elezioni) e Passo attivi, ridotti a `{id, deve, a, tipo, stato, uso}`. `v.ricatti` ha solo quelli dove ci sei tu. In `CAMPI_PUBBLICI` ho aggiunto `senzaParola`, `fedina` e `operaFatta`. I campi privati del punto 0.3 (macchia ecc.) sono già segreti da soli: `vista()` lascia passare solo i campi in lista.
- Le 4 azioni nuove sono in `AZIONI_TELEFONO_FARO` (nel codice il nome è questo, non `giorniAzioniTelefono`). Ci sono anche `MOTIVO` ("Favori", "Ricatti"), 2 `SCOPERTE` ("Chiedere un Favore", "Usare una Prova") e `VERSIONE_REGOLE` 74.

**Bot (bot.js)**: segue la specifica.
- Patti con Favore: il bot fa i conti, con i pesi del carattere e i "mai". Patti senza Favore: rifiuta, come prima.
- Usa i Favori che ha in mano: Voto da candidato; Passo se il terreno più caro del debitore è 8-13 caselle avanti o se il Favore sta per scadere; Silenzio se è Osservato o peggio, o se sta per scadere; Mano solo il Gran Maestro, verso la convocazione.
- Ricatta: solo Furbo, Spavaldo ed Esperto, e solo se la vittima ha stato 1 o più. Nelle partite per principianti non ricatta le persone vere nei primi 3 Cicli.
- Legale, Costruttore e Investitore denunciano, e solo il primo in classifica.
- Vittima: "pari" se può, poi accetto/confesso/rifiuto come da specifica. Se non può accettare, rifiuta.
- Va sempre alla Mano. Non rompe mai la parola e non propone Favori.

**Interfaccia (gioco.js, stile.css)**
- Rubrica: sezione "I miei fili", con una scheda per ogni giocatore. Mostra "Ti deve…" con il pulsante Usa e "Gli devi…" con il pulsante "Rompi la parola" (con la conferma della specifica). Se non c'è niente: "Nessun filo con X. Per ora."
- Il pulsante Usa apre una finestra per ogni tipo: elezioni o voto SÌ/NO sulla Grande Opera; per la Mano si scelgono posto e ora.
- Contratti: righe "Favore" e "Chi lo deve" con la spiegazione sotto. La scheda del patto ha l'etichetta "Favore".
- App Prove: pulsante "Usala: chiedi un Favore". Apre la finestra con l'avviso del rischio, poi la scelta tra i 4 Favori.
- Vittima: finestra automatica con le 4 scelte (Pari e patta solo se possibile) e il tempo che manca all'Alba. Lo stesso riquadro è in cima ai Messaggi e in "I miei fili".
- Di notte, a chi deve una Mano: riga fissa "Appuntamento: … L'hai promesso a X." con il pulsante Vai.
- NOVITA[74], 4 frasi.

## Cosa NON ho fatto, e perché
- **Pista "rivali" non tolta.** Nel codice vero quella pista non pesa la Prova in tasca: pesa le *denunce* fatte negli ultimi 2 Cicli. Quello che la specifica vuole ("una Prova in tasca non pesa") c'è già. Toglierla avrebbe indebolito la denuncia, che invece deve restare identica. Ho scelto l'opzione più sicura: lasciarla.
- **Il Silenzio non blocca `inchiesta_apri`**, perché questa azione non esiste ancora (dinamica 4). Quando nasce, basta chiamare `controllaSilenzio(s, p, idBersaglio)`.
- **Il Favore nel patto ha due campi piatti** (`favore` + `favoreDeve`) invece dell'oggetto `{tipo, deve}`. Il controllo di sicurezza degli ingressi (`normalizza`) rifiuta un oggetto dentro `contratto`. Il motore accetta comunque anche l'oggetto, se un giorno passa. Dentro il contratto salvato c'è `k.favore = {tipo, deve, id}`.
- **"Chi deve fallisce"**: nel motore nessuno diventa mai `fallito = true`. Il controllo c'è (errore in proposta, Favori chiusi all'Alba) ma oggi non scatta mai.
- **Il consiglio di Vera per "Chiedere un Favore"** scatta solo dopo un `regala`. "Pagato per qualcuno" non ha un evento chiaro nel codice.
- **`macchia` non torna mai a `false`**: lo farà l'Alba della Fedina (4.1).

## Prove
- `node --check` su motore.js, bot.js e gioco.js (come .mjs): ok.
- **Simulazione 200 partite, 12 Cicli, 0 errori.** Il risultato cambia un po' tra un giro e l'altro, perché i bot usano Math.random.
  - Prima (6b735cb): mediana del vincitore 119 / 120 / 118 M. Media per carattere: Furbo 68-71, Legale 98-102, Costruttore 93-95, Spavaldo 75-82, Esperto 72-74, Investitore 109-111.
  - Dopo: mediana del vincitore 116 / 118 / 115 / 114 M (circa −3%). Media per carattere: Furbo 62-67, Legale 96-97, Costruttore 93-97, Spavaldo 68-78, Esperto 61-65, Investitore 105-112.
  - Su 200 partite: circa 100 ricatti dei bot (90% "accetto", qualche "pari", pochissimi "rifiuto" e "confesso"), circa 75 Favori usati (quasi tutti Passo libero), circa 45 denunce. Le condanne passano da circa 555 a circa 590.
- `vecchia.js`: 10 partite su 10 senza errori.
- `gioca.py 200`: nessun errore della pagina.
- `/home/claude/prove/casi-favori.js`: **62 controlli ok, 0 sbagliati**. La prova crea una partita con 4 persone e fa un patto per ognuno dei 4 tipi. Il Voto fa vincere le elezioni a chi era dietro. Il Passo libero fa passare gratis (0 affitti pagati). Il Silenzio brucia 2 Prove e blocca la denuncia. La Mano mantenuta risulta "pagato"; quella non mantenuta rompe la parola da sola. Prova anche la parola rotta a mano, i limiti (3 Favori, doppione, senza parola), le 4 risposte al ricatto, il rifiuto automatico all'Alba, l'Ufficio stampa e la scadenza. Controlla che la vista di un terzo non abbia Silenzio, Mano, ricatti né macchia degli altri, che `vista()` non cambi lo stato, e che una partita senza i campi nuovi funzioni.
- Screenshot guardati: /tmp/ricatto.png (finestra della vittima con le 4 scelte) e /tmp/rubrica.png e /tmp/rubrica2.png ("I miei fili" nel telefono). Si leggono bene. Nel telefono le 4 scelte del ricatto stanno ora una sotto l'altra, perché su 2 colonne erano strette.

## Rischi
- **Furbo ed Esperto rendono 5-10 M in meno.** Il ricatto costa +6 Tracce e un reato grave, e porta un po' più condanne. Se dà fastidio: bot che ricattano meno spesso, o solo con Tracce basse.
- **I bot usano quasi solo il Passo libero.** Il Voto e la Mano tra bot non succedono quasi mai.
- Una persona può aprire un ricatto contro un bot quando vuole. Il bot accetta quasi sempre: va guardato in partite vere.
- `server/` non è toccato. Va rigenerato (terser) con il motore nuovo.
