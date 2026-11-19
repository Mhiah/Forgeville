/* Forgeville × Aholo Lux3D
 * Every product in the town market is a 3D model generated with Aholo Lux3D
 * (https://3d.aholo.ai). The workbench shows the live model: players spin it,
 * and their colour and material choices repaint it in real time. The same
 * models are rendered into the stall, rival and guide art, so the whole market
 * is built from Lux3D assets. If a model file is missing, the game falls back
 * to its original 2D illustration. */
'use strict';

const LUX3D = {
  models: {
    jacket: 'assets/models/jacket.glb',
    tote: 'assets/models/tote.glb',
    sneakers: 'assets/models/sneakers.glb',
    cap: 'assets/models/cap.glb',
  },
  // Camera angle per model, so each product faces the player
  orbit: { cap: '215deg 70deg auto' },
  available: {},
  shots: {},
  shotsDone: false,
};

// How each material should feel in 3D: [roughness, metalness]
const LUX3D_FINISH = {
  canvas: [0.95, 0],
  recycled: [0.82, 0],
  waterproof: [0.22, 0],
  premium: [0.42, 0.12],
};

function lux3dColorHex(id) {
  const c = (typeof COLORS !== 'undefined') && COLORS.find(x => x.id === id);
  return c ? c.hex : '#ffffff';
}

function lux3dApplyLook(mv, d) {
  if (!mv || !mv.model || !d) return;
  const hex = lux3dColorHex(d.color);
  const [rough, metal] = LUX3D_FINISH[d.material] || [0.8, 0];
  for (const m of mv.model.materials) {
    const pbr = m.pbrMetallicRoughness;
    try { pbr.setBaseColorFactor(hex); } catch (e) {}
    if (d.material) {
      try { pbr.setRoughnessFactor(rough); pbr.setMetallicFactor(metal); } catch (e) {}
    }
  }
}

function lux3dMakeViewer(extra = {}) {
  const mv = document.createElement('model-viewer');
  mv.setAttribute('camera-controls', '');
  mv.setAttribute('disable-zoom', '');
  mv.setAttribute('disable-pan', '');
  mv.setAttribute('interaction-prompt', 'none');
  mv.setAttribute('shadow-intensity', '1');
  mv.setAttribute('shadow-softness', '0.9');
  mv.setAttribute('exposure', '1.05');
  mv.setAttribute('environment-image', 'neutral');
  mv.setAttribute('camera-orbit', '30deg 72deg auto');
  for (const [k, v] of Object.entries(extra)) mv.setAttribute(k, v);
  return mv;
}

/* Workbench preview: returns true when the 3D model took over the stage. */
function lux3dPreview(d) {
  const host = document.getElementById('productIllustration');
  if (!host || !LUX3D.available[d.template]) {
    if (host) host.classList.remove('is-3d');
    const badge = document.getElementById('lux3dBadge');
    if (badge) badge.hidden = true;
    return false;
  }
  let mv = host.querySelector('model-viewer');
  if (!mv) {
    host.innerHTML = '';
    mv = lux3dMakeViewer({ 'auto-rotate': '', 'auto-rotate-delay': '0', 'rotation-per-second': '24deg' });
    mv.id = 'lux3dViewer';
    mv.addEventListener('load', () => lux3dApplyLook(mv, mv._design));
    host.appendChild(mv);
  }
  host.classList.add('is-3d');
  mv._design = { ...d };
  mv.setAttribute('alt', `${lux3dColorHex(d.color)} ${d.material} ${d.template}, a 3D model generated with Aholo Lux3D`);
  const src = LUX3D.models[d.template];
  if (mv.getAttribute('src') !== src) {
    mv.setAttribute('camera-orbit', LUX3D.orbit[d.template] || '30deg 72deg auto');
    mv.setAttribute('src', src);
  } else lux3dApplyLook(mv, d);
  const badge = document.getElementById('lux3dBadge');
  if (badge) badge.hidden = false;
  return true;
}

/* Rendered snapshot of a Lux3D model in a given colour, for stalls and cards. */
function lux3dShot(d) {
  return LUX3D.shots[`${d.template}|${d.color}`] || null;
}

const lux3dFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

async function lux3dRenderShots() {
  if (typeof COLORS === 'undefined') return;
  const templates = Object.keys(LUX3D.available).filter(t => LUX3D.available[t]);
  if (!templates.length) return;
  await customElements.whenDefined('model-viewer');
  const mv = lux3dMakeViewer({ 'camera-orbit': '28deg 70deg auto' });
  mv.style.cssText = 'position:fixed;left:0;top:0;width:360px;height:360px;opacity:0;pointer-events:none;z-index:-1;background:transparent';
  document.body.appendChild(mv);
  for (const t of templates) {
    await new Promise(res => {
      const done = () => { mv.removeEventListener('load', done); res(); };
      mv.addEventListener('load', done);
      mv.setAttribute('camera-orbit', LUX3D.orbit[t] || '28deg 70deg auto');
      mv.setAttribute('src', LUX3D.models[t]);
      setTimeout(done, 15000);
    });
    for (const c of COLORS) {
      lux3dApplyLook(mv, { color: c.id });
      await lux3dFrame();
      try { LUX3D.shots[`${t}|${c.id}`] = mv.toDataURL('image/png'); } catch (e) {}
    }
    if (typeof renderStalls === 'function') { try { renderStalls(); renderRivals(); } catch (e) {} }
  }
  mv.remove();
  LUX3D.shotsDone = true;
  try { renderAll(); } catch (e) {}
}

async function lux3dInit() {
  await Promise.all(Object.entries(LUX3D.models).map(async ([t, url]) => {
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      LUX3D.available[t] = r.ok;
    } catch (e) { LUX3D.available[t] = false; }
  }));
  try { renderPreview(); } catch (e) {}
  lux3dRenderShots();
}

window.addEventListener('DOMContentLoaded', lux3dInit);
