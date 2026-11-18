# Re della Laguna — stato al 18/11/2026 (dal documento del Project)

## Dove sta il gioco
- Online: https://nicolafistarol.github.io/re-della-laguna/?v=65. Partita vera di Nicola con la sorella: 8e8dfc20-6656-4c79-a69c-e5e1cd3773c1 (NON toccarla).
- Server: Supabase progetto eqnrzboulnzkjuyhqsvu, schema "laguna", funzione "laguna" v49. Il browser usa motore.js di GitHub per mostrare, il server per decidere.
- ATTENZIONE codice: nei template `${...}` su una riga non usare `//`. vista() non deve mai modificare lo stato vero. influenzaDi() calcola senza scrivere.
- Prove: sim con bot (riferimento: 12 Cicli ~100-105 M patrimonio vincitore, 16 Cicli ~440-520 M, 0 errori).

## Fatto di recente (v59-v65)
- Setta: livello = Influenza (soglie 12/35/70), guadagnata usando il Tesoro (operazioni, riti, personaggi, lavanderia, Grandi Opere). Lavanderia della setta (70% puliti, max 1 M per livello per Ciclo). Grandi Opere votate (Amnistia, Porto, Grande Colpo, Giudice supremo, Isola della setta).
- Tabellone tutto in 3D (mondo3d.js: isole modellate, città, strada ad anello con ponti, mare, faro; lotti con piastre/cartelli/bandiere; auto come pedine; visuali Segui/Libera/Alto). Nicola dice che da lui non si vede in 3D.
- App "I miei conti", riquadro "Com'è andata" di notte, perquisizioni all'Alba per Tracce, personaggi famosi nei locali, stanze nuove del Palazzo, Ricettatore, Ballo in Maschera, orologio della notte dal server.
- Musica originale (giorno.mp3, notte.mp3): da giudicare da Nicola ("deve essere intrigante").
- Politico indebolito (fama iniziale 20, licenza casinò 75%, malus rielezione).

## Ancora da fare
- Scene della notte animate e luoghi interattivi.
- Isole 3D che si toccano; prestazioni su Mac M1 (ombre su ~800 oggetti).
- Estetica generale.

## Decisioni di Nicola (NON contraddire)
- App del telefono sbloccate man mano, chiare. Modalità guidata e senza consigli.
- Setta: 8 M sporchi per vederla, 5 M per fondarla; invito con patto; si può cacciare.
- Rischio dell'illegale sempre chiaro. Ti scoprono sempre per un motivo (le piste). Il rischio ha gusto: chi rischia sa che rischia.
- Vita pulita e sporca pagano bene; la sporca è più bersagliata ma paga di più se giocata bene.
- Il gioco non deve diventare più facile, deve diventare più chiaro.
- Palazzo: un piano per mossa, prezzo che sale; Palazzo/Attico/Grattacielo con stanze.
- Di notte non si sa chi c'è in un locale prima di arrivarci. I giochi di carte si giocano davvero.
- Tabellone tutto in 3D. Vuole sentirsi DENTRO il mondo (arcipelago con isola centrale di grattacieli, 4 isole colorate, ponti ad anello, porto), non un Monopoly. Vuole edifici che crescono con i piani ed esplorare dall'alto.
- Soldi visibili per affitti e cose pubbliche, nascosti per affari loschi e privati.
- Ogni tipo di attività deve avere vantaggi diversi e chiari.
- Partita: durata scelta dai giocatori (Cicli, obiettivo o libera).
- Il suo problema principale: i giocatori non conoscono molte funzioni; serve chiarezza, Gazzetta scenica, telefono chiaro.
- Gioca online con sorella e amici (amici su Windows). Il suo computer: Mac M1 2020.
EOF
