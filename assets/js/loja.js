/* Página de encomendas: catálogo, carrinho (gaveta) e finalização com retirada agendada. */
import { dados, modo, codigoPedido, erroAmigavel } from "./dados.js";
import { lerCarrinho, mudarQtd, limparCarrinho, reais, esc } from "./carrinho.js";
import { ENCOMENDA, WHATSAPP } from "./config.js";
import { toast } from "./site.js";

const $ = (s) => document.querySelector(s);
const grade = $("[data-produtos]");
const gaveta = $("#carrinho");
const corpo = $("[data-gaveta-corpo]");
const rodape = $("[data-gaveta-rodape]");
const titulo = $("[data-gaveta-titulo]");
let produtos = [];
let usuario = null;
let etapa = "carrinho"; // carrinho | finalizar | feito

if (modo === "demo") {
  $("[data-aviso-modo]").innerHTML = '<p class="aviso aviso--demo"><strong>Modo demonstração:</strong> o Firebase ainda não está configurado. Pedidos e contas ficam só neste navegador, para testar o fluxo.</p>';
}

const mapa = () => new Map(produtos.map((p) => [p.id, p]));
const itensCarrinho = () => lerCarrinho().map((i) => ({ ...mapa().get(i.id), qtd: i.qtd })).filter((i) => i.nome);
const total = (itens) => itens.reduce((s, i) => s + i.preco * i.qtd, 0);

function controleQtd(id, qtd, rotulo) {
  return `<div class="qtd" role="group" aria-label="Quantidade de ${esc(rotulo)}">
    <button type="button" data-qtd="${esc(id)}" data-delta="-1" aria-label="Diminuir">−</button><output>${qtd}</output>
    <button type="button" data-qtd="${esc(id)}" data-delta="1" aria-label="Aumentar">+</button></div>`;
}

function renderProdutos() {
  const noCarrinho = new Map(lerCarrinho().map((i) => [i.id, i.qtd]));
  grade.innerHTML = produtos.map((p) => {
    const q = noCarrinho.get(p.id) || 0;
    return `<article class="produto">
      <div class="produto__img">${p.imagem ? `<img src="${esc(p.imagem)}" alt="" loading="lazy">` : `<span>${esc(p.nome)}</span>`}</div>
      <div class="produto__corpo">
        <h3>${esc(p.nome)}</h3><p>${esc(p.descricao)}</p>
        <div class="produto__rodape"><span class="preco">${reais(p.preco)}</span>
          ${q ? controleQtd(p.id, q, p.nome) : `<button class="btn btn--primario btn--pequeno" type="button" data-qtd="${esc(p.id)}" data-delta="1">Adicionar</button>`}
        </div>
      </div></article>`;
  }).join("") || '<p class="vazio">Nenhum item disponível para encomenda no momento.</p>';
}

/* ---------- Gaveta ---------- */
function abrir(novaEtapa = "carrinho") {
  etapa = novaEtapa;
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
  if (etapa === "feito") return;
  if (!itens.length) {
    titulo.textContent = "Sua encomenda";
    corpo.innerHTML = '<p class="vazio">Seu carrinho está vazio.<br>Escolha uma focaccia para começar.</p>';
    rodape.innerHTML = "";
    return;
  }
  if (etapa === "finalizar" && usuario) return renderFinalizar(itens);
  titulo.textContent = "Sua encomenda";
  corpo.innerHTML = itens.map((i) => `<div class="item-carrinho">
      <div><strong>${esc(i.nome)}</strong><br><small>${reais(i.preco)} cada</small></div>
      <div>${controleQtd(i.id, i.qtd, i.nome)}</div></div>`).join("");
  rodape.innerHTML = `<div class="total"><span>Total</span><span>${reais(total(itens))}</span></div>
    ${usuario
      ? '<button class="btn btn--primario btn-largo" type="button" data-ir-finalizar>Finalizar encomenda</button>'
      : '<a class="btn btn--primario btn-largo" href="conta.html?voltar=encomendas.html%23finalizar">Entrar para finalizar</a><p class="centro" style="margin-top:10px;font-size:.85rem">Leva um minuto: e-mail e senha ou conta Google.</p>'}`;
}

