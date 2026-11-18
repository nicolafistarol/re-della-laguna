#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — il giro di tutte le app del telefono, nel browser
//   node app.js [uscita.json]          (REPO=/percorso/copia per una copia di lavoro)
//   node app.js --confronta a.json b.json    dice quali app sono cambiate tra due giri
// Carica una partita avanzata sempre uguale (giocata dai bot con un seme fisso e poi arricchita:
// Livello 4, setta, contratti, Grandi Affari...), di giorno e di notte, apre il telefono e ogni app.
// Fallisce (codice 1) se una app dà un errore o resta vuota. Salva in un file il contenuto di ogni app:
// serve per controllare che uno spostamento di codice (es. dividere contenutoApp) non cambi NIENTE a schermo.
// =====================================================================
const fs = require("fs"), path = require("path");
if (process.argv[2] === "--confronta") {
  const a = JSON.parse(fs.readFileSync(process.argv[3], "utf8")), b = JSON.parse(fs.readFileSync(process.argv[4], "utf8")); let diversi = 0;
  for (const quando of Object.keys(a)) for (const k of new Set([...Object.keys(a[quando]), ...Object.keys(b[quando] || {})])) {
    const x = a[quando][k], y = (b[quando] || {})[k];
    if (x === y) continue; diversi++;
    let i = 0; while (x && y && i < x.length && x[i] === y[i]) i++;
    console.log(`DIVERSA  ${quando} / ${k}: ${x === undefined ? "prima non c'era" : y === undefined ? "ora non c'è" : "dal carattere " + i + ": «" + x.slice(Math.max(0, i - 40), i + 60).replace(/\s+/g, " ") + "»  →  «" + y.slice(Math.max(0, i - 40), i + 60).replace(/\s+/g, " ") + "»"}`);
  }
  console.log(diversi ? `${diversi} app diverse` : "Tutte le app sono identiche"); process.exit(diversi ? 1 : 0);
}
let chromium;
for (const p of ["playwright-core", path.join(__dirname, "../node_modules/playwright-core"), "/home/claude/prove/node_modules/playwright-core"]) { try { chromium = require(p).chromium; break; } catch (e) { } }
if (!chromium) { console.error("Manca playwright-core"); process.exit(2); }
const { REPO, carica, gioca } = require("./laguna.js");
const THREE = [path.join(__dirname, "node_modules/three"), path.join(__dirname, "../node_modules/three"), "/home/claude/prove/node_modules/three"].find((p) => fs.existsSync(p));
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => fs.existsSync(p));
const USCITA = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, "risultati", "app.json");
const { L, B } = carica();

