param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$root = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $root 'docs\js\config.js'

if ($Url -notmatch '^https://script\.google\.com/.*/exec$') {
  Write-Warning "URL ควรเป็น Web App URL ที่ลงท้ายด้วย /exec (ได้จาก Apps Script > Deploy)"
}

$content = @"
// ตั้งค่า URL ของ Apps Script Web App (ต้องลงท้ายด้วย /exec)
// ดูได้จาก Apps Script > Deploy > Manage deployments > Web app URL
window.APP_CONFIG = {
  API_URL: '$Url'
};
"@

Set-Content -Path $configPath -Value $content -Encoding UTF8
Write-Host "อัปเดต API URL เรียบร้อย: $configPath" -ForegroundColor Green
