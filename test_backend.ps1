Write-Host "=== Testing MT5 Manager Backend ===" -ForegroundColor Cyan

# 1. Check PM2 process
Write-Host "`n1. PM2 Status:" -ForegroundColor Yellow
pm2 list

# 2. Check port 8443
Write-Host "`n2. Port 8443 Status:" -ForegroundColor Yellow
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -eq 8443} | Format-Table LocalAddress, LocalPort, State, OwningProcess

# 3. Test backend directly
Write-Host "`n3. Testing http://127.0.0.1:8443/health:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8443/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test via nginx
Write-Host "`n4. Testing https://apekapital.com:444/api/v1/health:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://apekapital.com:444/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ SUCCESS: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED: Status $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
}

# 5. Check nginx error logs
Write-Host "`n5. Recent Nginx Errors:" -ForegroundColor Yellow
Get-Content C:\nginx\nginx-1.24.0\logs\error.log -Tail 10

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
