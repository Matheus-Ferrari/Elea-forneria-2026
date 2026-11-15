/*
 * Monta as páginas do site (mesmo padrão do projeto Cucina): junta cabeçalho e rodapé
 * (fonte/partes/) com cada página (fonte/paginas/**.html) e grava em site/.
 *
 *   node ferramentas/montar-paginas.mjs            monta tudo
 *   node ferramentas/montar-paginas.mjs --observar remonta a cada mudança em fonte/
 *
 * Cada página começa com um bloco de configuração:
 *   ---
 *   titulo: Encomendas · Elea Forneria
 *   descricao: Texto para o Google
 *   ativo: encomendas          (link do menu marcado)
 *   scripts: loja              (arquivos de /assets/js, carregados como módulo)
 *   noindex: sim               (opcional)
 *   ---
 * Atalhos no HTML: {{icone:nome}} {{icone:nome:classes}} {{logo:creme|caramelo:tamanho}}
 *                  {{whatsapp:mensagem}} {{ano}}
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, watch } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = join(RAIZ, "fonte");
const SAIDA = join(RAIZ, "site");

// CONFIRMAR com a Elea: número herdado do WordPress (2025), usado em reservas e encomendas.
export const WHATSAPP = "5511945099155";
// true = pede ao Google para não indexar (site em teste). Trocar para false na publicação.
const EM_TESTE = true;

const ICONES = {
  carrinho: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  usuario: '<circle cx="12" cy="8" r="4.5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  conversa: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "seta-direita": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  "seta-esquerda": '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  menos: '<path d="M5 12h14"/>',
  mais: '<path d="M5 12h14M12 5v14"/>',
  lixo: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  local: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  navegacao: '<path d="m3 11 19-9-9 19-2-8-8-2Z"/>',
  calendario: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  trofeu: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  taca: '<path d="M8 22h8M12 15v7M7 2h10l-.6 6.4A4.4 4.4 0 0 1 12 12.5a4.4 4.4 0 0 1-4.4-4.1Z"/>',
  email: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
};

export const icone = (nome, classe = "icone") =>
  `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nome] || ""}</svg>`;

// Logo OFICIAL (círculo com as mãos). Só recolorido a partir de "Logo elea fundo branco.jpg".
const logo = (cor = "creme", tam = 54) =>
  `<img src="/assets/img/brand/logo-elea-${cor}.png" alt="Elea Forneria" width="${tam}" height="${tam}">`;

const whatsapp = (msg) => `https://wa.me/${WHATSAPP}` + (msg ? "?text=" + encodeURIComponent(msg) : "");

function atalhos(html) {
  return html
    .replace(/\{\{icone:([\w-]+)(?::([^}]+))?\}\}/g, (_, n, c) => icone(n, c || "icone"))
    .replace(/\{\{logo:([\w-]+)(?::(\d+))?\}\}/g, (_, c, t) => logo(c, t || 54))
    .replace(/\{\{whatsapp:([^}]*)\}\}/g, (_, m) => whatsapp(m))
    .replace(/\{\{ano\}\}/g, String(new Date().getFullYear()));
}

// Caminhos RELATIVOS na saída: o site funciona igual na raiz (Firebase, Live Server) e numa subpasta
// (GitHub Pages: usuario.github.io/repositorio/). Todas as páginas ficam na raiz de site/.
// Na fonte pode continuar escrevendo "/assets/...", "/cardapio.html", "/#visite".
const relativos = (html) => html
  .replace(/(href|src|poster|action)="\/(?=["#])/g, '$1="./') // "/" e "/#ancora" -> "./" e "./#ancora"
  .replace(/(href|src|poster|action)="\/(?!\/)/g, '$1="')     // "/assets/x" -> "assets/x"
  .replace(/url\((['"]?)\/(?!\/)/g, "url($1");                // style="--foto: url('/assets/...')"

function lerPagina(arquivo) {
  const bruto = readFileSync(arquivo, "utf8").replace(/\r\n/g, "\n").replace(/^﻿/, "");
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (m) for (const linha of m[1].split("\n")) {
    const i = linha.indexOf(":");
    if (i > 0) meta[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  }
  return { meta, corpo: m ? bruto.slice(m[0].length) : bruto };
}

// Menu da referência aprovada (Home · Cardápio · Quem Somos · Local e Horários · Vagas) + Encomendas (loja).
// Cardápio e Quem Somos são páginas próprias; Vagas está no rodapé de todas as páginas (#vagas).
// "Reservar" fica no cabeçalho (fonte/partes/cabecalho.html).
const LINKS = [
  ["home", "Home", "/"],
  ["cardapio", "Cardápio", "/cardapio.html"],
  ["quem-somos", "Quem Somos", "/quem-somos.html"],
  ["visite", "Local e Horários", "/#visite"],
  ["vagas", "Vagas", "#vagas"],
  ["encomendas", "Encomendas", "/encomendas.html"],
];

function montar(arquivo) {
  const { meta, corpo } = lerPagina(arquivo);
  const caminho = relative(join(FONTE, "paginas"), arquivo).replace(/\\/g, "/");
  const scripts = ["site", ...(meta.scripts || "").split(/\s+/).filter(Boolean)];
  const vars = {
    titulo: meta.titulo || "Elea Forneria · Trattoria na Água Fria, São Paulo",
    descricao: meta.descricao || "Trattoria contemporânea na Zona Norte de São Paulo: massas frescas, pizzas de forno, vinhos e focaccias por encomenda.",
    robots: EM_TESTE || meta.noindex === "sim" ? '<meta name="robots" content="noindex">' : "",
    imagem: meta.imagem || "/assets/img/hero/fachada-noite.webp",
    aviso: `<!-- Gerado por ferramentas/montar-paginas.mjs a partir de fonte/paginas/${caminho}. Edite lá, não aqui. -->`,
    links: LINKS.map(([k, r, h]) => `<a href="${h}"${meta.ativo === k ? ' aria-current="page"' : ""}>${r}</a>`).join("\n        "),
    scripts: scripts.map((s) => `<script type="module" src="/assets/js/${s}.js"></script>`).join("\n"),
    // botão flutuante de WhatsApp: só nas páginas públicas (não em conta/admin, que são noindex)
    flutuante: meta.noindex === "sim" ? "" : '<a class="whats-flutuante" href="{{whatsapp:Olá, Elea! Vim pelo site.}}" target="_blank" rel="noopener" aria-label="Falar com a Elea no WhatsApp">{{icone:conversa}}<span>WhatsApp</span></a>',
  };
  const preencher = (t) => t.replace(/\{\{(\w+)\}\}/g, (todo, k) => (k in vars ? vars[k] : todo));
  const html = ["cabecalho", null, "rodape"]
    .map((p) => preencher(p ? readFileSync(join(FONTE, "partes", p + ".html"), "utf8") : corpo))
    .join("");
  const destino = join(SAIDA, caminho);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, relativos(atalhos(html)).replace(/\r\n/g, "\n"));
  return caminho;
}

const arquivos = (pasta) => readdirSync(pasta).flatMap((n) => {
  const c = join(pasta, n);
  return statSync(c).isDirectory() ? arquivos(c) : n.endsWith(".html") ? [c] : [];
});

function tudo() {
  const feitas = arquivos(join(FONTE, "paginas")).map(montar);
  writeFileSync(join(SAIDA, "robots.txt"), EM_TESTE ? "User-agent: *\nDisallow: /\n" : "User-agent: *\nDisallow: /admin\nDisallow: /conta\n");
  console.log(`${feitas.length} páginas montadas em site/: ${feitas.join(", ")}${EM_TESTE ? " (modo teste: noindex)" : ""}`);
}

tudo();
if (process.argv.includes("--observar")) {
  console.log("Observando fonte/ ... (Ctrl+C para parar)");
  let espera;
  watch(FONTE, { recursive: true }, () => {
    clearTimeout(espera);
    espera = setTimeout(() => { try { tudo(); } catch (e) { console.error(e.message); } }, 150);
  });
}
