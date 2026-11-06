// Bienvenida la primera vez: nombre y asignaturas (o recuperar una copia).
import { D, save, addSubject } from './store.js';
import { esc } from './util.js';
import { ic } from './ui.js';
import { importBackup, styleButtons, bindStyles } from './ajustes.js';

const SUGGEST = ['Matemáticas', 'Lengua', 'Inglés', 'Biología', 'Geografía e Historia', 'Física y Química',
  'Educación Física', 'Tecnología', 'Música', 'Plástica', 'Francés', 'Filosofía', 'Latín', 'Economía', 'Valores'];

export function showWelcome(done) {
  const w = document.createElement('div');
  w.className = 'welcome';
  w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'Bienvenida');
  document.body.append(w);
  const picked = new Set(D.subjects.map(s => s.name));
  const extra = [];

  const step1 = () => {
    w.innerHTML = `${ic('fl', 'big')}<h1>Hola${D.name ? ', ' + esc(D.name) : ''}</h1>
      <p>Planner te ayuda a llevar las tareas, el horario, los exámenes y los apuntes de clase. Todo se queda en tu móvil: sin cuentas y sin anuncios.</p>
      <label class="field"><span>¿Cómo te llamas?</span><input class="inp" name="n" value="${esc(D.name || '')}" placeholder="Tu nombre" autocomplete="given-name" enterkeyhint="next"></label>
      <div class="grow"></div><div class="steps"><i class="on"></i><i></i><i></i></div>
      <button class="btn pri wide" data-next>Seguir</button>
      <label class="btn ghost wide" style="margin-top:.3rem;cursor:pointer">Tengo una copia: recuperarla<input type="file" accept=".json,application/json" data-import hidden></label>`;
    const n = w.querySelector('[name=n]');
    n.onkeydown = e => { if (e.key === 'Enter') next(); };
    const next = () => { D.name = n.value.trim(); save(); stepStyle(); };
    w.querySelector('[data-next]').onclick = next;
    w.querySelector('[data-import]').onchange = e => { w.style.zIndex = 30; importBackup(e.target.files[0]).finally(() => { w.style.zIndex = ''; }); };
  };

  const stepStyle = () => {
    w.innerHTML = `${ic('fl2', 'big')}<h1>Tu estilo</h1>
      <p>Elige cómo quieres verla. Podrás cambiar el color y los adornos cuando quieras en <b>Ajustes</b>.</p>
      <div class="styles" role="radiogroup" aria-label="Estilo">${styleButtons()}</div>
      <div class="grow"></div><div class="steps"><i></i><i class="on"></i><i></i></div>
      <button class="btn pri wide" data-next>Seguir</button>
      <button class="btn ghost wide" data-back style="margin-top:.3rem">Atrás</button>`;
    bindStyles(w);
    w.querySelector('[data-next]').onclick = step2;
    w.querySelector('[data-back]').onclick = step1;
  };

  const step2 = () => {
    const all = [...SUGGEST, ...extra];
    let c = 0;
    w.innerHTML = `${ic('fl2', 'big')}<h1>Tus asignaturas</h1>
      <p>Toca las que tienes este curso. Podrás cambiarlas cuando quieras en <b>Materias</b>.</p>
      <div class="picks">${all.map(s => { const on = picked.has(s); const col = on ? `var(--s${(c++ % 24) + 1})` : ''; return `<button data-s="${esc(s)}" aria-pressed="${on}" ${on ? `style="background:${col}"` : ''}>${on ? ic('i-ok') : ''}${esc(s)}</button>`; }).join('')}
        <button data-other>${ic('i-plus')}Otra</button></div>
      <div class="other" hidden><input class="inp" placeholder="Nombre de la asignatura" enterkeyhint="done" aria-label="Nombre de la asignatura"><button class="btn pri" data-addother>Añadir</button></div>
      <div class="grow"></div><div class="steps"><i></i><i></i><i class="on"></i></div>
      <button class="btn pri wide" data-next>${picked.size ? `Empezar con ${picked.size} ${picked.size === 1 ? 'asignatura' : 'asignaturas'}` : 'Empezar'}</button>
      <button class="btn ghost wide" data-back style="margin-top:.3rem">Atrás</button>`;
    w.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const s = b.dataset.s; picked.has(s) ? picked.delete(s) : picked.add(s); step2(); });
    const box = w.querySelector('.other'), inp = box.querySelector('input');
    w.querySelector('[data-other]').onclick = () => { box.hidden = false; inp.focus(); };
    const addOther = () => {
      const name = inp.value.trim(); if (!name) { inp.focus(); return; }
      if (!all.includes(name)) extra.push(name);
      picked.add(name); step2();
    };
    inp.onkeydown = e => { if (e.key === 'Enter') addOther(); };
    w.querySelector('[data-addother]').onclick = addOther;
    w.querySelector('[data-back]').onclick = stepStyle;
    w.querySelector('[data-next]').onclick = () => {
      const have = new Set(D.subjects.map(s => s.name));
      [...SUGGEST, ...extra].filter(s => picked.has(s) && !have.has(s)).forEach(s => addSubject(s));
      D.subjects = D.subjects.filter(s => picked.has(s.name) || !SUGGEST.includes(s.name));
      D.onboarded = true; save();
      w.remove(); done();
    };
  };
  step1();
}
