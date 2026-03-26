const CACHE_NAME = 'pizzakina-firestore-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/index.js', '/shared.js', '/firebase-config.js', '/admin.html', '/admin.js', '/obsluga.html', '/service.js', '/kuchnia.html', '/kitchen.js', '/ekran.html', '/screen.js', '/verify.html', '/verify.js', '/reset.html', '/reset.js', '/manifest.json', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', (e)=>{ e.waitUntil(caches.open(CACHE_NAME).then((c)=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ e.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE_NAME).map((k)=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e)=>{ if(e.request.method !== 'GET') return; e.respondWith(caches.match(e.request).then((r)=>r || fetch(e.request))); });
