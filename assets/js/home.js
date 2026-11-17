/* Home: vídeos que tocam só quando aparecem, carrossel "Prato a prato" e parallax leve da imprensa. */
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const economia = navigator.connection?.saveData;

// Vídeos: com movimento reduzido/economia de dados, ficam no poster (foto real).
if (!calmo && !economia && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((itens) => itens.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.25 });
  document.querySelectorAll("video[data-video-auto]").forEach((v) => io.observe(v));
}

/*
 * Prato a prato — carrossel arrastável e infinito.
 * Os pratos são triplicados (cópias aria-hidden) e, quando o índice sai do bloco do meio,
 * o trilho "pula" sem transição para a cópia equivalente. Passa sozinho a cada 2,2 s.
 */
const slider = document.querySelector("[data-giro]");
if (slider) {
  const trilho = slider.querySelector(".giro__trilho");
  const originais = [...trilho.children];
  const n = originais.length;
  const copia = (el) => { const c = el.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.querySelector("img").alt = ""; return c; };
  trilho.prepend(...originais.map(copia));
  trilho.append(...originais.map(copia));
  const itens = [...trilho.children];
  slider.closest(".giro").classList.add("giro--ativo");

  let indice = n, arrasto = null, timer = null, visivel = false;
  const passo = () => itens[0].offsetWidth + parseFloat(getComputedStyle(trilho).columnGap || 0);
  const base = () => slider.clientWidth / 2 - itens[0].offsetWidth / 2 - indice * passo();

  function pintar(desloc = 0) {
    trilho.style.transform = `translate3d(${base() + desloc}px,0,0)`;
    itens.forEach((el, i) => {
      el.classList.toggle("is-centro", i === indice);
      el.classList.toggle("is-antes", i < indice);
    });
  }
  function semTransicao(fn) {
    trilho.classList.add("is-sem-transicao");
    fn();
    trilho.offsetWidth; // aplica antes de religar a transição
    trilho.classList.remove("is-sem-transicao");
  }
  function ir(novo) { indice = novo; pintar(); }
  trilho.addEventListener("transitionend", (e) => {
    if (e.target !== trilho) return;
    if (indice < n || indice >= 2 * n) semTransicao(() => ir(((indice % n) + n) % n + n));
  });

  // Autoplay: só com a seção na tela, sem movimento reduzido e sem interação.
  const parar = () => { clearInterval(timer); timer = null; };
  const tocar = () => { parar(); if (!calmo && visivel && !arrasto && !document.hidden) timer = setInterval(() => ir(indice + 1), 2200); };
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel) slider.querySelectorAll("img[loading=lazy]").forEach((img) => (img.loading = "eager"));
    tocar();
  }, { rootMargin: "100px 0px" }).observe(slider);
  document.addEventListener("visibilitychange", tocar);
  slider.addEventListener("mouseenter", parar);
  slider.addEventListener("mouseleave", tocar);
  slider.addEventListener("focusin", parar);
  slider.addEventListener("focusout", tocar);

  // Arrastar (mouse e toque). touch-action: pan-y deixa a rolagem vertical livre no celular.
  slider.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    arrasto = { x: e.clientX, dx: 0, id: e.pointerId };
    parar();
    trilho.classList.add("is-sem-transicao");
  });
  slider.addEventListener("pointermove", (e) => {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    arrasto.dx = e.clientX - arrasto.x;
    if (Math.abs(arrasto.dx) > 6 && !slider.classList.contains("is-arrastando")) {
      slider.classList.add("is-arrastando");
      slider.setPointerCapture(e.pointerId);
    }
    pintar(arrasto.dx);
  });
  const soltar = () => {
    if (!arrasto) return;
    const { dx } = arrasto;
    arrasto = null;
    slider.classList.remove("is-arrastando");
    trilho.classList.remove("is-sem-transicao");
    const pulos = Math.abs(dx) < 50 ? 0 : -Math.sign(dx) * Math.max(1, Math.round(Math.abs(dx) / passo()));
    ir(indice + pulos);
    tocar();
  };
  slider.addEventListener("pointerup", soltar);
  slider.addEventListener("pointercancel", soltar);
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); ir(indice + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); ir(indice - 1); }
  });
  addEventListener("resize", () => semTransicao(() => pintar()));
  semTransicao(() => pintar());
}

