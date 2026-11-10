# push โค้ดทั้ง 2 ฝั่ง: GitHub Pages (frontend) + Apps Script (backend)
# ใช้งาน: .\scripts\deploy.ps1 -Message "อัปเดตฟีเจอร์..."

param(
  [string]$Message = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> 1/3 Git commit & push (GitHub Pages)" -ForegroundColor Cyan
git add .
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Host "ไม่มีอะไรให้ commit หรือ commit ล้มเหลว - ข้ามไป push" -ForegroundColor Yellow
}
git push
if ($LASTEXITCODE -ne 0) { throw "git push ล้มเหลว" }

Write-Host "==> 2/3 clasp push (Apps Script)" -ForegroundColor Cyan
Set-Location (Join-Path $root 'backend')
clasp push
if ($LASTEXITCODE -ne 0) { throw "clasp push ล้มเหลว" }

Write-Host "==> 3/3 สร้าง deployment ใหม่ของ Web App" -ForegroundColor Cyan
clasp deploy --description $Message

Set-Location $root
Write-Host ""
Write-Host "เสร็จแล้ว! อย่าลืม:" -ForegroundColor Green
Write-Host " - ตรวจ GitHub Pages: Settings > Pages (source: main /docs)" -ForegroundColor White
Write-Host " - อัปเดต API URL ใน docs/js/config.js ถ้า deployment URL เปลี่ยน" -ForegroundColor White
