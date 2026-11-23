/*
 * Cardápio em livro.
 * A lista do HTML ([data-lista]) é o conteúdo; aqui ela vira um livro com folhas que viram em 3D:
 *   - telas largas (≥ 900px): duas páginas abertas (frente da folha = página da direita, verso = próxima da esquerda);
 *   - celular: uma página por vez.
 * As páginas de itens são paginadas medindo o texto, então funcionam em qualquer tamanho de tela.
 * Cada capítulo abre na página da ESQUERDA (foto interativa) de frente para os itens; quando precisa,
 * entra uma página de enfeite (foto ou frase) antes, como num livro de verdade.
 * Também: carrossel de fotos da abertura, foto do prato (ícone de câmera) e pilha de fotos dos vinhos.
 * Fotos dos pratos: só itens com data-foto (data-foto-reserva = foto guardada, fora da demonstração).
 *   - mouse: passar sobre o item mostra o prato na foto da abertura (ou na página ao lado); sair volta ao original;
 *   - clique/toque no item ou na câmera: abre a foto grande, sem virar a página nem mexer na rolagem.
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

  // 1) Prepara a lista: pratos com foto primeiro (mantendo a ordem entre eles), capítulo de cada item,
  //    botão de foto e camada de troca de foto
  capitulos.forEach((cap) => {
    cap.querySelectorAll(".pratos-lista").forEach((ul) => ul.prepend(...ul.querySelectorAll(":scope > .prato-item[data-foto]")));
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
      for (let k = 0; k < 2; k++) { const troca = el("img", "foto-viva__troca"); troca.alt = ""; quadro.append(troca); }
    }
  });

  // 2) Estado
  let modo = "livro", duplo = largo.matches, paginas = [], folhas = [], s = 0, L = 0;
  let fimTimer = null, emVoo = new Set(), mexeu = false, chaveMedida = "";

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

  // Páginas editoriais (só no livro aberto em duas páginas). Entram quando o capítulo seguinte precisa começar
  // à esquerda, e cada uma FECHA o capítulo a que pertence (a da massa fresca fecha "Principais", a da equipe
  // com os vinhos fecha "Vinhos"). Antes elas se revezavam pela ordem, e a foto caía em qualquer capítulo.
  const frase = () => pagina("frase", { conteudo: el("div", "", '<div class="pg__frase-fio"></div><p class="pg__frase">Cucina, vino<br>e buoni incontri.</p>') });
  const ENFEITES = {
    "para-compartilhar": () => fotoEnfeite("assets/img/momentos/comer-em-fartura.webp", .75, "Mesa vista de cima com vários pratos sendo compartilhados", "Pratos no centro da mesa, para dividir."),
    principais: () => fotoEnfeite("assets/img/pessoas/equipe-massa.webp", 1, "Dois cozinheiros da Elea abrindo massa fresca com as mãos", "Massa fresca, feita na casa."),
    pizzas: () => fotoEnfeite("assets/img/ambiente/salao-plantas.webp", .8, "Salão da Elea com plantas, mesas de madeira e janelas verdes", "Água Fria, Zona Norte de São Paulo."),
    sobremesas: () => fotoEnfeite("assets/img/ambiente/mesa-varanda.webp", .8, "Mesa posta na varanda da Elea", "Mesa posta na varanda."),
    paes: frase,
    vinhos: () => fotoEnfeite("assets/img/pessoas/equipe-salao.webp", .75, "Equipe do salão da Elea sorrindo com garrafas de vinho", "A equipe que recebe você."),
  };
  const enfeite = (cap, fazer = ENFEITES[cap?.id] || frase) => { const pg = fazer(); if (cap) pg.dataset.cap = cap.id; return pg; };
  // capítulos cuja página editorial não pode faltar: se o capítulo já terminou à direita, ela entra numa
  // dupla editorial (foto + frase) antes do capítulo seguinte, em vez de sumir naquele tamanho de tela
  const EDITORIAL_FIXA = new Set(["principais"]);
  function fotoEnfeite(src, r, alt, legenda) {
    return pagina("foto", { conteudo: el("figure", "pg-foto", `<div class="pg-foto__palco"><img src="${src}" alt="${alt}" style="--r: ${r}" loading="lazy"></div><figcaption>${legenda}</figcaption>`) });
  }

  const paginaFim = () => pagina("fim", { conteudo: [
    el("img", "", null), el("p", "fim__titulo", "Grazie e<br><em>buon appetito!</em>"),
    el("p", "fim__texto", "Rua Florinéia, 270 — Água Fria, São Paulo"),
    el("div", "fim__acoes", `<a class="btn btn--terracota btn--pequeno" href="${reservar}" target="_blank" rel="noopener">Reservar uma mesa</a><a class="btn btn--contorno btn--pequeno" href="encomendas.html">Encomendar pães</a>`),
  ] });

  // Itens de um capítulo em quantas páginas forem necessárias (mede o texto de verdade).
  // A 1ª página fica de frente para o título do capítulo, então não repete o nome; as seguintes levam
  // "continuação" no cabeçalho, para não parecer um segundo capítulo com o mesmo nome.
  function paginarItens(cap, limite = Infinity) {
    const blocos = [...cap.querySelectorAll(".pratos-lista > li, .capitulo__fim > *")];
    const cabeca = `${cap.dataset.num} · ${nomeCap(cap)} · continuação`;
    const pgs = [];
    let pg, area, ul, n;
    const nova = () => {
      pg = pagina("itens", { cap: cap.id, cabeca: pgs.length ? cabeca : "" });
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
    soltarFoto(true);
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
    let anterior = null;
    for (const cap of capitulos) {
      if (duplo && paginas.length % 2 === 0) add(enfeite(anterior));
      else if (duplo && EDITORIAL_FIXA.has(anterior?.id)) { add(enfeite(anterior)); add(enfeite(anterior, frase)); }
      add(paginaAbertura(cap));
      paginarItens(cap).forEach(add);
      anterior = cap;
    }
    if (duplo && paginas.length % 2 === 1) add(enfeite(anterior));
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
    encaixarRotulos(miolo);

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
  // Ordem das folhas (z-index): na pilha da direita a folha de número menor fica por cima; na da esquerda, a maior.
  // Cada folha em voo troca de pilha no meio da virada (90°). Antes, todas as folhas de um salto subiam por cima
  // de uma vez e a última (uma página do MEIO do caminho, ex.: a foto editorial antes de Pizzas) aparecia de repente.
  // Num salto, as páginas do meio passam em branco (.is-folheando) e só algumas folhas voam (MAX_VOO).
  const MAX_VOO = 4;
  const zPilha = (k, esquerda) => (esquerda ? 3000 + k : 2000 - k);
  const trocaPilha = new Map();
  function ir(alvo, animar = !calmo) {
    alvo = Math.max(0, Math.min(L - 1, alvo));
    if (alvo === s) return false;
    soltarFoto(true);
    const frente = alvo > s;
    const virar = [];
    if (frente) for (let k = s; k < alvo; k++) virar.push(k); else for (let k = s - 1; k >= alvo; k--) virar.push(k);
    let voam = virar;
    if (animar && virar.length > MAX_VOO) {
      const n = virar.length - 1, escolhidas = new Set([0, Math.round(n / 3), Math.round((2 * n) / 3), n]);
      voam = virar.filter((_, i) => escolhidas.has(i));
    }
    const passo = Math.min(120, 520 / voam.length);
    const antes = visiveis();
    s = alvo;
    // durante a virada: páginas de antes e de depois com conteúdo; folhas em voo só com o papel; o resto escondido
    const mostrar = new Set([...antes, ...visiveis()]);
    voam.forEach((k) => emVoo.add(folhas[k]));
    folhas.forEach((f) => f.querySelectorAll(".face").forEach((face) => {
      const pg = face.firstElementChild, i = pg ? paginas.indexOf(pg) : -1, voa = emVoo.has(f);
      face.classList.toggle("is-oculta", !(voa || mostrar.has(i)));
      face.classList.toggle("is-folheando", voa && !mostrar.has(i));
    }));
    if (!animar) livro.classList.add("livro--sem-animacao");
    // folhas do meio de um salto longo: viram escondidas, sem animação
    const pulam = virar.filter((k) => !voam.includes(k)).map((k) => folhas[k]);
    pulam.forEach((f) => { f.style.transition = "none"; f.classList.toggle("is-virada", frente); });
    if (pulam.length) { void miolo.offsetWidth; pulam.forEach((f) => (f.style.transition = "")); }
    voam.forEach((k, i) => {
      const f = folhas[k];
      const atraso = animar ? Math.round(i * passo) : 0;
      clearTimeout(trocaPilha.get(f));
      f.style.zIndex = zPilha(k, !frente); // sai por cima da pilha de onde está...
      trocaPilha.set(f, setTimeout(() => { f.style.zIndex = zPilha(k, frente); }, animar ? atraso + VIRA_MS / 2 : 0)); // ...e no meio passa para a outra
      f.style.transitionDelay = `${atraso}ms`;
      f.style.setProperty("--atraso", `${atraso}ms`);
      if (animar) { f.classList.remove("is-virando"); void f.offsetWidth; f.classList.add("is-virando"); }
      f.classList.toggle("is-virada", frente);
    });
    atualizar();
    clearTimeout(fimTimer);
    const total = animar ? VIRA_MS + (voam.length - 1) * passo + 40 : 0;
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
    trocaPilha.forEach((t) => clearTimeout(t));
    trocaPilha.clear();
    emVoo.forEach((f) => { f.classList.remove("is-virando"); f.style.transitionDelay = ""; });
    emVoo.clear();
    const v = new Set(visiveis());
    folhas.forEach((f, k) => {
      f.style.zIndex = k < s ? k + 1 : L - k + 1;
      f.querySelectorAll(".face").forEach((face) => {
        const i = face.firstElementChild ? paginas.indexOf(face.firstElementChild) : -1;
        face.classList.toggle("is-oculta", !v.has(i));
        face.classList.remove("is-folheando");
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

  // 6) Foto do prato: popup (clique/toque no item ou na câmera) e foto na página ao passar o mouse
  function abrirFoto(id, foco) {
    const item = document.getElementById(id);
    if (!item?.dataset.foto || !pop || typeof pop.showModal !== "function") return;
    soltarFoto(true);
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
    // Ao fechar, o navegador devolve o foco a quem estava focado. Se fosse o palco do livro (que recebe o foco
    // ao clicar numa página), a tela rolaria até ele: foca antes a câmera do prato, sem rolar.
    foco?.focus({ preventScroll: true });
    if (!pop.open) pop.showModal();
  }
  pop?.addEventListener("click", (e) => { if (e.target === pop || e.target.closest("[data-fechar]")) pop.close(); });

  // Destino da foto ao passar o mouse: a foto da abertura do capítulo, se ela estiver aberta (ou na lista);
  // senão, a página ao lado vira uma "página de foto" (vitrine). No celular não há hover: vale o toque.
  const vitrine = el("figure", "livro__vitrine", '<div class="livro__vitrine-palco"><img alt=""><img alt=""></div><figcaption><span></span><b></b></figcaption>');
  vitrine.setAttribute("aria-hidden", "true");
  miolo.append(vitrine);
  const camadas = (no, sel) => [...no.querySelectorAll(sel)];
  function destinoFoto(item) {
    const cap = item.dataset.cap || capitulos.find((c) => c.contains(item))?.id;
    if (modo === "lista") {
      const fig = capPorId[cap]?.querySelector(".foto-viva");
      return fig?.querySelector(".foto-viva__troca") ? { no: fig, imgs: camadas(fig, ".foto-viva__troca") } : null;
    }
    if (!duplo || emVoo.size) return null;
    const vis = visiveis();
    const fig = vis.map((i) => paginas[i]).find((p) => p.dataset.abre === cap)?.querySelector(".foto-viva");
    if (fig?.querySelector(".foto-viva__troca")) return { no: fig, imgs: camadas(fig, ".foto-viva__troca") };
    const outra = vis.find((j) => j !== paginas.indexOf(item.closest(".pg")));
    if (outra == null) return null;
    return { no: vitrine, imgs: camadas(vitrine, "img"), lado: outra % 2 === 1 ? "esq" : "dir" };
  }

  let fotoAtiva = null, soltarTimer = 0, pedido = 0, realce = null, itemSobre = null;
  function esconder(d) {
    d.imgs.forEach((i) => i.classList.remove("is-on"));
    d.no.classList.remove(d.no === vitrine ? "is-on" : "is-trocada");
  }
  function trocarCamada(imgs, src, recorte, meu) {
    const atual = imgs.find((i) => i.classList.contains("is-on"));
    if (atual && atual.dataset.src === src) return;
    const nova = imgs.find((i) => i !== atual);
    nova.dataset.src = src;
    nova.classList.toggle("is-recorte", recorte);
    if (nova.getAttribute("src") !== src) nova.src = src;
    const mostrar = () => { if (meu === pedido) imgs.forEach((i) => i.classList.toggle("is-on", i === nova)); };
    if (nova.complete && nova.naturalWidth) mostrar(); else (nova.decode ? nova.decode() : Promise.resolve()).then(mostrar, mostrar);
  }
  function mostrarFoto(item) {
    clearTimeout(soltarTimer);
    const d = destinoFoto(item);
    if (!d) return soltarFoto(true);
    if (fotoAtiva && fotoAtiva.no !== d.no) esconder(fotoAtiva);
    const meu = ++pedido;
    const src = item.dataset.foto, recorte = item.hasAttribute("data-recorte");
    if (d.no === vitrine) {
      const entrar = () => {
        if (meu !== pedido) return;
        vitrine.dataset.lado = d.lado;
        vitrine.querySelector("figcaption span").textContent = nomeItem(item);
        vitrine.querySelector("figcaption b").textContent = item.querySelector(".prato-item__preco").textContent.trim();
        vitrine.classList.add("is-on");
        trocarCamada(d.imgs, src, recorte, meu);
      };
      // mudou de página (esquerda/direita): a vitrine sai e entra do outro lado, sem pular
      if (vitrine.classList.contains("is-on") && vitrine.dataset.lado !== d.lado) { esconder(d); setTimeout(entrar, 260); }
      else entrar();
    } else {
      d.no.classList.add("is-trocada");
      trocarCamada(d.imgs, src, recorte, meu);
    }
    fotoAtiva = d;
  }
  // sair do item volta a foto original (com uma pequena espera, para não piscar ao passar de um prato a outro)
  function soltarFoto(agora = false) {
    clearTimeout(soltarTimer);
    const fazer = () => { pedido++; if (fotoAtiva) esconder(fotoAtiva); fotoAtiva = null; };
    if (agora) { itemSobre = null; realcar(null); fazer(); } else soltarTimer = setTimeout(fazer, 160);
  }
  // item sem foto própria que aparece na foto da abertura (ponto amarelo): acende o ponto dele
  function realcar(item) {
    realce?.classList.remove("is-realce");
    realce = null;
    if (!item) return;
    const id = item.dataset.ref || item.id, cap = item.dataset.cap;
    const base = modo === "lista" ? capPorId[cap] : visiveis().map((i) => paginas[i]).find((p) => p.dataset.abre === cap);
    const ponto = base?.querySelector(`.ponto__rotulo[data-ir="${id}"]`)?.parentElement;
    if (ponto) { ponto.classList.add("is-realce"); realce = ponto; }
  }
  raiz.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const item = e.target.closest(".prato-item");
    if (item === itemSobre) return;
    itemSobre = item;
    realcar(item && !item.dataset.foto ? item : null);
    if (item?.dataset.foto) mostrarFoto(item); else soltarFoto();
  });
  raiz.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    itemSobre = null;
    realcar(null);
    soltarFoto();
  });

  // 7) Cliques (um ouvinte só, vale para o livro e para a lista)
  let arrastou = false;
  raiz.addEventListener("click", (e) => {
    const t = e.target;
    const virar = t.closest("[data-virar]");
    if (virar) { mexeu = true; return ir(s + Number(virar.dataset.virar)); }
    const ver = t.closest("[data-ver-foto]");
    if (ver) return abrirFoto(ver.dataset.verFoto, ver);
    // clique/toque no prato com foto abre a foto (não vira a página); arrastar para o lado continua virando
    const itemFoto = t.closest(".prato-item[data-foto]");
    if (itemFoto && !t.closest("a, button")) {
      if (arrastou) { arrastou = false; return; }
      return abrirFoto(itemFoto.dataset.ref || itemFoto.id, itemFoto.querySelector("[data-ver-foto]"));
    }
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

  // 7b) Rótulos dos pontos amarelos: sempre dentro da foto. Se não cabe do lado previsto, vai para o outro lado;
  //     se não cabe de nenhum, é empurrado para dentro (--desloc). Antes, no celular, o rótulo passava da borda,
  //     alargava a página e o botão do WhatsApp ia junto para fora da tela.
  function encaixarRotulos(escopo) {
    escopo.querySelectorAll(".ponto").forEach((p) => {
      const rot = p.querySelector(".ponto__rotulo"), quadro = p.offsetParent;
      if (!rot || !quadro) return;
      if (!("ladoOriginal" in p.dataset)) p.dataset.ladoOriginal = p.dataset.lado || "";
      p.style.removeProperty("--desloc");
      const W = quadro.offsetWidth, x = p.offsetLeft, w = rot.offsetWidth, M = 6, G = 24;
      if (!W || !w) return;
      const cabeDir = x + G + w <= W - M, cabeEsq = x - G - w >= M;
      let lado = p.dataset.ladoOriginal === "esq" ? "esq" : "dir";
      if (lado === "dir" && !cabeDir && (cabeEsq || x > W / 2)) lado = "esq";
      else if (lado === "esq" && !cabeEsq && (cabeDir || x < W / 2)) lado = "dir";
      if (lado === "esq") p.dataset.lado = "esq"; else delete p.dataset.lado;
      const sobra = lado === "dir" ? W - M - (x + G + w) : x - G - w - M;
      if (sobra < 0) p.style.setProperty("--desloc", `${Math.round(sobra)}px`);
    });
  }

  // 8) Livro ou lista
  function trocarModo(m) {
    soltarFoto(true);
    modo = m;
    livro.hidden = m !== "livro";
    lista.hidden = m === "livro";
    modos.querySelectorAll("[data-modo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modo === m)));
    if (m === "livro" && chave() !== chaveMedida) montar();
    if (m === "lista") { marcadores.forEach((x) => x.setAttribute("aria-current", "false")); encaixarRotulos(lista); }
    else atualizar();
  }

  let espera;
  addEventListener("resize", () => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      if (modo === "livro" && chave() !== chaveMedida) montar();
      if (modo === "lista") encaixarRotulos(lista);
    }, 200);
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
