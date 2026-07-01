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

| Chave no código (`key`) | Exemplo de nome na planilha | Preço (R$) |
|---|---|---|
| `Garrafa Térmica Magsafe` | Garrafa Térmica Magsafe | 172,67 |
| `Garrafa Térmica Pro` | Garrafa Térmica Pro 750 | 132,67 |
| `Garrafa Térmica Fresh` | Garrafa Térmica Fresh 650ml / 950ml | 99,33 |
| `Garrafa Térmica Mini` | Garrafa Térmica Mini 350 | 86,60 |
| `Garrafa Térmica Urban` | Garrafa Térmica Urban | 72,67 |
| `Copo Térmico Life` | Copo Térmico Life 880ml / 1170ml | 126,00 |
| `Copo Térmico Cerveja` | Copo Térmico Cerveja | 92,67 |
| `Copo Térmico Vibe` | Copo Térmico Vibe | 92,67 |
| `Tote Daily` | Tote Daily | 146,00 |
| `Tote Mini` | Tote Mini | 146,00 |
| `Tote Pop` | Tote Pop | 132,67 |
| `Mala Trip` | Mala Trip | 332,59 |
| `Bolsa Joy Pro` | Bolsa Joy Pro | 159,33 |
| `Mala Joy` | Mala Joy | 159,33 |
| `Mochila Pop` | Mochila Pop | 132,67 |
| `Mochila Executiva` | Mochila Executiva | 179,33 |
| `Mochila Voyage` | Mochila Voyage | 259,33 |
| `Mochila Fun` | Mochila Fun | 219,33 |
| `Bolsa Moove` | Bolsa Moove | 139,33 |
| `Bolsa Térmica Fruit` | Bolsa Térmica Fruit / Bolsa Térmica Fruit Pro | 153,33 |
| `Lancheira Fruit` | Lancheira Fruit | 153,33 |
| `Bolsa Térmica Fun` | Bolsa Térmica Fun | 120,00 |
| `Necessaire Trip` | Necessaire Trip | 52,67 |
| `Capinha` | Capinha (fallback genérico) | 31,07 |

> **Ordem importa:** `Bolsa Joy Pro` antes de `Mala Joy`; `Bolsa Térmica Fruit` antes de entradas mais curtas; `Capinha` sempre por último.

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
