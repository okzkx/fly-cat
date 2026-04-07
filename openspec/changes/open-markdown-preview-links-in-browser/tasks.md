## 1. Preview link behavior

- [ ] 1.1 在 `tauriRuntime` 增加通用外部 URL 打开辅助方法，并统一返回成功/失败结果
- [ ] 1.2 在 `MarkdownPreviewPane` 拦截预览链接点击，外部链接改为调用默认浏览器打开并阻止当前页导航

## 2. Verification

- [ ] 2.1 补充 Markdown 预览相关单测，覆盖外部链接识别或辅助方法行为
- [ ] 2.2 运行 `npm run test -- markdown-preview-utils.test.ts` 与 `npm run typecheck`
