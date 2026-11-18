// =====================================================================
// "FOTO IN RILIEVO" — la foto del tabellone diventa un mondo 3D.
// Ogni punto della foto viene rimesso nello spazio lungo il raggio della
// camera che ha "scattato" la foto, alla distanza stimata da una rete di
// profondita' (Depth Anything V2) e calibrata sul piano del mare.
// Dalla posizione originale si vede ESATTAMENTE la foto; spostando la
// camera si ha parallasse vera (grattacieli e ponti davanti al mare).
// =====================================================================
import * as THREE from "three";

export const HC = 60;                      // altezza della camera originale (unita' mondo)
const ASSE_Y = new THREE.Vector3(0, 1, 0);
const RUMORE = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float rum(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ return rum(p)*.6 + rum(p*2.1+7.3)*.3 + rum(p*4.3+1.7)*.1; }
`;

function carica(url) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; }); }

export async function creaRilievo({ urlFoto, urlGeo, urlJson, urlMare, renderer, qualita = 1 }) {
  const [P, imgGeo] = await Promise.all([fetch(urlJson).then((r) => r.json()), carica(urlGeo)]);
  const GW = P.gw, GH = P.gh;
  const cv = document.createElement("canvas"); cv.width = GW; cv.height = GH;
  const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(imgGeo, 0, 0);
  const px = cx.getImageData(0, 0, GW, GH).data;
  const inv = new Float32Array(GW * GH), acqua = new Float32Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) { inv[i] = P.invMin + ((px[i * 4] * 256 + px[i * 4 + 1]) / 65535) * (P.invMax - P.invMin); acqua[i] = px[i * 4 + 2] / 255; }
  const bil = (arr, u, v) => { const x = Math.min(GW - 1.001, Math.max(0, u * GW - 0.5)), y = Math.min(GH - 1.001, Math.max(0, v * GH - 0.5)); const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0; const a = arr[y0 * GW + x0], b = arr[y0 * GW + x0 + 1], c = arr[(y0 + 1) * GW + x0], d = arr[(y0 + 1) * GW + x0 + 1]; return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy; };
  // vicino ai bordi di profondita' prendo il valore piu' lontano: i "teli" tra primo piano e sfondo restano dietro
  const vic = (u, v) => { const x = Math.min(GW - 1, Math.max(0, Math.round(u * GW - 0.5))), y = Math.min(GH - 1, Math.max(0, Math.round(v * GH - 0.5))); return inv[y * GW + x]; };

  const th = P.theta, ty = Math.tan(THREE.MathUtils.degToRad(P.fov / 2)), tx = ty * 16 / 9;
  const cam0 = new THREE.Vector3(0, HC, 0);
  const avanti = new THREE.Vector3(0, -Math.sin(th), -Math.cos(th)), su = new THREE.Vector3(0, Math.cos(th), -Math.sin(th)), destra = new THREE.Vector3(1, 0, 0);
  const punto = (u, v, iv) => { const X = (u * 2 - 1) * tx, Y = (1 - v * 2) * ty, z = HC / iv; return new THREE.Vector3(cam0.x + z * (X * destra.x + Y * su.x + avanti.x), cam0.y + z * (X * destra.y + Y * su.y + avanti.y), cam0.z + z * (X * destra.z + Y * su.z + avanti.z)); };

  const NX = Math.round(640 * qualita), NY = Math.round(360 * qualita);
  const pos = new Float32Array(NX * NY * 3), uv = new Float32Array(NX * NY * 2);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const u = i / (NX - 1), v = j / (NY - 1), k = j * NX + i;
    const p = punto(u, v, bil(inv, u, v));
    if (p.y < 0) p.y = 0;
    pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v;
  }
  const idx = new Uint32Array((NX - 1) * (NY - 1) * 6); let n = 0;
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeBoundingSphere();

  const L = new THREE.TextureLoader();
  const foto = await L.loadAsync(urlFoto); foto.colorSpace = THREE.SRGBColorSpace; foto.anisotropy = renderer.capabilities.getMaxAnisotropy(); foto.wrapS = foto.wrapT = THREE.ClampToEdgeWrapping;
  const tGeo = new THREE.Texture(imgGeo); tGeo.colorSpace = THREE.NoColorSpace; tGeo.minFilter = THREE.LinearFilter; tGeo.generateMipmaps = false; tGeo.needsUpdate = true;
  const tMare = await L.loadAsync(urlMare); tMare.colorSpace = THREE.SRGBColorSpace; tMare.wrapS = tMare.wrapT = THREE.MirroredRepeatWrapping;

  const U = { uFoto: { value: foto }, uGeo: { value: tGeo }, uMare: { value: tMare }, uT: { value: 0 }, uNotte: { value: 0 }, uCam0: { value: cam0.clone() }, uOnde: { value: 1 }, uE: { value: 0.001 }, uTaglio: { value: 1 },
    uFotoVP: { value: new THREE.Matrix4() }, uCieloAlto: { value: new THREE.Color().setRGB(...P.cieloAlto, THREE.SRGBColorSpace) }, uCieloOriz: { value: new THREE.Color().setRGB(...P.cieloOriz, THREE.SRGBColorSpace) } };
  // matrice della camera della foto (per prolungare il mare fuori dall'inquadratura)
  const camFoto = new THREE.PerspectiveCamera(P.fov, 16 / 9, 1, 5000); camFoto.position.copy(cam0); camFoto.lookAt(cam0.clone().add(avanti)); camFoto.updateMatrixWorld(); camFoto.updateProjectionMatrix();
  U.uFotoVP.value.multiplyMatrices(camFoto.projectionMatrix, camFoto.matrixWorldInverse);

  const NOTTE = `
  vec3 diNotte(vec3 c, float acqua, float cielo, vec2 uv, float n){
    float l = dot(c, vec3(.3,.59,.11));
    vec3 buio = mix(vec3(l), c, .55) * vec3(.16,.24,.46) * 1.15;          // blu notte, conserva un po' di colore
    buio = mix(buio, vec3(.012,.02,.06) + c*vec3(.05,.07,.16), cielo);     // cielo scuro
    float alto = max(c.r, max(c.g, c.b));
    float luce = smoothstep(.62, .95, alto) * (1.-acqua) * (1.-cielo);     // finestre e lampioni: le parti chiare della terra
    float tremolio = .75 + .25*h21(floor(uv*vec2(2048.,1152.)/3.));
    buio += vec3(1.,.74,.42) * luce * 1.25 * tremolio;
    buio += c * vec3(.9,.75,.5) * smoothstep(.45,.8,alto) * (1.-acqua) * (1.-cielo) * .35; // alone caldo delle citta'
    return mix(c, buio, n);
  }`;

  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true,
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `precision highp float; varying vec2 vUv; varying vec3 vW;
      uniform sampler2D uFoto, uGeo; uniform float uT, uNotte, uOnde, uE, uTaglio; uniform vec3 uCam0;
      ${RUMORE} ${NOTTE}
      void main(){
        vec2 un = vec2(vUv.x*1.7778, vUv.y); vec2 ja = dFdx(un), jb = dFdy(un); float tiro = abs(ja.x*jb.y - ja.y*jb.x) / (uE*uE);
        if (uTaglio > .5 && tiro < .07) discard;
        float acqua = texture2D(uGeo, vUv).b;
        float dist = length(vW - uCam0);
        // onde: sposto di pochissimo la foto del mare, cosi' i colori (barriera, bassi fondali) restano quelli veri
        vec2 q = vW.xz * .32;
        vec2 o = vec2(fbm(q + vec2(uT*.35, uT*.22)), fbm(q*1.3 + vec2(-uT*.28, uT*.31) + 9.)) - .5;
        float amp = uOnde * acqua * .0032 * clamp(140./dist, .25, 1.6);
        vec2 uv2 = vUv + o * amp;
        float acqua2 = texture2D(uGeo, uv2).b;
        uv2 = mix(vUv, uv2, step(.6, acqua2));
        vec3 c = texture2D(uFoto, uv2).rgb;
        // riflessi che corrono e scintille del sole
        float cresta = rum(vW.xz*vec2(.9,2.2) + vec2(uT*.9, -uT*.5))*.6 + rum(vW.xz*vec2(2.3,4.1) - vec2(uT*.7, uT*.6))*.4;
        float sc = smoothstep(.55, .8, rum(vW.xz*9. + vec2(uT*2.1, uT*1.6)) * rum(vW.xz*6.3 - vec2(uT*1.7, uT*1.9)) * 1.5) * clamp(260./dist, 0., 1.);
        float versoSole = smoothstep(.75, .0, vUv.x) * smoothstep(.15, .8, vUv.y);       // nella foto il sole e' in alto a sinistra
        c += acqua * uOnde * (vec3(1.,.93,.78) * sc * (.04 + .34*versoSole) * (1.-uNotte*.7) + (cresta-.5) * .035);
        float cielo = smoothstep(${(1 - (0.5 - P.vh / 2)).toFixed(4)} - .02, ${(1 - (0.5 - P.vh / 2)).toFixed(4)} + .01, vUv.y);
        c = diNotte(c, acqua, cielo, vUv, uNotte);
        // i bordi della foto sfumano nel mare e nel cielo che continuano fuori
        float b = smoothstep(0., .035, vUv.x) * smoothstep(0., .035, 1.-vUv.x) * smoothstep(0., .05, vUv.y) * smoothstep(0., .03, 1.-vUv.y);
        gl_FragColor = vec4(c, b * (uTaglio > .5 ? smoothstep(.07, .16, tiro) : 1.));
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;

  // mare che continua fuori dalla foto (stessi colori: campiona un "mare di base" a specchio) e cielo
  const matMare = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `precision highp float; varying vec3 vW; uniform sampler2D uMare; uniform mat4 uFotoVP; uniform float uT, uNotte, uOnde; uniform vec3 uCam0, uCieloOriz;
      ${RUMORE} ${NOTTE}
      void main(){
        vec4 p = uFotoVP * vec4(vW, 1.); vec2 uv = p.xy / max(p.w, 1e-3) * .5 + .5;
        float dietro = step(p.w, 1.);
        uv.y = min(uv.y, ${(1 - (0.5 - P.vh / 2) - 0.03).toFixed(4)});
        vec3 c = texture2D(uMare, uv).rgb;
        float d = length(vW.xz - uCam0.xz);
        vec3 lontano = mix(vec3(.10,.42,.55), uCieloOriz, smoothstep(300., 1500., d));
        c = mix(c, lontano, max(dietro, smoothstep(420., 900., d)));
        float sc = smoothstep(.55, .8, rum(vW.xz*9. + vec2(uT*2.1, uT*1.6)) * rum(vW.xz*6.3 - vec2(uT*1.7, uT*1.9)) * 1.5) * clamp(260./d, 0., 1.);
        c += uOnde * (vec3(1.,.93,.78) * sc * .05 * (1.-uNotte*.7) + (rum(vW.xz*vec2(.9,2.2) + vec2(uT*.9, -uT*.5))*.6 + rum(vW.xz*vec2(2.3,4.1) - vec2(uT*.7, uT*.6))*.4 - .5)*.035) * (1.-smoothstep(200., 700., d));
        c = diNotte(c, 1., smoothstep(900., 1600., d), uv, uNotte);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mare = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), matMare); mare.rotation.x = -Math.PI / 2; mare.position.y = -0.06; mare.renderOrder = 0;
  const matCielo = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: `precision highp float; varying vec3 vD; uniform vec3 uCieloAlto, uCieloOriz; uniform float uNotte;
      void main(){ float h = clamp(vD.y*3.2, 0., 1.); vec3 c = mix(uCieloOriz, uCieloAlto, pow(h,.7)); c = mix(c, vec3(.012,.02,.06) + c*vec3(.05,.07,.16), uNotte); gl_FragColor = vec4(c,1.);
        #include <colorspace_fragment>
      }`,
  });
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 12), matCielo); cielo.position.copy(cam0); cielo.renderOrder = -1;

  const gruppo = new THREE.Group(); gruppo.add(cielo, mare, mesh);
  const bersaglio = cam0.clone().add(avanti.clone().multiplyScalar(HC / Math.sin(th)));   // dove guarda il centro della foto, sul mare
  return {
    gruppo, mesh, U, P, cam0, avanti, su, destra, bersaglio, triangoli: idx.length / 3,
    // punto del mondo che corrisponde a un punto della foto (x,y in % come POS/TRATTI di gioco.js)
    suolo(xPct, yPct) { const u = xPct / 100, v = yPct / 100; const p = punto(u, v, bil(inv, u, v)); if (p.y < 0) p.y = 0; return p; },
    eAcqua(xPct, yPct) { return bil(acqua, xPct / 100, yPct / 100) > 0.5; },
    tempo(t) { U.uT.value = t; }, notte(n) { U.uNotte.value = n; },
  };
}

// ---------------------------------------------------------------------
// Camera "da foto": ruotare lo sguardo e stringere lo zoom NON deformano mai
// (la camera resta nel punto dello scatto). In piu' un piccolo spostamento
// laterale/verticale (parallasse) da' la sensazione di volume.
// ---------------------------------------------------------------------
export function creaCamera(R, dom, { parallasse = 1 } = {}) {
  const camera = new THREE.PerspectiveCamera(R.P.fov, 1, 0.5, 6000);
  const S = { yaw: 0, pitch: 0, zoom: 1, orbita: 0, alza: 0, yawT: 0, pitchT: 0, zoomT: 1, orbT: 0, alzaT: 0, libero: false };
  const hfovFoto = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(R.P.fov / 2)) * 16 / 9);
  let fovBase = R.P.fov, asp = 1;
  function misura(w, h) { asp = w / h; camera.aspect = asp;
    // schermo largo: fov della foto. Schermo stretto (telefono in piedi): fov piu' alto, ma mai oltre i bordi laterali della foto
    fovBase = asp >= 1.5 ? R.P.fov : THREE.MathUtils.clamp(R.P.fov * (1.5 / asp) * 0.62, R.P.fov, 78);
  }
  function limiti() {
    const fov = fovBase / S.zoomT, vf = THREE.MathUtils.degToRad(fov), hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    const my = Math.max(0, (hfovFoto - hf) / 2 + 0.05), mp = Math.max(0, (THREE.MathUtils.degToRad(R.P.fov) - vf) / 2);
    return { my, su: mp + 0.02, giu: mp + 0.10 };
  }
  function stringi() { const l = limiti(); if (S.libero) return; S.yawT = THREE.MathUtils.clamp(S.yawT, -l.my, l.my); S.pitchT = THREE.MathUtils.clamp(S.pitchT, -l.giu, l.su); S.zoomT = THREE.MathUtils.clamp(S.zoomT, 1, 4.5); }
  let giu = null; const dita = new Map(); let pizz = 0;
  dom.addEventListener("pointerdown", (e) => { dita.set(e.pointerId, e); giu = { x: e.clientX, y: e.clientY }; dom.setPointerCapture(e.pointerId); });
  dom.addEventListener("pointermove", (e) => {
    if (!dita.has(e.pointerId)) return; dita.set(e.pointerId, e);
    if (dita.size === 2) { const [a, b] = [...dita.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); if (pizz) S.zoomT *= d / pizz; pizz = d; stringi(); return; }
    const k = THREE.MathUtils.degToRad(fovBase / S.zoom) / dom.clientHeight;
    S.yawT += (e.clientX - giu.x) * k; S.pitchT += (e.clientY - giu.y) * k; giu = { x: e.clientX, y: e.clientY }; stringi();
  });
  const sua = (e) => { dita.delete(e.pointerId); pizz = 0; }; dom.addEventListener("pointerup", sua); dom.addEventListener("pointercancel", sua);
  dom.addEventListener("wheel", (e) => { e.preventDefault(); S.zoomT *= Math.exp(-e.deltaY * 0.0012); stringi(); }, { passive: false });
  function aggiorna(dt) {
    const a = 1 - Math.exp(-dt * 9);
    for (const [k, t] of [["yaw", "yawT"], ["pitch", "pitchT"], ["zoom", "zoomT"], ["orbita", "orbT"], ["alza", "alzaT"]]) S[k] += (S[t] - S[k]) * a;
    camera.fov = fovBase / S.zoom; camera.updateProjectionMatrix();
    R.U.uE.value = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / (Math.tan(THREE.MathUtils.degToRad(R.P.fov / 2)) * dom.height);
    // parallasse: guardando a sinistra la camera scivola un po' a sinistra, attorno al centro della laguna
    const az = S.orbita + parallasse * S.yaw * 0.09 / S.zoom, el = S.alza - parallasse * S.pitch * 0.07 / S.zoom;
    const rel = R.cam0.clone().sub(R.bersaglio); const sf = new THREE.Spherical().setFromVector3(rel);
    sf.theta += az; sf.phi = THREE.MathUtils.clamp(sf.phi - el, 0.12, 1.5);
    camera.position.copy(R.bersaglio).add(new THREE.Vector3().setFromSpherical(sf));
    // sguardo: come la foto, ruotato di yaw/pitch attorno alla camera
    camera.lookAt(R.bersaglio); camera.rotateOnWorldAxis(ASSE_Y, S.yaw); camera.rotateX(S.pitch);
  }
  return { camera, S, misura, aggiorna, stringi, get fovBase() { return fovBase; } };
}
