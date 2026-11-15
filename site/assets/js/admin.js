/* Painel da Elea: pedidos (mudar status, conferir total) e produtos da forneria. Acesso: admins/{uid}. */
import { dados, modo, paraData, codigoPedido, erroAmigavel } from "./dados.js";
import { reais, esc } from "./carrinho.js";
import { STATUS } from "./config.js";
import { PRODUTOS_INICIAIS } from "./produtos-iniciais.js";
import { toast } from "./site.js";

const raiz = document.querySelector("[data-admin]");
let aba = "pedidos";
let filtro = "abertos";
let produtos = [];

const ABERTOS = ["recebido", "confirmado", "pago", "pronto"];

async function render() {
  raiz.innerHTML = `${modo === "demo" ? '<p class="aviso aviso--demo"><strong>Modo demonstração:</strong> mostra os pedidos feitos neste navegador.</p>' : ""}
    <div class="abas" role="tablist" style="max-width:360px">
      <button type="button" data-aba="pedidos" aria-selected="${aba === "pedidos"}">Pedidos</button>
      <button type="button" data-aba="produtos" aria-selected="${aba === "produtos"}">Produtos</button>
    </div><div data-conteudo><p class="vazio">Carregando…</p></div>`;
  const alvo = raiz.querySelector("[data-conteudo]");
  try {
    produtos = await dados.listarProdutos({ todos: true });
    alvo.innerHTML = aba === "pedidos" ? await htmlPedidos() : htmlProdutos();
  } catch (e) {
    console.error(e);
    alvo.innerHTML = `<p class="aviso aviso--erro">${esc(erroAmigavel(e))}</p>`;
  }
}

async function htmlPedidos() {
  const todos = await dados.todosPedidos();
  const lista = todos.filter((p) => filtro === "todos" || (filtro === "abertos" ? ABERTOS.includes(p.status) : p.status === filtro));
  const precos = new Map(produtos.map((p) => [p.id, p.preco]));
  const opcoes = [["abertos", "Em aberto"], ["todos", "Todos"], ...Object.entries(STATUS)];
  return `<div class="admin-barra">
      <label class="campo" style="min-width:220px"><span>Mostrar</span><select data-filtro>${opcoes.map(([v, r]) => `<option value="${v}"${v === filtro ? " selected" : ""}>${esc(r)}</option>`).join("")}</select></label>
      <button class="btn btn--contorno btn--pequeno" type="button" data-recarregar>Atualizar</button>
    </div>
    ${lista.length ? lista.map((p) => {
      const ret = paraData(p.retiradaEm);
      const conferido = (p.itens || []).reduce((s, i) => s + (precos.get(i.id) ?? i.preco) * i.qtd, 0);
      const tel = p.cliente?.telefone || "";
      return `<article class="pedido">
        <div class="pedido__topo">
          <span class="pedido__codigo">#${codigoPedido(p.id)} · ${esc(p.cliente?.nome)}</span>
          <select data-status="${esc(p.id)}" aria-label="Situação do pedido">${Object.entries(STATUS).map(([v, r]) => `<option value="${v}"${v === p.status ? " selected" : ""}>${esc(r)}</option>`).join("")}</select>
        </div>
        <ul>${(p.itens || []).map((i) => `<li>${i.qtd}× ${esc(i.nome)} — ${reais(i.preco * i.qtd)}</li>`).join("")}</ul>
        <p class="pedido__meta"><strong>Retirada:</strong> ${ret ? ret.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }) : "—"} · ${esc(p.periodo)}
          · <strong>Total ${reais(p.total || 0)}</strong>
          ${conferido !== p.total ? `<span class="alerta-total"> · confira: pelo catálogo atual daria ${reais(conferido)}</span>` : ""}</p>
        ${p.observacoes ? `<p class="pedido__meta"><strong>Obs.:</strong> ${esc(p.observacoes)}</p>` : ""}
        <p class="pedido__meta">${esc(p.cliente?.email)} · ${tel ? `<a href="https://wa.me/55${esc(tel)}" target="_blank" rel="noopener">WhatsApp ${esc(tel)}</a>` : "sem telefone"}</p>
      </article>`;
    }).join("") : '<p class="vazio">Nenhum pedido nesta lista.</p>'}`;
}

