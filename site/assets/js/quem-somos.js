/*
 * Quem somos.
 * 1) "Quem faz" ([data-elenco]): os perfis (<article class="perfil">) viram abas. Em cima, um cartão por pessoa com
 *    o rosto (data-rosto / data-rosto-pos do perfil); embaixo, um perfil por vez, com setas e contador.
 *    Teclado: setas ←/→ nos cartões; no celular dá para deslizar o perfil. #perfil-manuela no endereço abre direto.
 *    Sem JS, os perfis aparecem um embaixo do outro.
 * 2) Momentos e ambiente ([data-rolo]): faixa que corre para o lado. Setas andam quase uma tela; com o mouse dá
 *    para arrastar (o clique numa foto só amplia se não houve arraste).
 */
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const seta = (d) => `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const SETA_ESQ = seta('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>');
const SETA_DIR = seta('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>');
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const dois = (n) => String(n).padStart(2, "0");

/* ---------- 1) Quem faz ---------- */
const elenco = document.querySelector("[data-elenco]");
if (elenco) {
  const perfis = [...elenco.querySelectorAll(".perfil")];
  const nomes = el("div", "elenco__nomes");
  nomes.setAttribute("role", "tablist");
  nomes.setAttribute("aria-label", "Quem faz a Elea");
  const palco = el("div", "elenco__palco");
  let atual = 0;

  const abas = perfis.map((perfil, i) => {
    const nome = perfil.querySelector(".perfil__nome").textContent.trim();
    const papel = perfil.querySelector(".perfil__papel").textContent.trim();
    const aba = el("button", "elenco__nome");
    aba.type = "button";
    aba.id = `aba-${perfil.id}`;
    aba.setAttribute("role", "tab");
    aba.setAttribute("aria-controls", perfil.id);
    const rosto = el("img", "elenco__rosto");
    Object.assign(rosto, { src: perfil.dataset.rosto || perfil.querySelector(".perfil__foto").getAttribute("src"), alt: "", width: 46, height: 46, loading: "lazy" });
    if (perfil.dataset.rostoPos) rosto.style.objectPosition = perfil.dataset.rostoPos;
    const rotulo = el("span", "elenco__rotulo");
    rotulo.append(el("strong", "", null), el("small", "", null));
    rotulo.firstChild.textContent = nome;
    rotulo.lastChild.textContent = papel;
    aba.append(rosto, rotulo);
    aba.addEventListener("click", () => mostrar(i, true));
    nomes.append(aba);

    perfil.setAttribute("role", "tabpanel");
    perfil.setAttribute("aria-labelledby", aba.id);
    // setas e contador no fim do texto de cada perfil
    const setas = el("div", "perfil__setas", `
      <button class="prato-pop__seta" type="button" data-passo="-1" aria-label="Pessoa anterior">${SETA_ESQ}</button>
      <span class="perfil__conta">${dois(i + 1)} / ${dois(perfis.length)}</span>
      <button class="prato-pop__seta" type="button" data-passo="1" aria-label="Próxima pessoa">${SETA_DIR}</button>`);
    perfil.querySelector(".perfil__texto").append(setas);
    palco.append(perfil);
    return aba;
  });

  function mostrar(i, focar = false) {
    atual = (i + perfis.length) % perfis.length;
    perfis.forEach((p, k) => {
      const ativo = k === atual;
      p.classList.toggle("is-ativo", ativo);
      p.inert = !ativo;
      abas[k].setAttribute("aria-selected", String(ativo));
      abas[k].tabIndex = ativo ? 0 : -1;
    });
    if (focar) abas[atual].focus({ preventScroll: true });
    // no celular, o cartão ativo aparece inteiro na fileira
    const a = abas[atual];
    if (nomes.scrollWidth > nomes.clientWidth) nomes.scrollTo({ left: a.offsetLeft - 20, behavior: calmo ? "auto" : "smooth" });
  }

  palco.addEventListener("click", (e) => {
    const passo = e.target.closest("[data-passo]");
    if (passo) mostrar(atual + Number(passo.dataset.passo));
  });
  nomes.addEventListener("keydown", (e) => {
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (passo) { e.preventDefault(); mostrar(atual + passo, true); }
    if (e.key === "Home") { e.preventDefault(); mostrar(0, true); }
    if (e.key === "End") { e.preventDefault(); mostrar(perfis.length - 1, true); }
  });
  // deslizar o perfil para os lados (celular)
  let x0 = null, y0 = 0;
  palco.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  palco.addEventListener("touchend", (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) mostrar(atual + (dx < 0 ? 1 : -1));
  }, { passive: true });

  elenco.append(nomes, palco);
  const doEndereco = perfis.findIndex((p) => `#${p.id}` === location.hash);
  mostrar(doEndereco >= 0 ? doEndereco : 0);
  elenco.classList.add("is-pronto");
}

/* ---------- 2) Momentos e ambiente: faixa que corre para o lado ---------- */
const rolo = document.querySelector("[data-rolo]");
const rolosSetas = document.querySelector("[data-rolo-setas]");
if (rolo) {
  const [ant, prox] = rolosSetas ? rolosSetas.querySelectorAll("[data-rolo-passo]") : [];
  const atualizar = () => {
    if (!ant) return;
    const fim = rolo.scrollWidth - rolo.clientWidth;
    ant.disabled = rolo.scrollLeft <= 2;
    prox.disabled = rolo.scrollLeft >= fim - 2;
    rolosSetas.hidden = fim <= 2; // tudo coube na tela: sem setas
  };
  rolosSetas?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rolo-passo]");
    if (b) rolo.scrollBy({ left: Number(b.dataset.roloPasso) * rolo.clientWidth * 0.75, behavior: calmo ? "auto" : "smooth" });
  });
  rolo.addEventListener("scroll", () => requestAnimationFrame(atualizar), { passive: true });
  addEventListener("resize", atualizar);
  rolo.querySelectorAll("img").forEach((img) => img.complete || img.addEventListener("load", atualizar, { once: true }));
  atualizar();

  // arrastar com o mouse (no toque, a rolagem nativa já faz isso)
  let arrasto = null, arrastou = false;
  rolo.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    arrasto = { x: e.clientX, left: rolo.scrollLeft };
    arrastou = false;
  });
  addEventListener("pointermove", (e) => {
    if (!arrasto) return;
    const dx = e.clientX - arrasto.x;
    if (!arrastou && Math.abs(dx) > 6) { arrastou = true; rolo.classList.add("is-arrastando"); }
    if (arrastou) rolo.scrollLeft = arrasto.left - dx;
  });
  addEventListener("pointerup", () => {
    if (!arrasto) return;
    arrasto = null;
    rolo.classList.remove("is-arrastando");
    setTimeout(() => { arrastou = false; }); // o clique que acompanha o soltar já passou (soltou fora: nada fica preso)
  });
  // depois de arrastar, o clique que vem junto não abre a foto
  rolo.addEventListener("click", (e) => { if (arrastou) { e.preventDefault(); e.stopPropagation(); arrastou = false; } }, true);
  rolo.addEventListener("dragstart", (e) => e.preventDefault());
}
