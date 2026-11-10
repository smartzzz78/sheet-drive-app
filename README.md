# กาแฟสดสุขใจ (Slip Verify)

แอปหน้าร้านสำหรับร้านกาแฟ ใช้ **GitHub Pages** เป็น frontend และ **Google Apps Script** เป็น backend
โดยใช้ **Google Sheets** เป็นฐานข้อมูล และ **Google Drive** เก็บไฟล์แนบ

หน้าเว็บทั้ง 4 หน้า (แยกมาจาก `code.txt`):

| หน้า | ไฟล์ | คำอธิบาย |
|---|---|---|
| ตรวจสลิป (หน้าหลัก) | `docs/index.html` | สแกน/ตรวจสอบสลิป PromptPay, เสียงประกาศเงินเข้า, ตรวจสลิปวนซ้ำ |
| ภาพรวม | `docs/dashboard.html` | สรุปยอดและปิดกะ |
| ตั้งค่า & กะ | `docs/settings-shift.html` | ฮาร์ดแวร์, LINE notify, ปิดกะ |
| เคาน์เตอร์ | `docs/counter-live.html` | จอเคาน์เตอร์ & สั่งพิมพ์ใบเสร็จ |


## ลิงก์โปรเจกต์

| ส่วน | ลิงก์ |
|---|---|
| GitHub repo | https://github.com/smartzzz78/sheet-drive-app |
| เว็บไซต์ (GitHub Pages) | https://smartzzz78.github.io/sheet-drive-app/ |
| Apps Script editor | https://script.google.com/d/1Y7EnQMOskpC8JSmM7TYyTEFL1P4J83cbh3U77rgpZrm8bnR1ic0ntaxh/edit |
| Web App endpoint | https://script.google.com/macros/s/AKfycbynj48o22DK28qT63zH1nYS3t9rakgb47f1YJvrdEEcL8riWG6ba768cEyiIZ0uC5ZryQ/exec |

```
.
├─ docs/                 # Frontend (GitHub Pages เสิร์ฟจากโฟลเดอร์นี้)
│  ├─ index.html         # หน้าหลัก: ตรวจสลิป
│  ├─ dashboard.html     # ภาพรวม & ปิดกะ
│  ├─ settings-shift.html# ตั้งค่า & กะ
│  ├─ counter-live.html  # จอเคาน์เตอร์
│  └─ js/
│     ├─ config.js       # ใส่ Web App URL ที่นี่
│     └─ api.js          # ตัวเรียก API
├─ backend/              # Apps Script (clasp)
│  ├─ appsscript.json
│  ├─ Code.gs            # doGet/doPost + setupDatabase()
│  ├─ Sheets.gs          # CRUD กับ Google Sheets
│  └─ Drive.gs           # อัปโหลดไฟล์ขึ้น Drive
├─ scripts/
│  ├─ login.ps1          # เปิดหน้าต่าง login GitHub + Google
│  ├─ set-api-url.ps1    # อัปเดต API URL ใน frontend
│  └─ deploy.ps1         # push ทั้ง GitHub และ Apps Script
└─ package.json
```

## เครื่องมือที่ติดตั้งแล้ว

| เครื่องมือ | หน้าที่ |
|---|---|
| Git 2.56 | push โค้ดขึ้น GitHub |
| Node.js 26.13 + npm 11.20 | รัน clasp และ serve frontend |
| GitHub CLI 2.103.3 | สร้าง repo / เปิด GitHub Pages |
| clasp 3.4.1 | push โค้ดขึ้น Apps Script |

> ถ้าเปิด terminal ใหม่แล้วคำสั่งไม่เจอ ให้ปิดแล้วเปิด PowerShell ใหม่ (PATH จะอัปเดต)

---

## ขั้นตอนที่ 1 — Login

รัน:

```powershell
.\scripts\login.ps1
```

จะเปิดหน้าต่าง 2 อัน:
1. **GitHub CLI** — เลือก `GitHub.com` → `HTTPS` → `Login with a web browser` แล้วใส่ code
2. **clasp (Google)** — เลือกบัญชี Google ที่จะใช้เป็นเจ้าของ Sheet/Drive แล้วกด Allow

ตรวจสอบ:

```powershell
gh auth status
clasp show-authorized-user
```

## ขั้นตอนที่ 2 — เปิดโปรเจกต์ Apps Script

> โปรเจกต์ Apps Script ถูกสร้างไว้แล้ว (ดู `backend/.clasp.json`)
> ถ้าต้องสร้างใหม่บนเครื่องอื่น ให้รัน `npm run gas:create`

เปิดโปรเจกต์:

```powershell
clasp open
```

