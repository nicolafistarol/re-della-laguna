#!/usr/bin/env node
// =====================================================================
// RE DELLA LAGUNA — prova di fumo nel browser (Chrome senza finestra)
//   node fumo.js [cartella-foto]
//   REPO=/percorso/copia node fumo.js
// Per PC (1280x800) e telefono (390x844):
//   apre ?locale&nuova, chiude le slide, avvia, sceglie una storia, tira i dadi,
//   compra (o lascia stare), fine turno, apre il telefono e un'app,
//   poi salta alla notte facendo giocare i bot (window.Laguna / window.LagunaBot)
//   e apre la notte.
// FALLISCE (codice 1) se: un errore della pagina, un console.error, un file del gioco
// che manca (404), o un passo obbligatorio che non riesce. Salva una foto a ogni passo.
// Basato su /home/claude/prove/foto.js (stesso modo di servire il repo e three.js).
// =====================================================================
const fs = require("fs"), path = require("path");
let chromium;
for (const p of ["playwright-core", path.join(__dirname, "../node_modules/playwright-core"), "/home/claude/prove/node_modules/playwright-core"]) { try { chromium = require(p).chromium; break; } catch (e) { } }
if (!chromium) { console.error("Manca playwright-core (npm install playwright-core)"); process.exit(2); }
const REPO = path.resolve(process.env.REPO || "/home/claude/re-della-laguna");
const THREE = [path.join(__dirname, "node_modules/three"), path.join(__dirname, "../node_modules/three"), "/home/claude/prove/node_modules/three"].find((p) => fs.existsSync(p));
const CHROME = process.env.CHROME || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find((p) => fs.existsSync(p));
const FOTO = path.resolve(process.argv[2] || path.join(__dirname, "foto"));
fs.mkdirSync(FOTO, { recursive: true });

const tipi = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".json": "application/json" };
const FINTO_SUPA = `export function createClient(){const q={select(){return q},eq(){return q},single(){return Promise.resolve({data:null,error:{message:"finto"}})},maybeSingle(){return Promise.resolve({data:null,error:null})},then(r){r({data:[],error:null})}};return{from(){return q},schema(){return{from(){return q}}},functions:{invoke:async()=>({data:null,error:{message:"finto"}})},channel(){return{on(){return this},subscribe(){return this}}},removeChannel(){},auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>({data:{},error:null}),onAuthStateChange(){return{data:{subscription:{unsubscribe(){}}}}}}}}`;

const SCHERMI = [["pc", 1280, 800], ["telefono", 390, 844]].filter((x) => !process.env.SCHERMO || process.env.SCHERMO === x[0]); // SCHERMO=pc per provarne uno solo
const problemi = []; // errori che fanno fallire
const note = [];     // cose strane che non fanno fallire

