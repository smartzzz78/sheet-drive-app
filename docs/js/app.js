/**
 * app.js — ตัวเชื่อมหน้า index.html (ตรวจสลิป) เข้ากับฐานข้อมูล Google Sheets
 *
 * หน้าที่:
 *  1. ดึงรายการเงินเข้าจาก Apps Script API มาแสดงในฟีด
 *  2. Poll ทุก 15 วินาที — ถ้ามีรายการใหม่ = เสียงกริ่ง + อ่านออกเสียงยอดเงิน
 *     ("เงินเข้า 150 บาท จาก คุณกิตติศักดิ์")
 *  3. ปุ่ม "ซิงก์ธนาคาร" กลายเป็นการดึงข้อมูลจริง
 *
 * ใช้ร่วมกับฟังก์ชันเสียงของหน้า (playHarmonicDingDong, speakThai, showToast,
 * openSlipModal) ที่ประกาศเป็น global ไว้ใน index.html
 */
(function () {
  'use strict';

  var POLL_MS = 15000;          // ดึงข้อมูลใหม่ทุก 15 วินาที
  var initialized = false;      // โหลดครั้งแรกยังไม่ประกาศเสียง
  var latestRecords = [];      // เก็บรายการล่าสุดไว้ใช้กับปุ่มในการ์ด

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtTime(iso) {
    if (!iso) return '--:--:--';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '--:--:--';
    return d.toLocaleTimeString('th-TH', { hour12: false });
  }

  function isToday(iso) {
    if (!iso) return false;
    var d = new Date(iso);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  }

  /* ---------- การ์ดในฟีด ---------- */

  function cardHtml(r, i) {
    var amount = Number(r.amount) || 0;
    var time = fmtTime(r.createdAt);
    var meta = 'เวลา ' + time + ' น.' + (r.ref ? ' &middot; Ref: ' + escapeHtml(r.ref) : '');
    var slipLink = r.fileUrl
      ? '<a class="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-0.5 hover:underline" href="' +
        escapeHtml(r.fileUrl) + '" target="_blank" rel="noopener"><span>ดูไฟล์สลิป</span>' +
        '<span class="material-symbols-outlined text-[14px]">chevron_right</span></a>'
      : '<span class="font-label-sm text-label-sm text-on-surface-variant font-medium">บันทึกแล้ว</span>';

    return (
      '<article class="flex flex-col p-space-md rounded-2xl bg-surface-container-lowest shadow-md gap-3 relative border border-surface-container-high/60">' +
        '<div class="flex items-start justify-between">' +
          '<div class="flex items-center gap-3">' +
            '<div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm relative">' +
              '<span class="material-symbols-outlined text-[28px]">payments</span>' +
              '<span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary-container flex items-center justify-center text-on-primary">' +
                '<span class="material-symbols-outlined text-[10px]">check</span>' +
              '</span>' +
            '</div>' +
            '<div class="flex flex-col min-w-0">' +
              '<div class="flex items-center gap-1.5">' +
                '<span class="font-title-md text-title-md text-on-surface font-bold truncate">' +
                  escapeHtml(r.customer || 'ลูกค้า') + '</span>' +
                (r.bank ? '<span class="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">' + escapeHtml(r.bank) + '</span>' : '') +
              '</div>' +
              '<span class="font-label-sm text-label-sm text-on-surface-variant">' + meta + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="flex flex-col items-end">' +
            '<span class="font-headline-md text-headline-md font-bold text-primary leading-tight">+&#3647;' + amount.toFixed(2) + '</span>' +
            '<span class="font-label-sm text-label-sm text-primary font-semibold">เงินเข้า</span>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low">' +
          '<div class="flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings: \'FILL\' 1;">verified</span>' +
            '<span class="font-label-sm text-label-sm text-primary font-bold">บันทึกใน Google Sheets แล้ว</span>' +
          '</div>' +
          slipLink +
        '</div>' +
        '<div class="grid grid-cols-2 gap-space-xs pt-1">' +
          '<button class="h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-98" onclick="announceRecord(' + i + ')">' +
            '<span class="material-symbols-outlined text-[18px] text-secondary">volume_up</span>' +
            '<span>ฟังเสียงยอด</span>' +
          '</button>' +
          '<button class="h-10 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-label-md text-label-md font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform" onclick="openRecordModal(' + i + ')">' +
            '<span class="material-symbols-outlined text-[18px]">visibility</span>' +
            '<span>ดูหลักฐานสลิป</span>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderFeed(records) {
    var listEl = document.getElementById('slipFeedList');
    if (!listEl) return;

    if (!records || records.length === 0) {
      listEl.innerHTML =
        '<p class="font-body-md text-body-md text-on-surface-variant py-6 text-center leading-relaxed">' +
        'ยังไม่มีรายการเงินเข้า — เพิ่มรายการใหม่ได้ที่แท็บ "เพิ่มเงินเข้า"<br>หรือพิมพ์ใน Google Sheet โดยตรงแล้วระบบจะอ่านเสียงให้เอง</p>';
      return;
    }

    listEl.innerHTML = records.map(cardHtml).join('');
  }

  function updateStats(records) {
    var countEl = document.getElementById('todayPassedCount');
    if (countEl) {
      var todayCount = 0;
      (records || []).forEach(function (r) { if (isToday(r.createdAt)) todayCount++; });
      countEl.innerText = String(todayCount);
    }
  }

  /* ---------- เสียงอ่านยอดเงินเข้า ---------- */

  function announceText(rec) {
    var amount = Number(rec.amount) || 0;
    var text = 'เงินเข้า ' + amount + ' บาท';
    if (rec.customer) text += ' จาก ' + rec.customer;
    return text;
  }

  function speakRecord(rec) {
    var text = announceText(rec);
    if (typeof playHarmonicDingDong === 'function') playHarmonicDingDong();
    setTimeout(function () {
      if (typeof speakThai === 'function') speakThai(text);
    }, 300);

    var title = document.getElementById('voiceBannerTitle');
    var status = document.getElementById('voiceStatusText');
    if (title) title.innerText = 'ประกาศยอดเงินเข้าล่าสุด';
    if (status) status.innerText = '"' + text + '"';

    if (typeof showToast === 'function') {
      showToast('เงินเข้าใหม่', text, false);
    }
  }

  // ประกาศหลายรายการต่อกันโดยไม่ซ้อนเสียงกัน
  function announceNewRecords(records) {
    var sorted = records.slice().sort(function (a, b) {
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
    sorted.forEach(function (rec, idx) {
      setTimeout(function () { speakRecord(rec); }, idx * 4500);
    });
  }

  /* ---------- ปุ่มในการ์ด (เรียกจาก onclick) ---------- */

  window.announceRecord = function (i) {
    var rec = latestRecords[i];
    if (rec) speakRecord(rec);
  };

  window.openRecordModal = function (i) {
    var rec = latestRecords[i];
    if (!rec || typeof openSlipModal !== 'function') return;
    var amount = Number(rec.amount) || 0;
    openSlipModal(
      String(rec.ref || rec.id || ''),
      amount.toFixed(2),
      String(rec.customer || 'ลูกค้า'),
      String(rec.bank || 'ธนาคาร -'),
      fmtTime(rec.createdAt),
      rec.note ? 'หมายเหตุ: ' + rec.note : 'ไม่ระบุบัญชีต้นทาง'
    );
  };

  /* ---------- วงจรดึงข้อมูล ---------- */

  var knownIds = {};

  function applyRecords(records) {
    latestRecords = records || [];
    var fresh = [];
    (records || []).forEach(function (r) {
      if (r && r.id && !knownIds[r.id]) {
        knownIds[r.id] = true;
        fresh.push(r);
      }
    });

    renderFeed(latestRecords);
    updateStats(latestRecords);

    if (initialized && fresh.length > 0) {
      announceNewRecords(fresh);
    }
    initialized = true;
  }

  function refresh() {
    return window.Api.request('list').then(applyRecords).catch(function (err) {
      console.warn('ดึงข้อมูลจาก Apps Script ไม่สำเร็จ:', err && err.message ? err.message : err);
      var title = document.getElementById('voiceBannerTitle');
      if (title && !initialized) {
        title.innerText = 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ';
        var status = document.getElementById('voiceStatusText');
        if (status) status.innerText = '"' + (err && err.message ? err.message : 'ตรวจสอบการเชื่อมต่อ API') + '"';
      }
      initialized = true;
    });
  }

  /* ---------- ปุ่ม "ซิงก์ธนาคาร" ให้ดึงข้อมูลจริง ---------- */

  window.refreshSlipFeed = function () {
    if (typeof getAudioContext === 'function') getAudioContext();
    if (typeof playTone === 'function') playTone(700, 0.1, 'sine', 0.2);

    var icon = document.getElementById('syncIcon');
    if (icon) icon.classList.add('animate-spin');

    refresh().then(function () {
      if (icon) icon.classList.remove('animate-spin');
      if (typeof playHarmonicDingDong === 'function') playHarmonicDingDong();
      if (typeof showToast === 'function') {
        showToast('ซิงก์สำเร็จ', 'ดึงรายการเงินเข้าล่าสุดจาก Google Sheets แล้ว', false);
      }
    });
  };

  /* ---------- เริ่มทำงาน (สคริปต์อยู่ท้าย body จึง DOM พร้อมแล้ว) ---------- */

  refresh();
  setInterval(refresh, POLL_MS);
})();
