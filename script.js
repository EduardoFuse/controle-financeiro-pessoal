"use strict";

const STORAGE_KEY = "meuFinanceiro.lancamentos.v2";
const THEME_KEY = "meuFinanceiro.tema";

const CATEGORIAS = {
  despesa: ["Alimentação", "Moradia", "Transporte", "Saúde", "Educação", "Lazer", "Assinaturas", "Compras", "Contas", "Outros"],
  receita: ["Salário", "Freelance", "Investimentos", "Venda", "Presente", "Reembolso", "Outros"]
};

const FORMAS = {
  despesa: [
    ["pix", "Pix"], ["credito", "Cartão de crédito"], ["debito", "Cartão de débito"],
    ["dinheiro", "Dinheiro"], ["boleto", "Boleto"], ["transferencia", "Transferência"]
  ],
  receita: [["pix", "Pix"], ["transferencia", "Transferência"], ["dinheiro", "Dinheiro"], ["outro", "Outro"]]
};

const CORES = ["#0f766e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899", "#64748b"];

const $ = (seletor) => document.querySelector(seletor);
const elementos = {
  mes: $("#mesReferencia"), saldo: $("#saldoMes"), saldoStatus: $("#saldoStatus"),
  receitas: $("#totalReceitas"), despesas: $("#totalDespesas"), recorrentes: $("#totalRecorrentes"),
  qtdReceitas: $("#qtdReceitas"), qtdDespesas: $("#qtdDespesas"), tabela: $("#tabelaLancamentos"),
  vazio: $("#estadoVazio"), busca: $("#busca"), filtroTipo: $("#filtroTipo"), filtroCategoria: $("#filtroCategoria"),
  modal: $("#modalLancamento"), form: $("#formLancamento"), tituloModal: $("#tituloModal"),
  id: $("#lancamentoId"), tipo: $("#tipoLancamento"), descricao: $("#descricao"), valor: $("#valor"),
  data: $("#data"), categoria: $("#categoria"), forma: $("#forma"), parcelas: $("#parcelas"),
  recorrente: $("#recorrente"), campoParcelas: $("#campoParcelas"), campoRecorrente: $("#campoRecorrente"),
  erro: $("#erroForm"), grafico: $("#graficoCategorias"), legenda: $("#legendaGrafico"),
  centroGrafico: $("#centroGrafico"), totalGrafico: $("#totalGrafico"), percentualUso: $("#percentualUso"),
  barraUso: $("#barraUso"), dica: $("#dicaFinanceira"), toast: $("#toast")
};

let lancamentos = carregarLancamentos();
let toastTimer;

iniciar();

function iniciar() {
  elementos.mes.value = mesAtual();
  aplicarTema(localStorage.getItem(THEME_KEY) || "light");
  preencherFiltroCategorias();
  configurarEventos();
  atualizarCamposPorTipo("despesa");
  renderizar();
}

function configurarEventos() {
  $("#btnNovoLancamento").addEventListener("click", () => abrirModal());
  $("#btnFecharModal").addEventListener("click", fecharModal);
  $("#btnCancelar").addEventListener("click", fecharModal);
  $("#btnTema").addEventListener("click", alternarTema);
  $("#btnLimparFiltros").addEventListener("click", limparFiltros);
  $("#btnExportarCsv").addEventListener("click", exportarCsv);
  $("#btnExportarJson").addEventListener("click", exportarJson);
  $("#inputImportar").addEventListener("change", importarJson);
  elementos.form.addEventListener("submit", salvarLancamento);
  elementos.mes.addEventListener("change", renderizar);
  elementos.busca.addEventListener("input", renderizarTabela);
  elementos.filtroTipo.addEventListener("change", renderizarTabela);
  elementos.filtroCategoria.addEventListener("change", renderizarTabela);
  elementos.forma.addEventListener("change", alternarCampoParcelas);

  document.querySelectorAll(".type-option").forEach((botao) => {
    botao.addEventListener("click", () => atualizarCamposPorTipo(botao.dataset.type));
  });

  elementos.modal.addEventListener("click", (evento) => {
    if (evento.target === elementos.modal) fecharModal();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "n" && !evento.ctrlKey && !evento.metaKey && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) abrirModal();
  });
}

