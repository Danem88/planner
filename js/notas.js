// Pestaña «Notas»: buscador, recientes, asignaturas → secciones → notas, y la página de una nota.
import { D, save, subj, color, flowerOf, sectionsOf, section, notesOf, notesOfSubject, note, addSection, addNote, noteHas, examOfSection, subjectOfNote, subjName } from './store.js';
import { esc, norm, ago, today, daysBetween } from './util.js';
import { ic, menu, ask, askText, toast, backLink, refresh } from './ui.js';
import { mountEditor } from './editor.js';
import { blobDel } from './db.js';

const icons = n => { const h = noteHas(n); return (h.img ? ic('i-img') : '') + (h.mic ? ic('i-mic') : '') + (h.link ? ic('i-lnk') : ''); };
let query = '';

export function render(el, params) {
  if (params[0]) return renderSubjectNotes(el, params[0]);
  const recent = D.notes.slice().sort((a, b) => b.updated - a.updated).slice(0, 8);
  el.innerHTML = `
    <div class="topline"><h1 class="h1">Notas ${ic('fl2', 'i fl')}</h1></div>
    <label class="search">${ic('i-srch')}<input type="search" placeholder="Buscar en todas las notas" value="${esc(query)}" aria-label="Buscar en todas las notas" enterkeyhint="search"></label>
    <div data-results></div>
    <div data-home>
      ${recent.length ? `<div class="sec">Recientes</div><div class="recent">${recent.map(n => {
        const sid = subjectOfNote(n);
        return `<a class="rc card" href="#nota/${n.id}"><span class="dot" style="background:${color(sid)}"></span><b>${esc(n.title || 'Sin título')}</b>
          ${esc(subjName(sid))} · ${esc(section(n.sectionId)?.name || '')}<span class="ico">${icons(n)}</span></a>`;
      }).join('')}</div>` : ''}
      <div class="sec">Por asignatura</div>
      ${D.subjects.length ? `<div class="card list">${D.subjects.map(s => {
        const secs = sectionsOf(s.id).length, cnt = notesOfSubject(s.id).length;
        return `<a class="item" href="#notas/${s.id}"><span class="sq" style="background:${color(s.id)}">${ic(flowerOf(s.id))}</span>
          <div class="grow">${esc(s.name)}<small>${secs} ${secs === 1 ? 'sección' : 'secciones'}</small></div><span class="end">${cnt}</span></a>`;
      }).join('')}</div>` : `<div class="card empty">Primero añade tus asignaturas.<br><a class="btn pri" href="#materias">Ir a Materias</a></div>`}
    </div>`;
  const inp = el.querySelector('input'), res = el.querySelector('[data-results]'), home = el.querySelector('[data-home]');
  const search = () => {
    query = inp.value;
    const q = norm(query.trim());
    home.hidden = !!q;
    if (!q) { res.innerHTML = ''; return; }
    const hits = D.notes.map(n => {
      const tt = norm(n.title), tx = norm(n.text || '');
      const score = (tt.includes(q) ? 2 : 0) + (tx.includes(q) ? 1 : 0);
      return { n, score, i: tx.indexOf(q) };
    }).filter(h => h.score).sort((a, b) => b.score - a.score || b.n.updated - a.n.updated).slice(0, 40);
    const snip = (n, i) => {
      if (i < 0) return '';
      const s = Math.max(0, i - 30), txt = (n.text || '').slice(s, i + q.length + 60);
      const k = i - s;
      return `${s ? '…' : ''}${esc(txt.slice(0, k))}<mark>${esc(txt.slice(k, k + q.length))}</mark>${esc(txt.slice(k + q.length))}…`;
    };
    res.innerHTML = `<div class="sec">${hits.length ? `${hits.length} ${hits.length === 1 ? 'nota' : 'notas'}` : 'Nada encontrado'}</div>
      ${hits.length ? `<div class="card list">${hits.map(h => `<a class="item hit" href="#nota/${h.n.id}"><span class="dot" style="background:${color(subjectOfNote(h.n))}"></span>
        <div class="grow"><b>${esc(h.n.title || 'Sin título')}</b><small>${snip(h.n, h.i) || esc(subjName(subjectOfNote(h.n)) + ' · ' + (section(h.n.sectionId)?.name || ''))}</small></div></a>`).join('')}</div>` : ''}`;
  };
  inp.oninput = search;
  search();
}

