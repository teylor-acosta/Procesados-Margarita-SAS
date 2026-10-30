

"use strict";

/* =====================================================
   1. REFERENCIAS DEL DOM
===================================================== */
const $ = (sel) => document.querySelector(sel);

const listaProductos = $("#lista-productos");
const buscarProducto = $("#buscar-producto");
const textoResultados = $("#texto-resultados");
const botonesFiltro = document.querySelectorAll(".btn-filtro");

const botonAbrirCarrito = $("#abrir-carrito");
const contadorCarrito = $("#contador-carrito");
const ventanaCarrito = $("#ventana-carrito");
const cerrarCarrito = $("#cerrar-carrito");
const contenidoCarrito = $("#contenido-carrito");
const subtotalCarrito = $("#subtotal-carrito");
const ivaCarrito = $("#iva-carrito");
const totalCarrito = $("#total-carrito");
const ahorroCarrito = $("#ahorro-carrito"); // ✅ opcional
const seguirComprando = $("#seguir-comprando");
const confirmarCompra = $("#confirmar-compra");

const ventanaProducto = $("#ventana-producto");
const cerrarProducto = $("#cerrar-producto");
const modalImagen = $("#modal-imagen");
const tituloProductoModal = $("#titulo-producto-modal");
const modalDescripcion = $("#modal-descripcion");
const modalPrecioUnitario = $("#modal-precio-unitario");
const modalCantidad = $("#modal-cantidad");
const modalMenos = $("#modal-menos");
const modalMas = $("#modal-mas");
const modalTotal = $("#modal-total");
const modalAgregar = $("#modal-agregar");

const modalAvisoMayoreo = $("#modal-aviso-mayoreo");
const contenedorPrecioMayoreo = $("#contenedor-precio-mayoreo");
const modalPrecioMayor = $("#modal-precio-mayor");
const contenedorCantidadMayor = $("#contenedor-cantidad-mayor");
const modalCantidadMayorTexto = $("#modal-cantidad-mayor-texto");

const notificacion = $("#notificacion-tienda");

/* =====================================================
   2. ESTADO Y CONFIGURACIÓN
===================================================== */
let carrito = [];
let productoActual = null;
let notificacionTimeout = null;
let filtroActual = "todos";

const IVA_PORCENTAJE = 0.19;
const STORAGE_KEY = "carrito_margarita_v1";
const MAX_CANTIDAD = 999999;

/* =====================================================
   3. UTILIDADES
===================================================== */
const formatoMoneda = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0
    }).format(valor);

const escaparHTML = (str = "") =>
    String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const normalizarTexto = (str = "") =>
    String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

function mostrarNotificacion(mensaje, tipo = "info") {
    if (!notificacion) return;
    clearTimeout(notificacionTimeout);
    notificacion.textContent = mensaje;
    notificacion.className = "notificacion-tienda notificacion-visible";
    if (tipo === "error") notificacion.classList.add("notificacion-error");
    if (tipo === "exito") notificacion.classList.add("notificacion-exito");

    notificacionTimeout = setTimeout(() => {
        notificacion.classList.remove("notificacion-visible");
    }, 3000);
}

function animarContador() {
    if (!contadorCarrito) return;
    contadorCarrito.classList.remove("animar");
    void contadorCarrito.offsetWidth;
    contadorCarrito.classList.add("animar");
}

/* =====================================================
   4. CÁLCULO DE MAYOREO POR BLOQUES
===================================================== */
function calcularPrecioItem(precioUnitario, precioMayor, cantidadMayor, cantidad) {
    const unitario = Number(precioUnitario) || 0;
    const mayor = Number(precioMayor) || 0;
    const umbral = Number(cantidadMayor) || 0;
    const cant = Math.max(0, Math.floor(Number(cantidad) || 0));

    // Sin datos válidos de mayoreo → precio normal (Materiales)
    if (mayor <= 0 || umbral <= 0 || cant < umbral) {
        return {
            total: unitario * cant,
            aplicaMayoreo: false,
            precioUnitarioEfectivo: unitario,
            ahorro: 0
        };
    }

    // Cálculo por lotes (Productos)
    const bloques = Math.floor(cant / umbral);
    const sobrante = cant % umbral;
    const total = bloques * mayor + sobrante * unitario;

    // Ahorro real vs. pagar todo a precio unitario
    const ahorro = unitario * cant - total;

    return {
        total,
        aplicaMayoreo: true,
        precioUnitarioEfectivo: total / cant,
        ahorro: ahorro > 0 ? ahorro : 0
    };
}

/* =====================================================
   5. PERSISTENCIA (LocalStorage)
===================================================== */
function guardarCarrito() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch (e) {}
}

function cargarCarrito() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            carrito = parsed.filter(
                (item) => item && typeof item.id === "number" && item.cantidad > 0
            );
        }
    } catch (e) {
        carrito = [];
    }
}

