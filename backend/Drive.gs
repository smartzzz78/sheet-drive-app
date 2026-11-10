/**
 * จัดการไฟล์บน Google Drive (รูปสลิปเงินเข้า)
 *
 * ใช้โฟลเดอร์ "App Uploads" ที่มีอยู่แล้วถ้าเจอ ถ้าไม่มีค่อยสร้างใหม่
 */

var DRIVE_FOLDER_NAME = 'App Uploads';

function getDriveFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('DRIVE_FOLDER_ID');

  // 1) ตาม ID ที่เคยบันทึกไว้ใน Script Properties
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (err) {
      // โฟลเดอร์อาจถูกลบไปแล้ว -> หาต่อด้านล่าง
    }
  }

  // 2) หาโฟลเดอร์ชื่อเดิมที่มีอยู่แล้ว (ใช้ของเดิม ไม่สร้างซ้ำ)
  var it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (it.hasNext()) {
    var existing = it.next();
    props.setProperty('DRIVE_FOLDER_ID', existing.getId());
    return existing;
  }

  // 3) ไม่เคยมีเลย -> สร้างครั้งเดียว
  var folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function uploadFile_(payload) {
  payload = payload || {};

  if (!payload.base64) {
    throw new Error('ไม่พบข้อมูลไฟล์ (base64)');
  }

  var filename = String(payload.filename || 'upload.bin');
  var mimeType = String(payload.mimeType || 'application/octet-stream');
  var bytes = Utilities.base64Decode(payload.base64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);

  var folder = getDriveFolder_();
  var file = folder.createFile(blob);

  // แชร์แบบ "ใครมีลิงก์ก็ดูได้" เพื่อให้ frontend เปิดไฟล์ได้
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // บางโดเมน/organization ห้ามตั้งค่าแชร์สาธารณะ - ไฟล์ยังถูกสร้างตามปกติ
  }

  return {
    id: file.getId(),
    name: file.getName(),
    url: file.getUrl(),
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
  };
}
