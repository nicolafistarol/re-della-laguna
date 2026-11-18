# Rapporto settore ILLEGALE — Re della Laguna (motore v65)

Autore: critico "illegale" · 18/11/2026 · Fase 1, solo analisi (nessun file del gioco modificato).
Materiale di prova: `/home/claude/prove/illegale/` (script Node, foto, tracce di partita).

Come ho provato:
- **Simulazioni coi bot in Node** (`sim.js`, `sim2.js`): 20 partite da 12 Cicli e 40 da 16 Cicli, 4 bot (Spavaldo, Furbo, Esperto, Legale). Nessun errore del motore.
- **Traccia di una partita** (`trace.js` → `trace1003.txt`): stato polizia, Tracce, piste, condanne giorno per giorno.
- **Prove mirate** (`test_casi.js` → `test_casi.txt`, `test_manipola.js`, `test_blackout.js`, `test_influenza.js`).
- **Browser** (`foto2.js` = foto.js che carica una partita salvata): app Soldi sporchi (`tel_sporchi.png/.txt`), app Setta (`tel_setta.png/.txt`), finestra di un affare con Vargas presente (`occasione_vargas.png`).

Numeri dalle simulazioni (40 partite × 16 Cicli, 120 giocatori "sporchi"):
- 227 condanne: 30 lievi, 87 medie, 79 gravi, 31 gravissime. 207 al Processo e **20 al Posto di blocco** (cioè per un tiro di dadi). Multa media 6,4 M.
- Quasi tutti quelli che si sporcano arrivano almeno una volta al Processo (stato massimo 4 per 56 giocatori su 60 nel campione da 20 partite).
- 165 perquisizioni all'Alba.
- I bot fondano sette (30 in 40 partite) ma **non usano mai** operazioni, foto, denunce o corruzione (quasi): quelle parti le ho provate a mano.

---

## LE 5 COSE PIÙ IMPORTANTI

1. **ILL-01 (BLOCCANTE) – La Borsa si gonfia a comando.** Il Gran Maestro di una setta di livello 3 può fare "Muovere un titolo" **6 volte nella stessa notte** (una per ora), senza limiti. Prova: 10 M investiti in SoleTech → rivenduti in media a **49,5 M** dopo una notte, spendendo 6 M di Tesoro. In più la setta guadagna circa 19 punti di Influenza. Rompe l'economia di tutta la partita.
2. **Cose promesse che non fanno niente (ALTA).**
   - Corrompere il banchiere Lenz costa 750.000 € più 375.000 € a Ciclo e non dà nessun effetto (ILL-02).
   - "Spegnere un'isola" costa 3 M e non cambia nulla (ILL-03).
   - Magazzino, Discoteca, Beach club e Galleria promettono affari che il gioco di notte non ha più (ILL-04).
   - Il glossario parla di "ricattare" con una Prova, ma il ricatto non esiste (ILL-19).
3. **Le pene e il rischio sono spiegati male (ALTA, chiarezza).**
   - L'app dice "4 Cicli in cella al Faro": in realtà sono 4 turni di dadi.
   - Non dice che una condanna grave sequestra tutti i locali "a rischio" e blocca le entrate.
   - Non dice che anche una condanna lieve confisca tutti gli sporchi.
   - La percentuale di "guai" mostrata di notte non conta il Commissario Vargas (+35%) e altre cose (prova: mostra 54%, il vero rischio è 73%).
   - L'app dice "a ogni Alba la polizia tira i dadi": in realtà i tiri sono 4 per Ciclo.
   (ILL-05, ILL-06, ILL-07)
4. **La setta si può sfruttare (ALTA).**
   - Una setta appena fondata prende Influenza dai soldi versati nel Tesoro: con 40 M versati è subito di livello 3 (ILL-08).
   - Il Tesoro è una cassaforte che la polizia non tocca mai (ILL-11).
   - Il "traditore" entra con un regalo fino a 10 M, tradisce lo stesso Ciclo e se ne va con regalo, premio e 30 Tracce in meno (ILL-09).
   - Gli sconti sulle condanne si sommano: setta, Giudice supremo, avvocato, più un 60% di assoluzione a caso (ILL-12). Il rischio sparisce.
