# ACCORDO tra Creatore A e Creatore B
## Le prime 4 dinamiche da costruire — specifica finale

Scritto da A dopo aver letto per intero B-proposte.md e aver ricontrollato nel motore i punti in discussione.
Niente è stato modificato in /home/claude/re-della-laguna. Nessuna partita di prova è stata fatta girare: i numeri qui sotto sono di progetto, da verificare con la simulazione dei bot.

**Le 4 dinamiche:** 1. I Favori · 2. Il Ricatto · 3. I Servizi dei contatti (con la transenna) · 4. La Fedina pulita (Esposto, Inchiesta, Opera pubblica).

---

# (a) Dove do ragione a B

1. **12 dinamiche erano troppe.** Il problema di Nicola è che i giocatori non conoscono le funzioni. La regola di B è giusta: una cosa nuova entra solo se riempie o sostituisce qualcosa che c'è già.
2. **Il Ricatto non deve essere una rendita.** Un Favore a ogni Ciclo trasformava una foto in mezza partita di schiavitù. **Una Prova = un Favore**, poi la Prova è bruciata.
3. **Ricattare è un reato grave**, non medio. Un potere così deve costare.
4. **La Prova in tasca non deve più pesare da sola.** Oggi pesa 8 nelle piste anche se nessuno la usa: così non c'è niente da trattare.
5. **Le tre uscite del ricattato** (Confesso, Pari e patta, Ufficio stampa) sono migliori delle mie. Le adotto.
6. **Passo libero per un Ciclo**, non per un passaggio solo. Un passaggio solo vale troppo poco per essere chiesto.
7. **Niente vendita dei Favori a terzi, niente furto della Prova in casa.** Confondono e servono di rado.
8. **Le Grotte: scartate.** Doppiano Bunker, Piani segreti, Caveau ed Eliporto, che il giocatore ha pagato milioni. E il "latitante" indeboliva il Faro, cioè il rischio.
9. **Il Prestanome sulla mappa: scartato.** Un affitto pagato a un proprietario nascosto va contro la regola di Nicola "affitti visibili". Non serve nemmeno chiederglielo.
10. **Le Chiavi della Città come carica: scartate.** Il veto blocca un giocatore senza che possa fare niente nel suo turno. Resta solo l'opera pubblica col nome, come premio dei 6 Cicli puliti.
11. **La Cimice che legge tutta la notte di un altro: troppo.** Toglie il mistero della notte. Si rivede più avanti, dentro "Il Nome", in forma leggera.
12. **Le mosse uniche delle Ambizioni: tolte.** Togliere il controllo a una persona vera nell'ultima notte è sbagliato. L'Ambizione resta come frase nella Cronaca finale.
13. **Una sola transenna per Ciclo in tutta la Laguna**, visibile a tutti prima di tirare i dadi.
14. **Massimo un posto forzato "pericoloso" per tipo, per notte** (uno da Vargas, uno da Esposto). Di più, la notte diventa una lotteria.

---

# (b) Dove NON sono d'accordo (solo quello che conta davvero)

**1. La transenna: il conto di B è fatto con due dadi, ma il gioco ne tira tre.**
`tira()` lancia tre dadi. La somma più probabile è 10 o 11, e ognuna esce 12,5 volte su 100 (controllato contando i 216 casi). Non esiste la "condanna quasi a comando a 7 caselle". Quindi due correzioni di B non servono: "annunciarla un turno prima" e "non entro 3 caselle dal bersaglio" (con tre dadi il minimo è già 3). Tengo solo: visibile prima di tirare, una per Ciclo. Meno regole, stesso rischio.

**2. Il Favore "Voto" funziona anche senza le elezioni nuove.**
B dice che con la formula di oggi il Voto non ha dove attaccarsi. Non è così: `elezioni()` fa una somma di punti per ogni candidato. Il Voto aggiunge punti (la fama di chi lo deve). Quando arriveranno le elezioni votate dai giocatori, lo stesso Favore diventerà un voto vero. Non c'è motivo di aspettare.

