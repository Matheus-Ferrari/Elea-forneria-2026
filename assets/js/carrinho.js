/* Carrinho de encomendas no navegador: guarda só {id, qtd}. Preço vem sempre do catálogo. */
const CHAVE = "elea_carrinho";

export function lerCarrinho() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; }
}
function gravar(itens) {
  try { localStorage.setItem(CHAVE, JSON.stringify(itens.filter((i) => i.qtd > 0))); } catch {}
  dispatchEvent(new Event("carrinho"));
}
export function mudarQtd(id, delta) {
  const itens = lerCarrinho();
  const item = itens.find((i) => i.id === id);
  if (item) item.qtd = Math.min(20, Math.max(0, item.qtd + delta));
  else if (delta > 0) itens.push({ id, qtd: Math.min(20, delta) });
  gravar(itens);
}
export const limparCarrinho = () => gravar([]);
export const quantidadeTotal = () => lerCarrinho().reduce((s, i) => s + i.qtd, 0);

export const reais = (centavos) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
