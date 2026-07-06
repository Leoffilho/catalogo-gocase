import { SELLERS } from './sellers.js';
import { getAllProducts, addProducts, clearDB, countProducts, queryProducts, filterProducts, getDistinctValues, updateAllProducts } from './db.js';
import { parseRow, learnCollections, stripEbook, getPriceByProduct, getFranquia } from './parser.js';

// ── ADMIN CHECK ──
let _isAdmin = false;
async function checkAdmin() {
  try {
    const me = await fetch('/api/me').then(r => r.json());
    _isAdmin = me.isAdmin || false;
  } catch { _isAdmin = false; }

  const tabDB = document.querySelector('[data-tab="db"]');
  if (tabDB) tabDB.style.display = _isAdmin ? '' : 'none';

  if (_isAdmin) {
    const nav = document.querySelector('.navbar-sub');
    if (nav) {
      const badge = document.createElement('span');
      badge.textContent = ' 👑 Admin';
      badge.style.cssText = 'color:#e11d48;font-weight:700;font-size:11px';
      nav.appendChild(badge);
    }
  } else {
    const nav = document.querySelector('.tab-nav');
    if (nav) {
      const btn = document.createElement('button');
      btn.textContent = '🔐';
      btn.title = 'Login Admin';
      btn.style.cssText = 'border:none;background:transparent;cursor:pointer;font-size:16px;margin-left:auto;padding:8px 16px;opacity:0.3';
      btn.addEventListener('click', openAdminLogin);
      nav.appendChild(btn);
    }
  }
}

function openAdminLogin() {
  const senha = prompt('Senha de administrador:');
  if (!senha) return;
  fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: senha }),
    credentials: 'include',
  }).then(r => r.json()).then(data => {
    if (data.ok) {
      showToast('✓ Login realizado com sucesso');
      location.reload();
    } else {
      showToast('⚠ Senha incorreta');
    }
  }).catch(() => showToast('⚠ Erro ao fazer login'));
}

// ── STATE ──
const state = {
  seller: SELLERS.find(s => s.email === 'leonardo.filho@gocase.com') || SELLERS[0],
  activeTab: 'generator',
  // DB tab
  dbPage: 1,
  dbPageSize: 50,
  // Generator filters
  selectedCategorias: new Set(),
  selectedFranquias:  new Set(),
  selectedTipos:      new Set(),
  filterEstampa:  '',
  filterMaxPrice: Infinity,
  priceRangeMax:  500,
  filteredProducts: [],
};

// ── CATEGORIA MAP ──
const CATEGORIA_MAP = {
  'Térmicos': ['garrafa', 'copo', 'taça', 'térmica', 'térmico'],
  'Têxteis':  ['tote', 'mochila', 'bolsa', 'necessaire', 'lancheira', 'mala', 'bag'],
  'Capinhas': ['capinha', 'slim air', 'infinite air'],
};

// Têxteis tem prioridade: bolsa/tote/mochila com "térmica" no nome = só Têxteis
function getCategorias(produto) {
  const lower = (produto || '').toLowerCase();
  if (CATEGORIA_MAP['Têxteis'].some(k => lower.includes(k)))   return ['Têxteis'];
  if (CATEGORIA_MAP['Térmicos'].some(k => lower.includes(k)))  return ['Térmicos'];
  if (CATEGORIA_MAP['Capinhas'].some(k => lower.includes(k)))  return ['Capinhas'];
  return [];
}

// ── FRANQUIA COLOR MAP ──
const FRANQUIA_COLORS = {
  'Harry Potter':               '#7b1fa2',
  'Friends':                    '#f57c00',
  'Game of Thrones':            '#37474f',
  'House of the Dragon':        '#b71c1c',
  'Flamengo':                   '#b71c1c',
  'Palmeiras':                  '#1b5e20',
  'Corinthians':                '#212121',
  'Grêmio':                     '#1565c0',
  'As Meninas Super Poderosas': '#e91e63',
  'Warner':                     '#c43b00',
  'Outros':                     '#757575',
};

