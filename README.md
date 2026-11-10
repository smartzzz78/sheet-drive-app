# กาแฟสดสุขใจ (Slip Verify)

แอปหน้าร้านสำหรับร้านกาแฟ ใช้ **GitHub Pages** เป็น frontend และ **Google Apps Script** เป็น backend
โดยใช้ **Google Sheets** เป็นฐานข้อมูล และ **Google Drive** เก็บไฟล์แนบ

หน้าเว็บทั้ง 5 หน้า (แยกมาจาก `code app realtime money.txt`):

| หน้า | ไฟล์ | คำอธิบาย |
|---|---|---|
| ตรวจสลิป (หน้าหลัก) | `docs/index.html` | ฟีดรายการเงินเข้าจาก Google Sheets + **อ่านออกเสียงยอดเงินเข้าอัตโนมัติ** (poll ทุก 15 วิ) |
| เพิ่มเงินเข้า | `docs/money-in.html` | ฟอร์มบันทึกยอดรับเงิน บันทึกลง Sheets + อัปโหลดรูปสลิปขึ้น Drive |
| ภาพรวม | `docs/dashboard.html` | สรุปยอดและปิดกะ |
| ตั้งค่า & กะ | `docs/settings-shift.html` | ฮาร์ดแวร์, LINE notify, ปิดกะ |
| เคาน์เตอร์ | `docs/counter-live.html` | จอเคาน์เตอร์ & สั่งพิมพ์ใบเสร็จ |


## ลิงก์โปรเจกต์

| ส่วน | ลิงก์ |
|---|---|
| GitHub repo | https://github.com/smartzzz78/sheet-drive-app |
| เว็บไซต์ (GitHub Pages) | https://smartzzz78.github.io/sheet-drive-app/ |
| Apps Script editor | https://script.google.com/d/1t4YAMXsn4pqoQa8jigMv1xrNVvN1iGYKn7v7IrjWXijtryUvjvsoFuxh/edit |
| Web App endpoint | https://script.google.com/macros/s/AKfycbxvcU7CAxGGqlEU5mZxl_OIrbDIPqM7fv8Jen--ijrApeZWOlbRZrkBhAsyDm-xja7O/exec |

