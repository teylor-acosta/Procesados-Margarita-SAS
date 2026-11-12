"use strict";

/* =====================================================
   PROCESADOS MARGARITA S.A.S.
   Lógica de Tienda — Dinámica y Optimizada
===================================================== */

/* =====================================================
   0. CATÁLOGO (Fuente de verdad)
===================================================== */
const CATALOGO = [
    // PRODUCTOS (con precio)
    { id: 1, tipo: "producto", nombre: "Gancho Negro",
      descripcion: "Gancho negro resistente para exhibición y organización.",
      imagen: "img/productos_ejemplos/operarios_1.png",
      precio: 300, precioMayor: 40000, cantidadMayor: 200,
      notaMayor: "Lleva 200 uds o más y paga $ 40.000 por lote." },

    { id: 2, tipo: "producto", nombre: "Gancho de Color",
      descripcion: "Gancho de color disponible en varias tonalidades.",
      imagen: "img/productos_ejemplos/camion_1.png",
      precio: 390, precioMayor: 76000, cantidadMayor: 200,
      notaMayor: "Lleva 200 uds o más y paga $ 76.000 por lote." },

    { id: 3, tipo: "producto", nombre: "Comedero de Perro",
      descripcion: "Comedero práctico y resistente para mascotas.",
      imagen: "img/productos_ejemplos/bodega_1.png",
      precio: 3500, precioMayor: 250000, cantidadMayor: 100,
      notaMayor: "Lleva 100 uds o más y paga $ 250.000 por lote." },

    { id: 4, tipo: "producto", nombre: "Fichas de Parqués 4 Jugadores",
      descripcion: "Set de fichas para parqués de 4 jugadores.",
      imagen: "img/productos_ejemplos/planta_1.png",
      precio: 1200, precioMayor: 25500, cantidadMayor: 30,
      notaMayor: "Lleva 30 uds o más y paga $ 25.500 por lote." },

    { id: 5, tipo: "producto", nombre: "Fichas de Parqués 6 Jugadores",
      descripcion: "Set de fichas para parqués de 6 jugadores.",
      imagen: "img/productos_ejemplos/operarios_1.png",
      precio: 1400, precioMayor: 28500, cantidadMayor: 30,
      notaMayor: "Lleva 30 uds o más y paga $ 28.500 por lote." },

    { id: 6, tipo: "producto", nombre: "Producto Ejemplo 6",
      descripcion: "Espacio reservado para un producto real.",
      imagen: "img/productos_ejemplos/camion_1.png",
      precio: 6800, precioMayor: 6120, cantidadMayor: 10,
      notaMayor: "Lleva 10 uds o más y paga $ 6.120 c/u." },

    { id: 7, tipo: "producto", nombre: "Producto Ejemplo 7",
      descripcion: "Espacio reservado para un producto real.",
      imagen: "img/productos_ejemplos/planta_1.png",
      precio: 15000, precioMayor: 13500, cantidadMayor: 5,
      notaMayor: "Lleva 5 uds o más y paga $ 13.500 c/u." },

    { id: 8, tipo: "producto", nombre: "Producto Ejemplo 8",
      descripcion: "Espacio reservado para un producto real.",
      imagen: "img/productos_ejemplos/bodega_1.png",
      precio: 22000, precioMayor: 19800, cantidadMayor: 5,
      notaMayor: "Lleva 5 uds o más y paga $ 19.800 c/u." },

    // MATERIALES (requieren cotización)
    ...Array.from({ length: 26 }, (_, i) => ({
        id: 101 + i,
        tipo: "material",
        nombre: `Material Ejemplo ${i + 1}`,
        descripcion: "Espacio reservado para un material real.",
        imagen: [
            "img/productos_ejemplos/camion_1.png",
            "img/productos_ejemplos/operarios_1.png",
            "img/productos_ejemplos/planta_1.png",
            "img/productos_ejemplos/bodega_1.png"
        ][i % 4],
        precio: 0,
        precioMayor: null,
        cantidadMayor: null
    }))
];

