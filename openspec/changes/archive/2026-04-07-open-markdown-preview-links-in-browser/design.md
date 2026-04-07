## Context

首页右侧的 `MarkdownPreviewPane` 当前通过 `marked` + `DOMPurify` 直接把已同步 Markdown 渲染进一个可滚动容器，只针对图片 `src` 做了 Tauri 资源路径改写，没有接管 `<a>` 的默认点击行为。因此在桌面 WebView 中点击链接时，导航发生在当前应用页内，用户会离开首页上下文。

## Goals / Non-Goals

**Goals:**

- 让预览区中的外部链接不再触发当前应用页导航。
- 在 Tauri 下复用 opener 能力，通过系统默认浏览器打开点击的链接。
- 在浏览器模拟环境保持一致的外部打开语义，并在打开失败时提示用户。

**Non-Goals:**

- 不重做 Markdown 渲染栈，也不引入 iframe / 新窗口式预览容器。
- 不为预览中的 hash 锚点增加站内滚动增强。
- 不扩展为“任意本地文件链接”浏览器打开能力，本次只保证常见外部 URL 被安全拦截。

## Decisions

1. **在预览容器做事件委托拦截**  
   给 `MarkdownPreviewPane` 的 HTML 容器增加点击处理，向上查找最近的 `<a>` 元素；命中后统一 `preventDefault()`，避免 WebView 自身导航。  
   备选方案是在 HTML 生成阶段重写每个 `<a>`；但这样会把交互逻辑和内容改写耦合在一起，也更难处理后续渲染更新。

2. **新增通用外部 URL 打开辅助方法**  
   在 `tauriRuntime` 中新增 `openExternalUrl(url)`，桌面版调用 `@tauri-apps/plugin-opener`，浏览器模式退化为 `window.open(url, "_blank", "noopener,noreferrer")`。  
   备选方案是让组件直接依赖 `openUrl`；但这会把运行时分支散落到 UI 组件里，难以复用与测试。

3. **只拦截明确的外部 URL**  
   链接 href 解析后仅对 `http:`、`https:`、`mailto:` 协议执行外部打开；其他协议或空链接直接忽略，并保持当前页不跳转。  
   备选方案是连相对链接一起外开，但 Markdown 预览的相对链接缺少稳定的网页基址，容易错误指向当前应用路由。

## Risks / Trade-offs

- [预览中的相对链接不会自动跳到对应站外页面] → 先聚焦修复用户实际遇到的外部链接刷新问题，后续若出现真实需求再为相对链接定义单独规则。
- [点击失败后才暴露错误] → 通过统一返回 `{ success, error }` 并使用消息提示，至少保证用户知道没有成功打开。
- [事件委托依赖 DOM 结构] → 通过 `closest("a")` 处理嵌套元素点击，避免只点中文本时才生效。
