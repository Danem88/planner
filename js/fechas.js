// Pantalla «Fechas»: exámenes, entregas y presentaciones con cuenta atrás y recordatorios.
import { D, save, catColor, subjName, deadline, dlTitle, isPast, reviewProgress, sectionsOf, section, notesOf, addSection, addSubject, KINDS, KINDS_PL, doneLabel, gradeOfDeadline, upcoming, termOf, TERMS } from './store.js';
import { esc, today, daysBetween, fmtShort, relDay, countdown, uid, ago } from './util.js';
import { ic, ring, sheet, menu, ask, askText, toast, backLink, subjectOptions, handleNewSubject, goBack, catDot } from './ui.js';
import { editGrade } from './grades.js';
import { openShare } from './share.js';

let filter = 'exam';
const REMIND = [[0, 'El mismo día'], [1, '1 día antes'], [2, '2 días antes'], [3, '3 días antes'], [7, '1 semana antes']];
const remindTxt = r => !r || !r.length ? 'Sin recordatorio' : r.slice().sort((a, b) => a - b).map(x => REMIND.find(y => y[0] === x)?.[1] || `${x} días antes`).join(', ');

export function render(el, params) {
  if (params[0]) return renderDetail(el, params[0]);
  const t = today();
  const list = D.deadlines.filter(d => d.kind === filter);
  const future = list.filter(d => !isPast(d)).sort((a, b) => a.date.localeCompare(b.date));
  const past = list.filter(isPast).sort((a, b) => b.date.localeCompare(a.date));
  const week = future.filter(d => daysBetween(t, d.date) <= 7);
  const later = future.filter(d => daysBetween(t, d.date) > 7);

  const row = d => {
    const n = daysBetween(t, d.date), cd = countdown(d.date), p = reviewProgress(d);
    const when = isPast(d) ? (d.done ? doneLabel(d) : relDay(d.date)) : relDay(d.date);
    return `<a class="card dl ${!isPast(d) && n <= 1 ? 'urgent' : ''} ${isPast(d) ? 'past' : ''}" href="#fechas/${d.id}">
      <div class="n" style="background:${catColor(d.kind)}">${isPast(d) ? ic(d.done ? 'i-ok' : 'fl2') : `<strong>${cd.n}</strong><small>${cd.u}</small>`}</div>
      <div class="grow"><b>${esc(dlTitle(d))}</b><p>${esc(when)}${d.time ? ' · ' + esc(d.time) : ''}${!isPast(d) && d.remind?.length ? ` · ${ic('i-bell', 'i mini')}` : ''}</p>
      ${p && p.total && !isPast(d) ? `<div class="ready" aria-label="Repasado ${p.done} de ${p.total}"><i style="width:${p.done / p.total * 100}%"></i></div>` : ''}</div></a>`;
  };

  el.innerHTML = `
    <div class="topline"><h1 class="h1">Fechas</h1><span class="tlbtns">
      <button class="iconbtn" data-ics aria-label="Pasar las fechas al calendario del móvil">${ic('i-cal')}</button>
      <button class="iconbtn" data-share aria-label="Compartir con tu clase">${ic('i-share')}</button>
      <button class="btn ghost" data-new style="padding:0 .2rem">+ Añadir</button></span></div>
    <div class="seg cats" role="group" aria-label="Tipo de fecha">
      ${Object.entries(KINDS_PL).map(([k, l]) => `<button data-f="${k}" aria-pressed="${filter === k}"><span class="dot cat" style="--c:${catColor(k)}"></span>${l}</button>`).join('')}
    </div>
    ${!future.length && !past.length ? `<div class="empty" style="margin-top:1rem">${ic('fl2', 'fl')}No hay ${KINDS_PL[filter].toLowerCase()} apuntadas.<br>
      <button class="btn pri" data-new>+ Añadir ${KINDS[filter].toLowerCase()}</button></div>` : ''}
    ${week.length ? `<div class="sec">Esta semana</div>${week.map(row).join('')}` : ''}
    ${later.length ? `<div class="sec">Más adelante</div>${later.map(row).join('')}` : ''}
    ${past.length ? `<details class="past"><summary class="sec">Ya pasadas <em>${past.length}</em></summary>${past.slice(0, 40).map(row).join('')}</details>` : ''}
  `;
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; render(el, []); });
  el.querySelector('[data-share]').onclick = () => openShare();
  el.querySelector('[data-ics]').onclick = exportAll;
  el.querySelectorAll('[data-new]').forEach(b => b.onclick = () => editDeadline(null, d => { location.hash = '#fechas/' + d.id; }, filter));
}