/* =====================================================
   1. REFERENCIAS DEL DOM
===================================================== */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const DOM = {
    listaProductos:    $("#lista-productos"),
    buscarProducto:    $("#buscar-producto"),
    textoResultados:   $("#texto-resultados"),
    botonesFiltro:     $$(".btn-filtro"),

    botonAbrirCarrito: $("#abrir-carrito"),
    contadorCarrito:   $("#contador-carrito"),
    ventanaCarrito:    $("#ventana-carrito"),
    cerrarCarrito:     $("#cerrar-carrito"),
    contenidoCarrito:  $("#contenido-carrito"),
    subtotalCarrito:   $("#subtotal-carrito"),
    ivaCarrito:        $("#iva-carrito"),
    totalCarrito:      $("#total-carrito"),
    ahorroCarrito:     $("#ahorro-carrito"),
    avisoMateriales:   $("#aviso-materiales-carrito"),
    seguirComprando:   $("#seguir-comprando"),
    confirmarCompra:   $("#confirmar-compra"),

    ventanaProducto:   $("#ventana-producto"),
    cerrarProducto:    $("#cerrar-producto"),
    modalImagen:       $("#modal-imagen"),
    tituloModal:       $("#titulo-producto-modal"),
    modalDescripcion:  $("#modal-descripcion"),
    modalPrecioUnit:   $("#modal-precio-unitario"),
    modalPrecioBox:    $("#modal-precio-contenedor"),
    modalTotalBox:     $("#modal-total-contenedor"),
    modalAvisoCotiza:  $("#modal-aviso-cotizacion"),
    modalCantidad:     $("#modal-cantidad"),
    modalMenos:        $("#modal-menos"),
    modalMas:          $("#modal-mas"),
    modalTotal:        $("#modal-total"),
    modalAgregar:      $("#modal-agregar"),
    modalAvisoMayoreo: $("#modal-aviso-mayoreo"),
    boxPrecioMayor:    $("#contenedor-precio-mayoreo"),
    modalPrecioMayor:  $("#modal-precio-mayor"),
    boxCantidadMayor:  $("#contenedor-cantidad-mayor"),
    modalCantidadMayorTxt: $("#modal-cantidad-mayor-texto"),

    notificacion:      $("#notificacion-tienda")
};

/* =====================================================
   2. ESTADO Y CONFIGURACIÓN
===================================================== */
const ESTADO = {
    carrito: [],
    productoActual: null,
    filtroActual: "todos",
    busqueda: "",
    notificacionTimer: null
};

const CONFIG = {
    IVA: 0.19,
    STORAGE_KEY: "carrito_margarita_v1",
    MAX_CANTIDAD: 999999
};

/* =====================================================
   3. UTILIDADES
===================================================== */
const formatoMoneda = new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
}).format;

function escaparHTML(str = "") {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
        .replaceAll("`", "&#096;");
}

