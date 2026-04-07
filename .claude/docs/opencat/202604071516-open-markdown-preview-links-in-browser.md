# 归档报告：open-markdown-preview-links-in-browser

## 基本信息

- **变更名称：** `open-markdown-preview-links-in-browser`
- **归档目录：** `openspec/changes/archive/2026-04-07-open-markdown-preview-links-in-browser/`
- **完成日期：** 2026-04-07

## 执行者身份

- **展示名 / Git user.name：** 扫帚猫
- **Git user.email：** `saozhoumao@opencat.dev`
- **角色：** OpenCat 桌面交互收尾执行；本任务聚焦 Markdown 预览区链接外部打开修复。

## 变更动机

首页 Markdown 预览区已经可以展示同步后的本地文档，但点击文中的链接时，Tauri WebView 会直接在当前应用页内发生导航，导致首页被刷新、预览上下文丢失。桌面应用更合理的行为是把这类链接交给系统默认浏览器处理。

## 变更范围

- **`src/components/MarkdownPreviewPane.tsx`**
  - 为预览容器增加链接点击事件委托。
  - 命中 `<a>` 后阻止当前页导航，并通过运行时 helper 打开外部链接。
  - 对不支持的链接协议和打开失败场景给出用户提示。
- **`src/utils/tauriRuntime.ts`**
  - 新增通用 `openExternalUrl()`，统一封装 Tauri opener 与浏览器模式下的新窗口打开逻辑。
  - 让 `openDocumentInBrowser()` 复用同一套外部打开路径。
- **`src/utils/markdownPreview.ts` / `tests/markdown-preview-utils.test.ts`**
  - 新增预览链接协议识别辅助函数，并补充单测覆盖支持/拒绝场景。
- **OpenSpec**
  - 已归档 change，并把 `knowledge-doc-markdown-preview` 主规格补充为“预览外部链接必须走系统默认浏览器”。

## 规格影响

- 修改：`knowledge-doc-markdown-preview` 新增「Markdown preview links open outside the app」要求。
- 行为约束：支持的 `http`、`https`、`mailto` 链接点击后不再在应用内导航，而是交给系统默认处理器。

## 任务完成情况

- propose / apply / archive 三阶段提交已完成。
- `openspec validate "open-markdown-preview-links-in-browser" --type change` 通过。
- `npm run test -- markdown-preview-utils.test.ts` 通过。
- `npm run typecheck` 通过。

## 口头禅

扫一把页内跳转灰，链接该出门就出门，别在猫窝里乱刷新。
