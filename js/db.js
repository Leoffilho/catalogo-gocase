// IndexedDB wrapper for persistent product storage
const DB_NAME = 'gocase_catalog';
const DB_VERSION = 1;
const STORE = 'products';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('colecao',   'colecao',   { unique: false });
        store.createIndex('produto',   'produto',   { unique: false });
        store.createIndex('dedup_key', 'dedup_key', { unique: true });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

export async function getAllProducts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const req   = tx.objectStore(STORE).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

export async function countProducts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// Returns { added, skipped }
export async function addProducts(newProducts) {
  const db = await openDB();
  let added = 0;
  let skipped = 0;

  for (const p of newProducts) {
    await new Promise(resolve => {
      const tx  = db.transaction(STORE, 'readwrite');
      const req = tx.objectStore(STORE).add(p);
      req.onsuccess = () => { added++;   resolve(); };
      req.onerror   = () => { skipped++; resolve(); }; // ConstraintError = duplicate
    });
  }

  return { added, skipped };
}

export async function clearDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

export async function getDistinctValues(field) {
  const all = await getAllProducts();
  const seen = new Set();
  all.forEach(p => { if (p[field]) seen.add(p[field]); });
  return [...seen].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Paged query with optional filters
// filters: { text, produto, colecao, maxPrice }
export async function queryProducts({ text = '', produtos = [], colecoes = [], maxPrice = Infinity, page = 1, pageSize = 50 } = {}) {
  const all = await getAllProducts();

  const lower = text.toLowerCase();
  const filtered = all.filter(p => {
    if (lower && ![p.name, p.produto, p.colecao, p.estampa].some(f => (f || '').toLowerCase().includes(lower))) return false;
    if (produtos.length  && !produtos.includes(p.produto))  return false;
    if (colecoes.length  && !colecoes.includes(p.colecao))  return false;
    const pr = parseFloat(p.price);
    if (isFinite(maxPrice) && isFinite(pr) && pr > maxPrice) return false;
    return true;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const rows  = filtered.slice(start, start + pageSize);
  return { rows, total, page, pageSize, pages: Math.ceil(total / pageSize) };
}

// For catalog generator: all matching products (no pagination)
export async function filterProducts({ text = '', produtos = [], colecoes = [], maxPrice = Infinity } = {}) {
  const all = await getAllProducts();
  const lower = text.toLowerCase();
  return all.filter(p => {
    if (lower && ![p.name, p.produto, p.colecao, p.estampa].some(f => (f || '').toLowerCase().includes(lower))) return false;
    if (produtos.length  && !produtos.includes(p.produto))  return false;
    if (colecoes.length  && !colecoes.includes(p.colecao))  return false;
    const pr = parseFloat(p.price);
    if (isFinite(maxPrice) && isFinite(pr) && pr > maxPrice) return false;
    return true;
  });
}