function normalizarTexto(str = "") {
    return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getProductoPorId(id) {
    return CATALOGO.find(p => p.id === Number(id)) || null;
}

function getItemCarrito(id) {
    return ESTADO.carrito.find(i => Number(i.id) === Number(id)) || null;
}

function mostrarNotificacion(mensaje, tipo = "info") {
    const el = DOM.notificacion;
    if (!el) return;
    clearTimeout(ESTADO.notificacionTimer);
    el.textContent = mensaje;
    el.className = "notificacion-tienda notificacion-visible";
    if (tipo === "error") el.classList.add("notificacion-error");
    if (tipo === "exito") el.classList.add("notificacion-exito");
    ESTADO.notificacionTimer = setTimeout(() => {
        el.classList.remove("notificacion-visible");
    }, 3000);
}

function animarContador() {
    const c = DOM.contadorCarrito;
    if (!c) return;
    c.classList.remove("animar");
    void c.offsetWidth;
    c.classList.add("animar");
}

/* =====================================================
   4. CÁLCULO DE MAYOREO
===================================================== */
function calcularPrecioItem(precioUnitario, precioMayor, cantidadMayor, cantidad) {
    const unit = Number(precioUnitario) || 0;
    const mayor = Number(precioMayor) || 0;
    const umbral = Number(cantidadMayor) || 0;
    const cant = Math.max(0, Math.floor(Number(cantidad) || 0));

    if (mayor <= 0 || umbral <= 0 || cant < umbral) {
        return { total: unit * cant, aplicaMayoreo: false, precioUnitarioEfectivo: unit, ahorro: 0 };
    }

    const bloques = Math.floor(cant / umbral);
    const sobrante = cant % umbral;
    const total = bloques * mayor + sobrante * unit;
    const ahorro = Math.max(0, unit * cant - total);

    return { total, aplicaMayoreo: true, precioUnitarioEfectivo: total / cant, ahorro };
}

/* =====================================================
   5. PERSISTENCIA
===================================================== */
function guardarCarrito() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(ESTADO.carrito));
    } catch (e) {
        console.error("No se pudo guardar el carrito:", e);
    }
}

function cargarCarrito() {
    try {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        ESTADO.carrito = parsed
            .filter(it => it && typeof it === "object" && Number.isFinite(Number(it.id)) && Number(it.cantidad) > 0)
            .map(it => ({
                id: Number(it.id),
                tipo: it.tipo === "material" ? "material" : "producto",
                nombre: String(it.nombre || ""),
                descripcion: String(it.descripcion || ""),
                imagen: String(it.imagen || ""),
                precio: Number(it.precio) || 0,
                precioMayor: it.precioMayor != null ? Number(it.precioMayor) : null,
                cantidadMayor: it.cantidadMayor != null ? Number(it.cantidadMayor) : null,
                cantidad: Math.min(CONFIG.MAX_CANTIDAD, Number(it.cantidad))
            }));
    } catch (e) {
        console.error("No se pudo cargar el carrito:", e);
        ESTADO.carrito = [];
    }
}

/* =====================================================
   6. RENDER DEL CATÁLOGO
===================================================== */
function crearTarjetaHTML(p) {
    const esMaterial = p.tipo === "material";

    const precioHTML = esMaterial
        ? `<strong class="producto-precio producto-precio--cotizacion">Requiere cotización</strong>
           <small class="producto-cotizacion-nota">Un asesor se contactará contigo.</small>`
        : `<strong class="producto-precio">${formatoMoneda(p.precio)}</strong>
           <small class="producto-mayoreo">${escaparHTML(p.notaMayor || "")}</small>`;

    const botonHTML = esMaterial
        ? `<button type="button" class="boton-agregar" data-id="${p.id}" data-tipo="material" aria-label="Solicitar cotización de ${escaparHTML(p.nombre)}">
             <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i> Cotizar
           </button>`
        : `<button type="button" class="boton-agregar" data-id="${p.id}" data-tipo="producto" aria-label="Agregar ${escaparHTML(p.nombre)} al carrito">
             <i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Agregar
           </button>`;

    return `
        <article class="tarjeta-producto" data-id="${p.id}" data-tipo="${p.tipo}">
            <div class="producto-imagen">
                <img src="${escaparHTML(p.imagen)}" alt="${escaparHTML(p.nombre)}" loading="lazy"
                     onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-box'}))">
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${escaparHTML(p.nombre)}</h3>
                <p class="producto-descripcion">${escaparHTML(p.descripcion)}</p>
                <div class="producto-pie">
                    <div class="producto-precio-contenedor">
                        <span class="producto-precio-etiqueta">Precio</span>
                        ${precioHTML}
                    </div>
                    ${botonHTML}
                </div>
            </div>
        </article>`;
}

