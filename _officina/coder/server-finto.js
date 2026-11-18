#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — il server provato senza Supabase
//   node server-finto.js [cicli=4] [seme=11]     (REPO=/percorso/copia per una copia di lavoro)
//   MINIFICATI=1 node server-finto.js             usa server/motore.js e server/bot.js (quelli che andranno online)
// Prende server/index.ts COSI' COM'E', lo traduce da TypeScript e lo fa girare con un database finto in memoria.
// Poi gioca una partita online vera: due persone (che qui giocano come bot prudenti) e due computer.
// Controlla: nessuna risposta 500, la versione sale di 1 a ogni mossa, ogni giocatore ha la sua vista aggiornata,
// nelle viste non ci sono segreti, un'azione sbagliata viene rifiutata senza salvare niente, la partita finisce.
// Prima della partita lunga fa le PROVE DELL'ONLINE (Coder S): rientro e codice personale, due ingressi insieme, doppia mossa,
// mosse insieme di due giocatori, giocatore assente (tempo massimo, asta, tasto di chi ha creato), ricomincia, viste che non tornano indietro.
//   SQL_FINTO=1   il database finto ha anche la funzione laguna.salva_mossa (come dopo la migrazione); senza, il server usa il ripiego
//   SOLO_ONLINE=1 solo le prove dell'online, senza la partita lunga
// Esce con 1 se qualcosa non va. Non tocca la rete e non scrive nel repo.
// =====================================================================
const fs = require("fs"), path = require("path");
const { REPO, casuale } = require("./laguna.js");
let esbuild; try { esbuild = require("esbuild"); } catch (e) { console.error("Manca esbuild: cd " + __dirname + " && npm install esbuild"); process.exit(2); }
const cicli = Number(process.argv[2]) || 4, seme = Number(process.argv[3]) || 11;
const MINI = process.env.MINIFICATI === "1";
console.log(`SERVER FINTO  repo=${REPO}  cicli=${cicli}  seme=${seme}  motore=${MINI ? "server/motore.js (compresso)" : "motore.js"}`);

// ---- il motore e i bot, come li caricherebbe il server (finiscono in globalThis.Laguna / LagunaBot)
const carica = (f) => { const p = path.join(REPO, f); delete require.cache[require.resolve(p)]; return require(p); };
globalThis.Laguna = carica(MINI ? "server/motore.js" : "motore.js");
globalThis.LagunaBot = carica(MINI ? "server/bot.js" : "bot.js");
const L = globalThis.Laguna, B = globalThis.LagunaBot;

// ---- database finto: quattro tabelle in memoria, con le sole operazioni che index.ts usa
const tabelle = { partite: [], giocatori: [], viste: [], azioni: [] };
let prossimoId = 1;
function query(nome) {
  const filtri = []; let op = "select", dati = null, uno = false, forse = false, limite = null, ordine = null, ritorna = false;
  const q = {
    select() { if (op !== "select") ritorna = true; return q; }, insert(x) { op = "insert"; dati = x; return q; }, update(x) { op = "update"; dati = x; return q; }, upsert(x) { op = "upsert"; dati = x; return q; },
    eq(k, v) { filtri.push((r) => r[k] === v); return q; }, lt(k, v) { filtri.push((r) => r[k] < v); return q; }, is(k, v) { filtri.push((r) => (r[k] ?? null) === v); return q; }, order(k) { ordine = k; return q; }, limit(n) { limite = n; return q; },
    single() { uno = true; return q; }, maybeSingle() { uno = true; forse = true; return q; },
    then(risolvi, rifiuta) { try { risolvi(esegui()); } catch (e) { rifiuta ? rifiuta(e) : risolvi({ data: null, error: e }); } },
  };
  const copia = (x) => x === undefined ? x : JSON.parse(JSON.stringify(x)); // come un database vero: dentro e fuori passano copie
  function esegui() {
    const t = tabelle[nome]; if (!t) return { data: null, error: { message: "tabella sconosciuta: " + nome } };
    if (op === "insert") { const righe = (Array.isArray(dati) ? dati : [dati]).map((r) => ({ ...(nome === "partite" ? { id: "p" + prossimoId++, in_corso: false, finita: false, versione: 0, stato: null } : {}), ...copia(r) }));
      // i vincoli unici del database vero: un codice per partita, una vista per giocatore
      if (nome === "partite" && righe.some((r) => t.some((x) => x.codice === r.codice))) return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint \"partite_codice_key\"" } };
      if (nome === "viste" && righe.some((r) => t.some((x) => x.partita_id === r.partita_id && x.player_id === r.player_id))) return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint \"viste_pkey\"" } };
      t.push(...righe); return { data: uno ? copia(righe[0]) : copia(righe), error: null }; }
    if (op === "upsert") { for (const r of dati) { const i = t.findIndex((x) => x.partita_id === r.partita_id && x.player_id === r.player_id); if (i >= 0) t[i] = copia(r); else t.push(copia(r)); } return { data: null, error: null }; }
    let righe = t.filter((r) => filtri.every((f) => f(r)));
    if (op === "update") {
      // vincolo unico del database vero (giocatori_utente): una persona ha un solo posto per partita
      if (nome === "giocatori" && dati.user_id) for (const r of righe) if (t.some((x) => x !== r && x.partita_id === r.partita_id && x.user_id === dati.user_id)) return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint \"giocatori_utente\"" } };
      for (const r of righe) Object.assign(r, copia(dati)); return { data: ritorna ? copia(righe) : null, error: null }; }
    if (ordine) righe = [...righe].sort((a, b) => String(a[ordine]).localeCompare(String(b[ordine])));
    if (limite) righe = righe.slice(0, limite);
    if (uno) return righe.length ? { data: copia(righe[0]), error: null } : { data: null, error: forse ? null : { message: "nessuna riga" } };
    return { data: copia(righe), error: null };
  }
  return q;
}
// la funzione SQL laguna.salva_mossa rifatta qui uguale (solo con SQL_FINTO=1): tutto insieme o niente
const SQL_FINTO = process.env.SQL_FINTO === "1";
let rpcChiamate = 0;
async function rpc(nome, a) {
  if (!SQL_FINTO || nome !== "salva_mossa") return { data: null, error: { code: "PGRST202", message: "Could not find the function laguna." + nome + " in the schema cache" } };
  rpcChiamate++;
  const c = (x) => JSON.parse(JSON.stringify(x));
  const p = tabelle.partite.find((x) => x.id === a.p_partita && x.versione === a.p_attesa);
  if (!p) return { data: false, error: null };
  Object.assign(p, { stato: c(a.p_stato), versione: a.p_nuova, finita: a.p_finita, aggiornata_il: new Date().toISOString() }); if (a.p_in_corso !== null && a.p_in_corso !== undefined) p.in_corso = a.p_in_corso;
  for (const v of a.p_viste) { const r = tabelle.viste.find((x) => x.partita_id === a.p_partita && x.player_id === v.player_id); if (!r) tabelle.viste.push({ partita_id: a.p_partita, player_id: v.player_id, versione: a.p_nuova, vista: c(v.vista), aggiornata_il: new Date().toISOString() }); else if (r.versione < a.p_nuova) Object.assign(r, { versione: a.p_nuova, vista: c(v.vista) }); }
  if (a.p_registro) tabelle.azioni.push(c(a.p_registro));
  return { data: true, error: null };
}
const createClient = () => ({ from: query, rpc, auth: { getUser: async (token) => ({ data: { user: token ? { id: token } : null } }) } });

