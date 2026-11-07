// Pestaña «Notas»: buscador, asignaturas → secciones → notas y archivos, y la página de una nota.
import { D, save, subj, color, flowerOf, sectionsOf, section, notesOf, filesOf, notesOfSubject, filesOfSubject, note, addSection, addNote, noteHas, examOfSection, subjectOfNote, subjName, KINDS, isEmptyNote, blobsOfNote } from './store.js';
import { esc, norm, ago, today, daysBetween, uid } from './util.js';
import { ic, menu, ask, askText, toast, backLink, refresh, replaceHash, goBack } from './ui.js';
import { blobDel } from './db.js';
import { pickFiles, storeFile, openFile, badge } from './files.js';

const icons = n => { const h = noteHas(n); return (h.img ? ic('i-img') : '') + (h.mic ? ic('i-mic') : '') + (h.link ? ic('i-lnk') : '') + (h.file ? ic('i-clip') : ''); };
let query = '';

export function render(el, params) {
  if (params[0]) return renderSubjectNotes(el, params[0]);
  el.innerHTML = `
    <div class="topline"><h1 class="h1">Notas ${ic('fl2', 'i fl')}</h1></div>
    <label class="search">${ic('i-srch')}<input type="search" placeholder="Buscar en notas y archivos" value="${esc(query)}" aria-label="Buscar en notas y archivos" enterkeyhint="search"></label>
    <div data-results></div>
    <div data-home>
      <div class="sec">Asignaturas</div>
      ${D.subjects.length ? `<div class="card list">${D.subjects.map(s => {
        const secs = sectionsOf(s.id).length, cnt = notesOfSubject(s.id).length + filesOfSubject(s.id).length;
        return `<a class="item" href="#notas/${s.id}"><span class="sq" style="background:${color(s.id)}">${ic(flowerOf(s.id))}</span>
          <div class="grow">${esc(s.name)}<small>${secs} ${secs === 1 ? 'sección' : 'secciones'}</small></div><span class="end">${cnt}</span>${ic('i-chev', 'i chev')}</a>`;
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
    const files = D.files.filter(f => norm(f.name).includes(q)).slice(0, 20);
    const snip = (n, i) => {
      if (i < 0) return '';
      const s = Math.max(0, i - 30), txt = (n.text || '').slice(s, i + q.length + 60);
      const k = i - s;
      return `${s ? '…' : ''}${esc(txt.slice(0, k))}<mark>${esc(txt.slice(k, k + q.length))}</mark>${esc(txt.slice(k + q.length))}…`;
    };
    const total = hits.length + files.length;
    res.innerHTML = `<div class="sec">${total ? `${total} ${total === 1 ? 'resultado' : 'resultados'}` : 'Nada encontrado'}</div>
      ${total ? `<div class="card list">${hits.map(h => `<a class="item hit" href="#nota/${h.n.id}"><span class="dot" style="background:${color(subjectOfNote(h.n))}"></span>
        <div class="grow"><b>${esc(h.n.title || 'Sin título')}</b><small>${snip(h.n, h.i) || esc(subjName(subjectOfNote(h.n)) + ' · ' + (section(h.n.sectionId)?.name || ''))}</small></div></a>`).join('')}
        ${files.map(f => `<button class="item hit" data-file="${f.id}">${badge(f.name, f.type)}<div class="grow"><b>${esc(f.name)}</b><small>${esc(subjName(section(f.sectionId)?.subjectId) + ' · ' + (section(f.sectionId)?.name || ''))}</small></div></button>`).join('')}</div>` : ''}`;
    res.querySelectorAll('[data-file]').forEach(b => b.onclick = () => fileSheet(D.files.find(f => f.id === b.dataset.file), search));
  };
  inp.oninput = search;
  search();
}

function renderSubjectNotes(el, sid) {
  const s = subj(sid);
  if (!s) { replaceHash('#notas'); return; }
  const secs = sectionsOf(sid).length, cnt = notesOfSubject(sid).length + filesOfSubject(sid).length;
  el.innerHTML = `
    <div class="topline">${backLink('#notas', 'Notas')}</div>
    <div class="hero" style="background:${color(sid)}">${ic(flowerOf(sid), 'f')}<div class="grow"><b>${esc(s.name)}</b>
      <small>${secs} ${secs === 1 ? 'sección' : 'secciones'} · ${cnt} ${cnt === 1 ? 'apunte' : 'apuntes'}</small></div></div>
    <div data-secs></div>`;
  renderSections(el.querySelector('[data-secs]'), sid);
}

// Lista de secciones de una asignatura (también en Materias › Apuntes).
export function renderSections(el, sid) {
  const secs = sectionsOf(sid);
  const t = today();
  const draw = () => renderSections(el, sid);
  el.innerHTML = `
    ${!secs.length ? `<div class="empty">${ic('fl2', 'fl')}Organiza tus apuntes en secciones, por ejemplo<br>«Tema 1», «Prácticas» o «Para el examen».</div>` : ''}
    ${secs.map(sec => {
      const ns = notesOf(sec.id), fs = filesOf(sec.id), ex = examOfSection(sec.id);
      const n = ex ? daysBetween(t, ex.date) : null;
      return `<div class="card section ${sec.open ? 'open' : ''}" data-sec="${sec.id}">
        <div class="hd"><button class="tog" aria-expanded="${!!sec.open}">${ic('i-chev')}<span class="name">${esc(sec.name)}</span>
          ${ex ? `<span class="chip">${KINDS[ex.kind].toLowerCase()} · ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : n + ' días'}</span>` : ''}<span class="cnt">${ns.length + fs.length}</span></button>
          <button class="iconbtn" data-menu aria-label="Opciones de ${esc(sec.name)}">${ic('i-more')}</button></div>
        <div class="body">
          ${ns.map(nt => `<a class="item nt" href="#nota/${nt.id}">${nt.pinned ? ic('i-pin', 'i pin') : ''}<div class="grow"><span class="t">${esc(nt.title || 'Sin título')}</span><small>${esc(ago(nt.updated))}</small></div>
            <span class="end">${icons(nt)}</span></a>`).join('')}
          ${fs.map(f => `<button class="item nt file" data-file="${f.id}">${badge(f.name, f.type)}<div class="grow"><span class="t">${esc(f.name)}</span><small>${esc(ago(f.created))}</small></div></button>`).join('')}
          <div class="addrow"><button class="item addnote" data-addnote>${ic('i-plus')} Nueva nota</button><button class="item addnote" data-upload>${ic('i-clip')} Subir archivo</button></div>
        </div></div>`;
    }).join('')}
    <button class="dashed" data-addsec>+ Nueva sección</button>`;

  el.querySelectorAll('[data-sec]').forEach(card => {
    const sec = section(card.dataset.sec);
    card.querySelector('.tog').onclick = () => { sec.open = !sec.open; save(); draw(); };
    card.querySelector('[data-addnote]').onclick = () => { const n = addNote(sec.id); location.hash = '#nota/' + n.id; };
    card.querySelector('[data-upload]').onclick = () => uploadTo(sec, draw);
    card.querySelectorAll('[data-file]').forEach(b => b.onclick = () => fileSheet(D.files.find(f => f.id === b.dataset.file), draw));
    card.querySelector('[data-menu]').onclick = () => {
      const list = sectionsOf(sid), i = list.indexOf(sec);
      const swap = j => { const o = list[j].order; list[j].order = sec.order; sec.order = o; save(); draw(); };
      menu(sec.name, [
        { label: 'Nueva nota', icon: 'i-plus', run: () => { const n = addNote(sec.id); location.hash = '#nota/' + n.id; } },
        { label: 'Subir archivo', icon: 'i-clip', run: () => uploadTo(sec, draw) },
        { label: 'Cambiar el nombre', icon: 'i-edit', run: async () => { const v = await askText('Nombre de la sección', { value: sec.name }); if (v) { sec.name = v; save(); draw(); } } },
        ...(i > 0 ? [{ label: 'Subir', icon: 'i-up', run: () => swap(i - 1) }] : []),
        ...(i < list.length - 1 ? [{ label: 'Bajar', icon: 'i-down', run: () => swap(i + 1) }] : []),
        { label: 'Eliminar la sección', icon: 'i-trash', danger: true, run: async () => {
          const ns = notesOf(sec.id), fs = filesOf(sec.id);
          const cnt = ns.length + fs.length;
          if (!await ask(`¿Eliminar «${sec.name}»?`, { ok: 'Eliminar', danger: true, detail: cnt === 1 ? 'Se borrará su apunte. No se puede deshacer.' : cnt ? `Se borrarán sus ${cnt} apuntes, con sus fotos, audios y archivos. No se puede deshacer.` : '' })) return;
          for (const n of ns) await deleteNoteData(n);
          for (const f of fs) { await blobDel(f.blob).catch(() => {}); D.files = D.files.filter(x => x !== f); }
          D.sections = D.sections.filter(x => x !== sec);
          D.deadlines.forEach(d => { if (d.sectionId === sec.id) d.sectionId = ''; });
          save(); draw(); toast('Sección eliminada');
        } },
      ]);
    };
  });
  el.querySelector('[data-addsec]').onclick = async () => {
    const v = await askText('Nueva sección', { placeholder: 'Tema 4 · La célula', ok: 'Crear' });
    if (v) { addSection(sid, v); draw(); }
  };
}

async function uploadTo(sec, done) {
  const files = await pickFiles();
  if (!files.length) return;
  let n = 0;
  for (const f of files) {
    const meta = await storeFile(f);
    if (meta) { D.files.push({ id: uid(), sectionId: sec.id, ...meta }); n++; }
  }
  if (!n) return;
  sec.open = true; save(); refresh();
  toast(n === 1 ? 'Archivo subido' : `${n} archivos subidos`);
}

export function fileSheet(f, done) {
  if (!f) return;
  openFile(f, [
    { label: 'Cambiar el nombre', icon: 'i-edit', run: async () => { const v = await askText('Nombre del archivo', { value: f.name }); if (v) { f.name = v; save(); done(); } } },
    { label: 'Mover a otra sección', icon: 'i-move', run: () => moveTo(f.sectionId, sec => { f.sectionId = sec.id; save(); done(); toast(`Movido a ${sec.name}`); }) },
    { label: 'Eliminar el archivo', icon: 'i-trash', danger: true, run: async () => {
      if (!await ask(`¿Eliminar «${f.name}»?`, { ok: 'Eliminar', danger: true, detail: 'Se borra de la app. No se puede deshacer.' })) return;
      D.files = D.files.filter(x => x !== f); await blobDel(f.blob).catch(() => {}); save(); done(); toast('Archivo eliminado');
    } },
  ]);
}

async function deleteNoteData(n) {
  for (const id of blobsOfNote(n)) await blobDel(id).catch(() => {});
  D.notes = D.notes.filter(x => x !== n);
}

// ---- página de una nota ----
export function renderNote(el, params) {
  const n = note(params[0]);
  if (!n) { replaceHash('#notas'); return; }
  const sec = section(n.sectionId), sid = sec?.subjectId;
  const fallback = sid ? '#notas/' + sid : '#notas';
  el.innerHTML = `
    <div class="note-top">${backLink(fallback, sec?.name || 'Notas')}
      <button class="iconbtn" data-share aria-label="Compartir">${ic('i-share')}</button>
      <button class="iconbtn" data-more aria-label="Opciones">${ic('i-more')}</button>
      <button class="done" data-done>Listo</button></div>
    <div class="crumb"><span class="dot" style="background:${color(sid)}"></span>${esc(subjName(sid))} · ${esc(sec?.name || '')}</div>
    <textarea class="ntitle" rows="1" placeholder="Título" aria-label="Título de la nota" enterkeyhint="next">${esc(n.title)}</textarea>`;
  const title = el.querySelector('.ntitle');
  const fit = () => { title.style.height = 'auto'; title.style.height = title.scrollHeight + 'px'; };
  requestAnimationFrame(fit);
  // El editor solo se descarga al abrir una nota (la app arranca más rápido).
  let ed = null, gone = false;
  import('./editor.js').then(({ mountEditor }) => {
    if (gone) return;
    ed = mountEditor(el, n, () => { n.updated = Date.now(); save(); });
  });
  title.oninput = () => { n.title = title.value.replace(/\n/g, ' '); n.updated = Date.now(); save(); fit(); };
  title.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); ed?.focusStart(); } };
  title.onfocus = () => document.body.classList.add('editing');
  title.onblur = () => setTimeout(() => { if (!ed?.hasFocus()) document.body.classList.remove('editing'); }, 50);
  el.querySelector('[data-done]').onclick = () => { document.activeElement?.blur(); document.body.classList.remove('editing'); };
  if (!n.title && !n.html) setTimeout(() => title.focus(), 200);

  let deleted = false;
  el.querySelector('[data-share]').onclick = async () => {
    ed?.flush();
    const text =`${n.title || 'Nota'}\n\n${n.text || ''}`.trim();
    try { if (navigator.share) await navigator.share({ title: n.title || 'Nota', text }); else { await navigator.clipboard.writeText(text); toast('Copiada'); } } catch (e) {}
  };
  el.querySelector('[data-more]').onclick = () => menu(null, [
    { label: n.pinned ? 'Quitar de arriba' : 'Fijar arriba', icon: 'i-pin', run: () => { n.pinned = !n.pinned; save(); toast(n.pinned ? 'Fijada arriba' : 'Ya no está fijada'); } },
    { label: 'Mover a otra sección', icon: 'i-move', run: () => moveTo(n.sectionId, s => { n.sectionId = s.id; save(); refresh(); toast(`Movida a ${s.name}`); }) },
    { label: 'Eliminar la nota', icon: 'i-trash', danger: true, run: async () => {
      if (!await ask('¿Eliminar esta nota?', { ok: 'Eliminar', danger: true, detail: 'Se borran también sus fotos, audios y archivos. No se puede deshacer.' })) return;
      deleted = true;
      ed?.destroy(true);
      await deleteNoteData(n); save();
      goBack(fallback); toast('Nota eliminada');
    } },
  ]);
  return () => {
    gone = true;
    if (deleted) return;
    ed?.destroy();
    // Una nota que se abrió y se dejó en blanco no se guarda.
    if (isEmptyNote(n) && D.notes.includes(n)) { D.notes = D.notes.filter(x => x !== n); save(); }
  };
}

function moveTo(currentSec, done) {
  const items = [];
  for (const s of D.subjects) for (const sec of sectionsOf(s.id)) {
    if (sec.id === currentSec) continue;
    items.push({ label: `${s.name} · ${sec.name}`, icon: 'i-not', run: () => done(sec) });
  }
  if (!items.length) { toast('No hay otras secciones'); return; }
  menu('Mover a…', items);
}
