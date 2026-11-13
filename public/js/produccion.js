/* ======================================================================
   LIQUIDACIÓN POR PRODUCCIÓN · NÓMINA RRHH · v2 PRO
   Archivo: /public/js/produccion.js
   ====================================================================== */

/* ======================================================================
   1. ESTADO GLOBAL
   ====================================================================== */

const estadoNomina = {
  colaboradores: [],
  materiales: [],
  colaboradorId: null,
  periodoInicio: null,
  periodoFin: null,
  detalleProduccion: [],
  liquidaciones: [],
  guardando: false,
  confirmando: false,
  liquidacionDetalleActual: null,
};

const CLAVE_STORAGE = "prod_form_v2";
const CLAVE_TEMA = "prod_tema";

/* ======================================================================
   2. REFERENCIAS AL DOM
   ====================================================================== */

// Paso 1
const $selColaborador       = document.getElementById("selColaborador");
const $detalleColaborador   = document.getElementById("detalleColaborador");
const $panelColaborador     = document.getElementById("panelColaborador");
const $infoContrato         = document.getElementById("infoContrato");
const $infoDocumento        = document.getElementById("infoDocumento");
const $infoVinculacion      = document.getElementById("infoVinculacion");
const $searchSelect         = document.getElementById("searchSelectColaborador");
const $btnOpenColaborador   = document.getElementById("btnOpenColaborador");
const $lblColaborador       = document.getElementById("lblColaborador");
const $panelColaboradorSel  = document.getElementById("panelColaboradorSelect");
const $inpBuscarColaborador = document.getElementById("inpBuscarColaborador");
const $listaColaboradores   = document.getElementById("listaColaboradores");
const $emptyColaboradores   = document.getElementById("emptyColaboradores");
const $skeletonColaborador  = document.getElementById("skeletonColaborador");

// Paso 2
const $inpPeriodoInicio = document.getElementById("inpPeriodoInicio");
const $inpPeriodoFin    = document.getElementById("inpPeriodoFin");
const $errPeriodoInicio = document.getElementById("errPeriodoInicio");
const $errPeriodoFin    = document.getElementById("errPeriodoFin");

// Paso 3
const $tblProduccionBody = document.querySelector("#tblProduccion tbody");
const $celdaTotalKilos   = document.getElementById("celdaTotalKilos");
const $btnRecargar       = document.getElementById("btnRecargarProduccion");

// Resumen
const $resumenTotal       = document.getElementById("resumenTotal");
const $resumenKilos       = document.getElementById("resumenKilos");
const $resumenColaborador = document.getElementById("resumenColaborador");
const $resumenMateriales  = document.getElementById("resumenMateriales");
const $resumenPeriodo     = document.getElementById("resumenPeriodo");
const $btnGenerar         = document.getElementById("btnGenerarLiquidacion");
const $btnLimpiar         = document.getElementById("btnLimpiar");
const $chkConfirmo        = document.getElementById("chkConfirmo");

// Stepper / historial / toasts
const $listaHistorial          = document.getElementById("listaHistorial");
const $stepperItems            = document.querySelectorAll(".prod-stepper__item");
const $stepperProgressBar      = document.getElementById("stepperProgressBar");
const $quickPeriodBtns         = document.querySelectorAll("[data-quick]");
const $toastContainer          = document.getElementById("toastContainer");
const $skeletonHistorial       = document.getElementById("skeletonHistorial");
const $btnExportarCSV          = document.getElementById("btnExportarCSV");
const $btnRefreshHistorial     = document.getElementById("btnRefreshHistorial");

// Status de cada card
const $statusPaso1 = document.getElementById("statusPaso1");
const $statusPaso2 = document.getElementById("statusPaso2");
const $statusPaso3 = document.getElementById("statusPaso3");

// Tema
const $btnThemeToggle = document.getElementById("btnThemeToggle");
const $iconTheme      = document.getElementById("iconTheme");

// Modales
const $modalConfirmar         = document.getElementById("modalConfirmar");
const $modalColaborador       = document.getElementById("modalColaborador");
const $modalPeriodo           = document.getElementById("modalPeriodo");
const $modalKilos             = document.getElementById("modalKilos");
const $modalTotal             = document.getElementById("modalTotal");
const $modalDetalle           = document.getElementById("modalDetalle");
const $btnConfirmarGuardar    = document.getElementById("btnConfirmarGuardar");

const $modalDetalleLiq        = document.getElementById("modalDetalle");
const $modalDetalleSubtitle   = document.getElementById("modalDetalleSubtitle");
const $detColaborador         = document.getElementById("detColaborador");
const $detPeriodo             = document.getElementById("detPeriodo");
const $detFecha               = document.getElementById("detFecha");
const $detKilos               = document.getElementById("detKilos");
const $detTotal               = document.getElementById("detTotal");
const $detDetalle             = document.getElementById("detDetalle");
const $btnImprimirDetalle     = document.getElementById("btnImprimirDetalle");

// Modal manual
const $btnAgregarMaterialManual = document.getElementById("btnAgregarMaterialManual");
const $modalAgregarMaterial     = document.getElementById("modalAgregarMaterial");
const $selMaterialManual        = document.getElementById("selMaterialManual");
const $inpKilosManual           = document.getElementById("inpKilosManual");
const $btnConfirmarMaterial     = document.getElementById("btnConfirmarMaterialManual");

