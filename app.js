const COMPANY_STORAGE_KEY = "extintores-empresas";
const PLACE_STORAGE_KEY = "extintores-locais";
const EXTINTOR_STORAGE_KEY = "extintores-equipamentos";
const HISTORY_STORAGE_KEY = "extintores-historico";
const SELECTED_COMPANY_KEY = "extintores-empresa-selecionada";

const DIAS_ALERTA_CARGA = 60;
const DIAS_ALERTA_INSPECAO = 30;

const CLASSES = ["A", "B", "C", "K"];

const CHECKLIST_EXTINTOR = [
  "Extintor no local indicado e de facil acesso",
  "Pino e lacre de seguranca presentes e integros",
  "Manometro com agulha na faixa verde",
  "Carga de extintor dentro da validade",
  "Equipamento sem amassados, corroido ou com vazamento",
  "Mangueira, tubo ou difusor sem rasgos ou obstrucoes",
  "Rotulo de identificacao legivel",
  "Sinalizacao de incendio visivel e desobstruida",
  "Altura de instalacao entre 0,50 m e 1,00 m do piso",
  "Area ao redor do extintor livre por 1,00 m",
];

const VIEWS = {
  dashboard: { eyebrow: "Visao geral", title: "Painel de controle" },
  extintores: { eyebrow: "Inventario", title: "Extintores" },
  locais: { eyebrow: "Areas de risco", title: "Setores e locais" },
  relatorio: { eyebrow: "Impressao", title: "Relatorio de controle" },
  modelo: { eyebrow: "Impressao", title: "Modelo de cadastro em branco" },
  empresas: { eyebrow: "Cadastros", title: "Empresas atendidas" },
};

const SORT_LABELS = {
  codigo: "Codigo",
  tipo: "Tipo",
  carga: "Carga",
  local: "Local",
  validadeCarga: "Validade da carga",
  proximaInspecao: "Proxima inspecao",
  situacao: "Situacao",
  status: "Status",
};

const SORT_GETTERS = {
  codigo: (item) => item.codigo,
  tipo: (item) => item.tipo,
  carga: (item) => item.carga,
  local: (item) => item.local || "",
  validadeCarga: (item) => item.validadeCarga || "",
  proximaInspecao: (item) => item.proximaInspecao || "",
  situacao: (item) => item.situacao,
  status: (item) => `${getStatus(item).level}:${item.codigo}`,
};

const companySelect = document.querySelector("#companySelect");
const sidebarCompany = document.querySelector("#sidebarCompany");
const todayLabel = document.querySelector("#todayLabel");
const viewEyebrow = document.querySelector("#viewEyebrow");
const viewTitle = document.querySelector("#viewTitle");

const totalExtintores = document.querySelector("#totalExtintores");
const totalEmDia = document.querySelector("#totalEmDia");
const totalAtencao = document.querySelector("#totalAtencao");
const totalVencidos = document.querySelector("#totalVencidos");
const kpiExtintoresFoot = document.querySelector("#kpiExtintoresFoot");

const dashboardPendencias = document.querySelector("#dashboardPendencias");
const dashboardDistribuicao = document.querySelector("#dashboardDistribuicao");
const extintoresSubtitle = document.querySelector("#extintoresSubtitle");
const extintorList = document.querySelector("#extintorList");
const placeList = document.querySelector("#placeList");
const classCoverage = document.querySelector("#classCoverage");
const companyList = document.querySelector("#companyList");
const reportBody = document.querySelector("#reportBody");
const modeloPreview = document.querySelector("#modeloPreview");
const modeloVias = document.querySelector("#modeloVias");
const modeloEmpresa = document.querySelector("#modeloEmpresa");
const modeloChecklist = document.querySelector("#modeloChecklist");
const modeloSetor = document.querySelector("#modeloSetor");
const searchInput = document.querySelector("#searchInput");
const filterSituacao = document.querySelector("#filterSituacao");

const extintorForm = document.querySelector("#extintorForm");
const extintorIdInput = document.querySelector("#extintorId");
const deleteButton = document.querySelector("#deleteButton");

const placeForm = document.querySelector("#placeForm");
const placeIdInput = document.querySelector("#placeId");
const deletePlaceButton = document.querySelector("#deletePlaceButton");

const companyForm = document.querySelector("#companyForm");
const companyIdInput = document.querySelector("#companyId");
const deleteCompanyButton = document.querySelector("#deleteCompanyButton");

const historyForm = document.querySelector("#historyForm");
const historyList = document.querySelector("#historyList");
const detailsCard = document.querySelector("#detailsCard");

let companies = loadList(COMPANY_STORAGE_KEY, []);
let places = loadList(PLACE_STORAGE_KEY, []);
let extintores = loadList(EXTINTOR_STORAGE_KEY, []);
let history = loadList(HISTORY_STORAGE_KEY, []);
let selectedCompanyId = getInitialCompanyId();
let selectedId = null;
let editingPlaceId = null;
let editingCompanyId = null;
let activeView = "dashboard";
let sortKey = "codigo";
let sortDir = 1;

const extintorFields = [
  "codigo",
  "tipo",
  "carga",
  "capacidade",
  "unidade",
  "anoFabricacao",
  "fabricante",
  "serie",
  "dataFabricacao",
  "validadeCarga",
  "proximaInspecao",
  "inspecaoFabrica",
  "sinalizacao",
  "situacao",
  "observacoes",
];

document.querySelector("#historyData").value = todayISO();
todayLabel.textContent = formatLongDate(todayISO());

bindViewNavigation();
bindModalDismissal();
bindForms();
saveAll();
render();

function bindViewNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.go));
  });
}

