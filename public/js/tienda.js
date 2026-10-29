/* =====================================================
   PROCESADOS MARGARITA S.A.S.
   Módulo de compras - Lógica principal (SIN CATEGORÍAS)
===================================================== */

"use strict";

/* =====================================================
   1. CATÁLOGO DE PRODUCTOS
===================================================== */
const PRODUCTOS = [
    {
        id: 1,
        nombre: "Café Molido Premium 500g",
        descripcionCorta: "Café tostado de origen colombiano, aroma intenso.",
        descripcion:
            "Café molido premium de origen colombiano, cuidadosamente tostado para conservar su aroma y sabor. Presentación de 500 g en empaque sellado al vacío que garantiza frescura por más tiempo. Ideal para preparar en prensa francesa, greca o cafetera de goteo.",
        precio: 28500,
        imagen: "img/productos_ejemplos/operarios_1.png"
    },
    {
        id: 2,
        nombre: "Panela Pulverizada 1kg",
        descripcionCorta: "Panela 100% natural sin aditivos ni conservantes.",
        descripcion:
            "Panela pulverizada 100% natural, obtenida de la caña de azúcar sin aditivos ni conservantes. Presentación de 1 kg. Excelente para endulzar bebidas, preparar aguapanela y postres tradicionales.",
        precio: 9500,
        imagen: "img/productos_ejemplos/camion_1.png"
    },
    {
        id: 3,
        nombre: "Chocolate de Mesa 500g",
        descripcionCorta: "Chocolate tradicional con aroma y sabor intenso.",
        descripcion:
            "Chocolate de mesa tradicional elaborado con cacao seleccionado. Presentación de 500 g. Perfecto para preparar chocolate caliente con leche o agua, conservando el auténtico sabor colombiano.",
        precio: 17800,
        imagen: "img/productos_ejemplos/bodega_1.png"
    },
    {
        id: 4,
        nombre: "Aceite de Oliva Extra Virgen 750ml",
        descripcionCorta: "Aceite de oliva prensado en frío, primera extracción.",
        descripcion:
            "Aceite de oliva extra virgen de primera extracción en frío. Botella de 750 ml. Ideal para ensaladas, aderezos y preparaciones frías. Conserva todas sus propiedades nutricionales y su sabor afrutado característico.",
        precio: 42000,
        imagen: "img/productos_ejemplos/planta_1.png"
    },
    {
        id: 5,
        nombre: "Miel de Abeja Pura 500g",
        descripcionCorta: "Miel 100% pura de abejas, sin pasteurizar.",
        descripcion:
            "Miel pura de abejas 100% natural, sin pasteurizar ni procesar. Frasco de 500 g. Recolectada de colmenas colombianas en zonas de bosque nativo. Contiene propiedades antibacterianas y antioxidantes naturales.",
        precio: 32000,
        imagen: "img/productos_ejemplos/operarios_1.png"
    },
    {
        id: 6,
        nombre: "Sal Marina Fina 1kg",
        descripcionCorta: "Sal marina natural, rica en minerales esenciales.",
        descripcion:
            "Sal marina fina 100% natural, obtenida por evaporación solar. Bolsa de 1 kg. Conserva minerales esenciales como magnesio, calcio y potasio. Ideal para sazonar todo tipo de preparaciones.",
        precio: 6800,
        imagen: "img/productos_ejemplos/camion_1.png"
    }
];

/* =====================================================
   2. REFERENCIAS DEL DOM
===================================================== */
const $ = (sel) => document.querySelector(sel);

const listaProductos = $("#lista-productos");
const textoResultados = $("#texto-resultados");
const buscarProducto = $("#buscar-producto");

