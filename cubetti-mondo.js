// =====================================================================
// RE DELLA LAGUNA — il mondo modellato in 3D (tappa 1 del tabellone nuovo)
// Al posto della foto: mare, isole, una strada unica che fa il giro di tutta
// la Laguna e passa sui ponti da un'isola all'altra, e una citta' fatta di
// piccoli edifici. Si costruisce una volta sola dalle posizioni delle caselle.
// =====================================================================
import * as THREE from "three";

// colori delle isole: terra (bordo) e citta' (sopra)
const STILE_ISOLA = {
  Corona: { sabbia: "#d9c9a3", terra: "#8f9aa3", citta: ["#cfd6dd", "#9fb3c8", "#e8e2d4"], alte: 2.2 },
  Flamingo: { sabbia: "#f3d9c4", terra: "#c98f9a", citta: ["#f7c6d0", "#ffffff", "#f2a7b8"], alte: 1.1 },
  Ambra: { sabbia: "#e2c48e", terra: "#b27a3c", citta: ["#e0a65c", "#c9874a", "#f1cf96"], alte: 0.9 },
  Sole: { sabbia: "#efe0a8", terra: "#9c8f6a", citta: ["#c9c9c9", "#b39b6e", "#e9d48a"], alte: 1.2 },
  Palma: { sabbia: "#f2e6c2", terra: "#5f9c5a", citta: ["#ffffff", "#e6f2da", "#cfe8c4"], alte: 0.7 },
};
const STILE_BASE = { sabbia: "#e8dcb8", terra: "#7a9a6a", citta: ["#ddd", "#bbb", "#eee"], alte: 1 };