// ── TAB NAVIGATION ──
export function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + tab).classList.add('active');

  document.getElementById('actions-db').style.display        = tab === 'db'        ? '' : 'none';
  document.getElementById('actions-generator').style.display = tab === 'generator' ? '' : 'none';

  if (tab === 'db')        initDBScreen();
  if (tab === 'generator') initGeneratorScreen();
}

// ── SELLER ──
function buildSellerOptions() {
  const sel = document.getElementById('seller-select');
  SELLERS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.email;
    opt.textContent = s.name;
    if (s.email === state.seller.email) opt.selected = true;
    sel.appendChild(opt);
  });
}

export function updateSeller(selectEl) {
  state.seller = SELLERS.find(s => s.email === selectEl.value) || SELLERS[0];
  renderSellerInfo();
}

export function openEditSeller() {
  document.getElementById('edit-seller-name').value  = state.seller.name;
  document.getElementById('edit-seller-email').value = state.seller.email;
  document.getElementById('edit-seller-phone').value = state.seller.phone || '';
  document.getElementById('modal-edit-seller').classList.remove('hidden');
}

export function saveEditSeller() {
  const name  = document.getElementById('edit-seller-name').value.trim();
  const email = document.getElementById('edit-seller-email').value.trim();
  const phone = document.getElementById('edit-seller-phone').value.trim().replace(/\D/g, '');
  if (!name || !email) { showToast('⚠ Preencha nome e e-mail'); return; }
  state.seller = { name, email, phone };
  renderSellerInfo();
  document.getElementById('modal-edit-seller').classList.add('hidden');
  showToast('✓ Dados do vendedor atualizados');
}

function renderSellerInfo() {
  const { name, email, phone } = state.seller;
  document.getElementById('seller-name-nav').textContent    = name;
  document.getElementById('header-seller-name').textContent = name;
  document.getElementById('cta-seller-name').textContent    = name;

  const headerEmail = document.getElementById('header-email-link');
  headerEmail.href = 'mailto:' + email;
  headerEmail.querySelector('span').textContent = email;

  const ctaEmail = document.getElementById('cta-email-btn');
  ctaEmail.href = 'mailto:' + email;
  ctaEmail.querySelector('span').textContent = email;

  const headerWa = document.getElementById('header-wa-wrap');
  const ctaWa    = document.getElementById('cta-wa-btn');
  if (phone) {
    const waUrl = 'https://wa.me/' + phone;
    const disp  = formatPhone(phone);
    headerWa.style.display = '';
    headerWa.querySelector('a').href = waUrl;
    headerWa.querySelector('span').textContent = disp;
    ctaWa.style.display = '';
    ctaWa.href = waUrl;
    ctaWa.querySelector('span').textContent = disp;
  } else {
    headerWa.style.display = 'none';
    ctaWa.style.display    = 'none';
  }
}

function formatPhone(phone) {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('55') && d.length === 13) {
    const ddd = d.slice(2, 4), num = d.slice(4);
    return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
  }
  return phone;
}

// ── BANNER ──
export function uploadBanner(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('catalog-banner');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ── BACKGROUND COLOR ──
export function changeBg(input) {
  document.body.style.backgroundColor = input.value;
  document.getElementById('color-swatch').style.background = input.value;
}

// ── IMPORT TO DB ──
function askFranquia(filename) {
  return new Promise(resolve => {
    document.getElementById('modal-franquia-filename').textContent = filename;
    document.getElementById('modal-franquia-input').value = '';
    const modal    = document.getElementById('modal-franquia');
    const btnImport = document.getElementById('btn-franquia-import');
    const btnSkip   = document.getElementById('btn-franquia-skip');
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('modal-franquia-input').focus(), 50);

    function finish(val) {
      modal.classList.add('hidden');
      btnImport.removeEventListener('click', onImport);
      btnSkip.removeEventListener('click', onSkip);
      document.removeEventListener('keydown', onKey);
      resolve(val || null);
    }
    function onImport() { finish(document.getElementById('modal-franquia-input').value.trim()); }
    function onSkip()   { finish(null); }
    function onKey(e)   { if (e.key === 'Enter') onImport(); else if (e.key === 'Escape') onSkip(); }

    btnImport.addEventListener('click', onImport);
    btnSkip.addEventListener('click', onSkip);
    document.addEventListener('keydown', onKey);
  });
}

