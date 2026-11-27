/* Home: vídeos que tocam só quando aparecem, carrossel "Prato a prato", os jornais da Imprensa e o painel do ambiente. */
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
 * Os pratos aparecem em 5 blocos iguais (o do meio é o original; os outros são cópias aria-hidden).
 * O trilho anda até `pos` (em pratos, pode ser fracionária) e cada prato gira conforme a distância até o centro
 * (centro reto, esquerda -10°, direita +10°), com a mesma curva e duração de antes; no arraste o giro fica parado
 * e só muda ao soltar, como antes. A animação é feita aqui, quadro a quadro, e não por transição de CSS. Por quê (problemas vistos passando rápido no celular, 27/11/2026):
 *  - encostar o dedo no meio de uma animação cortava a transição e o trilho SALTAVA até ~60px ("travada");
 *    agora o prato congela onde está e segue o dedo;
 *  - a barra de endereço do celular aparecendo/sumindo (resize) também cortava a animação;
 *  - cada prato com transição virava uma camada de vídeo, e vários juntos formavam uma de ~3900px de largura.
 * Para o loop ser infinito, `alvo` sempre volta ao bloco do meio, e `pos` anda o mesmo bloco junto: como as
 * cópias são idênticas, nada muda na tela, a qualquer momento (inclusive no meio da animação ou do arraste).
 * Passa sozinho a cada 2,2 s.
 */
