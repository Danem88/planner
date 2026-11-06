// Calendario del mes en «Hoy»: cada día se pinta con los colores de lo que tiene
// (exámenes, entregas, presentaciones y tareas). Al tocar un día se ve su lista.
import { D, catColor, CATS, KINDS, dlTitle, subjName, isPast, doneLabel } from './store.js';
import { esc, today, ymd, parseYmd, MESES, DIAS, cap, daysBetween } from './util.js';
import { ic, catDot } from './ui.js';
import { openAdd, editTask, toggleTask } from './add.js';

let month = null;   // 'AAAA-MM-01'
let sel = null;     // día elegido

const ORDER = ['exam', 'presentacion', 'entrega', 'task'];

function eventsOn(day) {
  const out = [];
  for (const d of D.deadlines) if (d.date === day) out.push({ cat: d.kind, d });
  for (const k of D.tasks) if (k.due === day && !k.done) out.push({ cat: 'task', k });
  return out.sort((a, b) => ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat));
}
// Fondo del día: un color, o dos, tres o cuatro en porciones.
function fill(cats) {
  const cs = cats.map(catColor);
  if (cs.length === 1) return cs[0];
  const step = 360 / cs.length;
  return `conic-gradient(from ${cs.length === 2 ? 0 : -60}deg, ${cs.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(', ')})`;
}

export function calendar(el, rerender) {
  const t = today();
  if (!month) month = t.slice(0, 8) + '01';
  if (!sel) sel = t;
  const first = parseYmd(month);
  const y = first.getFullYear(), m = first.getMonth();
  const startDow = (first.getDay() + 6) % 7;              // lunes = 0
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push('<span class="cd empty" aria-hidden="true"></span>');
  for (let d = 1; d <= days; d++) {
    const day = ymd(new Date(y, m, d));
    const evs = eventsOn(day);
    const cats = [...new Set(evs.map(e => e.cat))];
    const label = `${d} de ${MESES[m]}${evs.length ? ': ' + cats.map(c => CATS.find(x => x[0] === c)[1].toLowerCase()).join(', ') : ''}`;
    cells.push(`<button class="cd ${day === t ? 'today' : ''} ${day === sel ? 'sel' : ''} ${cats.length ? 'has' : ''} ${day < t ? 'gone' : ''}" data-day="${day}" aria-label="${esc(label)}" aria-pressed="${day === sel}">
      <span class="num" ${cats.length ? `style="background:${fill(cats)}"` : ''}>${cats.length > 1 ? `<span>${d}</span>` : d}</span></button>`);
  }
  const isThis = month === t.slice(0, 8) + '01';
  // Las tareas de hoy ya salen en «Para hoy»: aquí no se repiten.
  const skipTasks = sel === t && D.prefs.homeOrder.includes('tareas') && !D.prefs.homeHidden.includes('tareas');
  const evs = eventsOn(sel).filter(e => !(skipTasks && e.k));
  const used = new Set();
  for (const d of D.deadlines) if (d.date.slice(0, 7) === month.slice(0, 7)) used.add(d.kind);
  if (D.tasks.some(k => !k.done && k.due && k.due.slice(0, 7) === month.slice(0, 7))) used.add('task');

  const n = daysBetween(t, sel);
  const selName = n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n === -1 ? 'Ayer' : `${cap(DIAS[parseYmd(sel).getDay()])} ${parseYmd(sel).getDate()}`;
  el.innerHTML = `
    <div class="card cal">
      <div class="calhd">
        <button class="iconbtn" data-mv="-1" aria-label="Mes anterior">${ic('i-left')}</button>
        <b>${cap(MESES[m])} ${y !== new Date().getFullYear() ? y : ''}</b>
        ${!isThis ? '<button class="chip" data-today>Hoy</button>' : ''}
        <button class="iconbtn" data-mv="1" aria-label="Mes siguiente">${ic('i-right')}</button>
      </div>
      <div class="calgrid" role="grid">
        ${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span class="wd" aria-hidden="true">${d}</span>`).join('')}
        ${cells.join('')}
      </div>
      ${used.size ? `<div class="legend">${CATS.filter(c => used.has(c[0])).map(([k, l]) => `<span>${catDot(k)}${l}</span>`).join('')}</div>` : ''}
    </div>
    <div class="sec"><span>${selName}${evs.length ? ` <em>· ${evs.length}</em>` : ''}</span><button data-add>+ Añadir</button></div>
    ${evs.length ? `<div class="card list">${evs.map(e => e.d ? `
      <a class="item dayev ${isPast(e.d) ? 'done' : ''}" href="#fechas/${e.d.id}">${catDot(e.cat)}
        <div class="grow"><span class="t">${esc(dlTitle(e.d))}</span><small>${KINDS[e.d.kind]}${e.d.time ? ' · ' + esc(e.d.time) : ''}${e.d.done ? ' · ' + doneLabel(e.d) : ''}</small></div>
        ${ic('i-chev', 'i chev')}</a>` : `
      <div class="item dayev" data-task="${e.k.id}"><span class="cbwrap"><button class="cb" role="checkbox" aria-checked="false" aria-label="Hecha: ${esc(e.k.title)}">${ic('i-ok')}</button></span>
        <button class="grow" data-open style="text-align:left"><span class="t">${esc(e.k.title)}</span><small>Tarea${e.k.subjectId ? ' · ' + esc(subjName(e.k.subjectId)) : ''}</small></button>${catDot('task')}</div>`).join('')}</div>`
    : `<div class="card empty slim">${skipTasks ? 'Hoy no hay exámenes, entregas ni presentaciones.' : 'Nada apuntado este día.'}</div>`}`;

  el.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => {
    const d = parseYmd(month); d.setMonth(d.getMonth() + +b.dataset.mv); month = ymd(d);
    sel = month.slice(0, 7) === t.slice(0, 7) ? t : month;
    calendar(el, rerender);
  });
  el.querySelector('[data-today]')?.addEventListener('click', () => { month = t.slice(0, 8) + '01'; sel = t; calendar(el, rerender); });
  el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { sel = b.dataset.day; calendar(el, rerender); el.querySelector(`[data-day="${sel}"]`)?.focus(); });
  el.querySelector('[data-add]').onclick = () => openAdd({ date: sel });
  el.querySelectorAll('[data-task]').forEach(r => {
    const k = D.tasks.find(x => x.id === r.dataset.task);
    r.querySelector('.cb').onclick = () => { toggleTask(k); rerender(); };
    r.querySelector('[data-open]').onclick = () => editTask(k, rerender);
  });
  // Deslizar a los lados para cambiar de mes.
  const grid = el.querySelector('.calgrid');
  let x0 = null;
  grid.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  grid.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) el.querySelector(`[data-mv="${dx < 0 ? 1 : -1}"]`).click();
  });
}
export const resetCalendar = () => { month = null; sel = null; };
