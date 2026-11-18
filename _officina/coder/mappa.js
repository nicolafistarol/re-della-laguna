#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — mappa del codice, rifatta dal codice vero
//   node mappa.js > MAPPA.md          (REPO=/percorso/copia per una copia di lavoro)
// Le righe cambiano a ogni modifica: invece di aggiornare la mappa a mano, si rilancia questo.
// =====================================================================
const fs = require("fs"), path = require("path");
const { REPO, carica, gioca } = require("./laguna.js");
const leggi = (f) => fs.readFileSync(path.join(REPO, f), "utf8").split("\n");
const out = [];
const p = (x = "") => out.push(x);

// funzioni di un file: [nome, riga, righe]
function funzioni(righe, rientro) {
  const v = [];
  const re = new RegExp("^" + " ".repeat(rientro) + "(?:export )?(?:async )?function\\s+([A-Za-z0-9_$]+)\\s*\\(([^)]*)");
  righe.forEach((r, i) => {
    const m = r.match(re); if (!m) return;
    let fine = i;
    const apre = (r.match(/\{/g) || []).length, chiude = (r.match(/\}/g) || []).length;
    if (!(apre > 0 && apre === chiude)) { const stop = new RegExp("^" + " ".repeat(rientro) + "\\}"); for (let j = i + 1; j < righe.length; j++) if (stop.test(righe[j])) { fine = j; break; } }
    v.push({ nome: m[1], arg: m[2].trim(), riga: i + 1, righe: fine - i + 1, car: righe.slice(i, fine + 1).join("\n").length });
  });
  return v;
}
function sezioni(righe) {
  const v = [];
  righe.forEach((r, i) => { const m = r.match(/^\s*\/\/ ?[-=]{4,} ?(.{3,})$/) || r.match(/^\s*\/\/ ---- (.{3,})$/); if (m && !/^[-=\s]*$/.test(m[1])) v.push({ titolo: m[1].replace(/[-=]+$/, "").trim(), riga: i + 1, sotto: /^\s*\/\/ ---- /.test(r) }); });
  return v;
}
function file(nome, rientro, cosa) {
  const righe = leggi(nome), fs_ = funzioni(righe, rientro), sz = sezioni(righe);
  p(`## ${nome}`); p();
  p(`${cosa} — ${righe.length} righe, ${Math.round(righe.join("\n").length / 1024)} KB, ${fs_.length} funzioni.`); p();
  // ogni sezione con le sue funzioni
  const confini = sz.filter((s) => !s.sotto).map((s) => s.riga).concat([righe.length + 1]);
  const prime = fs_.filter((f) => f.riga < (confini[0] || 1e9));
  const riga = (f) => `\`${f.nome}\`:${f.riga}${f.righe >= 40 ? " **(" + f.righe + " righe)**" : ""}`;
  if (prime.length) { p(`**Inizio del file (righe 1-${(confini[0] || righe.length) - 1})** — ${prime.map(riga).join(" · ")}`); p(); }
  sz.filter((s) => !s.sotto).forEach((s, i) => {
    const fino = confini[i + 1] - 1, dentro = fs_.filter((f) => f.riga >= s.riga && f.riga <= fino), sotto = sz.filter((x) => x.sotto && x.riga > s.riga && x.riga <= fino);
    p(`**${s.titolo}** (righe ${s.riga}-${fino})${sotto.length ? " — sotto-parti: " + sotto.map((x) => x.titolo.slice(0, 60) + " :" + x.riga).join("; ") : ""}`); p();
    if (dentro.length) { p(dentro.map(riga).join(" · ")); p(); }
  });
  if (!sz.length && fs_.length) { p(fs_.map(riga).join(" · ")); p(); }
  const grosse = [...fs_].sort((a, b) => b.car - a.car).slice(0, 8).filter((f) => f.righe >= 30 || f.car > 4000);
  if (grosse.length) { p(`Le più grosse: ${grosse.map((f) => `\`${f.nome}\` (riga ${f.riga}, ${f.righe} righe, ${Math.round(f.car / 1024)} KB)`).join(", ")}.`); p(); }
  return { righe, fs: fs_ };
}

p("# Mappa del codice di Re della Laguna");
p();
p(`Fatta in automatico da \`mappa.js\` sul repo \`${REPO}\`. Dopo ogni modifica: \`node mappa.js > MAPPA.md\`.`);
p("Scrittura `nome:123` = funzione `nome` alla riga 123. In grassetto le funzioni lunghe (40 righe o più).");
p();
const M = file("motore.js", 2, "Tutte le regole. Un solo blocco `(function(root){...})`: le funzioni sono rientrate di 2 spazi. Gira uguale nel browser, in Node e sul server");
const G = file("gioco.js", 0, "Tutta l'interfaccia (schermate, tabellone, notte, telefono, finestre). Modulo ES");
file("bot.js", 0, "I giocatori-computer. ATTENZIONE: la prima metà è codice già compresso e poi rimesso in colonna (nomi di una lettera: o = stato, i = giocatore, t = motore)");
file("locale.js", 0, "Partita da soli nel browser (?locale): tiene lo stato in localStorage, fa giocare i bot. Copia in piccolo di quello che fa il server");
file("tre.js", 0, "Il tabellone 3D (three.js): camera, visuali, pedine, etichette, luci giorno/notte");
file("mondo3d.js", 0, "Costruisce il mondo 3D: isole, strada ad anello, lotti, mare");
file("panorama.js", 0, "Le foto a 360° della notte");
file("server/index.ts", 0, "La funzione Supabase: crea / entra / inizia / azione. Carica motore e bot da jsDelivr a un commit preciso");

