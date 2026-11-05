// Pantalla «Fechas»: exámenes y entregas con cuenta atrás.
import { D, save, color, subjName, deadline, dlTitle, isPast, reviewProgress, sectionsOf, section, notesOf, addSection, addSubject } from './store.js';
import { esc, today, daysBetween, fmtShort, relDay, countdown, uid, ago } from './util.js';
import { ic, ring, sheet, menu, ask, askText, toast, backLink, subjectOptions, handleNewSubject } from './ui.js';

let filter = 'all';

export function render(el, params) {
  if (params[0]) return renderDetail(el, params[0]);
  const t = today();
  const list = D.deadlines.filter(d => filter === 'all' || d.kind === filter);
  const future = list.filter(d => !isPast(d)).sort((a, b) => a.date.localeCompare(b.date));
  const past = list.filter(isPast).sort((a, b) => b.date.localeCompare(a.date));
  const week = future.filter(d => daysBetween(t, d.date) <= 7);
  const later = future.filter(d => daysBetween(t, d.date) > 7);

  const row = d => {
    const n = daysBetween(t, d.date), cd = countdown(d.date), p = reviewProgress(d);
    const kind = d.kind === 'exam' ? 'Examen' : 'Entrega';
    const when = isPast(d) ? (d.done ? 'Entregada' : relDay(d.date)) : relDay(d.date);
    return `<a class="card dl ${!isPast(d) && n <= 1 ? 'urgent' : ''} ${isPast(d) ? 'past' : ''}" href="#fechas/${d.id}">
      <div class="n" style="background:${color(d.subjectId)}">${isPast(d) ? ic(d.done ? 'i-ok' : 'fl2') : `<strong>${cd.n}</strong><small>${cd.u}</small>`}</div>
      <div class="grow"><b>${esc(dlTitle(d))}</b><p>${kind} · ${esc(when)}${d.time ? ' · ' + esc(d.time) : ''}</p>
      ${p && p.total && !isPast(d) ? `<div class="ready" aria-label="Repasado ${p.done} de ${p.total}"><i style="width:${p.done / p.total * 100}%"></i></div>` : ''}</div></a>`;
  };

  el.innerHTML = `
    <div class="topline"><h1 class="h1">Fechas</h1></div>
    <div class="seg" role="group" aria-label="Filtrar">
      ${[['all', 'Todo'], ['exam', 'Exámenes'], ['entrega', 'Entregas']].map(([k, l]) => `<button data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join('')}
    </div>
    ${!future.length && !past.length ? `<div class="empty" style="margin-top:1rem">${ic('fl2', 'fl')}No hay ${filter === 'entrega' ? 'entregas' : filter === 'exam' ? 'exámenes' : 'exámenes ni entregas'} apuntados.<br>
      <button class="btn pri" data-new>+ Añadir</button></div>` : ''}
    ${week.length ? `<div class="sec">Esta semana</div>${week.map(row).join('')}` : ''}
    ${later.length ? `<div class="sec">Más adelante</div>${later.map(row).join('')}` : ''}
    ${past.length ? `<details class="past"><summary class="sec">Ya pasadas <em>${past.length}</em></summary>${past.slice(0, 40).map(row).join('')}</details>` : ''}
  `;
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; render(el, []); });
  el.querySelector('[data-new]')?.addEventListener('click', () => editDeadline(null, d => { location.hash = '#fechas/' + d.id; }, filter === 'entrega' ? 'entrega' : 'exam'));
}

function renderDetail(el, id) {
  const d = deadline(id);
  if (!d) { location.replace('#fechas'); return; }
  const t = today(), n = daysBetween(t, d.date), p = reviewProgress(d);
  const sec = d.sectionId && section(d.sectionId);
  const notes = sec ? notesOf(sec.id) : [];
  const kind = d.kind === 'exam' ? 'Examen' : 'Entrega';

  el.innerHTML = `
    <div class="topline">${backLink('#fechas', 'Fechas')}
      <button class="iconbtn" data-more aria-label="Opciones">${ic('i-more')}</button></div>
    <div class="exhero">
      <div class="ring">${ring(Math.max(0, n), 72, 5)}<div><span>${isPast(d) ? ic(d.done ? 'i-ok' : 'fl2') : `<strong>${n === 0 ? 'Hoy' : n}</strong>${n ? `<small>${n === 1 ? 'día' : 'días'}</small>` : ''}`}</span></div></div>
      <div><b>${esc(dlTitle(d))}</b><p>${kind} · ${esc(fmtShort(d.date))}${d.time ? ' · ' + esc(d.time) : ''}</p>
      ${d.done ? '<p>Entregada</p>' : n < 0 ? `<p>Fue hace ${-n} ${n === -1 ? 'día' : 'días'}</p>` : ''}</div>
    </div>
    ${d.kind === 'entrega' ? `<button class="btn ${d.done ? '' : 'pri'} wide" data-done style="margin-top:1rem">${d.done ? 'Marcar como no entregada' : 'Marcar como entregada'}</button>` : ''}
    ${sec ? `
      ${notes.length ? `<div class="prog"><span>Repasado</span><span>${p.done} de ${p.total} notas</span></div><div class="pbar"><i style="width:${p.total ? p.done / p.total * 100 : 0}%"></i></div>` : ''}
      <div class="sec">Para repasar <em>${esc(sec.name)}</em></div>
      ${notes.length ? `<div class="card list">${notes.map(nt => {
        const on = (d.reviewed || []).includes(nt.id);
        return `<div class="item" data-n="${nt.id}"><span class="cbwrap"><button class="cb" role="checkbox" aria-checked="${on}" aria-label="Repasada: ${esc(nt.title || 'Sin título')}">${ic('i-ok')}</button></span>
          <a class="grow" href="#nota/${nt.id}"><span class="t">${esc(nt.title || 'Sin título')}</span><small>${esc(ago(nt.updated))}</small></a></div>`;
      }).join('')}</div>` : `<div class="card empty">Esta sección aún no tiene notas.<br><a class="btn" href="#notas/${sec.subjectId}">Ir a las notas</a></div>`}
      <button class="btn ghost wide" data-link style="margin-top:.4rem">Cambiar las notas unidas</button>`
    : d.subjectId ? `<div class="sec">Para repasar</div><div class="card empty">Une una sección de notas a ${d.kind === 'exam' ? 'este examen' : 'esta entrega'} para tenerlas aquí y marcar lo que ya has repasado.
      <br><button class="btn pri" data-link>Unir notas</button></div>` : ''}
  `;

  el.querySelectorAll('[data-n]').forEach(r => r.querySelector('.cb').onclick = () => {
    d.reviewed = d.reviewed || [];
    const i = d.reviewed.indexOf(r.dataset.n);
    if (i >= 0) d.reviewed.splice(i, 1); else d.reviewed.push(r.dataset.n);
    save(); renderDetail(el, id);
  });
  el.querySelector('[data-done]')?.addEventListener('click', () => { d.done = !d.done; save(); renderDetail(el, id); });
  el.querySelectorAll('[data-link]').forEach(b => b.onclick = () => pickSection(d, () => renderDetail(el, id)));
  el.querySelector('[data-more]').onclick = () => menu(null, [
    { label: 'Editar', icon: 'i-edit', run: () => editDeadline(d, () => renderDetail(el, id)) },
    { label: 'Eliminar', icon: 'i-trash', danger: true, run: async () => {
      if (!await ask(`¿Eliminar «${dlTitle(d)}»?`, { ok: 'Eliminar', danger: true, detail: 'Las notas unidas no se borran.' })) return;
      const i = D.deadlines.indexOf(d); D.deadlines.splice(i, 1); save();
      location.hash = '#fechas';
      toast('Eliminado', () => { D.deadlines.splice(i, 0, d); save(); dispatchEvent(new Event('bea:refresh')); });
    } },
  ]);
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
  const v = d || { kind, subjectId: preset.subjectId || '', title: '', date: preset.date || '', time: '', sectionId: '' };
  const secOpts = sid => `<option value="">Ninguna</option>` + sectionsOf(sid).map(s => `<option value="${s.id}" ${s.id === v.sectionId ? 'selected' : ''}>${esc(s.name)}</option>`).join('') + (sid ? '<option value="__new">+ Nueva sección…</option>' : '');
  const { el, close } = sheet(`
    <h2>${isNew ? 'Nueva fecha' : 'Editar'}</h2>
    <div class="seg" role="group" aria-label="Tipo" style="margin-bottom:.9rem">
      <button data-k="exam" aria-pressed="${v.kind === 'exam'}">Examen</button><button data-k="entrega" aria-pressed="${v.kind === 'entrega'}">Entrega</button></div>
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
    if (isNew) { item = { id: uid(), reviewed: [], done: false, ...data }; D.deadlines.push(item); }
    else Object.assign(d, data);
    save(); close(); done && done(item);
  };
}
