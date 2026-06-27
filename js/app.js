import { SELLERS } from './sellers.js';
import { getAllProducts, addProducts, clearDB, countProducts, queryProducts, filterProducts, getDistinctValues } from './db.js';
import { parseRow, learnCollections } from './parser.js';

// ── STATE ──
const state = {
  seller: SELLERS.find(s => s.email === 'leonardo.filho@gocase.com') || SELLERS[0],
  activeTab: 'generator',
  // DB tab
  dbPage: 1,
  dbPageSize: 50,
  // Generator filters
  selectedProdutos: new Set(),
  selectedColecoes: new Set(),
  filterEstampa: '',
  filterMaxPrice: Infinity,
  priceRangeMax: 500,
  filteredProducts: [],
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
export async function importToDB(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  let totalAdded = 0, totalSkipped = 0;

  for (const file of files) {
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(new Uint8Array(data), { type: 'array' });
    const parsed = [];

    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      rows.forEach(row => {
        const p = parseRow(row, file.name);
        if (p) parsed.push(p);
      });
    }

    // Learn collections from this batch for future inference
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
  const [produtos, colecoes] = await Promise.all([
    getDistinctValues('produto'),
    getDistinctValues('colecao'),
  ]);

  const selProduto = document.getElementById('db-filter-produto');
  const selColecao = document.getElementById('db-filter-colecao');
  const curP = selProduto.value;
  const curC = selColecao.value;

  selProduto.innerHTML = '<option value="">Todos os produtos</option>';
  produtos.forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    if (v === curP) o.selected = true;
    selProduto.appendChild(o);
  });

  selColecao.innerHTML = '<option value="">Todas as coleções</option>';
  colecoes.forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v;
    if (v === curC) o.selected = true;
    selColecao.appendChild(o);
  });
}

