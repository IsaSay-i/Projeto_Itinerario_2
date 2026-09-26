const Store = {
  KEYS: {
    ministerios: "ng_ministerios",
    batismos: "ng_batismos",
    eventos: "ng_eventos",
    presencas: "ng_presencas",
  },

  get(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
  },

  save(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
  },

  novoId() {
    return crypto.randomUUID();
  },

  init() {
    this.seedMinisterios();
  },

  seedMinisterios() {
    if (localStorage.getItem(this.KEYS.ministerios)) return;

    const hoje = new Date().toISOString().slice(0, 10);

    const padrao = [
      {
        id: this.novoId(),
        nome: "Louvor e Adoração",
        lider: "Rita",
        dataCriacao: hoje,
        membros: [],
      },
      {
        id: this.novoId(),
        nome: "Zeladoria",
        lider: "Michel",
        dataCriacao: hoje,
        membros: [],
      },
      {
        id: this.novoId(),
        nome: "Mídia",
        lider: "Marisa",
        dataCriacao: hoje,
        membros: [],
      },
      {
        id: this.novoId(),
        nome: "Casais",
        lider: "Marisa",
        dataCriacao: hoje,
        membros: [],
      },
    ];

    this.save(this.KEYS.ministerios, padrao);
  },

  totalMembros() {
    return this.get(this.KEYS.ministerios).reduce(
      (total, m) => total + (m.membros?.length || 0),
      0,
    );
  },
};

Store.init();
