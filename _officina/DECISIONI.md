# DECISIONI DELL'ORCHESTRATORE (18/11/2026) — valgono per tutti i coder

Nicola è fuori e ha dato consenso pieno: "appena hai idee, lavoratori, agenti, output chiari, agisci senza il mio consenso". Ha chiesto: massimo impegno; ogni lavoro "finito" passa 3 giri di critica a freddo. Limiti: niente crediti a pagamento; non rompere la partita vera (8e8dfc20-…, Ciclo 14, Nicola+Sabri+3 bot); niente scelte irreversibili.

Dove una decisione sotto non basta, vale la proposta "consigliata" del rapporto del settore (/home/claude/prove/rapporti/*.md). Se due rapporti si contraddicono, vale questo file. Se resta un dubbio vero, scegli l'opzione più reversibile e scrivila nel tuo resoconto.

## G — Regole generali
- G1 PARTITE IN CORSO. Correzioni di bug, exploit, sicurezza, chiarezza e funzioni nuove additive → valgono per TUTTE le partite. Numeri di bilanciamento che cambiano i conti (rendite, soglie, prezzi, percentuali) → solo partite NUOVE: alla creazione `s.gen = 2`; helper `gen2(s)` = `(s.gen||1) >= 2`; i numeri vecchi restano per gen 1. Ogni campo nuovo dello stato deve avere un valore di ripiego (le partite vecchie non lo hanno). Prova obbligatoria prima di pubblicare: lo stato della partita vera (letto in sola lettura) deve girare nel motore nuovo coi bot per 3 Cicli senza errori.
- G2 Numero di versione nel motore (`VERSIONE`), mostrato in un angolo; il browser avvisa se il server ha una versione diversa ("ricarica la pagina").
- G3 Convenzioni: quelle del rapporto coder.md §5.5. Dopo ogni modifica `REPO=<copia> /home/claude/prove/coder/controlla.sh veloce`.
- G4 Commit: messaggi in italiano, in fondo le due righe:
  Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01P32BM5HiQieVkD6nraGnPP
  Nessuno fa push, deploy o tocca ?v= e server/: lo fa solo l'orchestratore alla fine.

## 3D — "deve essere la foto, in 3D"
- Strada scelta: Proto 3 "Diorama a livelli" (foto in rilievo + volo dentro le isole). Diventa la vista normale. Il vecchio mondo a cubetti esce dal gioco (resta solo dietro ?cubetti per confronto, poi si toglie).
- Pezzi di gioco sopra la foto: devono sembrare parte della foto, non giocattoli. Proprietà = bandiera e contorno luminoso del colore del giocatore (il colore del giocatore è quello che salta all'occhio; il quartiere si legge dal nome e dalla scheda). Edifici dei giocatori: materiali e colori campionati dalla foto, ombre morbide, crescono con i livelli. Pedine: auto sportive uguali, del colore del giocatore, con il segnaposto col nome sopra. Barche: solo decorazione, per ora.
- Visuali: "Arcipelago" (tutto), "Segui" (zoom sulla tua pedina), tocco su un'isola = volo dentro. Niente rotazione libera e niente "Alto" a piombo (la foto non lo regge).
- Robustezza: three.js dentro il repo (vendor/), caricamento con tempo massimo; se WebGL non parte, avviso chiaro con il motivo e si gioca sulla foto piatta; la vecchia scelta "2D" salvata nel browser va ignorata (chiave nuova); un solo selettore "Vista" ben visibile.
- Finestre di scelta: di lato, senza velo sopra il tabellone; i comandi della vista restano usabili.
- Prestazioni: ridisegnare solo quando serve; obiettivo 60 fps su Mac M1, telefono usabile.
- Immagini nuove con ElevenLabs (notte allineata, vedute delle isole): NON generarle (crediti). Preparare l'elenco preciso per Nicola.

## GIORNO
- Livello 3 con 2 vie su 3 del gruppo; gruppo intero per i livelli 4-5 (gen2). Scambi coi bot possibili.
- Affitti: crescono con l'attività; gruppo completo = +50% anche sulle attività (gen2). Carte del tabellone con importi in percentuale e con una scelta (gen2).
- Le caselle-imprevisto si chiamano "Voci di piazza" (la Gazzetta è solo il giornale).
- Permessi: niente esito a caso senza motivo. Approvato sicuro se paghi; può essere rimandato solo per un motivo scritto prima (es. Sindaco rivale, indagine in corso) (gen2). Terreni iniziali di valore equivalente (gen2).
- Palazzo: resta "un piano per mossa" e il Cantiere grande dall'Attico (già deciso da Nicola). Rendita dei piani: `pianoRendGrow` 1,05 come da economia ECO-01 (gen2).
- Aste: chi rifiuta di comprare non può offrire in quell'asta; base d'asta 60% del valore, sotto non si vende (tutte le partite: è un exploit).
- Tempo massimo online: asta 60 s (poi "non offro"); turno 3 minuti senza mosse → il computer gioca prudente al suo posto finché non torna; chi ha creato la partita ha anche un tasto per farlo subito.
- Chi non può pagare: resta il debito automatico, ma con finestra chiara (quanto, che tasso). Tasso scritto uguale dappertutto.
- Leggi del Sindaco: durano fino alle prossime elezioni; non si firmano due volte.
- Ipoteca: pulsante nell'app Banca con il rischio scritto; chi compra un terreno ipotecato lo vede prima.
- Viaggio rapido: mostra anche le mete chiuse e cosa serve.
- Hotel di lusso: rende 15% meno del Ristorante ma dà fama (gen2). Ogni attività ha un "perché sceglierla" in una riga.
- 3 dadi: si mostra la somma. Dopo "Fine turno" niente dadi del prossimo finché le tue animazioni non sono finite; in alto il nome giusto di chi gioca.
- Tutti i testi che contraddicono il motore vanno corretti (elenchi in giorno.md GIO-05 e chiarezza.md CH-02).

## ECONOMIA (gen2 dove cambia i numeri)
- Obiettivo partite lunghe: vincitore a qualche centinaio di milioni, non miliardi (ECO-01 B).
- Affari della notte: valgono di più salendo di Livello (ECO-02 B). Decima e multe: come consigliato nel rapporto.
- Fortuna: un po' meno (ECO-03 B).
- Livelli: soglie più basse nelle partite corte (ECO-04 B).
- Tesoro della setta a fine partita: metà al Gran Maestro, metà divisa tra i membri (gen2).
- Restano tutte e 8 le storie.
- Bug dei soldi (contratto senza limiti, contanti negativi alla Resa, NaN): correggere per tutte le partite.

## ILLEGALE / SETTA / POLIZIA
- Exploit da chiudere per tutte le partite: spinta in Borsa (una per titolo e per notte, con tetto), Influenza dai soli versamenti (i versamenti non danno Influenza: solo l'uso), traditore con regalo, multa evitata spendendo tutto (la multa si calcola sul patrimonio e si paga anche a debito), sporchi nascosti nel Tesoro o regalati senza Tracce.
- Cose promesse che non fanno niente: o funzionano o spariscono dai testi. Lenz comprato: la Finanza ti guarda la metà. Blackout della setta: deve avere l'effetto promesso. Magazzino, Discoteca, Beach club, Galleria: ognuno un suo vantaggio di notte (proposta del rapporto).
- Faro: sono turni di dadi → scrivere "turni". Controlli della polizia: restano come sono (a fine di ogni giorno) ma scritti chiari ovunque.
- Rischio mostrato = rischio vero (contare Vargas, doganiere, setta, leggi).
- Patto d'ingresso: vincolante (chi esce o è cacciato entro 2 Cicli restituisce) e il traditore deve essere membro da almeno 1 Alba.
- Tesoro: se condannano il Gran Maestro la polizia ne prende una parte; solo il Tesoro sepolto è sicuro (gen2).
- Giudice della setta: abbassa sempre la pena di un gradino (niente 60% a caso); gli sconti non si sommano oltre un tetto.
- Posto di blocco da "Osservato": perquisizione + un gradino verso il Processo (non condanna piena).
- Asta dei sequestrati: resta terreno vuoto. Colpo fallito: chi ha votato contro paga la metà.
- Tracce: barra a 5 tacche senza numero, sempre visibile al giocatore (solo le sue).
- Pene spiegate tutte prima (sequestro locali a rischio, blocco entrate, perdita sporchi).

## NOTTE
- Casinò privato: niente ripulitura gratis (sporchi dentro → sporchi fuori).
- Proposte tra giocatori (drink, sfida, affare): restano finché l'altro risponde o finisce l'ora; si vedono anche se ha già premuto Avanti. I bot si propongono cose tra loro e ai giocatori.
- Carte: Sette e mezzo, chiamato col suo nome ovunque. Prima l'altro accetta, poi giocano tutti e due, alla fine si vedono le carte. Il banco gioca con una regola vera. Mani e mazzo MAI nella vista degli altri.
- Personaggi famosi: un posto alla volta, si spostano ogni ora.
- Più di 3 scelte: 3 + "Altro…" (mai sparire in silenzio).
- Alba e "Com'è andata": dicono tutto ciò che è successo (sequestri, perquisizioni, fama, netto).
- Tempi morti: viaggi brevi con una scena; niente schermo vuoto. Finestre del giorno mai di notte.
- Prime notti: i luoghi chiusi si vedono col lucchetto e cosa serve; dalla prima notte c'è un affare losco piccolo (poco guadagno, poco rischio, rischio scritto) (gen2).
- Privé / megayacht chiusi: dire quanto manca.
- Affari: esito con un attimo di suspense (animazione breve), non un clic secco.
- Scene animate complete e Ballo anonimo tra giocatori: dopo, non in questo giro.

## CHIAREZZA
- La consigliera si chiama Bianca (la tua segretaria), non Vera.
- App: all'inizio 5 (Imprese, Agenzia, Messaggi, Gazzetta, Il mio impero); le altre compaiono quando servono, con avviso "Nuova app" e due righe di spiegazione. Vale per guidata e senza consigli (senza consigli: niente suggerimenti di Bianca).
- Slide iniziali: restano 6 (le ha chieste Nicola) ma corte: massimo 45 parole l'una, regole vere.
- Parole: "Livello" solo per il giocatore; stelle per le attività; "Grado" per la setta. Glossario unico del rapporto chiarezza.
- Esiti mai in silenzio: permesso rimandato/negato, debito, "non hai abbastanza soldi" → sempre un avviso a schermo.
- "Sei salito di livello": messaggio giusto. Terreno iniziale, stipendio, affari toccando un rivale: spiegati al momento giusto.

## ESTETICA / AUDIO
- Stile unico "Oro e Inchiostro" (rapporto estetica): variabili CSS, niente stili sparsi nuovi.
- Telefono vero: interfaccia sistemata in verticale (ritocchi.css provati) e usabile in orizzontale; il telefono del gioco a tutto schermo sui telefoni veri. Mac 1024x768: niente pannelli accavallati; registro richiudibile.
- Musica: deve funzionare su iPhone (niente volume da codice sull'elemento: usare WebAudio), mai due brani insieme, loop senza salto.
- Suoni (sintetizzati, gratis): dadi, acquisto, affitto, Alba, polizia, salita di livello, vittoria.
- Fine partita: schermata vera con classifica, "Cronaca della partita" (i momenti chiave) e titoli.

## ONLINE
- Rientro: chi ha già il posto rientra sempre; in più codice personale di rientro per cambiare dispositivo.
- Assente: vedi Giorno (computer al suo posto dopo il tempo massimo).
- Rete: controllo leggero della versione, la vista si scarica solo se è cambiata. Doppio clic: una mossa sola (blocco nel browser + controllo di versione sul server). I bot non mostrano i loro segreti. Due che entrano insieme non prendono lo stesso posto. "Ricomincia partita" chiede conferma.

## DINAMICHE NUOVE (dai due creatori; specifica: /home/claude/prove/creatori/ACCORDO.md)
Senso del gioco: "La Laguna è piccola: tutti sanno qualcosa di te". Si costruiscono, in quest'ordine: 1) I Favori, 2) Il Ricatto (una Prova = un Favore), 3) I Servizi dei contatti (transenna, Vargas, Lenz, doganiere), 4) La Fedina pulita (Esposto, Inchiesta, Opera pubblica) — le funzioni esclusive della vita pulita. Valgono per tutte le partite (sono funzioni, non soldi). Nessuna app nuova: entrano nelle app esistenti e nelle scene. Dopo, se resta tempo: elezioni col voto vero.
