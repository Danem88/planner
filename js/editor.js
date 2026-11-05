// Editor de una nota: texto con formato, casillas, fotos, enlaces y notas de voz.
// Todo vive en un único bloque editable; las fotos, audios y enlaces son piezas
// no editables dentro de él (se mueven y se borran como un todo).
import { blobPut, blobUrl, blobDel } from './db.js';
import { cleanHtml, isBlocky, looksMarkdown, mdToHtml, plainToHtml } from './clean.js';
import { ic, sheet, menu, toast, askText } from './ui.js';
import { esc, uid, debounce, fmtDur } from './util.js';

const URL_RE = /^\s*(https?:\/\/[^\s]+)\s*$/i;

export function mountEditor(host, n, onChange) {
  host.insertAdjacentHTML('beforeend', `<div class="doc" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Contenido de la nota"
    data-ph="Escribe aquí, pega textos o enlaces, o añade fotos y audios con los botones de abajo." spellcheck="true" autocapitalize="sentences"></div>`);
  const doc = host.querySelector('.doc');
  doc.innerHTML = n.html || '';
  hydrate(doc);

  // ---- barra de herramientas sobre el teclado ----
  const tools = document.createElement('div');
  tools.className = 'tools';
  tools.innerHTML = `
    <div class="row fmt" role="toolbar" aria-label="Formato">
      <button data-c="h" aria-label="Título">H</button>
      <button data-c="b" aria-label="Negrita"><b>B</b></button>
      <button data-c="mark" aria-label="Resaltar">${ic('i-mark')}</button>
      <button data-c="ul" aria-label="Lista">${ic('i-list')}</button>
      <button data-c="ol" aria-label="Lista numerada">${ic('i-olist')}</button>
      <button data-c="quote" aria-label="Cita">❝</button>
    </div>
    <div class="row" role="toolbar" aria-label="Añadir a la nota">
      <button data-c="fmt" aria-label="Formato del texto" aria-pressed="false">${ic('i-txt')}</button>
      <button data-c="chk" aria-label="Casillas">${ic('i-chk')}</button>
      <span class="sep"></span>
      <button data-c="cam" aria-label="Hacer una foto">${ic('i-cam')}</button>
      <button data-c="pic" aria-label="Añadir fotos del carrete">${ic('i-img')}</button>
      <button data-c="link" aria-label="Añadir un enlace">${ic('i-lnk')}</button>
      <button data-c="mic" aria-label="Grabar una nota de voz">${ic('i-mic')}</button>
    </div>
    <input type="file" accept="image/*" capture="environment" data-in="cam" hidden>
    <input type="file" accept="image/*" multiple data-in="pic" hidden>`;
  document.body.append(tools);

  // Colocar la barra justo encima del teclado del iPhone.
  const vv = window.visualViewport;
  const place = () => { if (vv) tools.style.bottom = Math.max(0, innerHeight - vv.height - vv.offsetTop) + 'px'; else tools.style.bottom = '0px'; };
  vv?.addEventListener('resize', place); vv?.addEventListener('scroll', place); place();

  // ---- guardado ----
  const serialize = () => {
    const c = doc.cloneNode(true);
    c.querySelectorAll('figure img').forEach(i => i.removeAttribute('src'));
    c.querySelectorAll('.vnote').forEach(v => { v.classList.remove('playing'); v.querySelectorAll('.wave i').forEach(b => b.classList.remove('on')); });
    c.querySelectorAll('.vnote .play').forEach(p => p.innerHTML = ic('i-play'));
    return c.innerHTML.trim() === '<br>' ? '' : c.innerHTML;
  };
  const persist = debounce(() => {
    n.html = serialize();
    n.text = (doc.innerText || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 30000);
    onChange();
  }, 500);
  doc.addEventListener('input', () => persist());

  // ---- dónde está el cursor ----
  let lastRange = null;
  const onSel = () => {
    const s = getSelection();
    if (s.rangeCount && doc.contains(s.anchorNode)) lastRange = s.getRangeAt(0).cloneRange();
  };
  document.addEventListener('selectionchange', onSel);
  const restore = () => {
    doc.focus({ preventScroll: true });
    if (lastRange && doc.contains(lastRange.startContainer)) { const s = getSelection(); s.removeAllRanges(); s.addRange(lastRange); }
  };
  const topBlock = node => { while (node && node.parentNode !== doc) node = node.parentNode; return node; };
  const isEmpty = b => b && (b.nodeType === 3 ? !b.textContent.trim() : (!b.textContent.trim() && !b.querySelector('figure, .vnote, .lcard, table, hr')));
  const caretIn = el => { const r = document.createRange(); r.setStart(el, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); lastRange = r.cloneRange(); };

  function insertBlock(html, { focus = true } = {}) {
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const els = [...tmp.childNodes];
    let block = lastRange && doc.contains(lastRange.startContainer) ? topBlock(lastRange.startContainer) : null;
    if (block === doc) block = null;
    if (block && isEmpty(block)) { block.replaceWith(...els); }
    else if (block) block.after(...els);
    else doc.append(...els);
    const last = els[els.length - 1];
    let after = last.nextSibling;
    if (!after || !(after.nodeName === 'P' && isEmpty(after))) { after = document.createElement('p'); after.innerHTML = '<br>'; last.after(after); }
    els.forEach(e => e.nodeType === 1 && hydrate(e));
    if (focus) { doc.focus({ preventScroll: true }); caretIn(after); }
    else lastRange = (() => { const r = document.createRange(); r.setStart(after, 0); r.collapse(true); return r; })();
    persist();
    setTimeout(() => last.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }), 50);
    return last;
  }

  // ---- formato ----
  const cmd = (c, v) => { restore(); document.execCommand(c, false, v); persist(); };
  const currentBlockTag = () => { const s = getSelection(); let el = s.anchorNode; if (el?.nodeType === 3) el = el.parentNode; return el?.closest?.('h3, p, li, blockquote, div')?.tagName; };
  const closestInDoc = sel => { const s = getSelection(); let el = s.anchorNode; if (el?.nodeType === 3) el = el.parentNode; const f = el?.closest?.(sel); return f && doc.contains(f) ? f : null; };
  // Listas hechas a mano: el comando del navegador juntaba listas cercanas.
  const caretEnd = el => {
    const r = document.createRange();
    if (!el.textContent) r.setStart(el, 0); else { r.selectNodeContents(el); r.collapse(false); }
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); lastRange = r.cloneRange();
  };
  const wrapP = node => { const p = document.createElement('p'); node.replaceWith(p); p.append(node); return p; };
  function currentLine() {
    const s = getSelection();
    if (!s.rangeCount || !doc.contains(s.anchorNode)) return null;
    const node = s.anchorNode;
    const li = (node.nodeType === 3 ? node.parentNode : node).closest?.('li');
    if (li && doc.contains(li)) return li;
    if (node === doc) return doc.childNodes[s.anchorOffset] || doc.childNodes[s.anchorOffset - 1] || null;
    let b = topBlock(node);
    if (b?.classList?.contains('paste')) { let x = node; while (x.parentNode !== b) x = x.parentNode; b = x; }
    if (b && b.nodeType === 3) b = wrapP(b);
    return b;
  }
  const kindOf = list => list.tagName === 'OL' ? 'ol' : list.classList.contains('checks') ? 'checks' : 'ul';
  const newList = kind => { const l = document.createElement(kind === 'ol' ? 'ol' : 'ul'); if (kind === 'checks') l.className = 'checks'; return l; };
  function setList(kind) {
    restore();
    const line = currentLine();
    if (line?.tagName === 'LI') {
      const list = line.parentNode;
      if (kindOf(list) === kind) {
        const items = [...list.children];
        const ps = items.map(li => { const p = document.createElement('p'); p.append(...li.childNodes); if (!p.firstChild) p.innerHTML = '<br>'; return p; });
        list.replaceWith(...ps);
        caretEnd(ps[items.indexOf(line)]);
      } else {
        const nl = newList(kind); nl.append(...list.childNodes); list.replaceWith(nl); caretEnd(line);
      }
    } else {
      const nl = newList(kind), li = document.createElement('li');
      nl.append(li);
      if (line && /^(P|DIV|H3|BLOCKQUOTE)$/.test(line.tagName) && !line.className) { li.append(...line.childNodes); line.replaceWith(nl); }
      else if (line) line.after(nl);
      else doc.append(nl);
      if (!li.textContent) li.innerHTML = '<br>';
      caretEnd(li);
    }
    persist();
  }
  const toggleChecks = () => setList('checks');
  // Una casilla nueva (Intro tras una tachada) empieza sin tachar.
  doc.addEventListener('input', e => {
    if (e.inputType !== 'insertParagraph') return;
    const li = closestInDoc('ul.checks > li');
    if (li && !li.textContent.trim()) li.dataset.done = '0';
  });
  function toggleMark() {
    restore();
    const m = closestInDoc('mark');
    if (m) { m.replaceWith(...m.childNodes); persist(); return; }
    const s = getSelection();
    if (!s.rangeCount || s.isCollapsed) { toast('Selecciona primero el texto que quieres resaltar'); return; }
    const box = document.createElement('div'); box.appendChild(s.getRangeAt(0).cloneContents());
    document.execCommand('insertHTML', false, `<mark>${box.innerHTML}</mark>`);
    persist();
  }

  const fileIn = c => tools.querySelector(`[data-in=${c}]`);
  tools.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });
  tools.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const c = b.dataset.c;
    if (c === 'fmt') { const on = !tools.classList.contains('fmt-on'); tools.classList.toggle('fmt-on', on); b.setAttribute('aria-pressed', on); return; }
    if (c === 'h') return cmd('formatBlock', currentBlockTag() === 'H3' ? '<p>' : '<h3>');
    if (c === 'b') return cmd('bold');
    if (c === 'mark') return toggleMark();
    if (c === 'ul') return setList('ul');
    if (c === 'ol') return setList('ol');
    if (c === 'quote') return cmd('formatBlock', currentBlockTag() === 'BLOCKQUOTE' ? '<p>' : '<blockquote>');
    if (c === 'chk') return toggleChecks();
    if (c === 'cam' || c === 'pic') { onSel(); fileIn(c).click(); return; }
    if (c === 'link') return addLink();
    if (c === 'mic') return recordVoice();
  });
  ['cam', 'pic'].forEach(c => fileIn(c).addEventListener('change', async e => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) await addPhoto(f);
  }));

  async function addPhoto(file) {
    try {
      const blob = await compress(file);
      const id = uid();
      await blobPut(id, blob);
      insertBlock(photoHtml(id), { focus: false });
    } catch (err) { toast('No se pudo añadir la foto'); }
  }

  function addLink(prefill = '') {
    const { el, close } = sheet(`<h2>Añadir un enlace</h2>
      <label class="field"><span>Dirección</span><input class="inp" name="u" type="url" inputmode="url" autocapitalize="off" placeholder="https://…" value="${esc(prefill)}"></label>
      <label class="field"><span>Nombre (opcional)</span><input class="inp" name="t" placeholder="Por ejemplo: Vídeo de la mitosis"></label>
      <div class="acts"><button class="btn" data-a="no">Cancelar</button><button class="btn pri" data-a="ok">Añadir</button></div>`, { label: 'Enlace' });
    const u = el.querySelector('[name=u]'), t = el.querySelector('[name=t]');
    setTimeout(() => u.focus(), 320);
    el.querySelector('[data-a=no]').onclick = () => close();
    el.querySelector('[data-a=ok]').onclick = () => {
      let url = u.value.trim();
      if (!url) { u.focus(); return; }
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      try { new URL(url); } catch (e) { toast('Esa dirección no parece válida'); return; }
      close(); insertBlock(linkHtml(url, t.value.trim()), { focus: false });
    };
  }

  // ---- pegar ----
  doc.addEventListener('paste', async e => {
    const cd = e.clipboardData; if (!cd) return;
    const imgs = [...cd.files].filter(f => f.type.startsWith('image/'));
    const html = cd.getData('text/html'), txt = cd.getData('text/plain');
    if (imgs.length && !txt.trim()) { e.preventDefault(); onSel(); for (const f of imgs) await addPhoto(f); return; }
    const m = URL_RE.exec(txt);
    if (m) {
      e.preventDefault(); onSel();
      let title = '';
      if (html) { const a = new DOMParser().parseFromString(html, 'text/html').querySelector('a'); if (a && a.textContent.trim() && a.textContent.trim() !== m[1]) title = a.textContent.trim(); }
      insertBlock(linkHtml(m[1], title));
      return;
    }
    let frag = null;
    if (html && /<[a-z]/i.test(html)) frag = cleanHtml(html);
    else if (txt && looksMarkdown(txt)) frag = cleanHtml(mdToHtml(txt));
    if (!frag && txt) { e.preventDefault(); document.execCommand('insertHTML', false, txt.includes('\n') ? plainToHtml(txt) : esc(txt)); persist(); return; }
    if (!frag) return;
    e.preventDefault(); onSel();
    if (isBlocky(frag)) insertBlock(`<div class="paste">${frag.innerHTML}</div>`);
    else { document.execCommand('insertHTML', false, frag.innerHTML); persist(); }
  });

  // ---- toques dentro de la nota ----
  let openOnClick = null;
  doc.addEventListener('pointerdown', e => {
    const li = e.target.closest('ul.checks > li');
    if (li && e.clientX - li.getBoundingClientRect().left < 30) {
      e.preventDefault();
      li.dataset.done = li.dataset.done === '1' ? '0' : '1';
      persist(); return;
    }
    const a = e.target.closest('a.inl');
    openOnClick = a && document.activeElement !== doc ? a.href : null;
    if (openOnClick) e.preventDefault();
    if (e.target.closest('figure, .vnote, .lcard')) e.preventDefault();  // no abrir el teclado
  });
  doc.addEventListener('click', e => {
    if (openOnClick) { window.open(openOnClick, '_blank', 'noopener'); openOnClick = null; e.preventDefault(); return; }
    const piece = e.target.closest('figure, .vnote, .lcard');
    if (!piece) return;
    e.preventDefault();
    const x = e.target.closest('.x');
    if (piece.matches('figure')) {
      if (x) menu('Foto', [
        { label: 'Ver en grande', icon: 'i-img', run: () => openViewer(piece) },
        { label: 'Quitar la foto', icon: 'i-trash', danger: true, run: () => removePiece(piece, 'Foto quitada') },
      ]);
      else openViewer(piece);
    } else if (piece.matches('.vnote')) {
      if (x) menu('Nota de voz', [
        { label: 'Cambiar el nombre', icon: 'i-edit', run: async () => { const v = await askText('Nombre del audio', { value: piece.querySelector('.vn').textContent }); if (v) { piece.querySelector('.vn').textContent = v; persist(); } } },
        { label: 'Quitar el audio', icon: 'i-trash', danger: true, run: () => removePiece(piece, 'Audio quitado') },
      ]);
      else if (e.target.closest('.play, .wave')) togglePlay(piece);
    } else if (piece.matches('.lcard')) {
      if (x) menu('Enlace', [
        { label: 'Abrir', icon: 'i-lnk', run: () => window.open(piece.dataset.href, '_blank', 'noopener') },
        { label: 'Cambiar el nombre', icon: 'i-edit', run: async () => { const v = await askText('Nombre del enlace', { value: piece.querySelector('b').textContent }); if (v) { piece.querySelector('b').textContent = v; persist(); } } },
        { label: 'Quitar el enlace', icon: 'i-trash', danger: true, run: () => removePiece(piece, 'Enlace quitado') },
      ]);
      else window.open(piece.dataset.href, '_blank', 'noopener');
    }
  });

  function removePiece(piece, msg) {
    const parent = piece.parentNode, next = piece.nextSibling, id = piece.dataset.blob;
    piece.remove(); persist();
    let undone = false;
    toast(msg, () => { undone = true; parent.insertBefore(piece, next); hydrate(piece); persist(); });
    if (id) setTimeout(() => { if (!undone && !doc.contains(piece)) blobDel(id).catch(() => {}); }, 6000);
  }

  // ---- notas de voz ----
  const audio = new Audio();
  let playing = null, raf = 0;
  async function togglePlay(v) {
    if (playing === v && !audio.paused) { audio.pause(); return; }
    if (playing !== v) {
      stopPlay();
      audio.src = await blobUrl(v.dataset.blob);
      playing = v;
    }
    try { await audio.play(); } catch (e) { toast('No se pudo reproducir'); return; }
    v.classList.add('playing'); v.querySelector('.play').innerHTML = ic('i-pause');
    const bars = [...v.querySelectorAll('.wave i')], dur = +v.dataset.dur || audio.duration || 1;
    const tick = () => { const k = Math.round(audio.currentTime / dur * bars.length); bars.forEach((b, i) => b.classList.toggle('on', i < k)); raf = requestAnimationFrame(tick); };
    cancelAnimationFrame(raf); tick();
  }
  function stopPlay() {
    cancelAnimationFrame(raf);
    if (playing) { playing.classList.remove('playing'); playing.querySelector('.play').innerHTML = ic('i-play'); playing.querySelectorAll('.wave i').forEach(b => b.classList.remove('on')); }
    playing = null;
  }
  audio.onpause = () => { cancelAnimationFrame(raf); if (playing) playing.querySelector('.play').innerHTML = ic('i-play'); };
  audio.onended = stopPlay;

  async function recordVoice() {
    onSel();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { toast('Sin permiso para el micrófono. Actívalo en Ajustes del iPhone › Safari › Micrófono.'); return; }
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => window.MediaRecorder?.isTypeSupported?.(m)) || '';
    let rec;
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
    catch (e) { stream.getTracks().forEach(t => t.stop()); toast('Este navegador no puede grabar audio'); return; }
    const chunks = [], levels = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC(), an = ac.createAnalyser(); an.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    const BARS = 20;
    const { el, close } = sheet(`<div class="recsheet"><div class="t">Grabando nota de voz</div><div class="time">0:00</div>
      <div class="bigwave" aria-hidden="true">${'<i style="height:4px"></i>'.repeat(BARS)}</div>
      <div class="recbtns"><button data-a="cancel"><span class="s">${ic('i-x')}</span>Cancelar</button>
        <button data-a="stop"><span class="stop"><i></i></span>Terminar</button>
        <button data-a="pause"><span class="s">${ic('i-pause')}</span><span data-pl>Pausa</span></button></div></div>`,
      { label: 'Grabar nota de voz', onClose: v => finish(v !== 'cancel') });
    let elapsed = 0, last = performance.now(), paused = false, timer;
    const bars = [...el.querySelectorAll('.bigwave i')];
    timer = setInterval(() => {
      const now = performance.now();
      if (!paused) elapsed += (now - last) / 1000;
      last = now;
      el.querySelector('.time').textContent = fmtDur(elapsed);
      an.getByteTimeDomainData(buf);
      let sum = 0; for (const x of buf) sum += ((x - 128) / 128) ** 2;
      const lv = paused ? 0 : Math.min(1, Math.sqrt(sum / buf.length) * 4);
      if (!paused) levels.push(lv);
      bars.push(bars.shift()); const b = bars[bars.length - 1];
      el.querySelector('.bigwave').append(b); b.style.height = Math.max(4, lv * 56) + 'px';
      if (elapsed > 600) close('stop'); // 10 minutos como mucho
    }, 100);
    rec.start(250);
    el.querySelector('[data-a=cancel]').onclick = () => close('cancel');
    el.querySelector('[data-a=stop]').onclick = () => close('stop');
    el.querySelector('[data-a=pause]').onclick = () => {
      paused = !paused;
      if (paused) rec.pause?.(); else rec.resume?.();
      el.querySelector('[data-pl]').textContent = paused ? 'Seguir' : 'Pausa';
      el.querySelector('[data-a=pause] .s').innerHTML = ic(paused ? 'i-play' : 'i-pause');
      el.querySelector('.t').textContent = paused ? 'En pausa' : 'Grabando nota de voz';
    };
    function finish(keep) {
      clearInterval(timer);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); ac.close().catch(() => {});
        if (!keep || elapsed < 0.7 || !chunks.length) return;
        const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' });
        const id = uid();
        await blobPut(id, blob);
        const wave = Array.from({ length: 28 }, (_, i) => {
          const a = Math.floor(i * levels.length / 28), b = Math.max(a + 1, Math.floor((i + 1) * levels.length / 28));
          return Math.min(9, Math.round(Math.max(...levels.slice(a, b), 0) * 9));
        }).join('');
        insertBlock(voiceHtml(id, Math.round(elapsed), wave, 'Nota de voz'), { focus: false });
      };
      try { rec.state !== 'inactive' ? rec.stop() : rec.onstop(); } catch (e) { rec.onstop(); }
    }
  }

  // ---- foco ----
  const onFocus = () => document.body.classList.add('editing');
  const onBlur = () => setTimeout(() => { if (document.activeElement !== doc && !document.activeElement?.classList.contains('ntitle')) { document.body.classList.remove('editing'); tools.classList.remove('fmt-on'); } }, 80);
  doc.addEventListener('focus', onFocus);
  doc.addEventListener('blur', onBlur);

  return {
    flush: () => persist.flush(),
    hasFocus: () => document.activeElement === doc,
    focusStart: () => { doc.focus(); const first = doc.firstChild; if (first) caretIn(first.nodeType === 3 ? doc : first); },
    destroy: (skipSave) => {
      if (!skipSave) persist.flush();
      document.removeEventListener('selectionchange', onSel);
      vv?.removeEventListener('resize', place); vv?.removeEventListener('scroll', place);
      audio.pause(); stopPlay();
      tools.remove();
      document.body.classList.remove('editing');
    },
  };
}