function renderDetail(el, id) {
  const d = deadline(id);
  if (!d) { goBack('#fechas'); return; }
  filter = d.kind;
  const t = today(), n = daysBetween(t, d.date), p = reviewProgress(d);
  const sec = d.sectionId && section(d.sectionId);
  const notes = sec ? notesOf(sec.id) : [];
  const g = gradeOfDeadline(d.id);
  const draw = () => renderDetail(el, id);

  el.innerHTML = `
    <div class="topline">${backLink('#fechas', 'Fechas')}
      <button class="iconbtn" data-more aria-label="Opciones">${ic('i-more')}</button></div>
    <div class="exhero">
      <div class="ring">${ring(Math.max(0, n), 72, 5)}<div><span>${isPast(d) ? ic(d.done ? 'i-ok' : 'fl2') : `<strong>${n === 0 ? 'Hoy' : n}</strong>${n ? `<small>${n === 1 ? 'día' : 'días'}</small>` : ''}`}</span></div></div>
      <div><span class="kindtag" style="--c:${catColor(d.kind)}">${KINDS[d.kind]}</span><b>${esc(dlTitle(d))}</b><p>${esc(fmtShort(d.date))}${d.time ? ' · ' + esc(d.time) : ''}</p>
      ${d.done ? `<p>${doneLabel(d)}</p>` : n < 0 ? `<p>Fue hace ${-n} ${n === -1 ? 'día' : 'días'}</p>` : ''}</div>
    </div>
    ${d.kind !== 'exam' ? `<button class="btn ${d.done ? '' : 'pri'} wide" data-done style="margin-top:1rem">${d.done ? `Marcar como no ${doneLabel(d).toLowerCase()}` : `Marcar como ${doneLabel(d).toLowerCase()}`}</button>` : ''}

    ${isPast(d) ? '' : `<div class="sec">Recordatorio</div>
    <div class="card list">
      <button class="item" data-remind>${ic('i-bell')}<div class="grow"><span class="t">${esc(remindTxt(d.remind))}</span><small>Te aparecerá en «Hoy» al abrir la app</small></div>${ic('i-chev', 'i chev')}</button>
      <button class="item" data-ics>${ic('i-cal')}<div class="grow"><span class="t">Añadir al calendario del móvil</span><small>Con aviso del móvil aunque no abras la app</small></div></button>
    </div>`}

    ${d.subjectId ? `<div class="sec">Nota</div>
      ${g ? `<button class="card item gradebtn" data-grade><div class="grow"><span class="t">${esc(g.title || 'Calificación')}</span><small>Cuenta en la media de ${g.type === 'exam' ? 'exámenes' : 'trabajos'}</small></div><strong class="${g.value < 5 ? 'low' : ''}">${String(g.value).replace('.', ',')}</strong></button>`
        : `<button class="dashed" data-grade style="margin-top:0">+ Poner la nota cuando la tengas</button>`}` : ''}

    ${sec ? `
      ${notes.length ? `<div class="prog"><span>Repasado</span><span>${p.done} de ${p.total} notas</span></div><div class="pbar"><i style="width:${p.total ? p.done / p.total * 100 : 0}%"></i></div>` : ''}
      <div class="sec">Para repasar <em>${esc(sec.name)}</em></div>
      ${notes.length ? `<div class="card list">${notes.map(nt => {
        const on = (d.reviewed || []).includes(nt.id);
        return `<div class="item" data-n="${nt.id}"><span class="cbwrap"><button class="cb" role="checkbox" aria-checked="${on}" aria-label="Repasada: ${esc(nt.title || 'Sin título')}">${ic('i-ok')}</button></span>
          <a class="grow" href="#nota/${nt.id}"><span class="t">${esc(nt.title || 'Sin título')}</span><small>${esc(ago(nt.updated))}</small></a></div>`;
      }).join('')}</div>` : `<div class="card empty">Esta sección aún no tiene notas.<br><a class="btn" href="#notas/${sec.subjectId}">Ir a las notas</a></div>`}
      <button class="btn ghost wide" data-link style="margin-top:.4rem">Cambiar las notas unidas</button>`
    : d.subjectId ? `<div class="sec">Para repasar</div><div class="card empty">Une una sección de notas para tenerlas aquí y marcar lo que ya has repasado.
      <br><button class="btn pri" data-link>Unir notas</button></div>` : ''}
  `;

  el.querySelectorAll('[data-n]').forEach(r => r.querySelector('.cb').onclick = () => {
    d.reviewed = d.reviewed || [];
    const i = d.reviewed.indexOf(r.dataset.n);
    if (i >= 0) d.reviewed.splice(i, 1); else d.reviewed.push(r.dataset.n);
    save(); draw();
  });
  el.querySelector('[data-done]')?.addEventListener('click', () => { d.done = !d.done; save(); draw(); });
  el.querySelectorAll('[data-link]').forEach(b => b.onclick = () => pickSection(d, draw));
  el.querySelector('[data-remind]')?.addEventListener('click', () => editRemind(d, draw));
  el.querySelector('[data-ics]')?.addEventListener('click', () => addToCalendar(d));
  el.querySelector('[data-grade]')?.addEventListener('click', () => editGrade(g || null,
    { subjectId: d.subjectId, type: d.kind === 'exam' ? 'exam' : 'work', title: d.title || KINDS[d.kind], date: d.date <= t ? d.date : t, deadlineId: d.id }, draw));
  el.querySelector('[data-more]').onclick = () => menu(null, [
    { label: 'Editar', icon: 'i-edit', run: () => editDeadline(d, draw) },
    { label: 'Eliminar', icon: 'i-trash', danger: true, run: async () => {
      if (!await ask(`¿Eliminar «${dlTitle(d)}»?`, { ok: 'Eliminar', danger: true, detail: 'Las notas unidas no se borran.' })) return;
      const i = D.deadlines.indexOf(d); D.deadlines.splice(i, 1); save();
      goBack('#fechas');
      toast('Eliminado', () => { D.deadlines.splice(i, 0, d); save(); dispatchEvent(new Event('bea:refresh')); });
    } },
  ]);
}

