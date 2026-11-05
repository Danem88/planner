// Bienvenida la primera vez: nombre y asignaturas.
import { D, save, addSubject } from './store.js';
import { esc } from './util.js';
import { ic } from './ui.js';

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
      <p>Beastudio te ayuda a llevar las tareas, el horario, los exámenes y las notas de clase. Todo se queda en tu iPhone.</p>
      <label class="field"><span>¿Cómo te llamas?</span><input class="inp" name="n" value="${esc(D.name || '')}" placeholder="Tu nombre" autocomplete="given-name" enterkeyhint="next"></label>
      <div class="grow"></div><div class="steps"><i class="on"></i><i></i></div>
      <button class="btn pri wide" data-next>Seguir</button>`;
    const n = w.querySelector('[name=n]');
    n.onkeydown = e => { if (e.key === 'Enter') next(); };
    const next = () => { D.name = n.value.trim(); save(); step2(); };
    w.querySelector('[data-next]').onclick = next;
  };

  const step2 = () => {
    const all = [...SUGGEST, ...extra];
    let c = 0;
    w.innerHTML = `${ic('fl2', 'big')}<h1>Tus asignaturas</h1>
      <p>Toca las que tienes este curso. Podrás cambiarlas cuando quieras en <b>Materias</b>.</p>
      <div class="picks">${all.map(s => { const on = picked.has(s); const col = on ? `var(--s${(c++ % 6) + 1})` : ''; return `<button data-s="${esc(s)}" aria-pressed="${on}" ${on ? `style="background:${col}"` : ''}>${on ? ic('i-ok') : ''}${esc(s)}</button>`; }).join('')}
        <button data-other>${ic('i-plus')}Otra</button></div>
      <div class="grow"></div><div class="steps"><i></i><i class="on"></i></div>
      <button class="btn pri wide" data-next>${picked.size ? `Empezar con ${picked.size} ${picked.size === 1 ? 'asignatura' : 'asignaturas'}` : 'Empezar'}</button>
      <button class="btn ghost wide" data-back style="margin-top:.3rem">Atrás</button>`;
    w.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const s = b.dataset.s; picked.has(s) ? picked.delete(s) : picked.add(s); step2(); });
    w.querySelector('[data-other]').onclick = () => {
      const name = prompt('Nombre de la asignatura');
      if (name && name.trim()) { extra.push(name.trim()); picked.add(name.trim()); step2(); }
    };
    w.querySelector('[data-back]').onclick = step1;
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
