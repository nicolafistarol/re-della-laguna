// Uso: node scatta.js lavori.json   — [{ "url": "proto1/index.html?pulito", "dim": "1280x800", "out": "foto/x.png", "attesa": 3000 }]
// Serve /home/claude/prove/arte3d su https://arte.test/ e three.js su /three/
const { chromium } = require("/home/claude/prove/node_modules/playwright-core");
const fs = require("fs"), path = require("path");
const BASE = __dirname, THREE = "/home/claude/prove/node_modules/three";
const tipi = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream" };
(async () => {
  const lavori = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
  for (const l of lavori) {
    const [w, h] = l.dim.split("x").map(Number);
    const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    pg.on("console", (m) => { const t = m.text(); if (!/GPU stall|GL Driver/.test(t)) console.log("  [console." + m.type() + "]", t.slice(0, 400)); });
    pg.on("pageerror", (e) => console.log("  [ERRORE PAGINA]", e.message));
    let peso = 0; const pesi = {};
    await pg.route("**/*", async (r) => {
      const u = new URL(r.request().url()); let f = null;
      if (u.pathname.startsWith("/three/")) f = path.join(THREE, u.pathname.slice(6)); else f = path.join(BASE, decodeURIComponent(u.pathname));
      if (f && fs.existsSync(f) && fs.statSync(f).isFile()) { const body = fs.readFileSync(f); peso += body.length; pesi[u.pathname] = body.length; return r.fulfill({ body, contentType: tipi[path.extname(f)] || "application/octet-stream" }); }
      console.log("  [404]", u.pathname); return r.fulfill({ status: 404, body: "no" });
    });
    await pg.goto("https://arte.test/" + l.url);
    try { await pg.waitForFunction("window.__pronto === true", null, { timeout: 60000 }); } catch (e) { console.log("  [non pronto]"); }
    await pg.waitForTimeout(l.attesa || 2500);
    if (l.script) { const res = await pg.evaluate(`(async()=>{${l.script}})()`); if (res !== undefined) console.log("  [risultato]", JSON.stringify(res).slice(0, 2000)); await pg.waitForTimeout(800); }
    const info = await pg.evaluate("window.__info || null");
    try { await pg.screenshot({ path: path.join(BASE, l.out), timeout: 180000 }); } catch (e) { console.log("  [foto fallita]", e.message.slice(0, 80)); }
    console.log(l.out, JSON.stringify(info), "scaricati " + (peso / 1e6).toFixed(2) + " MB (senza three.js: " + (Object.entries(pesi).filter(([k]) => !k.startsWith("/three/")).reduce((a, [, v]) => a + v, 0) / 1e6).toFixed(2) + " MB)");
    await pg.close();
  }
  await b.close();
})();