5. **Si sfugge alla condanna senza merito, oppure si è condannati per un dado (ALTA).**
   - La multa si calcola solo su contanti e azioni: chi spende tutto in piani prima dell'Alba del Processo paga 0 € (prova: multa 4,8 M contro 0 M, ILL-10).
   - Gli sporchi si possono nascondere nel Tesoro o regalare a un amico pulito.
   - Al contrario, fermarsi sul Posto di blocco da "Osservato" porta subito alla condanna piena, senza Processo (ILL-13).

Decisioni di Nicola richieste: **12** (segnate con "Serve una decisione di Nicola: SÌ").

---

## ELENCO COMPLETO

### ILL-01 · Manipolare la Borsa 6 volte a notte: soldi infiniti
- **Gravità:** BLOCCANTE
- **Dove:** `motore.js:2593-2636` (`operazione`). Nessun limite per notte. `settaAlFaro` (1930) consuma solo l'ora. `investi`/`vendi` (945-976) si fanno in qualsiasi fase, anche di notte.
- **Come si vede:** `test_manipola.js`, 200 prove. Il Gran Maestro (setta di livello 3, Tesoro 30 M) investe 10 M in SoleTech e resta al Faro tutta la notte: 6 operazioni "su" (+40% ciascuna, riescono 3 volte su 4). Dopo l'Alba rivende per **49,5 M in media** (fino a 70 M). Costo: 6 M di Tesoro. Influenza da 40 a circa 59.
  - Con "giù" si azzerano le azioni di un rivale.
  - Ogni operazione dà +5 Tracce a **tutti** i membri, anche a chi non c'entra (6 operazioni = +30).
- **Proposta (lavoro piccolo):**
  - Al massimo **1 operazione per setta per notte**.
  - "Muovere un titolo" vale una volta per Ciclo sullo stesso titolo.
  - L'effetto arriva all'Alba, non subito, e i soldi guadagnati così contano come pista "soldi" per la Finanza.
- **Serve una decisione di Nicola:** NO.

### ILL-02 · Il banchiere Lenz corrotto non fa niente
- **Gravità:** ALTA
- **Dove:** `motore.js:1075-1099`. `corrotti.banchiere` non viene mai letto: non compare in `protezione` (2770), `aggiornaPiste` (2825) o `ricicla`. Il testo promette effetti in `gioco.js:1871` ("i controlli sui tuoi conti trovano meno") e in `gioco.js:2282` ("sa far sparire i soldi dai registri").
- **Come si vede:** `test_casi.txt` §1. Dopo l'accordo il rischio di perquisizione **sale** (da 0,219 a 0,244, per le +4 Tracce) e non cambia nient'altro. In più paga 375.000 € a ogni Ciclo e rischia gli Affari Interni.
- **Proposta (piccolo):** dargli un effetto vero, per esempio:
  - la pista "soldi" (Finanza) pesa la metà;
  - oppure ripulire al Casinò perde il 10% invece del 15%, e la copertura vale +1 M a Ciclo.
- **Serve una decisione di Nicola:** SÌ. *"Il banchiere Lenz, se lo compri, cosa deve fare per te?"*
  - A) La Finanza ti guarda la metà (i soldi che non tornano pesano meno).
  - B) Ripulisci di più e perdi meno al Casinò.
  - C) Tutte e due, ma costa di più.
  - D) Toglierlo dai corruttibili.

### ILL-03 · "Spegnere un'isola" (blackout della setta) non ha effetto
- **Gravità:** ALTA
- **Dove:**
  - `motore.js:2617-2618` scrive `s.blackout`, che viene letto solo in `iniziaNotte` (1303).
  - L'operazione si fa solo di notte (quindi dopo `iniziaNotte`), e all'Alba `s.blackout = null` (3053).
- **Come si vede:** `test_blackout.js`. 35 blackout riusciti su 50: il pericolo nei posti dell'isola non è cambiato **in nessun caso**.
  - Anche il testo è sbagliato: "niente pericoli negli affari" (`gioco.js:2322`), mentre il blackout del motore porta il posto solo a "tranquillo" (10% di guai).
  - Il motore accetta anche isole inventate: `bersaglio:"Pippo"` passa.
- **Proposta (piccolo):** il blackout vale per l'ora in corso e per quelle dopo (porta subito i posti dell'isola a "tranquillo" e per stanotte dimezza i guai lì), oppure vale per la notte dopo. Controllare che l'isola esista. Correggere il testo.
- **Serve una decisione di Nicola:** NO.

