/**
 * Entry point ของ Web App
 *
 * รองรับ action:
 *   GET  ?action=ping
 *   GET  ?action=list
 *   POST { action: 'create', payload: {...} }
 *   POST { action: 'upload', payload: {...} }
 *
 * ครั้งแรกให้รัน setupDatabase() ใน Apps Script editor 1 ครั้ง
 * เพื่อสร้าง Spreadsheet + โฟลเดอร์ Drive และเก็บ ID ลง Script Properties
 */

function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function handleRequest_(e, method) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var body = {};

    if (method === 'POST' && e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var action = String(body.action || params.action || '');
    var payload = body.payload || body;
    var data;

    switch (action) {
      case 'ping':
        data = { ok: true, time: new Date().toISOString() };
        break;
      case 'list':
        data = listRecords_();
        break;
      case 'create':
        data = createRecord_(payload);
        break;
      case 'upload':
        data = uploadFile_(payload);
        break;
      default:
        throw new Error('Unknown action: "' + action + '"');
    }

    return jsonResponse_({ ok: true, data: data });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message || String(err) });
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ตั้งค่าฐานข้อมูลครั้งแรก:
 * - สร้าง Google Spreadsheet (ถ้ายังไม่มี)
 * - สร้างโฟลเดอร์ Google Drive สำหรับเก็บไฟล์ (ถ้ายังไม่มี)
 * - เก็บ ID ไว้ใน Script Properties
 *
 * วิธีรัน: เลือกฟังก์ชัน setupDatabase แล้วกด Run ใน Apps Script editor
 */
function setupDatabase() {
  var props = PropertiesService.getScriptProperties();

  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    var ss = SpreadsheetApp.create('App Database');
    spreadsheetId = ss.getId();
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
  }

  if (!props.getProperty('SHEET_NAME')) {
    props.setProperty('SHEET_NAME', 'Records');
  }

  var sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  var folder = getDriveFolder_();

  var result = {
    spreadsheetId: spreadsheetId,
    spreadsheetUrl: SpreadsheetApp.openById(spreadsheetId).getUrl(),
    folderId: folder.getId(),
    folderUrl: folder.getUrl()
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * แสดงค่าที่ตั้งไว้ใน Script Properties
 */
function showConfig() {
  var props = PropertiesService.getScriptProperties();
  var result = {
    SPREADSHEET_ID: props.getProperty('SPREADSHEET_ID') || '',
    SHEET_NAME: props.getProperty('SHEET_NAME') || '',
    DRIVE_FOLDER_ID: props.getProperty('DRIVE_FOLDER_ID') || ''
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: props.getProperty('SPREADSHEET_ID') || '',
    sheetName: props.getProperty('SHEET_NAME') || 'Records',
    driveFolderId: props.getProperty('DRIVE_FOLDER_ID') || ''
  };
}
