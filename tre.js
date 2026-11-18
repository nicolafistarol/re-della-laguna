// =====================================================================
// RE DELLA LAGUNA — il tabellone: il DIORAMA
// Il tabellone E' la foto (img/mappa-hd.jpg), messa in rilievo da mondo3d.js.
// La camera sta nel punto dello scatto: guardarsi intorno e avvicinarsi non
// deformano mai. Sopra la foto ci sono solo i pezzi di gioco:
//   - piazzole, ombre e aloni dei giocatori DIPINTI sulla foto (stesse coordinate);
//   - edifici che crescono coi livelli, nello stile e coi colori dell'isola;
//   - bandiere del colore del proprietario, auto sportive come pedine.
// Le etichette sono quelle di gioco.js (HTML): qui si decide quali mostrare
// (poche, mai una sopra l'altra) e dove.
// Stessa interfaccia del vecchio mondo a cubetti (ora cubetti.js, solo con ?cubetti).
// =====================================================================
import * as THREE from "three";
import { creaRilievo, creaVeduta, GEO, RUMORE } from "./mondo3d.js?v=83";

export const DIORAMA = true;
export function mondoNuovo() { return false; }          // il mondo modellato a cubetti non c'entra piu'
const FW = 2048, FH = 1152;                              // la foto, in pixel
const TY = Math.tan(THREE.MathUtils.degToRad(GEO.fov / 2)), TH = GEO.theta, F_PX = FH / 2 / TY;   // focale della foto in pixel della foto
const ASSE_Y = new THREE.Vector3(0, 1, 0);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const leggi = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };

let renderer = null, scena = null, camera = null, R = null, contenitore = null, strato = null, tela = null, box = null;
let attivo = false, pronto = false, raf = 0, sporco = true, inAttesa = null, primoFrame = false;
let suCasellaCb = null, suErroreCb = null, mioId = null;
let W = 1, H = 1, aspetto = 1, telefono = false, rapporto = 1;
const calmo = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
let modo = leggi("laguna_visuale") === "arcipelago" ? "arcipelago" : "segui";   // "arcipelago" | "segui" | "isola"
export function suCasella(f) { suCasellaCb = f; }
export function suErrore(f) { suErroreCb = f; }
export function sonoIo(id) { mioId = id; }
export function modoVista() { return modo; }
export function attivoOra() { return attivo; }

export function supportato() {
  try { const c = document.createElement("canvas"); const gl = c.getContext("webgl2") || c.getContext("webgl"); if (!gl) return false; const p = gl.getExtension("WEBGL_lose_context"); if (p) p.loseContext(); return true; } catch (e) { return false; }
}

export function avvia(mondo, mappaDom, urlMappa) {
  if (attivo) return true;
  if (!supportato()) return false;
  contenitore = mondo; strato = mappaDom;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  telefono = Math.min(innerWidth, innerHeight) < 560;
  rapporto = Math.min(devicePixelRatio || 1, telefono ? 2 : 1.5);
  renderer.setPixelRatio(rapporto); renderer.info.autoReset = false;
  renderer.debug.onShaderError = (gl, prog, vs, fs) => { console.warn("Diorama: uno shader non parte.", gl.getProgramInfoLog(prog), gl.getShaderInfoLog(fs), gl.getShaderInfoLog(vs)); fallisci("shader"); };
  tela = renderer.domElement; tela.className = "tre-canvas";
  tela.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fallisci("contesto"); });
  mondo.prepend(tela); mondo.classList.add("dio");
  scena = new THREE.Scene(); camera = new THREE.PerspectiveCamera(GEO.fov, 1, 1, 7000);
  creaStratoHtml(); collegaGesti(); osserva(); misura(); addEventListener("resize", misura);
  attivo = true;
  creaRilievo({ urlFoto: urlMappa, urlGeo: "img/rilievo.webp", urlMare: "img/mare-base.webp", renderer, qualita: telefono ? 0.7 : 1, strato: telefono ? 1024 : 2048 }).then((r) => {
    if (!attivo) { r.libera(); return; }
    R = r; scena.add(R.gruppo); creaPezzi(); pronto = true; misura();
    if (inAttesa) { const a = inAttesa; inAttesa = null; aggiorna(a); }
    Object.assign(V, inquadraTutto()); V.xT = V.x; V.yT = V.y; V.ZT = V.Z;
    R.notte(notte); sporco = true; raf = requestAnimationFrame(ciclo);
  }).catch((e) => { console.warn("Diorama: non riesco a caricare le immagini.", e); fallisci("immagini"); });
  return true;
}
// Se qualcosa si rompe (immagini, scheda video) si torna alla foto piatta e gioco.js lo dice al giocatore.
function fallisci(motivo) {
  if (!attivo) return; attivo = false; pronto = false; cancelAnimationFrame(raf);
  try { removeEventListener("resize", misura); if (oss) oss.disconnect(); tela.remove(); if (box) box.remove(); contenitore.classList.remove("dio", "dio-pronto", "dio-isola", "dio-veduta"); if (R) R.libera(); renderer.dispose(); } catch (e) { }
  for (const el of strato.children) { el.style.translate = ""; el.style.scale = ""; el.style.visibility = ""; }
  if (suErroreCb) suErroreCb(motivo);
}

// ---------------------------------------------------------------- la camera
// La visuale e' un punto della foto (x, y in %) messo al centro dello schermo, piu' uno zoom (Z = 1: la foto e' alta come lo schermo).
const V = { x: 50, y: 50, Z: 1, xT: 50, yT: 50, ZT: 1, vel: 6 };
const par = { x: 0, y: 0, xT: 0, yT: 0 };                     // parallasse: il mouse sposta appena la camera, cosi' si sente il volume
let Zmin = 0.5, Zmax = 3.4, ARC = { x: 50, y: 50, Z: 1 }, manuale = false, seguito = null;
const LIM = { sx: 5, su: 4, giu: 7 };                         // quanto si puo' uscire dai bordi della foto (%): fuori continuano mare e cielo
const d3 = new THREE.Vector3(), e3 = new THREE.Vector3(), p2 = new THREE.Vector2();

function angoli(x, y) { R.direzione(x, y, d3); return { yaw: Math.atan2(-d3.x, -d3.z), pitch: Math.asin(d3.y) + TH }; }
// che punto della foto c'e' sotto un punto dello schermo, per una certa visuale
function fotoSotto(sx, sy, v = V, out = new THREE.Vector2()) {
  const a = angoli(v.x, v.y), tv = TY / v.Z, x = (sx / W * 2 - 1) * tv * aspetto, y = (1 - sy / H * 2) * tv;
  const pa = a.pitch - TH, cp = Math.cos(pa), sp = Math.sin(pa), cy = Math.cos(a.yaw), sn = Math.sin(a.yaw);
  const y1 = y * cp + sp, z1 = y * sp - cp;
  return R.fotoDiDirezione(d3.set(x * cy + z1 * sn, y1, -x * sn + z1 * cy), out);
}
// la visuale che mette il punto della foto (px, py) sotto il punto dello schermo (sx, sy)
function centroPer(px, py, sx, sy, Z) {
  const v = { x: px, y: py, Z };
  for (let k = 0; k < 4; k++) { fotoSotto(sx, sy, v, p2); v.x += px - p2.x; v.y += py - p2.y; }
  return v;
}
// lo spazio libero dello schermo: sotto la barra in alto, sopra la carta in basso, a sinistra dei comandi
function rettangoloLibero() {
  let alto = 0, basso = 0, dx = 0; const stretto = W < 700, q = (s) => document.querySelector(s);
  const su = q(stretto ? ".hud-alto" : ".hud-alto .fase"), carta = q(".carta"), cv = q(".comandi-vista");
  if (su) { const r = su.getBoundingClientRect(); if (r.height) alto = r.bottom; }
  if (carta) { const r = carta.getBoundingClientRect(); if (r.height && r.top > H * 0.4) basso = H - r.top; }
  if (cv && !stretto) { const r = cv.getBoundingClientRect(); if (r.width) dx = W - r.left; }
  alto = Math.min(alto, H * 0.42); basso = Math.min(basso, H * 0.5);
  return { x0: 6, y0: alto + 6, x1: W - dx - 6, y1: H - basso - 6 };
}
// la visuale che fa stare un rettangolo della foto (in %) dentro lo spazio libero
function inquadra(x0, y0, x1, y1, zMax = 9) {
  const L = rettangoloLibero(), lw = Math.max(80, L.x1 - L.x0), lh = Math.max(80, L.y1 - L.y0);
  const Z = Math.min(zMax, lw / ((x1 - x0) / 100 * H * 16 / 9), lh / ((y1 - y0) / 100 * H));
  return centroPer((x0 + x1) / 2, (y0 + y1) / 2, (L.x0 + L.x1) / 2, (L.y0 + L.y1) / 2, Z);
}
let riquadro = { x0: 8, y0: 12, x1: 95.5, y1: 80 };            // dove sta il gioco nella foto (si ricalcola dalle caselle)
function inquadraTutto() { return inquadra(riquadro.x0, riquadro.y0, riquadro.x1, riquadro.y1, 1.6); }
function stringi() {
  V.ZT = clamp(V.ZT, Zmin, Zmax);
  const hy = 50 / V.ZT, hx = hy * aspetto / (16 / 9);
  const ax = hx - LIM.sx, bx = 100 - hx + LIM.sx, ay = hy - LIM.su, by = 100 - hy + LIM.giu;
  V.xT = clamp(V.xT, Math.min(ax, bx, ARC.x), Math.max(ax, bx, ARC.x)); if (ax > bx) V.xT = lerp(V.xT, ARC.x, 0.85);
  V.yT = clamp(V.yT, Math.min(ay, by, ARC.y), Math.max(ay, by, ARC.y)); if (ay > by) V.yT = lerp(V.yT, ARC.y, 0.85);
}
function vola(v, vel = 3.2, subito = false) { V.xT = v.x; V.yT = v.y; V.ZT = v.Z; V.vel = vel; stringi(); if (subito) { V.x = V.xT; V.y = V.yT; V.Z = V.ZT; } sporco = true; }
function misura() {
  if (!renderer) return;
  W = innerWidth; H = innerHeight; aspetto = W / H; renderer.setSize(W, H, false);
  Zmax = clamp(2.5 * FH / H, 2.4, 4.4);
  if (!R) return;
  ARC = inquadraTutto(); Zmin = Math.min(ARC.Z, 1);
  if (!manuale && !isola && (modo === "arcipelago" || !seguito)) vola(ARC, 6); else stringi();
  sporco = true;
}
const zSegui = () => clamp((telefono ? 60 : 78) / (61 * H / FH), ARC.Z * 1.25, Zmax);
function aggiornaCamera(dt) {
  const a = 1 - Math.exp(-dt * V.vel), b = 1 - Math.exp(-dt * 5);
  const dx = V.xT - V.x, dy = V.yT - V.y, dz = Math.log(V.ZT / V.Z), dpx = par.xT - par.x, dpy = par.yT - par.y;
  const mossa = Math.abs(dx) + Math.abs(dy) > 0.004 / V.Z || Math.abs(dz) > 0.0006, mossaPar = Math.abs(dpx) + Math.abs(dpy) > 0.002;
  if (mossa) { V.x += dx * a; V.y += dy * a; V.Z *= Math.exp(dz * a); } else { V.x = V.xT; V.y = V.yT; V.Z = V.ZT; }
  if (mossaPar) { par.x += dpx * b; par.y += dpy * b; }
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(TY / V.Z)); camera.aspect = aspetto; camera.updateProjectionMatrix();
  // la camera gira appena attorno al centro della laguna (col mouse, e "respira" da sola): la foto ha volume
  const fiato = calmo ? 0 : 1, t = tempo;
  const az = (par.x * 0.02 + Math.sin(t * 0.23) * 0.005 * fiato) / Math.max(1, Math.pow(V.Z, 0.8)), el = (par.y * -0.007 + Math.sin(t * 0.17) * 0.002 * fiato) / Math.max(1, Math.pow(V.Z, 0.8));
  const sf = new THREE.Spherical().setFromVector3(e3.copy(R.cam0).sub(R.bersaglio)); sf.theta += az; sf.phi = clamp(sf.phi - el, 0.12, 1.5);
  camera.position.copy(R.bersaglio).add(e3.setFromSpherical(sf));
  const g = angoli(V.x, V.y);
  camera.lookAt(R.bersaglio); camera.rotateOnWorldAxis(ASSE_Y, g.yaw); camera.rotateX(g.pitch); camera.updateMatrixWorld();
  const ph = renderer.domElement.height;
  R.U.uE.value = 1 / (V.Z * ph);
  R.U.uNitido.value = telefono ? 0 : clamp((V.Z * ph / FH - 1.05) * 0.55, 0, 0.75);
  return mossa || mossaPar;
}
const v3 = new THREE.Vector3();
function proietta(w, out) { v3.copy(w).project(camera); out.x = (v3.x + 1) / 2 * W; out.y = (1 - v3.y) / 2 * H; out.ok = v3.z < 1 && v3.x > -1.15 && v3.x < 1.15 && v3.y > -1.15 && v3.y < 1.15; return out; }

