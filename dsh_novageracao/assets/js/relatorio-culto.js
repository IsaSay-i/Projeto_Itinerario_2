let presencaEditandoId = null;

document.addEventListener("DOMContentLoaded", function () {
    renderPresencas();

    document.getElementById("btnNovoRelatorio").addEventListener("click", () => abrirModalPresenca());
    document.getElementById("formPresenca").addEventListener("submit", salvarPresenca);

    verificarQueryString();
});

function verificarQueryString() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("novo") === "1") {
        abrirModalPresenca();
    }
}

function renderPresencas() {
    const presencas = [...Store.get(Store.KEYS.presencas)].sort((a, b) => b.dataCulto.localeCompare(a.dataCulto));
    const tbody = document.getElementById("tabelaPresencas");

    if (presencas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">
            <div class="empty-state__icon"><i class="fa-solid fa-clipboard-list"></i></div>
            <h3>Nenhum culto registrado</h3>
            <p>Clique em "Novo Registro" para começar.</p>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = presencas.map((p) => `
        <tr>
            <td>
                <div class="table-actions">
                    <button class="table-action" title="Editar" onclick="abrirModalPresenca('${p.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="table-action table-action--danger" title="Excluir" onclick="excluirPresenca('${p.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
            <td><strong>${formatarDataBR(p.dataCulto)}</strong></td>
            <td>${p.pastor}</td>
            <td>${p.quantidade}</td>
        </tr>`).join("");
}

function abrirModalPresenca(id = null) {
    presencaEditandoId = id;
    const form = document.getElementById("formPresenca");
    form.reset();

    document.getElementById("modalPresencaTitulo").textContent = id ? "Editar Registro" : "Novo Registro";

    if (id) {
        const presenca = Store.get(Store.KEYS.presencas).find((p) => p.id === id);
        form.dataCulto.value = presenca.dataCulto;
        form.pastor.value = presenca.pastor;
        form.quantidade.value = presenca.quantidade;
    } else {
        form.dataCulto.value = new Date().toISOString().slice(0, 10);
    }

    Modal.open("modalPresenca");
}

function salvarPresenca(event) {
    event.preventDefault();
    const form = event.target;

    const dados = {
        dataCulto: form.dataCulto.value,
        pastor: form.pastor.value.trim(),
        quantidade: Number(form.quantidade.value)
    };

    const presencas = Store.get(Store.KEYS.presencas);

    if (presencaEditandoId) {
        const index = presencas.findIndex((p) => p.id === presencaEditandoId);
        presencas[index] = { ...presencas[index], ...dados };
        Toast.show("success", "Registro atualizado", `Culto de ${formatarDataBR(dados.dataCulto)} foi atualizado.`);
    } else {
        presencas.push({ id: Store.novoId(), ...dados });
        Toast.show("success", "Registro cadastrado", `Culto de ${formatarDataBR(dados.dataCulto)} foi adicionado.`);
    }

    Store.save(Store.KEYS.presencas, presencas);
    Modal.close("modalPresenca");
    renderPresencas();
}

function excluirPresenca(id) {
    const presencas = Store.get(Store.KEYS.presencas);
    const presenca = presencas.find((p) => p.id === id);

    if (!confirm(`Tem certeza que deseja excluir o registro de ${formatarDataBR(presenca.dataCulto)}?`)) return;

    Store.save(Store.KEYS.presencas, presencas.filter((p) => p.id !== id));
    Toast.show("info", "Registro excluído", `Culto de ${formatarDataBR(presenca.dataCulto)} foi removido.`);
    renderPresencas();
}

function formatarDataBR(dataISO) {
    if (!dataISO) return "—";
    return dataISO.split("-").reverse().join("/");
}