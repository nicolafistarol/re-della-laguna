# Istruzioni comuni per i coder della Tappa 1 — "Re della Laguna"

Sei un programmatore del team. Il committente è Nicola (non tecnico, italiano). Il gioco: online nel browser, giorno coi dadi sul tabellone, notte nelle scene, soldi sporchi, polizia, setta, Palazzo, telefono con app.

## Leggi prima (in quest'ordine)
1. /home/claude/prove/DECISIONI.md — decisioni vincolanti dell'orchestratore.
2. /home/claude/prove/STATO.md — decisioni storiche di Nicola (non contraddirle).
3. /home/claude/prove/rapporti/coder.md §5.4 e §5.5 (punti fragili e convenzioni) e /home/claude/prove/coder/MAPPA.md (mappa del codice, aggiornata dopo la Tappa 0) e /home/claude/prove/rapporti/tappa0.md.
4. I rapporti del TUO settore (indicati nel tuo incarico): ogni problema ha ID, prova e proposta. Applica le proposte seguendo DECISIONI.md.

## Regole
- Lavori SOLO nella tua copia (git worktree indicato nel tuo incarico) e SOLO nei file/zone tuoi. Fuori da lì non scrivi: se serve, lo scrivi nel resoconto come "richiesta per un altro coder".
- Niente push, deploy, ?v=, server/motore.js, server/bot.js. Non riformattare. Niente `//` dentro `${...}` su una riga. Niente Math.random() nel motore (solo rng(s)). vista() e influenzaDi() non scrivono mai. Stato JSON puro.
- G1: bug/exploit/sicurezza/chiarezza/funzioni additive → tutte le partite; numeri di bilanciamento → solo `gen2(s)`. Ogni campo nuovo ha un ripiego per le partite vecchie. Un campo nuovo dello stato è PUBBLICO finché non lo nascondi in vista(): decidi e nascondi.
- Testi: italiano semplice, frasi brevi, rischio dell'illegale sempre scritto. Il gioco deve diventare più CHIARO, non più facile.
- Un commit per gruppo di problemi, messaggio in italiano con gli ID risolti e in fondo:
  Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01P32BM5HiQieVkD6nraGnPP
- Dopo ogni gruppo: `REPO=<tua copia> /home/claude/prove/coder/controlla.sh veloce`. Alla fine: `REPO=<tua copia> SEVERO=1 /home/claude/prove/coder/controlla.sh` deve dare VIA LIBERA. Se cambi l'economia apposta, riporta le mediane di `REPO=<tua copia> node /home/claude/prove/coder/sim.js 60 12` e `60 16` prima e dopo.
- Prova davvero quello che cambi: nel motore con uno script Node che esegue il caso (prima falliva / ora no); nell'interfaccia con foto (strumento in /home/claude/prove/BRIEF.md, con REPO=<tua copia>) a 1280x800, 1024x768 e 390x844, guardandole con Read.
- Non fare finta: se una cosa non riesci a farla o a provarla, scrivilo. Meglio 15 correzioni vere e provate che 40 a metà.
- Priorità: BLOCCANTE e ALTA tutte; MEDIA quante riesci; BASSA solo se costano poco.

## Resoconto finale
File /home/claude/prove/rapporti/fatto-<tuo nome>.md: tabella ID → fatto / non fatto (perché) / come provato; commit; campi e azioni nuove del motore (nome, cosa fanno, visibilità) che servono a chi fa l'interfaccia e i bot; richieste per altri coder; rischi. Risposta all'orchestratore: max 200 parole.
