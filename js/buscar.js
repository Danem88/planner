// Buscar en todo: tareas, exámenes y entregas, notas, archivos y asignaturas.
import { D, color, subjName, section, subjectOfNote, dlTitle, KINDS, isPast } from './store.js';
import { esc, norm, relDay, fmtShort } from './util.js';
import { ic, backLink, catDot, colorDot } from './ui.js';
import { editTask } from './add.js';
import { fileSheet } from './notas.js';
import { badge } from './files.js';

let query = '';
const MAX = 6;

export function render(el) {
  el.innerHTML = `
    <div class="topline">${backLink('#hoy', 'Hoy')}</div>
    <label class="search big">${ic('i-srch')}<input type="search" placeholder="Busca tareas, exámenes, notas, archivos…" value="${esc(query)}" aria-label="Buscar en todo" enterkeyhint="search" autocomplete="off"></label>
    <div data-res></div>`;
  const inp = el.querySelector('input'), res = el.querySelector('[data-res]');
  const draw = () => {
    query = inp.value;
    const q = norm(query.trim());
    if (q.length < 2) { res.innerHTML = `<p class="small" style="text-align:center;margin-top:2rem">Escribe al menos dos letras.</p>`; return; }
    const has = s => norm(s).includes(q);
    const tasks = D.tasks.filter(k => has(k.title) || (k.subjectId && has(subjName(k.subjectId))))
      .sort((a, b) => a.done - b.done || (a.due || '9').localeCompare(b.due || '9'));
    const dls = D.deadlines.filter(d => has(dlTitle(d)) || has(KINDS[d.kind]))
      .sort((a, b) => isPast(a) - isPast(b) || a.date.localeCompare(b.date));
    const notes = D.notes.filter(n => has(n.title) || has(n.text || '')).sort((a, b) => has(b.title) - has(a.title) || b.updated - a.updated);
    const files = D.files.filter(f => has(f.name));
    const subs = D.subjects.filter(s => has(s.name));
    const snip = n => {
      const tx = n.text || '', i = norm(tx).indexOf(q);
      if (i < 0) return esc(`${subjName(subjectOfNote(n))} · ${section(n.sectionId)?.name || ''}`);
      const s = Math.max(0, i - 25);
      return `${s ? '…' : ''}${esc(tx.slice(s, i))}<mark>${esc(tx.slice(i, i + q.length))}</mark>${esc(tx.slice(i + q.length, i + q.length + 50))}…`;
    };
    const group = (title, items, row, key) => {
      if (!items.length) return '';
      const lim = shown[key] || MAX;
      return `<div class="sec">${title} <em>${items.length}</em></div>
      <div class="card list">${items.slice(0, lim).map(row).join('')}${items.length > lim ? `<button class="item more" data-more="${key}">Ver ${items.length - lim} más</button>` : ''}</div>`;
    };
    const html = [
      group('Asignaturas', subs, s => `<a class="item" href="#materias/${s.id}"><span class="sq" style="background:${color(s.id)}"></span><span class="grow">${esc(s.name)}</span>${ic('i-chev', 'i chev')}</a>`, 's'),
      group('Exámenes y entregas', dls, d => `<a class="item" href="#fechas/${d.id}">${catDot(d.kind)}<span class="grow"><span class="t">${esc(dlTitle(d))}</span><small>${KINDS[d.kind]} · ${esc(fmtShort(d.date))}${isPast(d) ? ' · pasada' : ''}</small></span></a>`, 'd'),
      group('Tareas', tasks, k => `<button class="item ${k.done ? 'done' : ''}" data-task="${k.id}"><span class="grow"><span class="t">${esc(k.title)}</span><small>${[k.done ? 'Hecha' : k.due ? relDay(k.due) : 'Sin fecha', k.subjectId && subjName(k.subjectId)].filter(Boolean).map(esc).join(' · ')}</small></span>${k.subjectId ? colorDot(k.subjectId) : ''}</button>`, 't'),
      group('Notas', notes, n => `<a class="item hit" href="#nota/${n.id}"><span class="dot" style="background:${color(subjectOfNote(n))}"></span><span class="grow"><b>${esc(n.title || 'Sin título')}</b><small>${snip(n)}</small></span></a>`, 'n'),
      group('Archivos', files, f => `<button class="item" data-file="${f.id}">${badge(f.name, f.type)}<span class="grow"><span class="t">${esc(f.name)}</span><small>${esc(subjName(section(f.sectionId)?.subjectId))}</small></span></button>`, 'f'),
    ].join('');
    res.innerHTML = html || `<div class="empty">${ic('fl2', 'fl')}No hay nada con «${esc(query.trim())}».</div>`;
    res.querySelectorAll('[data-task]').forEach(b => b.onclick = () => editTask(D.tasks.find(k => k.id === b.dataset.task), draw));
    res.querySelectorAll('[data-file]').forEach(b => b.onclick = () => fileSheet(D.files.find(f => f.id === b.dataset.file), draw));
    res.querySelectorAll('[data-more]').forEach(b => b.onclick = () => { shown[b.dataset.more] = Infinity; draw(); });
  };
  const shown = {};
  inp.oninput = () => { for (const k in shown) delete shown[k]; draw(); };
  draw();
  setTimeout(() => inp.focus(), 150);
}
