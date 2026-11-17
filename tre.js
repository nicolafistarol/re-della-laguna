// =====================================================================
// RE DELLA LAGUNA — il tabellone in 3D
// La foto della laguna diventa un piano inclinato che si può ruotare e avvicinare.
// Sopra: basi delle caselle in rilievo, edifici che crescono, torri dei Palazzi
// e pedine in piedi. Le etichette e i pulsanti restano quelli di sempre (HTML),
// ma seguono la prospettiva: ogni frame vengono proiettati sul piano.
// =====================================================================
import * as THREE from "three";
import { MapControls } from "three/addons/controls/MapControls.js";

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

  // il piano con la foto, piu' un mare largo intorno cosi' non si vede mai il vuoto
  const tex = new THREE.TextureLoader().load(urlMappa);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  piano = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 }));
  piano.rotation.x = -Math.PI / 2; piano.receiveShadow = true;
  scena.add(piano);
  const mare = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: "#1d6f86", roughness: 0.6 }));
  mare.rotation.x = -Math.PI / 2; mare.position.y = -0.05; scena.add(mare);

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
  controlli.minPolarAngle = 0.15; controlli.maxPolarAngle = 0.9;
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
  const t = daMappa(x, y), dir = camera.position.clone().sub(controlli.target).multiplyScalar(0.62);
  camera.position.copy(t).add(dir); controlli.target.copy(t); controlli.update();
}
export function centraSu(x, y) {
  const t = daMappa(x, y), dir = camera.position.clone().sub(controlli.target);
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
  scena.background.set(n ? "#050816" : "#0b2a3a"); scena.fog.color.set(n ? "#050816" : "#0b2a3a");
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
function edificio(colore, livello, cantiere) {
  const g = new THREE.Group();
  if (cantiere) {
    const base = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#f3c56b", roughness: 0.8 }));
    base.scale.set(2.2, 0.6, 2.2); base.position.y = 0.3; base.castShadow = true; g.add(base);
    const gru = new THREE.Mesh(geoBox, new THREE.MeshStandardMaterial({ color: "#e2a400" }));
    gru.scale.set(0.18, 4, 0.18); gru.position.set(0.8, 2.2, 0.8); gru.castShadow = true; g.add(gru);
    const braccio = new THREE.Mesh(geoBox, gru.material); braccio.scale.set(2.6, 0.15, 0.15); braccio.position.set(0, 4.1, 0.8); g.add(braccio);
    return g;
  }
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
function svuota(gr) { while (gr.children.length) { const c = gr.children.pop(); c.traverse((m) => { if (m.geometry && m.geometry !== geoBox) m.geometry.dispose(); const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []; for (const x of mats) { if (x.map) x.map.dispose(); x.dispose(); } }); } }

// Ridisegna edifici, torri e basi delle caselle a partire dalla situazione della partita.
// caselle: [{x,y,colore,proprietario,livello,cantiere,tipo}], torri: [{x,y,colore,piani}]
let firmaPrima = "";
export function aggiorna({ caselle, torri: tt, giocatori }) {
  if (!attivo) return;
  const firma = JSON.stringify([caselle, tt]);
  if (firma !== firmaPrima) {
    firmaPrima = firma;
    svuota(gruppoBasi); svuota(gruppoEdifici); svuota(gruppoTorri);
    for (const c of caselle) {
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
    for (const t of tt) { if (t.spento) continue; const p = daMappa(t.x, t.y); const m = torre(t.colore, t.piani); m.position.set(p.x, 0, p.z); gruppoTorri.add(m); }
  }
  // pedine: create una volta, poi seguono la loro posizione
  for (const g of giocatori) {
    if (!pedine.has(g.id)) { const m = pedina(g.colore); scena.add(m); const p = daMappa(g.x, g.y); m.position.copy(p); pedine.set(g.id, { mesh: m, target: p.clone(), salto: 0 }); }
    const ped = pedine.get(g.id); ped.mesh.visible = !g.nascosta; ped.offset = g.offset || 0;
  }
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
function frame() {
  controlli.update();
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

// Le etichette e i pulsanti HTML (caselle, luoghi della notte, nomi delle isole) seguono il piano 3D.
function proiettaHtml() {
  const larg = innerWidth, alt = innerHeight;
  const dist = camera.position.distanceTo(controlli.target);
  for (const el of strato.children) {
    if (el.tagName === "svg") continue;
    const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
    if (isNaN(x) || isNaN(y)) continue;
    const alto = el.classList.contains("cas") ? 0.6 : el.classList.contains("isola-nome") ? 3 : 1.2;
    v.copy(daMappa(x, y)); v.y = alto; v.project(camera);
    const dietro = v.z > 1 || v.x < -1.3 || v.x > 1.3 || v.y < -1.3 || v.y > 1.3;
    el.style.visibility = dietro ? "hidden" : "";
    if (dietro) continue;
    const sx = (v.x + 1) / 2 * larg, sy = (1 - v.y) / 2 * alt;
    // la pedina HTML resta invisibile: in 3D si vede la pedina vera
    el.style.translate = `${sx - x / 100 * larg}px ${sy - y / 100 * alt}px`;
    const d = camera.position.distanceTo(daMappa(x, y));
    el.style.scale = String(THREE.MathUtils.clamp(140 / d, 0.95, 1.6));
    el.style.zIndex = String(1000 - Math.round(d));
  }
  contenitore.style.setProperty("--dist", dist.toFixed(1));
  contenitore.classList.toggle("vicino", dist < 55);
}