const slider = document.querySelector("[data-giro]");
if (slider) {
  const trilho = slider.querySelector(".giro__trilho");
  const originais = [...trilho.children];
  const n = originais.length;
  const BLOCOS_LADO = 2; // cópias de cada lado do bloco original
  const copia = (el) => { const c = el.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.querySelector("img").alt = ""; return c; };
  for (let k = 0; k < BLOCOS_LADO; k++) { trilho.prepend(...originais.map(copia)); trilho.append(...originais.map(copia)); }
  const itens = [...trilho.children];
  const meio = BLOCOS_LADO * n; // 1º índice do bloco do meio
  slider.closest(".giro").classList.add("giro--ativo");

  const GIRO = 10; // graus dos pratos laterais
  const DURACAO = calmo ? 0 : 700;
  const suave = (t) => 1 - (1 - t) ** 5; // a mesma curva do CSS antigo: cubic-bezier(.22, 1, .36, 1)
  let pos = meio, alvo = meio; // prato mostrado (fracionário durante a animação) e prato de destino
  let posGiro = meio; // de onde sai o giro dos pratos: igual a pos, mas fica parado durante o arraste (como antes)
  let anim = null, quadro = 0; // animação em curso { de, deGiro, t0 } e requestAnimationFrame pendente
  let passo = 0, centro = 0; // medidas: largura prato+espaço e onde o 1º prato fica centralizado
  let arrasto = null, timer = null, visivel = false, iCentro = -1;
  const giros = itens.map(() => null), pertos = itens.map(() => false); // último valor escrito (evita mexer no DOM à toa)

  function medir() {
    const gap = parseFloat(getComputedStyle(trilho).columnGap) || 0;
    passo = itens[0].offsetWidth + gap;
    centro = slider.clientWidth / 2 - itens[0].offsetWidth / 2;
  }
  function pintar() {
    trilho.style.transform = `translate3d(${(centro - pos * passo).toFixed(2)}px,0,0)`;
    for (let i = 0; i < itens.length; i++) {
      const g = Math.round(Math.max(-1, Math.min(1, i - posGiro)) * GIRO * 100) / 100;
      if (giros[i] !== g) { giros[i] = g; itens[i].style.transform = g ? `rotate(${g}deg)` : "none"; }
      // só os pratos perto da tela ganham camada própria de vídeo (girar sem redesenhar a sombra)
      const perto = Math.abs(i - pos) < 1.6; // o do centro e os vizinhos (os únicos que giram numa passada)
      if (pertos[i] !== perto) { pertos[i] = perto; itens[i].classList.toggle("is-perto", perto); }
    }
    if (alvo !== iCentro) { itens[iCentro]?.classList.remove("is-centro"); itens[alvo].classList.add("is-centro"); iCentro = alvo; }
  }
  function laco(agora) {
    quadro = 0;
    if (anim) {
      const t = DURACAO ? Math.min(1, Math.max(0, (agora - anim.t0) / DURACAO)) : 1;
      pos = anim.de + (alvo - anim.de) * suave(t);
      posGiro = anim.deGiro + (alvo - anim.deGiro) * suave(t);
      if (t >= 1) { pos = posGiro = alvo; anim = null; }
    }
    pintar();
    if (anim) quadro = requestAnimationFrame(laco);
  }
  const desenhar = () => { if (!quadro) quadro = requestAnimationFrame(laco); };
  // destino de volta ao bloco do meio; pos (e o início da animação/arraste) andam o mesmo tanto
  function normalizar() {
    const k = Math.floor((alvo - meio) / n) * n;
    if (!k) return;
    alvo -= k; pos -= k; posGiro -= k;
    if (anim) { anim.de -= k; anim.deGiro -= k; }
    if (arrasto) arrasto.pos0 -= k;
  }
  // anda `pulos` pratos a partir do destino atual (cada passada conta, mesmo no meio da anterior)
  function ir(pulos) {
    alvo += Math.max(-n, Math.min(n, pulos));
    normalizar();
    anim = { de: pos, deGiro: posGiro, t0: performance.now() };
    desenhar();
  }

  // Autoplay: só com a seção na tela, sem movimento reduzido e sem interação.
  const parar = () => { clearInterval(timer); timer = null; };
  const tocar = () => { parar(); if (!calmo && visivel && !arrasto && !document.hidden) timer = setInterval(() => ir(1), 2200); };
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; tocar(); }, { rootMargin: "100px 0px" }).observe(slider);
  document.addEventListener("visibilitychange", tocar);
  slider.addEventListener("mouseenter", parar);
  slider.addEventListener("mouseleave", tocar);
  slider.addEventListener("focusin", parar);
  slider.addEventListener("focusout", tocar);

  // Arrastar (mouse e toque). touch-action: pan-y deixa a rolagem vertical livre no celular. Um dedo por vez.
  slider.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || (arrasto && !e.isPrimary)) return; // 2º dedo: ignora (um novo 1º dedo substitui um arraste perdido)
    anim = null; // congela o prato exatamente onde está (sem salto)
    // traz pos para perto do bloco do meio (troca de cópia invisível): sobram pratos dos dois lados para arrastar
    const k = Math.round((pos - meio - (n - 1) / 2) / n) * n;
    pos -= k; alvo -= k; posGiro -= k;
    arrasto = { x: e.clientX, dx: 0, id: e.pointerId, pos0: pos, rastro: [[e.timeStamp, e.clientX]] };
    parar();
    desenhar();
  });
  slider.addEventListener("pointermove", (e) => {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    arrasto.dx = e.clientX - arrasto.x;
    arrasto.rastro.push([e.timeStamp, e.clientX]);
    if (arrasto.rastro.length > 6) arrasto.rastro.shift();
    if (Math.abs(arrasto.dx) > 6 && !slider.classList.contains("is-arrastando")) {
      slider.classList.add("is-arrastando");
      try { slider.setPointerCapture(e.pointerId); } catch {}
    }
    const lim = n - 1; // nunca arrasta além das cópias
    pos = arrasto.pos0 - Math.max(-lim, Math.min(lim, arrasto.dx / passo));
    desenhar();
  });
  const soltar = (e) => {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    const { dx, rastro } = arrasto;
    const [t0, x0] = rastro[0], [t1, x1] = rastro[rastro.length - 1];
    const vel = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0; // px/ms no fim do gesto
    arrasto = null;
    slider.classList.remove("is-arrastando");
    // "jogar" o prato: além do quanto o dedo andou, a velocidade no fim do gesto leva mais pratos (como um impulso)
    const lance = dx + (Math.abs(vel) > 0.3 ? vel * 220 : 0);
    let pulos = Math.abs(lance) < 50 ? 0 : -Math.sign(lance) * Math.max(1, Math.round(Math.abs(lance) / passo));
    if (!pulos && Math.abs(dx) > 15 && Math.abs(vel) > 0.4) pulos = -Math.sign(dx); // peteleco curto e rápido
    ir(Math.max(-4, Math.min(4, pulos)));
    tocar();
  };
  slider.addEventListener("pointerup", soltar);
  slider.addEventListener("pointercancel", soltar);
  // No toque, o navegador já "prende" o dedo na foto do prato; quando o carrossel pega o dedo para si, a foto recebe
  // lostpointercapture, que sobe até aqui. Só conta quando quem perdeu o dedo foi o próprio carrossel — antes isso
  // encerrava o arraste logo nos primeiros pixels e o prato não seguia o dedo no celular (27/11/2026).
  slider.addEventListener("lostpointercapture", (e) => { if (e.target === slider) soltar(e); });
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); ir(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); ir(-1); }
  });
  // Só a LARGURA importa: a barra de endereço do celular (que muda a altura) não mexe no carrossel.
  if ("ResizeObserver" in window) new ResizeObserver(() => { medir(); pintar(); }).observe(slider);
  else addEventListener("resize", () => { medir(); pintar(); });
  medir();
  pintar();

  // Pré-carregamento: as fotos dos pratos (1000×1000 com transparência) baixam e são decodificadas logo depois que
  // a página termina de carregar, ou antes, se a pessoa rolar até perto do carrossel. No 1º arraste já estão
  // prontas (antes só começavam a 100px da tela e decodificavam no meio da passada). Com economia de dados, só perto.
  let preparado = false;
  const preparar = () => {
    if (preparado) return;
    preparado = true;
    itens.forEach((li) => (li.querySelector("img").loading = "eager"));
    originais.forEach((li) => li.querySelector("img").decode?.().catch(() => {}));
  };
  const perto = new IntersectionObserver(([e]) => { if (e.isIntersecting) { preparar(); perto.disconnect(); } }, { rootMargin: "150% 0px" });
  perto.observe(slider);
  if (!economia) {
    const ocioso = () => ("requestIdleCallback" in window ? requestIdleCallback(preparar, { timeout: 3000 }) : setTimeout(preparar, 1500));
    document.readyState === "complete" ? ocioso() : addEventListener("load", ocioso, { once: true });
  }
}