const botonAbrirCarrito = $("#abrir-carrito");
const contadorCarrito = $("#contador-carrito");
const ventanaCarrito = $("#ventana-carrito");
const cerrarCarrito = $("#cerrar-carrito");
const contenidoCarrito = $("#contenido-carrito");
const subtotalCarrito = $("#subtotal-carrito");
const ivaCarrito = $("#iva-carrito");
const totalCarrito = $("#total-carrito");
const seguirComprando = $("#seguir-comprando");
const confirmarCompra = $("#confirmar-compra");
const resultadoCompra = $("#resultado-compra");

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

const notificacion = $("#notificacion-tienda");

/* =====================================================
   3. ESTADO
===================================================== */
let carrito = [];
let productoActual = null;
let notificacionTimeout = null;

const IVA_PORCENTAJE = 0.19;
const STORAGE_KEY = "carrito_margarita_v1";

/* =====================================================
   4. UTILIDADES
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
    if (!notificacion) {
        console.warn("Notificación:", mensaje);
        return;
    }
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
   5. PERSISTENCIA
===================================================== */
function guardarCarrito() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch (e) {
        /* silencioso */
    }
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
   6. DELEGACIÓN DE EVENTOS
===================================================== */
function delegarEventosCatalogo() {
    if (!listaProductos) return;

    listaProductos.addEventListener("click", (e) => {
        const boton = e.target.closest(".boton-agregar");
        if (!boton) return;

        const id = Number(boton.dataset.id);
        if (Number.isNaN(id)) return;

        abrirModalProducto(id);
    });
}

/* =====================================================
   7. RENDER DE PRODUCTOS
===================================================== */
function renderProductos(lista) {
    if (!listaProductos) return;

    if (!lista.length) {
        listaProductos.innerHTML = `
            <div class="estado-catalogo">
                <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <h3>No encontramos productos</h3>
                <p>Intenta con otra búsqueda.</p>
            </div>
        `;
        listaProductos.setAttribute("aria-busy", "false");
        return;
    }

    listaProductos.innerHTML = lista
        .map(
            (p) => `
        <article class="tarjeta-producto" data-id="${p.id}">
            <div class="producto-imagen">
                <img
                    src="${escaparHTML(p.imagen)}"
                    alt="${escaparHTML(p.nombre)}"
                    loading="lazy"
                    onerror="this.outerHTML='<div class=\\'imagen-respaldo\\'><i class=\\'fa-solid fa-box\\'></i></div>'"
                >
            </div>
            <div class="producto-info">
                <h3 class="producto-nombre">${escaparHTML(p.nombre)}</h3>
                <p class="producto-descripcion">${escaparHTML(p.descripcionCorta)}</p>
                <div class="producto-pie">
                    <div class="producto-precio-contenedor">
                        <span class="producto-precio-etiqueta">Precio</span>
                        <strong class="producto-precio">${formatoMoneda(p.precio)}</strong>
                    </div>
                    <button
                        type="button"
                        class="boton-agregar"
                        data-id="${p.id}"
                        aria-label="Agregar ${escaparHTML(p.nombre)} al carrito"
                    >
                        <i class="fa-solid fa-cart-plus" aria-hidden="true"></i>
                        Agregar
                    </button>
                </div>
            </div>
        </article>
    `
        )
        .join("");

    listaProductos.setAttribute("aria-busy", "false");
}

/* =====================================================
   8. BÚSQUEDA
===================================================== */
function aplicarFiltros() {
    if (!buscarProducto) return;

    const q = normalizarTexto(buscarProducto.value.trim());

    const filtrados = PRODUCTOS.filter((p) => {
        const nombre = normalizarTexto(p.nombre);
        const descCorta = normalizarTexto(p.descripcionCorta);
        const desc = normalizarTexto(p.descripcion);

        return (
            !q ||
            nombre.includes(q) ||
            descCorta.includes(q) ||
            desc.includes(q)
        );
    });

    renderProductos(filtrados);

    if (textoResultados) {
        const total = filtrados.length;
        textoResultados.textContent =
            total === 0
                ? "No se encontraron productos para tu búsqueda."
                : total === 1
                ? "Mostrando 1 producto."
                : `Mostrando ${total} productos.`;
    }
}

