# Continuar no Claude Code — Elea Forneria (estado em 15/11/2026)

## Decisão de tecnologia
**HTML + CSS + JavaScript puro + Firebase**, no mesmo padrão do projeto **Cucina** (`Desktop\Cucina`): páginas montadas de `fonte/` para `site/` e Firebase Hosting + Firestore + Authentication, equipe em `admins/{uid}`.
- Por que não React: site de restaurante precisa de SEO e carregamento rápido; HTML estático resolve, sem build pesado, e a agência já mantém o Cucina assim.
- Por que não MySQL/phpMyAdmin: exigiria escrever e proteger um backend PHP (login, sessões, SQL). O Firebase já dá login seguro e banco.
- **Custo:** o plano gratuito (Spark) cobre Hosting + Firestore + login para o volume de uma forneria. Só o **pagamento online** (Mercado Pago/Cielo via Functions) exige o plano Blaze (cobra por uso; nesse volume tende a R$ 0, mas pede cartão).

## O que está pronto
- **Home** (`/`): cabeçalho marrom `#4A301D` com wordmark ELEA/FORNERIA, menu Home · Cardápio · Quem Somos · Local e Horários · Vagas · Encomendas e botão Reservar terracota; hero no padrão do mockup aprovado (`Downloads\Mockup de Homepage da Elea Forneria.png`): foto do nhoque verde (`hero/nhoque-verde.webp`, PROVISÓRIA: é a imagem do mockup; trocar por foto real antes de publicar), 4 fotos (`hero/nhoque-verde`, `hero-2/3/4.webp`, 1672×941) revezando a cada 7 s com fade + desfoque→nítido + afastando (`.hero__slide`, fim de home.js), foto inteira sem corte; no celular (até 700px) as fotos 2–4 usam a versão vertical (`hero-N-celular.webp`) e o texto se divide: nome + frase em cima, botão embaixo (`.hero__cta { margin-top: auto }`), porque o prato fica no meio da foto (~26–72% da altura); letreiro contínuo no marrom; A Elea (resumo + botão para Quem somos); Prato a prato (logo oficial carimbado na mesa de madeira, carrossel arrastável estilo qissa.co.uk (infinito: 5 blocos iguais; desde 27/11/2026 animado quadro a quadro em home.js, sem transição de CSS: encostar o dedo no meio da animação não faz mais o trilho saltar; fotos dos pratos pré-carregadas e decodificadas logo após o carregamento da página; no celular o topo não baixa mais a versão de computador das fotos), só os 5 recortes enviados pelo usuário (PNG sem fundo → `pratos-recorte/*.webp` 1000px): Bottoni alla Nerano, Ancho Angus, Mil-folhas de Atum, Fregola Gamberi & Cozze (nomes/descrições OFICIAIS do Instagram) e Caramelle (`data-confirmar`: sem descrição oficial). Clique abre popup grande (prato sobre a madeira entrando girando, setas anterior/próximo, Reservar + Cardápio). Prato 5 oficial "Massa verde com creme e crocante" = foto do nhoque no hero (nome provisório, não inventar); Imprensa (desde 27/11/2026: 3 jornais abertos de 2 páginas numa mesa 3D, `.gazeta` em index.html/style.css/home.js; clicar, deslizar ou as abas trazem um jornal para o centro e os outros 2 ficam visíveis nas laterais; entrada em cena ao rolar; "Ampliar" no celular; só material verificado: blocos "Na imprensa" = resumo + link original, blocos "Da casa" = texto institucional; páginas com tamanho fixo 500×660, texto a mais é cortado no pé); "Da cozinha à taça" (abas 01 Pratos · 02 Vinhos · 03 Forneria, cards em carrossel 3D portados do Cucina, fundo muda de cor por aba); Local e horários (6 fotos do local passando, só CSS). Botão flutuante de WhatsApp em todas as páginas públicas (`flutuante` em montar-paginas.mjs). **Não é LP:** o site tem páginas próprias.
- **Cardápio** (`/cardapio`): abertura com carrossel de 3 fotos (`janela/cardapio-1/2/3.webp`, botões 1-2-3 para a Elea escolher a melhor) e a frase "Massas frescas, pizzas de forno e bons encontros." Depois, o **cardápio em livro** (`cardapio.js`): capa, guarda de limões, sumário e 6 capítulos (Para compartilhar, Principais, Pizzas, Sobremesas, Encomende nossos pães, Vinhos), com páginas que viram em 3D (setas, cantos dobrados, marcadores, arrastar, teclado). Cada capítulo abre na página da esquerda com uma **foto interativa** (pontos sobre os pratos → nome/preço → leva ao item). Itens com câmera abrem a foto do prato. Botão "Lista" mostra o mesmo conteúdo em lista (é também o que aparece sem JS). Fotos dos pratos (23/11/2026): `data-foto` = foto ativa (13 pratos; **pratos com foto vêm primeiro** em cada capítulo, garantido também pelo `cardapio.js`); `data-foto-reserva` = foto guardada, sem câmera; a 1ª página de itens de cada capítulo não repete o nome (está de frente para o título), as seguintes dizem "continuação"; inventário em `docs/PENDENCIAS_IMAGENS_CARDAPIO.md`. Clique/toque no prato abre a foto (não vira a página); no desktop o hover mostra o prato na foto da abertura ou na página ao lado (vitrine). As páginas editoriais pertencem a um capítulo (`ENFEITES` em `cardapio.js`; a da massa fresca sempre fecha Principais). Num salto de várias páginas, as folhas trocam de pilha no meio da virada e as páginas do meio passam em branco. Fim da página: bloco `.forneria` (foto em arco de tamanho contido sobre painel de limões + selo da Elea, e "Aproximadamente 900 g de focaccia artesanal"). Conteúdo transcrito dos stories "Cardápio!" do Instagram (~jul/2026); **os prints cortavam o fim de Principais e de Pães** e a **carta de vinhos ainda não veio** (`tbc`). Pontos das fotos e fotos com `data-confirmar` foram identificados pela imagem: confirmar com a Elea. Sobremesas ainda sem foto (abertura com padrão de limões).
- **Quem somos** (`/quem-somos`, refeito em 23/11/2026): história (arco com Manuela e Enrico); **Quem faz** = um `<article class="perfil">` por pessoa/equipe (Enrico, Manuela, cozinha, salão: foto, papel, texto, 2ª foto opcional `.perfil__extra`), que o `quem-somos.js` transforma em abas com o rosto de cada um (`data-rosto`, `data-rosto-pos`), setas, teclado e deslizar; sem JS ficam empilhados. **Momentos e ambiente** = uma faixa horizontal (`[data-rolo]`) com as fotos inteiras na mesma altura, setas e arraste com o mouse; clique amplia (`[data-galeria]` em site.js). Só textos verificados (Veja SP e o site).
- **Rodapé** (todas as páginas): marrom do cabeçalho, com o cartão de Vagas (`#vagas`, o menu aponta para ele) usando a arte oficial "Estamos com vagas abertas" (cozinheiro, auxiliar de cozinha, atendimento). Contato de vagas: **eleaforneria@gmail.com** (destaque "Vagas" do Instagram), botão "Enviar currículo" (mailto).
- **Selo do topo da Home:** dois troféus dourados (bicampeã; `brand/trofeu.svg` duas vezes) no lugar do ícone de linha. **Imprensa:** fotos dos cards inteiras (sem o zoom que cortava o logo da Veja) e links verificados em 23/11/2026 (Veja SP 2025/2026, filial, crítica 2023; Terra; Estadão).
- **WhatsApp flutuante:** pílula branca com o logo oficial verde (#25D366) e "WhatsApp" ao lado; no celular, só o círculo verde.
- **Junções entre fundos:** classes `funde-topo`/`funde-base` + variáveis `--funde-de`/`--funde-para` (o fundo se dissolve na cor da seção vizinha).
- **Loja de encomendas** (`/encomendas`, atualizado em 22/11/2026): catálogo e "lista de encomenda" (gaveta) que envia os itens pelo **WhatsApp** (`config.js`). Sem checkout, login, pedido salvo ou pagamento nesta etapa (decisão da agência; ver `docs/EVOLUCOES_FUTURAS.md`). Peso médio ~900 g, 24h de antecedência, retirada em horário combinado, valores sujeitos à confirmação.
- **Minha conta** (`/conta`): entrar, criar conta, Google, esqueci a senha, dados e histórico de pedidos. Ícone de perfil no cabeçalho (saiu em 22/11 e **voltou em 23/11/2026** a pedido da agência). Sem Firebase, funciona só no navegador; o aviso "Modo demonstração" tem `so-revisao` (aparece só com `?revisao`). Fica real na fase com Firebase.
- **Painel** (`/admin`): pedidos (filtro, mudar situação, alerta se o total não bate com o catálogo) e produtos (editar, preço, ativo, importar iniciais).
- **Modo demonstração:** com `FIREBASE` vazio em `config.js`, tudo roda no navegador (localStorage). Admin no demo = e-mail que começa com `admin@`. Testado ponta a ponta.
- `firestore.rules` (cliente só cria pedido próprio com status "recebido" e retirada ≥ 23h; só a equipe altera).

## Estrutura
```
img/                     originais do usuário (não vão para o Git)
fonte/partes/            cabecalho.html, rodape.html
fonte/paginas/           index, encomendas, conta, admin  ← EDITE AQUI
site/                    saída montada (deploy)  · site/assets/{css,js,img}
ferramentas/             montar-paginas.mjs, gerar_imagens.py, recortar_pratos.py (círculos dos pratos)
docs/                    este arquivo, inventário, diretrizes
firebase.json · firestore.rules · .claude/launch.json
```
- Textos e seções: `fonte/paginas/*.html`. Itens com `class="tbc"` = **a confirmar**: para visitantes aparecem como texto normal; com `?revisao` na URL ficam grifados em amarelo (`?revisao=0` desliga). Notas que são só internas levam também `so-revisao` (ocultas para visitantes).
- WhatsApp: `ferramentas/montar-paginas.mjs` (HTML) e `site/assets/js/config.js` (loja). Regras de retirada e Firebase: `config.js`. Produtos iniciais: `produtos-iniciais.js`.

## Como rodar
**Live Server (VS Code):** já configurado em `.vscode/settings.json` para usar `site/` como raiz. Abra `site/index.html` com "Open with Live Server" (se ele já estava aberto, pare e abra de novo). Os links internos usam `.html`, então funcionam em qualquer servidor; no Firebase o `cleanUrls` mostra o endereço sem `.html`.
Enquanto edita `fonte/`, deixe o montador observando (o Live Server recarrega sozinho):
```bash
node ferramentas/montar-paginas.mjs --observar
```
Alternativa (igual ao Cucina):
```bash
firebase emulators:start --only hosting --project demo-elea
```
Site em http://localhost:5010 (Firestore/Auth não rodam em emulador aqui: só há Java 8; por isso o modo demonstração).

## Repositório e link de teste (GitHub Pages)
- Repositório (público, só esta pasta): https://github.com/Matheus-Ferrari/Elea-forneria-2026 — branch `main`.
- Link de teste: https://matheus-ferrari.github.io/Elea-forneria-2026/ (noindex). **Atenção:** o Pages está configurado para publicar a raiz do branch **`main`** (não o `gh-pages`). Por isso a raiz tem um `index.html` que redireciona para `site/` e um `.nojekyll`; o site abre em `.../Elea-forneria-2026/site/`. Se mudar em Settings → Pages para `gh-pages` / (root), o endereço passa a ser a raiz direto (o redirecionamento deixa de ser usado).
- **Para atualizar o link** depois de mudar algo: `node ferramentas/montar-paginas.mjs`, commit na `main` e `git push` (com o Pages na `main`, isso basta). Se o Pages for trocado para `gh-pages`, rode também `git subtree push --prefix site origin gh-pages`.
- O workflow `.github/workflows/pages.yml` (publicação via Actions) está só manual: a conta do GitHub está com o Actions bloqueado por cobrança. Resolvido isso, dá para voltar o `push` nele e usar Source = GitHub Actions.
- Os caminhos do site são **relativos** (o montador converte `/assets/...`, `/cardapio.html`, `/#visite`), por isso funciona na raiz e na subpasta do Pages. Em JS, use caminhos relativos também (`conta.html`, `assets/img/...`).
- No Pages a loja roda em modo demonstração (sem Firebase). Login/pedidos reais → Firebase Hosting (abaixo).
- Atenção: a pasta do usuário (`C:\Users\Meneleu`) também é um repositório git; os comandos git devem rodar DENTRO desta pasta.

## Para ligar o Firebase de verdade
1. Criar o projeto (de preferência na conta da Elea), ativar Authentication (e-mail/senha + Google) e Firestore (`southamerica-east1`).
2. Colar a config web em `site/assets/js/config.js` → `FIREBASE`.
3. `firebase use --add` e `firebase deploy --only firestore:rules,hosting`.
4. Criar a conta da equipe pelo site e, no console, o documento `admins/{uid}`. No painel, "Importar produtos iniciais".
5. Na publicação: `EM_TESTE = false` em `montar-paginas.mjs` (libera o Google) e apontar o domínio.

## Próximos 3 passos
1. **Confirmar com a Elea** os itens `tbc` (horários, WhatsApp/link de reservas, preços, cardápio) — os prints dos destaques do Instagram resolvem quase tudo — e se querem anunciar a Elea Osteria (Higienópolis).
2. **Ligar o Firebase** (passos acima) e testar uma encomenda real com a equipe.
3. **Pagamento online** (opcional): Pix/cartão via Function (Blaze), reaproveitando `functions/src/pedidos.js` e `cielo.js` do Cucina; o servidor passa a recalcular o total.
