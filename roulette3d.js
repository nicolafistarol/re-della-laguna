// =====================================================================
// RE DELLA LAGUNA — la ruota della roulette in 3D (v97)
// Una ruota europea vera (37 caselle nell'ordine giusto), in legno e ottone, con la pallina
// che corre sul bordo al contrario della ruota, rallenta, scende, rimbalza sui diamanti e sulle
// caselle e si ferma nel numero uscito. Il numero lo decide il server: qui si anima e basta.
//   const r = creaRuota(contenitore, { suono })   r.lancia()   r.ferma(n, fatto)   r.chiudi()
// =====================================================================
import * as THREE from "three";

export const ORDINE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const ROSSI = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const TAU = Math.PI * 2, SETT = TAU / 37;
const R_NUM_EST = 1.12, R_NUM_INT = 0.97, R_TASCA = 0.885, R_TASCA_INT = 0.76, R_PISTA = 1.37, R_PALLA = 0.042;
const colore = (n) => n === 0 ? "#12844a" : ROSSI.includes(n) ? "#b3202a" : "#141416";

// angolo (nel riferimento della ruota) del centro della casella del numero n
const angoloNumero = (n) => ORDINE.indexOf(n) * SETT;
// punto in 3D da angolo e raggio: angolo misurato da +X verso -Z (come RingGeometry girata in piano)
const punto = (a, r, y) => new THREE.Vector3(r * Math.cos(a), y, -r * Math.sin(a));

function texturaNumeri() {
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d"), cx = S / 2, k = S / 2 / R_NUM_EST;
  for (let i = 0; i < 37; i++) {
    const n = ORDINE[i], a0 = i * SETT - SETT / 2, a1 = a0 + SETT;
    // nel canvas la y va in giu': l'angolo 3D a corrisponde a -a
    g.beginPath(); g.arc(cx, cx, R_NUM_EST * k, -a0, -a1, true); g.arc(cx, cx, R_TASCA_INT * k, -a1, -a0, false); g.closePath();
    g.fillStyle = colore(n); g.fill();
    // il fondo della tasca un po' piu' scuro
    g.beginPath(); g.arc(cx, cx, R_NUM_INT * k, -a0, -a1, true); g.arc(cx, cx, R_TASCA_INT * k, -a1, -a0, false); g.closePath();
    g.fillStyle = "rgba(0,0,0,.35)"; g.fill();
    const am = i * SETT, rr = (R_NUM_EST + R_NUM_INT) / 2 * k;
    g.save(); g.translate(cx + rr * Math.cos(am), cx - rr * Math.sin(am)); g.rotate(Math.PI / 2 - am);
    g.fillStyle = "#f6ecd2"; g.font = "800 40px Manrope, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 0, 2); g.restore();
  }
  // filetti d'oro tra numeri e tasche
  g.strokeStyle = "#d9b45a"; g.lineWidth = 4;
  for (const r of [R_NUM_EST, R_NUM_INT]) { g.beginPath(); g.arc(cx, cx, r * k - 2, 0, TAU); g.stroke(); }
  for (let i = 0; i < 37; i++) { const a = i * SETT - SETT / 2; g.beginPath(); g.moveTo(cx + R_NUM_INT * k * Math.cos(a), cx - R_NUM_INT * k * Math.sin(a)); g.lineTo(cx + R_NUM_EST * k * Math.cos(a), cx - R_NUM_EST * k * Math.sin(a)); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function texturaLegno(base, venatura) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 64; const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 70; i++) { g.strokeStyle = venatura; g.globalAlpha = 0.08 + Math.random() * 0.12; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * 64; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 40 + i) * 3); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1); return t;
}
// un ambiente semplice per i riflessi dell'ottone (lampade calde sopra un tavolo verde)
function ambiente(renderer) {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: 0x241509, side: THREE.BackSide })));
  const lampada = (x, y, z, s, col) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
  lampada(0, 6, 0, 5, 0xfff1d0); lampada(5, 3, 3, 2.5, 0xffc77a); lampada(-5, 2, -2, 2.5, 0xffe2b0); lampada(0, -4, 0, 8, 0x0d4a2c);
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(sc, 0.03).texture; pm.dispose(); return env;
}

