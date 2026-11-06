// Datos de Planner y ayudas para leerlos.
import { kvGet, kvSet } from './db.js';
import { today, daysBetween, uid } from './util.js';

// Colores de la paleta (variables --s1 … --s24 en app.css).
export const PALETTE = 24;
export const KINDS = { exam: 'Examen', entrega: 'Entrega', presentacion: 'Presentación' };
export const KINDS_PL = { exam: 'Exámenes', entrega: 'Entregas', presentacion: 'Presentaciones' };
export const CATS = [['exam', 'Exámenes'], ['entrega', 'Entregas'], ['presentacion', 'Presentaciones'], ['task', 'Tareas']];
export const HOME_BLOCKS = [['calendario', 'Calendario'], ['ahora', 'Clases de ahora'], ['fechas', 'Próximas fechas'], ['tareas', 'Tareas']];
export const TABS = ['hoy', 'horario', 'fechas', 'notas', 'materias'];

const defaultPrefs = () => ({
  accent: 'rosa',
  deco: 'flores',       // flores · formas · nada
  catColors: { exam: 19, entrega: 23, presentacion: 24, task: 20 },
  homeOrder: HOME_BLOCKS.map(b => b[0]),
  homeHidden: [],
  tabOrder: TABS.slice(),
  remind: [1],          // recordatorio por defecto: 1 día antes
});

const empty = () => ({
  v: 2, name: '', onboarded: false, installHidden: false,
  since: Date.now(), lastBackup: 0, backupSnooze: 0,   // para recordar hacer copia
  prefs: defaultPrefs(),
  subjects: [],   // { id, name, color 1–24, teacher }  (el orden del array es el orden de la app)
  classes: [],    // { id, subjectId, day 1–7, start, end (minutos), room }
  tasks: [],      // { id, title, subjectId, due 'AAAA-MM-DD' | '', done, doneAt }
  deadlines: [],  // { id, kind 'exam'|'entrega'|'presentacion', subjectId, title, date, time, sectionId, reviewed [noteId], done, remind [días antes], dismissed [días] }
  grades: [],     // { id, subjectId, type 'exam'|'work', title, value, date, deadlineId }
  sections: [],   // { id, subjectId, name, order, open }
  notes: [],      // { id, sectionId, title, html, text, pinned, created, updated }
  files: [],      // { id, sectionId, name, type, size, blob, created }
});

export let D = empty();

function migrate(d) {
  const p = Object.assign(defaultPrefs(), d.prefs || {});
  p.catColors = Object.assign(defaultPrefs().catColors, p.catColors || {});
  // Bloques o pestañas nuevos que no estuvieran guardados.
  for (const [k] of HOME_BLOCKS) if (!p.homeOrder.includes(k)) p.homeOrder.push(k);
  p.homeOrder = p.homeOrder.filter(k => HOME_BLOCKS.some(b => b[0] === k));
  for (const k of TABS) if (!p.tabOrder.includes(k)) p.tabOrder.push(k);
  p.tabOrder = p.tabOrder.filter(k => TABS.includes(k));
  d.prefs = p;
  d.grades.forEach(g => { if (!g.type) g.type = 'exam'; });
  d.deadlines.forEach(x => { if (!x.remind) x.remind = []; if (!x.dismissed) x.dismissed = []; });
  d.v = 2;
  return d;
}

// Nada se guarda hasta haber leído lo guardado: si la app se oculta mientras arranca
// (cambiar de app muy rápido), no debe escribir un estado vacío encima de los datos.
let loaded = false;
export async function load() {
  const saved = await kvGet('state');   // si falla, lanza el error y no se marca como leído
  D = migrate(Object.assign(empty(), saved || {}));
  loaded = true;
}

let timer;
export function save() {
  if (!loaded) return;
  clearTimeout(timer);
  timer = setTimeout(() => kvSet('state', D), 60);
}
export function saveNow() { if (!loaded) return Promise.resolve(); clearTimeout(timer); return kvSet('state', D); }
export function replaceAll(data) { D = migrate(Object.assign(empty(), data)); loaded = true; return saveNow(); }
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
addEventListener('pagehide', () => saveNow());

// ---- colores ----
// Un color es un número (1–24, la paleta de app.css) o un «#rrggbb» elegido libremente.
// Los libres también se oscurecen de noche, igual que la paleta.
export const pal = c => typeof c === 'string' && c[0] === '#' ? `color-mix(in srgb, ${c} var(--cmix), var(--cmixbg))` : `var(--s${c || 1})`;
export const catColor = kind => pal(D.prefs.catColors[kind]);

// ---- asignaturas ----
export const subj = id => D.subjects.find(s => s.id === id);
export const subjName = id => subj(id)?.name || 'Sin asignatura';
export const color = id => pal(subj(id)?.color);
export const flowerOf = id => (D.subjects.findIndex(s => s.id === id) % 2) ? 'fl2' : 'fl';
export function nextColor() {
  const used = D.subjects.map(s => s.color);
  for (let c = 1; c <= PALETTE; c++) if (!used.includes(c)) return c;
  return (D.subjects.length % PALETTE) + 1;
}
export function addSubject(name, extra = {}) {
  const s = { id: uid(), name: name.trim(), color: nextColor(), teacher: '', ...extra };
  D.subjects.push(s);
  save();
  return s;
}

// ---- secciones, notas y archivos ----
export const sectionsOf = sid => D.sections.filter(s => s.subjectId === sid).sort((a, b) => a.order - b.order);
export const section = id => D.sections.find(s => s.id === id);
export const note = id => D.notes.find(n => n.id === id);
export const notesOf = secId => D.notes.filter(n => n.sectionId === secId)
  .sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
