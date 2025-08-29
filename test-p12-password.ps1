# PowerShell script to test P12 password validation
Write-Host "=== Testing P12 Password ===" -ForegroundColor Green

# Replace these with your actual values
$P12_FILE = "path\to\your\certificate.p12"
$P12_PASSWORD = "your_actual_password"

Write-Host "Testing P12 file: $P12_FILE" -ForegroundColor Yellow
Write-Host "Password: $P12_PASSWORD" -ForegroundColor Yellow

# Test 1: Check if p12 file exists
if (-not (Test-Path $P12_FILE)) {
    Write-Host "❌ P12 file not found: $P12_FILE" -ForegroundColor Red
    Write-Host "Please update P12_FILE variable in this script" -ForegroundColor Red
    Read-Host "Press Enter to continue"
    exit 1
}

# Test 2: Validate p12 with openssl (same as GitHub Actions)
Write-Host "`nTesting p12 file validity with openssl..." -ForegroundColor Yellow

try {
    $result = & openssl pkcs12 -info -in $P12_FILE -noout -passin "pass:$P12_PASSWORD" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ P12 file is valid and password is correct (openssl)" -ForegroundColor Green
    } else {
        throw "OpenSSL failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ P12 file is invalid or password is incorrect (openssl)" -ForegroundColor Red
    Write-Host "`nDebug info:" -ForegroundColor Yellow
    Write-Host "- File exists: $P12_FILE" -ForegroundColor White
    Write-Host "- File size: $((Get-Item $P12_FILE).Length) bytes" -ForegroundColor White
    Write-Host "`nTry running manually:" -ForegroundColor Yellow
    Write-Host "openssl pkcs12 -info -in `"$P12_FILE`" -noout" -ForegroundColor Cyan
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host "`n✅ Password test passed!" -ForegroundColor Green
Write-Host "This means your p12 file and password should work in GitHub Actions" -ForegroundColor Green
Read-Host "Press Enter to continue"
