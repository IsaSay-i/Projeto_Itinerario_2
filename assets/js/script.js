"use strict";

/* =========================================================
   CONFIG
========================================================= */

const SITE_CONFIG = {
  mobileBreakpoint: 980,
  whatsapp: "5511999999999",
};

const $ = (seletor, escopo = document) => escopo.querySelector(seletor);
const $$ = (seletor, escopo = document) =>
  Array.from(escopo.querySelectorAll(seletor));

const prefereMenosMovimento = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FOCAVEIS =
  'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

/* Escapa texto antes de injetar em template string (evita HTML quebrado ou injeção) */
function esc(valor) {
  return String(valor ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
}

/* =========================================================
   HEADER
========================================================= */

function initHeader() {
  const header = $("#site-header");
  if (!header) return;

  let agendado = false;

  function aplicar() {
    header.classList.toggle("scrolled", window.scrollY > 60);
    agendado = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(aplicar);
    },
    { passive: true },
  );

  aplicar();
}

/* =========================================================
   MENU MOBILE
   Antes o menu era montado com estilos inline; agora o CSS
   cuida da aparência e o JS só controla o estado.
========================================================= */

function initMobileMenu() {
  const toggle = $(".nav-toggle");
  const nav = $(".main-nav");
  if (!toggle || !nav) return;

  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  function estaAberto() {
    return toggle.getAttribute("aria-expanded") === "true";
  }

  function abrir() {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Fechar menu");
    nav.dataset.open = "true";
    document.body.classList.add("nav-open");

    const primeiro = $(FOCAVEIS, nav);
    if (primeiro) primeiro.focus();
  }

  function fechar({ devolverFoco = false } = {}) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    delete nav.dataset.open;
    document.body.classList.remove("nav-open");
    if (devolverFoco) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    estaAberto() ? fechar({ devolverFoco: true }) : abrir();
  });

  backdrop.addEventListener("click", () => fechar());

  $$("a", nav).forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= SITE_CONFIG.mobileBreakpoint) fechar();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && estaAberto()) fechar({ devolverFoco: true });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > SITE_CONFIG.mobileBreakpoint && estaAberto())
      fechar();
  });
}

/* =========================================================
   REVEAL — um único sistema para a página inteira
   (antes GSAP e IntersectionObserver disputavam os mesmos
   elementos, causando piscadas e itens presos invisíveis)
========================================================= */

