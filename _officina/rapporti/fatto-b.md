# Resoconto Coder B — Notte, polizia, setta (IN CORSO)

Copia: `/home/claude/lav-b`, ramo `lav-b`. File toccato: `motore.js`. Aggiornato dopo ogni commit.

## Commit

| Commit | Cosa |
|---|---|
| `cde7343` | Setta, Borsa, polizia: exploit chiusi; pene con una sola funzione |

## Fatto (commit cde7343) — NON ancora provato con casi.js (da aggiungere in casi-b.js)

| ID | Stato | Cosa |
|---|---|---|
| ILL-01 | fatto | 1 operazione per setta per notte (`st.opNotte`); un titolo si muove 1 volta per notte (`s.spinte`); tetto ±50% dal prezzo dell'ultima Alba; spinta forte 0,25 in gen2 (`N_GEN2.spintaForte`); i guadagni di carta dei membri contano per la Finanza |
| ILL-03 | fatto | Blackout della setta: vale subito (`s.notte.blackout`), posti dell'isola "tranquilli". Manca ancora: guai dimezzati (arriva con rischioOccasione) |
| ILL-08 | fatto | `fondaSetta` mette `influenza: 0`; `versaSetta` ferma l'Influenza delle sette vecchie prima del versamento |
| ILL-09 | fatto | `st.ingressi[id] = {ciclo, regalo, quota, quotaSporchi}`; `sciogliPatto` (restituzione entro 2 Cicli); tradire solo dopo 1 Alba; indizio al Gran Maestro |
| ILL-10 | fatto | Multa = `MULTA_CONDANNA` (4/8/16/30%) × patrimonio pulito, pagata con `paga` (anche a debito). Vale per tutte le partite |
| ILL-11 | fatto | Sporchi versati nel Tesoro: 2 Tracce per milione. gen2: se condannano il Gran Maestro la Procura prende il 30% del Tesoro (non il sepolto) |
| ILL-12 | fatto | `gravitaFinale`: setta, Giudice, Giudice supremo, avvocato = 1 gradino l'uno, tetto 2. Tolto il 60% a caso. Protezione: conta solo la setta migliore |
| ILL-13 | fatto | Posto di blocco: `perquisisci` + un gradino di stato, con il motivo. Niente condanna |
| ILL-14 | fatto (bug) | Il lotto sequestrato resta in coda se nessuno può partecipare |
| ILL-19 | parte | Le Prove pesano solo dopo la denuncia (`p.denunce`). Ricatto: non fatto (è nelle Dinamiche nuove) |
| ILL-20 | fatto | Operazioni: +5 Tracce al Gran Maestro, +1 agli altri. Colpo fallito: chi ha votato NO +18 Tracce e Osservato |
| ILL-23 | parte | Stanze perse con i piani; niente doppia pena all'ultima Alba; `sindacoFino` tolto |
| ILL-02 | parte | Lenz comprato: pista dei soldi dimezzata |

## Da fare (in ordine)
NOT-01 proposte, NOT-02 casinò privato, PT-08 Sette e mezzo, rischioOccasione + vista (ILL-05/06, NOT-06, tacche), Alba (NOT-04), ILL-04, ILL-15/16/17/18, NOT-07/15, PT-01, COD-10, bot.

## Richieste per altri coder
- (in arrivo)

## Rischi
- Multa sul patrimonio: molto più pesante di prima per chi ha tanto Palazzo e pochi contanti. Vale anche per la partita vera.
- `controlla.sh veloce` passo 7 (server-finto, prove ONLINE) fallisce anche senza le mie modifiche: è del coder dell'online.
