// =====================================================================
// RE DELLA LAGUNA — il tabellone in 3D
// La foto della laguna diventa un piano inclinato che si può ruotare e avvicinare.
// Sopra: basi delle caselle in rilievo, edifici che crescono, torri dei Palazzi
// e pedine in piedi. Le etichette e i pulsanti restano quelli di sempre (HTML),
// ma seguono la prospettiva: ogni frame vengono proiettati sul piano.
// =====================================================================
import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";
import * as M3 from "./mondo3d.js?v=63";

// Il mondo modellato (isole, strada, ponti, mare) al posto della foto. ?foto = torna alla foto.
const MONDO = (() => { try { const q = location.search; if (q.includes("foto")) return false; if (q.includes("mondo=3d")) return true; return localStorage.getItem("laguna_mondo") !== "foto"; } catch (e) { return true; } })();
export function mondoNuovo() { return MONDO; }
let M = null, mare3 = null, Q = 0;                 // il mondo costruito, il mare, l'altezza della strada
const posCasella = new Map(), posLotto = new Map(); // id casella -> punto sulla strada / punto del lotto
let pts = [], nCas = 0;                            // punti della strada per indice di casella
let suCasellaCb = null; export function suCasella(f) { suCasellaCb = f; }
let modo = "segui";                                // "segui" | "libera" | "alto"
export function modoVista() { return modo; }
let seguiFino = 0, seguiId = null, mioIdTre = null; export function sonoIo(id) { mioIdTre = id; }

const W = 160, H = 90;                      // il piano ha le proporzioni della foto (16:9)
const daMappa = (x, y) => new THREE.Vector3(x / 100 * W - W / 2, 0, y / 100 * H - H / 2);

let renderer, scena, camera, controlli, contenitore, strato, attivo = false;
let luceSole, luceAmb, piano, gruppoEdifici, gruppoTorri, gruppoBasi, notte = false;
const pedine = new Map(); // id -> { mesh, pos, target, salto }
let vistaIniziale = null;

export function supportato() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { return false; }
}

export function avvia(mondo, mappaDom, urlMappa) {
  if (attivo) return true;
  if (!supportato()) return false;
  contenitore = mondo; strato = mappaDom;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "tre-canvas";
  mondo.prepend(renderer.domElement);

  scena = new THREE.Scene();
  scena.background = new THREE.Color("#0b2a3a");
  scena.fog = new THREE.Fog("#0b2a3a", 170, 330);

  camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.5, 900);
  camera.position.set(0, 112, 92);

  if (MONDO) {
    scena.background = new THREE.Color("#9fd3ea"); scena.fog = new THREE.Fog("#9fd3ea", 160, 360);
    mare3 = M3.mare(); scena.add(mare3);
  } else {
  // il piano con la foto, piu' un mare largo intorno cosi' non si vede mai il vuoto
  const tex = new THREE.TextureLoader().load(urlMappa);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  piano = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 }));
  piano.rotation.x = -Math.PI / 2; piano.receiveShadow = true;
  scena.add(piano);
  const mare = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: "#1d6f86", roughness: 0.6 }));
  mare.rotation.x = -Math.PI / 2; mare.position.y = -0.05; scena.add(mare);
  }

  luceAmb = new THREE.HemisphereLight("#fff6e5", "#0d3b4f", 1.25);
  scena.add(luceAmb);
  luceSole = new THREE.DirectionalLight("#ffe2b0", 1.6);
  luceSole.position.set(-60, 90, 40);
  luceSole.castShadow = true;
  luceSole.shadow.mapSize.set(2048, 2048);
  Object.assign(luceSole.shadow.camera, { left: -95, right: 95, top: 60, bottom: -60, near: 1, far: 300 });
  scena.add(luceSole);

  gruppoBasi = new THREE.Group(); gruppoEdifici = new THREE.Group(); gruppoTorri = new THREE.Group();
  scena.add(gruppoBasi, gruppoEdifici, gruppoTorri);

  controlli = new MapControls(camera, renderer.domElement);
  controlli.enableDamping = true; controlli.dampingFactor = 0.08;
  controlli.screenSpacePanning = false;
  controlli.minDistance = 16; controlli.maxDistance = 200;
  controlli.minPolarAngle = MONDO ? 0.05 : 0.15; controlli.maxPolarAngle = MONDO ? 1.4 : 0.9;
  if (MONDO) { controlli.minDistance = 7; controlli.maxDistance = 230; controlli.addEventListener("start", () => { if (modo === "segui") seguiFino = 0; }); }
  if (MONDO) collegaTocchi(renderer.domElement);
  controlli.zoomToCursor = true;
  controlli.target.set(0, 0, 4);
  controlli.update();
  adattaVista();
  vistaIniziale = { pos: camera.position.clone(), target: controlli.target.clone() };

  addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); adattaVista(); vistaIniziale = { pos: camera.position.clone(), target: controlli.target.clone() }; });
  attivo = true;
  renderer.setAnimationLoop(frame);
  return true;
}
export function attivoOra() { return attivo; }

