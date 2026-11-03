

(function () {
  "use strict";

  // Verificar núcleo del chatbot
  if (!window.ChatbotCore) {
    console.error("❌ ChatbotCore no está inicializado. Carga chatbot.js antes que este archivo.");
    return;
  }

  /* =========================================
     CONFIGURACIÓN COMPARTIDA
     ========================================= */
  const CFG = window.ChatbotCore.CONFIG || {};
  const CARGOS = (CFG.cargos && CFG.cargos.length)
    ? CFG.cargos
    : ["Aprendiz SENA", "Operario de planta", "Conductor", "Auxiliar administrativo",
       "Auxiliar de logística", "Profesional en SST", "Coordinador de producción", "Otro"];

  const PlantillasFormularios = {

    /* =========================================
       1) SOPORTE TÉCNICO
       ========================================= */
    soporte: `
      <div class="chat-form-container" id="form-soporte">
        <h4>🛠️ Reportar problema técnico</h4>

        <div class="chat-form-group">
          <label>Nombre completo *</label>
          <input type="text" id="sop-nombre" placeholder="Ej: Juan Pérez" required>
        </div>

        <div class="chat-form-group">
          <label>Correo de contacto *</label>
          <input type="email" id="sop-correo" placeholder="tucorreo@ejemplo.com" required>
        </div>

        <div class="chat-form-group">
          <label>Teléfono (opcional)</label>
          <input type="tel" id="sop-telefono" placeholder="Ej: 300 123 4567">
        </div>

        <div class="chat-form-group">
          <label>¿Qué está fallando en la página? *</label>
          <textarea id="sop-descripcion" rows="3" placeholder="Ej: No puedo iniciar sesión, la página se queda en blanco..." required></textarea>
        </div>

        <button type="button" class="chat-form-submit" onclick="enviarFormularioChat('soporte')">
          Enviar reporte
        </button>
      </div>
    `,

    /* =========================================
       2) TRABAJA CON NOSOTROS
       ========================================= */
    empleo: `
      <div class="chat-form-container" id="form-empleo">
        <h4>💼 Postulación laboral</h4>

        <div class="chat-form-group">
          <label>Nombre completo *</label>
          <input type="text" id="emp-nombre" placeholder="Tu nombre" required>
        </div>

        <div class="chat-form-group">
          <label>Correo de contacto *</label>
          <input type="email" id="emp-correo" placeholder="tucorreo@ejemplo.com" required>
        </div>

        <div class="chat-form-group">
          <label>Teléfono *</label>
          <input type="tel" id="emp-telefono" placeholder="Ej: 300 123 4567" required>
        </div>

        <div class="chat-form-group">
          <label>Cargo al que aspiras *</label>
          <select id="emp-cargo" required>
            <option value="">Selecciona un cargo...</option>
            ${CARGOS.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>

        <div class="chat-form-group">
          <label>Adjunta tu hoja de vida (PDF) *</label>
          <input type="file" id="emp-cv" accept=".pdf,.doc,.docx" required>
        </div>

        <button type="button" class="chat-form-submit" onclick="enviarFormularioChat('empleo')">
          Enviar postulación
        </button>
      </div>
    `,

    /* =========================================
       3) PROGRAMAR RECOLECCIÓN
       ========================================= */
    recoleccion: `
      <div class="chat-form-container" id="form-recoleccion">
        <h4>🚚 Programar recolección</h4>

        <div class="chat-form-group">
          <label>Nombre de contacto *</label>
          <input type="text" id="rec-nombre" placeholder="Tu nombre" required>
        </div>

        <div class="chat-form-group">
          <label>Teléfono *</label>
          <input type="tel" id="rec-telefono" placeholder="Ej: 300 123 4567" required>
        </div>

        <div class="chat-form-group">
          <label>Dirección de recolección *</label>
          <input type="text" id="rec-direccion" placeholder="Calle, Carrera, Ciudad" required>
        </div>

        <div class="chat-form-group">
          <label>Fecha requerida *</label>
          <input type="date" id="rec-fecha" required>
        </div>

        <div class="chat-form-group">
          <label>Hora aproximada *</label>
          <input type="time" id="rec-hora" required>
        </div>

        <div class="chat-form-group">
          <label>Cantidad de vehículos/unidades *</label>
          <input type="number" id="rec-cantidad" placeholder="Ej: 2" min="1" required>
        </div>

        <div class="chat-form-group">
          <label>Observaciones (opcional)</label>
          <textarea id="rec-observaciones" rows="2" placeholder="Ej: Acceso por la puerta lateral..."></textarea>
        </div>

        <button type="button" class="chat-form-submit" onclick="enviarFormularioChat('recoleccion')">
          Solicitar vehículo
        </button>
      </div>
    `,

    /* =========================================
       4) OPINIONES / CALIFICACIÓN
       ========================================= */
    calificacion: `
      <div class="chat-form-container" id="form-calificacion">
        <h4>⭐ Opiniones del servicio</h4>

        <div class="chat-form-group">
          <label>Calificación del servicio *</label>
          <select id="cal-servicio" required>
            <option value="5">⭐⭐⭐⭐⭐ (Excelente)</option>
            <option value="4">⭐⭐⭐⭐ (Muy bueno)</option>
            <option value="3">⭐⭐⭐ (Bueno)</option>
            <option value="2">⭐⭐ (Regular)</option>
            <option value="1">⭐ (Malo)</option>
          </select>
        </div>

        <div class="chat-form-group">
          <label>Nombre del conductor (si aplica)</label>
          <input type="text" id="cal-conductor" placeholder="Nombre del conductor">
        </div>

        <div class="chat-form-group">
          <label>Opinión sobre el conductor</label>
          <select id="cal-conductor-rating">
            <option value="5">⭐⭐⭐⭐⭐ (Excelente)</option>
            <option value="4">⭐⭐⭐⭐ (Muy bueno)</option>
            <option value="3">⭐⭐⭐ (Bueno)</option>
            <option value="2">⭐⭐ (Regular)</option>
            <option value="1">⭐ (Malo)</option>
          </select>
        </div>

        <div class="chat-form-group">
          <label>Comentarios</label>
          <textarea id="cal-comentario" rows="3" placeholder="¿Qué podemos mejorar?"></textarea>
        </div>

        <div class="chat-form-group">
          <label>Tu nombre (opcional)</label>
          <input type="text" id="cal-nombre" placeholder="Tu nombre">
        </div>

        <button type="button" class="chat-form-submit" onclick="enviarFormularioChat('calificacion')">
          Enviar opinión
        </button>
      </div>
    `,

    /* =========================================
       5) ACTAS DE APROVECHAMIENTO
       ========================================= */
    acta: `
      <div class="chat-form-container" id="form-acta">
        <h4>📄 Solicitar acta de aprovechamiento</h4>

        <div class="chat-form-group">
          <label>Mes solicitado *</label>
          <input type="month" id="act-mes" required>
        </div>

        <div class="chat-form-group">
          <label>Empresa *</label>
          <input type="text" id="act-empresa" placeholder="Nombre de la empresa" required>
        </div>

        <div class="chat-form-group">
          <label>Sede *</label>
          <input type="text" id="act-sede" placeholder="Ej: Sede Principal" required>
        </div>

        <div class="chat-form-group">
          <label>Nombre del solicitante *</label>
          <input type="text" id="act-solicitante" placeholder="Tu nombre" required>
        </div>

        <div class="chat-form-group">
          <label>Correo donde deseas recibirla *</label>
          <input type="email" id="act-correo" placeholder="tucorreo@ejemplo.com" required>
        </div>

        <button type="button" class="chat-form-submit" onclick="enviarFormularioChat('acta')">
          Solicitar acta
        </button>
      </div>
    `,

    /* =========================================
       6) RETENCIONES (ReteFuente / ReteICA)
       ========================================= */
    retencion: `
      <div class="chat-form-container" id="form-retencion">
        <h4>🧾 Solicitud de retención</h4>

        <div class="chat-form-group">
          <label>Tipo de retención *</label>
          <select id="ret-tipo" required>
            <option value="">Selecciona...</option>
            <option value="ReteFuente">ReteFuente</option>
            <option value="ReteICA">ReteICA</option>
          </select>
        </div>

        <div class="chat-form-group">
          <label>Periodo (mes/año) *</label>
          <input type="month" id="ret-periodo" required>
        </div>

        <div class="chat-form-group">
          <label>Nombre de la empresa *</label>
          <input type="text" id="ret-empresa" placeholder="Nombre de la empresa" required>
        </div>

        <div class="chat-form-group">
          <label>Nombre del solicitante *</label>
          <input type="text" id="ret-solicitante" placeholder="Tu nombre" required>
        </div>

        <div class="chat-form-group">
          <label>Correo donde deseas recibirla *</label>
          <input type="email" id="ret-correo" placeholder="tucorreo@ejemplo.com" required>
        </div>

        <button type="button" class="chat-form-submit" onclick="enviarFormularioChat('retencion')">
          Solicitar retención
        </button>
      </div>
    `
  };

  /* =========================================
     EXPORTAR PLANTILLAS
     ========================================= */
  window.PlantillasFormularios = PlantillasFormularios;

  console.log("📝 Plantillas de formularios cargadas:", Object.keys(PlantillasFormularios));

})();

