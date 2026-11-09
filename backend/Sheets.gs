/**
 * จัดการฐานข้อมูลด้วย Google Sheets
 */

var HEADERS = ['id', 'name', 'note', 'fileName', 'fileUrl', 'createdAt'];

function getSpreadsheet_() {
  var config = getConfig_();
  if (!config.spreadsheetId) {
    throw new Error('ยังไม่ได้ตั้งค่าฐานข้อมูล กรุณารัน setupDatabase() ก่อน');
  }
  return SpreadsheetApp.openById(config.spreadsheetId);
}

function getSheet_() {
  var config = getConfig_();
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(config.sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(config.sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function listRecords_() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var records = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;

    records.push({
      id: String(row[0]),
      name: String(row[1] || ''),
      note: String(row[2] || ''),
      fileName: String(row[3] || ''),
      fileUrl: String(row[4] || ''),
      createdAt: row[5] instanceof Date ? row[5].toISOString() : String(row[5] || '')
    });
  }

  // แสดงรายการล่าสุดก่อน
  return records.reverse();
}

function createRecord_(payload) {
  payload = payload || {};

  var name = String(payload.name || '').trim();
  if (!name) {
    throw new Error('กรุณาระบุชื่อ');
  }

  var sheet = getSheet_();
  var record = {
    id: Utilities.getUuid(),
    name: name,
    note: String(payload.note || ''),
    fileName: String(payload.fileName || ''),
    fileUrl: String(payload.fileUrl || ''),
    createdAt: new Date()
  };

  sheet.appendRow([
    record.id,
    record.name,
    record.note,
    record.fileName,
    record.fileUrl,
    record.createdAt
  ]);

  record.createdAt = record.createdAt.toISOString();
  return record;
}
