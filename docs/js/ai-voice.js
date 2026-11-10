/**
 * ai-voice.js — เสียง AI สำหรับประกาศยอดเงินเข้า (Gemini TTS ผ่าน Apps Script)
 *
 * window.AiVoice.speak(text, { voice, model }) -> Promise<'ai'|'system'>
 *   1. ขอเสียงจาก backend (action=speak) ซึ่งเรียก Gemini TTS ให้
 *      (คีย์ API อยู่ฝั่งเซิร์ฟเวอร์ ไม่มีการส่งออกมาหน้าเว็บ)
 *   2. เล่นเสียงที่ได้ (audio/wav หรือ PCM 24kHz ที่ต้องใส่ header WAV เอง)
 *   3. ถ้า API ล้มเหลว (ไม่มีคีย์/โควต้า/ออฟไลน์) -> ใช้เสียงระบบ speechSynthesis สำรอง
 *
 * window.AiVoice.status() -> Promise<{ hasKey, voice, model }>
 */
(function () {
  'use strict';

  var currentAudio = null;

  function base64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }

  // PCM 16-bit mono ดิบ -> ใส่ header RIFF/WAVE เพื่อเล่นได้
  function pcmToWavBytes(pcm, rate) {
    var wav = new Uint8Array(44 + pcm.length);
    var writeStr = function (s, off) {
      for (var i = 0; i < s.length; i++) wav[off + i] = s.charCodeAt(i);
    };
    var u32 = function (v, off) {
      wav[off] = v & 255; wav[off + 1] = (v >> 8) & 255;
      wav[off + 2] = (v >> 16) & 255; wav[off + 3] = (v >> 24) & 255;
    };
    var u16 = function (v, off) {
      wav[off] = v & 255; wav[off + 1] = (v >> 8) & 255;
    };

    writeStr('RIFF', 0);  u32(36 + pcm.length, 4);   writeStr('WAVE', 8);
    writeStr('fmt ', 12); u32(16, 16);               u16(1, 20);  // PCM
    u16(1, 22);           u32(rate, 24);             u32(rate * 2, 28);
    u16(2, 32);           u16(16, 34);               writeStr('data', 36);
    u32(pcm.length, 40);
    wav.set(pcm, 44);
    return wav;
  }

  function buildAudioUrl(data) {
    var mime = String(data.mimeType || '');
    var bytes = base64ToBytes(data.audioBase64);

    if (/wav/i.test(mime)) {
      return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    }
    // audio/L16;rate=24000 (PCM ดิบ)
    var m = mime.match(/rate=(\d+)/);
    var rate = m ? parseInt(m[1], 10) : 24000;
    return URL.createObjectURL(new Blob([pcmToWavBytes(bytes, rate)], { type: 'audio/wav' }));
  }

  function stopCurrent() {
    if (currentAudio) {
      var a = currentAudio;
      currentAudio = null;
      try { a.pause(); } catch (e) { /* ไม่เป็นไร */ }
      try { URL.revokeObjectURL(a.src); } catch (e) { /* ไม่เป็นไร */ }
      // ปลดล็อก promise ที่รอฟังอยู่ (ถ้ามี) ให้จบไป
      if (a.__whenDone) {
        try { a.__whenDone(); } catch (e) { /* ไม่เป็นไร */ }
      }
    }
  }

  // เสียงระบบสำรอง (เหมือน speakThai เดิม)
  function systemSpeak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH';
      u.rate = 1.0;
      u.pitch = 1.05;
      var voices = window.speechSynthesis.getVoices();
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        if (v.lang === 'th-TH' || (v.lang || '').indexOf('th') === 0 ||
            (v.name || '').toLowerCase().indexOf('thai') !== -1) {
          u.voice = v;
          break;
        }
      }
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('systemSpeak ล้มเหลว:', e);
    }
  }

  async function speak(text, opts) {
    text = String(text || '');
    if (!text) return 'none';

    try {
      var payload = { text: text };
      if (opts && opts.voice) payload.voice = opts.voice;
      if (opts && opts.model) payload.model = opts.model;

      var data = await window.Api.request('speak', payload);
      var url = buildAudioUrl(data);

      stopCurrent();
      currentAudio = new Audio(url);
      var whenDone = new Promise(function (resolve) {
        currentAudio.__whenDone = resolve;
        currentAudio.onended = function () {
          try { URL.revokeObjectURL(url); } catch (e) { /* ไม่เป็นไร */ }
          resolve();
        };
        currentAudio.onerror = resolve;
      });

      await currentAudio.play();
      await whenDone; // รอให้เล่นจบจริง (หรือถูกเสียงใหม่แทนที่)
      return 'ai';
    } catch (err) {
      var msg = err && err.message ? err.message : String(err);
      console.warn('AI voice ไม่สำเร็จ ใช้เสียงระบบแทน:', msg);
      stopCurrent();
      systemSpeak(text);
      return 'system';
    }
  }

  async function status() {
    try {
      return await window.Api.request('voiceConfig');
    } catch (e) {
      return { hasKey: false, error: e.message };
    }
  }

  window.AiVoice = { speak: speak, status: status };
})();
