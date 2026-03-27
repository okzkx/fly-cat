# 飞猫助手 (FlyCat)

将飞书知识库文档同步到本地的桌面应用。

## 功能特性

- **飞书知识库同步** - 支持同步飞书知识库文档到本地 Markdown 格式
- **图片本地化** - 自动下载并本地化文档中的图片资源
- **增量同步** - 仅同步变更内容，提高同步效率
- **桌面应用** - 原生桌面体验，支持 Windows、macOS、Linux
- **实时状态** - 可视化同步进度和状态展示

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| [Tauri](https://tauri.app/) | 2.x | 跨平台桌面应用框架 |
| [React](https://react.dev/) | 19 | 前端 UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | 类型安全的 JavaScript |
| [Ant Design](https://ant.design/) | 6.x | React UI 组件库 |
| [Vite](https://vitejs.dev/) | 7.x | 前端构建工具 |
| [Rust](https://www.rust-lang.org/) | - | Tauri 后端语言 |

## 快速开始

### 安装

1. 从 [Releases](../../releases) 页面下载对应平台的安装包
2. 运行安装程序完成安装

### 使用

1. 启动飞猫助手
2. 使用飞书账号登录授权
3. 选择要同步的知识库
4. 设置本地同步目录
5. 点击开始同步

## 开发指南

### 环境要求

- Node.js 18+
- Rust (通过 [rustup](https://rustup.rs/) 安装)
- pnpm / npm / yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

`npm run tauri dev` 会优先尝试 `localhost:1430`，如果该端口已被占用，会自动回退到附近可用端口并让 Tauri 使用同一个开发地址。

### OAuth 回调地址

在飞书应用中预先配置以下桌面 OAuth 回调地址：

- `http://localhost:3000/callback`
- `http://localhost:3001/callback`
- `http://localhost:3002/callback`
- `http://localhost:3003/callback`
- `http://localhost:3004/callback`
- `http://localhost:3005/callback`
- `http://localhost:3006/callback`
- `http://localhost:3007/callback`
- `http://localhost:3008/callback`
- `http://localhost:3009/callback`
- `http://localhost:3010/callback`

如果授权页提示本地回调初始化失败，请检查上述 localhost 端口范围是否被其他应用占用。

### 构建

```bash
npm run tauri build
```

### 运行测试

```bash
npm run test
```

### 类型检查

```bash
npm run typecheck
```

### OpenSpec 归档报告

归档 OpenSpec change 时，优先使用仓库提供的包装入口：

```bash
npm run openspec:archive -- <change-name> --yes
```

这个入口会先执行 `openspec archive`，成功后自动在归档目录内生成 `change-report.zh-CN.md`。

如果需要为历史归档补生成中文报告，可以执行：

```bash
npm run openspec:archive-report -- --change <change-name>
```

如果你已经知道具体归档目录，也可以改用：

```bash
npm run openspec:archive-report -- --archive-dir "openspec/changes/archive/YYYY-MM-DD-<change-name>"
```

## 项目结构

```
feishu-docs-sync/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   ├── services/           # 服务层
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── App.tsx             # 主应用组件
├── src-tauri/              # Tauri 后端 (Rust)
│   ├── src/
│   │   ├── commands.rs     # Tauri 命令
│   │   ├── sync.rs         # 同步逻辑
│   │   └── lib.rs          # 入口
│   └── Cargo.toml          # Rust 依赖
├── tests/                  # 测试文件
├── openspec/               # 项目规范和变更管理
└── package.json            # Node.js 配置
```

## 许可证

MIT License