function observarReveals(elementos) {
  if (!elementos.length) return;

  const exibirTodos =
    !("IntersectionObserver" in window) || prefereMenosMovimento();

  if (exibirTodos) {
    elementos.forEach((elemento) => elemento.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entradas, observador) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("visible");
        observador.unobserve(entrada.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
  );

  elementos.forEach((elemento) => observer.observe(elemento));
}

function initReveal() {
  observarReveals($$(".reveal"));
}

/** Observa elementos criados depois do carregamento inicial. */
function observarNovosReveals(container) {
  if (container) observarReveals($$(".reveal", container));
}

/* =========================================================
   GSAP — só o hero (uma entrada orquestrada, nada mais)
========================================================= */

function initGSAP() {
  if (typeof gsap === "undefined" || prefereMenosMovimento()) return;

  const hero = $(".hero");
  if (!hero) return;

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  const alvos = [
    [".hero-eyebrow", { opacity: 0, y: 16, duration: 0.6 }, 0],
    ["h1", { opacity: 0, y: 28, duration: 0.8 }, "-=0.35"],
    ["p.lede", { opacity: 0, y: 20, duration: 0.7 }, "-=0.5"],
  ];

  alvos.forEach(([seletor, props, posicao]) => {
    const el = hero.querySelector(seletor);
    if (el) tl.from(el, props, posicao);
  });

  const acoes = $$(".hero-actions a", hero);
  if (acoes.length) {
    tl.from(
      acoes,
      { opacity: 0, y: 16, stagger: 0.12, duration: 0.6 },
      "-=0.45",
    );
  }

  [".glow-1", ".glow-2"].forEach((seletor, i) => {
    const el = hero.querySelector(seletor);
    if (!el) return;
    tl.from(
      el,
      { opacity: 0, scale: 0.7, duration: 1.2 },
      i === 0 ? "-=1" : "-=1.1",
    );
    gsap.to(el, {
      x: i === 0 ? 40 : -30,
      y: i === 0 ? 30 : -20,
      duration: i === 0 ? 8 : 9,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  });
}

/* =========================================================
   MODAL ACESSÍVEL (base reutilizada por unidades e eventos)
========================================================= */

function criarModal(modal, seletorFechar) {
  if (!modal) return null;

  let ultimoFoco = null;

  function abrir() {
    ultimoFoco = document.activeElement;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const primeiro = $(FOCAVEIS, modal);
    if (primeiro) primeiro.focus();
  }

  function fechar() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (ultimoFoco && typeof ultimoFoco.focus === "function")
      ultimoFoco.focus();
  }

  function estaAberto() {
    return modal.classList.contains("active");
  }

  $$(seletorFechar, modal).forEach((botao) =>
    botao.addEventListener("click", fechar),
  );

  document.addEventListener("keydown", (event) => {
    if (!estaAberto()) return;

    if (event.key === "Escape") {
      fechar();
      return;
    }

    if (event.key !== "Tab") return;

    // Mantém o foco dentro do modal
    const focaveis = $$(FOCAVEIS, modal).filter(
      (el) => el.offsetParent !== null,
    );
    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (event.shiftKey && document.activeElement === primeiro) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primeiro.focus();
    }
  });

  return { abrir, fechar, estaAberto };
}

/* =========================================================
   CULTOS
========================================================= */

function getCultos() {
  return [
      {
        dia: "SEG",
        tipo: "Toda primeira segunda-feira",
        titulo: "Culto de obreiros",
        local: "Templo Sede · Tatuapé, SP",
        horario: "19h30",
      },
    {
      dia: "QUA",
      tipo: "Culto de ensino",
      titulo: "Culto na Igreja Sede",
      local: "Templo Sede · Tatuapé, SP",
      horario: "19h30",
    },
    {
      dia: "DOM",
      tipo: "Culto da família",
      titulo: "Culto na Igreja Sede",
      local: "Templo Sede · Tatuapé, SP",
      horario: "8h",
    },
    {
      dia: "DOM",
      tipo: "Culto Nova Geração",
      titulo: "Culto na Igreja Sede",
      local: "Templo Sede · Tatuapé, SP",
      horario: "18h",
    },
  ];
}

function initCultos() {
  const container = $("#cultos-list");
  if (!container) return;

  container.innerHTML = getCultos()
    .map(
      (culto) => `
        <article class="culto-item reveal">
            <div class="culto-day"><span>${esc(culto.dia)}</span></div>
            <div class="culto-main">
                <span class="culto-type">${esc(culto.tipo)}</span>
                <h3>${esc(culto.titulo)}</h3>
                <span class="culto-place">${esc(culto.local)}</span>
            </div>
            <div class="culto-hour"><span>${esc(culto.horario)}</span></div>
            <a class="culto-indicator" href="https://www.instagram.com/igrejanovageracao/" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram da Igreja Nova Geração">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                    <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
            </a>
        </article>
    `,
    )
    .join("");

  observarNovosReveals(container);
}

/* =========================================================
   MINISTÉRIOS
========================================================= */

function getMinisterios() {
  return [
    {
      nome: "Louvor e adoração",
      titulo: "Onde a música se transforma em adoração.",
      descricao:
        "Conduz a igreja em momentos de louvor e adoração, usando a música para criar um ambiente de comunhão, entrega e conexão com Deus.",
      imagem: "assets/img/ministerio/louvor_adoracao.jpg",
      alt: "Equipe do ministério de louvor durante um culto",
      local: "Templo Sede · Tatuapé, SP",
      lider: "Líder Rita",
    },
    {
      nome: "Zeladoria",
      titulo: "Onde cada detalhe é cuidado com amor.",
      descricao:
        "Cuida da limpeza, organização e conservação do templo, garantindo que os espaços estejam sempre prontos para os cultos e demais atividades.",
      imagem: "assets/img/ministerio/ministerio_zeladoria.jpg",
      alt: "Ministério de zeladoria organizando o templo",
      local: "Templo Sede · Tatuapé, SP",
      lider: "",
    },
    {
      nome: "Mídia",
      titulo: "Onde cada momento ganha voz, imagem e alcance.",
      descricao:
        "Cuida de toda a parte audiovisual: projeção, som, iluminação, câmeras e transmissões ao vivo, para que cada culto chegue longe com qualidade.",
      imagem: "assets/img/ministerio/ministério_mídia.jpg",
      alt: "Equipe de mídia operando câmeras e transmissão",
      local: "Templo Sede · Tatuapé, SP",
      lider: "Líder Michel",
    },
    {
      nome: "Start",
      titulo: "Onde cuidado e intercessão caminham juntos.",
      descricao:
        "Recebe quem chega na entrada do templo e atua em intercessão durante os cultos, contribuindo para a organização e a cobertura espiritual da igreja.",
      imagem: "assets/img/ministerio/ministério_start.jpg",
      alt: "Voluntários recebendo pessoas na entrada da igreja",
      local: "São Paulo · SP",
      lider: "Líder Marisa",
    },
    {
      nome: "Casais",
      titulo: "Onde o amor é cuidado e o relacionamento é fortalecido.",
      descricao:
        "Acolhe, acompanha e fortalece os casais da igreja, com momentos de comunhão, cuidado e crescimento para a vida a dois.",
      imagem: "assets/img/ministerio/ministério_casais.jpg",
      alt: "Casais reunidos em um encontro da igreja",
      local: "São Paulo · SP",
      lider: "Líder Marisa",
    },
  ];
}

function initMinisterios() {
  const container = $("#ministerios-list");
  if (!container) return;

  container.innerHTML = getMinisterios()
    .map((m, index) => {
      const numero = String(index + 1).padStart(2, "0");
      const reverse = index % 2 !== 0 ? " reverse" : "";

      return `
            <article class="ministerio-item${reverse} reveal">
                <div class="ministerio-number" aria-hidden="true">${numero}</div>

                <div class="ministerio-media">
                    <img src="${esc(m.imagem)}" alt="${esc(m.alt)}" loading="lazy" decoding="async">
                    <div class="ministerio-image-overlay"></div>
                    <span class="ministerio-image-category">${esc(m.nome)}</span>
                    <span class="ministerio-image-line"></span>
                </div>

                <div class="ministerio-content">
                    <div class="ministerio-top"><span>Ministério</span></div>
                    <span class="ministerio-name">${esc(m.nome)}</span>
                    <h3>${esc(m.titulo)}</h3>
                    <p>${esc(m.descricao)}</p>
                    <div class="ministerio-bottom">
                        <span class="ministerio-location">${esc(m.local)}</span>
                        ${m.lider ? `<span class="ministerio-location">${esc(m.lider)}</span>` : ""}
                    </div>
                </div>
            </article>
        `;
    })
    .join("");

  observarNovosReveals(container);
}

/* =========================================================
   EVENTOS
========================================================= */

function getEventos() {
  return [
    {
      dia: "26",
      mes: "SET",
      dataCompleta: "26 de setembro",
      titulo: "Avivah Rute",
      descricao:
        "Um encontro voltado para mulheres, com adoração, comunhão, renovo e avivamento espiritual.",
      descricaoCompleta:
        "Inspirado na jornada bíblica do livro de Rute, este evento vai além de um encontro comum para mulheres: é um chamado à restauração, ao posicionamento e ao despertar do propósito. A história de Rute ensina sobre transição, lealdade e fé no meio da adversidade, e sobre como o amor de Deus transforma desolação em um futuro de honra e frutos abundantes.",
      hora: "17h30",
      local: "Centro Esportivo José Bonifácio · São Paulo",
      imagem: "assets/img/evento/AvivahRute.jpg",
      alt: "Arte de divulgação do evento Avivah Rute",
    },
  ];
}

function initEventos() {
  const track = $("#eventos-track");
  if (!track) return;

  const eventos = getEventos();
  const el = {
    track,
    prev: $("#eventos-prev"),
    next: $("#eventos-next"),
    current: $("#eventos-current"),
    total: $("#eventos-total"),
    progressBar: $("#eventos-progress-bar"),
    modal: $("#evento-modal"),
    imagem: $("#evento-modal-image"),
    dia: $("#evento-modal-day"),
    mes: $("#evento-modal-month"),
    numero: $("#evento-modal-number"),
    titulo: $("#evento-modal-title"),
    descricao: $("#evento-modal-description"),
    extra: $("#evento-modal-extra"),
    hora: $("#evento-modal-time"),
    local: $("#evento-modal-location"),
    dataCompleta: $("#evento-modal-full-date"),
  };

  const modal = criarModal(el.modal, "[data-evento-close]");

  function preencherModal(evento, index) {
    if (el.imagem) {
      el.imagem.src = evento.imagem;
      el.imagem.alt = evento.alt;
    }
    if (el.dia) el.dia.textContent = evento.dia;
    if (el.mes) el.mes.textContent = evento.mes;
    if (el.numero) el.numero.textContent = String(index + 1).padStart(2, "0");
    if (el.titulo) el.titulo.textContent = evento.titulo;
    if (el.descricao) el.descricao.textContent = evento.descricao;
    if (el.extra) el.extra.textContent = evento.descricaoCompleta;
    if (el.hora) el.hora.textContent = evento.hora;
    if (el.local) el.local.textContent = evento.local;
    if (el.dataCompleta) el.dataCompleta.textContent = evento.dataCompleta;
  }

  // Render
  track.dataset.count = String(eventos.length);
  track.innerHTML = "";

  eventos.forEach((evento, index) => {
    const card = document.createElement("article");
    card.className = "evento-card";
    card.dataset.number = String(index + 1).padStart(2, "0");

    card.innerHTML = `
            <div class="evento-media">
                <img src="${esc(evento.imagem)}" alt="${esc(evento.alt)}" loading="lazy" decoding="async">
                <div class="evento-date"><b>${esc(evento.dia)}</b><span>${esc(evento.mes)}</span></div>
            </div>
            <div class="evento-body">
                <h4>${esc(evento.titulo)}</h4>
                <p>${esc(evento.descricao)}</p>
                <div class="evento-meta">
                    <span class="evento-meta-item">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
                        ${esc(evento.hora)}
                    </span>
                    <span class="evento-meta-item">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>
                        ${esc(evento.local.split("·")[0].trim())}
                    </span>
                </div>
                <button class="evento-card-btn sr-only" type="button">Ver detalhes de ${esc(evento.titulo)}</button>
            </div>
        `;

    const abrir = () => {
      if (track.dataset.dragged === "true") return;
      preencherModal(evento, index);
      modal && modal.abrir();
    };

    card.addEventListener("click", abrir);
    const botao = $(".evento-card-btn", card);
    if (botao)
      botao.addEventListener("click", (event) => {
        event.stopPropagation();
        abrir();
      });

    track.appendChild(card);
  });

  if (el.total) el.total.textContent = String(eventos.length).padStart(2, "0");

  // Navegação
  function mover(direcao) {
    const card = $(".evento-card", track);
    if (!card) return;
    track.scrollBy({
      left: (card.offsetWidth + 15) * direcao,
      behavior: "smooth",
    });
  }

  if (el.prev) el.prev.addEventListener("click", () => mover(-1));
  if (el.next) el.next.addEventListener("click", () => mover(1));

  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      mover(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      mover(-1);
    }
  });

  // Progresso
  function atualizarProgresso() {
    if (!el.current || !el.progressBar) return;

    const scrollMax = track.scrollWidth - track.clientWidth;

    if (scrollMax <= 1) {
      el.current.textContent = "01";
      el.progressBar.style.width = "100%";
      if (el.prev) el.prev.disabled = true;
      if (el.next) el.next.disabled = true;
      return;
    }

    const percentual = track.scrollLeft / scrollMax;
    const index = Math.min(
      eventos.length,
      Math.max(1, Math.round(percentual * (eventos.length - 1)) + 1),
    );

    el.current.textContent = String(index).padStart(2, "0");
    el.progressBar.style.width = `${Math.max(25, percentual * 100)}%`;
    if (el.prev) el.prev.disabled = track.scrollLeft <= 2;
    if (el.next) el.next.disabled = track.scrollLeft >= scrollMax - 2;
  }

  track.addEventListener("scroll", atualizarProgresso, { passive: true });
  window.addEventListener("resize", atualizarProgresso);
  atualizarProgresso();

  // Arrastar com o mouse (Pointer Events cobre mouse, caneta e touch)
  let arrastando = false;
  let inicioX = 0;
  let inicioScroll = 0;

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return; // o scroll nativo já resolve
    arrastando = true;
    track.dataset.dragged = "false";
    inicioX = event.clientX;
    inicioScroll = track.scrollLeft;
    track.classList.add("is-dragging");
  });

  track.addEventListener("pointermove", (event) => {
    if (!arrastando) return;
    const delta = event.clientX - inicioX;
    if (Math.abs(delta) > 5) track.dataset.dragged = "true";
    track.scrollLeft = inicioScroll - delta;
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
    track.addEventListener(evt, () => {
      arrastando = false;
      track.classList.remove("is-dragging");
      window.setTimeout(() => {
        track.dataset.dragged = "false";
      }, 50);
    });
  });
}

