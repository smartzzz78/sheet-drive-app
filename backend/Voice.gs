/**
 * เสียง AI (Gemini TTS) — สร้างเสียงพูดไทยจากข้อความ
 *
 * คีย์ API เก็บใน Script Properties (ชื่อ GEMINI_API_KEY) ไม่ถูกส่งกลับให้ frontend เด็ดขาด
 * ตั้งค่าครั้งแรกผ่านหน้า "ตั้งค่า & กะ" (action=setVoiceConfig) หรือใน Apps Script editor
 * Project Settings -> Script Properties -> GEMINI_API_KEY
 *
 * Action ที่เพิ่มใน Code.gs:
 *   GET  ?action=voiceConfig                              -> สถานะคีย์ + โหมดเสียงปัจจุบัน
 *   POST { action:'setVoiceConfig', payload:{...} }      -> ตั้งคีย์ / โหมดเสียง
 *   POST { action:'speak', payload:{ text, voice? } }    -> ได้ base64 เสียงกลับไปเล่น
 */

var TTS_DEFAULT_MODEL = 'gemini-3.8-flash-tts';
var TTS_DEFAULT_VOICE = 'Zephyr';

function getVoiceSettings_() {
  var props = PropertiesService.getScriptProperties();
  return {
    apiKey: props.getProperty('GEMINI_API_KEY') || '',
    model: props.getProperty('TTS_MODEL') || TTS_DEFAULT_MODEL,
    voice: props.getProperty('TTS_VOICE') || TTS_DEFAULT_VOICE
  };
}

function getVoiceStatus_() {
  var s = getVoiceSettings_();
  return {
    hasKey: !!s.apiKey,
    model: s.model,
    voice: s.voice
  };
}

/**
 * ตั้งค่าเสียง: คีย์ / โหมดเสียง / โมเดล
 * - ตั้งคีย์ครั้งแรก (ยังไม่มีคีย์) ทำได้เลย
 * - เปลี่ยนคีย์เมื่อมีคีย์อยู่แล้ว ต้องส่ง currentKey ที่ตรงกับคีย์เดิม
 *   (กันคนอื่นมาเขียนทับ) — ถ้าจะเปลี่ยนคีย์ใหม่ ให้ลบ GEMINI_API_KEY ใน Script Properties ก่อน
 * - เปลี่ยนโหมดเสียง/โมเดล ทำได้เสมอ
 */
function setVoiceConfig_(payload) {
  payload = payload || {};
  var props = PropertiesService.getScriptProperties();
  var storedKey = props.getProperty('GEMINI_API_KEY') || '';

  if (payload.apiKey !== undefined && payload.apiKey !== null && String(payload.apiKey) !== '') {
    var newKey = String(payload.apiKey).trim();
    if (storedKey && String(payload.currentKey || '').trim() !== storedKey) {
      throw new Error('มีคีย์อยู่แล้ว — ต้องใส่คีย์ปัจจุบัน (currentKey) จึงจะเปลี่ยนได้');
    }
    props.setProperty('GEMINI_API_KEY', newKey);
  }

  if (payload.voice && String(payload.voice).trim()) {
    props.setProperty('TTS_VOICE', String(payload.voice).trim());
  }
  if (payload.model && String(payload.model).trim()) {
    props.setProperty('TTS_MODEL', String(payload.model).trim());
  }

  return getVoiceStatus_();
}

/**
 * สร้างเสียงพูดจากข้อความ (Gemini TTS)
 * คืนค่า { audioBase64, mimeType } — mimeType เป็น audio/wav หรือ PCM ดิบ
 */
function speak_(payload) {
  payload = payload || {};
  var text = String(payload.text || '').trim();
  if (!text) {
    throw new Error('ไม่พบข้อความที่จะให้พูด');
  }

  var settings = getVoiceSettings_();
  if (!settings.apiKey) {
    throw new Error('ยังไม่ได้ตั้งค่า AI Voice API key — ตั้งได้ที่หน้า "ตั้งค่า & กะ" หรือ Script Properties (GEMINI_API_KEY)');
  }

  var model = String(payload.model || settings.model);
  var voice = String(payload.voice || settings.voice);

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
  var body = {
    contents: [{
      parts: [{ text: 'พูดภาษาไทย: ' + text }]
    }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
      }
    }
  };

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': settings.apiKey },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var resText = res.getContentText();

  if (code !== 200) {
    var apiMsg = '';
    try {
      apiMsg = JSON.parse(resText).error.message || '';
    } catch (e) {
      apiMsg = resText.slice(0, 150);
    }
    throw new Error('Gemini TTS ผิดพลาด (HTTP ' + code + '): ' + apiMsg);
  }

  var json = JSON.parse(resText);
  var parts = json.candidates && json.candidates[0] && json.candidates[0].content &&
              json.candidates[0].content.parts || [];
  var audioPart = null;
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].inlineData && parts[i].inlineData.data) {
      audioPart = parts[i].inlineData;
      break;
    }
  }

  if (!audioPart) {
    throw new Error('Gemini TTS ไม่คืนข้อมูลเสียงกลับมา');
  }

  return {
    audioBase64: audioPart.data,
    mimeType: audioPart.mimeType || 'audio/L16;rate=24000'
  };
}

/**
 * ตรวจสอบว่าคีย์ที่ตั้งไว้ใช้งานได้จริง (รันจาก editor เพื่อ debug)
 */
function testVoiceSetup() {
  var status = getVoiceStatus_();
  var result = speak_({ text: 'ทดสอบเสียง' });
  Logger.log(JSON.stringify({
    status: status,
    audioBytes: Math.round(result.audioBase64.length * 3 / 4),
    mimeType: result.mimeType
  }, null, 2));
  return 'คีย์ใช้งานได้ — เสียงสร้างสำเร็จ';
}