export async function importToDB(input) {
  if (!_isAdmin) { showToast('⚠ Sem permissão de admin'); return; }
  const files = Array.from(input.files);
  if (!files.length) return;

  const label = files.length > 1
    ? `${files.length} planilhas: ${files.map(f => f.name).join(', ')}`
    : files[0].name;
  const manualFranquia = await askFranquia(label);

  let totalAdded = 0, totalSkipped = 0;

  for (const file of files) {

    const data = await file.arrayBuffer();
    const wb   = XLSX.read(new Uint8Array(data), { type: 'array' });
    const parsed = [];

    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      rows.forEach(row => {
        const p = parseRow(row, file.name);
        if (p) {
          if (manualFranquia) p.franquia = manualFranquia;
          parsed.push(p);
        }
      });
    }

    learnCollections(parsed.map(p => p.colecao).filter(Boolean));

    const { added, skipped } = await addProducts(parsed);
    totalAdded   += added;
    totalSkipped += skipped;
  }

  showToast(`✓ ${totalAdded} adicionados • ${totalSkipped} já existiam`);
  await refreshDBStats();
  await renderDBFilters();
  await renderDBTable();
  await initGeneratorScreen();
  input.value = '';
}

// ── DB SCREEN ──
async function initDBScreen() {
  await refreshDBStats();
  await renderDBFilters();
  await renderDBTable();
}

async function refreshDBStats() {
  const count = await countProducts();
  document.getElementById('db-count').textContent = count.toLocaleString('pt-BR');
}

async function renderDBFilters() {
  const [franquias, tipos] = await Promise.all([
    getDistinctValues('franquia'),
    getDistinctValues('produto'),
  ]);

  const selFranquia = document.getElementById('db-filter-franquia');
  const selTipo     = document.getElementById('db-filter-tipo');
  const curF = selFranquia.value;
  const curT = selTipo.value;

  selFranquia.innerHTML = '<option value="">Todas as franquias</option>';
  franquias.forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    if (v === curF) o.selected = true;
    selFranquia.appendChild(o);
  });

  selTipo.innerHTML = '<option value="">Todos os tipos</option>';
  tipos.forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    if (v === curT) o.selected = true;
    selTipo.appendChild(o);
  });
}

export async function renderDBTable() {
  const text     = document.getElementById('db-search').value;
  const franquia = document.getElementById('db-filter-franquia').value;
  const tipo     = document.getElementById('db-filter-tipo').value;

  const { rows, total, page, pageSize, pages } = await queryProducts({
    text,
    franquias: franquia ? [franquia] : [],
    produtos:  tipo     ? [tipo]     : [],
    page: state.dbPage,
    pageSize: state.dbPageSize,
  });

  const tbody = document.getElementById('db-tbody');

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="db-empty">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"/></svg>
      Nenhum produto encontrado.
    </div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(p => {
      const displayPrice = getPriceByProduct(p.produto, p.price, null);
      const hasValidImg  = p.image && p.image.startsWith('http');
      return `
      <tr>
        <td class="thumb">
          ${hasValidImg
            ? `<img src="${escHtml(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.parentElement.innerHTML='<div class=no-thumb>📷</div>'" />`
            : `<div class="no-thumb" title="Sem URL de imagem">📷</div>`}
        </td>
        <td class="name-cell"><span class="truncate" title="${escHtml(p.name)}">${escHtml(stripEbook(p.name))}</span></td>
        <td class="meta-cell">${escHtml(p.produto)}</td>
        <td class="meta-cell">${escHtml(p.colecao)}</td>
        <td class="meta-cell"><span class="truncate" title="${escHtml(p.estampa)}">${escHtml(p.estampa)}</span></td>
        <td class="price-cell">${displayPrice ? 'R$ ' + formatBRL(displayPrice) : '—'}</td>
      </tr>`;
    }).join('');
  }

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  document.getElementById('db-pagination-info').textContent =
    total === 0 ? '' : `Mostrando ${start}–${end} de ${total.toLocaleString('pt-BR')} produtos`;

  document.getElementById('db-btn-prev').disabled = page <= 1;
  document.getElementById('db-btn-next').disabled = page >= pages;
}

