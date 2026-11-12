/**
 * ============================================================
 *  PROCESADOS MARGARITA S.A.S.
 *  index.js 
 * ============================================================
 */

(function () {
    'use strict';

    /* ============================================================
       1. UTILIDADES
       ============================================================ */

    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /**
     * Throttle basado en requestAnimationFrame.
     * Garantiza máximo 1 ejecución por frame (~60fps).
     */
    function rafThrottle(callback) {
        let ticking = false;
        return function throttled(...args) {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                callback.apply(this, args);
                ticking = false;
            });
        };
    }

    /** Easing easeOutCubic — desaceleración natural */
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    /* ============================================================
       2. PREFERENCIAS DEL USUARIO
       ============================================================ */

    const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    const supportsIO = 'IntersectionObserver' in window;

    /* ============================================================
       3. AÑO DINÁMICO DEL FOOTER
       ============================================================ */

    function initYear() {
        const yearEl = $('#current-year');
        if (!yearEl) return;
        const year = new Date().getFullYear();
        yearEl.textContent = year;
        yearEl.setAttribute('datetime', String(year));
    }

    /* ============================================================
       4. NAVBAR STICKY
       ============================================================ */

    function initNavbar() {
        const navbar = $('.navbar');
        if (!navbar) return;

        const update = rafThrottle(() => {
            navbar.classList.toggle('scrolled', window.scrollY > 80);
        });

        window.addEventListener('scroll', update, { passive: true });
        update(); // ejecutar al cargar por si ya estaba scrolleado
    }

    /* ============================================================
       5. CONTADORES ANIMADOS
       ============================================================ */

    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        if (Number.isNaN(target)) return;

        // Soporta data-suffix="%" o "+" o nada
        const suffix = el.dataset.suffix || '';
        const duration = 1600; // ms
        const start = performance.now();

        if (prefersReducedMotion) {
            el.textContent = target + suffix;
            return;
        }

        function tick(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = easeOutCubic(progress);
            const current  = Math.floor(eased * target);

            el.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(tick);
    }

    function initCounters() {
        const counters = $$('.contador');
        if (counters.length === 0) return;

        // Fallback sin IntersectionObserver
        if (!supportsIO) {
            counters.forEach(animateCounter);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.4, rootMargin: '0px 0px -60px 0px' }
        );

        counters.forEach((c) => observer.observe(c));
    }

    /* ============================================================
       6. SCROLL REVEAL
       (si usas .reveal en tu HTML más adelante)
       ============================================================ */

    function initReveal() {
        const revealEls = $$('.reveal');
        if (revealEls.length === 0) return;

        if (!supportsIO || prefersReducedMotion) {
            revealEls.forEach((el) => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
        );

        revealEls.forEach((el) => observer.observe(el));
    }

    /* ============================================================
       7. SCROLL SPY — aria-current dinámico
       ============================================================ */

    function initScrollSpy() {
        const sections = $$('main > section[id]');
        const navLinks = $$('nav a[href^="#"]');
        if (sections.length === 0 || navLinks.length === 0) return;
        if (!supportsIO) return;

        const linkMap = new Map();
        navLinks.forEach((link) => {
            const id = link.getAttribute('href').slice(1);
            if (id) linkMap.set(id, link);
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const link = linkMap.get(entry.target.id);
                    if (!link) return;

                    if (entry.isIntersecting) {
                        navLinks.forEach((l) => l.removeAttribute('aria-current'));
                        link.setAttribute('aria-current', 'page');
                    }
                });
            },
            {
                threshold: 0,
                rootMargin: '-45% 0px -50% 0px' // activa solo cuando la sección cruza el centro
            }
        );

        sections.forEach((s) => observer.observe(s));
    }

    /* ============================================================
       8. SMOOTH SCROLL con offset del navbar
       ============================================================ */

    function initSmoothScroll() {
        const navbar = $('.navbar');

        $$('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || href === '#') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();

                const navHeight = navbar ? navbar.offsetHeight : 0;
                const offset = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                window.scrollTo({
                    top: offset,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });

                // Actualiza la URL sin saltar
                if (history.pushState) {
                    history.pushState(null, '', href);
                }
            });
        });
    }

    /* ============================================================
       9. INICIALIZACIÓN SEGURA
       ============================================================ */

    function init() {
        try {
            initYear();
            initNavbar();
            initCounters();
            initReveal();
            initScrollSpy();
            initSmoothScroll();
        } catch (err) {
            // Silencioso en producción — no rompe el render
            if (window.console && console.warn) {
                console.warn('[index.js] Error al inicializar:', err);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

})();