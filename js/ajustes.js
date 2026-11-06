// Ajustes: nombre, colores, organizar, copia de seguridad y borrar todo.
import { D, save, saveNow, replaceAll, CATS, catColor } from './store.js';
import { blobKeys, blobRaw, blobRawPut, clearAll } from './db.js';
import { esc, today } from './util.js';
import { ic, ask, toast, backLink, pickColor } from './ui.js';
import { isInstalled, canOneClick, promptInstall, openInstall } from './install.js';
import { openShare, pasteShared } from './share.js';

const installCard = () => isInstalled()
  ? `<div class="card setgroup instcard done">${ic('i-ok')}<p><b>Instalada.</b> Estás usando Planner como app.</p></div>`
  : `<div class="card setgroup instcard">${ic('i-home')}<div class="grow"><b>Instalar Planner</b><p>Añádela a tu pantalla de inicio o al escritorio, con su icono y sin internet.</p></div>
      <button class="btn pri" data-install>${canOneClick() ? 'Instalar' : 'Cómo'}</button></div>`;
const getTheme =() => { try { return JSON.parse(localStorage.getItem('bea.theme') || '"auto"'); } catch (e) { return 'auto'; } };
export const ACCENTS = [['rosa', 'Rosa palo', '#E7B7BD'], ['lavanda', 'Lavanda', '#C9BCE6'], ['salvia', 'Salvia', '#B9D2B4'],
  ['melocoton', 'Melocotón', '#F2C3A3'], ['cielo', 'Cielo', '#A9CBE3'], ['coral', 'Coral', '#F0A9A0'], ['menta', 'Menta', '#A8DCCB'], ['grafito', 'Grafito', '#B9B4B6']];
