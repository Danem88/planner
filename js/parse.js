// Entiende frases como «examen de mates el viernes 13» o «resumen tema 4 para mañana».
import { norm, today, addDays, dow, ymd, pad, MESES } from './util.js';

const WEEK = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 7 };
const ALIAS = {
  mates: 'matematicas', mate: 'matematicas', mat: 'matematicas',
  bio: 'biologia', bioli: 'biologia', biolo: 'biologia',
  fyq: 'fisica y quimica', fisica: 'fisica', quimica: 'quimica', quimi: 'quimica',
  geo: 'geografia', geografia: 'geografia', histo: 'historia',
  filo: 'filosofia', tecno: 'tecnologia', ingles: 'ingles', english: 'ingles',
  frances: 'frances', plastica: 'plastica', dibujo: 'dibujo', musica: 'musica',
  lengua: 'lengua', literatura: 'literatura', lit: 'literatura', eco: 'economia',
  gimnasia: 'educacion fisica', edfi: 'educacion fisica', ef: 'educacion fisica', 'ed fisica': 'educacion fisica',
  latin: 'latin', griego: 'griego', religion: 'religion', valores: 'valores', info: 'informatica',
};

// Devuelve { kind, subjectId, date, time, title }
export function parseQuick(text, subjects) {
  const orig = text.normalize('NFC');
  const n = norm(orig);
  const cut = [];  // trozos reconocidos que se quitan del título
  const take = (re) => { const m = re.exec(n); if (m) cut.push([m.index, m.index + m[0].length]); return m; };
  const r = { kind: null, subjectId: '', date: '', time: '', title: '' };

  if (take(/\b(examen|control|prueba|recuperacion)\b( (de|del))?/)) r.kind = 'exam';
  else if (take(/\b(entregar|entrega|trabajo|proyecto|presentacion)\b( (de|del))?/)) r.kind = 'entrega';
  else if (/^\s*nota\b/.test(n)) { take(/^\s*nota\b( (de|sobre))?:?/); r.kind = 'note'; }

  // Asignatura: nombre entero, primera palabra del nombre o un apodo («mates»).
  let best = null;
  for (const s of subjects) {
    const sn = norm(s.name);
    const cands = [sn, sn.split(/\s+/)[0], ...sn.split(/\s+/).filter(w => w.length >= 5)];
    for (const [a, target] of Object.entries(ALIAS)) if (sn.startsWith(target) || target.startsWith(sn)) cands.push(a);
    for (const c of cands) {
      if (c.length < 2) continue;
      const m = new RegExp(`(^|[^a-z0-9])(${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=$|[^a-z0-9])`).exec(n);
      if (m && (!best || c.length > best.len)) best = { id: s.id, start: m.index + m[1].length, end: m.index + m[1].length + c.length, len: c.length };
    }
  }
  if (best) { r.subjectId = best.id; cut.push([best.start, best.end]); }

  // Fecha
  const t = today();
  let m;
  if ((m = take(/\b(para )?(el )?pasado manana\b/))) r.date = addDays(t, 2);
  else if ((m = take(/\b(para )?manana\b/))) r.date = addDays(t, 1);
  else if ((m = take(/\b(para )?hoy\b/))) r.date = t;
  else if ((m = take(/\ben (\d{1,2}) dias?\b/))) r.date = addDays(t, +m[1]);
  else if ((m = take(/\b(la )?(semana que viene|proxima semana)\b/))) r.date = addDays(t, 8 - dow(t));
  else if ((m = take(/\b(para )?(el )?(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/))) r.date = fixDate(+m[3], +m[4], m[5]);
  else if ((m = take(new RegExp(`\\b(para )?(el )?(?:(lunes|martes|miercoles|jueves|viernes|sabado|domingo) )?(\\d{1,2}) de (${MESES.map(norm).join('|')})\\b`)))) r.date = fixDate(+m[4], MESES.map(norm).indexOf(m[5]) + 1);
  else if ((m = take(/\b(para )?(el |este |el proximo )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)( (\d{1,2}))?\b/))) {
    r.date = m[5] ? byDayNumber(+m[5], WEEK[m[3]]) : nextWeekday(WEEK[m[3]], /proximo/.test(m[2] || ''));
  } else if ((m = take(/\b(para )?el (dia )?(\d{1,2})\b(?! ?(h|min|:))/))) r.date = byDayNumber(+m[3]);

  // Hora
  if ((m = take(/\ba las (\d{1,2})(?:[:.](\d{2}))?( ?h)?\b/)) || (m = take(/\b(\d{1,2})[:.](\d{2})\b/))) {
    const h = +m[1], mi = +(m[2] || 0);
    if (h < 24 && mi < 60) r.time = `${pad(h)}:${pad(mi)}`;
  }

  // Título: lo que queda sin los trozos entendidos.
  cut.sort((a, b) => a[0] - b[0]);
  let out = '', pos = 0;
  for (const [a, b] of cut) { if (a >= pos) { out += orig.slice(pos, a) + ' '; pos = b; } else pos = Math.max(pos, b); }
  out += orig.slice(pos);
  r.title = out.replace(/\s+/g, ' ').replace(/^(\s*(de|del|para|sobre|y|:|-|,)\s+)+/i, '').replace(/(\s+(de|del|el|la|para|y|,))+\s*$/i, '').trim();
  if (r.title) r.title = r.title[0].toUpperCase() + r.title.slice(1);
  return r;
}

function fixDate(d, mo, y) {
  const now = new Date();
  let year = y ? (+y < 100 ? 2000 + +y : +y) : now.getFullYear();
  let dt = new Date(year, mo - 1, d);
  if (!y && ymd(dt) < today()) dt = new Date(year + 1, mo - 1, d);
  return dt.getMonth() === mo - 1 ? ymd(dt) : '';
}
// Próximo día con ese número (este mes o el siguiente); si se da el día de la semana, que coincida.
function byDayNumber(d, wd) {
  const now = new Date();
  for (let k = 0; k < 14; k++) {
    const dt = new Date(now.getFullYear(), now.getMonth() + k, d);
    if (dt.getDate() !== d || ymd(dt) < today()) continue;
    if (!wd || dow(ymd(dt)) === wd) return ymd(dt);
  }
  return '';
}
function nextWeekday(wd, nextWeek) {
  const t = today();
  let diff = (wd - dow(t) + 7) % 7;
  if (diff === 0) diff = 7;
  if (nextWeek && diff < 7) diff += 0;
  return addDays(t, diff);
}
