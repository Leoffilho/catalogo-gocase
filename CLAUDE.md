# Catálogo Gocase — Instruções para o Claude Code

## Visão Geral

SPA estática (HTML + CSS + JS sem build) que gera catálogos PDF de revenda para a equipe comercial da Gocase. Sem framework, sem bundler — módulos ES6 nativos.

## Estrutura de Arquivos

```
index.html          — UI principal
css/styles.css      — todos os estilos
js/app.js           — lógica da aplicação (ES module)
js/parser.js        — parsing de planilhas + tabela de preços
js/sellers.js       — lista de revendedores (nome, e-mail, telefone)
```

## Tabela de Preços (`js/parser.js`)

O matching é feito via `String.includes()` (case-insensitive), então as chaves são substrings dos nomes reais. As entradas mais específicas devem vir primeiro para evitar falsos positivos.

| Chave no código (`key`) | Nome real do produto na planilha | Preço (R$) |
|---|---|---|
| `Garrafa Magsafe` | Garrafa Magsafe | 172,67 |
| `Garrafa Fresh 950` | Garrafa Fresh 950ml | 106,60 |
| `Garrafa Fresh 650` | Garrafa Fresh 650ml | 99,33 |
| `Garrafa Pro` | Garrafa Pro 750 | 132,67 |
| `Garrafa Mini` | Garrafa Mini 350 | 86,60 |
| `Garrafa Urban` | Garrafa Urban | 72,67 |
| `Copo Life 1170` | Copo Life 1170ml | 139,33 |
| `Copo Life 880` | Copo Life 880ml | 126,00 |
| `Copo Vibe` | Copo Vibe | 92,67 |
| `Tote Daily` | Tote Daily | 146,00 |
| `Tote Mini` | Tote Mini | 146,00 |
| `Tote Pop` | Tote Pop | 132,67 |
| `Mala Trip` | Mala Trip | 332,59 |
| `Mala Joy` | Mala Joy | 159,33 |
| `Mochila Pop` | Mochila Pop | 132,67 |
| `Mochila Executiva` | Mochila Executiva | 179,33 |
| `Mochila Voyage` | Mochila Voyage | 259,33 |
| `Mochila Fun` | Mochila Fun | 219,33 |
| `Bolsa Moove` | Bolsa Moove | 139,33 |
| `Necessaire Trip` | Necessaire Trip | 52,67 |
| `Lancheira Fruit` | Lancheira Fruit | 153,33 |
| `Slim Air` | Slim Air | 22,22 |
| `Infinite Air` | Infinite Air | 31,07 |

> **Ordem importa:** `Garrafa Fresh 950` antes de `Garrafa Fresh 650`, `Copo Life 1170` antes de `Copo Life 880`, `Mochila Executiva`/`Voyage`/`Fun` antes de `Mochila Pop`.

## Tarefas Comuns

### Atualizar preço de um produto
Edite a entrada correspondente em `js/parser.js` → `PRICE_TABLE`.

### Adicionar novo vendedor
Edite `js/sellers.js` e adicione no formato:
```js
{ name: 'Nome Vendedor', email: 'nome@gocase.com', phone: '5511912345678' },
```

### Testar localmente
```bash
npx serve .
# ou
python -m http.server 8080
```
Não abrir `index.html` direto via `file://` — módulos ES6 requerem servidor HTTP.

### Deploy
Push para `main` → GitHub Actions faz deploy automático para GitHub Pages.
