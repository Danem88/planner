// Piezas comunes de la interfaz: iconos, hojas, menús, preguntas y avisos.
import { esc } from './util.js';
import { D, color } from './store.js';

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
</defs></svg>`;

export const refresh = () => dispatchEvent(new Event('bea:refresh'));

export function injectSprite() { document.body.insertAdjacentHTML('afterbegin', SPRITE); }
export const ic = (name, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${name}"/></svg>`;
export const backLink = (href, label) => `<a class="back" href="${href}">${ic('i-back')}<span>${esc(label)}</span></a>`;

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
  requestAnimationFrame(() => { dim.classList.add('on'); el.classList.add('on'); });
  let closed = false;
  const close = (val) => {
    if (closed) return; closed = true; openSheets--;
    dim.classList.remove('on'); el.classList.remove('on');
    setTimeout(() => { dim.remove(); el.remove(); }, 300);
    removeEventListener('keydown', onKey);
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
export function toast(text, undo) {
  toastEl?.remove(); clearTimeout(toastT);
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(text)}</span>${undo ? '<button>Deshacer</button>' : ''}`;
  document.body.append(t);
  toastEl = t;
  requestAnimationFrame(() => t.classList.add('on'));
  if (undo) t.querySelector('button').onclick = () => { undo(); hide(); };
  const hide = () => { t.classList.remove('on'); setTimeout(() => t.remove(), 250); };
  toastT = setTimeout(hide, undo ? 5000 : 2200);
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
