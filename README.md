# Ports - Windows 端口监控工具

一款轻量级 Windows 桌面端口监控工具，实时显示本地所有监听端口和开发服务器状态。灵感来源于 macOS 上的 [Ports](https://www.ports-app.com/)，为 Windows 开发者带来同样的便捷体验。

![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能特性

- **实时端口监控** — 每 2 秒自动扫描所有 TCP 监听端口
- **智能框架识别** — 自动识别 Node / Vite / Next.js / React / Vue / Nuxt / Angular / Svelte / Python / Django / Flask / Rails / Go / Bun / Deno / Java / PHP / Rust / .NET / Docker 等 20+ 种开发框架
- **进程详情** — 显示每个端口的 PID、CPU 使用率、内存占用、运行时长
- **一键操作** — 一键在浏览器中打开 `localhost:port`，一键终止进程
- **双模式窗口** — 系统托盘弹出面板 + 独立桌面窗口，两种视图随意切换
- **暗色 / 亮色主题** — 精心调配的双主题配色，默认暗色模式
- **全局搜索** — 按端口号、进程名、框架类型快速过滤
- **框架筛选** — 点击标签快速过滤特定框架的端口

## 📸 界面预览

![1782886690753](C:\Users\21919\AppData\Roaming\Typora\typora-user-images\1782886690753.png)

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16（推荐 18+）
- **npm** >= 8
- **Windows** 10 / 11

### 安装

```bash
# 克隆仓库
git clone https://github.com/beihaibudu/ports-monitor.git
cd ports-monitor

# 安装依赖（Electron 二进制下载可能较慢）
npm install
```

> **提示**：如果 Electron 下载缓慢，可以使用国内镜像：
> ```bash
> set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
> npm install
> ```

### 运行

```bash
# 直接运行（需要已构建）
npm run build
npx electron .

# 或者使用开发模式（需要 Vite 开发服务器）
npm run dev
```

### 构建

```bash
# 编译全部（Electron 主进程 + React 前端）
npm run build

# 仅编译 Electron 主进程
npm run build:electron

# 仅编译前端
npm run build:renderer
```

### 打包

```bash
# 打包为 Windows 安装程序（.exe）
npm run pack
```

打包产物位于 `release/` 目录。

## 🏗️ 项目结构

```
ports-monitor/
├── electron/                  # Electron 主进程
│   ├── main.ts               # 应用入口，窗口管理、系统托盘
│   ├── preload.ts            # IPC 安全桥接
│   └── port-monitor.ts       # 端口扫描引擎
├── src/                       # React 前端
│   ├── components/
│   │   ├── Header.tsx        # 顶栏（Logo + 主题切换）
│   │   ├── FilterBar.tsx     # 框架筛选标签
│   │   ├── SearchBar.tsx     # 全局搜索
│   │   ├── PortList.tsx      # 端口列表容器
│   │   ├── PortItem.tsx      # 单个端口卡片
│   │   ├── StatsRow.tsx      # 统计卡片（窗口模式）
│   │   └── StatusBar.tsx     # 底部状态栏
│   ├── styles/
│   │   └── index.css         # 全局样式 + 主题变量
│   ├── App.tsx               # 根组件
│   ├── main.tsx              # 主窗口入口
│   └── tray-main.tsx         # 托盘面板入口
├── dist/                      # Vite 构建产物
├── dist-electron/             # Electron 编译产物
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tsconfig.electron.json
```

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 28 |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 4 |
| 图标库 | Lucide React |
| 端口扫描 | Windows `netstat -ano` |
| 进程信息 | Windows `tasklist` + `wmic` |

## 🎨 主题配色

| | 暗色模式 | 亮色模式 |
|---|---------|---------|
| 背景 | `#1c1b20` | `#f5f1ea` |
| 卡片 | `#2a292f` | `#ffffff` |
| 强调色 | `#5a8dff` | `#2f6df0` |
| 文字 | `#f0f0f0` | `#1a1a1a` |

## 📝 开发说明

### 开发模式

开发模式下，Vite 提供热更新，Electron 从 `localhost:5173` 加载页面：

```bash
npm run dev
```

这会同时启动 Vite 开发服务器和 Electron 窗口。

### 生产模式

构建后直接运行，Electron 从本地 `dist/` 加载页面，无需开发服务器：

```bash
npm run build && npx electron .
```

### 端口扫描原理

1. 执行 `netstat -ano -p TCP` 获取所有 TCP 监听端口及 PID
2. 执行 `tasklist /FO CSV` 获取进程名称和内存占用
3. 执行 `wmic process` 获取 CPU 时间，通过两次采样差值计算实时 CPU 使用率
4. 通过进程名和命令行参数匹配，自动识别开发框架

## 📄 License

[MIT](LICENSE)

---

> 灵感来源：[Ports](https://www.ports-app.com/) (macOS)
