/*
 * Camada de dados das páginas de loja (encomendas, conta, painel).
 * - Com FIREBASE preenchido em config.js: Authentication + Firestore de verdade.
 * - Sem configuração: MODO DEMONSTRAÇÃO no navegador (localStorage), só para testar o fluxo.
 *   No demo não há senha nem segurança; contas com e-mail começando por "admin@" viram admin.
 */
import { FIREBASE, FIREBASE_SDK } from "./config.js";
import { PRODUTOS_INICIAIS } from "./produtos-iniciais.js";

export const modo = FIREBASE.apiKey ? "firebase" : "demo";
export const paraData = (v) => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
const ordenar = (lista) => lista.sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

/* ---------------- Firebase ---------------- */
let fb;
async function carregarFirebase() {
  if (fb) return fb;
  const cdn = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${cdn}/firebase-app.js`), import(`${cdn}/firebase-auth.js`), import(`${cdn}/firebase-firestore.js`),
  ]);
  const app = initializeApp(FIREBASE);
  const auth = A.getAuth(app);
  auth.languageCode = "pt-BR";
  fb = { A, F, auth, db: F.getFirestore(app) };
  return fb;
}
const usuarioFb = (u) => (u ? { uid: u.uid, email: u.email, nome: u.displayName || "" } : null);

const firebase = {
  async observarUsuario(cb) { const { A, auth } = await carregarFirebase(); return A.onAuthStateChanged(auth, (u) => cb(usuarioFb(u))); },
  async entrar(email, senha) { const { A, auth } = await carregarFirebase(); await A.signInWithEmailAndPassword(auth, email, senha); },
  async entrarGoogle() { const { A, auth } = await carregarFirebase(); await A.signInWithPopup(auth, new A.GoogleAuthProvider()); },
  async criarConta(nome, email, senha, telefone) {
    const { A, F, auth, db } = await carregarFirebase();
    const { user } = await A.createUserWithEmailAndPassword(auth, email, senha);
    await A.updateProfile(user, { displayName: nome });
    await F.setDoc(F.doc(db, "usuarios", user.uid), { nome, telefone, email, criadoEm: F.serverTimestamp() });
  },
  async sair() { const { A, auth } = await carregarFirebase(); await A.signOut(auth); },
  async recuperarSenha(email) { const { A, auth } = await carregarFirebase(); await A.sendPasswordResetEmail(auth, email); },
  async lerPerfil(uid) { const { F, db } = await carregarFirebase(); return (await F.getDoc(F.doc(db, "usuarios", uid))).data() || {}; },
  async salvarPerfil(uid, d) { const { F, db } = await carregarFirebase(); await F.setDoc(F.doc(db, "usuarios", uid), d, { merge: true }); },
  async ehAdmin(uid) { const { F, db } = await carregarFirebase(); try { return (await F.getDoc(F.doc(db, "admins", uid))).exists(); } catch { return false; } },
  async listarProdutos({ todos = false } = {}) {
    const { F, db } = await carregarFirebase();
    const lista = (await F.getDocs(F.collection(db, "produtos"))).docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!lista.length && !todos) return ordenar([...PRODUTOS_INICIAIS]);
    return ordenar(todos ? lista : lista.filter((p) => p.ativo));
  },
  async salvarProduto(p) { const { F, db } = await carregarFirebase(); const { id, ...d } = p; await F.setDoc(F.doc(db, "produtos", id), d, { merge: true }); },
  async excluirProduto(id) { const { F, db } = await carregarFirebase(); await F.deleteDoc(F.doc(db, "produtos", id)); },
  async criarPedido(p) {
    const { F, db } = await carregarFirebase();
    const ref = await F.addDoc(F.collection(db, "pedidos"), { ...p, status: "recebido", criadoEm: F.serverTimestamp() });
    return ref.id;
  },
  async meusPedidos(uid) {
    const { F, db } = await carregarFirebase();
    const s = await F.getDocs(F.query(F.collection(db, "pedidos"), F.where("uid", "==", uid)));
    return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => paraData(b.criadoEm) - paraData(a.criadoEm));
  },
  async todosPedidos() {
    const { F, db } = await carregarFirebase();
    const s = await F.getDocs(F.query(F.collection(db, "pedidos"), F.orderBy("criadoEm", "desc"), F.limit(200)));
    return s.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async mudarStatus(id, status) { const { F, db } = await carregarFirebase(); await F.updateDoc(F.doc(db, "pedidos", id), { status, atualizadoEm: F.serverTimestamp() }); },
};

/* ---------------- Demonstração (localStorage) ---------------- */
const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem("elea_demo_" + k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem("elea_demo_" + k, JSON.stringify(v)); } catch {} };
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((cb) => cb(ler("usuario", null)));
const logar = (email, nome = "") => {
  const uid = "demo-" + email.toLowerCase().replace(/[^a-z0-9]/g, "");
  const perfis = ler("perfis", {});
  gravar("usuario", { uid, email, nome: nome || perfis[uid]?.nome || email.split("@")[0] });
  avisar();
  return uid;
};

const demo = {
  async observarUsuario(cb) { ouvintes.add(cb); cb(ler("usuario", null)); return () => ouvintes.delete(cb); },
  async entrar(email) { logar(email); },
  async entrarGoogle() { logar("cliente.google@exemplo.com", "Cliente Google (demo)"); },
  async criarConta(nome, email, _senha, telefone) {
    const uid = logar(email, nome);
    const perfis = ler("perfis", {}); perfis[uid] = { nome, telefone, email }; gravar("perfis", perfis);
  },
  async sair() { localStorage.removeItem("elea_demo_usuario"); avisar(); },
  async recuperarSenha() {},
  async lerPerfil(uid) { return ler("perfis", {})[uid] || {}; },
  async salvarPerfil(uid, d) { const p = ler("perfis", {}); p[uid] = { ...p[uid], ...d }; gravar("perfis", p); },
  async ehAdmin() { return /^admin@/i.test(ler("usuario", {})?.email || ""); },
  async listarProdutos({ todos = false } = {}) {
    const lista = ler("produtos", null) ?? PRODUTOS_INICIAIS;
    return ordenar(todos ? [...lista] : lista.filter((p) => p.ativo));
  },
  async salvarProduto(p) {
    const lista = ler("produtos", null) ?? [...PRODUTOS_INICIAIS];
    const i = lista.findIndex((x) => x.id === p.id);
    i >= 0 ? (lista[i] = { ...lista[i], ...p }) : lista.push(p);
    gravar("produtos", lista);
  },
  async excluirProduto(id) { gravar("produtos", (ler("produtos", null) ?? PRODUTOS_INICIAIS).filter((p) => p.id !== id)); },
  async criarPedido(p) {
    const id = Math.random().toString(36).slice(2, 10);
    gravar("pedidos", [{ id, ...p, retiradaEm: p.retiradaEm.toISOString(), status: "recebido", criadoEm: new Date().toISOString() }, ...ler("pedidos", [])]);
    return id;
  },
  async meusPedidos(uid) { return ler("pedidos", []).filter((p) => p.uid === uid); },
  async todosPedidos() { return ler("pedidos", []); },
  async mudarStatus(id, status) { gravar("pedidos", ler("pedidos", []).map((p) => (p.id === id ? { ...p, status } : p))); },
};

export const dados = modo === "firebase" ? firebase : demo;

export const codigoPedido = (id) => String(id).slice(0, 6).toUpperCase();

export function erroAmigavel(erro) {
  const mapa = {
    "auth/invalid-email": "Confira o e-mail.",
    "auth/missing-password": "Digite a senha.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Já existe uma conta com este e-mail. Entre ou recupere a senha.",
    "auth/weak-password": "Use uma senha com pelo menos 8 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
    "auth/network-request-failed": "Sem conexão. Confira a internet.",
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar.",
    "permission-denied": "Sem permissão para esta ação.",
  };
  return mapa[erro?.code] || "Não foi possível concluir agora. Tente de novo.";
}
