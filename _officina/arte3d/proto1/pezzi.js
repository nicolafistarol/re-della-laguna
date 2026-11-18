// Gli elementi di gioco in 3D sopra la foto in rilievo: caselle lungo il percorso vero,
// edifici dei giocatori che crescono, bandiere, pedine, torri dei Palazzi.
// Stessa forma dei dati di Tre.aggiorna({caselle, torri, giocatori}) del gioco (x,y in % della foto).
import * as THREE from "three";

// --- copiati da gioco.js (righe 355-369): il percorso sulle strade e sui ponti della foto
export const TRATTI = [[[58,70],[52,70.5],[46,70],[41,69.5],[37,72],[31,74.5],[25,73.5],[19,71.5],[14.5,68],[12.5,63],[15,58.5],[18,56],[15.5,51],[13.5,46]],[[13.5,46],[14,41],[16,37],[12,33.5],[15,30],[20,28.5],[25,27.5],[29,27],[33,26],[36,25.5],[40,24.8],[44,24.5]],[[44,24.5],[44.5,29],[41.5,33],[38.5,38],[37.5,43],[40,47],[45,49.5],[50,50.5],[56,49.5],[61,47],[63,42.5],[62,37],[60,32],[59,28],[60,25],[62,25]],[[62,25],[66,26],[70,27.5],[74,28.5],[78,29],[82,29.5],[85.5,31],[87,34],[84,36],[82,38.5],[84,42],[86.5,44.5]],[[86.5,44.5],[86.5,49],[84.5,53],[88,56],[91.5,58.5],[90,63],[85,65],[80,66.5],[75,64],[72,61],[69,62],[65,64.5],[61,67],[58,70]]];
export const POS_CASA = { Ambra: [35, 70], Palma: [26, 30], Flamingo: [82.5, 26], Sole: [86, 52], Corona: [52, 41] };
const ISOLE = ["Ambra", "Palma", "Corona", "Flamingo", "Sole"];
function lungo(poli, t) {
  const seg = []; let tot = 0;
  for (let i = 1; i < poli.length; i++) { const d = Math.hypot(poli[i][0] - poli[i - 1][0], (poli[i][1] - poli[i - 1][1]) * 0.5625); seg.push(d); tot += d; }
  let r = t * tot;
  for (let i = 0; i < seg.length; i++) { if (r <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, r / seg[i]) : 0; return [poli[i][0] + (poli[i + 1][0] - poli[i][0]) * f, poli[i][1] + (poli[i + 1][1] - poli[i][1]) * f]; } r -= seg[i]; }
  return poli[poli.length - 1];
}
export const N_CAS = 80, SEZ = 16;
export const PUNTI = Array.from({ length: N_CAS }, (_, i) => lungo(TRATTI[Math.floor(i / SEZ)], (i % SEZ) / SEZ));

// Una partita finta a meta' strada, per le foto dei prototipi
export function statoDemo(seme = 7) {
  let s = seme; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const gioc = [{ id: "a", colore: "#e0457b" }, { id: "b", colore: "#19b6c9" }, { id: "c", colore: "#f2b033" }, { id: "d", colore: "#7a5cf0" }];
  const COL = ["#b5651d", "#58c7f3", "#e85d9c", "#f39a2b", "#e23b3b", "#f4d13d", "#2fae66", "#2b5fd9", "#8d6ad9", "#3bb6a5"];
  const caselle = PUNTI.map(([x, y], i) => {
    const k = i % SEZ, angolo = k === 0, speciale = k === 5 || k === 11, molo = k === 8;
    const tipo = angolo ? "angolo" : speciale ? "carta" : molo ? "molo" : "lotto";
    const serie = Math.floor(i / SEZ) * 2 + (k < 8 ? 0 : 1);
    const own = (tipo === "lotto" || tipo === "molo") && rnd() < 0.62 ? gioc[(rnd() * 4) | 0] : null;
    const livello = own && tipo === "lotto" ? [0, 1, 1, 2, 2, 3, 4, 5][(rnd() * 8) | 0] : 0;
    return { id: "c" + i, idx: i, x, y, tipo, isola: ISOLE[Math.floor(i / SEZ)], coloreSerie: tipo === "lotto" ? COL[serie] : tipo === "molo" ? "#e9eef5" : tipo === "angolo" ? "#d9b45a" : "#f4efe2", terreno: tipo === "lotto" || tipo === "molo", proprietario: own ? own.colore : null, livello, cantiere: own && rnd() < 0.08 };
  });
  const torri = [{ isola: "Corona", colore: gioc[0].colore, piani: 9 }, { isola: "Ambra", colore: gioc[1].colore, piani: 4 }, { isola: "Flamingo", colore: gioc[2].colore, piani: 6 }, { isola: "Sole", colore: gioc[3].colore, piani: 2 }].map((t) => ({ ...t, x: POS_CASA[t.isola][0], y: POS_CASA[t.isola][1] }));
  const giocatori = gioc.map((g, i) => { const pos = [3, 22, 41, 70][i]; return { id: g.id, colore: g.colore, pos, x: PUNTI[pos][0], y: PUNTI[pos][1], offset: 0 }; });
  return { caselle, torri, giocatori };
}

