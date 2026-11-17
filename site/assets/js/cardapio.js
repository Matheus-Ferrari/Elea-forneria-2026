/*
 * Cardápio em livro.
 * A lista do HTML ([data-lista]) é o conteúdo; aqui ela vira um livro com folhas que viram em 3D:
 *   - telas largas (≥ 900px): duas páginas abertas (frente da folha = página da direita, verso = próxima da esquerda);
 *   - celular: uma página por vez.
 * As páginas de itens são paginadas medindo o texto, então funcionam em qualquer tamanho de tela.
 * Cada capítulo abre na página da ESQUERDA (foto interativa) de frente para os itens; quando precisa,
 * entra uma página de enfeite (foto ou frase) antes, como num livro de verdade.
 * Também: carrossel de fotos da abertura, foto do prato (ícone de câmera) e pilha de fotos dos vinhos.
 */
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
const VIRA_MS = 950; // igual ao transition da .folha no CSS

/* ---------- Abertura: carrossel das 3 fotos (botões 1-2-3 para escolher) ---------- */
const janelaFotos = document.querySelector("[data-janela-fotos]");
const janelaPontos = document.querySelector("[data-janela-pontos]");
if (janelaFotos && janelaPontos) {
  const fotos = [...janelaFotos.querySelectorAll("img")];
  const botoes = [...janelaPontos.querySelectorAll("button")];
  let atual = 0, timer = null;
  const mostrar = (i) => {
    atual = (i + fotos.length) % fotos.length;
    fotos.forEach((f, k) => f.classList.toggle("is-ativa", k === atual));
    botoes.forEach((b, k) => b.setAttribute("aria-current", String(k === atual)));
  };
  const tocar = () => { clearInterval(timer); if (!calmo) timer = setInterval(() => { if (!document.hidden) mostrar(atual + 1); }, 6000); };
  janelaFotos.classList.add("is-pronto");
  janelaPontos.hidden = false;
  mostrar(0);
  tocar();
  botoes.forEach((b, k) => b.addEventListener("click", () => { mostrar(k); tocar(); }));
}

/* ---------- Pilha de fotos (Vinhos): tocar traz a de trás para a frente ---------- */
document.addEventListener("click", (e) => {
  const pilha = e.target.closest("[data-pilha]");
  if (pilha) pilha.classList.toggle("is-trocada");
});

const raiz = document.querySelector("[data-cardapio]");
if (raiz) iniciarLivro(raiz);

