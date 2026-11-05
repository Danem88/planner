// Pantalla «Horario»: las clases de cada día de la semana.
import { D, save, subjName, color, classesOn, addSubject } from './store.js';
import { esc, today, dow, mondayOf, addDays, parseYmd, nowMin, minToHm, hmToMin, DIAS, DIAS_CORTOS, uid } from './util.js';
import { ic, sheet, ask, toast, subjectOptions, handleNewSubject } from './ui.js';

let selDay = null;
const PX = 64; // alto de una hora (px)

export function render(el) {
  const t = today(), td = dow(t);
  if (!selDay) selDay = td > 5 && !D.classes.some(c => c.day === td) ? 1 : td;
  const mon = mondayOf(t);
  const days = [1, 2, 3, 4, 5];
  if (D.classes.some(c => c.day === 6) || selDay === 6) days.push(6);
  if (D.classes.some(c => c.day === 7) || selDay === 7) days.push(7);

  const list = classesOn(selDay);
  let body;
  if (!D.classes.length) {
    body = `<div class="card empty">${ic('fl2', 'fl')}Todavía no hay clases.<br>Añade cada clase una vez y se repetirá todas las semanas.
      <br><button class="btn pri" data-add>+ Añadir una clase</button></div>`;
  } else if (!list.length) {
    body = `<div class="empty">${ic('fl2', 'fl')}No hay clases el ${DIAS[selDay % 7]}.<br><button class="btn" data-add>+ Añadir una clase</button></div>`;
  } else {
    const h0 = Math.floor(Math.min(...list.map(c => c.start)) / 60);
    const h1 = Math.ceil(Math.max(...list.map(c => c.end)) / 60);
    const y = m => ((m - h0 * 60) / 60) * PX;
    let html = '';
    for (let h = h0; h <= h1; h++) html += `<div class="hr" style="top:${(h - h0) * PX}px"><span>${h}:00</span></div>`;
    const now = nowMin(), isToday = selDay === td;
    list.forEach((c, i) => {
      const past = isToday && c.end <= now;
      html += `<button class="blk ${past ? 'past' : ''}" data-id="${c.id}" style="top:${y(c.start) + 2}px;height:${Math.max(30, y(c.end) - y(c.start) - 4)}px;background:${color(c.subjectId)}"
        aria-label="${esc(subjName(c.subjectId))}, de ${minToHm(c.start)} a ${minToHm(c.end)}${c.room ? ', ' + esc(c.room) : ''}">
        <div><b>${esc(subjName(c.subjectId))}</b>${c.room ? `<small>${esc(c.room)}</small>` : ''}</div><small>${minToHm(c.start)}</small></button>`;
      const nx = list[i + 1];
      if (nx && nx.start - c.end >= 15) {
        const mid = (c.end + nx.start) / 2;
        html += `<div class="gap" style="top:${y(mid) - 8}px">${nx.start - c.end <= 45 ? 'recreo' : 'hueco'} ${ic('fl2')}</div>`;
      }
    });
    if (isToday && now >= h0 * 60 && now <= h1 * 60) html += `<div class="nowline" style="top:${y(now)}px"></div>`;
    body = `<div class="sched" style="height:${(h1 - h0) * PX + 10}px">${html}</div>`;
  }

  el.innerHTML = `
    <div class="topline"><h1 class="h1">Horario</h1>
      ${D.classes.length ? `<button class="btn ghost" data-add style="padding:0 .2rem">+ Clase</button>` : ''}</div>
    <div class="week" role="group" aria-label="Día de la semana">${days.map(d => {
      const date = addDays(mon, d - 1);
      return `<button data-day="${d}" aria-pressed="${d === selDay}" class="${D.classes.some(c => c.day === d) ? 'has' : ''}" aria-label="${DIAS[d % 7]} ${parseYmd(date).getDate()}">
        ${DIAS_CORTOS[d]}<b>${parseYmd(date).getDate()}</b></button>`;
    }).join('')}</div>
    ${body}`;

  el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { selDay = +b.dataset.day; render(el); });
  el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => editClass(null, () => render(el)));
  el.querySelectorAll('.blk').forEach(b => b.onclick = () => editClass(D.classes.find(c => c.id === b.dataset.id), () => render(el)));
}