// ---------------------------------------------------------------- comandi della vista
function vola(pos, target, ms = 650) {
  const p0 = camera.position.clone(), t0 = controlli.target.clone(), inizio = performance.now();
  const passo = (t) => {
    const k = Math.min(1, (t - inizio) / ms), e = 1 - Math.pow(1 - k, 3);
    camera.position.lerpVectors(p0, pos, e); controlli.target.lerpVectors(t0, target, e); controlli.update();
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
export function avvicina(f) {
  const dir = camera.position.clone().sub(controlli.target);
  const d = THREE.MathUtils.clamp(dir.length() * f, controlli.minDistance, controlli.maxDistance);
  vola(controlli.target.clone().add(dir.setLength(d)), controlli.target.clone(), 300);
}
export function tutto() { vola(vistaIniziale.pos.clone(), vistaIniziale.target.clone()); }
export function ruota(gradi) {
  const t = controlli.target, v = camera.position.clone().sub(t);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(gradi));
  vola(t.clone().add(v), t.clone(), 450);
}
// scorrere la mappa (bordo dello schermo): dx, dy in pixel dello schermo
export function sposta(dx, dy) {
  if (!attivo) return;
  const dist = camera.position.distanceTo(controlli.target), k = dist / 500;
  const avanti = controlli.target.clone().sub(camera.position); avanti.y = 0; avanti.normalize();
  const destra = new THREE.Vector3().crossVectors(avanti, new THREE.Vector3(0, 1, 0)).normalize();
  const m = destra.multiplyScalar(dx * k).add(avanti.multiplyScalar(-dy * k));
  camera.position.add(m); controlli.target.add(m);
}
// all'inizio la mappa si apre piu' vicina (il tasto "vista intera" la mostra tutta)
export function apriVicino(x, y) {
  if (!attivo) return;
  if (MONDO && M && mioIdTre && pedine.has(mioIdTre)) {
    const ped = pedine.get(mioIdTre), u = ped.cur / nCas, p = M.curva.getPoint(u), tg = M.curva.getTangent(u).setY(0).normalize();
    camera.position.copy(p).sub(tg.clone().multiplyScalar(22)).setY(Q + 14); controlli.target.copy(p).add(tg.multiplyScalar(5)).setY(Q + 1); controlli.update(); return;
  }
  const t = daMappa(x, y), dir = camera.position.clone().sub(controlli.target).multiplyScalar(0.62);
  camera.position.copy(t).add(dir); controlli.target.copy(t); controlli.update();
}
export function centraSu(x, y) {
  const t = daMappa(x, y); if (MONDO) t.y = Q;
  const dir = camera.position.clone().sub(controlli.target);
  vola(t.clone().add(dir), t);
}

// ---------------------------------------------------------------- giorno e notte
export function impostaNotte(n) {
  if (!attivo || n === notte) return;
  notte = n;
  luceAmb.intensity = n ? 0.32 : 1.25;
  luceAmb.color.set(n ? "#8aa2ff" : "#fff6e5");
  luceSole.intensity = n ? 0.25 : 1.6;
  luceSole.color.set(n ? "#7d8cff" : "#ffe2b0");
  const cielo = MONDO ? "#9fd3ea" : "#0b2a3a";
  scena.background.set(n ? "#050816" : cielo); scena.fog.color.set(n ? "#050816" : cielo);
  gruppoEdifici.children.concat(gruppoTorri.children).forEach((m) => accendiFinestre(m, n));
}
function accendiFinestre(obj, n) {
  obj.traverse((m) => { if (m.userData.finestre) m.material.emissiveIntensity = n ? 1.4 : 0.05; });
}

// ---------------------------------------------------------------- oggetti
const geoBox = new THREE.BoxGeometry(1, 1, 1);
function texFinestre(colore) {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = colore; g.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 128; y += 14) for (let x = 6; x < 64; x += 14) { g.fillStyle = Math.random() < 0.75 ? "#ffd98a" : "#20242c"; g.fillRect(x, y, 8, 8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const cacheMat = new Map();
function matEdificio(colore, piani) {
  const k = colore + "|" + piani;
  if (cacheMat.has(k)) return cacheMat.get(k);
  const finestre = texFinestre(colore); finestre.repeat.set(1, Math.max(1, piani / 3));
  const m = new THREE.MeshStandardMaterial({ color: "#ffffff", map: finestre, emissive: "#ffcf73", emissiveMap: finestre, emissiveIntensity: 0.05, roughness: 0.55, metalness: 0.15 });
  cacheMat.set(k, m); return m;
}
function edificio(colore, livello, cantiere, attivita) {
  const g = new THREE.Group();
  if (cantiere) {
    const base = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#f3c56b", roughness: 0.8 }));
    base.scale.set(2.2, 0.6, 2.2); base.position.y = 0.3; base.castShadow = true; g.add(base);
    const gru = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#e2a400" }));
    gru.scale.set(0.18, 4, 0.18); gru.position.set(0.8, 2.2, 0.8); gru.castShadow = true; g.add(gru);
    const braccio = new THREE.Mesh(geoBox, gru.material); braccio.scale.set(2.6, 0.15, 0.15); braccio.position.set(0, 4.1, 0.8); g.add(braccio);
    return g;
  }
  if (attivita && FORMA[attivita]) { FORMA[attivita](g, colore, livello); accendiFinestre(g, notte); return g; }
  const h = [0, 1.6, 2.8, 4.4, 6.4, 9][livello] || 1.6, lato = [0, 1.7, 1.9, 2.1, 2.2, 2.4][livello] || 1.7;
  const corpo = new THREE.Mesh(geoBox, matEdificio(colore, livello * 3));
  corpo.scale.set(lato, h, lato); corpo.position.y = h / 2; corpo.castShadow = true; corpo.receiveShadow = true;
  corpo.userData.finestre = true; g.add(corpo);
  const tetto = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: colore, roughness: 0.4, metalness: 0.3 }));
  tetto.scale.set(lato * 1.08, 0.25, lato * 1.08); tetto.position.y = h + 0.12; tetto.castShadow = true; g.add(tetto);
  if (livello >= 5) { const ant = new THREE.Mesh(geoBox, tetto.material); ant.scale.set(0.12, 2, 0.12); ant.position.y = h + 1.2; g.add(ant); }
  accendiFinestre(g, notte);
  return g;
}
// ogni tipo di attivita' ha la sua forma (nel mondo modellato): si riconosce da lontano
function pezzo(g, geo, mat, sx, sy, sz, x, y, z) { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
const matTinta = (c, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.1 }, extra || {}));
const geoTetto = new THREE.ConeGeometry(0.75, 1, 4); geoTetto.rotateY(Math.PI / 4);
const FORMA = {
  residenze: (g, c, lv) => { const n = Math.min(4, 1 + Math.floor(lv / 2) + (lv >= 3 ? 1 : 0)); for (let i = 0; i < n; i++) { const x = (i % 2 ? 0.75 : -0.75), z = (i < 2 ? -0.7 : 0.7), h = 0.9 + lv * 0.35; const b = pezzo(g, geoBox, matEdificio("#f1e6d2", 3), 1.1, h, 1.1, x, h / 2, z); b.userData.finestre = true; pezzo(g, geoTetto, matTinta(c), 1.4, 0.8, 1.4, x, h + 0.4, z); } },
  tower: (g, c, lv, lato) => { const h = [0, 2, 3.4, 5.2, 7.4, 10][lv] || 2, l = lato || 2; const b = pezzo(g, geoBox, matEdificio(c, lv * 3), l, h, l, 0, h / 2, 0); b.userData.finestre = true; pezzo(g, geoBox, matTinta(c, { metalness: 0.4 }), l * 1.06, 0.25, l * 1.06, 0, h + 0.12, 0); if (lv >= 5) pezzo(g, geoBox, matTinta("#ddd"), 0.12, 2, 0.12, 0, h + 1.2, 0); },
  basso: (g, c, lv, tenda) => { const h = 0.9 + lv * 0.3, l = 2.2 + lv * 0.1; const b = pezzo(g, geoBox, matEdificio("#efe7da", 2), l, h, l * 0.8, 0, h / 2, 0); b.userData.finestre = true; pezzo(g, geoBox, matTinta(tenda || c), l * 1.05, 0.18, 0.7, 0, h * 0.75, l * 0.4 + 0.3); pezzo(g, geoBox, matTinta(c), l, 0.2, l * 0.8, 0, h + 0.1, 0); },
};
Object.assign(FORMA, {
  hotel: (g, c, lv) => FORMA.tower(g, c, lv, 2.2),
  uffici: (g, c, lv) => { FORMA.tower(g, "#9fc7e8", lv, 1.9); pezzo(g, geoBox, matTinta(c), 0.3, 0.3, 2.1, 0.9, 0.5, 0); },
  bancaprivata: (g, c, lv) => { FORMA.tower(g, "#d8d2c4", lv, 2); for (const x of [-0.7, 0, 0.7]) pezzo(g, geoCil, matTinta("#fff"), 0.15, 1.4, 0.15, x, 0.7, 1.15); },
  agenzia: (g, c, lv) => FORMA.basso(g, c, lv, "#3a7bd5"),
  legale: (g, c, lv) => { FORMA.tower(g, "#cfc6b4", Math.max(1, lv - 1), 2); },
  ristorante: (g, c, lv) => FORMA.basso(g, c, lv, "#c0392b"),
  boutique: (g, c, lv) => FORMA.basso(g, c, lv, "#111"),
  lavanderia: (g, c, lv) => FORMA.basso(g, c, lv, "#7fb3d5"),
  galleria: (g, c, lv) => { FORMA.basso(g, c, lv, "#fff"); pezzo(g, new THREE.SphereGeometry(0.6, 12, 8), matTinta("#e8e8e8"), 1, 1, 1, 0, 1.4 + lv * 0.3, 0); },
  magazzino: (g, c, lv) => { const l = 2.6, h = 1 + lv * 0.25; pezzo(g, geoBox, matTinta("#8e9aa6"), l, h, l * 0.8, 0, h / 2, 0); for (let i = 0; i < Math.min(5, lv + 1); i++) pezzo(g, geoBox, matTinta(["#d35400", "#2471a3", "#1e8449", "#b7950b", "#884ea0"][i]), 0.6, 0.5, 1.2, -1 + i * 0.5, h + 0.25, 0); },
  yachtclub: (g, c, lv) => { FORMA.basso(g, c, lv, "#fff"); pezzo(g, geoBox, matTinta("#fff"), 0.5, 0.35, 1.6, 1.4, 0.2, 0); pezzo(g, geoCil, matTinta("#ddd"), 0.04, 1.6, 0.04, 1.4, 1.1, 0); },
  discoteca: (g, c, lv) => { const h = 1.2 + lv * 0.35; pezzo(g, geoBox, matTinta("#1a1a2e"), 2.3, h, 2, 0, h / 2, 0); pezzo(g, geoBox, matTinta(c, { emissive: c, emissiveIntensity: 1.2 }), 2.35, 0.15, 2.05, 0, h * 0.7, 0); pezzo(g, geoBox, matTinta("#ff4fa3", { emissive: "#ff4fa3", emissiveIntensity: 1.4 }), 2.35, 0.15, 2.05, 0, h * 0.4, 0); },
  beachclub: (g, c, lv) => { FORMA.basso(g, c, Math.max(1, lv - 1), "#f39c12"); for (let i = 0; i < Math.min(4, lv); i++) { pezzo(g, geoCil, matTinta("#ddd"), 0.04, 0.9, 0.04, -1 + i * 0.7, 0.45, 1.5); pezzo(g, new THREE.ConeGeometry(0.4, 0.25, 8), matTinta(["#e74c3c", "#f1c40f", "#3498db", "#2ecc71"][i]), 1, 1, 1, -1 + i * 0.7, 0.95, 1.5); } },
  casino: (g, c, lv) => { const h = 1 + lv * 0.4; pezzo(g, geoBox, matEdificio("#7b1e3a", 3), 2.3, h, 2.3, 0, h / 2, 0).userData.finestre = true; pezzo(g, new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), matTinta("#f3c56b", { metalness: 0.7, roughness: 0.25 }), 1, 0.8, 1, 0, h, 0); },
});
function torre(colore, piani) {
  const g = new THREE.Group();
  const h = Math.min(40, 2 + piani * 0.9);
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.7, h, 8), matEdificio(colore, piani));
  corpo.position.y = h / 2; corpo.castShadow = true; corpo.userData.finestre = true; g.add(corpo);
  const cima = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.2, 8), new THREE.MeshStandardMaterial({ color: colore, metalness: 0.5, roughness: 0.3, emissive: colore, emissiveIntensity: 0.25 }));
  cima.position.y = h + 1.1; cima.castShadow = true; g.add(cima);
  accendiFinestre(g, notte);
  return g;
}
function pedina(colore) {
  const g = new THREE.Group();
  // colore pieno che si accende un po' da solo, cosi' la pedina si vede anche sopra gli edifici
  const mat = new THREE.MeshStandardMaterial({ color: colore, roughness: 0.35, metalness: 0.15, emissive: colore, emissiveIntensity: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1, 0.4, 24), mat); base.position.y = 0.2;
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 2, 24), mat); corpo.position.y = 1.3;
  const testa = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), mat); testa.position.y = 2.65;
  [base, corpo, testa].forEach((m) => { m.castShadow = true; g.add(m); });
  // anello bianco per terra: si vede sempre dove sta la pedina
  const anello = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.5, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  anello.rotation.x = -Math.PI / 2; anello.position.y = 0.06; g.add(anello);
  g.scale.setScalar(1.8);
  return g;
}
// libera la memoria della scheda video: geometrie, materiali e immagini dei pezzi tolti (prima i materiali restavano e il gioco diventava pesante)
function svuota(gr) { while (gr.children.length) { const c = gr.children.pop(); c.traverse((m) => { if (m.geometry && m.geometry !== geoBox && m.geometry !== geoCil) m.geometry.dispose(); const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []; for (const x of mats) { if (x.map) x.map.dispose(); x.dispose(); } }); } }

