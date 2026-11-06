// Calificaciones: dos medias separadas, la de exámenes y la de trabajos y entregas.
import { D, save, subj, gradesOf, average, GRADE_TYPES, finalAverage, examWeight } from './store.js';
import { esc, today, relDay, num, uid } from './util.js';
import { ic, sheet, toast } from './ui.js';

const fmtGrade = v => String(v).replace('.', ',');

function block(sid, type, rerender) {
  const list = gradesOf(sid, type);
  const a = average(list);
  const prev = list.length > 1 ? average(list.slice(0, -1)) : null;
  const delta = a != null && prev != null ? a - prev : null;
  const last8 = list.slice(-8);
  return `<section class="gblock" data-type="${type}">
    <div class="sec">${GRADE_TYPES[type]}</div>
    <div class="card gcard">
      ${list.length ? `
        <div class="media"><strong class="${a < 5 ? 'low' : ''}">${num(a)}</strong><p>Media${list.length > 1 ? ` de ${list.length} notas` : ''}<br>
          ${delta != null && Math.abs(delta) >= 0.05 ? `<span style="color:${delta > 0 ? 'var(--rosaT)' : 'var(--accent)'}">${delta > 0 ? '↑' : '↓'} ${num(Math.abs(delta))} con la última</span>` : ''}</p>
          <div class="spark" aria-hidden="true">${last8.map((g, i) => `<i class="${i === last8.length - 1 ? 'last' : ''}" style="height:${Math.max(6, g.value * 10)}%"></i>`).join('')}</div></div>
        <div class="list">${list.slice().reverse().map(g => `<button class="item grade" data-g="${g.id}"><div class="grow"><span class="t">${esc(g.title || 'Calificación')}</span><small>${esc(relDay(g.date).replace(/^el /, ''))}</small></div>
          <strong class="${g.value < 5 ? 'low' : ''}">${fmtGrade(g.value)}</strong></button>`).join('')}</div>`
      : `<p class="gempty">Aún no hay notas de ${type === 'exam' ? 'exámenes' : 'trabajos ni entregas'}.</p>`}
      <button class="item addg" data-add>${ic('i-plus')} Añadir nota de ${type === 'exam' ? 'examen' : 'trabajo o entrega'}</button>
    </div></section>`;
}

export function renderGrades(el, sid) {
  const all = gradesOf(sid);
  const ae = average(gradesOf(sid, 'exam')), aw = average(gradesOf(sid, 'work'));
  const draw = () => renderGrades(el, sid);
  const fin = finalAverage(sid), w = examWeight(sid);
  el.innerHTML = `
    ${all.length ? `<button class="card final" data-weight>
      <div class="grow"><small>Media final</small><strong class="${fin < 5 ? 'low' : ''}">${num(fin)}</strong></div>
      <span class="wt">Exámenes ${w} %<br>Trabajos ${100 - w} %<em>Cambiar</em></span></button>
    <div class="avgs">
      <div class="card"><small>Exámenes</small><strong class="${ae != null && ae < 5 ? 'low' : ''}">${ae != null ? num(ae) : '—'}</strong></div>
      <div class="card"><small>Trabajos</small><strong class="${aw != null && aw < 5 ? 'low' : ''}">${aw != null ? num(aw) : '—'}</strong></div>
    </div>` : `<div class="empty">${ic('fl2', 'fl')}Apunta la nota de cada examen y de cada trabajo:<br>verás las dos medias por separado.</div>`}
    ${block(sid, 'exam')}${block(sid, 'work')}`;
  el.querySelector('[data-weight]')?.addEventListener('click', () => editWeight(sid, draw));
  el.querySelectorAll('.gblock').forEach(b => {
    const type = b.dataset.type;
    b.querySelector('[data-add]').onclick = () => editGrade(null, { subjectId: sid, type }, draw);
    b.querySelectorAll('[data-g]').forEach(x => x.onclick = () => editGrade(D.grades.find(g => g.id === x.dataset.g), {}, draw));
  });
}

// Cuánto cuentan los exámenes y los trabajos en la media final de una asignatura.
function editWeight(sid, done) {
  const s = subj(sid);
  let w = examWeight(sid);
  const { el, close } = sheet(`<h2>¿Cuánto cuenta cada parte?</h2>
    <p class="small" style="margin:-.4rem 0 .8rem;line-height:1.45">Pon lo que diga tu profesor. Si solo hay notas de una parte, la media final es esa.</p>
    <div class="wpick">${[100, 90, 80, 70, 60, 50, 40, 30].map(v => `<button data-w="${v}" aria-pressed="${v === w}"><b>${v} %</b> exámenes<small>${100 - v} % trabajos</small></button>`).join('')}</div>
    <div class="acts"><button class="btn" data-cancel>Cancelar</button><button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Porcentajes' });
  el.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { w = +b.dataset.w; el.querySelectorAll('[data-w]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  el.querySelector('[data-cancel]').onclick = () => close();
  el.querySelector('[data-ok]').onclick = () => { s.examWeight = w; save(); close(); done(); };
}

// preset: { subjectId, type, title, date, deadlineId }
export function editGrade(g, preset, done) {
  const v = g || { subjectId: preset.subjectId, type: preset.type || 'exam', title: preset.title || '', date: preset.date || today(), deadlineId: preset.deadlineId || '' };
  let type = v.type;
  const { el, close } = sheet(`
    <h2>${g ? 'Calificación' : 'Nueva calificación'}</h2>
    <div class="seg" role="group" aria-label="Tipo" style="margin-bottom:.9rem">
      ${Object.entries(GRADE_TYPES).map(([k, l]) => `<button data-t="${k}" aria-pressed="${k === type}">${k === 'exam' ? 'Examen' : 'Trabajo o entrega'}</button>`).join('')}</div>
    <label class="field"><span>¿De qué?</span><input class="inp" name="t" value="${esc(v.title)}" placeholder="${type === 'exam' ? 'Examen tema 3' : 'Trabajo de la célula'}"></label>
    <div class="row2">
      <label class="field"><span>Nota (0 a 10)</span><input class="inp" name="v" inputmode="decimal" value="${g ? fmtGrade(g.value) : ''}" placeholder="7,5"></label>
      <label class="field"><span>Día</span><input class="inp" type="date" name="d" value="${v.date}"></label>
    </div>
    <div class="acts">${g ? '<button class="btn danger" data-del>Quitar</button>' : '<button class="btn" data-cancel>Cancelar</button>'}<button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Calificación' });
  const f = n => el.querySelector(`[name=${n}]`);
  setTimeout(() => (g || v.title ? f('v') : f('t')).focus(), 320);
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { type = b.dataset.t; el.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  el.querySelector('[data-cancel]')?.addEventListener('click', () => close());
  el.querySelector('[data-del]')?.addEventListener('click', () => {
    const i = D.grades.indexOf(g); D.grades.splice(i, 1); save(); close(); done();
    toast('Calificación quitada', () => { D.grades.splice(i, 0, g); save(); done(); });
  });
  el.querySelector('[data-ok]').onclick = () => {
    const val = parseFloat(f('v').value.replace(',', '.'));
    if (!(val >= 0 && val <= 10)) { f('v').focus(); toast('Escribe una nota de 0 a 10'); return; }
    const data = { subjectId: v.subjectId, type, title: f('t').value.trim(), value: Math.round(val * 100) / 100, date: f('d').value || today(), deadlineId: v.deadlineId || '' };
    if (g) Object.assign(g, data); else D.grades.push({ id: uid(), ...data });
    save(); close(); done();
  };
}