function bindModalDismissal() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-close]")) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const open = document.querySelector(".modal.open");
      if (open) closeModal(open);
    }
  });
}

function bindForms() {
  companySelect.addEventListener("change", () => {
    selectedCompanyId = companySelect.value;
    selectedId = null;
    resetExtintorForm();
    resetPlaceForm();
    saveList(SELECTED_COMPANY_KEY, selectedCompanyId);
    render();
  });

  document.querySelector("#newExtintorButton").addEventListener("click", () => {
    if (!requireCompany()) return;
    resetExtintorForm();
    openModal("#extintorModal");
  });

  document.querySelector("#newPlaceButton").addEventListener("click", () => {
    if (!requireCompany()) return;
    resetPlaceForm();
    openModal("#placeModal");
  });

  document.querySelector("#newCompanyButton").addEventListener("click", () => {
    resetCompanyForm();
    openModal("#companyModal");
  });

  document.querySelector("#printReportButton").addEventListener("click", () => window.print());

  document.querySelector("#printModeloButton").addEventListener("click", () => {
    document.body.classList.add("print-modelo");
    window.print();
    document.body.classList.remove("print-modelo");
  });

  [modeloVias, modeloEmpresa, modeloChecklist, modeloSetor].forEach((control) => {
    control.addEventListener("change", renderModelo);
  });

  document.querySelector("#printButton").addEventListener("click", () => {
    document.body.classList.add("print-detail");
    window.print();
    document.body.classList.remove("print-detail");
  });

  searchInput.addEventListener("input", () => renderExtintorTable());
  filterSituacao.addEventListener("change", () => renderExtintorTable());

  extintorForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!requireCompany()) return;

    const isNew = !extintorIdInput.value;
    const extintor = getExtintorFormData();
    const existing = extintores.find((item) => item.id === extintor.id);

    if (existing) {
      extintores = extintores.map((item) => (item.id === extintor.id ? extintor : item));
    } else {
      extintores.unshift(extintor);
    }

    saveList(EXTINTOR_STORAGE_KEY, extintores);

    if (isNew) {
      closeModal("#extintorModal");
      resetExtintorForm();
      selectedId = extintor.id;
      showToast(`${extintor.codigo} cadastrado.`);
    } else {
      closeModal("#extintorModal");
      resetExtintorForm();
      selectedId = extintor.id;
      showToast(`${extintor.codigo} atualizado.`);
    }

    render();
  });

  deleteButton.addEventListener("click", () => {
    const extintor = extintores.find((item) => item.id === selectedId);
    if (!extintor) return;

    if (!window.confirm(`Excluir o extintor ${extintor.codigo} e todo o historico dele?`)) return;

    extintores = extintores.filter((item) => item.id !== selectedId);
    history = history.filter((item) => item.extintorId !== selectedId);
    saveList(EXTINTOR_STORAGE_KEY, extintores);
    saveList(HISTORY_STORAGE_KEY, history);
    closeModal("#extintorModal");
    resetExtintorForm();
    selectedId = null;
    render();
    showToast(`${extintor.codigo} excluido.`);
  });

  placeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!requireCompany()) return;

    const data = Object.fromEntries(new FormData(placeForm).entries());
    const existing = places.find((item) => item.id === editingPlaceId);

    const place = {
      id: editingPlaceId || createId("local"),
      empresaId: selectedCompanyId,
      nome: data.placeNome.trim(),
      classe: data.placeClasse,
      andar: data.placeAndar.trim(),
      observacoes: data.placeObservacoes.trim(),
      criadoEm: existing?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    if (existing) {
      places = places.map((item) => (item.id === place.id ? place : item));

      if (existing.nome !== place.nome) {
        extintores = extintores.map((item) =>
          item.empresaId === selectedCompanyId && item.local === existing.nome
            ? { ...item, local: place.nome, atualizadoEm: new Date().toISOString() }
            : item,
        );
        saveList(EXTINTOR_STORAGE_KEY, extintores);
      }
    } else {
      places.unshift(place);
    }

    saveList(PLACE_STORAGE_KEY, places);
    closeModal("#placeModal");
    resetPlaceForm();
    render();
    showToast(existing ? "Local atualizado." : "Local cadastrado.");
  });

  deletePlaceButton.addEventListener("click", () => {
    const place = places.find((item) => item.id === editingPlaceId);
    if (!place) return;

    const used = extintores.filter(
      (item) => item.empresaId === selectedCompanyId && item.local === place.nome,
    );

    const message =
      used.length > 0
        ? `O local ${place.nome} esta em uso por ${used.length} extintor(es). Excluir mesmo assim?`
        : `Excluir o local ${place.nome}?`;

    if (!window.confirm(message)) return;

    places = places.filter((item) => item.id !== editingPlaceId);
    saveList(PLACE_STORAGE_KEY, places);
    closeModal("#placeModal");
    resetPlaceForm();
    render();
    showToast("Local excluido.");
  });

  companyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(companyForm).entries());
    const existing = companies.find((item) => item.id === editingCompanyId);

    const company = {
      id: editingCompanyId || createId("empresa"),
      nome: data.empresaNome.trim(),
      cnpj: data.empresaCnpj.trim(),
      responsavel: data.empresaResponsavel.trim(),
      criadoEm: existing?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    if (existing) {
      companies = companies.map((item) => (item.id === company.id ? company : item));
    } else {
      companies.unshift(company);
    }

    selectedCompanyId = company.id;
    selectedId = null;
    saveList(COMPANY_STORAGE_KEY, companies);
    saveList(SELECTED_COMPANY_KEY, selectedCompanyId);
    closeModal("#companyModal");
    resetCompanyForm();
    render();
    showToast(existing ? "Empresa atualizada." : "Empresa cadastrada.");
  });

  deleteCompanyButton.addEventListener("click", () => {
    const company = companies.find((item) => item.id === editingCompanyId);
    if (!company) return;

    const owned = extintores.filter((item) => item.empresaId === company.id).length;
    const message =
      owned > 0
        ? `A empresa ${company.nome} possui ${owned} extintor(es) cadastrado(s). Excluir tudo?`
        : `Excluir a empresa ${company.nome}?`;

    if (!window.confirm(message)) return;

    companies = companies.filter((item) => item.id !== company.id);
    extintores = extintores.filter((item) => item.empresaId !== company.id);
    places = places.filter((item) => item.empresaId !== company.id);
    history = history.filter((item) => extintores.some((ext) => ext.id === item.extintorId));

    saveAll();
    selectedCompanyId = companies[0]?.id || "";
    selectedId = null;
    closeModal("#companyModal");
    resetCompanyForm();
    render();
    showToast("Empresa excluida.");
  });

  historyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!selectedId) return;

    const data = Object.fromEntries(new FormData(historyForm).entries());

    history.unshift({
      id: createId("registro"),
      extintorId: selectedId,
      tipo: data.historyTipo,
      data: data.historyData,
      executadoPor: data.historyExecutado.trim(),
      resultado: data.historyResultado,
      observacoes: data.historyObservacoes.trim(),
      criadoEm: new Date().toISOString(),
    });

    const updates = {};
    if (data.historyValidade) updates.validadeCarga = data.historyValidade;
    if (data.historyProxima) updates.proximaInspecao = data.historyProxima;

    extintores = extintores.map((item) =>
      item.id === selectedId
        ? { ...item, ...updates, ultimaInspecao: data.historyData, atualizadoEm: new Date().toISOString() }
        : item,
    );

    if (updates.validadeCarga) document.querySelector("#validadeCarga").value = updates.validadeCarga;
    if (updates.proximaInspecao) document.querySelector("#proximaInspecao").value = updates.proximaInspecao;

    historyForm.reset();
    document.querySelector("#historyData").value = todayISO();
    saveList(HISTORY_STORAGE_KEY, history);
    saveList(EXTINTOR_STORAGE_KEY, extintores);
    render();
    renderDetails(selectedId);
    showToast("Movimentacao registrada.");
  });
}