### ILL-04 · Le attività "di copertura/notte" promettono affari che non esistono più
- **Gravità:** ALTA (Nicola vuole "ogni attività con vantaggi diversi e chiari")
- **Dove:** `motore.js:74-80` (perk).
  - Magazzino: "al Porto carichi il 50% in più".
  - Discoteca e Beach club: "apre la bisca clandestina".
  - Galleria: "apre l'affare Falsi d'autore".
  - Questi effetti esistono solo in `affare()` (1012-1070) e nella tabella `AFFARI` (83-89), che nessuna azione chiama: `applica0` (3323-3411) non ha `case "affare"`. È codice morto del vecchio sistema di notte, insieme a `spia`, `pronto`, `N.mosse`, `N.intens`.
- **Come si vede:** di notte la Bisca (tavolo truccato), i quadri falsi (Club) e il Porto si aprono uguali per tutti, con o senza queste attività.
  - Anche "Lavanderia: ti fa ripulire al Casinò" è fuorviante: ripuliscono **tutte** le attività (anche un ristorante, c = 0,3), e l'app dice "con le tue lavanderie, gallerie e magazzini" (`gioco.js:1774`).
- **Proposta (medio):** collegare ogni perk alla notte di adesso. Per esempio:
  - Magazzino: +50% sul guadagno delle occasioni del Porto.
  - Discoteca/Beach club: occasione privata "Tavolo nel tuo locale" in Bisca, solo per te.
  - Galleria: "I quadri falsi" con metà guai.
  - Poi togliere il codice morto.
- **Serve una decisione di Nicola:** SÌ. *"Magazzino, Discoteca, Beach club e Galleria oggi non danno niente di speciale di notte. Cosa preferisci?"*
  - A) Dare a ognuno un affare o un vantaggio suo di notte (proposta sopra).
  - B) Cambiare solo i testi e lasciarli come attività che rendono e ripuliscono.

### ILL-05 · Le pene scritte nell'app sono sbagliate e incomplete
- **Gravità:** ALTA (chiarezza: "il rischio dev'essere sempre chiaro")
- **Dove:**
  - `gioco.js:2203-2212` (`testoPena`), usato nell'app Soldi sporchi e nei riquadri di rischio.
  - Motore: `PENE` (164-169), `condanna` (2896-2936), `mandaAlFaro` (2890), `iniziaTurno` (366-368).
- **Come si vede:** `tel_sporchi.txt` e `occasione_vargas.png`.
  - L'app dice "**4 Cicli** in cella al Faro" (grave) e "6 Cicli" (gravissima). In realtà `faro` conta i **turni di dadi**: 4 turni = 1 Ciclo, e con una condanna media o grave la notte si gioca lo stesso.
  - "Confisca dei soldi sporchi" compare solo per grave e gravissima. In realtà **ogni** condanna, anche lieve, porta via tutti gli sporchi (2911).
  - Media: l'app dice "un'attività chiusa". In realtà chiudono **tutte** le attività a rischio, e solo se hai mai ripulito.
  - Grave: non dice che **tutti** i locali "a rischio" (lavanderie, gallerie, magazzini, discoteche, casinò, banche) vengono sequestrati e finiscono all'asta.
  - Gravissima: non dice che perdi anche il terreno più prezioso e 4 piani del Palazzo.
  - Nessuna pena dice "entrate dimezzate e niente stipendio per 1/2/3 Cicli" (`blocco`).
  - Nessuna pena dice "perdi tutti i contatti corrotti", né che la recidiva alza la gravità di un gradino.
  - Il riquadro dell'affare dice "Reato Media… se arrivi al Processo: 2 Cicli…" anche se il tuo reato peggiore è già Grave. Al Processo conta il peggiore.
- **Proposta (piccolo):** `testoPena` letto dal motore (una funzione `descriviPena(gravita, p)` esportata), con turni veri, locali che perderesti (con nome), sporchi, blocco, contatti. Nel riquadro aggiungere "Il tuo reato peggiore finora: X".
- **Serve una decisione di Nicola:** SÌ. *"La cella al Faro quanto deve durare?"*
  - A) Turni di dadi, come adesso (scriviamo "4 turni").
  - B) Cicli interi, notte compresa (più dura).
  - C) Turni, ma la notte al Faro si perde sempre.

