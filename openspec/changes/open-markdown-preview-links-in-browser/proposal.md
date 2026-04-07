## Why

用户会在首页 Markdown 预览区点击文中的链接继续查看原始内容或外部资料。当前这些点击会让应用 WebView 自身导航并刷新当前页面，导致预览上下文丢失，也无法像桌面应用预期那样交给系统默认浏览器处理。

## What Changes

- 为知识库首页的 Markdown 预览区增加链接点击拦截，避免当前应用页被链接导航刷新。
- 预览中的外部链接在桌面运行时改为通过系统默认浏览器打开，并将失败信息返回给前端提示用户。
- 为预览链接行为补充测试与规格，确保后续预览渲染调整不会回归为页内跳转。

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `knowledge-doc-markdown-preview`: 补充预览区链接点击后的期望行为，要求外部链接交给系统默认浏览器而不是在应用内导航。

## Impact

- 前端：`src/components/MarkdownPreviewPane.tsx` 需要接管预览链接点击事件。
- 运行时封装：`src/utils/tauriRuntime.ts` 需要暴露可复用的外部链接打开辅助方法。
- 测试：补充 Markdown 预览相关单测，覆盖链接解析与点击拦截行为。