function renderSubjectNotes(el, sid) {
  const s = subj(sid);
  if (!s) { location.replace('#notas'); return; }
  const secs = sectionsOf(sid).length, cnt = notesOfSubject(sid).length;
  el.innerHTML = `
    <div class="topline">${backLink('#notas', 'Notas')}</div>
    <div class="hero" style="background:${color(sid)}">${ic(flowerOf(sid), 'f')}<div class="grow"><b>${esc(s.name)}</b>
      <small>${secs} ${secs === 1 ? 'sección' : 'secciones'} · ${cnt} ${cnt === 1 ? 'nota' : 'notas'}</small></div></div>
    <div data-secs></div>`;
  renderSections(el.querySelector('[data-secs]'), sid);
}

// Lista de secciones de una asignatura (también en Materias › Notas).
export function renderSections(el, sid) {
  const secs = sectionsOf(sid);
  const t = today();
  el.innerHTML = `
    ${!secs.length ? `<div class="empty">${ic('fl2', 'fl')}Organiza tus notas en secciones, por ejemplo<br>«Tema 1», «Prácticas» o «Para el examen».</div>` : ''}
    ${secs.map(sec => {
      const ns = notesOf(sec.id), ex = examOfSection(sec.id);
      const n = ex ? daysBetween(t, ex.date) : null;
      return `<div class="card section ${sec.open ? 'open' : ''}" data-sec="${sec.id}">
        <div class="hd"><button class="tog" aria-expanded="${!!sec.open}">${ic('i-chev')}<span class="name">${esc(sec.name)}</span>
          ${ex ? `<span class="chip">${ex.kind === 'exam' ? 'examen' : 'entrega'} · ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : n + ' días'}</span>` : ''}<span class="cnt">${ns.length}</span></button>
          <button class="iconbtn" data-menu aria-label="Opciones de ${esc(sec.name)}">${ic('i-more')}</button></div>
        <div class="body">
          ${ns.map(nt => `<a class="item nt" href="#nota/${nt.id}">${nt.pinned ? ic('i-pin', 'i pin') : ''}<div class="grow"><span class="t">${esc(nt.title || 'Sin título')}</span><small>${esc(ago(nt.updated))}</small></div>
            <span class="end">${icons(nt)}</span></a>`).join('')}
          <button class="item addnote" data-addnote>${ic('i-plus')} Nueva nota</button>
        </div></div>`;
    }).join('')}
    <button class="dashed" data-addsec>+ Nueva sección</button>`;

  el.querySelectorAll('[data-sec]').forEach(card => {
    const sec = section(card.dataset.sec);
    card.querySelector('.tog').onclick = () => { sec.open = !sec.open; save(); renderSections(el, sid); };
    card.querySelector('[data-addnote]').onclick = () => { const n = addNote(sec.id); location.hash = '#nota/' + n.id; };
    card.querySelector('[data-menu]').onclick = () => {
      const list = sectionsOf(sid), i = list.indexOf(sec);
      const swap = j => { const o = list[j].order; list[j].order = sec.order; sec.order = o; save(); renderSections(el, sid); };
      menu(sec.name, [
        { label: 'Nueva nota', icon: 'i-plus', run: () => { const n = addNote(sec.id); location.hash = '#nota/' + n.id; } },
        { label: 'Cambiar el nombre', icon: 'i-edit', run: async () => { const v = await askText('Nombre de la sección', { value: sec.name }); if (v) { sec.name = v; save(); renderSections(el, sid); } } },
        ...(i > 0 ? [{ label: 'Subir', icon: 'i-up', run: () => swap(i - 1) }] : []),
        ...(i < list.length - 1 ? [{ label: 'Bajar', icon: 'i-down', run: () => swap(i + 1) }] : []),
        { label: 'Eliminar la sección', icon: 'i-trash', danger: true, run: async () => {
          const ns = notesOf(sec.id);
          if (!await ask(`¿Eliminar «${sec.name}»?`, { ok: 'Eliminar', danger: true, detail: ns.length ? `Se borrarán sus ${ns.length} notas, con sus fotos y audios. No se puede deshacer.` : '' })) return;
          for (const n of ns) await deleteNoteData(n);
          D.sections = D.sections.filter(x => x !== sec);
          D.deadlines.forEach(d => { if (d.sectionId === sec.id) d.sectionId = ''; });
          save(); renderSections(el, sid); toast('Sección eliminada');
        } },
      ]);
    };
  });
  el.querySelector('[data-addsec]').onclick = async () => {
    const v = await askText('Nueva sección', { placeholder: 'Tema 4 · La célula', ok: 'Crear' });
    if (v) { addSection(sid, v); renderSections(el, sid); }
  };
}

