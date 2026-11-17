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
function lastra(punti, alto, y, colore) {
  const forma = new THREE.Shape(punti.map((q) => new THREE.Vector2(q.x, -q.y)));
  const geo = new THREE.ExtrudeGeometry(forma, { depth: alto, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.8, bevelSegments: 2, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.95 }));
  m.position.y = y; m.receiveShadow = true; m.castShadow = false;
  return m;
}
// generatore di numeri fisso: la citta' e' sempre uguale per tutti
function caso(seme) { let t = seme >>> 0; return () => { t = (t + 0x6d2b79f5) >>> 0; let r = Math.imul(t ^ (t >>> 15), t | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

// caselle: [{ x, z, isola }] nell'ordine del giro. Ritorna un gruppo da aggiungere alla scena.
export function costruisci(caselle) {
  const mondo = new THREE.Group();
  const QUOTA = 1.4; // altezza della strada sulle isole
  // --- 1. le isole
  const perIsola = {};
  for (const c of caselle) (perIsola[c.isola] = perIsola[c.isola] || []).push({ x: c.x, y: c.z });
  const poligoni = {};
  for (const [nome, pts] of Object.entries(perIsola)) {
    const st = STILE_ISOLA[nome] || STILE_BASE;
    const fuori = contorno(pts, 9), sopra = contorno(pts, 6.5);
    poligoni[nome] = sopra.punti;
    mondo.add(lastra(fuori.punti, 0.6, -0.2, st.sabbia));
    mondo.add(lastra(sopra.punti, 0.5, 0.5, st.terra));
    // la citta': tanti piccoli edifici dentro l'isola, lontani dalla strada
    const r = caso(nome.length * 977 + pts.length * 31);
    const minX = Math.min(...sopra.punti.map((q) => q.x)), maxX = Math.max(...sopra.punti.map((q) => q.x));
    const minY = Math.min(...sopra.punti.map((q) => q.y)), maxY = Math.max(...sopra.punti.map((q) => q.y));
    const mats = st.citta.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
    const istanze = mats.map((m) => new THREE.InstancedMesh(geo, m, 160));
    const conta = mats.map(() => 0), dummy = new THREE.Object3D();
    for (let k = 0; k < 420; k++) {
      const q = { x: minX + r() * (maxX - minX), y: minY + r() * (maxY - minY) };
      if (!dentro(q, sopra.punti)) continue;
      if (caselle.some((c) => Math.hypot(c.x - q.x, c.z - q.y) < 4.2)) continue; // la strada e i lotti restano liberi
      const i = Math.floor(r() * mats.length); if (conta[i] >= 160) continue;
      const h = (0.8 + r() * 2.2) * st.alte * (r() < 0.08 ? 2.4 : 1);
      dummy.position.set(q.x, 1.0, q.y); dummy.scale.set(1 + r() * 1.4, h, 1 + r() * 1.4); dummy.rotation.y = r() * Math.PI; dummy.updateMatrix();
      istanze[i].setMatrixAt(conta[i]++, dummy.matrix);
    }
    istanze.forEach((m, i) => { m.count = conta[i]; m.castShadow = true; m.receiveShadow = true; mondo.add(m); });
    // palme sulla sabbia
    const palme = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 1.6, 6), new THREE.MeshStandardMaterial({ color: "#2f7d4a" }), 40);
    let np = 0;
    for (let k = 0; k < fuori.punti.length && np < 40; k += 3) {
      const a = fuori.punti[k], b = sopra.punti[Math.floor((k / fuori.punti.length) * sopra.punti.length)] || a;
      dummy.position.set((a.x + b.x) / 2, 1.2, (a.y + b.y) / 2); dummy.scale.set(1, 1, 1); dummy.rotation.y = 0; dummy.updateMatrix();
      palme.setMatrixAt(np++, dummy.matrix);
    }
    palme.count = np; mondo.add(palme);
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
  return { mondo, curva, quota: QUOTA };
}

// il mare: un piano grande che ondeggia piano
export function mare() {
  const geo = new THREE.PlaneGeometry(900, 900, 90, 90); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#1f7a93", roughness: 0.35, metalness: 0.1, flatShading: true }));
  m.position.y = -0.3; m.receiveShadow = true;
  const base = Float32Array.from(geo.attributes.position.array);
  m.userData.onda = (t) => {
    const a = geo.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) a[i + 1] = base[i + 1] + Math.sin(base[i] * 0.08 + t) * 0.12 + Math.cos(base[i + 2] * 0.07 + t * 0.8) * 0.12;
    geo.attributes.position.needsUpdate = true;
  };
  return m;
}