// ---- la partita avanzata, sempre uguale
function partita(notte) {
  const r = gioca(L, B, { seed: 21, giocatori: 4, durata: { modo: "libera" }, giro: 0, caratteri: ["Esperto", "Furbo", "Legale", "Costruttore"],
    fermaSe: (s) => s.ciclo >= 9 && (notte ? s.fase === "notte" && s.notte && s.notte.ora === 0 : s.fase === "giorno" && !s.pending && L.corrente(s).id === "g1" && !L.corrente(s).haTirato && L.corrente(s).faro === 0) });
  const s = r.stato, io = s.players[0], altro = s.players[1], terzo = s.players[2];
  io.bot = false; io.strat = null; io.nome = "Tu"; io.faro = 0;
  io.livello = 4; io.cash = 60_000_000; io.sporchi = 20_000_000; io.fama = 80; io.debito = 2_000_000; io.prestiti = [{ importo: 2_000_000, inizio: s.ciclo, scadenza: s.ciclo + 3 }];
  io.valigetta = [{ id: "maschera", notti: null }, { id: "telefono", notti: null }]; io.prove.push({ su: altro.id, ciclo: s.ciclo, cosa: "una foto al Porto" }); io.corrotti.commissario = { dal: s.ciclo - 1 };
  io.azioni[L.AZIENDE[0]] = 5000; io.cripto[L.MONETE[0]] = 20000; if (!io.veicoli.includes("yacht")) io.veicoli.push("yacht");
  if (io.piani < 14) { io.piani = 14; io.funzioniPiani = Array(14).fill("appartamenti"); }
  const st = { id: "s90", nome: "La Mano Nera", motto: "Nessuno vede, tutti pagano.", gm: io.id, membri: [io.id, altro.id], tesoro: 30_000_000, operazioni: 2, pngReclutati: 1, influenza: 40, chat: [{ da: altro.id, nome: altro.nome, testo: "Ci vediamo al Faro.", ciclo: s.ciclo, notte: false }] };
  if (!s.sette.some((x) => x.membri.includes(io.id))) { s.sette = s.sette.filter((x) => !x.membri.includes(altro.id)); for (const q of s.players) q.sette = (q.sette || []).filter((id) => s.sette.some((x) => x.id === id)); s.sette.push(st); io.sette = ["s90"]; io.settaFondata = "s90"; altro.sette = ["s90"]; }
  const mio = s.lotti.find((l) => l.owner === io.id), suo = s.lotti.find((l) => l.owner === terzo.id);
  s.contratti.push({ id: "c9001", da: terzo.id, a: io.id, tipo: "notarile", pagoOra: 500_000, chiPagaOra: "da", pagoDopo: 2_000_000, chiPagaDopo: "a", scadenza: s.ciclo + 2, garanzia: null, lottoCeduto: null, testo: "Un prestito tra amici.", stato: "proposto" });
  s.contratti.push({ id: "c9002", da: io.id, a: altro.id, tipo: "parola", pagoOra: 0, chiPagaOra: "da", pagoDopo: 1_000_000, chiPagaDopo: "a", scadenza: s.ciclo + 1, garanzia: null, lottoCeduto: null, testo: "", stato: "attivo" });
  if (suo) s.proposte.push({ id: "q9001", da: terzo.id, a: io.id, lotto: suo.id, prezzo: 1_500_000, compro: false, stato: "proposta", ciclo: s.ciclo });
  s.grandi = s.grandi || {}; s.grandi.tv = { stato: "attiva", offerte: {}, quote: { [io.id]: 6, [altro.id]: 2 }, mercato: 2, prezzoQuota: 3_000_000, capo: io.id, titoloneCiclo: -1, quoteCiclo: {} };
  s.grandi.banca = { stato: "asta", offerte: { [io.id]: 16_000_000 }, quote: {}, mercato: 0, prezzoQuota: 0, capo: null, titoloneCiclo: -1, quoteCiclo: {} };
  io.messaggi.push({ ciclo: s.ciclo + 1, testo: "Vera: \"Hai un contratto da guardare.\"" });
  if (notte) { s.notte.dove[io.id] = "palazzo"; delete s.notte.viaggio[io.id]; delete s.notte.chiuso[io.id]; delete s.notteFatti[io.id]; }
  L.vista(s, io.id); // deve funzionare
  return s;
}
const tipi = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".json": "application/json" };
const FINTO_SUPA = `export function createClient(){const q={select(){return q},eq(){return q},single(){return Promise.resolve({data:null,error:{message:"finto"}})},maybeSingle(){return Promise.resolve({data:null,error:null})},then(r){r({data:[],error:null})}};return{from(){return q},schema(){return{from(){return q}}},functions:{invoke:async()=>({data:null,error:{message:"finto"}})},channel(){return{on(){return this},subscribe(){return this}}},removeChannel(){},auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>({data:{},error:null}),onAuthStateChange(){return{data:{subscription:{unsubscribe(){}}}}}}}}`;

