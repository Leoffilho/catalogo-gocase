// ── EBOOK STRIPPING (display only, data unchanged) ──
export function stripEbook(str) {
  return (str || '').replace(/\s*\+\s*ebook\b/gi, '').replace(/\s{2,}/g, ' ').trim();
}

const PRICE_TABLE = [
  { key: 'Garrafa Térmica Magsafe',   price: '172.67' },
  { key: 'Garrafa Térmica Flip Pro',  price: '132.67' },
  { key: 'Garrafa Térmica Pro',       price: '132.67' },
  { key: 'Garrafa Térmica Fresh 950', price: '106.60' },
  { key: 'Garrafa Térmica Fresh 650', price: '99.33'  },
  { key: 'Garrafa Térmica Fresh',     price: '99.33'  },
  { key: 'Garrafa Térmica Mini',      price: '86.60'  },
  { key: 'Garrafa Térmica Urban',     price: '72.67'  },
  { key: 'Copo Térmico Life 1170',    price: '139.33' },
  { key: 'Copo Térmico Life 880',     price: '126.00' },
  { key: 'Copo Térmico Life',         price: '139.33' },
  { key: 'Copo Térmico Cerveja',      price: '92.67'  },
  { key: 'Copo Térmico Vibe',         price: '92.67'  },
  { key: 'Copo Térmico',             price: '92.67'  },
  { key: 'Tote Puffer',              price: '179.33' },
  { key: 'Tote Daily',               price: '146.00' },
  { key: 'Tote Mini',                price: '146.00' },
  { key: 'Tote Pop',                 price: '132.67' },
  { key: 'Mala Trip',                price: '332.59' },
  { key: 'Mala Joy',                 price: '159.33' },
  { key: 'Bolsa Joy Pro',            price: '159.33' },
  { key: 'Bolsa Voyage',             price: '259.33' },
  { key: 'Bolsa de Garrafa',         price: '94.43'  },
  { key: 'Mochila Executiva',        price: '179.33' },
  { key: 'Mochila Voyage',           price: '259.33' },
  { key: 'Mochila Fun',              price: '219.33' },
  { key: 'Mochila Pop',              price: '132.67' },
  { key: 'Bolsa Térmica Fruit',      price: '153.33' },
  { key: 'Bolsa Térmica Fun',        price: '120.00' },
  { key: 'Bolsa Moove',              price: '139.33' },
  { key: 'Necessaire Puffer',        price: '39.93'  },
  { key: 'Necessaire Makeup',        price: '72.67'  },
  { key: 'Necessaire Trip',          price: '52.67'  },
  { key: 'Lancheira Fruit',          price: '153.33' },
  { key: 'Capinha',                  price: '31.07'  },
];

const PRICE_TABLE_LISOS = [
  { key: 'Garrafa Térmica Magsafe',   price: '152.67' },
  { key: 'Garrafa Térmica Flip Pro',  price: '119.33' },
  { key: 'Garrafa Térmica Pro',       price: '119.33' },
  { key: 'Garrafa Térmica Fresh 950', price: '93.27'  },
  { key: 'Garrafa Térmica Fresh 650', price: '86.60'  },
  { key: 'Garrafa Térmica Fresh',     price: '86.60'  },
  { key: 'Garrafa Térmica Mini',      price: '73.27'  },
  { key: 'Garrafa Térmica Urban',     price: '59.93'  },
  { key: 'Copo Térmico Life 1170',    price: '126.00' },
  { key: 'Copo Térmico Life 880',     price: '112.67' },
  { key: 'Copo Térmico Life',         price: '126.00' },
  { key: 'Copo Térmico Vibe',         price: '79.33'  },
  { key: 'Copo Térmico',             price: '79.33'  },
  { key: 'Tote Puffer',              price: '179.33' },
  { key: 'Tote Daily',               price: '132.67' },
  { key: 'Tote Pop',                 price: '119.33' },
  { key: 'Tote Mini',                price: '126.00' },
  { key: 'Mala Trip',                price: '317.78' },
  { key: 'Mala Joy',                 price: '146.00' },
  { key: 'Bolsa Joy Pro',            price: '146.00' },
  { key: 'Bolsa Voyage',             price: '246.00' },
  { key: 'Bolsa de Garrafa',         price: '84.43'  },
  { key: 'Mochila Pop',              price: '119.33' },
  { key: 'Mochila Executiva',        price: '159.33' },
  { key: 'Mochila Voyage',           price: '246.00' },
  { key: 'Bolsa Moove',              price: '119.33' },
  { key: 'Bolsa Térmica Fruit',      price: '153.33' },
  { key: 'Necessaire Makeup',        price: '72.67'  },
  { key: 'Necessaire Trip',          price: '46.60'  },
  { key: 'Necessaire Puffer',        price: '39.93'  },
  { key: 'Lancheira Fruit',          price: '133.27' },
];