export function editClass(c, done) {
  const isNew = !c;
  const last = D.classes.filter(x => x.day === selDay).sort((a, b) => b.end - a.end)[0];
  const start = c ? c.start : last ? last.end : 8 * 60;
  const end = c ? c.end : start + 55;
  const dayOpts = [1, 2, 3, 4, 5, 6, 7].map(d => `<option value="${d}" ${(c ? c.day : selDay) === d ? 'selected' : ''}>${DIAS[d % 7]}</option>`).join('');
  const { el, close } = sheet(`
    <h2>${isNew ? 'Nueva clase' : 'Clase'}</h2>
    <label class="field"><span>Asignatura</span><select class="inp" name="s">${subjectOptions(c?.subjectId || D.subjects[0]?.id, { none: D.subjects.length ? null : 'Elige…' })}</select></label>
    <label class="field"><span>Día</span><select class="inp" name="d">${dayOpts}</select></label>
    <div class="row2">
      <label class="field"><span>Empieza</span><input class="inp" type="time" name="a" value="${minToHm(start).padStart(5, '0')}"></label>
      <label class="field"><span>Termina</span><input class="inp" type="time" name="b" value="${minToHm(end).padStart(5, '0')}"></label>
    </div>
    <label class="field"><span>Aula (opcional)</span><input class="inp" name="r" value="${esc(c?.room || '')}" placeholder="Aula 12"></label>
    ${isNew ? `<p class="small" style="margin-bottom:.4rem">Se repite todas las semanas. Si la tienes otros días, añádela también:</p>
      <div class="kinds" data-more>${[1, 2, 3, 4, 5].map(d => `<button type="button" data-d="${d}" aria-pressed="false">${DIAS[d]}</button>`).join('')}</div>` : ''}
    <div class="acts">${isNew ? '<button class="btn" data-cancel>Cancelar</button>' : '<button class="btn danger" data-del>Quitar</button>'}<button class="btn pri" data-ok>Guardar</button></div>
  `, { label: 'Clase' });
  const f = n => el.querySelector(`[name=${n}]`);
  f('s').onchange = () => handleNewSubject(f('s'), addSubject);
  const syncMore = () => el.querySelectorAll('[data-more] button').forEach(b => { if (+b.dataset.d === +f('d').value) b.setAttribute('aria-pressed', 'false'); b.disabled = +b.dataset.d === +f('d').value; });
  if (isNew) { f('d').onchange = syncMore; syncMore(); }
  el.querySelectorAll('[data-more] button').forEach(b => b.onclick = () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'));
  el.querySelector('[data-cancel]')?.addEventListener('click', () => close());
  el.querySelector('[data-del]')?.addEventListener('click', async () => {
    close();
    const i = D.classes.indexOf(c);
    D.classes.splice(i, 1); save(); done();
    toast('Clase quitada', () => { D.classes.splice(i, 0, c); save(); done(); });
  });
  el.querySelector('[data-ok]').onclick = () => {
    const sid = f('s').value;
    if (!sid || sid === '__new') { f('s').focus(); return; }
    const a = hmToMin(f('a').value), b = hmToMin(f('b').value);
    if (!(b > a)) { f('b').focus(); toast('La hora de final debe ser después del inicio'); return; }
    const data = { subjectId: sid, day: +f('d').value, start: a, end: b, room: f('r').value.trim() };
    if (isNew) {
      D.classes.push({ id: uid(), ...data });
      el.querySelectorAll('[data-more] button[aria-pressed=true]').forEach(x => D.classes.push({ id: uid(), ...data, day: +x.dataset.d }));
      selDay = data.day;
    } else Object.assign(c, data);
    save(); close(); done();
  };
}
