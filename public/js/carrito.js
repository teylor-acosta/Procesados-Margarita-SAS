/* =========================================================
   PROCESADOS MARGARITA S.A.S.
   Carrito de compras — Lógica principal con EmailJS y Mayoreo
========================================================= */

"use strict";

/* =========================================================
   0. CONFIGURACIÓN DE EMAILJS
========================================================= */
const EMAILJS_PUBLIC_KEY = "QTHahje2heOSJ_3cW";
const EMAILJS_SERVICE_ID = "service_r6101od";

// Plantilla para pedidos normales
const EMAILJS_TEMPLATE_ID = "template_2if3lv7"; 

// ✅ Plantilla para cancelaciones
const EMAILJS_TEMPLATE_CANCEL = "template_fe3ztse"; 

// Inicializar EmailJS
if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

/* =========================================================
   1. CONFIGURACIÓN
========================================================= */
const CONFIG = {
    storageKey: "carrito_margarita_v1",
    clavesAlternativas: ["carrito", "carritoCompras", "cart"],
    idioma: "es-CO",
    moneda: "COP",
    maxCantidad: 99,
    imagenDefecto: "img/productos_ejemplos/operarios_1.png",
    
    // 🆕 NÚMERO DE WHATSAPP (Déjalo vacío para elegir contacto manualmente)
    numeroWhatsapp: "" 
};

/* Formateadores */
const formatoMoneda = (() => {
    try {
        return new Intl.NumberFormat(CONFIG.idioma, {
            style: "currency",
            currency: CONFIG.moneda,
            maximumFractionDigits: 0
        });
    } catch {
        return { format: (v) => `$ ${Number(v) || 0}` };
    }
})();

const formatoFecha = (() => {
    try {
        return new Intl.DateTimeFormat(CONFIG.idioma, {
            dateStyle: "medium",
            timeStyle: "short"
        });
    } catch {
        return { format: (d) => new Date(d).toLocaleString() };
    }
})();

/* =========================================================
   2. DOM
========================================================= */
const $ = (id) => document.getElementById(id);

const DOM = {
    lista: $("lista-carrito"),
    vacio: $("carrito-vacio"),
    cantidadProductos: $("cantidad-productos"),

    subtotal: $("subtotal-productos"),
    totalArticulos: $("total-articulos"),
    envio: $("costo-envio"),
    total: $("total-carrito"),
    
    // 🆕 Referencias al ahorro en resumen
    filaAhorro: $("fila-ahorro"),
    ahorroProductos: $("ahorro-productos"),

    limpiar: $("btn-limpiar"),
    confirmar: $("btn-confirmar"),

    modal: $("modal-pedido"),
    cerrarModal: $("btn-cerrar-modal"),
    formulario: $("formulario-pedido"),
    formConfirmar: $("form-confirmar"),

    nombre: $("nombre-cliente"),
    correo: $("correo-cliente"),
    telefono: $("telefono-cliente"),
    direccion: $("direccion-cliente"),
    observaciones: $("observaciones"),

    comprobante: $("comprobante"),
    numeroRecibo: $("recibo-numero"),
    fechaRecibo: $("recibo-fecha"),
    clienteRecibo: $("recibo-cliente"),
    correoRecibo: $("recibo-correo"),
    telefonoRecibo: $("recibo-telefono"),
    direccionRecibo: $("recibo-direccion"),
    listaRecibo: $("recibo-lista-productos"),
    subtotalRecibo: $("recibo-subtotal"),
    envioRecibo: $("recibo-envio"),
    totalRecibo: $("recibo-total"),
    
    // 🆕 Referencias al ahorro en el recibo
    reciboFilaAhorro: $("recibo-fila-ahorro"),
    reciboAhorro: $("recibo-ahorro"),

    observacionesContenedor: $("recibo-observaciones-contenedor"),
    observacionesRecibo: $("recibo-observaciones"),

    reciboAcciones: $("recibo-acciones"),

    descargarPDF: $("btn-descargar-pdf"),
    enviarCorreo: $("btn-enviar-correo"),
    imprimir: $("btn-imprimir-recibo"),
    volverTienda: $("btn-volver-tienda"),
    cancelarPedido: $("btn-cancelar-pedido"),

    notificacion: $("notificacion-carrito")
};