### ILL-06 · Il rischio di notte mostrato non è quello vero
- **Gravità:** ALTA
- **Dove:** `gioco.js:2214-2216` (`boxRischio`) contro `motore.js:1959-1969` (`risolviOccasione`).
- **Come si vede:** `prep_vargas.js` e `occasione_vargas.png`. Al Porto (agitato, 2 notti di calore) con il Commissario Vargas presente l'app mostra **"guai: 54%"**, il motore usa **73%**.
  - Mancano: Vargas presente ×1,35, rito ×0,7, Commissario della setta ×0,85, doganiere ×0,5 all'Aeroporto, polizia raddoppiata ×1,4, Grande Opera Porto = 0.
  - Anche il guadagno mostrato non conta il "lustro" (fino a +40%).
  - Le Tracce mostrate ("circa X") non contano setta, giornalista, contrabbandiere, amnistia.
  - "Gli oggetti salvano… circa 1 volta su 7 va storto" (`gioco.js:1873`) è vero solo la prima volta: poi sale del 10% a ogni uso, fino al 55% (`motore.js:1978`).
- **Proposta (piccolo):** il motore calcola ed esporta `rischioOccasione(s, p, n)` (guai, Tracce, guadagno, falla di ogni oggetto) e l'app mostra quello, con l'elenco dei "perché" ("Vargas è qui: +35%").
- **Serve una decisione di Nicola:** NO.

### ILL-07 · La polizia tira 4 volte a Ciclo, l'app dice "a ogni Alba"
- **Gravità:** MEDIA
- **Dove:** `motore.js:997` (`tiroIndagine` a fine di ogni Giorno) contro `gioco.js:1779`.
- **Come si vede:** `trace1003.txt`, per esempio Ciclo 10: lo stato va 2→3→2→1→0 in un solo Ciclo. Con 40 Tracce la salita è del 29% a tiro, cioè 74% di salire almeno una volta nel Ciclo. La Gazzetta scrive "X è sotto indagine" e due giorni dopo X è "Tranquillo": sembra un caso.
- **Proposta (piccolo):** O 1 tiro all'Alba (più leggibile; per tenere la stessa durezza la formula va tarata, per esempio K = 45), oppure scrivere "4 controlli a Ciclo, uno a fine giornata" e mostrare la probabilità del prossimo controllo.
- **Serve una decisione di Nicola:** SÌ. *"La polizia ti controlla:"*
  - A) Una volta all'Alba (più chiaro, meno su e giù).
  - B) A fine di ogni giorno, come ora, ma lo scriviamo.

### ILL-08 · Una setta nuova prende Influenza dai soldi versati nel Tesoro
- **Gravità:** ALTA (va contro "il livello si guadagna usando il Tesoro")
- **Dove:**
  - `motore.js:2391-2402`: `fondaSetta` non mette `st.influenza = 0`.
  - `influenzaDi` (2245-2251) allora usa la formula delle partite vecchie, Tesoro/1 M.
- **Come si vede:** `test_influenza.js`. Setta appena fondata: Influenza 2, livello 1. Versati 40 M sporchi nel Tesoro: **Influenza 42, livello 3**. Alla prima azione che dà punti, il valore resta così per sempre.
- **Proposta (piccolo):** `st.influenza = 0` alla fondazione. La formula vecchia resta solo per le sette create prima della v59.
- **Serve una decisione di Nicola:** NO.

### ILL-09 · Il traditore e il patto senza vincoli: entro, incasso, tradisco
- **Gravità:** ALTA
- **Dove:** `invitaSetta`/`rispondiInvito` (2404-2431), `tradisci` (2545), `tradimentiAllAlba` (2567), `lasciaSetta`/`espelliSetta` (2432-2448).
- **Come si vede:** `test_casi.txt` §8. C entra con un regalo di 10 M dal Tesoro, chiama subito la polizia e all'Alba:
  - **+10 M sporchi**, il premio pulito e −30 Tracce;
  - il Tesoro della setta perde il 50%; il Gran Maestro e i membri +20 Tracce.
  - Il Gran Maestro non ha nessun segnale: la Prova di fedeltà costa 1 M a tentativo, a caso.
  - Al contrario, il Gran Maestro può chiedere una quota di 10 M e cacciare il nuovo membro subito dopo.
  - Chi lascia la setta subito si tiene il regalo.
  - Ci si può iscrivere a più sette (le spie): la Prova di fedeltà non lo scopre.