// ---- piezas ----
function photoHtml(id) {
  return `<figure contenteditable="false" data-blob="${id}"><img alt="Foto de la nota"><button class="x" aria-label="Opciones de la foto">${ic('i-more')}</button></figure>`;
}
function voiceHtml(id, dur, wave, name) {
  const bars = [...wave].map(h => `<i style="height:${15 + +h * 9.4}%"></i>`).join('');
  return `<div class="vnote" contenteditable="false" data-blob="${id}" data-dur="${dur}" data-wave="${wave}"><button class="play" aria-label="Reproducir nota de voz">${ic('i-play')}</button>
    <div class="wave" aria-hidden="true">${bars}</div><span class="len">${fmtDur(dur)} · <span class="vn">${esc(name)}</span></span>
    <button class="x" aria-label="Opciones del audio">${ic('i-more')}</button></div>`;
}
function linkHtml(url, title) {
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) {}
  const t = title || guessTitle(url, host);
  return `<a class="lcard" contenteditable="false" data-href="${esc(url)}" href="${esc(url)}"><span class="fav" data-host="${esc(host)}">${esc(host[0]?.toUpperCase() || '·')}</span>
    <span class="txt"><b>${esc(t)}</b><small>${esc(host)}</small></span><button class="x" aria-label="Opciones del enlace">${ic('i-more')}</button></a>`;
}
// Sin internet no se puede leer el título de una web; se intenta deducir de la dirección.
function guessTitle(url, host) {
  try {
    const u = new URL(url);
    const seg = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '');
    if (/wikipedia\.org$/.test(u.hostname) && seg) return seg.replace(/_/g, ' ') + ' — Wikipedia';
    if (/(youtube\.com|youtu\.be)$/.test(u.hostname)) return 'Vídeo de YouTube';
    if (/chatgpt\.com|chat\.openai\.com/.test(u.hostname)) return 'Conversación de ChatGPT';
    if (/docs\.google\.com/.test(u.hostname)) return /presentation/.test(u.pathname) ? 'Presentación de Google' : /spreadsheets/.test(u.pathname) ? 'Hoja de cálculo de Google' : 'Documento de Google';
    if (/drive\.google\.com/.test(u.hostname)) return 'Archivo de Google Drive';
    if (/classroom\.google\.com/.test(u.hostname)) return 'Google Classroom';
    const words = seg.replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_+]+/g, ' ').trim();
    if (/[a-záéíóúñ]{3,}.*\s.*[a-záéíóúñ]{3,}/i.test(words) && words.length < 90) return words[0].toUpperCase() + words.slice(1);
  } catch (e) {}
  return host;
}