export function dbPagePrev() {
  if (state.dbPage > 1) { state.dbPage--; renderDBTable(); }
}
export function dbPageNext() {
  state.dbPage++; renderDBTable();
}

export async function clearDBConfirm() {
  if (!_isAdmin) { showToast('⚠ Sem permissão de admin'); return; }
  const count = await countProducts();
  if (count === 0) { showToast('Banco já está vazio'); return; }
  if (!confirm(`Remover todos os ${count.toLocaleString('pt-BR')} produtos do banco? Esta ação não pode ser desfeita.`)) return;
  await clearDB();
  state.dbPage = 1;
  await refreshDBStats();
  await renderDBTable();
  await initGeneratorScreen();
  showToast('✓ Banco de dados limpo');
}

// ── GENERATOR SCREEN ──
async function initGeneratorScreen() {
  const count = await countProducts();

  const emptyEl = document.getElementById('generator-empty');
  const panelEl = document.getElementById('filter-panel');

  if (count === 0) {
    emptyEl.style.display  = 'block';
    panelEl.style.display  = 'none';
    document.getElementById('catalog').style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  panelEl.style.display = '';

  await renderGeneratorFilters();
  await applyFilters();

  const all = await getAllProducts();
  const prices = all.map(p => parseFloat(p.price)).filter(n => isFinite(n));
  if (prices.length) {
    const max = Math.ceil(Math.max(...prices) / 10) * 10;
    state.priceRangeMax = max;
    const slider = document.getElementById('filter-price-range');
    slider.max = max;
    slider.value = max;
    document.getElementById('filter-price-label').textContent = 'Sem limite';
    state.filterMaxPrice = Infinity;
  }
}

async function renderGeneratorFilters() {
  const [franquias, tipos] = await Promise.all([
    getDistinctValues('franquia'),
    getDistinctValues('produto'),
  ]);
  renderCategoriaChips();
  renderFranquiaChips(franquias);
  renderTipoChips(tipos);
}

function renderCategoriaChips() {
  const container = document.getElementById('chips-categoria');
  const categorias = [
    { nome: 'Térmicos', cor: '#0277bd' },
    { nome: 'Têxteis',  cor: '#558b2f' },
    { nome: 'Capinhas', cor: '#e11d48' },
  ];
  container.innerHTML = categorias.map(({ nome: c, cor: color }) => {
    const isActive = state.selectedCategorias.has(c);
    return `<button class="filter-chip chip-franquia ${isActive ? 'active' : ''}"
      data-value="${c}" style="--fc:${color}">${c}</button>`;
  }).join('');
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.selectedCategorias, btn.dataset.value);
      btn.classList.toggle('active', state.selectedCategorias.has(btn.dataset.value));
      applyFiltersDebounced();
    });
  });
}

function renderFranquiaChips(franquias) {
  const container = document.getElementById('chips-franquia');
  container.innerHTML = franquias.map(f => {
    const color    = FRANQUIA_COLORS[f] || '#757575';
    const isActive = state.selectedFranquias.has(f);
    return `<button class="filter-chip chip-franquia ${isActive ? 'active' : ''}"
      data-value="${escHtml(f)}" style="--fc:${color}">${escHtml(f)}</button>`;
  }).join('');
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.selectedFranquias, btn.dataset.value);
      btn.classList.toggle('active', state.selectedFranquias.has(btn.dataset.value));
      applyFiltersDebounced();
    });
  });
}

