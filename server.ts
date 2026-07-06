function isAdminToken(request: Request, env: any): boolean {
  const cookie = request.headers.get('cookie') || '';
  const match  = cookie.match(/admin_token=([^;]+)/);
  if (!match) return false;
  return match[1] === env.ADMIN_TOKEN;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
function err(msg: string, status = 400) { return json({ error: msg }, status); }

async function initDB(env: any) {
  await env.DB.exec(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, produto TEXT, colecao TEXT,
    estampa TEXT, price TEXT, image TEXT, franquia TEXT, linha TEXT,
    fonte TEXT, importadoEm TEXT, dedup_key TEXT UNIQUE
  )`, []);
  // Migração: adiciona coluna linha se não existir (bancos criados antes desta versão)
  try { await env.DB.exec(`ALTER TABLE products ADD COLUMN linha TEXT DEFAULT ''`, []); } catch {}
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    await initDB(env);
    const url = new URL(request.url), path = url.pathname, method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }});

    if (path === '/api/me' && method === 'GET') {
      return json({ isAdmin: isAdminToken(request, env) });
    }

    if (path === '/api/admin-login' && method === 'POST') {
      const body = await request.json() as { password: string };
      if (body.password === env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `admin_token=${env.ADMIN_TOKEN}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      return err('Senha incorreta', 401);
    }

    if (path === '/api/count' && method === 'GET') {
      const r = await env.DB.query('SELECT COUNT(*) as total FROM products', []);
      return json({ total: r.rows[0]?.total || 0 });
    }

    if (path === '/api/distinct' && method === 'GET') {
      const field = url.searchParams.get('field') || '';
      if (!['franquia','produto','colecao'].includes(field)) return err('Campo inválido');
      const r = await env.DB.query(
        `SELECT DISTINCT ${field} FROM products WHERE ${field} IS NOT NULL AND ${field} != '' ORDER BY ${field} COLLATE NOCASE ASC`, []
      );
      return json({ values: r.rows.map((row: any) => row[field]) });
    }

    if (path === '/api/products' && method === 'GET') {
      const text = url.searchParams.get('text') || '';
      const franquia = url.searchParams.get('franquia') || '';
      const produto  = url.searchParams.get('produto') || '';
      const page     = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
      const all      = url.searchParams.get('all') === '1';

      let sql = 'SELECT * FROM products WHERE 1=1';
      const params: string[] = [];
      if (text) {
        sql += ' AND (name LIKE ? OR produto LIKE ? OR colecao LIKE ? OR estampa LIKE ? OR franquia LIKE ?)';
        const like = `%${text}%`;
        params.push(like, like, like, like, like);
      }
      if (franquia) { sql += ' AND franquia = ?'; params.push(franquia); }
      if (produto)  { sql += ' AND produto = ?';  params.push(produto);  }
      sql += ' ORDER BY produto COLLATE NOCASE ASC, estampa COLLATE NOCASE ASC';

      const countRes = await env.DB.query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
      const total = countRes.rows[0]?.total || 0;

      if (!all) { sql += ' LIMIT ? OFFSET ?'; params.push(String(pageSize), String((page-1)*pageSize)); }
      const result = await env.DB.query(sql, params);
      return json({ rows: result.rows, total, page, pageSize, pages: Math.ceil(total/pageSize) });
    }

    if (path === '/api/products' && method === 'POST') {
      if (!isAdminToken(request, env)) return err('Não autorizado', 403);
      const body = await request.json() as { products: any[] };
      let added = 0, skipped = 0;
      for (const p of body.products) {
        try {
          await env.DB.exec(
            `INSERT INTO products (id,name,produto,colecao,estampa,price,image,franquia,linha,fonte,importadoEm,dedup_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [p.id,p.name,p.produto,p.colecao,p.estampa,p.price,p.image,p.franquia,p.linha||'',p.fonte,p.importadoEm,p.dedup_key]
          );
          added++;
        } catch { skipped++; }
      }
      return json({ added, skipped });
    }

    if (path === '/api/products' && method === 'DELETE') {
      if (!isAdminToken(request, env)) return err('Não autorizado', 403);
      await env.DB.exec('DELETE FROM products', []);
      return json({ ok: true });
    }

    if (path === '/api/products/franquia' && method === 'DELETE') {
      if (!isAdminToken(request, env)) return err('Não autorizado', 403);
      const body = await request.json() as { franquia: string };
      if (!body.franquia) return err('Franquia não informada');
      const result = await env.DB.exec('DELETE FROM products WHERE franquia = ?', [body.franquia]);
      return json({ deleted: result.rowsWritten });
    }

    return new Response('Not found', { status: 404 });
  },
};