/* ======================================================================
   3. UTILIDADES
   ====================================================================== */

const formatearMoneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);

const formatearFecha = (iso) => {
  if (!iso) return "—";
  const soloFecha = String(iso).slice(0, 10);
  const [anio, mes, dia] = soloFecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

const formatearFechaHora = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

const formatearPeriodo = (inicio, fin) => {
  if (!inicio || !fin) return "Sin periodo seleccionado";
  return `${formatearFecha(inicio)} → ${formatearFecha(fin)}`;
};

const redondear = (n) => Math.round((Number(n) || 0) * 100) / 100;

const normalizar = (str) =>
  String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
  if (!$toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `prod-toast prod-toast--${tipo}`;
  toast.setAttribute("role", tipo === "error" ? "alert" : "status");

  const iconos = {
    success: '<i class="fas fa-check"></i>',
    error:   '<i class="fas fa-circle-exclamation"></i>',
    info:    '<i class="fas fa-circle-info"></i>',
    warning: '<i class="fas fa-triangle-exclamation"></i>',
  };

  toast.innerHTML = `
    <span class="prod-toast__icon">${iconos[tipo] || iconos.info}</span>
    <span class="prod-toast__msg">${mensaje}</span>
    <button class="prod-toast__close" type="button" aria-label="Cerrar">×</button>
  `;
  $toastContainer.appendChild(toast);

  const remover = () => {
    toast.classList.add("prod-toast--out");
    setTimeout(() => toast.remove(), 220);
  };
  toast.querySelector(".prod-toast__close").addEventListener("click", remover);
  setTimeout(remover, duracion);
}

async function apiGet(url) {
  const res = await fetch(url, { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.msg || data.error || `Error ${res.status}`);
  return data;
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.msg || data.error || `Error ${res.status}`);
  return data;
}

function guardarBorrador() {
  try {
    const borrador = {
      colaboradorId: estadoNomina.colaboradorId,
      periodoInicio: $inpPeriodoInicio?.value,
      periodoFin: $inpPeriodoFin?.value,
      detalle: estadoNomina.detalleProduccion.map((f) => ({
        materialId: f.materialId,
        kilos: f.kilos,
        tarifaKilo: f.tarifaKilo
      })),
    };
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(borrador));
  } catch {}
}

function cargarBorrador() {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function limpiarBorrador() {
  try { localStorage.removeItem(CLAVE_STORAGE); } catch {}
}

function aplicarTema(tema) {
  document.body.setAttribute("data-theme", tema === "dark" ? "dark" : "light");
  if ($iconTheme) $iconTheme.className = tema === "dark" ? "fas fa-sun" : "fas fa-moon";
  if ($btnThemeToggle) $btnThemeToggle.setAttribute("title", tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
}

function inicializarTema() {
  let guardado = "light";
  try { guardado = localStorage.getItem(CLAVE_TEMA) || "light"; } catch {}
  aplicarTema(guardado);
  if ($btnThemeToggle) {
    $btnThemeToggle.addEventListener("click", () => {
      const actual = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const nuevo = actual === "dark" ? "light" : "dark";
      aplicarTema(nuevo);
      try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch {}
    });
  }
}

/* ======================================================================
   4. INICIALIZACIÓN
   ====================================================================== */

document.addEventListener("DOMContentLoaded", inicializar);

async function inicializar() {
  inicializarTema();
  setPeriodoPorDefecto();
  registrarEventos();
  registrarEventosModales();

  if ($skeletonColaborador) $skeletonColaborador.hidden = false;

  try {
    await Promise.all([cargarColaboradores(), cargarMateriales()]);
  } catch (e) {
    mostrarToast("Error al cargar datos: " + e.message, "error", 5000);
  } finally {
    if ($skeletonColaborador) $skeletonColaborador.hidden = true;
  }

  const borrador = cargarBorrador();
  if (borrador) {
    if (borrador.periodoInicio) $inpPeriodoInicio.value = borrador.periodoInicio;
    if (borrador.periodoFin) $inpPeriodoFin.value = borrador.periodoFin;
    if (borrador.colaboradorId) {
      const c = estadoNomina.colaboradores.find((x) => x.contratoId === borrador.colaboradorId);
      if (c) seleccionarColaborador(c.contratoId, false);
    }
  }

  renderizarTablaProduccion();
  actualizarResumen();
  actualizarStepper();
  actualizarBotonGenerar();
  cargarHistorialDesdeBackend();
}

function registrarEventos() {
  if ($selColaborador) $selColaborador.addEventListener("change", manejarCambioColaborador);

  if ($btnOpenColaborador) $btnOpenColaborador.addEventListener("click", togglePanelColaboradores);
  if ($inpBuscarColaborador) $inpBuscarColaborador.addEventListener("input", renderizarListaColaboradores);
  
  document.addEventListener("click", (e) => {
    if ($searchSelect && !$searchSelect.contains(e.target)) cerrarPanelColaboradores();
  });

  if ($inpPeriodoInicio) $inpPeriodoInicio.addEventListener("change", recargarProduccion);
  if ($inpPeriodoFin) $inpPeriodoFin.addEventListener("change", recargarProduccion);

  if ($btnRecargar) {
    $btnRecargar.addEventListener("click", async () => {
      await recargarProduccion();
      mostrarToast("Producción recargada", "info", 2000);
    });
  }

  if ($btnGenerar) $btnGenerar.addEventListener("click", abrirModalConfirmar);
  if ($btnLimpiar) $btnLimpiar.addEventListener("click", limpiarFormulario);

  $quickPeriodBtns.forEach((btn) => btn.addEventListener("click", () => aplicarAtajoPeriodo(btn.dataset.quick)));
  if ($chkConfirmo) $chkConfirmo.addEventListener("change", actualizarBotonGenerar);

  if ($btnExportarCSV) $btnExportarCSV.addEventListener("click", exportarHistorialCSV);
  if ($btnRefreshHistorial) {
    $btnRefreshHistorial.addEventListener("click", async () => {
      await cargarHistorialDesdeBackend();
      mostrarToast("Historial actualizado", "info", 1800);
    });
  }
}

/* ======================================================================
   5. PERIODO
   ====================================================================== */

function setPeriodoPorDefecto() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  if ($inpPeriodoInicio) $inpPeriodoInicio.value = `${anio}-${mes}-01`;
  if ($inpPeriodoFin) $inpPeriodoFin.value = `${anio}-${mes}-15`;
  estadoNomina.periodoInicio = $inpPeriodoInicio?.value || null;
  estadoNomina.periodoFin    = $inpPeriodoFin?.value || null;
}

function aplicarAtajoPeriodo(tipo) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const mm = String(mes + 1).padStart(2, "0");
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();

  let inicio, fin;
  if (tipo === "q1") {
    inicio = `${anio}-${mm}-01`;
    fin    = `${anio}-${mm}-15`;
  } else if (tipo === "q2") {
    inicio = `${anio}-${mm}-16`;
    fin    = `${anio}-${mm}-${ultimoDia}`;
  } else {
    inicio = `${anio}-${mm}-01`;
    fin    = `${anio}-${mm}-${ultimoDia}`;
  }

  $inpPeriodoInicio.value = inicio;
  $inpPeriodoFin.value    = fin;
  recargarProduccion().then(() => mostrarToast("Periodo aplicado", "success", 1800));
}