export function getPriceByProduct(produto, fallback) {
  const canonical = PRODUTO_ALIASES[produto] || produto;
  const clean = stripEbook(canonical || '').toLowerCase();
  for (const entry of PRICE_TABLE) {
    if (clean.includes(entry.key.toLowerCase())) return entry.price;
  }
  return fallback || '';
}

export function getPriceByProductLisa(produto, fallback) {
  const canonical = PRODUTO_ALIASES[produto] || produto;
  const clean = stripEbook(canonical || '').toLowerCase();
  for (const entry of PRICE_TABLE_LISOS) {
    if (clean.includes(entry.key.toLowerCase())) return entry.price;
  }
  return fallback || '';
}

// ── FRANQUIA DETECTION ──
const FRANQUIA_MAP = [
  { franquia: 'Harry Potter', keywords: ['harry potter', 'hogwarts', 'grifinória', 'grifinoria', 'sonserina', 'lufa-lufa', 'lufa lufa', 'corvinal', 'dumbledore', 'hermione', 'voldemort', 'dobby', 'edwiges', 'butterbeer', 'honey dukes', 'plataforma 9', 'relíquias da morte', 'expecto patronum', 'câmara secreta'] },
  { franquia: 'Friends', keywords: ['friends', 'central perk', 'monica', 'rachel', 'chandler', 'joey', 'ross', 'phoebe', 'lobster'] },
  { franquia: 'Game of Thrones', keywords: ['game of thrones', 'stark', 'lannister', 'targaryen', 'daenerys', 'jon snow', 'tyrion', 'arya', 'cersei', 'westeros', 'winter is coming', 'dracarys', 'iron throne'] },
  { franquia: 'House of the Dragon', keywords: ['house of the dragon', 'house of dragon', 'hotd', 'rhaenyra', 'daemon', 'caraxes', 'syrax', 'dragonstone', 'alicent', 'vhagar'] },
  { franquia: 'Flamengo', keywords: ['flamengo', 'mengão', 'urubu'] },
  { franquia: 'Palmeiras', keywords: ['palmeiras', 'verdão', 'porco'] },
  { franquia: 'Corinthians', keywords: ['corinthians', 'timão', 'sccp'] },
  { franquia: 'Grêmio', keywords: ['grêmio', 'gremio', 'tricolor gaúcho'] },
  { franquia: 'As Meninas Super Poderosas', keywords: ['super poderosas', 'powerpuff', 'docinho', 'florzinha', 'lindinha', 'buttercup', 'blossom', 'bubbles'] },
  { franquia: 'Warner', keywords: ['warner'] },
];

export function getFranquia(name) {
  const lower = (name || '').toLowerCase();
  for (const entry of FRANQUIA_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.franquia;
  }
  return 'Outros';
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
  return COLOR_WORDS.find(c => c.toLowerCase() === match[1].toLowerCase()) || match[1];
}

export function stripColor(str) {
  return (str || '').trim().replace(new RegExp(_colorPattern, 'i'), '').trim();
}

// Produtos conhecidos — do mais específico para o mais genérico (sem sort em runtime)
const KNOWN_PRODUTO_KEYS = [
  'Garrafa Térmica Magsafe',
  'Garrafa Térmica Flip Pro',
  'Garrafa Térmica Fresh 950',
  'Garrafa Térmica Fresh 650',
  'Garrafa Térmica Fresh',
  'Garrafa Térmica Mini',
  'Garrafa Térmica Urban',
  'Garrafa Magsafe',
  'Garrafa Flip Pro',
  'Garrafa Fresh 950',
  'Garrafa Fresh 650',
  'Garrafa Fresh',
  'Garrafa Mini',
  'Garrafa Urban',
  'Copo Térmico Life 1170',
  'Copo Térmico Life 880',
  'Copo Térmico Life',
  'Copo Térmico Cerveja',
  'Copo Térmico Vibe',
  'Copo Térmico',
  'Copo Life 1170',
  'Copo Life 880',
  'Copo Life',
  'Copo Vibe',
  'Tote Puffer',
  'Tote Puff',
  'Tote Daily',
  'Tote Mini',
  'Tote Pop',
  'Mala Trip',
  'Mala Joy',
  'Bolsa Joy Pro',
  'Bolsa Joy',
  'Bolsa Voyage',
  'Bolsa de Garrafa',
  'Bolsa Térmica Fruit Pro',
  'Bolsa Térmica Fruit',
  'Bolsa Térmica Fun',
  'Bolsa Moove',
  'Mochila Executiva',
  'Mochila Voyage',
  'Mochila Fun',
  'Mochila Pop',
  'Necessaire Makup Double',
  'Necessaire Makeup Double',
  'Necessaire Makeup',
  'Necessaire Puffer',
  'Necessaire Trip',
  'Lancheira Fruit',
];