// Pone las direcciones de fotos e iconos al abrir la nota.
function hydrate(root) {
  const figs = root.matches?.('figure[data-blob]') ? [root] : root.querySelectorAll('figure[data-blob]');
  figs.forEach(async f => { f.contentEditable = 'false'; const img = f.querySelector('img'); if (img && !img.src) img.src = await blobUrl(f.dataset.blob); });
  const cards = root.matches?.('.lcard') ? [root] : root.querySelectorAll('.lcard');
  cards.forEach(a => {
    a.contentEditable = 'false';
    const fav = a.querySelector('.fav');
    if (fav && !fav.querySelector('img') && navigator.onLine) {
      const img = new Image();
      img.alt = '';
      img.onload = () => { if (img.naturalWidth > 16) fav.append(img); };
      img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(fav.dataset.host)}&sz=64`;
    }
  });
  (root.matches?.('.vnote') ? [root] : root.querySelectorAll('.vnote')).forEach(v => v.contentEditable = 'false');
}

// Reduce las fotos (lado largo 1600 px, JPEG) para no llenar el iPhone.
function compress(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1600, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}

// Foto a pantalla completa, con zoom de dos dedos y doble toque.
function openViewer(fig) {
  const src = fig.querySelector('img')?.src; if (!src) return;
  const v = document.createElement('div');
  v.className = 'viewer';
  v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'Foto');
  v.innerHTML = `<div class="vt"><button data-close>Cerrar</button></div><div class="stage"><img alt="Foto" src="${src}"></div>`;
  document.body.append(v);
  const img = v.querySelector('img');
  let s = 1, tx = 0, ty = 0, base = null;
  const pts = new Map();
  let start = null, lastTap = 0, swipeY = 0;
  const apply = () => { img.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`; };
  const close = () => { v.remove(); removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  v.querySelector('[data-close]').onclick = close;
  const box = () => base || (base = img.getBoundingClientRect());
  v.addEventListener('pointerdown', e => {
    if (e.target.closest('.vt')) return;
    v.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    box();
    if (pts.size === 1) {
      const now = Date.now();
      if (now - lastTap < 300) { // doble toque
        if (s > 1) { s = 1; tx = ty = 0; } else { const b = box(); const px = (e.clientX - b.left) / 1, py = (e.clientY - b.top); s = 2.5; tx = -px * 1.5; ty = -py * 1.5; }
        img.style.transition = 'transform .2s'; apply(); setTimeout(() => img.style.transition = '', 220);
        lastTap = 0; return;
      }
      lastTap = now;
    }
    start = snapshot();
  });
  const snapshot = () => {
    const p = [...pts.values()];
    const mid = p.length > 1 ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : { ...p[0] };
    const dist = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
    return { mid, dist, s, tx, ty, n: p.length };
  };
  v.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const now = snapshot(), b = box();
    if (now.n !== start.n) { start = now; return; }
    if (now.n === 2) {
      s = Math.max(1, Math.min(5, start.s * now.dist / start.dist));
      const cx = (start.mid.x - b.left - start.tx) / start.s, cy = (start.mid.y - b.top - start.ty) / start.s;
      tx = now.mid.x - b.left - cx * s; ty = now.mid.y - b.top - cy * s;
    } else if (s > 1) { tx = start.tx + now.mid.x - start.mid.x; ty = start.ty + now.mid.y - start.mid.y; }
    else { swipeY = now.mid.y - start.mid.y; ty = Math.max(0, swipeY); v.style.background = `rgba(0,0,0,${Math.max(.3, 1 - ty / 400)})`; }
    apply();
  });
  const up = e => {
    pts.delete(e.pointerId);
    if (s <= 1 && ty > 120) return close();
    if (s <= 1) { s = 1; tx = ty = 0; v.style.background = ''; img.style.transition = 'transform .2s'; apply(); setTimeout(() => img.style.transition = '', 220); }
    if (pts.size) start = snapshot();
  };
  v.addEventListener('pointerup', up); v.addEventListener('pointercancel', up);
}