- **Proposta (medio):**
  - Il regalo d'ingresso si paga a rate (metà ora, metà dopo 2 Alba da membro).
  - Si può tradire solo dopo 1 Alba da membro (la polizia vuole uno che "sa").
  - Chi esce o è cacciato entro 2 Cicli restituisce il regalo o la quota.
  - Prima dell'Alba del tradimento Vera manda al Gran Maestro un indizio ("un confratello ha fatto una telefonata strana"), così la Prova di fedeltà diventa una scelta e non una lotteria.
  - La Prova di fedeltà scopre anche se il membro è in un'altra setta.
- **Serve una decisione di Nicola:** SÌ. *"Il patto d'ingresso della setta deve essere vincolante?"*
  - A) Sì: chi esce o è cacciato entro 2 Cicli restituisce regalo o quota.
  - B) No, è la giungla, ma il traditore deve essere membro da almeno 1 Alba.
  - C) Tutte e due.

### ILL-10 · La multa della condanna si evita spendendo i contanti
- **Gravità:** ALTA
- **Dove:** `motore.js:2914`: la multa vale `pena.multa × (cash + investimenti)`. Terreni, Palazzo e attività non contano. La Resa dei conti (2805) invece usa il patrimonio.
- **Come si vede:** `test_casi.txt` §3, stessa condanna grave.
  - Con 20 M in contanti: multa **4,8 M**.
  - Con 0 contanti e il patrimonio messo in 30 piani: multa **0 €**.
  - Lo stato 4 ti avvisa ("convocazione del Giudice per l'Alba") e ti lascia ancora un giorno e una notte: basta comprare piani o terreni.
  - Si possono anche regalare contanti o sporchi a un amico (`regala`, 2741: nessuna Traccia). Un giocatore pulito tiene gli sporchi senza rischio di Resa o perquisizione.
- **Proposta (piccolo):**
  - Multa sul patrimonio pulito, come la Resa (con una percentuale più bassa, se serve).
  - Se mancano i contanti, ipoteca forzata o vendita all'asta di un bene.
  - I regali di sporchi lasciano Tracce a chi dà e a chi riceve.
- **Serve una decisione di Nicola:** NO.

### ILL-11 · Il Tesoro della setta è una cassaforte che la polizia non tocca
- **Gravità:** MEDIA
- **Dove:** `versaSetta` (2449-2455): versare sporchi non lascia Tracce. Condanne e perquisizioni prendono solo `p.sporchi`. Il Tesoro esce di nuovo al Gran Maestro (5% a ogni Alba in sporchi, 2984) e ai membri (Lavanderia, regali d'invito).
- **Come si vede:** `test_casi.txt` §4. 7 M sporchi versati prima del Processo: confisca 0, Tracce invariate.
- **Proposta (piccolo):** versare sporchi lascia Tracce (come ripulire). Al Processo del Gran Maestro la Procura sequestra il 30% del Tesoro. Il Tesoro sepolto resta l'unico posto davvero sicuro (dà senso al seppellire).
- **Serve una decisione di Nicola:** SÌ. *"Il Tesoro della setta deve essere al sicuro dalla polizia?"*
  - A) Sì, sempre (com'è ora).
  - B) No: se condannano il Gran Maestro, la polizia ne prende una parte. Solo il Tesoro sepolto è sicuro.

### ILL-12 · La setta toglie il gusto del rischio: gli sconti si sommano e il Giudice tira una moneta
- **Gravità:** ALTA
- **Dove:** `condanna` (2896-2910), `resaDeiConti` (2802-2804), `protezione` (2770-2776).
- **Come si vede:**
  - Un membro condannato per un reato grave:
    - −1 gradino (setta), −1 (Giudice supremo), −1 (avvocato): diventa lieve;
    - poi, se la setta ha reclutato il Giudice, **60% di assoluzione a caso**: stato 0, Tracce dimezzate, reato cancellato.
  - Protezione: setta di livello 3 + Commissario della setta + Vargas corrotto arriva al tetto 0,7, cioè i controlli contano solo il 30%.
  - Due sette sommano la protezione (`test_casi.txt` §7: perquisizione dal 13,8% al 10,3%).
  - Il 60% è proprio un "esito a caso senza motivo" e l'app dice solo "Spesso alleggerisce" (`gioco.js:2328`).
- **Proposta (medio):**
  - Al massimo 1 gradino di sconto da setta e Giudice insieme (l'avvocato resta a parte).
  - Il Giudice reclutato, invece del 60% a caso, assolve **solo** se contro di te non ci sono Prove dei rivali e il reato non è gravissimo (motivo chiaro), oppure fa sempre −1 gradino.
  - La protezione delle sette non si somma tra più sette.
- **Serve una decisione di Nicola:** SÌ. *"Il Giudice della setta deve:"*
  - A) Assolvere 6 volte su 10, a caso (com'è ora).
  - B) Abbassare sempre la pena di un gradino.
  - C) Assolvere solo se nessun rivale ha prove contro di te.

