// Fixed scenes for screenshots: ?shot=cover shows the cover alone;
// ?shot=editor shows the editor with a sample photo loaded.
// Query params: photo, photo2, photo3 (sample names), caption, subtitle,
// layout, grade, size, span (1 or 0), pos (top or bottom), capSize.
// `app` is the editor object main.js builds: it loads the samples and
// applies the state. window.__shotReady is set once painted.
export async function runShot(shot, query, app) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await app.loadShot(query);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
