(function () {
  'use strict';

  var form = document.getElementById('record-form');
  var nameInput = document.getElementById('name');
  var noteInput = document.getElementById('note');
  var fileInput = document.getElementById('file');
  var submitBtn = document.getElementById('submit-btn');
  var refreshBtn = document.getElementById('refresh-btn');
  var statusEl = document.getElementById('status');
  var listEl = document.getElementById('record-list');

  function setStatus(message, isError) {
    statusEl.textContent = message || '';
    statusEl.classList.toggle('error', Boolean(isError));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render(records) {
    if (!records || records.length === 0) {
      listEl.innerHTML = '<li class="empty">ยังไม่มีข้อมูล</li>';
      return;
    }

    listEl.innerHTML = records.map(function (item) {
      var date = item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : '';
      var file = item.fileUrl
        ? '<a href="' + escapeHtml(item.fileUrl) + '" target="_blank" rel="noopener">' +
          escapeHtml(item.fileName || 'เปิดไฟล์') + '</a>'
        : '';

      return (
        '<li class="record">' +
          '<div class="record-main">' +
            '<strong>' + escapeHtml(item.name) + '</strong>' +
            (item.note ? '<p>' + escapeHtml(item.note) + '</p>' : '') +
            '<div class="record-meta">' + escapeHtml(date) + (file ? ' &middot; ' + file : '') + '</div>' +
          '</div>' +
        '</li>'
      );
    }).join('');
  }

  async function loadRecords() {
    try {
      setStatus('กำลังโหลดข้อมูล...');
      var records = await window.Api.request('list');
      render(records);
      setStatus('');
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    submitBtn.disabled = true;

    try {
      var name = nameInput.value.trim();
      var note = noteInput.value.trim();
      var file = fileInput.files && fileInput.files[0];

      if (!name) {
        throw new Error('กรุณากรอกชื่อ');
      }

      setStatus('กำลังบันทึก...');

      var fileInfo = null;
      if (file) {
        setStatus('กำลังอัปโหลดไฟล์...');
        var base64 = await window.Api.fileToBase64(file);
        fileInfo = await window.Api.request('upload', {
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: base64
        });
      }

      await window.Api.request('create', {
        name: name,
        note: note,
        fileName: fileInfo ? fileInfo.name : '',
        fileUrl: fileInfo ? fileInfo.url : ''
      });

      form.reset();
      setStatus('บันทึกสำเร็จ');
      await loadRecords();
    } catch (err) {
      setStatus(err.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  refreshBtn.addEventListener('click', loadRecords);

  loadRecords();
})();
