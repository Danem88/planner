// Piezas comunes de la interfaz: iconos, hojas, menús, preguntas y avisos.
import { esc } from './util.js';
import { D, color, catColor } from './store.js';

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="fl" viewBox="-12 -12 24 24"><g fill="currentColor"><ellipse cx="0" cy="-6" rx="3.6" ry="5.4"/><ellipse cx="0" cy="-6" rx="3.6" ry="5.4" transform="rotate(72)"/><ellipse cx="0" cy="-6" rx="3.6" ry="5.4" transform="rotate(144)"/><ellipse cx="0" cy="-6" rx="3.6" ry="5.4" transform="rotate(216)"/><ellipse cx="0" cy="-6" rx="3.6" ry="5.4" transform="rotate(288)"/></g><circle r="2.6" fill="var(--bg)"/><circle r="1.5" fill="currentColor" opacity=".6"/></symbol>
<symbol id="fl2" viewBox="-12 -12 24 24"><g fill="none" stroke="currentColor" stroke-width="1.2"><ellipse cx="0" cy="-6.2" rx="2.6" ry="4.6"/><ellipse cx="0" cy="-6.2" rx="2.6" ry="4.6" transform="rotate(60)"/><ellipse cx="0" cy="-6.2" rx="2.6" ry="4.6" transform="rotate(120)"/><ellipse cx="0" cy="-6.2" rx="2.6" ry="4.6" transform="rotate(180)"/><ellipse cx="0" cy="-6.2" rx="2.6" ry="4.6" transform="rotate(240)"/><ellipse cx="0" cy="-6.2" rx="2.6" ry="4.6" transform="rotate(300)"/><circle r="2"/></g></symbol>
<symbol id="i-hoy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g></symbol>
<symbol id="i-hor" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></g></symbol>
<symbol id="i-fec" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.8h5"/></g></symbol>
<symbol id="i-asi" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 5.5c2.8-1.2 5.5-1 8 .8 2.5-1.8 5.2-2 8-.8v13c-2.8-1.2-5.5-1-8 .8-2.5-1.8-5.2-2-8-.8z"/><path d="M12 6.3v13"/></g></symbol>
<symbol id="i-not" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8.5h5M9 12.5h6M9 16h4"/></g></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
<symbol id="i-ok" viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-srch" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></g></symbol>
<symbol id="i-img" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/></g></symbol>
<symbol id="i-cam" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3.5 8.5h3.5l1.7-2.5h6.6l1.7 2.5h3.5v10.5h-17z"/><circle cx="12" cy="13.3" r="3.4"/></g></symbol>
<symbol id="i-lnk" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></g></symbol>
<symbol id="i-mic" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/></g></symbol>
<symbol id="i-chk" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 12.3l2.5 2.5 4.5-5"/></g></symbol>
<symbol id="i-txt" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 7V5h14v2M12 5v14M9 19h6"/></g></symbol>
<symbol id="i-share" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 11H5.5v9.5h13V11H17"/></g></symbol>
<symbol id="i-more" viewBox="0 0 24 24"><g fill="currentColor"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></g></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M9 3.5h6l-1 5 3 3v1.5h-4.2V20L12 21l-.8-1v-7H7v-1.5l3-3z" fill="currentColor"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><g fill="currentColor"><rect x="7" y="5.5" width="3.6" height="13" rx="1"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="1"/></g></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></symbol>
<symbol id="i-gear" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.2 2.5 1.2 2.5-2.3 1.6-.6 2.7-2.7-.6L12 21.2l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6L6 12.7 4.8 10.2l2.3-1.6.6-2.7 2.7.6z" stroke-linejoin="round"/></g></symbol>
<symbol id="i-edit" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></g></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/></g></symbol>
<symbol id="i-up" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-move" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5h6l2 2h9v9h-17z"/><path d="M11 14h6M14.5 11.5L17 14l-2.5 2.5"/></g></symbol>
<symbol id="i-list" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r=".9" fill="currentColor"/><circle cx="4.5" cy="12" r=".9" fill="currentColor"/><circle cx="4.5" cy="17.5" r=".9" fill="currentColor"/></g></symbol>
<symbol id="i-olist" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 6.5h10M10 12h10M10 17.5h10"/></g><g fill="currentColor" font-family="sans-serif" font-size="6.5" font-weight="700"><text x="2.5" y="9">1</text><text x="2.5" y="14.5">2</text><text x="2.5" y="20">3</text></g></symbol>
<symbol id="i-mark" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5l5 5-8 8H7v-4.5z"/><path d="M4 20.5h16" stroke-width="3" opacity=".45"/></g></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7" stroke-linecap="round"/></g></symbol>
<symbol id="i-clip" viewBox="0 0 24 24"><path d="M19 11.5l-7.2 7.2a4.6 4.6 0 0 1-6.5-6.5l7.6-7.6a3.1 3.1 0 0 1 4.4 4.4l-7.5 7.5a1.5 1.5 0 0 1-2.2-2.2l6.9-6.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-bell" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></g></symbol>
<symbol id="i-drag" viewBox="0 0 24 24"><g fill="currentColor"><circle cx="9" cy="6.5" r="1.5"/><circle cx="15" cy="6.5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17.5" r="1.5"/><circle cx="15" cy="17.5" r="1.5"/></g></symbol>
<symbol id="i-left" viewBox="0 0 24 24"><path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-right" viewBox="0 0 24 24"><path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-cal" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></g><g fill="currentColor"><circle cx="8.5" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="15.5" cy="14" r="1"/></g></symbol>
<symbol id="i-palette" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.6-1.8-.3-1.3.5-2.2 1.8-2.2h1.6a3.5 3.5 0 0 0 3.5-3.5c0-5.2-3.8-9.5-8.5-9.5z"/></g><g fill="currentColor"><circle cx="7.8" cy="11" r="1.3"/><circle cx="10.5" cy="7.3" r="1.3"/><circle cx="15" cy="7.6" r="1.3"/></g></symbol>
<symbol id="i-rot" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4v4.5H15"/></g></symbol>
<symbol id="i-crop" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 2.5v15h15"/><path d="M2.5 6.5h15v15"/></g></symbol>
<symbol id="i-grid"viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></g></symbol>
</defs></svg>`;

export const refresh = () => dispatchEvent(new Event('bea:refresh'));

export function injectSprite() {
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
  let d = 'flores';
  try { d = localStorage.getItem('bea.deco') || 'flores'; } catch (e) {}
  applyDeco(d);
}

// Adornos de la app (Ajustes › Estilo): flores, formas geométricas o casi nada.
// Se cambia el dibujo de los dos símbolos «fl» y «fl2», que usan todas las pantallas.
const DECO = {
  formas: [
    '<rect x="-7" y="-7" width="14" height="14" rx="3.5" transform="rotate(45)" fill="currentColor"/><circle r="2.4" fill="var(--bg)"/>',
    '<g fill="none" stroke="currentColor" stroke-width="1.4"><circle r="8.5"/><circle r="4"/></g><circle r="1.4" fill="currentColor"/>',
  ],
  nada: [
    '<circle r="5" fill="currentColor"/>',
    '<circle r="6" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  ],
};
let floresSvg = null;
export function applyDeco(deco) {
  const a = document.getElementById('fl'), b = document.getElementById('fl2');
  if (!a || !b) return;
  if (!floresSvg) floresSvg = [a.innerHTML, b.innerHTML];
  const [x, y] = DECO[deco] || floresSvg;
  a.innerHTML = x; b.innerHTML = y;
  document.documentElement.dataset.deco = DECO[deco] ? deco : 'flores';
  try { localStorage.setItem('bea.deco', DECO[deco] ? deco : 'flores'); } catch (e) {}
}
export const ic = (name, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${name}"/></svg>`;
// «Atrás» vuelve a la pantalla de antes; si se abrió directamente, a la indicada.
export const backLink = (href, label) => `<a class="back" href="${href}" data-back>${ic('i-back')}<span>${esc(label)}</span></a>`;

