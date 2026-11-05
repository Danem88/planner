// Arranque y navegación de Beastudio.
import { load, D } from './store.js';
import { injectSprite } from './ui.js';
import { $ } from './util.js';
import * as hoy from './hoy.js';
import * as horario from './horario.js';
import * as fechas from './fechas.js';
import * as materias from './materias.js';
import * as notas from './notas.js';
import * as ajustes from './ajustes.js';
import { openAdd } from './add.js';
import { showWelcome } from './welcome.js';

// #ruta/param1/param2 → vista
const ROUTES = {
  hoy: { view: hoy, tab: 'hoy' },
  horario: { view: horario, tab: 'horario' },
  fechas: { view: fechas, tab: 'fechas' },
  materias: { view: materias, tab: 'materias' },
  notas: { view: notas, tab: 'notas' },
  nota: { view: notas, tab: 'notas', fn: 'renderNote', noTabs: true },
  ajustes: { view: ajustes, tab: 'hoy' },
};

let cleanup = null;
export function route() {
  const [name, ...params] = (location.hash.slice(1) || 'hoy').split('/').map(decodeURIComponent);
  const r = ROUTES[name] || ROUTES.hoy;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  document.body.classList.remove('editing');
  document.body.classList.toggle('no-tabs', !!r.noTabs);
  document.querySelectorAll('#tabbar a').forEach(a => {
    if (a.dataset.tab === r.tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const view = $('#view');
  view.innerHTML = '';
  cleanup = (r.view[r.fn || 'render'])(view, params) || null;
}

// Vuelve a pintar la vista actual sin perder el sitio.
export function refresh() {
  const y = scrollY;
  route();
  scrollTo(0, y);
}
window.addEventListener('bea:refresh', refresh);

function applyTheme() {
  let t = 'auto';
  try { t = JSON.parse(localStorage.getItem('bea.theme') || '"auto"'); } catch (e) {}
  if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').content = dark ? '#0D0B0C' : '#FBF6F5';
}
window.addEventListener('bea:theme', applyTheme);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

async function boot() {
  injectSprite();
  applyTheme();
  await load();
  // Pedir a Safari que no borre los datos aunque falte espacio.
  try { navigator.storage?.persist?.(); } catch (e) {}
  $('#fab').onclick = () => openAdd();
  addEventListener('hashchange', () => { route(); scrollTo(0, 0); });
  route();
  if (!D.onboarded) showWelcome(() => route());
  // Al volver a la app otro día, refrescar «Hoy».
  let lastDay = new Date().getDate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && new Date().getDate() !== lastDay) { lastDay = new Date().getDate(); refresh(); }
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