async function unoSchermo(b, nome, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: nome === "telefono", isMobile: nome === "telefono" });
  const pg = await ctx.newPage();
  const guai = (t) => { problemi.push(`[${nome}] ${t}`); console.log("   !! " + t); };
  pg.on("console", (m) => { if (m.type() === "error") { const t = m.text(); if (/Failed to load resource/.test(t)) return; guai("console.error: " + t.slice(0, 300)); } });
  pg.on("pageerror", (e) => guai("errore della pagina: " + e.message + " " + ((String(e.stack).match(/gioco\.test\/[^)\s]+/) || [""])[0])));
  await pg.route("**/*", async (r) => {
    const u = new URL(r.request().url());
    if (u.hostname === "gioco.test") {
      const f = path.join(REPO, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname));
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ body: fs.readFileSync(f), contentType: tipi[path.extname(f)] || "application/octet-stream" });
      if (u.pathname !== "/favicon.ico") guai("file del gioco che manca (404): " + u.pathname);
      return r.fulfill({ status: 404, body: "no" });
    }
    if (u.hostname === "unpkg.com") { const f = path.join(THREE, u.pathname.replace(/^\/three@[^/]+/, "")); if (fs.existsSync(f)) return r.fulfill({ body: fs.readFileSync(f), contentType: "text/javascript" }); }
    if (u.hostname === "esm.sh" || u.hostname.includes("supabase") || u.hostname.includes("jsdelivr")) return r.fulfill({ body: FINTO_SUPA, contentType: "text/javascript" });
    if (u.hostname.includes("fonts.")) return r.fulfill({ body: "", contentType: "text/css" });
    return r.fulfill({ status: 404, body: "" });
  });
  let n = 0;
  const foto = async (cosa) => { const f = path.join(FOTO, `${nome}-${String(++n).padStart(2, "0")}-${cosa}.png`); try { await pg.screenshot({ path: f }); } catch (e) { note.push(`[${nome}] foto non riuscita: ${cosa}`); } };
  // lo stato vero della partita locale (salvato dal gioco nel browser)
  const stato = () => pg.evaluate(() => { try { const s = JSON.parse(localStorage.getItem("laguna_locale")); const me = s.players[0]; return { fase: s.fase, ciclo: s.ciclo, giorno: s.giorno, pending: s.pending ? s.pending.tipo + ":" + s.pending.giocatore : null, tocca: s.fase === "giorno" ? s.players[s.ordine[s.turno]].id : null, haTirato: me.haTirato, pos: me.pos, pacchetto: me.pacchetto, cash: me.cash, lotti: s.lotti.filter((l) => l.owner === "g1").length, notte: s.notte ? s.notte.ora : null, fine: s.fine }; } catch (e) { return null; } });
  // clicca il primo pulsante visibile che corrisponde (selettore CSS, oppure testo che contiene una delle parole)
  const clicca = (cosa) => pg.evaluate((cosa) => {
    const visibile = (el) => { const r = el.getBoundingClientRect(), st = getComputedStyle(el); return r.width > 2 && r.height > 2 && st.visibility !== "hidden" && st.display !== "none" && !el.disabled; };
    let el = null;
    if (cosa.css) el = [...document.querySelectorAll(cosa.css)].find(visibile);
    if (!el && cosa.testo) el = [...document.querySelectorAll("button, a, [role=button], .app, .sch")].find((x) => visibile(x) && cosa.testo.some((t) => (x.textContent || "").trim().toLowerCase().includes(t)));
    if (!el) return null;
    // il pulsante deve essere davvero toccabile: non coperto da altro
    const r = el.getBoundingClientRect(), sopra = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const coperto = !(sopra && (sopra === el || el.contains(sopra) || sopra.contains(el)));
    const fuori = r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth;
    el.click();
    return { testo: (el.textContent || "").trim().slice(0, 40), coperto, fuori };
  }, cosa);
  const aspetta = (ms) => pg.waitForTimeout(ms);
  const passo = async (titolo, obbligatorio, fn) => {
    let ok = false, info = ""; const t0 = Date.now();
    try { const r = await fn(); ok = !!r; info = typeof r === "string" ? r : ""; } catch (e) { info = "eccezione: " + e.message.split("\n")[0]; }
    console.log(`   ${ok ? "ok  " : obbligatorio ? "NO  " : "--  "} ${titolo}${info ? " (" + info + ")" : ""}  [${((Date.now() - t0) / 1000).toFixed(0)} s]`);
    if (!ok && obbligatorio) guai("passo non riuscito: " + titolo + (info ? " — " + info : ""));
    if (!ok && !obbligatorio) note.push(`[${nome}] passo saltato: ${titolo}${info ? " — " + info : ""}`);
    await foto(titolo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28));
    return ok;
  };
  const toccato = (r, cosa) => { if (r && r.coperto) note.push(`[${nome}] il pulsante "${r.testo}" (${cosa}) è coperto da qualcos'altro: un dito non lo prende`); if (r && r.fuori) note.push(`[${nome}] il pulsante "${r.testo}" (${cosa}) è fuori dallo schermo`); return r; };

  console.log(`\n== ${nome} ${w}x${h} ==`);
  await pg.goto("https://gioco.test/?locale&nuova&seed=7");
  await aspetta(2500);
  await passo("Pagina aperta", true, async () => (await pg.evaluate(() => !!(window.Laguna && window.LagunaBot && document.querySelector("#radice") && document.querySelector("#radice").children.length))) && "motore e bot caricati");
  await passo("Slide chiuse", false, async () => { let k = 0; for (let i = 0; i < 12; i++) { const r = await clicca({ css: "#gX, .guida-x" }); if (!r) break; k++; await aspetta(250); } return (await pg.evaluate(() => !document.querySelector("#guida"))) && (k ? "chiuse" : "non c'erano"); });
  await passo("Avvio partita", true, async () => { toccato(await clicca({ css: "#via" }), "Inizia"); await aspetta(3500); const s = await stato(); return s && "fase " + s.fase; });
  await passo("Slide dentro la partita chiuse", false, async () => { for (let i = 0; i < 12; i++) { const r = await clicca({ css: "#gX, .guida-x" }); if (!r) break; await aspetta(250); } return !(await pg.evaluate(() => !!document.querySelector("#guida"))); });
  await passo("Scelta della storia", true, async () => {
    for (let i = 0; i < 8; i++) { const s = await stato(); if (!s) return false; if (s.pacchetto) return "storia: " + s.pacchetto; toccato(await clicca({ css: "[data-pk]" }), "storia"); await aspetta(1500); }
    const s = await stato(); return s && s.pacchetto && "storia: " + s.pacchetto;
  });
  // chiude finestre informative che coprono il gioco (consigli, novita', carte)
  const sgombra = async () => { for (let i = 0; i < 6; i++) { const r = await clicca({ testo: ["ho capito", "capito", "ok", "va bene", "chiudi", "continua", "avanti"] }); if (!r) break; await aspetta(400); } };
  await passo("Tiro dei dadi", true, async () => {
    for (let i = 0; i < 14; i++) {
      const s = await stato(); if (!s) return false;
      if (s.haTirato || s.pending) return "posizione " + s.pos + (s.pending ? ", in attesa: " + s.pending : "");
      if (s.fase !== "giorno") return "fase " + s.fase;
      const r = toccato(await clicca({ css: "#tira, [data-az=tira], #dadi" }) || await clicca({ testo: ["tira i dadi", "tira"] }), "Tira");
      if (!r) await sgombra();
      await aspetta(1800);
    }
    const s = await stato(); return s && (s.haTirato || !!s.pending) && "posizione " + s.pos;
  });
  await passo("Compra o lascia stare", false, async () => {
    const s0 = await stato(); if (!s0 || !s0.pending || !s0.pending.startsWith("compra")) return "nessun terreno da comprare su questa casella";
    // la finestra arriva quando la pedina ha finito di muoversi: aspetto fino a 25 secondi
    try { await pg.waitForSelector("#si, #no", { state: "visible", timeout: 25000 }); } catch (e) { guai("dopo 25 secondi la finestra Compro/Lascio stare non è ancora comparsa"); return false; }
    await foto("finestra-compra");
    const r = toccato(await clicca({ css: "#si" }), "Compro") || toccato(await clicca({ css: "#no" }), "Lascio stare");
    await aspetta(1500); const s = await stato();
    if (s.pending && s.pending.startsWith("compra")) { guai("la finestra Compro/Lascio stare non risponde"); return false; }
    return r ? (s.lotti > s0.lotti ? "comprato" : "non comprato") : false;
  });
  await passo("Fine turno", true, async () => {
    for (let i = 0; i < 16; i++) {
      const s = await stato(); if (!s) return false;
      if (s.fase !== "giorno" || !s.haTirato && s.tocca === "g1" && i > 0 || s.tocca !== "g1") return "ora: " + s.fase + ", Ciclo " + (s.ciclo + 1) + ", giorno " + (s.giorno + 1);
      if (s.pending && s.pending.endsWith(":g1")) { (await clicca({ css: "#no" })) || (await clicca({ css: "#si" })) || await sgombra(); await aspetta(1200); continue; }
      const r = toccato(await clicca({ css: "#fine, #fineTurno, [data-az=fine_turno]" }) || await clicca({ testo: ["fine turno", "finisci il turno", "passa il turno"] }), "Fine turno");
      if (!r) await sgombra();
      await aspetta(1500);
    }
    return false;
  });
  await passo("Telefono aperto", true, async () => { await sgombra(); const r = toccato(await clicca({ css: "#apriTel" }), "telefono"); await aspetta(1000); return r && (await pg.evaluate(() => document.querySelectorAll("#telefonoBox .app").length)) > 0 && "app visibili"; });
  await passo("Un'app del telefono", false, async () => { const r = toccato(await clicca({ css: "#telefonoBox .app:not(.spenta)" }), "app"); await aspetta(900); return r && r.testo; });
  // salto alla notte: i bot giocano anche per me, direttamente sul motore
  await passo("Salto alla notte con i bot", true, async () => {
    const r = await pg.evaluate(() => {
      const L = window.Laguna, B = window.LagunaBot, s = JSON.parse(localStorage.getItem("laguna_locale")), me = s.players[0];
      me.bot = true; me.strat = "Esperto"; let mosse = 0, rifiuti = 0;
      for (let i = 0; i < 6000 && s.fase !== "notte" && !s.fine; i++) {
        let bot = null, a = null;
        for (const p of s.players) if (p.bot) { const x = B.prossima(s, p); if (x) { bot = p; a = x; break; } }
        if (!bot) break;
        try { L.applica(s, bot.id, a); mosse++; }
        catch (e) { if (!e.gioco) return { errore: e.message + " | " + String(e.stack).split("\n")[1] }; rifiuti++;
          try { if (s.pending && s.pending.tipo === "asta") L.applica(s, bot.id, { tipo: "offerta", importo: 0 }); else if (s.pending && s.pending.giocatore === bot.id) L.applica(s, bot.id, { tipo: s.pending.tipo, si: false, importo: 0 }); else L.applica(s, bot.id, bot.haTirato ? { tipo: "fine_turno" } : { tipo: "tira" }); } catch (e2) { break; } }
      }
      me.bot = false; delete me.strat;
      // la vista non deve cambiare lo stato vero
      const prima = JSON.stringify(s); const v = L.vista(s, "g1"); const uguale = JSON.stringify(s) === prima;
      localStorage.setItem("laguna_locale", JSON.stringify(s));
      return { fase: s.fase, mosse, rifiuti, uguale, vistaNotte: !!v.notte };
    });
    if (r.errore) { guai("il motore si rompe nel browser: " + r.errore); return false; }
    if (!r.uguale) guai("vista() ha cambiato lo stato vero (nel browser)");
    return r.fase === "notte" && `${r.mosse} mosse dei bot`;
  });
  await passo("Notte aperta", true, async () => {
    await pg.goto("https://gioco.test/?locale"); await aspetta(4500);
    for (let i = 0; i < 12; i++) { const r = await clicca({ css: "#gX, .guida-x" }); if (!r) break; await aspetta(250); }
    const s = await stato(); const testo = await pg.evaluate(() => document.querySelector("#radice").innerText.length);
    return s && s.fase === "notte" && testo > 50 && "ora " + s.notte;
  });
  await passo("Una mossa di notte", false, async () => {
    const prima = await stato();
    const r = toccato(await clicca({ css: "[data-vai], [data-luogo]" }) || await clicca({ testo: ["esco", "vai", "aspetta", "resto"] }), "mossa di notte");
    await aspetta(1200); (await clicca({ css: "#si" })); await aspetta(1500);
    return r && r.testo;
  });
  await passo("Telefono di notte", false, async () => { const r = await clicca({ css: "#apriTel" }); await aspetta(900); return r && (await pg.evaluate(() => document.querySelectorAll("#telefonoBox .app").length)) > 0; });
  await ctx.close();
}

(async () => {
  console.log(`FUMO  repo=${REPO}  foto in ${FOTO}`);
  if (!CHROME) { console.error("Non trovo Chrome (imposta CHROME=/percorso)"); process.exit(2); }
  const b = await chromium.launch({ executablePath: CHROME, args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  const tutto0 = Date.now();
  try { for (const [nome, w, h] of SCHERMI) await unoSchermo(b, nome, w, h); }
  catch (e) { problemi.push("la prova si è interrotta: " + e.message.split("\n")[0]); }
  await b.close();
  console.log(`\nTempo: ${((Date.now() - tutto0) / 1000).toFixed(0)} s`);
  if (note.length) { console.log("\nNOTE (non bloccano):"); for (const x of [...new Set(note)]) console.log("  - " + x); }
  if (problemi.length) { console.log(`\nFUMO: NON VA (${problemi.length} problemi)`); for (const x of [...new Set(problemi)]) console.log("  - " + x); process.exit(1); }
  console.log("\nFUMO: OK");
})();