/* ---------- Finalização ---------- */
const doisDigitos = (n) => String(n).padStart(2, "0");
const dataISO = (d) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
const periodosDo = (iso) => (iso ? ENCOMENDA.retirada[new Date(iso + "T12:00").getDay()] || [] : []);

async function renderFinalizar(itens) {
  titulo.textContent = "Finalizar";
  const perfil = await dados.lerPerfil(usuario.uid).catch(() => ({}));
  const minimo = dataISO(new Date(Date.now() + ENCOMENDA.antecedenciaHoras * 36e5));
  corpo.innerHTML = `<form class="form" data-form-pedido novalidate>
      <div class="campo"><label for="f-nome">Nome</label><input id="f-nome" name="nome" required autocomplete="name" value="${esc(perfil.nome || usuario.nome)}"></div>
      <div class="campo"><label for="f-tel">WhatsApp</label><input id="f-tel" name="telefone" required type="tel" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000" value="${esc(perfil.telefone || "")}"></div>
      <div class="campos-2">
        <div class="campo"><label for="f-data">Retirada</label><input id="f-data" name="data" type="date" required min="${minimo}"></div>
        <div class="campo"><label for="f-periodo">Período</label><select id="f-periodo" name="periodo" required><option value="">Escolha a data</option></select></div>
      </div>
      <div class="campo"><label for="f-obs">Observações (opcional)</label><textarea id="f-obs" name="observacoes" maxlength="500"></textarea></div>
      <p class="aviso" style="margin:0">${esc(ENCOMENDA.pagamento)}</p>
      <label class="check"><input type="checkbox" name="aceite" required> Entendo que a encomenda só vale depois da confirmação da equipe e do pagamento, e que a retirada é na Elea (Rua Florinéia, 270).</label>
      <p class="form-erro" data-erro role="alert"></p>
    </form>`;
  rodape.innerHTML = `<div class="total"><span>Total</span><span>${reais(total(itens))}</span></div>
    <button class="btn btn--primario btn-largo" type="button" data-enviar>Enviar encomenda</button>
    <p class="centro" style="margin:8px 0 0"><button class="link-btn" type="button" data-voltar>Voltar ao carrinho</button></p>`;
  const form = corpo.querySelector("form");
  const data = form.data, periodo = form.periodo;
  data.addEventListener("change", () => {
    const ps = periodosDo(data.value);
    periodo.innerHTML = ps.length
      ? ps.map(([n, h]) => `<option value="${n}" data-hora="${h}">${n} (a partir das ${h.replace(":", "h")})</option>`).join("")
      : '<option value="">Fechado neste dia</option>';
  });
  rodape.querySelector("[data-enviar]").addEventListener("click", () => enviar(form, itens));
  form.addEventListener("submit", (e) => { e.preventDefault(); enviar(form, itens); });
}

