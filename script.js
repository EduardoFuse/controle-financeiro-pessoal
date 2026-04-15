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

let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

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
        alert("Selecione crédito ou débito.");
        return;
    }

    if (pagamento === "cartao" && cartao === "credito") {
        if (!mesInicio.value) {
            alert("Selecione o mês inicial.");
            return;
        }
    }

    let valorMensalParcela = 0;
    let mesFinal = "-";

    if (cartao === "credito") {
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
        parcelas: cartao === "credito" ? qtdParcelas : 0,
        mesInicio: cartao === "credito" ? formatarMes(mesInicio.value) : "-",
        mesFinal: cartao === "credito" ? mesFinal : "-",
        valorMensalParcela: cartao === "credito" ? valorMensalParcela : 0
    };

    gastos.push(gasto);

    // 💾 SALVA NO NAVEGADOR
    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarTela();
    formGasto.reset();

    campoTipoCartao.classList.add("oculto");
    campoParcelas.classList.add("oculto");
    campoMesInicio.classList.add("oculto");
});

function atualizarTela() {
    listaGastos.innerHTML = "";

    if (gastos.length === 0) {
        listaGastos.innerHTML = `<p class="vazio">Nenhum gasto cadastrado.</p>`;
    } else {
        gastos.forEach((gasto) => {
            const div = document.createElement("div");
            div.className = "item-gasto";

            div.innerHTML = `
                <div>
                    <h3>${gasto.descricao}</h3>
                    <p>${gasto.categoria}</p>
                    <p>${gasto.tipoGasto}</p>
                    <p>${gasto.formaPagamento} ${gasto.tipoCartao}</p>
                    ${gasto.tipoCartao === "credito" ? `
                        <p>${gasto.parcelas}x</p>
                        <p>R$ ${gasto.valorMensalParcela.toFixed(2)}/mês</p>
                        <p>${gasto.mesInicio} até ${gasto.mesFinal}</p>
                    ` : ""}
                </div>
                <div>
                    <strong>R$ ${gasto.valor.toFixed(2)}</strong>
                    <br>
                    <button onclick="excluirGasto(${gasto.id})">Excluir</button>
                </div>
            `;

            listaGastos.appendChild(div);
        });
    }

    calcularResumo();
}

function calcularResumo() {
    let total = 0;
    let mensais = 0;
    let parcelasMes = 0;

    gastos.forEach((g) => {
        total += g.valor;

        if (g.tipoGasto === "mensal") {
            mensais += g.valor;
        }

        if (g.tipoCartao === "credito") {
            parcelasMes += g.valorMensalParcela;
        }
    });

    totalGeral.textContent = "R$ " + total.toFixed(2);
    totalMensais.textContent = "R$ " + mensais.toFixed(2);
    totalParcelasMes.textContent = "R$ " + parcelasMes.toFixed(2);
}

function excluirGasto(id) {
    gastos = gastos.filter(g => g.id !== id);

    // 💾 ATUALIZA NO STORAGE
    localStorage.setItem("gastos", JSON.stringify(gastos));

    atualizarTela();
}

function calcularMesFinal(mesInicial, parcelas) {
    const [ano, mes] = mesInicial.split("-").map(Number);
    const data = new Date(ano, mes - 1);

    data.setMonth(data.getMonth() + parcelas - 1);

    return `${data.getMonth() + 1}/${data.getFullYear()}`;
}

function formatarMes(mes) {
    const [ano, m] = mes.split("-");
    return `${m}/${ano}`;
}

// 🔥 CARREGA DADOS AO ABRIR
atualizarTela();