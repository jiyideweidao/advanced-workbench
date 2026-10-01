@echo off
chcp 65001 >nul
title 进阶工作台 · 安装依赖
cd /d "%~dp0"

set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_CUSTOM_DIR={{ version }}"

echo 正在安装运行依赖（需要联网，约 1-3 分钟）...
call npm install --no-audit --no-fund

if not exist "node_modules\electron\dist\electron.exe" (
  if exist "node_modules\electron\install.js" (
    echo 正在补装 Electron 运行时...
    call node "node_modules\electron\install.js"
  )
)

echo.
if exist "node_modules\electron\dist\electron.exe" (
  echo 安装完成！现在可以双击「启动进阶工作台.vbs」启动程序。
) else (
  echo 安装失败，请检查 Node.js（建议 20 以上版本）与网络连接。
)
pause