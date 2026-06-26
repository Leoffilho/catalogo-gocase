import { SELLERS } from './sellers.js';

// ── STATE ──
const state = {
  seller: SELLERS.find(s => s.email === 'leonardo.filho@gocase.com') || SELLERS[0],
  products: [],
  hasBanner: false,
};

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
  document.getElementById('edit-seller-name').value = state.seller.name;
  document.getElementById('edit-seller-email').value = state.seller.email;
  document.getElementById('edit-seller-phone').value = state.seller.phone || '';
  document.getElementById('modal-edit-seller').classList.remove('hidden');
}

export function saveEditSeller() {
  const name  = document.getElementById('edit-seller-name').value.trim();
  const email = document.getElementById('edit-seller-email').value.trim();
  const phone = document.getElementById('edit-seller-phone').value.trim().replace(/\D/g, '');

  if (!name || !email) {
    showToast('⚠ Preencha nome e e-mail');
    return;
  }

  // Update state (does not persist to SELLERS list — ephemeral override)
  state.seller = { name, email, phone };
  renderSellerInfo();
  document.getElementById('modal-edit-seller').classList.add('hidden');
  showToast('✓ Dados do vendedor atualizados');
}

function renderSellerInfo() {
  const { name, email, phone } = state.seller;

  // Navbar
  document.getElementById('seller-name-nav').textContent = name;

  // Catalog header
  document.getElementById('header-seller-name').textContent = name;
  const headerEmail = document.getElementById('header-email-link');
  headerEmail.href = 'mailto:' + email;
  headerEmail.querySelector('span').textContent = email;

  const headerWa = document.getElementById('header-wa-wrap');
  if (phone) {
    headerWa.style.display = '';
    const link = headerWa.querySelector('a');
    link.href = 'https://wa.me/' + phone;
    link.querySelector('span').textContent = formatPhone(phone);
  } else {
    headerWa.style.display = 'none';
  }

  // CTA bar
  document.getElementById('cta-seller-name').textContent = name;
  const ctaEmail = document.getElementById('cta-email-btn');
  ctaEmail.href = 'mailto:' + email;
  ctaEmail.querySelector('span').textContent = email;

  const ctaWa = document.getElementById('cta-wa-btn');
  if (phone) {
    ctaWa.style.display = '';
    ctaWa.href = 'https://wa.me/' + phone;
    ctaWa.querySelector('span').textContent = formatPhone(phone);
  } else {
    ctaWa.style.display = 'none';
  }
}

function formatPhone(phone) {
  // Try to format BR numbers: 55 + DDD + 9 digits
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const num = digits.slice(4);
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
    state.hasBanner = true;
    showCatalog();
  };
  reader.readAsDataURL(file);
}

// ── BACKGROUND COLOR ──
export function changeBg(input) {
  document.body.style.backgroundColor = input.value;
  document.getElementById('color-swatch').style.background = input.value;
}

// ── IMPORT SHEET ──
export function importSheet(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  let allProducts = [...state.products];
  let pending = files.length;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          rows.forEach(row => {
            const name  = findCol(row, ['nome do produto','nome','product','name','produto','description','descrição']);
            const team  = findCol(row, ['time','team','grupo','grupo de produto','categoria','category','marca']);
            const image = findCol(row, ['url da foto','url','foto','image','imagem','img','photo','link da imagem']);
            const sku   = findCol(row, ['sku','código','codigo','ref','referência','referencia']);
            const price = findCol(row, ['preço','preco','price','valor','pvp','preco de venda']);
            if (name) allProducts.push({ name, team: team || 'Geral', image, sku, price });
          });
        });
      } catch (err) {
        showToast('⚠ Erro ao ler ' + file.name);
      }
      pending--;
      if (pending === 0) {
        state.products = allProducts;
        renderProducts();
        showCatalog();
        showToast(`✓ ${allProducts.length} produtos importados`);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function findCol(row, keys) {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (rk.toLowerCase().trim() === k) return String(row[rk]).trim();
    }
  }
  return '';
}

