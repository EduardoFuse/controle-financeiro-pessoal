const telaInicial = document.getElementById("telaInicial");
const app = document.getElementById("app");
const moduloGastos = document.getElementById("moduloGastos");
const moduloRecebimentos = document.getElementById("moduloRecebimentos");

const formGasto = document.getElementById("formGasto");
const descricaoGasto = document.getElementById("descricaoGasto");
const valorGasto = document.getElementById("valorGasto");
const categoriaGasto = document.getElementById("categoriaGasto");
const tipoGasto = document.getElementById("tipoGasto");
const formaPagamento = document.getElementById("formaPagamento");
const tipoCartao = document.getElementById("tipoCartao");
const parcelas = document.getElementById("parcelas");
const mesInicio = document.getElementById("mesInicio");

const campoTipoCartao = document.getElementById("campoTipoCartao");
const campoParcelas = document.getElementById("campoParcelas");
const campoMesInicio = document.getElementById("campoMesInicio");

const listaGastos = document.getElementById("listaGastos");
const totalGastos = document.getElementById("totalGastos");
const totalMensais = document.getElementById("totalMensais");
const totalParcelasMes = document.getElementById("totalParcelasMes");
const totalDebito = document.getElementById("totalDebito");
const totalCredito = document.getElementById("totalCredito");
const totalOutrosPagamentos = document.getElementById("totalOutrosPagamentos");

const formRecebimento = document.getElementById("formRecebimento");
const descricaoRecebimento = document.getElementById("descricaoRecebimento");
const valorRecebimento = document.getElementById("valorRecebimento");
const categoriaRecebimento = document.getElementById("categoriaRecebimento");
const formaRecebimento = document.getElementById("formaRecebimento");

const listaRecebimentos = document.getElementById("listaRecebimentos");
const totalRecebido = document.getElementById("totalRecebido");
const totalPixRecebido = document.getElementById("totalPixRecebido");
const totalDinheiroRecebido = document.getElementById("totalDinheiroRecebido");

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let recebimentos = JSON.parse(localStorage.getItem("recebimentos")) || [];

function abrirModulo(modulo) {
    telaInicial.classList.add("oculto");
    app.classList.remove("oculto");
    trocarModulo(modulo);
}

function voltarInicio() {
    app.classList.add("oculto");
    telaInicial.classList.remove("oculto");
}

function trocarModulo(modulo) {
    if (modulo === "gastos") {
        moduloGastos.classList.remove("oculto");
        moduloRecebimentos.classList.add("oculto");
    } else {
        moduloRecebimentos.classList.remove("oculto");
        moduloGastos.classList.add("oculto");
    }
}

formaPagamento.addEventListener("change", () => {
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
});

tipoCartao.addEventListener("change", () => {
    if (tipoCartao.value === "credito") {
        campoParcelas.classList.remove("oculto");
        campoMesInicio.classList.remove("oculto");
    } else {
        campoParcelas.classList.add("oculto");
        campoMesInicio.classList.add("oculto");
        parcelas.value = 1;
        mesInicio.value = "";
    }
});

formGasto.addEventListener("submit", function (e) {
    e.preventDefault();

    const desc = descricaoGasto.value.trim();
    const val = parseFloat(valorGasto.value);
    const cat = categoriaGasto.value;
    const tipo = tipoGasto.value;
    const pagamento = formaPagamento.value;
    const cartao = tipoCartao.value;
    const qtdParcelas = parseInt(parcelas.value, 10) || 1;

    if (!desc || isNaN(val) || val <= 0 || !cat || !pagamento) {
        alert("Preencha todos os campos do gasto.");
        return;
    }

    if (pagamento === "cartao" && !cartao) {
        alert("Selecione crédito ou débito.");
        return;
    }

    if (pagamento === "cartao" && cartao === "credito" && !mesInicio.value) {
        alert("Selecione o mês inicial da compra.");
        return;
    }

    let valorMensalParcela = 0;
    let mesFinal = "-";

    if (pagamento === "cartao" && cartao === "credito") {
        valorMensalParcela = val / qtdParcelas;
        mesFinal = calcularMesFinal(mesInicio.value, qtdParcelas);
    }

    const gasto = {
        id: Date.now(),
        descricao: desc,
        valor: val,
        categoria: cat,
        tipoGasto: tipo,
        formaPagamento: pagamento,
        tipoCartao: pagamento === "cartao" ? cartao : "-",
        parcelas: pagamento === "cartao" && cartao === "credito" ? qtdParcelas : 0,
        mesInicio: pagamento === "cartao" && cartao === "credito" ? mesInicio.value : "",
        mesFinal: pagamento === "cartao" && cartao === "credito" ? mesFinal : "-",
        valorMensalParcela: pagamento === "cartao" && cartao === "credito" ? valorMensalParcela : 0
    };

    gastos.push(gasto);
    localStorage.setItem("gastos", JSON.stringify(gastos));
    formGasto.reset();
    campoTipoCartao.classList.add("oculto");
    campoParcelas.classList.add("oculto");
    campoMesInicio.classList.add("oculto");
    atualizarGastos();
});

