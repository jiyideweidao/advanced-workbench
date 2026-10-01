@echo off
chcp 65001 >nul
title 进阶工作台 · 启动器
cd /d "%~dp0"

rem 部分网络环境下 GitHub 下载会被拦截，Electron 二进制改走 npmmirror 镜像
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "ELECTRON_CUSTOM_DIR={{ version }}"

if not exist "node_modules\electron\dist\electron.exe" (
  echo [1/2] 首次运行，正在安装依赖（需要联网，约 1-3 分钟）...
  call npm install --no-audit --no-fund
  if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo [提示] 依赖包已下载，但 Electron 运行时可能缺失，正在补装...
    if exist "node_modules\electron\install.js" call node "node_modules\electron\install.js"
  )
  if not exist "node_modules\electron\dist\electron.exe" (
    echo.
    echo [错误] 运行环境安装失败。请确认已安装 Node.js 20+，并检查网络连接。
    echo         也可以手动执行：npm install
    pause
    exit /b 1
  )
)

echo [2/2] 正在启动进阶工作台...
rem 注意：这里必须写成 "%~dp0."，因为 "%~dp0" 以反斜杠结尾，会转义掉后面的引号
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
exit /b 0