function texFinestre() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 64; const x = c.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, 64, 64);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { x.fillStyle = Math.random() < 0.7 ? "#fff" : "#444"; x.fillRect(q * 16 + 4, r * 16 + 5, 8, 7); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function texOmbra() {
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, "rgba(0,10,25,.55)"); g.addColorStop(1, "rgba(0,10,25,0)"); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

export function creaPezzi(R, scena, { modelli = null, scala = 1, luci = true } = {}) {
  const gruppo = new THREE.Group(); scena.add(gruppo);
  // luci come nella foto: sole basso e caldo da sinistra-dietro, cielo azzurro, riflesso del mare
  const emi = new THREE.HemisphereLight("#eaf6ff", "#49b9c9", 1.7); const sole = new THREE.DirectionalLight("#ffd9a0", 2.3); sole.position.set(-0.75, 0.55, -0.55);
  const fronte = new THREE.DirectionalLight("#fff1dd", 1.3); fronte.position.set(0.3, 0.6, 1);
  if (luci) scena.add(emi, sole, fronte);

  // posizioni nel mondo delle 80 caselle (altezze lisciate lungo il percorso: la profondita' stimata ha un po' di rumore)
  const pts = PUNTI.map(([x, y]) => R.suolo(x, y));
  const ys = pts.map((p) => p.y);
  pts.forEach((p, i) => { const v = [-2, -1, 0, 1, 2].map((d) => ys[(i + d + N_CAS) % N_CAS]).sort((a, b) => a - b); p.y = v[2]; });
  const passi = pts.map((p, i) => p.distanceTo(pts[(i + 1) % N_CAS])).sort((a, b) => a - b);
  const sMin = passi[2] * scala;                           // misura base di un pezzo (le caselle piu' fitte)
  const s = sMin;
  const sc = pts.map((p, i) => Math.min(1.9 * sMin, 0.92 * scala * Math.min(p.distanceTo(pts[(i + 1) % N_CAS]), p.distanceTo(pts[(i + N_CAS - 1) % N_CAS]))));  // le lontane un po' piu' grandi
  const tang = pts.map((p, i) => pts[(i + 1) % N_CAS].clone().sub(pts[(i + N_CAS - 1) % N_CAS]).setY(0).normalize());

  const tOmbra = texOmbra(), tFin = texFinestre();
  const gDisco = new THREE.CylinderGeometry(0.36, 0.38, 0.04, 28), gAnello = new THREE.TorusGeometry(0.39, 0.03, 8, 32); gAnello.rotateX(Math.PI / 2);
  const gBox = new THREE.BoxGeometry(1, 1, 1); gBox.translate(0, 0.5, 0);
  const gOmbra = new THREE.PlaneGeometry(1, 1); gOmbra.rotateX(-Math.PI / 2);
  const mOmbra = new THREE.MeshBasicMaterial({ map: tOmbra, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mBianco = new THREE.MeshStandardMaterial({ color: "#f7f3ea", roughness: 0.55 });
  const matCol = new Map(); const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!matCol.has(k)) matCol.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.05, ...o })); return matCol.get(k); };
  let notte = 0; const accese = [];

  function ombra(g, r, y = 0.02) { if (!luci) return; const m = new THREE.Mesh(gOmbra, mOmbra); m.scale.set(r, 1, r); m.position.set(r * 0.22, y, r * 0.2); m.renderOrder = 2; g.add(m); }

  // edificio che cresce, nello stile dell'isola (colori presi dalla foto); il colore del giocatore sta su anello, cornici e bandiera
  const STILI = {
    Ambra: { muro: "#f1dcb4", fin: "#6b4a34", tetto: "#d2622f", forma: "falde" },
    Palma: { muro: "#fbf5e6", fin: "#5d7f8c", tetto: "#c9683a", forma: "falde" },
    Flamingo: { muro: "#f6a9bd", fin: "#7a4b66", tetto: "#fde3ea", forma: "deco" },
    Corona: { muro: "#8fc4e8", fin: "#2c5f8f", tetto: "#d6ecfa", forma: "vetro" },
    Sole: { muro: "#b9d3e2", fin: "#3d6480", tetto: "#eef4f7", forma: "vetro" },
  };
  const facciate = new Map();
  function facciata(st) {
    if (facciate.has(st.muro)) return facciate.get(st.muro);
    const mk = (muro, fin) => { const c = document.createElement("canvas"); c.width = 64; c.height = 32; const x = c.getContext("2d"); x.fillStyle = muro; x.fillRect(0, 0, 64, 32); x.fillStyle = fin; for (let q = 0; q < 4; q++) x.fillRect(q * 16 + 4, 9, 8, 15); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const f = { giorno: mk(st.muro, st.fin), notte: mk("#000", "#fff") }; facciate.set(st.muro, f); return f;
  }
  function edificio(colore, livello, cantiere, isola) {
    const g = new THREE.Group();
    if (modelli && modelli.edificio) { const m = modelli.edificio(colore, livello, cantiere, isola); if (m) { g.add(m); return g; } }
    const st = STILI[isola] || STILI.Ambra, vetro = st.forma === "vetro";
    const piani = (vetro ? [0, 2, 3, 5, 8, 12] : [0, 1, 2, 3, 4, 6])[livello], larg = [0, 0.42, 0.46, 0.5, 0.56, 0.5][livello], hp = 0.17, h = piani * hp;
    const f = facciata(st);
    const mk = (rx) => { const d = f.giorno.clone(), n = f.notte.clone(); d.repeat.set(rx, piani); n.repeat.set(rx, piani); d.needsUpdate = n.needsUpdate = true; const m = new THREE.MeshStandardMaterial({ map: d, roughness: vetro ? 0.22 : 0.8, metalness: vetro ? 0.3 : 0, emissive: "#ffcf8a", emissiveMap: n, emissiveIntensity: 0 }); accese.push(m); return m; };
    const muro = cantiere ? mat("#d9c7a0", { transparent: true, opacity: 0.8 }) : mk(Math.max(1, Math.round(larg * 4)) / 4 * 1);
    const corpo = new THREE.Mesh(gBox, muro); corpo.scale.set(larg, h, larg); g.add(corpo);
    if (livello >= 4 && !vetro) for (const dx of [-1, 1]) { const ala = new THREE.Mesh(gBox, muro); ala.scale.set(larg * 0.5, h * 0.6, larg * 0.8); ala.position.x = dx * larg * 0.7; g.add(ala); const ta = new THREE.Mesh(gBox, mat(st.tetto)); ta.scale.set(larg * 0.56, 0.035, larg * 0.86); ta.position.set(dx * larg * 0.7, h * 0.6, 0); g.add(ta); }
    const mt = mat(st.tetto, { roughness: 0.6 });
    if (st.forma === "falde") { const t = new THREE.Mesh(new THREE.ConeGeometry(larg * 0.78, larg * 0.42, 4).rotateY(Math.PI / 4).translate(0, larg * 0.21, 0), mt); t.position.y = h; g.add(t); }
    else if (st.forma === "deco") { const c = new THREE.Mesh(gBox, mt); c.scale.set(larg + 0.05, 0.05, larg + 0.05); c.position.y = h; g.add(c); if (livello >= 3) { const cu = new THREE.Mesh(new THREE.SphereGeometry(larg * 0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mt); cu.position.y = h + 0.05; g.add(cu); } }
    else { const c = new THREE.Mesh(gBox, mt); c.scale.set(larg * 0.7, 0.08, larg * 0.7); c.position.y = h; g.add(c); if (livello >= 4) { const an = new THREE.Mesh(gBox, mBianco); an.scale.set(0.025, 0.4, 0.025); an.position.y = h + 0.08; g.add(an); } }
    // cornice col colore del proprietario + bandierina sul tetto
    const cor = new THREE.Mesh(gBox, mat(colore, { emissive: colore, emissiveIntensity: 0.3 })); cor.scale.set(larg + 0.05, 0.035, larg + 0.05); cor.position.y = 0.0; g.add(cor);
    const b = bandiera(colore); b.scale.setScalar(0.55); b.position.set(larg * 0.3, h + (st.forma === "falde" ? larg * 0.2 : 0.06), 0); g.add(b);
    return g;
  }
  function bandiera(colore) { const g = new THREE.Group(); const a = new THREE.Mesh(gBox, mBianco); a.scale.set(0.03, 0.75, 0.03); g.add(a); const b = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2).translate(0.17, 0.64, 0), mat(colore, { side: THREE.DoubleSide, emissive: colore, emissiveIntensity: 0.25 })); g.add(b); return g; }
  function pedina(colore) {
    const g = new THREE.Group();
    if (modelli && modelli.pedina) { const m = modelli.pedina(colore); if (m) { g.add(m); return g; } }
    const m = mat(colore, { roughness: 0.25, metalness: 0.1, emissive: colore, emissiveIntensity: 0.18 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.1, 20).translate(0, 0.05, 0), m), corpo = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 20).translate(0, 0.33, 0), m), testa = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14).translate(0, 0.62, 0), m);
    const oro = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 8, 20).rotateX(Math.PI / 2).translate(0, 0.5, 0), mat("#f3d27a", { metalness: 0.7, roughness: 0.25 }));
    g.add(base, corpo, testa, oro); return g;
  }
  function torre(colore, piani) {
    const g = new THREE.Group(); const h = 0.5 + piani * 0.3, f = facciata(STILI.Corona);
    const d = f.giorno.clone(), n = f.notte.clone(); d.repeat.set(1, piani + 1); n.repeat.set(1, piani + 1); d.needsUpdate = n.needsUpdate = true;
    const v = new THREE.MeshStandardMaterial({ map: d, roughness: 0.18, metalness: 0.35, emissive: "#ffd28a", emissiveMap: n, emissiveIntensity: 0 }); accese.push(v);
    const c = new THREE.Mesh(gBox, v); c.scale.set(0.62, h, 0.62); g.add(c);
    const c2 = new THREE.Mesh(gBox, v); c2.scale.set(0.42, h * 0.72, 0.42); c2.position.set(0.4, 0, 0.12); g.add(c2);
    const t = new THREE.Mesh(gBox, mat(colore, { emissive: colore, emissiveIntensity: 0.45 })); t.scale.set(0.68, 0.07, 0.68); t.position.y = h; g.add(t);
    const t2 = new THREE.Mesh(gBox, mat(colore, { emissive: colore, emissiveIntensity: 0.45 })); t2.scale.set(0.68, 0.04, 0.68); g.add(t2);
    const ant = new THREE.Mesh(gBox, mBianco); ant.scale.set(0.035, 0.5, 0.035); ant.position.y = h + 0.07; g.add(ant);
    const b = bandiera(colore); b.scale.setScalar(0.8); b.position.set(0, h + 0.07, 0); g.add(b);
    return g;
  }
  const gCas = new THREE.Group(), gTor = new THREE.Group(), gPed = new THREE.Group(); gruppo.add(gCas, gTor, gPed);
  const pedine = new Map();
  function svuota(g) { while (g.children.length) g.remove(g.children[0]); }
  function aggiorna({ caselle, torri, giocatori }) {
    svuota(gCas); svuota(gTor); accese.length = 0;
    for (const c of caselle) {
      const p = pts[c.idx], g = new THREE.Group(); const s = Math.max(sMin, sc[c.idx]); g.position.copy(p); g.position.y += 0.16 * s; g.scale.setScalar(s);
      g.rotation.y = Math.atan2(tang[c.idx].x, tang[c.idx].z);
      const grande = c.tipo === "angolo" ? 1.5 : 1;
      const d = new THREE.Mesh(gDisco, mat(c.coloreSerie, { roughness: 0.35 })); d.scale.set(grande, 1, grande); d.position.y = 0.02; g.add(d);
      const an = new THREE.Mesh(gAnello, c.proprietario ? mat(c.proprietario, { emissive: c.proprietario, emissiveIntensity: 0.35 }) : mBianco); an.scale.set(grande, 1, grande); an.position.y = 0.04; g.add(an);
      ombra(g, 1.35 * grande, -0.03);
      if (c.proprietario) {
        if (c.livello > 0 || c.cantiere) { const e = edificio(c.proprietario, Math.max(1, c.livello), c.cantiere, c.isola); e.position.y = 0.06; g.add(e); }
        else { const b = bandiera(c.proprietario); b.position.y = 0.06; g.add(b); }
      }
      g.userData.id = c.id; gCas.add(g);
    }
    for (const t of torri) { const p = R.suolo(t.x, t.y), g = torre(t.colore, t.piani); g.position.copy(p); g.scale.setScalar(sMin * 1.25); ombra(g, 1.8); gTor.add(g); }
    for (const q of giocatori) {
      let o = pedine.get(q.id); if (!o) { o = { g: pedina(q.colore) }; pedine.set(q.id, o); gPed.add(o.g); }
      const i = q.pos % N_CAS, lato = new THREE.Vector3(-tang[i].z, 0, tang[i].x);
      o.g.position.copy(pts[i]).addScaledVector(lato, 0.62 * Math.max(sMin, sc[i]) * (q.offset % 2 ? -1 : 1)).addScaledVector(tang[i], 0.3 * sMin * q.offset); const s = Math.max(sMin, sc[i]); o.g.position.y += 0.2 * s; o.g.scale.setScalar(s * 1.15);
    }
    impostaNotte(notte);
  }
  function impostaNotte(n) { notte = n; emi.intensity = 1.7 - 1.35 * n; sole.intensity = 2.3 * (1 - n) + 0.25 * n; sole.color.set(n > 0.5 ? "#9db8ff" : "#ffd9a0"); fronte.intensity = 1.3 * (1 - n * 0.8); for (const m of accese) m.emissiveIntensity = 1.6 * n; }
  return { gruppo, aggiorna, impostaNotte, pts, s, gCas };
}
