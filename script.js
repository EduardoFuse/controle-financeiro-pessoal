const formGasto = document.getElementById("formGasto");
const tituloFormulario = document.getElementById("tituloFormulario");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

const descricao = document.getElementById("descricao");
const valor = document.getElementById("valor");
const categoria = document.getElementById("categoria");
const tipoGasto = document.getElementById("tipoGasto");
const formaPagamento = document.getElementById("formaPagamento");
const tipoCartao = document.getElementById("tipoCartao");
const parcelas = document.getElementById("parcelas");
const mesInicio = document.getElementById("mesInicio");

const campoTipoCartao = document.getElementById("campoTipoCartao");
const campoParcelas = document.getElementById("campoParcelas");
const campoMesInicio = document.getElementById("campoMesInicio");

const listaGastos = document.getElementById("listaGastos");

const totalGeral = document.getElementById("totalGeral");
const totalMensais = document.getElementById("totalMensais");
const totalParcelasMes = document.getElementById("totalParcelasMes");
const totalDebito = document.getElementById("totalDebito");
const totalCredito = document.getElementById("totalCredito");
const totalOutrosPagamentos = document.getElementById("totalOutrosPagamentos");

const filtroMes = document.getElementById("filtroMes");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroPagamento = document.getElementById("filtroPagamento");
const buscaDescricao = document.getElementById("buscaDescricao");
const mesFatura = document.getElementById("mesFatura");
const valorFaturaMes = document.getElementById("valorFaturaMes");

const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const btnExportar = document.getElementById("btnExportar");
const btnLimparTudo = document.getElementById("btnLimparTudo");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let idEmEdicao = null;
let grafico = null;

formaPagamento.addEventListener("change", controlarCamposCartao);
tipoCartao.addEventListener("change", controlarCamposCredito);

function controlarCamposCartao() {
    if (formaPagamento.value === "cartao") {
        campoTipoCartao.classList.remove("oculto");
    } else {
        campoTipoCartao.classList.add("oculto");
        campoParcelas.classList.add("oculto");
        campoMesInicio.classList.add("oculto");
        tipoCartao.value = "";
        parcelas.value = 1;
        mesInicio.value = "";
    }
}

function controlarCamposCredito() {
    if (tipoCartao.value === "credito") {
        campoParcelas.classList.remove("oculto");
        campoMesInicio.classList.remove("oculto");
    } else {
        campoParcelas.classList.add("oculto");
        campoMesInicio.classList.add("oculto");
        parcelas.value = 1;
        mesInicio.value = "";
    }
}

formGasto.addEventListener("submit", function (e) {
    e.preventDefault();

    const desc = descricao.value.trim();
    const val = parseFloat(valor.value);
    const cat = categoria.value;
    const tipo = tipoGasto.value;
    const pagamento = formaPagamento.value;
    const cartao = tipoCartao.value;
    const qtdParcelas = parseInt(parcelas.value) || 1;

    if (!desc || isNaN(val) || val <= 0 || !cat || !pagamento) {
        alert("Preencha os campos obrigatórios.");
        return;
    }

    if (pagamento === "cartao" && !cartao) {
        alert("Selecione crédito ou débito.");
        return;
    }

    if (pagamento === "cartao" && cartao === "credito") {
        if (!mesInicio.value) {
            alert("Selecione o mês inicial da compra.");
            return;
        }

        if (qtdParcelas < 1) {
            alert("A quantidade de parcelas precisa ser válida.");
            return;
        }
    }

    let valorMensalParcela = 0;
    let mesFinal = "-";

    if (pagamento === "cartao" && cartao === "credito") {
        valorMensalParcela = val / qtdParcelas;
        mesFinal = calcularMesFinal(mesInicio.value, qtdParcelas);
    }

    const gasto = {
        id: idEmEdicao ? idEmEdicao : Date.now(),
        descricao: desc,
        valor: val,
        categoria: cat,
        tipoGasto: tipo,
        formaPagamento: pagamento,
        tipoCartao: pagamento === "cartao" ? cartao : "-",
        parcelas: pagamento === "cartao" && cartao === "credito" ? qtdParcelas : 0,
        mesInicio: pagamento === "cartao" && cartao === "credito" ? mesInicio.value : "",
        mesFinal: pagamento === "cartao" && cartao === "credito" ? mesFinal : "-",
        valorMensalParcela: pagamento === "cartao" && cartao === "credito" ? valorMensalParcela : 0,
        dataCadastro: new Date().toISOString()
    };

    if (idEmEdicao) {
        gastos = gastos.map(item => item.id === idEmEdicao ? gasto : item);
    } else {
        gastos.push(gasto);
    }

    salvarDados();
    resetarFormulario();
    atualizarTela();
});