formRecebimento.addEventListener("submit", function (e) {
    e.preventDefault();

    const desc = descricaoRecebimento.value.trim();
    const val = parseFloat(valorRecebimento.value);
    const cat = categoriaRecebimento.value;
    const forma = formaRecebimento.value;

    if (!desc || isNaN(val) || val <= 0 || !cat || !forma) {
        alert("Preencha todos os campos do recebimento.");
        return;
    }

    const recebimento = {
        id: Date.now(),
        descricao: desc,
        valor: val,
        categoria: cat,
        formaRecebimento: forma
    };

    recebimentos.push(recebimento);
    localStorage.setItem("recebimentos", JSON.stringify(recebimentos));
    formRecebimento.reset();
    atualizarRecebimentos();
});

function atualizarGastos() {
    listaGastos.innerHTML = "";

    if (gastos.length === 0) {
        listaGastos.innerHTML = `<p class="vazio">Nenhum gasto cadastrado ainda.</p>`;
    } else {
        gastos.slice().reverse().forEach((gasto) => {
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

            const div = document.createElement("div");
            div.className = "item-gasto";
            div.innerHTML = `
                <div class="item-info">
                    <h3>${gasto.descricao}</h3>
                    ${detalhes}
                </div>
                <div class="item-acoes">
                    <p class="valor">${formatarMoeda(gasto.valor)}</p>
                    <button class="btn-item btn-excluir" onclick="excluirGasto(${gasto.id})">Excluir</button>
                </div>
            `;
            listaGastos.appendChild(div);
        });
    }

    calcularResumoGastos();
}

function atualizarRecebimentos() {
    listaRecebimentos.innerHTML = "";

    if (recebimentos.length === 0) {
        listaRecebimentos.innerHTML = `<p class="vazio">Nenhum recebimento cadastrado ainda.</p>`;
    } else {
        recebimentos.slice().reverse().forEach((recebimento) => {
            const div = document.createElement("div");
            div.className = "item-gasto";
            div.innerHTML = `
                <div class="item-info">
                    <h3>${recebimento.descricao}</h3>
                    <p><strong>Categoria:</strong> ${recebimento.categoria}</p>
                    <p><strong>Forma:</strong> ${capitalizar(recebimento.formaRecebimento)}</p>
                </div>
                <div class="item-acoes">
                    <p class="valor">${formatarMoeda(recebimento.valor)}</p>
                    <button class="btn-item btn-excluir" onclick="excluirRecebimento(${recebimento.id})">Excluir</button>
                </div>
            `;
            listaRecebimentos.appendChild(div);
        });
    }

    calcularResumoRecebimentos();
}

function calcularResumoGastos() {
    let somaTotal = 0;
    let somaMensais = 0;
    let somaParcelas = 0;
    let somaDebito = 0;
    let somaCredito = 0;
    let somaOutros = 0;

    gastos.forEach((gasto) => {
        somaTotal += gasto.valor;

        if (gasto.tipoGasto === "mensal") {
            somaMensais += gasto.valor;
        }

        if (gasto.tipoCartao === "credito") {
            somaParcelas += gasto.valorMensalParcela;
            somaCredito += gasto.valor;
        } else if (gasto.tipoCartao === "debito") {
            somaDebito += gasto.valor;
        } else {
            somaOutros += gasto.valor;
        }
    });

    totalGastos.textContent = formatarMoeda(somaTotal);
    totalMensais.textContent = formatarMoeda(somaMensais);
    totalParcelasMes.textContent = formatarMoeda(somaParcelas);
    totalDebito.textContent = formatarMoeda(somaDebito);
    totalCredito.textContent = formatarMoeda(somaCredito);
    totalOutrosPagamentos.textContent = formatarMoeda(somaOutros);
}

function calcularResumoRecebimentos() {
    let somaTotal = 0;
    let somaPix = 0;
    let somaDinheiro = 0;

    recebimentos.forEach((recebimento) => {
        somaTotal += recebimento.valor;

        if (recebimento.formaRecebimento === "pix") {
            somaPix += recebimento.valor;
        } else if (recebimento.formaRecebimento === "dinheiro") {
            somaDinheiro += recebimento.valor;
        }
    });

    totalRecebido.textContent = formatarMoeda(somaTotal);
    totalPixRecebido.textContent = formatarMoeda(somaPix);
    totalDinheiroRecebido.textContent = formatarMoeda(somaDinheiro);
}

function excluirGasto(id) {
    gastos = gastos.filter((gasto) => gasto.id !== id);
    localStorage.setItem("gastos", JSON.stringify(gastos));
    atualizarGastos();
}

function excluirRecebimento(id) {
    recebimentos = recebimentos.filter((recebimento) => recebimento.id !== id);
    localStorage.setItem("recebimentos", JSON.stringify(recebimentos));
    atualizarRecebimentos();
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
    if (!valorMes || valorMes === "-") return "-";

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

atualizarGastos();
atualizarRecebimentos();