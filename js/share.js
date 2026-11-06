// Compartir exámenes, entregas, presentaciones y el horario con la clase.
// Todo va dentro del propio enlace (comprimido): no hay servidor ni cuentas.
// Quien lo abre elige qué añadir; lo que ya tiene se marca y no se repite.
import { D, save, subj, subjName, addSubject, upcoming, dlTitle, KINDS, catColor } from './store.js';
import { esc, norm, uid, fmtShort, DIAS, minToHm } from './util.js';
import { ic, sheet, toast, backLink, replaceHash, askText, catDot } from './ui.js';
import { isInstalled } from './install.js';

const K2C = { exam: 'e', entrega: 'n', presentacion: 'p' }, C2K = { e: 'exam', n: 'entrega', p: 'presentacion' };
const b64u = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; };
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export async function encode(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) { try { return '1' + b64u(await pipe(raw, new CompressionStream('deflate-raw'))); } catch (e) {} }
  return '0' + b64u(raw);
}
export async function decode(code) {
  const body = unb64u(code.slice(1));
  const bytes = code[0] === '1' ? await pipe(body, new DecompressionStream('deflate-raw')) : body;
  const j = JSON.parse(new TextDecoder().decode(bytes));
  if (j.v !== 1) throw new Error('version');
  return j;
}
export const linkFor = code => `${location.origin}${location.pathname}#importar/${code}`;
// Saca el código de un enlace pegado (o del código suelto).
export const codeFrom = text => { const m = /#importar\/([01][A-Za-z0-9_-]+)/.exec(text) || /^\s*([01][A-Za-z0-9_-]{8,})\s*$/.exec(text); return m ? m[1] : ''; };

// ---- enviar ----
export function openShare({ classes = false, subjectId = '' } = {}) {
  const dls = upcoming().filter(d => !subjectId || d.subjectId === subjectId);
  if (!dls.length && !D.classes.length) { toast('Aún no tienes fechas ni horario que compartir'); return; }
  const { el, close } = sheet(`
    <h2>Compartir con tu clase</h2>
    <p class="small" style="margin:-.4rem 0 .8rem;line-height:1.45">Elige qué compartir. Se crea un enlace: mándalo por WhatsApp o donde quieras y cada uno elige qué añadir a su Planner.</p>
    ${D.classes.length ? `<div class="card list"><button class="item" data-cls><span class="grow"><span class="t">Mi horario</span><small>${D.classes.length} ${D.classes.length === 1 ? 'clase' : 'clases'} a la semana</small></span><span class="cb" role="checkbox" aria-checked="${classes}">${ic('i-ok')}</span></button></div>` : ''}
    ${dls.length ? `<div class="sec">Fechas <button data-all>Ninguna</button></div><div class="card list">${dls.map(d => `
      <button class="item" data-d="${d.id}">${catDot(d.kind)}<span class="grow"><span class="t">${esc(dlTitle(d))}</span><small>${KINDS[d.kind]} · ${esc(fmtShort(d.date))}</small></span><span class="cb" role="checkbox" aria-checked="true">${ic('i-ok')}</span></button>`).join('')}</div>` : ''}
    <div class="acts"><button class="btn" data-copy>Copiar enlace</button><button class="btn pri" data-send>${ic('i-share')} Compartir</button></div>`, { label: 'Compartir con tu clase' });
  const toggle = b => { const cb = b.querySelector('.cb'); cb.setAttribute('aria-checked', cb.getAttribute('aria-checked') !== 'true'); };
  el.querySelectorAll('[data-d], [data-cls]').forEach(b => b.onclick = () => toggle(b));
  el.querySelector('[data-all]')?.addEventListener('click', e => {
    const on = e.target.textContent === 'Todas';
    el.querySelectorAll('[data-d] .cb').forEach(c => c.setAttribute('aria-checked', on));
    e.target.textContent = on ? 'Ninguna' : 'Todas';
  });
  const build = async () => {
    const ids = [...el.querySelectorAll('[data-d]')].filter(b => b.querySelector('.cb').getAttribute('aria-checked') === 'true').map(b => b.dataset.d);
    const withCls = el.querySelector('[data-cls] .cb')?.getAttribute('aria-checked') === 'true';
    if (!ids.length && !withCls) { toast('Elige al menos una cosa'); return null; }
    const names = [];
    const si = id => { if (!id) return -1; const n = subjName(id); let i = names.indexOf(n); if (i < 0) { names.push(n); i = names.length - 1; } return i; };
    const d = ids.map(id => D.deadlines.find(x => x.id === id)).map(x => [K2C[x.kind], si(x.subjectId), x.title || '', x.date, x.time || '']);
    const c = withCls ? D.classes.map(x => [si(x.subjectId), x.day, x.start, x.end, x.room || '']) : [];
    return linkFor(await encode({ v: 1, from: D.name || '', s: names, d, c }));
  };
  el.querySelector('[data-copy]').onclick = async () => {
    const url = await build(); if (!url) return;
    try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); close(); } catch (e) { await askText('Copia este enlace', { value: url, ok: 'Hecho' }); }
  };
  el.querySelector('[data-send]').onclick = async () => {
    const url = await build(); if (!url) return;
    const text = `${D.name ? D.name + ' te ha' : 'Te han'} compartido fechas de clase en Planner:`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Planner', text, url }); close(); }
      else { await navigator.clipboard.writeText(url); toast('Enlace copiado: pégalo donde quieras'); close(); }
    } catch (e) { if (e.name !== 'AbortError') toast('No se pudo compartir'); }
  };
}

