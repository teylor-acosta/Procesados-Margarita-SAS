
(function() {
    "use strict";

    // ✅ Verificamos si ya se inicializó para evitar errores de duplicación
    if (window.__carritoJS_loaded) return;
    window.__carritoJS_loaded = true;

    /* =========================================================
       1. CONFIGURACIÓN
    ========================================================= */
    const CONFIG = {
        storageKey: "carrito_margarita_v1",
        clavesAlternativas: ["carrito", "carritoCompras", "cart"],
        idioma: "es-CO",
        moneda: "COP",
        maxCantidad: 999999,
        imagenDefecto: "img/productos_ejemplos/operarios_1.png"
    };

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
       2. REFERENCIAS DEL DOM
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
        filaAhorro: $("fila-ahorro"),
        ahorroProductos: $("ahorro-productos"),
        avisoMateriales: $("aviso-materiales-carrito"),
        limpiar: $("btn-limpiar"),
        confirmar: $("btn-confirmar"),
        modal: $("modal-pedido"),
        cerrarModal: $("btn-cerrar-modal"),
        formulario: $("formulario-pedido"),
        formConfirmar: $("form-confirmar"),
        nombre: $("nombre-cliente"),
        correo: $("correo-cliente"),
        telefono: $("telefono-cliente"),
        observaciones: $("observaciones"),
        comprobante: $("comprobante"),
        numeroRecibo: $("recibo-numero"),
        fechaRecibo: $("recibo-fecha"),
        clienteRecibo: $("recibo-cliente"),
        correoRecibo: $("recibo-correo"),
        telefonoRecibo: $("recibo-telefono"),
        listaRecibo: $("recibo-lista-productos"),
        subtotalRecibo: $("recibo-subtotal"),
        envioRecibo: $("recibo-envio"),
        totalRecibo: $("recibo-total"),
        reciboFilaAhorro: $("recibo-fila-ahorro"),
        reciboAhorro: $("recibo-ahorro"),
        reciboAvisoMateriales: $("recibo-aviso-materiales"),
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
    let procesandoPedido = false;
    let eventosConfigurados = false;

    /* =========================================================
       4. UTILIDADES
    ========================================================= */
    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
            const entidades = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
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

    function esMaterial(producto) {
        if (!producto) return false;
        if (producto.tipo === "material") return true;
        return String(producto.id ?? "").startsWith("10");
    }

    function calcularPrecioItem(precioUnitario, precioMayor, cantidadMayor, cantidad) {
        const unitario = Number(precioUnitario) || 0;
        const mayor = Number(precioMayor) || 0;
        const umbral = Number(cantidadMayor) || 0;
        const cant = Math.max(0, Math.floor(Number(cantidad) || 0));

        if (mayor <= 0 || umbral <= 0 || cant < umbral) {
            return { total: unitario * cant, aplicaMayoreo: false, precioUnitarioEfectivo: unitario, ahorro: 0 };
        }

        const bloques = Math.floor(cant / umbral);
        const sobrante = cant % umbral;
        const total = bloques * mayor + sobrante * unitario;
        const ahorro = unitario * cant - total;

        return { total, aplicaMayoreo: true, precioUnitarioEfectivo: total / cant, ahorro: ahorro > 0 ? ahorro : 0 };
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
                if (lista && Array.isArray(lista)) return lista;
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
            producto.precioMayor = obtenerPrecioMayor(producto);
            producto.cantidadMayor = obtenerCantidadMayor(producto);
            producto.cantidad = obtenerCantidad(producto);
            producto.imagen = obtenerImagen(producto);
            producto.descripcion = obtenerDescripcion(producto);
            
            if (original.tipo === "material" || original.tipo === "producto") {
                producto.tipo = original.tipo;
            } else {
                producto.tipo = esMaterial(producto) ? "material" : "producto";
            }

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
       6. CÁLCULOS Y RENDER
    ========================================================= */
    function calcularTotales() {
        let subtotal = 0;
        let ahorroTotal = 0;
        let tieneMateriales = false;

        productos.forEach(p => {
            if (p.tipo === "material") { tieneMateriales = true; return; }
            const r = calcularPrecioItem(p.precio, p.precioMayor, p.cantidadMayor, p.cantidad);
            subtotal += r.total;
            ahorroTotal += r.ahorro;
        });

        return { subtotal, ahorroTotal, tieneMateriales };
    }

    function calcularCantidadArticulos() {
        return productos.reduce((suma, p) => suma + p.cantidad, 0);
    }

    function actualizarResumen() {
        const { subtotal, ahorroTotal, tieneMateriales } = calcularTotales();
        const cantidad = calcularCantidadArticulos();

        if (DOM.subtotal) DOM.subtotal.textContent = dinero(subtotal);
        if (DOM.totalArticulos) DOM.totalArticulos.textContent = cantidad;
        if (DOM.envio) DOM.envio.textContent = "Por confirmar";
        if (DOM.total) DOM.total.textContent = dinero(subtotal);

        if (DOM.filaAhorro && DOM.ahorroProductos) {
            if (ahorroTotal > 0) {
                DOM.filaAhorro.style.display = "flex";
                DOM.ahorroProductos.textContent = `-${dinero(ahorroTotal)}`;
            } else {
                DOM.filaAhorro.style.display = "none";
            }
        }

        if (DOM.avisoMateriales) DOM.avisoMateriales.style.display = tieneMateriales ? "flex" : "none";

        if (DOM.cantidadProductos) {
            DOM.cantidadProductos.textContent = `${cantidad} ${cantidad === 1 ? "artículo" : "artículos"} en tu carrito`;
        }

        if (DOM.confirmar) DOM.confirmar.disabled = productos.length === 0;
        if (DOM.limpiar) DOM.limpiar.disabled = productos.length === 0;

        if (DOM.vacio) DOM.vacio.hidden = productos.length > 0;
        if (DOM.lista) DOM.lista.hidden = productos.length === 0;
    }

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
            
            if (p.tipo === "material") {
                return `
                    <article class="producto-carrito" data-id="${id}">
                        <img class="producto-imagen" src="${imagen}" alt="${nombre}" loading="lazy">
                        <div class="producto-datos">
                            <h3>${nombre}</h3>
                            <p class="producto-descripcion">${descripcion}</p>
                            <p class="producto-precio" style="color: var(--azul-medio); font-weight: 700;">
                                <i class="fa-solid fa-file-invoice-dollar"></i> Requiere cotización
                            </p>
                        </div>
                        <div class="producto-controles">
                            <span class="producto-total" style="color: var(--azul-medio); font-size: 16px;">Por cotizar</span>
                            <div class="control-cantidad">
                                <button type="button" data-accion="restar" data-id="${id}" ${p.cantidad <= 1 ? "disabled" : ""}><i class="fa-solid fa-minus"></i></button>
                                <input type="number" min="1" max="${CONFIG.maxCantidad}" value="${p.cantidad}" data-accion="cantidad" data-id="${id}">
                                <button type="button" data-accion="sumar" data-id="${id}" ${p.cantidad >= CONFIG.maxCantidad ? "disabled" : ""}><i class="fa-solid fa-plus"></i></button>
                            </div>
                            <button type="button" class="producto-eliminar" data-accion="eliminar" data-id="${id}"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                        </div>
                    </article>
                `;
            }

            const r = calcularPrecioItem(p.precio, p.precioMayor, p.cantidadMayor, p.cantidad);
            const htmlPrecio = r.aplicaMayoreo 
                ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 11px; margin-right: 6px;">${dinero(p.precio)}</span> 
                   <strong style="color: var(--verde-oscuro);">${dinero(r.precioUnitarioEfectivo)}</strong> <span>/ unidad</span>
                   <br><small style="color: var(--verde-oscuro); font-weight: bold;">¡Descuento por mayoreo aplicado!</small>`
                : `${dinero(r.precioUnitarioEfectivo)} <span>/ unidad</span>`;

            return `
                <article class="producto-carrito" data-id="${id}">
                    <img class="producto-imagen" src="${imagen}" alt="${nombre}" loading="lazy">
                    <div class="producto-datos">
                        <h3>${nombre}</h3>
                        <p class="producto-descripcion">${descripcion}</p>
                        <p class="producto-precio">${htmlPrecio}</p>
                    </div>
                    <div class="producto-controles">
                        <span class="producto-total">${dinero(r.total)}</span>
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
       7. CONTROL DE CANTIDADES Y EVENTOS
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
        if (!Number.isFinite(val) || val < 1) { renderizarProductos(); return; }
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
       8. MODAL Y RECIBO
    ========================================================= */
    function resetearModal() {
        if (DOM.formulario) DOM.formulario.hidden = false;
        if (DOM.comprobante) DOM.comprobante.hidden = true;
        if (DOM.reciboAcciones) DOM.reciboAcciones.hidden = true;
        if (DOM.volverTienda) DOM.volverTienda.hidden = true;
        if (DOM.cancelarPedido) DOM.cancelarPedido.hidden = true;
        if (DOM.observacionesContenedor) DOM.observacionesContenedor.hidden = true;
        if (DOM.reciboAvisoMateriales) DOM.reciboAvisoMateriales.style.display = "none";
        DOM.formConfirmar?.reset();
    }

    function abrirModal() {
        if (productos.length === 0) return;
        resetearModal();
        DOM.modal.hidden = false;
        document.body.classList.add("modal-carrito-abierto");
    }

    function cerrarModal() {
        if (procesandoPedido) return;
        DOM.modal.hidden = true;
        document.body.classList.remove("modal-carrito-abierto");
        resetearModal();
    }

    function configurarModal() {
        DOM.confirmar?.addEventListener("click", abrirModal);
        DOM.cerrarModal?.addEventListener("click", cerrarModal);
        DOM.limpiar?.addEventListener("click", vaciarCarrito);
        DOM.modal?.addEventListener("click", (e) => { if (e.target === DOM.modal) cerrarModal(); });
        DOM.formConfirmar?.addEventListener("submit", generarReciboDigital);
        DOM.descargarPDF?.addEventListener("click", descargarPDF);
        DOM.imprimir?.addEventListener("click", imprimirRecibo);
        DOM.volverTienda?.addEventListener("click", regresarTienda);
        DOM.cancelarPedido?.addEventListener("click", cancelarPedido);
    }

    async function generarReciboDigital(e) {
        e.preventDefault();
        if (!DOM.formConfirmar?.reportValidity()) return;
        if (procesandoPedido) return;

        procesandoPedido = true;
        const btnSubmit = DOM.formConfirmar.querySelector('button[type="submit"]');
        let textoOriginal = "";
        if (btnSubmit) {
            textoOriginal = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando...`;
        }

        const { subtotal, ahorroTotal, tieneMateriales } = calcularTotales();
        const productosDetalle = [];
        const materialesDetalle = [];

        productos.forEach((p) => {
            const r = calcularPrecioItem(p.precio, p.precioMayor, p.cantidadMayor, p.cantidad);
            if (p.tipo === "material") {
                materialesDetalle.push({ id: p.id, nombre: p.nombre, cantidad: p.cantidad, unidad: "Kg/Unidades", tipo: "material" });
            } else {
                productosDetalle.push({ id: p.id, nombre: p.nombre, cantidad: p.cantidad, precio: r.precioUnitarioEfectivo, total: r.total, tieneDescuento: r.aplicaMayoreo });
            }
        });

        ultimoRecibo = {
            numero: `PM-${Date.now().toString().slice(-6)}`,
            fecha: new Date().toISOString(),
            cliente: DOM.nombre?.value.trim(),
            correo: DOM.correo?.value.trim(),
            telefono: DOM.telefono?.value.trim(),
            observaciones: DOM.observaciones?.value.trim(),
            productos: productosDetalle,
            materiales: materialesDetalle,
            subtotal: subtotal,
            ahorro: ahorroTotal,
            total: subtotal,
            tieneMateriales: tieneMateriales
        };

        mostrarDatosRecibo(ultimoRecibo);
        DOM.formulario.hidden = true;
        DOM.comprobante.hidden = false;
        DOM.reciboAcciones.hidden = false;
        DOM.volverTienda.hidden = false;
        if (DOM.cancelarPedido) DOM.cancelarPedido.hidden = false;

        try {
            const respuesta = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ultimoRecibo)
            });
            const resultado = await respuesta.json();
            if (resultado.ok) {
                ultimoRecibo.numero = resultado.numero_pedido;
                DOM.numeroRecibo.textContent = ultimoRecibo.numero;
                notificar(`✅ Pedido #${ultimoRecibo.numero} registrado. Correo enviado.`, "exito");
            } else {
                notificar("Hubo un problema al registrar el pedido en el servidor.", "error");
            }
        } catch (error) {
            console.error("Error enviando al servidor:", error);
            notificar("Error de conexión con el servidor.", "error");
        } finally {
            procesandoPedido = false;
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = textoOriginal; }
        }
    }

    function mostrarDatosRecibo(r) {
        DOM.numeroRecibo.textContent = r.numero;
        DOM.fechaRecibo.textContent = formatoFecha.format(new Date(r.fecha));
        DOM.clienteRecibo.textContent = r.cliente;
        DOM.correoRecibo.textContent = r.correo;
        if (DOM.telefonoRecibo) DOM.telefonoRecibo.textContent = r.telefono;
        
        if (DOM.reciboFilaAhorro && DOM.reciboAhorro) {
            if (r.ahorro > 0) { DOM.reciboFilaAhorro.style.display = "flex"; DOM.reciboAhorro.textContent = `-${dinero(r.ahorro)}`; }
            else { DOM.reciboFilaAhorro.style.display = "none"; }
        }

        if (DOM.reciboAvisoMateriales) DOM.reciboAvisoMateriales.style.display = r.tieneMateriales ? "flex" : "none";

        DOM.subtotalRecibo.textContent = dinero(r.subtotal);
        DOM.totalRecibo.textContent = dinero(r.total);

        let htmlFilas = "";
        r.productos.forEach((p) => {
            htmlFilas += `
                <tr>
                    <td>${escaparHTML(p.nombre)} ${p.tieneDescuento ? '<br><small style="color: var(--verde-oscuro);">(Precio mayoreo)</small>' : ''}</td>
                    <td>${p.cantidad}</td><td>${dinero(p.precio)}</td><td>${dinero(p.total)}</td>
                </tr>`;
        });

        r.materiales.forEach((m) => {
            htmlFilas += `
                <tr>
                    <td>${escaparHTML(m.nombre)} <br><small style="color: var(--azul-medio); font-weight: 700;"><i class="fa-solid fa-file-invoice-dollar"></i> Requiere cotización</small></td>
                    <td>${m.cantidad}</td><td style="color: var(--azul-medio); font-weight: 600;">Por cotizar</td><td style="color: var(--azul-medio); font-weight: 600;">Por cotizar</td>
                </tr>`;
        });

        DOM.listaRecibo.innerHTML = htmlFilas;

        if (r.observaciones) {
            DOM.observacionesContenedor.hidden = false;
            DOM.observacionesRecibo.textContent = r.observaciones;
        }
    }

    /* =========================================================
       9. PDF, IMPRIMIR, CANCELAR
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

            if (ultimoRecibo.tieneMateriales) {
                pdf.setTextColor(21, 94, 239);
                pdf.setFont("helvetica", "bold");
                pdf.text("Este pedido incluye materiales que serán cotizados.", 14, 83);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0, 0, 0);
            }

            const filas = [];
            ultimoRecibo.productos.forEach((p) => {
                filas.push([ p.nombre + (p.tieneDescuento ? " (Mayoreo)" : ""), p.cantidad, dinero(p.precio), dinero(p.total) ]);
            });
            ultimoRecibo.materiales.forEach((m) => {
                filas.push([ m.nombre + " (Requiere cotización)", m.cantidad, "Por cotizar", "Por cotizar" ]);
            });
            
            pdf.autoTable({
                startY: ultimoRecibo.tieneMateriales ? 90 : 80,
                head: [["Producto", "Cantidad", "Precio", "Total"]],
                body: filas,
                theme: "grid",
                headStyles: { fillColor: [15, 39, 68] }
            });

            let y = pdf.lastAutoTable.finalY + 15;
            pdf.setFontSize(11);
            pdf.text(`Subtotal (Productos): ${dinero(ultimoRecibo.subtotal)}`, 140, y);
            
            if (ultimoRecibo.ahorro > 0) {
                y += 7;
                pdf.setTextColor(5, 96, 58);
                pdf.text(`Ahorro por mayoreo: -${dinero(ultimoRecibo.ahorro)}`, 140, y);
                pdf.setTextColor(0, 0, 0);
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

    function imprimirRecibo() {
        if (!DOM.comprobante || DOM.comprobante.hidden) return;
        const ventana = window.open("", "_blank");
        ventana.document.write(`
            <html>
                <head>
                    <title>Recibo</title>
                    <style> body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; } </style>
                </head>
                <body onload="window.print()">${DOM.comprobante.outerHTML}</body>
            </html>
        `);
        ventana.document.close();
    }

    async function cancelarPedido() {
        if (!ultimoRecibo) return notificar("No hay un pedido activo para cancelar.", "aviso");
        const confirmar = window.confirm("¿Estás seguro de que deseas cancelar este pedido? Se vaciará el carrito.");
        if (!confirmar) return;

        const btn = DOM.cancelarPedido;
        let textoOriginal = "";
        if (btn) { textoOriginal = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Cancelando...`; }

        try {
            await fetch('/api/cancelar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero_pedido: ultimoRecibo.numero, motivo: "El cliente solicitó la cancelación desde la página web." }) });
            productos = [];
            guardarAlmacenamiento();
            renderizarProductos();
            ultimoRecibo = null;
            cerrarModal();
            notificar("El pedido ha sido cancelado.", "exito");
            setTimeout(() => { regresarTienda(); }, 2000);
        } catch (error) {
            console.error("Error al cancelar pedido:", error);
            notificar("Hubo un error al notificar al servidor, pero el carrito se ha vaciado.", "error");
            productos = [];
            guardarAlmacenamiento();
            renderizarProductos();
            cerrarModal();
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal; }
        }
    }

    function regresarTienda() {
        window.location.href = "tienda.html";
    }

    function notificar(mensaje, tipo = "exito") {
        if (!DOM.notificacion) return;
        DOM.notificacion.textContent = mensaje;
        DOM.notificacion.style.background = tipo === "error" ? "#c62828" : "#0f9d63";
        DOM.notificacion.style.display = "block";
        if (DOM.notificacion._t) clearTimeout(DOM.notificacion._t);
        DOM.notificacion._t = setTimeout(() => { DOM.notificacion.style.display = "none"; }, 4000);
    }

    /* =========================================================
       10. INICIALIZACIÓN
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
})();