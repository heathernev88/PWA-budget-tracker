const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/styles.css",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0"
];

const PRECACHE = "precache-v1";
const RUNTIME = "runtime-v1";

self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(PRECACHE).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== PRECACHE && key !== RUNTIME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    console.log(`Fetch  ${JSON.stringify(caches)}`);
    if (event.request.url.includes("/api/")) {
        event.respondWith(
            caches.open(RUNTIME)
                .then(cache => {
                    return fetch(event.request)
                        .then(response => {
                            if (response.status === 200) {
                                cache.put(event.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err => {
                            return cache.match(event.request);
                        });
                })
                .catch(err => console.log(err))
        );
        return;
    };

    event.respondWith(
        caches.open(PRECACHE).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});