// ── IMPORT FROM PASTE ──
export function importFromPaste() {
  const text = document.getElementById('paste-textarea').value.trim();
  if (!text) return;

  let products = [];
  try {
    const json = JSON.parse(text);
    const arr = Array.isArray(json) ? json : [json];
    arr.forEach(item => {
      const name = item.name || item.nome || '';
      if (name) {
        products.push({
          name,
          team:  item.team  || item.time  || 'Geral',
          image: item.image || item.foto  || item.url || '',
          sku:   item.sku   || '',
          price: item.price || item.preco || '',
        });
      }
    });
  } catch {
    const lines = text.split('\n').filter(l => l.trim());
    lines.forEach(line => {
      const cols = line.split(/\t|;/).map(c => c.trim());
      if (cols[0]) {
        products.push({ name: cols[0], team: cols[1] || 'Geral', image: cols[2] || '', sku: cols[3] || '', price: cols[4] || '' });
      }
    });
  }

  if (products.length) {
    state.products = [...state.products, ...products];
    renderProducts();
    showCatalog();
    document.getElementById('modal-paste').classList.add('hidden');
    document.getElementById('paste-textarea').value = '';
    showToast(`✓ ${products.length} produtos importados`);
  } else {
    showToast('⚠ Nenhum produto reconhecido no texto');
  }
}

// ── CLEAR PRODUCTS ──
export function clearProducts() {
  if (!state.products.length) return;
  if (!confirm('Remover todos os produtos importados?')) return;
  state.products = [];
  renderProducts();
  showToast('✓ Produtos removidos');
}

// ── RENDER ──
function renderProducts() {
  const section = document.getElementById('products-section');
  if (!state.products.length) { section.innerHTML = ''; return; }

  const teams = {};
  state.products.forEach(p => {
    const t = p.team || 'Geral';
    if (!teams[t]) teams[t] = [];
    teams[t].push(p);
  });

  section.innerHTML = Object.entries(teams).map(([team, prods]) => `
    <div class="products-team-group">
      <div class="team-heading">
        <span class="team-badge">${escHtml(team)}</span>
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
              <div class="product-name">${escHtml(p.name)}</div>
              ${p.sku   ? `<div class="product-sku">SKU: ${escHtml(p.sku)}</div>`   : ''}
              ${p.price ? `<div class="product-price">${escHtml(p.price)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function showCatalog() {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('catalog').style.display = 'block';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── GENERATE PDF ──
export async function generatePDF() {
  const catalog = document.getElementById('catalog');
  if (!catalog || catalog.style.display === 'none') {
    showToast('⚠ Importe produtos antes de gerar o PDF');
    return;
  }

  const btn   = document.getElementById('btn-pdf');
  const label = document.getElementById('btn-pdf-label');
  btn.disabled = true;
  label.textContent = 'Gerando…';

  try {
    const { jsPDF } = window.jspdf;

    const canvas = await html2canvas(catalog, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData   = canvas.toDataURL('image/jpeg', 0.92);
    const pageW     = 210;  // A4 mm
    const pageH     = 297;
    const imgW      = pageW;
    const imgH      = (canvas.height * pageW) / canvas.width;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let yOffset = 0;
    let remaining = imgH;

    while (remaining > 0) {
      if (yOffset > 0) pdf.addPage();

      // Clip the portion of the image for this page
      const srcY      = (yOffset / imgH) * canvas.height;
      const srcHeight = Math.min((pageH / imgH) * canvas.height, canvas.height - srcY);
      const sliceH    = (srcHeight / canvas.height) * imgH;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = srcHeight;
      sliceCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

      pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, sliceH);

      yOffset   += pageH;
      remaining -= pageH;
    }

    const sellerSlug = state.seller.name.split(' ')[0].toLowerCase();
    pdf.save(`catalogo-gocase-${sellerSlug}.pdf`);
    showToast('✓ PDF gerado com sucesso');
  } catch (err) {
    console.error(err);
    showToast('⚠ Erro ao gerar PDF. Tente novamente.');
  } finally {
    btn.disabled = false;
    label.textContent = 'Exportar PDF';
  }
}

// ── INIT ──
buildSellerOptions();
renderSellerInfo();

// Expose functions called from inline HTML attributes
window.updateSeller      = updateSeller;
window.uploadBanner      = uploadBanner;
window.changeBg          = changeBg;
window.importSheet       = importSheet;
window.importFromPaste   = importFromPaste;
window.clearProducts     = clearProducts;
window.openEditSeller    = openEditSeller;
window.saveEditSeller    = saveEditSeller;
window.generatePDF       = generatePDF;