function htmlProdutos() {
  const linha = (p, novo = false) => `<tr data-produto="${esc(p.id)}">
      <td data-l="Nome"><input name="nome" value="${esc(p.nome)}" aria-label="Nome"></td>
      <td data-l="Descrição"><input name="descricao" value="${esc(p.descricao)}" aria-label="Descrição"></td>
      <td data-l="Preço (R$)"><input name="preco" inputmode="decimal" value="${p.preco != null ? (p.preco / 100).toFixed(2).replace(".", ",") : ""}" aria-label="Preço" style="max-width:100px"></td>
      <td data-l="Imagem"><input name="imagem" value="${esc(p.imagem)}" placeholder="assets/img/..." aria-label="Imagem"></td>
      <td data-l="Ordem"><input name="ordem" type="number" value="${p.ordem ?? ""}" aria-label="Ordem" style="max-width:70px"></td>
      <td data-l="Ativo"><input name="ativo" type="checkbox"${p.ativo ? " checked" : ""} aria-label="Ativo" style="width:20px;min-height:20px"></td>
      <td><button class="btn btn--primario btn--pequeno" type="button" data-salvar${novo ? " data-novo" : ""}>Salvar</button>
        ${novo ? "" : '<button class="link-btn" type="button" data-excluir>Excluir</button>'}</td></tr>`;
  return `<div class="admin-barra"><p style="margin:0">Preços em reais. Itens inativos não aparecem na loja.</p>
      ${produtos.length ? "" : '<button class="btn btn--contorno btn--pequeno" type="button" data-importar>Importar produtos iniciais</button>'}</div>
    <table class="admin-tabela"><thead><tr><th>Nome</th><th>Descrição</th><th>Preço</th><th>Imagem</th><th>Ordem</th><th>Ativo</th><th></th></tr></thead>
      <tbody>${produtos.map((p) => linha(p)).join("")}${linha({ id: "", nome: "", descricao: "", imagem: "", ativo: true, ordem: produtos.length + 1 }, true)}</tbody></table>`;
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

raiz.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.closest("[data-aba]")) { aba = t.closest("[data-aba]").dataset.aba; return render(); }
  if (t.closest("[data-recarregar]")) return render();
  try {
    if (t.closest("[data-importar]")) {
      for (const p of PRODUTOS_INICIAIS) await dados.salvarProduto(p);
      toast("Produtos importados"); return render();
    }
    const tr = t.closest("tr[data-produto]");
    if (tr && t.closest("[data-salvar]")) {
      const v = (n) => tr.querySelector(`[name=${n}]`);
      const nome = v("nome").value.trim();
      const preco = Math.round(parseFloat(v("preco").value.replace(/\./g, "").replace(",", ".")) * 100);
      if (!nome || !Number.isFinite(preco) || preco <= 0) return toast("Preencha nome e preço válidos.");
      await dados.salvarProduto({
        id: tr.dataset.produto || slug(nome), nome, preco,
        descricao: v("descricao").value.trim(), imagem: v("imagem").value.trim(),
        ordem: Number(v("ordem").value) || 99, ativo: v("ativo").checked,
      });
      toast("Produto salvo"); return render();
    }
    if (tr && t.closest("[data-excluir]") && confirm("Excluir este produto da loja?")) {
      await dados.excluirProduto(tr.dataset.produto); toast("Produto excluído"); return render();
    }
  } catch (err) { console.error(err); toast(erroAmigavel(err)); }
});

raiz.addEventListener("change", async (e) => {
  if (e.target.matches("[data-filtro]")) { filtro = e.target.value; return render(); }
  if (e.target.matches("[data-status]")) {
    try { await dados.mudarStatus(e.target.dataset.status, e.target.value); toast("Situação atualizada"); }
    catch (err) { console.error(err); toast(erroAmigavel(err)); }
  }
});

dados.observarUsuario(async (u) => {
  if (!u) { raiz.innerHTML = '<div class="cartao auth-wrap"><p>Entre com a conta da equipe para acessar o painel.</p><a class="btn btn--primario btn-largo" href="conta.html?voltar=admin.html">Entrar</a></div>'; return; }
  if (!(await dados.ehAdmin(u.uid))) { raiz.innerHTML = '<p class="aviso aviso--erro">Esta conta não tem acesso ao painel. Peça a um administrador para liberar (documento em <code>admins/{uid}</code> no Firestore).</p>'; return; }
  render();
});
