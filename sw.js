// Guarda la app en el iPhone para que funcione sin internet.
// Al cambiar cualquier archivo, sube VERSION para que se actualice.
const VERSION = 'planner-6';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'fonts/SpaceGrotesk.woff2',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/util.js', 'js/db.js', 'js/store.js', 'js/ui.js', 'js/parse.js',
  'js/hoy.js', 'js/cal.js', 'js/horario.js', 'js/fechas.js', 'js/materias.js', 'js/grades.js', 'js/notas.js',
  'js/files.js', 'js/editor.js', 'js/clean.js', 'js/add.js', 'js/ajustes.js', 'js/organizar.js', 'js/welcome.js', 'js/install.js', 'js/share.js',
];

self.addEventListener('install', e => {
  // cache: 'reload' para no guardar copias viejas que el navegador tuviera a mano.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match('index.html'))));
});