// ---- navegación ----
export const nav = { stack: [], replacing: false };
export function goBack(fallback) {
  if (nav.stack.length > 1) history.back();
  else replaceHash(fallback);
}
export function replaceHash(h) {
  if (location.hash === h) return;
  nav.replacing = true;
  location.replace(h);
}

export function ring(daysLeft, size = 58, stroke = 4) {
  const r = (size - stroke) / 2 - 1, c = 2 * Math.PI * r;
  const frac = Math.max(0.04, Math.min(1, 1 - daysLeft / 14));
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--rosa2)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--rosaT)" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - frac)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}

export function subjectOptions(selected, { none = 'Sin asignatura', add = true } = {}) {
  return (none ? `<option value="">${esc(none)}</option>` : '') +
    D.subjects.map(s => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${esc(s.name)}</option>`).join('') +
    (add ? `<option value="__new">+ Nueva asignatura…</option>` : '');
}
export const colorDot = sid => `<span class="dot" style="background:${color(sid)}"></span>`;
export const catDot = k => `<span class="dot cat" style="--c:${catColor(k)}"></span>`;

// ---- hoja que sube desde abajo ----
let openSheets = 0;
export function sheet(html, { onClose, label = 'Ventana' } = {}) {
  const dim = document.createElement('div');
  dim.className = 'dimmer';
  const el = document.createElement('div');
  el.className = 'sheet';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', label);
  el.innerHTML = `<div class="grab"></div>${html}`;
  document.body.append(dim, el);
  openSheets++;
  // Con el teclado abierto, la hoja sube por encima de él (si no, tapaba «Guardar»).
  const vv = window.visualViewport;
  const fit = () => {
    if (!vv) return;
    const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
    el.style.bottom = kb + 'px';
    el.style.maxHeight = kb ? `${vv.height - 8}px` : '';
  };
  vv?.addEventListener('resize', fit); vv?.addEventListener('scroll', fit);
  requestAnimationFrame(() => { dim.classList.add('on'); el.classList.add('on'); });
  let closed = false;
  const close = (val) => {
    if (closed) return; closed = true; openSheets--;
    dim.classList.remove('on'); el.classList.remove('on');
    setTimeout(() => { dim.remove(); el.remove(); }, 300);
    removeEventListener('keydown', onKey);
    vv?.removeEventListener('resize', fit); vv?.removeEventListener('scroll', fit);
    onClose && onClose(val);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  dim.onclick = () => close();
  // Bajar la hoja deslizando desde el asa.
  let y0 = null;
  el.addEventListener('touchstart', e => { if (el.scrollTop <= 0 && e.target.closest('.grab, h2')) y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchmove', e => { if (y0 != null) { const dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = `translate(-50%, ${dy}px)`; } }, { passive: true });
  el.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; el.style.transform = ''; if (dy > 90) close(); });
  return { el, close };
}
export const sheetOpen = () => openSheets > 0;

// Menú de opciones: [{ label, icon, danger, run }]
export function menu(title, items) {
  const { el, close } = sheet(`${title ? `<h2>${esc(title)}</h2>` : ''}<div class="menu">${items.map((it, i) =>
    `<button class="mi ${it.danger ? 'danger' : ''}" data-i="${i}">${it.icon ? ic(it.icon) : ''}${esc(it.label)}</button>`).join('')}</div>`, { label: title || 'Opciones' });
  el.querySelectorAll('.mi').forEach(b => b.onclick = () => { close(); setTimeout(() => items[+b.dataset.i].run(), 120); });
}

// Pregunta sí/no. Devuelve una promesa.
export function ask(text, { ok = 'Sí', cancel = 'Cancelar', danger = false, detail = '' } = {}) {
  return new Promise(res => {
    const { el, close } = sheet(`<h2>${esc(text)}</h2>${detail ? `<p class="small" style="margin:-.4rem 0 .4rem;line-height:1.45">${esc(detail)}</p>` : ''}
      <div class="acts"><button class="btn" data-a="no">${esc(cancel)}</button><button class="btn ${danger ? 'pri' : 'pri'}" data-a="yes" ${danger ? 'style="background:var(--accent);color:#fff"' : ''}>${esc(ok)}</button></div>`,
      { onClose: v => res(v === true), label: text });
    el.querySelector('[data-a=no]').onclick = () => close(false);
    el.querySelector('[data-a=yes]').onclick = () => close(true);
  });
}

// Pedir un texto corto (nombre de sección, etc.).
export function askText(title, { value = '', placeholder = '', ok = 'Guardar' } = {}) {
  return new Promise(res => {
    const { el, close } = sheet(`<h2>${esc(title)}</h2><input class="inp" value="${esc(value)}" placeholder="${esc(placeholder)}" enterkeyhint="done">
      <div class="acts"><button class="btn" data-a="no">Cancelar</button><button class="btn pri" data-a="yes">${esc(ok)}</button></div>`,
      { onClose: v => res(typeof v === 'string' ? v : null), label: title });
    const inp = el.querySelector('input');
    setTimeout(() => { inp.focus(); inp.select(); }, 320);
    const done = () => { const v = inp.value.trim(); if (v) close(v); };
    inp.onkeydown = e => { if (e.key === 'Enter') done(); };
    el.querySelector('[data-a=no]').onclick = () => close(null);
    el.querySelector('[data-a=yes]').onclick = done;
  });
}

// Aviso pequeño abajo, con «Deshacer» opcional.
let toastEl, toastT;
export function toast(text, undo, btn = 'Deshacer', ms) {
  toastEl?.remove(); clearTimeout(toastT);
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(text)}</span>${undo ? `<button>${esc(btn)}</button>` : ''}`;
  document.body.append(t);
  toastEl = t;
  requestAnimationFrame(() => t.classList.add('on'));
  if (undo) t.querySelector('button').onclick = () => { undo(); hide(); };
  const hide = () => { t.classList.remove('on'); setTimeout(() => t.remove(), 250); };
  toastT = setTimeout(hide, ms || (undo ? 5000 : 2200));
}

// ---- colores ----
// 24 de la paleta + «Más colores» (18 tonos × 6 intensidades + grises, generados aquí
// para no cargar el CSS) + «Cualquier color» con el selector del propio móvil.
const hex = (h, s, l) => {
  s /= 100; l /= 100;
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
};
// Al usarse se suavizan (--cmix), así que aquí van algo más intensos.
const TONES = [[75, 84], [70, 74], [62, 64], [56, 54], [50, 44], [45, 34]];
const MORE = [
  ...Array.from({ length: 18 }, (_, i) => TONES.map(([s, l]) => hex(i * 20, s, l))).flat(),
  ...[88, 74, 60, 46, 32, 18].map(l => hex(20, 8, l)),
];
const isPreset = c => typeof c === 'number' || /^\d+$/.test(c);
const swatchBtn = (c, sel) => `<button type="button" data-c="${c}" role="radio" aria-checked="${String(c) === String(sel)}" style="background:${isPreset(c) ? `var(--s${c})` : `color-mix(in srgb, ${c} var(--cmix), var(--cmixbg))`}" aria-label="Color ${c}"></button>`;
export function swatches(sel, label = 'Color') {
  const custom = typeof sel === 'string' && sel[0] === '#';
  const inMore = custom && MORE.includes(sel);
  return `<div class="colorpick">
    <div class="swatches" role="radiogroup" aria-label="${esc(label)}">${Array.from({ length: 24 }, (_, i) => swatchBtn(i + 1, sel)).join('')}</div>
    <details class="morecolors" ${inMore ? 'open' : ''}><summary>Más colores</summary>
      <div class="swatches more" role="radiogroup" aria-label="Más colores">${MORE.map(c => swatchBtn(c, sel)).join('')}</div></details>
    <label class="anycolor"><span class="cur" style="background:${custom ? sel : 'conic-gradient(#f2a3a3, #f2d8a3, #b8e2a8, #a3d8f2, #c3a3f2, #f2a3d8, #f2a3a3)'}"></span>
      Cualquier color<input type="color" value="${custom ? sel : '#e7b7bd'}" aria-label="Elegir cualquier color"></label>
  </div>`;
}
export function bindSwatches(root, onPick) {
  const all = () => root.querySelectorAll('.swatches [data-c]');
  all().forEach(b => b.onclick = () => {
    all().forEach(x => x.setAttribute('aria-checked', x === b));
    onPick(isPreset(b.dataset.c) ? +b.dataset.c : b.dataset.c);
  });
  const inp = root.querySelector('.anycolor input');
  if (inp) inp.onchange = () => {
    all().forEach(x => x.setAttribute('aria-checked', 'false'));
    root.querySelector('.anycolor .cur').style.background = inp.value;
    onPick(inp.value.toLowerCase());
  };
}
export function pickColor(title, sel) {
  return new Promise(res => {
    const { el, close } = sheet(`<h2>${esc(title)}</h2>${swatches(sel, title)}`, { label: title, onClose: v => res(v != null && typeof v !== 'object' ? v : null) });
    bindSwatches(el, c => setTimeout(() => close(c), 150));
  });
}

// Deslizar una fila con el dedo: a la derecha y a la izquierda hace cada una su acción.
// opts: { right: { label, run }, left: { label, run } }. Se enseña lo que hará detrás de la fila.
export function swipeRow(row, opts) {
  const list = row.parentNode;
  let x0 = null, y0 = 0, dx = 0, mode = null, pid = null, hint = null, swiped = false;
  const reset = () => {
    row.style.transition = 'transform .2s'; row.style.transform = '';
    setTimeout(() => { row.style.transition = ''; hint?.remove(); hint = null; row.classList.remove('swiping'); }, 200);
  };
  row.addEventListener('pointerdown', e => {
    if (e.button || !e.isPrimary) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; mode = null; pid = e.pointerId;
  });
  row.addEventListener('pointermove', e => {
    if (x0 == null || e.pointerId !== pid) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!mode) {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { x0 = null; return; }   // desplazar la página
      if (Math.abs(mx) < 12) return;
      mode = 'h';
      try { row.setPointerCapture(pid); } catch (err) {}
      row.classList.add('swiping');
      hint = document.createElement('div');
      hint.className = 'swipehint';
      hint.style.top = row.offsetTop + 'px'; hint.style.height = row.offsetHeight + 'px';
      hint.innerHTML = `<span class="r">${ic('i-ok')} ${esc(opts.right.label)}</span><span class="l">${esc(opts.left.label)} ${ic('i-right')}</span>`;
      list.insertBefore(hint, row);
    }
    dx = Math.max(-140, Math.min(140, mx));
    row.style.transform = `translateX(${dx}px)`;
    hint.dataset.dir = dx > 0 ? 'r' : 'l';
    hint.classList.toggle('go', Math.abs(dx) > 80);
  });
  const end = () => {
    if (x0 == null) return;
    x0 = null;
    if (mode !== 'h') return;
    swiped = true; setTimeout(() => { swiped = false; }, 350);
    const act = dx > 80 ? opts.right : dx < -80 ? opts.left : null;
    reset();
    if (act) setTimeout(() => act.run(), 120);
  };
  row.addEventListener('pointerup', end);
  row.addEventListener('pointercancel', end);
  // Tras deslizar, el toque no debe abrir la tarea ni marcar la casilla.
  row.addEventListener('click', e => { if (swiped) { e.stopPropagation(); e.preventDefault(); } }, true);
}

