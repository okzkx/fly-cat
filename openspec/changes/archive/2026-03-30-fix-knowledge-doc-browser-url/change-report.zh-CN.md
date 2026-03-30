# 变更报告：知识库文档浏览器链接修复

## 基本信息

- **变更名称**: `fix-knowledge-doc-browser-url`
- **变更日期**: 2026-03-30
- **变更类型**: 缺陷修复
- **归档路径**: `openspec/changes/archive/2026-03-30-fix-knowledge-doc-browser-url`

## 变更动机

知识树中的“在浏览器打开”功能虽然已经能调用系统浏览器，但文档节点仍然使用了错误的标识符来拼接 Feishu 文档链接。对于知识库中的目录型文档或带子节点的文档，这会把用户带到“页面不存在”的结果页。

## 变更范围

### 修改文件

| 文件 | 变更说明 |
|------|----------|
| `src/components/HomePage.tsx` | 文档节点打开浏览器时同时传递 `documentId` 与 `nodeToken` |
| `src/utils/tauriRuntime.ts` | 改为通过统一 URL helper 构建浏览器打开目标 |
| `src/utils/feishuBrowserUrl.ts` | 新增 Feishu 浏览器 URL 生成逻辑，明确文档/表格节点使用不同标识符 |
| `tests/feishu-browser-url.test.ts` | 新增文档、目录型文档、bitable 的 URL 回归测试 |
| `TODO.md` | 移除当前已完成 P2 活跃任务，切换到下一个待办 |
| `DONE.md` | 记录本次真实修复结果 |

## 规格影响

### MODIFIED Requirements

- `tauri-desktop-runtime-and-backend`
  - 文档节点在浏览器打开时改为使用 `documentId`
  - 带子节点的文档仍必须打开其真实文档页面
  - bitable 节点继续使用既有 `base/<token>` 打开方式

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 文档节点浏览器打开改为传递文档标识 | 完成 |
| 浏览器 URL helper 改为区分 documentId 与 nodeToken | 完成 |
| 增加 URL 生成回归测试 | 完成 |
| 执行相关验证 | 完成 |

## 测试验证

- [x] `npx vitest run tests/feishu-browser-url.test.ts`
- [x] `openspec validate fix-knowledge-doc-browser-url`
- [ ] `npm run typecheck`：存在仓库内未触达文件的既有错误，未作为本次变更阻塞项

## 遗留问题

- 仓库全量 TypeScript 检查仍有既有错误：`tests/run-tauri.test.ts` 与 `tests/tri-state-checkbox.test.ts`，与本次修复文件无关。
