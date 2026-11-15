/* Comum a todas as páginas: menu, cabeçalho, contador do carrinho, toast e revelar ao rolar. */
import { quantidadeTotal } from "./carrinho.js";

const topo = document.getElementById("topo");
const botaoMenu = topo?.querySelector(".menu-toggle");
botaoMenu?.addEventListener("click", () => {
  const aberto = topo.classList.toggle("is-aberto");
  botaoMenu.setAttribute("aria-expanded", String(aberto));
});
topo?.querySelectorAll(".menu a").forEach((a) => a.addEventListener("click", () => {
  topo.classList.remove("is-aberto");
  botaoMenu?.setAttribute("aria-expanded", "false");
}));
const aoRolar = () => topo?.classList.toggle("is-rolado", scrollY > 8);
addEventListener("scroll", aoRolar, { passive: true });
aoRolar();

export function atualizarContador() {
  const n = quantidadeTotal();
  document.querySelectorAll("[data-carrinho-qtd]").forEach((b) => { b.textContent = n; b.hidden = n === 0; });
}
addEventListener("carrinho", atualizarContador);
addEventListener("storage", atualizarContador);
atualizarContador();

let tempoToast;
export function toast(msg) {
  const t = document.querySelector("[data-toast]");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(tempoToast);
  tempoToast = setTimeout(() => t.classList.remove("is-on"), 2800);
}

const revelar = document.querySelectorAll(".revelar");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((itens) => itens.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-visivel"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  revelar.forEach((el) => io.observe(el));
} else revelar.forEach((el) => el.classList.add("is-visivel"));
