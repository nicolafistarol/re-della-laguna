// Una qualsiasi immagine + la sua mappa di profondita' = una scena con parallasse ("foto 3D").
// Serve per le viste ravvicinate delle isole: si entra nella foto dell'isola e la camera si muove appena.
import * as THREE from "three";
export async function creaFoto3D(urlFoto, urlProf, renderer) {
  const L = new THREE.TextureLoader(); const [foto, imgP] = await Promise.all([L.loadAsync(urlFoto), new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = urlProf; })]);
  foto.colorSpace = THREE.SRGBColorSpace; foto.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const PW = imgP.width, PH = imgP.height, cv = document.createElement("canvas"); cv.width = PW; cv.height = PH; const c = cv.getContext("2d"); c.drawImage(imgP, 0, 0); const px = c.getImageData(0, 0, PW, PH).data;
  const NX = 256, NY = 144, ZN = 2, ZF = 26, FOV = 56, ty = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), tx = ty * foto.image.width / foto.image.height;
  const pos = new Float32Array(NX * NY * 3), uv = new Float32Array(NX * NY * 2), idx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const u = i / (NX - 1), v = j / (NY - 1), k = j * NX + i; const d = px[(Math.min(PH - 1, (v * PH) | 0) * PW + Math.min(PW - 1, (u * PW) | 0)) * 4] / 255; const z = 1 / (d * (1 / ZN - 1 / ZF) + 1 / ZF);
    pos[k * 3] = (u * 2 - 1) * tx * z; pos[k * 3 + 1] = (1 - v * 2) * ty * z; pos[k * 3 + 2] = -z; uv[k * 2] = u; uv[k * 2 + 1] = 1 - v; }
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; idx.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const U = { uFoto: { value: foto }, uA: { value: 1 }, uNotte: { value: 0 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, transparent: true, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D uFoto; uniform float uA, uNotte; void main(){ vec3 c = texture2D(uFoto, vUv).rgb; float l = dot(c, vec3(.3,.59,.11)); vec3 n = mix(vec3(l), c, .6)*vec3(.2,.28,.5) + vec3(1.,.75,.45)*smoothstep(.7,.98,max(c.r,max(c.g,c.b)))*.9; c = mix(c, n, uNotte); gl_FragColor = vec4(c, uA);
      #include <colorspace_fragment>
    }` })); mesh.frustumCulled = false;
  const scena = new THREE.Scene(); scena.add(mesh);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200); const m = { x: 0, y: 0, tx: 0, ty: 0 };
  return { scena, camera, U, triangoli: idx.length / 3,
    punta(x, y) { m.tx = x; m.ty = y; },
    aggiorna(dt, t, aspect, avvicina = 0) { m.x += (m.tx - m.x) * Math.min(1, dt * 5); m.y += (m.ty - m.y) * Math.min(1, dt * 5);
      const asp = foto.image.width / foto.image.height; camera.aspect = aspect; camera.fov = aspect >= asp ? 2 * THREE.MathUtils.radToDeg(Math.atan(tx * 0.86 / aspect)) : 46; camera.updateProjectionMatrix();
      camera.position.set(m.x * 0.16 + Math.sin(t * 0.4) * 0.05, -m.y * 0.08 + Math.sin(t * 0.31) * 0.025, 0.25 - avvicina * 0.5); camera.lookAt(camera.position.x * 0.35, camera.position.y * 0.35, -7); } };
}