/* =====================================================
   6. EVENTOS DEL CATÁLOGO Y FILTROS
===================================================== */
function registrarEventosCatalogo() {
    if (!listaProductos) return;

    listaProductos.addEventListener("click", (e) => {
        const boton = e.target.closest(".boton-agregar");
        if (!boton) return;

        const id = Number(boton.dataset.id);
        const card = boton.closest(".tarjeta-producto");
        if (Number.isNaN(id) || !card) return;

        const nombre = card.querySelector(".producto-nombre").textContent.trim();
        const descripcionCorta = card.querySelector(".producto-descripcion").textContent.trim();
        const imagen = card.querySelector(".producto-imagen img")?.getAttribute("src") || "";

        const precio = Number(boton.dataset.precio) || 0;
        const precioMayor = boton.dataset.precioMayor ? Number(boton.dataset.precioMayor) : null;
        const cantidadMayor = boton.dataset.cantidadMayor ? Number(boton.dataset.cantidadMayor) : null;

        const producto = {
            id,
            nombre,
            descripcionCorta,
            descripcion: descripcionCorta,
            imagen,
            precio,
            precioMayor: (precioMayor && precioMayor > 0) ? precioMayor : null,
            cantidadMayor: (cantidadMayor && cantidadMayor > 0) ? cantidadMayor : null
        };

        abrirModalProducto(producto);
    });
}

function aplicarFiltros() {
    if (!listaProductos) return;

    const q = normalizarTexto(buscarProducto?.value.trim() || "");
    const tarjetas = listaProductos.querySelectorAll(".tarjeta-producto");
    let visibles = 0;

    tarjetas.forEach((card) => {
        const nombre = normalizarTexto(card.querySelector(".producto-nombre").textContent);
        const descripcion = normalizarTexto(card.querySelector(".producto-descripcion").textContent);
        const tipo = card.dataset.tipo;

        const coincideTexto = !q || nombre.includes(q) || descripcion.includes(q);
        const coincideFiltro = filtroActual === "todos" || tipo === filtroActual;

        if (coincideTexto && coincideFiltro) {
            card.style.display = "";
            visibles++;
        } else {
            card.style.display = "none";
        }
    });

    if (textoResultados) {
        textoResultados.textContent = visibles === 0
            ? "No se encontraron elementos para tu búsqueda."
            : `Mostrando ${visibles} elementos.`;
    }
}

function registrarFiltrosCategoria() {
    if (!botonesFiltro.length) return;

    botonesFiltro.forEach(btn => {
        btn.addEventListener("click", () => {
            botonesFiltro.forEach(b => b.classList.remove("activo"));
            btn.classList.add("activo");
            filtroActual = btn.dataset.filtro;
            aplicarFiltros();
        });
    });
}
/* =====================================================
   7. MODAL DE PRODUCTO
===================================================== */
function abrirModalProducto(producto) {
    if (!ventanaProducto) return;
    productoActual = producto;

    tituloProductoModal.textContent = producto.nombre;
    modalDescripcion.textContent = producto.descripcion;
    modalPrecioUnitario.textContent = formatoMoneda(producto.precio);
    modalImagen.src = producto.imagen;
    modalImagen.alt = producto.nombre;
    modalCantidad.value = 1;

    // ✅ Mostrar info de mayoreo como LOTE (precio total por bloque)
    if (producto.precioMayor && producto.cantidadMayor) {
        if (contenedorPrecioMayoreo) contenedorPrecioMayoreo.style.display = "flex";
        if (modalPrecioMayor) {
            modalPrecioMayor.textContent =
                `${formatoMoneda(producto.precioMayor)} (lote de ${producto.cantidadMayor} uds)`;
        }
        if (contenedorCantidadMayor) contenedorCantidadMayor.style.display = "flex";
        if (modalCantidadMayorTexto) {
            modalCantidadMayorTexto.textContent = `${producto.cantidadMayor} unidades`;
        }
    } else {
        if (contenedorPrecioMayoreo) contenedorPrecioMayoreo.style.display = "none";
        if (contenedorCantidadMayor) contenedorCantidadMayor.style.display = "none";
    }

    actualizarTotalModal();

    if (!ventanaProducto.open) {
        ventanaProducto.showModal();
    }
}

function actualizarTotalModal() {
    if (!productoActual || !modalTotal) return;

    const cantidad = obtenerCantidadValida(modalCantidad);

    const { total, aplicaMayoreo } = calcularPrecioItem(
        productoActual.precio,
        productoActual.precioMayor,
        productoActual.cantidadMayor,
        cantidad
    );

    if (modalAvisoMayoreo) {
        modalAvisoMayoreo.style.display = aplicaMayoreo ? "block" : "none";
    }

    modalTotal.textContent = formatoMoneda(total);
}

