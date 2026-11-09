/**
 * จัดการไฟล์บน Google Drive
 */

function getDriveFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('DRIVE_FOLDER_ID');

  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (err) {
      // โฟลเดอร์อาจถูกลบไปแล้ว -> สร้างใหม่ด้านล่าง
    }
  }

  var folder = DriveApp.createFolder('App Uploads');
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
