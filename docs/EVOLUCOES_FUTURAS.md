# Evoluções futuras — site da Elea Forneria

Este documento reúne funcionalidades que **não fazem parte da versão atual** do site e podem ser contratadas depois, cada uma com escopo e orçamento próprios. Serve de base para uma proposta comercial. Nada aqui está implementado em produção.

## Como está hoje (novembro de 2026)

- O site é **institucional**: Home, Cardápio (em formato de livro), Quem somos, Local e horários, Vagas e Encomendas.
- **Encomendas:** o visitante vê as focaccias e o tortano, monta uma lista e envia pelo **WhatsApp** da casa. A equipe confirma itens, valores, forma de pagamento e horário de retirada (mínimo de 24 h de antecedência). O site **não registra pedidos**, **não cobra** e **não pede cadastro**.
- **Já existe no projeto, desligado, como ponto de partida:** telas de conta do cliente (`conta.html`), painel da equipe (`admin.html`) com pedidos e produtos, e a camada de dados (`assets/js/dados.js`) pronta para o **Firebase** (login + banco de dados), com as regras de segurança escritas (`firestore.rules`). Hoje esse código roda só em modo de teste no navegador, sem servidor, e não tem link público. Para valer de verdade, falta criar o projeto Firebase da Elea e configurá-lo (passo a passo em `docs/CONTINUAR_NO_CLAUDE_CODE.md`).
- **Pagamento online** exige o plano **Blaze** do Firebase (cobrança por uso, com cartão cadastrado; no volume de uma forneria tende a custo muito baixo) e uma função no servidor que fale com o provedor de pagamento.

## Funcionalidades possíveis

### 1. Encomendas online com checkout
- **O que é:** o cliente escolhe os itens, agenda o dia e o período de retirada e finaliza o pedido pelo site, recebendo um número de pedido e o acompanhamento da situação (recebido, confirmado, pago, pronto, retirado).
- **Base existente:** carrinho, agenda de retirada com a regra de 24 h e dias de funcionamento, gravação do pedido e painel da equipe já foram desenvolvidos em modo de teste (fluxo retirado do site público nesta etapa).
- **Depende da Elea:** aprovação do fluxo; dias e períodos de retirada oficiais; capacidade de produção por dia (limite de unidades); política de cancelamento; quem da equipe recebe e confirma os pedidos; preços e itens confirmados.

### 2. Pagamento online (Mercado Pago ou outro provedor aprovado)
- **O que é:** Pix e cartão no próprio checkout, com confirmação automática do pagamento no pedido.
- **Base existente:** nenhuma integração de pagamento ativa. Há um modelo técnico reaproveitável de outro projeto da agência (função de pedidos + integração de pagamento).
- **Depende da Elea:** escolha do provedor; conta empresarial no provedor em nome da Elea (CNPJ, dados bancários cadastrados **diretamente no provedor**, nunca enviados à agência); aceite das taxas do provedor; ativação do plano Blaze do Firebase com um cartão da Elea; regras de estorno.
- **Observação:** com pagamento online, o valor do pedido passa a ser recalculado no servidor, para que ninguém altere o preço pelo navegador.

### 3. Área do cliente
- **O que é:** o cliente cria conta (e-mail e senha ou Google), guarda nome e telefone e vê o histórico das próprias encomendas.
- **Base existente:** telas de entrar, criar conta, recuperar senha e histórico já feitas (`conta.html`), sem link público.
- **Depende da Elea:** decidir se o cadastro será obrigatório ou opcional; texto de privacidade (LGPD) e quem responde pelos dados; e-mail remetente para recuperação de senha.

### 4. Painel administrativo
- **O que é:** área restrita para a equipe ver e atualizar pedidos, filtrar por dia e situação, e receber alerta quando algo não confere.
- **Base existente:** painel de pedidos e produtos já feito (`admin.html`), com acesso apenas para contas cadastradas como equipe.
- **Depende da Elea:** lista de pessoas da equipe com acesso; rotina de uso (quem olha o painel e quando).

### 5. Cadastro e gerenciamento de produtos
- **O que é:** a equipe edita nomes, descrições, fotos, preços, disponibilidade e ordem dos produtos de encomenda sem depender da agência.
- **Base existente:** edição de produto, preço e "ativo/inativo" no painel; importação dos produtos iniciais.
- **Depende da Elea:** fotos reais dos produtos; preços oficiais; regras de disponibilidade (ex.: sabores por dia da semana).