export const filesOf = secId => D.files.filter(f => f.sectionId === secId).sort((a, b) => b.created - a.created);
export const notesOfSubject = sid => { const ids = new Set(sectionsOf(sid).map(s => s.id)); return D.notes.filter(n => ids.has(n.sectionId)); };
export const filesOfSubject = sid => { const ids = new Set(sectionsOf(sid).map(s => s.id)); return D.files.filter(f => ids.has(f.sectionId)); };
export const subjectOfNote = n => section(n.sectionId)?.subjectId;
export function addSection(subjectId, name) {
  const order = Math.max(0, ...sectionsOf(subjectId).map(s => s.order + 1));
  const s = { id: uid(), subjectId, name: name.trim() || 'Sección', order, open: true };
  D.sections.push(s);
  save();
  return s;
}
export function addNote(sectionId, title = '', html = '') {
  const now = Date.now();
  const n = { id: uid(), sectionId, title, html, text: '', pinned: false, created: now, updated: now };
  D.notes.push(n);
  save();
  return n;
}
// La sección más reciente de una asignatura (o una «General» nueva).
export function defaultSection(subjectId) {
  const secs = sectionsOf(subjectId);
  if (!secs.length) return addSection(subjectId, 'General');
  const last = id => Math.max(0, ...notesOf(id).map(n => n.updated), ...filesOf(id).map(f => f.created));
  return secs.slice().sort((a, b) => last(b.id) - last(a.id) || b.order - a.order)[0];
}
export const noteHas = n => ({
  img: /<figure/.test(n.html || ''),
  mic: /class="vnote/.test(n.html || ''),
  link: /class="lcard/.test(n.html || ''),
  file: /class="fcard/.test(n.html || ''),
});
export const isEmptyNote = n => !n.title.trim() && !(n.html || '').replace(/<br>|<p><\/p>|<p><br><\/p>|\s/g, '');
// Ids de fotos, audios y archivos guardados dentro de una nota.
export const blobsOfNote = n => [...(n.html || '').matchAll(/data-blob="([^"]+)"/g)].map(m => m[1]);

// ---- fechas (exámenes, entregas y presentaciones) ----
export const deadline = id => D.deadlines.find(d => d.id === id);
export function dlTitle(d) {
  const s = subjName(d.subjectId);
  if (d.title) return d.subjectId ? `${s} · ${d.title}` : d.title;
  return `${KINDS[d.kind] || 'Fecha'} de ${s}`;
}
export const doneLabel = d => d.kind === 'entrega' ? 'Entregada' : d.kind === 'presentacion' ? 'Hecha' : 'Hecho';
export const isPast = d => d.done || daysBetween(today(), d.date) < 0;
export const upcoming = (kind) => D.deadlines
  .filter(d => !isPast(d) && (!kind || d.kind === kind))
  .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
export function reviewProgress(d) {
  if (!d.sectionId) return null;
  const ns = notesOf(d.sectionId);
  if (!ns.length) return { done: 0, total: 0 };
  const done = ns.filter(n => (d.reviewed || []).includes(n.id)).length;
  return { done, total: ns.length };
}
export const examOfSection = secId => upcoming().find(d => d.sectionId === secId);
// Recordatorios que tocan hoy (uno por fecha: el más cercano sin descartar).
export function dueReminders() {
  const t = today(), out = [];
  for (const d of upcoming()) {
    const left = daysBetween(t, d.date);
    const hit = (d.remind || []).filter(r => left <= r && !(d.dismissed || []).includes(r));
    if (hit.length) out.push({ d, left });
  }
  return out;
}
export function dismissReminder(d) {
  const left = daysBetween(today(), d.date);
  d.dismissed = [...new Set([...(d.dismissed || []), ...(d.remind || []).filter(r => left <= r)])];
  save();
}

// ---- copia de seguridad ----
// Se propone si hay cosas apuntadas y hace más de un mes de la última copia
// (o dos semanas de uso sin ninguna), salvo si se ha dicho «Ahora no» hace poco.
export function backupDue() {
  const now = Date.now(), day = 864e5;
  const things = D.notes.length + D.files.length + D.deadlines.length + D.tasks.length;
  if (things < 3 || now < (D.backupSnooze || 0)) return false;
  return D.lastBackup ? now - D.lastBackup > 30 * day : now - (D.since || now) > 14 * day;
}

// ---- calificaciones ----
export const GRADE_TYPES = { exam: 'Exámenes', work: 'Trabajos y entregas' };
export const gradesOf = (sid, type) => D.grades.filter(g => g.subjectId === sid && (!type || g.type === type)).sort((a, b) => a.date.localeCompare(b.date));
export function average(list) {
  if (!list.length) return null;
  return list.reduce((a, g) => a + g.value, 0) / list.length;
}
export const gradeOfDeadline = id => D.grades.find(g => g.deadlineId === id);
// Peso de los exámenes en la media final (el resto, trabajos). 70 % si no se ha cambiado.
export const examWeight = sid => subj(sid)?.examWeight ?? 70;
export function finalAverage(sid) {
  const ae = average(gradesOf(sid, 'exam')), aw = average(gradesOf(sid, 'work'));
  if (ae == null) return aw;
  if (aw == null) return ae;
  const w = examWeight(sid) / 100;
  return ae * w + aw * (1 - w);
}

// ---- clases ----
export const classesOn = day => D.classes.filter(c => c.day === day).sort((a, b) => a.start - b.start);