function obtenerCantidadValida(input) {
    if (!input) return 1;
    let n = parseInt(input.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > MAX_CANTIDAD) n = MAX_CANTIDAD;
    input.value = n;
    return n;
}

function cerrarModalProducto() {
    if (ventanaProducto) ventanaProducto.close();
    productoActual = null;
}

/* =====================================================
   8. CARRITO (Lógica)
===================================================== */
function agregarAlCarrito(cantidad = 1) {
    if (!productoActual) return;

    const id = productoActual.id;
    const existente = carrito.find((item) => item.id === id);

    if (existente) {
        existente.cantidad = Math.min(MAX_CANTIDAD, existente.cantidad + cantidad);
    } else {
        carrito.push({
            id: productoActual.id,
            nombre: productoActual.nombre,
            descripcion: productoActual.descripcion,
            descripcionCorta: productoActual.descripcionCorta,
            precio: productoActual.precio,
            precioMayor: productoActual.precioMayor || null,
            cantidadMayor: productoActual.cantidadMayor || null,
            imagen: productoActual.imagen,
            cantidad
        });
    }

    guardarCarrito();
    actualizarCarrito();
    animarContador();
    mostrarNotificacion(`✅ ${productoActual.nombre} agregado (${cantidad})`, "exito");
}

function cambiarCantidad(id, delta) {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        carrito = carrito.filter((i) => i.id !== id);
    } else if (item.cantidad > MAX_CANTIDAD) {
        item.cantidad = MAX_CANTIDAD;
    }

    guardarCarrito();
    actualizarCarrito();
}

function quitarDelCarrito(id) {
    carrito = carrito.filter((i) => i.id !== id);
    guardarCarrito();
    actualizarCarrito();
    mostrarNotificacion("🗑️ Producto eliminado del carrito");
}

/* =====================================================
   9. TOTALES Y RENDERIZADO DEL CARRITO
===================================================== */
function calcularTotales() {
    let subtotal = 0;
    let ahorroTotal = 0;

    carrito.forEach(item => {
        const r = calcularPrecioItem(
            item.precio,
            item.precioMayor,
            item.cantidadMayor,
            item.cantidad
        );
        subtotal += r.total;
        ahorroTotal += r.ahorro;
    });

    const iva = Math.round(subtotal * IVA_PORCENTAJE);
    const total = subtotal + iva;

    return { subtotal, iva, total, ahorroTotal };
}