// Lista que se ordena arrastrando el asa (⠿). Cada hijo lleva data-id y un .handle.
export function sortable(list, onDone) {
  const finish = () => onDone([...list.children].map(c => c.dataset.id));
  list.addEventListener('pointerdown', e => {
    const h = e.target.closest('.handle'); if (!h || !list.contains(h)) return;
    const item = h.closest('[data-id]');
    e.preventDefault();
    let y0 = e.clientY;
    item.classList.add('dragging');
    // Se mueven los vecinos, nunca la fila arrastrada (moverla cortaría el arrastre).
    const move = ev => {
      ev.preventDefault();
      const dy = ev.clientY - y0;
      const prev = item.previousElementSibling, next = item.nextElementSibling;
      if (prev && dy < -prev.offsetHeight / 2) { item.after(prev); y0 -= prev.offsetHeight; }
      else if (next && dy > next.offsetHeight / 2) { item.before(next); y0 += next.offsetHeight; }
      item.style.transform = `translateY(${ev.clientY - y0}px)`;
    };
    const up = () => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      item.style.transform = ''; item.classList.remove('dragging');
      finish();
    };
    addEventListener('pointermove', move, { passive: false }); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  // Con teclado o VoiceOver: flechas arriba/abajo sobre el asa.
  list.addEventListener('keydown', e => {
    const h = e.target.closest('.handle'); if (!h || !/^Arrow(Up|Down)$/.test(e.key)) return;
    const item = h.closest('[data-id]');
    e.preventDefault();
    if (e.key === 'ArrowUp' && item.previousElementSibling) list.insertBefore(item, item.previousElementSibling);
    else if (e.key === 'ArrowDown' && item.nextElementSibling) list.insertBefore(item.nextElementSibling, item);
    else return;
    h.focus(); finish();
  });
}

// Al elegir «+ Nueva asignatura…» en un desplegable.
export async function handleNewSubject(select, addSubject) {
  if (select.value !== '__new') return;
  const name = await askText('Nueva asignatura', { placeholder: 'Por ejemplo: Física y Química', ok: 'Añadir' });
  if (!name) { select.value = ''; return; }
  const s = addSubject(name);
  select.insertAdjacentHTML('beforeend', '');
  select.innerHTML = subjectOptions(s.id, { none: select.querySelector('option[value=""]')?.textContent ?? null });
  select.value = s.id;
  select.dispatchEvent(new Event('change'));
}