// guscio convesso (algoritmo della catena monotona)
function guscio(pts) {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const giu = [], su = [];
  for (const q of p) { while (giu.length >= 2 && cr(giu[giu.length - 2], giu[giu.length - 1], q) <= 0) giu.pop(); giu.push(q); }
  for (const q of [...p].reverse()) { while (su.length >= 2 && cr(su[su.length - 2], su[su.length - 1], q) <= 0) su.pop(); su.push(q); }
  return giu.slice(0, -1).concat(su.slice(0, -1));
}
// allarga il contorno dal centro e lo arrotonda
function contorno(pts, margine) {
  const g = guscio(pts);
  const cx = g.reduce((a, q) => a + q.x, 0) / g.length, cy = g.reduce((a, q) => a + q.y, 0) / g.length;
  const largo = g.map((q) => { const dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy) || 1; return new THREE.Vector2(q.x + (dx / d) * margine, q.y + (dy / d) * margine); });
  const curva = new THREE.SplineCurve([...largo, largo[0]]);
  return { punti: curva.getPoints(Math.max(40, largo.length * 8)), cx, cy };
}
function dentro(pt, poli) {
  let c = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i], b = poli[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
// una "lastra" piatta con il contorno dato, alla quota y
function lastra(punti, alto, y, colore, mappa) {
  const forma = new THREE.Shape(punti.map((q) => new THREE.Vector2(q.x, -q.y)));
  const geo = new THREE.ExtrudeGeometry(forma, { depth: alto, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.8, bevelSegments: 2, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: mappa ? "#ffffff" : colore, map: mappa || null, roughness: 0.95 }));
  m.position.y = y; m.receiveShadow = true; m.castShadow = false;
  return m;
}
// generatore di numeri fisso: la citta' e' sempre uguale per tutti
function caso(seme) { let t = seme >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let r = Math.imul(t ^ (t >>> 15), t | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

// caselle: [{ x, z, isola }] nell'ordine del giro. Ritorna un gruppo da aggiungere alla scena.
export function costruisci(caselle) {
  const mondo = new THREE.Group();
  const QUOTA = 1.55; // altezza della strada sulle isole
  // --- 1. le isole
  const perIsola = {};
  for (const c of caselle) if (!c.ponte) (perIsola[c.isola] = perIsola[c.isola] || []).push({ x: c.x, y: c.z }); // i ponti (angoli) stanno sull'acqua tra due isole
  const poligoni = {}, fuoriTutti = [], palmeTutte = [];
  for (const [nome, pts] of Object.entries(perIsola)) {
    const st = STILE_ISOLA[nome] || STILE_BASE;
    const fuori = contorno(pts, 7.2), sopra = contorno(pts, 5.6);
    poligoni[nome] = sopra.punti;
    mondo.add(lastra(fuori.punti, 0.6, -0.2, st.sabbia, texSabbia()));
    mondo.add(lastra(sopra.punti, 0.4, 0.3, st.terra, texTerra(st.terra)));
    fuoriTutti.push(fuori.punti);
    const r = caso(nome.length * 977 + pts.length * 31);
    mondo.add(citta(nome, sopra.punti, caselle, r));
    // palme lungo la spiaggia, tra la sabbia e la terra
    const posti = [];
    for (let k = 0; k < fuori.punti.length; k += 2) {
      const a = fuori.punti[k], b = sopra.punti[Math.floor((k / fuori.punti.length) * sopra.punti.length)] || a, f2 = 0.35 + r() * 0.4;
      const x = a.x + (b.x - a.x) * f2, z = a.y + (b.y - a.y) * f2;
      if (caselle.some((c) => Math.hypot(c.x - x, c.z - z) < 3)) continue;
      posti.push([x, 0.6, z]);
    }
    if (nome === "Palma" || nome === "Flamingo") for (let k = 0; k < 90; k++) { const q = { x: minMax(sopra.punti, "x", r), y: minMax(sopra.punti, "y", r) }; if (dentro(q, sopra.punti) && !caselle.some((c) => Math.hypot(c.x - q.x, c.z - q.y) < 3.2)) posti.push([q.x, 0.75, q.y]); }
    palmeTutte.push(...posti);
  }
  // --- 2. la strada: un solo anello che passa da tutte le caselle, nell'ordine del gioco
  const isolaDi = (q) => Object.entries(poligoni).find(([, poli]) => dentro(q, poli));
  const curva = new THREE.CatmullRomCurve3(caselle.map((c) => new THREE.Vector3(c.x, QUOTA, c.z)), true, "centripetal");
  const N = caselle.length * 12, LARGO = 1.7;
  const posA = [], colA = [], idx = [];
  const asfalto = new THREE.Color("#3a3f47"), ponte = new THREE.Color("#b9a98a");
  const pilastri = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curva.getPointAt(t), tg = curva.getTangentAt(t);
    const lato = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(LARGO);
    const sullAcqua = !isolaDi({ x: p.x, y: p.z });
    const y = sullAcqua ? QUOTA + 0.5 : QUOTA;
    posA.push(p.x + lato.x, y, p.z + lato.z, p.x - lato.x, y, p.z - lato.z);
    const c = sullAcqua ? ponte : asfalto; colA.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (sullAcqua && i % 8 === 0) pilastri.push(new THREE.Vector3(p.x, 0, p.z));
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geoS = new THREE.BufferGeometry();
  geoS.setAttribute("position", new THREE.Float32BufferAttribute(posA, 3));
  geoS.setAttribute("color", new THREE.Float32BufferAttribute(colA, 3));
  geoS.setIndex(idx); geoS.computeVertexNormals();
  const strada = new THREE.Mesh(geoS, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }));
  strada.receiveShadow = true; mondo.add(strada);
  // la riga bianca in mezzo
  const riga = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curva.getSpacedPoints(N).map((p) => new THREE.Vector3(p.x, (isolaDi({ x: p.x, y: p.z }) ? QUOTA : QUOTA + 0.5) + 0.03, p.z))),
    new THREE.LineDashedMaterial({ color: "#f3e7c3", dashSize: 0.8, gapSize: 0.8 }));
  riga.computeLineDistances(); mondo.add(riga);
  // i pilastri dei ponti
  const geoP = new THREE.CylinderGeometry(0.35, 0.45, QUOTA + 0.5, 6); geoP.translate(0, (QUOTA + 0.5) / 2, 0);
  const pil = new THREE.InstancedMesh(geoP, new THREE.MeshStandardMaterial({ color: "#8d8070" }), Math.max(1, pilastri.length));
  const d2 = new THREE.Object3D();
  pilastri.forEach((p, i) => { d2.position.copy(p); d2.updateMatrix(); pil.setMatrixAt(i, d2.matrix); });
  pil.count = pilastri.length; mondo.add(pil);
  const centri = {};
  for (const [nome, poli] of Object.entries(poligoni)) centri[nome] = { x: poli.reduce((a, q) => a + q.x, 0) / poli.length, z: poli.reduce((a, q) => a + q.y, 0) / poli.length };
  const suTerra = (x, z) => !!isolaDi({ x, y: z });
  mondo.add(palmeIstanze(palmeTutte));
  const barche = flotta(fuoriTutti, caso(4242)); mondo.add(barche);
  // i lampioni lungo la strada: di notte si accendono
  const lampioni = lampioniStrada(curva, isolaDi, QUOTA); mondo.add(lampioni);
  return { mondo, curva, quota: QUOTA, centri, suTerra, fuori: fuoriTutti, barche, lampioni };
}

