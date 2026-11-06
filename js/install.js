// Instalar Planner en la pantalla de inicio o el escritorio, desde cualquier navegador.
// Donde el navegador lo permite (Chrome, Edge, Samsung… en Android y en el ordenador)
// basta un toque. En el iPhone ningún navegador deja instalar con un botón: se explica
// el camino exacto según el navegador que se esté usando.
import { ic, sheet, toast } from './ui.js';

let deferred = null;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferred = e;
  document.querySelectorAll('[data-install]').forEach(b => { b.textContent = 'Instalar'; });
  dispatchEvent(new Event('bea:install'));
});
addEventListener('appinstalled', () => { deferred = null; toast('Planner ya está instalada'); dispatchEvent(new Event('bea:install')); });

// Dirección nueva (antes …/beastudio/). Abierta en el navegador, la antigua salta sola a la
// nueva y los datos siguen ahí (misma web). La app ya instalada desde la antigua recibe un
// aviso en «Hoy» con los pasos para pasarse (en el iPhone guarda sus datos aparte).
// Desactivado (vacío): de momento la app sigue en …/beastudio/. Para mudarla, crear antes el
// repositorio «planner», publicar allí y poner aquí 'https://danem88.github.io/planner/'.
export const NEW_HOME = '';
export const isOldHome = () => !!NEW_HOME && location.hostname === 'danem88.github.io' && location.pathname.startsWith('/beastudio');

export const isInstalled =() => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
export const canOneClick = () => !!deferred;

function where() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const inApp = /Instagram|FBAN|FBAV|Line\/|TikTok|Snapchat|musical_ly/i.test(ua);
  let browser = 'otro';
  if (ios) browser = /CriOS/.test(ua) ? 'chrome' : /FxiOS/.test(ua) ? 'firefox' : /EdgiOS/.test(ua) ? 'edge' : /OPiOS|OPT\//.test(ua) ? 'opera' : /Safari/.test(ua) ? 'safari' : 'otro';
  else if (/SamsungBrowser/.test(ua)) browser = 'samsung';
  else if (/Firefox/.test(ua)) browser = 'firefox';
  else if (/Edg\//.test(ua)) browser = 'edge';
  else if (/OPR\//.test(ua)) browser = 'opera';
  else if (/Chrome/.test(ua)) browser = 'chrome';
  else if (/Safari/.test(ua)) browser = 'safari';
  return { os: ios ? 'ios' : android ? 'android' : 'pc', browser, inApp };
}

const SHARE = `<b>Compartir</b> <span class="kbd">${'<svg class="i mini" aria-hidden="true"><use href="#i-share"/></svg>'}</span>`;
function steps({ os, browser }) {
  if (os === 'ios') {
    const first = {
      safari: `Toca ${SHARE} en la barra de abajo (o arriba, en el iPad).`,
      chrome: `Toca ${SHARE} arriba a la derecha, junto a la dirección.`,
      edge: `Toca el menú <b>···</b> de abajo y luego ${SHARE}.`,
      firefox: `Toca el menú <b>☰</b> y luego ${SHARE}.`,
      opera: `Toca el menú y luego ${SHARE}.`,
      otro: `Busca el botón ${SHARE} del navegador.`,
    }[browser];
    return [first, 'Baja en la lista y elige <b>«Añadir a pantalla de inicio»</b>.', 'Toca <b>«Añadir»</b>. Ábrela siempre desde su icono.'];
  }
  if (os === 'android') {
    if (browser === 'firefox') return ['Toca el menú <b>⋮</b>.', 'Elige <b>«Instalar»</b> o <b>«Añadir a pantalla de inicio»</b>.', 'Confirma con <b>«Añadir»</b>.'];
    if (browser === 'samsung') return ['Toca el menú <b>☰</b> de abajo.', 'Elige <b>«Añadir página a»</b> › <b>«Pantalla de inicio»</b>.', 'Confirma con <b>«Añadir»</b>.'];
    return ['Toca el menú <b>⋮</b> arriba a la derecha.', 'Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.', 'Confirma con <b>«Instalar»</b>.'];
  }
  if (browser === 'safari') return ['En la barra de menús, abre <b>Archivo</b>.', 'Elige <b>«Añadir al Dock»</b>.', 'Confirma con <b>«Añadir»</b>.'];
  if (browser === 'firefox') return ['Firefox para ordenador no instala apps web.', 'Abre esta misma dirección en <b>Chrome</b> o <b>Edge</b>.', 'Allí aparecerá el botón <b>«Instalar Planner»</b>.'];
  return [`Pulsa el icono de instalar ${'<svg class="i mini" aria-hidden="true"><use href="#i-home"/></svg>'} a la derecha de la dirección (o menú <b>⋮</b> › <b>«Instalar Planner»</b>).`, 'Confirma con <b>«Instalar»</b>.', 'Tendrás Planner en el escritorio y en el menú de inicio.'];
}

export async function promptInstall() {
  if (!deferred) return false;
  const e = deferred; deferred = null;
  e.prompt();
  const { outcome } = await e.userChoice.catch(() => ({ outcome: 'dismissed' }));
  dispatchEvent(new Event('bea:install'));
  return outcome === 'accepted';
}

export function openInstall() {
  if (isInstalled()) { toast('Ya la estás usando como app'); return; }
  const w = where();
  const names = { safari: 'Safari', chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox', samsung: 'Samsung Internet', opera: 'Opera', otro: 'tu navegador' };
  const device = w.os === 'ios' ? 'iPhone' : w.os === 'android' ? 'Android' : 'ordenador';
  const { el, close } = sheet(`
    <h2>Instalar Planner</h2>
    ${deferred ? `<p class="small" style="margin:-.4rem 0 .9rem;line-height:1.45">Se añade con su icono${w.os === 'pc' ? ' al escritorio y al menú de inicio' : ' a la pantalla de inicio'} y funciona sin internet.</p>
      <button class="btn pri wide" data-go>${ic('i-home')} Instalar ahora</button>` : `
      <p class="small" style="margin:-.4rem 0 .9rem;line-height:1.45">${w.inApp ? '<b>Estás dentro de otra app (Instagram, TikTok…).</b> Ábrela antes en el navegador con el menú <b>···</b> › «Abrir en el navegador». Después:<br>' : ''}En ${names[w.browser]} (${device}):</p>
      <ol class="isteps">${steps(w).map(s => `<li>${s}</li>`).join('')}</ol>`}
    ${w.os === 'ios' ? '<p class="small" style="margin-top:.9rem;line-height:1.45">En el iPhone, la app instalada guarda sus datos aparte del navegador: si ya habías apuntado cosas aquí, haz antes una copia en Ajustes y recupérala al abrir la app.</p>' : ''}`, { label: 'Instalar' });
  el.querySelector('[data-go]')?.addEventListener('click', async () => { const ok = await promptInstall(); close(); if (!ok) toast('Puedes instalarla cuando quieras desde Ajustes'); });
}