function validarPeriodoSilencioso() {
  return (estadoNomina.periodoInicio && estadoNomina.periodoFin && estadoNomina.periodoInicio <= estadoNomina.periodoFin);
}

function validarPeriodoConToast() {
  estadoNomina.periodoInicio = $inpPeriodoInicio?.value;
  estadoNomina.periodoFin    = $inpPeriodoFin?.value;

  limpiarErrorCampo($errPeriodoInicio, $inpPeriodoInicio);
  limpiarErrorCampo($errPeriodoFin, $inpPeriodoFin);

  let ok = true;
  if (!estadoNomina.periodoInicio) { mostrarErrorCampo($errPeriodoInicio, $inpPeriodoInicio, "Requerido"); ok = false; }
  if (!estadoNomina.periodoFin) { mostrarErrorCampo($errPeriodoFin, $inpPeriodoFin, "Requerido"); ok = false; }
  
  if (ok && estadoNomina.periodoInicio > estadoNomina.periodoFin) {
    mostrarErrorCampo($errPeriodoFin, $inpPeriodoFin, "Debe ser >= al inicio");
    mostrarToast("El rango de fechas no es válido.", "error");
    return false;
  }
  if (!ok) { mostrarToast("Completa las fechas del periodo.", "error"); return false; }
  return true;
}

function mostrarErrorCampo($error, $input, msg) {
  if ($error) { $error.textContent = msg; $error.hidden = false; }
  if ($input) $input.classList.add("prod-input--error");
}

function limpiarErrorCampo($error, $input) {
  if ($error) { $error.hidden = true; $error.textContent = ""; }
  if ($input) $input.classList.remove("prod-input--error");
}

/* ======================================================================
   6. CARGA DE DATOS
   ====================================================================== */

async function cargarColaboradores() {
  try {
    const data = await apiGet("/api/nomina/produccion/colaboradores");
    estadoNomina.colaboradores = data.colaboradores || [];

    if ($selColaborador) {
      if (!estadoNomina.colaboradores.length) {
        $selColaborador.innerHTML = '<option value="">No hay colaboradores</option>';
        if ($lblColaborador) $lblColaborador.textContent = "No hay colaboradores independientes";
      } else {
        $selColaborador.innerHTML = '<option value="">-- Selecciona un colaborador --</option>' +
          estadoNomina.colaboradores.map((c) => `<option value="${c.contratoId}">${c.nombre} (${c.documento})</option>`).join("");
        if ($lblColaborador) $lblColaborador.textContent = "Selecciona un colaborador…";
      }
    }
    renderizarListaColaboradores();
  } catch (e) {
    if ($lblColaborador) $lblColaborador.textContent = "Error al cargar colaboradores";
    if ($selColaborador) $selColaborador.innerHTML = '<option value="">Error</option>';
    cerrarPanelColaboradores();
    throw e;
  }
}

async function cargarMateriales() {
  const data = await apiGet("/api/nomina/produccion/materiales");
  estadoNomina.materiales = data.materiales || [];
}

/* ======================================================================
   7. BÚSQUEDA CUSTOM DE COLABORADOR
   ====================================================================== */

function togglePanelColaboradores() {
  const abierto = !$panelColaboradorSel?.hidden;
  if (abierto) cerrarPanelColaboradores(); else abrirPanelColaboradores();
}

