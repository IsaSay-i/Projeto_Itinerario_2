let batismoEditandoId = null;

document.addEventListener("DOMContentLoaded", function () {
    renderBatismos();

    document.getElementById("btnNovoBatismo").addEventListener("click", () => abrirModalBatismo());
    document.getElementById("formBatismo").addEventListener("submit", salvarBatismo);

    verificarQueryString();
});

function verificarQueryString() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("novo") === "1") {
        abrirModalBatismo();
    }
}

function renderBatismos() {
    const batismos = [...Store.get(Store.KEYS.batismos)].sort((a, b) => b.dataBatismo.localeCompare(a.dataBatismo));
    const tbody = document.getElementById("tabelaBatismos");

    if (batismos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
            <div class="empty-state__icon"><i class="fa-solid fa-water"></i></div>
            <h3>Nenhum batismo cadastrado</h3>
            <p>Clique em "Novo Batismo" para começar.</p>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = batismos.map((b) => `
        <tr>
            <td>
                <div class="table-actions">
                    <button class="table-action" title="Editar" onclick="abrirModalBatismo('${b.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="table-action table-action--danger" title="Excluir" onclick="excluirBatismo('${b.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
            <td>
                <div class="table-person">
                    <span class="table-person__avatar">${b.nome.charAt(0).toUpperCase()}</span>
                    <div class="table-person__info"><strong>${b.nome}</strong></div>
                </div>
            </td>
            <td>${formatarDataBR(b.dataNascimento)}</td>
            <td>${formatarDataBR(b.dataBatismo)}</td>
            <td>${b.contato || "—"}</td>
        </tr>`).join("");
}

function abrirModalBatismo(id = null) {
    batismoEditandoId = id;
    const form = document.getElementById("formBatismo");
    form.reset();

    document.getElementById("modalBatismoTitulo").textContent = id ? "Editar Batismo" : "Novo Batismo";

    if (id) {
        const batismo = Store.get(Store.KEYS.batismos).find((b) => b.id === id);
        form.nome.value = batismo.nome;
        form.dataNascimento.value = batismo.dataNascimento;
        form.dataBatismo.value = batismo.dataBatismo;
        form.contato.value = batismo.contato || "";
    } else {
        form.dataBatismo.value = new Date().toISOString().slice(0, 10);
    }

    Modal.open("modalBatismo");
}

function salvarBatismo(event) {
    event.preventDefault();
    const form = event.target;

    const dados = {
        nome: form.nome.value.trim(),
        dataNascimento: form.dataNascimento.value,
        dataBatismo: form.dataBatismo.value,
        contato: form.contato.value.trim()
    };

    const batismos = Store.get(Store.KEYS.batismos);

    if (batismoEditandoId) {
        const index = batismos.findIndex((b) => b.id === batismoEditandoId);
        batismos[index] = { ...batismos[index], ...dados };
        Toast.show("success", "Batismo atualizado", `${dados.nome} foi atualizado.`);
    } else {
        batismos.push({ id: Store.novoId(), ...dados });
        Toast.show("success", "Batismo cadastrado", `${dados.nome} foi adicionado.`);
    }

    Store.save(Store.KEYS.batismos, batismos);
    Modal.close("modalBatismo");
    renderBatismos();
}

function excluirBatismo(id) {
    const batismos = Store.get(Store.KEYS.batismos);
    const batismo = batismos.find((b) => b.id === id);

    if (!confirm(`Tem certeza que deseja excluir "${batismo.nome}"?`)) return;

    Store.save(Store.KEYS.batismos, batismos.filter((b) => b.id !== id));
    Toast.show("info", "Batismo excluído", `${batismo.nome} foi removido.`);
    renderBatismos();
}

function formatarDataBR(dataISO) {
    if (!dataISO) return "—";
    return dataISO.split("-").reverse().join("/");
}