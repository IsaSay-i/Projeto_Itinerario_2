const CHAVES = {
  usuarios: "ng_usuarios",
  sessao: "ng_sessao",
  lembrado: "ng_email_lembrado",
};

const REDIRECT_URL = "dsh_novageracao/cockpit.html";

const Auth = {
  garantirUsuarioPadrao() {
    if (this.listarUsuarios().length > 0) return;
    const admin = [
      {
        id: globalThis.crypto?.randomUUID?.() || `admin-${Date.now()}`,
        email: "admin@ng.com.br",
        senha: "Admin@123",
        nome: "Administrador",
        criadoEm: new Date().toISOString(),
      },
    ];
    localStorage.setItem(CHAVES.usuarios, JSON.stringify(admin));
  },

  listarUsuarios() {
    const usuariosSalvos = localStorage.getItem(CHAVES.usuarios);
    if (!usuariosSalvos) return [];

    const usuarios = JSON.parse(usuariosSalvos);
    if (!Array.isArray(usuarios)) {
      throw new Error("A lista de usuários salva no navegador é inválida.");
    }
    return usuarios;
  },

  validar(email, senha) {
    return this.listarUsuarios().find(
      (u) =>
        u &&
        typeof u.email === "string" &&
        u.email.toLowerCase() === email.toLowerCase() &&
        u.senha === senha,
    );
  },

  iniciarSessao(usuario) {
    sessionStorage.setItem(
      CHAVES.sessao,
      JSON.stringify({
        email: usuario.email,
        nome: usuario.nome || usuario.email,
        logadoEm: new Date().toISOString(),
      }),
    );
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const emailInput = document.querySelector("#email");
  const passwordInput = document.querySelector("#senha");
  const togglePassword = document.querySelector("#togglePassword");
  const forgotPassword = document.querySelector("#forgotPassword");
  const statusMessage = document.querySelector("#statusMessage");
  const loginButton = document.querySelector(".login-button");
  const remember = document.querySelector("#remember");

  const showMessage = (message, type = "success") => {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
  };

  let inicializacaoOk = true;
  try {
    Auth.garantirUsuarioPadrao();
  } catch (error) {
    inicializacaoOk = false;
    console.error("Não foi possível inicializar o acesso administrativo:", error);
    showMessage(
      "Não foi possível preparar o acesso administrativo. Verifique os dados salvos deste site no navegador.",
      "error",
    );
  }

  togglePassword?.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    togglePassword.innerHTML = `<i class="fa-regular ${visible ? "fa-eye-slash" : "fa-eye"}"></i>`;
    togglePassword.setAttribute(
      "aria-label",
      visible ? "Ocultar senha" : "Mostrar senha",
    );
  });

  const emailLembrado = localStorage.getItem(CHAVES.lembrado);
  if (emailLembrado) {
    emailInput.value = emailLembrado;
    if (remember) remember.checked = true;
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput?.value.trim().toLowerCase();
    const senha = passwordInput?.value ?? "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Informe um e-mail válido.", "error");
      return;
    }

    if (!inicializacaoOk) {
      showMessage(
        "O acesso administrativo não foi inicializado. Verifique os dados salvos deste site no navegador.",
        "error",
      );
      return;
    }

    if (!senha) {
      showMessage("Informe sua senha.", "error");
      return;
    }

    loginButton?.classList.add("loading");
    if (loginButton)
      loginButton.querySelector("span").textContent = "Validando acesso...";

    setTimeout(() => {
      const encontrado = Auth.validar(email, senha);

      loginButton?.classList.remove("loading");
      if (loginButton) loginButton.querySelector("span").textContent = "Entrar";

      if (!encontrado) {
        showMessage("E-mail ou senha inválidos.", "error");
        return;
      }

      remember?.checked
        ? localStorage.setItem(CHAVES.lembrado, email)
        : localStorage.removeItem(CHAVES.lembrado);

      showMessage("Acesso autorizado! Redirecionando...", "success");
      Auth.iniciarSessao(encontrado);
      setTimeout(() => {
        window.location.href = REDIRECT_URL;
      }, 500);
    }, 700);
  });

  forgotPassword?.addEventListener("click", (event) => {
    event.preventDefault();
    showMessage(
      "Integre este recurso ao fluxo de recuperação de senha do backend.",
      "success",
    );
  });

  document.querySelector("#openAdmin")?.addEventListener("click", () => {
    showMessage(
      "Área administrativa preparada. A aprovação real deve ser feita no backend com autenticação e permissões.",
      "success",
    );
  });
});
