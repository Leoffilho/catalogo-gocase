# Gerador de Catálogo Gocase — Revenda

Ferramenta web para geração de catálogos de revenda em PDF, usada pela equipe comercial da Gocase.

## Funcionalidades

- **Seletor de vendedor** — lista completa de revendedores Gocase com nome, e-mail e WhatsApp
- **Edição de dados** — personaliza nome, e-mail e telefone diretamente no catálogo
- **Upload de banner** — imagem de capa customizada por campanha
- **Importação de planilha** — lê arquivos CSV, XLS ou XLSX com colunas flexíveis
- **Importação por clipboard** — cola texto tabulado (copiado do Sheets/Excel) ou JSON
- **Cor de fundo** — color picker para personalizar o background do catálogo
- **Produtos agrupados por time** — cards com foto, SKU e preço, organizados por categoria
- **Condições Comerciais** — prazos, garantia e formas de pagamento sempre exibidos
- **CTA bar** — link direto para e-mail e WhatsApp do revendedor
- **Exportação PDF** — usa o print nativo do navegador com estilos otimizados para impressão

## Formato de planilha esperado

| Coluna (aceita variações) | Exemplos de cabeçalho |
|---|---|
| Nome do produto | `nome do produto`, `nome`, `product`, `description` |
| Time / Categoria | `time`, `team`, `categoria`, `marca` |
| URL da foto | `url da foto`, `url`, `imagem`, `foto`, `image` |
| SKU | `sku`, `código`, `ref` |
| Preço | `preço`, `preco`, `price`, `valor` |

## Hospedagem

O projeto é uma **SPA estática** (HTML + CSS + JS) — sem build step, sem dependências de servidor.

### GitHub Pages (automático)

1. Faça push para a branch `main`
2. No repositório GitHub: **Settings → Pages → Source → GitHub Actions**
3. O workflow `.github/workflows/deploy.yml` faz o deploy automaticamente a cada push

### Testar localmente

```bash
# Qualquer servidor HTTP serve — exemplos:
npx serve .
python -m http.server 8080
```

> Não abra `index.html` diretamente no navegador (file://) — os módulos ES6 requerem um servidor HTTP.

## Estrutura

```
catalogo-gocase/
├── index.html              # Estrutura principal
├── css/
│   └── styles.css          # Todos os estilos
├── js/
│   ├── app.js              # Lógica da aplicação (ES module)
│   └── sellers.js          # Lista de vendedores e telefones
└── .github/
    └── workflows/
        └── deploy.yml      # Deploy automático para GitHub Pages
```

## Adicionar telefone de vendedor

Edite [`js/sellers.js`](js/sellers.js) e preencha o campo `phone` no formato internacional sem espaços:

```js
{ name: 'Nome Vendedor', email: 'nome@gocase.com', phone: '5511912345678' },
```