(function () {
  "use strict";

  const { MotorChat, CONFIG } = window.ChatbotCore || {};
  if (!MotorChat) {
    console.error("❌ MotorChat no disponible. Carga chatbot.js antes.");
    return;
  }

  /* =========================================
     1. CORREOS DESTINO POR TIPO DE FORMULARIO
     ========================================= */
  const CORREOS = (CONFIG && CONFIG.correos) || {
    solicitudes:    "solicitudes@procesadosmargaritasas.com",
    asesorProducto: "asesor.producto@procesadosmargaritasas.com",
    asesorMaterial: "asesor.material@procesadosmargaritasas.com",
    soporteTecnico: "soporte@procesadosmargaritasas.com",
    talentoHumano:  "talento@procesadosmargaritasas.com",
    logistica:      "logistica@procesadosmargaritasas.com"
  };

  const DESTINO_POR_TIPO = {
    soporte:      CORREOS.soporteTecnico,
    empleo:       CORREOS.talentoHumano,
    recoleccion:  CORREOS.logistica,
    calificacion: CORREOS.solicitudes,
    acta:         CORREOS.solicitudes,
    retencion:    CORREOS.solicitudes
  };

  const ASUNTO_POR_TIPO = {
    soporte:      "🛠️ Reporte de soporte técnico",
    empleo:       "💼 Nueva postulación laboral",
    recoleccion:  "🚚 Solicitud de recolección",
    calificacion: "⭐ Opinión del servicio",
    acta:         "📄 Solicitud de acta de aprovechamiento",
    retencion:    "🧾 Solicitud de retención"
  };

  /* =========================================
     2. HELPERS DE VALIDACIÓN
     ========================================= */
  const esEmailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function marcarError(input, msj) {
    input.style.borderColor = "#ef4444";
    input.style.background  = "#fef2f2";
    input.title = msj || "Campo inválido";
  }

  function limpiarError(input) {
    input.style.borderColor = "";
    input.style.background  = "";
    input.title = "";
  }

  /* =========================================
     3. RECOLECCIÓN DE DATOS DEL FORMULARIO
     ========================================= */
  function recolectarDatos(contenedor) {
    const datos = {};
    let archivo = null;
    let valido = true;
    let primerError = null;

    contenedor.querySelectorAll("input, select, textarea").forEach((el) => {
      if (!el.id) return;
      limpiarError(el);

      const requerido = el.hasAttribute("required");
      const tipo = el.type;

      // Archivos
      if (tipo === "file") {
        const f = el.files && el.files[0];
        if (requerido && !f) {
          marcarError(el, "Debes adjuntar un archivo");
          valido = false;
          primerError = primerError || el;
        }
        if (f) archivo = f;
        datos[el.id] = f ? f.name : "";
        return;
      }

      const valor = (el.value || "").trim();

      // Requerido
      if (requerido && !valor) {
        marcarError(el, "Este campo es obligatorio");
        valido = false;
        primerError = primerError || el;
        return;
      }

      // Validación de email
      if (tipo === "email" && valor && !esEmailValido(valor)) {
        marcarError(el, "Correo inválido");
        valido = false;
        primerError = primerError || el;
        return;
      }

      datos[el.id] = valor;
    });

    return { datos, archivo, valido, primerError };
  }

  /* =========================================
     4. CONSTRUCCIÓN DEL CUERPO DEL CORREO
     ========================================= */
  function formatearCuerpo(tipo, datos) {
    const lineas = [
      `Formulario: ${ASUNTO_POR_TIPO[tipo] || tipo}`,
      `Fecha: ${new Date().toLocaleString("es-CO")}`,
      "----------------------------------------"
    ];
    Object.entries(datos).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) {
        lineas.push(`${k}: ${v}`);
      }
    });
    return lineas.join("\n");
  }

  /* =========================================
     5. ENVÍO AL BACKEND (con FormData)
     ========================================= */
  async function enviarAlBackend(tipo, datos, archivo) {
    const endpoint = "/api/contacto"; // ← cambia si tu backend usa otra ruta

    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("correoDestino", DESTINO_POR_TIPO[tipo] || CORREOS.solicitudes);
    fd.append("asunto", ASUNTO_POR_TIPO[tipo] || "Solicitud desde chatbot");
    fd.append("datos", JSON.stringify(datos));
    fd.append("cuerpo", formatearCuerpo(tipo, datos));

    if (archivo) fd.append("archivo", archivo, archivo.name);

    const respuesta = await fetch(endpoint, {
      method: "POST",
      body: fd // 👈 sin headers, FormData pone el boundary solo
    });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }
    return respuesta.json().catch(() => ({}));
  }

  /* =========================================
     6. FALLBACK MAILTO (si no hay backend)
     ========================================= */
  function fallbackMailto(tipo, datos) {
    const destino = DESTINO_POR_TIPO[tipo] || CORREOS.solicitudes;
    const asunto = encodeURIComponent(ASUNTO_POR_TIPO[tipo] || "Solicitud desde chatbot");
    const cuerpo = encodeURIComponent(formatearCuerpo(tipo, datos));
    window.location.href = `mailto:${destino}?subject=${asunto}&body=${cuerpo}`;
  }

  /* =========================================
     7. FUNCIÓN GLOBAL: enviarFormularioChat
     ========================================= */
  window.enviarFormularioChat = async function (tipoFormulario) {
    const contenedor = document.getElementById(`form-${tipoFormulario}`);
    if (!contenedor) {
      console.warn("⚠️ No se encontró el formulario:", tipoFormulario);
      return;
    }

    // 7.1 Recolectar y validar
    const { datos, archivo, valido, primerError } = recolectarDatos(contenedor);
    if (!valido) {
      MotorChat.agregarMensaje(
        "⚠️ Por favor completa correctamente los campos marcados en rojo.",
        "bot",
        "error"
      );
      if (primerError) primerError.focus();
      return;
    }

    // 7.2 Bloqueo del botón para evitar doble envío
    const btn = contenedor.querySelector(".chat-form-submit");
    const textoOriginal = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = "⏳ Enviando...";
    }

    // 7.3 Feedback en el chat
    MotorChat.agregarMensaje("⏳ Procesando tu solicitud...", "bot");

    try {
      // 7.4 Intento al backend
      await enviarAlBackend(tipoFormulario, datos, archivo);

      // 7.5 Ocultar formulario y confirmar
      contenedor.style.display = "none";
      MotorChat.agregarMensaje(
        `✅ <b>¡Solicitud enviada con éxito!</b><br>
         Hemos recibido tu información y un asesor se contactará contigo a la brevedad.<br>
         📬 Correo destino: <b>${DESTINO_POR_TIPO[tipoFormulario] || CORREOS.solicitudes}</b>`,
        "bot",
        "confirmacion"
      );

      // 7.6 Ofrecer volver al menú
      setTimeout(() => {
        MotorChat.agregarBotonVolverMenu(() => {
          window.ChatbotCore.FlujoChat.mostrarMenu();
        });
      }, 800);

    } catch (err) {
      console.error("❌ Error al enviar formulario:", err);

      // 7.7 Fallback: ofrecer mailto
      MotorChat.agregarMensaje(
        `⚠️ No pudimos conectar con el servidor.<br>
         Puedes enviar tu solicitud manualmente a:<br>
         📬 <b>${DESTINO_POR_TIPO[tipoFormulario] || CORREOS.solicitudes}</b>`,
        "bot",
        "error"
      );

      // Botón para abrir mailto
      const wrap = document.createElement("div");
      wrap.innerHTML = `<button class="back-btn" id="mailto-${tipoFormulario}">✉️ Abrir correo con los datos</button>`;
      MotorChat.DOM.body.appendChild(wrap);
      wrap.querySelector(`#mailto-${tipoFormulario}`).addEventListener("click", () => {
        fallbackMailto(tipoFormulario, datos);
      });

      // Restaurar botón
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
      }
    }
  };

  /* =========================================
     8. LOG INICIAL
     ========================================= */
  console.log("✅ enviarFormularioChat listo. Tipos:", Object.keys(DESTINO_POR_TIPO));

})();
/* =========================================
   ARCHIVO: chatbot_formularios.js
   PARTE 3 / 3: ESTILOS, LIMPIEZA Y CIERRE
   ========================================= */

