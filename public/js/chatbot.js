/* =========================================
   PROCESADOS MARGARITA - CHATBOT PREMIUM
   ========================================= */

(function () {
  "use strict";

  // Evitar doble carga
  if (window.__chatbotJS_loaded) return;
  window.__chatbotJS_loaded = true;

  /* =========================================
     1. CONFIGURACIÓN CENTRAL
     ========================================= */
  const CONFIG = {
    nombreBot: "Asistente Margarita",
    velocidadEscritura: 1000,

    // 📬 Correos centralizados
    correos: {
      solicitudes:    "solicitudes@procesadosmargaritasas.com",
      asesorProducto: "asesor.producto@procesadosmargaritasas.com",
      asesorMaterial: "asesor.material@procesadosmargaritasas.com",
      soporteTecnico: "soporte@procesadosmargaritasas.com",
      talentoHumano:  "talento@procesadosmargaritasas.com",
      logistica:      "logistica@procesadosmargaritasas.com"
    },

    // 💼 Cargos para "Trabaja con nosotros"
    cargos: [
      "Aprendiz SENA",
      "Operario de planta",
      "Conductor",
      "Auxiliar administrativo",
      "Auxiliar de logística",
      "Profesional en SST",
      "Coordinador de producción",
      "Otro"
    ],

    // 📁 Documentación interna
    documentos: {
      reglamento: {
        titulo: "📘 Reglamento interno",
        items: [
          "Horario laboral y jornadas",
          "Normas de seguridad y EPP",
          "Política de convivencia",
          "Régimen disciplinario"
        ]
      },
      politicas: {
        titulo: "📗 Políticas",
        items: [
          "Política de calidad",
          "Política ambiental",
          "Política de seguridad y salud en el trabajo",
          "Política de tratamiento de datos"
        ]
      },
      objetivos: {
        titulo: "📙 Objetivos",
        items: [
          "Objetivos estratégicos 2025",
          "Objetivos de calidad",
          "Objetivos ambientales",
          "Metas por área"
        ]
      }
    },

    // 🎯 Menú principal
    opciones: [
      { id: 1, titulo: "🛒 Asistencia en compras",        tipo: "submenu_compras" },
      { id: 2, titulo: "🛠️ Soporte técnico",              tipo: "formulario_soporte" },
      { id: 3, titulo: "💼 Trabaja con nosotros",         tipo: "formulario_trabajo" },
      {
        id: 4,
        titulo: "📊 Indicadores de productividad",
        tipo: "proximamente",
        resp: "Estamos terminando los indicadores de productividad 📊. Pronto estarán disponibles aquí mismo. Si necesitas un reporte urgente, escríbenos a <b>solicitudes@procesadosmargaritasas.com</b>."
      },
      { id: 5, titulo: "📁 Documentación interna",        tipo: "documentos" },
      { id: 6, titulo: "🚚 Programar recolección",        tipo: "formulario_recoleccion" },
      { id: 7, titulo: "⭐ Opiniones del servicio",       tipo: "formulario_opiniones" },
      { id: 8, titulo: "📄 Actas de aprovechamiento",     tipo: "formulario_actas" },
      { id: 9, titulo: "🧾 Solicitudes de retenciones",   tipo: "formulario_retenciones" }
    ]
  };

  /* =========================================
     2. INYECCIÓN DEL DOM
     ========================================= */
  const UI = {
    robot: document.createElement("div"),
    bubble: document.createElement("div"),
    window: document.createElement("div")
  };

  UI.robot.id = "robot-bot";
  UI.robot.setAttribute("role", "button");
  UI.robot.setAttribute("tabindex", "0");
  UI.robot.setAttribute("aria-label", "Abrir chat del asistente virtual");
  UI.robot.title = "¿Necesitas ayuda? Haz clic aquí";

  UI.robot.innerHTML = `
    <img src="img/chatbot/logo_chatbot.png" alt="Asistente Margarita" class="robot-body">
    <div class="robot-face" aria-hidden="true">
      <div class="eye left-eye"><div class="pupil"></div></div>
      <div class="eye right-eye"><div class="pupil"></div></div>
    </div>
  `;

  UI.bubble.id = "robot-bubble";
  UI.bubble.setAttribute("role", "status");
  UI.bubble.innerHTML = "¡Hola! 👋 Soy tu asistente virtual. ¿En qué te ayudo?";

  UI.window.id = "chat-window";
  UI.window.setAttribute("role", "dialog");
  UI.window.setAttribute("aria-label", "Ventana de chat del asistente virtual");
  UI.window.innerHTML = `
    <div class="chat-header">
      <span style="display:flex; align-items:center;">
        <span class="status" aria-hidden="true"></span>${CONFIG.nombreBot}
      </span>
      <button id="chat-close" type="button" title="Cerrar ventana" aria-label="Cerrar chat">✕</button>
    </div>
    <div class="chat-body" id="chat-body" role="log" aria-live="polite"></div>
    <div class="chat-footer">
      <input id="chat-input" type="text" placeholder="Escribe tu mensaje aquí..." autocomplete="off" aria-label="Escribe tu mensaje">
      <button id="chat-send" type="button" title="Enviar mensaje" aria-label="Enviar mensaje">➤</button>
    </div>
  `;

  document.body.appendChild(UI.robot);
  document.body.appendChild(UI.bubble);
  document.body.appendChild(UI.window);

  const DOM = {
    body:     document.getElementById("chat-body"),
    input:    document.getElementById("chat-input"),
    sendBtn:  document.getElementById("chat-send"),
    closeBtn: document.getElementById("chat-close"),
    pupils:   document.querySelectorAll(".pupil")
  };

  /* =========================================
   3. MOTOR DE OJOS
   ========================================= */
const OjosRobot = {
  // Posición del mouse en pantalla
  mouseX: window.innerWidth / 2,
  mouseY: window.innerHeight / 2,

  // Posición actual de la mirada (para interpolación suave)
  actualX: 0,
  actualY: 0,

  // Objetivo de la mirada (calculado desde el mouse)
  objetivoX: 0,
  objetivoY: 0,

  // Configuración del movimiento
  radioMax: 60,        // radio máximo de influencia del mouse
  desplazamientoMax: 4, // px máximos que se mueve la pupila
  suavizado: 0.18,     // 0 = no se mueve, 1 = instantáneo

  _activo: true,
  _rafId: null,

  init() {
    // Detectar movimiento del mouse
    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this._calcularObjetivo();
    }, { passive: true });

    // Si el mouse sale de la ventana → mirada al centro
    document.addEventListener("mouseleave", () => {
      this.objetivoX = 0;
      this.objetivoY = 0;
    });

    // Mouse entra → recalcular
    document.addEventListener("mouseenter", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this._calcularObjetivo();
    });

    // Pausar animación cuando la pestaña no está visible
    document.addEventListener("visibilitychange", () => {
      this._activo = !document.hidden;
      if (this._activo) {
        this._iniciarLoop();
      } else {
        this._pararLoop();
      }
    });

    // Iniciar el loop de animación
    this._iniciarLoop();
  },

  /* Calcula hacia dónde debe mirar según el mouse */
  _calcularObjetivo() {
    if (!this._activo) return;
    if (!DOM.pupils || !DOM.pupils.length) return;

    const rect = UI.robot.getBoundingClientRect();
    if (rect.width === 0) return;

    const centroX = rect.left + rect.width / 2;
    const centroY = rect.top + rect.height / 2;

    // Vector del centro del robot al mouse
    const dx = this.mouseX - centroX;
    const dy = this.mouseY - centroY;
    const distancia = Math.hypot(dx, dy);

    // Si el mouse está cerca → intensidad proporcional
    // Si está lejos → máxima intensidad (ojos al borde)
    const intensidad = distancia < this.radioMax
      ? distancia / this.radioMax
      : 1;

    // Ángulo en cualquier dirección (0–360°)
    const angulo = Math.atan2(dy, dx);

    // Desplazamiento final en X e Y (cubre 360°)
    this.objetivoX = Math.cos(angulo) * this.desplazamientoMax * intensidad;
    this.objetivoY = Math.sin(angulo) * this.desplazamientoMax * intensidad;
  },

  /* Interpolación suave hacia el objetivo */
  _animar() {
    if (!this._activo) return;

    this.actualX += (this.objetivoX - this.actualX) * this.suavizado;
    this.actualY += (this.objetivoY - this.actualY) * this.suavizado;

    // Aplicar a las pupilas
    DOM.pupils.forEach(pupila => {
      pupila.style.transform =
        `translate3d(${this.actualX.toFixed(2)}px, ${this.actualY.toFixed(2)}px, 0)`;
    });
  },

  _iniciarLoop() {
    if (this._rafId !== null) return;
    const tick = () => {
      this._animar();
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  },

  _pararLoop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
};

