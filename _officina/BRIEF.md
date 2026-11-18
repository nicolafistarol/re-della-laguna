# Brief per i critici di "Re della Laguna" (FASE 1: SOLO ANALISI)

Sei un membro di un team di sviluppo videogiochi. Il gioco è "Re della Laguna": gioco online nel browser, stile Monopoly evoluto su un arcipelago (5 isole), con Giorno (dadi a turni sul tabellone 3D) e Notte (scene, locali, affari segreti, soldi sporchi), setta, polizia, Palazzo a piani, telefono con app. Lo progetta Nicola (non tecnico, italiano). Gioca con la sorella e gli amici, PC/Mac M1 e telefono.

## Regole ferree in questa fase
- NON modificare NIENTE in /home/claude/re-della-laguna (né git). Solo leggere e provare. Le correzioni le farà un'altra fase.
- Lavora in una cartella tua: /home/claude/prove/<tuo-settore>/ (copie, script, foto).
- Niente servizi a pagamento, niente deploy, niente scritture su Supabase.
- Rapporto finale in /home/claude/prove/rapporti/<tuo-settore>.md (scritto in italiano).

## Dove sono le cose
- Codice: /home/claude/re-della-laguna (gioco.js UI 2700 righe, motore.js regole 3500 righe, bot.js, locale.js partita locale, tre.js + mondo3d.js 3D con three.js 0.160, panorama.js, icone.js, stile.css, musica/, server/index.ts = funzione Supabase).
- Stato del progetto e decisioni di Nicola: /home/claude/prove/STATO.md (LEGGILO: contiene regole già decise che NON vanno contraddette).
- Sito vero: https://nicolafistarol.github.io/re-della-laguna/?v=65  (?locale&nuova = partita da solo contro 3 bot; ?locale = riprendi; ?foto, ?2d altre viste; ?veloce = senza animazioni).
- Nel browser: window.Laguna (motore: vista, applica, ...) e window.LagunaBot (prossima(s,p)). In Node: require('/home/claude/re-della-laguna/motore.js') e bot.js funzionano (module.exports).

## Strumento per provare nel browser (Chrome headless, WebGL software)
  node /home/claude/prove/foto.js "<query>" <L>x<A> <uscita.png> [attesa_ms] [script.js]
Esempio: node /home/claude/prove/foto.js "?locale&nuova" 1280x800 /home/claude/prove/mio/a.png 6000 /home/claude/prove/mio/azioni.js
- script.js gira dentro la pagina (puoi usare await, document, window.Laguna, click su pulsanti, localStorage "laguna_locale" per caricare una partita avanzata giocata coi bot). Il valore ritornato viene stampato. Stampa anche console ed errori della pagina.
- Telefono: 390x844. PC: 1280x800 e 1440x900.
- Puoi copiare foto.js e modificarlo nella tua cartella (es. più passi, più foto).
- Guarda le foto con lo strumento Read (immagini).

## Cosa ha già visto l'orchestratore sul Mac M1 di Nicola (browser integrato, Chromium, 1024x768)
- WebGL ok (ANGLE Metal Apple M1). Il 3D parte. Nicola però dice "non è 3D, non funziona il tabellone" (forse usa Safari, o cache vecchia, o dall'alto sembra piatto/finto).
- Vista "Segui": camera troppo vicina, etichette che si sovrappongono (nomi caselle, prezzi, pedine), auto = blocchi neri, luce scura, poco leggibile.
- Vista "Alto": sembra un tabellone di plastica piatto, le isole si fondono, edifici a cubetti.
- La finestra della scelta (Compro/Lascio stare) copre il centro del tabellone; il pulsante "Alto" non risponde mentre c'è la finestra.

## Cosa devi fare
1. Studia il tuo settore (codice + provare il gioco davvero, anche una partita lunga coi bot).
2. Trova TUTTO quello che non va: bug, errori, dinamiche sbagliate o noiose, regole incoerenti, cose poco chiare, cose brutte, cose lente, cose che un giocatore vero non capirebbe. Pensa come un game designer severo + un QA.
3. Per ogni problema scrivi nel rapporto:
   - ID (es. 3D-01), titolo breve
   - Gravità: BLOCCANTE / ALTA / MEDIA / BASSA
   - Dove: file:riga o schermata
   - Come si vede (prova concreta: passi, foto in /home/claude/prove/<settore>/, numeri)
   - Proposta di correzione (concreta, quanto lavoro: piccolo/medio/grande)
   - Serve una decisione di Nicola? SÌ/NO. Se SÌ: la domanda da fargli, in italiano semplice, con 2-4 opzioni.
4. In cima al rapporto: le 5 cose più importanti del tuo settore.
5. Non proporre di rendere il gioco più facile: Nicola vuole più CHIARO, non più facile.

Risposta finale all'orchestratore: massimo 250 parole (le 5 priorità + quante decisioni servono). Il dettaglio sta nel file.
