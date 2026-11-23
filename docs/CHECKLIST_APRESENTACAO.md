# Checklist da apresentação — site da Elea Forneria

Atualizado em 23/11/2026. Versão institucional de demonstração, a ser apresentada aos sócios da Elea.

Documentos relacionados:
- `docs/PENDENCIAS_IMAGENS_CARDAPIO.md`: fotos do cardápio, prato a prato.
- `docs/EVOLUCOES_FUTURAS.md`: funcionalidades para uma proposta futura.

> **Link de teste:** https://matheus-ferrari.github.io/Elea-forneria-2026/ (GitHub Pages, publicado a partir da `main`). As mudanças desta rodada foram publicadas em 22/11/2026. O site continua com `noindex`, ou seja, fora do Google, até a publicação definitiva. Se o link parecer desatualizado, recarregue com Ctrl+F5. Também dá para apresentar localmente: Live Server em `site/`, ou `python -m http.server -d site`.

## 0. Rodada de 23/11/2026 (pedidos depois da 1ª revisão)

- [x] **Cardápio, fotos dos pratos:**
  - as 3 fotos que tinham saído pelo limite de 3 por capítulo voltaram: Pappardelle, Tortelli e Focaccia azeitonas. São 13 pratos com foto e o limite foi abandonado;
  - em cada capítulo, **os pratos com foto vêm primeiro**. O `cardapio.js` mantém isso sozinho quando entrar uma foto nova.
- [x] **Cardápio, "dois Para compartilhar":** o capítulo tem 8 pratos e ocupa duas páginas. A página de frente para o título não repete mais o nome, e as seguintes dizem "continuação" no cabeçalho.
- [x] **Bloco "Focaccias e tortano por encomenda"** (fim do Cardápio): a foto em tela cheia, que ficava gigante em monitores grandes, virou uma foto em arco de tamanho contido (até ~370–430 px), sobre um painel de limões, com o selo da Elea. Texto ao lado; no celular, foto em cima.
- [x] **Home, selo do topo:** dois troféus (bicampeã, 2025 e 2026).
- [x] **Home, carrossel "Prato a prato" vazio:** com várias passadas seguidas (setas, arraste) ou com a aba em segundo plano, o carrossel passava do fim das cópias e mostrava só a madeira. Agora ele sempre volta para o bloco do meio antes de andar (5 blocos de pratos, arraste limitado). Testado com 14 passadas rápidas e arrastes de 6.000 px em 390, 1440 e 1880 px: sempre 2 ou 3 pratos na tela.
- [x] **Home, Imprensa:**
  - as fotos dos cards aparecem inteiras desde o início. O zoom animado cortava as bordas, e o "veja" do logo da Veja sumia;
  - links verificados em 23/11/2026: Veja SP Comer & Beber 2025 e 2026 (Melhor Trattoria), a matéria da filial em Higienópolis (online com o título "Elea Forneria se prepara para abrir a primeira filial em Higienópolis"), a crítica da Veja SP (2023) e a matéria do Terra (2024). O link do Estadão continua.
- [x] **Vagas:** o contato é o e-mail **eleaforneria@gmail.com**, tirado do destaque "Vagas" do Instagram: "Vagas abertas para salão e cozinha. Envie seu currículo para…". Tem botão "Enviar currículo", que abre o e-mail com o assunto preenchido.
- [x] **Quem Somos repensado:**
  - **Quem faz:** um perfil por pessoa ou equipe (Enrico, Manuela, cozinha e salão), com foto grande, papel, texto curto e uma segunda foto quando há. Os cartões com o rosto de cada um trocam o perfil; tem setas, teclado e deslizar no celular;
  - **Momentos e Ambiente** viraram uma faixa só, que corre para o lado, com as fotos inteiras. Clique amplia;
  - a página ficou com metade da altura, sem grades de foto empilhadas;
  - textos só com o que é verificado (Veja SP e o próprio site).

## 1. O que já está pronto

