// Guardado en el propio iPhone (IndexedDB). Nada sale del teléfono.
// «kv» guarda los datos; «blobs» guarda fotos y audios (como bytes + tipo,
// porque Safari antiguo fallaba al guardar Blob directamente).

let dbp, dbo = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open('beastudio', 1);  // nombre antiguo: no cambiarlo o se perderían los datos
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore('kv'); d.createObjectStore('blobs'); };
    r.onsuccess = () => { dbo = r.result; res(r.result); };
    r.onerror = () => rej(r.error);
  });
  return dbp;
}

// Si la base ya está abierta, la escritura empieza en el acto (importa al cerrar la app:
// esperar aunque sea un instante podía dejar el último cambio sin guardar).
function tx(store, mode, fn) {
  if (dbo) return run(dbo, store, mode, fn);
  return db().then(d => run(d, store, mode, fn));
}
function run(d, store, mode, fn) {
  return new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req ? req.result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}

export const kvGet = k => tx('kv', 'readonly', s => s.get(k));
export const kvSet = (k, v) => tx('kv', 'readwrite', s => s.put(v, k));

export async function blobPut(id, blob) {
  const buf = await blob.arrayBuffer();
  await tx('blobs', 'readwrite', s => s.put({ type: blob.type, buf }, id));
}
export async function blobGet(id) {
  const r = await tx('blobs', 'readonly', s => s.get(id));
  return r ? new Blob([r.buf], { type: r.type }) : null;
}
export const blobRaw = id => tx('blobs', 'readonly', s => s.get(id));
export const blobRawPut = (id, raw) => tx('blobs', 'readwrite', s => s.put(raw, id));
export const blobDel = id => tx('blobs', 'readwrite', s => s.delete(id));
export const blobKeys = () => tx('blobs', 'readonly', s => s.getAllKeys());
export async function clearAll() {
  await tx('kv', 'readwrite', s => s.clear());
  await tx('blobs', 'readwrite', s => s.clear());
}

// Direcciones temporales para enseñar fotos y audios.
const urls = new Map();
// Tras cambiar una foto (girarla o recortarla) hay que olvidar su dirección vieja.
export function blobUrlFresh(id) {
  const old = urls.get(id);
  if (old) { URL.revokeObjectURL(old); urls.delete(id); }
  return blobUrl(id);
}
export async function blobUrl(id) {
  if (urls.has(id)) return urls.get(id);
  const b = await blobGet(id);
  if (!b) return '';
  const u = URL.createObjectURL(b);
  urls.set(id, u);
  return u;
}