// ---------------------------------------------------------------- comandi della vista (chiamati da gioco.js)
export function avvicina(f) { manuale = true; const g = fotoSotto(W / 2, H / 2, { x: V.xT, y: V.yT, Z: V.ZT }); vola({ x: g.x, y: g.y, Z: V.ZT / f }, 7); }
export function tutto() { if (!pronto) return; esciIsola(true); manuale = false; seguito = null; vola(ARC); }
export function ruota() { }                                     // girare attorno al mondo non si puo': la foto non lo regge
export function sposta(dx, dy) { if (!pronto || veduta.f > 0.5) return; const k = V.ZT * H / 100; if (V.ZT <= Zmin * 1.02) return; manuale = true; V.xT += dx / (k * 16 / 9); V.yT += dy / k; V.vel = 9; stringi(); sporco = true; }
export function apriVicino() { if (pronto) vola(ARC, 6, true); }   // si apre su tutta la Laguna: e' la foto, viva
export function centraSu(x, y) { if (!pronto) return; esciIsola(true); manuale = true; seguito = null; const L = rettangoloLibero(), Z = Math.max(V.ZT, zSegui()); vola(centroPer(x, y, (L.x0 + L.x1) / 2, (L.y0 + L.y1) / 2, Z)); }
export function impostaModo(m, id) {
  if (m === "alto" || m === "libera") m = "arcipelago";
  if (m !== "arcipelago" && m !== "segui") return;
  modo = m; scrivi("laguna_visuale", m); manuale = false; esciIsola(true);
  if (!pronto) return;
  if (m === "arcipelago") { seguito = null; vola(ARC); } else seguiPedina(id || mioId);
}
export function seguiPedina(id) {
  const ped = pedine.get(id || mioId); if (!pronto || !ped || !ped.g.visible) return false;
  esciIsola(true); seguito = id || mioId; manuale = false; const L = rettangoloLibero(), f = R.fotoDi(ped.g.position);
  vola(centroPer(f.x, f.y, (L.x0 + L.x1) / 2, (L.y0 + L.y1) / 2 + 12, zSegui())); return true;
}

// ---------------------------------------------------------------- giorno e notte
let notte = 0, notteVoluta = false, albaDa = 0;
export function impostaNotte(n) {
  n = !!n; if (n === notteVoluta) return; notteVoluta = n;
  if (n) notte = 1; else if (notte > 0.01) albaDa = performance.now();      // di notte il tabellone e' nascosto: al ritorno si vede l'alba
  if (pronto) R.notte(notte); sporco = true;
}
export function provaNotte(v) { notte = v; notteVoluta = v > 0.5; albaDa = 0; if (pronto) R.notte(notte); sporco = true; }   // per le prove: 0 giorno, 1 notte, in mezzo l'alba
function aggiornaNotte(ora) {
  if (!albaDa) return false;
  const k = clamp((ora - albaDa) / 5200, 0, 1); notte = 1 - k * k * (3 - 2 * k); if (k >= 1) { albaDa = 0; notte = 0; }
  R.notte(notte); return true;
}

