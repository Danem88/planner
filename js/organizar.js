// Organizar la app: orden de los bloques de «Hoy», de la barra de abajo y de las asignaturas.
import { D, save, HOME_BLOCKS, color } from './store.js';
import { esc } from './util.js';
import { ic, backLink, sortable, toast } from './ui.js';

const TAB_NAMES = { hoy: ['Hoy', 'i-hoy'], horario: ['Horario', 'i-hor'], fechas: ['Fechas', 'i-fec'], notas: ['Notas', 'i-not'], materias: ['Materias', 'i-asi'] };
const handle = name => `<button class="handle" aria-label="Mover ${esc(name)}. Usa las flechas arriba y abajo">${ic('i-drag')}</button>`;

export function render(el) {
  const hidden = new Set(D.prefs.homeHidden);
  const bname = k => HOME_BLOCKS.find(b => b[0] === k)[1];
  el.innerHTML = `
    <div class="topline">${backLink('#ajustes', 'Ajustes')}</div>
    <h1 class="h1">Organizar ${ic('i-grid', 'i fl')}</h1>
    <p class="small" style="margin-top:.4rem;line-height:1.45">Arrastra desde ${ic('i-drag', 'i mini')} para cambiar el orden.</p>

    <div class="sec">Pantalla «Hoy»</div>
    <div class="card list sortlist" data-list="home">${D.prefs.homeOrder.map(k => `
      <div class="item" data-id="${k}">${handle(bname(k))}<span class="grow">${bname(k)}</span>
        <button class="switch" role="switch" aria-checked="${!hidden.has(k)}" aria-label="Enseñar ${bname(k)}"><i></i></button></div>`).join('')}</div>

    <div class="sec">Barra de abajo</div>
    <div class="card list sortlist" data-list="tabs">${D.prefs.tabOrder.map(k => `
      <div class="item" data-id="${k}">${handle(TAB_NAMES[k][0])}${ic(TAB_NAMES[k][1])}<span class="grow">${TAB_NAMES[k][0]}</span></div>`).join('')}</div>

    ${D.subjects.length > 1 ? `<div class="sec">Asignaturas</div>
    <div class="card list sortlist" data-list="subs">${D.subjects.map(s => `
      <div class="item" data-id="${s.id}">${handle(s.name)}<span class="sq" style="background:${color(s.id)}"></span><span class="grow">${esc(s.name)}</span></div>`).join('')}</div>` : ''}
  `;
  sortable(el.querySelector('[data-list=home]'), ids => { D.prefs.homeOrder = ids; save(); });
  sortable(el.querySelector('[data-list=tabs]'), ids => { D.prefs.tabOrder = ids; save(); dispatchEvent(new Event('bea:tabs')); });
  const subs = el.querySelector('[data-list=subs]');
  if (subs) sortable(subs, ids => { D.subjects = ids.map(id => D.subjects.find(s => s.id === id)); save(); });
  el.querySelectorAll('[data-list=home] .switch').forEach(sw => sw.onclick = () => {
    const k = sw.closest('[data-id]').dataset.id;
    const on = sw.getAttribute('aria-checked') !== 'true';
    if (!on && D.prefs.homeOrder.length - D.prefs.homeHidden.length <= 1) { toast('Deja al menos un bloque'); return; }
    sw.setAttribute('aria-checked', on);
    D.prefs.homeHidden = on ? D.prefs.homeHidden.filter(x => x !== k) : [...D.prefs.homeHidden, k];
    save();
  });
}
