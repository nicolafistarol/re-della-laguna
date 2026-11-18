// =====================================================================
// RE DELLA LAGUNA — il mondo del diorama: la foto del tabellone in rilievo
// Ogni punto della foto viene rimesso nello spazio lungo il raggio della
// camera che ha "scattato" la foto, alla distanza data da una mappa di
// profondita' (img/rilievo.webp, calcolata una volta sola con Depth Anything V2
// e calibrata sul piano del mare). Dal punto dello scatto si vede ESATTAMENTE
// la foto; spostando di poco la camera c'e' parallasse vera.
// Qui dentro: la superficie, il mare vivo, il cielo, la notte, lo "strato"
// dove tre.js dipinge piazzole, ombre e aloni dei giocatori (stesse coordinate della foto).
// =====================================================================
import * as THREE from "three";

export const HC = 60;                       // altezza della camera dello scatto (unita' del mondo)
// misure della foto (uscite da prepara.py): campo visivo, inclinazione, scala della profondita', riga dell'orizzonte, colori del cielo
export const GEO = { fov: 55, theta: 0.36315919697709637, invMin: 1 / 14, invMax: 0.857819604747054, gw: 1024, gh: 576, vh: 0.73, cieloAlto: [0.6866, 0.7931, 0.8538], cieloOriz: [0.7837, 0.8094, 0.8048] };
export const RUMORE = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float rum(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ return rum(p)*.6 + rum(p*2.1+7.3)*.3 + rum(p*4.3+1.7)*.1; }
`;
// La notte: non e' un velo blu. Il cielo diventa notte con le stelle, il mare scuro con la scia della luna,
// la terra si spegne e si accendono le luci (finestre, lampioni dei ponti, insegne), solo dove c'e' qualcosa di costruito.
export const NOTTE = `
vec3 cieloNotte(vec2 uv, float t){
  vec3 c = mix(vec3(.035,.06,.14), vec3(.008,.014,.045), smoothstep(.72, 1., uv.y));
  vec2 g = uv*vec2(900.,520.); float s = h21(floor(g));
  float st = step(.9965, s) * smoothstep(.5, .0, length(fract(g)-.5)) * (.55 + .45*sin(t*1.7 + s*90.));
  c += vec3(.8,.87,1.) * st * smoothstep(.74, .84, uv.y);
  float dl = length((uv - vec2(.74,.93))*vec2(1.7778,1.));
  c += vec3(1.,.96,.84) * smoothstep(.023, .019, dl) + vec3(.35,.45,.7) * .22 * exp(-dl*9.);
  return c;
}
vec3 diNotte(vec3 c, float acqua, float cielo, vec2 uv, float quota, float n, float t){
  float l = dot(c, vec3(.3,.59,.11)), alto = max(c.r, max(c.g, c.b)), basso = min(c.r, min(c.g, c.b));
  float sat = (alto - basso) / max(alto, .001);
  vec3 buio = mix(vec3(l), c, .5) * vec3(.13,.2,.4);                                   // la terra: blu notte, resta un filo di colore
  vec3 mare = c * vec3(.06,.2,.3) + vec3(.004,.012,.035);                              // il mare: scuro, i bassi fondali restano un po' turchesi
  float scia = exp(-abs(uv.x-.74)*9.) * smoothstep(.2,.7,uv.y);                         // la scia della luna sull'acqua
  mare += vec3(.5,.62,.8) * scia * (.06 + .5*smoothstep(.62,.8, rum(uv*vec2(260.,620.) + vec2(t*.6, -t*.9))));
  buio = mix(buio, mare, acqua);
  // luci: dove la foto e' costruita (sopra il livello del mare) e non e' verde
  float verde = smoothstep(.0, .06, c.g - max(c.r, c.b));
  float costruito = smoothstep(.5, 1.7, quota) * (1.-acqua) * (1.-cielo) * (1.-verde);
  vec2 cella = floor(uv*vec2(2048.,1152.)/2.5); float h = h21(cella), h2 = h21(cella+17.3);
  float accesa = step(.9 - .5*smoothstep(.3,.9,l), h) * costruito;
  vec3 calda = mix(vec3(1.,.72,.38), vec3(1.,.9,.72), h2);
  vec3 tinta = mix(calda, vec3(1.,.42,.75), smoothstep(.12,.3,c.r-c.g) * step(c.b, c.r) * step(.55, h2) * step(c.g*1.08, c.b));   // rosa: Baia Flamingo
  tinta = mix(tinta, vec3(.72,.86,1.), step(c.r*1.25, c.b) * step(.6, h2));                                                      // vetro: luci fredde
  buio += tinta * accesa * (.55 + .7*h2) * (.82 + .18*sin(t*2.3 + h*40.));
  buio += c * vec3(1.,.72,.42) * costruito * .34;                                       // alone caldo delle citta'
  buio = mix(buio, cieloNotte(uv, t) + l*l*vec3(.03,.045,.09), cielo);                   // il cielo: stelle, luna, nuvole appena visibili
  // l'alba: a meta' strada il cielo si scalda
  float alba = sin(clamp(n,0.,1.)*3.14159);
  vec3 r = mix(c, buio, smoothstep(0., 1., n));
  r += alba * vec3(.34,.13,.02) * (cielo*.9 + acqua*.25*smoothstep(.45,.75,uv.y) + .12);
  return r;
}`;

function caricaImg(url) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("non trovo " + url)); i.src = url; }); }

export async function creaRilievo({ urlFoto, urlGeo, urlMare, renderer, qualita = 1, strato = 2048 }) {
  const P = GEO, GW = P.gw, GH = P.gh;
  const tl = new THREE.TextureLoader();
  const [imgGeo, foto, tMare] = await Promise.all([caricaImg(urlGeo), tl.loadAsync(urlFoto), tl.loadAsync(urlMare)]);
  const cv = document.createElement("canvas"); cv.width = GW; cv.height = GH;
  const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(imgGeo, 0, 0, GW, GH);
  const px = cx.getImageData(0, 0, GW, GH).data;
  // rosso + mezzo verde = profondita' a 12 bit; blu = maschera dell'acqua
  const inv = new Float32Array(GW * GH), acqua = new Float32Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) { inv[i] = P.invMin + ((px[i * 4] * 16 + (px[i * 4 + 1] >> 4)) / 4095) * (P.invMax - P.invMin); acqua[i] = px[i * 4 + 2] / 255; }
  const bil = (arr, u, v) => { const x = Math.min(GW - 1.001, Math.max(0, u * GW - 0.5)), y = Math.min(GH - 1.001, Math.max(0, v * GH - 0.5)); const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0; const a = arr[y0 * GW + x0], b = arr[y0 * GW + x0 + 1], c = arr[(y0 + 1) * GW + x0], d = arr[(y0 + 1) * GW + x0 + 1]; return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy; };

  const th = P.theta, ty = Math.tan(THREE.MathUtils.degToRad(P.fov / 2)), tx = ty * 16 / 9;
  const cam0 = new THREE.Vector3(0, HC, 0);
  const avanti = new THREE.Vector3(0, -Math.sin(th), -Math.cos(th)), su = new THREE.Vector3(0, Math.cos(th), -Math.sin(th)), destra = new THREE.Vector3(1, 0, 0);
  const raggio = (u, v, out) => { const X = (u * 2 - 1) * tx, Y = (1 - v * 2) * ty; return out.set(X * destra.x + Y * su.x + avanti.x, X * destra.y + Y * su.y + avanti.y, X * destra.z + Y * su.z + avanti.z); };
  const tmp = new THREE.Vector3();
  const punto = (u, v, iv, out = new THREE.Vector3()) => { raggio(u, v, tmp); const z = HC / iv; out.set(cam0.x + z * tmp.x, cam0.y + z * tmp.y, cam0.z + z * tmp.z); if (out.y < 0) out.y = 0; return out; };

  // la quota sul mare di ogni punto della foto: serve a dipingere piazzole e ombre solo dove c'e' terra bassa (non sulle facciate dei palazzi)
  const quote = new Float32Array(GW * GH);
  for (let j = 0; j < GH; j++) { const ry = (1 - (j + 0.5) / GH * 2) * ty * su.y + avanti.y; for (let i = 0; i < GW; i++) quote[j * GW + i] = Math.max(0, HC * (1 + ry / inv[j * GW + i])); }
  const NX = Math.round(640 * qualita), NY = Math.round(360 * qualita);
  const pos = new Float32Array(NX * NY * 3), uv = new Float32Array(NX * NY * 2), p = new THREE.Vector3();
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const u = i / (NX - 1), v = j / (NY - 1), k = j * NX + i;
    punto(u, v, bil(inv, u, v), p);
    pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v;
  }
  const idx = new Uint32Array((NX - 1) * (NY - 1) * 6); let n = 0;
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1; idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -300), 2000);

  foto.colorSpace = THREE.SRGBColorSpace; foto.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); foto.wrapS = foto.wrapT = THREE.ClampToEdgeWrapping;
  const tGeo = new THREE.Texture(imgGeo); tGeo.colorSpace = THREE.NoColorSpace; tGeo.minFilter = tGeo.magFilter = THREE.LinearFilter; tGeo.generateMipmaps = false; tGeo.needsUpdate = true;
  tMare.colorSpace = THREE.SRGBColorSpace; tMare.wrapS = tMare.wrapT = THREE.MirroredRepeatWrapping;

  // lo strato dipinto: stesse coordinate della foto. "tinta" = piazzole e ombre (sta sotto la luce del giorno e della notte),
  // "luci" = aloni dei giocatori (si sommano, di notte brillano di piu')
  const SW = strato, SH = Math.round(strato * 9 / 16), LW = SW >> 1, LH = SH >> 1;
  const datiTinta = new Uint8Array(SW * SH * 4), datiLuci = new Uint8Array(LW * LH * 4);
  const mkTex = (d, w, h) => { const t = new THREE.DataTexture(d, w, h, THREE.RGBAFormat); t.colorSpace = THREE.NoColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = false; t.needsUpdate = true; return t; };
  const tTinta = mkTex(datiTinta, SW, SH), tLuci = mkTex(datiLuci, LW, LH);

  const U = { uFoto: { value: foto }, uGeo: { value: tGeo }, uMare: { value: tMare }, uTinta: { value: tTinta }, uLuci: { value: tLuci }, uT: { value: 0 }, uNotte: { value: 0 }, uCam0: { value: cam0.clone() }, uOnde: { value: 1 }, uE: { value: 0.001 }, uNitido: { value: 0 },
    uFuoco: { value: new THREE.Vector4(-9, -9, 1, 0) }, uFuocoM: { value: new THREE.Vector4(1.7778, 1, 0, 0) }, uFuocoCol: { value: new THREE.Color("#ffd98a") },
    uFotoVP: { value: new THREE.Matrix4() }, uCieloAlto: { value: new THREE.Color().setRGB(...P.cieloAlto, THREE.SRGBColorSpace) }, uCieloOriz: { value: new THREE.Color().setRGB(...P.cieloOriz, THREE.SRGBColorSpace) } };
  // la camera dello scatto: serve per sapere a quale punto della foto corrisponde un punto del mondo
  const camFoto = new THREE.PerspectiveCamera(P.fov, 16 / 9, 1, 5000); camFoto.position.copy(cam0); camFoto.lookAt(cam0.clone().add(avanti)); camFoto.updateMatrixWorld(); camFoto.updateProjectionMatrix();
  U.uFotoVP.value.multiplyMatrices(camFoto.projectionMatrix, camFoto.matrixWorldInverse);
  const ORIZ = (1 - (0.5 - P.vh / 2)).toFixed(4);     // la riga dell'orizzonte, in coordinate uv

  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, extensions: { derivatives: true },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `precision highp float; varying vec2 vUv; varying vec3 vW;
      uniform sampler2D uFoto, uGeo, uTinta, uLuci; uniform float uT, uNotte, uOnde, uE, uNitido; uniform vec3 uCam0, uFuocoCol; uniform vec4 uFuoco, uFuocoM;
      ${RUMORE} ${NOTTE}
      void main(){
        // i "teli" tirati tra un palazzo e lo sfondo (dove la profondita' salta) si tagliano: dietro si vede il mare
        vec2 un = vec2(vUv.x*1.7778, vUv.y); vec2 ja = dFdx(un), jb = dFdy(un); float tiro = abs(ja.x*jb.y - ja.y*jb.x) / (uE*uE);
        if (tiro < .07) discard;
        float acqua = texture2D(uGeo, vUv).b;
        float dist = length(vW - uCam0);
        // onde: sposto di pochissimo la foto del mare, cosi' i colori (barriera, bassi fondali) restano quelli veri
        vec2 q = vW.xz * .32;
        vec2 o = vec2(fbm(q + vec2(uT*.35, uT*.22)), fbm(q*1.3 + vec2(-uT*.28, uT*.31) + 9.)) - .5;
        float amp = uOnde * acqua * .0030 * clamp(140./dist, .25, 1.6);
        vec2 uv2 = vUv + o * amp;
        uv2 = mix(vUv, uv2, step(.6, texture2D(uGeo, uv2).b));
        vec3 c = texture2D(uFoto, uv2).rgb;
        if (uNitido > .01) {   // da vicino la foto e' morbida: un filo di nitidezza
          vec2 e = vec2(1./2048., 1./1152.);
          vec3 m = (texture2D(uFoto, uv2+vec2(e.x,0.)).rgb + texture2D(uFoto, uv2-vec2(e.x,0.)).rgb + texture2D(uFoto, uv2+vec2(0.,e.y)).rgb + texture2D(uFoto, uv2-vec2(0.,e.y)).rgb) * .25;
          c = clamp(c + (c - m) * uNitido, 0., 1.);
        }
        // riflessi lenti e scintille del sole (nella foto il sole e' in alto a sinistra)
        float cresta = rum(vW.xz*vec2(.9,2.2) + vec2(uT*.9, -uT*.5))*.6 + rum(vW.xz*vec2(2.3,4.1) - vec2(uT*.7, uT*.6))*.4;
        float sc = smoothstep(.6, .86, rum(vW.xz*7. + vec2(uT*1.6, uT*1.2)) * rum(vW.xz*4.9 - vec2(uT*1.3, uT*1.5)) * 1.5) * clamp(220./dist, 0., 1.);
        float versoSole = smoothstep(.7, .0, vUv.x) * smoothstep(.2, .8, vUv.y);
        c += acqua * uOnde * (vec3(1.,.93,.78) * sc * (.015 + .3*versoSole) * (1.-uNotte) + (cresta-.5) * .03 * (1.-.6*uNotte));
        // piazzole e ombre dipinte sulla foto
        vec4 st = texture2D(uTinta, vec2(vUv.x, 1.-vUv.y));
        c = mix(c, st.rgb, st.a);
        float cielo = smoothstep(${ORIZ} - .02, ${ORIZ} + .01, vUv.y);
        c = diNotte(c, acqua, cielo, vUv, vW.y, uNotte, uT);
        // gli aloni dei giocatori: luce che si somma
        vec4 lu = texture2D(uLuci, vec2(vUv.x, 1.-vUv.y));
        c += lu.rgb * lu.a * (.62 + .75*uNotte);
        // il cerchio che pulsa sulla casella toccata o dove arriva una pedina
        vec2 gf = (vec2(vUv.x, 1.-vUv.y) - uFuoco.xy) * uFuocoM.xy;
        float rf = length(gf) / max(uFuoco.z, 1e-5), ond = fract(uT*.8);
        float anello = smoothstep(.16, .0, abs(rf - 1.)) * .9 + smoothstep(.2, .0, abs(rf - (1. + ond*.9))) * (1.-ond) * .8;
        c += uFuocoCol * anello * uFuoco.w;
        // i bordi della foto sfumano nel mare e nel cielo che continuano fuori
        float b = smoothstep(0., .035, vUv.x) * smoothstep(0., .035, 1.-vUv.x) * smoothstep(0., .05, vUv.y) * smoothstep(0., .03, 1.-vUv.y);
        gl_FragColor = vec4(c, b * smoothstep(.07, .16, tiro));
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;

  // il mare che continua fuori dalla foto (stessi colori: un "mare di base" a specchio) e il cielo
  const matMare = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `precision highp float; varying vec3 vW; uniform sampler2D uMare; uniform mat4 uFotoVP; uniform float uT, uNotte, uOnde; uniform vec3 uCam0, uCieloOriz;
      ${RUMORE} ${NOTTE}
      void main(){
        vec4 p = uFotoVP * vec4(vW, 1.); vec2 uv = p.xy / max(p.w, 1e-3) * .5 + .5;
        float dietro = step(p.w, 1.);
        uv.y = min(uv.y, ${ORIZ} - .03);
        vec3 c = texture2D(uMare, uv).rgb;
        float d = length(vW.xz - uCam0.xz);
        vec3 lontano = mix(vec3(.10,.42,.55), uCieloOriz, smoothstep(300., 1500., d));
        c = mix(c, lontano, max(dietro, smoothstep(420., 900., d)));
        c += uOnde * (rum(vW.xz*vec2(.9,2.2) + vec2(uT*.9, -uT*.5))*.6 + rum(vW.xz*vec2(2.3,4.1) - vec2(uT*.7, uT*.6))*.4 - .5) * .03 * (1.-smoothstep(200., 700., d)) * (1.-.6*uNotte);
        c = diNotte(c, 1., smoothstep(900., 1600., d), clamp(uv, 0., 1.), 0., uNotte, uT);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mare = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), matMare); mare.rotation.x = -Math.PI / 2; mare.position.y = -0.06; mare.renderOrder = 0;
  const matCielo = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); }`,
    fragmentShader: `precision highp float; varying vec3 vD; uniform vec3 uCieloAlto, uCieloOriz; uniform float uNotte, uT;
      ${RUMORE}
      void main(){ float h = clamp(vD.y*3.2, 0., 1.); vec3 c = mix(uCieloOriz, uCieloAlto, pow(h,.7));
        vec3 nt = mix(vec3(.035,.06,.14), vec3(.008,.014,.045), h); vec2 g = vD.xy*420.; float s = h21(floor(g)); nt += vec3(.8,.87,1.) * step(.9965, s) * smoothstep(.5, 0., length(fract(g)-.5)) * step(.02, vD.y);
        c = mix(c, nt, smoothstep(0., 1., uNotte)) + sin(clamp(uNotte,0.,1.)*3.14159) * vec3(.34,.13,.02) * (1.-h);
        gl_FragColor = vec4(c,1.);
        #include <colorspace_fragment>
      }`,
  });
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 12), matCielo); cielo.position.copy(cam0); cielo.renderOrder = -1;

  const gruppo = new THREE.Group(); gruppo.add(cielo, mare, mesh);
  const bersaglio = cam0.clone().add(avanti.clone().multiplyScalar(HC / Math.sin(th)));   // dove guarda il centro della foto, sul mare
  const v4 = new THREE.Vector4();
  return {
    gruppo, mesh, U, P, cam0, avanti, su, destra, bersaglio, tx, ty, triangoli: idx.length / 3,
    strato: { tinta: datiTinta, luci: datiLuci, SW, SH, LW, LH, tTinta, tLuci },
    // punto del mondo che corrisponde a un punto della foto (x,y in %, come le caselle di gioco.js)
    suolo(xPct, yPct, out) { const u = xPct / 100, v = yPct / 100; return punto(u, v, bil(inv, u, v), out); },
    // lo stesso punto della foto, ma a una quota scelta (per le cose che stanno sopra il terreno)
    aQuota(xPct, yPct, y, out = new THREE.Vector3()) { raggio(xPct / 100, yPct / 100, tmp); const z = (y - HC) / tmp.y; return out.set(cam0.x + z * tmp.x, y, cam0.z + z * tmp.z); },
    eAcqua(xPct, yPct) { return bil(acqua, xPct / 100, yPct / 100) > 0.5; },
    quote, GW, GH,
    profondita(xPct, yPct) { return HC / bil(inv, xPct / 100, yPct / 100); },
    // direzione (dal punto dello scatto) che passa per un punto della foto
    direzione(xPct, yPct, out = new THREE.Vector3()) { return raggio(xPct / 100, yPct / 100, out).normalize(); },
    // a quale punto della foto (in %) corrisponde un punto del mondo o una direzione
    fotoDi(w, out = new THREE.Vector2()) { v4.set(w.x, w.y, w.z, 1).applyMatrix4(U.uFotoVP.value); return out.set((v4.x / v4.w * 0.5 + 0.5) * 100, (0.5 - v4.y / v4.w * 0.5) * 100); },
    fotoDiDirezione(d, out = new THREE.Vector2()) { const a = d.dot(avanti); return out.set((d.dot(destra) / a / tx * 0.5 + 0.5) * 100, (0.5 - d.dot(su) / a / ty * 0.5) * 100); },
    tempo(t) { U.uT.value = t; }, notte(n) { U.uNotte.value = n; },
    libera() { geo.dispose(); mat.dispose(); matMare.dispose(); matCielo.dispose(); foto.dispose(); tGeo.dispose(); tMare.dispose(); tTinta.dispose(); tLuci.dispose(); mare.geometry.dispose(); cielo.geometry.dispose(); },
  };
}