/* =========================================================
   3. ESTADO
========================================================= */
let productos = [];
let ultimoRecibo = null;
let modalAbierto = false;
let procesandoPedido = false;
let eventosConfigurados = false;

/* =========================================================
   4. UTILIDADES
========================================================= */
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
        const entidades = {
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        };
        return entidades[caracter];
    });
}

function dinero(valor) {
    return formatoMoneda.format(Number(valor) || 0);
}

function obtenerPrecio(producto) {
    const precio = Number(producto.precio ?? producto.price ?? producto.valor ?? 0);
    return Number.isFinite(precio) && precio >= 0 ? precio : 0;
}

function obtenerPrecioMayor(producto) {
    const precio = Number(producto.precioMayor ?? 0);
    return Number.isFinite(precio) && precio > 0 ? precio : null;
}

function obtenerCantidadMayor(producto) {
    const cantidad = Number(producto.cantidadMayor ?? 0);
    return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : null;
}

function obtenerNombre(producto) {
    return String(producto.nombre ?? producto.name ?? "Producto sin nombre");
}

function obtenerImagen(producto) {
    return String(producto.imagen ?? producto.image ?? CONFIG.imagenDefecto);
}

function obtenerDescripcion(producto) {
    return String(producto.descripcion ?? producto.descripcionCorta ?? "Producto del catálogo");
}

function obtenerCantidad(producto) {
    const cantidad = Number(producto.cantidad ?? 1);
    if (!Number.isFinite(cantidad)) return 1;
    return Math.max(1, Math.min(CONFIG.maxCantidad, Math.floor(cantidad)));
}

function obtenerIdentificador(producto) {
    const id = producto.id ?? producto.id_producto ?? producto.codigo;
    if (id !== undefined && id !== null && String(id) !== "") return String(id);
    return obtenerNombre(producto).trim().toLowerCase();
}

// 🆕 Función clave para determinar el precio unitario que aplica
function obtenerPrecioReal(producto) {
    const precioNormal = obtenerPrecio(producto);
    const precioMayor = obtenerPrecioMayor(producto);
    const cantMinima = obtenerCantidadMayor(producto);

    if (precioMayor && cantMinima && producto.cantidad >= cantMinima) {
        return precioMayor;
    }
    return precioNormal;
}

function animar(elemento, fotogramas, duracion = 300) {
    if (!elemento || typeof elemento.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    elemento.animate(fotogramas, { duration: duracion, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
}

function notificar(mensaje, tipo = "exito") {
    if (!DOM.notificacion) return;
    DOM.notificacion.textContent = mensaje;
    DOM.notificacion.style.background =
        tipo === "error" ? "#c62828" : tipo === "aviso" ? "#d48806" : "#0f9d63";
    DOM.notificacion.style.display = "block";

    if (DOM.notificacion._temporizador) clearTimeout(DOM.notificacion._temporizador);

    animar(DOM.notificacion, [
        { opacity: 0, transform: "translateY(-10px)" },
        { opacity: 1, transform: "translateY(0)" }
    ], 220);

    DOM.notificacion._temporizador = setTimeout(() => {
        DOM.notificacion.style.display = "none";
    }, 5000);
}

/* =========================================================
   5. ALMACENAMIENTO
========================================================= */
function leerAlmacenamiento() {
    try {
        const claves = [CONFIG.storageKey, ...CONFIG.clavesAlternativas];
        for (const clave of claves) {
            const contenido = localStorage.getItem(clave);
            if (!contenido) continue;

            const datos = JSON.parse(contenido);
            const lista = Array.isArray(datos) ? datos : (datos.productos || datos.items);
            if (lista) return lista;
        }
    } catch (error) {
        console.error("Error leyendo el carrito:", error);
    }
    return [];
}

function guardarAlmacenamiento() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(productos));
        return true;
    } catch (error) {
        console.error("Error guardando el carrito:", error);
        return false;
    }
}

