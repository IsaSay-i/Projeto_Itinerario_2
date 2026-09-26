let ministerioEditandoId = null;
let membroEditando = null; // { ministerioId, membroId }

document.addEventListener("DOMContentLoaded", function () {
    renderMinisterios();
    renderMembros();
    popularSelectsDeMinisterio();

    document.getElementById("btnNovoMinisterio").addEventListener("click", () => abrirModalMinisterio());
    document.getElementById("btnNovoMembro").addEventListener("click", () => abrirModalMembro());
    document.getElementById("filtroMinisterio").addEventListener("change", renderMembros);

    document.getElementById("formMinisterio").addEventListener("submit", salvarMinisterio);
    document.getElementById("formMembro").addEventListener("submit", salvarMembro);

    verificarQueryString();
});

function verificarQueryString() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("novo") === "1") {
        abrirModalMinisterio();
    }
}

/* ============================================================
   MINISTÉRIOS
============================================================ */

function renderMinisterios() {
    const ministerios = Store.get(Store.KEYS.ministerios);
    const tbody = document.getElementById("tabelaMinisterios");

    if (ministerios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
            <div class="empty-state__icon"><i class="fa-solid fa-people-group"></i></div>
            <h3>Nenhum ministério cadastrado</h3>
            <p>Clique em "Novo Ministério" para começar.</p>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = ministerios.map((m) => `
        <tr>
            <td>
                <div class="table-actions">
                    <button class="table-action table-action--primary" title="Editar" onclick="abrirModalMinisterio('${m.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="table-action table-action--danger" title="Excluir" onclick="excluirMinisterio('${m.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
            <td>${m.nome}</td>
            <td>${m.lider}</td>
            <td>${formatarDataBR(m.dataCriacao)}</td>
            <td>${m.membros?.length || 0}</td>
        </tr>`).join("");
}

function abrirModalMinisterio(id = null) {
    ministerioEditandoId = id;
    const form = document.getElementById("formMinisterio");
    form.reset();

    document.getElementById("modalMinisterioTitulo").textContent = id ? "Editar Ministério" : "Novo Ministério";

    if (id) {
        const ministerio = Store.get(Store.KEYS.ministerios).find((m) => m.id === id);
        form.nome.value = ministerio.nome;
        form.lider.value = ministerio.lider;
        form.dataCriacao.value = ministerio.dataCriacao;
    } else {
        form.dataCriacao.value = new Date().toISOString().slice(0, 10);
    }

    Modal.open("modalMinisterio");
}

function salvarMinisterio(event) {
    event.preventDefault();
    const form = event.target;

    const dados = {
        nome: form.nome.value.trim(),
        lider: form.lider.value.trim(),
        dataCriacao: form.dataCriacao.value
    };

    const ministerios = Store.get(Store.KEYS.ministerios);

    if (ministerioEditandoId) {
        const index = ministerios.findIndex((m) => m.id === ministerioEditandoId);
        ministerios[index] = { ...ministerios[index], ...dados };
        Toast.show("success", "Ministério atualizado", `${dados.nome} foi atualizado com sucesso.`);
    } else {
        ministerios.push({ id: Store.novoId(), ...dados, membros: [] });
        Toast.show("success", "Ministério cadastrado", `${dados.nome} foi adicionado.`);
    }

    Store.save(Store.KEYS.ministerios, ministerios);
    Modal.close("modalMinisterio");
    renderMinisterios();
    renderMembros();
    popularSelectsDeMinisterio();
}

function excluirMinisterio(id) {
    const ministerios = Store.get(Store.KEYS.ministerios);
    const ministerio = ministerios.find((m) => m.id === id);

    const temMembros = ministerio.membros && ministerio.membros.length > 0;
    const confirmacao = temMembros
        ? confirm(`"${ministerio.nome}" possui ${ministerio.membros.length} membro(s) cadastrado(s). Excluir o ministério também removerá esses membros. Deseja continuar?`)
        : confirm(`Tem certeza que deseja excluir "${ministerio.nome}"?`);

    if (!confirmacao) return;

    Store.save(Store.KEYS.ministerios, ministerios.filter((m) => m.id !== id));
    Toast.show("info", "Ministério excluído", `${ministerio.nome} foi removido.`);

    renderMinisterios();
    renderMembros();
    popularSelectsDeMinisterio();
}

/* ============================================================
   MEMBROS (tabela unificada de todos os ministérios)
============================================================ */

function obterTodosMembros() {
    return Store.get(Store.KEYS.ministerios).flatMap((m) =>
        (m.membros || []).map((membro) => ({ ...membro, ministerioId: m.id, ministerioNome: m.nome }))
    );
}

function renderMembros() {
    const filtro = document.getElementById("filtroMinisterio").value;
    const tbody = document.getElementById("tabelaMembros");

    let membros = obterTodosMembros();
    if (filtro) {
        membros = membros.filter((m) => m.ministerioId === filtro);
    }

    if (membros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
            <div class="empty-state__icon"><i class="fa-solid fa-user-group"></i></div>
            <h3>Nenhum membro encontrado</h3>
            <p>Cadastre um novo membro ou ajuste o filtro selecionado.</p>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = membros.map((m) => `
        <tr>
            <td>
                <div class="table-actions">
                    <button class="table-action table-action--primary" title="Editar" onclick="abrirModalMembro('${m.ministerioId}', '${m.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="table-action table-action--danger" title="Excluir" onclick="excluirMembro('${m.ministerioId}', '${m.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
            <td>
                <div class="table-person">
                    <span class="table-person__avatar">${m.nome.charAt(0).toUpperCase()}</span>
                    <div class="table-person__info"><strong>${m.nome}</strong></div>
                </div>
            </td>
            <td>${m.contato || "—"}</td>
            <td>${formatarDataBR(m.dataNascimento)}</td>
            <td>${formatarDataBR(m.dataEntrada)}</td>
            <td><span class="badge badge--secondary">${m.ministerioNome}</span></td>
        </tr>`).join("");
}

function popularSelectsDeMinisterio() {
    const ministerios = Store.get(Store.KEYS.ministerios);
    const opcoes = ministerios.map((m) => `<option value="${m.id}">${m.nome}</option>`).join("");

    document.getElementById("filtroMinisterio").innerHTML = `<option value="">Todos os ministérios</option>${opcoes}`;
    document.getElementById("membroMinisterio").innerHTML = `<option value="" disabled selected>Selecione...</option>${opcoes}`;
}

function abrirModalMembro(ministerioId = null, membroId = null) {
    const form = document.getElementById("formMembro");
    form.reset();
    popularSelectsDeMinisterio();

    membroEditando = membroId ? { ministerioId, membroId } : null;
    document.getElementById("modalMembroTitulo").textContent = membroId ? "Editar Membro" : "Novo Membro";

    if (membroId) {
        const ministerio = Store.get(Store.KEYS.ministerios).find((m) => m.id === ministerioId);
        const membro = ministerio.membros.find((m) => m.id === membroId);

        form.nome.value = membro.nome;
        form.dataNascimento.value = membro.dataNascimento;
        form.dataEntrada.value = membro.dataEntrada;
        form.contato.value = membro.contato;
        form.ministerio.value = ministerioId;
    } else {
        form.dataEntrada.value = new Date().toISOString().slice(0, 10);
        if (ministerioId) form.ministerio.value = ministerioId;
    }

    Modal.open("modalMembro");
}

function salvarMembro(event) {
    event.preventDefault();
    const form = event.target;

    const dados = {
        nome: form.nome.value.trim(),
        dataNascimento: form.dataNascimento.value,
        dataEntrada: form.dataEntrada.value,
        contato: form.contato.value.trim()
    };

    const novoMinisterioId = form.ministerio.value;
    const ministerios = Store.get(Store.KEYS.ministerios);

    if (membroEditando) {
        const ministerioAntigo = ministerios.find((m) => m.id === membroEditando.ministerioId);
        const index = ministerioAntigo.membros.findIndex((m) => m.id === membroEditando.membroId);
        const [membro] = ministerioAntigo.membros.splice(index, 1);

        const ministerioNovo = ministerios.find((m) => m.id === novoMinisterioId);
        ministerioNovo.membros.push({ ...membro, ...dados });

        Toast.show("success", "Membro atualizado", `${dados.nome} foi atualizado.`);
    } else {
        const ministerio = ministerios.find((m) => m.id === novoMinisterioId);
        ministerio.membros.push({ id: Store.novoId(), ...dados });

        Toast.show("success", "Membro cadastrado", `${dados.nome} foi adicionado.`);
    }

    Store.save(Store.KEYS.ministerios, ministerios);
    Modal.close("modalMembro");
    renderMinisterios();
    renderMembros();
}

function excluirMembro(ministerioId, membroId) {
    const ministerios = Store.get(Store.KEYS.ministerios);
    const ministerio = ministerios.find((m) => m.id === ministerioId);
    const membro = ministerio.membros.find((m) => m.id === membroId);

    if (!confirm(`Tem certeza que deseja excluir "${membro.nome}"?`)) return;

    ministerio.membros = ministerio.membros.filter((m) => m.id !== membroId);
    Store.save(Store.KEYS.ministerios, ministerios);

    Toast.show("info", "Membro excluído", `${membro.nome} foi removido.`);
    renderMinisterios();
    renderMembros();
}

/* ============================================================
   UTIL
============================================================ */

function formatarDataBR(dataISO) {
    if (!dataISO) return "—";
    return dataISO.split("-").reverse().join("/");
}