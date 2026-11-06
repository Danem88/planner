// Archivos subidos a los apuntes: PDF, Word, PowerPoint, imágenes…
// Se guardan tal cual en el iPhone y se abren con el visor del propio iPhone.
import { blobPut, blobGet, blobUrl } from './db.js';
import { esc, uid, fmtSize, ago } from './util.js';
import { ic, sheet, toast } from './ui.js';

export const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.xls,.xlsx,.odt,.odp,.ods,.pages,.key,.numbers,.txt,.rtf,.csv,.zip,image/*,application/pdf';
const MAX = 200 * 1048576;

const KIND = [
  [/\.pdf$|pdf/, 'PDF', 'pdf'],
  [/\.(docx?|odt|pages|rtf)$|word/, 'DOC', 'doc'],
  [/\.(pptx?|ppsx?|odp|key)$|presentation|powerpoint/, 'PPT', 'ppt'],
  [/\.(xlsx?|ods|numbers|csv)$|sheet|excel/, 'XLS', 'xls'],
  [/\.(png|jpe?g|gif|heic|heif|webp)$|^image\//, 'IMG', 'img'],
  [/\.txt$|^text\//, 'TXT', 'txt'],
];
export function fileKind(name = '', type = '') {
  const s = (name.toLowerCase() + ' ' + type.toLowerCase());
  for (const [re, label, cls] of KIND) if (re.test(name.toLowerCase()) || re.test(type.toLowerCase()) || re.test(s)) return { label, cls };
  const ext = (name.split('.').pop() || '').slice(0, 4).toUpperCase();
  return { label: ext && ext !== name.toUpperCase() ? ext : 'ARCH', cls: 'other' };
}
export const badge = (name, type) => { const k = fileKind(name, type); return `<span class="fbadge f-${k.cls}" aria-hidden="true">${k.label}</span>`; };

// Abre el selector de archivos del iPhone (Archivos, Fotos, iCloud Drive…).
export function pickFiles({ multiple = true } = {}) {
  return new Promise(res => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = ACCEPT; inp.multiple = multiple; inp.hidden = true;
    document.body.append(inp);
    inp.onchange = () => { const fs = [...inp.files]; inp.remove(); res(fs); };
    inp.addEventListener('cancel', () => { inp.remove(); res([]); });
    inp.click();
  });
}

// Guarda un archivo y devuelve sus datos { blob, name, type, size }.
export async function storeFile(file) {
  if (file.size > MAX) { toast(`«${file.name}» es demasiado grande (máximo 200 MB)`); return null; }
  const id = uid();
  await blobPut(id, file);
  return { blob: id, name: file.name || 'Archivo', type: file.type || '', size: file.size, created: Date.now() };
}

async function asFile(meta) {
  const b = await blobGet(meta.blob);
  return b ? new File([b], meta.name, { type: meta.type || b.type }) : null;
}

// Ficha de un archivo: abrir, compartir y las opciones que se pasen.
// actions: [{ label, icon, danger, run }]
export async function openFile(meta, actions = []) {
  const url = await blobUrl(meta.blob);
  if (!url) { toast('No se encuentra este archivo'); return; }
  const k = fileKind(meta.name, meta.type);
  const { el, close } = sheet(`
    <div class="fhead">${badge(meta.name, meta.type)}<div class="grow"><b>${esc(meta.name)}</b><small>${fmtSize(meta.size || 0)}${meta.created ? ' · ' + esc(ago(meta.created)) : ''}</small></div></div>
    ${k.cls === 'img' ? `<img class="fprev" src="${url}" alt="">` : ''}
    <a class="btn pri wide" data-open href="${url}" target="_blank" rel="noopener">${ic('i-not')} Abrir</a>
    <div class="menu" style="margin-top:.5rem">
      <button class="mi" data-share>${ic('i-share')}Compartir o abrir en otra app</button>
      ${actions.map((a, i) => `<button class="mi ${a.danger ? 'danger' : ''}" data-i="${i}">${a.icon ? ic(a.icon) : ''}${esc(a.label)}</button>`).join('')}
    </div>`, { label: meta.name });
  el.querySelector('[data-open]').addEventListener('click', () => setTimeout(close, 300));
  el.querySelector('[data-share]').onclick = async () => {
    const f = await asFile(meta);
    try {
      if (f && navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: meta.name });
      else { const a = document.createElement('a'); a.href = url; a.download = meta.name; a.click(); }
    } catch (e) { if (e.name !== 'AbortError') toast('No se pudo compartir'); }
  };
  el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { close(); setTimeout(() => actions[+b.dataset.i].run(), 120); });
}
