const formGasto = document.getElementById("formGasto");
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

let gastos = [];

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

    const desc = descricao.value.trim();
    const val = parseFloat(valor.value);
    const cat = categoria.value;
    const tipo = tipoGasto.value;
    const pagamento = formaPagamento.value;
    const cartao = tipoCartao.value;
    const qtdParcelas = parseInt(parcelas.value);

    if (desc === "" || isNaN(val) || val <= 0 || cat === "" || pagamento === "") {
        alert("Preencha todos os campos obrigatórios.");
        return;
    }

    if (pagamento === "cartao" && cartao === "") {
        alert("Selecione se o cartão é crédito ou débito.");
        return;
    }

    if (pagamento === "cartao" && cartao === "credito") {
        if (!mesInicio.value) {
            alert("Selecione o mês inicial da compra.");
            return;
        }

        if (isNaN(qtdParcelas) || qtdParcelas < 1) {
            alert("Digite uma quantidade de parcelas válida.");
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
        id: Date.now(),
        descricao: desc,
        valor: val,
        categoria: cat,
        tipoGasto: tipo,
        formaPagamento: pagamento,
        tipoCartao: pagamento === "cartao" ? cartao : "-",
        parcelas: pagamento === "cartao" && cartao === "credito" ? qtdParcelas : 0,
        mesInicio: pagamento === "cartao" && cartao === "credito" ? formatarMes(mesInicio.value) : "-",
        mesFinal: pagamento === "cartao" && cartao === "credito" ? mesFinal : "-",
        valorMensalParcela: pagamento === "cartao" && cartao === "credito" ? valorMensalParcela : 0
    };

    gastos.push(gasto);
    atualizarTela();
    formGasto.reset();
    campoTipoCartao.classList.add("oculto");
    campoParcelas.classList.add("oculto");
    campoMesInicio.classList.add("oculto");
});

function atualizarTela() {
    listaGastos.innerHTML = "";

    if (gastos.length === 0) {
        listaGastos.innerHTML = `<p class="vazio">Nenhum gasto cadastrado ainda.</p>`;
    } else {
        gastos.forEach((gasto) => {
            const div = document.createElement("div");
            div.className = "item-gasto";

            let detalhesPagamento = `
                <p><strong>Pagamento:</strong> ${capitalizar(gasto.formaPagamento)}</p>
            `;

            if (gasto.formaPagamento === "cartao") {
                detalhesPagamento += `
                    <p><strong>Cartão:</strong> ${capitalizar(gasto.tipoCartao)}</p>
                `;
            }

            if (gasto.tipoCartao === "credito") {
                detalhesPagamento += `
                    <p><strong>Parcelado em:</strong> ${gasto.parcelas}x</p>
                    <p><strong>Valor por mês:</strong> ${formatarMoeda(gasto.valorMensalParcela)}</p>
                    <p><strong>Início:</strong> ${gasto.mesInicio}</p>
                    <p><strong>Termina em:</strong> ${gasto.mesFinal}</p>
                `;
            }

            if (gasto.tipoGasto === "mensal") {
                detalhesPagamento += `
                    <p><strong>Recorrência:</strong> Gasto mensal fixo</p>
                `;
            }

            div.innerHTML = `
                <div class="item-info">
                    <h3>${gasto.descricao}</h3>
                    <p><strong>Categoria:</strong> ${gasto.categoria}</p>
                    <p><strong>Tipo:</strong> ${gasto.tipoGasto === "mensal" ? "Mensal" : "Único"}</p>
                    ${detalhesPagamento}
                </div>

                <div>
                    <p class="valor">${formatarMoeda(gasto.valor)}</p>
                    <button class="btn-excluir" onclick="excluirGasto(${gasto.id})">Excluir</button>
                </div>
            `;

            listaGastos.appendChild(div);
        });
    }

    calcularResumo();
}

function calcularResumo() {
    let somaTotal = 0;
    let somaMensais = 0;
    let somaParcelasMes = 0;

    gastos.forEach((gasto) => {
        somaTotal += gasto.valor;

        if (gasto.tipoGasto === "mensal") {
            somaMensais += gasto.valor;
        }

        if (gasto.tipoCartao === "credito") {
            somaParcelasMes += gasto.valorMensalParcela;
        }
    });

    totalGeral.textContent = formatarMoeda(somaTotal);
    totalMensais.textContent = formatarMoeda(somaMensais);
    totalParcelasMes.textContent = formatarMoeda(somaParcelasMes);
}

function excluirGasto(id) {
    gastos = gastos.filter((gasto) => gasto.id !== id);
    atualizarTela();
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

function formatarMes(valorMes) {
    if (!valorMes) return "-";

    const [ano, mes] = valorMes.split("-");
    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return `${nomesMeses[parseInt(mes) - 1]}/${ano}`;
}

function calcularMesFinal(mesInicial, qtdParcelas) {
    const [ano, mes] = mesInicial.split("-").map(Number);

    const data = new Date(ano, mes - 1, 1);
    data.setMonth(data.getMonth() + (qtdParcelas - 1));

    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return `${nomesMeses[data.getMonth()]}/${data.getFullYear()}`;
}