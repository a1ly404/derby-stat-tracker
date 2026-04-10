# PowerShell script to load .env.local and run Lighthouse CI
# Usage: .\run-lighthouse-local.ps1

Write-Host "🔧 Loading environment variables from .env.local..." -ForegroundColor Yellow

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found! Please create it with your credentials." -ForegroundColor Red
    Write-Host "💡 Use .env.example as a template." -ForegroundColor Gray
    exit 1
}

# Load environment variables from .env.local
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)\s*=\s*(.*)\s*$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Skip empty lines and comments
        if ($name -and -not $name.StartsWith("#")) {
            Set-Item -Path "env:$name" -Value $value
            Write-Host "✅ Set $name" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "🚀 Running Lighthouse CI on production site..." -ForegroundColor Cyan
Write-Host "🔗 Testing: https://derby.razzormail.com" -ForegroundColor Gray
Write-Host "👤 Using: $env:LIGHTHOUSE_TEST_EMAIL" -ForegroundColor Gray
Write-Host ""

# Set Chrome path for LHCI
$env:CHROME_PATH = "C:\Users\17783\AppData\Local\Chromium\Application\chrome.exe"

# Run Lighthouse CI with the local config
npm run lighthouse:prod

Write-Host ""
Write-Host "✨ Lighthouse CI completed! Check the .lighthouseci-local folder for results." -ForegroundColor Green