function abrirPanelColaboradores() {
  if (!$panelColaboradorSel) return;
  $panelColaboradorSel.hidden = false;
  $btnOpenColaborador?.setAttribute("aria-expanded", "true");
  $searchSelect?.classList.add("prod-search-select--open");
  if ($inpBuscarColaborador) {
    $inpBuscarColaborador.value = "";
    renderizarListaColaboradores();
    setTimeout(() => $inpBuscarColaborador.focus(), 50);
  }
}

function cerrarPanelColaboradores() {
  if (!$panelColaboradorSel) return;
  $panelColaboradorSel.hidden = true;
  $btnOpenColaborador?.setAttribute("aria-expanded", "false");
  $searchSelect?.classList.remove("prod-search-select--open");
}

function renderizarListaColaboradores() {
  if (!$listaColaboradores) return;
  const q = normalizar($inpBuscarColaborador?.value || "");

  const filtrados = estadoNomina.colaboradores.filter((c) => {
    if (!q) return true;
    return normalizar(c.nombre).includes(q) || normalizar(c.documento).includes(q);
  });

  if (!filtrados.length) {
    $listaColaboradores.innerHTML = "";
    if ($emptyColaboradores) $emptyColaboradores.hidden = false;
    return;
  }

  if ($emptyColaboradores) $emptyColaboradores.hidden = true;

  $listaColaboradores.innerHTML = filtrados.map((c) => {
    const activo = c.contratoId === estadoNomina.colaboradorId ? "is-selected" : "";
    return `
      <li role="option" class="prod-search-select__option ${activo}" data-contrato="${c.contratoId}">
        <div class="prod-search-select__option-main">
          <strong>${c.nombre}</strong>
          <span>${c.documento} · ${c.tipoVinculacion || "INDEPENDIENTE"}</span>
        </div>
        ${activo ? '<i class="fas fa-check prod-search-select__check"></i>' : ""}
      </li>`;
  }).join("");

  $listaColaboradores.querySelectorAll(".prod-search-select__option").forEach((li) => {
    li.addEventListener("click", () => seleccionarColaborador(Number(li.dataset.contrato), true));
  });
}

function seleccionarColaborador(contratoId, dispararRecarga = true) {
  estadoNomina.colaboradorId = contratoId || null;
  const c = estadoNomina.colaboradores.find((x) => x.contratoId === estadoNomina.colaboradorId);

  if ($selColaborador) $selColaborador.value = estadoNomina.colaboradorId || "";
  if ($lblColaborador) $lblColaborador.textContent = c ? `${c.nombre} (${c.documento})` : "Selecciona un colaborador…";

  if (c) {
    if ($detalleColaborador) $detalleColaborador.textContent = `Colaborador seleccionado: ${c.nombre}`;
    if ($panelColaborador) $panelColaborador.hidden = false;
    if ($infoContrato) $infoContrato.textContent = `#${c.contratoId}`;
    if ($infoDocumento) $infoDocumento.textContent = c.documento || "—";
    if ($infoVinculacion) $infoVinculacion.textContent = c.tipoVinculacion || "INDEPENDIENTE";
  } else {
    if ($detalleColaborador) $detalleColaborador.textContent = "";
    if ($panelColaborador) $panelColaborador.hidden = true;
  }

  cerrarPanelColaboradores();
  actualizarStepper();
  actualizarBotonGenerar();

  if (dispararRecarga) {
    recargarProduccion();
    guardarBorrador();
  }
}

function manejarCambioColaborador() {
  const id = Number($selColaborador.value) || null;
  seleccionarColaborador(id, true);
}

/* ======================================================================
   8. RECARGA DE PRODUCCIÓN
   ====================================================================== */

async function recargarProduccion() {
  estadoNomina.periodoInicio = $inpPeriodoInicio?.value;
  estadoNomina.periodoFin    = $inpPeriodoFin?.value;

  if (!estadoNomina.colaboradorId || !validarPeriodoSilencioso()) {
    estadoNomina.detalleProduccion = [];
    renderizarTablaProduccion();
    actualizarResumen();
    actualizarStepper();
    actualizarBotonGenerar();
    return;
  }

  try {
    const url = `/api/nomina/produccion/kilos?contratoId=${estadoNomina.colaboradorId}&desde=${estadoNomina.periodoInicio}&hasta=${estadoNomina.periodoFin}`;
    const data = await apiGet(url);
    const kilosPorMaterial = data.kilosPorMaterial || {};

    estadoNomina.detalleProduccion = estadoNomina.materiales.map((mat) => ({
      materialId: mat.materialId,
      nombreMaterial: mat.nombreMaterial,
      tarifaKilo: Number(mat.tarifaKilo) || 0,
      kilos: Number(kilosPorMaterial[mat.materialId]) || 0,
    }));

    renderizarTablaProduccion();
    actualizarResumen();
    actualizarStepper();
    actualizarBotonGenerar();
    guardarBorrador();
  } catch (e) {
    mostrarToast("Error al cargar producción: " + e.message, "error", 4500);
    estadoNomina.detalleProduccion = [];
    renderizarTablaProduccion();
    actualizarResumen();
    actualizarStepper();
    actualizarBotonGenerar();
  }
}

/* ======================================================================
   9. RENDERIZADO · TABLA (Kilos y Precios Editables)
   ====================================================================== */

