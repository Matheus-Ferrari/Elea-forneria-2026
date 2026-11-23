/*
 * Produtos iniciais da forneria (usados enquanto o Firestore não tem produtos cadastrados,
 * e importáveis pelo painel). Fonte: story "Encomendas" do Instagram da Elea (~69 semanas atrás).
 * PREÇOS A CONFIRMAR com a Elea (na página aparecem como "sujeitos à confirmação"). Valores em centavos.
 * Peso: "~900 g" no story; é peso MÉDIO, nunca apresentar como exato.
 */
export const PRODUTOS_INICIAIS = [
  { id: "focaccia-tomilho-alecrim", nome: "Focaccia tomilho & alecrim", descricao: "Peso médio de aproximadamente 900 g.", preco: 5800, imagem: "assets/img/forneria/focaccia-tomilho-alecrim.webp", ativo: true, ordem: 1 },
  { id: "focaccia-azeitonas", nome: "Focaccia azeitonas", descricao: "Peso médio de aproximadamente 900 g.", preco: 6800, imagem: "assets/img/forneria/focaccia-azeitonas.webp", ativo: true, ordem: 2 },
  { id: "focaccia-pesto-coalhada", nome: "Focaccia pesto & coalhada de ovelha", descricao: "Peso médio de aproximadamente 900 g.", preco: 6800, imagem: "assets/img/forneria/focaccia-pesto-coalhada.webp", ativo: true, ordem: 3 },
  { id: "tortano", nome: "Tortano", descricao: "Peso médio de aproximadamente 900 g.", preco: 7200, imagem: "assets/img/forneria/tortano.webp", ativo: true, ordem: 4 },
];