### ILL-13 · Posto di blocco: condanna piena per un tiro di dadi
- **Gravità:** MEDIA
- **Dove:** `motore.js:509-516`.
- **Come si vede:**
  - Chi si ferma sul Ponte Est da Osservato (stato ≥ 2) è **condannato subito**, con la gravità del suo reato peggiore, recidiva compresa: senza Processo, senza protezioni, senza poliziotti comprati.
  - Con più di 25 Tracce succede a caso.
  - Se non hai nessun reato, condanna "lieve" lo stesso.
  - Nelle simulazioni: 20 condanne su 227 vengono da qui. Anche le gravissime.
- **Proposta (piccolo):** il Posto di blocco diventa un **fermo**: perquisizione immediata (stessa regola dell'Alba) e +1 gradino di stato. Le protezioni valgono. Mostrare il rischio sulla casella quando ci passi vicino.
- **Serve una decisione di Nicola:** SÌ. *"Al Posto di blocco, se la polizia ti tiene d'occhio:"*
  - A) Condanna subito (com'è ora).
  - B) Perquisizione e un gradino in più verso il Processo.
  - C) Solo perquisizione.

### ILL-14 · Asta dei sequestrati: si vende un terreno vuoto, il locale sparisce
- **Gravità:** MEDIA
- **Dove:** `sequestra` (348-352) azzera livello e attività. `avviaAstaSequestro` (353-361) parte da metà del prezzo del terreno.
- **Come si vede:** un casinò di livello 5 sequestrato diventa un terreno vuoto. Nessuno all'asta compra "il casinò del boss caduto". Bug minore: se nessuno può partecipare (tutti al Faro), il lotto esce dalla coda e non torna più all'asta.
- **Proposta (piccolo):** il locale resta (livello −1) e si vende a metà del suo valore. Rimettere in coda il lotto se l'asta non parte.
- **Serve una decisione di Nicola:** SÌ. *"I locali sequestrati all'asta:"*
  - A) Si vendono con il locale (livello meno 1), a metà prezzo.
  - B) Si vendono come terreno vuoto (com'è ora).

### ILL-15 · Il Banchiere della setta ripulisce gratis
- **Gravità:** MEDIA
- **Dove:** `motore.js:2980-2983`.
- **Come si vede:** `test_casi.txt` §6. A ogni Alba porta da sporchi a puliti il 10% (fino a 500.000 €) di **ogni** membro, 1 a 1: zero perdita, zero Tracce, non conta per la Finanza (`ripulitiCiclo` non sale) e dà anche Influenza.
- **Proposta (piccolo):** commissione del 10%, conta in `ripulitiCiclo`, +1 Traccia per milione.
- **Serve una decisione di Nicola:** NO.

### ILL-16 · Nascondere le tasse: +2 Tracce fisse, anche se evadi milioni
- **Gravità:** MEDIA
- **Dove:** `motore.js:2973-2974`.
- **Come si vede:** chi ha 20 M di rendite all'Alba ne fa diventare 6 M sporchi (30%) con solo +2 Tracce e reato "lieve". Così un giocatore pulito arriva agli 8 M sporchi della setta quasi senza rischio.
- **Proposta (piccolo):** Tracce = 2 + 1 per milione evaso. Il controllo fiscale (evento e carta Gazzetta) dà Tracce in base all'importo.
- **Serve una decisione di Nicola:** NO.

### ILL-17 · La Finanza conta soldi che non hai ripulito
- **Gravità:** BASSA
- **Dove:** `motore.js:1124`: `ripulitiCiclo += importo` (quello chiesto), anche se la copertura o il limite di 5 M del paradiso ne fanno passare meno.
- **Come si vede:** `test_casi.txt` §10. Ripuliti davvero 0,97 M, ma per la Finanza 5 M: la pista "soldi" cresce senza motivo.
- **Proposta (piccolo):** contare l'importo vero (`q`).
- **Serve una decisione di Nicola:** NO.

### ILL-18 · Le attività "a rischio" danno Tracce per sempre dopo il primo lavaggio
- **Gravità:** MEDIA
- **Dove:** `motore.js:2957` (`p.affariStanotte.length || p.riciclTot`). `riciclTot` si azzera solo con una condanna. L'app dice "aggiungono Tracce **se stanotte** hai ripulito" (`gioco.js:2275`).
- **Proposta (piccolo):** usare `p.ripulitiCiclo > 0` (stanotte) come dice il testo.
- **Serve una decisione di Nicola:** NO.

### ILL-19 · Interazione tra giocatori debole: denuncia gratis, ricatto promesso ma assente
- **Gravità:** MEDIA
- **Dove:** `denuncia` (1136-1143): costo 0, nessun rischio, in qualsiasi fase. Le Prove non scadono mai e pesano già sulle piste del rivale (2859) anche se non le consegni: la scritta "Qualcuno ha fatto arrivare alla polizia una prova" è falsa. Glossario `gioco.js:1909`: "puoi denunciarlo **o ricattarlo**": il ricatto non esiste.
- **Come si vede:** i bot non usano mai foto e denunce. Una persona vera le usa senza pensarci, perché non costano niente. L'unico altro attacco è l'"Inchiesta pilotata" (livello 4).
- **Proposta (medio):**
  - **Ricatto:** con una Prova mandi una richiesta segreta ("1 M o la consegno"). Lui paga (la Prova si distrugge) o rifiuta (la consegni tu). Usa il sistema dei Contratti.
  - **Vendere** una Prova al diretto interessato.
  - Una denuncia con una Prova vecchia (oltre 3 Cicli) vale la metà.
  - Una denuncia fa salire di poco anche le Tracce di chi denuncia ("la polizia chiede da dove viene la foto").
  - Le Prove tenute in tasca **non** pesano finché non le consegni.
- **Serve una decisione di Nicola:** SÌ. *"Con una Prova contro un rivale vuoi poter:"*
  - A) Solo denunciarlo (com'è ora, ma con qualche costo).
  - B) Anche ricattarlo per soldi.
  - C) Anche rivendergliela.

