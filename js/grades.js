// Calificaciones por evaluación: dos medias (exámenes y trabajos), la media final con su
// porcentaje, la del curso y «¿Qué nota necesito?».
import { D, save, subj, gradesOf, average, GRADE_TYPES, finalAverage, examWeight, TERMS, termOf, neededGrade } from './store.js';
import { esc, today, relDay, num, uid } from './util.js';
import { ic, sheet, toast } from './ui.js';

const fmtGrade = v => String(v).replace('.', ',');
const SHORT = { 1: '1.ª', 2: '2.ª', 3: '3.ª' };
let selTerm = null;   // evaluación elegida (0 = curso); se recuerda mientras la app está abierta

function block(sid, type, term) {
  const list = gradesOf(sid, type, term);
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
        <div class="list">${list.slice().reverse().map(g => `<button class="item grade" data-g="${g.id}"><div class="grow"><span class="t">${esc(g.title || 'Calificación')}</span><small>${esc(relDay(g.date).replace(/^el /, ''))}${!term ? ` · ${SHORT[g.term]} ev.` : ''}</small></div>
          <strong class="${g.value < 5 ? 'low' : ''}">${fmtGrade(g.value)}</strong></button>`).join('')}</div>`
      : `<p class="gempty">Aún no hay notas de ${type === 'exam' ? 'exámenes' : 'trabajos ni entregas'}${term ? ' en esta evaluación' : ''}.</p>`}
      <button class="item addg" data-add>${ic('i-plus')} Añadir nota de ${type === 'exam' ? 'examen' : 'trabajo o entrega'}</button>
    </div></section>`;
}

// «¿Qué nota necesito?» para la evaluación elegida.
function needCard(sid, term) {
  const s = subj(sid), target = s.target ?? 5;
  const line = type => {
    const x = neededGrade(sid, term, type, target);
    if (x == null) return '';
    const what = type === 'exam' ? 'el próximo examen' : 'el próximo trabajo';
    const r = Math.ceil(x * 10 - 1e-9) / 10;
    const txt = r <= 0 ? 'ya lo tienes, aunque saques un 0' : r > 10 ? 'no llega con una sola nota' : `necesitas un <b>${num(r)}</b>`;
    return `<li><span>En ${what}</span><span class="${r > 10 ? 'low' : ''}">${txt}</span></li>`;
  };
  return `<div class="card need">
    <div class="needhd"><b>¿Qué nota necesito?</b>
      <div class="stepper" role="group" aria-label="Media que quieres sacar">
        <button data-tg="-0.5" aria-label="Bajar la media que quieres">−</button><span>para un <b>${num(target)}</b></span><button data-tg="0.5" aria-label="Subir la media que quieres">+</button></div></div>
    <ul>${line('exam')}${line('work')}</ul></div>`;
}