// Pegar un enlace que te han mandado (útil en la app instalada del iPhone).
export async function pasteShared() {
  let text = '';
  try { text = await navigator.clipboard.readText(); } catch (e) {}
  if (!codeFrom(text)) text = await askText('Pega el enlace que te han mandado', { placeholder: 'https://…#importar/…', ok: 'Abrir' }) || '';
  const code = codeFrom(text);
  if (!code) { if (text) toast('Ese enlace no es de Planner'); return; }
  location.hash = '#importar/' + code;
}

// ---- recibir ----
const findSubject = name => D.subjects.find(s => norm(s.name) === norm(name));
export async function renderImport(el, params) {
  let j;
  try { j = await decode(params[0] || ''); } catch (e) {
    el.innerHTML = `<div class="topline">${backLink('#hoy', 'Hoy')}</div><div class="empty">${ic('fl2', 'fl')}Este enlace no se puede abrir.<br>Puede que esté cortado: pide que te lo vuelvan a mandar.</div>`;
    return;
  }
  const name = i => j.s[i] ?? '';
  const items = (j.d || []).map(([k, i, title, date, time]) => {
    const s = findSubject(name(i));
    const dup = !!s && D.deadlines.some(x => x.subjectId === s.id && x.kind === C2K[k] && x.date === date);
    return { kind: C2K[k], subject: name(i), title, date, time, dup };
  }).filter(x => x.kind);
  const cls = (j.c || []).map(([i, day, start, end, room]) => {
    const s = findSubject(name(i));
    const dup = !!s && D.classes.some(x => x.subjectId === s.id && x.day === day && x.start === start);
    return { subject: name(i), day, start, end, room, dup };
  });
  const newCls = cls.filter(c => !c.dup);
  const iosBrowser = /iPhone|iPad|iPod/.test(navigator.userAgent) && !isInstalled();
  const label = x => x.title ? `${x.subject ? x.subject + ' · ' : ''}${x.title}` : `${KINDS[x.kind]}${x.subject ? ' de ' + x.subject : ''}`;
  el.innerHTML = `
    <div class="topline">${backLink('#hoy', 'Hoy')}</div>
    <h1 class="h1">Te han compartido ${ic('fl', 'i fl')}</h1>
    <p class="small" style="margin-top:.4rem;line-height:1.45">${j.from ? `<b>${esc(j.from)}</b> te ha mandado` : 'Te han mandado'} fechas de clase. Elige qué quieres añadir a tu Planner.</p>
    ${iosBrowser ? `<div class="card install">${ic('i-home')}<div class="grow"><b>¿Tienes Planner instalada?</b><br>En el iPhone este enlace se abre en el navegador, que guarda los datos aparte. Copia el enlace y, dentro de la app, ve a <b>Ajustes › Pegar un enlace recibido</b>.
      <div class="ibtns"><button class="btn pri" data-copylink>Copiar enlace</button></div></div></div>` : ''}
    ${items.length ? `<div class="sec">Fechas</div><div class="card list">${items.map((x, n) => `
      <button class="item" data-i="${n}">${catDot(x.kind)}<span class="grow"><span class="t">${esc(label(x))}</span><small>${KINDS[x.kind]} · ${esc(fmtShort(x.date))}${x.time ? ' · ' + esc(x.time) : ''}${x.dup ? ' · ya lo tienes' : ''}</small></span>
        <span class="cb" role="checkbox" aria-checked="${!x.dup}">${ic('i-ok')}</span></button>`).join('')}</div>` : ''}
    ${cls.length ? `<div class="sec">Horario</div><div class="card list"><button class="item" data-cls>
      <span class="grow"><span class="t">Horario · ${cls.length} ${cls.length === 1 ? 'clase' : 'clases'}</span><small>${newCls.length ? `${[...new Set(cls.map(c => DIAS[c.day % 7]))].join(', ')}${newCls.length < cls.length ? ` · ${cls.length - newCls.length} ya las tienes` : ''}` : 'Ya lo tienes'}</small></span>
      <span class="cb" role="checkbox" aria-checked="${newCls.length > 0 && !D.classes.length}">${ic('i-ok')}</span></button></div>
      ${D.classes.length && newCls.length ? '<p class="small" style="margin:.4rem .2rem 0">Ya tienes horario: márcalo solo si quieres sumar estas clases al tuyo.</p>' : ''}` : ''}
    <button class="btn pri wide" data-add style="margin-top:1.2rem">Añadir a mi Planner</button>`;
  el.querySelectorAll('[data-i], [data-cls]').forEach(b => b.onclick = () => { const cb = b.querySelector('.cb'); cb.setAttribute('aria-checked', cb.getAttribute('aria-checked') !== 'true'); });
  el.querySelector('[data-copylink]')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); toast('Enlace copiado'); } catch (e) { toast('No se pudo copiar'); } });
  el.querySelector('[data-add]').onclick = () => {
    const sid = n => (n ? (findSubject(n) || addSubject(n)).id : '');
    let nd = 0, nc = 0;
    el.querySelectorAll('[data-i]').forEach(b => {
      if (b.querySelector('.cb').getAttribute('aria-checked') !== 'true') return;
      const x = items[+b.dataset.i];
      D.deadlines.push({ id: uid(), kind: x.kind, subjectId: sid(x.subject), title: x.title, date: x.date, time: x.time, sectionId: '', reviewed: [], done: false, remind: D.prefs.remind.slice(), dismissed: [] });
      nd++;
    });
    if (el.querySelector('[data-cls] .cb')?.getAttribute('aria-checked') === 'true') {
      for (const c of newCls) { D.classes.push({ id: uid(), subjectId: sid(c.subject), day: c.day, start: c.start, end: c.end, room: c.room }); nc++; }
    }
    if (!nd && !nc) { toast('No has elegido nada'); return; }
    save();
    replaceHash('#fechas');
    toast([nd && `${nd} ${nd === 1 ? 'fecha añadida' : 'fechas añadidas'}`, nc && `${nc} ${nc === 1 ? 'clase' : 'clases'}`].filter(Boolean).join(' · '));
  };
}
