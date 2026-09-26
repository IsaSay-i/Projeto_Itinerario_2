let eventoEditandoId = null;
let imagemEventoBase64 = "";

document.addEventListener("DOMContentLoaded", function () {
  renderEventos();

  document
    .getElementById("btnNovoEvento")
    .addEventListener("click", () => abrirModalEvento());
  document
    .getElementById("formEvento")
    .addEventListener("submit", salvarEvento);
  document
    .getElementById("eventoImagem")
    .addEventListener("change", tratarUploadImagem);

  verificarQueryString();
});

function verificarQueryString() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("novo") === "1") {
    abrirModalEvento();
  }
}

function renderEventos() {
  const eventos = [...Store.get(Store.KEYS.eventos)].sort((a, b) =>
    a.data.localeCompare(b.data),
  );
  const tbody = document.getElementById("tabelaEventos");

  if (eventos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
            <div class="empty-state__icon"><i class="fa-solid fa-calendar-days"></i></div>
            <h3>Nenhum evento cadastrado</h3>
            <p>Clique em "Novo Evento" para começar.</p>
        </div></td></tr>`;
    return;
  }

  tbody.innerHTML = eventos
    .map(
      (e) => `
        <tr>
        <td>
                <div class="table-actions">
                    <button class="table-action table-action--primary" title="Editar" onclick="abrirModalEvento('${e.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="table-action table-action--danger" title="Excluir" onclick="excluirEvento('${e.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
            <td><strong>${e.nome}</strong></td>
            <td>${formatarDataBR(e.data)}</td>
            <td>${e.hora || "—"}</td>
            <td>${e.responsavel || "—"}</td>
            <td>${e.endereco || "—"}</td>
            <td>
                ${
                  e.imagem
                    ? '<span class="poster-status poster-status--available" title="Cartaz disponível"><i class="fa-solid fa-image" aria-hidden="true"></i><span class="sr-only">Cartaz disponível</span></span>'
                    : '<span class="poster-status poster-status--empty" title="Sem cartaz"><i class="fa-regular fa-image" aria-hidden="true"></i><span class="sr-only">Sem cartaz</span></span>'
                }
            </td>
        </tr>`,
    )
    .join("");
}

function abrirModalEvento(id = null) {
  eventoEditandoId = id;
  imagemEventoBase64 = "";

  const form = document.getElementById("formEvento");
  form.reset();
  atualizarPreviewImagem("");

  document.getElementById("modalEventoTitulo").textContent = id
    ? "Editar Evento"
    : "Novo Evento";

  if (id) {
    const evento = Store.get(Store.KEYS.eventos).find((e) => e.id === id);
    form.nome.value = evento.nome;
    form.data.value = evento.data;
    form.hora.value = evento.hora || "";
    form.responsavel.value = evento.responsavel || "";
    form.endereco.value = evento.endereco || "";
    form.descricao.value = evento.descricao || "";

    imagemEventoBase64 = evento.imagem || "";
    atualizarPreviewImagem(imagemEventoBase64);
  }

  Modal.open("modalEvento");
}

function tratarUploadImagem(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    imagemEventoBase64 = leitor.result;
    atualizarPreviewImagem(imagemEventoBase64);
  };
  leitor.readAsDataURL(arquivo);
}

function atualizarPreviewImagem(base64) {
  const preview = document.getElementById("eventoImagemPreview");
  if (base64) {
    preview.style.backgroundImage = `url('${base64}')`;
    preview.classList.add("has-image");
  } else {
    preview.style.backgroundImage = "";
    preview.classList.remove("has-image");
  }
}

function salvarEvento(event) {
  event.preventDefault();
  const form = event.target;

  const dados = {
    nome: form.nome.value.trim(),
    data: form.data.value,
    hora: form.hora.value,
    responsavel: form.responsavel.value.trim(),
    endereco: form.endereco.value.trim(),
    descricao: form.descricao.value.trim(),
    imagem: imagemEventoBase64,
  };

  const eventos = Store.get(Store.KEYS.eventos);

  if (eventoEditandoId) {
    const index = eventos.findIndex((e) => e.id === eventoEditandoId);
    eventos[index] = { ...eventos[index], ...dados };
    Toast.show("success", "Evento atualizado", `${dados.nome} foi atualizado.`);
  } else {
    eventos.push({ id: Store.novoId(), ...dados });
    Toast.show("success", "Evento cadastrado", `${dados.nome} foi adicionado.`);
  }

  Store.save(Store.KEYS.eventos, eventos);
  Modal.close("modalEvento");
  renderEventos();
}

function excluirEvento(id) {
  const eventos = Store.get(Store.KEYS.eventos);
  const evento = eventos.find((e) => e.id === id);

  if (!confirm(`Tem certeza que deseja excluir "${evento.nome}"?`)) return;

  Store.save(
    Store.KEYS.eventos,
    eventos.filter((e) => e.id !== id),
  );
  Toast.show("info", "Evento excluído", `${evento.nome} foi removido.`);
  renderEventos();
}

function formatarDataBR(dataISO) {
  if (!dataISO) return "—";
  return dataISO.split("-").reverse().join("/");
}
