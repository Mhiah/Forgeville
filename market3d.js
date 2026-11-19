/* Forgeville 3D market square.
 * The stalls, ground and trees are built in code with three.js. The products on
 * the counters are the Aholo Lux3D models from assets/models/, shown in each
 * shop's real colour and material. The town square is shown as this 3D scene. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODELS = { jacket: 'assets/models/jacket.glb', tote: 'assets/models/tote.glb', sneakers: 'assets/models/sneakers.glb', cap: 'assets/models/cap.glb' };
const FINISH = { canvas: [0.95, 0], recycled: [0.82, 0], waterproof: [0.22, 0], premium: [0.42, 0.12] };
const STALLS = [
  { key: 'rival0', name: 'WREN & CO.', stripe: '#5a7fae', x: -3.3 },
  { key: 'you', name: 'YOUR STALL', stripe: '#2f5d46', x: 0 },
  { key: 'rival1', name: 'PIP STUDIO', stripe: '#e57d68', x: 3.3 },
];

let renderer, scene, camera, controls, host, canvas, visible = false, built = false, lastSig = '';
const loader = new GLTFLoader();
const cache = {};
const stallGroups = {};

function loadModel(t) {
  if (!cache[t]) cache[t] = new Promise((res, rej) => loader.load(MODELS[t], g => res(g.scene), undefined, rej));
  return cache[t];
}

function colourHex(id) {
  try { const c = COLORS.find(x => x.id === id); if (c) return c.hex; } catch (e) {}
  return '#ffffff';
}

function textTexture(text, bg, fg, w = 512, h = 128, size = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  g.fillStyle = fg; g.font = `800 ${size}px "Helvetica Neue", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function label(text, bg, fg, width) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshBasicMaterial({ map: textTexture(text, bg, fg), transparent: true }));
  return m;
}

function buildStall(s) {
  const g = new THREE.Group(); g.position.x = s.x;
  const wood = new THREE.MeshStandardMaterial({ color: '#c99a63', roughness: 0.8 });
  const cream = new THREE.MeshStandardMaterial({ color: '#f6efdf', roughness: 0.9 });
  // counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 1.2), cream); counter.position.set(0, 0.5, 0); counter.castShadow = counter.receiveShadow = true; g.add(counter);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.08, 1.32), wood); top.position.set(0, 1.04, 0); top.castShadow = top.receiveShadow = true; g.add(top);
  const front = new THREE.Mesh(new THREE.BoxGeometry(2.62, 0.18, 0.02), new THREE.MeshStandardMaterial({ color: s.stripe })); front.position.set(0, 0.86, 0.61); g.add(front);
  // posts
  for (const px of [-1.25, 1.25]) for (const pz of [-0.55, 0.45]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 10), wood); p.position.set(px, 1.3, pz); p.castShadow = true; g.add(p);
  }
  // striped awning
  const n = 8, w = 2.9 / n;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 1.55), new THREE.MeshStandardMaterial({ color: i % 2 ? '#fbf7ee' : s.stripe, roughness: 0.85 }));
    m.position.set(-1.45 + w / 2 + i * w, 2.62, -0.02); m.rotation.x = -0.22; m.castShadow = true; g.add(m);
    const flap = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.05, 16, 1, false, 0, Math.PI), m.material);
    flap.rotation.z = Math.PI / 2; flap.rotation.y = Math.PI / 2; flap.position.set(-1.45 + w / 2 + i * w, 2.43, 0.76); g.add(flap);
  }
  // sign
  const sign = label(s.name, s.key === 'you' ? '#2f5d46' : '#fbf7ee', s.key === 'you' ? '#ffffff' : '#31503d', 1.5);
  sign.position.set(0, 3.05, 0.2); g.add(sign);
  const goods = new THREE.Group(); goods.position.set(0, 1.08, 0.05); g.add(goods);
  const price = label('◈ 0', '#fffdf7', '#2b4d3a', 1.0); price.position.set(0.75, 0.5, 0.63); g.add(price);
  stallGroups[s.key] = { group: g, goods, price };
  scene.add(g);
}

function tree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.16 * s, 1.2 * s, 8), new THREE.MeshStandardMaterial({ color: '#8a6243' }));
  trunk.position.y = 0.6 * s; trunk.castShadow = true; g.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: '#5f8d61', roughness: 0.9 });
  for (const [dx, dy, r] of [[0, 1.6, 0.75], [0.35, 1.35, 0.5], [-0.35, 1.4, 0.55]]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r * s, 16, 12), leaf); b.position.set(dx * s, dy * s, 0); b.castShadow = true; g.add(b);
  }
  g.position.set(x, 0, z); scene.add(g);
}

function build() {
  canvas = document.createElement('canvas'); canvas.className = 'market3d-canvas';
  host.appendChild(canvas);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene(); scene.background = new THREE.Color('#d4e9df'); scene.fog = new THREE.Fog('#d4e9df', 14, 30);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.set(0, 4.4, 11);
  controls = new OrbitControls(camera, canvas); controls.target.set(0, 1.4, 0); controls.enableDamping = true;
  controls.minDistance = 4.5; controls.maxDistance = 13; controls.maxPolarAngle = Math.PI * 0.47; controls.minPolarAngle = Math.PI * 0.18;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.5; controls.enablePan = false;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8a07a', 1.6));
  const sun = new THREE.DirectionalLight('#fff4dd', 2.2); sun.position.set(5, 9, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(22, 48), new THREE.MeshStandardMaterial({ color: '#e4d2ae', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grass = new THREE.Mesh(new THREE.RingGeometry(9, 22, 48), new THREE.MeshStandardMaterial({ color: '#9cc4a1', roughness: 1 }));
  grass.rotation.x = -Math.PI / 2; grass.position.y = 0.01; scene.add(grass);
  for (let i = 0; i < 9; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.35), new THREE.MeshStandardMaterial({ color: '#d6c29b' })); st.position.set(-5 + i * 1.3, 0.012, 2.4 + (i % 3) * 0.9); scene.add(st); }
  tree(-6.5, -2.5, 1.2); tree(6.6, -2.2, 1.1); tree(-7.6, 1.5, 0.9); tree(7.4, 2, 1); tree(-3, -4.6, 1.3); tree(3.6, -4.8, 1.2);
  STALLS.forEach(buildStall);
  built = true;
}

async function fillStall(key, d, count) {
  const sg = stallGroups[key];
  sg.goods.clear();
  sg.price.material.map = textTexture('◈ ' + (d.price || 0), '#fffdf7', '#2b4d3a'); sg.price.material.needsUpdate = true;
  if (!d || !MODELS[d.template] || count <= 0) return;
  let src; try { src = await loadModel(d.template); } catch (e) { return; }
  const box = new THREE.Box3().setFromObject(src); const size = box.getSize(new THREE.Vector3());
  const scale = 0.85 / Math.max(size.x, size.y, size.z);
  const [rough, metal] = FINISH[d.material] || [0.8, 0];
  const hex = colourHex(d.color);
  const n = Math.min(3, count);
  for (let i = 0; i < n; i++) {
    const m = src.clone(true);
    m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color = new THREE.Color(hex); o.material.roughness = rough; o.material.metalness = metal; o.castShadow = true; } });
    m.scale.setScalar(scale);
    const b2 = new THREE.Box3().setFromObject(m); const c = b2.getCenter(new THREE.Vector3());
    const wrap = new THREE.Group(); m.position.sub(new THREE.Vector3(c.x, b2.min.y, c.z)); wrap.add(m);
    wrap.position.set((i - (n - 1) / 2) * 0.82, 0, i === 1 ? -0.15 : 0.05);
    wrap.rotation.y = d.template === 'cap' ? Math.PI * 1.15 : 0.35 - i * 0.15;
    sg.goods.add(wrap);
  }
}

function designs() {
  let rivals = [];
  try { rivals = currentRivals(); } catch (e) {}
  let you = null, left = 0;
  try {
    if (run.mode === 'design') { you = run.design; left = run.design.qty; }
    else { const s = run.stock[run.stock.length - 1]; if (s) { you = { ...s, price: s.price ?? run.design.price }; left = s.remaining; } else { you = run.design; left = run.design.qty; } }
  } catch (e) {}
  return { you, left, rivals };
}

function refresh() {
  const { you, left, rivals } = designs();
  const sig = JSON.stringify([you && [you.template, you.color, you.material, you.price], left, rivals.map(r => [r.template, r.color, r.material, r.price])]);
  if (sig === lastSig) return;
  lastSig = sig;
  if (you) fillStall('you', you, left);
  if (rivals[0]) fillStall('rival0', rivals[0], 3);
  if (rivals[1]) fillStall('rival1', rivals[1], 3);
}

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  // keep all three stalls in frame whatever the panel shape
  const d = Math.min(15, Math.max(7, 5.6 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect)));
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).add(dir.multiplyScalar(d));
  controls.maxDistance = d + 3;
}

function loop() {
  if (!visible) return;
  controls.update(); renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

let refreshTimer = null;
function show(on) {
  visible = on;
  host.classList.toggle('show-3d', on);
  if (on) {
    if (!built) build();
    resize(); lastSig = ''; refresh();
    clearInterval(refreshTimer); refreshTimer = setInterval(refresh, 700);
    requestAnimationFrame(loop);
  } else clearInterval(refreshTimer);
}

function init() {
  host = document.getElementById('marketScene');
  const row = document.querySelector('.town-title-row');
  if (!host || !row) return;
  window.addEventListener('resize', () => { if (built) resize(); });
  window.Market3D = { show, refresh };
  // The town square is the 3D market
  try { show(true); } catch (e) { console.warn('3D market unavailable', e); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