**3. La Fedina non può usare i contatori che ci sono già.**
B dice che `p.ombraCicli` e `p.pulitoCiclo` bastano. Ho controllato: `iniziaNotte()` rimette `pulitoCiclo = true` a tutti. Quindi le macchie fatte **di giorno** (busta per la licenza, regalo all'assessore, lavoretto al telefono) si cancellano prima dell'Alba e non vengono contate. Serve un campo nuovo che nessuno azzera prima dell'Alba. Senza questo, la Fedina si potrebbe tenere pulita barando.

**4. "Tentare un pulito con un regalo sporco" non può esistere così.**
`regala()` non chiede il permesso a chi riceve. Chiunque potrebbe azzerare la Fedina di un rivale regalandogli un euro sporco. Decisione: **ricevere non macchia mai**. Macchia solo quello che fai tu.

**5. Inchiesta su un giocatore pulito: non va detto prima.**
B vuole avvisare prima di aprire il fascicolo ("su di lui non c'è niente"). Ma così, gratis, scopri chi è pulito e chi no, uno alla volta. Lo dico alla prima Alba: è il primo indizio, e costa un Ciclo di attesa.

**6. Un nome solo per cosa.**
B chiama "favore" anche quello che ti fa un poliziotto comprato. Nel gioco ci sarebbero due cose diverse con lo stesso nome. Propongo: **Favori** = tra giocatori. **Servizi** = dai contatti comprati.

**7. Le Prove "a caso" non sono a caso.**
Ho riletto il codice: carta Gazzetta, Ballo e VIP ubriaco danno già una Prova solo su chi ha Tracce (sopra 20 o sopra 10). Non serve cambiarle. Basta che il testo della Prova dica sempre da dove viene (c'è già il campo `cosa`).

**Cose mie che lascio andare senza discutere:** il ricatto anonimo col telefono usa-e-getta (resta come secondo passo, è d'accordo anche B), il Mistero (per ultimo e in piccolo), il Colpo a due (dopo).

---

# Decisioni prese al posto di Nicola (le opzioni più sicure)

| Domanda di B | Scelta | Perché |
|---|---|---|
| La Prova in tasca smette di pesare da sola? | **Sì** | Senza, il Ricatto non ha senso. La denuncia resta forte come oggi (+35 Tracce). |
| Ricatto a viso aperto o anonimo? | **A viso aperto** | Tra fratelli e amici è più sicuro: sai sempre con chi ce l'hai. Meno codice. |
| Elezioni votate dai giocatori? | **Non ora** | È la dinamica 5. Per adesso resta il calcolo di oggi, con i punti del Voto in più. |
| Entrare in una setta azzera la Fedina? | **Sì** | Rischio chiaro: o dentro o fuori. |
| Prestanome con proprietario nascosto? | **No** | Rispetta "affitti visibili". |
| Chi vince? | **Resta il più ricco** | Nessuna dinamica cambia la classifica. |

---
---

# (c) SPECIFICA FINALE PER IL PROGRAMMATORE

## 0. Regole che valgono per tutte e quattro

**0.1 Partite già iniziate.** C'è una partita vera in corso. Ogni campo nuovo va creato "al volo" quando serve, mai dato per presente:
`s.favori = s.favori || []`, `s.ricatti = s.ricatti || []`, `s.opere = s.opere || []`, `p.fedina = p.fedina || 0`. Nelle partite già iniziate la Fedina parte da 0.

**0.2 `vista()` è il punto più pericoloso.** `vista()` copia tutto lo stato e poi cancella i segreti. Ogni campo nuovo in cima allo stato (`s.favori`, `s.ricatti`, `s.esposto`, `s.ordineVargas`, `s.transenna`) **se non viene filtrato arriva a tutti i giocatori**. Per ognuno sotto c'è scritto cosa si vede. `vista()` non deve mai scrivere nello stato vero.

**0.3 Campi privati del giocatore.** Aggiungere alla lista di campi cancellati agli altri in `vista()`: `macchia`, `fascicolo`, `inchiestaBlocco`, `espostoStop`, `espostoCiclo`, `contiVisti`, `arrivi`, `sottoInchiesta`.
Campi nuovi **pubblici** (restano visibili): `fedina`, `senzaParola`, `operaFatta`.

**0.4 Il campo `macchia`.** Nuovo, vero/falso. Dice: "in questo Ciclo ho fatto una cosa sporca". Nessuno lo azzera tranne l'Alba (vedi 4.1).
Va messo a `true` in tutti i punti dove oggi c'è `p.pulitoCiclo = false` (funzioni: `riciclaBanca`, `affare`, `corrompi`, `ricicla`, `ricettatore`, `risolviOccasione`, `bustaLicenza`, `regaloAssessore`, `rispondiChiamata`, `albaOpere` per Isola e Grande Colpo, `alba` per l'evasione, `operazione` per i membri). In più:
- `pagaMisto()` quando usa anche solo 1 € sporco;
- `compraOggetto()` se l'oggetto è `illegale`;
- `articolo()` pagato con sporchi; `regala()` con sporchi (macchia **chi dà**, non chi riceve);
- le azioni nuove `ricatto` e `servizio`.
`pulitoCiclo` non si tocca: continua a fare quello che fa oggi.

**0.5 Azioni dal Faro.** Aggiungere a `giorniAzioniTelefono`: `favore_usa`, `favore_rompi`, `ricatto`, `rispondi_ricatto`.

**0.6 Avvertenze del progetto.** Nei template su una riga non usare `//`. `influenzaDi()` calcola senza scrivere. Dopo ogni dinamica rifare la simulazione coi bot (riferimento: 12 Cicli ≈ 100-105 M al vincitore, 0 errori).

**0.7 Tre dadi.** Somme da 3 a 18. Probabilità di una casella precisa: 10 e 11 → 12,5%; 9 e 12 → 11,6%; 8 e 13 → 9,7%.

---

## 1. I FAVORI

### In 2 frasi (per il giocatore)
> Un Favore è una promessa che il gioco fa rispettare: un voto, un passaggio gratis, un silenzio o un appuntamento. Lo vedi sempre nei tuoi "fili"; chi rompe la parola finisce sulla Gazzetta.

### I 4 tipi

| id | Nome | Cosa fa quando chi lo ha in mano lo usa |
|---|---|---|
| `voto` | Il Voto | Alle prossime elezioni la fama di chi lo deve diventa punti per te. Oppure: il suo voto su una Grande Opera lo decidi tu. |
| `passo` | Passo libero | Per i tuoi prossimi 4 turni non paghi affitti né pedaggi sui suoi terreni. |
| `silenzio` | Il Silenzio | Brucia tutte le Prove che ha su di te. Fino alla fine del prossimo Ciclo non può denunciarti, ricattarti, pagare scandali o aprire inchieste su di te. |
| `mano` | La Mano | Stanotte deve farsi trovare nel posto e all'ora che dici tu. |

### Stato nuovo
```
s.favori = [ {
  id: "f" + s.prossimoId++,
  deve: idGiocatore,          // chi lo deve
  a: idGiocatore,             // chi lo ha in mano
  tipo: "voto"|"passo"|"silenzio"|"mano",
  origine: "patto"|"ricatto",
  nato: s.ciclo, scade: s.ciclo + 4,
  stato: "aperto"|"attivo"|"pagato"|"rotto"|"scaduto",
  uso: null | { elezione:true } | { turni:4 } | { fino:ciclo, bruciate:n } | { luogo, ora, ciclo },
  prova: null | { su, ciclo, cosa }   // solo origine "ricatto": la Prova tenuta in pegno
} ]
p.senzaParola = numero di Ciclo fino al quale (compreso) non può promettere Favori
```

### Come nasce un Favore
Dal patto che esiste già. `proponiContratto()` accetta un campo in più dentro `a.contratto`:
```
favore: { tipo: "voto"|"passo"|"silenzio"|"mano", deve: "da"|"a" }   // "da" = chi propone, "a" = chi riceve
```
- I soldi del patto (`pagoOra`, `pagoDopo`, `lottoCeduto`) funzionano come oggi. Possono essere zero.
- Il Favore nasce in `rispondiContratto()` quando l'altro dice sì.
- Il gioco fa rispettare il Favore sempre, sia nei patti "sulla parola" sia in quelli "dal notaio".

**Controlli** (in proposta e di nuovo all'accettazione, con questi messaggi):
- chi deve è "senza parola" → `"Nessuno si fida della parola di X fino al Ciclo N."`
- chi deve ha già 3 Favori aperti o attivi → `"X ha già promesso troppo: 3 Favori aperti."`
- esiste già un Favore aperto o attivo dello stesso tipo tra le stesse due persone nello stesso verso → `"Questo Favore te lo deve già."`
- chi deve è fallito → errore.

### Azioni nuove per `applica()`

**`{ tipo: "favore_usa", id, ...campi }`** — solo chi lo ha in mano (`f.a`), solo se `stato === "aperto"`.

- **voto, elezioni** — campi: nessuno. Vale solo se chi lo usa è candidato (`s.candidati[p.id] !== undefined`), altrimenti: `"Il Voto si usa quando sei candidato."` Effetto: `stato = "attivo"`, `uso = { elezione: true }`. Notizia pubblica (tipo "politica"): `"X sostiene Y alle elezioni."`
  In `elezioni()`: per ogni candidato si sommano i Voti attivi a suo favore, **al massimo 2**. Ogni Voto vale `punti = clamp(fama di chi lo deve, 5, 40)`. Il candidato prende `+punti`. Se chi lo deve è candidato anche lui, prende `−punti`. Dopo le elezioni: `stato = "pagato"`.
- **voto, Grande Opera** — campi: `{ opera: true, si: true|false }`. Vale solo se esiste una setta con `st.opera` aperta, tutti e due ne sono membri, e chi lo deve non è il Gran Maestro. Effetto: `st.opera.voti[f.deve] = si`, `st.opera.promessi = st.opera.promessi || {}`, `st.opera.promessi[f.deve] = true`, `stato = "pagato"`. In `votaOpera()`: se il voto è promesso → `"Il tuo voto è promesso a X."` Resta dentro la setta (un messaggio in `msgSetta`), niente Gazzetta.
- **passo** — campi: nessuno. Solo in fase "giorno". Effetto: `stato = "attivo"`, `uso = { turni: 4 }`. Notizia pubblica (tipo "affari"): `"Y apre le porte a X: Passo libero per 4 turni."`
  In `atterra()`, prima di calcolare `dovuto`: se c'è un Passo attivo con `deve === c.owner` e `a === p.id` → non si paga niente. Log pubblico: `"X passa gratis da <casella>: Passo libero di Y."` Vale per affitti e pedaggi dei moli.
  Conteggio: ogni volta che finisce un turno di chi lo usa (in `prossimoTurno()`, anche se era al Faro) `uso.turni -= 1`. A zero: `stato = "pagato"`.
- **silenzio** — campi: nessuno. Giorno o notte. Effetto: si tolgono da `prove` di chi lo deve tutte quelle con `su === f.a`; `uso = { fino: s.ciclo + 1, bruciate: n }`; `stato = "attivo"`. Messaggio privato a chi lo usa: `"Y ha bruciato N Prove su di te."` oppure `"Y non aveva niente su di te. Per ora."` All'Alba, quando `s.ciclo > uso.fino`: `stato = "pagato"`.
  Finché è attivo, chi lo deve non può fare contro `f.a`: `denuncia`, `ricatto`, `articolo` con tono "scandalo", `titolone` con scelta "scandalo", `inchiesta_apri`. Messaggio: `"Hai promesso il Silenzio a X fino al Ciclo N."`
- **mano** — campi: `{ luogo, ora }`. `ora` da 1 a 5 (23:00-03:00). `luogo` deve esistere in `LUOGHI`, non "palazzo", e deve essere aperto per chi lo deve (`luogoAperto(s, luogo, debitore)`). Di giorno: vale per la notte di questo Ciclo. Di notte: solo se `ora >= s.notte.ora + 2` (ci vogliono fino a 2 ore di viaggio). Se chi lo deve è al Faro → `"X è al Faro: stanotte non può venire."` Effetto: `stato = "attivo"`, `uso = { luogo, ora, ciclo: s.ciclo }`. Messaggio privato a chi lo deve: `"X incassa La Mano: stanotte alle <ora> devi essere a <luogo>. Se non ci sei, rompi la parola."`
  Controllo in `risolviOra()`, quando si chiude l'ora `uso.ora`: presente = non è in viaggio e `N2.dove[deve] === uso.luogo`. Presente → `stato = "pagato"`, racconto a tutti e due: `"<nome> è venuto, come promesso."` Assente → parola rotta (vedi sotto).
  Se all'inizio della notte chi lo deve è finito al Faro: il Favore torna `"aperto"`, non è consumato.

**`{ tipo: "favore_rompi", id }`** — solo chi lo deve, solo se `stato === "aperto"`.
Effetto: `stato = "rotto"`; fama −8 (minimo 0); `p.senzaParola = s.ciclo + 2`; notizia pubblica (tipo "fama"): `"Y non mantiene la parola data a X."` Se `origine === "ricatto"`: la Prova in pegno torna tra le `prove` di chi ricattava (può denunciare).
La stessa cosa succede da sola se non ti presenti alla Mano.

### All'Alba
Nuova funzione `scadenzeFavori(s)`, chiamata subito dopo `scadenzeContratti(s)`:
- Favori `"aperto"` con `scade <= s.ciclo` → `"scaduto"`. Messaggio privato a tutti e due. Nessuna punizione. La Prova in pegno, se c'è, è bruciata.
- Silenzi attivi scaduti → `"pagato"`.
- Si tengono in lista solo gli ultimi 40 Favori chiusi.

### Cosa mostra `vista()`
- A chi deve e a chi ha in mano: il Favore intero.
- A tutti gli altri: solo i Favori `"attivo"` di tipo `voto` (elezioni) e `passo`, ridotti a `{ id, deve, a, tipo, stato, uso }`. Sono cose pubbliche: toccano elezioni e affitti.
- Silenzio e Mano: mai visibili agli altri.
- `p.senzaParola`: pubblico (è già uscito sulla Gazzetta).

### Interfaccia (testi)
- **Rubrica**: in cima, sezione nuova **"I miei fili"**, una scheda per ogni altro giocatore. Sotto resta l'elenco dei personaggi di oggi.
  - `"Ti deve: Passo libero (scade al Ciclo 9)"` → pulsante **"Usa"**
  - `"Gli devi: Il Voto (scade al Ciclo 8)"` → pulsante **"Rompi la parola"**
  - Conferma di "Rompi la parola": `"Perdi 8 di fama, lo saprà tutta la Laguna, e per 2 Cicli nessuno accetterà Favori da te. Sicuro?"`
  - Se non c'è niente: `"Nessun filo con X. Per ora."`
- **Contratti › Proponi un patto**: due righe nuove. `"Favore: nessuno · Il Voto · Passo libero · Il Silenzio · La Mano"` e `"Chi lo deve: io · lui"`. Sotto, una riga che spiega il Favore scelto (le frasi della tabella sopra).
- Scheda del patto: etichetta `"Favore"` accanto a "Sulla parola / Dal notaio".
- Di notte, a chi deve una Mano: riga fissa in alto `"Appuntamento: <luogo> alle <ora>. L'hai promesso a X."`
- **Da scoprire** (nuova voce in `SCOPERTE`, gruppo "potere", lv 1): nome `"Chiedere un Favore"`; indizio `"Non tutto si paga in soldi."`; spiega `"In un patto puoi chiedere un Favore: un voto, un passaggio gratis, un silenzio, un appuntamento. Il gioco lo fa rispettare."`; consiglio di Vera `"Hai fatto un regalo e non hai chiesto niente. La prossima volta, nell'app Contratti, chiedi un Favore in cambio."` (quando: ha fatto `regala` o pagato per qualcuno e non ha mai avuto un Favore).
- `MOTIVO` (I miei conti): `favore_usa`, `favore_rompi` → `"Favori"`.

### Bot
Oggi i bot rifiutano tutti i contratti (`prossima`, riga del `rispondi_contratto`). Diventa:
- Patto **senza** Favore: rifiuta, come oggi.
- Patto **con** Favore: il bot calcola quanto vale il Favore per lui:
  - `voto`: 300.000 €. Mai se il bot ha fama ≥ 40 e chi lo chiede è candidato o può esserlo.
  - `passo`: metà dell'affitto più alto tra i suoi terreni, minimo 200.000 €.
  - `silenzio`: 200.000 € se non ha Prove su chi chiede; 1.500.000 € per ogni Prova che ha. Il Legale mai.
  - `mano`: 250.000 €. Mai se il suo stato di polizia è 2 o più.
  - Peso del carattere: Spavaldo 0,7 · Furbo 1 · Esperto 1 · Investitore 1,2 · Costruttore 1,2 · Legale 1,5.
  - **Il bot deve il Favore**: accetta se (soldi che riceve − soldi che paga) ≥ valore × peso.
  - **Il bot riceve il Favore**: accetta se quello che paga ≤ valore × 0,8.
- I bot **non propongono** Favori in questa versione (arrivano dal Ricatto).
- **Uso**: `voto` appena si candidano. `passo` a inizio turno se il terreno più caro del debitore è tra 8 e 13 caselle davanti, oppure se scade al prossimo Ciclo. `silenzio` se il loro stato è 2 o più, o se scade. `mano`: solo il Gran Maestro bot, per portare un membro al rito.
- **I bot non rompono mai la parola** in questa versione (tiene stabile la simulazione).
- Alla Mano il bot ci va sempre, se il posto è aperto per lui.

### Casi limite
- Chi deve fallisce: tutti i suoi Favori si chiudono (`"scaduto"`).
- Chi deve è "senza parola" e viene ricattato: vedi 2 (si può solo denunciare).
- Passo attivo e terreno ipotecato o venduto: vale sui terreni che il debitore possiede **in quel momento**.
- Lo stesso giocatore deve un Voto a due candidati diversi: è possibile (il limite è un Favore per tipo verso la stessa persona). La sua fama conta per tutti e due: ha promesso due volte, ed è pubblico.
- Elezioni senza che il Voto sia stato usato: non succede niente, il Favore resta aperto.
- Mano usata di giorno e poi il creditore finisce al Faro: l'appuntamento resta valido (chi deve ci va lo stesso).
- Fine partita: i Favori aperti non contano niente.

---

## 2. IL RICATTO

### In 2 frasi
> Una Prova non serve solo a denunciare: puoi mostrarla al rivale e chiedergli un Favore. È un reato grave, e lui può accettare, rifiutare, confessare o risponderti con una Prova su di te.

### Regole
- Serve una Prova in mano (`p.prove[idx]`) e la dinamica 1.
- **A viso aperto**: il ricattato sa chi sei.
- **Una Prova = un Favore.** Quando il Favore passa a `"pagato"` o `"scaduto"`, la Prova in pegno è bruciata (non torna a nessuno).
- Un solo ricatto aperto alla volta per ogni ricattatore.

### Cambio a una regola che c'è
In `piste()` **si toglie la pista `"rivali"`** (`N.pistaRivale` non si usa più). Una Prova in tasca non pesa. `denuncia()` resta identica (+35 Tracce, stato +1).

### Stato nuovo
```
s.ricatti = [ { id: "r" + s.prossimoId++, da, a, tipo, prova: { su, ciclo, cosa }, ciclo: s.ciclo,
                stato: "attesa"|"accettato"|"rifiutato"|"confessato"|"pari"|"smascherato"|"annullato" } ]
```
Sulla Prova: campo nuovo `rifiutata: true` quando torna indietro dopo un rifiuto.

### Azioni nuove

**`{ tipo: "ricatto", prova: idx, favore: "voto"|"passo"|"silenzio"|"mano" }`** — giorno o notte.
Controlli e messaggi:
- la Prova non esiste → errore; la Prova ha `rifiutata` → `"Questa Prova l'ha già vista. Ora puoi solo denunciarlo."`
- hai già un ricatto in attesa → `"Hai già un ricatto aperto."`
- la vittima è "senza parola" → `"X non ha più una parola da dare. Puoi solo denunciarlo."`
- la vittima non può promettere quel Favore (vedi controlli della dinamica 1) → stesso messaggio della dinamica 1
- hai promesso il Silenzio alla vittima → messaggio del Silenzio.

Effetti subito, su chi ricatta:
- la Prova esce da `p.prove` e va dentro il ricatto;
- `p.tracce += 6`; `segnaTraccia(s, p, 6, "un ricatto")`;
- `p.peggiorReato = peggio(p.peggiorReato, "grave")`; `p.pulitoCiclo = false`; `p.macchia = true`.

**Ufficio stampa.** Se la vittima ha la stanza `ufficio_stampa` e `rng(s) < 0.5`: il ricatto esce subito in pubblico. `stato = "smascherato"`; chi ricatta: altre +10 Tracce, −8 fama; Prova bruciata. Notizia (tipo "scandalo"): `"L'Ufficio stampa di Y denuncia un tentato ricatto. Dietro c'è X."` Fine.

Altrimenti `stato = "attesa"` e messaggio privato alla vittima:
`"X ha una Prova su di te (<cosa>, Ciclo <n>). In cambio del silenzio vuole: <Favore>. Rispondi prima dell'Alba."`

**`{ tipo: "rispondi_ricatto", id, scelta }`** — solo la vittima, solo se `stato === "attesa"`.

| scelta | Effetto |
|---|---|
| `"accetto"` | Nasce il Favore (`origine: "ricatto"`, `prova` in pegno, `deve` = vittima, `a` = ricattatore). `stato = "accettato"`. |
| `"rifiuto"` | La Prova torna al ricattatore con `rifiutata: true`. Può solo denunciare. `stato = "rifiutato"`. |
| `"confesso"` | Vittima: +17 Tracce (`segnaTraccia(..., "la tua confessione")`), lo stato di polizia non sale. Prova bruciata. Ricattatore: +25 Tracce, `stato = max(stato, 1)`. Notizia (tipo "scandalo"): `"Y confessa in Procura e fa un nome: X lo ricattava."` `stato = "confessato"`. |
| `"pari"` | Solo se la vittima ha una Prova sul ricattatore, altrimenti errore. Si bruciano la Prova del ricatto e la prima Prova della vittima su di lui. Nient'altro. `stato = "pari"`. |

**Se all'Alba è ancora in attesa:** vale come `"rifiuto"`.

### La pista nuova (il rischio, sempre visibile a chi ricatta)
In `piste()`: se il giocatore ha un ricatto in `"attesa"`, oppure ha in mano un Favore con `origine: "ricatto"` aperto o attivo:
```
{ k: "ricatto", peso: 10, testo: "Qualcuno ha parlato di un ricatto: la polizia vuole sapere chi tiene in pugno chi." }
```
Peso fisso 10, non si somma. Sparisce quando il Favore è pagato, scaduto o rotto.

### Cosa mostra `vista()`
- `v.ricatti` = solo quelli dove sono `da` o `a`. Nessun altro li vede.
- Diventano pubblici solo con "confesso" e con l'Ufficio stampa (Gazzetta).

### Interfaccia (testi)
- **App Prove**: su ogni Prova, secondo pulsante **"Usala: chiedi un Favore"** accanto a "Manda alla polizia".
- Finestra di conferma (il rischio prima della scelta):
  `"Ricattare è un reato GRAVE. Subito: +6 Tracce. Finché non è chiuso, la polizia ha una pista in più su di te. Se lui confessa: +25 Tracce a te e il tuo nome sulla Gazzetta. Una Prova vale un solo Favore."`
  Poi la scelta del Favore (le 4 frasi della dinamica 1).
- **Per la vittima** (in cima ai Messaggi e in "I miei fili", con conto alla rovescia fino all'Alba):
  - **"Accetto"** — `"Gli devi il Favore. La Prova resta in pegno finché non lo paghi."`
  - **"Rifiuto"** — `"Può denunciarti: +35 Tracce e la polizia sale di un gradino."`
  - **"Confesso"** — `"+17 Tracce a te, la Prova sparisce. A lui +25 Tracce e il nome sulla Gazzetta."`
  - **"Pari e patta"** (solo se possibile) — `"Bruci la tua Prova su di lui e lui la sua su di te."`
- **Da scoprire** (gruppo "potere", lv 1): nome `"Usare una Prova"`; indizio `"Una Prova consegnata vale una volta sola."`; spiega `"Con una Prova puoi denunciare un rivale, oppure mostrargliela e chiedergli un Favore. È un reato grave."`; consiglio `"Hai una Prova in tasca. Puoi mandarla alla polizia, oppure usarla: app Prove."` (quando: ha almeno una Prova).
- `MOTIVO`: `ricatto`, `rispondi_ricatto` → `"Ricatti"`.

### Bot
- **Chi ricatta**: Furbo, Spavaldo, Esperto, se hanno una Prova e la vittima ha stato di polizia ≥ 1 (cioè è già uscita sulla Gazzetta: ha paura). Favore chiesto: `passo` se la vittima ha un terreno con affitto ≥ 300.000 €; altrimenti `voto` se il bot è candidato; altrimenti `silenzio`.
- Legale, Costruttore, Investitore non ricattano mai: denunciano, e solo il primo in classifica.
- **Vittima bot**: "pari" se può. "accetto" se stato ≥ 2 o Tracce > 40. "confesso" se Tracce < 15 e stato 0. Negli altri casi "accetto" (lo Spavaldo 3 volte su 10 "rifiuto").
- Nelle partite per principianti (`s.principianti`) i bot non ricattano le persone nei primi 3 Cicli.

### Casi limite
- La vittima viene condannata o assolta mentre il ricatto è in attesa: `stato = "annullato"`, Prova bruciata (non prova più niente). I Favori già nati restano.
- Il ricattatore viene condannato con un ricatto in attesa: `"annullato"`, Prova persa.
- La vittima rompe la parola dopo aver accettato: vedi dinamica 1 (la Prova torna al ricattatore).
- La vittima è al Faro: può rispondere (è una telefonata).
- Ricattare un membro della propria setta: permesso.
- Più Prove sulla stessa persona: un ricatto alla volta; ogni Prova vale un tentativo.

---

## 3. I SERVIZI DEI CONTATTI

### In 2 frasi
> I contatti comprati non ti danno solo protezione: una volta per Ciclo ognuno ti fa un Servizio (una transenna sul tabellone, una retata spostata, un conto spiato, un carico riservato). Ogni Servizio lo rende più nervoso: più lo usi, prima gli Affari Interni arrivano a lui, e poi a te.

### Regole comuni
Azione unica: **`{ tipo: "servizio", chi, ...campi }`** con `chi` = `"agente"` | `"commissario"` | `"banchiere"` | `"doganiere"`.
- Serve il contatto in `p.corrotti` (per l'agente: `"agente_" + isola`).
- Se è sotto inchiesta (`c.sospetto != null`) → `"È sotto inchiesta: non risponde al telefono."`
- Uno per contatto per Ciclo: `c.servizioCiclo === s.ciclo` → `"Questo Ciclo ti ha già fatto un Servizio."`
- Effetti comuni: `c.servizioCiclo = s.ciclo`; `c.servizi = (c.servizi || 0) + 1`; `p.pulitoCiclo = false`; `p.macchia = true`; Tracce secondo la tabella, con `segnaTraccia(..., "un Servizio di <nome contatto>")`.
- **Il rischio.** In `rischioContatto()` si aggiunge `+ 0.03 * Math.min(4, c.servizi || 0)`. Il resto della formula non cambia. Il tetto resta 0,35.

| Contatto | Servizio | Quando | Tracce |
|---|---|---|---|
| Agente di un'isola | La transenna | giorno, tuo turno | +3 |
| Commissario Vargas | Sposta la retata | giorno, tuo turno | +4 |
| Banchiere Lenz | Fammi vedere il conto | giorno o notte | +2 |
| Doganiere | Cosa arriva stanotte? | notte | +2 |

### 3a. Agente — La transenna
Campi: `{ chi: "agente", isola, pos }`.
- Solo dopo due paghe: `s.ciclo - c.dal >= 2`, altrimenti `"L'agente non si fida ancora: deve passare un altro Ciclo."`
- Solo nel tuo turno di giorno, senza scelte in sospeso (`s.pending`). Prima o dopo i dadi.
- `pos` deve essere una casella con `tipoCasella === "lotto"` e `isola` uguale a quella dell'agente. Non una casella dove adesso c'è una pedina.
- **Una sola per Ciclo in tutta la Laguna**: `s.transennaCiclo === s.ciclo` → `"In questo Ciclo c'è già stata una transenna."`
- Effetto: `s.transenna = { pos, isola, da: p.id }`; `s.transennaCiclo = s.ciclo`. Notizia pubblica (tipo "evento"): `"Posto di blocco a sorpresa in <casella>, <isola>. Chi ci si ferma viene controllato."`
- **Dura** fino all'inizio del prossimo turno di chi l'ha messa (`iniziaTurno()`), oppure fino alla Notte (`iniziaNotte()`). Poi `s.transenna = null`.
- **In `atterra()`**, come prima cosa: se `s.transenna && p.pos === s.transenna.pos` → log pubblico `"X si ferma alla transenna di <casella>."` e chiamata a `postoDiBlocco(s, p)`, **senza cambiarla**: stessi documenti falsi, stesse regole del Ponte Est. Se dopo il controllo `p.faro > 0`, si esce (niente affitto). Altrimenti la casella vale come sempre.
- Vale per tutti, anche per chi l'ha messa.
- Se qualcuno viene condannato alla transenna: `c.servizi += 1` in più (l'agente si è esposto).
- **Contromossa del Sindaco**: azione `{ tipo: "togli_transenna" }`, solo il Sindaco, nel suo turno, una volta per Ciclo, gratis. Notizia: `"Il Sindaco fa togliere la transenna di <casella>."`
- **`vista()`**: tutti vedono `{ pos, isola }`. `da` si cancella per gli altri.
- **3D**: un oggetto in più sulla casella `s.transenna.pos` (transenna con lampeggiante).

### 3b. Commissario — Sposta la retata
Campi: `{ chi: "commissario", luogo }`. Solo nel tuo turno di giorno.
- `luogo` in `LUOGHI`, non "palazzo".
- **Una sola per notte in tutta la Laguna**: se esiste `s.ordineVargas` di questo Ciclo → `"Stanotte Vargas ha già altri ordini."` (chi lo legge capisce che un altro ha Vargas: è voluto).
- Effetto: `s.ordineVargas = { luogo, da: p.id, ciclo: s.ciclo }`.
- In `iniziaNotte()`, dopo il sorteggio dei pericoli: `s.notte.pericolo[luogo] = "pericoloso"`. Se quell'isola è in blackout il blackout vince, e a chi ha ordinato arriva: `"Col blackout, niente retata."`
- Niente Gazzetta. Chi arriva sul posto legge gli indizi di livello "pericoloso" che ci sono già: il rischio si vede prima di accettare un affare. La soffiata del Mercato Nero lo rivela.
- Vale anche per chi l'ha ordinata (che però ha Vargas dalla sua).
- All'Alba: `s.ordineVargas = null`.
- **`vista()`**: lo vede solo chi l'ha ordinata.

### 3c. Banchiere — Fammi vedere il conto
Campi: `{ chi: "banchiere", bersaglio }`. Giorno o notte.
- Effetto: `p.contiVisti = p.contiVisti || {}; p.contiVisti[bersaglio] = { ciclo: s.ciclo, puliti: Math.round(b.cash / 1e6), sporchi: Math.round(b.sporchi / 1e6) }`.
- Messaggio privato: `"Lenz: «<nome> ha circa N milioni puliti e circa M milioni sporchi. Io non ti ho detto niente.»"`
- Chi è spiato non lo sa. La scoperta passa da Lenz: se gli Affari Interni lo prendono, la pista porta a chi lo usava (c'è già).

### 3d. Doganiere — Cosa arriva stanotte?
Campi: `{ chi: "doganiere" }` per la lista, poi `{ chi: "doganiere", n }` per riservare. Solo di notte, da qualsiasi posto (è una telefonata).
- Senza `n`: consuma il Servizio. `p.arrivi = { ciclo: s.ciclo, lista: [ { n, nome, luogo, dalle, alle } ] }` con le occasioni di Porto e Aeroporto non prese, non riservate ad altri, e del livello del giocatore.
- Con `n`: permesso una volta sola per Ciclo, solo se `n` è nella lista di questo Ciclo e l'occasione non è presa né riservata. Effetto: `o.riservata = p.id` (campo che c'è già: gli altri non la vedono più).
- Messaggio: `"Il doganiere: «Stanotte arrivano: … Dimmi quale tengo da parte per te.»"`

### Cosa mostra `vista()`
- `corrotti` resta privato come oggi.
- Per sé, calcolato senza scrivere: `mio.umoreContatti = { chiave: "tranquillo"|"teso"|"nervoso"|"inchiesta" }` con `rischioContatto` < 0,08 → tranquillo; fino a 0,15 → teso; oltre → nervoso; `sospetto` → inchiesta.

### Interfaccia (testi)
- **App Soldi sporchi › La tua rete**: su ogni contatto, l'umore e un pulsante.
  - Agente: **"Metti una transenna"** → si tocca una casella della sua isola. Sotto: `"Tutti la vedono. Vale anche per te. Resta fino al tuo prossimo turno."`
  - Vargas: **"Sposta la retata"** → scelta del posto. `"Stanotte quel posto è pieno di sbirri, per tutti."`
  - Lenz: **"Fammi vedere il conto"** → scelta del rivale.
  - Doganiere: **"Cosa arriva stanotte?"**
  - Sotto ogni pulsante: `"Un Servizio per Ciclo. Ogni Servizio lo rende più nervoso."`
  - Umore: `"Vargas: tranquillo"` / `"teso"` / `"nervoso: se continui, parlerà"` / `"sotto inchiesta: scaricalo o rischia"`.
- La prima volta, dopo l'acquisto, il contatto si presenta (messaggio privato): agente `"Se ti serve un posto di blocco dove dico io, chiedi."`; Vargas `"Le retate le decido io. Anche dove."`; Lenz `"I conti degli altri? Li vedo tutti."`; doganiere `"So cosa arriva prima che arrivi."`
- **Da scoprire** (gruppo "notte", lv 1): nome `"Chiedere un Servizio"`; indizio `"Un poliziotto comprato non serve solo a chiudere un occhio."`; spiega `"Ogni contatto comprato ti fa un Servizio per Ciclo. Ma ogni Servizio lo rende più nervoso."`; consiglio `"Hai un contatto a libro paga e non gli hai mai chiesto niente. App Soldi sporchi, La tua rete."` (quando: ha almeno un contatto).
- `MOTIVO`: `servizio`, `togli_transenna` → `"Corruzione"`.

### Bot
Solo Furbo, Spavaldo, Esperto, e solo se il contatto non è sotto inchiesta.
- **Vargas**: 1 Ciclo su 2. Posto = quello dove i rivali hanno più `calore` in totale; se è zero ovunque, il Porto.
- **Agente**: solo se c'è un rivale con stato ≥ 2 che si trova 10 o 11 caselle prima di un lotto dell'isola dell'agente, e il bot ha stato < 2. Altrimenti niente.
- **Doganiere**: se il bot stanotte va al Porto o all'Aeroporto, riserva l'occasione che rende di più.
- **Lenz**: mai (ai bot non serve).
- Sindaco bot: toglie la transenna solo se è entro 18 caselle davanti a lui e lui ha Tracce > 25.

### Casi limite
- Il contatto viene arrestato o scaricato con la transenna in strada: la transenna resta fino alla sua scadenza.
- Transenna messa nell'ultimo turno del giorno 4: dura fino alla Notte, cioè quasi niente. Lo dice il testo sotto il pulsante.
- Vargas ed Esposto sullo stesso posto: nessun problema, è "pericoloso" una volta sola.
- Giocatore con stato ≥ 2 che finisce sulla transenna: condanna immediata, come al Ponte Est oggi. È la regola che c'è; il rischio è scritto nella notizia pubblica.
- Più giocatori con Vargas: vince chi ordina per primo nel Ciclo.

---

## 4. LA FEDINA PULITA

### In 2 frasi
> Ogni Ciclo senza macchie fa crescere la tua Fedina pulita: a 2 puoi mandare la polizia in un posto, a 4 aprire un'Inchiesta vera su un rivale, a 6 regalare alla città un'opera con il tuo nome. Basta un solo atto sporco e riparti da zero.

### 4.1 Il contatore
Campo nuovo `p.fedina` (numero, **pubblico**). In `alba()`, nello stesso punto dove oggi si calcola `ombraCicli`, dopo il pagamento delle rate dei contatti:
```
const sporco = p.macchia || inSetta(p) || Object.keys(p.corrotti).length > 0 || (p.evasione || 0) > 0;
p.fedina = sporco ? 0 : (p.fedina || 0) + 1;
p.macchia = false;
```
In `condanna()`: `p.fedina = 0`.
- **Macchia**: tutto quello che è elencato al punto 0.4.
- **Non macchia**: ricevere soldi sporchi in regalo, essere denunciati, essere fotografati, fotografare, denunciare, confessare un ricatto, i Favori.
- Quando la Fedina torna a 0, messaggio privato: `"Vera: «La tua Fedina pulita è andata. Si ricomincia da zero.»"` e si chiude il fascicolo (vedi 4.3).
- Quando arriva a 2, 4, 6: messaggio di Vera con il potere nuovo.

| Fedina | Potere |
|---|---|
| 2 | L'Esposto |
| 4 | L'Inchiesta |
| 6 | L'Opera pubblica |

### 4.2 L'Esposto (Fedina ≥ 2)
**`{ tipo: "esposto", luogo }`** — nel tuo turno di giorno. Gratis.
- `luogo` in `LUOGHI`, non "palazzo" e non "faro".
- Uno per Ciclo a testa (`p.espostoCiclo`).
- Dopo un esposto a vuoto salti un Ciclo: `p.espostoStop >= s.ciclo` → `"Dopo l'allarme inutile, la polizia per ora non ti ascolta."`
- **Uno per notte in tutta la Laguna**: → `"La polizia ha già una segnalazione per stanotte."`
- Effetto: `s.esposto = { luogo, da: p.id, ciclo: s.ciclo }`. Notizia pubblica (tipo "voce"), senza posto e senza nome: `"Un cittadino ha segnalato movimenti sospetti. Stanotte la polizia promette controlli."`
- In `iniziaNotte()`: `s.notte.pericolo[luogo] = "pericoloso"` (il blackout vince).
- **Esito**, in una funzione `esitoEsposto(s)` chiamata all'inizio di `alba()` (prima che `aggiornaPiste()` svuoti `luoghiNotte`):
  - `colti` = giocatori diversi da chi ha firmato con `luoghiNotte[luogo]` vero.
  - Almeno uno: fama +4. Privato: `"Il tuo esposto ha colto nel segno: stanotte a <luogo> c'era chi faceva affari (N persone)."` Niente nomi. Notizia: `"I controlli di stanotte a <luogo> hanno dato frutti."`
  - Nessuno: fama −4 (minimo 0), `p.espostoStop = s.ciclo + 1`. Privato: `"Esposto a vuoto: a <luogo> stanotte non c'era nessuno."` Notizia: `"Controlli a vuoto stanotte a <luogo>. Allarme inutile."`
  - Poi `s.esposto = null`.
- **`vista()`**: agli altri resta solo `{ ciclo }` (sanno che c'è, non dove né di chi).

### 4.3 L'Inchiesta (Fedina ≥ 4)
**`{ tipo: "inchiesta_apri", bersaglio }`** — nel tuo turno di giorno.
- Un fascicolo alla volta. Non su sé stessi, non su un fallito.
- `p.inchiestaBlocco[bersaglio] > s.ciclo` → `"Su di lui hai già indagato da poco."`
- Se hai promesso il Silenzio al bersaglio → messaggio del Silenzio.
- Effetto: `p.fascicolo = { su: bersaglio, aperto: s.ciclo, albe: 0, indizi: [] }`.
- Al bersaglio, subito, privato e senza nome: `"Vera: «Qualcuno fa domande su di te in Procura. Non so chi.»"` e `b.sottoInchiesta = s.ciclo`.

**A ogni Alba**, dopo il giro in cui `aggiornaPiste()` è passata su tutti e prima dei processi, per ogni giocatore con un fascicolo:
- `albe += 1`.
- Se ha già 2 indizi: niente.
- `ps` = `piste(s, bersaglio)` tolte quelle già raccolte (la chiave è `k` più `luogo` se c'è).
- Se `ps` non è vuota: se ne sceglie una a caso pesata per `peso` (stesso metodo di `tiroIndagine`). Si aggiunge `{ k, luogo, testo, ciclo }`. Privato: `"Fascicolo su <nome>: nuovo indizio. <testo>"`
- Se è vuota: `"Fascicolo su <nome>: stanotte niente di nuovo."` Se è vuota alla prima Alba: `"Su <nome> non c'è niente da trovare. Per ora."`
- Se `albe >= 4` e non è stato pubblicato: archiviato. `p.fascicolo = null`, `p.inchiestaBlocco[bersaglio] = s.ciclo + 2`.

**Testi degli indizi** (funzione nuova, in terza persona, a partire dalla pista):
- `voci` → `"<nome> è stato collegato a «<cosa>» nel Ciclo <n>."`
- `luogo` → `"<nome> è stato visto troppe notti a <luogo>."`
- `soldi` → `"<nome> ha ripulito e speso più di quanto rendono i suoi locali."`
- `complici` → `"Un contatto di <nome> è sotto inchiesta e sta parlando."`
- `ricatto` → `"<nome> tiene qualcuno in pugno con un ricatto."`

**`{ tipo: "inchiesta_pubblica" }`** — nel tuo turno di giorno, con almeno 1 indizio. È firmata: tutti sanno chi l'ha fatta.

| Indizi | Al bersaglio | A chi pubblica | Notizia (tipo "scandalo") |
|---|---|---|---|
| 2 | fama −15, Tracce +25, stato di polizia +1 (al massimo fino a 3: mai dritto al Processo) | fama +6 | `"INCHIESTA di X su Y. <indizio 1> <indizio 2>"` |
| 1 | fama −6, Tracce +10 | fama +2 | `"X accusa Y: <indizio>. Per ora è un indizio solo."` |

- L'Ufficio stampa del bersaglio **non** la ferma: è vera.
- Dopo: `p.fascicolo = null`, `p.inchiestaBlocco[bersaglio] = s.ciclo + 3`.
- `segnaTraccia(s, b, quanto, "l'inchiesta di X")`.

**Se la Fedina scende sotto 4 con un fascicolo aperto**: fascicolo chiuso, fama −5, notizia: `"X ritira le accuse contro Y: non è più credibile."`

**`vista()`**: `fascicolo` è privato. Il bersaglio sa solo che qualcuno indaga.

### 4.4 L'Opera pubblica (Fedina ≥ 6)
**`{ tipo: "opera_pubblica", isola, opera }`** — nel tuo turno di giorno. Una sola volta a partita per giocatore (`p.operaFatta`).
- `opera` = `"teatro"` | `"parco"` | `"scuola"` (cambia solo l'aspetto e il nome).
- `isola` in `ISOLE`. Una sola opera per isola → `"Qui c'è già <il Teatro di X>."`
- Costa **3.000.000 € puliti** (`p.cash`). Il pagamento è pubblico (`flusso(..., true)`).
- Effetto: `s.opere.push({ isola, opera, di: p.id, nome: p.nome, ciclo: s.ciclo })`; `s.valore[isola] = clamp(s.valore[isola] + 1, 1, 10)`; fama +8; `p.operaFatta = true`.
- Notizia (tipo "evento"): `"X dona alla città il Teatro di <isola>. L'isola vale di più per tutti."`
- **3D**: un edificio nuovo sull'isola con la targa `"Teatro <nome>"`.
- Se poi il donatore viene condannato: l'opera resta, la targa no. `o.di = null`, `o.nome = null`. Notizia: `"Tolta la targa dal Teatro di <isola>."`
- **`vista()`**: `s.opere` è pubblico.

### Interfaccia (testi)
- **I miei conti**: riga fissa `"Fedina pulita: 3 Cicli"` con una barra a tre tacche (2 · 4 · 6) e il prossimo potere: `"Ancora 1 Ciclo pulito: L'Inchiesta."`
- Accanto al nome di ogni giocatore, nella lista pubblica: `"Fedina 4"` (solo se ≥ 2).
- **Municipio**, sezione nuova **"Cittadino onesto"** (visibile da Fedina ≥ 2; sotto, grigia, con `"Ti serve Fedina pulita 2."`):
  - **"Firma un esposto"** → scelta del posto. `"Stanotte la polizia sarà lì. Se nessuno fa affari in quel posto, perdi 4 di fama e salti un Ciclo."`
  - **"Apri un'inchiesta"** → scelta del rivale. `"Ogni Alba un indizio vero, se c'è. Con due indizi pubblichi. Lui saprà che qualcuno indaga."`
  - **"Pubblica"** → mostra gli indizi raccolti e l'effetto (tabella sopra) prima della conferma.
  - **"Dona un'opera alla città"** → isola e tipo. `"3.000.000 €. L'isola vale di più per tutti. Sull'edificio c'è il tuo nome."`
- Prima di un'azione che macchia, se la Fedina è ≥ 2, una riga in più nella conferma: `"Attenzione: perdi la Fedina pulita (3 Cicli)."` (rischio sempre chiaro).
- **Da scoprire** (gruppo "potere", lv 0): nome `"La Fedina pulita"`; indizio `"Chi non si sporca mai, prima o poi viene ascoltato."`; spiega `"Ogni Ciclo senza atti sporchi fa crescere la Fedina. A 2, 4 e 6 Cicli si aprono poteri solo per chi è pulito."`; consiglio `"Sei pulito da 2 Cicli: ora la polizia ti ascolta. Dal Municipio puoi firmare un esposto su un posto della notte."` (quando: Fedina ≥ 2 e mai fatto un esposto).
- `MOTIVO`: `opera_pubblica` → `"Opere pubbliche"`.

### Bot
- Legale, Costruttore, Investitore tengono la Fedina (già oggi non fanno affari sporchi).
- **Esposto**: se disponibile, lo firmano solo se la somma del `calore` dei rivali in un posto è almeno 1; scelgono il posto con la somma più alta. Se è zero ovunque, non firmano (evitano l'allarme inutile).
- **Inchiesta**: fascicolo sul rivale con lo stato di polizia più alto (almeno 1); se nessuno, sul primo in classifica se ha Tracce > 20; altrimenti niente. Pubblicano con 2 indizi, oppure con 1 se `albe >= 3`.
- **Opera**: se Fedina ≥ 6 e soldi > 6.000.000 €, sull'isola dove hanno più terreni.
- **Bot sporchi**: se in questo Ciclo c'è un esposto, Furbo ed Esperto 1 volta su 2 restano a casa quella notte; lo Spavaldo esce lo stesso. Se sono sotto inchiesta (`sottoInchiesta === s.ciclo`), Furbo ed Esperto saltano gli affari per una notte.

### Casi limite
- Fedina e setta: essere in una setta tiene la Fedina a 0, anche senza fare affari.
- Regalo sporco ricevuto: non macchia. Se poi lo spendi, macchia (`pagaMisto`).
- Giocatore al Faro: la Fedina è già a 0 per la condanna; ricomincia a contare dal Ciclo dopo.
- Esposto e posto non ancora aperto per chi firma: permesso (può aver capito guardando gli altri).
- Inchiesta su un bersaglio che viene condannato nel frattempo: `condanna()` azzera Tracce e contatti, quindi le piste spariscono. Gli indizi già raccolti restano validi e si possono pubblicare.
- Esposto e partita che finisce a quell'Alba: l'esito si calcola lo stesso (conta per la fama finale).
- Partite da 6 Cicli: l'Opera pubblica arriva solo all'ultimo Ciclo. Va bene: è un premio raro.

---

## 5. Ordine di lavoro e controlli

1. **Favori** (medio) → simulazione coi bot.
2. **Ricatto** (piccolo, dopo la 1) → simulazione. Controllare che togliere la pista "rivali" non abbassi troppo le indagini.
3. **Servizi dei contatti** (piccolo-medio) → simulazione. Controllare quante condanne nascono dalla transenna.
4. **Fedina pulita** (medio) → simulazione. Controllare che i bot puliti non restino indietro né scappino avanti.

**Prove da scrivere per ogni dinamica:**
- una partita di 12 Cicli coi bot finisce con 0 errori;
- il patrimonio del vincitore resta vicino a 100-105 M (se si sposta di più del 15%, rivedere i numeri: Passo libero e transenna sono i due più a rischio);
- `vista()` di un giocatore non contiene mai: Favori Silenzio/Mano degli altri, ricatti degli altri, `da` della transenna, `luogo` e `da` dell'esposto, `s.ordineVargas` degli altri, `fascicolo` degli altri;
- una partita salvata prima della modifica si ricarica e continua senza errori.

**Dopo queste 4** (già d'accordo con B): Elezioni vere + Cronaca finale, poi Il Nome. Più avanti: Colpo a due semplificato, Mistero in piccolo, Cariche, ricatto anonimo col telefono usa-e-getta.