function salvarDados() {
    localStorage.setItem("gastos", JSON.stringify(gastos));
}

function resetarFormulario() {
    formGasto.reset();
    idEmEdicao = null;
    tituloFormulario.textContent = "Adicionar Gasto";
    btnCancelarEdicao.classList.add("oculto");
    campoTipoCartao.classList.add("oculto");
    campoParcelas.classList.add("oculto");
    campoMesInicio.classList.add("oculto");
    parcelas.value = 1;
}

btnCancelarEdicao.addEventListener("click", resetarFormulario);

function excluirGasto(id) {
    const confirmar = confirm("Deseja excluir este gasto?");
    if (!confirmar) return;

    gastos = gastos.filter(gasto => gasto.id !== id);
    salvarDados();
    atualizarTela();
}

function editarGasto(id) {
    const gasto = gastos.find(item => item.id === id);
    if (!gasto) return;

    idEmEdicao = gasto.id;

    descricao.value = gasto.descricao;
    valor.value = gasto.valor;
    categoria.value = gasto.categoria;
    tipoGasto.value = gasto.tipoGasto;
    formaPagamento.value = gasto.formaPagamento;

    controlarCamposCartao();

    if (gasto.formaPagamento === "cartao") {
        tipoCartao.value = gasto.tipoCartao;
        controlarCamposCredito();

        if (gasto.tipoCartao === "credito") {
            parcelas.value = gasto.parcelas;
            mesInicio.value = gasto.mesInicio;
        }
    }

    tituloFormulario.textContent = "Editar Gasto";
    btnCancelarEdicao.classList.remove("oculto");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function capitalizar(texto) {
    if (!texto || texto === "-") return "-";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarMesVisual(valorMes) {
    if (!valorMes) return "-";

    const [ano, mes] = valorMes.split("-");
    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return `${nomesMeses[parseInt(mes, 10) - 1]}/${ano}`;
}

function calcularMesFinal(mesInicial, qtdParcelas) {
    const [ano, mes] = mesInicial.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);
    data.setMonth(data.getMonth() + (qtdParcelas - 1));

    const anoFinal = data.getFullYear();
    const mesFinal = String(data.getMonth() + 1).padStart(2, "0");

    return `${anoFinal}-${mesFinal}`;
}

function gastoApareceNoMes(gasto, mes) {
    if (!mes) return true;

    if (gasto.tipoGasto === "mensal") return true;

    if (gasto.formaPagamento === "cartao" && gasto.tipoCartao === "credito" && gasto.mesInicio) {
        return mes >= gasto.mesInicio && mes <= gasto.mesFinal;
    }

    const mesCadastro = gasto.dataCadastro ? gasto.dataCadastro.slice(0, 7) : "";
    return mesCadastro === mes;
}

function aplicarFiltros() {
    const mes = filtroMes.value;
    const categoriaSelecionada = filtroCategoria.value;
    const pagamentoSelecionado = filtroPagamento.value;
    const busca = buscaDescricao.value.trim().toLowerCase();

    return gastos.filter(gasto => {
        const passouMes = gastoApareceNoMes(gasto, mes);
        const passouCategoria = !categoriaSelecionada || gasto.categoria === categoriaSelecionada;
        const passouPagamento = !pagamentoSelecionado || gasto.formaPagamento === pagamentoSelecionado;
        const passouBusca = !busca || gasto.descricao.toLowerCase().includes(busca);

        return passouMes && passouCategoria && passouPagamento && passouBusca;
    });
}

function atualizarTela() {
    const gastosFiltrados = aplicarFiltros();

    renderizarLista(gastosFiltrados);
    calcularResumo(gastosFiltrados);
    atualizarFatura();
    atualizarGrafico(gastosFiltrados);
}

function renderizarLista(lista) {
    listaGastos.innerHTML = "";

    if (lista.length === 0) {
        listaGastos.innerHTML = `<p class="vazio">Nenhum gasto encontrado.</p>`;
        return;
    }

    lista
        .slice()
        .reverse()
        .forEach(gasto => {
            const div = document.createElement("div");
            div.className = "item-gasto";

            let detalhes = `
                <p><strong>Categoria:</strong> ${gasto.categoria}</p>
                <p><strong>Tipo:</strong> ${gasto.tipoGasto === "mensal" ? "Mensal" : "Único"}</p>
                <p><strong>Pagamento:</strong> ${capitalizar(gasto.formaPagamento)}</p>
            `;

            if (gasto.formaPagamento === "cartao") {
                detalhes += `<p><strong>Cartão:</strong> ${capitalizar(gasto.tipoCartao)}</p>`;
            }

            if (gasto.tipoCartao === "credito") {
                detalhes += `
                    <p><strong>Parcelas:</strong> ${gasto.parcelas}x</p>
                    <p><strong>Por mês:</strong> ${formatarMoeda(gasto.valorMensalParcela)}</p>
                    <p><strong>Começa:</strong> ${formatarMesVisual(gasto.mesInicio)}</p>
                    <p><strong>Termina:</strong> ${formatarMesVisual(gasto.mesFinal)}</p>
                `;
            }

            div.innerHTML = `
                <div class="item-info">
                    <h3>${gasto.descricao}</h3>
                    ${detalhes}
                </div>

                <div class="item-acoes">
                    <p class="valor">${formatarMoeda(gasto.valor)}</p>
                    <button class="btn-item btn-editar" onclick="editarGasto(${gasto.id})">Editar</button>
                    <button class="btn-item btn-excluir" onclick="excluirGasto(${gasto.id})">Excluir</button>
                </div>
            `;

            listaGastos.appendChild(div);
        });
}

function calcularResumo(lista) {
    let somaTotal = 0;
    let somaMensais = 0;
    let somaParcelasMes = 0;
    let somaDebito = 0;
    let somaCredito = 0;
    let somaOutros = 0;

    lista.forEach(gasto => {
        somaTotal += gasto.valor;

        if (gasto.tipoGasto === "mensal") {
            somaMensais += gasto.valor;
        }

        if (gasto.tipoCartao === "credito") {
            somaParcelasMes += gasto.valorMensalParcela;
            somaCredito += gasto.valor;
        } else if (gasto.tipoCartao === "debito") {
            somaDebito += gasto.valor;
        } else {
            somaOutros += gasto.valor;
        }
    });

    totalGeral.textContent = formatarMoeda(somaTotal);
    totalMensais.textContent = formatarMoeda(somaMensais);
    totalParcelasMes.textContent = formatarMoeda(somaParcelasMes);
    totalDebito.textContent = formatarMoeda(somaDebito);
    totalCredito.textContent = formatarMoeda(somaCredito);
    totalOutrosPagamentos.textContent = formatarMoeda(somaOutros);
}

function atualizarFatura() {
    const mes = mesFatura.value;
    let totalFatura = 0;

    if (mes) {
        gastos.forEach(gasto => {
            if (
                gasto.formaPagamento === "cartao" &&
                gasto.tipoCartao === "credito" &&
                gasto.mesInicio &&
                mes >= gasto.mesInicio &&
                mes <= gasto.mesFinal
            ) {
                totalFatura += gasto.valorMensalParcela;
            }
        });
    }

    valorFaturaMes.textContent = formatarMoeda(totalFatura);
}

function atualizarGrafico(lista) {
    const totaisPorCategoria = {};

    lista.forEach(gasto => {
        if (!totaisPorCategoria[gasto.categoria]) {
            totaisPorCategoria[gasto.categoria] = 0;
        }
        totaisPorCategoria[gasto.categoria] += gasto.valor;
    });

    const labels = Object.keys(totaisPorCategoria);
    const valores = Object.values(totaisPorCategoria);

    if (grafico) {
        grafico.destroy();
    }

    const ctx = document.getElementById("graficoCategorias");

    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Gastos por categoria",
                data: valores,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

[filtroMes, filtroCategoria, filtroPagamento, buscaDescricao, mesFatura].forEach(campo => {
    campo.addEventListener("input", atualizarTela);
    campo.addEventListener("change", atualizarTela);
});

btnLimparFiltros.addEventListener("click", () => {
    filtroMes.value = "";
    filtroCategoria.value = "";
    filtroPagamento.value = "";
    buscaDescricao.value = "";
    mesFatura.value = "";
    atualizarTela();
});

btnExportar.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(gastos, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "gastos.json";
    link.click();
});

btnLimparTudo.addEventListener("click", () => {
    const confirmar = confirm("Tem certeza que deseja apagar todos os dados?");
    if (!confirmar) return;

    gastos = [];
    salvarDados();
    resetarFormulario();
    atualizarTela();
});

atualizarTela();