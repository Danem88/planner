// Ajustes: nombre, modo de color, copia de seguridad y borrar todo.
import { D, save, saveNow, replaceAll } from './store.js';
import { blobKeys, blobRaw, blobRawPut, clearAll } from './db.js';
import { esc, today } from './util.js';
import { ic, ask, toast, backLink } from './ui.js';

const getTheme = () => { try { return JSON.parse(localStorage.getItem('bea.theme') || '"auto"'); } catch (e) { return 'auto'; } };

export function render(el) {
  const th = getTheme();
  el.innerHTML = `
    <div class="topline">${backLink('#hoy', 'Hoy')}</div>
    <h1 class="h1">Ajustes</h1>

    <div class="sec">Tu nombre</div>
    <div class="card setgroup"><input class="inp" name="name" value="${esc(D.name)}" placeholder="Tu nombre" style="border:0;padding-left:0" aria-label="Tu nombre" enterkeyhint="done"></div>

    <div class="sec">Modo</div>
    <div class="seg" role="group" aria-label="Modo de color">
      ${[['auto', 'Como el iPhone'], ['light', 'Día'], ['dark', 'Noche']].map(([k, l]) => `<button data-th="${k}" aria-pressed="${th === k}">${l}</button>`).join('')}
    </div>

    <div class="sec">Copia de seguridad</div>
    <div class="card setgroup">
      <p>Todo se guarda solo en este iPhone. Haz una copia de vez en cuando (por ejemplo, en Archivos o iCloud Drive) para no perder nada si se borra la app.</p>
      <button class="item" data-export>${ic('i-share')}<span class="grow">Guardar una copia</span></button>
      <label class="item" style="cursor:pointer">${ic('i-move')}<span class="grow">Recuperar una copia</span><input type="file" accept=".json,application/json" data-import hidden></label>
      <p data-space></p>
    </div>

    <div class="sec">Cómo instalarla</div>
    <div class="card setgroup"><p>En Safari, toca <b>Compartir</b> (el cuadrado con la flecha) y elige <b>«Añadir a pantalla de inicio»</b>. Aparecerá el icono de Beastudio y funcionará sin internet.</p></div>

    <div class="sec">Otros</div>
    <div class="card setgroup">
      <button class="item danger" data-wipe style="color:var(--accent)">${ic('i-trash')}<span class="grow">Borrar todos los datos</span></button>
      <p>Beastudio · letra Space Grotesk (licencia SIL Open Font). Hecha con cariño para Bea.</p>
    </div>`;

  const name = el.querySelector('[name=name]');
  name.oninput = () => { D.name = name.value.trim(); save(); };
  name.onkeydown = e => { if (e.key === 'Enter') name.blur(); };
  el.querySelectorAll('[data-th]').forEach(b => b.onclick = () => {
    localStorage.setItem('bea.theme', JSON.stringify(b.dataset.th));
    dispatchEvent(new Event('bea:theme'));
    el.querySelectorAll('[data-th]').forEach(x => x.setAttribute('aria-pressed', x === b));
  });
  el.querySelector('[data-export]').onclick = exportBackup;
  el.querySelector('[data-import]').onchange = e => importBackup(e.target.files[0]);
  el.querySelector('[data-wipe]').onclick = async () => {
    if (!await ask('¿Borrar todos los datos?', { ok: 'Seguir', danger: true, detail: 'Se borrarán asignaturas, horario, tareas, fechas, calificaciones y notas con sus fotos y audios.' })) return;
    if (!await ask('¿Seguro? No se puede deshacer.', { ok: 'Borrar todo', danger: true, detail: 'Si no tienes una copia, lo perderás para siempre.' })) return;
    await clearAll(); localStorage.removeItem('bea.theme'); location.hash = '#hoy'; location.reload();
  };
  navigator.storage?.estimate?.().then(e => {
    const mb = (e.usage || 0) / 1048576;
    el.querySelector('[data-space]').textContent = `Ocupa unos ${mb < 1 ? 'menos de 1' : Math.round(mb)} MB en el iPhone.`;
  });
}

const toB64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
const fromB64 = s => { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b.buffer; };

async function exportBackup() {
  toast('Preparando la copia…');
  await saveNow();
  const blobs = {};
  for (const id of await blobKeys()) { const r = await blobRaw(id); if (r) blobs[id] = { type: r.type, b64: toB64(r.buf) }; }
  const json = JSON.stringify({ app: 'beastudio', version: 1, date: new Date().toISOString(), data: D, blobs });
  const name = `Beastudio-copia-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Copia de Beastudio' }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function importBackup(file) {
  if (!file) return;
  let j;
  try { j = JSON.parse(await file.text()); } catch (e) { toast('Ese archivo no es una copia de Beastudio'); return; }
  if (j.app !== 'beastudio' || !j.data) { toast('Ese archivo no es una copia de Beastudio'); return; }
  const when = j.date ? new Date(j.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  if (!await ask('¿Recuperar esta copia?', { ok: 'Recuperar', danger: true, detail: `Copia${when ? ' del ' + when : ''}. Lo que hay ahora en la app se sustituirá por lo de la copia.` })) return;
  await clearAll();
  for (const [id, r] of Object.entries(j.blobs || {})) await blobRawPut(id, { type: r.type, buf: fromB64(r.b64) });
  await replaceAll({ ...j.data, onboarded: true });
  location.hash = '#hoy'; location.reload();
}