function editRemind(d, done) {
  const sel = new Set(d.remind || []);
  const { el, close } = sheet(`<h2>Recordatorio</h2>
    <p class="small" style="margin:-.4rem 0 .8rem;line-height:1.45">Elige cuándo quieres que te lo recuerde. Aparecerá arriba en «Hoy» al abrir la app.</p>
    <div class="card list">${REMIND.map(([k, l]) => `<button class="item" data-r="${k}"><span class="grow">${l}</span><span class="cb" role="checkbox" aria-checked="${sel.has(k)}">${ic('i-ok')}</span></button>`).join('')}</div>
    <div class="acts"><button class="btn" data-none>Sin recordatorio</button><button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Recordatorio' });
  el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    const k = +b.dataset.r; sel.has(k) ? sel.delete(k) : sel.add(k);
    b.querySelector('.cb').setAttribute('aria-checked', sel.has(k));
  });
  const apply = () => { d.remind = [...sel].sort((a, b) => a - b); d.dismissed = []; save(); close(); done(); };
  el.querySelector('[data-none]').onclick = () => { sel.clear(); apply(); };
  el.querySelector('[data-ok]').onclick = apply;
}

// Archivo .ics: el móvil lo añade a su calendario con los avisos elegidos.
// Cada fecha lleva su identificador, así volver a añadirla la actualiza en vez de repetirla.
const pad = x => String(x).padStart(2, '0');
const icsEsc = s => String(s).replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
function icsEvent(d) {
  const ymdc = s => s.replace(/-/g, '');
  const now = new Date(), stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  let when;
  if (d.time) {
    const [h, m] = d.time.split(':').map(Number);
    const endH = h + 1;
    when = `DTSTART:${ymdc(d.date)}T${pad(h)}${pad(m)}00\r\nDTEND:${ymdc(d.date)}T${pad(Math.min(23, endH))}${pad(m)}00`;
  } else {
    const next = new Date(d.date + 'T12:00'); next.setDate(next.getDate() + 1);
    when = `DTSTART;VALUE=DATE:${ymdc(d.date)}\r\nDTEND;VALUE=DATE:${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  }
  // Avisos: con hora, N días antes a esa hora; sin hora, a las 9 de la mañana.
  const alarms = (d.remind?.length ? d.remind : [1]).map(r => {
    const trig = d.time ? (r ? `-P${r}D` : '-PT1H') : (r ? `-P${r - 1}DT15H` : 'PT9H');
    return `BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${icsEsc(dlTitle(d))}\r\nTRIGGER:${trig}\r\nEND:VALARM`;
  }).join('\r\n');
  return `BEGIN:VEVENT\r\nUID:${d.id}@planner\r\nDTSTAMP:${stamp}\r\n${when}\r\nSUMMARY:${icsEsc(dlTitle(d))}\r\nDESCRIPTION:${icsEsc(KINDS[d.kind] + ' · ' + subjName(d.subjectId))}\r\n${alarms}\r\nEND:VEVENT`;
}
function downloadIcs(list, name) {
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Planner//ES\r\n${list.map(icsEvent).join('\r\n')}\r\nEND:VCALENDAR\r\n`;
  const file = new File([ics], `${name.replace(/[\\/:*?"<>|]/g, '')}.ics`, { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name; a.rel = 'noopener';
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  toast(list.length > 1 ? 'Toca «Añadir todo» en el calendario que aparece' : 'Toca «Añadir» en el calendario que aparece');
}
const addToCalendar = d => downloadIcs([d], dlTitle(d));

// Pasar muchas fechas a la vez: elegir tipos y si son las de esta evaluación o todas las próximas.
function exportAll() {
  const t = today(), term = termOf(t);
  const kinds = new Set(Object.keys(KINDS));
  let range = 'term';
  const { el, close } = sheet(`<h2>Al calendario del móvil</h2>
    <p class="small" style="margin:-.4rem 0 .8rem;line-height:1.45">Se añaden todas de golpe, con sus recordatorios como avisos del móvil. Si alguna ya estaba, se actualiza.</p>
    <div class="seg" role="group" aria-label="Cuáles" style="margin-bottom:.8rem"><button data-r="term" aria-pressed="true">Esta evaluación</button><button data-r="all" aria-pressed="false">Todas las próximas</button></div>
    <div class="card list">${Object.entries(KINDS_PL).map(([k, l]) => `<button class="item" data-k="${k}">${catDot(k)}<span class="grow">${l}</span><span class="cb" role="checkbox" aria-checked="true">${ic('i-ok')}</span></button>`).join('')}</div>
    <button class="btn pri wide" data-go style="margin-top:1rem"></button>`, { label: 'Al calendario del móvil' });
  const pickList = () => upcoming().filter(d => kinds.has(d.kind) && (range === 'all' || (termOf(d.date) === term && daysBetween(t, d.date) < 160)));
  const refreshBtn = () => { const n = pickList().length; const b = el.querySelector('[data-go]'); b.textContent = n ? `Añadir ${n} ${n === 1 ? 'fecha' : 'fechas'}` : 'No hay fechas'; b.disabled = !n; };
  el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { range = b.dataset.r; el.querySelectorAll('[data-r]').forEach(x => x.setAttribute('aria-pressed', x === b)); refreshBtn(); });
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
    const k = b.dataset.k; kinds.has(k) ? kinds.delete(k) : kinds.add(k);
    b.querySelector('.cb').setAttribute('aria-checked', kinds.has(k)); refreshBtn();
  });
  el.querySelector('[data-go]').onclick = () => { const list = pickList(); if (!list.length) return; close(); downloadIcs(list, range === 'term' ? `Planner ${TERMS[term]}` : 'Planner fechas'); };
  refreshBtn();
}

