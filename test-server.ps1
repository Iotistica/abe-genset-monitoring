# Test ABE Mock API Server
Write-Host "`n=== Testing ABE Mock API Server ===" -ForegroundColor Cyan
Write-Host "Server URL: http://localhost:3001`n" -ForegroundColor Green

# Test 1: Health Check
Write-Host "1. Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    $response.Content | ConvertFrom-Json | ConvertTo-Json
    Write-Host "✓ Health check passed`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $_`n" -ForegroundColor Red
}

# Test 2: Get OAuth Token
Write-Host "2. Get OAuth Token:" -ForegroundColor Yellow
try {
    $body = @{
        grant_type = "client_credentials"
        client_id = "test_client"
        client_secret = "test_secret"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/identity/token" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $token = $response.Content | ConvertFrom-Json
    Write-Host "✓ Token received: $($token.access_token)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Token request failed: $_`n" -ForegroundColor Red
}

# Test 3: List Units
Write-Host "3. List Units:" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer test_token"
        "Comap-Key" = "test_key"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:3001/v1.1/mylogin/units" -Headers $headers -UseBasicParsing
    $units = $response.Content | ConvertFrom-Json
    Write-Host "✓ Found $($units.total) units" -ForegroundColor Green
    $units.units | ForEach-Object { Write-Host "  - $($_.unitName) ($($_.status))" }
    Write-Host ""
} catch {
    Write-Host "✗ List units failed: $_`n" -ForegroundColor Red
}

# Test 4: Get Unit Values (Live Data)
Write-Host "4. Get Unit Values (Live Genset Data):" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer test_token"
        "Comap-Key" = "test_key"
    }
    $unitGuid = "550e8400-e29b-41d4-a716-446655440001"
    $response = Invoke-WebRequest -Uri "http://localhost:3001/v1.1/mylogin/units/$unitGuid/values" -Headers $headers -UseBasicParsing
    $values = $response.Content | ConvertFrom-Json
    Write-Host "✓ Live data retrieved:" -ForegroundColor Green
    Write-Host "  Engine RPM: $([math]::Round($values.engine.rpm, 0))" -ForegroundColor White
    Write-Host "  Fuel Level: $([math]::Round($values.engine.fuelLevel, 1))%" -ForegroundColor White
    Write-Host "  Coolant Temp: $([math]::Round($values.engine.coolantTemp, 1))°C" -ForegroundColor White
    Write-Host "  Gen Voltage L1-N: $([math]::Round($values.generator.voltage.L1N, 1))V" -ForegroundColor White
    Write-Host "  Active Power: $([math]::Round($values.generator.power.active, 0))kW" -ForegroundColor White
    Write-Host "  Status: $($values.status)`n" -ForegroundColor White
} catch {
    Write-Host "✗ Get values failed: $_`n" -ForegroundColor Red
}

# Test 5: Send Command
Write-Host "5. Send Command to Unit:" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer test_token"
        "Comap-Key" = "test_key"
    }
    $body = @{
        command = "START"
        parameters = @{}
    } | ConvertTo-Json
    
    $unitGuid = "550e8400-e29b-41d4-a716-446655440002"
    $response = Invoke-WebRequest -Uri "http://localhost:3001/v1.1/mylogin/units/$unitGuid/commands" -Method POST -Headers $headers -Body $body -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✓ Command sent: $($result.command) - Status: $($result.status)`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Send command failed: $_`n" -ForegroundColor Red
}

Write-Host "=== All Tests Complete ===" -ForegroundColor Cyan
