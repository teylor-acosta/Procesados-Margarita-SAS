const CACHE_NAME = 'margarita-static-v1';

/* ======================================
   SOLO ARCHIVOS ESTÁTICOS
====================================== */

const STATIC_ASSETS = [

    '/manifest.json',

    '/css/style1.css',
    '/css/login.css',

    '/img/Fondo.webp',
    '/img/logo de procesados sin NIT.png',
    '/img/logo de procesados solo.png',
    '/img/Gemini_Generated_Image_bo9w5fbo9w5fbo9w-removebg-preview.png'

];

/* ======================================
   INSTALL
====================================== */

self.addEventListener('install', event => {

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)

        .then(cache => {

            return cache.addAll(STATIC_ASSETS);

        })

    );

});

/* ======================================
   ACTIVATE
====================================== */

self.addEventListener('activate', event => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {

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

    // 🔥 SOLO GET
    if (event.request.method !== 'GET') {

        return;

    }

    event.respondWith(

        caches.match(event.request)

        .then(cacheResponse => {

            // ✅ CACHE
            if (cacheResponse) {

                return cacheResponse;

            }

            // 🌐 NETWORK
            return fetch(event.request)

            .then(networkResponse => {

                // 🔥 NO CACHEAR APIs
                if (

                    event.request.url.includes('/api/')

                ) {

                    return networkResponse;

                }

                return caches.open(CACHE_NAME)

                .then(cache => {

                    cache.put(

                        event.request,

                        networkResponse.clone()

                    );

                    return networkResponse;

                });

            });

        })

    );

});