// Ridisegna edifici, torri e basi delle caselle a partire dalla situazione della partita.
// caselle: [{x,y,colore,proprietario,livello,cantiere,tipo}], torri: [{x,y,colore,piani}]
let firmaPrima = "";
export function aggiorna({ caselle, torri: tt, giocatori }) {
  if (!attivo) return;
  if (MONDO && !M && caselle.length) costruisciMondo(caselle);
  const firma = JSON.stringify([caselle, tt]);
  if (firma !== firmaPrima) {
    firmaPrima = firma;
    svuota(gruppoBasi); svuota(gruppoEdifici); svuota(gruppoTorri);
    if (MONDO) disegnaLotti(caselle);
    else for (const c of caselle) {
      const p = daMappa(c.x, c.y);
      const base = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: c.spento ? "#2a2f3a" : c.colore, roughness: 0.6, transparent: !!c.spento, opacity: c.spento ? 0.35 : 1 }));
      const grande = c.tipo === "angolo";
      base.scale.set(grande ? 3 : 2.2, 0.35, grande ? 3 : 2.2); base.position.set(p.x, 0.17, p.z); base.receiveShadow = true; base.castShadow = true;
      gruppoBasi.add(base);
      if (c.proprietario && (c.livello > 0 || c.cantiere) && !c.spento) {
        const e = edificio(c.proprietario, c.livello, c.cantiere);
        // l'edificio sta un po' dietro la casella, cosi' non copre il prezzo
        e.position.set(p.x, 0.35, p.z - 2.4); gruppoEdifici.add(e);
      }
    }
    const perIsola = {};
    for (const t of tt) {
      if (t.spento) continue;
      const m = torre(t.colore, t.piani);
      if (MONDO && M.centri[t.isola]) { const k = (perIsola[t.isola] = (perIsola[t.isola] || 0) + 1) - 1, c = M.centri[t.isola]; m.position.set(c.x + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 4.2, 0.9, c.z); }
      else { const p = daMappa(t.x, t.y); m.position.set(p.x, 0, p.z); }
      gruppoTorri.add(m);
    }
  }
  // pedine: create una volta, poi seguono la loro posizione
  for (const g of giocatori) {
    if (!pedine.has(g.id)) {
      const m = MONDO ? auto(g.colore) : pedina(g.colore); scena.add(m);
      const p = daMappa(g.x, g.y); m.position.copy(p);
      pedine.set(g.id, { mesh: m, target: p.clone(), salto: 0, cur: g.pos || 0, goal: g.pos || 0 });
    }
    const ped = pedine.get(g.id); ped.mesh.visible = !g.nascosta; ped.offset = g.offset || 0;
  }
}