export function creaRuota(box, opz = {}) {
  const suono = opz.suono || {};
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  box.appendChild(renderer.domElement);
  const scena = new THREE.Scene(); scena.environment = ambiente(renderer);
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  cam.position.set(0, 4.1, 3.0); cam.lookAt(0, -0.05, 0.12);

  // luci: una lampada sopra il tavolo che fa ombra, e una calda di lato
  scena.add(new THREE.HemisphereLight(0xfff2dc, 0x0a2216, 0.55));
  const spot = new THREE.SpotLight(0xfff0d6, 38, 14, 0.55, 0.5, 1.6); spot.position.set(0.6, 5, 1.2); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004; scena.add(spot); scena.add(spot.target);
  const lato = new THREE.DirectionalLight(0xffc98a, 0.9); lato.position.set(-3, 2, 2); scena.add(lato);

  // il tavolo verde sotto la ruota
  const panno = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ color: 0x0f5133, roughness: 0.95 }));
  panno.rotation.x = -Math.PI / 2; panno.position.y = -0.32; panno.receiveShadow = true; scena.add(panno);

  // la conca fissa: bordo di mogano, pista lucida dove corre la pallina, scivolo verso il centro
  const legnoScuro = new THREE.MeshStandardMaterial({ map: texturaLegno("#4a2312", "#1d0b04"), roughness: 0.45, metalness: 0.05 });
  const legnoPista = new THREE.MeshStandardMaterial({ map: texturaLegno("#7a4422", "#3a1a08"), roughness: 0.22, metalness: 0.05 });
  const prof = (pts) => pts.map(([r, y]) => new THREE.Vector2(r, y));
  const bordo = new THREE.Mesh(new THREE.LatheGeometry(prof([[1.48, 0.18], [1.62, 0.22], [1.72, 0.2], [1.78, 0.05], [1.8, -0.3]]), 96), legnoScuro);
  const pista = new THREE.Mesh(new THREE.LatheGeometry(prof([[1.16, 0.035], [1.3, 0.09], [1.43, 0.16], [1.48, 0.2], [1.48, 0.18]]), 96), legnoPista);
  bordo.castShadow = bordo.receiveShadow = true; pista.receiveShadow = true; scena.add(bordo, pista);
  const fondo = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.02, 64), legnoScuro); fondo.position.y = -0.3; scena.add(fondo);
  const ottone = new THREE.MeshStandardMaterial({ color: 0xd9b45a, metalness: 1, roughness: 0.25 });
  const anello = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.012, 8, 128), ottone); anello.rotation.x = Math.PI / 2; anello.position.y = 0.2; scena.add(anello);
  // i diamanti (deviatori) sulla pista
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + TAU / 16, d = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), ottone);
    d.scale.set(1.6, 0.6, 0.8); d.position.copy(punto(a, 1.27, 0.09)); d.rotation.y = a; d.castShadow = true; scena.add(d);
  }

  // il rotore che gira: numeri e tasche, separatori, cono centrale, torretta
  const rotore = new THREE.Group(); scena.add(rotore);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(R_NUM_EST, 148), new THREE.MeshStandardMaterial({ map: texturaNumeri(), roughness: 0.35, metalness: 0.05 }));
  disco.rotation.x = -Math.PI / 2; disco.position.y = 0.02; disco.receiveShadow = true; rotore.add(disco);
  const mSep = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, metalness: 1, roughness: 0.18 });
  for (let i = 0; i < 37; i++) {
    const a = i * SETT - SETT / 2, s = new THREE.Mesh(new THREE.BoxGeometry(R_NUM_INT - R_TASCA_INT + 0.02, 0.05, 0.012), mSep);
    s.position.copy(punto(a, (R_NUM_INT + R_TASCA_INT) / 2, 0.045)); s.rotation.y = a; s.castShadow = true; rotore.add(s);
  }
  const cono = new THREE.Mesh(new THREE.CylinderGeometry(0.34, R_TASCA_INT, 0.2, 64), new THREE.MeshStandardMaterial({ map: texturaLegno("#6b3a1c", "#2d1407"), roughness: 0.3 }));
  cono.position.y = 0.12; cono.castShadow = cono.receiveShadow = true; rotore.add(cono);
  const piatto = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.03, 48), ottone); piatto.position.y = 0.235; rotore.add(piatto);
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.32, 24), ottone); torre.position.y = 0.38; torre.castShadow = true; rotore.add(torre);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 12), ottone); b.rotation.z = Math.PI / 2; b.rotation.y = i * Math.PI / 4; b.position.y = 0.46; rotore.add(b);
  }
  for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), ottone); p.position.copy(punto(i * Math.PI / 2, 0.21, 0.46)); p.castShadow = true; rotore.add(p); }
  const cima = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), ottone); cima.position.y = 0.56; rotore.add(cima);

  // la pallina d'avorio
  const palla = new THREE.Mesh(new THREE.SphereGeometry(R_PALLA, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xfffdf6, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }));
  palla.castShadow = true; scena.add(palla);

  // ---- il movimento
  const W_ROTORE = 0.75;               // la ruota gira sempre piano, in senso antiorario
  let rho = Math.random() * TAU;       // angolo della ruota
  let stato = "ferma", n0 = ORDINE[Math.floor(Math.random() * 37)];
  let th = 0, w = 0, tLancio = 0;      // pallina: angolo, velocita' angolare
  let F = null;                        // la discesa verso il numero: { t0, D, th0, w0, thE, n, fatto, clic }
  let vivo = true, tPrima = performance.now() / 1000;
  const yPista = (r) => r >= 1.16 ? 0.035 + (r - 1.16) / (1.48 - 1.16) * 0.165 : 0.02;

  function hermite(s, p0, m0, p1, m1) { const s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * m1; }
  function lancia() {
    stato = "corre"; tLancio = performance.now() / 1000; F = null;
    th = rho + angoloNumero(n0) + Math.PI; w = -11.5; // la pallina parte forte, contro il verso della ruota
    if (suono.lancio) suono.lancio();
  }
  function ferma(n, fatto) {
    if (stato === "ferma") lancia();
    const t = performance.now() / 1000, D = 5.2 + Math.random() * 0.8;
    // dove sara' la casella del numero quando la pallina ci arriva
    const rhoE = rho + W_ROTORE * D, base = rhoE + angoloNumero(n);
    // quanta strada fa la pallina rallentando: circa meta' della velocita' per il tempo
    const voglio = th + w * D * 0.42;
    const k = Math.round((voglio - base) / TAU), thE = base + k * TAU;
    F = { t0: t, D, th0: th, w0: w, thE, n, fatto, clic: 0, prossimoClic: 0.6 };
  }
  function passo(t, dt) {
    rho += W_ROTORE * dt; rotore.rotation.y = rho;
    let r = R_PISTA, y, a;
    if (stato === "ferma") { a = rho + angoloNumero(n0); r = R_TASCA; y = 0.02 + R_PALLA; }
    else if (stato === "corre" && !F) {
      // corre sul bordo finche' non arriva il numero dal server (rallenta piano, non si ferma mai)
      w += (-6.5 - w) * Math.min(1, dt * 0.35); th += w * dt; a = th; y = yPista(r) + R_PALLA * 0.9;
      if (suono.rotola) suono.rotola(Math.abs(w) / 11.5);
    } else {
      const s = Math.min(1, (t - F.t0) / F.D);
      // posizione lungo la corsa: parte con la sua velocita', finisce ferma nella casella (che gira con la ruota)
      th = hermite(s, F.th0, F.w0 * F.D, F.thE, W_ROTORE * F.D);
      // i colpi sui diamanti e sui separatori: piccoli scarti che si annullano alla fine
      const scarto = (s > 0.45 && s < 0.92) ? Math.sin((s - 0.45) / 0.47 * Math.PI * 5) * 0.18 * Math.sin((s - 0.45) / 0.47 * Math.PI) : 0;
      a = th + scarto;
      let salto = 0;
      if (s < 0.45) { r = R_PISTA - s * 0.08; }
      else if (s < 0.6) { const q = (s - 0.45) / 0.15; r = R_PISTA - 0.036 - q * q * (R_PISTA - 0.036 - 1.0); }
      else if (s < 0.93) { const q = (s - 0.6) / 0.33; r = 1.0 - (1.0 - R_TASCA) * Math.min(1, q * 1.4); salto = Math.abs(Math.sin(q * Math.PI * 4.5)) * 0.11 * Math.pow(1 - q, 1.6); }
      else r = R_TASCA;
      y = (r > R_NUM_EST ? yPista(r) : r > R_NUM_INT ? 0.03 : 0.02) + R_PALLA + salto;
      if (suono.rotola) suono.rotola(s < 0.6 ? Math.max(0.15, (1 - s) * 0.8) : 0);
      // il tic-tac dei rimbalzi, sempre piu' radi
      if (s >= F.prossimoClic && s < 0.95) { if (suono.clic) suono.clic(1 - s); F.clic++; F.prossimoClic = s + 0.035 + F.clic * 0.006; }
      if (s >= 1) { stato = "ferma"; n0 = F.n; const f = F.fatto; F = null; if (suono.rotola) suono.rotola(0); if (suono.dentro) suono.dentro(); if (f) setTimeout(f, 350); }
    }
    palla.position.copy(punto(a, r, y));
    palla.rotation.z -= dt * 8;
  }
  function misura() {
    const w0 = box.clientWidth || 300, h0 = box.clientHeight || 220;
    renderer.setSize(w0, h0, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
    cam.aspect = w0 / h0; cam.fov = w0 / h0 < 1.2 ? 40 : 34; cam.updateProjectionMatrix();
  }
  misura();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(misura) : null; if (ro) ro.observe(box);
  function giro() {
    if (!vivo) return;
    const t = performance.now() / 1000, dt = Math.min(0.05, t - tPrima); tPrima = t;
    passo(t, dt); renderer.render(scena, cam);
    requestAnimationFrame(giro);
  }
  requestAnimationFrame(giro);
  return {
    lancia, ferma,
    // il server ha rifiutato la puntata: la pallina rallenta e torna nella casella di prima
    annulla() { if (stato === "corre" && !F) ferma(n0, null); },
    inCorsa: () => stato !== "ferma",
    metti(n) { if (stato === "ferma") n0 = n; },
    chiudi() { vivo = false; if (ro) ro.disconnect(); if (suono.rotola) suono.rotola(0); renderer.dispose(); scena.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.domElement.remove(); },
  };
}
