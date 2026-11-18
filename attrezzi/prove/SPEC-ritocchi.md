# Ritocchi chiesti da Nicola la sera del 18/11 (da fare tutti; valgono per TUTTE le partite, anche quelle gia' iniziate)

1. TIMBRO DEL MUNICIPIO (strumento STRUMENTI.timbro): non si consuma piu' da solo. Quando chiedi un permesso e hai il Timbro in valigetta, la finestra/azione del permesso chiede "Usi il Timbro falso? Il permesso passa subito (e senza bollo nelle partite nuove), ma +6 Tracce." Azione permesso con campo nuovo `timbro: true|false` (campo piatto). Senza timbro:true il Timbro resta in valigetta. Aggiorna descr del Timbro e il bot (lo usa solo se il permesso e' a rischio o costoso).

2. PROVA DI FEDELTA' (motore: provaFedelta): costo = 10% del Tesoro della setta, minimo 2.000.000 €. Nello stesso Ciclo la seconda prova costa il doppio, la terza il quadruplo (st.prove = {ciclo, n}). Il membro provato riceve un messaggio privato: "Il Gran Maestro ti ha messo alla prova." Se era fedele: la setta perde 3 Influenza (senza andare sotto la soglia del livello che ha: usa le funzioni di Influenza che ci sono) e il membro riceve "Era una prova inutile: sei stato fedele." (il bot fedele provato 1 volta su 3 lascia la setta). Aggiorna testi e spiegazioni nell'app Setta (costo mostrato prima di confermare) e i bot GM.

3. VENDETTA DELLA SETTA sul traditore (motore: tradimentiAllAlba): quando il tradimento riesce all'Alba, il Gran Maestro riceve automaticamente una Prova sul traditore (`prove.push({su: traditore, ciclo, cosa: "i segreti che ha lasciato nella setta"})`): con quella puo' denunciarlo o ricattarlo. In piu' il traditore non puo' entrare in nessuna setta per 4 Cicli (p.marchiatoFino) e la setta lo sa (messaggio ai membri col nome: "<nome> ci ha venduti. Il Gran Maestro ha una Prova su di lui."). Il traditore lo sa ("La setta ha tenuto qualcosa su di te.").

4. VIAGGIO RAPIDO (motore: destinazioniRapide, viaggioRapido, N.taxiMunicipio): 
   - togli il taxi per il Municipio;
   - carburante: motoscafo 100.000 €, elicottero (o Eliporto del Palazzo) 300.000 €, jet 600.000 € (il traghetto dal molo resta 50.000);
   - il viaggio rapido consuma la mossa del giorno (p.azioneGiornoFatta = true: quel turno niente permesso/cantiere/piano/mossa del giorno);
   - una volta ogni 2 Cicli (p.rapidoCiclo: permesso se s.ciclo - p.rapidoCiclo >= 2 oppure mai fatto);
   - aggiorna la finestra "Dove vuoi andare?" in gioco.js (prezzo, "ti costa la mossa del giorno", "prossimo viaggio fra N Cicli") e i bot.
   - Controlla con la simulazione quante candidature a Sindaco ci sono prima e dopo (senza taxi i candidati devono arrivarci coi dadi): se calano molto (piu' del 40%), permetti di candidarsi anche dall'app Municipio del telefono pagando il doppio, e scrivilo nel rapporto.

5. TESTO DEL FAVORE NEL PATTO (gioco.js, finestra Proponi un patto): la frase sotto il Favore deve usare i nomi e il verso giusto. Esempio se lo devo io e il patto e' con Sabri: "Sabri, per i suoi prossimi 4 turni, non paga affitti né pedaggi sui tuoi terreni." Se lo deve lei: "Per i tuoi prossimi 4 turni non paghi affitti né pedaggi sui terreni di Sabri." Fallo per tutti e 4 i Favori. Si aggiorna quando cambi "Chi lo deve" o il destinatario.

6. PATTO SULLA PAROLA NON PAGATO (motore: scadenzeContratti): oggi alla scadenza arriva solo un promemoria. Nuovo: alla scadenza il debitore ha tempo fino all'Alba dopo per pagare (dall'app Banca, o con un pulsante "Paga ora" nell'app Contratti sul patto scaduto: azione nuova `paga_patto` che paga e chiude). Se all'Alba dopo non ha pagato: -8 fama, p.senzaParola = s.ciclo + 2 (come chi rompe un Favore), notizia pubblica "X non mantiene la parola data a Y.", patto "rotto". Il bot paga sempre se ha i soldi.

7. VERSIONE DELLA PAGINA: se la vista arriva da un motore piu' nuovo della pagina (v.versioneMotore o VERSIONE_REGOLE della vista > quella di L caricato nella pagina), la pagina mostra "C'è una versione nuova del gioco" con pulsante "Aggiorna" che ricarica con ?v=<numero nuovo> (tieni gli altri parametri dell'indirizzo). Per farlo la vista deve contenere VERSIONE_REGOLE (v.versioneRegole): aggiungila in vista().

Alla fine: VERSIONE_REGOLE +1 e voce NOVITA con le novita' in 4-6 frasi semplici. Alza anche ?v= in index.html, gioco.js (import), tre.js, mondo3d.js, cubetti.js al numero nuovo.