function renderCatalogo(lista) {
    const grid = DOM.listaProductos;
    if (!grid) return;

    const frag = document.createDocumentFragment();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = lista.map(crearTarjetaHTML).join("");
    while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
    grid.replaceChildren(frag);
    grid.setAttribute("aria-busy", "false");

    if (DOM.textoResultados) {
        DOM.textoResultados.textContent = lista.length === 0
            ? "No se encontraron elementos para tu búsqueda."
            : `Mostrando ${lista.length} elemento${lista.length !== 1 ? "s" : ""}.`;
    }

    animarTarjetasVisibles(grid);
}

function animarTarjetasVisibles(grid) {
    if (!("IntersectionObserver" in window)) {
        grid.querySelectorAll(".tarjeta-producto").forEach(t => { t.dataset.animada = "true"; });
        return;
    }

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.dataset.animada = "true";
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    grid.querySelectorAll(".tarjeta-producto").forEach(t => obs.observe(t));
}

/* =====================================================
   7. FILTROS Y BÚSQUEDA
===================================================== */
function aplicarFiltros() {
    const q = normalizarTexto(ESTADO.busqueda);
    const filtrados = CATALOGO.filter(p => {
        const coincideTipo = ESTADO.filtroActual === "todos" || p.tipo === ESTADO.filtroActual;
        const coincideTexto = !q
            || normalizarTexto(p.nombre).includes(q)
            || normalizarTexto(p.descripcion).includes(q);
        return coincideTipo && coincideTexto;
    });
    renderCatalogo(filtrados);
}

function registrarFiltros() {
    DOM.botonesFiltro.forEach(btn => {
        btn.addEventListener("click", () => {
            DOM.botonesFiltro.forEach(b => {
                b.classList.remove("activo");
                b.setAttribute("aria-pressed", "false");
            });
            btn.classList.add("activo");
            btn.setAttribute("aria-pressed", "true");
            ESTADO.filtroActual = btn.dataset.filtro || "todos";
            aplicarFiltros();
        });
    });
}

/* =====================================================
   8. MODAL DE PRODUCTO
===================================================== */
function abrirModalProducto(producto) {
    const v = DOM.ventanaProducto;
    if (!v) return;
    ESTADO.productoActual = producto;

    DOM.tituloModal.textContent = producto.nombre;
    DOM.modalDescripcion.textContent = producto.descripcion;
    DOM.modalImagen.src = producto.imagen;
    DOM.modalImagen.alt = producto.nombre;
    DOM.modalCantidad.value = "1";

    if (producto.tipo === "material") {
        DOM.modalPrecioBox.hidden = true;
        DOM.modalTotalBox.hidden = true;
        DOM.modalAvisoCotiza.hidden = false;
        DOM.boxPrecioMayor.hidden = true;
        DOM.boxCantidadMayor.hidden = true;
        DOM.modalAvisoMayoreo.hidden = true;
        DOM.modalAgregar.innerHTML = `<i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i> Solicitar cotización`;
    } else {
        DOM.modalPrecioBox.hidden = false;
        DOM.modalTotalBox.hidden = false;
        DOM.modalAvisoCotiza.hidden = true;
        DOM.modalAgregar.innerHTML = `<i class="fa-solid fa-cart-plus" aria-hidden="true"></i> Agregar al carrito`;
        DOM.modalPrecioUnit.textContent = formatoMoneda(producto.precio);

        const tieneMayoreo = producto.precioMayor > 0 && producto.cantidadMayor > 0;
        DOM.boxPrecioMayor.hidden = !tieneMayoreo;
        DOM.boxCantidadMayor.hidden = !tieneMayoreo;
        if (tieneMayoreo) {
            DOM.modalPrecioMayor.textContent = `${formatoMoneda(producto.precioMayor)} (lote de ${producto.cantidadMayor} uds)`;
            DOM.modalCantidadMayorTxt.textContent = `${producto.cantidadMayor} unidades`;
        }
    }

    actualizarTotalModal();

    if (!v.open) v.showModal();
}