// ---------------------------------------------------------------------
// Dentro un'isola: la foto dell'isola (a livello strada) + la sua profondita' = una scena con parallasse.
// Qui non ci sono caselle: e' una veduta, per sentirsi dentro il posto.
// ---------------------------------------------------------------------
export async function creaVeduta(urlFoto, urlProf, renderer) {
  const tl = new THREE.TextureLoader(); const [foto, imgP] = await Promise.all([tl.loadAsync(urlFoto), caricaImg(urlProf)]);
  foto.colorSpace = THREE.SRGBColorSpace; foto.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const PW = imgP.width, PH = imgP.height, cv = document.createElement("canvas"); cv.width = PW; cv.height = PH; const c = cv.getContext("2d", { willReadFrequently: true }); c.drawImage(imgP, 0, 0); const px = c.getImageData(0, 0, PW, PH).data;
  const NX = 224, NY = 126, ZN = 2, ZF = 26, FOV = 56, ty = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), asp = foto.image.width / foto.image.height, tx = ty * asp;
  const pos = new Float32Array(NX * NY * 3), uv = new Float32Array(NX * NY * 2), idx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const u = i / (NX - 1), v = j / (NY - 1), k = j * NX + i; const d = px[(Math.min(PH - 1, (v * PH) | 0) * PW + Math.min(PW - 1, (u * PW) | 0)) * 4] / 255; const z = 1 / (d * (1 / ZN - 1 / ZF) + 1 / ZF);
    pos[k * 3] = (u * 2 - 1) * tx * z; pos[k * 3 + 1] = (1 - v * 2) * ty * z; pos[k * 3 + 2] = -z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v; }
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; idx.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const U = { uFoto: { value: foto }, uA: { value: 1 }, uNotte: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthTest: false, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uFoto; uniform float uA, uNotte; void main(){ vec3 c = texture2D(uFoto, vUv).rgb; float l = dot(c, vec3(.3,.59,.11)); vec3 n = mix(vec3(l), c, .6)*vec3(.2,.28,.5) + vec3(1.,.75,.45)*smoothstep(.7,.98,max(c.r,max(c.g,c.b)))*.9; c = mix(c, n, uNotte); gl_FragColor = vec4(c, uA);
      #include <colorspace_fragment>
    }` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  const scena = new THREE.Scene(); scena.add(mesh);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200); const m = { x: 0, y: 0, tx: 0, ty: 0 };
  return { scena, camera, U, triangoli: idx.length / 3,
    punta(x, y) { m.tx = x; m.ty = y; },
    fermo() { return Math.abs(m.tx - m.x) + Math.abs(m.ty - m.y) < 0.002; },
    aggiorna(dt, t, aspect, avvicina = 0) { m.x += (m.tx - m.x) * Math.min(1, dt * 5); m.y += (m.ty - m.y) * Math.min(1, dt * 5);
      camera.aspect = aspect; camera.fov = aspect >= asp ? 2 * THREE.MathUtils.radToDeg(Math.atan(tx * 0.86 / aspect)) : 46; camera.updateProjectionMatrix();
      camera.position.set(m.x * 0.16 + Math.sin(t * 0.4) * 0.05, -m.y * 0.08 + Math.sin(t * 0.31) * 0.025, 0.25 - avvicina * 0.5); camera.lookAt(camera.position.x * 0.35, camera.position.y * 0.35, -7); },
    libera() { g.dispose(); mat.dispose(); foto.dispose(); } };
}
