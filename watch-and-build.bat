@echo off
echo Watching for file changes...

REM You can change the folder here if needed
chokidar "src/**/*" --initial --ignore "dist/**" -c "build_and_open_android.bat"