function setView(view) {
  if (!VIEWS[view]) return;

  activeView = view;
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  viewEyebrow.textContent = VIEWS[view].eyebrow;
  viewTitle.textContent = VIEWS[view].title;
}

function openModal(selector) {
  const modal = document.querySelector(selector);
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  const focusable = modal.querySelector("input, select, textarea");
  if (focusable) focusable.focus();
}

function closeModal(selector) {
  const modal = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function showToast(message, type = "ok") {
  document.querySelector(".toast")?.remove();

  const toast = document.createElement("div");
  toast.className = `toast${type === "bad" ? " bad" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => toast.remove(), 2800);
}

function requireCompany() {
  if (selectedCompanyId) return true;
  showToast("Cadastre ou selecione uma empresa primeiro.", "bad");
  setView("empresas");
  document.querySelector("#newCompanyButton").click();
  return false;
}

function loadList(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveAll() {
  saveList(COMPANY_STORAGE_KEY, companies);
  saveList(PLACE_STORAGE_KEY, places);
  saveList(EXTINTOR_STORAGE_KEY, extintores);
  saveList(HISTORY_STORAGE_KEY, history);
  saveList(SELECTED_COMPANY_KEY, selectedCompanyId);
}

function getInitialCompanyId() {
  const savedId = localStorage.getItem(SELECTED_COMPANY_KEY);
  return companies.some((company) => company.id === savedId) ? savedId : companies[0]?.id || "";
}

function createId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getExtintorFormData() {
  const formData = new FormData(extintorForm);
  const data = Object.fromEntries(formData.entries());
  const currentId = extintorIdInput.value;
  const previous = extintores.find((item) => item.id === currentId);

  return {
    id: currentId || createId("extintor"),
    empresaId: selectedCompanyId,
    codigo: data.codigo.trim().toUpperCase(),
    local: data.local,
    tipo: data.tipo,
    carga: data.carga,
    capacidade: data.capacidade.trim(),
    unidade: data.unidade,
    anoFabricacao: data.anoFabricacao,
    fabricante: data.fabricante.trim(),
    serie: data.serie.trim(),
    dataFabricacao: data.dataFabricacao,
    validadeCarga: data.validadeCarga,
    proximaInspecao: data.proximaInspecao,
    classes: formData.getAll("classes").map(String),
    inspecaoFabrica: data.inspecaoFabrica,
    sinalizacao: data.sinalizacao,
    situacao: data.situacao,
    observacoes: data.observacoes.trim(),
    ultimaInspecao: previous?.ultimaInspecao || "",
    criadoEm: previous?.criadoEm || new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
}

function getCompanyExtintores() {
  return extintores.filter((item) => item.empresaId === selectedCompanyId);
}

function getCompanyPlaces() {
  return places.filter((item) => item.empresaId === selectedCompanyId);
}

function getStatus(extintor) {
  if (extintor.situacao === "Baixado") {
    return { level: "neutral", label: "Baixado", reason: "Equipamento baixado" };
  }

  if (extintor.situacao === "Em manutencao" || extintor.situacao === "Manutencao") {
    return { level: "warn", label: "Manutencao", reason: "Em manutencao" };
  }

  const reasons = [];
  let vencido = false;
  let semInformacao = 0;

  if (extintor.validadeCarga) {
    const days = daysUntil(extintor.validadeCarga);
    if (days < 0) {
      reasons.push("carga vencida");
      vencido = true;
    } else if (days <= DIAS_ALERTA_CARGA) {
      reasons.push(`carga vence em ${days} dias`);
    }
  } else {
    reasons.push("validade da carga nao informada");
    semInformacao += 1;
  }

  if (extintor.proximaInspecao) {
    const days = daysUntil(extintor.proximaInspecao);
    if (days < 0) {
      reasons.push("inspecao vencida");
      vencido = true;
    } else if (days <= DIAS_ALERTA_INSPECAO) {
      reasons.push(`inspecao vence em ${days} dias`);
    }
  }

  if (vencido) return { level: "bad", label: "Vencido", reason: reasons.join(", ") };
  if (reasons.length === 0) return { level: "ok", label: "Em dia", reason: "Carga e inspecao em dia" };
  if (semInformacao === reasons.length) return { level: "warn", label: "Incompleto", reason: reasons.join(", ") };
  return { level: "warn", label: "Atencao", reason: reasons.join(", ") };
}

function daysUntil(date) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date(`${todayISO()}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function renderLocalSelect() {
  const select = document.querySelector("#local");
  const current = select.value;
  const companyPlaces = getCompanyPlaces();

  select.innerHTML = "";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = companyPlaces.length > 0 ? "Selecione o local" : "Cadastre um local na aba Setores e locais";
  select.appendChild(empty);

  companyPlaces.forEach((place) => {
    const option = document.createElement("option");
    option.value = place.nome;
    option.textContent = place.nome;
    select.appendChild(option);
  });

  select.value = companyPlaces.some((place) => place.nome === current) ? current : "";
}

function render() {
  renderCompanySelect();
  renderLocalSelect();
  renderTotals();
  renderDashboard();
  renderExtintorTable();
  renderPlacesTable();
  renderClassCoverage();
  renderCompanyTable();
  renderReport();
  renderModelo();

  if (selectedId && getCompanyExtintores().some((item) => item.id === selectedId)) {
    renderDetails(selectedId);
  }
}

function renderCompanySelect() {
  companySelect.innerHTML = "";

  if (companies.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Cadastre uma empresa";
    companySelect.appendChild(option);
    companySelect.disabled = true;
    sidebarCompany.textContent = "Nenhuma empresa cadastrada";
    return;
  }

  companySelect.disabled = false;

  companies.forEach((company) => {
    const option = document.createElement("option");
    option.value = company.id;
    option.textContent = company.nome;
    companySelect.appendChild(option);
  });

  companySelect.value = selectedCompanyId;
  sidebarCompany.textContent = getCompanyName(selectedCompanyId);
}

function renderTotals() {
  const items = getCompanyExtintores();

  totalExtintores.textContent = items.length;
  totalEmDia.textContent = items.filter((item) => getStatus(item).level === "ok").length;
  totalAtencao.textContent = items.filter((item) => getStatus(item).level === "warn").length;
  totalVencidos.textContent = items.filter((item) => getStatus(item).level === "bad").length;
  kpiExtintoresFoot.textContent = `${items.filter((item) => item.situacao === "Em uso").length} em uso`;
}

function renderDashboard() {
  const items = getCompanyExtintores();
  const pending = items
    .filter((item) => ["bad", "warn"].includes(getStatus(item).level))
    .sort(
      (a, b) =>
        statusRank(getStatus(b).level) - statusRank(getStatus(a).level) ||
        String(a.codigo).localeCompare(String(b.codigo), "pt-BR"),
    );

  if (pending.length === 0) {
    dashboardPendencias.innerHTML = `<div class="empty-state">Nenhum item com pendencia ou prazo proximo nesta empresa.</div>`;
  } else {
    dashboardPendencias.innerHTML = pending.slice(0, 8).map((extintor) => {
      const status = getStatus(extintor);
      return `
        <div class="pending-item">
          <div class="pending-main">
            <span class="pending-code">${escapeHtml(extintor.codigo)}</span>
            <span class="pending-meta">${escapeHtml(extintor.tipo)} ${escapeHtml(extintor.capacidade)}${escapeHtml(extintor.unidade)} | ${escapeHtml(extintor.carga)} | ${escapeHtml(extintor.local || "Local nao informado")}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem">
            <span class="badge ${status.level}">${escapeHtml(status.label)}</span>
            <button class="table-link" data-open-extintor="${escapeHtml(extintor.id)}">Abrir</button>
          </div>
        </div>
        <p class="pending-reason">${escapeHtml(status.reason)}</p>
      `;
    }).join("");

    dashboardPendencias.querySelectorAll("[data-open-extintor]").forEach((button) => {
      button.addEventListener("click", () => selectExtintor(button.dataset.openExtintor));
    });
  }

  const byPlace = new Map();
  items.forEach((item) => {
    const key = item.local || "Sem local informado";
    byPlace.set(key, (byPlace.get(key) || 0) + 1);
  });

  const rows = [...byPlace.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
  const max = Math.max(1, ...rows.map((row) => row[1]));

  if (rows.length === 0) {
    dashboardDistribuicao.innerHTML = `<div class="empty-state">Nenhum extintor cadastrado nesta empresa.</div>`;
    return;
  }

  dashboardDistribuicao.innerHTML = rows.map(([name, count]) => {
    const worst = items
      .filter((item) => (item.local || "Sem local informado") === name)
      .reduce((acc, item) => Math.max(acc, statusRank(getStatus(item).level)), 0);

    const tone = worst === 2 ? "bad" : worst === 1 ? "warn" : "";

    return `
      <div class="dist-row">
        <span class="dist-name">${escapeHtml(name)}</span>
        <span class="dist-count">${count}</span>
        <div class="dist-bar"><span class="${tone}" style="width:${Math.round((count / max) * 100)}%"></span></div>
      </div>
    `;
  }).join("");
}

function statusRank(level) {
  if (level === "bad") return 2;
  if (level === "warn") return 1;
  return 0;
}

function getFilteredExtintores() {
  const term = normalize(searchInput.value);
  const situacao = filterSituacao.value;

  return getCompanyExtintores().filter((item) => {
    const content = [item.codigo, item.tipo, item.carga, item.local, item.fabricante, item.serie, item.situacao]
      .map(normalize)
      .join(" ");

    if (term && !content.includes(term)) return false;

    if (situacao === "Alerta") {
      return ["bad", "warn"].includes(getStatus(item).level);
    }

    if (situacao !== "Todos") return item.situacao === situacao;

    return true;
  });
}

function sortExtintores(items) {
  const getter = SORT_GETTERS[sortKey] || SORT_GETTERS.codigo;

  return [...items].sort((a, b) => {
    const left = String(getter(a) || "").toLowerCase();
    const right = String(getter(b) || "").toLowerCase();
    return left.localeCompare(right, "pt-BR") * sortDir;
  });
}

function renderExtintorTable() {
  const all = getCompanyExtintores();
  const filtered = getFilteredExtintores();
  const items = sortExtintores(filtered);

  const company = getCompany(selectedCompanyId);
  extintoresSubtitle.textContent = `${filtered.length} de ${all.length} extintor(es) em ${company?.nome || "empresa nao informada"}.`;

  if (items.length === 0) {
    extintorList.innerHTML = `<div class="empty-state">Nenhum extintor encontrado com os filtros aplicados.</div>`;
    return;
  }

  const caret = (key) => (sortKey === key ? (sortDir === 1 ? "&#9650;" : "&#9660;") : "&#9650;");

  extintorList.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            ${Object.keys(SORT_LABELS)
              .map(
                (key) =>
                  `<th class="sortable${sortKey === key ? " sorted" : ""}" data-sort="${key}">${SORT_LABELS[key]}<span class="sort-caret">${caret(key)}</span></th>`,
              )
              .join("")}
            <th style="text-align:right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((extintor) => {
            const status = getStatus(extintor);
            const classes = (extintor.classes || []).map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join(" ");

            return `
              <tr>
                <td class="cell-primary">
                  <button class="table-link" data-open-extintor="${escapeHtml(extintor.id)}">${escapeHtml(extintor.codigo)}</button>
                </td>
                <td>${escapeHtml(extintor.tipo)}</td>
                <td class="cell-muted">${escapeHtml(extintor.carga)}</td>
                <td class="cell-muted">${escapeHtml(extintor.local || "Nao informado")}</td>
                <td>${classes || '<span class="cell-muted">-</span>'}</td>
                <td>${escapeHtml(formatDate(extintor.validadeCarga))}</td>
                <td>${escapeHtml(formatDate(extintor.proximaInspecao))}</td>
                <td>${escapeHtml(extintor.situacao)}</td>
                <td><span class="badge ${status.level}">${escapeHtml(status.label)}</span></td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-ghost btn-sm" data-open-extintor="${escapeHtml(extintor.id)}">Ficha</button>
                    <button class="btn btn-ghost btn-sm" data-edit-extintor="${escapeHtml(extintor.id)}">Editar</button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  extintorList.querySelectorAll("[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
      const key = header.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir === 1 ? -1 : 1;
      } else {
        sortKey = key;
        sortDir = 1;
      }
      renderExtintorTable();
    });
  });

  extintorList.querySelectorAll("[data-open-extintor]").forEach((button) => {
    button.addEventListener("click", () => selectExtintor(button.dataset.openExtintor));
  });

  extintorList.querySelectorAll("[data-edit-extintor]").forEach((button) => {
    button.addEventListener("click", () => editExtintor(button.dataset.editExtintor));
  });
}

function renderPlacesTable() {
  const companyPlaces = getCompanyPlaces();

  if (companyPlaces.length === 0) {
    placeList.innerHTML = `<div class="empty-state">Nenhum setor cadastrado nesta empresa. Use o botao "Novo local".</div>`;
    return;
  }

  placeList.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Setor ou ambiente</th>
            <th>Classe</th>
            <th>Localizacao</th>
            <th style="text-align:right">Extintores</th>
            <th style="text-align:right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          ${companyPlaces
            .map((place) => {
              const count = getCompanyExtintores().filter((item) => item.local === place.nome).length;

              return `
                <tr>
                  <td class="cell-primary">${escapeHtml(place.nome)}</td>
                  <td><span class="tag">${escapeHtml(place.classe)}</span></td>
                  <td class="cell-muted">${escapeHtml(place.andar || "Nao informado")}</td>
                  <td style="text-align:right">${count}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn btn-ghost btn-sm" data-edit-place="${escapeHtml(place.id)}">Editar</button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  placeList.querySelectorAll("[data-edit-place]").forEach((button) => {
    button.addEventListener("click", () => editPlace(button.dataset.editPlace));
  });
}

function renderClassCoverage() {
  const items = getCompanyExtintores();
  const counts = CLASSES.map((classe) => items.filter((item) => (item.classes || []).includes(classe)).length);
  const total = Math.max(1, ...counts);

  classCoverage.innerHTML = CLASSES.map((classe, index) => {
    const count = counts[index];
    const tone = count === 0 ? "bad" : "";

    return `
      <div class="dist-row">
        <span class="dist-name">Classe ${escapeHtml(classe)}</span>
        <span class="dist-count">${count}</span>
        <div class="dist-bar"><span class="${tone}" style="width:${Math.round((count / total) * 100)}%"></span></div>
      </div>
    `;
  }).join("") + `<p class="panel-sub" style="margin-top:0.75rem">Classe sem nenhum extintor na empresa aparece em vermelho.</p>`;
}

function renderCompanyTable() {
  if (companies.length === 0) {
    companyList.innerHTML = `<div class="empty-state">Nenhuma empresa cadastrada. Use o botao "Nova empresa".</div>`;
    return;
  }

  companyList.innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>CNPJ</th>
            <th>Responsavel tecnico</th>
            <th style="text-align:right">Extintores</th>
            <th style="text-align:right">Pendencias</th>
            <th style="text-align:right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          ${companies
            .map((company) => {
              const owned = extintores.filter((item) => item.empresaId === company.id);
              const pending = owned.filter((item) => getStatus(item).level === "bad").length;
              const active = company.id === selectedCompanyId;

              return `
                <tr>
                  <td class="cell-primary">
                    ${escapeHtml(company.nome)}
                    ${active ? '<span class="tag" style="margin-left:0.4rem">ativa</span>' : ""}
                  </td>
                  <td class="cell-muted">${escapeHtml(company.cnpj || "-")}</td>
                  <td class="cell-muted">${escapeHtml(company.responsavel || "-")}</td>
                  <td style="text-align:right">${owned.length}</td>
                  <td style="text-align:right">${pending > 0 ? `<span class="badge bad">${pending}</span>` : "0"}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn btn-ghost btn-sm" data-select-company="${escapeHtml(company.id)}">Selecionar</button>
                      <button class="btn btn-ghost btn-sm" data-edit-company="${escapeHtml(company.id)}">Editar</button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  companyList.querySelectorAll("[data-select-company]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCompanyId = button.dataset.selectCompany;
      selectedId = null;
      saveList(SELECTED_COMPANY_KEY, selectedCompanyId);
      render();
      showToast(`${getCompanyName(selectedCompanyId)} selecionada.`);
    });
  });

  companyList.querySelectorAll("[data-edit-company]").forEach((button) => {
    button.addEventListener("click", () => editCompany(button.dataset.editCompany));
  });
}

function renderReport() {
  const items = sortExtintores(getFilteredExtintores());
  const company = getCompany(selectedCompanyId);
  const pending = items.filter((item) => getStatus(item).level === "bad");
  const attention = items.filter((item) => getStatus(item).level === "warn");

  reportBody.innerHTML = `
    <div class="report">
      <div class="report-head">
        <div>
          <h2>Relatorio de controle de extintores</h2>
          <p>${escapeHtml(company?.nome || "Empresa nao informada")}${company?.cnpj ? ` | CNPJ ${escapeHtml(company.cnpj)}` : ""}</p>
          ${company?.responsavel ? `<p>Responsavel tecnico: ${escapeHtml(company.responsavel)}</p>` : ""}
        </div>
        <div class="report-meta">
          <strong>${formatLongDate(todayISO())}</strong>
          Emissao do relatorio
        </div>
      </div>

      <div class="report-summary">
        <div><span>Total de extintores</span><strong>${items.length}</strong></div>
        <div><span>Em dia</span><strong>${items.filter((item) => getStatus(item).level === "ok").length}</strong></div>
        <div><span>Em atencao</span><strong>${attention.length}</strong></div>
        <div><span>Com pendencia</span><strong>${pending.length}</strong></div>
      </div>

      ${
        items.length === 0
          ? `<div class="empty-state">Nenhum extintor cadastrado ou nenhum resultado para os filtros aplicados.</div>`
          : `<div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Tipo</th>
                    <th>Carga</th>
                    <th>Capacidade</th>
                    <th>Local</th>
                    <th>Classe</th>
                    <th>Validade</th>
                    <th>Proxima inspecao</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${items
                    .map((extintor) => {
                      const status = getStatus(extintor);
                      return `
                        <tr>
                          <td class="cell-primary">${escapeHtml(extintor.codigo)}</td>
                          <td>${escapeHtml(extintor.tipo)}</td>
                          <td class="cell-muted">${escapeHtml(extintor.carga)}</td>
                          <td>${escapeHtml(extintor.capacidade)}${escapeHtml(extintor.unidade)}</td>
                          <td class="cell-muted">${escapeHtml(extintor.local || "-")}</td>
                          <td>${escapeHtml((extintor.classes || []).join("/") || "-")}</td>
                          <td>${escapeHtml(formatDate(extintor.validadeCarga))}</td>
                          <td>${escapeHtml(formatDate(extintor.proximaInspecao))}</td>
                          <td><span class="badge ${status.level}">${escapeHtml(status.label)}</span></td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>`
      }

      <div class="report-signature">
        <div>Responsavel tecnico</div>
        <div>Responsavel pela empresa</div>
      </div>
    </div>
  `;
}

function renderModelo() {
  const vias = Number(modeloVias.value) || 1;
  const mostrarEmpresa = modeloEmpresa.value === "ativa";
  const comChecklist = modeloChecklist.checked;
  const comSetor = modeloSetor.checked;

  const company = getCompany(selectedCompanyId);
  const empresaNome = mostrarEmpresa ? company?.nome || "Empresa nao informada" : "";
  const empresaCnpj = mostrarEmpresa ? company?.cnpj || "" : "";

  const cabecalho = mostrarEmpresa
    ? `<div class="folha-empresa">
        <strong>${escapeHtml(empresaNome)}</strong>
        ${empresaCnpj ? `CNPJ: ${escapeHtml(empresaCnpj)}` : ""}
        ${company?.responsavel ? `Responsavel: ${escapeHtml(company.responsavel)}` : ""}
      </div>`
    : `<div class="folha-empresa"><strong>Empresa</strong><span class="linha" style="display:block;margin-top:0.35rem;border-bottom:1px solid var(--line-strong);"></span></div>`;

  const viasHtml = Array.from({ length: vias }, (_, index) => renderFolhaModelo({
    numero: index + 1,
    total: vias,
    cabecalho,
    comChecklist,
    comSetor,
  })).join("");

  modeloPreview.innerHTML = viasHtml;
}

function renderFolhaModelo({ numero, total, cabecalho, comChecklist, comSetor }) {
  const campo = (rotulo, curto = false) =>
    `<div class="campo"><span>${escapeHtml(rotulo)}</span><div class="linha${curto ? " curta" : ""}"></div></div>`;

  const blocoIdentificacao = comSetor
    ? `<div class="campo-grid">
        ${campo("Codigo / patrimonio")}
        ${campo("Setor ou ambiente")}
        ${campo("Andar ou bloco")}
        ${campo("Tipo de extintor")}
        ${campo("Capacidade")}
        ${campo("Unidade (kg / L)")}
      </div>`
    : `<div class="campo-grid">
        ${campo("Codigo / patrimonio")}
        ${campo("Andar ou bloco")}
        ${campo("Tipo de extintor")}
        ${campo("Capacidade")}
        ${campo("Unidade (kg / L)")}
        ${campo("Classe predominante do local")}
      </div>`;

  const blocoTecnico = `<div class="campo-grid">
        ${campo("Fabricante")}
        ${campo("Numero de serie")}
        ${campo("Ano de fabricacao")}
        ${campo("Carga / agente extintor")}
        ${campo("Data de fabricacao")}
        ${campo("Validade da carga")}
      </div>`;

  const blocoMantencao = `<div class="campo-grid">
        ${campo("Data da ultima inspecao")}
        ${campo("Proxima inspecao")}
        ${campo("Data da ultima recarga")}
        ${campo("Proxima recarga")}
      </div>`;

  return `
    <article class="folha">
      <header class="folha-topo">
        <div class="folha-titulo">
          <h3>Registro de controle de extintor</h3>
          <p>Preenchimento manual em campo</p>
        </div>
        ${cabecalho}
      </header>

      <div class="folha-meta">
        <div><span>Data</span><i class="linha"></i></div>
        <div><span>Folha</span><i class="linha"></i></div>
        <div><span>Via</span><i class="linha curta"></i></div>
        <div><span>Responsavel pela vistoria</span><i class="linha"></i></div>
      </div>

      <section class="folha-bloco">
        <h4>Identificacao do equipamento</h4>
        ${blocoIdentificacao}
      </section>

      <section class="folha-bloco">
        <h4>Dados tecnicos</h4>
        ${blocoTecnico}
      </section>

      <section class="folha-bloco">
        <h4>Classes de incendio atendidas</h4>
        <div class="caixas">
          <span class="caixa"><i></i>Classe A - Solidos inflamaveis</span>
          <span class="caixa"><i></i>Classe B - Liquidos inflamaveis</span>
          <span class="caixa"><i></i>Classe C - Equipamentos eletricos</span>
          <span class="caixa"><i></i>Classe K - Materiais de cozinha</span>
        </div>
      </section>

      <section class="folha-bloco">
        <h4>Inspecao de fabrica e sinalizacao</h4>
        <div class="caixas">
          <span class="caixa"><i></i>Inspecao de fabrica realizada</span>
          <span class="caixa"><i></i>Sinalizacao presente</span>
          <span class="caixa"><i></i>Extintor em uso</span>
          <span class="caixa"><i></i>Extintor em manutencao</span>
          <span class="caixa"><i></i>Extintor baixado</span>
        </div>
      </section>

      ${
        comChecklist
          ? `<section class="folha-bloco">
              <h4>Verificacoes na inspecao</h4>
              <div class="checklist">
                ${CHECKLIST_EXTINTOR.map((item) => `<span class="caixa"><i></i>${escapeHtml(item)}</span>`).join("")}
              </div>
            </section>`
          : ""
      }

      <section class="folha-bloco">
        <h4>Controle de manutencao</h4>
        ${blocoMantencao}
      </section>

      <section class="folha-bloco">
        <h4>Resultado</h4>
        <div class="caixas">
          <span class="caixa"><i></i>Conforme</span>
          <span class="caixa"><i></i>Reparo necessario</span>
          <span class="caixa"><i></i>Nao aprovado</span>
        </div>
      </section>

      <section class="folha-bloco">
        <h4>Observacoes</h4>
        <div class="area-livre"></div>
      </section>

      <div class="assinaturas">
        <div>Vistoriado por</div>
        <div>Responsavel tecnico</div>
      </div>
    </article>
  `;
}

function selectExtintor(id) {
  const extintor = extintores.find((item) => item.id === id);
  if (!extintor) return;

  selectedId = id;
  renderDetails(id);
  openModal("#detailModal");
}

function editExtintor(id) {
  const extintor = extintores.find((item) => item.id === id);
  if (!extintor) return;

  selectedId = id;
  fillExtintorForm(extintor);
  openModal("#extintorModal");
}

function fillExtintorForm(extintor) {
  extintorIdInput.value = extintor.id;

  extintorFields.forEach((field) => {
    const input = document.querySelector(`#${field}`);
    if (input) input.value = extintor[field] || "";
  });

  document.querySelector("#local").value = extintor.local || "";
  document.querySelectorAll('input[name="classes"]').forEach((checkbox) => {
    checkbox.checked = (extintor.classes || []).includes(checkbox.value);
  });

  deleteButton.classList.remove("hidden");
}

function resetExtintorForm() {
  extintorForm.reset();
  document.querySelectorAll('input[name="classes"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  extintorIdInput.value = "";
  deleteButton.classList.add("hidden");
}

function editPlace(id) {
  const place = places.find((item) => item.id === id);
  if (!place) return;

  editingPlaceId = place.id;
  placeIdInput.value = place.id;
  document.querySelector("#placeNome").value = place.nome;
  document.querySelector("#placeClasse").value = place.classe;
  document.querySelector("#placeAndar").value = place.andar;
  document.querySelector("#placeObservacoes").value = place.observacoes;
  deletePlaceButton.classList.remove("hidden");
  openModal("#placeModal");
}

function resetPlaceForm() {
  editingPlaceId = null;
  placeForm.reset();
  placeIdInput.value = "";
  deletePlaceButton.classList.add("hidden");
}

function editCompany(id) {
  const company = companies.find((item) => item.id === id);
  if (!company) return;

  editingCompanyId = company.id;
  companyIdInput.value = company.id;
  document.querySelector("#empresaNome").value = company.nome;
  document.querySelector("#empresaCnpj").value = company.cnpj;
  document.querySelector("#empresaResponsavel").value = company.responsavel;
  deleteCompanyButton.classList.remove("hidden");
  openModal("#companyModal");
}

function resetCompanyForm() {
  editingCompanyId = null;
  companyForm.reset();
  companyIdInput.value = "";
  deleteCompanyButton.classList.add("hidden");
}

function renderDetails(id) {
  const extintor = extintores.find((item) => item.id === id);
  if (!extintor) return;

  const status = getStatus(extintor);

  const situacaoPill = document.querySelector("#detailSituacao");
  situacaoPill.textContent = extintor.situacao;
  situacaoPill.className = "status-pill";

  if (extintor.situacao === "Em manutencao" || extintor.situacao === "Manutencao") {
    situacaoPill.classList.add("manutencao");
  }
  if (extintor.situacao === "Baixado") situacaoPill.classList.add("baixado");

  setText("detailCodigo", extintor.codigo);
  setText("detailResumo", `${extintor.tipo} | ${extintor.carga} | ${status.reason}`);
  setText("detailEmpresa", getCompanyName(extintor.empresaId));
  setText("detailLocal", extintor.local || "Nao informado");
  setText("detailTipo", extintor.tipo);
  setText("detailCapacidade", extintor.capacidade ? `${extintor.capacidade} ${extintor.unidade}` : "Nao informado");
  setText("detailCarga", extintor.carga);
  setText("detailClasses", (extintor.classes || []).join(", ") || "Nao informado");
  setText("detailFabricante", extintor.fabricante || "Nao informado");
  setText("detailSerie", extintor.serie || "Nao informado");
  setText("detailFabricacao", formatDate(extintor.dataFabricacao));
  setText("detailValidade", formatDate(extintor.validadeCarga));
  setText("detailInspecao", formatDate(extintor.proximaInspecao));
  setText("detailInspecaoFabrica", extintor.inspecaoFabrica);
  setText("detailSinalizacao", extintor.sinalizacao);
  setText("detailUltimaMovimentacao", getLastMovement(extintor));
  setText("detailObservacoes", extintor.observacoes || "Nao informado");

  const badge = document.querySelector("#detailAlertBadge");
  badge.classList.toggle("hidden", status.level !== "bad");
  badge.textContent = "pendencia";

  renderHistory(extintor.id);
}

function getLastMovement(extintor) {
  const records = getExtintorHistory(extintor.id);
  const last = records[0];

  if (!last) {
    return extintor.ultimaInspecao
      ? `Ultima inspecao registrada em ${formatDate(extintor.ultimaInspecao)}.`
      : "Nenhum registro no historico.";
  }

  return `${last.tipo} em ${formatDate(last.data)} - ${last.resultado}${
    last.executadoPor ? ` por ${last.executadoPor}` : ""
  }.`;
}

function getExtintorHistory(id) {
  return history
    .filter((item) => item.extintorId === id)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

function renderHistory(id) {
  const records = getExtintorHistory(id);
  historyList.innerHTML = "";

  if (records.length === 0) {
    historyList.innerHTML = `<div class="empty-state">Sem registros de inspecao, recarga ou manutencao.</div>`;
    return;
  }

  records.forEach((record) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <header>
        <strong>${escapeHtml(record.tipo)} - ${formatDate(record.data)}</strong>
        <button type="button" class="remove-history">remover</button>
      </header>
      <p>${escapeHtml(record.resultado)}${
        record.executadoPor ? ` | ${escapeHtml(record.executadoPor)}` : ""
      }</p>
      ${record.observacoes ? `<p>${escapeHtml(record.observacoes)}</p>` : ""}
    `;

    item.querySelector(".remove-history").addEventListener("click", () => {
      if (!window.confirm(`Remover o registro de ${record.tipo} em ${formatDate(record.data)}?`)) return;

      history = history.filter((entry) => entry.id !== record.id);
      saveList(HISTORY_STORAGE_KEY, history);
      renderDetails(id);
      render();
    });

    historyList.appendChild(item);
  });
}

function getCompany(id) {
  return companies.find((company) => company.id === id);
}

function getCompanyName(id) {
  return getCompany(id)?.nome || "Empresa nao informada";
}

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function formatDate(value) {
  if (!value) return "Nao informado";
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
}

function formatLongDate(value) {
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}