// ---- index.ts tradotto e avviato dentro una funzione
let gestore = null;
const Deno = { env: { get: () => "finto" }, serve: (h) => { gestore = h; } };
const sorgente = fs.readFileSync(path.join(REPO, "server/index.ts"), "utf8").replace(/^import .*$/gm, "");
let js;
try { js = esbuild.transformSync(sorgente, { loader: "ts", target: "es2022" }).code; } catch (e) { console.log("SERVER FINTO: NON VA\n  - server/index.ts non si traduce: " + e.message.split("\n")[0]); process.exit(1); }
const guai = [];
const errori500 = [];
const vecchioErr = console.error; console.error = (...x) => { errori500.push(x.map((y) => (y && y.message) || (typeof y === "string" ? y : JSON.stringify(y))).join(" ").slice(0, 300)); };
try { new Function("createClient", "Deno", js)(createClient, Deno); } catch (e) { console.error = vecchioErr; console.log("SERVER FINTO: NON VA\n  - server/index.ts non parte: " + e.message); process.exit(1); }
if (!gestore) { console.error = vecchioErr; console.log("SERVER FINTO: NON VA\n  - server/index.ts non ha chiamato Deno.serve"); process.exit(1); }

async function chiama(utente, corpo) {
  const testate = { "Content-Type": "application/json" }; if (utente) testate.Authorization = "Bearer " + utente;
  const r = await gestore(new Request("https://finto/laguna", { method: "POST", headers: testate, body: JSON.stringify(corpo) }));
  let j = null; try { j = await r.json(); } catch (e) { }
  return { status: r.status, ...(j || {}) };
}

