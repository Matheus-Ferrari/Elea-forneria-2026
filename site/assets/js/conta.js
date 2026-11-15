/* Minha conta: entrar / criar conta / recuperar senha e, logado, perfil + meus pedidos. */
import { dados, modo, paraData, codigoPedido, erroAmigavel } from "./dados.js";
import { reais, esc } from "./carrinho.js";
import { STATUS } from "./config.js";
import { toast } from "./site.js";

const raiz = document.querySelector("[data-conta]");
const titulo = document.querySelector("[data-conta-titulo]");
// Só aceita voltar para páginas do próprio site, em caminho relativo (evita redirecionamento aberto).
const voltar = (() => { const v = new URLSearchParams(location.search).get("voltar") || ""; return /^[a-z0-9-]+\.html(#[a-z-]+)?$/i.test(v) ? v : ""; })();
const aviso = modo === "demo" ? '<p class="aviso aviso--demo"><strong>Modo demonstração:</strong> qualquer senha funciona e nada sai deste navegador. Use um e-mail começando por <code>admin@</code> para ver o painel.</p>' : "";

const formularios = {
  entrar: `<form class="form" data-acao="entrar">
      <div class="campo"><label for="e-email">E-mail</label><input id="e-email" name="email" type="email" required autocomplete="email"></div>
      <div class="campo"><label for="e-senha">Senha</label><input id="e-senha" name="senha" type="password" required autocomplete="current-password"></div>
      <p class="form-erro" role="alert"></p>
      <button class="btn btn--primario btn-largo">Entrar</button>
      <p class="centro" style="margin:0"><button class="link-btn" type="button" data-aba="senha">Esqueci minha senha</button></p></form>`,
  criar: `<form class="form" data-acao="criar">
      <div class="campo"><label for="c-nome">Nome</label><input id="c-nome" name="nome" required autocomplete="name"></div>
      <div class="campo"><label for="c-tel">WhatsApp</label><input id="c-tel" name="telefone" type="tel" required autocomplete="tel" placeholder="(11) 90000-0000"></div>
      <div class="campo"><label for="c-email">E-mail</label><input id="c-email" name="email" type="email" required autocomplete="email"></div>
      <div class="campo"><label for="c-senha">Senha</label><input id="c-senha" name="senha" type="password" required minlength="8" autocomplete="new-password"><small>Mínimo de 8 caracteres.</small></div>
      <p class="form-erro" role="alert"></p>
      <button class="btn btn--primario btn-largo">Criar conta</button></form>`,
  senha: `<form class="form" data-acao="senha">
      <p style="margin:0">Enviaremos um link para você criar uma nova senha.</p>
      <div class="campo"><label for="s-email">E-mail</label><input id="s-email" name="email" type="email" required autocomplete="email"></div>
      <p class="form-erro" role="alert"></p>
      <button class="btn btn--primario btn-largo">Enviar link</button></form>`,
};

function telaEntrar(aba = "entrar") {
  titulo.textContent = aba === "criar" ? "Crie sua conta" : "Entre na sua conta";
  raiz.innerHTML = `<div class="auth-wrap">${aviso}<div class="cartao">
    <div class="abas" role="tablist">
      <button type="button" role="tab" data-aba="entrar" aria-selected="${aba !== "criar"}">Entrar</button>
      <button type="button" role="tab" data-aba="criar" aria-selected="${aba === "criar"}">Criar conta</button>
    </div>
    ${formularios[aba]}
    <p class="ou" style="margin:18px 0">ou</p>
    <button class="btn btn-google" type="button" data-google>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>
      Continuar com Google</button>
  </div></div>`;
}

async function telaConta(u) {
  titulo.textContent = `Olá, ${u.nome?.split(" ")[0] || "bem-vindo(a)"}!`;
  raiz.innerHTML = '<p class="vazio">Carregando seus pedidos…</p>';
  const [perfil, pedidos, admin] = await Promise.all([
    dados.lerPerfil(u.uid).catch(() => ({})), dados.meusPedidos(u.uid).catch(() => []), dados.ehAdmin(u.uid),
  ]);
  raiz.innerHTML = `${aviso}<div class="conta-grid">
    <div class="cartao">
      <h2 style="font-size:1.8rem">Seus dados</h2>
      <form class="form" data-acao="perfil">
        <div class="campo"><label for="p-nome">Nome</label><input id="p-nome" name="nome" value="${esc(perfil.nome || u.nome)}" autocomplete="name"></div>
        <div class="campo"><label for="p-tel">WhatsApp</label><input id="p-tel" name="telefone" type="tel" value="${esc(perfil.telefone || "")}" autocomplete="tel"></div>
        <div class="campo"><span>E-mail</span><p style="margin:0">${esc(u.email)}</p></div>
        <p class="form-erro" role="alert"></p>
        <button class="btn btn--primario">Salvar</button>
      </form>
      <hr style="border:0;border-top:1px solid var(--bege);margin:22px 0">
      ${admin ? '<p><a class="btn btn--contorno btn-largo" href="admin.html">Abrir painel da Elea</a></p>' : ""}
      <button class="btn btn--contorno btn-largo" type="button" data-sair>Sair</button>
    </div>
    <div>
      <div class="admin-barra"><h2 style="margin:0">Minhas encomendas</h2><a class="btn btn--primario btn--pequeno" href="encomendas.html">Nova encomenda</a></div>
      ${pedidos.length ? pedidos.map(cartaoPedido).join("") : '<p class="vazio">Você ainda não fez encomendas.</p>'}
    </div></div>`;
}

export function cartaoPedido(p) {
  const ret = paraData(p.retiradaEm);
  return `<article class="pedido">
    <div class="pedido__topo"><span class="pedido__codigo">#${codigoPedido(p.id)}</span><span class="status status--${esc(p.status)}">${esc(STATUS[p.status] || p.status)}</span></div>
    <ul>${(p.itens || []).map((i) => `<li>${i.qtd}× ${esc(i.nome)}</li>`).join("")}</ul>
    <p class="pedido__meta">Retirada: ${ret ? ret.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) : "—"} · ${esc(p.periodo || "")} · <strong>${reais(p.total || 0)}</strong></p>
  </article>`;
}

raiz.addEventListener("click", async (e) => {
  const aba = e.target.closest("[data-aba]");
  if (aba) return telaEntrar(aba.dataset.aba);
  if (e.target.closest("[data-sair]")) return dados.sair();
  if (e.target.closest("[data-google]")) {
    try { await dados.entrarGoogle(); } catch (err) { toast(erroAmigavel(err)); }
  }
});

raiz.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const f = Object.fromEntries(new FormData(form));
  const erro = form.querySelector(".form-erro");
  const botao = form.querySelector("button:not([type=button])");
  erro.textContent = "";
  botao.disabled = true;
  try {
    if (form.dataset.acao === "entrar") await dados.entrar(f.email.trim(), f.senha);
    if (form.dataset.acao === "criar") {
      if ((f.senha || "").length < 8) throw { code: "auth/weak-password" };
      await dados.criarConta(f.nome.trim(), f.email.trim(), f.senha, f.telefone.replace(/\D/g, ""));
    }
    if (form.dataset.acao === "senha") { await dados.recuperarSenha(f.email.trim()); erro.textContent = "Se houver uma conta com este e-mail, o link chega em instantes."; }
    if (form.dataset.acao === "perfil") { await dados.salvarPerfil(usuarioAtual.uid, { nome: f.nome.trim(), telefone: f.telefone.replace(/\D/g, "") }); toast("Dados salvos"); }
  } catch (err) {
    erro.textContent = erroAmigavel(err);
  } finally {
    botao.disabled = false;
  }
});

let usuarioAtual = null;
dados.observarUsuario((u) => {
  usuarioAtual = u;
  if (u && voltar) return location.replace(voltar);
  u ? telaConta(u) : telaEntrar(new URLSearchParams(location.search).get("aba") || "entrar");
});
