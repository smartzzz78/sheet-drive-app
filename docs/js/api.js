(function () {
  'use strict';

  function getApiUrl() {
    var url = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || '';
    if (!url || url.indexOf('PASTE_') === 0) {
      throw new Error('ยังไม่ได้ตั้งค่า API_URL ใน docs/js/config.js');
    }
    return url;
  }

  async function request(action, payload) {
    var url = getApiUrl();
    var res;

    if (payload) {
      // ใช้ text/plain เพื่อเลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS)
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, payload: payload })
      });
    } else {
      res = await fetch(url + '?action=' + encodeURIComponent(action));
    }

    if (!res.ok) {
      throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    }

    var json = await res.json();
    if (!json.ok) {
      throw new Error(json.error || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
    }
    return json.data;
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result);
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  window.Api = { request: request, fileToBase64: fileToBase64 };
})();