/* =========================================================
   LOCALIDADES
========================================================= */

function getLocalidades() {
  return [
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Belenzinho",
      tipo: "Igreja Nova Geração",
      endereco: "Rua Belem, 98 - Belenzinho - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Belem%2C+98%2C+Belenzinho%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Cidade A. E. Carvalho",
      tipo: "Igreja Nova Geração",
      endereco:
        "Avenida Aguia de Haia, 1453 - Cidade A. E. Carvalho - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Aguia+de+Haia%2C+1453%2C+Cidade+A.+E.+Carvalho%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Cidade Tiradentes",
      tipo: "Igreja Nova Geração",
      endereco: "Rua Francisco Pawlik, 42 - Cidade Tiradentes - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Francisco+Pawlik%2C+42%2C+Cidade+Tiradentes%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Cidade Tiradentes - Castro Alves",
      tipo: "Igreja Nova Geração",
      endereco:
        "Avenida Sara Kubitscheck, 654 - Cidade Tiradentes - Castro Alves - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Sara+Kubitscheck%2C+654%2C+Cidade+Tiradentes%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Ermelino Matarazzo",
      tipo: "Igreja Nova Geração",
      endereco: "Avenida Boturussu, 1732 - Ermelino Matarazzo - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Boturussu%2C+1732%2C+Ermelino+Matarazzo%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Guaianazes",
      tipo: "Igreja Nova Geração",
      endereco: "Avenida Nordestina, 5319 - Guaianazes - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Nordestina%2C+5319%2C+Guaianazes%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Iguatemi",
      tipo: "Igreja Nova Geração",
      endereco: "Rua Luiza de Jesus Ferreira, 408 - Iguatemi - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Luiza+de+Jesus+Ferreira%2C+408%2C+Iguatemi%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Itaquera",
      tipo: "Igreja Nova Geração",
      endereco: "Avenida Itaquera, 7547 - Itaquera - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Itaquera%2C+7547%2C+Itaquera%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Jardim Camargo Novo - Encosta Norte",
      tipo: "Igreja Nova Geração",
      endereco: "Consulte o endereço atualizado da unidade",
      mapa: "https://www.google.com/maps/search/?api=1&query=Igreja+Nova+Gera%C3%A7%C3%A3o+Jardim+Camargo+Novo+Encosta+Norte+S%C3%A3o+Paulo+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Jardim Danfer",
      tipo: "Igreja Nova Geração",
      endereco: "Praça Felix, 4 - Jardim Danfer - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Pra%C3%A7a+Felix%2C+4%2C+Jardim+Danfer%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Jardim Santo André",
      tipo: "Igreja Nova Geração",
      endereco:
        "Av. dos Sertanistas, 613 - Jardim Santo André - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Av.+dos+Sertanistas%2C+613%2C+Jardim+Santo+Andr%C3%A9%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Jd Nazaré",
      tipo: "Igreja Nova Geração",
      endereco:
        "Rua João Correia de Magalhães, 243 - Jd Nazaré - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Jo%C3%A3o+Correia+de+Magalh%C3%A3es%2C+243%2C+Jd+Nazar%C3%A9%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Limoeiro",
      tipo: "Igreja Nova Geração",
      endereco: "Avenida Augusto Antunes, 387 - Limoeiro - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Augusto+Antunes%2C+387%2C+Limoeiro%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "São Mateus",
      tipo: "Igreja Nova Geração",
      endereco: "Avenida Maria Cursi, 881 - São Mateus - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Maria+Cursi%2C+881%2C+S%C3%A3o+Mateus%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "São Miguel Paulista",
      tipo: "Igreja Nova Geração",
      endereco:
        "Rua Ribeiro dos Santos, 133 - São Miguel Paulista - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Ribeiro+dos+Santos%2C+133%2C+S%C3%A3o+Miguel+Paulista%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Tatuapé",
      tipo: "Templo Sede",
      endereco: "Av. Celso Garcia, 5293 - Tatuapé - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Celso+Garcia%2C+5293%2C+Tatuap%C3%A9%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Vila Curuçá",
      tipo: "Igreja Nova Geração",
      endereco: "Rua Guaraitá, 1462 - Vila Curuçá - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Guarait%C3%A1%2C+1462%2C+Vila+Curu%C3%A7%C3%A1%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Vila Formosa",
      tipo: "Igreja Nova Geração",
      endereco: "R. Fabio, 31 - Vila Formosa - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Fabio%2C+31%2C+Vila+Formosa%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Vila Nova",
      tipo: "Igreja Nova Geração",
      endereco:
        "Avenida Ernesto de Souza Cruz, 560 - Vila Nova - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Ernesto+de+Souza+Cruz%2C+560%2C+Vila+Nova%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "São Paulo",
      bairro: "Vila Yolanda",
      tipo: "Igreja Nova Geração",
      endereco:
        "Rua Dr. Adhemar Ferreira de Carvalho, 2 - Vila Yolanda - São Paulo - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Dr.+Adhemar+Ferreira+de+Carvalho%2C+2%2C+Vila+Yolanda%2C+S%C3%A3o+Paulo%2C+SP",
    },
    {
      estado: "Rio de Janeiro",
      cidade: "Rio de Janeiro",
      bairro: "Cascadura",
      tipo: "Igreja Nova Geração",
      endereco: "Av. Dom Helder Câmara, 9932 - Cascadura - Rio de Janeiro - RJ",
      mapa: "https://www.google.com/maps/search/?api=1&query=Av.+Dom+Helder+C%C3%A2mara%2C+9932%2C+Cascadura%2C+Rio+de+Janeiro%2C+RJ",
    },
    {
      estado: "São Paulo",
      cidade: "Suzano",
      bairro: "Cidade Miguel Badra",
      tipo: "Igreja Nova Geração",
      endereco:
        "Rua José Ferreira Neves, 190 - Cidade Miguel Badra - Suzano - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Jos%C3%A9+Ferreira+Neves%2C+190%2C+Cidade+Miguel+Badra%2C+Suzano%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "Guarulhos",
      bairro: "Jardim Adriana",
      tipo: "Igreja Nova Geração",
      endereco:
        "Rua Clovis Fernandes de Lima, 30 - Jardim Adriana - Guarulhos - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Clovis+Fernandes+de+Lima%2C+30%2C+Jardim+Adriana%2C+Guarulhos%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "Guarulhos",
      bairro: "Pimentas 1",
      tipo: "Igreja Nova Geração",
      endereco: "Rua Riachão Jacuipe, 128 - Pimentas 1 - Guarulhos - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Riach%C3%A3o+Jacuipe%2C+128%2C+Pimentas+1%2C+Guarulhos%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "Guarulhos",
      bairro: "Pimentas JK",
      tipo: "Igreja Nova Geração",
      endereco:
        "Estrada Presidente Juscelino Kubitschek de Oliveira, 861 - Pimentas JK - Guarulhos - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Estrada+Presidente+Juscelino+Kubitschek+de+Oliveira%2C+861%2C+Pimentas+JK%2C+Guarulhos%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "Itaquaquecetuba",
      bairro: "Jardim Gonçalves",
      tipo: "Igreja Nova Geração",
      endereco:
        "Rua Caxias do Sul, 112 - Jardim Gonçalves - Itaquaquecetuba - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Rua+Caxias+do+Sul%2C+112%2C+Jardim+Gon%C3%A7alves%2C+Itaquaquecetuba%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "Ferraz de Vasconcelos",
      bairro: "Vila São Paulo",
      tipo: "Igreja Nova Geração",
      endereco:
        "Avenida Pedro Cardoso Xavier, 89 - Vila São Paulo - Ferraz de Vasconcelos - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Avenida+Pedro+Cardoso+Xavier%2C+89%2C+Vila+S%C3%A3o+Paulo%2C+Ferraz+de+Vasconcelos%2C+SP",
    },
    {
      estado: "São Paulo",
      cidade: "Mogi das Cruzes",
      bairro: "Vila Vitória",
      tipo: "Igreja Nova Geração",
      endereco:
        "Travessa Vicente Manna Júnior, 26 - Vila Vitória - Mogi das Cruzes - SP",
      mapa: "https://www.google.com/maps/search/?api=1&query=Travessa+Vicente+Manna+J%C3%BAnior%2C+26%2C+Vila+Vit%C3%B3ria%2C+Mogi+das+Cruzes%2C+SP",
    },
  ];
}