function carregarLancamentos() {
  try {
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(salvos)) return salvos.filter(lancamentoValido);
  } catch (erro) {
    console.warn("Não foi possível ler os dados salvos.", erro);
  }

  const migrados = migrarVersaoAnterior();
  if (migrados.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrados));
  return migrados;
}

function migrarVersaoAnterior() {
  const hoje = dataHoje();
  let gastos = [];
  let recebimentos = [];
  try {
    gastos = JSON.parse(localStorage.getItem("gastos")) || [];
    recebimentos = JSON.parse(localStorage.getItem("recebimentos")) || [];
  } catch (_) { return []; }

  const despesas = gastos.map((item) => ({
    id: gerarId(), tipo: "despesa", descricao: String(item.descricao || "Despesa migrada"),
    valor: Number(item.valor) || 0, categoria: item.categoria || "Outros",
    data: item.mesInicio ? `${item.mesInicio}-01` : hoje,
    forma: item.tipoCartao === "credito" ? "credito" : item.tipoCartao === "debito" ? "debito" : item.formaPagamento || "outro",
    parcelas: Number(item.parcelas) || 1, recorrente: item.tipoGasto === "mensal", criadoEm: Date.now()
  }));

  const receitas = recebimentos.map((item) => ({
    id: gerarId(), tipo: "receita", descricao: String(item.descricao || "Receita migrada"),
    valor: Number(item.valor) || 0, categoria: item.categoria || "Outros", data: hoje,
    forma: item.formaRecebimento || "outro", parcelas: 1, recorrente: false, criadoEm: Date.now()
  }));

  return [...despesas, ...receitas].filter(lancamentoValido);
}

function lancamentoValido(item) {
  return item && ["receita", "despesa"].includes(item.tipo) && typeof item.descricao === "string" && Number(item.valor) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(item.data || "");
}

function persistir() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lancamentos));
}

function abrirModal(item = null) {
  elementos.form.reset();
  elementos.erro.hidden = true;
  elementos.id.value = item?.id || "";
  elementos.tituloModal.textContent = item ? "Editar lançamento" : "Novo lançamento";
  atualizarCamposPorTipo(item?.tipo || "despesa");
  elementos.descricao.value = item?.descricao || "";
  elementos.valor.value = item?.valor || "";
  elementos.data.value = item?.data || dataHoje();
  if (item) {
    elementos.categoria.value = item.categoria;
    elementos.forma.value = item.forma;
    elementos.parcelas.value = item.parcelas || 1;
    elementos.recorrente.checked = Boolean(item.recorrente);
  }
  alternarCampoParcelas();
  elementos.modal.showModal();
  setTimeout(() => elementos.descricao.focus(), 50);
}

function fecharModal() {
  if (elementos.modal.open) elementos.modal.close();
}

function atualizarCamposPorTipo(tipo) {
  elementos.tipo.value = tipo;
  document.querySelectorAll(".type-option").forEach((botao) => botao.classList.toggle("active", botao.dataset.type === tipo));
  preencherSelect(elementos.categoria, CATEGORIAS[tipo].map((nome) => [nome, nome]));
  preencherSelect(elementos.forma, FORMAS[tipo]);
  elementos.campoRecorrente.hidden = tipo !== "despesa";
  if (tipo === "receita") elementos.recorrente.checked = false;
  alternarCampoParcelas();
}

function preencherSelect(select, opcoes) {
  select.replaceChildren(...opcoes.map(([valor, rotulo]) => {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = rotulo;
    return option;
  }));
}

function alternarCampoParcelas() {
  const mostrar = elementos.tipo.value === "despesa" && elementos.forma.value === "credito";
  elementos.campoParcelas.hidden = !mostrar;
  if (!mostrar) elementos.parcelas.value = 1;
}

