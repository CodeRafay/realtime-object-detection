@echo off
echo ========================================
echo Real-Time Object Detection Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: You need to add the ONNX model file before running:
echo 1. Place yolov8n.onnx in: public\models\
echo 2. See MODEL_SETUP.md for instructions
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo To build for production, run:
echo   npm run build
echo.
pause
