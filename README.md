<div align="center">

<img src="build/icon-512.png" width="128" alt="进阶工作台" />

# 进阶工作台 · Advanced Workbench

**把「做网站 / 做外贸 / 做个人 IP / 用 AI 变现 / 做视频」五条变现路径，<br/>拆成有目录、有资源、有项目、可下载的离线学习库。**

全离线运行 · 双击即用 · 单实例保护 · 系统托盘常驻

[![License](https://img.shields.io/badge/license-MIT-3da639?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square)](#快速开始)
[![Electron](https://img.shields.io/badge/Electron-44-47848F?style=flat-square&logo=electron&logoColor=white)](package.json)
[![Runtime Deps](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen?style=flat-square)](package.json)
[![Offline](https://img.shields.io/badge/offline-first-blueviolet?style=flat-square)](#这是什么)

[简体中文](README.md) · [English](README.en.md)

[这是什么](#这是什么) · [界面预览](#界面预览) · [快速开始](#快速开始) ·
[下载与导出](#下载与导出) · [项目结构](#项目结构) · [二次开发](#二次开发)

</div>

![首页](docs/screenshots/01-home.png)

## 这是什么

一个 **Windows 桌面应用**，把「技能变现」这件事拆成五条可以照着走的路径，
每条路径都配齐 **学习路线图、章节目录、精选资源、实战项目、自测清单**。

它不是又一个「知识库软件」，而是 **一套已经装好内容的成品**：
装好打开就能学，学完点一下就能把资料导出成 PDF / PPTX / Markdown / HTML / CSV 带走。

| | |
| --- | --- |
| **5** 个知识领域 | 网站制作 / 外贸实操 / 个人 IP / AI 变现 / 视频制作 |
| **26** 个学习模块 | 每个模块都有周期建议与明确产出物 |
| **110** 条课程条目 | 带顺序、带依赖关系，不是罗列 |
| **116** 条精选资源 | PPT / 文档 / 视频 / 书籍 四类，含难度与提供方 |
| **15** 个实战项目 | 含目标、技术栈、执行步骤、交付物、可下载模板 |
| **0** 个运行时依赖 | 导出引擎全部自研，不装任何第三方包 |

> **一句话**：从「我想学点什么」到「我能交付一单」，中间那段路，这个工作台替你铺好了。
---

## 界面预览

### 演示动图

![界面演示](docs/demo.gif)

### 首页

五大知识库总览：关键数据、五张路径卡、学习路径与开始入口。

![首页](docs/screenshots/01-home.png)

### 知识库详情页

以「网站制作」为例：学习目标、能力清单、学习路线图、详细目录、精选资源、
实战项目、自测清单、常见问题、下载资料 —— 九个分区一页打通。

![网站制作](docs/screenshots/02-cat-website.png)

<table>
<tr>
<td width="50%"><img src="docs/screenshots/03-cat-trade.png" alt="外贸实操" /><br/><sub><b>外贸实操</b> · 选品 → 获客 → 报价 → 收汇</sub></td>
<td width="50%"><img src="docs/screenshots/04-cat-personalip.png" alt="个人 IP" /><br/><sub><b>个人 IP</b> · 定位 → 内容 → 信任 → 变现</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/05-cat-aimoney.png" alt="AI 变现" /><br/><sub><b>AI 变现</b> · 把 AI 变成产能放大器</sub></td>
<td width="50%"><img src="docs/screenshots/06-cat-video.png" alt="视频制作" /><br/><sub><b>视频制作</b> · 从随手拍到可交付成片</sub></td>
</tr>
</table>

### 下载中心 / 项目示例 / 资源总表

<table>
<tr>
<td width="50%"><img src="docs/screenshots/07-downloads.png" alt="下载中心" /><br/><sub><b>下载中心</b> · 一键生成全部资料</sub></td>
<td width="50%"><img src="docs/screenshots/08-projects.png" alt="项目示例" /><br/><sub><b>项目示例</b> · 15 个实战项目</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/09-resources.png" alt="资源总表" /><br/><sub><b>资源总表</b> · 116 条资源可筛选</sub></td>
<td width="50%"><img src="docs/screenshots/10-method.png" alt="学习方法" /><br/><sub><b>学习方法</b> · 产出导向的四个原则</sub></td>
</tr>
</table>

<details>
<summary><b>展开剩余截图（同类项目调研 / 关于本程序）</b></summary>

<br/>

![同类项目调研](docs/screenshots/11-research.png)

![关于本程序](docs/screenshots/12-about.png)

</details>
---

## 快速开始

### 1. 首次使用（需要联网一次）

双击 **`首次安装依赖.bat`**，等待出现「正在启动进阶工作台」即可。
它会自动安装 Electron 运行环境（约 1–3 分钟），装完窗口自动打开。

> 网络受限时脚本会自动改用 npmmirror 国内镜像下载 Electron。

### 2. 日常启动

双击 **`启动进阶工作台.vbs`** 即可，静默启动、不弹黑色命令行窗口。

也可以双击 `启动进阶工作台.bat`（会显示命令行窗口，并在缺少运行环境时自动补装）。

### 3. 桌面快捷方式

桌面上的 **「进阶工作台」** 快捷方式（带程序图标）直接双击启动。

如果被误删，右键「新建 → 快捷方式」，按下表填写：

| 项目 | 内容 |
| --- | --- |
| 目标 | `C:\Windows\System32\wscript.exe` |
| 参数 | `"<本程序目录>\启动进阶工作台.vbs"` |
| 起始位置 | `<本程序目录>` |
| 图标 | `<本程序目录>\build\icon.ico` |

---

## 程序行为

| 操作 | 行为 |
| --- | --- |
| **双击图标启动** | 打开主窗口 |
| **重复双击图标** | **不会双开**。自动唤起已打开的窗口并置于最前 |
| **点「最小化」按钮** | 窗口隐藏到**系统托盘**，程序继续后台运行 |
| **点窗口右上角「关闭」** | **完全退出程序**（托盘图标一并消失） |
| **托盘图标** | 单击 / 双击 → 恢复窗口；右键 → 菜单（显示主界面 / 打开下载目录 / 打开程序目录 / 关于 / **退出程序**） |

界面左下角常驻两个按钮：**最小化到托盘** 与 **退出程序**。

> 一句话记忆：**最小化 = 藏到托盘，关闭 = 退出程序。**

---

## 五大知识库

| # | 知识库 | 一句话目标 | 模块 | 项目 | 资源 |
| --- | --- | --- | --- | --- | --- |
| 01 | 🌐 **网站制作** | 从一行 HTML 到上线的商业网站 | 5 | 3 | 26 |
| 02 | 📊 **外贸实操** | 从选品到收汇，跑通一条完整的外贸链路 | 6 | 3 | 24 |
| 03 | ⭐ **个人 IP** | 让陌生人因为认识你，而愿意为你付费 | 5 | 3 | 22 |
| 04 | 🤖 **AI 变现** | 把 AI 变成你的产能放大器，而不是聊天玩具 | 5 | 3 | 22 |
| 05 | 🎬 **视频制作** | 从手机随手拍到能交付的成片 | 5 | 3 | 22 |

合计：**26 个学习模块 / 110 条课程条目 / 116 条精选资源 / 15 个实战项目**。

每个知识库都包含：学习目标、分阶段路线图（含周期与产出物）、章节目录、
精选资源（PPT / 文档 / 视频 / 书籍）、实战项目、自测清单、常见问题。
---

## 下载与导出

程序内置「**下载中心**」。文件由程序 **实时生成**（不是预先存放的静态文件），
内容一旦更新，导出结果同步更新。

| 导出内容 | 格式 | 说明 |
| --- | --- | --- |
| 单个知识库 · 学习手册 | **PDF** | 完整手册，可直接打印或分享 |
| 单个知识库 · 课程大纲 | **PPTX** | 16 页幻灯片，可直接改配色当自己的课件 |
| 单个知识库 · 学习手册 | **Markdown** | 便于二次编辑、导入笔记软件 |
| 单个知识库 · 学习手册 | **HTML** | 单文件网页，双击即可在浏览器阅读 |
| 单个知识库 · 资源清单 | **CSV** | Excel 可直接打开，便于筛选与打勾 |
| **全部资源总表** | **CSV** | 五大领域 116 条资源汇总一张表 |
| **全部资料包** | **ZIP** | 五大领域手册 / 大纲 / 清单 + 全部项目示例 |
| **项目示例代码包** | **ZIP** | 15 个实战项目的可运行模板与清单 |

**保存位置**：弹窗中自选。默认目录为 `文档\进阶工作台资料\`
（托盘菜单「打开下载目录」可直达）。

> 提示：Markdown / CSV 均为正确的 UTF-8 编码（择需带或不带 BOM），
> Excel 与各类笔记软件打开中文不乱码。

---

## 界面导航

| 页面 | 内容 |
| --- | --- |
| **首页** | 五大知识库总览 + 关键数据 |
| **五大知识库** | 每个知识库的详情页（目标 / 路线图 / 目录 / 资源 / 项目 / 自测 / FAQ） |
| **下载中心** | 上表全部导出项，一键生成 |
| **项目示例** | 15 个实战项目，含目标、技术栈、步骤、交付物 |
| **资源总表** | 116 条资源，可按类型 / 领域 / 难度筛选 |
| **学习方法** | 产出导向、20/80 资源法、公开交付、两周复盘 |
| **同类项目调研** | GitHub 同类开源项目调研结果 |
| **关于本程序** | 版本信息、程序目录、下载目录 |

顶部搜索框支持 **跨知识库全文检索**：课程条目、资源、项目、FAQ 一次搜全。
---

## 项目结构

```
进阶工作台/
├─ main.js                  Electron 主进程：窗口 / 托盘 / 单实例 / IPC
├─ preload.js               contextBridge 安全桥（渲染进程只能用白名单 API）
├─ src/
│  ├─ index.html            应用外壳
│  ├─ css/style.css         主题与布局
│  └─ js/app.js             渲染进程：路由 / 渲染 / 搜索 / 导出交互
├─ lib/
│  ├─ exporter.js           PDF / HTML / Markdown / CSV 生成
│  ├─ pptx.js               自研 PPTX（OOXML）生成器
│  ├─ zip.js                自研 ZIP（crc32 + deflateRaw）
│  └─ icon.js               自研 PNG / ICO 生成器
├─ content/                 ★ 全部课程内容都在这里
│  ├─ site.json             站点信息 / 学习方法 / 调研 / 免责声明
│  ├─ cat-website.json      五大知识库
│  ├─ cat-trade.json
│  ├─ cat-personalip.json
│  ├─ cat-aimoney.json
│  ├─ cat-video.json
│  └─ projects/             15 个实战项目的可下载模板
├─ build/                   图标（首次运行自动生成）
├─ docs/                    README 截图与演示动图
├─ 启动进阶工作台.vbs        日常启动（静默无窗口）
├─ 启动进阶工作台.bat        启动（带控制台，缺依赖会自动补装）
└─ 首次安装依赖.bat          首次安装 Electron 运行环境
```

---

## 二次开发

### 1. 改课程内容

**不用碰代码。** 编辑 `content/cat-*.json` 即可，
侧边栏、首页统计、导出资料、资源总表全部自动同步。

### 2. 新增项目示例模板

1. 把模板文件放进 `content/projects/<知识库ID>/`
2. 在该知识库 JSON 的 `projects[]` 里加一条项目描述

导出「项目示例代码包」时会自动打包进去。

### 3. 改站点信息

`content/site.json` 管首页标语、学习方法、同类项目调研、免责声明。

### 4. 从源码运行

```bash
npm install     # 只装 electron 一个 devDependency
npm start
```

打包成免安装 exe：

```bash
npm run dist    # electron-builder --win portable
```

> 渲染进程遵循 `contextIsolation: true` / `nodeIntegration: false`，
> 所有能力都要先在 `preload.js` 里显式暴露，再在 `main.js` 里实现对应 IPC。
---

## 技术实现

- **Electron 44**（Chromium + Node），`contextIsolation: true`、`nodeIntegration: false`，
  渲染进程通过 `preload.js` 的 `contextBridge` 调用受限 API。
- **单实例**：`app.requestSingleInstanceLock()`；重复启动时第二个进程立即退出，
  并由 `second-instance` 事件把已有窗口唤起置前。
- **托盘**：拦截 `minimize` 事件改为 `hide()`；`close` 事件放行 → 真正退出。
- **导出引擎全部自研，零第三方运行时依赖**：
  - `lib/pptx.js` 直接拼装 OOXML（`[Content_Types].xml` + slide + layout + master + theme），
    生成 16 页可用的 `.pptx`
  - `lib/zip.js` 自实现 ZIP（crc32 + `zlib.deflateRawSync`）
  - `lib/icon.js` 自实现 PNG 编码器（zlib + crc32 + IDAT 分块）
    与 `.ico` 封装器（内嵌 16/32/48/64/128/256 六种尺寸）
  - PDF 走 Electron 内置 `printToPDF`，复用**同一个隐藏窗口**（避免二次导出失败）
- `package.json` 只有 `electron` 一个 devDependency，**没有构建步骤，源码即运行**。

---

## 同类项目调研

开工前调研过：成熟开源方案多为**通用笔记 / 知识库**，
没有现成的「五大变现技能 + 路线图 + 项目示例 + 可下载资料」工作站，因此自建。
完整调研结果见程序内「同类项目调研」页，摘录：

| 项目 | Star | 能借鉴什么 |
| --- | --- | --- |
| [Couleur-Share/GuiZhi（归知）](https://github.com/Couleur-Share/GuiZhi) | ~34 | 本地优先 AI 知识库；检索与本地存储实现 |
| [TriliumNext/Trilium](https://github.com/TriliumNext/Trilium) | 10k+ | 树状知识组织、模板、关系图 |
| [2hmedSabry/Media-Reader-App](https://github.com/2hmedSabry/Media-Reader-App) | ~2 | 本地课程播放器 + 进度跟踪 |
| [wang-zilei/Memora](https://github.com/wang-zilei/Memora) | ~2 | Tauri 方案（比 Electron 省内存） |
| [zhoushu44/LLM-Wiki-Pro](https://github.com/zhoushu44/LLM-Wiki-Pro) | ~1 | 「知识编译」而非每次检索 |
| [ourafrica/our-africa-desktop](https://github.com/ourafrica/our-africa-desktop) | 0 | 离线 LMS 的数据模型 |
---

## 常见问题

**Q：双击没反应？**
先双击 `首次安装依赖.bat` 装好运行环境。若仍无反应，确认已安装
[Node.js 20+](https://nodejs.org/)，然后在程序目录执行 `npm install`。

**Q：装依赖时下载 Electron 失败？**
用 `启动进阶工作台.bat`，它内置了 npmmirror 镜像地址。

**Q：点最小化后窗口不见了？**
这是设计行为 —— 已隐藏到右下角系统托盘。单击托盘图标即可恢复。

**Q：任务管理器里还有进程，是没关干净吗？**
点「关闭」或托盘菜单「退出程序」后进程会完全退出。只有**最小化**时才会保留后台进程。

**Q：导出的 PPTX 打不开？**
用 PowerPoint 2016+ / WPS / LibreOffice Impress 打开。它是标准 OOXML（16 页）。

**Q：内容能改吗？**
能。见 [二次开发](#二次开发)，改 `content/` 下的 JSON 即可，不用改代码。

**Q：改了启动脚本后双击报「无效字符」？**
`启动进阶工作台.vbs` 必须保存为 **UTF-16LE（记事本里的「Unicode」）** 或 ANSI 编码，
**不能存成 UTF-8 带 BOM** —— Windows 脚本宿主无法解析 UTF-8 BOM，会直接报「无效字符」。
两个 `.bat` 则相反，要保存为 **UTF-8 无 BOM**（配合文件内的 `chcp 65001` 才能正常显示中文）。
另外，`.bat` 里传给程序的路径要写成 `"%~dp0."` 而不是 `"%~dp0"`，
因为 `%~dp0` 以反斜杠结尾，会转义掉后面的引号，导致路径解析错误。

---

## 免责声明

本站内容为学习方法论与资源索引，不构成投资、法律、税务或贸易合规建议。
涉及外贸资质、外汇、出口退税、海关申报等，请以中国商务部、海关总署、
外汇管理局与当地主管部门的最新规定为准。
所有外部链接指向公开可访问的官方网站或平台首页，内容与可用性由第三方提供。
请遵守各平台服务条款与版权规定，转载、商用前务必取得授权。

---

## License

[MIT](LICENSE) © 2026 进阶工作台

<div align="center">
<br/>
<sub>如果这个项目对你有帮助，欢迎点一个 ⭐ Star</sub>
</div>