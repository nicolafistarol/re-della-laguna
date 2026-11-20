// =====================================================================
// RE DELLA LAGUNA — panorami a 360° per i luoghi della notte
// Le foto larghe (2:1) vengono incollate dentro un muro curvo di ARCO gradi:
// ci si gira a destra e a sinistra fino ai bordi, si toccano i punti luminosi.
// (Le foto generate non sono 360° veri: un muro curvo evita la cucitura dietro le spalle.)
// =====================================================================
import * as THREE from "three";

let verso = 1;
let box = null, renderer = null, scena = null, camera = null, sfera = null, url = null;
const ARCO = 200, RAGGIO = 50, ALTEZZA = RAGGIO * THREE.MathUtils.degToRad(ARCO) / 2;
let yaw = 0, pitch = 0, fov = 70, trascina = null, ultimoTocco = 0, punti = [], suPunto = null, attivo = false;
// v111: si disegna solo quando cambia qualcosa; su computer senza scheda grafica (o lenti) niente rotazione automatica
let sporco = true, lento = false, tempi = [], tPrima = 0;
const caricatore = new THREE.TextureLoader();
const cache = new Map();

function crea() {
  box = document.createElement("div");
  box.id = "panorama";
  box.innerHTML = `<canvas></canvas><div class="pano-punti"></div><div class="pano-aiuto">Trascina per guardarti intorno</div>`;
  document.body.appendChild(box);
  const canvas = box.querySelector("canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  try { const gl = renderer.getContext(), ext = gl.getExtension("WEBGL_debug_renderer_info"), r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ""; if (/swiftshader|llvmpipe|software|basic render|mesa offscreen/i.test(r)) lento = true; } catch (e) { }
  renderer.setPixelRatio(lento ? 1 : Math.min(window.devicePixelRatio, 1.5));
  scena = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const th = THREE.MathUtils.degToRad(ARCO);
  const geo = new THREE.CylinderGeometry(RAGGIO, RAGGIO, ALTEZZA, 96, 1, true, Math.PI - th / 2, th);
  geo.scale(-1, 1, 1); // la foto si guarda da dentro
  sfera = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
  scena.add(sfera);
  const giu = (x, y) => { trascina = { x, y, yaw, pitch }; ultimoTocco = Date.now(); box.querySelector(".pano-aiuto").classList.add("via"); };
  const muovi = (x, y) => {
    if (!trascina) return;
    const k = fov / box.clientHeight;
    yaw = trascina.yaw - (x - trascina.x) * k;
    pitch = trascina.pitch + (y - trascina.y) * k;
    limita(); sporco = true;
  };
  canvas.addEventListener("pointerdown", (e) => { canvas.setPointerCapture(e.pointerId); giu(e.clientX, e.clientY); });
  canvas.addEventListener("pointermove", (e) => muovi(e.clientX, e.clientY));
  canvas.addEventListener("pointerup", () => { trascina = null; ultimoTocco = Date.now(); });
  canvas.addEventListener("wheel", (e) => { fov = Math.max(45, Math.min(80, fov + e.deltaY * 0.03)); limita(); sporco = true; e.preventDefault(); }, { passive: false });
  window.addEventListener("resize", misura);
  misura();
  requestAnimationFrame(gira);
}
// non si guarda oltre i bordi della foto
function limita() {
  const aspetto = box ? box.clientWidth / Math.max(1, box.clientHeight) : 1.6;
  const mezzoOriz = THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspetto));
  const maxYaw = Math.max(0, ARCO / 2 - mezzoOriz);
  yaw = Math.max(-maxYaw, Math.min(maxYaw, yaw));
  const mezzoVert = THREE.MathUtils.radToDeg(Math.atan((ALTEZZA / 2) / RAGGIO));
  const maxPitch = Math.max(0, mezzoVert - fov / 2);
  pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
}
function misura() {
  if (!renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); sporco = true;
}
function direzione(y, p) {
  const ry = THREE.MathUtils.degToRad(y), rp = THREE.MathUtils.degToRad(p);
  return new THREE.Vector3(Math.sin(ry) * Math.cos(rp), Math.sin(rp), -Math.cos(ry) * Math.cos(rp));
}
function gira() {
  requestAnimationFrame(gira);
  if (!attivo) return;
  // se nessuno tocca, la vista gira pianissimo da sola
  const ora = performance.now();
  if (!trascina && !lento && Date.now() - ultimoTocco > 6000 && !suPunto && !document.hidden) {
    yaw += verso * 0.03; const y0 = yaw; limita(); if (yaw !== y0) verso = -verso; sporco = true;
    // se i fotogrammi arrivano lenti (computer senza scheda grafica) la rotazione si ferma per sempre
    if (tPrima) { tempi.push(ora - tPrima); if (tempi.length > 40) tempi.shift(); if (tempi.length >= 20 && tempi.reduce((a, b) => a + b, 0) / tempi.length > 34) lento = true; }
  }
  tPrima = ora;
  if (!sporco) return;
  sporco = false;
  camera.fov = fov; camera.updateProjectionMatrix();
  camera.lookAt(direzione(yaw, pitch));
  renderer.render(scena, camera);
  // i punti da toccare seguono la foto
  const w = box.clientWidth, h = box.clientHeight;
  for (const pt of punti) {
    const ry = THREE.MathUtils.degToRad(pt.yaw);
    const v = new THREE.Vector3(Math.sin(ry) * RAGGIO * 0.98, Math.tan(THREE.MathUtils.degToRad(pt.pitch)) * RAGGIO * 0.98, -Math.cos(ry) * RAGGIO * 0.98).project(camera);
    const davanti = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
    pt.el.style.display = davanti ? "flex" : "none";
    if (davanti) pt.el.style.transform = `translate(${(v.x + 1) / 2 * w}px, ${(1 - v.y) / 2 * h}px) translate(-50%, -50%)`;
  }
}