function salvarLancamento(evento) {
  evento.preventDefault();
  const valor = Number(elementos.valor.value);
  const descricao = elementos.descricao.value.trim();
  const data = elementos.data.value;

  if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) {
    elementos.erro.textContent = "Preencha descrição, valor e data corretamente.";
    elementos.erro.hidden = false;
    return;
  }

  const idExistente = elementos.id.value;
  const anterior = lancamentos.find((item) => item.id === idExistente);
  const item = {
    id: idExistente || gerarId(), tipo: elementos.tipo.value, descricao, valor,
    data, categoria: elementos.categoria.value, forma: elementos.forma.value,
    parcelas: elementos.forma.value === "credito" ? Math.max(1, Number(elementos.parcelas.value) || 1) : 1,
    recorrente: elementos.tipo.value === "despesa" && elementos.recorrente.checked,
    criadoEm: anterior?.criadoEm || Date.now()
  };

  if (idExistente) lancamentos = lancamentos.map((registro) => registro.id === idExistente ? item : registro);
  else lancamentos.push(item);

  persistir();
  fecharModal();
  elementos.mes.value = item.data.slice(0, 7);
  renderizar();
  mostrarToast(idExistente ? "Lançamento atualizado." : "Lançamento adicionado.");
}

function excluirLancamento(id) {
  const item = lancamentos.find((registro) => registro.id === id);
  if (!item || !window.confirm(`Excluir “${item.descricao}”?`)) return;
  lancamentos = lancamentos.filter((registro) => registro.id !== id);
  persistir();
  renderizar();
  mostrarToast("Lançamento excluído.");
}

function renderizar() {
  renderizarResumo();
  renderizarGrafico();
  renderizarTabela();
}

function lancamentosDoMes() {
  const mes = elementos.mes.value;
  return lancamentos.filter((item) => !mes || item.data.startsWith(mes));
}

function renderizarResumo() {
  const itens = lancamentosDoMes();
  const receitas = itens.filter((item) => item.tipo === "receita");
  const despesas = itens.filter((item) => item.tipo === "despesa");
  const totalReceitas = somar(receitas);
  const totalDespesas = somar(despesas);
  const saldo = totalReceitas - totalDespesas;
  const totalRecorrentes = somar(despesas.filter((item) => item.recorrente));
  const uso = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : (totalDespesas > 0 ? 100 : 0);

  elementos.saldo.textContent = moeda(saldo);
  elementos.saldo.closest(".summary-card").classList.toggle("negative", saldo < 0);
  elementos.saldoStatus.textContent = itens.length ? (saldo >= 0 ? "Resultado positivo no período" : "Despesas acima das receitas") : "Nenhum lançamento no período";
  elementos.receitas.textContent = moeda(totalReceitas);
  elementos.despesas.textContent = moeda(totalDespesas);
  elementos.recorrentes.textContent = moeda(totalRecorrentes);
  elementos.qtdReceitas.textContent = plural(receitas.length, "lançamento", "lançamentos");
  elementos.qtdDespesas.textContent = plural(despesas.length, "lançamento", "lançamentos");
  elementos.percentualUso.textContent = `${Math.round(uso)}%`;
  elementos.barraUso.style.width = `${Math.min(uso, 100)}%`;
  elementos.barraUso.style.background = uso > 100 ? "var(--expense)" : uso > 80 ? "var(--warning)" : "var(--income)";
  elementos.dica.textContent = dicaParaUso(uso, totalReceitas, totalDespesas);
}

function dicaParaUso(uso, receitas, despesas) {
  if (!receitas && !despesas) return "Adicione receitas e despesas para receber uma leitura do mês.";
  if (!receitas) return "Há despesas sem uma receita registrada neste mês. Cadastre suas entradas para calcular o saldo real.";
  if (uso > 100) return "As despesas superaram as receitas. Revise os maiores gastos e priorize os essenciais.";
  if (uso > 80) return "Sua margem está apertada. Tente reduzir gastos variáveis antes de assumir novos compromissos.";
  if (uso > 60) return "O mês está equilibrado, mas ainda há espaço para aumentar sua reserva.";
  return "Boa margem no período. Considere separar parte do saldo para uma reserva ou objetivo.";
}

