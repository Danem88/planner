// Datos de Beastudio y ayudas para leerlos.
import { kvGet, kvSet } from './db.js';
import { today, daysBetween, uid } from './util.js';

const empty = () => ({
  v: 1, name: '', onboarded: false, installHidden: false,
  subjects: [],   // { id, name, color 1–6, teacher }
  classes: [],    // { id, subjectId, day 1–7, start, end (minutos), room }
  tasks: [],      // { id, title, subjectId, due 'AAAA-MM-DD' | '', done, doneAt }
  deadlines: [],  // { id, kind 'exam'|'entrega', subjectId, title, date, time, sectionId, reviewed [noteId], done }
  grades: [],     // { id, subjectId, title, value, date }
  sections: [],   // { id, subjectId, name, order, open }
  notes: [],      // { id, sectionId, title, html, text, pinned, created, updated }
});

export let D = empty();

export async function load() {
  const saved = await kvGet('state');
  D = Object.assign(empty(), saved || {});
}

let timer;
export function save() {
  clearTimeout(timer);
  timer = setTimeout(() => kvSet('state', D), 60);
}
export function saveNow() { clearTimeout(timer); return kvSet('state', D); }
export function replaceAll(data) { D = Object.assign(empty(), data); return saveNow(); }
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });
addEventListener('pagehide', () => saveNow());

// ---- asignaturas ----
export const subj = id => D.subjects.find(s => s.id === id);
export const subjName = id => subj(id)?.name || 'Sin asignatura';
export const color = id => `var(--s${subj(id)?.color || 1})`;
export const flowerOf = id => (D.subjects.findIndex(s => s.id === id) % 2) ? 'fl2' : 'fl';
export function nextColor() {
  const used = D.subjects.map(s => s.color);
  for (let c = 1; c <= 6; c++) if (!used.includes(c)) return c;
  return (D.subjects.length % 6) + 1;
}
export function addSubject(name, extra = {}) {
  const s = { id: uid(), name: name.trim(), color: nextColor(), teacher: '', ...extra };
  D.subjects.push(s);
  save();
  return s;
}

// ---- secciones y notas ----
export const sectionsOf = sid => D.sections.filter(s => s.subjectId === sid).sort((a, b) => a.order - b.order);
export const section = id => D.sections.find(s => s.id === id);
export const note = id => D.notes.find(n => n.id === id);
export const notesOf = secId => D.notes.filter(n => n.sectionId === secId)
  .sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
export const notesOfSubject = sid => { const ids = new Set(sectionsOf(sid).map(s => s.id)); return D.notes.filter(n => ids.has(n.sectionId)); };
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
  const last = id => Math.max(0, ...notesOf(id).map(n => n.updated));
  return secs.slice().sort((a, b) => last(b.id) - last(a.id) || b.order - a.order)[0];
}
export const noteHas = n => ({
  img: /<figure/.test(n.html || ''),
  mic: /class="vnote/.test(n.html || ''),
  link: /class="lcard/.test(n.html || ''),
});

// ---- fechas (exámenes y entregas) ----
export const deadline = id => D.deadlines.find(d => d.id === id);
export function dlTitle(d) {
  const s = subjName(d.subjectId);
  if (d.title) return d.subjectId ? `${s} · ${d.title}` : d.title;
  return d.kind === 'exam' ? `Examen de ${s}` : `Entrega de ${s}`;
}
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

// ---- calificaciones ----
export const gradesOf = sid => D.grades.filter(g => g.subjectId === sid).sort((a, b) => a.date.localeCompare(b.date));
export function average(sid, list = gradesOf(sid)) {
  if (!list.length) return null;
  return list.reduce((a, g) => a + g.value, 0) / list.length;
}

// ---- clases ----
export const classesOn = day => D.classes.filter(c => c.day === day).sort((a, b) => a.start - b.start);