```
.
├─ docs/                 # Frontend (GitHub Pages เสิร์ฟจากโฟลเดอร์นี้)
│  ├─ index.html         # หน้าหลัก: ตรวจสลิป + อ่านเสียงยอดเงินเข้า
│  ├─ money-in.html      # ฟอร์มบันทึกเงินเข้า
│  ├─ dashboard.html     # ภาพรวม & ปิดกะ
│  ├─ settings-shift.html# ตั้งค่า & กะ (รวมตั้งค่าเสียง AI + API key)
│  ├─ counter-live.html  # จอเคาน์เตอร์
│  └─ js/
│     ├─ config.js       # ใส่ Web App URL ที่นี่
│     ├─ api.js          # ตัวเรียก API
│     ├─ ai-voice.js     # เสียง AI (Gemini TTS) + fallback เสียงระบบ
│     └─ app.js          # ดึงข้อมูล + อ่านเสียงยอดเงินเข้า (ใช้ใน index.html)
├─ backend/              # Apps Script (clasp)
│  ├─ appsscript.json
│  ├─ Code.gs            # doGet/doPost + ping/setupDatabase()
│  ├─ Sheets.gs          # CRUD กับ Google Sheets
│  ├─ Drive.gs           # อัปโหลดไฟล์ขึ้น Drive
│  └─ Voice.gs           # Gemini TTS + เก็บ API key (Script Properties)
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

## ขั้นตอนที่ 2 — ฐานข้อมูล (Google Sheet ที่ผูกกับสคริปต์)

โปรเจกต์ Apps Script นี้ผูกกับ Google Sheet อยู่แล้ว — **ไม่ต้องสร้างสเปรดชีตใหม่**
เมื่อมีการเรียก API ครั้งแรก (หรือรัน `setupDatabase` ใน editor) ระบบจะ:

- สร้าง **header database** ให้อัตโนมัติในชีตแรกของไฟล์:
  `id | ref | customer | bank | amount | note | fileName | fileUrl | createdAt`
- หาโฟลเดอร์ Drive ชื่อ `App Uploads` (มีอยู่แล้วใช้เดิม ไม่มีค่อยสร้าง)

รันทดสอบ: เปิด editor (**Deploy แล้วต้อง authorize ก่อน 1 ครั้ง — ดูขั้นตอนที่ 3**) → เลือกฟังก์ชัน `setupDatabase` → Run
จะได้ log แสดง `spreadsheetId`, `sheetName`, `rowCount`

> ถ้าต้องการใช้ชีตอื่น (ไม่ใช่ชีตแรก) ให้ตั้ง `SHEET_NAME` ใน Script Properties
> ถ้าสคริปต์ไม่ได้ผูกกับสเปรดชีต ให้ตั้ง `SPREADSHEET_ID` ใน Script Properties

## ขั้นตอนที่ 3 — Deploy Web App + อนุญาตสคริปต์ (สำคัญ)

deploy ผ่าน clasp แล้ว:

```powershell
cd backend
clasp deploy --description "v1"
```

**จำเป็นต้องอนุญาตสคริปต์ 1 ครั้ง** (deploy ผ่าน clasp/API จะข้ามขั้นตอนนี้ ทำให้เว็บตอบ 403 "ต้องมีสิทธิ์เข้าถึง"):

1. เปิด **Web App URL** ด้วยเบราว์เซอร์ที่ล็อกอินบัญชีเจ้าของ (smartzzz2851@gmail.com)
2. จะเจอหน้าขอสิทธิ์ → เลือกบัญชี → **Advanced** → **Go to project (unsafe)** → **Allow**
3. เสร็จแล้วหน้าเว็บจะแสดง JSON ของ `ping` — แปลว่าใช้ได้แล้ว

ตั้งค่า Web App URL ใน frontend (ถ้า deployment URL เปลี่ยน):

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
| `ping` | GET | `?action=ping` | `{ ok, time, spreadsheetId, sheetName, headers, rowCount }` (สร้าง header ให้อัตโนมัติ) |
| `list` | GET | `?action=list` (option `&limit=100`) | รายการเงินเข้าล่าสุด (ใหม่สุดก่อน) |
| `create` | POST | `{ action:'create', payload:{ amount, customer, bank, ref, note, fileName, fileUrl } }` | record ที่สร้าง |
| `upload` | POST | `{ action:'upload', payload:{ filename, mimeType, base64 } }` | ข้อมูลไฟล์บน Drive |
| `voiceConfig` | GET | `?action=voiceConfig` | `{ hasKey, model, voice }` — สถานะเสียง AI (ไม่เปิดคีย์) |
| `setVoiceConfig` | POST | `{ action:'setVoiceConfig', payload:{ apiKey?, voice?, model? } }` | ตั้งคีย์ / โหมดเสียง AI |
| `speak` | POST | `{ action:'speak', payload:{ text, voice?, model? } }` | `{ audioBase64, mimeType }` เสียงจาก Gemini TTS |

หมายเหตุ: frontend ส่ง POST ด้วย `Content-Type: text/plain` เพื่อเลี่ยง CORS preflight
เพราะ Apps Script ไม่รองรับ request method `OPTIONS`

## เสียง AI (Gemini TTS)

เสียงประกาศเงินเข้าทั้งหมดสร้างด้วย **Gemini TTS** (โมเดล `gemini-3.8-flash-tts`) — เสียงหญิงไทยนุ่มนวลคล้ายตัวอย่างที่ให้มา

- **คีย์ API เก็บบนเซิร์ฟเวอร์เท่านั้น** (Script Properties `GEMINI_API_KEY`) — ไม่มีคีย์ใน frontend/repo
- ตั้งคีย์ครั้งแรกได้จากหน้า **ตั้งค่า & กะ** (การ์ด "AI Voice API Key") โดยวางคีย์แล้วกดบันทึก
  หรือตั้งเองใน Apps Script → Project Settings → Script properties → `GEMINI_API_KEY`
- เมื่อมีคีย์อยู่แล้ว การเปลี่ยนคีย์ผ่านหน้าเว็บจะถูกปฏิเสธ (กันคนอื่นเขียนทับ) — ต้องลบ `GEMINI_API_KEY` ใน Script Properties ก่อน
- เลือกน้ำเสียงได้จากการ์ด persona ในหน้า **ตั้งค่า & กะ** แล้วระบบจะใช้เสียงนั้นประกาศทุกหน้า:

| Persona | โหมดเสียง Gemini | ลักษณะ |
|---|---|---|
| น้องมะลิ (แนะนำ) | Kore | หญิง เรียบนิ่ง อบอุ่น — ตรงกับตัวอย่างมากที่สุด |
| น้องใบเฟิร์น | Aoede | หญิง หวาน นุ่มนวล |
| พี่กานต์ | Orus | ชาย หนักแน่น น่าเชื่อถือ |
| น้องมีนา | Leda | หญิง สดใส กระตุ้นเต้น |

- ถ้าเรียก AI ไม่สำเร็จ (ไม่มีคีย์/โควต้าหมด/ออฟไลน์) ระบบจะใช้เสียงระบบ (Web Speech API) พูดแทนอัตโนมัติ

## วิธีทำงานของ "อ่านเสียงยอดเงินเข้า"

1. เปิดหน้า `index.html` (แท็บ "ตรวจสลิป") ทิ้งไว้ที่เคาน์เตอร์
2. มีรายการใหม่เข้ามา (เพิ่มผ่านหน้า "เพิ่มเงินเข้า" หรือพิมพ์ใน Google Sheet ตรง ๆ)
3. ระบบ poll ทุก 15 วินาที → เจอรายการใหม่ → เสียงกริ่ง "ding-dong" + **เสียง AI (Gemini TTS)** พูด
   *"เงินเข้า 150 บาท จาก คุณกิตติศักดิ์"* พร้อม toast แจ้งเตือน
   (ถ้า AI ใช้ไม่ได้ จะเปลี่ยนเป็นเสียงระบบอัตโนมัติ)

## โครงสร้างข้อมูลใน Sheets

ชีตแรกของสเปรดชีตที่ผูกกับสคริปต์ (header สร้างให้อัตโนมัติ):
`id | ref | customer | bank | amount | note | fileName | fileUrl | createdAt`

- `id` — timestamp ใช้ตรวจจับรายการใหม่
- `ref` — รหัสอ้างอิงบนสลิป
- `customer` / `bank` — ชื่อลูกค้า / ธนาคาร
- `amount` — ยอดเงิน
- `fileName` / `fileUrl` — ไฟล์สลิปบน Google Drive
- `createdAt` — เวลาที่บันทึก

## การตั้งค่าขั้นสูง

เก็บค่าใน **Script Properties** (Apps Script → Project Settings → Script properties):

| Key | ความหมาย |
|---|---|
| `SPREADSHEET_ID` | ID ของสเปรดชีตที่ใช้เป็น DB |
| `SHEET_NAME` | ชื่อชีต (ค่าเริ่มต้น `Records`) |
| `DRIVE_FOLDER_ID` | ID ของโฟลเดอร์ Drive สำหรับเก็บไฟล์ |
| `GEMINI_API_KEY` | คีย์ Gemini สำหรับเสียง AI (ตั้งผ่านหน้าเว็บได้) |
| `TTS_MODEL` | โมเดล TTS (ค่าเริ่มต้น `gemini-3.8-flash-tts`) |
| `TTS_VOICE` | โหมดเสียง เช่น `Kore` (ค่าเริ่มต้น) |

## แก้ปัญหาที่พบบ่อย

- **`clasp login --status` ขึ้นว่า not logged in** → รัน `.\scripts\login.ps1` ใหม่
- **หน้าเว็บขึ้น `ยังไม่ได้ตั้งค่า API_URL`** → รัน `set-api-url.ps1` แล้ว push ใหม่
- **เรียก API ได้ 403 "ต้องมีสิทธิ์เข้าถึง" (You need access)** → สคริปต์ยังไม่ได้รับอนุญาต
  ให้เปิด Web App URL ด้วยเบราว์เซอร์ที่ล็อกอินบัญชีเจ้าของ → Advanced → Go to project → Allow (1 ครั้งพอ)
- **อัปเดตโค้ดแล้วหน้าเว็บยังเป็นของเก่า** → GitHub Pages แคชไฟล์ไว้ ~10 นาที
  กด Ctrl+F5 (hard refresh) หรือรอสักครู่แล้วรีเฟรชใหม่
- **พิมพ์แถวใน Google Sheet เองแล้วไม่มีเสียง** → ไม่จำเป็นต้องใส่คอลัมน์ `id`
  แต่ต้องมีข้อมูลอย่างน้อย 1 ช่อง (ชื่อ/ยอด/หมายเหตุ) และยอดเงินพิมพ์เป็นตัวเลขเท่านั้น เช่น `1500` หรือ `1,500`
- **ไม่มีเสียงพูด** → เบราว์เซอร์ (โดยเฉพาะ iOS) ต้องแตะหน้าจอก่อน 1 ครั้งเพื่อปลดล็อกเสียง
- **เสียง AI ใช้ไม่ได้ (เป็นเสียงระบบแทน)** → ตรวจการ์ด "AI Voice API Key" ในหน้าตั้งค่าว่าขึ้น "ตั้งค่าแล้ว" หรือยัง
  ถ้ายังไม่ได้ตั้ง ให้วางคีย์ Gemini API แล้วกดบันทึก (คีย์เก็บบนเซิร์ฟเวอร์ ไม่แสดงบนหน้าเว็บ)
  ถ้าขึ้น "ตั้งค่าแล้ว" แต่ยังเป็นเสียงระบบ อาจเป็นโควต้าคีย์หมดหรือเน็ตล่ม — ดู error ใน console (F12)
  ถ้า console ขึ้น `HTTP 429: You exceeded your current quota` → โควต้า Gemini ของคีย์นี้หมดชั่วคราว
  (มี free quota ต่อวัน/ต่อนาที) ให้รอสักครู่แล้วลองใหม่ หรือตั้ง billing ที่ Google AI Studio
  ระหว่างรอ ระบบจะพูดด้วยเสียงระบบแทนอัตโนมัติ (เป็นพฤติกรรมที่ออกแบบไว้)
- **อยากเปลี่ยนคีย์ Gemini ใหม่** → ไป Apps Script → Project Settings → Script properties
  ลบ `GEMINI_API_KEY` ออกก่อน แล้วค่อยบันทึกคีย์ใหม่ผ่านหน้าเว็บได้
- **ไฟล์เปิดจากลิงก์ไม่ได้** → organization อาจห้ามแชร์สาธารณะ ให้แชร์โฟลเดอร์ `App Uploads` เอง
- **`npm` ใช้ไม่ได้ใน PowerShell** → ตั้ง execution policy: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`
