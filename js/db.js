const API = '';

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAllProducts() {
  const { rows } = await apiFetch('/api/products?all=1');
  return rows;
}

export async function countProducts() {
  const { total } = await apiFetch('/api/count');
  return total;
}

export async function addProducts(newProducts) {
  return apiFetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: newProducts }),
  });
}

export async function clearDB() {
  return apiFetch('/api/products', { method: 'DELETE' });
}

export async function clearDBByFranquia(franquia) {
  return apiFetch('/api/products/franquia', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ franquia }),
  });
}

export async function updateAllProducts() {
  // Não necessário com backend centralizado
  return;
}

export async function getDistinctValues(field) {
  const { values } = await apiFetch('/api/distinct?field=' + field);
  return values;
}

export async function queryProducts({ text='', produtos=[], colecoes=[], franquias=[], maxPrice=Infinity, page=1, pageSize=50 } = {}) {
  const params = new URLSearchParams({ page, pageSize });
  if (text)           params.set('text', text);
  if (franquias[0])   params.set('franquia', franquias[0]);
  if (produtos[0])    params.set('produto', produtos[0]);
  return apiFetch('/api/products?' + params);
}

export async function filterProducts({ text='', produtos=[], colecoes=[], franquias=[], maxPrice=Infinity } = {}) {
  const params = new URLSearchParams({ all: '1' });
  if (text)         params.set('text', text);
  if (franquias[0]) params.set('franquia', franquias[0]);
  if (produtos[0])  params.set('produto', produtos[0]);
  const { rows } = await apiFetch('/api/products?' + params);
  return rows;
}