export async function renderDBTable() {
  const text    = document.getElementById('db-search').value;
  const produto = document.getElementById('db-filter-produto').value;
  const colecao = document.getElementById('db-filter-colecao').value;

  const { rows, total, page, pageSize, pages } = await queryProducts({
    text,
    produtos: produto ? [produto] : [],
    colecoes: colecao ? [colecao] : [],
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
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td class="thumb">
          ${p.image
            ? `<img src="${escHtml(p.image)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=no-thumb>📦</div>'" />`
            : `<div class="no-thumb">📦</div>`}
        </td>
        <td class="name-cell"><span class="truncate" title="${escHtml(p.name)}">${escHtml(p.name)}</span></td>
        <td class="meta-cell">${escHtml(p.produto)}</td>
        <td class="meta-cell">${escHtml(p.colecao)}</td>
        <td class="meta-cell"><span class="truncate" title="${escHtml(p.estampa)}">${escHtml(p.estampa)}</span></td>
        <td class="price-cell">${p.price ? 'R$ ' + escHtml(p.price) : '—'}</td>
      </tr>
    `).join('');
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

  const emptyEl  = document.getElementById('generator-empty');
  const panelEl  = document.getElementById('filter-panel');

  if (count === 0) {
    emptyEl.style.display  = 'block';
    panelEl.style.display  = 'none';
    document.getElementById('catalog').style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  panelEl.style.display = '';

  await renderFilterChips();
  await applyFilters();

  // Set price range max from data
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

async function renderFilterChips() {
  const [produtos, colecoes] = await Promise.all([
    getDistinctValues('produto'),
    getDistinctValues('colecao'),
  ]);

  renderChips('chips-produto', produtos, state.selectedProdutos, v => {
    toggleSet(state.selectedProdutos, v);
    applyFiltersDebounced();
  });

  renderChips('chips-colecao', colecoes, state.selectedColecoes, v => {
    toggleSet(state.selectedColecoes, v);
    applyFiltersDebounced();
  });
}

function renderChips(containerId, values, selectedSet, onClick) {
  const container = document.getElementById(containerId);
  container.innerHTML = values.map(v => `
    <button class="filter-chip ${selectedSet.has(v) ? 'active' : ''}" data-value="${escHtml(v)}">
      ${escHtml(v)}
    </button>
  `).join('');
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      onClick(btn.dataset.value);
      btn.classList.toggle('active', selectedSet.has(btn.dataset.value));
    });
  });
}

function toggleSet(set, value) {
  if (set.has(value)) set.delete(value); else set.add(value);
}

export function onPriceRange(input) {
  const val = parseInt(input.value);
  const isMax = val >= state.priceRangeMax;
  state.filterMaxPrice = isMax ? Infinity : val;
  document.getElementById('filter-price-label').textContent = isMax ? 'Sem limite' : `R$ ${val}`;
  applyFiltersDebounced();
}

export function clearFilters() {
  state.selectedProdutos.clear();
  state.selectedColecoes.clear();
  state.filterEstampa  = '';
  state.filterMaxPrice = Infinity;
  document.getElementById('filter-estampa').value   = '';
  const slider = document.getElementById('filter-price-range');
  slider.value = slider.max;
  document.getElementById('filter-price-label').textContent = 'Sem limite';
  renderFilterChips();
  applyFilters();
}

let _debounceTimer;
export function applyFiltersDebounced() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(applyFilters, 300);
}

export async function applyFilters() {
  state.filterEstampa = document.getElementById('filter-estampa').value;

  const products = await filterProducts({
    text:     state.filterEstampa,
    produtos: [...state.selectedProdutos],
    colecoes: [...state.selectedColecoes],
    maxPrice: state.filterMaxPrice,
  });

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

// ── RENDER PRODUCTS ──
function renderProducts(products) {
  const section = document.getElementById('products-section');
  const catalog = document.getElementById('catalog');

  if (!products || !products.length) {
    section.innerHTML = '';
    catalog.style.display = 'none';
    return;
  }

  catalog.style.display = 'block';

  // Group by colecao
  const groups = {};
  products.forEach(p => {
    const key = p.colecao || p.team || 'Geral';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  section.innerHTML = Object.entries(groups).map(([group, prods]) => `
    <div class="products-team-group">
      <div class="team-heading">
        <span class="team-badge">${escHtml(group)}</span>
        <span class="team-count">${prods.length} produto${prods.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="products-grid">
        ${prods.map(p => `
          <div class="product-card">
            <div class="product-img-wrap">
              ${p.image
                ? `<img src="${escHtml(p.image)}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=no-img>📦</span>'" />`
                : `<span class="no-img">📦</span>`}
            </div>
            <div class="product-info">
              <div class="product-name">${escHtml(p.estampa || p.name)}</div>
              ${p.produto && p.produto !== 'Capinha' ? `<div class="product-sku">${escHtml(p.produto)}</div>` : ''}
              ${p.price ? `<div class="product-price">R$ ${escHtml(p.price)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
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
    const canvas = await html2canvas(catalog, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', logging: false,
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
    pdf.save(`catalogo-gocase-${slug}.pdf`);
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

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── INIT ──
buildSellerOptions();
renderSellerInfo();
switchTab('generator');

// Expose to inline HTML event handlers
window.switchTab            = switchTab;
window.updateSeller         = updateSeller;
window.openEditSeller       = openEditSeller;
window.saveEditSeller       = saveEditSeller;
window.uploadBanner         = uploadBanner;
window.changeBg             = changeBg;
window.importToDB           = importToDB;
window.renderDBTable        = renderDBTable;
window.dbPagePrev           = dbPagePrev;
window.dbPageNext           = dbPageNext;
window.clearDBConfirm       = clearDBConfirm;
window.onPriceRange         = onPriceRange;
window.clearFilters         = clearFilters;
window.applyFiltersDebounced = applyFiltersDebounced;
window.gerarCatalogo        = gerarCatalogo;
window.generatePDF          = generatePDF;