// Estilos de un toque: color de la app + adornos. Luego se puede cambiar cada cosa.
export const STYLES = [
  { id: 'flores', name: 'Flores', sub: 'Rosa palo', accent: 'rosa', deco: 'flores', c: '#D9939F' },
  { id: 'neutro', name: 'Neutro', sub: 'Gris, sin adornos', accent: 'grafito', deco: 'nada', c: '#6E696B' },
  { id: 'azul', name: 'Azul', sub: 'Cielo y formas', accent: 'cielo', deco: 'formas', c: '#5E8BAB' },
  { id: 'verde', name: 'Verde', sub: 'Salvia y formas', accent: 'salvia', deco: 'formas', c: '#6F9369' },
];
const DECOS = [['flores', 'Flores'], ['formas', 'Formas'], ['nada', 'Ninguno']];
export const styleButtons = () => STYLES.map(s => `<button data-style="${s.id}" role="radio" aria-checked="${D.prefs.accent === s.accent && D.prefs.deco === s.deco}">
  <span class="sw" style="background:${s.c}">${s.deco === 'flores' ? `<svg viewBox="-12 -12 24 24"><g fill="currentColor">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-6" rx="3.6" ry="5.4" transform="rotate(${r})"/>`).join('')}</g></svg>` : s.deco === 'formas' ? '<svg viewBox="-12 -12 24 24"><rect x="-7" y="-7" width="14" height="14" rx="3.5" transform="rotate(45)" fill="currentColor"/></svg>' : ''}</span>
  <span><b>${s.name}</b><small>${s.sub}</small></span></button>`).join('');
export function bindStyles(root, after) {
  root.querySelectorAll('[data-style]').forEach(b => b.onclick = () => {
    const s = STYLES.find(x => x.id === b.dataset.style);
    D.prefs.accent = s.accent; D.prefs.deco = s.deco; save();
    dispatchEvent(new Event('bea:theme'));
    root.querySelectorAll('[data-style]').forEach(x => x.setAttribute('aria-checked', x === b));
    after && after();
  });
}
const REMIND =[[[], 'Ninguno'], [[0], 'El mismo día'], [[1], '1 día antes'], [[1, 3], '1 y 3 días antes'], [[1, 7], '1 día y 1 semana antes']];

export function render(el) {
  const th = getTheme();
  const remKey = JSON.stringify(D.prefs.remind);
  el.innerHTML = `
    <div class="topline">${backLink('#hoy', 'Hoy')}</div>
    <h1 class="h1">Ajustes</h1>

    <div class="sec">Tu nombre</div>
    <div class="card setgroup"><input class="inp" name="name" value="${esc(D.name)}" placeholder="Tu nombre" style="border:0;padding-left:0" aria-label="Tu nombre" enterkeyhint="done"></div>

    <div class="sec">Modo</div>
    <div class="seg" role="group" aria-label="Modo de color">
      ${[['auto', 'Como el móvil'], ['light', 'Día'], ['dark', 'Noche']].map(([k, l]) => `<button data-th="${k}" aria-pressed="${th === k}">${l}</button>`).join('')}
    </div>

    <div class="sec">Estilo</div>
    <div class="styles" role="radiogroup" aria-label="Estilo">${styleButtons()}</div>

    <div class="sec">Adornos</div>
    <div class="seg" role="group" aria-label="Adornos">
      ${DECOS.map(([k, l]) => `<button data-deco="${k}" aria-pressed="${D.prefs.deco === k}">${l}</button>`).join('')}
    </div>

    <div class="sec">Color de la app</div>
    <div class="card setgroup accents" role="radiogroup" aria-label="Color de la app">
      ${ACCENTS.map(([k, l, c]) => `<button data-acc="${k}" role="radio" aria-checked="${D.prefs.accent === k}"><span style="background:${c}"></span>${l}</button>`).join('')}
    </div>

    <div class="sec">Colores de cada tipo</div>
    <div class="card list">
      ${CATS.map(([k, l]) => `<button class="item" data-cat="${k}"><span class="swatch" style="background:${catColor(k)}"></span><span class="grow">${l}</span><small>Cambiar</small></button>`).join('')}
    </div>
    <p class="small" style="margin:.4rem .2rem 0;line-height:1.4">Se usan en el calendario y en Fechas. El color de cada asignatura se cambia en Materias (lápiz).</p>

    <div class="sec">Organizar</div>
    <div class="card list"><a class="item" href="#organizar">${ic('i-grid')}<span class="grow">Orden de «Hoy», de la barra y de las asignaturas</span>${ic('i-chev', 'i chev')}</a></div>

    <div class="sec">Compartir con tu clase</div>
    <div class="card list">
      <button class="item" data-share>${ic('i-share')}<span class="grow">Compartir fechas u horario</span>${ic('i-chev', 'i chev')}</button>
      <button class="item" data-paste>${ic('i-lnk')}<span class="grow">Pegar un enlace recibido</span>${ic('i-chev', 'i chev')}</button>
    </div>

    <div class="sec">Recordatorio para fechas nuevas</div>
    <div class="card setgroup"><select class="inp" name="remind" style="border:0;padding-left:0" aria-label="Recordatorio para fechas nuevas">
      ${REMIND.map(([v, l]) => `<option value='${JSON.stringify(v)}' ${JSON.stringify(v) === remKey ? 'selected' : ''}>${l}</option>`).join('')}
      ${!REMIND.some(([v]) => JSON.stringify(v) === remKey) ? `<option selected>Personalizado</option>` : ''}
    </select></div>

    <div class="sec">Copia de seguridad</div>
    <div class="card setgroup">
      <p>Todo se guarda solo en este dispositivo. Haz una copia de vez en cuando (por ejemplo, en Archivos, iCloud Drive o Google Drive) para no perder nada si se borra la app.${D.lastBackup ? ` <b>Última copia: ${new Date(D.lastBackup).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.</b>` : ' <b>Aún no has hecho ninguna.</b>'}</p>
      <button class="item" data-export>${ic('i-share')}<span class="grow">Guardar una copia</span></button>
      <label class="item" style="cursor:pointer">${ic('i-move')}<span class="grow">Recuperar una copia</span><input type="file" accept=".json,application/json" data-import hidden></label>
      <p data-space></p>
    </div>

    <div class="sec">Otros</div>
    <div class="card setgroup">
      <button class="item danger" data-wipe style="color:var(--accent)">${ic('i-trash')}<span class="grow">Borrar todos los datos</span></button>
      <p>Planner · gratis, sin cuentas y sin anuncios. Nada sale de tu dispositivo. Letra Space Grotesk (licencia SIL Open Font).</p>
    </div>`;
  el.querySelector('.h1').insertAdjacentHTML('afterend', installCard());
  el.querySelector('[data-install]')?.addEventListener('click', async () => {
    if (canOneClick()) { if (await promptInstall()) render(el); } else openInstall();
  });

  const name = el.querySelector('[name=name]');
  name.oninput = () => { D.name = name.value.trim(); save(); };
  name.onkeydown = e => { if (e.key === 'Enter') name.blur(); };
  el.querySelectorAll('[data-th]').forEach(b => b.onclick = () => {
    localStorage.setItem('bea.theme', JSON.stringify(b.dataset.th));
    dispatchEvent(new Event('bea:theme'));
    el.querySelectorAll('[data-th]').forEach(x => x.setAttribute('aria-pressed', x === b));
  });
  // Cambiar estilo, adornos o color repinta Ajustes para que todo quede marcado bien.
  const redraw = () => { const y = scrollY; render(el); scrollTo(0, y); };
  bindStyles(el, redraw);
  el.querySelectorAll('[data-deco]').forEach(b => b.onclick = () => { D.prefs.deco = b.dataset.deco; save(); dispatchEvent(new Event('bea:theme')); redraw(); });
  el.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => {
    D.prefs.accent = b.dataset.acc; save();
    dispatchEvent(new Event('bea:theme')); redraw();
  });
  el.querySelectorAll('[data-cat]').forEach(b => b.onclick = async () => {
    const k = b.dataset.cat;
    const c = await pickColor(`Color de ${CATS.find(x => x[0] === k)[1].toLowerCase()}`, D.prefs.catColors[k]);
    if (c) { D.prefs.catColors[k] = c; save(); b.querySelector('.swatch').style.background = catColor(k); }
  });
  el.querySelector('[name=remind]').onchange = e => { try { D.prefs.remind = JSON.parse(e.target.value); save(); toast('Guardado'); } catch (err) {} };
  el.querySelector('[data-share]').onclick = () => openShare({ classes: true });
  el.querySelector('[data-paste]').onclick = pasteShared;
  el.querySelector('[data-export]').onclick = () => exportBackup().then(ok => { if (ok) redraw(); });
  el.querySelector('[data-import]').onchange = e => importBackup(e.target.files[0]);
  el.querySelector('[data-wipe]').onclick = async () => {
    if (!await ask('¿Borrar todos los datos?', { ok: 'Seguir', danger: true, detail: 'Se borrarán asignaturas, horario, tareas, fechas, calificaciones y notas con sus fotos, audios y archivos.' })) return;
    if (!await ask('¿Seguro? No se puede deshacer.', { ok: 'Borrar todo', danger: true, detail: 'Si no tienes una copia, lo perderás para siempre.' })) return;
    await clearAll(); localStorage.removeItem('bea.theme'); localStorage.removeItem('bea.accent'); location.hash = '#hoy'; location.reload();
  };
  navigator.storage?.estimate?.().then(e => {
    const mb = (e.usage || 0) / 1048576;
    el.querySelector('[data-space]').textContent = `Ocupa unos ${mb < 1 ? 'menos de 1' : Math.round(mb)} MB en este dispositivo.`;
  });
}

const toB64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = s => { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b.buffer; };

// Devuelve true si la copia se ha guardado o compartido.
export async function exportBackup() {
  toast('Preparando la copia…');
  await saveNow();
  const blobs = {};
  for (const id of await blobKeys()) { const r = await blobRaw(id); if (r) blobs[id] = { type: r.type, b64: toB64(r.buf) }; }
  const json = JSON.stringify({ app: 'planner', version: 2, date: new Date().toISOString(), data: D, blobs });
  const name = `Planner-copia-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  const done = () => { D.lastBackup = Date.now(); save(); toast('Copia guardada'); return true; };
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Copia de Planner' }); return done(); }
  } catch (e) { if (e.name === 'AbortError') return false; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return done();
}

export async function importBackup(file) {
  if (!file) return;
  let j;
  try { j = JSON.parse(await file.text()); } catch (e) { toast('Ese archivo no es una copia de Planner'); return; }
  if (!['planner', 'beastudio'].includes(j.app) || !j.data) { toast('Ese archivo no es una copia de Planner'); return; }
  const when = j.date ? new Date(j.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  if (!await ask('¿Recuperar esta copia?', { ok: 'Recuperar', danger: true, detail: `Copia${when ? ' del ' + when : ''}. Lo que hay ahora en la app se sustituirá por lo de la copia.` })) return;
  await clearAll();
  for (const [id, r] of Object.entries(j.blobs || {})) await blobRawPut(id, { type: r.type, buf: fromB64(r.b64) });
  await replaceAll({ ...j.data, onboarded: true });
  location.hash = '#hoy'; location.reload();
}
