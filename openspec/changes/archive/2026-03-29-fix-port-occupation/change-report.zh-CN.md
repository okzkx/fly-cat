# 变更报告: fix-port-occupation

## 基本信息

- **变更名称**: fix-port-occupation
- **Schema**: spec-driven
- **归档路径**: `openspec/changes/archive/2026-03-29-fix-port-occupation/`

## 变更动机

当 Tauri 开发应用被强制关闭（如任务管理器结束进程、直接关闭控制台窗口）后，Vite 开发服务器和 Tauri CLI 子进程成为孤儿进程，继续占用端口 1430。下次启动开发服务器时，虽然 `findAvailablePort` 会寻找其他可用端口，但孤儿进程会不断累积，最终耗尽端口范围（1430-1449）。

之前的修复（将 `strictPort` 改为 `false`）仅允许 Vite 在端口被占用时切换到下一个端口，但没有解决根本原因：孤儿进程仍然占用端口。

## 变更范围

### 修改文件

- `scripts/run-tauri.mjs` — 新增三个导出函数和一个启动流程集成
- `tests/run-tauri.test.ts` — 新增 13 个单元测试覆盖新功能

### 新增功能

1. **`findPortOwnerPid(port, options)`** — 通过 `netstat -ano`（Windows）或 `lsof -ti`（Unix）查找占用指定端口的进程 PID
2. **`isNodeProcess(pid, options)`** — 通过 `tasklist`（Windows）或 `ps`（Unix）验证指定 PID 是否为 Node.js 进程
3. **`killOrphanedDevProcesses(startPort, maxAttempts, options)`** — 扫描开发端口范围，检测并清理孤儿 Node.js 进程
4. **启动流程集成** — 在 `runDev()` 中调用 `killOrphanedDevProcesses()`，在启动新开发服务器前清理孤儿进程

## Spec 影响

在 `localhost-port-resilience` 规范中新增一条需求：

- **Orphaned Dev Process Cleanup on Startup**: 系统在启动新的开发会话前，必须检测并清理占用开发端口范围的孤儿 Node.js 进程

## 任务完成情况

- [x] Task 1: 新增端口占用者 PID 查找函数 `findPortOwnerPid`
- [x] Task 2: 新增 Node.js 进程验证函数 `isNodeProcess`
- [x] Task 3: 新增孤儿进程清理函数 `killOrphanedDevProcesses`
- [x] Task 4: 在 `runDev()` 中集成清理逻辑
- [x] Task 5: 新增 13 个单元测试，覆盖所有新增函数和边界情况
- [x] Task 6: 全部 56 个测试通过

## 技术要点

- 仅清理 `node.exe`（Windows）/ `node`（Unix）进程，避免误杀非开发进程
- 清理失败时仅记录警告，不阻塞启动流程
- 作为防御性措施，保留已有的 `strictPort: false` 配置
- 跨平台支持：Windows 使用 `netstat` + `tasklist` + `taskkill`，Unix 使用 `lsof` + `ps`