// ---------------------------------------------------------------- il mondo modellato
const latoLotto = new Map(), cartelli = new THREE.Group();
function costruisciMondo(caselle) {
  const cs = [...caselle].sort((a, b) => a.idx - b.idx);
  M = M3.costruisci(cs.map((c) => { const p = daMappa(c.x, c.y); return { x: p.x, z: p.z, isola: c.isola || "Corona", ponte: c.tipo === "angolo" }; }));
  Q = M.quota; scena.add(M.mondo); scena.add(cartelli);
  // l'isolotto del Faro, con il faro vero
  const fp = daMappa(84, 81), isl = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.6, 1.2, 9), new THREE.MeshStandardMaterial({ color: "#6f6a62", roughness: 1, flatShading: true }));
  isl.position.set(fp.x, 0.3, fp.z); scena.add(isl);
  const torreF = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 9, 14), new THREE.MeshStandardMaterial({ color: "#f4f1ea" })); torreF.position.set(fp.x, 5.4, fp.z); torreF.castShadow = true; scena.add(torreF);
  for (const h of [3, 6]) { const fascia = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.12, 1, 14), new THREE.MeshStandardMaterial({ color: "#c0392b" })); fascia.position.set(fp.x, 1 + h, fp.z); scena.add(fascia); }
  const lanterna = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), new THREE.MeshStandardMaterial({ color: "#fff3b0", emissive: "#ffd34d", emissiveIntensity: 1.2 })); lanterna.position.set(fp.x, 10.5, fp.z); scena.add(lanterna);
  nCas = cs.length;
  pts = cs.map((c, i) => M.curva.getPoint(i / nCas));
  cs.forEach((c, i) => {
    const p = pts[i], prev = pts[(i - 1 + nCas) % nCas], next = pts[(i + 1) % nCas];
    const tg = next.clone().sub(prev).setY(0).normalize(), nrm = new THREE.Vector3(-tg.z, 0, tg.x);
    const cen = M.centri[c.isola];
    if (cen && nrm.dot(new THREE.Vector3(cen.x - p.x, 0, cen.z - p.z)) < 0) nrm.negate();
    // se dal lato dell'isola c'e' il mare (curva stretta), il lotto va dall'altra parte
    const prova = p.clone().add(nrm.clone().multiplyScalar(3.6));
    if (!M.suTerra(prova.x, prova.z) && M.suTerra(p.x - nrm.x * 3.6, p.z - nrm.z * 3.6)) nrm.negate();
    posCasella.set(c.id, p.clone());
    posLotto.set(c.id, p.clone().add(nrm.clone().multiplyScalar(c.terreno ? 3.6 : 3.2)).setY(Q));
    latoLotto.set(c.id, nrm);
  });
}
const geoCil = new THREE.CylinderGeometry(1, 1, 1, 20);
function etichettaTesto(testo, sotto, colore) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 160;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(10,16,26,.82)"; g.beginPath(); g.roundRect(6, 6, 500, 148, 30); g.fill();
  g.fillStyle = colore; g.fillRect(6, 6, 22, 148);
  g.fillStyle = "#fff"; g.font = "800 58px Manrope, sans-serif"; g.textBaseline = "middle"; g.fillText(testo, 48, sotto ? 58 : 80);
  if (sotto) { g.fillStyle = "#f3c56b"; g.font = "700 40px Manrope, sans-serif"; g.fillText(sotto, 48, 116); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true }));
  sp.scale.set(9, 2.8, 1); return sp;
}
function disegnaLotti(caselle) {
  svuota(cartelli);
  const serie = {};
  for (const c of caselle) {
    const p = posLotto.get(c.id), r = posCasella.get(c.id), nrm = latoLotto.get(c.id); if (!p) continue;
    const ang = Math.atan2(nrm.x, nrm.z);
    if (c.terreno) {
      // il lotto: piastra del colore del quartiere; se e' di qualcuno, bandiera del suo colore (e anello d'oro se e' tuo)
      const base = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: c.spento ? "#2a2f3a" : c.coloreSerie, roughness: 0.7, transparent: !!c.spento, opacity: c.spento ? 0.35 : 1 }));
      base.scale.set(3.6, 0.3, 3.6); base.position.set(p.x, Q + 0.15, p.z); base.rotation.y = ang; base.receiveShadow = true; base.userData.id = c.id;
      gruppoBasi.add(base);
      // il bordo della strada del colore del quartiere
      const bordo = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: c.coloreSerie, roughness: 0.5, emissive: c.coloreSerie, emissiveIntensity: 0.25 }));
      const b = r.clone().add(nrm.clone().multiplyScalar(1.85)); bordo.scale.set(3.2, 0.12, 0.3); bordo.position.set(b.x, Q + 0.08, b.z); bordo.rotation.y = ang; gruppoBasi.add(bordo);
      if (c.proprietario && !c.spento) {
        const asta = new THREE.Mesh(geoCil, new THREE.MeshStandardMaterial({ color: "#e8e8e8", metalness: 0.4 }));
        const ax = p.x + Math.cos(ang) * 1.5, az = p.z - Math.sin(ang) * 1.5;
        asta.scale.set(0.07, 3.4, 0.07); asta.position.set(ax, Q + 1.85, az); gruppoBasi.add(asta);
        const band = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: c.proprietario, emissive: c.proprietario, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
        band.scale.set(1.3, 0.8, 0.05); band.position.set(ax + 0.68, Q + 3.1, az); band.userData.id = c.id; gruppoBasi.add(band);
        // cornice del colore del padrone (si vede anche dall'alto); se e' tuo, in piu' una cornice d'oro
        const cor = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.55, 4, 1), new THREE.MeshBasicMaterial({ color: c.proprietario, side: THREE.DoubleSide })); cor.rotation.x = -Math.PI / 2; cor.rotation.z = ang + Math.PI / 4; cor.position.set(p.x, Q + 0.32, p.z); cor.userData.id = c.id; gruppoBasi.add(cor);
        if (c.mio) { const an = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.05, 4, 1), new THREE.MeshBasicMaterial({ color: "#f3c56b", side: THREE.DoubleSide })); an.rotation.x = -Math.PI / 2; an.rotation.z = ang + Math.PI / 4; an.position.set(p.x, Q + 0.33, p.z); gruppoBasi.add(an); }
        if (c.livello > 0 || c.cantiere) { const e = edificio(c.proprietario, c.livello, c.cantiere, c.attivita); e.position.set(p.x, Q + 0.3, p.z); e.rotation.y = ang; e.traverse((m) => { m.userData.id = c.id; }); gruppoEdifici.add(e); }
      } else if (!c.proprietario && !c.spento) {
        // terreno libero: un cartello "in vendita"
        const cart = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#fff4d6" })); cart.scale.set(1.2, 0.7, 0.08); cart.position.set(p.x, Q + 1.2, p.z); cart.rotation.y = ang; cart.userData.id = c.id; gruppoBasi.add(cart);
        const pal = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#7a5a3a" })); pal.scale.set(0.1, 0.9, 0.1); pal.position.set(p.x, Q + 0.6, p.z); gruppoBasi.add(pal);
      }
      if (c.serie && c.serie !== "Moli") { const k = serie[c.serie] = serie[c.serie] || { n: 0, mie: 0, x: 0, z: 0, col: c.coloreSerie, nome: c.serie }; k.n++; if (c.mio) k.mie++; k.x += p.x; k.z += p.z; }
    } else {
      // posto speciale: piazzetta tonda con un obelisco (gli angoli sono piazze grandi sulla strada)
      const grande = c.tipo === "angolo", q = grande ? r : p, qo = grande ? r.clone().add(nrm.clone().multiplyScalar(4)) : p;
      const pz = new THREE.Mesh(geoCil, new THREE.MeshStandardMaterial({ color: grande ? "#e9d6a8" : "#2a3446", roughness: 0.6 }));
      pz.scale.set(grande ? 3.4 : 1.9, 0.3, grande ? 3.4 : 1.9); pz.position.set(q.x, Q + 0.12, q.z); pz.userData.id = c.id; gruppoBasi.add(pz);
      const ob = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, grande ? 4.5 : 3, 6), new THREE.MeshStandardMaterial({ color: "#f3c56b", metalness: 0.5, roughness: 0.3, emissive: "#f3c56b", emissiveIntensity: 0.2 }));
      ob.position.set(qo.x, Q + (grande ? 2.4 : 1.7), qo.z); ob.userData.id = c.id; gruppoBasi.add(ob);
    }
  }
  for (const k of Object.values(serie)) {
    const sp = etichettaTesto(k.nome, k.mie ? "tue " + k.mie + " vie su " + k.n : k.n + " vie", k.col);
    sp.position.set(k.x / k.n, Q + 7.5, k.z / k.n); sp.userData.cartello = true; cartelli.add(sp);
  }
}
function auto(colore) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colore, roughness: 0.3, metalness: 0.35, emissive: colore, emissiveIntensity: 0.25 });
  const scocca = new THREE.Mesh(geoBox, mat); scocca.scale.set(1.5, 0.55, 2.9); scocca.position.y = 0.55;
  const cab = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#1b2330", roughness: 0.15, metalness: 0.6 })); cab.scale.set(1.3, 0.5, 1.4); cab.position.set(0, 1.05, -0.15);
  const ruote = new THREE.MeshStandardMaterial({ color: "#111" });
  for (const [x, z] of [[-0.75, 0.9], [0.75, 0.9], [-0.75, -0.9], [0.75, -0.9]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12), ruote); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); g.add(w); }
  const fari = new THREE.Mesh(geoBox, new THREE.MeshBasicMaterial({ color: "#fff6c8" })); fari.scale.set(1.2, 0.15, 0.05); fari.position.set(0, 0.62, 1.46); g.add(fari);
  [scocca, cab].forEach((m) => { m.castShadow = true; g.add(m); });
  const anello = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.0, 32), new THREE.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  anello.rotation.x = -Math.PI / 2; anello.position.y = 0.05; g.add(anello);
  g.scale.setScalar(1.15);
  return g;
}
// i tocchi sul mondo: un tocco (senza trascinare) su un lotto apre la sua scheda
function collegaTocchi(dom) {
  let giu = null;
  dom.addEventListener("pointerdown", (e) => { giu = { x: e.clientX, y: e.clientY }; });
  dom.addEventListener("pointerup", (e) => {
    if (!giu || Math.hypot(e.clientX - giu.x, e.clientY - giu.y) > 6) return; giu = null;
    const r = new THREE.Raycaster(); r.setFromCamera({ x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 }, camera);
    const hit = r.intersectObjects([gruppoBasi, gruppoEdifici], true).find((h) => h.object.userData.id);
    if (hit && suCasellaCb) suCasellaCb(hit.object.userData.id, e.clientX, e.clientY);
  });
}
// le visuali: segui la pedina (terza persona), libera, dall'alto
export function impostaModo(m, id) {
  modo = m;
  if (m === "alto") {
    seguiFino = 0;
    // tutta la Laguna nello schermo: se lo schermo e' stretto (telefono) la mappa si gira in verticale
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), th = tv * camera.aspect;
    const hA = Math.max((W / 2 + 12) / th, (H / 2 + 12) / tv), hB = Math.max((H / 2 + 12) / th, (W / 2 + 12) / tv), h = Math.min(hA, hB);
    controlli.maxDistance = Math.max(230, h * 1.15);
    vola(hA <= hB ? new THREE.Vector3(0, h, h * 0.12) : new THREE.Vector3(h * 0.12, h, 0), new THREE.Vector3(0, 0, 0), 800);
  }
  if (m === "segui") seguiPedina(id || mioIdTre);
}
function dietroA(ped) {
  const t = ped.mesh.position.clone(), dir = new THREE.Vector3(Math.sin(ped.mesh.rotation.y), 0, Math.cos(ped.mesh.rotation.y));
  return { target: t.clone().add(dir.clone().multiplyScalar(5)).setY(Q + 1), pos: t.clone().sub(dir.multiplyScalar(18)).setY(Q + 11) };
}
export function seguiPedina(id) {
  const ped = pedine.get(id || mioIdTre); if (!ped) return false;
  const d = dietroA(ped); vola(d.pos, d.target, 700); return true;
}
// ---------------------------------------------------------------- ogni frame
const v = new THREE.Vector3();
// Il tabellone deve riempire sempre tutto lo schermo: i 4 angoli dello schermo devono cadere sulla foto.
// Se escono, la vista si sposta; se lo schermo vede piu' della foto, la camera si avvicina.
const raggio = new THREE.Raycaster(), suolo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ANGOLI = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
function angoliSulPiano() {
  camera.updateMatrixWorld();
  const pts = [];
  for (const [x, y] of ANGOLI) { raggio.setFromCamera({ x, y }, camera); const p = new THREE.Vector3(); if (!raggio.ray.intersectPlane(suolo, p)) return null; pts.push(p); }
  return pts;
}
function avvicinaDi(f) { const dir = camera.position.clone().sub(controlli.target).multiplyScalar(f); camera.position.copy(controlli.target).add(dir); }
function adattaVista() {
  for (let k = 0; k < 60; k++) {
    const pts = angoliSulPiano();
    if (!pts) { avvicinaDi(0.96); continue; }
    const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
    const minx = Math.min(...xs), maxx = Math.max(...xs), minz = Math.min(...zs), maxz = Math.max(...zs);
    if (maxx - minx > W * 0.995 || maxz - minz > H * 0.995) { avvicinaDi(0.97); continue; }
    let dx = 0, dz = 0;
    if (minx < -W / 2) dx = -W / 2 - minx; else if (maxx > W / 2) dx = W / 2 - maxx;
    if (minz < -H / 2) dz = -H / 2 - minz; else if (maxz > H / 2) dz = H / 2 - maxz;
    if (!dx && !dz) return;
    camera.position.x += dx; camera.position.z += dz; controlli.target.x += dx; controlli.target.z += dz;
  }
}
let tPrima = performance.now();
function frame() {
  controlli.update();
  if (MONDO) return frameMondo();
  adattaVista();
  // le pedine seguono la pedina HTML (che il gioco sposta casella per casella) e saltano a ogni passo
  for (const [id, ped] of pedine) {
    const el = strato.querySelector(`.ped[data-id="${id}"]`);
    if (el) {
      const t = daMappa(parseFloat(el.style.left), parseFloat(el.style.top)); t.x += (ped.offset || 0) * 2.4;
      if (t.distanceTo(ped.target) > 0.05) { ped.target.copy(t); ped.salto = 1; }
    }
    ped.mesh.position.x += (ped.target.x - ped.mesh.position.x) * 0.25;
    ped.mesh.position.z += (ped.target.z - ped.mesh.position.z) * 0.25;
    ped.salto = Math.max(0, ped.salto - 0.07);
    ped.mesh.position.y = Math.sin(ped.salto * Math.PI) * 1.4;
  }
  renderer.render(scena, camera);
  proiettaHtml();
}

