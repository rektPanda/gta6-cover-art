// Renders the GTA-style multi-panel cover onto a canvas.
// Pure canvas drawing: panels, photos, colour grade, bold caption lettering.
// No network, no outside references: every pixel comes from the photos the
// user loaded and the fonts and colours shipped under app/.

export const EXPORT_SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920 × 1080' },
};

export const LAYOUTS = {
  solo: { panels: 1, label: 'Solo' },
  duo: { panels: 2, label: 'Duo' },
  trio: { panels: 3, label: 'Trio' },
};

// Colour grades: a top wash, a bottom wash and a soft-light tint, all drawn
// over the photos. Sunset is the warm Vice City evening; neon is magenta
// and cyan; noir is dark and moody; vice is pink, purple and teal.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    top: 'rgba(255, 90, 120, 0.28)',
    bottom: 'rgba(140, 20, 90, 0.55)',
    tint: 'rgba(255, 120, 60, 0.20)',
    accent: '#ff2e88',
  },
  neon: {
    label: 'Neon',
    top: 'rgba(0, 220, 255, 0.32)',
    bottom: 'rgba(130, 0, 170, 0.62)',
    tint: 'rgba(255, 0, 180, 0.20)',
    accent: '#00e5ff',
  },
  noir: {
    label: 'Noir',
    top: 'rgba(20, 20, 45, 0.35)',
    bottom: 'rgba(0, 0, 0, 0.68)',
    tint: 'rgba(10, 10, 30, 0.30)',
    accent: '#e8e8e8',
  },
  vice: {
    label: 'Vice',
    top: 'rgba(0, 200, 200, 0.26)',
    bottom: 'rgba(100, 0, 130, 0.58)',
    tint: 'rgba(255, 0, 150, 0.16)',
    accent: '#ff5ce1',
  },
};

export function panelRects(layout, w, h) {
  const count = LAYOUTS[layout].panels;
  const gutter = Math.max(4, Math.round(w * 0.008));
  const pw = (w - gutter * (count - 1)) / count;
  const rects = [];
  for (let i = 0; i < count; i++) {
    rects.push({ x: i * (pw + gutter), y: 0, w: pw, h });
  }
  return { rects, gutter };
}

/** Draws `img` cover-fitting `rect`, scaled by `zoom` and panned by `ox`/`oy`
 *  (fractions of the rect's width and height). Clips to the rect. */
function drawPhotoInRect(ctx, img, rect, zoom, ox, oy) {
  if (!img) return;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Splits `text` into at most two lines that fit `maxWidth` at `font`. */
function wrapCaption(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = line + ' ' + words[i];
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === 2) break;
    }
  }
  lines.push(line);
  if (lines.length > 2) return lines.slice(0, 2);
  return lines;
}

/** Draws the caption and subtitle in bold Anton lettering, white with a dark
 *  outline and shadow, at the top or the bottom of the canvas. Layout, top
 *  to bottom: caption lines, a neon rule, then the subtitle. */
function drawCaption(ctx, w, h, state, grade) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (!text && !sub) return;
  const bottom = state.captionPos !== 'top';
  const sizeScale = state.captionSize || 1;
  let size = h * 0.105 * sizeScale;
  const maxW = w * 0.92;
  // Shrink until the longest word fits, then wrap to at most two lines.
  while (size > 14) {
    const font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    ctx.font = font;
    const longest = text.split(/\s+/).reduce((a, b) => (a.length > b.length ? a : b), '');
    if (ctx.measureText(longest).width <= maxW) break;
    size -= 2;
  }
  const font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  const lines = text ? wrapCaption(ctx, text, maxW, font) : [];
  const lineH = size * 1.05;
  const subSize = Math.max(12, Math.round(h * 0.032 * sizeScale));
  const subFont = `${subSize}px Anton, 'Arial Narrow', sans-serif`;
  const gap1 = size * 0.35;
  const gap2 = size * 0.25;
  const ruleH = Math.max(3, Math.round(size * 0.07));
  const linesH = lines.length * lineH;
  const blockH =
    linesH +
    (lines.length ? gap1 + ruleH : 0) +
    (sub ? gap2 + subSize : 0);
  let cy = bottom ? h - h * 0.055 - blockH : h * 0.055;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  // Caption lines.
  ctx.font = font;
  ctx.strokeStyle = 'rgba(10, 5, 20, 0.9)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.03;
  for (const line of lines) {
    cy += lineH;
    ctx.strokeText(line, w / 2, cy);
    ctx.fillText(line, w / 2, cy);
  }
  // Neon rule under the caption, with a clear gap above and below it.
  if (lines.length) {
    const ruleW = Math.min(w * 0.6, ctx.measureText(lines[0]).width * 0.7);
    const ruleTop = cy + gap1;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = grade.accent;
    ctx.fillRect((w - ruleW) / 2, ruleTop, ruleW, ruleH);
    cy = ruleTop + ruleH;
  }
  // Subtitle.
  if (sub) {
    cy += gap2 + subSize;
    ctx.font = subFont;
    ctx.lineWidth = Math.max(1.5, subSize * 0.12);
    ctx.shadowBlur = subSize * 0.2;
    ctx.shadowOffsetY = subSize * 0.05;
    ctx.fillStyle = '#ffffff';
    ctx.strokeText(sub, w / 2, cy);
    ctx.fillText(sub, w / 2, cy);
  }
  ctx.restore();
}

/** Draws the whole cover onto `canvas` at its own size.
 *  `state`: { layout, span, photos, panels, caption, subtitle, captionPos,
 *  captionSize, grade }. `photos` holds an image (or null) per panel;
 *  `panels` holds { zoom, ox, oy } per panel. In span mode the first photo
 *  fills the whole canvas and every panel shows its slice. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const { rects, gutter } = panelRects(state.layout, w, h);
  const count = rects.length;

  // Backdrop.
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  // Photos.
  if (state.span) {
    const img = state.photos[0];
    const t = state.panels[0] || { zoom: 1, ox: 0, oy: 0 };
    drawPhotoInRect(ctx, img, { x: 0, y: 0, w, h }, t.zoom, t.ox, t.oy);
  } else {
    for (let i = 0; i < count; i++) {
      const t = state.panels[i] || { zoom: 1, ox: 0, oy: 0 };
      drawPhotoInRect(ctx, state.photos[i], rects[i], t.zoom, t.ox, t.oy);
    }
  }

  // Panel gutters: dark seams between panels.
  if (count > 1) {
    ctx.fillStyle = '#0d0616';
    for (let i = 1; i < count; i++) {
      ctx.fillRect(rects[i].x - gutter, 0, gutter, h);
    }
  }

  // Colour grade: vertical wash, soft-light tint, legibility darkening.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const shade = ctx.createLinearGradient(0, h * 0.55, 0, h);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  if (state.captionPos === 'top') {
    const topShade = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    topShade.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    topShade.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, w, h);
  }

  // Vignette: darkened corners for depth.
  const vg = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.45,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // Caption.
  drawCaption(ctx, w, h, state, grade);

  // Thin outer frame.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Renders the cover at `width` x `height` and returns the canvas. */
export function renderCover(width, height, state) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state);
  return canvas;
}