function actualizarCarrito() {
    if (!contadorCarrito) return;

    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    contadorCarrito.textContent = totalItems;

    if (!contenidoCarrito) return;

    if (!carrito.length) {
        contenidoCarrito.innerHTML = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos del catálogo para comenzar a organizar tu pedido.</p>
            </div>
        `;
    } else {
        contenidoCarrito.innerHTML = carrito.map((item) => {
            const r = calcularPrecioItem(
                item.precio,
                item.precioMayor,
                item.cantidadMayor,
                item.cantidad
            );

            // ✅ Mostrar precio unitario efectivo y, si aplica, tachar el precio normal
            const precioMostrar = r.aplicaMayoreo
                ? r.precioUnitarioEfectivo
                : item.precio;

            let etiquetaMayoreo = "";
            if (r.aplicaMayoreo) {
                etiquetaMayoreo = `
                    <span style="text-decoration: line-through; color: #94a3b8; font-size: 10px; margin-right: 5px;">
                        ${formatoMoneda(item.precio)}
                    </span>
                    <span style="color:#16a34a;font-size:10px;font-weight:600;margin-right:4px;">
                        MAYOREO
                    </span>
                `;
            }

            const subtotalItem = r.total;

            return `
            <div class="item-carrito" data-id="${item.id}">
                <div class="item-carrito-imagen">
                    <img src="${escaparHTML(item.imagen)}" alt="${escaparHTML(item.nombre)}"
                        onerror="this.outerHTML='<i class=\\'fa-solid fa-box\\'></i>'">
                </div>
                <div class="item-carrito-info">
                    <h3>${escaparHTML(item.nombre)}</h3>
                    <p>${etiquetaMayoreo} ${formatoMoneda(precioMostrar)} c/u</p>
                    <div class="controles-cantidad">
                        <button type="button" class="boton-cantidad" data-action="restar" data-id="${item.id}">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="cantidad-producto">${item.cantidad}</span>
                        <button type="button" class="boton-cantidad" data-action="sumar" data-id="${item.id}">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="item-carrito-derecha">
                    <strong class="item-carrito-subtotal">${formatoMoneda(subtotalItem)}</strong>
                    <button type="button" class="boton-quitar" data-action="quitar" data-id="${item.id}">
                        <i class="fa-solid fa-trash-can"></i> Quitar
                    </button>
                </div>
            </div>
            `;
        }).join("");

        contenidoCarrito.querySelectorAll(".boton-cantidad, .boton-quitar").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                const action = btn.dataset.action;
                if (action === "sumar") cambiarCantidad(id, 1);
                if (action === "restar") cambiarCantidad(id, -1);
                if (action === "quitar") quitarDelCarrito(id);
            });
        });
    }

    const { subtotal, iva, total, ahorroTotal } = calcularTotales();
    if (subtotalCarrito) subtotalCarrito.textContent = formatoMoneda(subtotal);
    if (ivaCarrito) ivaCarrito.textContent = formatoMoneda(iva);
    if (totalCarrito) totalCarrito.textContent = formatoMoneda(total);

    // ✅ Mostrar el ahorro si existe el contenedor
    if (ahorroCarrito) {
        ahorroCarrito.textContent = ahorroTotal > 0
            ? `Ahorro por mayoreo: ${formatoMoneda(ahorroTotal)}`
            : "";
    }

    if (confirmarCompra) confirmarCompra.disabled = carrito.length === 0;
}

function abrirCarrito() {
    if (ventanaCarrito && !ventanaCarrito.open) {
        ventanaCarrito.showModal();
    }
}

function cerrarVentanaCarrito() {
    if (ventanaCarrito) ventanaCarrito.close();
}

function revisarPedido() {
    if (!carrito.length) {
        mostrarNotificacion("Tu carrito está vacío.", "error");
        return;
    }
    guardarCarrito();
    window.location.href = "carrito.html";
}
/* =====================================================
   10. REGISTRO DE EVENTOS GENERALES
===================================================== */
function registrarEventos() {
    // 🔍 Buscador
    if (buscarProducto) {
        buscarProducto.addEventListener("input", aplicarFiltros);
    }

    // 🛒 Eventos del Carrito
    if (botonAbrirCarrito) botonAbrirCarrito.addEventListener("click", abrirCarrito);
    if (cerrarCarrito) cerrarCarrito.addEventListener("click", cerrarVentanaCarrito);
    if (seguirComprando) seguirComprando.addEventListener("click", cerrarVentanaCarrito);
    if (confirmarCompra) confirmarCompra.addEventListener("click", revisarPedido);

    // 🪟 Modal Producto
    if (cerrarProducto) cerrarProducto.addEventListener("click", cerrarModalProducto);

    if (modalMenos) {
        modalMenos.addEventListener("click", () => {
            const actual = obtenerCantidadValida(modalCantidad);
            modalCantidad.value = Math.max(1, actual - 1);
            actualizarTotalModal();
        });
    }

    if (modalMas) {
        modalMas.addEventListener("click", () => {
            const actual = obtenerCantidadValida(modalCantidad);
            modalCantidad.value = Math.min(MAX_CANTIDAD, actual + 1);
            actualizarTotalModal();
        });
    }

    if (modalCantidad) {
        // Se ejecuta cada vez que el usuario escribe o usa las flechas
        modalCantidad.addEventListener("input", actualizarTotalModal);
        
        // ✅ SOLUCIÓN AL PROBLEMA DEL "1" PEGADO:
        // Al hacer clic o tocar el input (en celular o PC), selecciona todo el número
        // para que al escribir "133" reemplace el "1" viejo automáticamente.
        modalCantidad.addEventListener("focus", () => {
            modalCantidad.select();
        });

        // Al salir del input, valida que sea un número correcto
        modalCantidad.addEventListener("blur", () => {
            obtenerCantidadValida(modalCantidad);
            actualizarTotalModal();
        });
    }

    if (modalAgregar) {
        modalAgregar.addEventListener("click", () => {
            const cantidad = obtenerCantidadValida(modalCantidad);
            agregarAlCarrito(cantidad);
            cerrarModalProducto();
        });
    }

    // Cerrar el modal si se hace clic fuera del contenido
    if (ventanaProducto) {
        ventanaProducto.addEventListener("click", (e) => {
            if (e.target === ventanaProducto) cerrarModalProducto();
        });
    }
}

/* =====================================================
   11. INICIALIZACIÓN
===================================================== */
function init() {
    console.log("🚀 Iniciando tienda estática...");

    // Cargar carrito guardado en el navegador
    cargarCarrito();
    actualizarCarrito();

    // Mostrar el conteo inicial de productos en el catálogo
    const totalInicial = document.querySelectorAll(".tarjeta-producto").length;
    if (textoResultados) {
        textoResultados.textContent = `Mostrando ${totalInicial} elementos.`;
    }

    // Activar todos los eventos
    registrarEventosCatalogo();
    registrarFiltrosCategoria();
    registrarEventos();
}

// Arrancar la aplicación cuando el HTML esté listo
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}