function frameMondo() {
  const ora = performance.now(), dt = Math.min(0.05, (ora - tPrima) / 1000); tPrima = ora;
  if (mare3) mare3.userData.onda(ora / 1000);
  // la visuale non scappa dal mondo e non va sott'acqua
  const t = controlli.target, lim = (v, a) => Math.max(-a, Math.min(a, v));
  const nx = lim(t.x, W / 2 + 15), nz = lim(t.z, H / 2 + 15);
  if (nx !== t.x || nz !== t.z) { camera.position.x += nx - t.x; camera.position.z += nz - t.z; t.x = nx; t.z = nz; }
  if (camera.position.y < Q + 1.2) camera.position.y = Q + 1.2;
  // le auto: avanzano casella per casella lungo la strada
  for (const [id, ped] of pedine) {
    const el = strato.querySelector(`.ped[data-id="${id}"]`);
    if (el && el.dataset.pos != null) ped.goal = +el.dataset.pos;
    if (!nCas) continue;
    let d = ((ped.goal - ped.cur) % nCas + nCas) % nCas;
    if (d > 14) { ped.cur = ped.goal; d = 0; } // salto lungo (Faro, viaggio rapido): ci si teletrasporta
    const muove = d > 0.01;
    if (muove) ped.cur = (ped.cur + Math.min(d, Math.max(dt * 6, d * 0.12))) % nCas;
    const u = ped.cur / nCas, p = M.curva.getPoint(u), tg = M.curva.getTangent(u);
    const lato = new THREE.Vector3(-tg.z, 0, tg.x).normalize().multiplyScalar(((ped.offset || 0) % 2 ? 1 : -1) * Math.ceil((ped.offset || 0) / 2) * 2.1);
    ped.mesh.position.set(p.x + lato.x, (M.suTerra(p.x, p.z) ? Q : Q + 0.5) + (muove ? Math.abs(Math.sin(ora / 90)) * 0.15 : 0), p.z + lato.z);
    ped.mesh.rotation.y = Math.atan2(tg.x, tg.z);
    if (muove && id === mioIdTre && modo === "segui") { seguiId = id; seguiFino = ora + 1200; }
  }
  // terza persona: la camera sta dietro e sopra la tua auto mentre si muove
  if (seguiId && ora < seguiFino) {
    const d = dietroA(pedine.get(seguiId));
    camera.position.lerp(d.pos, 0.08); controlli.target.lerp(d.target, 0.14);
  }
  const dist = camera.position.distanceTo(controlli.target);
  scena.fog.far = Math.max(360, dist * 1.7 + 80); scena.fog.near = scena.fog.far * 0.45;
  for (const c of cartelli.children) { const dc = camera.position.distanceTo(c.position); c.visible = dist < 120 && dc > 22 && dc < 110; }
  renderer.render(scena, camera);
  proiettaHtml();
}

