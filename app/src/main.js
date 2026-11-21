// Wires the page: photo upload (file input + drag-drop), multi-panel layouts,
// per-panel crop and position, caption editing, colour grades, PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderCover, panelRects, EXPORT_SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');
const params = new URLSearchParams(location.search);
const shotMode = Boolean(params.get('shot'));

const $ = (id) => document.getElementById(id);
const els = {
  photo: $('photo'),
  span: $('span'),
  panelPhotos: $('panelPhotos'),
  photo0: $('photo0'),
  photo1: $('photo1'),
  photo2: $('photo2'),
  layoutSeg: $('layoutSeg'),
  zoom: $('zoom'),
  ox: $('ox'),
  oy: $('oy'),
  caption: $('caption'),
  subtitle: $('subtitle'),
  posSeg: $('posSeg'),
  capSize: $('capSize'),
  gradeSeg: $('gradeSeg'),
};

const state = {
  layout: 'trio',
  span: true,
  photos: [null, null, null],
  panels: [
    { zoom: 1, ox: 0, oy: 0 },
    { zoom: 1, ox: 0, oy: 0 },
    { zoom: 1, ox: 0, oy: 0 },
  ],
  caption: 'VICE HEAT',
  subtitle: 'A SUNSET STORY',
  captionPos: 'bottom',
  captionSize: 1,
  grade: 'sunset',
  size: '1080x1080',
};
let activePanel = 0;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function applySizeToCanvas() {
  const { w, h } = EXPORT_SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function drawSelection() {
  const { rects } = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[activePanel];
  if (!rect) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setLineDash([12, 9]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(2, canvas.width * 0.004);
  ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  ctx.restore();
}

function redraw() {
  applySizeToCanvas();
  drawCover(canvas, state);
  if (!shotMode) drawSelection();
}

function syncPanelInputs() {
  const count = LAYOUTS[state.layout].panels;
  els.panelPhotos.hidden = state.span;
  for (let i = 0; i < 3; i++) {
    document.getElementById('pp' + i).hidden = i >= count;
  }
  const t = state.panels[activePanel] || { zoom: 1, ox: 0, oy: 0 };
  els.zoom.value = t.zoom;
  els.ox.value = t.ox;
  els.oy.value = t.oy;
}

function syncControls() {
  els.caption.value = state.caption;
  els.subtitle.value = state.subtitle;
  els.span.checked = state.span;
  els.capSize.value = state.captionSize;
  for (const b of els.layoutSeg.querySelectorAll('button')) {
    b.classList.toggle('on', b.dataset.layout === state.layout);
  }
  for (const b of els.posSeg.querySelectorAll('button')) {
    b.classList.toggle('on', b.dataset.pos === state.captionPos);
  }
  for (const b of els.gradeSeg.querySelectorAll('button')) {
    b.classList.toggle('on', b.dataset.grade === state.grade);
  }
  syncPanelInputs();
}

async function loadFile(file) {
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

async function setMainPhoto(file) {
  state.photos[0] = await loadFile(file);
  if (state.span) {
    statusEl.textContent = 'Photo loaded — one photo across all panels.';
  } else {
    statusEl.textContent = 'Photo loaded into panel 1.';
  }
  redraw();
}

async function setPanelPhoto(i, file) {
  state.photos[i] = await loadFile(file);
  statusEl.textContent = `Photo loaded into panel ${i + 1}.`;
  redraw();
}

// Photo inputs.
els.photo.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) await setMainPhoto(file);
});
[els.photo0, els.photo1, els.photo2].forEach((input, i) => {
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await setPanelPhoto(i, file);
  });
});

// One photo across all panels, or a photo per panel.
els.span.addEventListener('change', () => {
  state.span = els.span.checked;
  if (state.span && state.photos[0]) {
    statusEl.textContent = 'One photo across all panels.';
  }
  syncPanelInputs();
  redraw();
});

// Layout.
els.layoutSeg.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-layout]');
  if (!b) return;
  state.layout = b.dataset.layout;
  activePanel = 0;
  syncControls();
  redraw();
});

