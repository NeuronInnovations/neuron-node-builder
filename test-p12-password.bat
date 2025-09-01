@echo off
echo === Testing P12 Password ===

REM Replace these with your actual values
set P12_FILE=path\to\your\certificate.p12
set P12_PASSWORD=your_actual_password

echo Testing P12 file: %P12_FILE%
echo Password: %P12_PASSWORD%

REM Test 1: Check if p12 file exists
if not exist "%P12_FILE%" (
    echo ❌ P12 file not found: %P12_FILE%
    echo Please update P12_FILE variable in this script
    pause
    exit /b 1
)

REM Test 2: Validate p12 with openssl (same as GitHub Actions)
echo.
echo Testing p12 file validity with openssl...
openssl pkcs12 -info -in "%P12_FILE%" -noout -passin pass:"%P12_PASSWORD%" 2>nul
set OPENSSL_RESULT=%errorlevel%
if %OPENSSL_RESULT% equ 0 (
    echo ✅ P12 file is valid and password is correct (openssl)
    echo.
    echo ✅ Password test passed!
    echo This means your p12 file and password should work in GitHub Actions
) else (
    echo ❌ P12 file is invalid or password is incorrect (openssl)
    echo.
    echo Debug info:
    echo - File exists: %P12_FILE%
    echo - File size: 
    dir "%P12_FILE%" | find "bytes"
    echo.
    echo Try running: openssl pkcs12 -info -in "%P12_FILE%" -noout
    pause
    exit /b 1
)

pause
