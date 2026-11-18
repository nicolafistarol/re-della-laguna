# Resoconto Coder A — Giorno, economia, alba (IN CORSO: aggiornato dopo ogni commit)

Copia: /home/claude/lav-a (ramo lav-a). Prove: /home/claude/prove/coder-a/ (base-sim-*.txt = prima; forza-gen1.js = forza gen 1).

## Commit fatti
| Commit | Cosa |
|---|---|
| 80158ad | Aste (PT-02, GIO-07) — tutte le partite |
| (2°) | Bug e chiarezza del giorno — tutte le partite (GIO-05, 09, 10, 11, 13, 14, 16, 18, 25, PT-04, 13, 14) |

## Base (prima di tutto, 60 partite, 4 bot)
8 Cicli 32,1 M · 12 Cicli 102,6 M · 16 Cicli 438,5 M · 20 Cicli 1.704,3 M (mediana del vincitore).
Impronte base: 8=80e060d4c019, 12=6b9dc4c0c6e0, 16=1f28762e4f90, 20=32465c02275f.

## Impronta gen 1
Le correzioni per TUTTE le partite cambiano per forza l'impronta (lo chiede DECISIONI: aste = exploit, GIO-13 = bug).
Dopo il 2° commit, gen 1 forzata: 12 Cicli fd2ca175dd0d (104,4 M), 16 Cicli 875937179bff (463,1 M).
Da qui in poi i numeri gen2 NON devono piu' cambiarla (verifica in fondo).

## Campi e azioni nuove (per interfaccia e bot)
- `s.pending` (asta): in piu' `minimo` (sempre), `escluso` (chi ha rinunciato / ex padrone), `inizio` (ora). `partecipanti` non contiene chi ha rinunciato ne' chi non ha la base in tasca.
- `s.ultimaAsta` (pubblico): { n, ciclo, giorno, lotto, nome, prezzo, minimo, sequestro, escluso, offerte:{id:importo}, vincitore, importo, pari }.
- `L.N.astaBase` = 0,6. Un'offerta a testa: la seconda viene rifiutata.
- `s.ultimaCarta.n`; `p.esitoCarta` (privato): { n, testo, esito }.
- `L.leggiInVigore(s)`, `L.prossimeElezioni(s)` (DA ESPORTARE: vedi sotto "API").
- `proposta.ipoteca` = { ipoteca, riscatto, scadeCiclo, restano } se il terreno e' ipotecato; `L.infoIpoteca(s, l)`.
- `p.avvisoDebito` (privato): { n, ciclo, giorno, dovuto, contanti, venduto, debito, debitoTotale, tasso, a }; `L.tassoDebito(s, p)`.
- Alba: `riepilogo.tassoDebito`, `debitoPagato`, `debitoResta`.
- `L.costoCantiere(s, p, l)` = { costo, pieno, livello, sconti:[{k, perche, quota}] }; `L.guadagnoLivello(s, p, l, tipo)` = { piu, costo, cicli }.
- Messaggi con `lieve: true` = avvisi di casella (da mostrare come avviso che sparisce, non contare tra i nuovi).
- `L.ATTIVITA[k].perche` = una riga "perche' sceglierla".

## Testi dell'interfaccia ora sbagliati o mancanti (gioco.js)
- riga ~430: il filtro degli avvisi cerca "Gazzetta": ora il registro dice "pesca una Voce di piazza" (aggiungere "Voce di piazza|pedaggio").
- riga ~2130: finestra della carta: titolo "Gazzetta" -> "Voci di piazza"; mostrare `me.esitoCarta.esito`; chiave con `ultimaCarta.n`.
- riga ~638 ICO_CASELLA e scheda casella: la casella si chiama ancora "Gazzetta" nello stato: a schermo va scritto "Voci di piazza".
- finestra asta: dire "Base d'asta X (60% del prezzo)", "Hai rinunciato: non puoi offrire", risultato con tutte le offerte (`ultimaAsta`).
- riga ~2159 finestra Compro: "Se non lo compri, va all'asta tra tutti" -> "tra gli ALTRI: tu non potrai offrire".
- riga ~738 e app Imprese (~1693): prezzo del cantiere calcolato a mano -> usare `L.costoCantiere`; aggiungere `L.guadagnoLivello`.
- app Banca: tasso scritto in due modi -> usare `L.tassoDebito`; "da restituire entro 3 Cicli" e' falso (nessuna scadenza); pulsante Ipoteca con `L.infoIpoteca`.
- app Municipio: elenco "Leggi in vigore" con `L.leggiInVigore(S)`; Condono = "cantieri a meta' prezzo fino alle elezioni".
- finestra proposta di terreno: mostrare `proposta.ipoteca`.
- finestra rossa del debito: `me.avvisoDebito`.

## Note
- controlla.sh veloce: il passo 7 (server-finto) fallisce per prove nuove dell'online (rientro, codice): riguarda server/index.ts del Coder S, non il motore.
