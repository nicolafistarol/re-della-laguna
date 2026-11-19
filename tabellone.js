// Il tabellone visto dall'alto (v98): le isole sono disegnate al volo attorno alla strada,
// cosi' case, palazzi e alberi stanno sempre sulla terra e mai sull'acqua.
// Ogni isola del gioco e' divisa in 2 isolotti (2 gruppi di vie ciascuno), uniti da un ponticello.
// Spazio di lavoro: 1600 x 900 (16:9). Fuori si danno le posizioni in % come il resto del gioco.
const W = 1600, H = 900;
const ISOLE5 = ["Ambra", "Palma", "Corona", "Flamingo", "Sole"];

// il giro della strada (chiuso), in ordine di casella: Ambra (in basso a sinistra), Palma (in alto a sinistra),
// Corona (al centro), Flamingo (in alto a destra), Sole (in basso a destra), poi il ponte lungo che torna ad Ambra
const GIRO = [
  [760, 815], [600, 838], [470, 800], [350, 836], [215, 810], [120, 728], [150, 628], [262, 596], [300, 512], [205, 452], [112, 372],
  [128, 262], [222, 196], [160, 112], [272, 62], [410, 100], [540, 70], [668, 118], [660, 232],
  [560, 300], [590, 410], [705, 448], [800, 380], [895, 448], [1010, 410], [1040, 300], [940, 232],
  [932, 118], [1060, 70], [1190, 100], [1328, 62], [1440, 112], [1378, 196], [1472, 262], [1488, 372],
  [1395, 452], [1300, 512], [1338, 596], [1450, 628], [1480, 728], [1385, 810], [1250, 836], [1130, 800], [1000, 838], [880, 815],
];