ในหน้า Apps Script editor:
1. เลือกฟังก์ชัน **`setupDatabase`** จาก dropdown แล้วกด **Run**
2. ครั้งแรกจะขออนุญาต (Authorize) → เลือกบัญชี → Advanced → Go to project → Allow
3. ดูผลลัพธ์ใน Execution log จะได้ `spreadsheetUrl` และ `folderUrl`
   (สเปรดชีตชื่อ `App Database`, โฟลเดอร์ Drive ชื่อ `App Uploads` ถูกสร้างให้อัตโนมัติ)

## ขั้นตอนที่ 3 — Deploy Web App

ในหน้า editor: **Deploy → New deployment → Web app**

- Description: `v1`
- Execute as: **Me**
- Who has access: **Anyone**

กด Deploy แล้วคัดลอก **Web app URL** (ลงท้ายด้วย `/exec`)

หรือใช้คำสั่ง:

```powershell
cd backend
clasp deploy --description "v1"
```

จากนั้นนำ URL มาตั้งค่าใน frontend:

```powershell
.\scripts\set-api-url.ps1 -Url "https://script.google.com/macros/s/XXXX/exec"
```

## ขั้นตอนที่ 4 — ทดสอบในเครื่อง

```powershell
npm run serve
```

เปิด http://localhost:3000 ลองบันทึกข้อมูล + แนบไฟล์
ถ้าสำเร็จ ข้อมูลจะไปอยู่ใน Google Sheets และไฟล์อยู่ใน Google Drive

## ขั้นตอนที่ 5 — สร้าง GitHub repo + เปิด Pages

```powershell
gh repo create sheet-drive-app --public --source=. --remote=origin --push
```

เปิด GitHub Pages ให้เสิร์ฟจาก `main` / `docs`:

```powershell
gh api -X POST repos/{owner}/sheet-drive-app/pages `
  -f "source[branch]=main" -f "source[path]=/docs"
```

หรือทำผ่านเว็บ: **Settings → Pages → Source: Deploy from a branch → main / docs → Save**

เว็บไซต์จะอยู่ที่ `https://<username>.github.io/sheet-drive-app/`

## ขั้นตอนที่ 6 — Deploy ครั้งต่อไป

แก้โค้ดเสร็จแล้วรันคำสั่งเดียว:

```powershell
.\scripts\deploy.ps1 -Message "เพิ่มฟีเจอร์..."
```

สคริปต์จะ `git push` (frontend) และ `clasp push` + `clasp deploy` (backend) ให้

> **สำคัญ:** ถ้า `clasp deploy` สร้าง deployment ใหม่ URL จะเปลี่ยน
> ให้รัน `.\scripts\set-api-url.ps1 -Url "..."` แล้ว commit/push อีกครั้ง
> หรือไปที่ Apps Script → Deploy → **Manage deployments → แก้ไข deployment เดิม** เพื่อให้ URL คงเดิม

---

## API ที่ backend รองรับ

| Action | Method | Body / Query | ผลลัพธ์ |
|---|---|---|---|
| `ping` | GET | `?action=ping` | `{ ok, time }` |
| `list` | GET | `?action=list` | รายการrecords ทั้งหมด |
| `create` | POST | `{ action:'create', payload:{ name, note, fileName, fileUrl } }` | record ที่สร้าง |
| `upload` | POST | `{ action:'upload', payload:{ filename, mimeType, base64 } }` | ข้อมูลไฟล์บน Drive |

หมายเหตุ: frontend ส่ง POST ด้วย `Content-Type: text/plain` เพื่อเลี่ยง CORS preflight
เพราะ Apps Script ไม่รองรับ request method `OPTIONS`

## โครงสร้างข้อมูลใน Sheets

ชีต `Records` มีคอลัมน์:
`id | name | note | fileName | fileUrl | createdAt`

## การตั้งค่าขั้นสูง

เก็บค่าใน **Script Properties** (Apps Script → Project Settings → Script properties):

| Key | ความหมาย |
|---|---|
| `SPREADSHEET_ID` | ID ของสเปรดชีตที่ใช้เป็น DB |
| `SHEET_NAME` | ชื่อชีต (ค่าเริ่มต้น `Records`) |
| `DRIVE_FOLDER_ID` | ID ของโฟลเดอร์ Drive สำหรับเก็บไฟล์ |

## แก้ปัญหาที่พบบ่อย

- **`clasp login --status` ขึ้นว่า not logged in** → รัน `.\scripts\login.ps1` ใหม่
- **หน้าเว็บขึ้น `ยังไม่ได้ตั้งค่า API_URL`** → รัน `set-api-url.ps1` แล้ว push ใหม่
- **401/403 จาก Apps Script** → ตรวจว่า Deploy เป็น "Anyone" และ Execute as "Me"
- **ไฟล์เปิดจากลิงก์ไม่ได้** → organization อาจห้ามแชร์สาธารณะ ให้แชร์โฟลเดอร์ `App Uploads` เอง
- **`npm` ใช้ไม่ได้ใน PowerShell** → ตั้ง execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