- [x] **Home:**
  - hero com fotos em revezamento e letreiro;
  - A Elea;
  - Prato a prato (carrossel de pratos);
  - Imprensa;
  - Da cozinha à taça;
  - Local e horários.
- [x] **Cardápio em livro:**
  - capa, sumário e 6 capítulos;
  - virada de página com setas, cantos, arrastar, teclado e marcadores;
  - fotos de abertura com pontos amarelos;
  - modo "Lista", que também é a versão sem JavaScript e a lida pelo Google.
- [x] **Fotos dos pratos no cardápio:** 13 pratos com foto, que aparecem primeiro em cada capítulo.
  - Desktop: passar o mouse mostra o prato na foto da página; clicar abre a foto grande.
  - Celular: tocar abre a foto.
- [x] **Quem Somos:** história, um perfil por pessoa (Enrico, Manuela, cozinha e salão) e uma faixa de fotos com momentos e ambiente.
- [x] **Encomendas:** catálogo das focaccias e do tortano, lista de encomenda e contato direto pelo WhatsApp.
- [x] **Vagas:** faixa própria acima do rodapé, em todas as páginas.
- [x] **Rodapé:** compacto, com todos os links.
- [x] **Botão flutuante de WhatsApp** nas páginas públicas.
- [x] **Responsividade:** testado em celular (360 e 390 px) e desktop (1024, 1366, 1440 e 1920 px), sem rolagem horizontal.

## 2. O que foi corrigido nesta rodada

**Cardápio**
- [x] Clicar num prato com foto, no desktop, virava a página. Agora abre a foto do prato e o livro fica onde estava.
- [x] Fechar a foto podia rolar a tela até o livro, porque o foco voltava para o livro inteiro. Agora a rolagem fica exatamente onde estava.
- [x] O hover só funcionava quando a abertura do capítulo estava na mesma página dupla. Agora funciona em qualquer página:
  - se a foto de abertura está aberta, ela troca para o prato;
  - senão, a página ao lado vira uma "página de foto" com nome e preço;
  - a troca é suave, sem piscar ao passar de um prato a outro;
  - tirar o mouse volta ao original, também ao sair pela borda do livro, onde antes a foto ficava presa;
  - pratos que aparecem na foto de abertura (marcador amarelo) acendem o marcador.
- [x] **Transição entre capítulos:**
  - **Causa:** ao pular várias páginas (marcadores ou sumário), todas as folhas subiam por cima de uma vez. Por isso uma página do meio do caminho aparecia de repente, por exemplo a foto dos cozinheiros ao ir para Pizzas.
  - **Correção:** cada folha troca de pilha no meio da virada, as páginas intermediárias passam em branco, como papel folheando, e no máximo 4 folhas se movem.
- [x] **Páginas editoriais:**
  - Antes elas se revezavam sem relação com o capítulo. A foto dos cozinheiros caía depois de Pizzas ou no fim do livro, conforme o tamanho da tela.
  - Agora cada uma fecha o seu capítulo, e a dos cozinheiros ("Massa fresca, feita na casa.") sempre fecha Principais.
- [x] **Fotos dos pratos:**
  - limite de 3 por capítulo (abandonado em 23/11/2026: as fotos voltaram);
  - as fotos que ficaram fora da demonstração não mostram câmera;
  - nenhuma foto de prato diferente foi vinculada;
  - a foto do Pappardelle, que parece outra receita, saiu da demonstração.
- [x] **Bloco "Focaccias e tortano por encomenda"** (fim do Cardápio):
  - refeito sem "caixa dentro de caixa", com a foto real em destaque e o texto ao lado;
  - destaque para "Aproximadamente 900 g de focaccia artesanal";
  - antecedência de 24h, retirada em horário combinado e botão "Fazer encomenda" para a mesma página de antes;
  - **é a única mudança visual desta rodada e foi pedida especificamente.**
- [x] Vinhos: a nota interna "carta a receber da Elea" virou "A carta completa estará disponível aqui em breve."