// ---------------------------------------------------------------- telefono: una funzione per app
{ const g = G.righe, i = g.findIndex((r) => /^const CONTENUTO_APP = \{/.test(r));
  if (i >= 0) { p("## Telefono: una funzione per app (gioco.js)"); p();
    p(`\`CONTENUTO_APP\` (riga ${i + 1}) dice quale funzione disegna ogni app. \`contenutoApp(me, k)\` sceglie solo la funzione. I pulsanti delle app si collegano in \`collegaApp\` (riga ${(G.fs.find((f) => f.nome === "collegaApp") || {}).riga}).`); p();
    p("| app | funzione | riga | righe |"); p("|---|---|---|---|");
    for (let j = i + 1; j < g.length && !/^\};/.test(g[j]); j++) { const m = g[j].match(/^\s*(\w+): (?:\([^)]*\) => )?(\w+)/); if (!m) continue; const f = G.fs.find((x) => x.nome === m[2]); p(`| \`${m[1]}\` | \`${m[2]}\` | ${f ? f.riga : "?"} | ${f ? f.righe : "?"} |`); }
    p(); } }

// ---------------------------------------------------------------- azioni
p("## Tutti i tipi di azione accettati da applica()"); p();
const src = M.righe, i0 = src.findIndex((r) => /function applica0\(/.test(r)), i1 = src.findIndex((r, i) => i > i0 && /^  function vista\(/.test(r));
const gioco = G.righe.join("\n"), bot = leggi("bot.js").join("\n");
// quali azioni fanno davvero i bot (6 partite veloci)
const usate = {};
try { const { L, B } = carica(); for (let i = 0; i < 6; i++) gioca(L, B, { seed: 300 + i, cicli: 10, giocatori: 4 + (i % 3), giro: i, dopo(s, b, a) { usate[a.tipo] = (usate[a.tipo] || 0) + 1; } }); } catch (e) { }
p("Tutto passa da `applica(s, idGiocatore, a)` (riga " + (src.findIndex((r) => /^  function applica\(/.test(r)) + 1) + ") che chiama `applica0` (riga " + (i0 + 1) + ") e poi `esegui` (riga " + (src.findIndex((r) => /^  function esegui\(/.test(r)) + 1) + "): un `switch` su `a.tipo`, raggruppato per tema.");
p("Colonne: campi letti da `a` · funzione del motore chiamata (riga) · l'interfaccia la manda? · i bot la usano? (quante volte in 6 partite di prova).");
p("**Se i bot non la usano, la simulazione non la prova mai**: resta solo il \"giocatore matto\" di invarianti.js."); p();
p("| tipo | campi | funzione (riga) | interfaccia | bot |"); p("|---|---|---|---|---|");
const nomi = Object.fromEntries(M.fs.map((f) => [f.nome, f.riga]));
let nTipi = 0;
for (let i = i0; i < i1; i++) {
  const r = src[i], casi = [...r.matchAll(/case "([a-z_0-9]+)":/g)].map((x) => x[1]); if (!casi.length) continue;
  const campi = [...new Set([...r.matchAll(/\ba\.([a-zA-Z]+)/g)].map((x) => x[1]).filter((x) => x !== "tipo"))];
  const chiamate = [...r.matchAll(/\b([a-zA-Z0-9_]+)\(s, p/g)].map((x) => x[1]).filter((x) => nomi[x]);
  for (const t of casi) { nTipi++; const ui = new RegExp('tipo: "' + t + '"').test(gioco), nb = usate[t] || 0, inBot = new RegExp('tipo: "' + t + '"').test(bot);
    p(`| \`${t}\` | ${campi.join(", ") || "—"} | ${chiamate.map((c) => "`" + c + "`:" + nomi[c]).join(", ") || "(dentro lo switch, riga " + (i + 1) + ")"} | ${ui ? "sì" : "**no**"} | ${nb ? nb : inBot ? "raro" : "**mai**"} |`); }
}
p(); p(`In tutto ${nTipi} tipi di azione.`); p();

// ---------------------------------------------------------------- vista
p("## Cosa vede ognuno: vista() / vistaSicura()"); p();
const iv = i1;
const cp = (src.join("\n").match(/const CAMPI_PUBBLICI = \[([\s\S]*?)\];/) || ["", ""])[1].replace(/\/\/.*$/gm, "");
const pubblici = [...cp.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
const rigaDi = (re) => src.findIndex((r) => re.test(r)) + 1;
p(`\`vista(s, idGiocatore)\` è alla riga ${iv + 1} di motore.js. \`Laguna.vistaSicura\` è **la stessa funzione**: è l'unica cosa che esce dal server (server/index.ts) e dalla partita locale (locale.js).`); p();
if (pubblici.length) {
  p(`**Regola numero uno: degli ALTRI giocatori passa SOLO quello che sta in \`CAMPI_PUBBLICI\` (riga ${rigaDi(/const CAMPI_PUBBLICI = \[/)}).** Un campo nuovo dentro un giocatore è segreto da solo. Per farlo vedere a tutti va aggiunto lì (una riga per tema).`); p();
  p("Campi pubblici oggi: " + pubblici.map((x) => "`" + x + "`").join(", ") + ", più `fascia` (Benestante, Ricco...: l'unica cosa pubblica sulla ricchezza)."); p();
  p("**Regola numero due: il resto dello stato è copiato intero.** Una cosa nuova e segreta che NON sta dentro un giocatore (come `manoSM`) va tolta a mano dentro `vista()`."); p();
} else { p("(motore vecchio: toglie una lista di campi vietati invece di tenere una lista di campi ammessi)"); p(); }
p("Cosa fa, in ordine:");
p("1. Toglie sempre `rngState`, `seed` (il seme dei dadi) e `manoSM` (le mani di Sette e mezzo con il mazzo). Aggiunge `versioneMotore` e `gen`.");
p("2. Altri giocatori: solo i campi pubblici; le stanze segrete (caveau, bunker...) diventano \"riservato\" o spariscono. Te stesso: tutto, tranne `tracce` (non si vedono in numero).");
p("3. Cronaca (`log`): via le righe private degli altri (prestito, investe, vende, ipoteca...: riconosciute dalle parole, vedi `CRONACA_PRIVATA`).");
p("4. Aste e Grandi Affari: delle offerte segrete resta solo la tua.");
p("5. Sette: in `sette` solo quelle di cui sei membro (senza `tradimento`, senza `sepolto` se non sei il Gran Maestro); delle altre in `setteRivali` solo `id` e `nome`. Inviti: solo i tuoi, senza chi li manda.");
p("6. `flussi`: i pubblici e quelli dove sei tu. `proposte`, `contratti`: solo i tuoi (i contratti notarili firmati dagli altri si vedono senza cifre).");
p("7. `ultimaAlba.riepilogo`, `riepOra`: solo la tua parte. La `chiamata` in attesa di un altro: senza testo e guadagno.");
p("8. Notte (`v.notte` è ricostruita da capo): `dove` degli altri solo se siete nello stesso posto (e non al Palazzo), `viaggio` degli altri nascosto; `racconto`, `occasioni`, `scelte`, `manoSM` (senza mazzo) solo tuoi.");
p("9. Aggiunge cose calcolate solo per te: `rischioPerq`, `lustro`, `livelloPalazzo`, `sblocco`, `postiValigetta`, `poliziaSu`, `giroPg` (con l'Osservatorio).");
p();
p("Attenzione: la vista può avere pezzi in comune con lo stato vero. Chi la riceve non la deve modificare (il server la manda in JSON, gioco.js ne fa una copia).");
p();

// ---------------------------------------------------------------- ingresso: controlli, cintura, generazione
p("## L'ingresso delle azioni: controlli, cintura di sicurezza, generazione"); p();
const riga = (nome) => { const f = M.fs.find((x) => x.nome === nome); return f ? "`" + nome + "`:" + f.riga : "`" + nome + "` (non trovata)"; };
p(`Ogni azione fa questo percorso: ${riga("applica")} → ${riga("normalizza")} (controllo dei valori) → ${riga("applica0")} (telefonata dal Faro) → ${riga("esegui")} (lo \`switch\` con tutti i tipi) → ${riga("controllaNumeri")} (cintura di sicurezza) → ${riga("registraConti")} ("I miei conti").`); p();
p(`- **Controllo dei valori** (${riga("valoreSicuro")}, costanti \`CAMPI_NUMERO\`, \`CAMPI_SOLDI\`, \`CAMPI_TESTO\`, \`CAMPI_LISTA\`, \`CAMPI_OGGETTO\` alla riga ${rigaDi(/const CAMPI_NUMERO = /)}): numeri veri, soldi mai negativi né oltre \`MAX_NUMERO\`, niente parole riservate di JavaScript, liste e oggetti solo dove previsti. **Un campo-numero nuovo va aggiunto a \`CAMPI_NUMERO\`** (e a \`CAMPI_SOLDI\` se sono soldi).`);
p(`- **Cintura di sicurezza** (${riga("controllaNumeri")}): se dopo un'azione contanti, sporchi, debito, fama, Tracce, tassa, Tesoro o prezzi non sono più numeri, errore vero (non di gioco). Il server non salva.`);
p(`- ${riga("applicaSicura")}: come \`applica\`, ma se l'azione è rifiutata o va in errore lo stato torna com'era. La usano locale.js e \`LagunaBot.gioca\`.`);
p(`- **Generazione** (riga ${rigaDi(/const GEN = /)}): \`VERSIONE\`, \`GEN\`, ${riga("gen2")}, \`N_GEN2\` (riga ${rigaDi(/const N_GEN2 = /)}) e ${riga("num")}. I numeri che cambiano solo per le partite nuove si scrivono in \`N_GEN2\` e si leggono con \`num(s, "chiave")\`; le regole nuove dentro \`if (gen2(s))\`.`);
p(`- Liste da tenere aggiornate quando si aggiunge un'azione: lo \`switch\` in ${riga("esegui")} (gruppi per tema), \`MOTIVO\` (riga ${rigaDi(/^  const MOTIVO = \{/)}) se muove soldi, \`AZIONI_TELEFONO_FARO\` (riga ${rigaDi(/const AZIONI_TELEFONO_FARO = /)}) se si può fare dal Faro, \`API\` (riga ${rigaDi(/^  const API = \{/)}) se serve fuori dal motore.`);
p();
p("Il giro dei bot è uno solo: `LagunaBot.gioca(stato, opz)` in bot.js. Lo usano server/index.ts e locale.js.");
p();

// ---------------------------------------------------------------- stato
p("## Com'è fatto lo stato (campi visti davvero giocando 8 partite di bot)"); p();
try {
  const { L, B } = carica();
  const racc = { partita: {}, giocatore: {}, casella: {}, setta: {}, notte: {}, pending: {} };
  const tipo = (x) => x === null ? "null" : Array.isArray(x) ? "lista" : typeof x === "object" ? "oggetto" : typeof x === "number" ? "numero" : typeof x === "string" ? "testo" : typeof x === "boolean" ? "sì/no" : typeof x;
  const segna = (dove, o) => { for (const k of Object.keys(o)) { const t = tipo(o[k]); const q = dove[k] = dove[k] || new Set(); if (t !== "null") q.add(t); } };
  for (let i = 0; i < 8; i++) { let n = 0; gioca(L, B, { seed: 900 + i, cicli: 12, giocatori: 4 + (i % 3), giro: i, dopo(s) { if (n++ % 5) return; segna(racc.partita, s); for (const q of s.players) segna(racc.giocatore, q); for (const l of s.lotti) segna(racc.casella, l); for (const st of s.sette) segna(racc.setta, st); if (s.notte) segna(racc.notte, s.notte); if (s.pending) (racc.pending[s.pending.tipo] = racc.pending[s.pending.tipo] || new Set(Object.keys(s.pending))); } }); }
  const NOTE = {
    partita: { fase: "\"pacchetti\" (scelta della storia) → \"giorno\" → \"notte\" → ... → \"fine\"", ciclo: "da 0 (a schermo +1)", giorno: "0-3: quattro giri di dadi per Ciclo", turno: "posizione dentro `ordine`", ordine: "indici di `players` nell'ordine di gioco", rngState: "il seme dei dadi: MAI nella vista", pending: "la domanda aperta che blocca il giorno (vedi sotto)", lotti: "le caselle del tabellone, tutte (anche quelle non in vendita)", notte: "esiste solo di notte", notteFatti: "chi ha finito la notte", sette: "tutte le sette", grandi: "i Grandi Affari (tv, banca): nasce alla prima richiesta", flussi: "ultimi 160 passaggi di soldi con motivo", log: "cronaca (max 400)", gazzetta: "notizie (max 120)", contratti: "", proposte: "scambi di terreni proposti", inviti: "inviti alle sette", valore: "valore di ogni isola (5 = normale)", borsa: "prezzi delle aziende", cripto: "prezzi delle monete", sindaco: "id del Sindaco", modoFine: "cicli / obiettivo / libera", classifica: "solo a fine partita", gen: "generazione: 2 per le partite nate dalla Tappa 0 in poi; se manca vale 1 (vedi gen2)", motoreNascita: "VERSIONE del motore con cui e' nata la partita", versione: "versione del formato dello stato (sempre 1): NON e' la versione del gioco", manoSM: "mani di Sette e mezzo aperte, con il mazzo: MAI nella vista" },
    giocatore: { id: "\"g1\", \"g2\"... g1 è chi ha creato la partita", cash: "soldi puliti", sporchi: "soldi sporchi", debito: "", tracce: "0-100+: quanto ti cerca la polizia", stato: "0 pulito ... gradini dell'indagine", faro: "turni di prigione rimasti", pacchetto: "la STORIA scelta (commerciante, costruttore...)", strat: "il CARATTERE del bot (Legale, Furbo...)", piani: "piani del Palazzo", stanze: "stanze speciali comprate", funzioniPiani: "", sette: "id delle sette di cui è membro", valigetta: "oggetti del Mercato Nero", prove: "prove raccolte sugli altri", corrotti: "contatti corrotti", messaggi: "messaggi privati (max 60)", conti: "\"I miei conti\": movimenti per Ciclo e motivo", _n: "memoria del bot per la notte", _investito: "memoria del bot (tutti i campi con _ sono del bot)", pos: "casella dove si trova", haTirato: "", azioneGiornoFatta: "", fama: "", veicoli: "", azioni: "quote di Borsa", cripto: "", fallito: "" },
    casella: { id: "\"o0\"...\"o87\"", tipoCasella: "\"lotto\", \"molo\" (si comprano) oppure via, gazzetta, asta, faro...", serie: "il quartiere (gruppo di vie); \"Moli\" per i moli", isola: "", owner: "id del padrone oppure null: UNO solo", lvl: "0-5 livello dell'edificio", tipo: "attività costruita", ipoteca: "", chiuso: "Cicli di chiusura rimasti", cantiere: "lavori in corso", permesso: "", negato: "" },
    setta: { gm: "id del Gran Maestro", membri: "lista di id", tesoro: "", influenza: "punti: livello a 12/35/70", sepolto: "Tesoro sepolto al Faro", chat: "", opera: "Grande Opera in votazione", tradimento: "", convocazione: "" },
    notte: { ora: "0-6 (22:00-04:00)", dove: "posto di ogni giocatore", viaggio: "chi è in viaggio e verso dove", chiuso: "chi ha già scelto in quest'ora", pronto: "chi ha premuto Avanti", occasioni: "affari nascosti nei posti", pericolo: "livello di pericolo di ogni posto", racconto: "il racconto di ognuno", inizio: "ora vera (Date.now) di inizio dell'ora: l'orologio dei 120 secondi", base: "soldi a inizio ora per il riepilogo" },
  };
  for (const [nome, campi] of Object.entries(racc)) {
    if (nome === "pending") continue;
    p(`**${nome}** (${Object.keys(campi).length} campi)`); p();
    const con = Object.keys(campi).filter((k) => (NOTE[nome] || {})[k]), senza = Object.keys(campi).filter((k) => !(NOTE[nome] || {})[k]);
    for (const k of con) p(`- \`${k}\` (${[...campi[k]].join("/") || "vuoto"}): ${NOTE[nome][k]}`);
    if (senza.length) p(`- altri: ${senza.map((k) => "`" + k + "`").join(", ")}`);
    p();
  }
  p("**pending** (la domanda aperta di giorno): " + Object.entries(racc.pending).map(([k, v]) => `\`${k}\` {${[...v].filter((x) => x !== "tipo").join(", ")}}`).join(" · ")); p();
} catch (e) { p("(non sono riuscito a giocare le partite di prova: " + e.message + ")"); }
console.log(out.join("\n"));
