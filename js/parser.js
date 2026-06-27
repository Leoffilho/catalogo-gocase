// ── EBOOK STRIPPING (display only, data unchanged) ──
export function stripEbook(str) {
  return (str || '').replace(/\s*\+\s*ebook\b/gi, '').replace(/\s{2,}/g, ' ').trim();
}

// ── FIXED PRICE TABLE (sorted longest-key-first to avoid partial shadowing) ──
const PRICE_TABLE = [
  { key: 'Garrafa Magsafe',   price: '172.67' },
  { key: 'Garrafa Fresh 950', price: '106.60' },
  { key: 'Garrafa Fresh 650', price: '99.33'  },
  { key: 'Garrafa Pro',       price: '132.67' },
  { key: 'Garrafa Mini',      price: '86.60'  },
  { key: 'Garrafa Urban',     price: '72.67'  },
  { key: 'Copo Life 1170',    price: '139.33' },
  { key: 'Copo Life 880',     price: '126.00' },
  { key: 'Copo Vibe',         price: '92.67'  },
  { key: 'Tote Daily',        price: '146.00' },
  { key: 'Tote Mini',         price: '146.00' },
  { key: 'Tote Pop',          price: '132.67' },
  { key: 'Mala Trip',         price: '332.59' },
  { key: 'Mala Joy',          price: '159.33' },
  { key: 'Mochila Pop',       price: '132.67' },
  { key: 'Mochila Executiva', price: '179.33' },
  { key: 'Mochila Voyage',    price: '259.33' },
  { key: 'Mochila Fun',       price: '219.33' },
  { key: 'Bolsa Moove',       price: '139.33' },
  { key: 'Necessaire Trip',   price: '52.67'  },
  { key: 'Lancheira Fruit',   price: '153.33' },
  { key: 'Slim Air',          price: '22.22'  },
  { key: 'Infinite Air',      price: '31.07'  },
];

export function getPriceByProduct(produto, fallback, fullName) {
  const clean = stripEbook(produto || '').toLowerCase();
  for (const entry of PRICE_TABLE) {
    if (clean.includes(entry.key.toLowerCase())) return entry.price;
  }
  if (fullName) console.warn('[PREÇO NÃO MAPEADO]:', fullName);
  return fallback || '';
}

// ── COLOR HANDLING ──
export const COLOR_WORDS = [
  'Preta','Preto','Rosa','Branca','Branco','Azul',
  'Vermelha','Vermelho','Verde','Amarela','Amarelo',
  'Dourada','Dourado','Cinza','Bege','Lilás','Roxa','Roxo',
];

export const COLOR_HEX_MAP = {
  'Preta':'#1a1a1a','Preto':'#1a1a1a',
  'Rosa':'#f48fb1',
  'Branca':'#f5f5f0','Branco':'#f5f5f0',
  'Azul':'#1565c0',
  'Vermelha':'#c0392b','Vermelho':'#c0392b',
  'Verde':'#2e7d32',
  'Amarela':'#f9a825','Amarelo':'#f9a825',
  'Dourada':'#c8a951','Dourado':'#c8a951',
  'Cinza':'#9e9e9e',
  'Bege':'#d7ccc8',
  'Lilás':'#7b1fa2','Roxa':'#7b1fa2','Roxo':'#7b1fa2',
  'Padrão':'#e0e0e0',
};

const _colorPattern = `[\\s-]+(${COLOR_WORDS.join('|')})$`;

export function extractColor(str) {
  const match = (str || '').trim().match(new RegExp(_colorPattern, 'i'));
  if (!match) return null;
  // Return the canonical casing from COLOR_WORDS
  return COLOR_WORDS.find(c => c.toLowerCase() === match[1].toLowerCase()) || match[1];
}

export function stripColor(str) {
  return (str || '').trim().replace(new RegExp(_colorPattern, 'i'), '').trim();
}

