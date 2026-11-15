/*
 * Configuração editável do site. Itens marcados CONFIRMAR vieram do WordPress antigo (2025)
 * ou de stories do Instagram e precisam ser validados com a Elea antes de publicar.
 */
export const WHATSAPP = "5511945099155"; // CONFIRMAR

export const ENCOMENDA = {
  antecedenciaHoras: 24, // story "Encomendas": 24h de antecedência
  // Períodos de retirada por dia da semana (0 = domingo). Derivado dos horários antigos. CONFIRMAR.
  retirada: {
    0: [["Almoço", "12:00"]],
    2: [["Jantar", "18:30"]],
    3: [["Jantar", "18:30"]],
    4: [["Jantar", "18:30"]],
    5: [["Almoço", "12:00"], ["Jantar", "18:30"]],
    6: [["Almoço", "12:00"], ["Jantar", "18:30"]],
  },
  pagamento: "Depois que a equipe confirmar o pedido, enviamos os dados para pagamento por Pix pelo WhatsApp.", // CONFIRMAR
};

/*
 * Firebase (Authentication + Firestore). Vazio = MODO DEMONSTRAÇÃO: tudo funciona no navegador
 * (localStorage), sem servidor, só para testar o fluxo. Preencha com o projeto da Elea para valer.
 * A apiKey do Firebase é pública por natureza; a segurança está em firestore.rules.
 */
export const FIREBASE = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};
export const FIREBASE_SDK = "12.6.0"; // mesma versão do projeto Cucina

export const STATUS = {
  recebido: "Recebido",
  confirmado: "Confirmado · aguardando pagamento",
  pago: "Pago",
  pronto: "Pronto para retirar",
  retirado: "Retirado",
  cancelado: "Cancelado",
};