function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function initLocalidades() {
  const lista = $("#localidades-list");
  const modalEl = $("#localidade-modal");
  if (!lista || !modalEl) return;

  const modal = criarModal(
    modalEl,
    "#localidade-modal-close, [data-localidade-close]",
  );

  const ref = {
    embed: $("#localidade-modal-embed"),
    cidade: $("#localidade-modal-city"),
    label: $("#localidade-modal-label"),
    titulo: $("#localidade-modal-title"),
    endereco: $("#localidade-modal-address"),
    mapa: $("#localidade-modal-map"),
  };

  const busca = $("#busca-localidade");
  const contador = $("#localidades-count");
  const vazio = $("#localidades-empty");

  const localidades = getLocalidades();

  function abrirModal(localidade) {
    if (ref.embed) {
      ref.embed.src = `https://www.google.com/maps?q=${encodeURIComponent(localidade.endereco)}&output=embed`;
      ref.embed.title = `Mapa da unidade em ${localidade.bairro}`;
    }
    if (ref.cidade)
      ref.cidade.textContent = `${localidade.cidade} — ${localidade.estado}`;
    if (ref.label) ref.label.textContent = localidade.tipo;
    if (ref.titulo) ref.titulo.textContent = localidade.bairro;
    if (ref.endereco) ref.endereco.textContent = localidade.endereco;
    if (ref.mapa) ref.mapa.href = localidade.mapa;
    modal && modal.abrir();
  }

  function render(filtro = "") {
    const termo = normalizar(filtro.trim());

    const visiveis = termo
      ? localidades.filter((l) =>
          normalizar(
            `${l.bairro} ${l.cidade} ${l.estado} ${l.endereco}`,
          ).includes(termo),
        )
      : localidades;

    lista.innerHTML = "";

    if (contador) {
      contador.textContent = visiveis.length
        ? `${visiveis.length} ${visiveis.length === 1 ? "unidade" : "unidades"}`
        : "";
    }

    if (vazio) vazio.hidden = visiveis.length > 0;
    if (!visiveis.length) return;

    const grupos = visiveis.reduce((acc, l) => {
      (acc[l.estado] = acc[l.estado] || []).push(l);
      return acc;
    }, {});

    let contadorItem = 0;

    Object.entries(grupos).forEach(([estado, locais]) => {
      const grupo = document.createElement("div");
      grupo.className = "localidades-v2-group reveal";

      const header = document.createElement("div");
      header.className = "localidades-v2-group-header";
      header.innerHTML = `
                <span class="localidades-v2-group-title">${esc(estado)}</span>
                <span class="localidades-v2-group-count">${locais.length} ${locais.length === 1 ? "local" : "locais"}</span>
            `;
      grupo.appendChild(header);

      locais.forEach((localidade) => {
        contadorItem++;

        const item = document.createElement("button");
        item.type = "button";
        item.className = "localidades-v2-item";
        item.innerHTML = `
                    <span class="localidades-v2-item-number" aria-hidden="true">${String(contadorItem).padStart(2, "0")}</span>
                    <span class="localidades-v2-item-name">${esc(localidade.bairro)}</span>
                    <span class="localidades-v2-item-city">${esc(localidade.cidade)}</span>
                    <span class="localidades-v2-item-arrow" aria-hidden="true">↗</span>
                `;
        item.addEventListener("click", () => abrirModal(localidade));
        grupo.appendChild(item);
      });

      lista.appendChild(grupo);
    });

    observarNovosReveals(lista);
  }

  if (busca) {
    let timer;
    busca.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => render(busca.value), 180);
    });
  }

  render();
}