export function renderGrades(el, sid) {
  if (selTerm == null) selTerm = termOf(today());
  const term = selTerm;
  const draw = () => renderGrades(el, sid);
  const all = gradesOf(sid, null, term);
  const w = examWeight(sid);
  const fin = finalAverage(sid, term);
  const ae = average(gradesOf(sid, 'exam', term)), aw = average(gradesOf(sid, 'work', term));
  const seg = `<div class="seg terms" role="group" aria-label="Evaluación">${[1, 2, 3].map(t => `<button data-term="${t}" aria-pressed="${t === term}">${SHORT[t]} ev.</button>`).join('')}<button data-term="0" aria-pressed="${!term}">Curso</button></div>`;
  let top;
  if (!term) {
    const fins = [1, 2, 3].map(t => finalAverage(sid, t));
    top = fins.some(x => x != null) ? `
      <div class="card final course"><div class="grow"><small>Media del curso</small><strong class="${fin < 5 ? 'low' : ''}">${num(fin)}</strong></div>
        <span class="wt">Media de las evaluaciones<br>con notas</span></div>
      <div class="avgs three">${[1, 2, 3].map((t, i) => `<button class="card" data-term="${t}"><small>${SHORT[t]} evaluación</small><strong class="${fins[i] != null && fins[i] < 5 ? 'low' : ''}">${fins[i] != null ? num(fins[i]) : '—'}</strong></button>`).join('')}</div>`
      : `<div class="empty">${ic('fl2', 'fl')}Aún no hay notas este curso.</div>`;
  } else {
    top = all.length ? `<button class="card final" data-weight>
        <div class="grow"><small>Media de la ${TERMS[term].toLowerCase()}</small><strong class="${fin < 5 ? 'low' : ''}">${num(fin)}</strong></div>
        <span class="wt">Exámenes ${w} %<br>Trabajos ${100 - w} %<em>Cambiar</em></span></button>
      <div class="avgs">
        <div class="card"><small>Exámenes</small><strong class="${ae != null && ae < 5 ? 'low' : ''}">${ae != null ? num(ae) : '—'}</strong></div>
        <div class="card"><small>Trabajos</small><strong class="${aw != null && aw < 5 ? 'low' : ''}">${aw != null ? num(aw) : '—'}</strong></div>
      </div>${needCard(sid, term)}`
      : `<div class="empty">${ic('fl2', 'fl')}Apunta la nota de cada examen y de cada trabajo:<br>verás las medias por separado y la final.</div>`;
  }
  el.innerHTML = `${seg}${top}${block(sid, 'exam', term)}${block(sid, 'work', term)}`;
  el.querySelectorAll('[data-term]').forEach(b => b.onclick = () => { selTerm = +b.dataset.term; draw(); });
  el.querySelector('[data-weight]')?.addEventListener('click', () => editWeight(sid, draw));
  el.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => {
    const s = subj(sid);
    s.target = Math.min(10, Math.max(1, (s.target ?? 5) + +b.dataset.tg)); save(); draw();
  });
  el.querySelectorAll('.gblock').forEach(b => {
    const type = b.dataset.type;
    b.querySelector('[data-add]').onclick = () => editGrade(null, { subjectId: sid, type, term: term || undefined }, draw);
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

// preset: { subjectId, type, title, date, deadlineId, term }
export function editGrade(g, preset, done) {
  const v = g || { subjectId: preset.subjectId, type: preset.type || 'exam', title: preset.title || '', date: preset.date || today(), deadlineId: preset.deadlineId || '', term: preset.term };
  // La evaluación sigue a la fecha hasta que se elige a mano (o si la nota ya existía).
  let type = v.type, term = v.term || termOf(v.date), termTouched = !!g;
  const { el, close } = sheet(`
    <h2>${g ? 'Calificación' : 'Nueva calificación'}</h2>
    <div class="seg" role="group" aria-label="Tipo" style="margin-bottom:.9rem">
      ${Object.keys(GRADE_TYPES).map(k => `<button data-t="${k}" aria-pressed="${k === type}">${k === 'exam' ? 'Examen' : 'Trabajo o entrega'}</button>`).join('')}</div>
    <label class="field"><span>¿De qué?</span><input class="inp" name="t" value="${esc(v.title)}" placeholder="${type === 'exam' ? 'Examen tema 3' : 'Trabajo de la célula'}"></label>
    <div class="row2">
      <label class="field"><span>Nota (0 a 10)</span><input class="inp" name="v" inputmode="decimal" value="${g ? fmtGrade(g.value) : ''}" placeholder="7,5"></label>
      <label class="field"><span>Día</span><input class="inp" type="date" name="d" value="${v.date}"></label>
    </div>
    <div class="field"><span>Evaluación</span><div class="seg" role="group" aria-label="Evaluación">${[1, 2, 3].map(t => `<button data-tm="${t}" aria-pressed="${t === term}">${SHORT[t]}</button>`).join('')}</div></div>
    <div class="acts">${g ? '<button class="btn danger" data-del>Quitar</button>' : '<button class="btn" data-cancel>Cancelar</button>'}<button class="btn pri" data-ok>Guardar</button></div>`, { label: 'Calificación' });
  const f = n => el.querySelector(`[name=${n}]`);
  setTimeout(() => (g || v.title ? f('v') : f('t')).focus(), 320);
  const markTerm = () => el.querySelectorAll('[data-tm]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.tm === term));
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { type = b.dataset.t; el.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  el.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { term = +b.dataset.tm; termTouched = true; markTerm(); });
  f('d').onchange = () => { if (!termTouched && f('d').value) { term = termOf(f('d').value); markTerm(); } };
  el.querySelector('[data-cancel]')?.addEventListener('click', () => close());
  el.querySelector('[data-del]')?.addEventListener('click', () => {
    const i = D.grades.indexOf(g); D.grades.splice(i, 1); save(); close(); done();
    toast('Calificación quitada', () => { D.grades.splice(i, 0, g); save(); done(); });
  });
  el.querySelector('[data-ok]').onclick = () => {
    const val = parseFloat(f('v').value.replace(',', '.'));
    if (!(val >= 0 && val <= 10)) { f('v').focus(); toast('Escribe una nota de 0 a 10'); return; }
    const data = { subjectId: v.subjectId, type, term, title: f('t').value.trim(), value: Math.round(val * 100) / 100, date: f('d').value || today(), deadlineId: v.deadlineId || '' };
    if (g) Object.assign(g, data); else D.grades.push({ id: uid(), ...data });
    save(); close(); done();
  };
}