// --------------------------------------------------------------- numeri a caso ripetibili
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// --------------------------------------------------------------- la strada: curva morbida dal giro
function curva() {
  const n = GIRO.length, pts = [];
  for (let i = 0; i < n; i++) {
    const p0 = GIRO[(i - 1 + n) % n], p1 = GIRO[i], p2 = GIRO[(i + 1) % n], p3 = GIRO[(i + 2) % n];
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  // ricampiona a passo costante (3 unita')
  const PASSO = 3, cum = [0];
  for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = cum[pts.length], nn = Math.round(tot / PASSO), out = []; let j = 0;
  for (let k = 0; k < nn; k++) { const s = k * tot / nn; while (cum[j + 1] < s) j++; const f = (s - cum[j]) / (cum[j + 1] - cum[j] || 1), a = pts[j], b = pts[(j + 1) % pts.length]; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
  return { pts: out, passo: tot / nn, L: tot };
}

let GEO = null;
function geometria() {
  if (GEO) return GEO;
  const { pts, passo, L } = curva();
  // unita' lungo il giro: 10 caselle, ponticello (1,7), 10 caselle, ponte tra isole (3,4)
  const GH = 1.7, GI = 3.4, U = 19 + GH + GI;
  const sp = L / (5 * U);
  const arco = (i) => { const j = Math.floor(i / 20), k = i % 20; return (j * U + k + (k >= 10 ? GH - 1 : 0)) * sp; };
  const inArco = (s) => { const i = Math.round(((s % L) + L) % L / passo) % pts.length; return i; };
  const tang = (i) => { const a = pts[(i - 2 + pts.length) % pts.length], b = pts[(i + 2) % pts.length]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const caselle = Array.from({ length: 100 }, (_, i) => { const k = inArco(arco(i)); return { x: pts[k][0], y: pts[k][1], a: tang(k), k }; });
  // a quale isolotto (0..9) appartiene ogni punto della strada; -1 = ponte sull'acqua
  const isolotto = new Int8Array(pts.length).fill(-1);
  for (let t = 0; t < 10; t++) {
    const s0 = arco(t * 10) - 0.75 * sp, s1 = arco(t * 10 + 9) + 0.75 * sp;
    for (let s = s0; s <= s1; s += passo) isolotto[inArco(s)] = t;
  }
  // isolotti di contorno (il Faro e due banchi di sabbia)
  const extra = [{ x: 1520, y: 860, r: 34, tema: 5 }, { x: 800, y: 600, r: 38, tema: 1 }, { x: 800, y: 150, r: 30, tema: 3 }];
  // griglia delle distanze (ogni 4 unita')
  const G = 4, GW = W / G + 1, GHt = H / G + 1;
  const d1 = new Float32Array(GW * GHt), d2 = new Float32Array(GW * GHt), id = new Int8Array(GW * GHt), vic = new Int32Array(GW * GHt), terra = new Float32Array(GW * GHt);
  const camp = []; for (let i = 0; i < pts.length; i += 2) if (isolotto[i] >= 0) camp.push(i);
  for (let gy = 0; gy < GHt; gy++) for (let gx = 0; gx < GW; gx++) {
    const x = gx * G, y = gy * G, best = new Float32Array(10).fill(1e9), bi = new Int32Array(10);
    for (const i of camp) { const t = isolotto[i], p = pts[i], d = (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y); if (d < best[t]) { best[t] = d; bi[t] = i; } }
    let a = -1, b = -1; for (let t = 0; t < 10; t++) { if (a < 0 || best[t] < best[a]) { b = a; a = t; } else if (b < 0 || best[t] < best[b]) b = t; }
    const o = gy * GW + gx, da = Math.sqrt(best[a]), db = Math.sqrt(best[b]);
    d1[o] = da; d2[o] = db; id[o] = a; vic[o] = bi[a];
    const R = 60 + 36 * fbm(x / 140, y / 140) + 10 * (fbm(x / 40 + 9, y / 40) - 0.5);
    const stessa = Math.floor(a / 2) === Math.floor(b / 2);
    const gap = stessa ? 18 : 95;
    let L1 = Math.min(R - da, (db - da - gap) / 2);
    for (const e of extra) { const de = Math.hypot(e.x - x, e.y - y), le = e.r + 14 * (fbm(x / 30, y / 30) - 0.5) - de; if (le > L1) { L1 = le; id[o] = -10 - extra.indexOf(e); } }
    terra[o] = L1;
  }
  const leggi = (arr, x, y) => { const fx = clamp(x / G, 0, GW - 1.001), fy = clamp(y / G, 0, GHt - 1.001), ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, o = iy * GW + ix; return arr[o] * (1 - u) * (1 - v) + arr[o + 1] * u * (1 - v) + arr[o + GW] * (1 - u) * v + arr[o + GW + 1] * u * v; };
  const idDi = (x, y) => id[Math.round(clamp(y / G, 0, GHt - 1)) * GW + Math.round(clamp(x / G, 0, GW - 1))];
  const vicDi = (x, y) => vic[Math.round(clamp(y / G, 0, GHt - 1)) * GW + Math.round(clamp(x / G, 0, GW - 1))];
  // un punto sulla terra accanto alla casella i (per palazzi, luoghi della notte, nomi)
  const interno = (i, dist = 48, lato = 0) => {
    const c = caselle[i]; let migliore = null;
    for (const s of lato ? [lato] : [1, -1]) for (const d of [dist, dist - 10, dist + 10, dist - 18]) {
      const x = c.x + Math.cos(c.a + s * Math.PI / 2) * d, y = c.y + Math.sin(c.a + s * Math.PI / 2) * d, t = leggi(terra, x, y);
      if (!migliore || t > migliore.t) migliore = { x, y, t };
    }
    return [migliore.x, migliore.y];
  };
  GEO = { pts, passo, L, sp, caselle, isolotto, extra, leggi, idDi, vicDi, terra, d1, interno, tang };
  return GEO;
}

// --------------------------------------------------------------- le posizioni per il gioco (in %)
const pc = ([x, y]) => [x / 16, y / 9];
export function posizioni() {
  const g = geometria();
  const isola = (j) => { let x = 0, y = 0; for (let k = 0; k < 20; k++) { x += g.caselle[j * 20 + k].x; y += g.caselle[j * 20 + k].y; } return [x / 20, y / 20]; };
  const nomi = {}, casa = {};
  // i nomi delle isole stanno sull'acqua, verso l'esterno della Laguna
  const NOMI = { Ambra: [470, 690], Palma: [345, 330], Corona: [800, 286], Flamingo: [1255, 330], Sole: [1130, 690] };
  ISOLE5.forEach((k, j) => { nomi[k] = pc(NOMI[k]); casa[k] = pc(g.interno(j * 20 + 12, 50)); });
  const luoghi = {
    mercato: pc(g.interno(7, 46)), bisca: pc(g.interno(19, 46)), villa: pc(g.interno(27, 46)), casino: pc(g.interno(55, 46)),
    redazione: pc(g.interno(43, 46)), club: pc(g.interno(67, 46)), porto: pc(g.interno(87, 46)), aeroporto: pc(g.interno(99, 50)),
    marina: pc([800, 655]), faro: pc([1520, 852]),
  };
  return { punti: g.caselle.map((c) => pc([c.x, c.y])), nomi, casa, luoghi, faro: pc([1520, 900]) };
}

// --------------------------------------------------------------- il disegno
// temi: 0 Ambra (borgo di terracotta), 1 Palma (resort e giungla), 2 Corona (grattacieli), 3 Flamingo (ville rosa), 4 Sole (porto e industria), 5 il Faro
const TERRA = [["#8f9a58", "#c4a467"], ["#3e8a3a", "#27612c"], ["#b4b8bb", "#86a776"], ["#7fb36a", "#d9c0b8"], ["#9b9a90", "#7c8a68"], ["#7f9a58", "#a9a46a"]].map((c) => c.map(hex));
const temaDi = (id) => id <= -10 ? [5, 1, 3][-10 - id] : Math.floor(id / 2);

export function sfondo(scala = 1.5) {
  const g = geometria();
  const cw = Math.round(W * scala), ch = Math.round(H * scala);
  const cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
  const ctx = cv.getContext("2d");
  // 1) mare, sabbia e terra pixel per pixel
  const img = ctx.createImageData(cw, ch), px = img.data;
  const DEEP = hex("#0a3f6b"), MID = hex("#0f73a0"), SHAL = hex("#2fc0c4"), VSH = hex("#8fe6d4"), SAND = hex("#ecdcae"), WET = hex("#cdbb8a");
  for (let py = 0; py < ch; py++) {
    const y = py / scala;
    for (let pxl = 0; pxl < cw; pxl++) {
      const x = pxl / scala;
      const t = g.leggi(g.terra, x, y) + 2.2 * (vn(x / 3, y / 3) - 0.5);
      let c;
      if (t < 0) {
        const p = -t, n = fbm(x / 90, y / 90, 3);
        c = p < 10 ? mix(VSH, SHAL, p / 10) : p < 45 ? mix(SHAL, MID, (p - 10) / 35) : mix(MID, DEEP, clamp((p - 45) / 120, 0, 1));
        // riflessi e onde
        const r = Math.sin((x + y * 0.6) / 7 + n * 9) * Math.sin((x - y) / 11 + n * 5);
        c = mix(c, [255, 255, 255], clamp(r * 0.06 + (n - 0.5) * 0.12, 0, 0.12));
        if (p < 2.4) c = mix(c, [255, 255, 255], 0.55 * (1 - p / 2.4)); // schiuma sulla riva
      } else if (t < 7) {
        c = mix(WET, SAND, clamp(t / 2.5, 0, 1));
        c = mix(c, [255, 250, 230], (vn(x / 2, y / 2) - 0.5) * 0.25 + 0.05);
      } else {
        const tm = temaDi(g.idDi(x, y)), [a, b] = TERRA[tm], n = fbm(x / 26 + tm * 7, y / 26, 4);
        c = mix(a, b, clamp((n - 0.35) * 2.2, 0, 1));
        c = mix(c, [0, 0, 0], (vn(x / 1.6, y / 1.6) - 0.5) * 0.18);
        if (t < 10) c = mix(SAND, c, (t - 7) / 3);
      }
      const o = (py * cw + pxl) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.scale(scala, scala);
  const R = rng(20261119);
  // 2) barche sul mare (prima dei ponti)
  for (let n = 0; n < 70; n++) {
    const x = R() * W, y = R() * H; if (g.leggi(g.terra, x, y) > -18) continue;
    const a = R() * Math.PI * 2, big = R() < 0.25;
    barca(ctx, x, y, a, big);
  }
  // 3) strade e ponti
  const P = g.pts, N = P.length;
  const tratti = (filtro) => { const out = []; let cur = null; for (let i = 0; i <= N; i++) { const k = i % N, ok = filtro(k); if (ok) { if (!cur) { cur = []; out.push(cur); } cur.push(P[k]); } else cur = null; } return out; };
  const linea = (seg, w, col, dash) => { ctx.beginPath(); seg.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); };
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const sullAcqua = (k) => g.leggi(g.terra, P[k][0], P[k][1]) < 3;
  // ponti: ombra, piloni, impalcato
  for (const seg of tratti(sullAcqua)) {
    const ombra = seg.map((p) => [p[0] + 7, p[1] + 9]);
    linea(ombra, 22, "rgba(0,20,40,.35)");
    for (let i = 0; i < seg.length; i += 9) { ctx.fillStyle = "rgba(0,25,45,.35)"; ctx.beginPath(); ctx.ellipse(seg[i][0] + 5, seg[i][1] + 7, 5, 3, 0, 0, 7); ctx.fill(); }
    linea(seg, 23, "#e9e4d6"); linea(seg, 21, "#b9b3a3"); linea(seg, 17, "#4a4d52"); linea(seg, 0.9, "rgba(255,255,255,.9)", [7, 6]);
  }
  // strade sulla terra
  for (const seg of tratti((k) => !sullAcqua(k))) { linea(seg.map((p) => [p[0] + 2, p[1] + 3]), 20, "rgba(0,0,0,.25)"); linea(seg, 20, "#d8d2c2"); linea(seg, 17, "#3d4046"); linea(seg, 0.9, "rgba(255,214,90,.95)", [8, 6]); }
  // 4) edifici, alberi, piscine: solo sulla terra, lontano dalla strada
  const occ = new Uint8Array((W / 4) * (H / 4));
  const libero = (x, y, r) => { for (let yy = Math.floor((y - r) / 4); yy <= Math.floor((y + r) / 4); yy++) for (let xx = Math.floor((x - r) / 4); xx <= Math.floor((x + r) / 4); xx++) { if (xx < 0 || yy < 0 || xx >= W / 4 || yy >= H / 4 || occ[yy * (W / 4) + xx]) return false; } return true; };
  const occupa = (x, y, r) => { for (let yy = Math.floor((y - r) / 4); yy <= Math.floor((y + r) / 4); yy++) for (let xx = Math.floor((x - r) / 4); xx <= Math.floor((x + r) / 4); xx++) if (xx >= 0 && yy >= 0 && xx < W / 4 && yy < H / 4) occ[yy * (W / 4) + xx] = 1; };
  // le caselle e la strada sono "occupate"
  for (let i = 0; i < N; i += 2) occupa(P[i][0], P[i][1], 14);
  for (const c of g.caselle) occupa(c.x, c.y, 24);
  const dir = (x, y) => g.tang(g.vicDi(x, y));
  const posti = (passo, fn) => {
    for (let y = passo / 2; y < H; y += passo) for (let x = passo / 2; x < W; x += passo) {
      const xx = x + (R() - 0.5) * passo * 0.8, yy = y + (R() - 0.5) * passo * 0.8, t = g.leggi(g.terra, xx, yy);
      if (t < 9) continue;
      fn(xx, yy, temaDi(g.idDi(xx, yy)), t);
    }
  };
  // prima i grandi (grattacieli, magazzini, resort), poi i piccoli, infine alberi
  posti(26, (x, y, tm, t) => {
    if (tm === 2 && t > 13 && libero(x, y, 17)) { occupa(x, y, 17); grattacielo(ctx, x, y, dir(x, y), R); }
    else if (tm === 4 && t > 15 && libero(x, y, 18)) { occupa(x, y, 18); R() < 0.5 ? magazzino(ctx, x, y, dir(x, y), R) : container(ctx, x, y, dir(x, y), R); }
    else if (tm === 1 && t > 18 && R() < 0.5 && libero(x, y, 18)) { occupa(x, y, 18); resort(ctx, x, y, dir(x, y), R); }
  });
  posti(19, (x, y, tm, t) => {
    if (!libero(x, y, 9)) return;
    if (tm === 0) { occupa(x, y, 9); casetta(ctx, x, y, dir(x, y) + (R() < 0.2 ? Math.PI / 2 : 0), R, ["#c8553d", "#d9733f", "#b5452f", "#e08a4c"]); }
    else if (tm === 3) { occupa(x, y, 9); villa(ctx, x, y, dir(x, y), R); }
    else if (tm === 2 && R() < 0.6) { occupa(x, y, 9); casetta(ctx, x, y, dir(x, y), R, ["#d7dde3", "#aeb8c2", "#c9cfd6"]); }
    else if (tm === 4 && R() < 0.6) { occupa(x, y, 9); R() < 0.5 ? pannelli(ctx, x, y, dir(x, y)) : container(ctx, x, y, dir(x, y), R, 0.6); }
    else if (tm === 1 && R() < 0.35) { occupa(x, y, 9); casetta(ctx, x, y, dir(x, y), R, ["#f4efe6", "#e9dcc6"]); }
  });
  posti(8, (x, y, tm) => {
    const prob = [0.35, 0.95, 0.22, 0.6, 0.12, 0.7][tm];
    if (R() > prob || !libero(x, y, 3)) return;
    occupa(x, y, 2);
    if (tm === 1 || tm === 3 || tm === 5) palma(ctx, x, y, R); else albero(ctx, x, y, R, tm);
  });
  // 5) il Faro
  faro(ctx, 1520, 858);
  // 6) i bordi sfumano nel mare aperto (oltre il bordo si vede lo stesso blu)
  for (const [x0, y0, x1, y1] of [[0, 0, 0, 40], [0, H, 0, H - 40], [0, 0, 40, 0], [W, 0, W - 40, 0]]) {
    const gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, "rgba(11,62,104,1)"); gr.addColorStop(1, "rgba(11,62,104,0)");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  return new Promise((ok) => cv.toBlob((b) => ok(URL.createObjectURL(b)), "image/jpeg", 0.88));
}

// --------------------------------------------------------------- pezzi di citta'
function ombra(ctx, f, dx = 3, dy = 4, al = 0.33) { ctx.save(); ctx.translate(dx, dy); ctx.fillStyle = `rgba(10,20,25,${al})`; f(); ctx.fill(); ctx.restore(); }
const K = 1.4; // grandezza degli edifici
function ruota(ctx, x, y, a, f) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(K, K); f(); ctx.restore(); }
function casetta(ctx, x, y, a, R, cols) {
  const w = 8 + R() * 6, h = 6 + R() * 4, col = cols[Math.floor(R() * cols.length)];
  ruota(ctx, x, y, a, () => {
    ombra(ctx, () => { ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); }, 2, 2.5);
    ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(-w / 2, 0, w, h / 2);         // falda in ombra
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
  });
}
function villa(ctx, x, y, a, R) {
  const cols = ["#f7c6cf", "#fbe3d3", "#ffffff", "#f6b0a8", "#fde7ef"];
  ruota(ctx, x, y, a, () => {
    const w = 10 + R() * 4, h = 7 + R() * 3;
    ombra(ctx, () => { ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); }, 2, 2.5);
    ctx.fillStyle = cols[Math.floor(R() * cols.length)]; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(-w / 2, 0, w, h / 2);
    if (R() < 0.75) { ctx.fillStyle = "#e8f6f6"; ctx.fillRect(-w / 2 - 1, h / 2 + 1, w * 0.62 + 2, 4.6); ctx.fillStyle = "#2ad0e0"; ctx.fillRect(-w / 2, h / 2 + 1.6, w * 0.62, 3.4); ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(-w / 2 + 1, h / 2 + 2, w * 0.3, 0.7); }
  });
}
function resort(ctx, x, y, a, R) {
  ruota(ctx, x, y, a, () => {
    ombra(ctx, () => { ctx.beginPath(); ctx.rect(-12, -6, 24, 7); ctx.rect(-12, -6, 6, 16); }, 3, 4);
    ctx.fillStyle = "#f6f1e7"; ctx.fillRect(-12, -6, 24, 7); ctx.fillRect(-12, -6, 6, 16);
    ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(-12, -2.5, 24, 3.5);
    // piscina a forma libera
    ctx.fillStyle = "#e9f4f2"; ctx.beginPath(); ctx.ellipse(4, 7, 8, 4.4, 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = "#21c6dc"; ctx.beginPath(); ctx.ellipse(4, 7, 7, 3.4, 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.45)"; ctx.beginPath(); ctx.ellipse(2, 6, 3, 0.8, 0.1, 0, 7); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ["#ff8a5b", "#ffd166", "#ffffff", "#ef476f"][i]; ctx.beginPath(); ctx.arc(-4 + i * 4, 12.5, 1, 0, 7); ctx.fill(); }
  });
}
function grattacielo(ctx, x, y, a, R) {
  const w = 13 + R() * 9, h = 13 + R() * 9, alto = 0.6 + R() * 0.8;
  const vetri = [["#9fd3ea", "#3b7fa8"], ["#c9d6df", "#6c8293"], ["#8fe0d6", "#2f7f86"], ["#e8d9b0", "#9a8558"], ["#b9c8ff", "#4a5ea8"]][Math.floor(R() * 5)];
  ruota(ctx, x, y, a, () => {
    // ombra lunga: piu' e' alto piu' e' lunga
    ctx.save(); ctx.fillStyle = "rgba(10,20,30,.38)"; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2 + 12 * alto, -h / 2 + 16 * alto); ctx.lineTo(w / 2 + 12 * alto, h / 2 + 16 * alto); ctx.lineTo(-w / 2 + 12 * alto, h / 2 + 16 * alto); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.restore();
    const gr = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gr.addColorStop(0, vetri[0]); gr.addColorStop(1, vetri[1]);
    ctx.fillStyle = gr; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 0.7; ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    // tetto: impianti o eliporto
    if (R() < 0.3) { ctx.fillStyle = "#3a3f46"; ctx.beginPath(); ctx.arc(0, 0, Math.min(w, h) * 0.32, 0, 7); ctx.fill(); ctx.strokeStyle = "#ffd65a"; ctx.lineWidth = 0.7; ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.min(w, h) * 0.34}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("H", 0, 0.5); }
    else { ctx.fillStyle = "rgba(40,50,60,.55)"; ctx.fillRect(-w * 0.25, -h * 0.25, w * 0.5, h * 0.3); ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(-w / 2 + 1.5, -h / 2 + 1.5, w * 0.3, 1); }
  });
}
function magazzino(ctx, x, y, a, R) {
  const w = 20 + R() * 8, h = 11 + R() * 4, col = ["#5b7c99", "#8a9aa8", "#b55d3a", "#d9d9d4", "#3f6f8f"][Math.floor(R() * 5)];
  ruota(ctx, x, y, a, () => {
    ombra(ctx, () => { ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); }, 3, 4);
    ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 0.6; for (let i = -w / 2 + 2; i < w / 2; i += 2.2) { ctx.beginPath(); ctx.moveTo(i, -h / 2); ctx.lineTo(i, h / 2); ctx.stroke(); }
    ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fillRect(-w / 2, 0, w, h / 2);
  });
}
function container(ctx, x, y, a, R, sc = 1) {
  const cols = ["#d64545", "#2d7dd2", "#f2a541", "#3bb273", "#e1e1e1", "#7768ae", "#ef6f6c"];
  ruota(ctx, x, y, a, () => {
    ctx.scale(sc, sc);
    ombra(ctx, () => { ctx.beginPath(); ctx.rect(-12, -7, 24, 14); }, 2, 2.5, 0.25);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { if (R() < 0.12) continue; ctx.fillStyle = cols[Math.floor(R() * cols.length)]; ctx.fillRect(-12 + c * 8.2, -7 + r * 3.6, 7.6, 3.1); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(-12 + c * 8.2, -7 + r * 3.6, 7.6, 0.8); }
  });
}
function pannelli(ctx, x, y, a) {
  ruota(ctx, x, y, a, () => { for (let r = 0; r < 3; r++) { ctx.fillStyle = "#1d3557"; ctx.fillRect(-7, -6 + r * 4.2, 14, 3.2); ctx.strokeStyle = "rgba(160,200,255,.45)"; ctx.lineWidth = 0.4; for (let i = -7; i <= 7; i += 2.3) { ctx.beginPath(); ctx.moveTo(i, -6 + r * 4.2); ctx.lineTo(i, -2.8 + r * 4.2); ctx.stroke(); } } });
}
function palma(ctx, x, y, R) {
  const r = 3.2 + R() * 2.4, a0 = R() * 6;
  ctx.fillStyle = "rgba(10,30,10,.3)"; ctx.beginPath(); ctx.arc(x + 2, y + 2.6, r * 0.8, 0, 7); ctx.fill();
  for (let i = 0; i < 7; i++) {
    const a = a0 + i * 0.9, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
    ctx.strokeStyle = i % 2 ? "#2f8f3a" : "#47a845"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * r * 0.6, y + Math.sin(a + 0.4) * r * 0.6, ex, ey); ctx.stroke();
  }
  ctx.fillStyle = "#6b4f2a"; ctx.beginPath(); ctx.arc(x, y, 0.8, 0, 7); ctx.fill();
}
function albero(ctx, x, y, R, tm) {
  const r = 2 + R() * 2.2, col = tm === 0 ? ["#6f8a3a", "#5a7a32", "#8a9a48"] : ["#3f7f3a", "#4f9a44", "#2e6b32"];
  ctx.fillStyle = "rgba(10,25,10,.3)"; ctx.beginPath(); ctx.arc(x + 1.6, y + 2, r, 0, 7); ctx.fill();
  ctx.fillStyle = col[Math.floor(R() * 3)]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, 7); ctx.fill();
}
function barca(ctx, x, y, a, big) {
  ruota(ctx, x, y, a, () => {
    const l = big ? 11 : 6, w = big ? 3.6 : 2.2;
    const sc = ctx.createLinearGradient(-l * 5, 0, -l / 2, 0); sc.addColorStop(0, "rgba(255,255,255,0)"); sc.addColorStop(1, "rgba(255,255,255,.55)");
    ctx.fillStyle = sc; ctx.beginPath(); ctx.moveTo(-l / 2, -w / 2); ctx.lineTo(-l * 5, -w * 2.4); ctx.lineTo(-l * 5, w * 2.4); ctx.lineTo(-l / 2, w / 2); ctx.fill();
    ctx.fillStyle = "rgba(0,20,40,.3)"; ctx.beginPath(); ctx.ellipse(1, 1.5, l / 2, w / 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(-l / 2, -w / 2); ctx.lineTo(l * 0.25, -w / 2); ctx.quadraticCurveTo(l / 2 + 1, 0, l * 0.25, w / 2); ctx.lineTo(-l / 2, w / 2); ctx.closePath(); ctx.fill();
    if (big) { ctx.fillStyle = "#1d2b3a"; ctx.fillRect(-l * 0.2, -w * 0.28, l * 0.35, w * 0.56); ctx.fillStyle = "#c8a165"; ctx.fillRect(-l / 2 + 0.6, -w * 0.3, l * 0.2, w * 0.6); }
  });
}
function faro(ctx, x, y) {
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.arc(x + 4, y + 5, 7, 0, 7); ctx.fill();
  [[7, "#ffffff"], [5.6, "#d62828"], [4.2, "#ffffff"], [2.8, "#d62828"], [1.6, "#ffd65a"]].forEach(([r, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
  const g = ctx.createRadialGradient(x, y, 0, x, y, 40); g.addColorStop(0, "rgba(255,230,140,.35)"); g.addColorStop(1, "rgba(255,230,140,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 40, -2.4, -1.6); ctx.closePath(); ctx.fill();
}
