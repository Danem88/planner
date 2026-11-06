// Botón +: apuntar una tarea, examen, entrega o nota escribiendo con naturalidad.
// También la ficha de una tarea.
import { D, save, subjName, color, sectionsOf, defaultSection, addNote, addSubject } from './store.js';
import { esc, uid, fmtShort, today } from './util.js';
import { ic, sheet, toast, ask, subjectOptions, handleNewSubject, refresh } from './ui.js';
import { parseQuick } from './parse.js';

const KINDS = [['task', 'Tarea'], ['exam', 'Examen'], ['entrega', 'Entrega'], ['presentacion', 'Presentación'], ['note', 'Nota']];
const isDl = k => k === 'exam' || k === 'entrega' || k === 'presentacion';

export function toggleTask(k) {
  k.done = !k.done;
  k.doneAt = k.done ? new Date().toISOString() : '';
  save();
}

// Asignatura según la pantalla abierta (#materias/ID, #notas/ID).
function contextSubject() {
  const [r, p] = location.hash.slice(1).split('/');
  if ((r === 'materias' || r === 'notas') && p && D.subjects.some(s => s.id === p)) return p;
  return '';
}

export function openAdd(preset = {}) {
  let kind = null;          // elegido a mano; si no, el que se entiende del texto
  let touched = { s: false, d: !!preset.date };
  const ctx = contextSubject();
  const { el, close } = sheet(`
    <div class="kinds" role="group" aria-label="Tipo">${KINDS.map(([k, l]) => `<button data-k="${k}" aria-pressed="${k === 'task'}">${l}</button>`).join('')}</div>
    <input class="inp" name="q" placeholder="Ej.: examen de mates el viernes 13" autocomplete="off" enterkeyhint="done" aria-label="¿Qué quieres apuntar?">
    <div class="understood" aria-live="polite"></div>
    <div class="row2">
      <label class="field"><span>Asignatura</span><select class="inp" name="s">${subjectOptions(ctx)}</select></label>
      <label class="field" data-datef><span>Día</span><input class="inp" type="date" name="d" value="${preset.date || ''}"></label>
      <label class="field" data-secf hidden><span>Sección</span><select class="inp" name="n"></select></label>
    </div>
    <button class="btn pri wide" data-ok>Guardar</button>
  `, { label: 'Añadir' });
  const f = n => el.querySelector(`[name=${n}]`);
  setTimeout(() => f('q').focus(), 300);

  const curKind = p => kind || p.kind || 'task';
  const fillSections = () => {
    const sid = f('s').value;
    const secs = sid && sid !== '__new' ? sectionsOf(sid) : [];
    const def = sid && secs.length ? defaultSection(sid).id : '';
    f('n').innerHTML = secs.length ? secs.map(s => `<option value="${s.id}" ${s.id === def ? 'selected' : ''}>${esc(s.name)}</option>`).join('') : '<option value="">General (nueva)</option>';
  };
  const update = () => {
    const p = parseQuick(f('q').value, D.subjects);
    if (!touched.s && p.subjectId) f('s').value = p.subjectId;
    if (!touched.s && !p.subjectId) f('s').value = ctx;
    if (!touched.d) f('d').value = p.date || '';
    const k = curKind(p);
    el.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
    el.querySelector('[data-datef]').hidden = k === 'note';
    el.querySelector('[data-secf]').hidden = k !== 'note';
    if (k === 'note') fillSections();
    const chips = [];
    if (f('q').value.trim()) chips.push(`<span><i>${KINDS.find(x => x[0] === k)[1]}</i></span>`);
    if (f('s').value && f('s').value !== '__new') chips.push(`<span><span class="dot" style="background:${color(f('s').value)}"></span>${esc(subjName(f('s').value))}</span>`);
    if (f('d').value && k !== 'note') chips.push(`<span><i>Día</i> ${esc(fmtShort(f('d').value))}</span>`);
    if (p.time && k !== 'note') chips.push(`<span><i>Hora</i> ${p.time}</span>`);
    el.querySelector('.understood').innerHTML = chips.join('');
    return p;
  };
  f('q').oninput = update;
  f('q').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); saveIt(); } };
  f('s').onchange = async () => { touched.s = true; await handleNewSubject(f('s'), addSubject); update(); };
  f('d').onchange = () => { touched.d = true; update(); };
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kind = b.dataset.k; update(); });
  el.querySelector('[data-ok]').onclick = () => saveIt();
  update();

  function saveIt() {
    const text = f('q').value.trim();
    if (!text) { f('q').focus(); return; }
    const p = update(), k = curKind(p);
    const sid = f('s').value === '__new' ? '' : f('s').value;
    const date = f('d').value;
    if (k === 'task') {
      D.tasks.push({ id: uid(), title: p.title || text, subjectId: sid, due: date, done: false, doneAt: '' });
      save(); close(); refresh(); toast('Tarea apuntada');
    } else if (isDl(k)) {
      if (!date) { f('d').focus(); toast('Elige el día'); return; }
      // Une sola la sección que se llame como el tema, si existe.
      const sec = sid && p.title ? sectionsOf(sid).find(s => s.name.toLowerCase().includes(p.title.toLowerCase())) : null;
      const d = { id: uid(), kind: k, subjectId: sid, title: p.title, date, time: p.time, sectionId: sec?.id || '', reviewed: [], done: false, remind: D.prefs.remind.slice(), dismissed: [] };
      D.deadlines.push(d);
      save(); close(); refresh();
      toast(k === 'exam' ? 'Examen apuntado' : k === 'entrega' ? 'Entrega apuntada' : 'Presentación apuntada');
    } else {
      if (!sid) { f('s').focus(); toast('Elige la asignatura de la nota'); return; }
      const secId = f('n').value || defaultSection(sid).id;
      const n = addNote(secId, p.title || text);
      save(); close();
      location.hash = '#nota/' + n.id;
    }
  }
}

export function editTask(k, done) {
  const { el, close } = sheet(`
    <h2>Tarea</h2>
    <label class="field"><span>Qué hay que hacer</span><input class="inp" name="t" value="${esc(k.title)}"></label>
    <div class="row2">
      <label class="field"><span>Asignatura</span><select class="inp" name="s">${subjectOptions(k.subjectId)}</select></label>
      <label class="field"><span>Para el día</span><input class="inp" type="date" name="d" value="${k.due || ''}"></label>
    </div>
    <div class="acts"><button class="btn danger" data-del>${ic('i-trash')} Borrar</button><button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Tarea' });
  const f = n => el.querySelector(`[name=${n}]`);
  f('s').onchange = () => handleNewSubject(f('s'), addSubject);
  el.querySelector('[data-del]').onclick = () => {
    const i = D.tasks.indexOf(k); D.tasks.splice(i, 1); save(); close(); done();
    toast('Tarea borrada', () => { D.tasks.splice(i, 0, k); save(); done(); });
  };
  el.querySelector('[data-ok]').onclick = () => {
    const t = f('t').value.trim(); if (!t) { f('t').focus(); return; }
    Object.assign(k, { title: t, subjectId: f('s').value === '__new' ? '' : f('s').value, due: f('d').value });
    save(); close(); done();
  };
}
