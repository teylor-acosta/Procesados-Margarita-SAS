const CACHE_NAME = 'margarita-erp-v2';

/* ======================================
   ARCHIVOS A CACHEAR
====================================== */

const urlsToCache = [

    '/',
    '/login',

    '/manifest.json',

    '/css/style1.css',
    '/css/login.css',

    '/js/auth.js',
    '/js/login.js',

    '/img/Fondo.webp',
    '/img/logo de procesados sin NIT.png',
    '/img/Gemini_Generated_Image_bo9w5fbo9w5fbo9w-removebg-preview.png'

];

/* ======================================
   INSTALL
====================================== */

self.addEventListener('install', event => {

    console.log('✅ SW instalado');

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => {

            return cache.addAll(urlsToCache);

        })

    );

    self.skipWaiting();

});

/* ======================================
   ACTIVATE
====================================== */

self.addEventListener('activate', event => {

    console.log('✅ SW activado');

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

                        console.log('🗑 Eliminando cache vieja:', key);

                        return caches.delete(key);

                    }

                })

            );

        })

    );

    self.clients.claim();

});

/* ======================================
   FETCH
====================================== */

self.addEventListener('fetch', event => {

    if (event.request.method !== 'GET') return;

    event.respondWith(

        caches.match(event.request)

        .then(cacheResponse => {

            /* 🔥 SI EXISTE EN CACHE */
            if (cacheResponse) {

                return cacheResponse;

            }

            /* 🔥 SI NO EXISTE */
            return fetch(event.request)

            .then(networkResponse => {

                return caches.open(CACHE_NAME)

                .then(cache => {

                    cache.put(
                        event.request,
                        networkResponse.clone()
                    );

                    return networkResponse;

                });

            })

            .catch(() => {

                /* 🔥 FALLBACK */

                if (
                    event.request.destination === 'image'
                ) {

                    return caches.match(
                        '/img/logo de procesados sin NIT.png'
                    );

                }

            });

        })

    );

});