(function () {
    "use strict";

    const SESSAO_KEY = "ng_sessao";
    const LOGIN_URL = "../login.html";

    const Modal = {
        open(id) {
            document.getElementById(id)?.classList.add("is-open");
            document.body.classList.add("modal-open");
        },
        close(id) {
            document.getElementById(id)?.classList.remove("is-open");
            document.body.classList.remove("modal-open");
        }
    };
    window.Modal = Modal;

    const Toast = {
        icones: {
            success: "fa-circle-check",
            error: "fa-circle-xmark",
            info: "fa-circle-info",
            warning: "fa-triangle-exclamation"
        },
        container() {
            let el = document.getElementById("toastContainer");
            if (!el) {
                el = document.createElement("div");
                el.className = "toast-container";
                el.id = "toastContainer";
                document.body.appendChild(el);
            }
            return el;
        },
        show(tipo, titulo, mensagem) {
            const toast = document.createElement("div");
            toast.className = `toast toast--${tipo}`;
            toast.innerHTML = `
                <span class="toast__icon"><i class="fa-solid ${this.icones[tipo] || this.icones.info}"></i></span>
                <div class="toast__content">
                    <span class="toast__title">${titulo}</span>
                    <div class="toast__message">${mensagem}</div>
                </div>`;
            this.container().appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        }
    };
    window.Toast = Toast;

    document.addEventListener("click", function (event) {
        const fechar = event.target.closest("[data-fechar-modal]");
        if (!fechar) return;
        const root = fechar.closest(".modal-root");
        if (root) Modal.close(root.id);
    });

    document.addEventListener("DOMContentLoaded", iniciar);

    function iniciar() {
        if (!verificarSessao()) return;
        preencherDataAtual();
        carregarLayout();
    }

    function preencherDataAtual() {
        const formatador = new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        const data = formatador.format(new Date()).replace(/^./, (letra) => letra.toLocaleUpperCase("pt-BR"));

        document.querySelectorAll("[data-current-date]").forEach((elemento) => {
            elemento.textContent = data;
        });
    }

    function verificarSessao() {
        const sessao = sessionStorage.getItem(SESSAO_KEY);
        if (!sessao) {
            window.location.href = LOGIN_URL;
            return false;
        }
        return true;
    }

    async function carregarLayout() {
        try {
            const sidebarContainer = document.getElementById("sidebar-container");
            const headerContainer = document.getElementById("header-container");

            const componentes = [];

            if (sidebarContainer) {
                componentes.push(carregarComponente(sidebarContainer, "sidebar.html"));
            }

            if (headerContainer) {
                componentes.push(carregarComponente(headerContainer, "header.html"));
            }

            await Promise.all(componentes);

            inicializarLayout();
        } catch (error) {
            console.error("Erro ao carregar layout:", error);
        }
    }

    async function carregarComponente(container, caminho) {
        const response = await fetch(caminho, { cache: "no-cache" });

        if (!response.ok) {
            throw new Error(`Não foi possível carregar ${caminho}`);
        }

        container.innerHTML = await response.text();
    }

    function inicializarLayout() {
        inicializarSidebar();
        inicializarMobileSidebar();
        inicializarPerfil();
        inicializarTema();
        inicializarLogout();
        inicializarEscape();
        definirPaginaAtual();
        definirTituloPagina();
        preencherPerfil();
        inicializarNotificacoes();
        inicializarMeuPerfil();
    }

    /* SIDEBAR DESKTOP */
    function inicializarSidebar() {
        const sidebar = document.getElementById("sidebar");
        const sidebarToggle = document.getElementById("sidebarToggle");

        if (!sidebar || !sidebarToggle) return;

        if (localStorage.getItem("church_sidebar_collapsed") === "true") {
            sidebar.classList.add("is-collapsed");
            document.body.classList.add("sidebar-collapsed");
        }

        sidebarToggle.addEventListener("click", function () {
            sidebar.classList.toggle("is-collapsed");
            document.body.classList.toggle("sidebar-collapsed", sidebar.classList.contains("is-collapsed"));
            localStorage.setItem("church_sidebar_collapsed", sidebar.classList.contains("is-collapsed"));
        });
    }

    /* SIDEBAR MOBILE */
    function inicializarMobileSidebar() {
        const sidebar = document.getElementById("sidebar");
        const button = document.getElementById("mobileMenuButton");
        const overlay = document.getElementById("sidebarOverlay");

        function abrir() {
            sidebar?.classList.add("is-open");
            overlay?.classList.add("is-visible");
            document.body.classList.add("menu-open");
        }

        function fechar() {
            sidebar?.classList.remove("is-open");
            overlay?.classList.remove("is-visible");
            document.body.classList.remove("menu-open");
        }

        button?.addEventListener("click", abrir);
        overlay?.addEventListener("click", fechar);

        document.querySelectorAll(".sidebar__item").forEach(function (item) {
            item.addEventListener("click", fechar);
        });
    }

    /* PERFIL (dropdown) */
    function inicializarPerfil() {
        const button = document.getElementById("profileButton");
        const dropdown = document.getElementById("profileDropdown");

        button?.addEventListener("click", function (event) {
            event.stopPropagation();
            dropdown?.classList.toggle("is-open");
        });

        document.addEventListener("click", function (event) {
            if (dropdown && !dropdown.contains(event.target) && !button?.contains(event.target)) {
                dropdown.classList.remove("is-open");
            }
        });
    }

    /* DADOS DO USUÁRIO LOGADO */
    function preencherPerfil() {
        const sessao = JSON.parse(sessionStorage.getItem(SESSAO_KEY) || "null");
        if (!sessao) return;

        const nome = sessao.nome || sessao.email || "Administrador";
        const inicial = nome.trim().charAt(0).toUpperCase();

        document.querySelectorAll("[data-profile-nome]").forEach(function (el) {
            el.textContent = nome;
        });

        document.querySelectorAll("[data-profile-avatar]").forEach(function (el) {
            el.textContent = inicial;
        });
    }

    /* NOTIFICAÇÕES */
    function computarNotificacoes() {
        if (typeof Store === "undefined") return [];

        const notificacoes = [];
        const hoje = new Date();
        const hojeISO = hoje.toISOString().slice(0, 10);

        const limite = new Date(hoje);
        limite.setDate(limite.getDate() + 7);
        const limiteISO = limite.toISOString().slice(0, 10);

        Store.get(Store.KEYS.eventos)
            .filter((e) => e.data >= hojeISO && e.data <= limiteISO)
            .sort((a, b) => a.data.localeCompare(b.data))
            .forEach((e) => {
                notificacoes.push({
                    icone: "fa-calendar-days",
                    cor: "info",
                    titulo: e.nome,
                    mensagem: `Evento em ${e.data.split("-").reverse().join("/")}`
                });
            });

        const mesAtual = hoje.getMonth();
        Store.get(Store.KEYS.ministerios).forEach((ministerio) => {
            (ministerio.membros || []).forEach((membro) => {
                if (!membro.dataNascimento) return;
                const nascimento = new Date(`${membro.dataNascimento}T00:00:00`);
                if (nascimento.getMonth() === mesAtual) {
                    const dia = String(nascimento.getDate()).padStart(2, "0");
                    const mes = String(mesAtual + 1).padStart(2, "0");
                    notificacoes.push({
                        icone: "fa-cake-candles",
                        cor: "warning",
                        titulo: membro.nome,
                        mensagem: `Aniversário em ${dia}/${mes} • ${ministerio.nome}`
                    });
                }
            });
        });

        return notificacoes;
    }

    function renderNotificacoes() {
        const lista = document.getElementById("notificationsList");
        const dot = document.getElementById("notificationDot");
        const contador = document.getElementById("notificationsCount");
        if (!lista) return;

        const notificacoes = computarNotificacoes();

        if (contador) contador.textContent = notificacoes.length;
        if (dot) dot.hidden = notificacoes.length === 0;

        if (notificacoes.length === 0) {
            lista.innerHTML = `<div class="notifications__empty">Nenhuma notificação por aqui.</div>`;
            return;
        }

        lista.innerHTML = notificacoes.map((n) => `
            <div class="notifications__item">
                <span class="notifications__icon notifications__icon--${n.cor}"><i class="fa-solid ${n.icone}"></i></span>
                <div class="notifications__content">
                    <strong>${n.titulo}</strong>
                    <span>${n.mensagem}</span>
                </div>
            </div>`).join("");
    }

    function inicializarNotificacoes() {
        const button = document.getElementById("notificationsButton");
        const dropdown = document.getElementById("notificationsDropdown");
        if (!button || !dropdown) return;

        renderNotificacoes();

        button.addEventListener("click", function (event) {
            event.stopPropagation();
            dropdown.classList.toggle("is-open");
        });

        document.addEventListener("click", function (event) {
            if (!dropdown.contains(event.target) && !button.contains(event.target)) {
                dropdown.classList.remove("is-open");
            }
        });
    }

    /* MEU PERFIL */
    function inicializarMeuPerfil() {
        const btnPerfil = document.getElementById("btnMeuPerfil");
        const btnPreferencias = document.getElementById("btnPreferencias");
        const form = document.getElementById("formMeuPerfil");

        btnPreferencias?.addEventListener("click", function () {
            Toast.show("info", "Em breve", "As preferências ainda não foram implementadas.");
        });

        if (!btnPerfil || !form) return;

        btnPerfil.addEventListener("click", function () {
            const sessao = JSON.parse(sessionStorage.getItem(SESSAO_KEY) || "null");
            if (!sessao) return;

            const usuarios = JSON.parse(localStorage.getItem("ng_usuarios") || "[]");
            const usuario = usuarios.find((u) => u.email === sessao.email);

            form.nome.value = usuario?.nome || sessao.nome || "";
            form.email.value = sessao.email || "";
            form.senha.value = "";

            Modal.open("modalMeuPerfil");
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const usuarios = JSON.parse(localStorage.getItem("ng_usuarios") || "[]");
            const index = usuarios.findIndex((u) => u.email === form.email.value);
            if (index === -1) return;

            usuarios[index].nome = form.nome.value.trim();
            if (form.senha.value.trim()) {
                usuarios[index].senha = form.senha.value.trim();
            }
            localStorage.setItem("ng_usuarios", JSON.stringify(usuarios));

            const sessao = JSON.parse(sessionStorage.getItem(SESSAO_KEY) || "null");
            sessao.nome = usuarios[index].nome;
            sessionStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));

            preencherPerfil();
            Modal.close("modalMeuPerfil");
            Toast.show("success", "Perfil atualizado", "Seus dados foram salvos.");
        });
    }

    /* TEMA */
    function inicializarTema() {
        const html = document.documentElement;
        const button = document.querySelector("[data-theme-toggle]");
        const icon = document.querySelector("[data-theme-icon]");

        function aplicarTema(theme) {
            html.setAttribute("data-theme", theme);
            localStorage.setItem("church_theme", theme);

            if (icon) {
                icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
            }
        }

        aplicarTema(localStorage.getItem("church_theme") || "light");

        button?.addEventListener("click", function () {
            const atual = html.getAttribute("data-theme") || "light";
            aplicarTema(atual === "dark" ? "light" : "dark");
        });
    }

    /* LOGOUT */
    function inicializarLogout() {
        document.getElementById("logoutButton")?.addEventListener("click", function () {
            sessionStorage.removeItem(SESSAO_KEY);
            window.location.href = LOGIN_URL;
        });
    }

    /* PÁGINA ATUAL (sidebar ativa) */
    function definirPaginaAtual() {
        const pagina = obterNomePagina();

        document.querySelectorAll(".sidebar__item").forEach(function (item) {
            item.classList.remove("active");
            if (item.dataset.page === pagina) {
                item.classList.add("active");
            }
        });
    }

    /* TÍTULO DA PÁGINA */
    function definirTituloPagina() {
        const titulos = {
            cockpit: "Cockpit",
            ministerios: "Ministérios",
            eventos: "Eventos",
            batismo: "Batismo",
            "relatorio-culto": "Relatório de Culto"
        };

        const titulo = titulos[obterNomePagina()];
        if (!titulo) return;

        const el = document.querySelector("[data-header-title]");
        if (el) el.textContent = titulo;
    }

    function obterNomePagina() {
        return window.location.pathname.split("/").pop().replace(".html", "");
    }

    /* ESC fecha menus/modais */
    function inicializarEscape() {
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") return;

            document.getElementById("sidebar")?.classList.remove("is-open");
            document.getElementById("sidebarOverlay")?.classList.remove("is-visible");
            document.body.classList.remove("menu-open");
            document.getElementById("profileDropdown")?.classList.remove("is-open");

            document.querySelectorAll(".modal-root.is-open").forEach(function (modal) {
                modal.classList.remove("is-open");
                modal.setAttribute("aria-hidden", "true");
            });

            document.body.classList.remove("modal-open");
        });
    }

})();