function renderTipoChips(tipos) {
  const container = document.getElementById('chips-tipo');
  container.innerHTML = tipos.map(t => {
    const isActive = state.selectedTipos.has(t);
    return `<button class="filter-chip ${isActive ? 'active' : ''}" data-value="${escHtml(t)}">${escHtml(t)}</button>`;
  }).join('');
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleSet(state.selectedTipos, btn.dataset.value);
      btn.classList.toggle('active', state.selectedTipos.has(btn.dataset.value));
      applyFiltersDebounced();
    });
  });
}

function toggleSet(set, value) {
  if (set.has(value)) set.delete(value); else set.add(value);
}

export function onPriceRange(input) {
  const val   = parseInt(input.value);
  const isMax = val >= state.priceRangeMax;
  state.filterMaxPrice = isMax ? Infinity : val;
  document.getElementById('filter-price-label').textContent = isMax ? 'Sem limite' : `R$ ${val}`;
  applyFiltersDebounced();
}

export function clearFilters() {
  state.selectedCategorias.clear();
  state.selectedFranquias.clear();
  state.selectedTipos.clear();
  state.filterEstampa  = '';
  state.filterMaxPrice = Infinity;
  document.getElementById('filter-estampa').value = '';
  const slider = document.getElementById('filter-price-range');
  slider.value = slider.max;
  document.getElementById('filter-price-label').textContent = 'Sem limite';
  renderGeneratorFilters();
  applyFilters();
}

let _debounceTimer;
export function applyFiltersDebounced() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(applyFilters, 300);
}

export async function applyFilters() {
  state.filterEstampa = document.getElementById('filter-estampa').value;

  let products = await filterProducts({
    text:      state.filterEstampa,
    franquias: [...state.selectedFranquias],
    produtos:  [...state.selectedTipos],
    maxPrice:  state.filterMaxPrice,
  });

  if (state.selectedCategorias.size > 0) {
    products = products.filter(p =>
      getCategorias(p.produto).some(c => state.selectedCategorias.has(c))
    );
  }

  state.filteredProducts = products;
  document.getElementById('filter-count-num').textContent = products.length.toLocaleString('pt-BR');
  renderProducts(products);
}

