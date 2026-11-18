// Uso: node foto.js "<query>" <larghezza>x<altezza> <uscita.png> [attesa_ms] [script.js da eseguire in pagina]
// Esempio: node foto.js "?locale&nuova" 1280x800 /tmp/a.png 4000
// Serve il repo da https://gioco.test/, three.js dal node_modules, supabase finto.
// Stampa i messaggi della console e gli errori della pagina.
const { chromium } = require("playwright-core");
const fs = require("fs"), path = require("path");
const REPO = process.env.REPO || "/home/claude/re-della-laguna";
const THREE = path.join(__dirname, "node_modules/three");
const [q = "?locale&nuova", dim = "1280x800", out = "/tmp/foto.png", attesa = "4000", scriptFile] = process.argv.slice(2);
const [w, h] = dim.split("x").map(Number);
const tipi = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".svg": "image/svg+xml", ".json": "application/json" };
const FINTO_SUPA = `export function createClient(){const q={select(){return q},eq(){return q},single(){return Promise.resolve({data:null,error:{message:"finto"}})},then(r){r({data:[],error:null})}};return{from(){return q},schema(){return{from(){return q}}},functions:{invoke:async()=>({data:null,error:{message:"finto"}})},channel(){return{on(){return this},subscribe(){return this}}},removeChannel(){},auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>({data:{},error:null}),onAuthStateChange(){return{data:{subscription:{unsubscribe(){}}}}}}}}`;
(async () => {
  const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  pg.on("console", (m) => console.log("[console." + m.type() + "]", m.text().slice(0, 300)));
  pg.on("pageerror", (e) => console.log("[ERRORE PAGINA]", e.message));
  await pg.route("**/*", async (r) => {
    const u = new URL(r.request().url());
    if (u.hostname === "gioco.test") {
      const f = path.join(REPO, decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname));
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ body: fs.readFileSync(f), contentType: tipi[path.extname(f)] || "application/octet-stream" });
      return r.fulfill({ status: 404, body: "no" });
    }
    if (u.hostname === "unpkg.com") {
      const p = u.pathname.replace(/^\/three@[^/]+/, "");
      const f = path.join(THREE, p);
      if (fs.existsSync(f)) return r.fulfill({ body: fs.readFileSync(f), contentType: "text/javascript" });
    }
    if (u.hostname === "esm.sh") return r.fulfill({ body: FINTO_SUPA, contentType: "text/javascript" });
    if (u.hostname.includes("fonts.")) return r.fulfill({ body: "", contentType: "text/css" });
    return r.fulfill({ status: 404, body: "" });
  });
  await pg.goto("https://gioco.test/" + q);
  await pg.waitForTimeout(Number(attesa));
  if (scriptFile) {
    const code = fs.readFileSync(scriptFile, "utf8");
    const res = await pg.evaluate(`(async()=>{${code}})()`);
    if (res !== undefined) console.log("[RISULTATO]", typeof res === "string" ? res : JSON.stringify(res).slice(0, 4000));
    await pg.waitForTimeout(1500);
  }
  await pg.screenshot({ path: out });
  console.log("foto salvata:", out);
  await b.close();
})();
