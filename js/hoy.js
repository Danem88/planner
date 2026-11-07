// Pantalla «Hoy»: lo primero que se ve al abrir la app.
// Sus bloques (calendario, clases, fechas, tareas) se ordenan en Ajustes › Organizar.
import { D, save, subjName, color, flowerOf, classesOn, upcoming, dlTitle, reviewProgress, KINDS, dueReminders, dismissReminder, backupDue, catColor } from './store.js';
import { esc, today, dow, fmtLong, greeting, nowMin, minToHm, hmToMin, daysBetween, relDay, fmtShort, addDays, parseYmd, DIAS } from './util.js';
import { ic, ring, colorDot, catDot, toast } from './ui.js';
import { editTask, toggleTask, swipeTask } from './add.js';
import { calendar } from './cal.js';
import { isInstalled, canOneClick, promptInstall, openInstall, isOldHome, NEW_HOME } from './install.js';
import { exportBackup } from './ajustes.js';

const leftTxt = n => n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`;

function blockAhora(t) {
  const d = dow(t), now = nowMin();
  const classes = classesOn(d);
  const cur = classes.find(c => c.start <= now && now < c.end);
  const next = classes.find(c => c.start > now);
  if (!D.classes.length) return `<a class="card now" href="#horario"><div class="ic" style="background:var(--rosa2)">${ic('i-hor')}</div><div><b>Añade tu horario</b><small>Así verás aquí tus clases de cada día</small></div></a>`;
  let card;
  if (cur) {
    const left = cur.end - now, pct = Math.round((now - cur.start) / (cur.end - cur.start) * 100);
    card = `<a class="card now" href="#horario">
      <div class="ic" style="background:${color(cur.subjectId)}">${ic(flowerOf(cur.subjectId))}</div>
      <div><small>Ahora</small><b>${esc(subjName(cur.subjectId))}</b><small>${cur.room ? esc(cur.room) + ' · ' : ''}hasta las ${minToHm(cur.end)}</small></div>
      <div class="left"><strong>${left}</strong>min</div><div class="bar" style="width:${pct}%"></div></a>`;
  } else if (next) {
    const inMin = next.start - now;
    card = `<a class="card now" href="#horario">
      <div class="ic" style="background:${color(next.subjectId)}">${ic(flowerOf(next.subjectId))}</div>
      <div><small>Siguiente</small><b>${esc(subjName(next.subjectId))}</b><small>${next.room ? esc(next.room) + ' · ' : ''}a las ${minToHm(next.start)}</small></div>
      <div class="left"><strong>${inMin >= 120 ? Math.round(inMin / 60) : inMin}</strong>${inMin >= 120 ? 'h' : 'min'}</div></a>`;
  } else {
    card = `<div class="card now"><div class="ic" style="background:var(--rosa2)">${ic('fl2')}</div>
      <div><small>Clases</small><b>${classes.length ? 'Hoy ya no tienes más' : 'Hoy no hay clase'}</b></div></div>`;
  }
  const chips = classes.length ? `<div class="daychips">${classes.map(c => `<a href="#horario" class="c ${c.end <= now ? 'past' : ''} ${c === cur ? 'cur' : ''}" style="background:${color(c.subjectId)}">
      <span>${minToHm(c.start)}</span>${esc(subjName(c.subjectId))}</a>`).join('')}</div>` : '';
  return `<div class="sec">Clases</div>${card}${chips}`;
}

// El día del examen (o de la entrega o presentación): arriba, en grande.
function blockToday(t) {
  const list = upcoming().filter(d => d.date === t);
  if (!list.length) return '';
  const now = nowMin();
  return list.map(d => {
    let when = '';
    if (d.time) {
      const left = hmToMin(d.time) - now;
      when = left > 0 ? `a las ${esc(d.time)} · ${left >= 60 ? `en ${Math.floor(left / 60)} h ${left % 60 ? (left % 60) + ' min' : ''}` : `en ${left} min`}` : `a las ${esc(d.time)}`;
    }
    const p = reviewProgress(d);
    return `<a class="card examday" href="#fechas/${d.id}" style="--c:${catColor(d.kind)}">
      <span class="tag">Hoy · ${KINDS[d.kind]}</span><b>${esc(dlTitle(d))}</b>
      <p>${when || '¡Mucha suerte!'}${p && p.total ? ` · repasado ${p.done} de ${p.total}` : ''}</p>
      <span class="go">${d.sectionId ? 'Repasar los apuntes' : 'Ver'} ${ic('i-chev', 'i chev')}</span></a>`;
  }).join('');
}

// Resumen de la semana: el domingo (y el lunes por la mañana si no se ha visto).
function blockWeek(t) {
  const wd = dow(t), h = new Date().getHours();
  if (!(wd === 7 || (wd === 1 && h < 14))) return '';
  const sunday = wd === 7 ? t : addDays(t, -1);
  if (D.weekSeen === sunday) return '';
  const mon = addDays(sunday, -6), nextMon = addDays(sunday, 1), nextSun = addDays(sunday, 7);
  const inWeek = s => s && s.slice(0, 10) >= mon && s.slice(0, 10) <= sunday;
  const done = D.tasks.filter(k => k.done && inWeek(k.doneAt)).length;
  const past = D.deadlines.filter(d => inWeek(d.date));
  const grades = D.grades.filter(g => inWeek(g.date));
  const next = D.deadlines.filter(d => !d.done && d.date >= nextMon && d.date <= nextSun).sort((a, b) => a.date.localeCompare(b.date));
  const nextTasks = D.tasks.filter(k => !k.done && k.due >= nextMon && k.due <= nextSun).length;
  const bits = [done && `${done} ${done === 1 ? 'tarea hecha' : 'tareas hechas'}`, past.length && `${past.length} ${past.length === 1 ? 'fecha' : 'fechas'} (${[...new Set(past.map(d => KINDS[d.kind].toLowerCase()))].join(', ')})`, grades.length && `${grades.length} ${grades.length === 1 ? 'nota nueva' : 'notas nuevas'}`].filter(Boolean);
  if (!bits.length && !next.length && !nextTasks) return '';
  return `<div class="card weekcard" data-week="${sunday}">
    <div class="weekhd"><b>Tu semana</b><button class="btn ghost" data-weekok>Vale</button></div>
    ${bits.length ? `<p>Esta semana: ${bits.join(' · ')}.</p>` : ''}
    ${next.length || nextTasks ? `<p class="nx">La que viene${nextTasks ? `: ${nextTasks} ${nextTasks === 1 ? 'tarea' : 'tareas'}` : ''}</p>
      ${next.length ? `<ul>${next.slice(0, 4).map(d => `<li>${catDot(d.kind)}<span>${esc(dlTitle(d))}</span><small>${esc(DIAS[parseYmd(d.date).getDay()])}</small></li>`).join('')}${next.length > 4 ? `<li class="more">y ${next.length - 4} más</li>` : ''}</ul>` : ''}`
      : '<p class="nx">La semana que viene no tienes nada apuntado.</p>'}
  </div>`;
}

function blockFechas(t) {
  const exam = upcoming('exam').filter(d => d.date !== t)[0];
  const soon = upcoming().filter(x => x.kind !== 'exam' && x.date !== t && daysBetween(t, x.date) <= 3);
  if (!exam && !soon.length) return '';
  let h = `<div class="sec">Próximas fechas</div>`;
  if (exam) {
    const n = daysBetween(t, exam.date), p = reviewProgress(exam);
    h += `<a class="card exam" href="#fechas/${exam.id}">
      <div class="ring">${ring(n)}<div><span><strong>${n === 0 ? 'Hoy' : n}</strong>${n ? `<small>${n === 1 ? 'día' : 'días'}</small>` : ''}</span></div></div>
      <div><b>${esc(dlTitle(exam))}</b><p>${esc(fmtShort(exam.date))}${exam.time ? ' · ' + esc(exam.time) : ''}${p && p.total ? ` · repasado ${p.done} de ${p.total}` : ''}</p></div></a>`;
  }
  h += soon.map(x => `<a class="card exam" href="#fechas/${x.id}" style="padding:.7rem 1rem">
    ${catDot(x.kind)}<div><b style="font-size:.86rem">${esc(dlTitle(x))}</b><p ${daysBetween(t, x.date) <= 1 ? 'class="warn"' : ''}>${KINDS[x.kind]} ${esc(relDay(x.date))}</p></div></a>`).join('');
  return h;
}

function taskRow(k, t) {
  return `<div class="item ${k.done ? 'done' : ''} ${!k.done && k.due && k.due < t ? 'overdue' : ''}" data-task="${k.id}">
    <span class="cbwrap"><button class="cb" role="checkbox" aria-checked="${k.done}" aria-label="Hecha: ${esc(k.title)}">${ic('i-ok')}</button></span>
    <button class="grow" data-open style="text-align:left"><span class="t">${esc(k.title)}</span>${
      !k.done && k.due && k.due < t ? `<small>Atrasada · era para ${esc(relDay(k.due))}</small>` : k.due && k.due > t ? `<small>${esc(relDay(k.due).replace(/^el /, ''))}</small>` : ''}</button>
    ${k.subjectId ? colorDot(k.subjectId) : ''}</div>`;
}

function blockTareas(t) {
  const open = D.tasks.filter(k => !k.done);
  const forToday = open.filter(k => k.due && k.due <= t).sort((a, b) => a.due.localeCompare(b.due));
  const doneToday = D.tasks.filter(k => k.done && k.doneAt && k.doneAt.slice(0, 10) === t);
  const nextDays = open.filter(k => k.due && k.due > t && k.due <= addDays(t, 7)).sort((a, b) => a.due.localeCompare(b.due));
  const undated = open.filter(k => !k.due);
  const late = forToday.filter(k => k.due < t).length;
  return `
    <div class="sec">Para hoy ${forToday.length ? `<em>${forToday.length} ${forToday.length === 1 ? 'pendiente' : 'pendientes'}</em>` : ''}</div>
    ${late ? `<button class="latebar" data-late>${late} ${late === 1 ? 'atrasada' : 'atrasadas'} · <b>Pasar${late === 1 ? 'la' : 'las'} a hoy</b></button>` : ''}
    ${forToday.length ? `<div class="card list">${forToday.map(k => taskRow(k, t)).join('')}</div>`
      : `<div class="card empty" style="padding:1rem">${ic('fl2', 'fl')}${doneToday.length ? '¡Todo hecho por hoy!' : 'Nada pendiente para hoy.'}<br>Toca <b>+</b> para apuntar algo.</div>`}
    ${nextDays.length ? `<div class="sec">Próximos días</div><div class="card list">${nextDays.map(k => taskRow(k, t)).join('')}</div>` : ''}
    ${undated.length ? `<div class="sec">Sin fecha</div><div class="card list">${undated.map(k => taskRow(k, t)).join('')}</div>` : ''}
    ${doneToday.length ? `<details class="donebox"><summary class="sec">Hechas hoy <em>${doneToday.length}</em></summary><div class="card list">${doneToday.map(k => taskRow(k, t)).join('')}</div></details>` : ''}`;
}

function blockReminders(t) {
  const list = dueReminders().filter(r => r.left > 0);   // el mismo día ya sale en grande
  if (!list.length) return '';
  return list.map(({ d, left }) => `<div class="card remind" data-rem="${d.id}">${ic('i-bell')}
    <a class="grow" href="#fechas/${d.id}"><small>Recordatorio · ${KINDS[d.kind]} ${leftTxt(left)}</small><b>${esc(dlTitle(d))}</b></a>
    <button class="btn ghost" data-ok>Vale</button></div>`).join('');
}

function draw(el) {
  const t = today();
  const name = D.name ? `, ${esc(D.name)}` : '';
  const standalone = isInstalled();
  const blocks = { ahora: () => blockAhora(t), fechas: () => blockFechas(t), tareas: () => blockTareas(t), calendario: () => '<div data-cal></div>' };
  const hidden = new Set(D.prefs.homeHidden);

  el.innerHTML = `
    <div class="topline"><span class="small">${esc(fmtLong(t))}</span>
      <span class="tlbtns"><a class="iconbtn" href="#buscar" aria-label="Buscar en todo">${ic('i-srch')}</a><a class="iconbtn" href="#ajustes" aria-label="Ajustes">${ic('i-gear')}</a></span></div>
    <h1 class="h1">${greeting()}${name} ${ic('fl', 'i fl')}</h1>
    ${!standalone && !D.installHidden ? `<div class="card install">${ic('i-home')}<div class="grow"><b>Instálala como una app</b><br>Con su icono y sin internet.
      <div class="ibtns"><button class="btn pri" data-install>${canOneClick() ? 'Instalar' : 'Cómo se instala'}</button><button class="btn ghost" data-hide-install>Ahora no</button></div></div></div>` : ''}
    ${isOldHome() ? `<div class="card install moved">${ic('i-move')}<div class="grow"><b>Planner tiene nueva dirección</b><br>Esta app dejará de actualizarse. Pásate en 3 pasos:
      <ol class="isteps small"><li>Guarda una copia (botón de abajo).</li><li>Abre la nueva dirección e instálala.</li><li>Si al abrirla está vacía, toca «Tengo una copia» y elígela. Después borra este icono.</li></ol>
      <div class="ibtns"><button class="btn pri" data-backup>Guardar copia</button><a class="btn" href="${NEW_HOME}" target="_blank" rel="noopener">Abrir la nueva</a></div></div></div>` : ''}
    ${blockToday(t)}
    ${blockReminders(t)}
    ${blockWeek(t)}
    ${backupDue() && !isOldHome() ? `<div class="card install backup">${ic('i-share')}<div class="grow"><b>Guarda una copia</b><br>${D.lastBackup ? 'Hace más de un mes de tu última copia.' : 'Aún no tienes ninguna.'} Todo está solo en este dispositivo: si se borra la app, la copia lo recupera.
      <div class="ibtns"><button class="btn pri" data-backup>Guardar copia</button><button class="btn ghost" data-snooze>Ahora no</button></div></div></div>` : ''}
    ${D.prefs.homeOrder.filter(k => !hidden.has(k)).map(k => blocks[k]()).join('')}
    <a class="organize" href="#organizar">${ic('i-grid')} Organizar esta pantalla</a>
  `;

  const cal = el.querySelector('[data-cal]');
  if (cal) calendar(cal, () => draw(el));
  el.querySelector('[data-hide-install]')?.addEventListener('click', () => { D.installHidden = true; save(); el.querySelector('.install').remove(); toast('Puedes instalarla cuando quieras desde Ajustes'); });
  el.querySelectorAll('[data-backup]').forEach(b => b.onclick = async () => { if (await exportBackup()) draw(el); });
  el.querySelector('[data-snooze]')?.addEventListener('click', () => { D.backupSnooze = Date.now() + 7 * 864e5; save(); draw(el); });
  el.querySelector('[data-install]')?.addEventListener('click', async () => { if (canOneClick()) { if (await promptInstall()) draw(el); } else openInstall(); });
  el.querySelectorAll('[data-rem]').forEach(r => r.querySelector('[data-ok]').onclick = () => {
    dismissReminder(D.deadlines.find(d => d.id === r.dataset.rem)); r.remove();
  });
  el.querySelector('[data-weekok]')?.addEventListener('click', () => { D.weekSeen = el.querySelector('[data-week]').dataset.week; save(); el.querySelector('[data-week]').remove(); });
  el.querySelector('[data-late]')?.addEventListener('click', () => {
    const late = D.tasks.filter(k => !k.done && k.due && k.due < t);
    const before = late.map(k => [k, k.due]);
    late.forEach(k => { k.due = t; }); save(); draw(el);
    toast(late.length === 1 ? 'Pasada a hoy' : `${late.length} tareas pasadas a hoy`, () => { before.forEach(([k, d]) => { k.due = d; }); save(); draw(el); });
  });
  el.querySelectorAll('.list > [data-task]').forEach(r => {
    if (r.closest('[data-cal]')) return;
    const k = D.tasks.find(x => x.id === r.dataset.task);
    r.querySelector('.cb').onclick = () => {
      toggleTask(k);
      if (k.done) {
        // Se marca, se ve el ✓ un momento y desaparece de la lista.
        const cb = r.querySelector('.cb'); cb.setAttribute('aria-checked', 'true');
        r.classList.add('leaving');
        toast('Tarea hecha', () => { toggleTask(k); draw(el); });
        setTimeout(() => draw(el), 550);
      } else draw(el);
    };
    r.querySelector('[data-open]').onclick = () => editTask(k, () => draw(el));
    swipeTask(r, k, () => draw(el));
  });
}

export function render(el) {
  draw(el);
  // Si el navegador avisa de que ya se puede instalar con un toque, se cambia el botón.
  const onInstall = () => { if (!document.querySelector('.sheet')) draw(el); };
  addEventListener('bea:install', onInstall);
  // Actualizar cada minuto mientras está abierta.
  const timer = setInterval(() => { if (!document.querySelector('.sheet, .swiping')) draw(el); }, 60000);
  return () => { clearInterval(timer); removeEventListener('bea:install', onInstall); };
}
