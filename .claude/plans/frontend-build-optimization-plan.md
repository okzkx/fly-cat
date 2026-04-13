# 前端打包体积优化计划

## Context

当前执行 `npm run build` 时，前端产物只有一个主 JavaScript chunk：

- `dist/assets/index-WIsurV0g.js`：`1145.00 kB`
- gzip 后体积：`367.06 kB`
- Vite 输出警告：`Some chunks are larger than 500 kB after minification`

已确认的主要原因如下：

1. `vite.config.ts` 目前未配置 `build.rollupOptions.output.manualChunks`
2. `src/App.tsx` 同步引入了 `AuthPage`、`HomePage`、`SettingsPage`、`TaskListPage`
3. `src/components/HomePage.tsx` 同步引入了 `MarkdownPreviewPane`
4. `src/components/MarkdownPreviewPane.tsx` 直接引入了 `marked` 和 `dompurify`
5. `antd`、`@ant-design/icons`、Tauri 相关依赖与业务代码一起落入同一个入口包

## 优化目标

1. 将当前“单一主包”改为“按页面和依赖域拆分”的多 chunk 结构
2. 让首屏只加载必要代码，低频页面和 Markdown 预览链路按需加载
3. 在不改变现有交互语义的前提下，将最大业务 chunk 尽量压到 500 kB 警告线以下
4. 保持 Tauri 桌面模式与浏览器模式的现有行为一致

## 实施计划

### P1 - 结构性分包

- [ ] T1: 在 `src/App.tsx` 使用 `React.lazy` + `Suspense` 懒加载 `AuthPage`、`HomePage`、`SettingsPage`、`TaskListPage`
  - 保留 `BrandMark`、`Layout`、全局状态与应用级事件桥接在主包
  - 提供统一 fallback，避免页面切换出现空白或闪烁

- [ ] T2: 将 `src/components/HomePage.tsx` 中的 `MarkdownPreviewPane` 改为懒加载组件
  - 进入首页后再拉取预览面板代码
  - 降低首页基础包对 Markdown 预览链路的耦合

- [ ] T3: 在 `src/components/MarkdownPreviewPane.tsx` 内将 `marked` 和 `dompurify` 改为 `import()` 按需加载
  - 仅在存在 Markdown 内容且需要渲染 HTML 时加载
  - 避免 Markdown 解析与清洗依赖进入首页基础包

### P1 - 构建层分包策略

- [ ] T4: 在 `vite.config.ts` 增加 `build.rollupOptions.output.manualChunks`
  - `react-vendor`: `react`、`react-dom`
  - `antd-vendor`: `antd`、`@ant-design/icons`、`rc-*`
  - `tauri-vendor`: `@tauri-apps/*`、`@fabianlars/tauri-plugin-oauth`
  - `markdown-vendor`: `marked`、`dompurify`

- [ ] T5: 重新运行 `npm run build` 并记录主要 chunk 变化
  - 记录每个主要 chunk 的 minified 体积与 gzip 体积
  - 判断是否仍存在超过 500 kB 的单个 chunk

### P2 - 精细化优化

- [ ] T6: 若 P1 后 `HomePage` 仍明显偏大，再拆分低频子区块
  - 优先考虑树选择、预览、批量操作等相对独立的功能块

- [ ] T7: 复查 `TaskListPage`、`SettingsPage` 是否有可进一步延迟加载的低频组件

- [ ] T8: 仅在完成结构性分包后，再评估是否需要调整 `build.chunkSizeWarningLimit`
  - 不将“提高阈值”作为第一步
  - 只有在 chunk 结构已合理且警告仅略超阈值时才考虑

## 关键文件

| 文件 | 计划修改 |
| --- | --- |
| `vite.config.ts` | 增加 `manualChunks`，必要时补充 chunk 警告阈值配置 |
| `src/App.tsx` | 页面级懒加载与 `Suspense` 兜底 |
| `src/components/HomePage.tsx` | 预览组件懒加载 |
| `src/components/MarkdownPreviewPane.tsx` | `marked` / `dompurify` 按需导入 |
| `src/main.tsx` | 一般无需修改，仅确认入口保持稳定 |

## 验证方式

1. 运行 `npm run build`，确认产物不再只有单一 `index-*.js` 大包
2. 对比优化前后各 chunk 体积，重点关注最大 chunk 是否降到 500 kB 附近或以下
3. 手动验证 `settings`、`auth`、`home`、`tasks` 页面切换是否正常
4. 在桌面端验证 Markdown 预览的首次打开、再次打开、外链点击是否正常
5. 在浏览器模式验证“无法读取本机同步目录”的空态提示没有回归

## 完成标准

- 构建产物形成多个职责清晰的 chunk，而不是单一主包
- 低频页面不再进入首屏同步下载
- Markdown 解析依赖不再阻塞首页初始加载
- 构建警告消失，或在保留警告时有明确记录与理由