async function deleteNoteData(n) {
  const ids = [...(n.html || '').matchAll(/data-blob="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids) await blobDel(id).catch(() => {});
  D.notes = D.notes.filter(x => x !== n);
}

// ---- página de una nota ----
export function renderNote(el, params) {
  const n = note(params[0]);
  if (!n) { location.replace('#notas'); return; }
  const sec = section(n.sectionId), sid = sec?.subjectId;
  el.innerHTML = `
    <div class="note-top">${backLink('#notas/' + sid, sec?.name || 'Notas')}
      <button class="iconbtn" data-share aria-label="Compartir">${ic('i-share')}</button>
      <button class="iconbtn" data-more aria-label="Opciones">${ic('i-more')}</button>
      <button class="done" data-done>Listo</button></div>
    <div class="crumb"><span class="dot" style="background:${color(sid)}"></span>${esc(subjName(sid))} · ${esc(sec?.name || '')}</div>
    <textarea class="ntitle" rows="1" placeholder="Título" aria-label="Título de la nota" enterkeyhint="next">${esc(n.title)}</textarea>`;
  const title = el.querySelector('.ntitle');
  const fit = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
  requestAnimationFrame(fit);
  const ed = mountEditor(el, n, () => { n.updated = Date.now(); save(); });
  title.oninput = () => { n.title = title.value.replace(/\n/g, ' '); n.updated = Date.now(); save(); fit(); };
  title.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); ed.focusStart(); } };
  title.onfocus = () => document.body.classList.add('editing');
  title.onblur = () => setTimeout(() => { if (!ed.hasFocus()) document.body.classList.remove('editing'); }, 50);
  el.querySelector('[data-done]').onclick = () => { document.activeElement?.blur(); document.body.classList.remove('editing'); };
  if (!n.title && !n.html) setTimeout(() => title.focus(), 200);

  el.querySelector('[data-share]').onclick = async () => {
    ed.flush();
    const text = `${n.title || 'Nota'}\n\n${n.text || ''}`.trim();
    try { if (navigator.share) await navigator.share({ title: n.title || 'Nota', text }); else { await navigator.clipboard.writeText(text); toast('Copiada'); } } catch (e) {}
  };
  el.querySelector('[data-more]').onclick = () => menu(null, [
    { label: n.pinned ? 'Quitar de arriba' : 'Fijar arriba', icon: 'i-pin', run: () => { n.pinned = !n.pinned; save(); toast(n.pinned ? 'Fijada arriba' : 'Ya no está fijada'); } },
    { label: 'Mover a otra sección', icon: 'i-move', run: () => moveNote(n) },
    { label: 'Eliminar la nota', icon: 'i-trash', danger: true, run: async () => {
      if (!await ask('¿Eliminar esta nota?', { ok: 'Eliminar', danger: true, detail: 'Se borran también sus fotos y audios. No se puede deshacer.' })) return;
      ed.destroy(true);
      await deleteNoteData(n); save();
      location.hash = '#notas/' + sid; toast('Nota eliminada');
    } },
  ]);
  return () => ed.destroy();
}

function moveNote(n) {
  const items = [];
  for (const s of D.subjects) for (const sec of sectionsOf(s.id)) {
    if (sec.id === n.sectionId) continue;
    items.push({ label: `${s.name} · ${sec.name}`, icon: 'i-not', run: () => { n.sectionId = sec.id; save(); refresh(); toast(`Movida a ${sec.name}`); } });
  }
  if (!items.length) { toast('No hay otras secciones'); return; }
  menu('Mover a…', items);
}
