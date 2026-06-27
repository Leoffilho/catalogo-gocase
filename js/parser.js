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