function renderizarGrafico() {
  const despesas = lancamentosDoMes().filter((item) => item.tipo === "despesa");
  const total = somar(despesas);
  const grupos = despesas.reduce((acc, item) => ({ ...acc, [item.categoria]: (acc[item.categoria] || 0) + item.valor }), {});
  const categorias = Object.entries(grupos).sort((a, b) => b[1] - a[1]);
  elementos.grafico.replaceChildren();
  elementos.legenda.replaceChildren();
  elementos.centroGrafico.textContent = moedaCompacta(total);
  elementos.totalGrafico.textContent = categorias.length ? plural(categorias.length, "categoria", "categorias") : "Sem dados";

  const fundo = circuloSvg("var(--surface-2)", 100, 0);
  elementos.grafico.appendChild(fundo);
  if (!total) {
    const vazio = document.createElement("p");
    vazio.className = "chart-empty";
    vazio.textContent = "As categorias aparecerão aqui quando você cadastrar despesas no mês.";
    elementos.legenda.appendChild(vazio);
    return;
  }

  let acumulado = 0;
  categorias.forEach(([categoria, valor], indice) => {
    const percentual = (valor / total) * 100;
    const cor = CORES[indice % CORES.length];
    elementos.grafico.appendChild(circuloSvg(cor, percentual, -acumulado));
    acumulado += percentual;

    const linha = document.createElement("div");
    linha.className = "legend-item";
    const ponto = document.createElement("span");
    ponto.className = "legend-dot";
    ponto.style.background = cor;
    const nome = document.createElement("span");
    nome.textContent = categoria;
    const quantia = document.createElement("span");
    quantia.className = "legend-value";
    quantia.textContent = `${moeda(valor)} · ${Math.round(percentual)}%`;
    linha.append(ponto, nome, quantia);
    elementos.legenda.appendChild(linha);
  });
}

function circuloSvg(cor, percentual, deslocamento) {
  const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circulo.setAttribute("cx", "60");
  circulo.setAttribute("cy", "60");
  circulo.setAttribute("r", "45");
  circulo.setAttribute("pathLength", "100");
  circulo.setAttribute("stroke", cor);
  circulo.setAttribute("stroke-dasharray", `${percentual} ${100 - percentual}`);
  circulo.setAttribute("stroke-dashoffset", String(deslocamento));
  return circulo;
}

function renderizarTabela() {
  const termo = normalizar(elementos.busca.value);
  const tipo = elementos.filtroTipo.value;
  const categoria = elementos.filtroCategoria.value;
  const filtrados = lancamentosDoMes()
    .filter((item) => tipo === "todos" || item.tipo === tipo)
    .filter((item) => categoria === "todas" || item.categoria === categoria)
    .filter((item) => !termo || normalizar(`${item.descricao} ${item.categoria} ${rotuloForma(item.forma)}`).includes(termo))
    .sort((a, b) => b.data.localeCompare(a.data) || (b.criadoEm || 0) - (a.criadoEm || 0));

  elementos.tabela.replaceChildren(...filtrados.map(criarLinha));
  elementos.vazio.hidden = filtrados.length > 0;
}

function criarLinha(item) {
  const tr = document.createElement("tr");
  const tdDescricao = document.createElement("td");
  const principal = document.createElement("div");
  principal.className = "transaction-main";
  const icone = document.createElement("span");
  icone.className = "transaction-icon";
  icone.textContent = item.tipo === "receita" ? "↙" : "↗";
  const textos = document.createElement("div");
  const nome = document.createElement("strong");
  nome.textContent = item.descricao;
  const detalhe = document.createElement("small");
  detalhe.textContent = item.recorrente ? "Mensal" : item.parcelas > 1 ? `${item.parcelas} parcelas` : item.tipo === "receita" ? "Receita" : "Despesa";
  textos.append(nome, detalhe);
  principal.append(icone, textos);
  tdDescricao.appendChild(principal);

  const tdCategoria = document.createElement("td");
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = item.categoria;
  tdCategoria.appendChild(tag);

  const tdData = document.createElement("td");
  tdData.className = "cell-muted";
  tdData.textContent = dataVisual(item.data);
  const tdForma = document.createElement("td");
  tdForma.className = "cell-muted";
  tdForma.textContent = rotuloForma(item.forma);
  const tdValor = document.createElement("td");
  tdValor.className = "amount-cell";
  const quantia = document.createElement("span");
  quantia.className = `amount ${item.tipo === "receita" ? "income" : "expense"}`;
  quantia.textContent = `${item.tipo === "receita" ? "+" : "−"} ${moeda(item.valor)}`;
  tdValor.appendChild(quantia);

  const tdAcoes = document.createElement("td");
  const acoes = document.createElement("div");
  acoes.className = "row-actions";
  const editar = botaoLinha("Editar", "✎", () => abrirModal(item));
  const excluir = botaoLinha("Excluir", "⌫", () => excluirLancamento(item.id));
  acoes.append(editar, excluir);
  tdAcoes.appendChild(acoes);
  tr.append(tdDescricao, tdCategoria, tdData, tdForma, tdValor, tdAcoes);
  return tr;
}