function pickSection(d, done) {
  const secs = sectionsOf(d.subjectId);
  const items = secs.map(s => ({ label: `${s.name} · ${notesOf(s.id).length} notas`, icon: s.id === d.sectionId ? 'i-ok' : 'i-not', run: () => { d.sectionId = s.id; save(); done(); } }));
  items.push({ label: 'Nueva sección…', icon: 'i-plus', run: async () => {
    const name = await askText('Nueva sección', { value: d.title || '', placeholder: 'Tema 4 · La célula', ok: 'Crear' });
    if (!name) return;
    d.sectionId = addSection(d.subjectId, name).id; save(); done();
  } });
  if (d.sectionId) items.push({ label: 'No unir ninguna', icon: 'i-x', run: () => { d.sectionId = ''; save(); done(); } });
  menu(`Notas de ${subjName(d.subjectId)}`, items);
}

export function editDeadline(d, done, kind = 'exam', preset = {}) {
  const isNew = !d;
  const v = d || { kind, subjectId: preset.subjectId || '', title: '', date: preset.date || '', time: '', sectionId: '', remind: D.prefs.remind.slice() };
  const secOpts = sid => `<option value="">Ninguna</option>` + sectionsOf(sid).map(s => `<option value="${s.id}" ${s.id === v.sectionId ? 'selected' : ''}>${esc(s.name)}</option>`).join('') + (sid ? '<option value="__new">+ Nueva sección…</option>' : '');
  const { el, close } = sheet(`
    <h2>${isNew ? 'Nueva fecha' : 'Editar'}</h2>
    <div class="seg" role="group" aria-label="Tipo" style="margin-bottom:.9rem">
      ${Object.entries(KINDS).map(([k, l]) => `<button data-k="${k}" aria-pressed="${v.kind === k}">${l}</button>`).join('')}</div>
    <label class="field"><span>Asignatura</span><select class="inp" name="s">${subjectOptions(v.subjectId)}</select></label>
    <label class="field"><span>Tema o título (opcional)</span><input class="inp" name="t" value="${esc(v.title)}" placeholder="Tema 4 · La célula"></label>
    <div class="row2">
      <label class="field"><span>Día</span><input class="inp" type="date" name="d" value="${v.date}"></label>
      <label class="field"><span>Hora (opcional)</span><input class="inp" type="time" name="h" value="${v.time || ''}"></label>
    </div>
    <label class="field"><span>Notas para repasar</span><select class="inp" name="n">${secOpts(v.subjectId)}</select></label>
    <div class="acts"><button class="btn" data-cancel>Cancelar</button><button class="btn pri" data-ok>Guardar</button></div>
  `, { label: 'Fecha' });
  const f = n => el.querySelector(`[name=${n}]`);
  let k = v.kind;
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { k = b.dataset.k; el.querySelectorAll('[data-k]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  f('s').onchange = async () => { await handleNewSubject(f('s'), addSubject); f('n').innerHTML = secOpts(f('s').value); };
  f('n').onchange = async () => {
    if (f('n').value !== '__new') return;
    const name = await askText('Nueva sección', { value: f('t').value, placeholder: 'Tema 4 · La célula', ok: 'Crear' });
    if (!name) { f('n').value = ''; return; }
    const s = addSection(f('s').value, name);
    v.sectionId = s.id; f('n').innerHTML = secOpts(f('s').value); f('n').value = s.id;
  };
  el.querySelector('[data-cancel]').onclick = () => close();
  el.querySelector('[data-ok]').onclick = () => {
    if (!f('d').value) { f('d').focus(); toast('Elige el día'); return; }
    const sid = f('s').value === '__new' ? '' : f('s').value;
    const data = { kind: k, subjectId: sid, title: f('t').value.trim(), date: f('d').value, time: f('h').value, sectionId: f('n').value === '__new' ? '' : f('n').value };
    let item = d;
    if (isNew) { item = { id: uid(), reviewed: [], done: false, remind: v.remind, dismissed: [], ...data }; D.deadlines.push(item); }
    else { if (d.date !== data.date) d.dismissed = []; Object.assign(d, data); }
    save(); close(); done && done(item);
  };
}
