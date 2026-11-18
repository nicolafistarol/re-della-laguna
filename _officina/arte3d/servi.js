// Per aprire i prototipi in un browser vero:  node servi.js   poi  http://localhost:8123/proto3/index.html
const http = require("http"), fs = require("fs"), path = require("path");
const BASE = __dirname, THREE = process.env.THREE || "/home/claude/prove/node_modules/three";
const tipi = { ".js": "text/javascript", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".gltf": "model/gltf+json", ".glb": "model/gltf-binary", ".bin": "application/octet-stream" };
http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, "http://x").pathname); const f = u.startsWith("/three/") ? path.join(THREE, u.slice(6)) : path.join(BASE, u);
  if (!f.startsWith(BASE) && !f.startsWith(THREE)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end("no"); } r.writeHead(200, { "content-type": tipi[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8123, () => console.log("http://localhost:8123/proto1/index.html  ·  /proto2/index.html  ·  /proto3/index.html"));
