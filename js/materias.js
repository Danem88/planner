// Pantalla «Materias»: cada asignatura con sus tareas, calificaciones y notas.
import { D, save, subj, color, flowerOf, upcoming, dlTitle, gradesOf, average, notesOfSubject, sectionsOf, addSubject } from './store.js';
import { esc, today, daysBetween, relDay, num, uid } from './util.js';
import { ic, sheet, ask, toast, backLink } from './ui.js';
import { editTask, toggleTask } from './add.js';
import { renderSections } from './notas.js';

const COLORS = [1, 2, 3, 4, 5, 6];

function nextThing(sid) {
  const t = today();
  const d = upcoming().find(x => x.subjectId === sid);
  if (d) { const n = daysBetween(t, d.date); return `${d.kind === 'exam' ? 'Examen' : 'Entrega'} ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`}`; }
  const k = D.tasks.filter(x => x.subjectId === sid && !x.done).length;
  if (k) return `${k} ${k === 1 ? 'tarea' : 'tareas'}`;
  const n = notesOfSubject(sid).length;
  return n ? `${n} ${n === 1 ? 'nota' : 'notas'}` : 'Nada pendiente';
}

export function render(el, params) {
  if (params[0]) return renderSubject(el, params[0], params[1] || 'tareas');
  el.innerHTML = `
    <div class="topline"><h1 class="h1">Asignaturas</h1></div>
    <div class="subs">
      ${D.subjects.map(s => {
        const a = average(s.id);
        return `<a class="sub" href="#materias/${s.id}" style="background:${color(s.id)}">${ic(flowerOf(s.id), 'f')}
          ${a != null ? `<div class="avg">${num(a)} <span>media</span></div>` : ''}<b>${esc(s.name)}</b><small>${esc(nextThing(s.id))}</small></a>`;
      }).join('')}
      <button class="sub new" data-new>+ Asignatura</button>
    </div>`;
  el.querySelector('[data-new]').onclick = () => editSubject(null, s => { location.hash = '#materias/' + s.id; });
}

function renderSubject(el, id, tab) {
  const s = subj(id);
  if (!s) { location.replace('#materias'); return; }
  const tabs = [['tareas', 'Tareas'], ['notas-cal', 'Calificaciones'], ['notas', 'Notas']];
  const secs = sectionsOf(id).length, notes = notesOfSubject(id).length;
  el.innerHTML = `
    <div class="topline">${backLink('#materias', 'Asignaturas')}</div>
    <div class="hero" style="background:${color(id)}">${ic(flowerOf(id), 'f')}
      <div class="grow"><b>${esc(s.name)}</b><small>${[s.teacher, `${notes} ${notes === 1 ? 'nota' : 'notas'}`].filter(Boolean).map(esc).join(' · ')}</small></div>
      <button class="iconbtn" data-edit aria-label="Editar asignatura">${ic('i-edit')}</button></div>
    <nav class="tabs">${tabs.map(([k, l]) => `<a href="#materias/${id}/${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div data-body></div>`;
  el.querySelector('[data-edit]').onclick = () => editSubject(s, () => renderSubject(el, id, tab));
  const body = el.querySelector('[data-body]');
  if (tab === 'notas') return renderSections(body, id);
  if (tab === 'notas-cal') return renderGrades(body, id);
  renderTasks(body, id);
}

function renderTasks(el, sid) {
  const t = today();
  const open = D.tasks.filter(k => k.subjectId === sid && !k.done).sort((a, b) => (a.due || '9').localeCompare(b.due || '9'));
  const done = D.tasks.filter(k => k.subjectId === sid && k.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 15);
  const dl = upcoming().filter(x => x.subjectId === sid);
  const row = k => `<div class="item ${k.done ? 'done' : ''} ${!k.done && k.due && k.due < t ? 'overdue' : ''}" data-task="${k.id}">
    <span class="cbwrap"><button class="cb" role="checkbox" aria-checked="${k.done}" aria-label="Hecha: ${esc(k.title)}">${ic('i-ok')}</button></span>
    <button class="grow" data-open style="text-align:left"><span class="t">${esc(k.title)}</span>${k.due ? `<small>${esc(relDay(k.due))}</small>` : ''}</button></div>`;
  el.innerHTML = `
    <div class="quickadd"><input class="inp" placeholder="Nueva tarea de esta asignatura" enterkeyhint="done" aria-label="Nueva tarea"><button class="btn pri" data-add aria-label="Añadir tarea">${ic('i-plus')}</button></div>
    ${dl.length ? `<div class="sec">Próximas fechas</div>${dl.map(d => `<a class="card dl" href="#fechas/${d.id}"><div class="n" style="background:${color(sid)}"><strong>${Math.max(0, daysBetween(t, d.date))}</strong><small>días</small></div>
      <div class="grow"><b>${esc(dlTitle(d))}</b><p>${d.kind === 'exam' ? 'Examen' : 'Entrega'} · ${esc(relDay(d.date))}</p></div></a>`).join('')}` : ''}
    <div class="sec">Pendientes</div>
    ${open.length ? `<div class="card list">${open.map(row).join('')}</div>` : `<div class="card empty" style="padding:1rem">No hay tareas pendientes.</div>`}
    ${done.length ? `<div class="sec">Hechas</div><div class="card list">${done.map(row).join('')}</div>` : ''}`;
  const inp = el.querySelector('input');
  const add = () => {
    const title = inp.value.trim(); if (!title) return;
    D.tasks.push({ id: uid(), title, subjectId: sid, due: '', done: false, doneAt: '' });
    save(); renderTasks(el, sid);
    el.querySelector('input').focus();
  };
  inp.onkeydown = e => { if (e.key === 'Enter') add(); };
  el.querySelector('[data-add]').onclick = add;
  el.querySelectorAll('[data-task]').forEach(r => {
    const k = D.tasks.find(x => x.id === r.dataset.task);
    r.querySelector('.cb').onclick = () => { toggleTask(k); renderTasks(el, sid); };
    r.querySelector('[data-open]').onclick = () => editTask(k, () => renderTasks(el, sid));
  });
}

function renderGrades(el, sid) {
  const list = gradesOf(sid);
  const a = average(sid);
  const prev = list.length > 1 ? average(sid, list.slice(0, -1)) : null;
  const delta = a != null && prev != null ? a - prev : null;
  const last8 = list.slice(-8);
  el.innerHTML = `
    ${list.length ? `
      <div class="media"><strong>${num(a)}</strong><p>Media${list.length > 1 ? ` de ${list.length} notas` : ''}<br>
        ${delta != null && Math.abs(delta) >= 0.05 ? `<span style="color:${delta > 0 ? 'var(--rosaT)' : 'var(--accent)'}">${delta > 0 ? '↑' : '↓'} ${num(Math.abs(delta))} con la última</span>` : ''}</p></div>
      <div class="spark" aria-hidden="true">${last8.map((g, i) => `<i class="${i === last8.length - 1 ? 'last' : ''}" style="height:${Math.max(6, g.value * 10)}%"></i>`).join('')}</div>
      <div class="card list">${list.slice().reverse().map(g => `<button class="item grade" data-g="${g.id}"><div class="grow"><span class="t">${esc(g.title || 'Calificación')}</span><small>${esc(relDay(g.date).replace(/^el /, ''))}</small></div>
        <strong class="${g.value < 5 ? 'low' : ''}">${String(g.value).replace('.', ',')}</strong></button>`).join('')}</div>`
    : `<div class="empty">${ic('fl2', 'fl')}Aún no hay calificaciones.<br>Apunta la nota de cada examen o trabajo y verás tu media.</div>`}
    <button class="dashed" data-add>+ Añadir calificación</button>`;
  el.querySelector('[data-add]').onclick = () => editGrade(null, sid, () => renderGrades(el, sid));
  el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => editGrade(D.grades.find(g => g.id === b.dataset.g), sid, () => renderGrades(el, sid)));
}

function editGrade(g, sid, done) {
  const { el, close } = sheet(`
    <h2>${g ? 'Calificación' : 'Nueva calificación'}</h2>
    <label class="field"><span>¿De qué?</span><input class="inp" name="t" value="${esc(g?.title || '')}" placeholder="Examen tema 3"></label>
    <div class="row2">
      <label class="field"><span>Nota (0 a 10)</span><input class="inp" name="v" inputmode="decimal" value="${g ? String(g.value).replace('.', ',') : ''}" placeholder="7,5"></label>
      <label class="field"><span>Día</span><input class="inp" type="date" name="d" value="${g?.date || today()}"></label>
    </div>
    <div class="acts">${g ? '<button class="btn danger" data-del>Quitar</button>' : '<button class="btn" data-cancel>Cancelar</button>'}<button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Calificación' });
  const f = n => el.querySelector(`[name=${n}]`);
  setTimeout(() => (g ? f('v') : f('t')).focus(), 320);
  el.querySelector('[data-cancel]')?.addEventListener('click', () => close());
  el.querySelector('[data-del]')?.addEventListener('click', () => {
    const i = D.grades.indexOf(g); D.grades.splice(i, 1); save(); close(); done();
    toast('Calificación quitada', () => { D.grades.splice(i, 0, g); save(); done(); });
  });
  el.querySelector('[data-ok]').onclick = () => {
    const v = parseFloat(f('v').value.replace(',', '.'));
    if (!(v >= 0 && v <= 10)) { f('v').focus(); toast('Escribe una nota de 0 a 10'); return; }
    const data = { subjectId: sid, title: f('t').value.trim(), value: Math.round(v * 100) / 100, date: f('d').value || today() };
    if (g) Object.assign(g, data); else D.grades.push({ id: uid(), ...data });
    save(); close(); done();
  };
}

export function editSubject(s, done) {
  let col = s?.color || (D.subjects.length % 6) + 1;
  const { el, close } = sheet(`
    <h2>${s ? 'Editar asignatura' : 'Nueva asignatura'}</h2>
    <label class="field"><span>Nombre</span><input class="inp" name="n" value="${esc(s?.name || '')}" placeholder="Matemáticas"></label>
    <label class="field"><span>Profesor o profesora (opcional)</span><input class="inp" name="p" value="${esc(s?.teacher || '')}" placeholder="Prof. Ruiz"></label>
    <div class="field"><span>Color</span><div class="swatches" role="group" aria-label="Color">${COLORS.map(c => `<button data-c="${c}" aria-pressed="${c === col}" style="background:var(--s${c})" aria-label="Color ${c}"></button>`).join('')}</div></div>
    <div class="acts">${s ? '<button class="btn danger" data-del>Eliminar</button>' : '<button class="btn" data-cancel>Cancelar</button>'}<button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Asignatura' });
  const f = n => el.querySelector(`[name=${n}]`);
  if (!s) setTimeout(() => f('n').focus(), 320);
  el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { col = +b.dataset.c; el.querySelectorAll('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  el.querySelector('[data-cancel]')?.addEventListener('click', () => close());
  el.querySelector('[data-del]')?.addEventListener('click', async () => {
    close();
    const n = notesOfSubject(s.id).length;
    if (!await ask(`¿Eliminar ${s.name}?`, { ok: 'Eliminar', danger: true, detail: `Se borrarán también sus clases, tareas, fechas, calificaciones${n ? ` y sus ${n} notas` : ''}. No se puede deshacer.` })) return;
    const secIds = new Set(sectionsOf(s.id).map(x => x.id));
    D.notes = D.notes.filter(x => !secIds.has(x.sectionId));
    D.sections = D.sections.filter(x => x.subjectId !== s.id);
    for (const k of ['classes', 'tasks', 'deadlines', 'grades']) D[k] = D[k].filter(x => x.subjectId !== s.id);
    D.subjects = D.subjects.filter(x => x !== s);
    save(); location.hash = '#materias';
  });
  el.querySelector('[data-ok]').onclick = () => {
    const name = f('n').value.trim();
    if (!name) { f('n').focus(); return; }
    let item = s;
    if (s) Object.assign(s, { name, teacher: f('p').value.trim(), color: col });
    else item = addSubject(name, { teacher: f('p').value.trim(), color: col });
    save(); close(); done(item);
  };
}
