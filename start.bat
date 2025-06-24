@echo off
echo Starting ZDH Application...
echo.

:: 检查是否存在 .env 文件
if not exist ".env" (
    echo Warning: .env file not found. Using default configuration.
    echo You may want to create a .env file based on .env.example
    echo.
)

:: 设置默认端口（如果没有在环境变量中设置）
if "%PORT%"=="" set PORT=4000

echo Starting server on port %PORT%...
echo Press Ctrl+C to stop the server
echo.

:: 启动应用并保持窗口打开
zdh.exe

:: 如果程序异常退出，显示错误信息
if %ERRORLEVEL% neq 0 (
    echo.
    echo ===============================================
    echo ERROR: Application exited with error code %ERRORLEVEL%
    echo ===============================================
    echo.
    echo Possible causes:
    echo 1. Port %PORT% is already in use
    echo 2. Missing dependencies or configuration
    echo 3. Database connection issues
    echo 4. File permission problems
    echo.
    echo Solutions:
    echo 1. Check if another application is using port %PORT%
    echo 2. Verify your .env configuration
    echo 3. Check the application logs
    echo 4. Try running as administrator
    echo.
)

echo.
echo Press any key to exit...
pause >nul