// =====================================================================
// LE PROVE DELL'ONLINE (rapporto online.md: ON-02, 03, 06, 08, 09, 10, 11, 13 e tempi massimi)
// =====================================================================
let orologio = 1_800_000_000_000;
async function proveOnline() {
  const no = (t) => guai.push("ONLINE " + t);
  const riga = (id) => tabelle.partite.find((p) => p.id === id);
  const posti = (id) => tabelle.giocatori.filter((g) => g.partita_id === id);
  const vistaDi = (id, g) => tabelle.viste.find((x) => x.partita_id === id && x.player_id === g);
  const umani3 = [{ nome: "Anna", bot: false }, { nome: "Bea", bot: false }, { nome: "Carla", bot: false }, { nome: "Furbo", bot: true, strategia: "Furbo" }];
  // una partita con Anna e Bea (e Carla se serve) gia' iniziata
  const partitaPronta = async (tre) => {
    const r = await chiama("anna", { comando: "crea", giocatori: tre ? umani3 : [umani3[0], umani3[1], umani3[3]] });
    await chiama("bea", { comando: "entra", codice: r.codice, nome: "Bea" }); if (tre) await chiama("carla", { comando: "entra", codice: r.codice, nome: "Carla" });
    const x = await chiama("anna", { comando: "inizia", partita: r.partita, durata: { modo: "cicli", cicli: 6 } }); if (x.status !== 200) no("inizia: " + JSON.stringify(x));
    return { id: r.partita, codice: r.codice };
  };
  const chi = { g1: "anna", g2: "bea", g3: "carla" };
  // la prossima mossa buona di una persona (come la giocherebbe un computer prudente), calcolata su una copia
  const mossaBuona = (id, soloDi) => { const s = JSON.parse(JSON.stringify(riga(id).stato)); delete s._srv; for (const g of soloDi || ["g1", "g2", "g3"]) { const io = s.players.find((x) => x.id === g); if (!io || io.bot) continue; io.bot = true; io.strat = "Legale"; const a = B.prossima(s, io); io.bot = false; if (a) return { g, a }; } return null; };
  const srvDi = (id) => riga(id).stato._srv || {};

  // ---------- 1. RIENTRO (ON-02) e codice personale
  {
    const { id, codice } = await partitaPronta(false);
    let r = await chiama("bea", { comando: "entra", codice, nome: "Bea" });
    if (r.status !== 200 || r.player !== "g2") no("chi ha gia' il posto deve rientrare anche a partita iniziata: " + JSON.stringify(r));
    r = await chiama("zoe", { comando: "entra", codice, nome: "Zoe" });
    if (r.status !== 400 || !r.serveRientro) no("un estraneo non deve entrare in una partita iniziata: " + JSON.stringify(r));
    const cb = await chiama("bea", { comando: "mio_codice", partita: id }), ca = await chiama("anna", { comando: "mio_codice", partita: id });
    if (cb.status !== 200 || !/^[A-Z2-9]{6}$/.test(cb.rientro || "")) no("mio_codice: " + JSON.stringify(cb));
    if (cb.rientro === ca.rientro) no("due giocatori hanno lo stesso codice di rientro");
    r = await chiama("zoe", { comando: "mio_codice", partita: id }); if (r.status !== 403) no("un estraneo non deve avere un codice di rientro: " + JSON.stringify(r));
    // il codice non e' scritto da nessuna parte: ne' nelle viste, ne' nello stato, ne' nelle altre tabelle
    const tutto = JSON.stringify([tabelle.viste, tabelle.partite, tabelle.giocatori, tabelle.azioni]);
    for (const c of [cb.rientro, ca.rientro]) if (c && tutto.includes(c)) no("il codice di rientro " + c + " e' scritto nel database (viste, stato o tabelle)");
    r = await chiama("tel-bea", { comando: "rientra", codice, rientro: "AAAAAA" }); if (r.status !== 404) no("codice di rientro sbagliato accettato: " + JSON.stringify(r));
    r = await chiama("tel-bea", { comando: "rientra", codice: "NIENTE-0000", rientro: cb.rientro }); if (r.status !== 404) no("rientro con codice partita sbagliato accettato: " + JSON.stringify(r));
    r = await chiama("anna", { comando: "rientra", codice, rientro: cb.rientro }); if (r.status !== 400) no("chi gioca gia' non deve poter prendere un secondo posto: " + JSON.stringify(r));
    r = await chiama("tel-bea", { comando: "rientra", codice, rientro: cb.rientro.toLowerCase().slice(0, 3) + " - " + cb.rientro.slice(3) });
    if (r.status !== 200 || r.player !== "g2" || !r.in_corso) no("rientro con il codice giusto (scritto minuscolo, con spazi): " + JSON.stringify(r));
    if (posti(id).find((g) => g.player_id === "g2").user_id !== "tel-bea") no("dopo il rientro il posto g2 non e' del dispositivo nuovo");
    r = await chiama("bea", { comando: "azione", partita: id, azione: { tipo: "tira" } }); if (r.status !== 403 || !r.nonGiochi) no("il dispositivo vecchio doveva ricevere 403 'non giochi': " + JSON.stringify(r));
    r = await chiama("tel-bea", { comando: "mio_codice", partita: id }); if (r.rientro !== cb.rientro) no("dal dispositivo nuovo il codice di rientro deve restare lo stesso");
    r = await chiama("tel-bea", { comando: "rientra", codice, rientro: cb.rientro }); if (r.status !== 200) no("rientrare due volte dallo stesso dispositivo deve andare bene: " + JSON.stringify(r));
    // chi ha creato la partita cambia dispositivo: resta lui "chi l'ha creata"
    r = await chiama("tel-anna", { comando: "rientra", codice, rientro: ca.rientro });
    if (r.status !== 200 || r.player !== "g1" || riga(id).creata_da !== "tel-anna") no("rientro di chi ha creato la partita: " + JSON.stringify(r) + " creata_da=" + riga(id).creata_da);
    const m = mossaBuona(id); const utente = { g1: "tel-anna", g2: "tel-bea" };
    if (m) { r = await chiama(utente[m.g], { comando: "azione", partita: id, azione: m.a, versione: riga(id).versione, mossa: "r1" }); if (r.status !== 200) no("dal dispositivo nuovo non si riesce a giocare: " + JSON.stringify(r)); } else no("nessuna mossa da provare dopo il rientro");
  }

  // ---------- 2. DUE CHE ENTRANO INSIEME (ON-08), nome troppo lungo (ON-13)
  {
    const r = await chiama("anna", { comando: "crea", giocatori: umani3 });
    const [a, b] = await Promise.all([chiama("bea", { comando: "entra", codice: r.codice, nome: "Bea" }), chiama("carla", { comando: "entra", codice: r.codice, nome: "C".repeat(500) })]);
    if (a.status !== 200 || b.status !== 200 || a.player === b.player) no("due ingressi insieme hanno preso lo stesso posto: " + JSON.stringify([a, b]));
    const g = posti(r.partita);
    if (g.filter((x) => x.user_id === "bea").length !== 1 || g.filter((x) => x.user_id === "carla").length !== 1) no("dopo due ingressi insieme i posti non sono uno a testa: " + JSON.stringify(g.map((x) => [x.player_id, x.user_id])));
    if (g.some((x) => String(x.nome).length > 30)) no("un nome piu' lungo di 30 lettere e' stato salvato");
    const piena = await chiama("dora", { comando: "entra", codice: r.codice, nome: "Dora" }); if (piena.status !== 400) no("partita piena: doveva rifiutare: " + JSON.stringify(piena));
    // la stessa persona che clicca due volte "Entra": un posto solo
    const r2 = await chiama("anna", { comando: "crea", giocatori: umani3 });
    const [c, d] = await Promise.all([chiama("dora", { comando: "entra", codice: r2.codice, nome: "Dora" }), chiama("dora", { comando: "entra", codice: r2.codice, nome: "Dora" })]);
    if (c.status !== 200 || d.status !== 200 || c.player !== d.player || posti(r2.partita).filter((x) => x.user_id === "dora").length !== 1) no("doppio clic su Entra: " + JSON.stringify([c, d]));
    // "Inizia" premuto due volte insieme: la partita nasce una volta sola
    await chiama("eva", { comando: "entra", codice: r2.codice, nome: "Eva" });
    const [i1, i2] = await Promise.all([chiama("anna", { comando: "inizia", partita: r2.partita }), chiama("anna", { comando: "inizia", partita: r2.partita })]);
    if ([i1, i2].filter((x) => x.status === 200).length !== 1 || riga(r2.partita).versione !== 1) no("doppio clic su Inizia: " + JSON.stringify([i1, i2]) + " versione " + riga(r2.partita).versione);
  }

  // ---------- 3. DOPPIA MOSSA (ON-06) e mosse insieme (ON-09)
  {
    const { id } = await partitaPronta(false);
    let m = mossaBuona(id); if (!m) { no("doppia mossa: nessuna mossa da provare"); return; }
    const v0 = riga(id).versione, n0 = tabelle.azioni.length;
    // doppio clic: due richieste insieme, viste alla stessa versione
    const [a, b] = await Promise.all([chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a, versione: v0, mossa: "m1" }), chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a, versione: v0, mossa: "m2" })]);
    const ok = [a, b].filter((x) => x.status === 200), doppie = [a, b].filter((x) => x.status === 409 && x.doppia);
    if (ok.length !== 1 || doppie.length !== 1) no("doppio clic: doveva passarne una sola: " + JSON.stringify([a, b]));
    if (riga(id).versione !== v0 + 1) no("doppio clic: la versione doveva salire di 1, e' salita di " + (riga(id).versione - v0));
    if (tabelle.azioni.length !== n0 + 1) no("doppio clic: nel registro doveva esserci una riga sola in piu'");
    // la stessa richiesta che arriva di nuovo (rete che riprova): non si rifa'
    const v1 = riga(id).versione, s1 = JSON.stringify(riga(id).stato);
    let r = await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a, versione: v1, mossa: ok[0] === a ? "m1" : "m2" });
    if (r.status !== 200 || !r.ripetuta || riga(id).versione !== v1 || JSON.stringify(riga(id).stato) !== s1) no("la stessa mossa mandata di nuovo doveva essere ignorata: " + JSON.stringify(r));
    // un secondo clic partito prima di vedere l'effetto del primo (versione vista vecchia)
    r = await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a, versione: v0, mossa: "m3" });
    if (r.status !== 409 || !r.doppia || riga(id).versione !== v1) no("secondo clic con la vista vecchia: " + JSON.stringify(r));
    // con la vista aggiornata si gioca normalmente
    m = mossaBuona(id); if (m) { r = await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a, versione: riga(id).versione, mossa: "m4" }); if (r.status !== 200) no("mossa normale dopo il doppio clic: " + JSON.stringify(r)); }
    // una mossa rifiutata dal motore: 400 con la frase del motore, niente salvato, scritta nel registro
    const v2 = riga(id).versione; r = await chiama("anna", { comando: "azione", partita: id, azione: { tipo: "boh" }, versione: v2, mossa: "m5" });
    if (r.status !== 400 || !r.rifiutata || !r.errore || riga(id).versione !== v2) no("mossa rifiutata: " + JSON.stringify(r));
    // due giocatori che salvano nello stesso momento: il server riprova da solo, nessuno vede "riprova"
    r = await chiama("anna", { comando: "sollecita", partita: id, chi: "g2", subito: true }); if (r.status !== 200) no("tasto di chi ha creato: " + JSON.stringify(r));
    m = mossaBuona(id, ["g1"]);
    if (m) {
      const v3 = riga(id).versione;
      const [x, y] = await Promise.all([chiama("anna", { comando: "azione", partita: id, azione: m.a, versione: v3, mossa: "m6" }), chiama("bea", { comando: "torno", partita: id })]);
      if (x.status !== 200 || y.status !== 200 || riga(id).versione !== v3 + 2) no("due salvataggi insieme: " + JSON.stringify([x, y]) + " versione +" + (riga(id).versione - v3));
      if (srvDi(id).sost && srvDi(id).sost.g2) no("dopo 'torno' Bea risulta ancora sostituita");
    } else no("mosse insieme: Anna non ha una mossa da provare");
  }

  // ---------- 4. GIOCATORE ASSENTE (ON-03): tempo massimo, il computer al suo posto, ritorno
  {
    const { id } = await partitaPronta(true);
    const att = () => (vistaDi(id, "g1").vista.online || {}).attesa || [];
    if (att().length !== 1) no("nella vista manca chi si sta aspettando: " + JSON.stringify(vistaDi(id, "g1").vista.online));
    const X = att()[0] && att()[0].chi, altri = ["g1", "g2", "g3"].filter((g) => g !== X);
    if (att()[0] && att()[0].limite !== 180) no("il tempo massimo del turno deve essere 180 secondi: " + att()[0].limite);
    let r = await chiama(chi[altri[0]], { comando: "sollecita", partita: id }); if (r.status !== 400 || !r.presto || !(r.manca > 170)) no("sollecito troppo presto doveva essere rifiutato: " + JSON.stringify(r));
    r = await chiama("zoe", { comando: "sollecita", partita: id }); if (r.status !== 403) no("un estraneo non puo' sollecitare: " + JSON.stringify(r));
    r = await chiama(chi[altri[0]], { comando: "sollecita", partita: id, chi: X, subito: true }); if (altri[0] !== "g1" && r.status !== 403) no("solo chi ha creato la partita ha il tasto 'subito': " + JSON.stringify(r));
    if (X !== "g1") { r = await chiama("anna", { comando: "sollecita", partita: id, chi: "g1", subito: true }); if (r.status !== 400) no("chi ha creato la partita non puo' sostituire se stesso: " + JSON.stringify(r)); }
    orologio += 179_000; r = await chiama(chi[altri[0]], { comando: "sollecita", partita: id }); if (r.status !== 400) no("a 179 secondi il sollecito doveva essere ancora rifiutato: " + JSON.stringify(r));
    orologio += 2_000; const v0 = riga(id).versione;
    // tutti i browser collegati lo chiedono insieme: deve valere una volta sola
    const [s1, s2] = await Promise.all([chiama(chi[altri[0]], { comando: "sollecita", partita: id }), chiama(chi[altri[1]], { comando: "sollecita", partita: id })]);
    if ([s1, s2].filter((x) => x.status === 200).length !== 1) no("dopo 3 minuti il sollecito doveva riuscire una volta sola: " + JSON.stringify([s1, s2]));
    if (!srvDi(id).sost || !srvDi(id).sost[X]) no("dopo il sollecito " + X + " doveva essere sostituito dal computer");
    const pX = riga(id).stato.players.find((p) => p.id === X);
    if (pX.bot !== false || (pX.strat !== null && pX.strat !== undefined)) no("nello stato salvato l'assente deve restare una persona (bot=false, senza strategia): bot=" + pX.bot + " strat=" + pX.strat);
    if (riga(id).versione !== v0 + 1) no("sollecito: la versione doveva salire di 1");
    const on = vistaDi(id, altri[0]).vista.online;
    if (!on.sost.includes(X)) no("gli altri devono vedere che il computer gioca al posto dell'assente: " + JSON.stringify(on));
    if (on.attesa.some((a) => a.chi === X)) no("un giocatore sostituito non deve piu' risultare 'atteso'");
    // la partita va avanti: gli altri due giocano e il turno dell'assente passa da solo
    let giocate = 0, turniX = 0;
    for (let k = 0; k < 60; k++) { const m = mossaBuona(id, altri); if (!m) break; const c0 = L.corrente(riga(id).stato).id; r = await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a, versione: riga(id).versione }); if (r.status === 200) giocate++; else { const st = riga(id).stato, me = st.players.find((q) => q.id === m.g), pd = st.pending; await chiama(chi[m.g], { comando: "azione", partita: id, azione: pd && pd.tipo === "asta" ? { tipo: "offerta", importo: 0 } : pd && pd.giocatore === m.g ? { tipo: pd.tipo, si: false, importo: 0 } : { tipo: me.haTirato ? "fine_turno" : "tira" } }); } if (riga(id).stato.fase !== "giorno" && riga(id).stato.fase !== "pacchetti") break; }
    const st = riga(id).stato;
    if (giocate < 6) no("con un assente sostituito la partita non va avanti (mosse riuscite: " + giocate + ")");
    if ((st.fase === "giorno" || st.fase === "pacchetti") && attesi1(st) === X) no("la partita e' di nuovo ferma sull'assente");
    if (/"_srv"/.test(JSON.stringify(tabelle.viste))) no("gli appunti del server (_srv) sono finiti in una vista");
    // l'assente torna: una sua mossa (o "torno") e gioca di nuovo lui
    r = await chiama(chi[X], { comando: "torno", partita: id }); if (r.status !== 200 || srvDi(id).sost[X]) no("'torno' non ha tolto la sostituzione: " + JSON.stringify(r));
    if (vistaDi(id, X).vista.online.sost.includes(X)) no("dopo 'torno' la vista dice ancora che e' sostituito");
    // l'ultima persona rimasta non si sostituisce: la partita aspetta, non si gioca da sola
    r = await chiama("anna", { comando: "sollecita", partita: id, chi: "g2", subito: true }); r = await chiama("anna", { comando: "sollecita", partita: id, chi: "g3", subito: true });
    if (riga(id).stato.fase === "giorno" || riga(id).stato.fase === "pacchetti") {
      const a2 = (vistaDi(id, "g1").vista.online.attesa[0] || {}).chi;
      if (a2 !== "g1" && !riga(id).stato.fine) no("con gli altri due sostituiti doveva toccare ad Anna, invece si aspetta " + a2);
      orologio += 200_000; r = await chiama("bea", { comando: "sollecita", partita: id });
      if (r.status !== 400 || !r.ultimo) no("l'ultima persona rimasta non deve essere sostituita: " + JSON.stringify(r));
    }
    r = await chiama("bea", { comando: "azione", partita: id, azione: { tipo: "boh" } }); if (srvDi(id).sost.g2 !== 1) no("una mossa RIFIUTATA non deve far tornare il giocatore");
  }

  // ---------- 5. ASTA: dopo 60 secondi chi non ha offerto "non offre" (e resta lui a giocare)
  {
    const { id } = await partitaPronta(false);
    // si porta la partita al giorno, poi si apre un'asta a mano su un terreno libero
    for (let k = 0; k < 20 && riga(id).stato.fase === "pacchetti"; k++) { const m = mossaBuona(id); if (!m) break; await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a }); }
    const p = riga(id), st = p.stato, libero = st.lotti.find((l) => l.owner == null && l.prezzo > 0 && l.giro === "o" && !l.speciale);
    if (st.fase !== "giorno" || st.pending || !libero) no("asta: non riesco a preparare la prova (fase " + st.fase + ")");
    else {
      st.pending = { tipo: "asta", lotto: libero.id, offerte: {}, giocatore: L.corrente(st).id, partecipanti: st.players.filter((x) => !x.fallito && x.faro === 0).map((x) => x.id) };
      st._srv.att = { g1: orologio, g2: orologio };
      let r = await chiama("anna", { comando: "azione", partita: id, azione: { tipo: "offerta", importo: 0 }, versione: p.versione });
      if (r.status !== 200) no("asta: l'offerta di Anna: " + JSON.stringify(r));
      const a = vistaDi(id, "g1").vista.online.attesa;
      if (a.length !== 1 || a[0].chi !== "g2" || a[0].limite !== 60) no("asta: si doveva aspettare solo Bea, per 60 secondi: " + JSON.stringify(a));
      orologio += 59_000; r = await chiama("anna", { comando: "sollecita", partita: id }); if (r.status !== 400) no("asta: a 59 secondi era presto: " + JSON.stringify(r));
      orologio += 2_000; r = await chiama("anna", { comando: "sollecita", partita: id });
      if (r.status !== 200) no("asta: dopo 60 secondi il sollecito doveva riuscire: " + JSON.stringify(r));
      if (riga(id).stato.pending && riga(id).stato.pending.tipo === "asta") no("asta: dopo il tempo massimo l'asta doveva chiudersi");
      if (srvDi(id).sost.g2) no("asta: chi non offre in tempo non deve essere sostituito dal computer");
    }
  }

  // ---------- 6. RICOMINCIA (ON-11) e viste che non tornano indietro (ON-10)
  {
    const { id } = await partitaPronta(false);
    for (let k = 0; k < 6; k++) { const m = mossaBuona(id); if (!m) break; await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a }); }
    const v0 = riga(id).versione, s0 = JSON.stringify(riga(id).stato);
    let r = await chiama("anna", { comando: "inizia", partita: id }); if (r.status !== 400 || !r.giaIniziata || JSON.stringify(riga(id).stato) !== s0) no("un secondo 'inizia' non deve cancellare la partita in corso: " + JSON.stringify(r));
    r = await chiama("bea", { comando: "inizia", partita: id, ricomincia: true }); if (r.status !== 403 || JSON.stringify(riga(id).stato) !== s0) no("solo chi ha creato la partita puo' ricominciarla: " + JSON.stringify(r));
    r = await chiama("anna", { comando: "inizia", partita: id, ricomincia: true, durata: { modo: "cicli", cicli: 6 } });
    if (r.status !== 200 || riga(id).versione !== v0 + 1) no("ricomincia: la versione deve salire, mai tornare a 1: " + JSON.stringify(r) + " versione " + riga(id).versione);
    if (riga(id).stato.fase !== "pacchetti" || riga(id).stato.ciclo !== 0) no("ricomincia: la partita doveva ripartire da capo");
    for (const g of ["g1", "g2"]) if (vistaDi(id, g).versione !== v0 + 1) no("ricomincia: la vista di " + g + " non e' quella nuova");
    // una vista gia' piu' nuova non viene coperta da una piu' vecchia
    const m = mossaBuona(id); const vg = vistaDi(id, "g2"); vg.versione = 99_999; vg.vista = { segno: "nuova" };
    if (m) { r = await chiama(chi[m.g], { comando: "azione", partita: id, azione: m.a }); if (r.status !== 200) no("viste: mossa non riuscita " + JSON.stringify(r)); if (vistaDi(id, "g2").versione !== 99_999 || vistaDi(id, "g2").vista.segno !== "nuova") no("una vista piu' nuova e' stata coperta da una piu' vecchia"); if (vistaDi(id, "g1").versione !== riga(id).versione) no("viste: quella di g1 doveva aggiornarsi"); }
    if (tabelle.viste.filter((x) => x.partita_id === id).length !== 3) no("viste: ci deve essere una riga per giocatore, ce ne sono " + tabelle.viste.filter((x) => x.partita_id === id).length);
  }

  // ---------- 7. richieste rotte: risposte chiare, mai 500
  {
    let r = await gestore(new Request("https://finto/laguna", { method: "POST", headers: { Authorization: "Bearer anna" }, body: "non sono json" })); if (r.status !== 400) no("un corpo che non e' JSON doveva dare 400, ha dato " + r.status);
    for (const c of [{ comando: "azione" }, { comando: "azione", partita: 7 }, { comando: "sollecita" }, { comando: "torno", partita: null }, { comando: "mio_codice" }, { comando: "rientra" }, { comando: "entra" }, { comando: "inizia" }, { comando: "crea", giocatori: "tanti" }, { comando: "crea", giocatori: [null, 3] }]) { const x = await chiama("anna", c); if (x.status >= 500 || !x.errore) no("richiesta rotta " + JSON.stringify(c) + ": " + JSON.stringify(x)); }
  }
  if (SQL_FINTO && !rpcChiamate) no("con SQL_FINTO=1 il server doveva usare la funzione salva_mossa");
}
// chi si aspetta di giorno (una persona sola), letto dallo stato salvato
function attesi1(st) { if (st.fase === "pacchetti") return st.players[st.sceltaPacchetti[0]].id; const pd = st.pending; return pd && pd.giocatore ? pd.giocatore : L.corrente(st).id; }