async function enviar(form, itens) {
  const erro = form.querySelector("[data-erro]");
  const botao = rodape.querySelector("[data-enviar]");
  const f = Object.fromEntries(new FormData(form));
  const hora = form.periodo.selectedOptions[0]?.dataset.hora;
  const retiradaEm = hora && f.data ? new Date(`${f.data}T${hora}`) : null;
  const tel = (f.telefone || "").replace(/\D/g, "");
  const falha = !f.nome?.trim() ? "Informe seu nome." :
    tel.length < 10 ? "Informe um WhatsApp com DDD." :
    !retiradaEm ? "Escolha uma data e um período de retirada em que a Elea esteja aberta." :
    retiradaEm - Date.now() < ENCOMENDA.antecedenciaHoras * 36e5 ? "A retirada precisa ser com pelo menos 24h de antecedência." :
    !f.aceite ? "Confirme que leu as condições da encomenda." : "";
  erro.textContent = falha;
  if (falha) return;
  botao.disabled = true;
  botao.textContent = "Enviando…";
  try {
    const pedido = {
      uid: usuario.uid,
      cliente: { nome: f.nome.trim(), telefone: tel, email: usuario.email || "" },
      itens: itens.map(({ id, nome, preco, qtd }) => ({ id, nome, preco, qtd })),
      total: total(itens),
      retiradaEm,
      periodo: f.periodo,
      observacoes: (f.observacoes || "").trim().slice(0, 500),
    };
    const id = await dados.criarPedido(pedido);
    dados.salvarPerfil(usuario.uid, { nome: pedido.cliente.nome, telefone: tel }).catch(() => {});
    limparCarrinho();
    concluir(id, pedido);
  } catch (e) {
    console.error(e);
    erro.textContent = erroAmigavel(e);
    botao.disabled = false;
    botao.textContent = "Enviar encomenda";
  }
}

function concluir(id, p) {
  etapa = "feito";
  const cod = codigoPedido(id);
  const quando = p.retiradaEm.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const msg = `Olá, Elea! Fiz a encomenda #${cod} pelo site:\n${p.itens.map((i) => `${i.qtd}x ${i.nome}`).join("\n")}\nRetirada: ${quando}, ${p.periodo.toLowerCase()}\nNome: ${p.cliente.nome}\nTotal: ${reais(p.total)}`;
  titulo.textContent = "Encomenda enviada";
  corpo.innerHTML = `<div class="vazio" style="padding-top:20px">
      <p style="font:600 2rem/1.1 var(--serif);color:var(--madeira-escura);margin-bottom:8px">Pedido #${cod}</p>
      <p>Recebemos sua encomenda para <strong>${esc(quando)}</strong> (${esc(p.periodo.toLowerCase())}).</p>
      <p>${esc(ENCOMENDA.pagamento)}</p></div>`;
  rodape.innerHTML = `<a class="btn btn--primario btn-largo" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">Avisar a Elea no WhatsApp</a>
    <p class="centro" style="margin:10px 0 0"><a href="conta.html">Acompanhar em Minha conta</a></p>`;
  renderProdutos();
}

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const q = e.target.closest("[data-qtd]");
  if (q) {
    const delta = Number(q.dataset.delta);
    mudarQtd(q.dataset.qtd, delta);
    if (delta > 0 && !gaveta.classList.contains("is-aberta")) toast("Adicionado à encomenda");
    return;
  }
  if (e.target.closest("[data-fechar-gaveta]")) return fechar();
  if (e.target.closest("[data-ir-finalizar]")) return abrir("finalizar");
  if (e.target.closest("[data-voltar]")) return abrir("carrinho");
  const link = e.target.closest('a[href$="#carrinho"]');
  if (link) { e.preventDefault(); abrir("carrinho"); }
});
addEventListener("keydown", (e) => { if (e.key === "Escape" && gaveta.classList.contains("is-aberta")) fechar(); });
addEventListener("carrinho", () => { renderProdutos(); if (etapa !== "feito" && etapa !== "finalizar") renderGaveta(); });

(async () => {
  try { produtos = await dados.listarProdutos(); } catch (e) { console.error(e); grade.innerHTML = '<p class="aviso aviso--erro">Não foi possível carregar os produtos agora.</p>'; return; }
  renderProdutos();
  let primeiraVez = true;
  dados.observarUsuario((u) => {
    usuario = u;
    if (primeiraVez) {
      primeiraVez = false;
      if (location.hash === "#finalizar" && u && lerCarrinho().length) abrir("finalizar");
      else if (location.hash === "#carrinho") abrir("carrinho");
    } else if (etapa !== "feito") renderGaveta();
  });
})();
