/*
 * Produtos iniciais da forneria (usados enquanto o Firestore não tem produtos cadastrados,
 * e importáveis pelo painel). Fonte: story "Encomendas" do Instagram da Elea (~69 semanas atrás).
 * PREÇOS A CONFIRMAR com a Elea. Valores em centavos.
 */
export const PRODUTOS_INICIAIS = [
  { id: "focaccia-tomilho-alecrim", nome: "Focaccia tomilho & alecrim", descricao: "Peso médio 900 g.", preco: 5800, imagem: "assets/img/video/focaccias-poster.webp", ativo: true, ordem: 1 },
  { id: "focaccia-azeitonas", nome: "Focaccia azeitonas", descricao: "Peso médio 900 g.", preco: 6800, imagem: "assets/img/pessoas/padeiro-focaccias.webp", ativo: true, ordem: 2 },
  { id: "focaccia-pesto-coalhada", nome: "Focaccia pesto & coalhada de ovelha", descricao: "Peso médio 900 g.", preco: 6800, imagem: "", ativo: true, ordem: 3 },
  { id: "tortano", nome: "Tortano", descricao: "Peso médio 900 g.", preco: 7200, imagem: "", ativo: true, ordem: 4 },
];
