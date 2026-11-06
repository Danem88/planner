// Pantalla «Materias»: cada asignatura con sus apuntes, tareas y calificaciones.
import { D, save, subj, color, flowerOf, upcoming, dlTitle, gradesOf, average, notesOfSubject, filesOfSubject, sectionsOf, addSubject, KINDS, blobsOfNote, catColor, finalAverage } from './store.js';
import { esc, today, daysBetween, relDay, num, uid } from './util.js';
import { ic, sheet, ask, toast, backLink, swatches, bindSwatches, replaceHash, goBack } from './ui.js';
import { editTask, toggleTask } from './add.js';
import { renderSections } from './notas.js';
import { renderGrades } from './grades.js';
import { blobDel } from './db.js';

function nextThing(sid) {
  const t = today();
  const d = upcoming().find(x => x.subjectId === sid);
  if (d) { const n = daysBetween(t, d.date); return `${KINDS[d.kind]} ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`}`; }
  const k = D.tasks.filter(x => x.subjectId === sid && !x.done).length;
  if (k) return `${k} ${k === 1 ? 'tarea' : 'tareas'}`;
  const n = notesOfSubject(sid).length + filesOfSubject(sid).length;
  return n ? `${n} ${n === 1 ? 'apunte' : 'apuntes'}` : 'Nada pendiente';
}

export function render(el, params) {
  if (params[0]) return renderSubject(el, params[0], params[1] || 'apuntes');
  const withGrades = D.subjects.filter(s => gradesOf(s.id).length);
  el.innerHTML = `
    <div class="topline"><h1 class="h1">Asignaturas</h1>
      ${D.subjects.length > 1 ? `<a class="btn ghost" href="#organizar" style="padding:0 .2rem">Ordenar</a>` : ''}</div>
    <div class="subs">
      ${D.subjects.map(s => {
        const fin = finalAverage(s.id);
        return `<a class="sub" href="#materias/${s.id}" style="background:${color(s.id)}">${ic(flowerOf(s.id), 'f')}
          ${fin != null ? `<div class="avg">${num(fin)} <span>media</span></div>` : ''}
          <b>${esc(s.name)}</b><small>${esc(nextThing(s.id))}</small></a>`;
      }).join('')}
      <button class="sub new" data-new>+ Asignatura</button>
    </div>
    ${withGrades.length ? `<div class="sec">Mis medias</div>
      <div class="card list medias"><div class="item mh"><span class="grow"></span><span>Exám.</span><span>Trab.</span><span>Final</span></div>
      ${withGrades.map(s => {
        const ae = average(gradesOf(s.id, 'exam')), aw = average(gradesOf(s.id, 'work')), fin = finalAverage(s.id);
        const cell = (v, cls = '') => `<strong class="${cls} ${v != null && v < 5 ? 'low' : ''}">${v != null ? num(v) : '—'}</strong>`;
        return `<a class="item" href="#materias/${s.id}/calificaciones"><span class="grow">${esc(s.name)}</span>${cell(ae)}${cell(aw)}${cell(fin, 'fin')}</a>`;
      }).join('')}</div>` : ''}`;
  el.querySelector('[data-new]').onclick = () => editSubject(null, s => { location.hash = '#materias/' + s.id; });
}

function renderSubject(el, id, tab) {
  const s = subj(id);
  if (!s) { replaceHash('#materias'); return; }
  if (tab === 'notas') tab = 'apuntes';
  const tabs = [['apuntes', 'Apuntes'], ['tareas', 'Tareas'], ['calificaciones', 'Calificaciones']];
  const notes = notesOfSubject(id).length + filesOfSubject(id).length;
  el.innerHTML = `
    <div class="topline">${backLink('#materias', 'Asignaturas')}</div>
    <div class="hero" style="background:${color(id)}">${ic(flowerOf(id), 'f')}
      <div class="grow"><b>${esc(s.name)}</b><small>${[s.teacher, `${notes} ${notes === 1 ? 'apunte' : 'apuntes'}`].filter(Boolean).map(esc).join(' · ')}</small></div>
      <button class="iconbtn" data-edit aria-label="Editar asignatura">${ic('i-edit')}</button></div>
    <nav class="tabs">${tabs.map(([k, l]) => `<a href="#materias/${id}/${k}" data-tab="${k}" ${k === tab ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div data-body></div>`;
  el.querySelector('[data-edit]').onclick = () => editSubject(s, () => renderSubject(el, id, tab));
  // Cambiar de pestaña no se apila en «Atrás».
  el.querySelectorAll('.tabs a').forEach(a => a.onclick = e => { e.preventDefault(); replaceHash(a.getAttribute('href')); });
  const body = el.querySelector('[data-body]');
  if (tab === 'apuntes') return renderSections(body, id);
  if (tab === 'calificaciones') return renderGrades(body, id);
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
    ${dl.length ? `<div class="sec">Próximas fechas</div>${dl.map(d => `<a class="card dl" href="#fechas/${d.id}"><div class="n" style="background:${catColor(d.kind)}"><strong>${Math.max(0, daysBetween(t, d.date))}</strong><small>días</small></div>
      <div class="grow"><b>${esc(dlTitle(d))}</b><p>${KINDS[d.kind]} · ${esc(relDay(d.date))}</p></div></a>`).join('')}` : ''}
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

export function editSubject(s, done) {
  let col = s?.color || (D.subjects.length % 24) + 1;
  const { el, close } = sheet(`
    <h2>${s ? 'Editar asignatura' : 'Nueva asignatura'}</h2>
    <label class="field"><span>Nombre</span><input class="inp" name="n" value="${esc(s?.name || '')}" placeholder="Matemáticas"></label>
    <label class="field"><span>Profesor o profesora (opcional)</span><input class="inp" name="p" value="${esc(s?.teacher || '')}" placeholder="Prof. Ruiz"></label>
    <div class="field"><span>Color</span>${swatches(col)}</div>
    <div class="acts">${s ? '<button class="btn danger" data-del>Eliminar</button>' : '<button class="btn" data-cancel>Cancelar</button>'}<button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Asignatura' });
  const f = n => el.querySelector(`[name=${n}]`);
  if (!s) setTimeout(() => f('n').focus(), 320);
  bindSwatches(el, c => { col = c; });
  el.querySelector('[data-cancel]')?.addEventListener('click', () => close());
  el.querySelector('[data-del]')?.addEventListener('click', async () => {
    close();
    const n = notesOfSubject(s.id).length + filesOfSubject(s.id).length;
    if (!await ask(`¿Eliminar ${s.name}?`, { ok: 'Eliminar', danger: true, detail: `Se borrarán también sus clases, tareas, fechas, calificaciones${n === 1 ? ' y su apunte' : n ? ` y sus ${n} apuntes` : ''}. No se puede deshacer.` })) return;
    const secIds = new Set(sectionsOf(s.id).map(x => x.id));
    for (const x of D.notes.filter(x => secIds.has(x.sectionId))) for (const b of blobsOfNote(x)) blobDel(b).catch(() => {});
    for (const x of D.files.filter(x => secIds.has(x.sectionId))) blobDel(x.blob).catch(() => {});
    D.notes = D.notes.filter(x => !secIds.has(x.sectionId));
    D.files = D.files.filter(x => !secIds.has(x.sectionId));
    D.sections = D.sections.filter(x => x.subjectId !== s.id);
    for (const k of ['classes', 'tasks', 'deadlines', 'grades']) D[k] = D[k].filter(x => x.subjectId !== s.id);
    D.subjects = D.subjects.filter(x => x !== s);
    save(); goBack('#materias');
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