**Site inteiro**
- [x] Os marcadores internos "a confirmar" (grifo amarelo com ⚠) **não aparecem mais para os visitantes**. Na reunião, abra qualquer página com `?revisao` no fim do endereço (ex.: `cardapio.html?revisao`): tudo que falta confirmar volta a aparecer grifado, inclusive navegando entre as páginas. `?revisao=0` desliga.
- [x] **Encomendas:**
  - saíram a mensagem "Modo demonstração: o Firebase ainda não está configurado" e o aviso "Preços e itens a confirmar com a Elea — base: story…";
  - o checkout (login obrigatório, formulário e "pedido enviado") virou contato direto: a pessoa monta a lista e envia pelo WhatsApp;
  - o site diz claramente que a encomenda só vale depois do retorno da equipe e que os valores estão sujeitos à confirmação;
  - nada é salvo e nenhum dado pessoal é pedido.
- [x] "Minha conta" saiu do cabeçalho e do rodapé. A área do cliente ainda não funciona de verdade; as páginas continuam no projeto para o futuro.
- [x] **Vagas:**
  - o cartão saiu de dentro do rodapé marrom e virou uma faixa clara própria;
  - o texto quebrado "Envie seu currículo para [e-mail de vagas]" virou "Fale com a Elea pelo WhatsApp", com botão.
- [x] **Quem Somos:**
  - uma frase curta de apresentação da equipe;
  - descrição curta em cada card (sem inventar nomes ou cargos);
  - legendas com contexto nas fotos;
  - fotos do ambiente reordenadas como um passeio pelo lugar.

## 3. O que depende de aprovação da Elea

- [ ] **WhatsApp (11) 94509-9155** como canal oficial de reservas e encomendas (vagas vão para eleaforneria@gmail.com, do Instagram). O número veio do site antigo, de 2025. Se mudar, troque em `ferramentas/montar-paginas.mjs` e em `site/assets/js/config.js`.
- [ ] **Horários de funcionamento.** São de 2025. Na Home, aparecem grifados no modo revisão.
- [ ] **Encomendas:**
  - preços: focaccia tomilho & alecrim R$ 58, azeitonas R$ 68, pesto & coalhada R$ 68, tortano R$ 72;
  - peso médio de ~900 g, inclusive para o tortano;
  - forma de pagamento;
  - dias e períodos de retirada.
- [ ] **Cardápio:**
  - os prints do Instagram cortavam o fim de "Principais" (depois da Coda alla vaccinara) e de "Encomende nossos pães" (depois do Tortano); confirmar se há mais itens;
  - confirmar os preços (stories de jul/2026).
- [ ] **Fotos identificadas pela imagem.** São 11 das 13 do cardápio; a lista está em `PENDENCIAS_IMAGENS_CARDAPIO.md`.
- [ ] **Origem das fotos dos pães** (focaccias e tortano): têm aparência de foto de estúdio ou gerada. As diretrizes pedem fotos reais da casa.
- [ ] **Foto principal da Home.** O nhoque verde é a imagem do mockup, marcada como provisória.
- [ ] **Caramelle:** descrição oficial do prato. No popup da Home está marcada como a confirmar.
- [ ] **Imprensa:**
  - links encontrados e verificados em 23/11/2026 (ver seção 0);
  - nome oficial do prêmio de 2026;
  - autorização de uso das fotos do Instagram e das matérias.
- [ ] **Reservas:** WhatsApp ou o Google Forms que está na bio do Instagram?
- [ ] **Vagas:** e-mail ou canal oficial. Confirmar também se "Atendimento" é como a Elea chama a equipe do salão.
- [ ] **Elea Osteria** (Higienópolis): anunciar no site?
- [ ] **Novo bloco de encomendas do Cardápio:** aprovar o visual.

## 4. O que depende de novas fotografias

Detalhes em `PENDENCIAS_IMAGENS_CARDAPIO.md`.

