# Continuar no Claude Code — Elea Forneria (estado em 15/11/2026)

## Decisão de tecnologia
**HTML + CSS + JavaScript puro + Firebase**, no mesmo padrão do projeto **Cucina** (`Desktop\Cucina`): páginas montadas de `fonte/` para `site/` e Firebase Hosting + Firestore + Authentication, equipe em `admins/{uid}`.
- Por que não React: site de restaurante precisa de SEO e carregamento rápido; HTML estático resolve, sem build pesado, e a agência já mantém o Cucina assim.
- Por que não MySQL/phpMyAdmin: exigiria escrever e proteger um backend PHP (login, sessões, SQL). O Firebase já dá login seguro e banco.
- **Custo:** o plano gratuito (Spark) cobre Hosting + Firestore + login para o volume de uma forneria. Só o **pagamento online** (Mercado Pago/Cielo via Functions) exige o plano Blaze (cobra por uso; nesse volume tende a R$ 0, mas pede cartão).

## O que está pronto
- **Home** (`/`): cabeçalho marrom `#4A301D` com wordmark ELEA/FORNERIA, menu Home · Cardápio · Quem Somos · Local e Horários · Vagas · Encomendas e botão Reservar terracota; hero no padrão do mockup aprovado (`Downloads\Mockup de Homepage da Elea Forneria.png`): foto do nhoque verde (`hero/nhoque-verde.webp`, PROVISÓRIA: é a imagem do mockup; trocar por foto real antes de publicar), 4 fotos (`hero/nhoque-verde`, `hero-2/3/4.webp`, 1672×941) revezando a cada 7 s com fade + desfoque→nítido + afastando (`.hero__slide`, fim de home.js), foto inteira sem corte; letreiro contínuo no marrom; A Elea (resumo + botão para Quem somos); Prato a prato (logo oficial carimbado na mesa de madeira, carrossel arrastável estilo qissa.co.uk, só os 5 recortes enviados pelo usuário (PNG sem fundo → `pratos-recorte/*.webp` 1000px): Bottoni alla Nerano, Ancho Angus, Mil-folhas de Atum, Fregola Gamberi & Cozze (nomes/descrições OFICIAIS do Instagram) e Caramelle (`data-confirmar`: sem descrição oficial). Clique abre popup grande (prato sobre a madeira entrando girando, setas anterior/próximo, Reservar + Cardápio). Prato 5 oficial "Massa verde com creme e crocante" = foto do nhoque no hero (nome provisório, não inventar); Imprensa (3 cards "jornal vivo"); "Da cozinha à taça" (abas 01 Pratos · 02 Vinhos · 03 Forneria, cards em carrossel 3D portados do Cucina, fundo muda de cor por aba); Local e horários (6 fotos do local passando, só CSS). Botão flutuante de WhatsApp em todas as páginas públicas (`flutuante` em montar-paginas.mjs). **Não é LP:** o site tem páginas próprias.
- **Cardápio** (`/cardapio`): abertura com a "janela" (foto fixa), pratos por categoria com fotos reais, Forneria → encomendas. Falta o cardápio oficial (nomes e preços) — `tbc`.
- **Quem somos** (`/quem-somos`): história, equipe (5 fotos, incluindo salão e massa à mão), Momentos e Ambiente.
- **Rodapé** (todas as páginas): marrom do cabeçalho, com o cartão de Vagas (`#vagas`, o menu aponta para ele).
- **Junções entre fundos:** classes `funde-topo`/`funde-base` + variáveis `--funde-de`/`--funde-para` (o fundo se dissolve na cor da seção vizinha).
- **Loja de encomendas** (`/encomendas`): catálogo, carrinho (gaveta), login obrigatório para finalizar, retirada com data/período (≥ 24h, dias de funcionamento), pedido salvo e botão "Avisar a Elea no WhatsApp".
- **Minha conta** (`/conta`): entrar, criar conta, Google, esqueci a senha, dados e histórico de pedidos.
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
- Textos e seções: `fonte/paginas/*.html`. Itens com `class="tbc"` = **a confirmar** (aparecem grifados em amarelo).
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

## Para ligar o Firebase de verdade
1. Criar o projeto (de preferência na conta da Elea), ativar Authentication (e-mail/senha + Google) e Firestore (`southamerica-east1`).
2. Colar a config web em `site/assets/js/config.js` → `FIREBASE`.
3. `firebase use --add` e `firebase deploy --only firestore:rules,hosting`.
4. Criar a conta da equipe pelo site e, no console, o documento `admins/{uid}`. No painel, "Importar produtos iniciais".
5. Na publicação: `EM_TESTE = false` em `montar-paginas.mjs` (libera o Google) e apontar o domínio.

## Próximos 3 passos
1. **Confirmar com a Elea** os itens `tbc` (horários, WhatsApp/link de reservas, preços, cardápio, e-mail de vagas) — os prints dos destaques do Instagram resolvem quase tudo — e se querem anunciar a Elea Osteria (Higienópolis).
2. **Ligar o Firebase** (passos acima) e testar uma encomenda real com a equipe.
3. **Pagamento online** (opcional): Pix/cartão via Function (Blaze), reaproveitando `functions/src/pedidos.js` e `cielo.js` do Cucina; o servidor passa a recalcular o total.