// Demais fotos da Home (A Elea, Imprensa, Da cozinha à taça, Local): começam a baixar ~1,5 tela antes de
// aparecer. O "lazy" do navegador (principalmente no iPhone) espera a foto quase entrar na tela, e rolando
// rápido ela surgia em branco ou dava um tranco ao decodificar.
if ("IntersectionObserver" in window) {
  const antes = new IntersectionObserver((itens) => itens.forEach(({ target: img, isIntersecting }) => {
    if (!isIntersecting) return;
    img.loading = "eager";
    img.decode?.().catch(() => {});
    antes.unobserve(img);
  }), { rootMargin: "150% 0px" });
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => { if (!img.closest("[data-giro]")) antes.observe(img); });
}

/* ---------- Imprensa: 3 jornais abertos numa mesa 3D (data-pos 0 = centro, 1 = direita, 2 = esquerda) ----------
   Clique (ou aba/seta/deslizar) traz qualquer jornal para o centro; os outros dois vão para as laterais, sempre visíveis.
   O que troca de lado passa por trás do centro (mesmo mecanismo de "Da cozinha à taça"). Entrada em cena ao chegar na seção. */
const imprensa = document.querySelector(".imprensa");
const mesa = imprensa?.querySelector("[data-gazetas]");
if (imprensa && "IntersectionObserver" in window) {
  // foto "viva" e brilho só com a seção na tela (fora dela, as camadas animadas ocupavam memória de vídeo)
  new IntersectionObserver(([e]) => imprensa.classList.toggle("is-na-tela", e.isIntersecting)).observe(imprensa);
} else imprensa?.classList.add("is-na-tela");
if (mesa) {
  const jornais = [...mesa.querySelectorAll(".gazeta")];
  const nav = imprensa.querySelector("[data-gazetas-nav]");
  const abas = [...nav.querySelectorAll("[data-alvo]")];
  const leitura = imprensa.querySelector("[data-leitura]");
  const botaoLer = nav.querySelector("[data-ler]");
  const celular = matchMedia("(max-width: 700px)");
  let ordem = jornais.slice();

  // escala: o jornal do centro ocupa ~58% da largura da tela no computador (90% no celular), sem passar da altura
  // da tela (o jornal inteiro + as abas cabem de uma vez); a altura da mesa acompanha
  const escalar = () => {
    const w = mesa.clientWidth;
    const e = Math.min(1.2, (innerHeight - 230) / 660, (w * (w < 701 ? .9 : w < 1100 ? .62 : .58)) / 1000);
    mesa.style.setProperty("--escala", e.toFixed(3));
  };
  if ("ResizeObserver" in window) new ResizeObserver(escalar).observe(mesa);
  addEventListener("resize", escalar); // a altura da tela também conta
  escalar();

  function aplicar() {
    ordem.forEach((j, pos) => {
      j.dataset.pos = pos;
      j.querySelectorAll("a").forEach((a) => (pos ? a.setAttribute("tabindex", "-1") : a.removeAttribute("tabindex")));
      if (pos) { const c = j.querySelector(".gazeta__corpo"); c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
    });
    const i = jornais.indexOf(ordem[0]);
    abas.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    if (!leitura.hidden) ler(); // leitura aberta acompanha o jornal escolhido
  }
  function escolher(j) {
    const k = ordem.indexOf(j);
    if (k <= 0) return;
    const antes = new Map(ordem.map((c, i) => [c, i]));
    ordem = ordem.slice(k).concat(ordem.slice(0, k));
    const contorna = ordem.find((c) => antes.get(c) > 0 && ordem.indexOf(c) > 0);
    if (calmo || !contorna?.animate) return aplicar();
    contorna.getAnimations().filter((a) => a.id === "contorno").forEach((a) => a.cancel());
    const de = getComputedStyle(contorna).transform;
    aplicar();
    const para = getComputedStyle(contorna).transform;
    contorna.classList.add("is-contornando");
    const anim = contorna.animate([{ transform: de }, { transform: "translateX(0) rotateY(0deg) scale(.42)" }, { transform: para }],
      { duration: 1000, easing: "cubic-bezier(.45, 0, .25, 1)", id: "contorno" });
    const fim = () => { if (!contorna.getAnimations().some((a) => a.id === "contorno")) contorna.classList.remove("is-contornando"); };
    anim.finished.then(fim, fim);
  }

  // clique num jornal lateral: vem para o centro (sem seguir o link de dentro dele)
  let deslizou = false;
  mesa.addEventListener("click", (e) => {
    if (deslizou) { deslizou = false; e.preventDefault(); return; }
    const j = e.target.closest(".gazeta");
    if (j && j.dataset.pos !== "0") { e.preventDefault(); escolher(j); }
  });
  // deslizar para o lado (toque): para a esquerda traz o da direita; para a direita, o da esquerda
  let inicio = null;
  mesa.addEventListener("pointerdown", (e) => { inicio = { x: e.clientX, y: e.clientY }; deslizou = false; });
  mesa.addEventListener("pointercancel", () => (inicio = null));
  mesa.addEventListener("pointerup", (e) => {
    if (!inicio) return;
    const dx = e.clientX - inicio.x, dy = e.clientY - inicio.y;
    inicio = null;
    // toque curto num jornal lateral: decide pelo ponto real do dedo (o navegador "puxa" o clique para o link mais
    // próximo, que costuma ser o do jornal do centro, e a faixa visível das laterais no celular é estreita)
    if (e.pointerType !== "mouse" && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const j = document.elementFromPoint(e.clientX, e.clientY)?.closest(".gazeta");
      if (j && j.dataset.pos !== "0") { deslizou = true; escolher(j); }
      return;
    }
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    deslizou = true;
    escolher(ordem[dx < 0 ? 1 : 2]);
  });
  nav.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.alvo) escolher(jornais[Number(b.dataset.alvo)]);
    if (b.dataset.passo) escolher(ordem[b.dataset.passo === "1" ? 1 : 2]);
  });
  nav.hidden = false;

  // inclinação 3D sutil acompanhando o mouse (jornal do centro) e parallax dentro da foto sob o cursor
  if (!calmo && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let pendente = null;
    mesa.addEventListener("pointermove", (e) => {
      if (pendente) return;
      pendente = requestAnimationFrame(() => {
        pendente = null;
        const j = e.target.closest?.('.gazeta[data-pos="0"]');
        const corpo = ordem[0].querySelector(".gazeta__corpo");
        if (!j) { corpo.style.removeProperty("--rx"); corpo.style.removeProperty("--ry"); return; }
        const r = j.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        corpo.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
        corpo.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
        const m = e.target.closest(".gazeta__moldura");
        if (m) {
          const q = m.getBoundingClientRect(), quadro = m.firstElementChild;
          quadro.style.setProperty("--px", `${(((e.clientX - q.left) / q.width - .5) * -10).toFixed(1)}px`);
          quadro.style.setProperty("--py", `${(((e.clientY - q.top) / q.height - .5) * -10).toFixed(1)}px`);
        }
      });
    });
    mesa.addEventListener("pointerleave", () => {
      jornais.forEach((j) => { const c = j.querySelector(".gazeta__corpo"); c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); });
    });
  }

  // "Ampliar" (telas estreitas): as 2 páginas do jornal do centro em tamanho de leitura, uma embaixo da outra
  const conteudo = leitura.querySelector("[data-leitura-conteudo]");
  function ler() {
    const copia = ordem[0].querySelector(".gazeta__corpo").cloneNode(true);
    copia.removeAttribute("style");
    copia.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    copia.querySelectorAll("[tabindex]").forEach((el) => el.removeAttribute("tabindex"));
    conteudo.replaceChildren(copia);
    leitura.hidden = false;
    botaoLer.setAttribute("aria-expanded", "true");
  }
  botaoLer.addEventListener("click", () => { ler(); leitura.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: "start" }); });
  leitura.querySelector("[data-fechar-leitura]").addEventListener("click", () => {
    leitura.hidden = true;
    conteudo.replaceChildren();
    botaoLer.setAttribute("aria-expanded", "false");
    mesa.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: "center" });
  });

  aplicar();

  // Entrada em cena: os jornais chegam de direções diferentes girando, as páginas se abrem a partir da dobra,
  // manchetes, textos e fotos aparecem em sequência e o selo de bicampeã é carimbado por último.
  if (!calmo && mesa.animate && mesa.getBoundingClientRect().top > innerHeight) {
    imprensa.classList.add("is-esperando");
    const entrada = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      entrada.disconnect();
      imprensa.classList.remove("is-esperando");
      const leve = celular.matches;
      const curva = "cubic-bezier(.16, .84, .3, 1)";
      const origens = [
        "translateX(0%) translateY(-55%) rotateX(-38deg) rotateZ(-5deg) scale(.6)", // centro: cai sobre a mesa
        "translateX(140%) translateY(-25%) rotateY(-70deg) rotateZ(16deg) scale(.5)", // direita
        "translateX(-140%) translateY(20%) rotateY(70deg) rotateZ(-14deg) scale(.5)", // esquerda
      ];
      ordem.forEach((j, pos) => {
        const atraso = [260, 0, 130][pos];
        j.animate([{ transform: origens[pos] }, { transform: getComputedStyle(j).transform }], { duration: leve ? 900 : 1400, delay: atraso, easing: curva, fill: "backwards" });
        if (!leve) {
          const [esq, dir] = j.querySelectorAll(".gazeta__pag");
          esq.animate([{ transform: "rotateY(70deg)" }, { transform: "rotateY(5deg)" }], { duration: 1100, delay: atraso + 350, easing: curva, fill: "backwards" });
          dir.animate([{ transform: "rotateY(-70deg)" }, { transform: "rotateY(-5deg)" }], { duration: 1100, delay: atraso + 350, easing: curva, fill: "backwards" });
        }
        j.querySelectorAll("[data-revela]").forEach((el, i) => {
          const foto = !leve && el.matches(".gazeta__foto, .gazeta__dupla");
          el.animate(foto
            ? [{ clipPath: "inset(0 0 100% 0)", opacity: .4 }, { clipPath: "inset(0 0 0% 0)", opacity: 1 }]
            : [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
          { duration: foto ? 900 : 600, delay: atraso + (leve ? 500 : 900) + i * 70, easing: "ease-out", fill: "backwards" });
        });
      });
      imprensa.querySelector(".selo-premio")?.animate([
        { transform: "translateZ(80px) rotate(-28deg) scale(2.6)", opacity: 0 },
        { transform: "translateZ(80px) rotate(13deg) scale(.9)", opacity: 1, offset: .72 },
        { transform: "translateZ(80px) rotate(10deg) scale(1)", opacity: 1 },
      ], { duration: 650, delay: leve ? 1400 : 2200, easing: "cubic-bezier(.3, 0, .2, 1)", fill: "backwards" });
    }, { rootMargin: "0px 0px -12% 0px" });
    entrada.observe(mesa);
  }
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

