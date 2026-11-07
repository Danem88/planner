// Arranque y navegación de Planner.
import { load, D } from './store.js';
import { injectSprite, nav, goBack, applyDeco, toast } from './ui.js';
import { isInstalled, isOldHome } from './install.js';   // escucha cuanto antes el aviso de «se puede instalar»
import { $ } from './util.js';
import * as hoy from './hoy.js';
import * as horario from './horario.js';
import * as fechas from './fechas.js';
import * as materias from './materias.js';
import * as notas from './notas.js';
import * as ajustes from './ajustes.js';
import * as organizar from './organizar.js';
import * as share from './share.js';
import * as buscar from './buscar.js';
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
  organizar: { view: organizar, tab: 'hoy' },
  importar: { view: share, tab: 'fechas', fn: 'renderImport' },
  buscar: { view: buscar, tab: 'hoy' },
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
  const res = (r.view[r.fn || 'render'])(view, params);
  cleanup = typeof res === 'function' ? res : null;
}

// Vuelve a pintar la vista actual sin perder el sitio.
export function refresh() {
  const y = scrollY;
  route();
  scrollTo(0, y);
}
window.addEventListener('bea:refresh', refresh);

// Historial propio: «Atrás» vuelve a la pantalla anterior y al mismo sitio de la lista.
const scrolls = new Map();
function onHash() {
  const h = location.hash || '#hoy';
  const st = nav.stack;
  const prev = st[st.length - 1];
  if (prev) scrolls.set(prev, scrollY);
  let back = false;
  if (nav.replacing) { nav.replacing = false; if (st.length) st[st.length - 1] = h; else st.push(h); }
  else if (st.length > 1 && st[st.length - 2] === h) { st.pop(); back = true; }
  else if (prev !== h) st.push(h);
  route();
  scrollTo(0, back ? (scrolls.get(h) || 0) : 0);
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-back]');
  if (!a) return;
  e.preventDefault();
  goBack(a.getAttribute('href'));
});

export function applyTheme() {
  let t = 'auto';
  try { t = JSON.parse(localStorage.getItem('bea.theme') || '"auto"'); } catch (e) {}
  const root = document.documentElement;
  if (t === 'auto') delete root.dataset.theme; else root.dataset.theme = t;
  const acc = D.prefs?.accent || 'rosa';
  if (acc === 'rosa') delete root.dataset.accent; else root.dataset.accent = acc;
  try { localStorage.setItem('bea.accent', acc); } catch (e) {}
  if (D.prefs) applyDeco(D.prefs.deco);
  requestAnimationFrame(() => {
    document.querySelector('meta[name=theme-color]').content = getComputedStyle(document.body).backgroundColor;
  });
}
window.addEventListener('bea:theme', applyTheme);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

// Orden de la barra de abajo (se puede cambiar en Ajustes › Organizar).
export function applyTabs() {
  const bar = $('#tabbar');
  for (const k of D.prefs.tabOrder) { const a = bar.querySelector(`[data-tab="${k}"]`); if (a) bar.append(a); }
}
window.addEventListener('bea:tabs', applyTabs);

async function boot() {
  // Dirección antigua abierta en el navegador: a la nueva (misma web, mismos datos).
  if (isOldHome() && !isInstalled()) { location.replace(NEW_HOME + location.hash); return; }
  injectSprite();
  applyTheme();
  try { await load(); }
  catch (e) {
    // Sin leer los datos no se enseña nada (y nada se guarda): mejor reintentar.
    $('#view').innerHTML = `<div class="empty" style="margin-top:30vh">No se han podido abrir tus datos.<br>Cierra la app del todo y vuelve a abrirla.<br><button class="btn pri" onclick="location.reload()">Reintentar</button></div>`;
    return;
  }
  applyTheme();
  applyTabs();
  // Pedir a Safari que no borre los datos aunque falte espacio.
  try { navigator.storage?.persist?.(); } catch (e) {}
  $('#fab').onclick = () => openAdd();
  addEventListener('hashchange', onHash);
  nav.stack.push(location.hash || '#hoy');
  route();
  if (!D.onboarded) showWelcome(() => route());
  // Al volver a la app otro día, refrescar «Hoy».
  let lastDay = new Date().getDate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && new Date().getDate() !== lastDay) { lastDay = new Date().getDate(); refresh(); }
  });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // Cuando llega una versión nueva, se avisa para cargarla (salvo en mitad de una nota).
    const hadOne = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadOne) return;
      if (location.hash.startsWith('#nota/')) return;
      toast('Hay una versión nueva de Planner', () => location.reload(), 'Actualizar', 15000);
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