### 6. Indicadores de vendas
- **O que é:** visão rápida de encomendas por dia, semana e mês, ticket médio, dias e períodos de maior procura.
- **Base existente:** os pedidos já seriam gravados com data, itens e valores, o que permite os indicadores.
- **Depende de:** o checkout (item 1) estar em uso por algum tempo, para haver dados.

### 7. Produtos e pratos mais vendidos
- **O que é:** ranking dos itens mais pedidos. Para as **encomendas do site**, sai dos pedidos registrados. Para os **pratos do salão**, só é possível com dados do sistema de vendas do restaurante (item 12).
- **Depende da Elea:** acesso aos dados de vendas do salão (relatórios exportados ou integração com o PDV).

### 8. Fichas técnicas e custo de ingredientes
- **O que é:** cadastro da receita de cada prato e produto (ingredientes, quantidades, rendimento) e do custo de cada insumo, calculando o custo por porção.
- **Base existente:** nenhuma.
- **Depende da Elea:** fichas técnicas dos pratos e produtos; lista de insumos com unidade e custo atualizado (notas de compra ou planilha); quem mantém esses dados atualizados.

### 9. Margem de contribuição e análise de lucratividade
- **O que é:** para cada item, preço de venda menos custos variáveis (insumos, embalagem, taxas de pagamento), mostrando quais itens mais contribuem para o resultado.
- **Depende de:** fichas técnicas com custos (item 8), preços oficiais e, para o salão, volume de vendas (itens 7 e 12). Taxas do provedor de pagamento (item 2) para as vendas online.

### 10. Sugestões de precificação
- **O que é:** simulação de preço a partir do custo e da margem desejada, com comparação ao preço atual.
- **Depende de:** itens 8 e 9; definição pela Elea da margem-alvo e das regras de arredondamento. As sugestões são apoio à decisão; o preço final continua sendo decisão da casa.

### 11. Relatórios financeiros
- **O que é:** relatórios de faturamento das encomendas, por período e forma de pagamento, com exportação para planilha.
- **Depende de:** checkout e pagamento online em uso (itens 1 e 2). Relatórios do salão dependem da integração com o PDV (item 12). Não substitui a contabilidade da empresa.

### 12. Integração com sistema de vendas ou PDV existente
- **O que é:** trazer para o painel as vendas do salão e, se fizer sentido, enviar as encomendas do site para o sistema do restaurante.
- **Base existente:** nenhuma.
- **Depende da Elea:** nome do sistema de PDV usado hoje; se ele oferece API ou exportação de relatórios; autorização e credenciais de acesso fornecidas pelo fornecedor do PDV à Elea (a agência não guarda senhas em código); eventuais custos cobrados pelo fornecedor do PDV.

## Ordem sugerida de etapas

1. **Firebase da Elea:** criar o projeto na conta do restaurante, ligar login e banco de dados e publicar as regras de segurança (base para tudo o que vem depois).
2. **Encomendas online sem pagamento:** checkout com agendamento de retirada, painel da equipe e cadastro de produtos (itens 1, 4 e 5), com pagamento ainda combinado pelo WhatsApp.
3. **Pagamento online** com o provedor escolhido (item 2) e, se aprovado, a área do cliente (item 3).
4. **Indicadores das encomendas** (itens 6, 7 para o site e 11), depois de algumas semanas de pedidos registrados.
5. **Gestão de custos:** fichas técnicas, margem e precificação (itens 8, 9 e 10).
6. **Integração com o PDV** (item 12), que estende indicadores, ranking de pratos e relatórios ao salão.

## O que a Elea precisa fornecer, em resumo

| Assunto | Necessário para |
|---|---|
| WhatsApp oficial para encomendas (confirmar o número atual) | Já hoje, e todas as etapas |
| Preços e itens oficiais da forneria; dias e períodos de retirada; capacidade por dia | Etapa 2 |
| Conta Google da Elea para o Firebase; cartão para o plano Blaze | Etapas 1 e 3 |
| Provedor de pagamento escolhido e conta empresarial (CNPJ) cadastrada pela própria Elea | Etapa 3 |
| Texto de privacidade e responsável pelos dados de clientes | Etapa 3 (área do cliente) |
| Fichas técnicas, insumos e custos; margem-alvo | Etapa 5 |
| Sistema de PDV usado, acesso a API/relatórios autorizado pelo fornecedor | Etapa 6 |