// ---------------------------------------------------------------- i pezzi: materiali
// Niente luci vere: ogni faccia ha gia' il colore che avrebbe nella foto (lato al sole chiaro e caldo, lato in ombra scuro e freddo).
const SOLE = new THREE.Vector3(-0.86, 0.48, 0.18).normalize();
const PAL = {
  Ambra: { muro: ["#e6c8a4", "#7d6354"], tetto: ["#e07f45", "#8a4a2e"], base: ["#b9a48e", "#6b5a4c"], stile: "borgo" },
  Palma: { muro: ["#f0e6d2", "#9a8b74"], tetto: ["#d37749", "#8a4c2e"], base: ["#d9cdb6", "#8a7c66"], stile: "villa" },
  Flamingo: { muro: ["#f3bab4", "#a5677a"], tetto: ["#f8dbd2", "#b98a88"], base: ["#edd0c6", "#a07a78"], stile: "deco" },
  Corona: { muro: ["#9cc0cf", "#214760"], tetto: ["#c3d2d8", "#3c5f72"], base: ["#8fa5ae", "#34505f"], stile: "vetro" },
  Sole: { muro: ["#98b0b4", "#27404e"], tetto: ["#c4cccc", "#4f5f66"], base: ["#9a9fa1", "#444c52"], stile: "vetro" },
};
const COL = { bianco: ["#f4f1ea", "#8d93a0"], legno: ["#b08455", "#6a4c33"], cemento: ["#b6b2aa", "#6c6a68"], gru: ["#f5c330", "#a7791a"], oro: ["#f3cf73", "#9a7430"], scuro: ["#3a3f4c", "#1c2029"], telo: ["#e9e4d8", "#9a958c"] };
const cacheCol = new Map();
function col2(c) { const k = c[0] + c[1]; let v = cacheCol.get(k); if (!v) { const a = new THREE.Color(c[0]), b = new THREE.Color(c[1]); v = [[a.r, a.g, a.b], [b.r, b.g, b.b]]; cacheCol.set(k, v); } return v; }
const tinta2 = (hex) => { const a = new THREE.Color(hex), b = a.clone().multiplyScalar(0.5); b.b = Math.min(1, b.b * 1.15); return [[a.r, a.g, a.b], [b.r, b.g, b.b]]; };
let matPezzi = null, matAuto = null, meshEdifici = null, gAuto = null, geoAuto = null, geoAlone = null;
function creaPezzi() {
  const U = { uT: R.U.uT, uNotte: R.U.uNotte };
  matPezzi = new THREE.ShaderMaterial({
    uniforms: U, vertexColors: true, side: THREE.DoubleSide, extensions: { derivatives: true },
    vertexShader: `attribute vec4 fin; attribute vec4 agg; uniform float uT; varying vec3 vC; varying vec4 vF; varying float vQ;
      void main(){ vC = color; vF = fin; vQ = agg.w; vec3 p = position + agg.xyz * sin(uT*4.2 + fin.y*5. + fin.x*4.5);
        vec4 mv = viewMatrix*modelMatrix*vec4(p,1.); mv.xyz *= .95; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `precision highp float; varying vec3 vC; varying vec4 vF; varying float vQ; uniform float uNotte, uT;
      ${RUMORE}
      void main(){
        vec3 c = vC; float tipo = vF.z, accesa = 0., propria = 0.;
        float vis = smoothstep(.8, .3, max(fwidth(vF.x), fwidth(vF.y)));       // le finestre sfumano quando sono piu' piccole di un pixel e mezzo
        vec2 g = fract(vF.xy), id = floor(vF.xy);
        if (tipo > .5 && tipo < 1.5) {                                          // muro con finestre
          float w = step(.3, g.x)*step(g.x, .7)*step(.26, g.y)*step(g.y, .78);
          c = mix(c, c*vec3(.34,.33,.4), w*.8*vis);
          accesa = mix(.4, w, vis) * step(.42, h21(id + vF.w*91.));
        } else if (tipo > 1.5 && tipo < 2.5) {                                  // vetro
          float r = smoothstep(0., .1, g.y)*smoothstep(1., .88, g.y)*smoothstep(0., .07, g.x)*smoothstep(1., .93, g.x);
          c *= mix(.9, .74 + .26*r, vis) * mix(.84, 1.16, smoothstep(.2, 2.2, vQ)); c += (h21(id + vF.w*37.) - .5) * .09 * vis;
          accesa = mix(.45, r, vis) * step(.5, h21(id + vF.w*53.));
        } else if (tipo > 2.5 && tipo < 3.5) { c *= .86 + .14*sin(vF.x*9. - uT*4.2); propria = .35; }   // stoffa della bandiera
        else if (tipo > 3.5) propria = 1.;                                      // il colore del giocatore: resta acceso
        c *= mix(.66, 1., smoothstep(0., .22, vQ));                              // piu' scuro dove tocca terra
        float l = dot(c, vec3(.3,.59,.11));
        vec3 buio = mix(vec3(l), c, .5)*vec3(.15,.22,.42) + vec3(1.,.78,.46)*accesa*.95 + c*propria*1.15;
        c = mix(c, buio, uNotte) + sin(clamp(uNotte,0.,1.)*3.14159)*vec3(.1,.04,.0);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  matAuto = new THREE.ShaderMaterial({
    uniforms: U, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: `attribute float luce; varying vec3 vC, vN; varying float vL; void main(){ vC = color; vL = luce; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); gl_Position.z -= .035*gl_Position.w; }`,
    fragmentShader: `precision highp float; varying vec3 vC, vN; varying float vL; uniform float uNotte;
      void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; float d = max(0., dot(n, vec3(${SOLE.x.toFixed(3)}, ${SOLE.y.toFixed(3)}, ${SOLE.z.toFixed(3)}))), su = max(0., n.y);
        vec3 c = vC * (vec3(.46,.5,.6) + vec3(.1,.11,.12)*su + vec3(.8,.72,.58)*d) + vec3(1.,.95,.85)*pow(su, 24.)*.35;
        vec3 buio = c*vec3(.3,.36,.6); c = mix(c, buio, uNotte*(1.-vL)) + vC*vL*(.25 + 1.2*uNotte);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  meshEdifici = new THREE.Mesh(new THREE.BufferGeometry(), matPezzi); meshEdifici.frustumCulled = false; meshEdifici.renderOrder = 2; meshEdifici.visible = false; scena.add(meshEdifici);
  gAuto = new THREE.Group(); scena.add(gAuto);
  geoAuto = new Map();
  geoAlone = new THREE.PlaneGeometry(1, 1); geoAlone.rotateX(-Math.PI / 2);
}

// ---------------------------------------------------------------- i pezzi: costruttore di forme
// Tutti gli edifici e le bandiere finiscono in UNA sola forma (una sola chiamata di disegno).
function Costruttore() {
  const P = [], C = [], F = [], A = [], I = [];
  const M = new THREE.Matrix4(), w = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], n = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), cen = new THREE.Vector3();
  let seme = 0, foschia = 0, scalaQ = 1, y0 = 0;
  const NEB = [0.62, 0.78, 0.86];
  // una faccia a quattro punte (in misure locali); col = [chiaro, scuro]; fin = righe e colonne di finestre; tipo: 0 liscio, 1 muro, 2 vetro, 3 stoffa, 4 colore del giocatore
  function faccia(q, col, tipo = 0, nu = 1, nv = 1, centro = null, onda = 0) {
    for (let j = 0; j < 4; j++) w[j].set(q[j][0], q[j][1], q[j][2]).applyMatrix4(M);
    n.crossVectors(a.subVectors(w[1], w[0]), b.subVectors(w[3], w[0])).normalize();
    if (centro) { cen.set(centro[0], centro[1], centro[2]).applyMatrix4(M); a.copy(w[0]).add(w[2]).multiplyScalar(0.5).sub(cen); if (n.dot(a) < 0) n.negate(); }
    const d = clamp(n.dot(SOLE) / 0.62, 0, 1), k = tipo === 4 ? 1 : d * d * (3 - 2 * d), su = Math.max(0, n.y) * 0.1;
    const r = col[1][0] + (col[0][0] - col[1][0]) * k + su * 0.9, g = col[1][1] + (col[0][1] - col[1][1]) * k + su, bl = col[1][2] + (col[0][2] - col[1][2]) * k + su * 1.1;
    const base = P.length / 3, uv = [[0, 0], [nu, 0], [nu, nv], [0, nv]];
    for (let j = 0; j < 4; j++) {
      P.push(w[j].x, w[j].y, w[j].z);
      C.push(lerp(r, NEB[0], foschia), lerp(g, NEB[1], foschia), lerp(bl, NEB[2], foschia));
      F.push(uv[j][0], uv[j][1], tipo, seme);
      const peso = onda ? uv[j][0] / nu : 0;
      A.push(n.x * onda * peso, n.y * onda * peso, n.z * onda * peso, (q[j][1] - y0) * scalaQ);
    }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // scatola appoggiata a terra: centro (x, z), base a quota y, larga sx, alta sy, profonda sz; muri col, coperchio colSu
  function scatola(x, y, z, sx, sy, sz, col, tipo = 0, piani = 1, colSu = null, cella = 0.11) {
    const x0 = x - sx / 2, x1 = x + sx / 2, z0 = z - sz / 2, z1 = z + sz / 2, y1 = y + sy, c = [x, y + sy / 2, z];
    const nx = Math.max(1, Math.round(sx / cella)), nz = Math.max(1, Math.round(sz / cella));
    faccia([[x0, y, z1], [x1, y, z1], [x1, y1, z1], [x0, y1, z1]], col, tipo, nx, piani, c);
    faccia([[x1, y, z0], [x0, y, z0], [x0, y1, z0], [x1, y1, z0]], col, tipo, nx, piani, c);
    faccia([[x0, y, z0], [x0, y, z1], [x0, y1, z1], [x0, y1, z0]], col, tipo, nz, piani, c);
    faccia([[x1, y, z1], [x1, y, z0], [x1, y1, z0], [x1, y1, z1]], col, tipo, nz, piani, c);
    faccia([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], colSu || col, tipo === 4 ? 4 : 0, 1, 1, [x, y, z]);
  }
  // tetto a quattro falde sopra una scatola
  function tetto(x, y, z, sx, sz, h, col, sporge = 0.03) {
    const x0 = x - sx / 2 - sporge, x1 = x + sx / 2 + sporge, z0 = z - sz / 2 - sporge, z1 = z + sz / 2 + sporge, c = [x, y - 0.2, z];
    const cr = Math.max(0, (sx - sz) / 2), cz = Math.max(0, (sz - sx) / 2), a0 = [x - cr, y + h, z - cz], a1 = [x + cr, y + h, z + cz];
    faccia([[x0, y, z1], [x1, y, z1], cz ? a1 : a1, cz ? a1 : a0], col, 0, 1, 1, c);
    faccia([[x1, y, z0], [x0, y, z0], cz ? a0 : a0, cz ? a0 : a1], col, 0, 1, 1, c);
    faccia([[x0, y, z0], [x0, y, z1], cz ? a1 : a0, a0], col, 0, 1, 1, c);
    faccia([[x1, y, z1], [x1, y, z0], cz ? a0 : a1, a1], col, 0, 1, 1, c);
  }
  // bandiera: asta e stoffa del colore del giocatore (la stoffa guarda sempre verso chi gioca)
  function bandiera(x, y, z, h, colore, grande = 1) {
    scatola(x, y, z, 0.022, h, 0.022, col2(COL.bianco));
    const l = 0.3 * grande, a2 = 0.19 * grande, yb = y + h - a2, c = tinta2(colore), N = 4;
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N; const q = [[x + 0.011 + u0 * l, yb, z + 0.012], [x + 0.011 + u1 * l, yb, z + 0.012], [x + 0.011 + u1 * l, yb + a2, z + 0.012], [x + 0.011 + u0 * l, yb + a2, z + 0.012]];
      for (let j = 0; j < 4; j++) w[j].set(q[j][0], q[j][1], q[j][2]).applyMatrix4(M);
      const base = P.length / 3, us = [u0, u1, u1, u0], vs = [0, 0, 1, 1];
      n.set(0, 0, 1).transformDirection(M);
      for (let j = 0; j < 4; j++) { P.push(w[j].x, w[j].y, w[j].z); C.push(lerp(c[0][0], NEB[0], foschia * 0.5), lerp(c[0][1], NEB[1], foschia * 0.5), lerp(c[0][2], NEB[2], foschia * 0.5)); F.push(us[j], vs[j], 3, seme); const am = 0.035 * grande * us[j] * scalaM; A.push(n.x * am, n.y * am, n.z * am, 1); }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3); }
  }
  let scalaM = 1;
  return {
    faccia, scatola, tetto, bandiera,
    // dove si costruisce: punto del mondo, rotazione, misura; quanta foschia (i pezzi lontani sono piu' chiari, come nella foto)
    posa(p, rot, s, f, sm, base = 0) { M.makeRotationY(rot); M.scale(a.set(s, s, s)); M.setPosition(p); foschia = f; seme = sm; scalaQ = 1; scalaM = s; y0 = base; },
    geometria() { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); g.setAttribute("fin", new THREE.Float32BufferAttribute(F, 4)); g.setAttribute("agg", new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I); return g; },
    get triangoli() { return I.length / 3; },
  };
}

// ---------------------------------------------------------------- i pezzi: gli edifici, nello stile dell'isola
const BASSI = { ristorante: "#c0392b", boutique: "#20232b", lavanderia: "#7fb3d5", agenzia: "#3a7bd5", galleria: "#f2f2f2", beachclub: "#f39c12", yachtclub: "#2e86c1" };
// misure locali: 1 = la distanza tra due caselle. Restituisce quanto e' alto e largo (per l'ombra e la bandiera).
function edificio(B, c, colore) {
  const pal = PAL[c.isola] || PAL.Ambra, muro = col2(pal.muro), tet = col2(pal.tetto), bas = col2(pal.base), prop = tinta2(colore);
  const lv = clamp(c.livello || 1, 1, 5), att = c.attivita, basso = !!BASSI[att];
  let h = 0, larg = 0.5;
  const cornice = (x, y, z, sx, sz) => B.scatola(x, y, z, sx + 0.035, 0.035, sz + 0.035, prop, 4);
  if (att === "magazzino") {                                                       // capannone con i container
    const l = 0.6, p = 0.4; h = 0.2 + lv * 0.035; B.scatola(0, 0, 0, l, h, p, col2(["#c2c8cc", "#5f6a72"]), 0, 1); B.tetto(0, h, 0, l, p, 0.07, col2(["#8ea2b0", "#48565f"]), 0.015); cornice(0, h - 0.035, 0, l, p);
    const cc = ["#d86a3a", "#3b7fb0", "#3d9963", "#c9a53a", "#8a5aa6"]; for (let i = 0; i < Math.min(5, lv + 1); i++) B.scatola(-0.24 + i * 0.12, 0, p / 2 + 0.07, 0.1, 0.07 + (i % 2) * 0.07, 0.085, tinta2(cc[i]));
    return { h: h + 0.07, larg: l };
  }
  if (pal.stile === "vetro") {
    const sole = c.isola === "Sole", piani = (sole ? [0, 2, 4, 6, 9, 13] : [0, 3, 5, 8, 12, 17])[lv] - (basso ? 1 : 0), hp = 0.115; larg = [0, 0.4, 0.42, 0.44, 0.46, 0.48][lv] + (sole ? 0.04 : 0); h = piani * hp;
    B.scatola(0, 0, 0, larg + 0.06, 0.05, larg + 0.06, bas);
    if (lv >= 3) { const h1 = Math.round(piani * 0.72) * hp; B.scatola(0, 0.05, 0, larg, h1, larg, muro, 2, Math.round(piani * 0.72), tet, 0.085); B.scatola(0.02, 0.05 + h1, -0.02, larg * 0.7, h - h1, larg * 0.7, muro, 2, piani - Math.round(piani * 0.72), tet, 0.085); cornice(0.02, 0.05 + h, -0.02, larg * 0.7, larg * 0.7);
      if (lv >= 5) B.scatola(0.02, 0.085 + h, -0.02, 0.03, 0.42, 0.03, col2(COL.bianco)); }
    else { B.scatola(0, 0.05, 0, larg, h, larg, muro, 2, piani, tet, 0.085); cornice(0, 0.05 + h, 0, larg, larg); }
    if (sole && lv >= 2) { B.scatola(larg * 0.72, 0.05, 0.05, larg * 0.5, hp * 2, larg * 0.7, col2(["#d9dcd8", "#6f7a80"]), 1, 2, col2(pal.tetto)); }
    h += 0.085;
  } else if (pal.stile === "deco") {                                               // Baia Flamingo: palazzi rosa a gradoni
    const piani = [0, 2, 3, 4, 6, 8][lv] - (basso ? 1 : 0), hp = 0.125; larg = [0, 0.44, 0.48, 0.52, 0.55, 0.58][lv]; const p = larg * 0.8;
    const p1 = Math.max(1, Math.ceil(piani * 0.55)), h1 = p1 * hp; B.scatola(0, 0, 0, larg, h1, p, muro, 1, p1, tet); B.scatola(0, h1, 0, larg + 0.03, 0.025, p + 0.03, col2(COL.bianco)); h = h1 + 0.025;
    if (piani > p1) { const p2 = piani - p1 - (lv >= 5 ? 1 : 0), h2 = Math.max(1, p2) * hp; B.scatola(0, h, 0, larg * 0.68, h2, p * 0.72, muro, 1, Math.max(1, p2), tet); h += h2; B.scatola(0, h, 0, larg * 0.68 + 0.03, 0.025, p * 0.72 + 0.03, col2(COL.bianco)); h += 0.025;
      if (lv >= 5) { B.scatola(0, h, 0, larg * 0.36, hp * 1.4, p * 0.4, muro, 1, 1, tet); h += hp * 1.4; } }
    if (lv >= 3) B.scatola(-larg * 0.34 - 0.02, 0, p / 2 + 0.012, 0.05, h + 0.1, 0.03, col2(["#fff3ee", "#d7a9a6"]));     // la "pinna" déco
    cornice(0, h, 0, lv >= 5 ? larg * 0.36 : piani > p1 ? larg * 0.68 : larg, lv >= 5 ? p * 0.4 : piani > p1 ? p * 0.72 : p); h += 0.035;
  } else {                                                                         // Borgo Ambra (case col tetto di coppi) e Costa Palma (ville bianche)
    const villa = pal.stile === "villa", piani = (villa ? [0, 1, 2, 2, 3, 4] : [0, 2, 3, 4, 5, 6])[lv] - (basso && lv > 1 ? 1 : 0), hp = 0.125; larg = (villa ? [0, 0.48, 0.5, 0.56, 0.58, 0.6] : [0, 0.4, 0.44, 0.46, 0.5, 0.52])[lv]; const p = larg * (villa ? 0.72 : 0.84);
    h = piani * hp; const ht = larg * (villa ? 0.2 : 0.3);
    B.scatola(0, 0, 0, larg, h, p, muro, 1, piani, tet); cornice(0, h - 0.02, 0, larg, p); B.tetto(0, h + 0.015, 0, larg, p, ht, tet);
    if (lv >= 2) { const ha = Math.max(1, piani - 1) * hp, la = larg * 0.56; B.scatola(larg * 0.5 + la * 0.42, 0, 0.04, la, ha, p * 0.72, muro, 1, Math.max(1, piani - 1), tet); B.tetto(larg * 0.5 + la * 0.42, ha, 0.04, la, p * 0.72, ht * 0.7, tet); }
    if (lv >= 4) { const ha = Math.max(1, piani - 2) * hp, la = larg * 0.5; B.scatola(-larg * 0.5 - la * 0.4, 0, 0.06, la, ha, p * 0.66, muro, 1, Math.max(1, piani - 2), tet); B.tetto(-larg * 0.5 - la * 0.4, ha, 0.06, la, p * 0.66, ht * 0.65, tet); }
    if (lv >= 5) { const ht2 = h + hp * 2.4; B.scatola(larg * 0.3, 0, -p * 0.3, 0.15, ht2, 0.15, muro, 1, piani + 2, tet, 0.075); B.tetto(larg * 0.3, ht2, -p * 0.3, 0.15, 0.15, 0.14, tet, 0.02); h = ht2 + 0.14 - ht; }
    h += ht;
  }
  if (basso) B.scatola(-0.02, 0.07, larg * 0.42 + 0.05, larg * 0.7, 0.02, 0.1, tinta2(BASSI[att]));                            // la tenda del negozio
  if (att === "casino") { B.scatola(0, h, 0, 0.2, 0.05, 0.2, col2(COL.oro)); B.tetto(0, h + 0.05, 0, 0.2, 0.2, 0.12, col2(COL.oro), 0); h += 0.17; }
  if (att === "discoteca") B.scatola(0, h * 0.45, 0, larg + 0.04, 0.03, larg * 0.84 + 0.04, tinta2("#ff4fa3"), 4);
  return { h, larg };
}
// cantiere: solai e pilastri, e la gru
function cantiere(B, c) {
  const n = clamp((c.livello || 0) + 1, 1, 4), cem = col2(COL.cemento), hp = 0.125, l = 0.42;
  for (let i = 0; i <= n; i++) B.scatola(0, i * hp, 0, l, 0.02, l * 0.85, cem);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.scatola(x * l * 0.44, 0, z * l * 0.37, 0.03, n * hp, 0.03, cem);
  const hg = n * hp + 0.34, gr = col2(COL.gru); B.scatola(l * 0.5 + 0.06, 0, -0.08, 0.03, hg, 0.03, gr); B.scatola(l * 0.5 - 0.1, hg, -0.08, 0.5, 0.025, 0.025, gr); B.scatola(l * 0.5 + 0.2, hg - 0.05, -0.08, 0.07, 0.05, 0.05, col2(COL.cemento));
  return { h: hg, larg: l };
}
// il Palazzo di un giocatore: cresce coi piani (Palazzo, Attico dal 6°, Grattacielo dal 15°), a gradoni
function palazzo(B, isolaNome, piani, colore, alto) {
  const pal = PAL[isolaNome] || PAL.Corona, vetro = pal.stile === "vetro", muro = col2(pal.muro), tet = col2(pal.tetto), prop = tinta2(colore), pietra = col2(vetro ? pal.base : COL.bianco);
  const gradoni = piani >= 15 ? 3 : piani >= 6 ? 2 : 1, parti = [[1], [0.62, 0.38], [0.5, 0.3, 0.2]][gradoni - 1], larghi = vetro ? [0.44, 0.34, 0.25] : [0.48, 0.38, 0.28], tipo = vetro ? 2 : 1;
  B.scatola(0, 0, 0, larghi[0] + 0.14, 0.07, larghi[0] + 0.14, col2(pal.base));
  let h = 0.07, fatti = 0;
  for (let g = 0; g < gradoni; g++) {
    const l = larghi[g], hg = alto * parti[g], n = Math.max(1, Math.round(Math.max(3, piani) * parti[g]));
    B.scatola(0, h, 0, l, hg, l, muro, tipo, n, tet, vetro ? 0.09 : 0.1); h += hg; fatti += n;
    if (g < gradoni - 1) { B.scatola(0, h, 0, l + 0.04, 0.03, l + 0.04, pietra); h += 0.03; }
  }
  const lt = larghi[gradoni - 1];
  B.scatola(0, h, 0, lt + 0.05, 0.05, lt + 0.05, prop, 4); h += 0.05;                       // la corona del colore del giocatore
  if (pal.stile === "borgo" || pal.stile === "villa") { B.tetto(0, h, 0, lt, lt, lt * 0.5, tet, 0.03); h += lt * 0.5; }
  else if (pal.stile === "deco") { B.scatola(0, h, 0, lt * 0.5, 0.12, lt * 0.5, muro, 0, 1, tet); h += 0.12; }
  if (piani >= 15) { B.scatola(0, h, 0, 0.035, 0.42, 0.035, col2(COL.bianco)); h += 0.42; }
  return { h, larg: larghi[0] };
}

// ---------------------------------------------------------------- le caselle sulla foto
let dati = [], perId = new Map(), nCas = 0, firma = "", centriIsola = {}, ultimoStato = null, edifici = [];
const mediana = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
function costruisciPercorso(caselle) {
  const cs = [...caselle].sort((a, b) => a.idx - b.idx); nCas = cs.length; perId = new Map();
  const grezze = cs.map((c) => R.suolo(c.x, c.y).y);
  const centri = {};
  for (const c of cs) { const k = centri[c.isola] = centri[c.isola] || { x: 0, y: 0, n: 0 }; k.x += c.x; k.y += c.y; k.n++; }
  centriIsola = {}; for (const k in centri) centriIsola[k] = { x: centri[k].x / centri[k].n, y: centri[k].y / centri[k].n };
  dati = cs.map((c, i) => {
    const q = Math.max(0.12, mediana([-2, -1, 0, 1, 2].map((d) => grezze[(i + d + nCas) % nCas])));
    const w = R.aQuota(c.x, c.y, q), prima = cs[(i + nCas - 1) % nCas], dopo = cs[(i + 1) % nCas];
    const px = c.x / 100 * FW, py = c.y / 100 * FH, dpx = (dopo.x - prima.x) / 100 * FW, dpy = (dopo.y - prima.y) / 100 * FH, lt = Math.hypot(dpx, dpy) || 1;
    const sp = Math.min(Math.hypot((dopo.x - c.x) / 100 * FW, (dopo.y - c.y) / 100 * FH), Math.hypot((prima.x - c.x) / 100 * FW, (prima.y - c.y) / 100 * FH));
    R.direzione(c.x, c.y, d3); const sen = clamp(-d3.y, 0.15, 0.9), prof = e3.copy(w).sub(R.cam0).dot(R.avanti);
    // da che parte della strada sta l'edificio: di preferenza dietro (in alto nella foto) e verso l'interno dell'isola
    let nx = -dpy / lt, ny = dpx / lt; const ci = centriIsola[c.isola], vx = (ci.x - c.x) / 100 * FW, vy = (ci.y - c.y) / 100 * FH, lv = Math.hypot(vx, vy) || 1;
    if (nx * (vx / lv) * 0.55 + ny * (vy / lv) * 0.55 - ny * 0.8 < 0) { nx = -nx; ny = -ny; }
    const o = { id: c.id, idx: c.idx, x: c.x, y: c.y, px, py, w, q, grezza: grezze[i], sp, sen, prof, u: sp * prof / F_PX, nx, ny, tx: dpx / lt, ty: dpy / lt, isola: c.isola, s: { x: 0, y: 0, ok: false }, c };
    perId.set(c.id, o); return o;
  });
  const xs = dati.map((d) => d.x), ys = dati.map((d) => d.y);
  riquadro = { x0: Math.min(...xs) - 4.5, y0: Math.min(...ys) - 12, x1: Math.max(...xs) + 4.5, y1: Math.max(...ys) + 5.5 };
  creaNomiIsole(); misura();
}
// un punto lungo il percorso (t = indice di casella, anche con la virgola): curva morbida tra le caselle
function lungoPercorso(t, out) {
  const i = Math.floor(t), f = t - i, P0 = dati[(i - 1 + nCas) % nCas], P1 = dati[i % nCas], P2 = dati[(i + 1) % nCas], P3 = dati[(i + 2) % nCas];
  const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  out.fx = cr(P0.x, P1.x, P2.x, P3.x); out.fy = cr(P0.y, P1.y, P2.y, P3.y); out.q = lerp(P1.q, P2.q, f); out.u = lerp(P1.u, P2.u, f);
  return out;
}

// ---------------------------------------------------------------- dipingere sulla foto: piazzole, ombre, aloni
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r * 255, c.g * 255, c.b * 255]; };
function pennello(buf, BW, BH) {
  const k = BW / FW, kq = R.GW / BW, Q = R.quote, GW = R.GW;
  let tetto = 1e9, resto = 0.25;                                  // sopra questa quota la pittura quasi non attacca
  const attacca = (x, y) => { const q = Q[Math.min(R.GH - 1, (y * kq) | 0) * GW + Math.min(GW - 1, (x * kq) | 0)]; return q <= tetto ? 1 : Math.max(resto, 1 - (q - tetto) / 2.5); };
  // disco o anello (bordo morbido), "sopra" a quello che c'e' gia'
  function disco(cx, cy, rx, ry, col, alfa, dentro = 0) {
    cx *= k; cy *= k; rx *= k; ry *= k; const m = 1.5, x0 = Math.max(0, Math.floor(cx - rx - m)), x1 = Math.min(BW - 1, Math.ceil(cx + rx + m)), y0 = Math.max(0, Math.floor(cy - ry - m)), y1 = Math.min(BH - 1, Math.ceil(cy + ry + m)), e = 1.2 / Math.max(1, ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry); let a = clamp((1 - d) / e + 0.5, 0, 1); if (dentro) a *= clamp((d - dentro) / e + 0.5, 0, 1);
      a *= alfa * attacca(x, y); if (a <= 0.003) continue;
      const i = (y * BW + x) * 4, da = buf[i + 3] / 255, oa = a + da * (1 - a);
      buf[i] = (col[0] * a + buf[i] * da * (1 - a)) / oa; buf[i + 1] = (col[1] * a + buf[i + 1] * da * (1 - a)) / oa; buf[i + 2] = (col[2] * a + buf[i + 2] * da * (1 - a)) / oa; buf[i + 3] = oa * 255;
    }
  }
  // macchia morbida lungo un segmento (ombra portata)
  function ombra(xa, ya, xb, yb, r, schiaccia, alfa) {
    xa *= k; ya *= k; xb *= k; yb *= k; r *= k; const ry = r * schiaccia, x0 = Math.max(0, Math.floor(Math.min(xa, xb) - r)), x1 = Math.min(BW - 1, Math.ceil(Math.max(xa, xb) + r)), y0 = Math.max(0, Math.floor(Math.min(ya, yb) - ry)), y1 = Math.min(BH - 1, Math.ceil(Math.max(ya, yb) + ry));
    const vx = xb - xa, vy = (yb - ya) / schiaccia, l2 = vx * vx + vy * vy || 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const qx = x + 0.5 - xa, qy = (y + 0.5 - ya) / schiaccia, t = clamp((qx * vx + qy * vy) / l2, 0, 1), d = Math.hypot(qx - vx * t, qy - vy * t) / r;
      let a = 1 - d; if (a <= 0) continue; a = a * a * (3 - 2 * a) * alfa * (1 - 0.55 * t) * attacca(x, y);
      const i = (y * BW + x) * 4, da = buf[i + 3] / 255, oa = a + da * (1 - a);
      buf[i] = (4 * a + buf[i] * da * (1 - a)) / oa; buf[i + 1] = (9 * a + buf[i + 1] * da * (1 - a)) / oa; buf[i + 2] = (22 * a + buf[i + 2] * da * (1 - a)) / oa; buf[i + 3] = oa * 255;
    }
  }
  // alone di luce ad anello (si somma)
  function alone(cx, cy, rx, ry, col, forza, r0 = 1, sig = 0.2, pieno = 0) {
    cx *= k; cy *= k; rx *= k; ry *= k; const m = 1 + r0 + sig * 2.2, x0 = Math.max(0, Math.floor(cx - rx * m)), x1 = Math.min(BW - 1, Math.ceil(cx + rx * m)), y0 = Math.max(0, Math.floor(cy - ry * m)), y1 = Math.min(BH - 1, Math.ceil(cy + ry * m));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry), g = (d - r0) / sig; let a = forza * Math.exp(-g * g); if (d < r0) a = Math.max(a, forza * pieno);
      a *= attacca(x, y); if (a <= 0.004) continue;
      const i = (y * BW + x) * 4, da = buf[i + 3] / 255, s = a + da;
      buf[i] = (col[0] * a + buf[i] * da) / s; buf[i + 1] = (col[1] * a + buf[i + 1] * da) / s; buf[i + 2] = (col[2] * a + buf[i + 2] * da) / s; buf[i + 3] = Math.min(1, s) * 255;
    }
  }
  return { disco, ombra, alone, quota(q, r = 0.25) { tetto = q; resto = r; } };
}
const NAVY = lin("#141c2e"), CREMA = lin("#fff4dc"), ORO = lin("#f3c56b");
function dipingi(caselle) {
  const S = R.strato; S.tinta.fill(0); S.luci.fill(0);
  const T = pennello(S.tinta, S.SW, S.SH), Lu = pennello(S.luci, S.LW, S.LH);
  for (const c of caselle) {
    const d = perId.get(c.id); if (!d) continue;
    const rx = d.sp * (c.tipo === "angolo" ? 0.46 : 0.35), ry = rx * d.sen, sp = c.spento ? 0.35 : 1;
    T.quota(d.q + 2.2, 0.22); Lu.quota(d.q + 2.2, 0.4);
    if (c.terreno) {
      // terreno: piazzola del colore del quartiere; libero = bordo chiaro sottile; di qualcuno = alone del suo colore (oro in piu' se e' tuo)
      T.disco(d.px, d.py, rx, ry, lin(c.coloreSerie), 0.42 * sp);
      if (c.proprietario && !c.spento) {
        T.disco(d.px, d.py, rx * 1.12, ry * 1.12, lin(c.proprietario), 0.95, 0.84);
        Lu.alone(d.px, d.py, rx, ry, lin(c.proprietario), 0.9, 1.12, 0.26, 0.16);
        if (c.mio) { T.disco(d.px, d.py, rx * 1.38, ry * 1.38, ORO, 0.95, 0.9); Lu.alone(d.px, d.py, rx, ry, ORO, 0.5, 1.4, 0.1); }
      } else T.disco(d.px, d.py, rx * 1.04, ry * 1.04, CREMA, 0.75 * sp, 0.88);
    } else {
      // posto speciale: piazzola scura col bordo d'oro (i ponti: doppio bordo)
      T.disco(d.px, d.py, rx, ry, NAVY, 0.62 * sp); T.disco(d.px, d.py, rx * 1.04, ry * 1.04, ORO, 0.85 * sp, 0.86);
      if (c.tipo === "angolo") T.disco(d.px, d.py, rx * 0.7, ry * 0.7, ORO, 0.7 * sp, 0.86);
    }
  }
  // ombre degli edifici: una macchia a terra e una scia verso destra-basso (il sole e' in alto a sinistra)
  for (const e of edifici) {
    const r = e.lp * 0.55; T.quota(e.q + 2.5, 0.3); T.disco(e.px + r * 0.12, e.py + r * e.sen * 0.1, r * 1.25, r * 1.25 * e.sen, [4, 9, 22], 0.34);
    const l = Math.min(e.hp * 0.6, e.lp * 3.2); T.ombra(e.px + r * 0.2, e.py, e.px + r * 0.2 + l * 0.94, e.py + l * 0.34 * e.sen * 2.2, r * 0.95, e.sen * 1.25, 0.3);
  }
  S.tTinta.needsUpdate = true; S.tLuci.needsUpdate = true;
}

// ---------------------------------------------------------------- aggiorna: dalla situazione della partita ai pezzi
// caselle: [{id, idx, x, y, tipo, isola, coloreSerie, terreno, proprietario, mio, livello, cantiere, attivita, spento}], torri: [{x, y, isola, colore, piani, spento}], giocatori: [{id, colore, pos, offset, nascosta}]
const pedine = new Map();
const pw = new THREE.Vector3();
export function aggiorna(st) {
  if (!attivo) return;
  if (!pronto) { inAttesa = st; return; }
  ultimoStato = st;
  const { caselle, torri, giocatori } = st;
  if (caselle.length && caselle.length !== nCas) costruisciPercorso(caselle);
  if (!nCas) return;
  const f = JSON.stringify([caselle, torri]);
  if (f !== firma) {
    firma = f; edifici = [];
    const B = Costruttore();
    for (const c of caselle) {
      const d = perId.get(c.id); if (!d) continue; d.c = c;
      if (!c.terreno || !c.proprietario || c.spento) continue;
      // l'edificio sta di fianco alla strada (non sopra la piazzola, dove si ferma l'auto)
      const ax = d.px + d.nx * d.sp * 0.66, ay = d.py + d.ny * d.sp * 0.66, axp = ax / FW * 100, ayp = ay / FH * 100, r = d.sp * 0.2 / FW * 100;
      // la quota del terreno li' accanto: la piu' bassa tra cinque punti vicini (cosi' non si finisce sui tetti della foto)
      const terra = Math.max(0.05, Math.min(R.suolo(axp, ayp, pw).y, R.suolo(axp - r, ayp, pw).y, R.suolo(axp + r, ayp, pw).y, R.suolo(axp, ayp + r * 0.8, pw).y, d.q)), w = R.aQuota(axp, ayp, terra, pw), mare = R.eAcqua(axp, ayp);
      const prof = e3.copy(w).sub(R.cam0).dot(R.avanti), u = d.sp * prof / F_PX * 1.18, az = Math.atan2(-(w.x - R.cam0.x), -(w.z - R.cam0.z)), fos = clamp((prof - 150) / 520, 0, 0.3), sm = (d.idx * 0.6180339) % 1;
      B.posa(w, az + 0.62 + (sm - 0.5) * 0.3, u, fos, sm);
      let m = null;
      if (c.tipo === "molo") { B.scatola(0, 0, 0, 0.5, 0.05, 0.26, col2(COL.legno)); B.scatola(-0.12, 0.05, 0, 0.18, 0.13, 0.16, col2(COL.bianco), 1, 1, tinta2(c.proprietario)); m = { h: 0.2, larg: 0.4 }; }
      else if (c.cantiere) m = cantiere(B, c);
      else if (c.livello > 0) m = edificio(B, c, c.proprietario);
      // il basamento: pietra a terra, una palafitta di legno se sotto c'e' il mare
      if (m) B.scatola(0, -0.05, 0, m.larg + 0.14, 0.05, m.larg * 0.86 + 0.14, col2(mare ? COL.legno : COL.cemento));
      // la bandiera del proprietario: sul tetto, o piantata nel terreno vuoto
      B.posa(w, az, u, fos * 0.5, sm);
      if (m) B.bandiera(m.larg * 0.18, m.h, 0, 0.34 + (c.livello >= 4 ? 0.08 : 0), c.proprietario, 1);
      else { B.scatola(0, 0, 0, 0.12, 0.03, 0.12, col2(COL.cemento)); B.bandiera(0, 0.03, 0, 0.62, c.proprietario, 1.25); }
      const k = F_PX / prof * u;
      edifici.push({ px: ax, py: ay, lp: (m ? m.larg : 0.14) * k, hp: (m ? m.h : 0.3) * k, sen: d.sen, q: terra });
    }
    const quante = {}, primo = {}, GIRO = [[0, 0], [3.3, -1.7], [-3.1, -1.4], [0.5, -3.8], [-2.3, 1.7], [2.7, 1.9], [5.6, 0.2], [-5.4, 0.3]];
    for (const t of torri) {
      const k = (quante[t.isola] = (quante[t.isola] || 0) + 1); if (k === 1) primo[t.isola] = [t.x, t.y];
      if (t.spento) continue;
      // piu' Palazzi sulla stessa isola: attorno al centro, non in fila uno sopra l'altro
      const tx = primo[t.isola][0] + GIRO[(k - 1) % GIRO.length][0], ty = primo[t.isola][1] + GIRO[(k - 1) % GIRO.length][1], vetro = (PAL[t.isola] || PAL.Corona).stile === "vetro";
      const w = R.suolo(tx, ty, pw); w.y = Math.max(w.y, 0.3); const prof = e3.copy(w).sub(R.cam0).dot(R.avanti), mpx = prof / F_PX, az = Math.atan2(-(w.x - R.cam0.x), -(w.z - R.cam0.z));
      const hpx = 44 + (vetro ? 175 : 112) * (1 - Math.exp(-t.piani / 15)), u = 62 * mpx, alto = hpx * mpx / u;
      B.posa(w, az + 0.62, u, clamp((prof - 150) / 520, 0, 0.3), (k * 0.37 + t.piani * 0.11) % 1);
      const m = palazzo(B, t.isola, t.piani, t.colore, alto);
      B.posa(w, az, u, 0, 0); B.bandiera(0.03, m.h, 0, 0.5, t.colore, 1.5);
      edifici.push({ px: tx / 100 * FW, py: ty / 100 * FH, lp: m.larg * 62, hp: hpx, sen: clamp(-R.direzione(tx, ty, d3).y, 0.15, 0.9), q: w.y });
    }
    meshEdifici.geometry.dispose(); meshEdifici.geometry = B.geometria(); meshEdifici.visible = B.triangoli > 0;
    dipingi(caselle); sporco = true; disponiPresto();
  }
  // le pedine: create una volta, poi seguono la loro casella
  for (const g of giocatori) {
    let ped = pedine.get(g.id);
    if (!ped) { ped = creaAuto(g); pedine.set(g.id, ped); ped.cur = ped.meta = g.pos || 0; }
    if (ped.offset !== (g.offset || 0) || ped.g.visible === !!g.nascosta) { sporco = true; ped.sporca = true; }
    ped.offset = g.offset || 0; ped.g.visible = !g.nascosta; ped.colore = g.colore;
    if (!ped.inMoto && ped.meta !== g.pos && !elPed.get(g.id)) { ped.meta = ped.cur = g.pos || 0; sporco = true; ped.sporca = true; }
  }
}

// ---------------------------------------------------------------- le pedine: auto sportive
function formaAuto(colore) {
  if (geoAuto.has(colore)) return geoAuto.get(colore);
  const P = [], C = [], Lc = [], c0 = new THREE.Color(colore), vetro = new THREE.Color("#1a2434"), gomma = new THREE.Color("#15171c"), faro = new THREE.Color("#fff3c4"), stop = new THREE.Color("#ff3b30"), scuro = c0.clone().multiplyScalar(0.55);
  const tri = (a, b, c, col, lu = 0) => { for (const p of [a, b, c]) { P.push(p[0], p[1], p[2]); C.push(col.r, col.g, col.b); Lc.push(lu); } };
  const quad = (a, b, c, d, col, lu) => { tri(a, b, c, col, lu); tri(a, c, d, col, lu); };
  // profilo di lato (z in avanti, y in alto): muso basso, abitacolo arretrato, coda con l'alettone
  const prof = [[-0.5, 0.07], [-0.5, 0.2], [-0.43, 0.245], [-0.3, 0.235], [-0.17, 0.315], [0.04, 0.315], [0.22, 0.215], [0.44, 0.165], [0.5, 0.11], [0.5, 0.07]], lx = 0.215;
  const colSeg = [c0, c0, c0, vetro, c0, vetro, c0, c0, scuro];
  for (let i = 0; i < prof.length - 1; i++) { const [z0, y0] = prof[i], [z1, y1] = prof[i + 1], st = i === 3 || i === 5 ? 0.82 : 1;
    quad([-lx * st, y0, z0], [lx * st, y0, z0], [lx * st, y1, z1], [-lx * st, y1, z1], colSeg[i], 0); }
  for (const s of [-1, 1]) { for (let i = 1; i < prof.length - 2; i++) { const a = [s * lx, prof[0][1], prof[i][0]], b = [s * lx, prof[i][1], prof[i][0]], c = [s * lx, prof[i + 1][1], prof[i + 1][0]], d = [s * lx, prof[0][1], prof[i + 1][0]]; s > 0 ? quad(a, d, c, b, c0, 0) : quad(a, b, c, d, c0, 0); }
    quad([s * lx * 1.01, 0.225, -0.24], [s * lx * 1.01, 0.3, -0.15], [s * lx * 1.01, 0.3, 0.03], [s * lx * 1.01, 0.225, 0.18], vetro, 0);                 // finestrino
    for (const z of [-0.31, 0.3]) for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2, r = 0.085; tri([s * lx * 1.03, 0.085, z], [s * lx * 1.03, 0.085 + Math.sin(a0) * r, z + Math.cos(a0) * r], [s * lx * 1.03, 0.085 + Math.sin(a1) * r, z + Math.cos(a1) * r], gomma, 0); }
    quad([s * 0.07, 0.125, 0.502], [s * 0.19, 0.125, 0.502], [s * 0.19, 0.16, 0.49], [s * 0.07, 0.16, 0.49], faro, 1);                                     // fari
    quad([s * 0.06, 0.15, -0.502], [s * 0.2, 0.15, -0.502], [s * 0.2, 0.19, -0.502], [s * 0.06, 0.19, -0.502], stop, 1); }
  quad([-lx * 1.05, 0.25, -0.5], [lx * 1.05, 0.25, -0.5], [lx * 1.05, 0.262, -0.4], [-lx * 1.05, 0.262, -0.4], scuro, 0);                                   // alettone
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3)); g.setAttribute("luce", new THREE.Float32BufferAttribute(Lc, 1)); g.computeVertexNormals();
  geoAuto.set(colore, g); return g;
}
function creaAuto(gioc) {
  const g = new THREE.Group(), m = new THREE.Mesh(formaAuto(gioc.colore), matAuto); m.renderOrder = 3; g.add(m);
  // l'alone a terra del colore del giocatore: si vede sempre dov'e' la pedina
  const al = new THREE.Mesh(geoAlone, new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(gioc.colore) }, uNotte: R.U.uNotte }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform vec3 uC; uniform float uNotte; void main(){ float d = length(vUv-.5)*2.; float a = smoothstep(1.,.8,d)*smoothstep(.56,.78,d)*.7 + smoothstep(.8,.0,d)*.1; gl_FragColor = vec4(uC*a*(.7+.5*uNotte), 1.);
      #include <colorspace_fragment>
    }` }));
  al.renderOrder = 4; al.scale.set(1.9, 1, 1.9); g.add(al);
  gAuto.add(g);
  return { id: gioc.id, g, cur: 0, meta: 0, offset: 0, inMoto: false, sporca: true, s: { x: 0, y: 0, ok: false }, tag: null };
}
const lp = {};
function posaAuto(ped) {
  lungoPercorso(ped.cur, lp); const fx = lp.fx, fy = lp.fy, q = lp.q, u = lp.u;
  lungoPercorso(ped.cur + 0.06, lp);
  const i = Math.round(ped.cur) % nCas, d = dati[i], k = ped.inMoto ? 0 : ped.offset, sp = d.sp / FW * 100;
  // piu' auto sulla stessa casella: si mettono in fila, dal lato opposto all'edificio
  const ox = (-d.nx * 0.34 * (k % 2) - d.tx * 0.36 * (k >> 1)) * sp, oy = (-d.ny * 0.34 * (k % 2) - d.ty * 0.36 * (k >> 1)) * sp * 16 / 9;
  R.aQuota(fx + ox, fy + oy, q + 0.05, ped.g.position); R.aQuota(lp.fx + ox, lp.fy + oy, lp.q + 0.05, pw);
  ped.g.rotation.y = Math.atan2(pw.x - ped.g.position.x, pw.z - ped.g.position.z);
  ped.g.scale.setScalar(u * 0.62);
}
function muoviPedine(dt, ora) {
  let mosso = false;
  for (const [id, ped] of pedine) {
    const el = elPed.get(id); if (el && el.dataset.pos != null) ped.meta = +el.dataset.pos;
    let d = ((ped.meta - ped.cur) % nCas + nCas) % nCas;
    if (d > 9 && d < nCas - 0.01) { ped.cur = ped.meta; d = 0; ped.sporca = true; }   // salto lungo (Faro, viaggio rapido) o all'indietro: l'auto riappare la'
    const prima = ped.inMoto; ped.inMoto = d > 0.004;
    if (ped.inMoto) { ped.cur = (ped.cur + Math.min(d, dt * Math.max(5.6, d * 4.5))) % nCas; mosso = true; }
    else if (prima) { ped.cur = ped.meta; ped.sporca = true; arrivo(ped); }
    if (ped.inMoto && !prima) partenza(ped);
    if (ped.inMoto || ped.sporca) { posaAuto(ped); ped.sporca = false; mosso = true; }
    if (ped.inMoto && id === seguito && !manuale) { const L = rettangoloLiberoCache(ora), f = R.fotoDi(ped.g.position), v = centroPer(f.x, f.y, (L.x0 + L.x1) / 2, (L.y0 + L.y1) / 2 + 12, zSegui()); V.xT = v.x; V.yT = v.y; V.ZT = v.Z; V.vel = 3.4; stringi(); }
  }
  return mosso;
}
let rlc = null, rlcT = 0; function rettangoloLiberoCache(ora) { if (!rlc || ora - rlcT > 400) { rlc = rettangoloLibero(); rlcT = ora; } return rlc; }
// "Segui": quando parte la tua auto la visuale le va dietro; quando si muovono gli altri torna su tutta la Laguna
function partenza(ped) {
  if (modo === "arcipelago" || isola && ped.id !== mioId) return;
  if (ped.id === mioId) { esciIsola(true); seguito = mioId; manuale = false; }
  else if (seguito === mioId && !manuale && modo === "segui" && !pedine.get(mioId).inMoto) { seguito = null; vola(ARC, 2.4); }
}
function arrivo(ped) { if (ped.id === mioId || ped.id === seguito) accendiFuoco(dati[Math.round(ped.cur) % nCas], ped.colore, 2600); sporco = true; }

// ---------------------------------------------------------------- il cerchio che pulsa (casella toccata, arrivo di una pedina)
let fuocoFino = 0, fuocoId = null;
function accendiFuoco(d, colore, ms = 3000) {
  if (!d) return; fuocoId = d.id; fuocoFino = performance.now() + ms;
  R.U.uFuoco.value.set(d.x / 100, d.y / 100, d.sp * 0.42 / FH, 0.9); R.U.uFuocoM.value.set(16 / 9, 1 / d.sen, 0, 0); R.U.uFuocoCol.value.set(colore || "#ffd98a"); sporco = true;
}
function aggiornaFuoco(ora) { if (!fuocoFino) return false; const k = (fuocoFino - ora) / 600; if (k <= 0) { fuocoFino = 0; fuocoId = null; R.U.uFuoco.value.w = 0; return true; } R.U.uFuoco.value.w = Math.min(0.9, k); return true; }

// ---------------------------------------------------------------- dentro le isole
// Toccando il nome di un'isola la visuale ci vola sopra: le sue caselle si vedono grandi, con prezzi e nomi dei posti.
// Da li' si puo' scendere "in strada": la foto dell'isola in rilievo (solo da guardare: li' non ci sono caselle).
const VEDUTE = { Ambra: "ambra", Palma: "palma", Corona: "corona", Flamingo: "flamingo", Sole: "sole" };
let isola = null; const veduta = { f: 0, fT: 0, scena: null, nome: null, cache: {} };
const nomeIsola = (k) => (window.Laguna && window.Laguna.NOMI_ISOLE && window.Laguna.NOMI_ISOLE[k]) || "Isola " + k;
export function entraIsola(k) {
  if (!pronto || !centriIsola[k]) return;
  const cs = dati.filter((d) => d.isola === k), xs = cs.map((d) => d.x), ys = cs.map((d) => d.y);
  isola = k; seguito = null; manuale = false; veduta.fT = 0;
  vola(inquadra(Math.min(...xs) - 4, Math.min(...ys) - (k === "Corona" ? 13 : 8), Math.max(...xs) + 4, Math.max(...ys) + 4.5, Zmax), 2.6);
  contenitore.classList.add("dio-isola"); box.querySelector(".dio-titolo b").textContent = nomeIsola(k);
  box.querySelector(".dio-strada").style.display = VEDUTE[k] ? "" : "none";
  disponiPresto();
}
function esciIsola(zitto) { if (!isola) return; isola = null; veduta.fT = 0; contenitore.classList.remove("dio-isola"); if (!zitto) { manuale = false; vola(ARC, 2.6); } disponiPresto(); sporco = true; }
async function scendiInStrada() {
  if (!isola || !VEDUTE[isola]) return; const k = isola, n = VEDUTE[k];
  try { if (!veduta.cache[k]) veduta.cache[k] = await creaVeduta("img/" + n + ".jpg", "img/prof/" + n + ".webp", renderer); } catch (e) { console.warn("Diorama: la veduta di " + k + " non si carica.", e); return; }
  if (isola !== k) return; veduta.scena = veduta.cache[k]; veduta.nome = k; veduta.fT = 1; sporco = true;
}
function risali() { veduta.fT = 0; sporco = true; }
function aggiornaVeduta(dt) {
  const d = veduta.fT - veduta.f; if (Math.abs(d) < 0.002) { if (veduta.f !== veduta.fT) { veduta.f = veduta.fT; contenitore.classList.toggle("dio-veduta", veduta.f > 0.5); return true; } return false; }
  veduta.f += d * Math.min(1, dt * 3); contenitore.classList.toggle("dio-veduta", veduta.f > 0.5); return true;
}

// ---------------------------------------------------------------- lo strato HTML del diorama: nomi delle isole, targhe delle auto, titolo dell'isola
let chips = [];
function creaStratoHtml() {
  box = document.createElement("div"); box.className = "dio-strato";
  box.innerHTML = `<div class="dio-nomi"></div><div class="dio-targhe"></div><div class="dio-titolo"><b></b><span><button class="dio-su" title="Torna a vedere tutta la Laguna">⟵ Arcipelago</button><button class="dio-strada" title="Scendi a guardare l'isola dalla strada (solo da guardare: qui non ci sono le caselle)">Scendi in strada</button><button class="dio-risali" title="Torna sopra l'isola, dove ci sono le caselle">⟵ Torna sopra l'isola</button></span></div>`;
  contenitore.appendChild(box);
  box.querySelector(".dio-su").onclick = () => { esciIsola(); if (modo === "segui") seguito = null; };
  box.querySelector(".dio-strada").onclick = scendiInStrada; box.querySelector(".dio-risali").onclick = risali;
}
const POS_NOMI = { Ambra: [22, 55], Palma: [21, 22], Flamingo: [78, 20.5], Sole: [71.5, 56], Corona: [51, 59] };
function creaNomiIsole() {
  const dove = box.querySelector(".dio-nomi"); dove.innerHTML = ""; chips = [];
  for (const k of Object.keys(centriIsola)) {
    const p = POS_NOMI[k] || [centriIsola[k].x, centriIsola[k].y - 8];
    const el = document.createElement("button"); el.className = "dio-nome"; el.textContent = nomeIsola(k); el.title = "Vola dentro " + nomeIsola(k); el.onclick = () => entraIsola(k);
    dove.appendChild(el); const w = R.suolo(p[0], p[1]); w.y += 1.5; chips.push({ el, w, k, s: { x: 0, y: 0, ok: false }, larg: 0 });
  }
}

// ---------------------------------------------------------------- le etichette: poche, mai una sopra l'altra
// Gli elementi sono quelli che scrive gioco.js dentro #mappa (.cas, .ped, .etichetta...). Qui si decide chi si vede e dove.
let oss = null, elCas = new Map(), elPed = new Map(), elEti = null, elAltri = [], sopra = null, toccata = null, toccataFino = 0, etiVisibili = 0, etiPresto = false;
function osserva() {
  oss = new MutationObserver((ms) => {
    let figli = false; for (const m of ms) if (m.type === "childList" && m.target === strato) figli = true;
    if (figli) { leggiElementi(); if (pronto) disponi(); }
    sporco = true;                                                    // una pedina ha cambiato casella (data-pos) o il tabellone e' stato riscritto
  });
  oss.observe(strato, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-pos"] });
  leggiElementi();
}
function leggiElementi() {
  elCas = new Map(); elPed = new Map(); elEti = null; elAltri = [];
  for (const el of strato.children) {
    if (el.classList.contains("cas")) elCas.set(el.dataset.cas, el);
    else if (el.classList.contains("ped")) elPed.set(el.dataset.id, el);
    else if (el.classList.contains("etichetta")) elEti = el;
    else if (el.tagName !== "svg" && !/isola-nome|edificio|torre/.test(el.className) && !isNaN(parseFloat(el.style.left))) elAltri.push(el);
  }
  aggiornaTarghe();
}
function aggiornaTarghe() {
  if (!box) return; const dove = box.querySelector(".dio-targhe");
  for (const [id, ped] of pedine) {
    const el = elPed.get(id), nome = el ? el.title : "";
    if (!ped.tag) { ped.tag = document.createElement("div"); ped.tag.className = "dio-targa" + (id === mioId ? " io" : ""); dove.appendChild(ped.tag); }
    if (ped.nome !== nome) { ped.nome = nome; ped.tag.innerHTML = `<i style="background:${ped.colore}"></i>`; ped.tag.appendChild(document.createTextNode(nome.slice(0, 12))); ped.largTag = 0; }
  }
}
function disponiPresto() { if (etiPresto) return; etiPresto = true; Promise.resolve().then(() => { etiPresto = false; if (pronto) disponi(); }); }
const occ = [];
function libero(x0, y0, x1, y1) { for (const o of occ) if (x0 < o[2] && o[0] < x1 && y0 < o[3] && o[1] < y1) return false; return true; }
function mostra(el, cx, cy, larg, alt, s, z, forza) {
  const x0 = cx - larg * s / 2 - 2, y0 = cy - alt * s / 2 - 2, x1 = cx + larg * s / 2 + 2, y1 = cy + alt * s / 2 + 2;
  if (!forza && !libero(x0, y0, x1, y1)) return false;
  occ.push([x0, y0, x1, y1]);
  el.style.translate = `${(cx - parseFloat(el.style.left) / 100 * W).toFixed(1)}px ${(cy - parseFloat(el.style.top) / 100 * H).toFixed(1)}px`;
  el.style.scale = s.toFixed(3); el.style.zIndex = String(z); el.style.visibility = "visible"; etiVisibili++;
  return true;
}
const sp = { x: 0, y: 0, ok: false };
function disponi() {
  if (!pronto || !nCas) return;
  camera.updateMatrixWorld();
  const passo = 61 * V.Z * H / FH, inVeduta = veduta.f > 0.5, ora = performance.now();
  occ.length = 0; etiVisibili = 0;
  for (const d of dati) proietta(d.w, d.s);
  // 1. le targhe con il nome sopra le auto
  aggiornaTarghe();
  let fila = 0;
  for (const [id, ped] of pedine) {
    const t = ped.tag; if (!t) continue;
    v3.copy(ped.g.position); v3.y += ped.g.scale.x * 0.5; proietta(v3, ped.s);
    const vis = ped.g.visible && ped.s.ok && !inVeduta && !!ped.nome;
    t.style.display = vis ? "" : "none"; if (!vis) continue;
    if (!ped.largTag) ped.largTag = t.offsetWidth || 60;
    let y = ped.s.y - 15 - Math.min(26, passo * 0.26); const x = ped.s.x;
    while (!libero(x - ped.largTag / 2, y - 11, x + ped.largTag / 2, y + 11) && fila++ < 6) y -= 23;
    occ.push([x - ped.largTag / 2, y - 11, x + ped.largTag / 2, y + 11]);
    t.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  }
  // 2. i nomi delle isole (si toccano per volarci dentro)
  for (const c of chips) {
    proietta(c.w, c.s); const vis = c.s.ok && !isola && !inVeduta && V.Z < ARC.Z * 2.4;
    c.el.style.display = vis ? "" : "none"; if (!vis) continue;
    if (!c.larg) c.larg = c.el.offsetWidth || 120;
    c.el.style.translate = `${c.s.x.toFixed(1)}px ${c.s.y.toFixed(1)}px`; occ.push([c.s.x - c.larg / 2, c.s.y - 15, c.s.x + c.larg / 2, c.s.y + 15]);
  }
  // 3. le caselle: prima quella dove sei, poi quella toccata, poi i prezzi dei terreni liberi vicini, poi (da vicino) i posti speciali
  for (const el of elCas.values()) { if (el.style.visibility) el.style.visibility = ""; el.classList.remove("dio-nome"); }
  if (toccata && ora > toccataFino) toccata = null;
  const io = pedine.get(mioId), qui = io ? Math.round(io.meta) % nCas : -1, cand = [], soloMiei = dati.some((d) => d.c.spento);
  if (!inVeduta) for (const d of dati) {
    const el = elCas.get(d.id), c = d.c; if (!el || !d.s.ok) continue;
    const libera = c.terreno && !c.proprietario, avanti = qui < 0 ? 99 : ((d.idx - qui) % nCas + nCas) % nCas, scelta = d.id === toccata || d.id === sopra;
    let pr = -1;
    if (scelta) pr = 95;
    else if (soloMiei) pr = c.mio ? 70 : -1;
    else if (libera && avanti >= 1 && avanti <= 12) pr = 80 - avanti;
    else if (isola && d.isola === isola && (libera || !c.terreno)) pr = 60;
    else if (passo >= 54 && (libera || !c.terreno)) pr = (c.terreno ? 40 : 46) - Math.hypot(d.s.x - W / 2, d.s.y - H / 2) / 60;
    else if (c.tipo === "angolo" && passo >= 30) pr = 30;
    if (pr >= 0) cand.push({ d, el, pr, scelta, nome: scelta || soloMiei && c.mio || isola && d.isola === isola && !c.terreno && passo >= 70 });
  }
  if (elEti) {                                                        // il nome della casella dove sei, sotto la piazzola
    const d = qui >= 0 ? dati[qui] : null, vis = d && d.s.ok && !inVeduta && !(io && io.inMoto);
    if (vis) { const l = (elEti.textContent.length * 4.2 + 30), y = d.s.y + Math.max(14, passo * 0.2) + 20; mostra(elEti, d.s.x, y, l, 40, 1, 40, true); } else elEti.style.visibility = "hidden";
  }
  cand.sort((a, b) => b.pr - a.pr);
  const sc = clamp(passo / 74, 0.6, 1);
  for (const k of cand) {
    const { d, el } = k, c = d.c, terr = c.terreno, s = terr ? sc : sc * (c.tipo === "angolo" ? 0.72 : 0.8);
    let larg = terr ? 48 : c.tipo === "angolo" ? 52 : 44, alt = terr ? 32 : larg, y = d.s.y - 8 - passo * (terr ? 0.3 : 0.34);
    if (k.nome) { el.classList.add("dio-nome"); const cn = el.querySelector(".cn"); larg = Math.max(larg, (cn ? cn.textContent.length : 8) * 7.4 + 16); alt += 24; y += 10; }
    mostra(el, d.s.x, y, larg, alt, k.scelta ? Math.max(s, 0.85) : s, Math.round(k.pr) + 10, false);
  }
  // 4. altre cose scritte da gioco.js sulla mappa (i luoghi della notte, se mai si vedessero): al loro posto sulla foto
  for (const el of elAltri) { proietta(R.suolo(parseFloat(el.style.left), parseFloat(el.style.top), pw), sp); if (sp.ok && !inVeduta) { el.style.translate = `${(sp.x - parseFloat(el.style.left) / 100 * W).toFixed(1)}px ${(sp.y - parseFloat(el.style.top) / 100 * H).toFixed(1)}px`; el.style.visibility = "visible"; } else el.style.visibility = "hidden"; }
}
// la casella piu' vicina a un punto dello schermo
function casellaA(x, y) {
  const passo = 61 * V.Z * H / FH, r = clamp(passo * 0.55, 16, 44); let meglio = null, dm = r;
  for (const d of dati) { if (!d.s.ok) continue; const k = Math.hypot(d.s.x - x, (d.s.y - y) * 1.5); if (k < dm) { dm = k; meglio = d; } }
  return meglio;
}

// ---------------------------------------------------------------- i gesti: trascina, rotella, pizzico, tocco
function collegaGesti() {
  const dita = new Map(); let presa = null, pizzico = null, trascinato = false, giu = null;
  const bersaglio = () => ({ x: V.xT, y: V.yT, Z: V.ZT });
  const zoomSu = (f, sx, sy) => { if (veduta.f > 0.5) return; manuale = true; const g = fotoSotto(sx, sy, bersaglio()); const Z = clamp(V.ZT * f, Zmin, Zmax); const v = centroPer(g.x, g.y, sx, sy, Z); V.xT = v.x; V.yT = v.y; V.ZT = Z; V.vel = 12; stringi(); sporco = true; };
  tela.addEventListener("pointerdown", (e) => {
    dita.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { tela.setPointerCapture(e.pointerId); } catch (er) { }
    if (dita.size === 1) { giu = { x: e.clientX, y: e.clientY }; trascinato = false; presa = pronto ? fotoSotto(e.clientX, e.clientY, bersaglio()).clone() : null; pizzico = null; }
    else if (dita.size === 2) { const [a, b] = [...dita.values()]; pizzico = { d: Math.hypot(a.x - b.x, a.y - b.y), Z: V.ZT }; trascinato = true; }
  });
  tela.addEventListener("pointermove", (e) => {
    if (!dita.has(e.pointerId)) { if (e.pointerType === "mouse") passaSopra(e.clientX, e.clientY); return; }
    dita.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (!pronto) return;
    if (pizzico && dita.size === 2) { const [a, b] = [...dita.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); zoomSu(pizzico.Z * d / pizzico.d / V.ZT, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
    if (!giu || !presa) return;
    if (!trascinato && Math.hypot(e.clientX - giu.x, e.clientY - giu.y) < 6) return;
    trascinato = true; if (veduta.f > 0.5) return;
    manuale = true; const v = centroPer(presa.x, presa.y, e.clientX, e.clientY, V.ZT); V.xT = v.x; V.yT = v.y; V.vel = 30; stringi(); sporco = true; tela.style.cursor = "grabbing";
  });
  const su = (e) => {
    const era = dita.has(e.pointerId); dita.delete(e.pointerId); tela.style.cursor = "";
    if (era && !trascinato && giu && e.type === "pointerup" && pronto) tocco(e.clientX, e.clientY);
    if (!dita.size) { presa = null; pizzico = null; } else if (dita.size === 1) { const [a] = [...dita.values()]; giu = { x: a.x, y: a.y }; presa = fotoSotto(a.x, a.y, bersaglio()).clone(); pizzico = null; }
  };
  tela.addEventListener("pointerup", su); tela.addEventListener("pointercancel", su);
  tela.addEventListener("pointerleave", () => { if (sopra) { sopra = null; disponiPresto(); } });
  // rotella del mouse = zoom; due dita sul trackpad = spostarsi; pizzico = zoom
  tela.addEventListener("wheel", (e) => {
    e.preventDefault(); if (!pronto) return;
    const rotella = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
    if (e.ctrlKey) zoomSu(Math.pow(1.012, -e.deltaY), e.clientX, e.clientY);
    else if (rotella) zoomSu(Math.pow(1.0018, -e.deltaY * (e.deltaMode === 1 ? 33 : 1)), e.clientX, e.clientY);
    else if (V.ZT > Zmin * 1.02) sposta(e.deltaX, e.deltaY); else zoomSu(Math.pow(1.004, -e.deltaY), e.clientX, e.clientY);
  }, { passive: false });
  let gz = 1;                                                        // Safari: il pizzico arriva come "gesture"
  tela.addEventListener("gesturestart", (e) => { e.preventDefault(); gz = V.ZT; });
  tela.addEventListener("gesturechange", (e) => { e.preventDefault(); zoomSu(gz * e.scale / V.ZT, e.clientX || W / 2, e.clientY || H / 2); });
  tela.addEventListener("dblclick", (e) => zoomSu(1.7, e.clientX, e.clientY));
  addEventListener("mousemove", (e) => { if (!pronto) return; par.xT = e.clientX / W * 2 - 1; par.yT = e.clientY / H * 2 - 1; if (veduta.scena) veduta.scena.punta(par.xT, par.yT); sporco = true; });
  addEventListener("keydown", (e) => {
    if (!pronto || fermo() || e.target.closest && e.target.closest("input,textarea,select") || document.querySelector(".velo:not(.laterale),#guida")) return;
    if (e.key === "+" || e.key === "=") zoomSu(1.3, W / 2, H / 2); else if (e.key === "-") zoomSu(1 / 1.3, W / 2, H / 2);
    else if (e.key === "ArrowLeft") sposta(-90, 0); else if (e.key === "ArrowRight") sposta(90, 0); else if (e.key === "ArrowUp") sposta(0, -90); else if (e.key === "ArrowDown") sposta(0, 90);
    else if (e.key === "Escape" && isola) esciIsola();
  });
}
function passaSopra(x, y) { if (!pronto || veduta.f > 0.5) return; const d = casellaA(x, y), id = d ? d.id : null; tela.style.cursor = d ? "pointer" : ""; if (id !== sopra) { sopra = id; disponi(); } }
function tocco(x, y) {
  if (veduta.f > 0.5) return;
  const d = casellaA(x, y); if (!d) return;
  toccata = d.id; toccataFino = performance.now() + 6000; accendiFuoco(d, d.c.proprietario || "#ffd98a", 3200); disponi();
  if (suCasellaCb) suCasellaCb(d.id, x, y);
}

// ---------------------------------------------------------------- ogni fotogramma (si disegna solo se serve)
let tempo = 0, tPrima = 0, tDisegno = 0, tLento = 0, lenti = 0;
const conta = { chiamate: 0, triangoli: 0, fotogrammi: 0, ms: 0 };
const fermo = () => document.hidden || !contenitore || contenitore.style.display === "none";
const ultima = { x: 0, y: 0, Z: 0, px: 0, py: 0 };
function ciclo(ora) {
  if (!attivo) return; raf = requestAnimationFrame(ciclo);
  const dt = Math.min(0.2, (ora - tPrima) / 1000 || 0.016); tPrima = ora;
  if (!pronto || fermo()) return;
  tempo = ora / 1000;
  let serve = sporco; sporco = false;
  if (muoviPedine(dt, ora)) serve = true;
  if (aggiornaNotte(ora)) serve = true;
  if (aggiornaFuoco(ora)) serve = true;
  if (aggiornaVeduta(dt)) serve = true;
  if (Math.abs(V.xT - V.x) + Math.abs(V.yT - V.y) > 0.004 / V.Z || Math.abs(Math.log(V.ZT / V.Z)) > 0.0006 || Math.abs(par.xT - par.x) + Math.abs(par.yT - par.y) > 0.002) serve = true;
  if (veduta.f > 0.01 && veduta.scena && !veduta.scena.fermo()) serve = true;
  // da fermi si ridisegna solo per il mare (una ventina di volte al secondo); in movimento sempre
  if (!serve && ora - tDisegno < (calmo ? 250 : 48)) return;
  const t0 = performance.now();
  R.tempo(tempo); aggiornaCamera(dt);
  renderer.info.reset();
  if (veduta.f < 0.995) renderer.render(scena, camera);
  if (veduta.f > 0.004 && veduta.scena) { const k = THREE.MathUtils.smoothstep(veduta.f, 0.05, 1); veduta.scena.U.uA.value = k; veduta.scena.U.uNotte.value = notte; veduta.scena.aggiorna(dt, tempo, aspetto, 1 - k); renderer.autoClear = false; renderer.render(veduta.scena.scena, veduta.scena.camera); renderer.autoClear = true; }
  conta.chiamate = renderer.info.render.calls; conta.triangoli = renderer.info.render.triangles; conta.fotogrammi++; tDisegno = ora;
  if (!primoFrame) { primoFrame = true; contenitore.classList.add("dio-pronto"); }
  // le etichette si risistemano solo se la visuale o le pedine si sono mosse davvero
  if (serve || Math.abs(ultima.x - V.x) + Math.abs(ultima.y - V.y) > 0.01 / V.Z || Math.abs(ultima.Z - V.Z) > 0.0008 || Math.abs(ultima.px - camera.position.x) + Math.abs(ultima.py - camera.position.y) > 0.12) { ultima.x = V.x; ultima.y = V.y; ultima.Z = V.Z; ultima.px = camera.position.x; ultima.py = camera.position.y; disponi(); }
  // se il computer fatica (fotogrammi lenti di fila) si abbassa la definizione, mai sotto 1
  const ms = performance.now() - t0; conta.ms += (ms - conta.ms) * 0.1;
  if (serve && dt > 0.034) { if (++lenti > 45 && rapporto > 1 && ora - tLento > 4000) { rapporto = Math.max(1, rapporto - 0.25); renderer.setPixelRatio(rapporto); renderer.setSize(W, H, false); tLento = ora; lenti = 0; sporco = true; } } else if (lenti > 0) lenti--;
}
// numeri per le prove: chiamate di disegno e triangoli dell'ultimo fotogramma, etichette visibili, visuale
export function misure() { return { pronto, chiamate: conta.chiamate, triangoli: conta.triangoli, fotogrammi: conta.fotogrammi, msCpu: +conta.ms.toFixed(2), rapporto, etichette: etiVisibili, modo, isola, Z: +V.Z.toFixed(3), x: +V.x.toFixed(2), y: +V.y.toFixed(2), Zarc: +ARC.Z.toFixed(3), notte: +notte.toFixed(2), veduta: +veduta.f.toFixed(2), caselle: nCas, edifici: edifici.length, triEdifici: meshEdifici && meshEdifici.geometry.index ? meshEdifici.geometry.index.count / 3 : 0 }; }
export function diagnosi() { return dati.map((d) => ({ idx: d.idx, tipo: d.c.tipo, q: +d.q.toFixed(1), grezza: +d.grezza.toFixed(1), sp: Math.round(d.sp), u: +d.u.toFixed(1), sx: Math.round(d.s.x), sy: Math.round(d.s.y), ok: d.s.ok })); }