(async () => {
  console.log(`APP  repo=${REPO}  uscita=${USCITA}`);
  const problemi = [], uscita = {};
  const b = await chromium.launch({ executablePath: CHROME, args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  for (const quando of ["giorno", "notte"]) {
    const stato = JSON.stringify(partita(quando === "notte"));
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await ctx.addInitScript((j) => { try { localStorage.setItem("laguna_locale", j); localStorage.setItem("laguna_guida_vista", "1"); localStorage.setItem("laguna_guidata", "0"); } catch (e) { } }, stato);
    const pg = await ctx.newPage();
    const guai = (t) => { problemi.push(`[${quando}] ${t}`); console.log("   !! " + t); };
    pg.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) guai("console.error: " + m.text().slice(0, 300)); });
    pg.on("pageerror", (e) => guai("errore della pagina: " + e.message + " " + ((String(e.stack).match(/gioco\.test\/[^)\s]+/) || [""])[0])));
    await pg.route("**/*", async (r) => {
      const u = new URL(r.request().url());
      if (u.hostname === "gioco.test") { const f = path.join(REPO, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname)); if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ body: fs.readFileSync(f), contentType: tipi[path.extname(f)] || "application/octet-stream" }); return r.fulfill({ status: 404, body: "no" }); }
      if (u.hostname === "unpkg.com") { const f = path.join(THREE, u.pathname.replace(/^\/three@[^/]+/, "")); if (fs.existsSync(f)) return r.fulfill({ body: fs.readFileSync(f), contentType: "text/javascript" }); }
      if (u.hostname === "esm.sh" || u.hostname.includes("supabase") || u.hostname.includes("jsdelivr")) return r.fulfill({ body: FINTO_SUPA, contentType: "text/javascript" });
      if (u.hostname.includes("fonts.")) return r.fulfill({ body: "", contentType: "text/css" });
      return r.fulfill({ status: 404, body: "" });
    });
    await pg.goto("https://gioco.test/?locale&2d&veloce"); // 2d e veloce: qui interessa il telefono, non il tabellone
    await pg.waitForTimeout(2500);
    const clic = (sel) => pg.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return false; el.click(); return true; }, sel);
    // chiude finestre che coprono (Alba, novita'...)
    for (let i = 0; i < 8; i++) { const c = await pg.evaluate(() => { const v = document.querySelector(".velo"); if (!v) return false; const b = [...v.querySelectorAll("button")].find((x) => /capito|ok|chiudi|continua|avanti|va bene|esco|no/i.test(x.textContent)) || v.querySelector("button"); if (b) b.click(); return !!b; }); if (!c) break; await pg.waitForTimeout(300); }
    if (!(await clic("#apriTel"))) { guai("non trovo il pulsante del telefono"); await ctx.close(); continue; }
    await pg.waitForTimeout(500);
    const app = await pg.evaluate(() => [...new Set([...document.querySelectorAll("#telefonoBox .app[data-app]")].map((x) => x.dataset.app))]);
    uscita[quando] = {};
    uscita[quando]["(home)"] = await pg.evaluate(() => { const h = document.querySelector("#telefonoBox .schermo"); return h ? h.innerHTML : ""; });
    for (const k of app) {
      if (!(await clic(`#telefonoBox .app[data-app="${k}"]`))) { guai("non riesco ad aprire l'app " + k); continue; }
      await pg.waitForTimeout(350);
      const html = await pg.evaluate(() => { const c = document.querySelector("#telefonoBox .app-corpo"); return c ? c.innerHTML : null; });
      if (html === null) guai("l'app " + k + " non si è aperta"); else if (html.replace(/<[^>]+>/g, "").trim().length < 10) guai("l'app " + k + " è vuota");
      uscita[quando][k] = html || "";
      if (!(await clic("#indietro"))) { await clic("#apriTel"); }
      await pg.waitForTimeout(250);
    }
    console.log(`   ${quando}: ${app.length} app aperte (${app.join(", ")})`);
    if (app.length < 15) guai("mi aspettavo almeno 15 app visibili con questa partita, ne vedo " + app.length);
    await ctx.close();
  }
  await b.close();
  fs.mkdirSync(path.dirname(USCITA), { recursive: true }); fs.writeFileSync(USCITA, JSON.stringify(uscita, null, 1));
  const quante = Object.values(uscita).reduce((a, x) => a + Object.keys(x).length, 0);
  if (problemi.length) { console.log(`APP: NON VA (${problemi.length} problemi)`); for (const x of [...new Set(problemi)]) console.log("  - " + x); process.exit(1); }
  console.log(`APP: OK (${quante} schermate salvate)`);
})();
