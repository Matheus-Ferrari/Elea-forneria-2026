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

// Caixa de luz das galerias ([data-galeria]): clique amplia a foto inteira; setas/teclado passam; Esc ou fundo fecham.
document.querySelectorAll("[data-galeria]").forEach((galeria) => {
  const figuras = [...galeria.querySelectorAll("figure")];
  if (!figuras.length || typeof HTMLDialogElement !== "function") return;
  const svg = (d) => `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const luz = document.createElement("dialog");
  luz.className = "luz";
  luz.setAttribute("aria-label", "Foto ampliada");
  luz.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure>
    <button class="icone-btn luz__seta luz__seta--ant" type="button" data-passo="-1" aria-label="Foto anterior">${svg('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>')}</button>
    <button class="icone-btn luz__seta luz__seta--prox" type="button" data-passo="1" aria-label="Próxima foto">${svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>')}</button>
    <button class="icone-btn luz__fechar" type="button" data-fechar aria-label="Fechar">${svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')}</button>`;
  document.body.append(luz);
  const foto = luz.querySelector("img"), legenda = luz.querySelector("figcaption");
  let atual = 0;
  const mostrar = (i) => {
    atual = (i + figuras.length) % figuras.length;
    const img = figuras[atual].querySelector("img");
    foto.src = img.currentSrc || img.src;
    foto.alt = img.alt;
    legenda.textContent = figuras[atual].querySelector("figcaption")?.textContent || "";
    luz.classList.remove("is-trocando"); void luz.offsetWidth; luz.classList.add("is-trocando");
  };
  figuras.forEach((f, i) => f.querySelector("button")?.addEventListener("click", () => { mostrar(i); luz.showModal(); }));
  luz.addEventListener("click", (e) => {
    const passo = e.target.closest("[data-passo]");
    if (passo) return mostrar(atual + Number(passo.dataset.passo));
    if (e.target === luz || e.target.closest("[data-fechar]")) luz.close();
  });
  luz.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") mostrar(atual + 1);
    if (e.key === "ArrowLeft") mostrar(atual - 1);
  });
});

const revelar = document.querySelectorAll(".revelar");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((itens) => itens.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-visivel"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  revelar.forEach((el) => io.observe(el));
} else revelar.forEach((el) => el.classList.add("is-visivel"));