// Known Gocase collection names — used to infer "Capinha" when name has only 2 parts
const KNOWN_COLLECTIONS = new Set([
  'Harry Potter', 'Friends', 'Warner', 'Disney', 'Marvel', 'Star Wars',
  'Stranger Things', 'Game of Thrones', 'Batman', 'Superman', 'Mulher Maravilha',
  'Liga da Justiça', 'Looney Tunes', 'Tom e Jerry', 'Scooby Doo',
  'Pernalonga', 'Space Jam', 'Esquadrão Suicida', 'The Flash',
  'Aquaman', 'Power Rangers', 'Mortal Kombat', 'Pokémon', 'Pikachu',
  'One Piece', 'Naruto', 'Dragon Ball', 'Attack on Titan',
  'Studio Ghibli', 'Totoro', 'Sailor Moon', 'Evangelion',
  'Breaking Bad', 'The Office', 'Grey\'s Anatomy', 'How I Met Your Mother',
  'Big Bang Theory', 'Sex and the City', 'Euphoria', 'Squid Game',
  'Wednesday', 'Bridgerton', 'Peaky Blinders',
  'Taylor Swift', 'BTS', 'Beyoncé', 'Lady Gaga', 'Ariana Grande',
  'Billie Eilish', 'Olivia Rodrigo', 'Bad Bunny',
  'Gocase', 'Pride', 'Lover', 'Vintage', 'Aesthetic', 'Botanical',
  'Floral', 'Tie Dye', 'Tumblr', 'Astrology', 'Zodiac',
  'Super Poderosas', 'Princesas', 'Toy Story', 'Frozen',
  'Lilo e Stitch', 'Winnie the Pooh', 'Alice', 'Bambi',
  'Bob Esponja', 'Patricinho', 'Sandy e Junior',
]);

// Expand known collections from imported data (call after each import)
export function learnCollections(names) {
  names.forEach(n => { if (n) KNOWN_COLLECTIONS.add(n); });
}

// Capitalizes first letter of each word
function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Parses "Produto - Coleção - Estampa" pattern
export function parseName(fullName) {
  if (!fullName) return { produto: '', colecao: '', estampa: '' };

  const parts = fullName.split(' - ').map(p => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    return {
      produto:  parts[0],
      colecao:  parts[1],
      estampa:  parts.slice(2).join(' - '),
    };
  }

  if (parts.length === 2) {
    const isKnown = KNOWN_COLLECTIONS.has(parts[0]);
    if (isKnown) {
      return { produto: 'Capinha', colecao: parts[0], estampa: parts[1] };
    }
    return { produto: parts[0], colecao: parts[1], estampa: '' };
  }

  return { produto: fullName, colecao: '', estampa: '' };
}

// Extracts collection from scraper URL
// e.g. https://www.gocase.com.br/collections/friends → "Friends"
// e.g. /t/collections/warner/super-poderosas → "Warner"
export function parseURL(url) {
  if (!url) return '';
  const match = url.match(/\/collections\/([^/?#]+)(?:\/([^/?#]+))?/);
  if (!match) return '';
  const colecao = titleCase(match[1].replace(/-/g, ' '));
  return colecao;
}

// Cleans price string to numeric string "89.90"
export function cleanPrice(raw) {
  if (!raw && raw !== 0) return '';
  const str = String(raw)
    .replace(/R\$\s*/gi, '')
    .replace(/\./g, '')   // remove thousand separators
    .replace(',', '.')    // decimal comma → dot
    .trim();
  const n = parseFloat(str);
  return isNaN(n) ? '' : n.toFixed(2);
}

// Detects format from first row
export function detectFormat(row) {
  const keys = Object.keys(row).map(k => k.toLowerCase().trim());
  return keys.includes('web_scraper_start_url') ? 'A' : 'B';
}

// Parses a single spreadsheet row into a product object
// Returns null if name is missing
export function parseRow(row, fonte) {
  const keys = Object.keys(row);

  function col(...names) {
    for (const n of names) {
      for (const k of keys) {
        if (k.toLowerCase().trim() === n) {
          const v = String(row[k] || '').trim();
          if (v) return v;
        }
      }
    }
    return '';
  }

  const format = detectFormat(row);
  const name   = col('name', 'nome', 'product', 'description', 'nome do produto', 'produto', 'descrição');
  if (!name) return null;

  const parsed = parseName(name);

  // Complement colecao from URL if not found in name
  if (!parsed.colecao && format === 'A') {
    const urlCol = col('web_scraper_start_url');
    parsed.colecao = parseURL(urlCol);
  }

  const rawPrice = col('price', 'price5', 'preço', 'preco', 'valor', 'pvp', 'preco de venda');
  const image    = col('image', 'imagem', 'img', 'foto', 'url da foto', 'url', 'photo', 'link da imagem');

  const dedup_key = name.trim().toLowerCase() + '|' + image.trim();

  return {
    id:          crypto.randomUUID(),
    name,
    produto:     parsed.produto  || 'Capinha',
    colecao:     parsed.colecao  || 'Geral',
    estampa:     parsed.estampa  || '',
    price:       cleanPrice(rawPrice),
    image,
    fonte:       fonte || '',
    importadoEm: new Date().toISOString(),
    dedup_key,
  };
}
