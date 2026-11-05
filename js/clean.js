// Limpia lo que se pega (de ChatGPT, webs, Notas…): conserva títulos, listas,
// negritas, tablas y enlaces, y quita colores, letras raras y cualquier código.
import { esc } from './util.js';

const MAP = {
  H1: 'h3', H2: 'h3', H3: 'h3', H4: 'h3', H5: 'b', H6: 'b',
  P: 'p', DIV: 'p', SECTION: 'p', ARTICLE: 'p', HEADER: 'p', FOOTER: 'p', MAIN: 'p',
  UL: 'ul', OL: 'ol', LI: 'li', DL: 'ul', DT: 'li', DD: 'li',
  B: 'b', STRONG: 'b', I: 'i', EM: 'i', U: 'u', S: 's', DEL: 's', STRIKE: 's', MARK: 'mark',
  CODE: 'code', KBD: 'code', PRE: 'pre', BLOCKQUOTE: 'blockquote',
  TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TFOOT: 'tbody', TR: 'tr', TD: 'td', TH: 'th',
  BR: 'br', HR: 'hr', A: 'a', SUP: 'sup', SUB: 'sub',
};
const DROP = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE', 'SVG', 'IMG', 'PICTURE', 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'EMBED',
  'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'CANVAS', 'FORM', 'NAV']);
const BLOCKS = new Set(['P', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'HR']);
const NO_TEXT = new Set(['UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TR']);

export function cleanHtml(html) {
  const src = new DOMParser().parseFromString(html, 'text/html').body;
  const out = document.createElement('div');
  walk(src, out);
  out.querySelectorAll('li > p, td > p, th > p, blockquote > p:only-child').forEach(p => p.replaceWith(...p.childNodes));
  out.querySelectorAll('p, h3, b, i').forEach(p => { if (!p.textContent.trim() && !p.querySelector('br, table')) p.remove(); });
  out.querySelectorAll('*').forEach(e => { if (NO_TEXT.has(e.tagName)) [...e.childNodes].forEach(c => { if (c.nodeType === 3) c.remove(); }); });
  // Quitar <br> sueltos al principio y al final.
  while (out.firstChild?.nodeName === 'BR' || (out.firstChild?.nodeType === 3 && !out.firstChild.textContent.trim())) out.firstChild.remove();
  while (out.lastChild?.nodeName === 'BR' || (out.lastChild?.nodeType === 3 && !out.lastChild.textContent.trim())) out.lastChild.remove();
  return out;
}

function walk(src, dst) {
  for (const node of [...src.childNodes]) {
    if (node.nodeType === 3) { const t = node.textContent.replace(/ /g, ' '); if (t) dst.appendChild(document.createTextNode(t)); continue; }
    if (node.nodeType !== 1 || DROP.has(node.tagName)) continue;
    let tag = MAP[node.tagName];
    if (!tag && node.tagName === 'SPAN') {
      const st = node.getAttribute('style') || '';
      if (/font-weight:\s*(bold|[6-9]00)/.test(st)) tag = 'b';
      else if (/font-style:\s*italic/.test(st)) tag = 'i';
    }
    if (!tag) { walk(node, dst); continue; }
    if (tag === 'a') {
      const h = node.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(h)) { walk(node, dst); continue; }
    }
    const el = document.createElement(tag);
    if (tag === 'a') { el.href = node.getAttribute('href'); el.className = 'inl'; el.target = '_blank'; el.rel = 'noopener'; }
    if (tag === 'li' && node.getAttribute('data-done') != null) el.dataset.done = node.getAttribute('data-done') === '1' ? '1' : '0';
    if (tag === 'ul' && node.classList?.contains('checks')) el.className = 'checks';
    walk(node, el);
    // Un «div» que solo envuelve bloques se deshace.
    if (tag === 'p' && [...el.children].some(c => BLOCKS.has(c.tagName))) { dst.append(...el.childNodes); continue; }
    if (tag === 'p' && (dst.tagName === 'P' || dst.tagName === 'LI' || dst.tagName === 'TD' || dst.tagName === 'TH')) { dst.append(...el.childNodes, document.createElement('br')); continue; }
    dst.appendChild(el);
  }
}

export const isBlocky = el => [...el.children].filter(c => BLOCKS.has(c.tagName)).length > 1 || !!el.querySelector('table, h3, ul, ol, pre');

// ¿El texto parece Markdown? (el botón «Copiar» de ChatGPT copia así)
export const looksMarkdown = t => /(^|\n)\s*(#{1,6} |[-*+] |\d+[.)] |> |```|\|.+\|\s*$)/m.test(t) || /\*\*[^*\n]+\*\*/.test(t);

export function mdToHtml(src) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  const inline = s => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/__([^_]+)__/g, '<b>$1</b>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<i>$2</i>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>').replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  const isList = l => /^\s*([-*+•]|\d+[.)])\s+/.test(l);
  const isRow = l => /^\s*\|.*\|\s*$/.test(l);
  const isSep = l => /^\s*\|[\s:|-]+\|\s*$/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*```/.test(l)) {
      const buf = []; i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue;
    }
    if (/^\s*#{1,6}\s/.test(l)) { out.push(`<h3>${inline(l.replace(/^\s*#+\s/, ''))}</h3>`); i++; continue; }
    if (isList(l)) {
      const ordered = /^\s*\d/.test(l), items = [];
      while (i < lines.length && (isList(lines[i]) || (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length))) {
        if (isList(lines[i])) items.push(lines[i].replace(/^\s*([-*+•]|\d+[.)])\s+/, '')); else items[items.length - 1] += ' ' + lines[i].trim();
        i++;
      }
      if (items.every(x => /^\[[ xX]\]\s/.test(x))) out.push(`<ul class="checks">${items.map(x => `<li data-done="${/^\[[xX]/.test(x) ? 1 : 0}">${inline(x.slice(4))}</li>`).join('')}</ul>`);
      else out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^\s*>\s?/.test(l)) {
      const b = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) b.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<blockquote>${b.map(inline).join('<br>')}</blockquote>`); continue;
    }
    if (isRow(l)) {
      const rows = [];
      while (i < lines.length && isRow(lines[i])) rows.push(lines[i++]);
      const head = rows.length > 1 && isSep(rows[1]);
      const cells = r => r.trim().slice(1, -1).split('|').map(c => c.trim());
      out.push(`<table>${rows.filter(r => !isSep(r)).map((r, k) => `<tr>${cells(r).map(c => head && k === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</table>`);
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const p = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(#{1,6}\s|```|>)/.test(lines[i]) && !isList(lines[i]) && !isRow(lines[i])) p.push(lines[i++]);
    out.push(`<p>${p.map(inline).join('<br>')}</p>`);
  }
  return out.join('');
}

export function plainToHtml(t) {
  return t.replace(/\r/g, '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}