function renderizarTablaProduccion() {
  if (!$tblProduccionBody) return;
  const detalle = estadoNomina.detalleProduccion;

  if (!detalle.length) {
    $tblProduccionBody.innerHTML = `
      <tr class="prod-table-empty">
        <td colspan="4">
          <div class="prod-empty">
            <i class="fas fa-box-open"></i>
            <p>Selecciona un colaborador y un periodo, o agrega material manualmente.</p>
          </div>
        </td>
      </tr>`;
    if ($celdaTotalKilos) $celdaTotalKilos.textContent = "0 kg";
    return;
  }

  $tblProduccionBody.innerHTML = detalle.map((fila, indice) => {
    const subtotal = redondear(fila.kilos * fila.tarifaKilo);
    return `
      <tr>
        <td>
          <div class="prod-material">
            <span class="prod-material__dot"></span>
            <strong>${fila.nombreMaterial}</strong>
          </div>
        </td>
        <td class="text-end">
          <input type="number" class="prod-kilos-input" min="0" step="0.01" data-indice-kilos="${indice}" value="${fila.kilos}" 
                 style="width: 100px; text-align: right; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px;" />
        </td>
        <td class="text-end">
          <input type="number" class="prod-precio-input" min="0" step="1" data-indice-precio="${indice}" value="${fila.tarifaKilo}" 
                 style="width: 100px; text-align: right; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px;" />
        </td>
        <td class="text-end prod-subtotal" data-subtotal="${indice}">${formatearMoneda(subtotal)}</td>
      </tr>`;
  }).join("");

  // Eventos para KILOS
  $tblProduccionBody.querySelectorAll(".prod-kilos-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.indiceKilos);
      estadoNomina.detalleProduccion[idx].kilos = Math.max(0, parseFloat(e.target.value) || 0);
      recalcularFila(idx);
    });
  });

  // Eventos para PRECIOS
  $tblProduccionBody.querySelectorAll(".prod-precio-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.indicePrecio);
      estadoNomina.detalleProduccion[idx].tarifaKilo = Math.max(0, parseFloat(e.target.value) || 0);
      recalcularFila(idx);
    });
  });

  actualizarTotalesTabla();
}

function recalcularFila(idx) {
  const f = estadoNomina.detalleProduccion[idx];
  const celdaSub = $tblProduccionBody.querySelector(`[data-subtotal="${idx}"]`);
  if (celdaSub) celdaSub.textContent = formatearMoneda(redondear(f.kilos * f.tarifaKilo));
  
  actualizarTotalesTabla();
  actualizarResumen();
  actualizarStepper();
  actualizarBotonGenerar();
  guardarBorrador();
}

function actualizarTotalesTabla() {
  const totalKilos = redondear(estadoNomina.detalleProduccion.reduce((s, f) => s + f.kilos, 0));
  if ($celdaTotalKilos) $celdaTotalKilos.textContent = `${totalKilos} kg`;
}

/* ======================================================================
   10. RENDERIZADO · RESUMEN
   ====================================================================== */

function actualizarResumen() {
  const detalle = estadoNomina.detalleProduccion;
  const totalKilos = redondear(detalle.reduce((s, f) => s + f.kilos, 0));
  const totalPagar = redondear(detalle.reduce((s, f) => s + f.kilos * f.tarifaKilo, 0));
  const materialesLiquidados = detalle.filter((f) => f.kilos > 0).length;

  const c = estadoNomina.colaboradores.find((x) => x.contratoId === estadoNomina.colaboradorId);

  if ($resumenTotal) $resumenTotal.textContent = formatearMoneda(totalPagar);
  if ($resumenKilos) $resumenKilos.textContent = `${totalKilos} kg`;
  if ($resumenMateriales) $resumenMateriales.textContent = materialesLiquidados;
  if ($resumenColaborador) $resumenColaborador.textContent = c ? c.nombre : "—";
  if ($resumenPeriodo) $resumenPeriodo.textContent = formatearPeriodo(estadoNomina.periodoInicio, estadoNomina.periodoFin);
}

/* ======================================================================
   11. RENDERIZADO · STEPPER
   ====================================================================== */

function actualizarStepper() {
  const conColaborador = !!estadoNomina.colaboradorId;
  const conPeriodo     = validarPeriodoSilencioso();
  const conProduccion  = estadoNomina.detalleProduccion.some((f) => f.kilos > 0);

  const activos = [true, conColaborador, conColaborador && conPeriodo, conProduccion];
  let pasoActual = 4;
  
  for (let i = 0; i < activos.length; i++) {
    if (!activos[i]) { pasoActual = i + 1; break; }
  }

  $stepperItems.forEach((item) => {
    const step = Number(item.dataset.step);
    item.classList.toggle("prod-stepper__item--done", step < pasoActual);
    item.classList.toggle("prod-stepper__item--active", step === pasoActual);
  });

  if ($stepperProgressBar) {
    const pct = ((pasoActual - 1) / ($stepperItems.length - 1)) * 100;
    $stepperProgressBar.style.width = `${pct}%`;
  }

  pintarStatus($statusPaso1, conColaborador ? "ok" : "pending");
  pintarStatus($statusPaso2, conPeriodo ? "ok" : "pending");
  pintarStatus($statusPaso3, conProduccion ? "ok" : "pending");
}