(function () {
  "use strict";

  /* =========================================
     1. VERIFICAR NÚCLEO
     ========================================= */
  if (!window.ChatbotCore) {
    console.warn("⚠️ ChatbotCore no disponible. Los estilos no se aplicarán.");
    return;
  }

  const { UI } = window.ChatbotCore;

  /* =========================================
     2. ESTILOS INYECTADOS PARA FORMULARIOS
     ========================================= */
  const styleForm = document.createElement("style");
  styleForm.id = "chatbot-form-styles";
  styleForm.innerHTML = `

    /* ---------- CONTENEDOR DEL FORMULARIO ---------- */
    .chat-form-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      background: rgba(255, 255, 255, 0.98);
      border: 1.5px solid rgba(21, 94, 239, 0.18);
      border-radius: 16px;
      padding: 16px;
      margin-top: 6px;
      box-shadow: 0 4px 14px rgba(11, 35, 69, 0.06);
      animation: slideUpForm 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      font-family: 'Averia Libre', 'Segoe UI', sans-serif;
    }

    @keyframes slideUpForm {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ---------- TÍTULO DEL FORMULARIO ---------- */
    .chat-form-container h4 {
      margin: 0 0 6px 0;
      color: var(--azul-profundo, #0b2345);
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    /* ---------- GRUPOS DE CAMPO ---------- */
    .chat-form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .chat-form-group label {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--azul-profundo, #0b2345);
      letter-spacing: 0.2px;
    }

    /* ---------- INPUTS / SELECTS / TEXTAREAS ---------- */
    .chat-form-group input[type="text"],
    .chat-form-group input[type="email"],
    .chat-form-group input[type="tel"],
    .chat-form-group input[type="number"],
    .chat-form-group input[type="date"],
    .chat-form-group input[type="time"],
    .chat-form-group input[type="month"],
    .chat-form-group input[type="url"],
    .chat-form-group select,
    .chat-form-group textarea {
      width: 100%;
      padding: 10px 13px;
      border: 1.5px solid rgba(21, 94, 239, 0.22);
      border-radius: 10px;
      font-size: 13.5px;
      font-family: inherit;
      color: var(--azul-profundo, #0b2345);
      background: #f8fafc;
      outline: none;
      transition: all 0.25s ease;
      box-sizing: border-box;
    }

    .chat-form-group input:focus,
    .chat-form-group select:focus,
    .chat-form-group textarea:focus {
      border-color: var(--azul-medio, #155eef);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(21, 94, 239, 0.15);
    }

    .chat-form-group textarea {
      resize: vertical;
      min-height: 60px;
    }

    /* ---------- INPUT FILE (hoja de vida) ---------- */
    .chat-form-group input[type="file"] {
      padding: 8px;
      background: #f8fafc;
      border: 1.5px dashed rgba(21, 94, 239, 0.35);
      border-radius: 10px;
      font-size: 12.5px;
      cursor: pointer;
      color: var(--azul-profundo, #0b2345);
    }

    .chat-form-group input[type="file"]::file-selector-button {
      background: linear-gradient(135deg, #155eef, #079455);
      color: #fff;
      border: none;
      padding: 7px 12px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 10px;
      font-family: inherit;
      font-size: 12.5px;
    }

    /* ---------- ESTADOS DE ERROR ---------- */
    .chat-form-group input[style*="rgb(239, 68, 68)"],
    .chat-form-group select[style*="rgb(239, 68, 68)"],
    .chat-form-group textarea[style*="rgb(239, 68, 68)"] {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
    }

    /* ---------- BOTÓN DE ENVÍO ---------- */
    .chat-form-submit {
      margin-top: 6px;
      padding: 12px 16px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #155eef, #079455);
      color: #ffffff;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(21, 94, 239, 0.35);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .chat-form-submit:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 22px rgba(21, 94, 239, 0.45);
    }

    .chat-form-submit:active:not(:disabled) {
      transform: scale(0.97);
    }

    .chat-form-submit:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    /* ---------- RESPONSIVE ---------- */
    @media (max-width: 480px) {
      .chat-form-container {
        padding: 14px;
        border-radius: 14px;
      }
      .chat-form-container h4 { font-size: 14px; }
      .chat-form-group input,
      .chat-form-group select,
      .chat-form-group textarea {
        font-size: 14px;
        padding: 11px 13px;
      }
    }

    /* ---------- ACCESIBILIDAD ---------- */
    @media (prefers-reduced-motion: reduce) {
      .chat-form-container { animation: none !important; }
    }
  `;

  // Evitar duplicado si se recarga el archivo
  if (!document.getElementById("chatbot-form-styles")) {
    document.head.appendChild(styleForm);
  }

  /* =========================================
     3. AUTOFOCUS AL APARECER UN FORMULARIO
     ========================================= */
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList && node.classList.contains("chat-form-container")) {
          const primerCampo = node.querySelector("input, select, textarea");
          if (primerCampo) {
            setTimeout(() => {
              try { primerCampo.focus({ preventScroll: false }); } catch (_) {}
            }, 250);
          }
        }
      });
    });
  });

  if (UI && UI.window) {
    observer.observe(UI.window, { childList: true, subtree: true });
  }

  /* =========================================
     4. AUTOLIMPIEZA SEGURA AL CERRAR EL CHAT
     (solo borra formularios que ya se enviaron o que están vacíos)
     ========================================= */
  if (UI && UI.window) {
    UI.window.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "opacity") return;
      if (UI.window.classList.contains("open")) return;

      // Al cerrar: eliminar solo formularios enviados (ocultos) para no perder datos
      document.querySelectorAll(".chat-form-container").forEach((form) => {
        if (form.style.display === "none") {
          form.remove();
        }
      });
    });
  }

  /* =========================================
     5. LOG DE CIERRE
     ========================================= */
  console.log("📝 Módulo de formularios del chatbot cargado correctamente (Parte 3/3).");
  console.log("   ✔ Estilos aplicados");
  console.log("   ✔ Autofocus activo");
  console.log("   ✔ Autolimpieza segura activa");

})();