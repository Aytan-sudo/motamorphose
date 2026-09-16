const CACHE = 'motamorphose-v8';
const RESSOURCES = [
  './', './index.html', './css/style.css', './manifest.webmanifest', './assets/icon.svg',
  './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
  './js/app.js', './js/render.js', './js/graphe.js', './js/bfs.js', './js/paires.js',
  './js/partie.js', './js/defi.js', './js/hasard.js', './js/records.js', './js/themes.js',
  './commun/passeport.js', './commun/liaison.js', './commun/passeport.css',
  './js/data/mots4.json', './js/data/mots5.json', './js/data/mots6.json'
];
self.addEventListener('install', evenement => evenement.waitUntil(caches.open(CACHE).then(cache => cache.addAll(RESSOURCES)).then(() => self.skipWaiting())));
self.addEventListener('activate', evenement => evenement.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(c => c.startsWith('motamorphose-v') && c !== CACHE).map(c => caches.delete(c)))).then(() => self.clients.claim())));
self.addEventListener('fetch', evenement => {
  if (evenement.request.method !== 'GET') return;
  evenement.respondWith(caches.match(evenement.request).then(cache => cache || fetch(evenement.request).then(reponse => {
    const copie = reponse.clone(); caches.open(CACHE).then(c => c.put(evenement.request, copie)); return reponse;
  }).catch(() => caches.match('./index.html'))));
});
