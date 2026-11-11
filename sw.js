// Mercado App - service worker (offline-first)
var CACHE = "mercado-v11";
var ASSETS = ["./", "index.html", "styles.css", "firebase-config.js", "store.js", "cloud.js", "voice.js", "app.js",
  "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"];
var SDK = "https://www.gstatic.com/firebasejs/";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (u) { return c.add(u).catch(function () { }); }));
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

function cacheable(url) {
  return url.indexOf(self.location.origin) === 0 ||
    url.indexOf("https://cdnjs.cloudflare.com/ajax/libs/jspdf/") === 0 ||
    url.indexOf(SDK) === 0;
}

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || !cacheable(e.request.url)) return;   // Firestore/Auth vão direto pra rede
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || (e.request.mode === "navigate" ? caches.match("index.html") : undefined);
      });
    })
  );
});
