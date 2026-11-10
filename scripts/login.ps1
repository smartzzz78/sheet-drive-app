# เปิดหน้าต่าง login สำหรับ GitHub CLI และ clasp
# รันสคริปต์นี้ใน PowerShell แล้วทำตามขั้นตอนในหน้าต่างที่เปิดขึ้น

Write-Host "1) กำลังเปิด GitHub CLI login..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'gh auth login'

Start-Sleep -Seconds 2

Write-Host "2) กำลังเปิด clasp login (Google)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'clasp login'

Write-Host ""
Write-Host "เมื่อ login ครบทั้งสองหน้าต่างแล้ว กลับมาที่นี่แล้วรัน:" -ForegroundColor Yellow
Write-Host "  gh auth status" -ForegroundColor White
Write-Host "  clasp login --status" -ForegroundColor White