// Mapeia aliases (nomes curtos ou com erros de digitação) para o nome canônico,
// garantindo que getPriceByProduct encontre o preço correto na PRICE_TABLE.
const PRODUTO_ALIASES = {
  'Garrafa Flip Pro':        'Garrafa Térmica Flip Pro',
  'Garrafa Magsafe':         'Garrafa Térmica Magsafe',
  'Garrafa Fresh 950':       'Garrafa Térmica Fresh 950',
  'Garrafa Fresh 650':       'Garrafa Térmica Fresh 650',
  'Garrafa Fresh':           'Garrafa Térmica Fresh',
  'Garrafa Mini':            'Garrafa Térmica Mini',
  'Garrafa Urban':           'Garrafa Térmica Urban',
  'Copo Life 1170':          'Copo Térmico Life 1170',
  'Copo Life 880':           'Copo Térmico Life 880',
  'Copo Life':               'Copo Térmico Life',
  'Copo Vibe':               'Copo Térmico Vibe',
  'Tote Puff':               'Tote Puffer',
  'Bolsa Joy':               'Bolsa Joy Pro',
  'Bolsa Térmica Fruit Pro': 'Bolsa Térmica Fruit',
  'Necessaire Makup Double': 'Necessaire Makeup',
  'Necessaire Makeup Double':'Necessaire Makeup',
};

// Retorna o nome canônico do produto ou null.
// Remove apenas a unidade de medida preservando o número: "650ml" → "650".
// Usa a ordem de KNOWN_PRODUTO_KEYS diretamente (mais específico primeiro).
function matchProduto(str) {
  const normalized = (str || '').trim()
    .replace(/(\d+)\s*(ml|l|kg|g)\s*$/i, '$1')
    .trim();
  const lower = normalized.toLowerCase();
  for (const key of KNOWN_PRODUTO_KEYS) {
    if (lower.startsWith(key.toLowerCase())) return PRODUTO_ALIASES[key] || key;
  }
  return null;
}

// Stub mantido para não quebrar imports em app.js
export function learnCollections() {}

// Capitalizes first letter of each word
function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Parses "Produto - Coleção - Estampa" pattern
export function parseName(fullName) {
  if (!fullName) return { produto: 'Capinha', colecao: '', estampa: '' };

  const parts = fullName.split(' - ').map(p => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    const produtoMatch = matchProduto(parts[0]);
    return {
      produto: produtoMatch || 'Capinha',
      colecao: produtoMatch ? parts[1] : parts[0],
      estampa: produtoMatch ? parts.slice(2).join(' - ') : parts.slice(1).join(' - '),
    };
  }

  if (parts.length === 2) {
    const produtoMatch = matchProduto(parts[0]);
    if (produtoMatch) {
      return { produto: produtoMatch, colecao: parts[1], estampa: '' };
    }
    // Primeira parte não é produto conhecido → é coleção, produto é Capinha
    return { produto: 'Capinha', colecao: parts[0], estampa: parts[1] };
  }

  // Nome sem hífen → estampa de capinha
  return { produto: 'Capinha', colecao: '', estampa: fullName };
}

// Extracts collection from scraper URL
export function parseURL(url) {
  if (!url) return '';
  const match = url.match(/\/collections\/([^/?#]+)(?:\/([^/?#]+))?/);
  if (!match) return '';
  return titleCase(match[1].replace(/-/g, ' '));
}

// Cleans price string to numeric string "89.90"
// Handles both Brazilian format (1.234,56) and international format (1234.56)
export function cleanPrice(raw) {
  if (!raw && raw !== 0) return '';
  let str = String(raw).replace(/R\$\s*/gi, '').trim();
  if (str.includes(',')) {
    // Brazilian format: dots are thousand separators, comma is decimal
    str = str.replace(/\./g, '').replace(',', '.');
  }
  // No comma → dot is already the decimal separator (international format)
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

  // Formato Lisa: nome sem hífen e que bate diretamente com produto conhecido
  // Ex: "Garrafa Fresh 650ml", "Tote Daily", "Copo Life 1170ml"
  const hasHifen     = name.includes(' - ');
  const produtoMatch = matchProduto(name);

  let parsed;
  if (!hasHifen && produtoMatch) {
    parsed = { produto: produtoMatch, colecao: 'Geral', estampa: '' };
  } else {
    parsed = parseName(name);
    if (!parsed.colecao && format === 'A') {
      parsed.colecao = parseURL(col('web_scraper_start_url'));
    }
  }

  const rawPrice = col('price', 'price5', 'preço', 'preco', 'valor', 'pvp', 'preco de venda');
  const image    = col('image', 'imagem', 'img', 'foto', 'url da foto', 'url', 'photo', 'link da imagem');

  const dedup_key = name.trim().toLowerCase() + '|' + image.trim();

  return {
    id:          crypto.randomUUID(),
    name,
    produto:     stripEbook(parsed.produto  || 'Capinha'),
    colecao:     parsed.colecao  || 'Geral',
    estampa:     parsed.estampa  || '',
    price:       cleanPrice(rawPrice),
    image,
    franquia:    getFranquia(name),
    fonte:       fonte || '',
    importadoEm: new Date().toISOString(),
    dedup_key,
  };
}