/* =========================================================
   FORMULÁRIO DE CONTATO
========================================================= */

function initContactForm() {
  const form = $("#contact-form");
  if (!form) return;

  const status = $("#form-status");

  const regras = {
    nome: (valor) => valor.trim().length >= 2 || "Informe seu nome completo.",
    email: (valor) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim()) ||
      "Informe um e-mail válido.",
    mensagem: (valor) =>
      valor.trim().length >= 10 || "Escreva pelo menos 10 caracteres.",
  };

  function validarCampo(campo) {
    const regra = regras[campo.name];
    if (!regra) return true;

    const resultado = regra(campo.value);
    const wrapper = campo.closest(".field");
    const erro = wrapper && $(".field-error", wrapper);

    if (resultado === true) {
      wrapper && wrapper.classList.remove("has-error");
      campo.removeAttribute("aria-invalid");
      if (erro) erro.textContent = "";
      return true;
    }

    wrapper && wrapper.classList.add("has-error");
    campo.setAttribute("aria-invalid", "true");
    if (erro) erro.textContent = resultado;
    return false;
  }

  Object.keys(regras).forEach((nome) => {
    const campo = form.elements[nome];
    if (campo) campo.addEventListener("blur", () => validarCampo(campo));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // honeypot: se estiver preenchido, é bot
    if (form.elements.site && form.elements.site.value) return;

    const campos = Object.keys(regras)
      .map((n) => form.elements[n])
      .filter(Boolean);
    const invalidos = campos.filter((campo) => !validarCampo(campo));

    if (invalidos.length) {
      if (status) {
        status.dataset.state = "error";
        status.textContent = "Confira os campos destacados antes de enviar.";
      }
      invalidos[0].focus();
      return;
    }

    const botao = $('button[type="submit"]', form);
    if (botao) {
      botao.disabled = true;
      botao.dataset.originalText = botao.textContent;
      botao.textContent = "Enviando...";
    }

    try {
      const resposta = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!resposta.ok) throw new Error("Falha no envio");

      if (status) {
        status.dataset.state = "success";
        status.textContent = "Mensagem enviada. Vamos responder em breve.";
      }
      form.reset();
    } catch (erro) {
      if (status) {
        status.dataset.state = "error";
        status.textContent =
          "Não foi possível enviar agora. Tente novamente ou use nosso e-mail.";
      }
    } finally {
      if (botao) {
        botao.disabled = false;
        botao.textContent = botao.dataset.originalText || "Enviar mensagem";
      }
    }
  });
}

/* =========================================================
   MISC
========================================================= */

function initAnoAtual() {
  const el = $("#ano-atual");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* =========================================================
   INIT
========================================================= */

function initSite() {
  initHeader();
  initMobileMenu();
  initCultos();
  initMinisterios();
  initLocalidades();
  initEventos();
  initContactForm();
  initAnoAtual();
  initReveal();
  initGSAP();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  initSite();
}