// mostra un panorama; i punti sono [{ yaw, pitch, testo, icona, classe, azione }]
export function mostra(nuovoUrl, nuoviPunti, opz = {}) {
  if (!box) crea();
  attivo = true; box.style.display = "block"; sporco = true; tPrima = 0;
  if (nuovoUrl !== url) {
    url = nuovoUrl;
    if (opz.yaw !== undefined) yaw = opz.yaw;
    pitch = 0; fov = 70; limita();
    const t = cache.get(url);
    const usa = (tex) => { if (url !== nuovoUrl) return; tex.colorSpace = THREE.SRGBColorSpace; sfera.material.dispose(); sfera.material = new THREE.MeshBasicMaterial({ map: tex }); box.classList.add("pronto"); sporco = true; };
    box.classList.remove("pronto");
    if (t) usa(t); else caricatore.load(url, (tex) => { cache.set(nuovoUrl, tex); usa(tex); });
  }
  const strato = box.querySelector(".pano-punti");
  strato.innerHTML = "";
  punti = (nuoviPunti || []).map((p) => {
    const el = document.createElement("button");
    el.className = "pano-punto " + (p.classe || "");
    el.innerHTML = `<span class="anello">${p.icona || ""}</span><span class="etich">${p.testo}</span>`;
    el.onclick = (e) => { e.stopPropagation(); p.azione && p.azione(); };
    el.onmouseenter = () => (suPunto = p); el.onmouseleave = () => { suPunto = null; };
    strato.appendChild(el);
    return { ...p, el };
  });
}
export function nascondi() { attivo = false; url = null; punti = []; if (box) { box.style.display = "none"; box.querySelector(".pano-punti").innerHTML = ""; } }
export function guarda(y) { yaw = y; limita(); ultimoTocco = Date.now(); sporco = true; }
// da una posizione sulla foto (0..1 in orizzontale e verticale) ai gradi del punto
export function daFoto(x, y) { return { yaw: (x - 0.5) * ARCO, pitch: THREE.MathUtils.radToDeg(Math.atan((0.5 - y) * ALTEZZA / RAGGIO)) }; }