// =====================================================================
// IL MONDO VERO (v86): mare con fondali, cielo, citta' con facciate, palme, barche, lampioni
// =====================================================================
function minMax(punti, k, r) { let a = Infinity, b = -Infinity; for (const q of punti) { a = Math.min(a, q[k]); b = Math.max(b, q[k]); } return a + r() * (b - a); }
function tela(w, h, f) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d"), w, h); return c; }
function texDa(c, rip) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rip) t.repeat.set(rip, rip); t.anisotropy = 8; return t; }
let _sabbia = null;
function texSabbia() {
  if (_sabbia) return _sabbia;
  const r = caso(11);
  _sabbia = texDa(tela(256, 256, (g, w, h) => { g.fillStyle = "#ecdcb4"; g.fillRect(0, 0, w, h); for (let k = 0; k < 9000; k++) { const v = 200 + r() * 55; g.fillStyle = `rgba(${v},${v - 18},${v - 60},${0.25 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }), 0.08);
  return _sabbia;
}
const _terra = new Map();
function texTerra(colore) {
  if (_terra.has(colore)) return _terra.get(colore);
  const r = caso(colore.length * 91), base = new THREE.Color(colore);
  const t = texDa(tela(256, 256, (g, w, h) => {
    g.fillStyle = colore; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 260; k++) { const c = base.clone().offsetHSL((r() - 0.5) * 0.04, (r() - 0.5) * 0.1, (r() - 0.5) * 0.12); g.fillStyle = "#" + c.getHexString(); g.globalAlpha = 0.35; g.beginPath(); g.arc(r() * w, r() * h, 6 + r() * 26, 0, 7); g.fill(); }
    g.globalAlpha = 0.5; g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 2; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
    g.globalAlpha = 1;
  }), 0.1);
  _terra.set(colore, t); return t;
}
// facciata: finestre su un muro chiaro. Il quadratino in basso a sinistra (u,v < 0.06) e' pieno: lo usano i tetti.
const _facciate = new Map();
function facciata(tipo) {
  if (_facciate.has(tipo)) return _facciate.get(tipo);
  const r = caso(tipo.length * 7 + 3);
  const S = { vetro: { muro: "#d9e2ea", vetro: ["#5b7d99", "#6f93b0", "#4a6a86"], fx: 4, fy: 4, pieno: 0.86 }, casa: { muro: "#ffffff", vetro: ["#3c4652", "#55606c"], fx: 3, fy: 3, pieno: 0.42 }, porto: { muro: "#e9e9e9", vetro: ["#556270"], fx: 2, fy: 2, pieno: 0.25 } }[tipo];
  const N = 256, giorno = tela(N, N, (g) => {
    g.fillStyle = S.muro; g.fillRect(0, 0, N, N);
    const cw = N / S.fx, ch = N / S.fy;
    for (let y = 0; y < S.fy; y++) for (let x = 0; x < S.fx; x++) { g.fillStyle = S.vetro[Math.floor(r() * S.vetro.length)]; const mw = cw * (1 - S.pieno) / 2, mh = ch * (1 - S.pieno) / 2; g.fillRect(x * cw + mw, y * ch + mh, cw - 2 * mw, ch - 2 * mh); if (tipo === "vetro") { g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x * cw + mw, y * ch + mh, (cw - 2 * mw) * 0.35, ch - 2 * mh); } }
    g.fillStyle = "#9aa0a6"; g.fillRect(0, N - 14, 14, 14); // tetto
  });
  const notte = tela(N, N, (g) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, N, N);
    const cw = N / S.fx, ch = N / S.fy;
    for (let y = 0; y < S.fy; y++) for (let x = 0; x < S.fx; x++) { if (r() < 0.45) continue; g.fillStyle = ["#ffd58a", "#ffe9b8", "#fff4d6", "#9fd3ff"][Math.floor(r() * 4)]; const mw = cw * (1 - S.pieno) / 2, mh = ch * (1 - S.pieno) / 2; g.fillRect(x * cw + mw, y * ch + mh, cw - 2 * mw, ch - 2 * mh); }
  });
  const v = { map: texDa(giorno), emissiveMap: texDa(notte) };
  _facciate.set(tipo, v); return v;
}
// un costruttore di geometria unica: tante scatole e tetti in un solo pezzo (veloce anche sul Mac)
function Geo() {
  const P = [], Nn = [], U = [], C = [];
  const col = new THREE.Color();
  function quad(a, b, c, d, n, uv, colore) { // a b c d in senso antiorario visto da fuori
    for (const [p, q] of [[a, uv[0]], [b, uv[1]], [c, uv[2]], [a, uv[0]], [c, uv[2]], [d, uv[3]]]) { P.push(p[0], p[1], p[2]); Nn.push(n[0], n[1], n[2]); U.push(q[0], q[1]); C.push(colore.r, colore.g, colore.b); }
  }
  function tri(a, b, c, n, colore) { for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); Nn.push(n[0], n[1], n[2]); U.push(0.02, 0.02); C.push(colore.r, colore.g, colore.b); } }
  // scatola ruotata di ang, con finestre (passo = metri per riquadro della facciata)
  function scatola(x, y0, z, sx, h, sz, ang, colore, coloreTetto, passo) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const pt = (dx, y, dz) => [x + dx * c - dz * s, y, z + dx * s + dz * c];
    const hx = sx / 2, hz = sz / 2, y1 = y0 + h;
    const v = [pt(-hx, 0, -hz), pt(hx, 0, -hz), pt(hx, 0, hz), pt(-hx, 0, hz)];
    col.set(colore);
    const lati = [[0, 1, sx], [1, 2, sz], [2, 3, sx], [3, 0, sz]];
    for (const [i, j, L] of lati) {
      const A = v[i], B = v[j], nx = B[2] - A[2], nz = -(B[0] - A[0]), nl = Math.hypot(nx, nz);
      const u1 = L / passo, vy0 = y0 / passo, vy1 = y1 / passo;
      quad([B[0], y0, B[2]], [A[0], y0, A[2]], [A[0], y1, A[2]], [B[0], y1, B[2]], [nx / nl, 0, nz / nl], [[0, vy0], [u1, vy0], [u1, vy1], [0, vy1]], col);
    }
    col.set(coloreTetto);
    quad([v[0][0], y1, v[0][2]], [v[3][0], y1, v[3][2]], [v[2][0], y1, v[2][2]], [v[1][0], y1, v[1][2]], [0, 1, 0], [[0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.02, 0.02]], col);
    return { pt, y1 };
  }
  function tettoAPunta(x, y1, z, sx, sz, ang, alto, colore) {
    const c = Math.cos(ang), s = Math.sin(ang), pt = (dx, y, dz) => [x + dx * c - dz * s, y, z + dx * s + dz * c];
    const hx = sx / 2 + 0.12, hz = sz / 2 + 0.12;
    const a = pt(-hx, y1, -hz), b = pt(hx, y1, -hz), cc = pt(hx, y1, hz), d = pt(-hx, y1, hz), e = pt(-hx, y1 + alto, 0), f = pt(hx, y1 + alto, 0);
    col.set(colore);
    const n1 = [ -s * 0 + (-(Math.sin(ang))) * 0, 0.7, 0 ];
    quad(b, a, e, f, [s * 0.7, 0.7, -c * 0.7], [[0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.02, 0.02]], col);
    quad(d, cc, f, e, [-s * 0.7, 0.7, c * 0.7], [[0.02, 0.02], [0.02, 0.02], [0.02, 0.02], [0.02, 0.02]], col);
    tri(a, d, e, [-c, 0, -s], col); tri(cc, b, f, [c, 0, s], col);
  }
  function fatto() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(Nn, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
    return g;
  }
  return { scatola, tettoAPunta, fatto, vuoto: () => P.length === 0 };
}
const materialiCitta = [];
function matCitta(tipo, extra) { const f = facciata(tipo); const m = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, map: f.map, emissive: "#ffffff", emissiveMap: f.emissiveMap, emissiveIntensity: 0, roughness: tipo === "vetro" ? 0.35 : 0.8, metalness: 0 }, extra || {})); materialiCitta.push(m); return m; }
export function accendiCitta(n) { for (const m of materialiCitta) m.emissiveIntensity = n ? 1.15 : 0; }
// la citta' di un'isola, con lo stile dell'isola
function citta(nome, poli, caselle, r) {
  const gr = new THREE.Group();
  const vetro = Geo(), casa = Geo(), porto = Geo();
  const libero = (x, z, d) => dentro({ x, y: z }, poli) && !caselle.some((c) => Math.hypot(c.x - x, c.z - z) < d);
  const pos = []; const presi = [];
  const lontano = (x, z, rr) => !presi.some((p) => Math.hypot(p[0] - x, p[1] - z) < p[2] + rr);
  const prova = (n, d, rr, f) => { for (let k = 0; k < n; k++) { const x = minMax(poli, "x", r), z = minMax(poli, "y", r); if (!libero(x, z, d) || !lontano(x, z, rr)) continue; presi.push([x, z, rr]); f(x, z); } };
  const tinte = { Flamingo: ["#f7c6d0", "#ffffff", "#f2a7b8", "#ffe3e8"], Ambra: ["#e9b87a", "#d99a5b", "#f1d3a1", "#e7c08f", "#c98552"], Palma: ["#ffffff", "#f4f1e8", "#e8f1ea"], Sole: ["#c9ced3", "#b8bfc6", "#dfe3e6"], Corona: ["#dfe6ec", "#c8d3dc", "#eef2f5"] }[nome] || ["#dddddd"];
  const tinta = () => tinte[Math.floor(r() * tinte.length)];
  if (nome === "Corona") {
    // grattacieli: piu' alti verso il centro
    const cx = poli.reduce((a, q) => a + q.x, 0) / poli.length, cz = poli.reduce((a, q) => a + q.y, 0) / poli.length, R = Math.max(...poli.map((q) => Math.hypot(q.x - cx, q.y - cz)));
    prova(500, 6.2, 1.6, (x, z) => {
      const vic = 1 - Math.min(1, Math.hypot(x - cx, z - cz) / R);
      const h = 4 + vic * vic * (14 + r() * 16) + r() * 4, l = 1.8 + r() * 1.6, a = Math.floor(r() * 2) * Math.PI / 4 * 0;
      const b = vetro.scatola(x, 0.7, z, l, h, l * (0.8 + r() * 0.4), a, tinta(), "#8d969e", 2.2);
      if (h > 14 && r() < 0.6) vetro.scatola(x, b.y1, z, l * 0.65, h * 0.18, l * 0.65, a, tinta(), "#7d868e", 2.2);
    });
  } else if (nome === "Ambra") {
    prova(700, 5.6, 0.9, (x, z) => { const sx = 1.2 + r() * 1.2, sz = 1.1 + r() * 1, h = 1 + r() * 1.8, a = r() * Math.PI; const b = casa.scatola(x, 0.7, z, sx, h, sz, a, tinta(), "#b5532f", 1.3); casa.tettoAPunta(x, b.y1, z, sx, sz, a, 0.5 + r() * 0.3, ["#b5532f", "#c4633a", "#a5462a"][Math.floor(r() * 3)]); });
    // il campanile
    prova(30, 7, 1.2, (x, z) => { if (presi.filter((p) => p[2] === 1.2).length > 1) return; const b = casa.scatola(x, 0.7, z, 1.1, 7, 1.1, 0, "#e2b27a", "#a5462a", 1.3); casa.tettoAPunta(x, b.y1, z, 1.1, 1.1, 0, 1.4, "#a5462a"); });
  } else if (nome === "Flamingo") {
    prova(500, 5.8, 1.1, (x, z) => { const sx = 1.6 + r() * 1.6, sz = 1.4 + r() * 1.2, h = 1.4 + r() * 3.2, a = r() * Math.PI; casa.scatola(x, 0.7, z, sx, h, sz, a, tinta(), r() < 0.3 ? "#e86f8a" : "#f4f0ea", 1.3); });
  } else if (nome === "Palma") {
    prova(400, 5.8, 1.4, (x, z) => { const sx = 2 + r() * 1.4, sz = 1.6 + r() * 1, h = 1 + r() * 1.2, a = r() * Math.PI; casa.scatola(x, 0.7, z, sx, h, sz, a, tinta(), "#f0eee8", 1.4); const c = Math.cos(a), s = Math.sin(a), d = sz / 2 + 0.9; porto.scatola(x - s * d, 0.71, z + c * d, sx * 0.7, 0.05, 1, a, "#3fc6e0", "#3fc6e0", 9); });
  } else if (nome === "Sole") {
    // il porto: capannoni, pile di container, qualche torre
    prova(260, 5.8, 1.6, (x, z) => { const sx = 3 + r() * 2, sz = 1.8 + r(), h = 1.2 + r() * 0.8, a = Math.floor(r() * 2) * Math.PI / 2; porto.scatola(x, 0.7, z, sx, h, sz, a, tinta(), "#7f8b96", 2); });
    prova(300, 5.4, 0.9, (x, z) => { const a = Math.floor(r() * 2) * Math.PI / 2; let y = 0.7; const n = 1 + Math.floor(r() * 3); for (let k = 0; k < n; k++) { const c = ["#d35400", "#2471a3", "#1e8449", "#b7950b", "#884ea0", "#c0392b"][Math.floor(r() * 6)]; porto.scatola(x, y, z, 1.8, 0.6, 0.7, a, c, c, 9); y += 0.6; } });
    prova(120, 6.5, 1.8, (x, z) => { if (r() < 0.6) return; const l = 1.8 + r(), h = 6 + r() * 8; vetro.scatola(x, 0.7, z, l, h, l, 0, tinta(), "#8d969e", 2.2); });
    // le gru
    const gru = new THREE.MeshStandardMaterial({ color: "#e2a400", roughness: 0.6 });
    prova(80, 6, 2.5, (x, z) => { if (gr.children.length > 5) return; const g = new THREE.Group(); const pil = new THREE.Mesh(new THREE.BoxGeometry(0.25, 6, 0.25), gru); pil.position.y = 3.7; const br = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 0.25), gru); br.position.set(1.2, 6.6, 0); g.add(pil, br); g.position.set(x, 0, z); g.rotation.y = r() * Math.PI; g.traverse((m) => { m.castShadow = true; }); gr.add(g); });
  }
  for (const [G, tipo] of [[vetro, "vetro"], [casa, "casa"], [porto, "porto"]]) { if (G.vuoto()) continue; const m = new THREE.Mesh(G.fatto(), matCitta(tipo)); m.castShadow = true; m.receiveShadow = true; gr.add(m); }
  return gr;
}
// la palma: tronco curvo e un ciuffo di foglie, tutto in un pezzo
function geoPalma() {
  const P = [], C = [], col = new THREE.Color();
  const push = (p, c) => { P.push(p.x, p.y, p.z); C.push(c.r, c.g, c.b); };
  const H = 2.6, seg = 6;
  col.set("#8a6a4a");
  for (let i = 0; i < seg; i++) { const y0 = (i / seg) * H, y1 = ((i + 1) / seg) * H, b0 = Math.pow(i / seg, 2) * 0.5, b1 = Math.pow((i + 1) / seg, 2) * 0.5, r0 = 0.14 - i * 0.012, r1 = 0.14 - (i + 1) * 0.012;
    for (let k = 0; k < 5; k++) { const a0 = (k / 5) * 6.283, a1 = ((k + 1) / 5) * 6.283; const A = new THREE.Vector3(b0 + Math.cos(a0) * r0, y0, Math.sin(a0) * r0), B = new THREE.Vector3(b0 + Math.cos(a1) * r0, y0, Math.sin(a1) * r0), Cc = new THREE.Vector3(b1 + Math.cos(a1) * r1, y1, Math.sin(a1) * r1), D = new THREE.Vector3(b1 + Math.cos(a0) * r1, y1, Math.sin(a0) * r1); for (const p of [A, Cc, B, A, D, Cc]) push(p, col); } }
  const top = new THREE.Vector3(0.5, H, 0);
  for (let f = 0; f < 8; f++) { const a = (f / 8) * 6.283 + 0.2, L = 1.5; col.set(f % 2 ? "#2f7d3a" : "#3c9446");
    for (let s = 0; s < 4; s++) { const t0 = s / 4, t1 = (s + 1) / 4; const p0 = top.clone().add(new THREE.Vector3(Math.cos(a) * L * t0, 0.35 * t0 - 0.9 * t0 * t0, Math.sin(a) * L * t0)), p1 = top.clone().add(new THREE.Vector3(Math.cos(a) * L * t1, 0.35 * t1 - 0.9 * t1 * t1, Math.sin(a) * L * t1)); const w0 = 0.32 * Math.sin(Math.PI * Math.max(0.15, t0)), w1 = 0.32 * Math.sin(Math.PI * t1); const n = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)); const A = p0.clone().addScaledVector(n, w0), B = p0.clone().addScaledVector(n, -w0), Cc = p1.clone().addScaledVector(n, -w1), D = p1.clone().addScaledVector(n, w1); for (const p of [A, B, Cc, A, Cc, D]) push(p, col); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); return g;
}
function palmeIstanze(posti) {
  const m = new THREE.InstancedMesh(geoPalma(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }), Math.max(1, posti.length));
  const d = new THREE.Object3D(), r = caso(77);
  posti.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.rotation.set(0, r() * 6.28, 0); d.scale.setScalar(0.75 + r() * 0.5); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
  m.count = posti.length; m.castShadow = true; return m;
}
// le barche: girano piano intorno alle isole
function geoBarca() {
  const s = new THREE.Shape(); s.moveTo(-0.9, -0.35); s.lineTo(0.6, -0.35); s.quadraticCurveTo(1.25, 0, 0.6, 0.35); s.lineTo(-0.9, 0.35); s.lineTo(-0.9, -0.35);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1 }); g.rotateX(-Math.PI / 2); g.translate(0, -0.05, 0);
  const cab = new THREE.BoxGeometry(0.7, 0.28, 0.45); cab.translate(-0.25, 0.4, 0);
  const pos = [...(g.index ? g.toNonIndexed() : g).attributes.position.array, ...cab.toNonIndexed().attributes.position.array];
  const out = new THREE.BufferGeometry(); out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.computeVertexNormals(); return out;
}
function flotta(fuori, r) {
  const n = 26, m = new THREE.InstancedMesh(geoBarca(), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35 }), n);
  const giri = [];
  for (let i = 0; i < n; i++) { const poli = fuori[i % fuori.length]; const cx = poli.reduce((a, q) => a + q.x, 0) / poli.length, cz = poli.reduce((a, q) => a + q.y, 0) / poli.length; const R = Math.max(...poli.map((q) => Math.hypot(q.x - cx, q.y - cz))) + 3 + r() * 9; giri.push({ cx, cz, R, a: r() * 6.28, v: (0.02 + r() * 0.03) * (r() < 0.5 ? 1 : -1), s: 0.8 + r() * 0.9 }); }
  const d = new THREE.Object3D();
  m.userData.muovi = (t) => { giri.forEach((g, i) => { const a = g.a + t * g.v; d.position.set(g.cx + Math.cos(a) * g.R, -0.12, g.cz + Math.sin(a) * g.R); d.rotation.set(0, -a + (g.v > 0 ? -Math.PI / 2 : Math.PI / 2), 0); d.scale.setScalar(g.s); d.updateMatrix(); m.setMatrixAt(i, d.matrix); }); m.instanceMatrix.needsUpdate = true; };
  m.userData.muovi(0); m.castShadow = true; return m;
}
function lampioniStrada(curva, isolaDi, Q) {
  const pts = curva.getSpacedPoints(220), pos = [];
  pts.forEach((p, i) => { if (i % 2) return; const tg = curva.getTangentAt(i / 220), n = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(i % 4 ? 2.1 : -2.1); const sull = !isolaDi({ x: p.x, y: p.z }); pos.push([p.x + n.x, (sull ? Q + 0.5 : Q), p.z + n.z]); });
  const g = new THREE.Group();
  const palo = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5).translate(0, 0.55, 0), new THREE.MeshStandardMaterial({ color: "#555b62" }), pos.length);
  const luce = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6).translate(0, 1.15, 0), new THREE.MeshStandardMaterial({ color: "#fff3cf", emissive: "#ffd27a", emissiveIntensity: 0 }), pos.length);
  const d = new THREE.Object3D(); pos.forEach((p, i) => { d.position.set(p[0], p[1], p[2]); d.updateMatrix(); palo.setMatrixAt(i, d.matrix); luce.setMatrixAt(i, d.matrix); });
  g.add(palo, luce); g.userData.accendi = (n) => { luce.material.emissiveIntensity = n ? 2.2 : 0; }; return g;
}
// il cielo: una cupola con il colore che sfuma verso l'orizzonte, il sole (o la luna) e di notte le stelle
export function cielo() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uNotte: { value: 0 }, uSole: { value: new THREE.Vector3(-0.53, 0.79, 0.35).normalize() } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }",
    fragmentShader: `uniform float uNotte; uniform vec3 uSole; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
      void main(){ float y = max(vD.y, 0.0);
        vec3 zenG = vec3(0.23,0.52,0.86), oriG = vec3(0.80,0.90,0.96);
        vec3 zenN = vec3(0.01,0.02,0.07), oriN = vec3(0.06,0.09,0.20);
        vec3 c = mix(mix(oriG, zenG, pow(y,0.55)), mix(oriN, zenN, pow(y,0.6)), uNotte);
        float s = max(dot(vD, uSole), 0.0);
        c += mix(vec3(1.0,0.85,0.6)*(pow(s,600.0)*6.0 + pow(s,12.0)*0.35), vec3(0.8,0.85,1.0)*(pow(s,900.0)*3.0 + pow(s,30.0)*0.1), uNotte);
        if (uNotte > 0.5) { vec3 q = floor(vD*420.0); float st = step(0.9965, h(q)) * smoothstep(0.05,0.3,y); c += vec3(st)*0.9; }
        gl_FragColor = vec4(c,1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), mat); m.renderOrder = -10; m.frustumCulled = false;
  return m;
}
// il mare vero: profondo al largo, turchese sui fondali vicino alle isole, schiuma sulla riva, riflessi del sole
export function mare(fuori) {
  // la mappa dei fondali: le isole disegnate e sfumate
  const X0 = -140, Z0 = -95, LX = 280, LZ = 190, N = 512;
  const mappa = tela(N, Math.round(N * LZ / LX), (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    const disegna = (allarga, alfa, blur) => { g.filter = "blur(" + blur + "px)"; g.fillStyle = "rgba(255,255,255," + alfa + ")"; for (const poli of fuori || []) { const cx = poli.reduce((a, q) => a + q.x, 0) / poli.length, cz = poli.reduce((a, q) => a + q.y, 0) / poli.length; g.beginPath(); poli.forEach((q, i) => { const dx = q.x - cx, dz = q.y - cz, d = Math.hypot(dx, dz) || 1; const x = ((q.x + dx / d * allarga) - X0) / LX * w, y = ((q.y + dz / d * allarga) - Z0) / LZ * h; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); } };
    disegna(9, 0.22, 14); disegna(4, 0.4, 7); disegna(1, 0.85, 3); g.filter = "none";
  });
  const tex = new THREE.CanvasTexture(mappa); tex.colorSpace = THREE.NoColorSpace;
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uNotte: { value: 0 }, uSole: { value: new THREE.Vector3(-0.53, 0.79, 0.35).normalize() }, uFondo: { value: null }, uBox: { value: new THREE.Vector4(X0, Z0, LX, LZ) } }]),
    vertexShader: `varying vec3 vW;
${THREE.ShaderChunk.fog_pars_vertex}
      void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
${THREE.ShaderChunk.fog_vertex}
      }`,
    fragmentShader: `uniform float uT; uniform float uNotte; uniform vec3 uSole; uniform sampler2D uFondo; uniform vec4 uBox; varying vec3 vW;
${THREE.ShaderChunk.fog_pars_fragment}
      float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5); float b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5); float c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5); float d=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5); return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
      float onde(vec2 p){ return n2(p*0.35 + vec2(uT*0.05, uT*0.03))*0.5 + n2(p*0.9 - vec2(uT*0.08, -uT*0.06))*0.3 + n2(p*2.3 + vec2(-uT*0.15, uT*0.1))*0.2; }
      void main(){
        vec2 uv = (vW.xz - uBox.xy) / uBox.zw; float f = 0.0; if (uv.x>0.0 && uv.x<1.0 && uv.y>0.0 && uv.y<1.0) f = texture2D(uFondo, uv).r;
        float dist = length(cameraPosition - vW); float forza = mix(1.0, 0.15, smoothstep(40.0, 220.0, dist));
        float e = 0.25; float h0 = onde(vW.xz); vec3 N = normalize(vec3((h0 - onde(vW.xz+vec2(e,0.0)))*forza, 0.25, (h0 - onde(vW.xz+vec2(0.0,e)))*forza));
        vec3 V = normalize(cameraPosition - vW);
        vec3 profondo = vec3(0.02,0.22,0.42), medio = vec3(0.03,0.45,0.62), basso = vec3(0.12,0.74,0.76), riva = vec3(0.55,0.90,0.84);
        vec3 c = mix(profondo, medio, smoothstep(0.0,0.25,f)); c = mix(c, basso, smoothstep(0.25,0.7,f)); c = mix(c, riva, smoothstep(0.8,0.97,f));
        c *= 0.92 + 0.16*h0;
        float fr = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 cieloC = mix(vec3(0.75,0.88,0.97), vec3(0.05,0.08,0.18), uNotte);
        c = mix(c, cieloC, fr*0.55*(1.0-f*0.6));
        vec3 R = reflect(-uSole, N); float sp = pow(max(dot(R, V), 0.0), mix(180.0, 60.0, smoothstep(40.0,220.0,dist))) * mix(1.0, 0.35, smoothstep(40.0,220.0,dist));
        c += mix(vec3(1.0,0.93,0.8)*sp*1.6, vec3(0.75,0.82,1.0)*sp*0.8, uNotte);
        float sch = smoothstep(0.9,0.95,f) * smoothstep(0.35, 0.75, n2(vW.xz*2.2 + vec2(uT*0.3, -uT*0.2)));
        c = mix(c, vec3(0.95), sch*0.55);
        c *= mix(1.0, 0.22, uNotte);
        gl_FragColor = vec4(c, 1.0);
${THREE.ShaderChunk.fog_fragment}
      }`,
  });
  mat.uniforms.uFondo.value = tex;
  const geo = new THREE.PlaneGeometry(1600, 1600, 1, 1); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, mat); m.position.y = -0.15;
  m.userData.onda = (t) => { mat.uniforms.uT.value = t; };
  m.userData.notte = (n) => { mat.uniforms.uNotte.value = n ? 1 : 0; };
  return m;
}