function normalizarProductos(lista) {
    const resultado = [];
    const posiciones = new Map();

    for (const original of lista) {
        if (!original || typeof original !== "object") continue;
        const producto = { ...original };
        const id = obtenerIdentificador(producto);

        producto.id = id;
        producto.nombre = obtenerNombre(producto);
        producto.precio = obtenerPrecio(producto);
        producto.precioMayor = obtenerPrecioMayor(producto); // 🆕 Conservar mayoreo
        producto.cantidadMayor = obtenerCantidadMayor(producto); // 🆕 Conservar mayoreo
        producto.cantidad = obtenerCantidad(producto);
        producto.imagen = obtenerImagen(producto);
        producto.descripcion = obtenerDescripcion(producto);

        if (posiciones.has(id)) {
            const pos = posiciones.get(id);
            resultado[pos].cantidad = Math.min(CONFIG.maxCantidad, resultado[pos].cantidad + producto.cantidad);
        } else {
            posiciones.set(id, resultado.length);
            resultado.push(producto);
        }
    }
    return resultado;
}

/* =========================================================
   6. CÁLCULOS (CON LÓGICA DE MAYOREO)
========================================================= */
function calcularTotales() {
    let subtotal = 0;
    let ahorroTotal = 0;

    productos.forEach(p => {
        const precioNormal = obtenerPrecio(p);
        const precioUnitario = obtenerPrecioReal(p);
        
        subtotal += precioUnitario * p.cantidad;

        if (precioUnitario < precioNormal) {
            ahorroTotal += (precioNormal - precioUnitario) * p.cantidad;
        }
    });

    return { subtotal, ahorroTotal };
}

function calcularCantidadArticulos() {
    return productos.reduce((suma, p) => suma + p.cantidad, 0);
}

function actualizarResumen() {
    const { subtotal, ahorroTotal } = calcularTotales();
    const cantidad = calcularCantidadArticulos();

    if (DOM.subtotal) DOM.subtotal.textContent = dinero(subtotal);
    if (DOM.totalArticulos) DOM.totalArticulos.textContent = cantidad;
    if (DOM.envio) DOM.envio.textContent = "Por confirmar";
    if (DOM.total) DOM.total.textContent = dinero(subtotal);

    // 🆕 Mostrar u ocultar el ahorro por mayoreo
    if (DOM.filaAhorro && DOM.ahorroProductos) {
        if (ahorroTotal > 0) {
            DOM.filaAhorro.style.display = "flex";
            DOM.ahorroProductos.textContent = `-${dinero(ahorroTotal)}`;
        } else {
            DOM.filaAhorro.style.display = "none";
        }
    }

    if (DOM.cantidadProductos) {
        DOM.cantidadProductos.textContent = `${cantidad} ${cantidad === 1 ? "artículo" : "artículos"} en tu carrito`;
    }

    if (DOM.confirmar) DOM.confirmar.disabled = productos.length === 0;
    if (DOM.limpiar) DOM.limpiar.disabled = productos.length === 0;

    if (DOM.vacio) DOM.vacio.hidden = productos.length > 0;
    if (DOM.lista) DOM.lista.hidden = productos.length === 0;
}