function actualizarTotalModal() {
    const p = ESTADO.productoActual;
    if (!p || !DOM.modalTotal) return;

    if (p.tipo === "material") {
        DOM.modalTotal.textContent = "—";
        return;
    }

    const cant = obtenerCantidadValida(DOM.modalCantidad);
    const { total, aplicaMayoreo } = calcularPrecioItem(p.precio, p.precioMayor, p.cantidadMayor, cant);

    DOM.modalAvisoMayoreo.hidden = !aplicaMayoreo;
    DOM.modalTotal.textContent = formatoMoneda(total);
}

function obtenerCantidadValida(input) {
    if (!input) return 1;
    let n = parseInt(input.value, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    if (n > CONFIG.MAX_CANTIDAD) n = CONFIG.MAX_CANTIDAD;
    input.value = String(n);
    return n;
}

function cerrarModalProducto() {
    if (DOM.ventanaProducto?.open) DOM.ventanaProducto.close();
    ESTADO.productoActual = null;
}

/* =====================================================
   9. CARRITO — MUTACIONES
===================================================== */
function agregarAlCarrito(cantidad = 1) {
    const p = ESTADO.productoActual;
    if (!p) return;

    const existente = getItemCarrito(p.id);
    if (existente) {
        existente.cantidad = Math.min(CONFIG.MAX_CANTIDAD, existente.cantidad + cantidad);
    } else {
        ESTADO.carrito.push({
            id: p.id, tipo: p.tipo, nombre: p.nombre, descripcion: p.descripcion,
            imagen: p.imagen, precio: p.precio || 0, precioMayor: p.precioMayor || null,
            cantidadMayor: p.cantidadMayor || null, cantidad
        });
    }

    guardarCarrito();
    renderCarrito();
    animarContador();

    const msg = p.tipo === "material"
        ? `✅ ${p.nombre} agregado a cotización`
        : `✅ ${p.nombre} agregado (${cantidad})`;
    mostrarNotificacion(msg, "exito");
}

function cambiarCantidad(id, delta) {
    const item = getItemCarrito(id);
    if (!item) return;

    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
        quitarDelCarrito(id);
        return;
    }
    item.cantidad = Math.min(CONFIG.MAX_CANTIDAD, nueva);

    guardarCarrito();
    renderCarrito();
}

function quitarDelCarrito(id) {
    ESTADO.carrito = ESTADO.carrito.filter(i => Number(i.id) !== Number(id));
    guardarCarrito();
    renderCarrito();
    mostrarNotificacion("🗑️ Producto eliminado del carrito");
}

/* =====================================================
   10. CARRITO — TOTALES (1 sola pasada)
===================================================== */
function calcularTotales() {
    let subtotal = 0, ahorro = 0;
    for (const item of ESTADO.carrito) {
        if (item.tipo === "material") continue;
        const r = calcularPrecioItem(item.precio, item.precioMayor, item.cantidadMayor, item.cantidad);
        subtotal += r.total;
        ahorro   += r.ahorro;
    }
    const iva = Math.round(subtotal * CONFIG.IVA);
    return { subtotal, iva, total: subtotal + iva, ahorro };
}