OjosRobot.init();

  /* =========================================
     4. EXPORTAR NÚCLEO PARA LAS SIGUIENTES PARTES
     ========================================= */
  window.ChatbotCore = { CONFIG, DOM, UI, OjosRobot };
})();

(function () {
  "use strict";

  const { CONFIG, DOM, UI } = window.ChatbotCore;

  /* =========================================
     1. MOTOR DE MENSAJES
     ========================================= */
  const MotorChat = {
    estaEscribiendo: false,
    indicadorEscribiendo: null,
    saludoRealizado: false,
    _timeoutEscribir: null,

    /**
     * Agrega un mensaje al chat.
     * @param {string} texto  - HTML o texto
     * @param {"bot"|"user"} emisor
     * @param {string} claseExtra - "confirmacion" | "error" | ""
     */
    agregarMensaje(texto, emisor = "bot", claseExtra = "") {
      if (!texto || !DOM.body) return;

      const burbuja = document.createElement("div");
      burbuja.className = `msg ${emisor} ${claseExtra}`.trim();
      burbuja.innerHTML = texto;

      DOM.body.appendChild(burbuja);
      this.scrollAbajo();
    },

    mostrarEscribiendo() {
      if (this.estaEscribiendo || !DOM.body) return;
      this.estaEscribiendo = true;

      this.indicadorEscribiendo = document.createElement("div");
      this.indicadorEscribiendo.className = "msg bot typing-indicator";
      this.indicadorEscribiendo.innerHTML = `
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>`;

      DOM.body.appendChild(this.indicadorEscribiendo);
      this.scrollAbajo();
    },

    ocultarEscribiendo() {
      if (!this.estaEscribiendo) return;
      this.estaEscribiendo = false;

      if (this.indicadorEscribiendo) {
        this.indicadorEscribiendo.remove();
        this.indicadorEscribiendo = null;
      }
    },

    scrollAbajo() {
      requestAnimationFrame(() => {
        if (!DOM.body) return;
        DOM.body.scrollTo({
          top: DOM.body.scrollHeight,
          behavior: "smooth"
        });
      });
    },

    bloquearInput(bloquear) {
      if (!DOM.input || !DOM.sendBtn) return;
      DOM.input.disabled = bloquear;
      DOM.sendBtn.disabled = bloquear;
      DOM.input.style.opacity = bloquear ? "0.6" : "1";
      DOM.sendBtn.style.opacity = bloquear ? "0.6" : "1";
      DOM.sendBtn.style.cursor = bloquear ? "not-allowed" : "pointer";
    },

    ejecutarSaludo() {
      if (this.saludoRealizado) return;
      this.saludoRealizado = true;

      UI.robot.classList.add("saludando");
      UI.bubble.classList.add("visible");

      setTimeout(() => {
        UI.robot.classList.remove("saludando");
        UI.bubble.classList.remove("visible");
      }, 3500);
    },

    reaccionEscribir() {
      if (UI.robot.classList.contains("saludando")) return;

      UI.robot.classList.add("saludando");
      clearTimeout(this._timeoutEscribir);
      this._timeoutEscribir = setTimeout(() => {
        UI.robot.classList.remove("saludando");
      }, 600);
    },

    /* =========================================
       HELPERS REUTILIZABLES
       ========================================= */

    /** Añade el botón "Volver al menú" al chat */
    agregarBotonVolverMenu(callback) {
      if (!DOM.body) return;
      const wrap = document.createElement("div");
      wrap.innerHTML = `<button class="back-btn" type="button">↩ Volver al menú</button>`;
      DOM.body.appendChild(wrap);
      wrap.querySelector(".back-btn").addEventListener("click", () => {
        if (typeof callback === "function") callback();
      });
      this.scrollAbajo();
    },

    /** Elimina formularios huérfanos para evitar conflictos de IDs */
    limpiarFormulariosActivos() {
      document.querySelectorAll(".chat-form").forEach(f => {
        if (f.dataset.activo === "true") {
          f.dataset.activo = "false";
        }
      });
    }
  };

  window.ChatbotCore.MotorChat = MotorChat;

  /* =========================================
     2. ESTILOS INYECTADOS (typing, botones, etc.)
     ========================================= */
  const styleExtra = document.createElement("style");
  styleExtra.innerHTML = `
    /* ---------- TYPING (3 puntitos) ---------- */
    .typing-indicator {
      padding: 14px 18px !important;
      display: flex;
      align-items: center;
      width: fit-content;
      background: var(--blanco, #fff) !important;
      border: 1px solid rgba(21, 94, 239, 0.1);
    }
    .typing-dots { display: flex; gap: 5px; align-items: center; height: 10px; }
    .typing-dots span {
      width: 7px; height: 7px; background-color: #94a3b8;
      border-radius: 50%; display: inline-block;
      animation: rebotePuntito 1.4s infinite ease-in-out both;
    }
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes rebotePuntito {
      0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; background-color: #155eef; }
    }

    /* ---------- SONRISA DE OJOS ---------- */
    #robot-bot.saludando .eye {
      animation: sonrisaOjos 0.6s ease-in-out infinite alternate !important;
    }
    @keyframes sonrisaOjos {
      0%   { border-radius: 50% / 40%; }
      100% { border-radius: 50% / 20% 20% 40% 40%; }
    }

    /* ---------- BOTÓN VOLVER AL MENÚ ---------- */
    .back-btn {
      margin-top: 6px;
      background: transparent;
      border: 1.5px solid rgba(21, 94, 239, 0.3);
      color: var(--azul-medio, #155eef);
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.25s ease;
    }
    .back-btn:hover {
      background: rgba(21, 94, 239, 0.08);
      border-color: var(--azul-medio, #155eef);
    }

    /* ---------- MENSAJES DE CONFIRMACIÓN / ERROR ---------- */
    .msg.confirmacion {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5) !important;
      border: 1.5px solid #12c76a !important;
      color: #05603a !important;
      font-weight: 600;
    }
    .msg.error {
      background: linear-gradient(135deg, #fef2f2, #fee2e2) !important;
      border: 1.5px solid #ef4444 !important;
      color: #991b1b !important;
      font-weight: 600;
    }

    /* ---------- FORMULARIO GENÉRICO ---------- */
    .chat-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px solid rgba(21, 94, 239, 0.15);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 14px rgba(11, 35, 69, 0.06);
      animation: msgEntrada 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    .chat-form label {
      font-size: 13px;
      font-weight: 700;
      color: var(--azul-profundo, #0b2345);
      letter-spacing: 0.3px;
      margin-bottom: -4px;
    }
    .chat-form input[type="text"],
    .chat-form input[type="email"],
    .chat-form input[type="tel"],
    .chat-form input[type="date"],
    .chat-form input[type="time"],
    .chat-form input[type="month"],
    .chat-form input[type="number"],
    .chat-form select,
    .chat-form textarea {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid rgba(21, 94, 239, 0.2);
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: var(--azul-profundo, #0b2345);
      background: #f8fafc;
      outline: none;
      transition: all 0.25s ease;
    }
    .chat-form input:focus,
    .chat-form select:focus,
    .chat-form textarea:focus {
      border-color: var(--azul-medio, #155eef);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(21, 94, 239, 0.15);
    }
    .chat-form textarea { resize: vertical; min-height: 70px; }

    .chat-form input[type="file"] {
      padding: 8px;
      background: #f8fafc;
      border: 1.5px dashed rgba(21, 94, 239, 0.35);
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
    }
    .chat-form input[type="file"]::file-selector-button {
      background: linear-gradient(135deg, #155eef, #079455);
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 10px;
      font-family: inherit;
    }

    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }
    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 11px 16px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-primary {
      background: linear-gradient(135deg, #155eef, #079455);
      color: #fff;
      box-shadow: 0 4px 12px rgba(21, 94, 239, 0.35);
    }
    .btn-primary:hover { transform: translateY(-2px) scale(1.02); }
    .btn-secondary {
      background: rgba(11, 35, 69, 0.08);
      color: var(--azul-profundo, #0b2345);
    }
    .btn-secondary:hover { background: rgba(11, 35, 69, 0.15); }

    /* ---------- ESTRELLAS ---------- */
    .rating {
      display: flex;
      gap: 6px;
      justify-content: center;
      padding: 8px 0;
    }
    .rating .star {
      font-size: 30px;
      cursor: pointer;
      color: #cbd5e1;
      transition: transform 0.2s ease, color 0.2s;
      user-select: none;
    }
    .rating .star:hover,
    .rating .star.active {
      color: #fbbf24;
      transform: scale(1.15);
      text-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
    }

    /* ---------- CHIPS ---------- */
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 6px;
    }
    .chip {
      padding: 9px 16px;
      border-radius: 20px;
      background: rgba(21, 94, 239, 0.08);
      border: 1.5px solid rgba(21, 94, 239, 0.2);
      color: var(--azul-profundo, #0b2345);
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.25s ease;
    }
    .chip:hover {
      background: var(--azul-medio, #155eef);
      color: #fff;
      border-color: var(--azul-medio, #155eef);
      transform: translateY(-2px);
    }

    /* ---------- DOC-CARD (documentación) ---------- */
    .doc-card {
      background: rgba(255, 255, 255, 0.95);
      border: 1.5px solid rgba(21, 94, 239, 0.15);
      border-radius: 14px;
      padding: 14px 16px;
      margin-top: 6px;
    }
    .doc-card h4 {
      margin: 0 0 8px 0;
      color: var(--azul-profundo, #0b2345);
      font-size: 15px;
    }
    .doc-card ul {
      margin: 0;
      padding-left: 18px;
      font-size: 13.5px;
      color: #334155;
      line-height: 1.7;
    }
  `;
  document.head.appendChild(styleExtra);

  /* =========================================
     3. ESTILOS DEL ROBOT
     ========================================= */
  const styleRobot = document.createElement("style");
  styleRobot.innerHTML = `
    #robot-bot {
      position: fixed;
      bottom: 35px;
      right: 35px;
      width: 130px;
      height: 130px;
      cursor: pointer;
      z-index: 9999;
      user-select: none;

      /* física: del logo */
      transform: none;
      transition: transform 0.3s ease;
      will-change: transform;
    }

    .robot-body {
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: relative;
      z-index: 2;

      filter: drop-shadow(0px 15px 25px rgba(11,35,69,0.5))
              drop-shadow(0px 0px 20px rgba(18,199,106,0.6));
      transition: filter 0.3s ease;

      /* ⚠️ flotar3D: del logo*/
      animation: none;
    }

    /* Efecto hover: solo crece un poquito y brilla más (no se desplaza) */
    #robot-bot:hover {
      transform: scale(1.06);
    }
    #robot-bot:hover .robot-body {
      filter: drop-shadow(0px 20px 35px rgba(11,35,69,0.6))
              drop-shadow(0px 0px 35px rgba(18,199,106,0.9));
    }

    /* Pensando: ligero temblor */
    #robot-bot.pensando .robot-body {
      animation: temblorPensar 0.3s ease-in-out infinite alternate;
    }
    @keyframes temblorPensar {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(3deg); }
    }

    /* Saltito al hacer clic (sin desplazarse del sitio) */
    #robot-bot.reaccion-click {
      animation: saltitoClick 0.3s ease-in-out;
    }
    @keyframes saltitoClick {
      0%   { transform: scale(1); }
      50%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(styleRobot);
})();

(function () {
  "use strict";

  const { CONFIG, DOM, MotorChat, UI } = window.ChatbotCore;

  const FlujoChat = {

    /* =========================================
       A) RESPUESTA GENÉRICA DEL BOT
       ========================================= */
    botResponde(texto, claseExtra = "") {
      if (!texto) return;

      MotorChat.bloquearInput(true);
      MotorChat.mostrarEscribiendo();
      if (UI.robot) UI.robot.classList.add("pensando");

      const tiempoPensar = Math.floor(Math.random() * 800) + 1000;

      setTimeout(() => {
        MotorChat.ocultarEscribiendo();
        MotorChat.agregarMensaje(texto, "bot", claseExtra);
        MotorChat.bloquearInput(false);
        if (DOM.input) DOM.input.focus();
        if (UI.robot) UI.robot.classList.remove("pensando");
      }, tiempoPensar);
    },

    /* =========================================
       B) MENÚ PRINCIPAL
       Renderiza los botones y delega el click
       al contenedor #chat-body (delegación real).
       ========================================= */
    mostrarMenu() {
      MotorChat.bloquearInput(true);
      MotorChat.mostrarEscribiendo();

      setTimeout(() => {
        MotorChat.ocultarEscribiendo();

        // HTML del menú
        let html = `<div>¿En qué puedo ayudarte hoy? Elige una opción 👇</div>`;
        html += `<div class="options">`;

        CONFIG.opciones.forEach(op => {
          html += `<button class="option-btn" type="button" data-id="${op.id}">${op.titulo}</button>`;
        });

        html += `</div>`;

        // Insertar el menú
        MotorChat.agregarMensaje(html, "bot");

        // ✅ Delegación: un solo listener sobre #chat-body
        this._bindOpcionesMenu();

        MotorChat.bloquearInput(false);
      }, 900);
    },

    /** Listener delegado para los botones del menú (se registra una sola vez) */
    _bindOpcionesMenu() {
      if (!DOM.body) return;
      if (DOM.body.dataset.menuListener === "true") return;

      DOM.body.addEventListener("click", (e) => {
        const btn = e.target.closest(".option-btn");
        if (!btn) return;

        // Evita doble clic
        if (btn.disabled || btn.classList.contains("selected")) return;

        const id = parseInt(btn.dataset.id, 10);
        if (isNaN(id)) return;

        // Deshabilita SOLO el botón clicado (los demás del menú siguen activos)
        btn.disabled = true;
        btn.classList.add("selected");

        // Procesa la selección
        this.procesarSeleccion(id);
      });

      DOM.body.dataset.menuListener = "true";
    },

    /* =========================================
       C) ROUTER DE SELECCIÓN
       ========================================= */
    procesarSeleccion(id) {
      const opcion = CONFIG.opciones.find(op => op.id === id);
      if (!opcion) {
        this.botResponde("Disculpa, esa opción no está disponible aún.");
        return;
      }

      this.reaccionarClick();

      // ✅ Burbuja del usuario con el título de la opción
      MotorChat.agregarMensaje(opcion.titulo, "user");

      // Ejecuta el flujo correspondiente
      this._ejecutarFlujoPorTipo(opcion);
    },

    /** Switch reutilizable para no repetir en procesarTextoEntrada */
    _ejecutarFlujoPorTipo(opcion) {
      switch (opcion.tipo) {
        case "submenu_compras":        this.flujoCompras(); break;
        case "formulario_soporte":     this.flujoSoporte(); break;
        case "formulario_trabajo":     this.flujoTrabajo(); break;
        case "proximamente":
          this.botResponde(opcion.resp);
          this.volverAlMenu();
          break;
        case "documentos":             this.flujoDocumentacion(); break;
        case "formulario_recoleccion": this.flujoRecoleccion(); break;
        case "formulario_opiniones":   this.flujoOpiniones(); break;
        case "formulario_actas":       this.flujoActas(); break;
        case "formulario_retenciones": this.flujoRetenciones(); break;
        default:
          this.botResponde("Disculpa, esa opción no está disponible aún.");
      }
    },

    /* =========================================
       1) ASISTENCIA EN COMPRAS → SUBMENÚ
       ========================================= */
    flujoCompras() {
      this.botResponde("¡Con gusto! Cuéntame, ¿qué necesitas comprar?");

      setTimeout(() => {
        const wrap = document.createElement("div");
        wrap.innerHTML = `
          <div class="chips">
            <button class="chip" type="button" data-tipo="producto">🛍️ Producto</button>
            <button class="chip" type="button" data-tipo="material">📦 Material</button>
          </div>`;
        MotorChat.agregarMensaje(wrap.innerHTML, "bot");

        // Delegación: listener sobre los chips recién creados
        this._bindChipsCompras();
      }, 900);
    },

    _bindChipsCompras() {
      if (!DOM.body) return;

      // Evita registrar varias veces el mismo listener
      if (DOM.body.dataset.chipsListener === "true") return;

      DOM.body.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip[data-tipo]");
        if (!chip) return;
        if (chip.disabled) return;

        chip.disabled = true;
        this.comprasSeleccion(chip.dataset.tipo);
      });

      DOM.body.dataset.chipsListener = "true";
    },

    comprasSeleccion(tipo) {
      const etiqueta = tipo === "producto" ? "Producto" : "Material";
      MotorChat.agregarMensaje(etiqueta, "user");

      const correo = tipo === "producto"
        ? CONFIG.correos.asesorProducto
        : CONFIG.correos.asesorMaterial;

      this.botResponde(`
        Perfecto 👌. Te pongo en contacto con el asesor de <b>${tipo}</b>.<br>
        📧 <b>${correo}</b><br>
        En un momento se comunicará contigo.
      `, "confirmacion");

      this.notificar(correo, "Nueva solicitud de compra", { tipo });
      this.volverAlMenu();
    },

    /* =========================================
       2) SOPORTE TÉCNICO
       ========================================= */
    flujoSoporte() {
      this.botResponde("Lamento el inconveniente 🙏. Cuéntame qué falla en la página (pantalla en blanco, error al iniciar sesión, botón que no responde, etc.).");

      setTimeout(() => {
        this.renderFormulario({
          id: "form-soporte",
          campos: [
            { name: "nombre",      label: "Tu nombre",              type: "text",     required: true },
            { name: "correo",      label: "Correo de contacto",     type: "email",    required: true },
            { name: "descripcion", label: "¿Qué está fallando?",    type: "textarea", required: true }
          ],
          onSubmit: (data) => {
            this.notificar(CONFIG.correos.soporteTecnico, "Soporte técnico web", data);
            this.botResponde(`
              ✅ <b>Solicitud recibida.</b><br>
              El equipo de soporte te contactará al correo <b>${data.correo}</b>.
            `, "confirmacion");
            this.volverAlMenu();
          }
        });
      }, 1100);
    },

    /* =========================================
       3) TRABAJA CON NOSOTROS
       ========================================= */
    flujoTrabajo() {
      this.botResponde("¡Nos encanta sumar talento! 💼 Selecciona el cargo de tu interés y adjunta tu hoja de vida.");

      setTimeout(() => {
        this.renderFormulario({
          id: "form-trabajo",
          campos: [
            { name: "nombre",   label: "Nombre completo",               type: "text",   required: true },
            { name: "correo",   label: "Correo",                        type: "email",  required: true },
            { name: "telefono", label: "Teléfono",                      type: "tel",    required: false },
            { name: "cargo",    label: "Cargo al que aplicas",          type: "select", required: true, options: CONFIG.cargos },
            { name: "cv",       label: "Adjunta tu hoja de vida (PDF)", type: "file",   required: true, accept: ".pdf,.doc,.docx" }
          ],
          onSubmit: (data) => {
            this.notificar(CONFIG.correos.talentoHumano, "Nueva hoja de vida", {
              nombre: data.nombre,
              correo: data.correo,
              cargo: data.cargo,
              archivo: data.cv?.name || "sin archivo"
            });
            this.botResponde(`
              ✅ <b>¡Postulación enviada!</b><br>
              Recibimos tu hoja de vida para el cargo <b>${data.cargo}</b>.<br>
              Si tu perfil se ajusta, RRHH te contactará a <b>${data.correo}</b>.
            `, "confirmacion");
            this.volverAlMenu();
          }
        });
      }, 1100);
    },

    /* =========================================
       5) DOCUMENTACIÓN INTERNA
       ========================================= */
    flujoDocumentacion() {
      this.botResponde("Aquí tienes la documentación interna disponible 📁:");

      setTimeout(() => {
        const d = CONFIG.documentos;
        const html = `
          <div class="doc-card">
            <h4>${d.reglamento.titulo}</h4>
            <ul>${d.reglamento.items.map(i => `<li>${i}</li>`).join("")}</ul>
          </div>
          <div class="doc-card">
            <h4>${d.politicas.titulo}</h4>
            <ul>${d.politicas.items.map(i => `<li>${i}</li>`).join("")}</ul>
          </div>
          <div class="doc-card">
            <h4>${d.objetivos.titulo}</h4>
            <ul>${d.objetivos.items.map(i => `<li>${i}</li>`).join("")}</ul>
          </div>
        `;
        MotorChat.agregarMensaje(html, "bot");
        this.volverAlMenu();
      }, 1000);
    },

    /* =========================================
       6) PROGRAMAR RECOLECCIÓN
       ========================================= */
    flujoRecoleccion() {
      this.botResponde("¡Claro! Vamos a programar la recolección 🚚. Completa los datos:");

      setTimeout(() => {
        this.renderFormulario({
          id: "form-recoleccion",
          campos: [
            { name: "nombre",        label: "Nombre de contacto",              type: "text",     required: true },
            { name: "telefono",      label: "Teléfono",                        type: "tel",      required: true },
            { name: "direccion",     label: "Dirección de recolección",        type: "text",     required: true },
            { name: "fecha",         label: "Fecha",                           type: "date",     required: true },
            { name: "hora",          label: "Hora aproximada",                 type: "time",     required: true },
            { name: "cantidad",      label: "Cantidad de vehículos/unidades",  type: "number",   required: true, min: 1 },
            { name: "observaciones", label: "Observaciones (opcional)",        type: "textarea", required: false }
          ],
          onSubmit: (data) => {
            this.notificar(CONFIG.correos.logistica, "Solicitud de recolección", data);
            this.botResponde(`
              ✅ <b>Recolección programada.</b><br>
              Logística se pondrá en contacto contigo al <b>${data.telefono}</b> en breve para confirmar.
            `, "confirmacion");
            this.volverAlMenu();
          }
        });
      }, 1100);
    },

    /* =========================================
       7) OPINIONES DEL SERVICIO
       ========================================= */
    flujoOpiniones() {
      this.botResponde("¡Tu opinión nos ayuda a mejorar! ⭐ Califica nuestro servicio:");

      setTimeout(() => {
        const wrap = document.createElement("div");
        wrap.innerHTML = `
          <div class="chat-form" id="form-opiniones">
            <label>Calificación del servicio</label>
            <div class="rating" id="rating-servicio">
              ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}">★</span>`).join("")}
            </div>
            <label>Opinión sobre el conductor</label>
            <div class="rating" id="rating-conductor">
              ${[1,2,3,4,5].map(n => `<span class="star" data-val="${n}">★</span>`).join("")}
            </div>
            <label>Comentarios</label>
            <textarea id="op-comentarios" placeholder="Cuéntanos más..."></textarea>
            <label>Tu nombre</label>
            <input type="text" id="op-nombre" placeholder="Nombre (opcional)">
            <div class="form-actions">
              <button type="button" class="btn-secondary" id="op-cancelar">Cancelar</button>
              <button type="button" class="btn-primary"  id="op-enviar">Enviar opinión</button>
            </div>
          </div>`;
        MotorChat.agregarMensaje(wrap.innerHTML, "bot");

        this._bindEstrellas("#rating-servicio");
        this._bindEstrellas("#rating-conductor");

        const cancelar = document.getElementById("op-cancelar");
        const enviar   = document.getElementById("op-enviar");

        if (cancelar) cancelar.addEventListener("click", () => this.volverAlMenu());

        if (enviar) enviar.addEventListener("click", () => {
          const servicio    = this._valorRating("#rating-servicio");
          const conductor   = this._valorRating("#rating-conductor");
          const comentarios = document.getElementById("op-comentarios")?.value.trim() || "";
          const nombre      = document.getElementById("op-nombre")?.value.trim() || "";

          if (!servicio) {
            this.botResponde("Por favor califica el servicio con las estrellas ⭐ antes de enviar.", "error");
            return;
          }

          this.notificar(CONFIG.correos.solicitudes, "Opinión del servicio", {
            servicio, conductor, comentarios, nombre
          });

          this.botResponde(`
            ✅ <b>¡Gracias por tu opinión!</b><br>
            Servicio: ${"★".repeat(servicio)}<br>
            Conductor: ${conductor ? "★".repeat(conductor) : "No calificado"}
          `, "confirmacion");
          this.volverAlMenu();
        });
      }, 1000);
    },

    /* =========================================
       8) ACTAS DE APROVECHAMIENTO
       ========================================= */
    flujoActas() {
      this.botResponde("Vamos con el acta de aprovechamiento 📄. Necesitamos estos datos:");

      setTimeout(() => {
        this.renderFormulario({
          id: "form-actas",
          campos: [
            { name: "mes",             label: "Mes solicitado",                   type: "month", required: true },
            { name: "empresa",         label: "Empresa",                          type: "text",  required: true },
            { name: "sede",            label: "Sede",                             type: "text",  required: true },
            { name: "nombre_persona",  label: "Nombre del solicitante",           type: "text",  required: true },
            { name: "correo_destino",  label: "Correo donde deseas recibirla",    type: "email", required: true }
          ],
          onSubmit: (data) => {
            this.enviarCorreo({
              destino: CONFIG.correos.solicitudes,
              copia:   data.correo_destino,
              asunto:  `Solicitud de acta - ${data.empresa} - ${data.mes}`,
              cuerpo:  this._formatoCuerpo("Acta de aprovechamiento", data)
            });
            this.botResponde(`
              ✅ <b>Solicitud enviada.</b><br>
              Enviaremos el acta de <b>${data.empresa}</b> al correo <b>${data.correo_destino}</b> en los próximos días hábiles.
            `, "confirmacion");
            this.volverAlMenu();
          }
        });
      }, 1100);
    },

    /* =========================================
       9) SOLICITUDES DE RETENCIONES
       ========================================= */
    flujoRetenciones() {
      this.botResponde("Vamos con la solicitud de retención 🧾. Completa los datos:");

      setTimeout(() => {
        this.renderFormulario({
          id: "form-retenciones",
          campos: [
            { name: "periodo",         label: "Periodo (mes/año)",                 type: "month",  required: true },
            { name: "tipo",            label: "Tipo de retención",                 type: "select", required: true, options: ["Retefuente", "Reteica"] },
            { name: "empresa",         label: "Nombre de la empresa",              type: "text",   required: true },
            { name: "nombre_persona",  label: "Nombre del solicitante",            type: "text",   required: true },
            { name: "correo_destino",  label: "Correo donde deseas recibirla",     type: "email",  required: true }
          ],
          onSubmit: (data) => {
            this.enviarCorreo({
              destino: CONFIG.correos.solicitudes,
              copia:   data.correo_destino,
              asunto:  `Solicitud retención ${data.tipo} - ${data.empresa} - ${data.periodo}`,
              cuerpo:  this._formatoCuerpo("Solicitud de retención", data)
            });
            this.botResponde(`
              ✅ <b>Solicitud de ${data.tipo} enviada.</b><br>
              Te llegará al correo <b>${data.correo_destino}</b>.
            `, "confirmacion");
            this.volverAlMenu();
          }
        });
      }, 1100);
    },

    /* =========================================
       HELPERS DE FORMULARIO / ENVÍO
       ========================================= */
    renderFormulario({ id, campos, onSubmit }) {
      if (!DOM.body) return;

      const wrap = document.createElement("div");
      wrap.innerHTML = `<div class="chat-form" id="${id}"></div>`;
      MotorChat.agregarMensaje(wrap.innerHTML, "bot");

      const form = document.getElementById(id);
      if (!form) return;

      campos.forEach(c => {
        const label = document.createElement("label");
        label.textContent = c.label + (c.required ? " *" : "");
        form.appendChild(label);

        let input;
        if (c.type === "textarea") {
          input = document.createElement("textarea");
        } else if (c.type === "select") {
          input = document.createElement("select");
          const opt0 = document.createElement("option");
          opt0.value = ""; opt0.textContent = "Selecciona...";
          input.appendChild(opt0);
          (c.options || []).forEach(o => {
            const opt = document.createElement("option");
            opt.value = o; opt.textContent = o;
            input.appendChild(opt);
          });
        } else {
          input = document.createElement("input");
          input.type = c.type;
          if (c.min !== undefined) input.min = c.min;
          if (c.accept) input.accept = c.accept;
        }
        input.name = c.name;
        input.required = !!c.required;
        form.appendChild(input);
      });

      const acciones = document.createElement("div");
      acciones.className = "form-actions";
      acciones.innerHTML = `
        <button type="button" class="btn-secondary" data-cancel>Cancelar</button>
        <button type="button" class="btn-primary"  data-send>Enviar</button>`;
      form.appendChild(acciones);

      acciones.querySelector("[data-cancel]").addEventListener("click", () => this.volverAlMenu());

      acciones.querySelector("[data-send]").addEventListener("click", () => {
        const data = {};
        let valido = true;

        campos.forEach(c => {
          const el = form.querySelector(`[name="${c.name}"]`);
          if (!el) return;

          if (c.type === "file") {
            if (c.required && (!el.files || !el.files.length)) valido = false;
            data[c.name] = el.files?.[0] || null;
          } else {
            const v = el.value.trim();
            if (c.required && !v) valido = false;
            data[c.name] = v;
          }
        });

        if (!valido) {
          this.botResponde("⚠️ Por favor completa todos los campos obligatorios.", "error");
          return;
        }

        form.remove();
        onSubmit(data);
      });
    },

    _bindEstrellas(selector) {
      const cont = document.querySelector(selector);
      if (!cont) return;
      cont.querySelectorAll(".star").forEach(star => {
        star.addEventListener("click", () => {
          const val = +star.dataset.val;
          cont.dataset.value = val;
          cont.querySelectorAll(".star").forEach(s => {
            s.classList.toggle("active", +s.dataset.val <= val);
          });
        });
      });
    },

    _valorRating(selector) {
      const c = document.querySelector(selector);
      return c ? (+c.dataset.value || 0) : 0;
    },

    volverAlMenu() {
      MotorChat.agregarBotonVolverMenu(() => this.mostrarMenu());
    },

    /* =========================================
       ENVÍO Y NOTIFICACIÓN (PLACEHOLDERS)
       ========================================= */
    notificar(correo, asunto, datos) {
      console.log("📧 Notificar:", { correo, asunto, datos });
      // TODO: conectar a tu backend
    },

    enviarCorreo({ destino, copia, asunto, cuerpo }) {
      console.log("✉️ Enviar correo:", { destino, copia, asunto, cuerpo });
      // TODO: conectar a tu backend o EmailJS
    },

    _formatoCuerpo(titulo, data) {
      return `${titulo}\n` + Object.entries(data)
        .map(([k, v]) => `${k}: ${v}`).join("\n");
    },

    /* =========================================
       NLP DE TEXTO LIBRE
       ========================================= */
    procesarTextoEntrada(textoOriginal) {
      if (!textoOriginal) return;

      const texto = textoOriginal.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!texto) return;

      // ✅ Mensaje del usuario cuando escribe
      MotorChat.agregarMensaje(textoOriginal, "user");
      if (DOM.input) DOM.input.value = "";

      // 1) Número de opción (1–9)
      const numero = parseInt(texto, 10);
      if (!isNaN(numero) && numero >= 1 && numero <= 9) {
        const opcion = CONFIG.opciones.find(op => op.id === numero);
        if (opcion) {
          this.reaccionarClick();
          // NO se vuelve a agregar la burbuja del usuario
          this._ejecutarFlujoPorTipo(opcion);
        }
        return;
      }

      // 2) Comandos por palabra clave
      if (/(menu|inicio|opciones|ayuda|volver)/.test(texto)) {
        this.botResponde("¡Claro! Aquí tienes el menú nuevamente:");
        setTimeout(() => this.mostrarMenu(), 1200);
        return;
      }

      if (/(hola|buenos dias|buenas tardes|buenas noches|hey|saludos|que tal)/.test(texto)) {
        this.botResponde("¡Hola! 👋 Qué gusto saludarte. ¿En qué te puedo colaborar hoy?");
        setTimeout(() => this.mostrarMenu(), 2200);
        return;
      }

      if (/(gracias|chao|adios|hasta luego|nos vemos|bye)/.test(texto)) {
        this.botResponde("¡Con mucho gusto! 🙌 Estoy aquí si necesitas algo más. ¡Que tengas un excelente día!");
        return;
      }

      if (/(quien eres|procesados margarita|a que se dedican|que hacen|mision|vision)/.test(texto)) {
        this.botResponde("Somos <b>Procesados Margarita S.A.S.</b>, una empresa comprometida con la sostenibilidad y la economía circular. ♻️");
        return;
      }

      // 3) Coincidencia por palabras del título
      const opcionEncontrada = CONFIG.opciones.find(op => {
        const palabras = op.titulo.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s]/g, "").split(" ").filter(p => p.length > 3);
        return palabras.some(p => texto.includes(p));
      });

      if (opcionEncontrada) {
        this.reaccionarClick();
        this._ejecutarFlujoPorTipo(opcionEncontrada);
        return;
      }

      this.botResponde('No estoy seguro de haber entendido 🤔. Escribe el <b>número</b> de la opción (1 al 9) o <b>"menú"</b> para ver las opciones.');
    },

    reaccionarClick() {
      if (UI.robot) {
        UI.robot.classList.add("reaccion-click");
        setTimeout(() => UI.robot.classList.remove("reaccion-click"), 300);
      }
    }
  };

  window.ChatbotCore.FlujoChat = FlujoChat;
})();

(function () {
  "use strict";

  const { UI, DOM, MotorChat, FlujoChat } = window.ChatbotCore;

  const AppChat = {
    chatIniciado: false,
    timeoutEscribir: null,
    _inicializado: false,

    /* =========================================
       1) INICIALIZACIÓN
       ========================================= */
    init() {
      if (this._inicializado) return;
      this._inicializado = true;

      console.log("🤖 Iniciando Chatbot Margarita...");

      // ✅ Saludo automático (solo primera vez)
      setTimeout(() => {
        if (!UI.window.classList.contains("open") && !MotorChat.saludoRealizado) {
          MotorChat.ejecutarSaludo();
        }
      }, 1500);

      // --- Abrir/cerrar con el robot ---
      UI.robot.addEventListener("click", () => this.toggleChat());

      // --- Accesibilidad: abrir con Enter/Espacio cuando el robot tiene foco ---
      UI.robot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggleChat();
        }
      });

      // --- Abrir/cerrar con la burbuja ---
      UI.bubble.addEventListener("click", () => this.toggleChat());

      // --- Hover del robot (mostrar burbuja) ---
      UI.robot.addEventListener("mouseenter", () => {
        if (!UI.window.classList.contains("open") && !MotorChat.saludoRealizado) {
          UI.bubble.classList.add("visible");
        }
      });
      UI.robot.addEventListener("mouseleave", () => {
        if (!this.chatIniciado && !MotorChat.saludoRealizado) {
          UI.bubble.classList.remove("visible");
        }
      });

      // --- Botón cerrar (X) ---
      DOM.closeBtn.addEventListener("click", () => this.toggleChat());

      // --- Botón enviar ---
      DOM.sendBtn.addEventListener("click", () => this.enviarMensaje());

      // --- Enter en el input ---
      DOM.input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.keyCode === 13) {
          e.preventDefault();
          this.enviarMensaje();
        }
      });

      // --- Reacción visual al escribir ---
      DOM.input.addEventListener("input", () => {
        if (DOM.input.value.length > 0) {
          clearTimeout(this.timeoutEscribir);
          if (!DOM.input.disabled) MotorChat.reaccionEscribir();
        }
      });

      // --- Autofocus al abrir la ventana ---
      UI.window.addEventListener("transitionend", (e) => {
        if (e.propertyName === "transform" && UI.window.classList.contains("open")) {
          DOM.input.focus();
        }
      });

      // --- Accesibilidad: ESC cierra el chat ---
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && UI.window.classList.contains("open")) {
          this.toggleChat();
        }
      });
    },

    /* =========================================
       2) ABRIR / CERRAR LA VENTANA
       ========================================= */
    toggleChat() {
      UI.bubble.classList.remove("visible");
      const abierto = UI.window.classList.contains("open");

      if (abierto) {
        // --- CERRAR ---
        UI.window.classList.remove("open");
        this.chatIniciado = false;
        UI.robot.classList.remove("saludando");
        UI.robot.setAttribute("aria-expanded", "false");
      } else {
        // --- ABRIR ---
        UI.window.classList.add("open");
        this.chatIniciado = true;
        UI.robot.classList.remove("saludando");
        UI.robot.setAttribute("aria-expanded", "true");

        // Primera vez: mensaje de bienvenida + menú
        if (DOM.body.children.length === 0) {
          setTimeout(() => {
            MotorChat.agregarMensaje(
              "👋 ¡Hola! Soy el asistente virtual de <b>Procesados Margarita</b>. ¿En qué te puedo ayudar el día de hoy?",
              "bot"
            );
            setTimeout(() => FlujoChat.mostrarMenu(), 1500);
          }, 500);
        } else {
          // Si ya hay mensajes, solo enfocamos el input al abrir
          setTimeout(() => DOM.input.focus(), 300);
        }
      }
    },

    /* =========================================
       3) ENVIAR MENSAJE
       ========================================= */
    enviarMensaje() {
      const texto = DOM.input.value.trim();

      // Evitar enviar si está vacío o si el input está bloqueado
      if (!texto) return;
      if (DOM.input.disabled) return;

      this.reaccionEnviar();
      FlujoChat.procesarTextoEntrada(texto);
    },

    /* =========================================
       4) ANIMACIÓN AL ENVIAR
       ========================================= */
    reaccionEnviar() {
      if (!UI.robot) return;
      UI.robot.classList.add("reaccion-click");
      setTimeout(() => UI.robot.classList.remove("reaccion-click"), 300);
    }
  };

  /* =========================================
     ARRANCAR EL MOTOR
     ========================================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => AppChat.init());
  } else {
    AppChat.init();
  }
})();