export function gerarCatalogo() {
  if (!state.filteredProducts.length) {
    showToast('⚠ Nenhum produto selecionado com os filtros atuais');
    return;
  }
  const catalog = document.getElementById('catalog');
  if (catalog.style.display === 'none') catalog.style.display = 'block';
  catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProductCard(p) {
  const price = getPriceByProduct(p.produto, p.price, p.name);
  const displayName    = escHtml(stripEbook(p.estampa || p.name));
  const displayProduto = escHtml(stripEbook(p.produto || ''));
  return `
    <div class="product-card">
      <div class="product-img-wrap">
        ${p.image
          ? `<img src="${escHtml(p.image)}" alt="${displayName}" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" onerror="this.parentElement.innerHTML='<span class=\\'no-img\\'>📷</span>'" />`
          : `<span class="no-img">📷</span>`}
      </div>
      <div class="product-info">
        <div class="product-name">${displayName}</div>
        ${displayProduto && displayProduto !== 'Capinha'
          ? `<div class="product-sku">${displayProduto}</div>` : ''}
        ${price ? `<div class="product-price">R$ ${formatBRL(price)}</div>` : ''}
      </div>
    </div>`;
}

// ── RENDER PRODUCTS ──
function renderProducts(products) {
  const section = document.getElementById('products-section');
  const catalog = document.getElementById('catalog');

  if (!products || !products.length) {
    section.innerHTML = '';
    catalog.style.display = 'none';
    return;
  }

  // Oculta produtos sem URL de imagem válida
  const withImage = products.filter(p => p.image && p.image.startsWith('http'));

  if (!withImage.length) {
    section.innerHTML = '';
    catalog.style.display = 'none';
    return;
  }

  catalog.style.display = 'block';

  // Agrupa por tipo de produto
  const groups = {};
  withImage.forEach(p => {
    const key = stripEbook(p.produto || '') || 'Outros';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  // Grupos em ordem alfabética; dentro de cada grupo ordena por estampa
  const sortedEntries = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([tipo, prods]) => [
      tipo,
      prods.sort((a, b) => (a.estampa || a.name || '').localeCompare(b.estampa || b.name || '', 'pt-BR')),
    ]);

  section.innerHTML = sortedEntries.map(([tipo, prods]) => `
      <div class="products-team-group">
        <div class="team-heading">
          <span class="team-badge">${escHtml(tipo.toUpperCase())}</span>
          <span class="team-count">${prods.length} produto${prods.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="products-grid">
          ${prods.map(p => renderProductCard(p)).join('')}
        </div>
      </div>`).join('');

  const togglePrecos = document.getElementById('toggle-precos');
  if (togglePrecos && !togglePrecos.checked) {
    document.querySelectorAll('.product-price').forEach(el => { el.style.display = 'none'; });
  }
}

// ── CATÁLOGO ANÔNIMO ──
export function toggleAnonimo(checkbox) {
  const hidden = checkbox.checked;
  document.getElementById('catalog-header-block').style.display = hidden ? 'none' : '';
  document.getElementById('cta-bar-footer').style.display       = hidden ? 'none' : '';
}

// ── TOGGLE PREÇOS ──
export function togglePrecos(checkbox) {
  const mostrar = checkbox.checked;
  document.querySelectorAll('.product-price').forEach(el => {
    el.style.display = mostrar ? '' : 'none';
  });
}

// ── GENERATE PDF ──
export async function generatePDF() {
  const catalog = document.getElementById('catalog');
  if (!catalog || catalog.style.display === 'none') {
    showToast('⚠ Gere o catálogo antes de exportar o PDF');
    return;
  }

  const btn   = document.getElementById('btn-pdf');
  const label = document.getElementById('btn-pdf-label');
  btn.disabled = true;
  label.textContent = 'Gerando…';

  try {
    const { jsPDF } = window.jspdf;
    const bgColor = document.body.style.backgroundColor || '#ffffff';
    const canvas = await html2canvas(catalog, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: bgColor, logging: false,
    });

    const imgW  = 210;
    const imgH  = (canvas.height * imgW) / canvas.width;
    const pageH = 297;
    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let yOffset = 0, remaining = imgH;
    while (remaining > 0) {
      if (yOffset > 0) pdf.addPage();
      const srcY      = (yOffset / imgH) * canvas.height;
      const srcHeight = Math.min((pageH / imgH) * canvas.height, canvas.height - srcY);
      const sliceH    = (srcHeight / canvas.height) * imgH;
      const slice     = document.createElement('canvas');
      slice.width  = canvas.width;
      slice.height = srcHeight;
      slice.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, sliceH);
      yOffset   += pageH;
      remaining -= pageH;
    }

    const slug = state.seller.name.split(' ')[0].toLowerCase();
    const blob = pdf.output('blob');
    const url  = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    showToast('✓ PDF gerado com sucesso');
  } catch (err) {
    console.error(err);
    showToast('⚠ Erro ao gerar PDF. Tente novamente.');
  } finally {
    btn.disabled = false;
    label.textContent = 'Exportar PDF';
  }
}

// ── UTILS ──
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatBRL(price) {
  const n = parseFloat(price);
  if (isNaN(n)) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── INIT ──
buildSellerOptions();
renderSellerInfo();

(async () => {
  await checkAdmin();
  switchTab('generator');
})();

// Expose to inline HTML event handlers
window.switchTab             = switchTab;
window.updateSeller          = updateSeller;
window.openEditSeller        = openEditSeller;
window.saveEditSeller        = saveEditSeller;
window.uploadBanner          = uploadBanner;
window.changeBg              = changeBg;
window.importToDB            = importToDB;
window.renderDBTable         = renderDBTable;
window.dbPagePrev            = dbPagePrev;
window.dbPageNext            = dbPageNext;
window.clearDBConfirm        = clearDBConfirm;
window.onPriceRange          = onPriceRange;
window.clearFilters          = clearFilters;
window.applyFiltersDebounced = applyFiltersDebounced;
window.gerarCatalogo         = gerarCatalogo;
window.generatePDF           = generatePDF;
window.toggleAnonimo         = toggleAnonimo;
window.togglePrecos          = togglePrecos;