/* =====================================================
   11. CARRITO — RENDER
===================================================== */
function itemCarritoHTML(item) {
    if (item.tipo === "material") {
        return `
        <div class="item-carrito" data-id="${item.id}">
            <div class="item-carrito-imagen">
                <img src="${escaparHTML(item.imagen)}" alt="${escaparHTML(item.nombre)}" loading="lazy"
                     onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-box'}))">
            </div>
            <div class="item-carrito-info">
                <h3>${escaparHTML(item.nombre)}</h3>
                <p class="item-carrito-cotizacion"><i class="fa-solid fa-file-invoice-dollar" aria-hidden="true"></i> Requiere cotización</p>
                <div class="controles-cantidad">
                    <button type="button" class="boton-cantidad" data-action="restar" data-id="${item.id}" aria-label="Restar"><i class="fa-solid fa-minus"></i></button>
                    <span class="cantidad-producto">${item.cantidad}</span>
                    <button type="button" class="boton-cantidad" data-action="sumar" data-id="${item.id}" aria-label="Sumar"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            <div class="item-carrito-derecha">
                <strong class="item-carrito-subtotal item-carrito-subtotal--cotiza">Por cotizar</strong>
                <button type="button" class="boton-quitar" data-action="quitar" data-id="${item.id}">
                    <i class="fa-solid fa-trash-can" aria-hidden="true"></i> Quitar
                </button>
            </div>
        </div>`;
    }

    const r = calcularPrecioItem(item.precio, item.precioMayor, item.cantidadMayor, item.cantidad);
    const precioMostrar = r.aplicaMayoreo ? r.precioUnitarioEfectivo : item.precio;
    const etiquetaMayoreo = r.aplicaMayoreo
        ? `<span class="item-tachado">${formatoMoneda(item.precio)}</span> <span class="item-mayoreo-tag">MAYOREO</span>`
        : "";

    return `
    <div class="item-carrito" data-id="${item.id}">
        <div class="item-carrito-imagen">
            <img src="${escaparHTML(item.imagen)}" alt="${escaparHTML(item.nombre)}" loading="lazy"
                 onerror="this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-box'}))">
        </div>
        <div class="item-carrito-info">
            <h3>${escaparHTML(item.nombre)}</h3>
            <p>${etiquetaMayoreo} ${formatoMoneda(precioMostrar)} c/u</p>
            <div class="controles-cantidad">
                <button type="button" class="boton-cantidad" data-action="restar" data-id="${item.id}" aria-label="Restar"><i class="fa-solid fa-minus"></i></button>
                <span class="cantidad-producto">${item.cantidad}</span>
                <button type="button" class="boton-cantidad" data-action="sumar" data-id="${item.id}" aria-label="Sumar"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
        <div class="item-carrito-derecha">
            <strong class="item-carrito-subtotal">${formatoMoneda(r.total)}</strong>
            <button type="button" class="boton-quitar" data-action="quitar" data-id="${item.id}">
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i> Quitar
            </button>
        </div>
    </div>`;
}