- [ ] Sobremesas: nenhuma foto. É a prioridade.
- [ ] 25 pratos sem nenhuma foto: antepastos, massas e pizzas.
- [ ] Fotos novas da Burrata e do Pappardelle, se as atuais forem de receitas antigas.
- [ ] Fotos reais dos pães, se as atuais não forem reais.
- [ ] Foto real para o hero da Home, no lugar da imagem do mockup.
- [ ] Carta de vinhos, e se possível fotos de garrafas ou taças.

## 5. O que ainda está em demonstração ou em preparação

| Funcionalidade | Situação | Como apresentar |
|---|---|---|
| Encomendas pelo site | **Contato direto.** A lista é montada no site e enviada pelo WhatsApp. Não há pedido salvo, pagamento online nem login | "Você escolhe no site e combina com a equipe pelo WhatsApp." |
| Checkout e pagamento online | **Não existe nesta etapa** | Proposta futura, em `EVOLUCOES_FUTURAS.md` |
| Área do cliente (`conta.html`) | Código de demonstração: os dados ficam só no navegador. **Sem link público** | Não mostrar como pronta |
| Painel da equipe (`admin.html`) | Código de demonstração, sem link público | Não mostrar como pronto |
| Banco de dados e login (Firebase) | **Não configurado** (`config.js` vazio) | Proposta futura |
| Fotos do cardápio | 13 de 38 pratos | "O cardápio cresce conforme chegam as fotos." |

## 6. Integrações e ajustes antes da publicação definitiva

- [ ] **Indexação:** trocar `EM_TESTE` para `false` em `ferramentas/montar-paginas.mjs`. Isso tira o `noindex`, libera o `robots.txt` para o Google e libera o login do Google. Depois, rodar o montador.
- [ ] **Hospedagem e domínio:** Firebase Hosting (já configurado em `firebase.json`) ou outra, apontando o domínio da Elea. Hoje existe só o link de teste do GitHub Pages.
- [ ] **Dados confirmados:** atualizar o WhatsApp, os horários, os preços e o e-mail de vagas com o que a Elea confirmar, e tirar a classe `tbc` dos itens já confirmados.
- [ ] **Contas, pedidos salvos e painel (só se forem contratados):** criar o projeto Firebase da Elea com Authentication e Firestore, colar a configuração em `config.js` e publicar as regras (`firestore.rules`). O passo a passo está em `docs/CONTINUAR_NO_CLAUDE_CODE.md`.
- [ ] **Pagamento online (só se for contratado):** conta da Elea no provedor escolhido (Mercado Pago ou outro) e plano Blaze do Firebase para a função de pagamento. Veja `EVOLUCOES_FUTURAS.md`.

## 7. Testes feitos nesta rodada

Foram feitos no Chrome, de forma automatizada, em desktop e em celular com toque.

- **Cardápio no desktop** (1024×768, 1366×768, 1440×900 e 1920×1080):
  - o hover mostra a foto certa, tanto na abertura quanto na página ao lado, e volta ao original;
  - clicar no prato ou na câmera abre a foto certa, sem virar a página;
  - fechar a foto pelo X ou pelo Esc mantém a rolagem e a página;
  - clicar numa área vazia continua virando a página;
  - o modo lista funciona com hover e clique;
  - a transição de Principais para Pizzas foi comparada antes e depois.
- **Cardápio no celular** (360×740 e 390×844):
  - tocar no prato ou na câmera abre a foto certa, sem virar a página;
  - deslizar para os lados vira, inclusive começando em cima de um prato, e não abre a foto;
  - rolar com o dedo sobre o livro rola a página;
  - fechar mantém a página e a rolagem;
  - o modo lista funciona.
- **Todas as páginas** (1440 e 390 px):
  - sem erros no console e sem imagens quebradas;
  - links internos funcionando e sem links vazios;
  - sem rolagem horizontal;
  - nenhum texto técnico visível (Firebase, demonstração, "a confirmar", story);
  - nenhum link público para conta ou painel;
  - o menu mobile abre e fecha.
