# Diretrizes visuais — Elea Forneria

Fonte: `BRAND_KIT_ELEA_V2.md`. Tokens em `site/assets/css/style.css` (`:root`) — única fonte de cor.

## Regra principal
- **Cabeçalho sempre MARROM** (`--madeira` #7A5A3A) com o **logo oficial claro** (círculo com as mãos). Nunca verde.
- Logo: só os arquivos de `site/assets/img/brand/` (derivados do `Logo elea fundo branco.jpg`, apenas recoloridos — creme para fundo escuro, caramelo para fundo claro). Não redesenhar nem escrever "ELEA" em fonte serif no lugar do logo.
- **Exceção aprovada pela agência (15/11/2026):** o hero da Home usa "ELEA / FORNERIA" tipográfico (Cormorant) no centro, sobre o vídeo real escurecido, com "Cucina, vino e buoni incontri." O logo oficial continua no cabeçalho e no rodapé. Se a Elea preferir, trocar o `<h1 class="marca-titulo">` pelo símbolo oficial (`{{logo:creme:200}}`).

## Cores
| Papel | Token | Hex | Uso |
|---|---|---|---|
| Principal | `--madeira` | #7A5A3A | cabeçalho, topo das páginas internas |
| Principal | `--madeira-escura` | #4A3423 | títulos, fundo da imprensa/hero |
| Principal | `--caramelo` | #A97A4C | faixa editorial, detalhes |
| Principal | `--caramelo-escuro` | #8A5F36 | botão principal (texto creme, contraste AA) |
| Principal | `--creme` / `--papel` | #F5EFE6 / #FBF7F0 | fundos |
| Principal | `--bege` / `--bege-claro` | #D9C8B2 / #EADFCF | bordas, seções alternadas |
| Acento | `--floresta` / `--ervas` / `--salvia` | #1F4D36 / #477A4E / #8EA178 | traço do kicker, ícones, status |
| Acento | `--limao` | #F4C430 | selo de prêmio, contador do carrinho, foco |
| Apoio | `--vinho` / `--grafite` | #6B2E2E / #2F2A26 | links de imprensa, rodapé |

Verde e limão **só em detalhes** (traços, ícones, selos, padrão de limões). Nunca em blocos grandes.
Exceção: o botão flutuante de WhatsApp usa o logo oficial no verde do WhatsApp (#25D366), pedido da agência (16/11/2026).

## Tipografia
- Títulos: **Cormorant Garamond** 500/600 (itálico para ênfase). Texto e interface: **DM Sans** 400–700.
- Kicker: DM Sans 700, caixa alta, espaçamento 0,2em, com traço verde.

## Fotografia
- 100% fotos reais da Elea. Nada gerado por IA como se fosse foto da casa.
- **Pratos sem corte:** galeria em colunas (masonry) mantém a proporção original. Corte só em fotos de ambiente.
- Padrão de limões (`brand/padrao-limoes.jpg`) só como detalhe: faixa lateral, selo, topo das páginas internas.
- Novas fotos: colocar em `img/` e rodar `python ferramentas/gerar_imagens.py` (gera WebP em `site/assets/img/extras/`).

## Movimento
- Leve e opcional: revelar ao rolar, zoom suave no hover, vídeos que só tocam quando visíveis.
- Imprensa "jornal vivo": recortes levemente inclinados, foto em sépia que "respira" (Ken Burns) e ganha cor no hover, parallax de até 24 px.
- **Prato a prato** (inspirado em qissa.co.uk, com as cores da Elea): carrossel arrastável e infinito sobre fundo marrom-escuro com "farinha" (não prende a rolagem). Prato do centro reto, à esquerda −10°, à direita +10°, transição 0,7 s `cubic-bezier(.22,1,.36,1)`, avança sozinho a cada 2,2 s e para ao passar o mouse/arrastar. Pratos recortados em círculo por `ferramentas/recortar_pratos.py`.
- **Janela**: foto parada (orecchiette com guardanapo de limões) e a página passando por cima (`clip-path` + `position: fixed`, funciona no iPhone).
- **Cardápio em livro**: folhas viram em volta da lombada (`rotateY(-180deg)`, 0,95 s) com sombra passando na página; o livro fica sobre a madeira escurecida. Fotos dos capítulos com pontos amarelos pulsando (rótulo creme com nome e preço). Com movimento reduzido, as páginas trocam sem animação.
- `prefers-reduced-motion`: desliga animações, parallax e vídeos (fica o poster). Economia de dados também desliga os vídeos.

## Acessibilidade
Contraste mínimo 4,5:1 no texto, alvos de toque ≥ 44 px, foco visível (limão), `alt` descritivo nas fotos, link "Pular para o conteúdo".