/* ---------- A casa: o ambiente em recortes diagonais na largura toda ----------
   Computador: 4 recortes verticais inclinados; a cada 10 s (barra de tempo do canto) mudam de forma e 2 fotos trocam.
   Celular: uma foto grande, quase inteira, e uma fatia diagonal da próxima na borda direita; a cada 10 s a fatia varre
   a tela e vira a foto principal (tocar na fatia avança na hora). Clique amplia a foto.
   Pausa: botão, seção fora da tela ou foto ampliada aberta. Movimento reduzido: sem troca automática. */
const casa = document.querySelector("[data-casa]");
if (casa) {
  const painel = casa.querySelector("[data-casa-painel]");
  const recortes = [...painel.querySelectorAll(".casa__recorte")];
  const cel = matchMedia("(max-width: 700px)");
  const curva = "cubic-bezier(.65, 0, .35, 1)";
  // computador: fronteiras dos recortes em % da largura, no alto (a) e embaixo (b)
  const FORMAS = [
    { a: [0, 31, 55, 79, 100], b: [0, 25, 49, 73, 100] },
    { a: [0, 23, 51, 71, 100], b: [0, 29, 44, 77, 100] },
    { a: [0, 38, 58, 80, 100], b: [0, 32, 61, 86, 100] },
    { a: [0, 21, 45, 69, 100], b: [0, 27, 53, 70, 100] },
  ];
  const borda = (v, lado) => (v === 0 || v === 100 ? `${v}%` : `calc(${v}% ${lado > 0 ? "+" : "-"} 3px)`); // fresta de 6px

  const dados = (img) => ({ src: img.getAttribute("src"), alt: img.alt, nome: img.dataset.nome });
  const todas = [...recortes.map((r) => dados(r.querySelector("img"))),
    ...[...casa.querySelector("[data-casa-fotos]").content.querySelectorAll("img")].map(dados)];
  recortes.forEach((r) => { // 2ª camada em cada recorte, para a foto nova entrar por cima
    const c = r.querySelector(".casa__camada"), outra = c.cloneNode(true);
    outra.classList.remove("is-on");
    const img = outra.querySelector("img");
    img.removeAttribute("src"); img.alt = "";
    r.append(outra);
  });
  const camadas = (r) => [...r.querySelectorAll(".casa__camada")];
  const por = (c, f) => { const img = c.querySelector("img"); if (img.getAttribute("src") !== f.src) img.src = f.src; c.dataset.nome = f.nome; };
  const rotular = (r, f) => r.setAttribute("aria-label", `Ampliar foto: ${f.alt}`);

  let ciclo = 0, visiveis = [], fila = []; // computador
  let im = 0, pri = 0, ocupado = false; // celular: foto principal (índice em todas) e camada que a mostra

  function moldar() {
    const f = FORMAS[ciclo % FORMAS.length];
    recortes.forEach((r, i) => {
      const a0 = borda(f.a[i], 1), a1 = borda(f.a[i + 1], -1), b0 = borda(f.b[i], 1), b1 = borda(f.b[i + 1], -1);
      const ini = Math.min(f.a[i], f.b[i]);
      r.style.clipPath = `polygon(${a0} 0, ${a1} 0, ${b1} 100%, ${b0} 100%)`;
      r.style.setProperty("--x", `${ini}%`);
      r.style.setProperty("--w", `${Math.max(f.a[i + 1], f.b[i + 1]) - ini}%`);
    });
  }

  // celular: a fatia é um corte diagonal com a borda esquerda em P% (embaixo) e P+S% (no alto); a foto dentro
  // é cortada 6px depois, e a fresta mostra o papel do fundo da camada
  const S = 8, FATIA = 84, FORA = 101, CHEIA = -S - 4;
  const corte = (P, px) => `polygon(calc(${P + S}% + ${px}px) 0, 200% 0, 200% 100%, calc(${P}% + ${px}px) 100%)`;
  function fatiar(c, para, de, dur) {
    const img = c.querySelector("img");
    c.style.clipPath = corte(para, 0); img.style.clipPath = corte(para, 6);
    if (de == null || !dur) return;
    c.animate([{ clipPath: corte(de, 0) }, { clipPath: corte(para, 0) }], { duration: dur, easing: curva });
    img.animate([{ clipPath: corte(de, 6) }, { clipPath: corte(para, 6) }], { duration: dur, easing: curva });
  }

  // monta a composição do zero (no início e quando a tela passa de celular para computador ou o contrário)
  function montar() {
    ciclo = 0; ocupado = false;
    recortes.forEach((r) => {
      r.style.clipPath = "";
      camadas(r).forEach((c) => {
        const img = c.querySelector("img");
        [...c.getAnimations(), ...img.getAnimations()].forEach((a) => a.cancel());
        c.style.clipPath = img.style.clipPath = c.style.zIndex = "";
        c.classList.remove("is-on");
      });
    });
    if (cel.matches) {
      im = 0; pri = 0;
      const [c1, c2] = camadas(recortes[0]);
      por(c1, todas[0]); c1.classList.add("is-on"); c1.style.zIndex = 1;
      por(c2, todas[1]); c2.classList.add("is-on"); c2.style.zIndex = 2; fatiar(c2, FATIA);
      recortes[0].style.clipPath = "none";
      rotular(recortes[0], todas[0]);
    } else {
      visiveis = todas.slice(0, recortes.length); fila = todas.slice(recortes.length);
      recortes.forEach((r, i) => { const [c] = camadas(r); por(c, visiveis[i]); c.classList.add("is-on"); rotular(r, visiveis[i]); });
      moldar();
    }
  }
  montar();
  cel.addEventListener("change", montar);

  // computador: troca a foto de um recorte (a nova entra por cima, revelada de lado, com um leve recuo do zoom)
  async function trocar(i, atraso) {
    const r = recortes[i], [c1, c2] = camadas(r);
    const sai = c1.classList.contains("is-on") && c1.style.zIndex !== "1" ? c1 : c2.classList.contains("is-on") ? c2 : c1;
    const entra = sai === c1 ? c2 : c1;
    const nova = fila.shift();
    fila.push(visiveis[i]);
    visiveis[i] = nova;
    rotular(r, nova);
    por(entra, nova);
    try { await entra.querySelector("img").decode(); } catch {}
    const lado = i % 2 ? 1 : -1;
    entra.getAnimations().forEach((a) => a.cancel());
    sai.style.zIndex = 1; entra.style.zIndex = 2;
    entra.classList.add("is-on");
    entra.animate([{ clipPath: lado > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
      { duration: 1500, delay: atraso, easing: curva, fill: "backwards" });
    entra.animate([{ transform: "scale(1.16)" }, { transform: "scale(1)" }], { duration: 2600, delay: atraso, easing: "cubic-bezier(.2, .7, .2, 1)", fill: "backwards" });
    setTimeout(() => { if (visiveis[i] === nova) sai.classList.remove("is-on"); }, atraso + 1550);
  }
  // celular: a fatia varre a tela e vira a principal; a antiga recebe a foto seguinte e entra como fatia pela direita
  function avancarCel() {
    if (ocupado) return;
    ocupado = true;
    const cs = camadas(recortes[0]), velha = cs[pri], nova = cs[1 - pri];
    velha.style.zIndex = 1; nova.style.zIndex = 2;
    fatiar(nova, CHEIA, FATIA, 1500);
    im = (im + 1) % todas.length; pri = 1 - pri;
    rotular(recortes[0], todas[im]);
    setTimeout(async () => {
      if (!cel.matches) return;
      fatiar(velha, FORA);
      velha.style.zIndex = 3;
      por(velha, todas[(im + 1) % todas.length]);
      try { await velha.querySelector("img").decode(); } catch {}
      fatiar(velha, FATIA, FORA, 1100);
      setTimeout(() => (ocupado = false), 1150);
    }, 1550);
  }
  function avancar() {
    if (cel.matches) return avancarCel();
    ciclo++;
    moldar();
    [(ciclo * 2) % 4, (ciclo * 2 + 1) % 4].forEach((i, k) => trocar(i, 200 + k * 380));
  }

  // as fotos que ainda não apareceram baixam quando a seção se aproxima
  const perto = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    perto.disconnect();
    todas.forEach((f) => { const im = new Image(); im.src = f.src; im.decode?.().catch(() => {}); });
  }, { rootMargin: "150% 0px" });
  perto.observe(casa);

  // ritmo: a barra de tempo (animação de 10 s no CSS) dispara cada troca; pausar = barra parada
  let correr = () => {};
  if (!calmo) {
    const ritmo = casa.querySelector("[data-casa-ritmo]"), barra = casa.querySelector("[data-casa-barra]"), pausa = casa.querySelector("[data-casa-pausa]");
    correr = () => { barra.classList.remove("is-correndo"); void barra.offsetWidth; barra.classList.add("is-correndo"); };
    barra.addEventListener("animationend", () => { avancar(); correr(); });
    casa.classList.add("is-fora");
    new IntersectionObserver(([e]) => casa.classList.toggle("is-fora", !e.isIntersecting), { threshold: .25 }).observe(painel);
    pausa.addEventListener("click", () => {
      const p = casa.classList.toggle("is-pausado");
      pausa.setAttribute("aria-pressed", String(p));
      pausa.setAttribute("aria-label", p ? "Retomar a troca de fotos" : "Pausar a troca de fotos");
    });
    ritmo.hidden = false;
    correr();

    // parallax leve acompanhando o mouse (cada recorte numa profundidade, --d)
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      let pendente = 0;
      painel.addEventListener("pointermove", (e) => {
        if (pendente) return;
        pendente = requestAnimationFrame(() => {
          pendente = 0;
          const r = painel.getBoundingClientRect();
          painel.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5).toFixed(3));
          painel.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5).toFixed(3));
        });
      });
      painel.addEventListener("pointerleave", () => { painel.style.setProperty("--mx", 0); painel.style.setProperty("--my", 0); });
    }
  }

  // clique: foto ampliada inteira (mesma caixa de luz das galerias), com setas por todas as fotos do ambiente
  if (typeof HTMLDialogElement === "function") {
    const svg = (d) => `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
    const luz = document.createElement("dialog");
    luz.className = "luz";
    luz.setAttribute("aria-label", "Foto do ambiente ampliada");
    luz.innerHTML = `<figure><img alt=""><figcaption></figcaption></figure>
      <button class="icone-btn luz__seta luz__seta--ant" type="button" data-passo="-1" aria-label="Foto anterior">${svg('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>')}</button>
      <button class="icone-btn luz__seta luz__seta--prox" type="button" data-passo="1" aria-label="Próxima foto">${svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>')}</button>
      <button class="icone-btn luz__fechar" type="button" data-fechar aria-label="Fechar">${svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')}</button>`;
    document.body.append(luz);
    const foto = luz.querySelector("img"), legenda = luz.querySelector("figcaption");
    let atual = 0;
    const mostrar = (k) => {
      atual = (k + todas.length) % todas.length;
      foto.src = todas[atual].src; foto.alt = todas[atual].alt; legenda.textContent = todas[atual].nome;
      luz.classList.remove("is-trocando"); void luz.offsetWidth; luz.classList.add("is-trocando");
    };
    recortes.forEach((r, i) => r.addEventListener("click", (e) => {
      let f = visiveis[i];
      if (cel.matches) {
        // toque na fatia da direita: passa para a próxima foto
        if (e.target.closest(".casa__camada") === camadas(recortes[0])[1 - pri]) { avancarCel(); correr(); return; }
        f = todas[im];
      }
      mostrar(todas.indexOf(f));
      casa.classList.add("is-vendo");
      luz.showModal();
    }));
    luz.addEventListener("click", (e) => {
      const passo = e.target.closest("[data-passo]");
      if (passo) return mostrar(atual + Number(passo.dataset.passo));
      if (e.target === luz || e.target.closest("[data-fechar]")) luz.close();
    });
    luz.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") mostrar(atual + 1);
      if (e.key === "ArrowLeft") mostrar(atual - 1);
    });
    luz.addEventListener("close", () => casa.classList.remove("is-vendo"));
  }
}
