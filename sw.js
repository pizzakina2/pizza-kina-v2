const CACHE_NAME = "pizzakina-full-v3";
const ASSETS = ["/","/index.html","/admin.html","/obsluga.html","/kuchnia.html","/ekran.html","/style.css","/firebase-config.js","/shared.js","/index.js","/admin.js","/service.js","/kitchen.js","/screen.js","/manifest.json","/apple-touch-icon.png","/icon-192.png","/icon-512.png"];
self.addEventListener("install", (event)=>{ event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (event)=>{ event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE_NAME).map((key)=>caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", (event)=>{ if(event.request.method!=="GET") return; event.respondWith(caches.match(event.request).then((cached)=>cached || fetch(event.request).catch(()=>caches.match("/index.html")))); });
