/*
 * Página de encomendas: catálogo e "lista de encomenda" (gaveta).
 * Nesta etapa NÃO há checkout, login nem pagamento online: a lista só monta uma mensagem
 * para combinar a encomenda com a equipe pelo WhatsApp (canal de config.js). Nada é salvo
 * como pedido; a encomenda só vale depois que a equipe responde e confirma.
 * (O fluxo com conta, pedido salvo e painel fica para uma etapa futura: docs/EVOLUCOES_FUTURAS.md.)
 */
import { dados, modo } from "./dados.js";
import { PRODUTOS_INICIAIS } from "./produtos-iniciais.js";
import { lerCarrinho, mudarQtd, reais, esc } from "./carrinho.js";
import { ENCOMENDA, WHATSAPP } from "./config.js";
import { toast } from "./site.js";

const $ = (s) => document.querySelector(s);
const grade = $("[data-produtos]");
const gaveta = $("#carrinho");
const corpo = $("[data-gaveta-corpo]");
const rodape = $("[data-gaveta-rodape]");
const titulo = $("[data-gaveta-titulo]");
let produtos = [];

const ICONE_CONVERSA = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';
const horas = ENCOMENDA.antecedenciaHoras;

const mapa = () => new Map(produtos.map((p) => [p.id, p]));
const itensCarrinho = () => lerCarrinho().map((i) => ({ ...mapa().get(i.id), qtd: i.qtd })).filter((i) => i.nome);
const total = (itens) => itens.reduce((s, i) => s + i.preco * i.qtd, 0);
const whatsapp = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

// Mensagem pronta para o WhatsApp: só pede para combinar (não é pedido confirmado)
function mensagem(itens) {
  if (!itens.length) return `Olá, Elea! Gostaria de fazer uma encomenda de focaccia/tortano. Podemos combinar? (Sei que é preciso pedir com pelo menos ${horas}h de antecedência.)`;
  return [
    "Olá, Elea! Gostaria de encomendar:",
    ...itens.map((i) => `${i.qtd}x ${i.nome}`),
    "",
    `Podemos combinar o dia e o horário de retirada? (Sei que é preciso pedir com pelo menos ${horas}h de antecedência.)`,
  ].join("\n");
}

function controleQtd(id, qtd, rotulo) {
  return `<div class="qtd" role="group" aria-label="Quantidade de ${esc(rotulo)}">
    <button type="button" data-qtd="${esc(id)}" data-delta="-1" aria-label="Diminuir">−</button><output>${qtd}</output>
    <button type="button" data-qtd="${esc(id)}" data-delta="1" aria-label="Aumentar">+</button></div>`;
}

function renderProdutos() {
  const naLista = new Map(lerCarrinho().map((i) => [i.id, i.qtd]));
  grade.innerHTML = produtos.map((p) => {
    const q = naLista.get(p.id) || 0;
    return `<article class="produto">
      <div class="produto__img">${p.imagem ? `<img src="${esc(p.imagem)}" alt="" loading="lazy">` : `<span>${esc(p.nome)}</span>`}</div>
      <div class="produto__corpo">
        <h3>${esc(p.nome)}</h3><p>${esc(p.descricao)}</p>
        <div class="produto__rodape"><span class="preco">${reais(p.preco)}<span class="preco__nota" title="Valor sujeito à confirmação">*</span></span>
          ${q ? controleQtd(p.id, q, p.nome) : `<button class="btn btn--primario btn--pequeno" type="button" data-qtd="${esc(p.id)}" data-delta="1">Adicionar</button>`}
        </div>
      </div></article>`;
  }).join("") || '<p class="vazio">Nenhum item disponível para encomenda no momento.</p>';
}

/* ---------- Gaveta (lista de encomenda) ---------- */
function abrir() {
  renderGaveta();
  gaveta.classList.add("is-aberta");
  gaveta.setAttribute("aria-hidden", "false");
  $(".gaveta-fundo").classList.add("is-aberto");
  gaveta.querySelector("[data-fechar-gaveta]").focus();
}
function fechar() {
  gaveta.classList.remove("is-aberta");
  gaveta.setAttribute("aria-hidden", "true");
  $(".gaveta-fundo").classList.remove("is-aberto");
  if (location.hash) history.replaceState(null, "", location.pathname);
}

function renderGaveta() {
  const itens = itensCarrinho();
  titulo.textContent = "Sua lista de encomenda";
  if (!itens.length) {
    corpo.innerHTML = '<p class="vazio">Sua lista está vazia.<br>Escolha uma focaccia ou o tortano para começar.</p>';
    rodape.innerHTML = `<a class="btn btn--contorno btn-largo" href="${whatsapp(mensagem([]))}" target="_blank" rel="noopener">${ICONE_CONVERSA}Falar com a equipe pelo WhatsApp</a>`;
    return;
  }
  corpo.innerHTML = itens.map((i) => `<div class="item-carrinho">
      ${i.imagem ? `<img class="item-carrinho__foto" src="${esc(i.imagem)}" alt="" width="64" height="64" loading="lazy">` : '<span class="item-carrinho__foto" aria-hidden="true"></span>'}
      <div><strong>${esc(i.nome)}</strong><br><small>${reais(i.preco)} cada*</small></div>
      <div>${controleQtd(i.id, i.qtd, i.nome)}</div></div>`).join("");
  rodape.innerHTML = `<div class="total"><span>Total estimado*</span><span>${reais(total(itens))}</span></div>
    <a class="btn btn--primario btn-largo" href="${whatsapp(mensagem(itens))}" target="_blank" rel="noopener">${ICONE_CONVERSA}Combinar pelo WhatsApp</a>
    <p class="gaveta__nota">A encomenda só fica confirmada depois do retorno da equipe, que combina valores, pagamento e horário de retirada (mínimo de ${horas}h de antecedência).</p>
    <p class="gaveta__nota">*Valores sujeitos à confirmação no momento do pedido.</p>`;
}

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const q = e.target.closest("[data-qtd]");
  if (q) {
    const delta = Number(q.dataset.delta);
    mudarQtd(q.dataset.qtd, delta);
    if (delta > 0 && !gaveta.classList.contains("is-aberta")) toast("Adicionado à sua lista de encomenda");
    return;
  }
  if (e.target.closest("[data-fechar-gaveta]")) return fechar();
  const link = e.target.closest('a[href$="#carrinho"]');
  if (link) { e.preventDefault(); abrir(); }
});
addEventListener("keydown", (e) => { if (e.key === "Escape" && gaveta.classList.contains("is-aberta")) fechar(); });
addEventListener("carrinho", () => { renderProdutos(); renderGaveta(); });

// Catálogo: com o banco ligado, vem do Firestore; sem ele, da lista oficial do projeto (produtos-iniciais.js).
const listar = () => (modo === "firebase"
  ? dados.listarProdutos()
  : Promise.resolve(PRODUTOS_INICIAIS.filter((p) => p.ativo).sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99))));

(async () => {
  try { produtos = await listar(); } catch (e) { console.error(e); grade.innerHTML = '<p class="aviso aviso--erro">Não foi possível carregar os produtos agora.</p>'; return; }
  renderProdutos();
  if (location.hash === "#carrinho" || location.hash === "#finalizar") abrir();
})();