// "Jornal vivo": cada recorte se desloca em velocidade diferente ao rolar (máx. ~24px).
const grupo = document.querySelector("[data-parallax]");
if (grupo && !calmo && matchMedia("(min-width: 901px)").matches) {
  const cards = [...grupo.children];
  const vel = [0.06, -0.04, 0.05];
  let pendente = false;
  const mover = () => {
    pendente = false;
    const r = grupo.getBoundingClientRect();
    const centro = r.top + r.height / 2 - innerHeight / 2;
    if (Math.abs(centro) > innerHeight * 1.5) return;
    cards.forEach((c, i) => c.style.setProperty("--par", `${Math.max(-24, Math.min(24, -centro * vel[i % 3]))}px`));
  };
  addEventListener("scroll", () => { if (!pendente) { pendente = true; requestAnimationFrame(mover); } }, { passive: true });
  mover();
}

// Popup do prato (Prato a prato): clique sem arrastar, ou Enter no carrossel, abre nome e descrição.
// Fica separado do carrossel: só observa onde o ponteiro desceu para não abrir ao fim de um arraste.
const pop = document.querySelector("[data-prato-pop]");
if (slider && pop && typeof pop.showModal === "function") {
  // só os pratos originais (as cópias do loop infinito têm aria-hidden)
  const pratos = [...slider.querySelectorAll(".giro__prato:not([aria-hidden])")];
  const foto = pop.querySelector("[data-pop-img]");
  let atual = 0, x0 = 0;
  const mostrar = (i) => {
    atual = (i + pratos.length) % pratos.length;
    const li = pratos[atual], img = li.querySelector("img");
    foto.src = img.currentSrc || img.src;
    foto.alt = img.alt;
    pop.querySelector("[data-pop-nome]").textContent = li.dataset.nome;
    pop.querySelector("[data-pop-desc]").textContent = li.dataset.desc || "";
    pop.querySelector("[data-pop-nota]").hidden = !li.hasAttribute("data-confirmar");
    pop.querySelector("[data-pop-conta]").textContent = `${atual + 1} / ${pratos.length}`;
    pop.classList.remove("is-trocando");
    void pop.offsetWidth; // reinicia a animação do prato entrando
    pop.classList.add("is-trocando");
  };
  const abrir = (li) => {
    if (!li?.dataset.nome) return;
    const i = pratos.findIndex((p) => p.dataset.nome === li.dataset.nome);
    mostrar(i < 0 ? 0 : i);
    if (!pop.open) pop.showModal();
  };
  slider.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  slider.addEventListener("click", (e) => { if (Math.abs(e.clientX - x0) < 8) abrir(e.target.closest(".giro__prato")); });
  slider.addEventListener("keydown", (e) => { if (e.key === "Enter") abrir(slider.querySelector(".giro__prato.is-centro")); });
  // setas passam de prato; X ou clique fora do cartão (no fundo escuro) fecham
  pop.addEventListener("click", (e) => {
    const passo = e.target.closest("[data-pop-passo]");
    if (passo) return mostrar(atual + Number(passo.dataset.popPasso));
    if (e.target === pop || e.target.closest("[data-fechar]")) pop.close();
  });
  pop.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") mostrar(atual + 1);
    if (e.key === "ArrowLeft") mostrar(atual - 1);
  });
}

