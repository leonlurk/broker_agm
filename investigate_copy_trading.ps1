Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🕵️ COPY TRADING READINESS INVESTIGATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# PHASE 1: SERVICE STATUS
Write-Host "📋 PHASE 1: Service Status" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "`n1.1 PM2 Process Status:" -ForegroundColor White
pm2 list | Select-String "copy-pamm-api|metatrader-api-prod"

Write-Host "`n1.2 Copy-PAMM Last 20 Lines:" -ForegroundColor White
pm2 logs copy-pamm-api --lines 20 --nostream | Select-String -Pattern "replicación|polling|error|ERROR|502|master|follower" -Context 1

# PHASE 2: CONFIGURATION CHECK
Write-Host "`n`n📋 PHASE 2: Configuration Check" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "`n2.1 Copy-PAMM Environment:" -ForegroundColor White
Get-Content C:\servidor\copy-pamm\.env | Select-String "PYTHON_API_URL|INTERNAL_API_KEY|ENABLE_REPLICATION|POLLING_INTERVAL"

Write-Host "`n2.2 Replication Service Status:" -ForegroundColor White
pm2 logs copy-pamm-api --lines 100 --nostream | Select-String "Replication service|REPLICACIÓN|started|iniciado" | Select-Object -First 5

# PHASE 3: ENDPOINT TESTS
Write-Host "`n`n📋 PHASE 3: Critical Endpoint Tests" -ForegroundColor Yellow
Write-Host "=" * 50

Write-Host "`n3.1 Test /trading/replicate endpoint:" -ForegroundColor White
$replicatePayload = @{
    symbol = "EURUSD"
    volume = 0.01
    type = "buy"
    follower_account = "101383"
    risk_ratio = 1
    open_price = 1.1000
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://apekapital.com:444/api/v1/trading/replicate" `
        -Method POST `
        -Headers @{"Authorization"="Bearer agm-internal-api-key-2024"; "Content-Type"="application/json"} `
        -Body $replicatePayload `
        -UseBasicParsing `
        -TimeoutSec 10
    Write-Host "✅ /trading/replicate: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ /trading/replicate: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n3.2 Test MT5 Manager health:" -ForegroundColor White
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:8443/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ MT5 Manager: Status $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ MT5 Manager: FAILED" -ForegroundColor Red
}

# PHASE 4: DATABASE CHECK
Write-Host "`n`n📋 PHASE 4: Database Relationships" -ForegroundColor Yellow
Write-Host "=" * 50
Write-Host "`n4.1 Check for active copy relationships (execute in Supabase):" -ForegroundColor White
Write-Host "   SELECT master_account, follower_account, status, risk_ratio, created_at" -ForegroundColor Cyan
Write-Host "   FROM copy_relationships" -ForegroundColor Cyan
Write-Host "   WHERE status = 'active'" -ForegroundColor Cyan
Write-Host "   ORDER BY created_at DESC LIMIT 5;" -ForegroundColor Cyan

# PHASE 5: RECENT ACTIVITY
Write-Host "`n`n📋 PHASE 5: Recent Replication Activity" -ForegroundColor Yellow
Write-Host "=" * 50
Write-Host "`n5.1 Last replication attempts:" -ForegroundColor White
pm2 logs copy-pamm-api --lines 200 --nostream | Select-String "Trade executed|replicado|follower" | Select-Object -Last 10

Write-Host "`n5.2 Any errors in last 100 lines:" -ForegroundColor White
$errors = pm2 logs copy-pamm-api --lines 100 --nostream | Select-String "error|Error|ERROR|failed|Failed"
if ($errors) {
    Write-Host "⚠️ Found errors:" -ForegroundColor Yellow
    $errors | Select-Object -Last 5
} else {
    Write-Host "✅ No errors found" -ForegroundColor Green
}

Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host "🎯 INVESTIGATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