// Le etichette e i pulsanti HTML (caselle, luoghi della notte, nomi delle isole) seguono il piano 3D.
function proiettaHtml() {
  const larg = innerWidth, alt = innerHeight;
  const dist = camera.position.distanceTo(controlli.target);
  for (const el of strato.children) {
    if (el.tagName === "svg") continue;
    const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
    if (isNaN(x) || isNaN(y)) continue;
    const alto = el.classList.contains("cas") ? 0.6 : el.classList.contains("isola-nome") ? 3 : 1.2;
    let lontano = false, punto = null;
    if (MONDO) {
      const cas = el.dataset.cas, ped = el.classList.contains("ped") ? pedine.get(el.dataset.id) : null;
      if (cas && posLotto.has(cas)) { punto = posLotto.get(cas).clone(); punto.y = Q + (el.classList.contains("terreno") ? 2.2 : 4.6); const dd = camera.position.distanceTo(punto); lontano = el.classList.contains("terreno") ? dd > 46 : dd > 150; }
      else if (ped) { punto = ped.mesh.position.clone(); punto.y += 3.2; }
      else { punto = daMappa(x, y); punto.y = alto + Q + (el.classList.contains("isola-nome") ? 8 : 0); }
      v.copy(punto);
    } else v.copy(daMappa(x, y));
    if (!MONDO) v.y = alto;
    v.project(camera);
    const dietro = lontano || v.z > 1 || v.x < -1.3 || v.x > 1.3 || v.y < -1.3 || v.y > 1.3;
    el.style.visibility = dietro ? "hidden" : "";
    if (dietro) continue;
    const sx = (v.x + 1) / 2 * larg, sy = (1 - v.y) / 2 * alt;
    // la pedina HTML resta invisibile: in 3D si vede la pedina vera
    el.style.translate = `${sx - x / 100 * larg}px ${sy - y / 100 * alt}px`;
    const d = camera.position.distanceTo(punto || daMappa(x, y));
    el.style.scale = String(MONDO ? THREE.MathUtils.clamp(60 / d, 0.55, 1.25) : THREE.MathUtils.clamp(140 / d, 0.95, 1.6));
    el.style.zIndex = String(1000 - Math.round(d));
  }
  contenitore.style.setProperty("--dist", dist.toFixed(1));
  contenitore.classList.toggle("vicino", dist < 55);
}
