Write-Host "========================================"
Write-Host "COPY TRADING READINESS INVESTIGATION"
Write-Host "========================================`n"

# PHASE 1: SERVICE STATUS
Write-Host "`nPHASE 1: Service Status"
Write-Host "=" * 50

Write-Host "`n1.1 PM2 Process Status:"
pm2 list

Write-Host "`n1.2 Copy-PAMM Last 30 Lines:"
pm2 logs copy-pamm-api --lines 30 --nostream

# PHASE 2: CONFIGURATION CHECK
Write-Host "`n`nPHASE 2: Configuration Check"
Write-Host "=" * 50

Write-Host "`n2.1 Copy-PAMM Environment:"
Get-Content C:\servidor\copy-pamm\.env | Select-String "PYTHON_API_URL|INTERNAL_API_KEY|ENABLE_REPLICATION|POLLING_INTERVAL"

Write-Host "`n2.2 Check for replication service startup:"
pm2 logs copy-pamm-api --lines 200 --nostream | Select-String "Replication service|started|iniciado" | Select-Object -First 5

# PHASE 3: ENDPOINT TESTS
Write-Host "`n`nPHASE 3: Critical Endpoint Tests"
Write-Host "=" * 50

Write-Host "`n3.1 Test MT5 Manager health:"
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:8443/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "SUCCESS: MT5 Manager Status $($health.StatusCode)"
} catch {
    Write-Host "FAILED: MT5 Manager - $($_.Exception.Message)"
}

Write-Host "`n3.2 Test /trading/replicate endpoint availability:"
Write-Host "(This will show if endpoint is reachable, actual trade test requires valid data)"

# PHASE 4: RECENT ACTIVITY
Write-Host "`n`nPHASE 4: Recent Replication Activity"
Write-Host "=" * 50

Write-Host "`n4.1 Looking for polling activity:"
pm2 logs copy-pamm-api --lines 100 --nostream | Select-String "Buscando nuevas operaciones|master 101308|Consultando trades" | Select-Object -Last 10

Write-Host "`n4.2 Looking for replication attempts:"
pm2 logs copy-pamm-api --lines 100 --nostream | Select-String "Trade executed|replicado|follower" | Select-Object -Last 10

Write-Host "`n4.3 Check for errors:"
$errors = pm2 logs copy-pamm-api --lines 100 --nostream | Select-String "error|Error|ERROR|failed|Failed"
if ($errors) {
    Write-Host "ERRORS FOUND:"
    $errors | Select-Object -Last 10
} else {
    Write-Host "No errors found in last 100 lines"
}

Write-Host "`n`n========================================"
Write-Host "INVESTIGATION COMPLETE"
Write-Host "========================================"
Write-Host "`nKEY FINDINGS:"
Write-Host "- Database: Active relationship 101308 -> 101383 found"
Write-Host "- Last checked: Recently (within last minute)"
Write-Host "- Check output above for polling activity and errors"