function iniciarLivro(raiz) {
  const largo = matchMedia("(min-width: 900px)");
  const lista = raiz.querySelector("[data-lista]");
  const livro = raiz.querySelector("[data-livro]");
  const palco = livro.querySelector("[data-palco]");
  const miolo = livro.querySelector("[data-miolo]");
  const conta = livro.querySelector("[data-conta]");
  const anuncio = livro.querySelector("[data-anuncio]");
  const modos = raiz.querySelector("[data-modos]");
  const navMarcadores = raiz.querySelector("[data-marcadores]");
  const marcadores = [...navMarcadores.querySelectorAll("[data-ir]")];
  const setas = [...livro.querySelectorAll(".livro__seta")];
  const capitulos = [...lista.querySelectorAll("[data-capitulo]")];
  const pop = document.querySelector("[data-foto-pop]");
  const reservar = document.querySelector(".topo__reservar")?.href || "https://www.instagram.com/eleaforneria/";
  const nomeCap = (cap) => cap.querySelector("h2").textContent.trim();
  const capPorId = Object.fromEntries(capitulos.map((c) => [c.id, c]));
  const SVG = {
    camera: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    seta: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const nomeItem = (item) => item.querySelector(".prato-item__nome").firstChild.textContent.trim();

  // 1) Prepara a lista: capítulo de cada item, botão de foto e camada de troca de foto
  capitulos.forEach((cap) => {
    cap.querySelectorAll(".prato-item").forEach((item) => {
      item.dataset.cap = cap.id;
      if (!item.dataset.foto) return;
      const b = el("button", "prato-item__foto", SVG.camera);
      b.type = "button";
      b.dataset.verFoto = item.id;
      b.setAttribute("aria-label", `Ver foto: ${nomeItem(item)}`);
      item.querySelector(".prato-item__nome").append(b);
    });
    const quadro = cap.querySelector(".foto-viva__quadro");
    if (quadro && !quadro.hasAttribute("data-pilha") && quadro.querySelector("img")) {
      const troca = el("img", "foto-viva__troca");
      troca.alt = "";
      quadro.append(troca);
    }
  });

  // 2) Estado
  let modo = "livro", duplo = largo.matches, paginas = [], folhas = [], s = 0, L = 0;
  let zTopo = 1000, fimTimer = null, emVoo = new Set(), mexeu = false, chaveMedida = "";

  const medida = el("div", "face face--medida");
  medida.setAttribute("aria-hidden", "true");

  function clonar(no) {
    const c = no.cloneNode(true);
    [c, ...c.querySelectorAll("[id]")].forEach((x) => { if (x.id) { x.dataset.ref = x.id; x.removeAttribute("id"); } });
    [c, ...c.querySelectorAll("[aria-labelledby]")].forEach((x) => x.removeAttribute("aria-labelledby"));
    return c;
  }

  function pagina(tipo, { cap = "", cabeca = "", conteudo = null, pe = true } = {}) {
    const pg = el("div", `pg pg--${tipo}`);
    pg.dataset.cap = cap;
    if (cabeca) pg.append(el("p", "pg__cabeca", cabeca));
    const area = el("div", "pg__area");
    if (conteudo) area.append(...[].concat(conteudo));
    pg.append(area);
    if (pe) pg.append(el("p", "pg__pe"));
    return pg;
  }

  const paginaCapa = () => pagina("capa", { pe: false, conteudo: el("div", "", `
    <img class="capa__logo" src="assets/img/brand/logo-elea-creme.png" alt="" width="130" height="130">
    <p class="capa__marca">Elea<span>Forneria</span></p>
    <p class="capa__titulo">Cardápio</p>
    <p class="capa__frase">Cucina, vino e buoni incontri.</p>
    <button class="capa__abrir" type="button" data-virar="1">Abrir o cardápio ${SVG.seta}</button>`) });

  const paginaGuarda = () => pagina("guarda", { pe: false, conteudo: el("div", "guarda__selo", `
    <img src="assets/img/brand/logo-elea-caramelo.png" alt="" width="74" height="74">
    <p>Benvenuti</p><small>Água Fria · São Paulo</small>`) });

  function paginaSumario() {
    const itens = capitulos.map((c) => `<li><button type="button" data-ir="${c.id}"><span class="sumario__num">${c.dataset.num}</span><span class="sumario__nome">${nomeCap(c)}</span><span class="sumario__pontos" aria-hidden="true"></span><span class="sumario__pg"></span></button></li>`).join("");
    const pg = pagina("sumario", { conteudo: [el("p", "pg__titulo", "Sumário"), el("ol", "sumario", itens), el("p", "sumario__nota", "Valores em reais (R$).")] });
    pg.querySelector(".pg__area").style.display = "flex";
    return pg;
  }

  const paginaAbertura = (cap) => {
    const pg = pagina("abertura", { cap: cap.id, conteudo: clonar(cap.querySelector(".capitulo__abertura")) });
    pg.dataset.abre = cap.id;
    return pg;
  };

  // Páginas de enfeite (só no livro aberto em duas páginas), para o capítulo começar sempre à esquerda
  const ENFEITES = [
    () => pagina("frase", { conteudo: el("div", "", '<div class="pg__frase-fio"></div><p class="pg__frase">Cucina, vino<br>e buoni incontri.</p>') }),
    () => fotoEnfeite("assets/img/pessoas/equipe-massa.webp", 1, "Equipe da Elea preparando massa fresca", "Massa fresca, feita na casa."),
    () => fotoEnfeite("assets/img/ambiente/salao-plantas.webp", .8, "Salão da Elea com plantas, mesas de madeira e janelas verdes", "Água Fria, Zona Norte de São Paulo."),
    () => fotoEnfeite("assets/img/pessoas/equipe-salao.webp", .75, "Equipe do salão da Elea sorrindo com garrafas de vinho", "A equipe que recebe você."),
    () => fotoEnfeite("assets/img/ambiente/mesa-varanda.webp", .8, "Mesa posta na varanda da Elea", "Mesa posta na varanda."),
  ];
  function fotoEnfeite(src, r, alt, legenda) {
    return pagina("foto", { conteudo: el("figure", "pg-foto", `<div class="pg-foto__palco"><img src="${src}" alt="${alt}" style="--r: ${r}" loading="lazy"></div><figcaption>${legenda}</figcaption>`) });
  }

  const paginaFim = () => pagina("fim", { conteudo: [
    el("img", "", null), el("p", "fim__titulo", "Grazie e<br><em>buon appetito!</em>"),
    el("p", "fim__texto", "Rua Florinéia, 270 — Água Fria, São Paulo"),
    el("div", "fim__acoes", `<a class="btn btn--terracota btn--pequeno" href="${reservar}" target="_blank" rel="noopener">Reservar uma mesa</a><a class="btn btn--contorno btn--pequeno" href="encomendas.html">Encomendar pães</a>`),
  ] });

  // Itens de um capítulo em quantas páginas forem necessárias (mede o texto de verdade)
  function paginarItens(cap, limite = Infinity) {
    const blocos = [...cap.querySelectorAll(".pratos-lista > li, .capitulo__fim > *")];
    const cabeca = `${cap.dataset.num} · ${nomeCap(cap)}`;
    const pgs = [];
    let pg, area, ul, n;
    const nova = () => {
      pg = pagina("itens", { cap: cap.id, cabeca });
      medida.replaceChildren(pg);
      area = pg.querySelector(".pg__area");
      ul = null; n = 0;
    };
    const lugar = (ehItem) => { if (!ehItem) return area; if (!ul) { ul = el("ul", "pratos-lista"); area.append(ul); } return ul; };
    nova();
    for (const b of blocos) {
      const c = clonar(b), ehItem = b.tagName === "LI";
      lugar(ehItem).append(c);
      const estourou = area.scrollHeight > area.clientHeight + 1 || n >= limite;
      if (estourou && n > 0) {
        c.remove();
        if (ul && !ul.childElementCount) { ul.remove(); ul = null; }
        pgs.push(pg); nova();
        lugar(ehItem).append(c);
      }
      n++;
    }
    pgs.push(pg);
    medida.replaceChildren();
    // equilibra: refaz com o mesmo nº de páginas, mas dividindo os itens por igual (evita página com 1 item só)
    if (pgs.length > 1 && limite === Infinity) {
      const iguais = paginarItens(cap, Math.ceil(blocos.length / pgs.length));
      if (iguais.length === pgs.length) return iguais;
    }
    return pgs;
  }

  // 3) Monta o livro (de novo quando a tela muda de tamanho)
  function montar() {
    const capAntes = s > 0 ? capAtual() : "";
    duplo = largo.matches;
    livro.classList.toggle("livro--duplo", duplo);
    livro.classList.toggle("livro--simples", !duplo);
    palco.append(medida);
    folhas.forEach((f) => f.remove());
    paginas = [];
    const add = (pg) => paginas.push(pg);
    add(paginaCapa());
    if (duplo) add(paginaGuarda());
    const sumario = paginaSumario();
    add(sumario);
    let k = 0;
    for (const cap of capitulos) {
      if (duplo && paginas.length % 2 === 0) add(ENFEITES[k++ % ENFEITES.length]());
      add(paginaAbertura(cap));
      paginarItens(cap).forEach(add);
    }
    if (duplo && paginas.length % 2 === 1) add(ENFEITES[k++ % ENFEITES.length]());
    const fim = paginaFim();
    const logo = fim.querySelector("img");
    Object.assign(logo, { src: "assets/img/brand/logo-elea-caramelo.png", alt: "", width: 86, height: 86 });
    add(fim);

    paginas.forEach((pg, i) => { const pe = pg.querySelector(".pg__pe"); if (pe) pe.textContent = i; });
    sumario.querySelectorAll("[data-ir]").forEach((b) => { b.querySelector(".sumario__pg").textContent = paginas.findIndex((p) => p.dataset.abre === b.dataset.ir); });

    folhas = [];
    for (let i = 0; i < paginas.length; i += duplo ? 2 : 1) {
      const folha = el("div", "folha");
      const frente = el("div", "face face--frente");
      frente.append(paginas[i]);
      if (paginas[i].classList.contains("pg--capa")) frente.classList.add("face--capa");
      const verso = el("div", "face face--verso");
      if (duplo && paginas[i + 1]) verso.append(paginas[i + 1]); else verso.classList.add("face--branca");
      folha.append(frente, verso);
      folhas.push(folha);
    }
    miolo.append(...folhas);
    L = folhas.length;
    medida.remove();
    chaveMedida = chave();

    // volta para onde estava (ou para o capítulo do endereço, ex.: cardapio.html#pizzas)
    const alvo = capAntes || (capPorId[location.hash.slice(1)] ? location.hash.slice(1) : "");
    const i = alvo ? paginas.findIndex((p) => p.dataset.abre === alvo) : 0;
    s = 0;
    irImediato(i > 0 ? estadoDaPagina(i) : 0);
  }
  const chave = () => { palco.append(medida); const k = `${largo.matches}|${medida.offsetWidth}x${medida.offsetHeight}`; medida.remove(); return k; };

  const estadoDaPagina = (i) => (duplo ? Math.ceil(i / 2) : i);
  const visiveis = (st = s) => (duplo ? [2 * st - 1, 2 * st] : [st]).filter((i) => i >= 0 && i < paginas.length);
  const faceDe = (i) => paginas[i]?.parentElement;
  function capAtual(st = s) {
    const v = visiveis(st).map((i) => paginas[i]);
    return (v.find((p) => p.dataset.abre) || v.slice().reverse().find((p) => p.dataset.cap))?.dataset.cap || "";
  }

  // 4) Virar
  function ir(alvo, animar = !calmo) {
    alvo = Math.max(0, Math.min(L - 1, alvo));
    if (alvo === s) return false;
    const frente = alvo > s;
    const virar = [];
    if (frente) for (let k = s; k < alvo; k++) virar.push(k); else for (let k = s - 1; k >= alvo; k--) virar.push(k);
    const passo = Math.min(120, 520 / virar.length);
    const antes = visiveis();
    // durante a virada: mostra as páginas de antes, as de depois e as das folhas em voo
    virar.forEach((k) => emVoo.add(folhas[k]));
    s = alvo;
    const mostrar = new Set([...antes, ...visiveis()]);
    folhas.forEach((f) => f.querySelectorAll(".face").forEach((face) => {
      const pg = face.firstElementChild, i = pg ? paginas.indexOf(pg) : -1;
      face.classList.toggle("is-oculta", !(emVoo.has(f) || mostrar.has(i)));
    }));
    if (!animar) livro.classList.add("livro--sem-animacao");
    virar.forEach((k, i) => {
      const f = folhas[k];
      const atraso = animar ? Math.round(i * passo) : 0;
      f.style.zIndex = ++zTopo;
      f.style.transitionDelay = `${atraso}ms`;
      f.style.setProperty("--atraso", `${atraso}ms`);
      if (animar) { f.classList.remove("is-virando"); void f.offsetWidth; f.classList.add("is-virando"); }
      f.classList.toggle("is-virada", frente);
    });
    atualizar();
    clearTimeout(fimTimer);
    const total = animar ? VIRA_MS + (virar.length - 1) * passo + 40 : 0;
    fimTimer = setTimeout(assentar, total);
    if (!animar) { void miolo.offsetWidth; livro.classList.remove("livro--sem-animacao"); }
    return true;
  }
  function irImediato(alvo) {
    s = Math.max(0, Math.min(L - 1, alvo));
    livro.classList.add("livro--sem-animacao");
    folhas.forEach((f, k) => f.classList.toggle("is-virada", k < s));
    void miolo.offsetWidth;
    livro.classList.remove("livro--sem-animacao");
    atualizar();
    assentar();
  }
  // fim da virada: ordem de empilhamento definitiva e só as páginas abertas visíveis/acessíveis
  function assentar() {
    emVoo.forEach((f) => { f.classList.remove("is-virando"); f.style.transitionDelay = ""; });
    emVoo.clear();
    zTopo = 1000;
    const v = new Set(visiveis());
    folhas.forEach((f, k) => {
      f.style.zIndex = k < s ? k + 1 : L - k + 1;
      f.querySelectorAll(".face").forEach((face) => {
        const i = face.firstElementChild ? paginas.indexOf(face.firstElementChild) : -1;
        face.classList.toggle("is-oculta", !v.has(i));
      });
    });
  }
  // marcadores, contador, setas e acessibilidade (na hora, mesmo durante a animação)
  function atualizar() {
    const v = new Set(visiveis());
    paginas.forEach((pg, i) => { const face = faceDe(i); face.inert = !v.has(i); face.setAttribute("aria-hidden", String(!v.has(i))); });
    folhas.forEach((f) => { const b = f.querySelector(".face--branca"); if (b) { b.inert = true; b.setAttribute("aria-hidden", "true"); } });
    livro.classList.toggle("livro--fechado", duplo && s === 0);
    livro.classList.toggle("livro--fim", s === L - 1);
    livro.style.setProperty("--borda-esq", `${Math.min(10, s * .8)}px`);
    livro.style.setProperty("--borda-dir", `${Math.min(10, (L - 1 - s) * .8)}px`);
    setas[0].disabled = s === 0;
    setas[1].disabled = s === L - 1;
    const cap = capAtual();
    const nums = [...v].filter((i) => paginas[i].querySelector(".pg__pe")).join("–");
    const nome = s === 0 ? "Capa" : cap ? nomeCap(capPorId[cap]) : visiveis().some((i) => paginas[i].classList.contains("pg--sumario")) ? "Sumário" : "Elea Forneria";
    conta.textContent = nums ? `${nome} · p. ${nums}` : nome;
    anuncio.textContent = s === 0 ? "Capa do cardápio" : `${nome}${nums ? `, página ${nums}` : ""}`;
    marcadores.forEach((m) => {
      const sim = m.dataset.ir === cap;
      m.setAttribute("aria-current", String(sim));
      if (sim) navMarcadores.scrollTo({ left: m.offsetLeft - navMarcadores.clientWidth / 2 + m.offsetWidth / 2, behavior: calmo ? "auto" : "smooth" });
    });
  }

  // 5) Ir até um capítulo ou prato (marcadores, sumário, pontos da foto)
  function irPara(id) {
    mexeu = true;
    const ehCap = !!capPorId[id];
    if (modo === "lista") {
      const alvo = document.getElementById(id);
      alvo?.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: ehCap ? "start" : "center" });
      if (!ehCap) piscar(alvo);
      return;
    }
    const i = paginas.findIndex((p) => (ehCap ? p.dataset.abre === id : p.querySelector(`[data-ref="${id}"]`)));
    if (i < 0) return;
    const virou = ir(estadoDaPagina(i));
    const r = palco.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight + r.height * .3) livro.scrollIntoView({ behavior: calmo ? "auto" : "smooth", block: "center" });
    if (!ehCap) setTimeout(() => piscar(paginas[i].querySelector(`[data-ref="${id}"]`)), virou && !calmo ? VIRA_MS : 0);
  }
  function piscar(item) {
    if (!item) return;
    item.classList.remove("is-destaque");
    void item.offsetWidth;
    item.classList.add("is-destaque");
  }

  // 6) Foto do prato: popup (câmera) e troca da foto da abertura ao passar o mouse
  function abrirFoto(id) {
    const item = document.getElementById(id);
    if (!item || !pop || typeof pop.showModal !== "function") return;
    const img = pop.querySelector("[data-pop-img]");
    pop.classList.toggle("prato-pop--foto", !item.hasAttribute("data-recorte"));
    img.src = item.dataset.foto;
    img.alt = item.dataset.fotoAlt || nomeItem(item);
    pop.querySelector("[data-pop-cap]").textContent = nomeCap(capPorId[item.dataset.cap]);
    pop.querySelector("[data-pop-nome]").textContent = nomeItem(item);
    pop.querySelector("[data-pop-preco]").textContent = item.querySelector(".prato-item__preco").textContent.trim();
    pop.querySelector("[data-pop-desc]").textContent = item.querySelector("p")?.textContent || "";
    pop.querySelector("[data-pop-nota]").hidden = !item.hasAttribute("data-confirmar");
    pop.classList.remove("is-trocando");
    void pop.offsetWidth;
    pop.classList.add("is-trocando");
    if (!pop.open) pop.showModal();
  }
  pop?.addEventListener("click", (e) => { if (e.target === pop || e.target.closest("[data-fechar]")) pop.close(); });

  let figTrocada = null, itemSobre = null;
  function figuraDoCapitulo(cap) {
    if (modo === "lista") return capPorId[cap]?.querySelector(".foto-viva");
    if (!duplo) return null;
    const esq = paginas[2 * s - 1];
    return esq?.dataset.abre === cap ? esq.querySelector(".foto-viva") : null;
  }
  function trocarFoto(item) {
    const fig = figuraDoCapitulo(item.dataset.cap || capitulos.find((c) => c.contains(item))?.id);
    const troca = fig?.querySelector(".foto-viva__troca");
    if (figTrocada && figTrocada !== fig) figTrocada.classList.remove("is-trocada");
    if (!troca) return;
    troca.src = item.dataset.foto;
    troca.classList.toggle("is-recorte", item.hasAttribute("data-recorte"));
    fig.classList.add("is-trocada");
    figTrocada = fig;
  }
  raiz.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const item = e.target.closest(".prato-item[data-foto]");
    if (item === itemSobre) return;
    itemSobre = item;
    if (item) trocarFoto(item); else { figTrocada?.classList.remove("is-trocada"); figTrocada = null; }
  });

  // 7) Cliques (um ouvinte só, vale para o livro e para a lista)
  let arrastou = false;
  raiz.addEventListener("click", (e) => {
    const t = e.target;
    const virar = t.closest("[data-virar]");
    if (virar) { mexeu = true; return ir(s + Number(virar.dataset.virar)); }
    const ver = t.closest("[data-ver-foto]");
    if (ver) return abrirFoto(ver.dataset.verFoto);
    const alvoPonto = t.closest(".ponto__alvo");
    if (alvoPonto) {
      const ponto = alvoPonto.parentElement, ativo = !ponto.classList.contains("is-ativo");
      raiz.querySelectorAll(".ponto.is-ativo").forEach((p) => p.classList.remove("is-ativo"));
      ponto.classList.toggle("is-ativo", ativo);
      return;
    }
    raiz.querySelectorAll(".ponto.is-ativo").forEach((p) => p.classList.remove("is-ativo"));
    const ir_ = t.closest("[data-ir]");
    if (ir_) { e.preventDefault(); return irPara(ir_.dataset.ir); }
    const botaoModo = t.closest("[data-modo]");
    if (botaoModo) return trocarModo(botaoModo.dataset.modo);
    // livro aberto em duas páginas: clicar na página da direita avança, na da esquerda volta
    const face = t.closest(".face");
    if (face && duplo && modo === "livro" && !t.closest("a, button, [data-pilha]")) {
      if (arrastou) { arrastou = false; return; }
      mexeu = true;
      ir(s + (face.classList.contains("face--verso") ? -1 : 1));
    }
  });

  // deslizar para o lado vira a página (celular e mouse)
  let toque = null;
  palco.addEventListener("pointerdown", (e) => { if (!e.target.closest("button, a")) toque = { x: e.clientX, y: e.clientY }; arrastou = false; });
  palco.addEventListener("pointercancel", () => (toque = null));
  palco.addEventListener("pointerup", (e) => {
    if (!toque) return;
    const dx = e.clientX - toque.x, dy = e.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    arrastou = true;
    mexeu = true;
    ir(s + (dx < 0 ? 1 : -1));
  });
  palco.addEventListener("keydown", (e) => {
    const passo = { ArrowRight: 1, ArrowLeft: -1, PageDown: 1, PageUp: -1 }[e.key];
    if (!passo) return;
    e.preventDefault();
    mexeu = true;
    ir(s + passo);
  });

  // 8) Livro ou lista
  function trocarModo(m) {
    modo = m;
    livro.hidden = m !== "livro";
    lista.hidden = m === "livro";
    modos.querySelectorAll("[data-modo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === m)));
    if (m === "livro" && chave() !== chaveMedida) montar();
    if (m === "lista") marcadores.forEach((x) => x.setAttribute("aria-current", "false"));
    else atualizar();
  }

  let espera;
  addEventListener("resize", () => {
    clearTimeout(espera);
    espera = setTimeout(() => { if (modo === "livro" && chave() !== chaveMedida) montar(); }, 200);
  });

  // abre a capa sozinho na primeira vez que o livro aparece (se a pessoa ainda não mexeu)
  if (!calmo && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(() => { if (!mexeu && s === 0 && modo === "livro") ir(1); }, 1100);
    }, { threshold: .6 });
    io.observe(palco);
  }

  // Liga o livro (depois das fontes, senão a medição das páginas sai errada)
  modos.hidden = false;
  livro.hidden = false;
  lista.hidden = true;
  (document.fonts?.ready || Promise.resolve()).then(montar);
}
