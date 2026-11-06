// Utilidades pequeñas: fechas, textos y números a la española.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad = n => String(n).padStart(2, '0');
export const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
// Sin acentos y en minúsculas (misma longitud que el texto original si está en NFC).
export const norm = s => String(s ?? '').normalize('NFC').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIAS_CORTOS = ['', 'L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => ymd(new Date());
export const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
export const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
// 1 = lunes … 7 = domingo
export const dow = s => { const g = parseYmd(s).getDay(); return g === 0 ? 7 : g; };
export const mondayOf = s => addDays(s, 1 - dow(s));

export function fmtLong(s) {
  const d = parseYmd(s);
  return `${cap(DIAS[d.getDay()])}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}
export function fmtShort(s) {
  const d = parseYmd(s), now = new Date();
  const base = `${DIAS[d.getDay()]} ${d.getDate()}`;
  if (d.getMonth() === now.getMonth() && Math.abs(daysBetween(today(), s)) < 25) return base;
  return `${base} de ${MESES[d.getMonth()]}` + (d.getFullYear() !== now.getFullYear() ? ` de ${d.getFullYear()}` : '');
}
export function relDay(s) {
  const n = daysBetween(today(), s);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  if (n > 1 && n < 7) return 'el ' + DIAS[parseYmd(s).getDay()];
  return 'el ' + fmtShort(s);
}
export function countdown(s) {
  const n = daysBetween(today(), s);
  if (n === 0) return { n: 'Hoy', u: '' };
  if (n === 1) return { n: '1', u: 'día' };
  if (n < 0) return { n: String(-n), u: -n === 1 ? 'día' : 'días' };
  return { n: String(n), u: 'días' };
}

export const minToHm = m => `${Math.floor(m / 60)}:${pad(m % 60)}`;
export const hmToMin = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + (m || 0); };
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
export const num = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
export const fmtDur = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
export const fmtSize = b => b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${num(b / 1048576, b < 10 * 1048576 ? 1 : 0)} MB`;

export function ago(ts) {
  const d = new Date(ts), s = ymd(d), n = daysBetween(s, today());
  if (n === 0) return `hoy · ${d.getHours()}:${pad(d.getMinutes())}`;
  if (n === 1) return 'ayer';
  if (n < 7) return DIAS[d.getDay()];
  if (n < 28) return `hace ${Math.round(n / 7)} ${Math.round(n / 7) === 1 ? 'semana' : 'semanas'}`;
  return fmtShort(s);
}

export function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

export function debounce(fn, ms) {
  let t;
  const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  f.flush = (...a) => { clearTimeout(t); fn(...a); };
  return f;
}