/* =====================================================
   9. MODAL DE PRODUCTO
===================================================== */
function abrirModalProducto(id) {
    if (!ventanaProducto) {
        console.error("❌ No existe #ventana-producto en el HTML.");
        return;
    }

    const producto = PRODUCTOS.find((p) => p.id === id);
    if (!producto) {
        mostrarNotificacion("Producto no encontrado.", "error");
        return;
    }

    productoActual = producto;

    tituloProductoModal.textContent = producto.nombre;
    modalDescripcion.textContent = producto.descripcion;
    modalPrecioUnitario.textContent = formatoMoneda(producto.precio);
    modalImagen.src = producto.imagen;
    modalImagen.alt = producto.nombre;
    modalCantidad.value = 1;
    actualizarTotalModal();

    if (!ventanaProducto.open) {
        ventanaProducto.showModal();
    }
}

function actualizarTotalModal() {
    if (!productoActual || !modalTotal) return;
    const cantidad = obtenerCantidadValida(modalCantidad);
    modalTotal.textContent = formatoMoneda(productoActual.precio * cantidad);
}

function obtenerCantidadValida(input) {
    if (!input) return 1;
    let n = parseInt(input.value, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 99) n = 99;
    input.value = n;
    return n;
}

function cerrarModalProducto() {
    if (ventanaProducto) ventanaProducto.close();
    productoActual = null;
}

/* =====================================================
   10. CARRITO (guarda descripción e info completa)
===================================================== */
function agregarAlCarrito(id, cantidad = 1) {
    const producto = PRODUCTOS.find((p) => p.id === id);
    if (!producto) return;

    const existente = carrito.find((item) => item.id === id);

    if (existente) {
        existente.cantidad = Math.min(99, existente.cantidad + cantidad);
    } else {
        // 🆕 Guardamos TODA la info para que el carrito la muestre
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            descripcionCorta: producto.descripcionCorta,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad
        });
    }

    guardarCarrito();
    actualizarCarrito();
    animarContador();

    mostrarNotificacion(
        `✅ ${producto.nombre} agregado al carrito (${cantidad})`,
        "exito"
    );
}

function cambiarCantidad(id, delta) {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        carrito = carrito.filter((i) => i.id !== id);
    } else if (item.cantidad > 99) {
        item.cantidad = 99;
    }

    guardarCarrito();
    actualizarCarrito();
}

function quitarDelCarrito(id) {
    const item = carrito.find((i) => i.id === id);
    carrito = carrito.filter((i) => i.id !== id);

    guardarCarrito();
    actualizarCarrito();

    if (item) {
        mostrarNotificacion(`🗑️ ${item.nombre} eliminado del carrito`);
    }
}

function calcularTotales() {
    const subtotal = carrito.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
    );
    const iva = Math.round(subtotal * IVA_PORCENTAJE);
    const total = subtotal + iva;
    return { subtotal, iva, total };
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
        contenidoCarrito.innerHTML = carrito
            .map(
                (item) => `
            <div class="item-carrito" data-id="${item.id}">
                <div class="item-carrito-imagen">
                    <img src="${escaparHTML(item.imagen)}" alt="${escaparHTML(item.nombre)}"
                        onerror="this.outerHTML='<i class=\\'fa-solid fa-box\\'></i>'">
                </div>
                <div class="item-carrito-info">
                    <h3>${escaparHTML(item.nombre)}</h3>
                    <p>${formatoMoneda(item.precio)} c/u</p>
                    <div class="controles-cantidad">
                        <button type="button" class="boton-cantidad" data-action="restar" data-id="${item.id}" aria-label="Disminuir cantidad">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="cantidad-producto">${item.cantidad}</span>
                        <button type="button" class="boton-cantidad" data-action="sumar" data-id="${item.id}" aria-label="Aumentar cantidad">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="item-carrito-derecha">
                    <strong class="item-carrito-subtotal">${formatoMoneda(
                        item.precio * item.cantidad
                    )}</strong>
                    <button type="button" class="boton-quitar" data-action="quitar" data-id="${item.id}" aria-label="Quitar producto">
                        <i class="fa-solid fa-trash-can"></i> Quitar
                    </button>
                </div>
            </div>
        `
            )
            .join("");

        contenidoCarrito
            .querySelectorAll(".boton-cantidad, .boton-quitar")
            .forEach((btn) => {
                btn.addEventListener("click", () => {
                    const id = Number(btn.dataset.id);
                    const action = btn.dataset.action;
                    if (action === "sumar") cambiarCantidad(id, 1);
                    if (action === "restar") cambiarCantidad(id, -1);
                    if (action === "quitar") quitarDelCarrito(id);
                });
            });
    }

    const { subtotal, iva, total } = calcularTotales();
    if (subtotalCarrito) subtotalCarrito.textContent = formatoMoneda(subtotal);
    if (ivaCarrito) ivaCarrito.textContent = formatoMoneda(iva);
    if (totalCarrito) totalCarrito.textContent = formatoMoneda(total);

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