// Selected panel: sliders move and zoom the active panel's photo.
function panelFromSliders() {
  const t = state.panels[activePanel];
  t.zoom = parseFloat(els.zoom.value);
  t.ox = parseFloat(els.ox.value);
  t.oy = parseFloat(els.oy.value);
  redraw();
}
els.zoom.addEventListener('input', panelFromSliders);
els.ox.addEventListener('input', panelFromSliders);
els.oy.addEventListener('input', panelFromSliders);

// Caption.
els.caption.addEventListener('input', () => { state.caption = els.caption.value; redraw(); });
els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; redraw(); });
els.posSeg.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-pos]');
  if (!b) return;
  state.captionPos = b.dataset.pos;
  syncControls();
  redraw();
});
els.capSize.addEventListener('input', () => {
  state.captionSize = parseFloat(els.capSize.value);
  redraw();
});

// Colour grade.
els.gradeSeg.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-grade]');
  if (!b) return;
  state.grade = b.dataset.grade;
  syncControls();
  redraw();
});

// Export PNG in the three post sizes. Each button sets the size and exports.
document.querySelectorAll('.export button[data-size]').forEach((b) => {
  b.addEventListener('click', async () => {
    const key = b.dataset.size;
    const { w, h } = EXPORT_SIZES[key];
    state.size = key;
    redraw();
    const out = renderCover(w, h, state);
    const blob = await new Promise((res) => out.toBlob(res, 'image/png'));
    window.__lastExport = { size: key, bytes: blob.size };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${key}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved vice-cover-${key}.png (${w} × ${h}, ${Math.round(blob.size / 1024)} KiB).`;
  });
});

// Drag and drop photos onto the preview.
previewEl.addEventListener('dragover', (e) => {
  e.preventDefault();
  previewEl.classList.add('dragover');
});
previewEl.addEventListener('dragleave', () => previewEl.classList.remove('dragover'));
previewEl.addEventListener('drop', async (e) => {
  e.preventDefault();
  previewEl.classList.remove('dragover');
  const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  if (state.span) {
    await setMainPhoto(files[0]);
  } else {
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      await setPanelPhoto(i, files[i]);
    }
  }
});

// Click a panel to select it; drag it to move its photo.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const { rects } = panelRects(state.layout, canvas.width, canvas.height);
  const i = rects.findIndex((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h);
  if (i < 0) return;
  activePanel = i;
  const t = state.panels[i];
  drag = { x: p.x, y: p.y, ox: t.ox, oy: t.oy, w: rects[i].w, h: rects[i].h };
  canvas.setPointerCapture(e.pointerId);
  syncPanelInputs();
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const t = state.panels[activePanel];
  t.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (p.x - drag.x) / drag.w));
  t.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (p.y - drag.y) / drag.h));
  els.ox.value = t.ox;
  els.oy.value = t.oy;
  redraw();
});
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/** Applies a `?shot=` scene: layout, grade, size, caption and sample photos. */
async function loadShot(query) {
  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = query.get('size');
  if (size && EXPORT_SIZES[size]) state.size = size;
  const caption = query.get('caption');
  if (caption !== null) state.caption = caption;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const pos = query.get('pos');
  if (pos === 'top' || pos === 'bottom') state.captionPos = pos;
  const span = query.get('span');
  if (span === '0') state.span = false;
  if (span === '1') state.span = true;
  const capSize = parseFloat(query.get('capSize') || '');
  if (!Number.isNaN(capSize)) state.captionSize = capSize;
  const photo = query.get('photo') || 'strip';
  const img = await loadImage(`samples/${photo}.jpg`);
  state.photos[0] = img;
  if (!state.span) {
    const p2 = query.get('photo2');
    const p3 = query.get('photo3');
    state.photos[1] = p2 ? await loadImage(`samples/${p2}.jpg`) : img;
    state.photos[2] = p3 ? await loadImage(`samples/${p3}.jpg`) : img;
  }
  syncControls();
  redraw();
}

// Start: wait for the Anton lettering, then render (or stage a shot).
async function init() {
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch (e) {
    // Fall back to the system sans if the font cannot load.
  }
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, { loadShot });
  } else {
    redraw();
  }
}
init();