(async () => {
  const vr = Math.random, vn = Date.now; Math.random = casuale(seme); Date.now = () => orologio;
  try {
    const g0 = guai.length; await proveOnline();
    console.log("Prove dell'online (rientro, ingressi insieme, doppia mossa, assente, asta, ricomincia, viste)" + (SQL_FINTO ? " con salva_mossa" : " con il ripiego") + ": " + (guai.length === g0 ? "ok" : (guai.length - g0) + " problemi"));
    if (process.env.SOLO_ONLINE === "1") throw new Error("stop");
    // 1. crea, entra, inizia
    let r = await chiama("anna", { comando: "crea", giocatori: [{ nome: "Anna", bot: false }, { nome: "Bea", bot: false }, { nome: "Furbo", bot: true, strategia: "Furbo" }, { nome: "Costruttore", bot: true, strategia: "Costruttore" }] });
    if (r.status !== 200 || !r.partita) { guai.push("crea: " + JSON.stringify(r)); throw new Error("stop"); }
    const idP = r.partita, codice = r.codice;
    r = await chiama("anna", { comando: "inizia", partita: idP }); if (r.status !== 400) guai.push("inizia senza tutti i giocatori doveva essere rifiutato: " + JSON.stringify(r));
    r = await chiama("bea", { comando: "entra", codice, nome: "Bea" }); if (r.status !== 200 || r.player !== "g2") guai.push("entra: " + JSON.stringify(r));
    r = await chiama("bea", { comando: "inizia", partita: idP }); if (r.status !== 403) guai.push("solo chi ha creato la partita la può iniziare: " + JSON.stringify(r));
    r = await chiama("anna", { comando: "inizia", partita: idP, durata: { modo: "cicli", cicli: Math.max(6, cicli) }, principianti: false }); if (r.status !== 200) { guai.push("inizia: " + JSON.stringify(r)); throw new Error("stop"); }
    r = await chiama("zoe", { comando: "azione", partita: idP, azione: { tipo: "tira" } }); if (r.status !== 403) guai.push("chi non gioca non deve poter agire: " + JSON.stringify(r));
    r = await chiama("", { comando: "azione", partita: idP, azione: { tipo: "tira" } }); if (r.status !== 401) guai.push("senza accesso doveva dare 401: " + JSON.stringify(r));
    const riga = () => tabelle.partite.find((p) => p.id === idP);
    const chi = { g1: "anna", g2: "bea" };
    const controllaViste = (quando) => {
      const p = riga();
      for (const g of p.stato.players) {
        const v = tabelle.viste.find((x) => x.partita_id === idP && x.player_id === g.id);
        if (!v) { guai.push(quando + ": manca la vista di " + g.nome); continue; }
        if (v.versione !== p.versione) guai.push(quando + ": la vista di " + g.nome + " è alla versione " + v.versione + ", la partita alla " + p.versione);
        const j = JSON.stringify(v.vista);
        if (/"mazzo":/.test(j) || v.vista.manoSM) guai.push(quando + ": nella vista di " + g.nome + " c'è un mazzo o una mano di carte");
        if (v.vista.rngState !== undefined || v.vista.seed !== undefined) guai.push(quando + ": nella vista di " + g.nome + " c'è il seme dei dadi");
        for (const q of v.vista.players) if (q.id !== g.id) { for (const k of ["cash", "sporchi", "tracce", "debito", "messaggi", "prove", "valigetta", "prestiti", "_n"]) if (k in q) guai.push(quando + ": " + g.nome + " vede " + k + " di " + q.nome); if (L.CAMPI_PUBBLICI) for (const k of Object.keys(q)) if (k !== "fascia" && !L.CAMPI_PUBBLICI.includes(k)) guai.push(quando + ": " + g.nome + " vede il campo non pubblico '" + k + "' di " + q.nome); }
      }
      if (/"_srv"/.test(JSON.stringify(tabelle.viste.filter((x) => x.partita_id === idP)))) guai.push(quando + ": gli appunti del server (_srv) sono finiti in una vista");
      const fuori = []; (function giro(x, d) { if (typeof x === "number") { if (!Number.isFinite(x)) fuori.push(d); } else if (x && typeof x === "object") for (const k of Object.keys(x)) giro(x[k], d + "." + k); })(p.stato, "stato");
      if (fuori.length) guai.push(quando + ": numeri rotti nello stato salvato: " + fuori.slice(0, 3).join(", "));
    };
    controllaViste("dopo inizia");
    // 2. un'azione sbagliata: rifiutata (400), niente salvato
    { const v0 = riga().versione, s0 = JSON.stringify(riga().stato);
      for (const a of [{ tipo: "regala", a: "g2", importo: "abc" }, { tipo: "regala", a: "g2", importo: {} }, { tipo: "contratto", contratto: null }, { tipo: "stanza", stanza: "constructor" }, { tipo: "boh" }, null, "tira"]) {
        const x = await chiama("anna", { comando: "azione", partita: idP, azione: a });
        if (x.status !== 400) guai.push("azione sbagliata " + JSON.stringify(a) + ": attesa risposta 400, arrivata " + x.status + " " + (x.errore || ""));
      }
      if (riga().versione !== v0 || JSON.stringify(riga().stato) !== s0) guai.push("un'azione rifiutata ha cambiato la partita salvata"); }
    // 3. la partita: le due persone giocano come giocherebbe un bot prudente (la mossa si calcola su una copia dello stato)
    let mosse = 0, rifiutate = 0, fermo = 0;
    while (!riga().finita && riga().stato.ciclo < cicli && mosse < 4000) {
      const p = riga(); let fatta = false;
      for (const id of ["g1", "g2"]) {
        const c = JSON.parse(JSON.stringify(p.stato)); delete c._srv; const io = c.players.find((x) => x.id === id); io.bot = true; io.strat = id === "g1" ? "Legale" : "Esperto";
        let a = null; try { a = B.prossima(c, io); } catch (e) { guai.push("prossima: " + e.message); }
        if (!a) continue;
        const v0 = p.versione, x = await chiama(chi[id], { comando: "azione", partita: idP, azione: a });
        mosse++;
        if (x.status === 200) { fatta = true; if (riga().versione !== v0 + 1) guai.push("dopo una mossa la versione doveva salire di 1: " + v0 + " → " + riga().versione); if (mosse % 15 === 0) controllaViste("mossa " + mosse); break; }
        if (x.status === 400) { rifiutate++; // mossa rifiutata: si prova la via d'uscita piu' semplice, come farebbe una persona
          const st = riga().stato, me = st.players.find((q) => q.id === id), pd = st.pending;
          const b = st.fase === "notte" ? { tipo: "torna_a_casa" } : pd && pd.tipo === "asta" ? { tipo: "offerta", importo: 0 } : pd && pd.giocatore === id ? { tipo: pd.tipo, si: false, importo: 0 } : { tipo: me.haTirato ? "fine_turno" : "tira" };
          const y = await chiama(chi[id], { comando: "azione", partita: idP, azione: b }); mosse++; if (y.status === 200) { fatta = true; break; } }
        else guai.push("risposta " + x.status + " a " + JSON.stringify(a).slice(0, 120) + ": " + (x.errore || ""));
      }
      if (!fatta) { // nessuno ha una mossa: di notte e' l'orologio
        if (riga().stato.fase === "notte") { orologio += 125_000; const x = await chiama("anna", { comando: "azione", partita: idP, azione: { tipo: "tempo_scaduto" } }); mosse++; if (x.status !== 200 && ++fermo > 5) { guai.push("la notte non va avanti: " + (x.errore || x.status)); break; } }
        else if (++fermo > 5) { guai.push("la partita è ferma di giorno (Ciclo " + (riga().stato.ciclo + 1) + ", tocca a " + L.corrente(riga().stato).nome + ")"); break; }
      } else fermo = 0;
    }
    controllaViste("alla fine");
    const st = riga().stato;
    console.log(`Giocate ${mosse} mosse delle persone (${rifiutate} rifiutate), versione della partita ${riga().versione}, arrivati al Ciclo ${st.ciclo + 1} (${st.fase})${st.fine ? ", partita finita" : ""}; righe nel registro delle azioni: ${tabelle.azioni.length}`);
    if (st.ciclo < Math.min(cicli, 2) && !st.fine) guai.push("la partita non è andata avanti");
  } catch (e) { if (e.message !== "stop") guai.push("la prova si è interrotta: " + e.message + " " + String(e.stack).split("\n")[1]); }
  finally { Math.random = vr; Date.now = vn; console.error = vecchioErr; }
  for (const e of [...new Set(errori500)].slice(0, 6)) guai.push("errore scritto dal server (console.error): " + e);
  // le stesse prove dell'online, ma come sara' dopo la migrazione (funzione SQL salva_mossa)
  if (!SQL_FINTO && process.env.SOLO_ONLINE !== "1") {
    const r = require("child_process").spawnSync(process.execPath, [__filename, "2", String(seme)], { env: { ...process.env, SQL_FINTO: "1", SOLO_ONLINE: "1" }, encoding: "utf8" });
    const u = (r.stdout || "").trim().split("\n"); console.log(u.filter((x) => /^Prove dell'online/.test(x)).join("\n"));
    if (r.status !== 0) for (const x of u.filter((y) => /^  - /.test(y))) guai.push("[con salva_mossa] " + x.slice(4));
  }
  if (guai.length) { console.log("SERVER FINTO: NON VA"); for (const g of [...new Set(guai)].slice(0, 20)) console.log("  - " + g.slice(0, 300)); process.exit(1); }
  console.log("SERVER FINTO: OK");
})();
