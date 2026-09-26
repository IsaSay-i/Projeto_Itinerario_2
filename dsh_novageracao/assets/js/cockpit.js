document.addEventListener("DOMContentLoaded", function () {
  renderStats();
  renderProximosEventos();
  renderResumoGeral();
  renderGraficoFrequencia();
  animarEntrada();
});

function formatarDataCurta(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return { dia, mes: obterMesAbreviado(Number(mes) - 1) };
}

function obterMesAbreviado(indice) {
  const meses = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  return meses[indice] || "";
}

function renderStats() {
  const ministerios = Store.get(Store.KEYS.ministerios);
  const eventos = Store.get(Store.KEYS.eventos);
  const batismos = Store.get(Store.KEYS.batismos);
  const presencas = Store.get(Store.KEYS.presencas);

  const ultimoCulto = [...presencas].sort((a, b) =>
    b.dataCulto.localeCompare(a.dataCulto),
  )[0];

  document.getElementById("statMembros").textContent = Store.totalMembros();
  document.getElementById("statMinisterios").textContent = ministerios.length;
  document.getElementById("statEventos").textContent = eventos.length;
  document.getElementById("statBatismos").textContent = batismos.length;
  document.getElementById("statUltimoCulto").textContent = ultimoCulto
    ? ultimoCulto.quantidade
    : "—";
}

function renderProximosEventos() {
  const container = document.getElementById("proximosEventos");
  const hoje = new Date().toISOString().slice(0, 10);

  const eventos = Store.get(Store.KEYS.eventos)
    .filter((e) => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5);

  if (eventos.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon"><i class="fa-regular fa-calendar"></i></div>
                <h3>Nenhum evento agendado</h3>
                <p>Cadastre o próximo evento do ministério para vê-lo aqui.</p>
                <a href="eventos.html?novo=1" class="btn btn--primary btn--small" style="margin-top:14px;">
                    <i class="fa-solid fa-plus"></i> Novo Evento
                </a>
            </div>`;
    return;
  }

  container.innerHTML = eventos
    .map((evento) => {
      const { dia, mes } = formatarDataCurta(evento.data);
      return `
            <div class="event-item">
                <div class="event-item__date">
                    <strong>${dia}</strong>
                    <span>${mes}</span>
                </div>
                <div class="event-item__content">
                    <div class="event-item__title">${evento.nome}</div>
                    <div class="event-item__meta">${evento.hora || ""} • ${evento.responsavel || "Sem responsável"}</div>
                </div>
            </div>`;
    })
    .join("");
}

function renderResumoGeral() {
  const container = document.getElementById("resumoGeral");
  const ministerios = Store.get(Store.KEYS.ministerios);
  const eventos = Store.get(Store.KEYS.eventos);
  const presencas = Store.get(Store.KEYS.presencas);

  const hoje = new Date().toISOString().slice(0, 10);
  const proximoEvento = eventos
    .filter((e) => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0];

  const ultimoCulto = [...presencas].sort((a, b) =>
    b.dataCulto.localeCompare(a.dataCulto),
  )[0];

  const ministerioMaisMembros = [...ministerios].sort(
    (a, b) => (b.membros?.length || 0) - (a.membros?.length || 0),
  )[0];

  const itens = [
    { label: "Ministérios ativos", value: ministerios.length },
    {
      label: "Próximo evento",
      value: proximoEvento ? proximoEvento.nome : "Nenhum agendado",
    },
    {
      label: "Último culto registrado",
      value: ultimoCulto
        ? ultimoCulto.dataCulto.split("-").reverse().join("/")
        : "Sem registros",
    },
    {
      label: "Ministério com mais membros",
      value: ministerioMaisMembros ? ministerioMaisMembros.nome : "—",
    },
  ];

  container.innerHTML = itens
    .map(
      (item) => `
        <div class="summary-item">
            <span class="summary-item__label">${item.label}</span>
            <span class="summary-item__value">${item.value}</span>
        </div>`,
    )
    .join("");
}

function renderGraficoFrequencia() {
  const canvas = document.getElementById("graficoFrequencia");
  const wrapper = document.getElementById("graficoFrequenciaWrapper");

  const presencas = [...Store.get(Store.KEYS.presencas)]
    .sort((a, b) => a.dataCulto.localeCompare(b.dataCulto))
    .slice(-5);

  if (presencas.length === 0) {
    wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon"><i class="fa-solid fa-chart-line"></i></div>
                <h3>Sem registros de presença</h3>
                <p>Assim que os cultos forem registrados, o gráfico de frequência aparece aqui.</p>
            </div>`;
    return;
  }

  new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: presencas.map((p) => p.dataCulto.split("-").reverse().join("/")),
      datasets: [
        {
          label: "Participantes",
          data: presencas.map((p) => p.quantidade),
          borderColor: "#e31c25",
          backgroundColor: "rgba(227, 28, 37, 0.08)",
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#e31c25",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function animarEntrada() {
  if (typeof gsap === "undefined") return;

  gsap.from(".stat-card", {
    opacity: 0,
    y: 16,
    duration: 0.45,
    stagger: 0.06,
    ease: "power2.out",
  });

  gsap.from(".dashboard-card", {
    opacity: 0,
    y: 20,
    duration: 0.5,
    delay: 0.2,
    stagger: 0.08,
    ease: "power2.out",
  });
}
