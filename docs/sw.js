/**
 * sw.js — Service worker สำหรับติดตั้งเป็นแอป (PWA)
 * กลยุทธ์: network-first (ได้ไฟล์ใหม่เสมอเมื่อออนไลน์) + cache สำรองตอนออฟไลน์
 * - ไม่แตะ request ข้ามโดเมน (เช่น Apps Script API) เด็ดขาด
 * - เปลี่ยน CACHE_NAME เมื่อต้องการล้าง cache ทั้งหมด
 */
var CACHE_NAME = 'coffee-slip-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // API/ฟอนต์ภายนอก: ปล่อยผ่าน ไม่ cache

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