/* ---------- Da cozinha à taça: abas + cards em carrossel (porte do Cucina, home.js "Nossos produtos") ---------- */
const secaoLinhas = document.querySelector("[data-linhas]");
if (secaoLinhas) {
  const baralho = secaoLinhas.querySelector("[data-baralho]");
  const abas = [...secaoLinhas.querySelectorAll('[role="tab"]')];
  const cards = [...baralho.querySelectorAll(".linha")];
  const fundos = [...secaoLinhas.querySelectorAll("[data-fundo]")];
  // ordem[0] fica no centro, ordem[1] à direita e ordem[2] à esquerda (posições no CSS)
  let ordem = cards.slice();
  const contornos = new Map(); // card -> animação de contorno em andamento

  function aplicar() {
    ordem.forEach((card, pos) => {
      card.dataset.pos = pos;
      const frente = pos === 0;
      card.toggleAttribute("aria-hidden", !frente);
      card.querySelectorAll("a, button").forEach((el) => (frente ? el.removeAttribute("tabindex") : el.setAttribute("tabindex", "-1")));
    });
    const ativo = ordem[0].dataset.linha;
    secaoLinhas.dataset.ativo = ativo;
    abas.forEach((aba) => {
      const sim = aba.dataset.linha === ativo;
      aba.setAttribute("aria-selected", String(sim));
      aba.tabIndex = sim ? 0 : -1;
    });
    fundos.forEach((f) => f.classList.toggle("ativo", f.dataset.fundo === ativo));
  }

  function ativar(linha) {
    const k = ordem.findIndex((c) => c.dataset.linha === linha);
    if (k <= 0) return;
    const posAntes = new Map(ordem.map((c, i) => [c, i]));
    ordem = ordem.slice(k).concat(ordem.slice(0, k)); // gira: o escolhido vai para o centro
    // o card que troca de lado (direita <-> esquerda) passa por trás do centro, menor
    const contorna = ordem.find((c) => posAntes.get(c) > 0 && ordem.indexOf(c) > 0);
    if (calmo || !contorna) return aplicar();
    contorna.getAnimations().forEach((a) => a.cancel());
    const de = getComputedStyle(contorna).transform;
    contorna.classList.add("linha--contornando");
    aplicar();
    const para = getComputedStyle(contorna).transform;
    const anim = contorna.animate([
      { transform: de, zIndex: 0 },
      { transform: "perspective(1400px) translateX(0) rotateY(0deg) scale(0.6)", zIndex: 0 },
      { transform: para, zIndex: 0 },
    ], { duration: 750, easing: "cubic-bezier(.45,0,.25,1)" });
    contornos.set(contorna, anim);
    const fim = () => { if (contornos.get(contorna) === anim) contorna.classList.remove("linha--contornando"); };
    anim.finished.then(fim, fim);
  }

  cards.forEach((c) => {
    c.setAttribute("role", "tabpanel");
    c.querySelectorAll("img, a").forEach((el) => (el.draggable = false)); // senão o navegador arrasta a foto em vez de deslizar
  });
  aplicar();
  secaoLinhas.querySelector("[data-abas-linhas]").hidden = false;
  secaoLinhas.setAttribute("data-baralho-pronto", "");

  abas.forEach((aba, i) => {
    aba.addEventListener("click", () => ativar(aba.dataset.linha));
    aba.addEventListener("keydown", (e) => {
      const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const alvo = passo ? (i + passo + abas.length) % abas.length : e.key === "Home" ? 0 : e.key === "End" ? abas.length - 1 : -1;
      if (alvo < 0) return;
      e.preventDefault();
      abas[alvo].focus();
      ativar(abas[alvo].dataset.linha);
    });
  });

  // clicar num card lateral traz ele para o centro (sem seguir o link dele)
  let deslizou = false;
  baralho.addEventListener("click", (e) => {
    if (deslizou) { deslizou = false; e.preventDefault(); return; }
    const card = e.target.closest(".linha");
    if (card && card.dataset.pos !== "0") { e.preventDefault(); ativar(card.dataset.linha); }
  });

  // deslizar para o lado troca o card (para a esquerda: o da direita; para a direita: o da esquerda)
  let inicio = null;
  baralho.addEventListener("pointerdown", (e) => { inicio = { x: e.clientX, y: e.clientY }; deslizou = false; });
  baralho.addEventListener("pointercancel", () => (inicio = null));
  baralho.addEventListener("pointerup", (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    deslizou = true;
    ativar(ordem[dx < 0 ? 1 : ordem.length - 1].dataset.linha);
  });
}

// Topo: fotos se revezando a cada 7 s. Pausa com a aba escondida ou com o topo fora da tela; com movimento reduzido fica a 1ª.
const slides = [...document.querySelectorAll(".hero__slide")];
// fundo desfocado das laterais: endereço ABSOLUTO da foto (url() relativo dentro de --foto seria lido a partir da pasta do CSS)
slides.forEach((sl) => { const img = sl.querySelector("img"); if (img) sl.style.setProperty("--foto", `url("${img.src}")`); });
if (slides.length > 1 && !calmo) {
  let atual = 0, noTopo = true;
  setInterval(() => {
    if (document.hidden || !noTopo) return;
    const proxima = (atual + 1) % slides.length;
    const img = slides[proxima].querySelector("img");
    if (!img.complete || !img.naturalWidth) return; // ainda carregando: tenta na próxima volta
    const antes = slides[atual];
    antes.classList.add("is-saindo");
    antes.classList.remove("is-ativa");
    slides[proxima].classList.add("is-ativa");
    setTimeout(() => antes.classList.remove("is-saindo"), 1900);
    atual = proxima;
  }, 7000);
  new IntersectionObserver(([e]) => (noTopo = e.isIntersecting)).observe(slides[0].closest(".hero"));
}