### ILL-20 · Le scelte del Gran Maestro ricadono su chi ha votato contro
- **Gravità:** MEDIA
- **Dove:**
  - `operazione` (2610): +5 Tracce a ogni membro per ogni operazione.
  - Grande Colpo fallito (2364-2366): tutti i membri +35 Tracce e Indagati, anche chi ha votato NO.
- **Come si vede:** un membro onesto di una setta con un Gran Maestro aggressivo prende +30 Tracce in una notte senza aver fatto niente e senza saperlo prima.
- **Proposta (piccolo):** le Tracce delle operazioni le prende il Gran Maestro (più 1 Traccia agli altri). Al Grande Colpo chi ha votato NO prende metà danno.
- **Serve una decisione di Nicola:** SÌ. *"Se il Gran Maestro fa un colpo e va male, chi ha votato contro:"*
  - A) Paga come gli altri (la setta è una).
  - B) Paga la metà.
  - C) Non paga.

### ILL-21 · A fine partita il Tesoro della setta vale zero
- **Gravità:** MEDIA
- **Dove:** `patrimonio` (221-226) non conta il Tesoro. `fine` (3157-3171) lo mostra solo nella "rivelazione".
- **Come si vede:** la decima dei membri (15% delle rendite) a fine partita è persa. Il Gran Maestro furbo svuota il Tesoro prima (regali d'invito a un amico), gli altri no.
- **Proposta (piccolo):** a fine partita il Tesoro, Tesoro sepolto compreso, si divide tra i membri come sporchi (al 25%), o va al Gran Maestro. Avvisare con la Resa dei conti.
- **Serve una decisione di Nicola:** SÌ. *"A fine partita i soldi nel Tesoro della setta:"*
  - A) Si dividono tra i membri.
  - B) Vanno al Gran Maestro.
  - C) Si perdono (com'è ora, ma lo scriviamo).

### ILL-22 · La Retata nomina un'isola ma colpisce tutta la Laguna
- **Gravità:** BASSA
- **Dove:** `regista` (3116): "Retata della polizia a Borgo Ambra" alza il pericolo di **tutti** i posti (1304). In più l'isola si sceglie tra 4 (Corona esclusa).
- **Proposta (piccolo):** la retata alza il pericolo solo nei posti di quell'isola (+2), oppure il testo dice "in tutta la Laguna".
- **Serve una decisione di Nicola:** NO.

### ILL-23 · Altri errori piccoli del motore
- **Gravità:** BASSA
- **Proposta:** lavoro piccolo per tutti. **Serve una decisione di Nicola:** NO.
- **Elenco:**
  - Condanna gravissima: si perdono 4 piani, ma le stanze del Grattacielo restano (`motore.js:2925` taglia solo `funzioniPiani`, non `p.stanze`). Prova: `test_casi.txt` §9 (12 piani con eliporto, piani segreti e suite).
  - **Operazione** con bersaglio sbagliato: il Tesoro si scala prima del controllo (2608). Nella partita locale (`locale.js:84`) l'errore lascia lo stato cambiato: −1 M e +5 Tracce a tutti per niente (`test_casi.txt` §12). Il server non salva, quindi lì va bene. Controllare il bersaglio **prima** di pagare.
  - `operazione: fantoccio` scrive `s.sindacoFino`, che nessuno legge: il "Sindaco per 2 Cicli" dura fino alle prossime elezioni.
  - "Segui" un rivale (1655) vale solo se lo scegli **prima** che lui agisca nella stessa ora: dipende da chi clicca prima. Scoprire il Tesoro sepolto (2523) diventa una gara di velocità. Va risolto alla fine dell'ora.
  - `jetSetta` (2478) sposta subito senza usare l'ora: ci si può teletrasportare e agire nella stessa ora.
  - L'offerta del boss straniero (3117) "stanotte" non scade mai e arriva anche a chi non fa affari.
  - "Al Faro puoi solo ricevere visite" (1010): le visite non esistono.
  - L'app Setta sparisce di nuovo se gli sporchi scendono sotto 8 M e non sei ancora in una setta (`gioco.js:1478`). Un'app sbloccata dovrebbe restare.
  - Fama ≥ 60: Tracce ×1,25 ai controlli e alla Resa (2870, 2793). Non è scritto da nessuna parte.
  - Ultima Alba: chi è al Processo viene condannato e subito dopo può prendere anche la Resa dei conti, se il caveau gli ha salvato degli sporchi (doppia pena).

### ILL-24 · (Altro settore, ma grave) La vista manda ai giocatori dati segreti degli altri
- **Gravità:** ALTA (imbroglio)
- **Dove:** `motore.js:3416-3424` (`vista`) e `server/index.ts:40` (`ALTRI_SEGRETI`).
- **Come si vede:** `test_casi.txt` §2.
  - Il clone di stato contiene **`manoSM` di tutti, con il mazzo** (si vede l'ordine delle carte di Sette e mezzo).
  - Degli altri si vedono anche: `refurtiva` (chi ha comprato dal Ricettatore stanotte e per quanto), `nascondigli`, `trucchi` (quali oggetti l'hanno salvato), `lavato`/`ballo` (nel motore; il server ne toglie una parte).
- **Proposta (piccolo):** in `vista` cancellare `v.manoSM` e i campi sopra per gli altri. Meglio un elenco di campi **ammessi** invece di quelli vietati.
- **Serve una decisione di Nicola:** NO.

---

## Cosa funziona bene (da non toccare)
- Le **piste** con il motivo ("Perché: …") quando sali di gradino: è proprio il "ti scoprono sempre per un motivo" di Nicola.
- Il **calore dei posti** (pallini) e la Finanza contro le rendite legali: spingono a variare e a "giustificare" i soldi.
- La **polizia occupata** con chi è Indagato: crea interazione indiretta.
- Il riquadro rischio con gli oggetti che ti salvano: chiaro (resta solo da rendere esatti i numeri).
- Grandi Opere con rischio scritto accanto: molto chiaro.
- Gli affari della setta al Faro (carico della confraternita, senatore) danno un vero motivo per entrare in setta.

## File di prova
- `sim.js`, `sim2.js`: statistiche di 20-40 partite coi bot.
- `trace.js` → `trace1003.txt`: vita di un giocatore sporco ciclo per ciclo.
- `test_casi.js` → `test_casi.txt`: 15 prove mirate (Lenz, vista, multa, Tesoro, Lavanderia, Banchiere, due sette, traditore, gravissima, Finanza, ShadowCoin, operazioni, fine partita, denuncia, probabilità).
- `test_manipola.js`, `test_blackout.js`, `test_influenza.js`: ILL-01, ILL-03, ILL-08.
- `crea_stato.js` + `foto2.js`: partita locale avanzata caricata nel browser. Foto: `tel_sporchi.png`, `tel_setta.png`, `occasione_vargas.png`.
