// Pantalla «Hoy»: lo primero que ve Bea al abrir la app.
import { D, save, subjName, color, flowerOf, classesOn, upcoming, dlTitle, reviewProgress } from './store.js';
import { esc, today, dow, fmtLong, greeting, nowMin, minToHm, daysBetween, relDay, fmtShort, addDays } from './util.js';
import { ic, ring, colorDot, toast } from './ui.js';
import { editTask, toggleTask } from './add.js';

function draw(el) {
  const t = today(), d = dow(t), now = nowMin();
  const classes = classesOn(d);
  const cur = classes.find(c => c.start <= now && now < c.end);
  const next = classes.find(c => c.start > now);
  const hasSchedule = D.classes.length > 0;

  // Tarjeta de «ahora»
  let nowCard = '';
  if (cur) {
    const left = cur.end - now, pct = Math.round((now - cur.start) / (cur.end - cur.start) * 100);
    nowCard = `<a class="card now" href="#horario">
      <div class="ic" style="background:${color(cur.subjectId)}">${ic(flowerOf(cur.subjectId))}</div>
      <div><small>Ahora</small><b>${esc(subjName(cur.subjectId))}</b><small>${cur.room ? esc(cur.room) + ' · ' : ''}hasta las ${minToHm(cur.end)}</small></div>
      <div class="left"><strong>${left}</strong>min</div><div class="bar" style="width:${pct}%"></div></a>`;
  } else if (next) {
    const inMin = next.start - now;
    nowCard = `<a class="card now" href="#horario">
      <div class="ic" style="background:${color(next.subjectId)}">${ic(flowerOf(next.subjectId))}</div>
      <div><small>Siguiente</small><b>${esc(subjName(next.subjectId))}</b><small>${next.room ? esc(next.room) + ' · ' : ''}a las ${minToHm(next.start)}</small></div>
      <div class="left"><strong>${inMin >= 120 ? Math.round(inMin / 60) : inMin}</strong>${inMin >= 120 ? 'h' : 'min'}</div></a>`;
  } else if (hasSchedule) {
    nowCard = `<div class="card now"><div class="ic" style="background:var(--rosa2)">${ic('fl2')}</div>
      <div><small>Clases</small><b>${classes.length ? 'Hoy ya no tienes más' : 'Hoy no hay clase'}</b></div></div>`;
  }

  const chips = classes.length ? `<div class="sec">Clases de hoy <em>${classes.length}</em></div>
    <div class="daychips">${classes.map(c => `<a href="#horario" class="c ${c.end <= now ? 'past' : ''} ${c === cur ? 'cur' : ''}" style="background:${color(c.subjectId)}">
      <span>${minToHm(c.start)}</span>${esc(subjName(c.subjectId))}</a>`).join('')}</div>` : '';

  // Próximo examen y entregas cercanas
  const exam = upcoming('exam')[0];
  const soon = upcoming('entrega').filter(x => daysBetween(t, x.date) <= 3);
  let dates = '';
  if (exam || soon.length) {
    dates = `<div class="sec">${exam ? 'Próximo examen' : 'Entregas'}</div>`;
    if (exam) {
      const n = daysBetween(t, exam.date), p = reviewProgress(exam);
      dates += `<a class="card exam" href="#fechas/${exam.id}">
        <div class="ring">${ring(n)}<div><span><strong>${n === 0 ? 'Hoy' : n}</strong>${n ? `<small>${n === 1 ? 'día' : 'días'}</small>` : ''}</span></div></div>
        <div><b>${esc(dlTitle(exam))}</b><p>${esc(fmtShort(exam.date))}${exam.time ? ' · ' + esc(exam.time) : ''}${p && p.total ? ` · repasado ${p.done} de ${p.total}` : ''}</p></div></a>`;
    }
    dates += soon.map(x => `<a class="card exam" href="#fechas/${x.id}" style="padding:.7rem 1rem">
      ${colorDot(x.subjectId)}<div><b style="font-size:.86rem">${esc(dlTitle(x))}</b><p ${daysBetween(t, x.date) <= 1 ? 'class="warn"' : ''}>Entrega ${esc(relDay(x.date))}</p></div></a>`).join('');
  }

  // Tareas
  const open = D.tasks.filter(k => !k.done);
  const forToday = open.filter(k => k.due && k.due <= t);
  const doneToday = D.tasks.filter(k => k.done && k.doneAt && k.doneAt.slice(0, 10) === t && (!k.due || k.due <= t));
  const nextDays = open.filter(k => k.due && k.due > t && k.due <= addDays(t, 7)).sort((a, b) => a.due.localeCompare(b.due));
  const undated = open.filter(k => !k.due);
  const todayList = [...forToday.sort((a, b) => a.due.localeCompare(b.due)), ...doneToday];

  const row = k => `<div class="item ${k.done ? 'done' : ''} ${!k.done && k.due && k.due < t ? 'overdue' : ''}" data-task="${k.id}">
    <span class="cbwrap"><button class="cb" role="checkbox" aria-checked="${k.done}" aria-label="Hecha: ${esc(k.title)}">${ic('i-ok')}</button></span>
    <button class="grow" data-open style="text-align:left"><span class="t">${esc(k.title)}</span>${
      !k.done && k.due && k.due < t ? `<small>Atrasada · era para ${esc(relDay(k.due))}</small>` : k.due && k.due > t ? `<small>${esc(relDay(k.due).replace(/^el /, ''))}</small>` : ''}</button>
    ${k.subjectId ? colorDot(k.subjectId) : ''}</div>`;

  const name = D.name ? `, ${esc(D.name)}` : '';
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;

  el.innerHTML = `
    <div class="topline"><span class="small">${esc(fmtLong(t))}</span>
      <a class="iconbtn" href="#ajustes" aria-label="Ajustes">${ic('i-gear')}</a></div>
    <h1 class="h1">${greeting()}${name} ${ic('fl', 'i fl')}</h1>
    ${!standalone && !D.installHidden ? `<div class="card install">${ic('i-home')}<div><b>Ponla en tu pantalla de inicio</b><br>En Safari toca <b>Compartir</b> y luego <b>«Añadir a pantalla de inicio»</b>. Así funciona sin internet, como una app. <button class="btn ghost" data-hide-install style="min-height:2.2rem;padding:0;display:flex;margin-top:.1rem">Entendido</button></div></div>` : ''}
    ${nowCard}
    ${!hasSchedule ? `<a class="card now" href="#horario"><div class="ic" style="background:var(--rosa2)">${ic('i-hor')}</div><div><b>Añade tu horario</b><small>Así verás aquí tus clases de cada día</small></div></a>` : ''}
    ${chips}
    ${dates}
    <div class="sec">Para hoy ${todayList.length ? `<em>${doneToday.length} de ${todayList.length}</em>` : ''}</div>
    ${todayList.length ? `<div class="card list">${todayList.map(row).join('')}</div>`
      : `<div class="card empty" style="padding:1rem">${ic('fl2', 'fl')}Nada pendiente para hoy.<br>Toca <b>+</b> para apuntar algo.</div>`}
    ${nextDays.length ? `<div class="sec">Próximos días</div><div class="card list">${nextDays.map(row).join('')}</div>` : ''}
    ${undated.length ? `<div class="sec">Sin fecha</div><div class="card list">${undated.map(row).join('')}</div>` : ''}
  `;

  el.querySelector('[data-hide-install]')?.addEventListener('click', () => { D.installHidden = true; save(); el.querySelector('.install').remove(); });
  el.querySelectorAll('[data-task]').forEach(r => {
    const k = D.tasks.find(x => x.id === r.dataset.task);
    r.querySelector('.cb').onclick = () => {
      toggleTask(k);
      if (k.done) toast('Tarea hecha', () => { toggleTask(k); draw(el); });
      draw(el);
    };
    r.querySelector('[data-open]').onclick = () => editTask(k, () => draw(el));
  });

}

export function render(el) {
  draw(el);
  // Actualizar cada minuto mientras está abierta.
  const timer = setInterval(() => { if (!document.querySelector('.sheet')) draw(el); }, 60000);
  return () => clearInterval(timer);
}