function renderCarrito() {
    if (!DOM.contenidoCarrito) return;

    const totalItems = ESTADO.carrito.reduce((a, i) => a + i.cantidad, 0);
    if (DOM.contadorCarrito) DOM.contadorCarrito.textContent = String(totalItems);

    if (ESTADO.carrito.length === 0) {
        DOM.contenidoCarrito.innerHTML = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos del catálogo para comenzar a organizar tu pedido.</p>
            </div>`;
    } else {
        DOM.contenidoCarrito.innerHTML = ESTADO.carrito.map(itemCarritoHTML).join("");
    }

    const { subtotal, iva, total, ahorro } = calcularTotales();
    if (DOM.subtotalCarrito) DOM.subtotalCarrito.textContent = formatoMoneda(subtotal);
    if (DOM.ivaCarrito)      DOM.ivaCarrito.textContent      = formatoMoneda(iva);
    if (DOM.totalCarrito)    DOM.totalCarrito.textContent    = formatoMoneda(total);

    if (DOM.ahorroCarrito) {
        DOM.ahorroCarrito.textContent = ahorro > 0 ? `Ahorro por mayoreo: ${formatoMoneda(ahorro)}` : "";
    }

    if (DOM.avisoMateriales) {
        DOM.avisoMateriales.hidden = !ESTADO.carrito.some(i => i.tipo === "material");
    }

    if (DOM.confirmarCompra) DOM.confirmarCompra.disabled = ESTADO.carrito.length === 0;
}

/* =====================================================
   12. CARRITO — ABRIR / CERRAR / REVISAR
===================================================== */
function abrirCarrito() {
    if (DOM.ventanaCarrito && !DOM.ventanaCarrito.open) DOM.ventanaCarrito.showModal();
}
function cerrarVentanaCarrito() {
    if (DOM.ventanaCarrito?.open) DOM.ventanaCarrito.close();
}
function revisarPedido() {
    if (!ESTADO.carrito.length) {
        mostrarNotificacion("Tu carrito está vacío.", "error");
        return;
    }
    guardarCarrito();
    window.location.href = "carrito.html";
}

/* =====================================================
   13. EVENTOS
===================================================== */
function registrarEventosCatalogo() {
    if (!DOM.listaProductos) return;
    DOM.listaProductos.addEventListener("click", (e) => {
        const boton = e.target.closest(".boton-agregar");
        if (!boton) return;
        const id = Number(boton.dataset.id);
        if (!Number.isFinite(id)) return;
        const producto = getProductoPorId(id);
        if (producto) abrirModalProducto(producto);
    });
}

function registrarEventosCarrito() {
    if (!DOM.contenidoCarrito) return;
    DOM.contenidoCarrito.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const action = btn.dataset.action;
        if (!Number.isFinite(id)) return;
        if (action === "sumar")  cambiarCantidad(id, 1);
        if (action === "restar") cambiarCantidad(id, -1);
        if (action === "quitar") quitarDelCarrito(id);
    });
}

function registrarEventosGenerales() {
    if (DOM.buscarProducto) {
        DOM.buscarProducto.addEventListener("input", (e) => {
            ESTADO.busqueda = e.target.value;
            aplicarFiltros();
        });
    }

    DOM.botonAbrirCarrito?.addEventListener("click", abrirCarrito);
    DOM.cerrarCarrito?.addEventListener("click", cerrarVentanaCarrito);
    DOM.seguirComprando?.addEventListener("click", cerrarVentanaCarrito);
    DOM.confirmarCompra?.addEventListener("click", revisarPedido);

    DOM.cerrarProducto?.addEventListener("click", cerrarModalProducto);

    DOM.modalMenos?.addEventListener("click", () => {
        const n = obtenerCantidadValida(DOM.modalCantidad);
        DOM.modalCantidad.value = String(Math.max(1, n - 1));
        actualizarTotalModal();
    });

    DOM.modalMas?.addEventListener("click", () => {
        const n = obtenerCantidadValida(DOM.modalCantidad);
        DOM.modalCantidad.value = String(Math.min(CONFIG.MAX_CANTIDAD, n + 1));
        actualizarTotalModal();
    });

    DOM.modalCantidad?.addEventListener("input", actualizarTotalModal);
    DOM.modalCantidad?.addEventListener("focus", () => DOM.modalCantidad.select());
    DOM.modalCantidad?.addEventListener("blur", () => {
        obtenerCantidadValida(DOM.modalCantidad);
        actualizarTotalModal();
    });

    DOM.modalAgregar?.addEventListener("click", () => {
        const cant = obtenerCantidadValida(DOM.modalCantidad);
        agregarAlCarrito(cant);
        cerrarModalProducto();
    });

    DOM.ventanaProducto?.addEventListener("click", (e) => {
        if (e.target === DOM.ventanaProducto) cerrarModalProducto();
    });

    window.addEventListener("storage", (e) => {
        if (e.key !== CONFIG.STORAGE_KEY) return;
        cargarCarrito();
        renderCarrito();
    });
}

/* =====================================================
   14. INIT
===================================================== */
function init() {
    cargarCarrito();
    renderCatalogo(CATALOGO);
    renderCarrito();
    registrarFiltros();
    registrarEventosCatalogo();
    registrarEventosCarrito();
    registrarEventosGenerales();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}