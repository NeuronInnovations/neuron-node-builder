@echo off
echo === Simple P12 Password Test ===

REM Replace these with your actual values
set P12_FILE=certificate_2.p12
set P12_PASSWORD=N3uron.World

echo Testing P12 file: %P12_FILE%
echo Password: %P12_PASSWORD%

REM Check if file exists
if not exist "%P12_FILE%" (
    echo ❌ P12 file not found: %P12_FILE%
    pause
    exit /b 1
)

echo.
echo Running openssl test...
echo.

REM Run openssl and capture the result
openssl pkcs12 -info -in "%P12_FILE%" -noout -passin pass:"%P12_PASSWORD%"
set RESULT=%errorlevel%

echo.
echo OpenSSL exit code: %RESULT%

if %RESULT% equ 0 (
    echo ✅ SUCCESS: P12 file is valid and password is correct
) else (
    echo ❌ FAILED: P12 file is invalid or password is incorrect
)

echo.
pause