/* =========================================================
   7. RENDERIZADO
========================================================= */
function renderizarProductos() {
    if (!DOM.lista) return;

    if (productos.length === 0) {
        DOM.lista.replaceChildren();
        actualizarResumen();
        return;
    }

    DOM.lista.innerHTML = productos.map((p) => {
        const id = escaparHTML(p.id);
        const nombre = escaparHTML(p.nombre);
        const imagen = escaparHTML(p.imagen);
        const descripcion = escaparHTML(p.descripcion);
        
        const precioNormal = obtenerPrecio(p);
        const precioReal = obtenerPrecioReal(p);
        const total = precioReal * p.cantidad;
        const tieneDescuento = precioReal < precioNormal;

        // 🆕 HTML del precio (tachado si tiene descuento)
        const htmlPrecio = tieneDescuento 
            ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 11px; margin-right: 6px;">${dinero(precioNormal)}</span> 
               <strong style="color: var(--verde-oscuro);">${dinero(precioReal)}</strong> <span>/ unidad</span>
               <br><small style="color: var(--verde-oscuro); font-weight: bold;">¡Descuento por mayoreo aplicado!</small>`
            : `${dinero(precioReal)} <span>/ unidad</span>`;

        return `
            <article class="producto-carrito" data-id="${id}">
                <img class="producto-imagen" src="${imagen}" alt="${nombre}" loading="lazy">
                <div class="producto-datos">
                    <h3>${nombre}</h3>
                    <p class="producto-descripcion">${descripcion}</p>
                    <p class="producto-precio">${htmlPrecio}</p>
                </div>
                <div class="producto-controles">
                    <span class="producto-total">${dinero(total)}</span>
                    <div class="control-cantidad">
                        <button type="button" data-accion="restar" data-id="${id}" ${p.cantidad <= 1 ? "disabled" : ""}><i class="fa-solid fa-minus"></i></button>
                        <input type="number" min="1" max="${CONFIG.maxCantidad}" value="${p.cantidad}" data-accion="cantidad" data-id="${id}">
                        <button type="button" data-accion="sumar" data-id="${id}" ${p.cantidad >= CONFIG.maxCantidad ? "disabled" : ""}><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <button type="button" class="producto-eliminar" data-accion="eliminar" data-id="${id}"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                </div>
            </article>
        `;
    }).join("");

    actualizarResumen();
}

/* =========================================================
   8. CANTIDADES
========================================================= */
function buscarProducto(id) {
    return productos.find((p) => String(p.id) === String(id));
}

function modificarCantidad(id, cambio) {
    const p = buscarProducto(id);
    if (!p) return;
    const nueva = p.cantidad + cambio;
    if (nueva < 1 || nueva > CONFIG.maxCantidad) return;
    p.cantidad = nueva;
    guardarAlmacenamiento();
    renderizarProductos();
}

function establecerCantidad(id, valor) {
    const p = buscarProducto(id);
    if (!p) return;
    const val = Number(valor);
    if (!Number.isFinite(val) || val < 1) {
        renderizarProductos();
        return;
    }
    p.cantidad = Math.min(CONFIG.maxCantidad, Math.floor(val));
    guardarAlmacenamiento();
    renderizarProductos();
}

function eliminarProducto(id) {
    productos = productos.filter((p) => String(p.id) !== String(id));
    guardarAlmacenamiento();
    renderizarProductos();
}

function vaciarCarrito() {
    if (productos.length === 0) return;
    if (!confirm("¿Eliminar todos los productos?")) return;
    productos = [];
    guardarAlmacenamiento();
    renderizarProductos();
}

/* =========================================================
   9. EVENTOS DE PRODUCTOS
========================================================= */
function configurarEventosProductos() {
    if (!DOM.lista) return;
    DOM.lista.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-accion]");
        if (!btn) return;
        const accion = btn.dataset.accion;
        const id = btn.dataset.id;
        if (accion === "sumar") modificarCantidad(id, 1);
        if (accion === "restar") modificarCantidad(id, -1);
        if (accion === "eliminar") eliminarProducto(id);
    });
    DOM.lista.addEventListener("change", (e) => {
        const input = e.target.closest('input[data-accion="cantidad"]');
        if (input) establecerCantidad(input.dataset.id, input.value);
    });
}

/* =========================================================
   10. MODAL
========================================================= */
function resetearModal() {
    if (DOM.formulario) DOM.formulario.hidden = false;
    if (DOM.comprobante) DOM.comprobante.hidden = true;
    if (DOM.reciboAcciones) DOM.reciboAcciones.hidden = true;
    if (DOM.volverTienda) DOM.volverTienda.hidden = true;
    if (DOM.cancelarPedido) DOM.cancelarPedido.hidden = true;
    if (DOM.observacionesContenedor) DOM.observacionesContenedor.hidden = true;
    DOM.formConfirmar?.reset();
}

function abrirModal() {
    if (productos.length === 0) return;
    resetearModal();
    DOM.modal.hidden = false;
    modalAbierto = true;
    document.body.classList.add("modal-carrito-abierto");
}

function cerrarModal() {
    if (procesandoPedido) return;
    modalAbierto = false;
    DOM.modal.hidden = true;
    document.body.classList.remove("modal-carrito-abierto");
    resetearModal();
}

function configurarModal() {
    DOM.confirmar?.addEventListener("click", abrirModal);
    DOM.cerrarModal?.addEventListener("click", cerrarModal);
    DOM.limpiar?.addEventListener("click", vaciarCarrito);
    DOM.modal?.addEventListener("click", (e) => {
        if (e.target === DOM.modal) cerrarModal();
    });
    DOM.formConfirmar?.addEventListener("submit", generarReciboDigital);
    DOM.descargarPDF?.addEventListener("click", descargarPDF);
    DOM.enviarCorreo?.addEventListener("click", enviarPedidoPorCorreo);
    DOM.imprimir?.addEventListener("click", imprimirRecibo);
    DOM.volverTienda?.addEventListener("click", regresarTienda);
    DOM.cancelarPedido?.addEventListener("click", cancelarPedido);
}

/* =========================================================
   11. GENERAR RECIBO Y ENVIAR CORREO AUTOMÁTICO
========================================================= */
function generarReciboDigital(e) {
    e.preventDefault();
    if (!DOM.formConfirmar?.reportValidity()) return;

    const { subtotal, ahorroTotal } = calcularTotales();

    const detalle = productos.map((p) => {
        const precioUnitario = obtenerPrecioReal(p);
        return {
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: precioUnitario,
            total: precioUnitario * p.cantidad,
            tieneDescuento: precioUnitario < obtenerPrecio(p) // 🆕 Flag para PDF/Correo
        };
    });

    ultimoRecibo = {
        numero: `PM-${Date.now().toString().slice(-6)}`,
        fecha: new Date().toISOString(),
        cliente: DOM.nombre?.value.trim(),
        correo: DOM.correo?.value.trim(),
        telefono: DOM.telefono?.value.trim(),
        direccion: DOM.direccion?.value.trim(),
        observaciones: DOM.observaciones?.value.trim(),
        productos: detalle,
        subtotal: subtotal,
        ahorro: ahorroTotal,
        total: subtotal // En este caso el total es igual al subtotal porque el envío está por confirmar
    };

    mostrarDatosRecibo(ultimoRecibo);
    DOM.formulario.hidden = true;
    DOM.comprobante.hidden = false;
    DOM.reciboAcciones.hidden = false;
    DOM.volverTienda.hidden = false;
    if (DOM.cancelarPedido) DOM.cancelarPedido.hidden = false;

    // 🆕 DISPARAR EL CORREO AUTOMÁTICAMENTE
    enviarPedidoPorCorreo();
}

function mostrarDatosRecibo(r) {
    DOM.numeroRecibo.textContent = r.numero;
    DOM.fechaRecibo.textContent = formatoFecha.format(new Date(r.fecha));
    DOM.clienteRecibo.textContent = r.cliente;
    DOM.correoRecibo.textContent = r.correo;
    if (DOM.telefonoRecibo) DOM.telefonoRecibo.textContent = r.telefono;
    if (DOM.direccionRecibo) DOM.direccionRecibo.textContent = r.direccion;
    
    // 🆕 Mostrar ahorro en el recibo si existe
    if (DOM.reciboFilaAhorro && DOM.reciboAhorro) {
        if (r.ahorro > 0) {
            DOM.reciboFilaAhorro.style.display = "flex";
            DOM.reciboAhorro.textContent = `-${dinero(r.ahorro)}`;
        } else {
            DOM.reciboFilaAhorro.style.display = "none";
        }
    }

    DOM.subtotalRecibo.textContent = dinero(r.subtotal);
    DOM.totalRecibo.textContent = dinero(r.total);

    DOM.listaRecibo.innerHTML = r.productos.map((p) => `
        <tr>
            <td>${escaparHTML(p.nombre)} ${p.tieneDescuento ? '<br><small style="color: var(--verde-oscuro);">(Precio mayoreo)</small>' : ''}</td>
            <td>${p.cantidad}</td>
            <td>${dinero(p.precio)}</td>
            <td>${dinero(p.total)}</td>
        </tr>
    `).join("");

    if (r.observaciones) {
        DOM.observacionesContenedor.hidden = false;
        DOM.observacionesRecibo.textContent = r.observaciones;
    }
}

/* =========================================================
   12. ENVIAR CORREO (EmailJS) - Manual al cliente
========================================================= */
async function enviarPedidoPorCorreo() {
    if (!ultimoRecibo) return notificar("Genera el recibo primero.", "aviso");

    const btn = DOM.enviarCorreo;
    let textoOriginal = "";
    if (btn) {
        textoOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;
    }

    try {
        const lineasProductos = `
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tbody>
                    ${ultimoRecibo.productos.map((p, i) => `
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                                <strong style="color: #0b2345;">${i + 1}. ${p.nombre}</strong>
                                ${p.tieneDescuento ? '<span style="background: #dcfce9; color: #05603a; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">Mayoreo</span>' : ''}
                                <br>
                                <span style="color: #64748b; font-size: 12px;">Cant: ${p.cantidad} × ${dinero(p.precio)}</span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; color: #079455; font-weight: bold;">
                                ${dinero(p.total)}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        const parametros = {
            numero_pedido: ultimoRecibo.numero,
            fecha: formatoFecha.format(new Date(ultimoRecibo.fecha)),
            cliente: ultimoRecibo.cliente,
            correo_cliente: ultimoRecibo.correo,
            telefono_cliente: ultimoRecibo.telefono,
            direccion_cliente: ultimoRecibo.direccion,
            productos: lineasProductos, 
            subtotal: dinero(ultimoRecibo.subtotal),
            ahorro: ultimoRecibo.ahorro > 0 ? `-${dinero(ultimoRecibo.ahorro)}` : "N/A", // 🆕 Enviar ahorro al correo
            envio: "Por confirmar",
            total: dinero(ultimoRecibo.total),
            observaciones: ultimoRecibo.observaciones || "Ninguna",
            telefono_empresa: "[Ingresar número aquí]" 
        };

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, parametros);

        notificar("✅ Copia enviada al correo del cliente.", "exito");
    } catch (error) {
        console.error("Error EmailJS:", error);
        notificar("No se pudo enviar el correo. Revisa tu conexión.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    }
}

/* =========================================================
   12.1 CANCELAR PEDIDO (Correo y WhatsApp)
========================================================= */
async function cancelarPedido() {
    if (!ultimoRecibo) return notificar("No hay un pedido activo para cancelar.", "aviso");

    const confirmar = window.confirm("¿Estás seguro de que deseas cancelar este pedido? Se vaciará el carrito y se notificará a la empresa.");
    if (!confirmar) return;

    const btn = DOM.cancelarPedido;
    let textoOriginal = "";
    if (btn) {
        textoOriginal = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cancelando...`;
    }

    try {
        const lineasProductos = `
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tbody>
                    ${ultimoRecibo.productos.map((p, i) => `
                        <tr>
                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                                <strong style="color: #0b2345;">${i + 1}. ${p.nombre}</strong><br>
                                <span style="color: #64748b; font-size: 12px;">Cant: ${p.cantidad} × ${dinero(p.precio)}</span>
                            </td>
                            <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0; text-align: right; color: #dc2626; font-weight: bold;">
                                ${dinero(p.total)}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

        const parametros = {
            numero_pedido: ultimoRecibo.numero,
            fecha: formatoFecha.format(new Date()),
            cliente: ultimoRecibo.cliente,
            correo_cliente: ultimoRecibo.correo,
            telefono_cliente: ultimoRecibo.telefono,
            direccion_cliente: ultimoRecibo.direccion,
            productos: lineasProductos,
            total: dinero(ultimoRecibo.total),
            motivo: "El cliente solicitó la cancelación desde la página web.",
            telefono_empresa: "[Ingresar número aquí]"
        };

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CANCEL, parametros);

        const mensajeWa = encodeURIComponent(
            `Hola, te informamos que el pedido #${ultimoRecibo.numero} del cliente ${ultimoRecibo.cliente} ha sido CANCELADO.`
        );
        
        const urlWa = CONFIG.numeroWhatsapp 
            ? `https://wa.me/${CONFIG.numeroWhatsapp}?text=${mensajeWa}`
            : `https://wa.me/?text=${mensajeWa}`;
            
        window.open(urlWa, "_blank");

        notificar("El pedido ha sido cancelado y notificado.", "exito");

        productos = [];
        guardarAlmacenamiento();
        renderizarProductos();
        ultimoRecibo = null;
        cerrarModal();
        
        setTimeout(() => {
            regresarTienda();
        }, 2000);

    } catch (error) {
        console.error("Error al cancelar pedido:", error);
        notificar("Hubo un error al cancelar, pero el carrito se ha vaciado.", "error");
        productos = [];
        guardarAlmacenamiento();
        renderizarProductos();
        cerrarModal();
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    }
}

/* =========================================================
   13. DESCARGAR PDF
========================================================= */
function descargarPDF() {
    if (!ultimoRecibo) return notificar("Genera el recibo primero.", "aviso");
    if (!window.jspdf?.jsPDF) return notificar("Librería PDF no cargada.", "error");

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: "mm", format: "a4" });
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(20);
        pdf.text("PROCESADOS MARGARITA S.A.S.", 105, 20, { align: "center" });
        
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text("Comprobante de Pedido", 105, 30, { align: "center" });

        pdf.setFontSize(10);
        pdf.text(`Pedido: ${ultimoRecibo.numero}`, 14, 45);
        pdf.text(`Fecha: ${formatoFecha.format(new Date(ultimoRecibo.fecha))}`, 14, 52);
        pdf.text(`Cliente: ${ultimoRecibo.cliente}`, 14, 59);
        pdf.text(`Correo: ${ultimoRecibo.correo}`, 14, 66);
        pdf.text(`Teléfono: ${ultimoRecibo.telefono}`, 14, 73);
        pdf.text(`Dirección: ${ultimoRecibo.direccion}`, 14, 80);

        const filas = ultimoRecibo.productos.map(p => [
            p.nombre + (p.tieneDescuento ? " (Mayoreo)" : ""), // 🆕 Indicador en PDF
            p.cantidad, 
            dinero(p.precio), 
            dinero(p.total)
        ]);
        
        pdf.autoTable({
            startY: 88,
            head: [["Producto", "Cantidad", "Precio", "Total"]],
            body: filas,
            theme: "grid",
            headStyles: { fillColor: [15, 39, 68] }
        });

        let y = pdf.lastAutoTable.finalY + 15;
        pdf.setFontSize(11);
        pdf.text(`Subtotal: ${dinero(ultimoRecibo.subtotal)}`, 140, y);
        
        // 🆕 Mostrar ahorro en PDF
        if (ultimoRecibo.ahorro > 0) {
            y += 7;
            pdf.setTextColor(5, 96, 58); // Verde oscuro
            pdf.text(`Ahorro por mayoreo: -${dinero(ultimoRecibo.ahorro)}`, 140, y);
            pdf.setTextColor(0, 0, 0); // Volver a negro
        }
        
        y += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(`TOTAL: ${dinero(ultimoRecibo.total)}`, 140, y);
        
        y += 20;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text("Contacto: Procesados Margarita S.A.S. - Bogotá", 14, y);
        pdf.text("Teléfono: [Ingresar número aquí]", 14, y + 5);

        pdf.save(`Pedido_${ultimoRecibo.numero}.pdf`);
        notificar("PDF descargado.", "exito");
    } catch (err) {
        console.error(err);
        notificar("Error al crear el PDF.", "error");
    }
}

/* =========================================================
   14. IMPRIMIR
========================================================= */
function imprimirRecibo() {
    if (!DOM.comprobante || DOM.comprobante.hidden) return;
    const ventana = window.open("", "_blank");
    ventana.document.write(`
        <html>
            <head>
                <title>Recibo</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                </style>
            </head>
            <body onload="window.print()">
                ${DOM.comprobante.outerHTML}
            </body>
        </html>
    `);
    ventana.document.close();
}

/* =========================================================
   15. VOLVER
========================================================= */
function regresarTienda() {
    window.location.href = "tienda.html";
}

/* =========================================================
   16. INICIALIZACIÓN
========================================================= */
function iniciarCarrito() {
    if (eventosConfigurados) return;
    eventosConfigurados = true;

    productos = normalizarProductos(leerAlmacenamiento());
    renderizarProductos();
    configurarEventosProductos();
    configurarModal();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarCarrito, { once: true });
} else {
    iniciarCarrito();
}