/* =====================================================
   11. REVISAR PEDIDO (NAVEGA A carrito.html)
===================================================== */
function revisarPedido() {
    if (!carrito.length) {
        mostrarNotificacion("Tu carrito está vacío.", "error");
        return;
    }

    guardarCarrito();
    window.location.href = "carrito.html";
}

/* =====================================================
   12. EVENTOS
===================================================== */
function registrarEventos() {
    // Buscador
    if (buscarProducto) {
        buscarProducto.addEventListener("input", aplicarFiltros);
        buscarProducto.addEventListener("search", aplicarFiltros);
        buscarProducto.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                aplicarFiltros();
            }
        });
    }

    // Carrito
    if (botonAbrirCarrito) botonAbrirCarrito.addEventListener("click", abrirCarrito);
    if (cerrarCarrito) cerrarCarrito.addEventListener("click", cerrarVentanaCarrito);
    if (seguirComprando) seguirComprando.addEventListener("click", cerrarVentanaCarrito);
    if (confirmarCompra) confirmarCompra.addEventListener("click", revisarPedido);

    // Modal de producto
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
            modalCantidad.value = Math.min(99, actual + 1);
            actualizarTotalModal();
        });
    }

    if (modalCantidad) {
        modalCantidad.addEventListener("input", actualizarTotalModal);
        modalCantidad.addEventListener("blur", () => {
            obtenerCantidadValida(modalCantidad);
            actualizarTotalModal();
        });
    }

    if (modalAgregar) {
        modalAgregar.addEventListener("click", () => {
            if (!productoActual) return;
            const cantidad = obtenerCantidadValida(modalCantidad);
            agregarAlCarrito(productoActual.id, cantidad);
            cerrarModalProducto();
        });
    }

    if (ventanaProducto) {
        ventanaProducto.addEventListener("click", (e) => {
            if (e.target === ventanaProducto) cerrarModalProducto();
        });
        ventanaProducto.addEventListener("close", () => {
            productoActual = null;
        });
    }

    if (ventanaCarrito) {
        ventanaCarrito.addEventListener("click", (e) => {
            if (e.target === ventanaCarrito) cerrarVentanaCarrito();
        });
    }
}

/* =====================================================
   13. INICIALIZACIÓN
===================================================== */
function init() {
    console.log("🚀 Iniciando tienda...");

    cargarCarrito();
    actualizarCarrito();

    delegarEventosCatalogo();
    registrarEventos();

    console.log("📦 Renderizando", PRODUCTOS.length, "productos desde el array...");
    renderProductos(PRODUCTOS);

    if (textoResultados) {
        textoResultados.textContent = `Mostrando ${PRODUCTOS.length} productos.`;
    }
    if (listaProductos) {
        listaProductos.setAttribute("aria-busy", "false");
    }

    console.log("✅ Tienda lista.");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}