function botaoLinha(rotulo, simbolo, acao) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "row-button";
  botao.title = rotulo;
  botao.setAttribute("aria-label", rotulo);
  botao.textContent = simbolo;
  botao.addEventListener("click", acao);
  return botao;
}

function preencherFiltroCategorias() {
  const todas = [...new Set([...CATEGORIAS.despesa, ...CATEGORIAS.receita])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const opcoes = [["todas", "Todas as categorias"], ...todas.map((nome) => [nome, nome])];
  preencherSelect(elementos.filtroCategoria, opcoes);
}

function limparFiltros() {
  elementos.busca.value = "";
  elementos.filtroTipo.value = "todos";
  elementos.filtroCategoria.value = "todas";
  renderizarTabela();
}

function exportarJson() {
  const conteudo = JSON.stringify({ versao: 2, exportadoEm: new Date().toISOString(), lancamentos }, null, 2);
  baixarArquivo(conteudo, `meu-financeiro-backup-${dataHoje()}.json`, "application/json");
  mostrarToast("Backup criado.");
}

function exportarCsv() {
  const cabecalho = ["tipo", "descricao", "valor", "data", "categoria", "forma", "parcelas", "recorrente"];
  const linhas = lancamentosDoMes().map((item) => cabecalho.map((chave) => csv(item[chave])).join(";"));
  baixarArquivo(`\ufeff${cabecalho.join(";")}\n${linhas.join("\n")}`, `lancamentos-${elementos.mes.value || "todos"}.csv`, "text/csv;charset=utf-8");
  mostrarToast("Planilha CSV exportada.");
}

async function importarJson(evento) {
  const arquivo = evento.target.files?.[0];
  evento.target.value = "";
  if (!arquivo) return;
  try {
    const dados = JSON.parse(await arquivo.text());
    const importados = Array.isArray(dados) ? dados : dados.lancamentos;
    if (!Array.isArray(importados) || !importados.every(lancamentoValido)) throw new Error("Formato inválido");
    if (!window.confirm(`Restaurar ${importados.length} lançamentos? Os dados atuais serão substituídos.`)) return;
    lancamentos = importados.map((item) => ({ ...item, id: String(item.id || gerarId()) }));
    persistir();
    renderizar();
    mostrarToast("Backup restaurado com sucesso.");
  } catch (_) {
    window.alert("Não foi possível importar: selecione um backup JSON válido do Meu Financeiro.");
  }
}

function baixarArquivo(conteudo, nome, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function alternarTema() {
  aplicarTema(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  localStorage.setItem(THEME_KEY, tema);
  $("#btnTema").textContent = tema === "dark" ? "☀" : "◐";
  $("meta[name='theme-color']").content = tema === "dark" ? "#14211f" : "#0f766e";
}

function mostrarToast(mensagem) {
  clearTimeout(toastTimer);
  elementos.toast.textContent = mensagem;
  elementos.toast.classList.add("show");
  toastTimer = setTimeout(() => elementos.toast.classList.remove("show"), 2600);
}

function gerarId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function dataHoje() { const agora = new Date(); agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset()); return agora.toISOString().slice(0, 10); }
function mesAtual() { return dataHoje().slice(0, 7); }
function somar(itens) { return itens.reduce((total, item) => total + Number(item.valor || 0), 0); }
function moeda(valor) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0); }
function moedaCompacta(valor) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(valor || 0); }
function dataVisual(data) { return new Intl.DateTimeFormat("pt-BR").format(new Date(`${data}T12:00:00`)); }
function normalizar(texto) { return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function plural(numero, singular, pluralTexto) { return `${numero} ${numero === 1 ? singular : pluralTexto}`; }
function csv(valor) { const texto = String(valor ?? ""); return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto; }
function rotuloForma(valor) { return [...FORMAS.despesa, ...FORMAS.receita].find(([id]) => id === valor)?.[1] || "Outro"; }