function pintarStatus($el, estado) {
  if (!$el) return;
  if (estado === "ok") {
    $el.innerHTML = '<i class="fas fa-circle-check"></i>';
    $el.className = "prod-card__status prod-card__status--ok";
  } else {
    $el.innerHTML = "";
    $el.className = "prod-card__status";
  }
}

/* ======================================================================
   12. BOTÓN GENERAR
   ====================================================================== */

function actualizarBotonGenerar() {
  if (!$btnGenerar) return;
  const tieneColaborador = !!estadoNomina.colaboradorId;
  const tienePeriodo     = validarPeriodoSilencioso();
  const tieneProduccion  = estadoNomina.detalleProduccion.some((f) => f.kilos > 0);
  const confirmado       = $chkConfirmo?.checked;

  const habilitado = tieneColaborador && tienePeriodo && tieneProduccion && confirmado && !estadoNomina.guardando;
  $btnGenerar.disabled = !habilitado;

  if (habilitado) $btnGenerar.classList.add("prod-btn--ready");
  else $btnGenerar.classList.remove("prod-btn--ready");
}

/* ======================================================================
   13. MODAL · CONFIRMAR Y GUARDAR
   ====================================================================== */

function abrirModalConfirmar() {
  if (!estadoNomina.colaboradorId) return mostrarToast("Selecciona un colaborador.", "error");
  if (!validarPeriodoConToast()) return;

  const detalle = estadoNomina.detalleProduccion.filter((f) => f.kilos > 0);
  if (!detalle.length) return mostrarToast("No hay kilos registrados.", "warning");

  const c = estadoNomina.colaboradores.find((x) => x.contratoId === estadoNomina.colaboradorId);
  const totalKilos = redondear(detalle.reduce((s, f) => s + f.kilos, 0));
  const totalPagar = redondear(detalle.reduce((s, f) => s + f.kilos * f.tarifaKilo, 0));

  if ($modalColaborador) $modalColaborador.textContent = c?.nombre || "—";
  if ($modalPeriodo) $modalPeriodo.textContent = formatearPeriodo(estadoNomina.periodoInicio, estadoNomina.periodoFin);
  if ($modalKilos) $modalKilos.textContent = `${totalKilos} kg`;
  if ($modalTotal) $modalTotal.textContent = formatearMoneda(totalPagar);

  if ($modalDetalle) {
    $modalDetalle.innerHTML = `
      <h4 class="prod-summary-detail__title">Detalle por material</h4>
      <table class="prod-summary-detail__table">
        <thead><tr><th>Material</th><th class="text-end">Kilos</th><th class="text-end">Tarifa</th><th class="text-end">Subtotal</th></tr></thead>
        <tbody>
          ${detalle.map((f) => `
            <tr>
              <td>${f.nombreMaterial}</td>
              <td class="text-end">${f.kilos}</td>
              <td class="text-end">${formatearMoneda(f.tarifaKilo)}</td>
              <td class="text-end">${formatearMoneda(f.kilos * f.tarifaKilo)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`;
  }
  abrirModal($modalConfirmar);
}

async function confirmarYGuardar() {
  if (estadoNomina.confirmando) return;
  estadoNomina.confirmando = true;
  
  if ($btnConfirmarGuardar) {
    $btnConfirmarGuardar.disabled = true;
    $btnConfirmarGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando…';
  }

  const detalle = estadoNomina.detalleProduccion.filter((f) => f.kilos > 0);
  const totalKilos = redondear(detalle.reduce((s, f) => s + f.kilos, 0));
  const totalPagar = redondear(detalle.reduce((s, f) => s + f.kilos * f.tarifaKilo, 0));

  const payload = {
    contratoId: estadoNomina.colaboradorId,
    periodoInicio: estadoNomina.periodoInicio,
    periodoFin: estadoNomina.periodoFin,
    totalKilos,
    totalPagar,
    detalle: detalle.map((f) => ({
      materialId: f.materialId,
      material: f.nombreMaterial,
      kilos: f.kilos,
      tarifaKilo: f.tarifaKilo,
      subtotal: redondear(f.kilos * f.tarifaKilo),
    })),
  };

  try {
    const data = await apiPost("/api/nomina/produccion/liquidar", payload);
    cerrarModal($modalConfirmar);
    await cargarHistorialDesdeBackend();
    actualizarStepper();
    limpiarBorrador();
    mostrarToast(`Liquidación guardada · ID #${data.liquidacionId} · ${formatearMoneda(totalPagar)}`, "success", 4500);
  } catch (e) {
    mostrarToast("Error al guardar: " + e.message, "error", 5000);
  } finally {
    estadoNomina.confirmando = false;
    if ($btnConfirmarGuardar) {
      $btnConfirmarGuardar.disabled = false;
      $btnConfirmarGuardar.innerHTML = '<i class="fas fa-check"></i> Sí, guardar liquidación';
    }
  }
}

/* ======================================================================
   14. LÓGICA DE AGREGAR MATERIAL MANUAL
   ====================================================================== */

if ($btnAgregarMaterialManual) {
  $btnAgregarMaterialManual.addEventListener("click", () => {
    if (!estadoNomina.colaboradorId) return mostrarToast("Primero selecciona un colaborador.", "warning");
    
    // Llenar el select con los materiales
    $selMaterialManual.innerHTML = '<option value="">Selecciona un material</option>' +
      estadoNomina.materiales.map(m => `<option value="${m.materialId}">${m.nombreMaterial}</option>`).join("");
    
    $inpKilosManual.value = "";
    abrirModal($modalAgregarMaterial);
  });
}

if ($btnConfirmarMaterial) {
  $btnConfirmarMaterial.addEventListener("click", () => {
    const materialId = Number($selMaterialManual.value);
    const kilos = Number($inpKilosManual.value);

    if (!materialId) return mostrarToast("Selecciona un material", "error");
    if (isNaN(kilos) || kilos <= 0) return mostrarToast("Ingresa una cantidad de kilos válida", "error");

    const indexExistente = estadoNomina.detalleProduccion.findIndex(m => m.materialId === materialId);
    const materialInfo = estadoNomina.materiales.find(m => m.materialId === materialId);

    if (indexExistente !== -1) {
      estadoNomina.detalleProduccion[indexExistente].kilos += kilos;
    } else {
      estadoNomina.detalleProduccion.push({
        materialId: materialInfo.materialId,
        nombreMaterial: materialInfo.nombreMaterial,
        tarifaKilo: Number(materialInfo.tarifaKilo) || 0,
        kilos: kilos
      });
    }

    cerrarModal($modalAgregarMaterial);
    renderizarTablaProduccion();
    actualizarResumen();
    actualizarStepper();
    actualizarBotonGenerar();
    guardarBorrador();
    mostrarToast("Material agregado manualmente", "success", 2500);
  });
}

/* ======================================================================
   15. MODAL · DETALLE (Historial)
   ====================================================================== */

function abrirDetalleLiquidacion(liquidacion) {
  if (!liquidacion) return;
  estadoNomina.liquidacionDetalleActual = liquidacion;

  if ($modalDetalleSubtitle) $modalDetalleSubtitle.textContent = `Liquidación #${liquidacion.liquidacionId}`;
  if ($detColaborador) $detColaborador.textContent = liquidacion.colaborador || "—";
  if ($detPeriodo) $detPeriodo.textContent = formatearPeriodo(liquidacion.periodoInicio, liquidacion.periodoFin);
  if ($detFecha) $detFecha.textContent = formatearFechaHora(liquidacion.fechaGeneracion);
  if ($detKilos) $detKilos.textContent = `${Number(liquidacion.totalKilos) || 0} kg`;
  if ($detTotal) $detTotal.textContent = formatearMoneda(liquidacion.totalPagar);

  if ($detDetalle) {
    if (Array.isArray(liquidacion.detalle) && liquidacion.detalle.length) {
      $detDetalle.innerHTML = `
        <h4 class="prod-summary-detail__title">Detalle por material</h4>
        <table class="prod-summary-detail__table">
          <thead><tr><th>Material</th><th class="text-end">Kilos</th><th class="text-end">Tarifa</th><th class="text-end">Subtotal</th></tr></thead>
          <tbody>
            ${liquidacion.detalle.map((d) => `
              <tr>
                <td>${d.material || d.material_nombre || "—"}</td>
                <td class="text-end">${Number(d.kilos) || 0}</td>
                <td class="text-end">${formatearMoneda(d.tarifaKilo || d.tarifa_kilo)}</td>
                <td class="text-end">${formatearMoneda(d.subtotal)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`;
    } else {
      $detDetalle.innerHTML = '<p class="prod-help">Sin detalle disponible.</p>';
    }
  }
  abrirModal($modalDetalleLiq);
}

/* ======================================================================
   16. HELPERS DE MODALES
   ====================================================================== */

function abrirModal($modal) {
  if (!$modal) return;
  $modal.hidden = false;
  document.body.classList.add("prod-modal-open");
  setTimeout(() => $modal.querySelector("button, input, [tabindex]")?.focus(), 50);
}

function cerrarModal($modal) {
  if (!$modal) return;
  $modal.hidden = true;
  document.body.classList.remove("prod-modal-open");
}

function registrarEventosModales() {
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => {
      const modal = el.closest(".prod-modal");
      if (modal) cerrarModal(modal);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".prod-modal:not([hidden])").forEach((m) => cerrarModal(m));
  });

  if ($btnConfirmarGuardar) $btnConfirmarGuardar.addEventListener("click", confirmarYGuardar);
  if ($btnImprimirDetalle) $btnImprimirDetalle.addEventListener("click", imprimirDetalle);
}

/* ======================================================================
   17. HISTORIAL
   ====================================================================== */

async function cargarHistorialDesdeBackend() {
  if ($skeletonHistorial) $skeletonHistorial.hidden = false;
  try {
    const data = await apiGet("/api/nomina/produccion/liquidaciones");
    estadoNomina.liquidaciones = data.liquidaciones || [];
    renderizarHistorial();
  } catch (e) {
    console.warn("No se pudo cargar historial:", e.message);
  } finally {
    if ($skeletonHistorial) $skeletonHistorial.hidden = true;
  }
}

function renderizarHistorial() {
  if (!$listaHistorial) return;
  const lista = estadoNomina.liquidaciones;

  if (!lista.length) {
    $listaHistorial.innerHTML = `
      <li class="prod-history__empty">
        <i class="fas fa-file-invoice"></i>
        <p>Aún no hay liquidaciones registradas.</p>
      </li>`;
    return;
  }

  $listaHistorial.innerHTML = lista.map((l, idx) => {
    const colaborador = l.colaborador || "—";
    const periodo = formatearPeriodo(l.periodoInicio, l.periodoFin);
    const totalKilos = Number(l.totalKilos) || 0;
    const totalPagar = Number(l.totalPagar) || 0;
    const materialesCount = Array.isArray(l.detalle) ? l.detalle.length : "—";

    return `
      <li class="prod-history__item" data-idx="${idx}" tabindex="0">
        <div class="prod-history__main">
          <div class="prod-history__head">
            <strong>${colaborador}</strong>
            <span class="prod-tag prod-tag--emerald">Liquidado</span>
          </div>
          <span class="prod-history__period">${periodo}</span>
          <span class="prod-history__meta">${totalKilos} kg · ${materialesCount} material(es)</span>
        </div>
        <div class="prod-history__right">
          <div class="prod-history__amount">${formatearMoneda(totalPagar)}</div>
          <button type="button" class="prod-history__btn" data-idx="${idx}" aria-label="Ver detalle"><i class="fas fa-eye"></i></button>
        </div>
      </li>`;
  }).join("");

  $listaHistorial.querySelectorAll(".prod-history__btn, .prod-history__item").forEach((el) => {
    const handler = (e) => {
      e.stopPropagation();
      const idx = Number(el.dataset.idx);
      const liq = estadoNomina.liquidaciones[idx];
      if (liq) abrirDetalleLiquidacion(liq);
    };
    if (el.classList.contains("prod-history__btn")) el.addEventListener("click", handler);
    else {
      el.addEventListener("click", handler);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(e); } });
    }
  });
}

/* ======================================================================
   18. EXPORTAR CSV
   ====================================================================== */

function exportarHistorialCSV() {
  const lista = estadoNomina.liquidaciones;
  if (!lista.length) return mostrarToast("No hay liquidaciones para exportar.", "warning");

  const encabezados = ["ID", "Colaborador", "Periodo inicio", "Periodo fin", "Total kilos", "Total a pagar", "Fecha generación"];
  const filas = lista.map((l) => [
    l.liquidacionId, l.colaborador || "", l.periodoInicio || "", l.periodoFin || "",
    Number(l.totalKilos) || 0, Number(l.totalPagar) || 0, formatearFechaHora(l.fechaGeneracion),
  ]);

  const csv = [encabezados, ...filas].map((row) => row.map((celda) => `"${String(celda ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `liquidaciones_produccion_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  mostrarToast("CSV descargado", "success", 2200);
}

/* ======================================================================
   19. IMPRIMIR DETALLE
   ====================================================================== */

function imprimirDetalle() {
  const l = estadoNomina.liquidacionDetalleActual;
  if (!l) return window.print();

  const detalle = Array.isArray(l.detalle) ? l.detalle : [];
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return mostrarToast("No se pudo abrir la ventana de impresión.", "error");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es"><head><meta charset="UTF-8"><title>Liquidación #${l.liquidacionId}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .muted { color: #64748b; font-size: 12px; }
        .box { margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .row strong { color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th, td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { background: #f8fafc; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; }
        .text-end { text-align: right; }
        .total { font-size: 16px; font-weight: 700; color: #059669; margin-top: 16px; text-align: right; }
      </style>
    </head><body>
      <h1>Liquidación por Producción</h1>
      <p class="muted">Comprobante #${l.liquidacionId} · ${formatearFechaHora(l.fechaGeneracion)}</p>
      <div class="box">
        <div class="row"><span>Colaborador</span><strong>${l.colaborador || "—"}</strong></div>
        <div class="row"><span>Periodo</span><strong>${formatearPeriodo(l.periodoInicio, l.periodoFin)}</strong></div>
        <div class="row"><span>Total kilos</span><strong>${Number(l.totalKilos) || 0} kg</strong></div>
      </div>
      <table><thead><tr><th>Material</th><th class="text-end">Kilos</th><th class="text-end">Tarifa/kg</th><th class="text-end">Subtotal</th></tr></thead>
        <tbody>
          ${detalle.map((d) => `
            <tr>
              <td>${d.material || d.material_nombre || "—"}</td>
              <td class="text-end">${Number(d.kilos) || 0}</td>
              <td class="text-end">${formatearMoneda(d.tarifaKilo || d.tarifa_kilo)}</td>
              <td class="text-end">${formatearMoneda(d.subtotal)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="total">TOTAL: ${formatearMoneda(l.totalPagar)}</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/* ======================================================================
   20. LIMPIAR
   ====================================================================== */

function limpiarFormulario() {
  estadoNomina.colaboradorId = null;
  estadoNomina.detalleProduccion = [];

  if ($selColaborador) $selColaborador.value = "";
  if ($lblColaborador) $lblColaborador.textContent = "Selecciona un colaborador…";
  if ($detalleColaborador) $detalleColaborador.textContent = "";
  if ($panelColaborador) $panelColaborador.hidden = true;
  if ($chkConfirmo) $chkConfirmo.checked = false;

  setPeriodoPorDefecto();
  renderizarTablaProduccion();
  actualizarResumen();
  actualizarStepper();
  actualizarBotonGenerar();
  limpiarBorrador();

  mostrarToast("Formulario limpiado", "info", 2000);
}