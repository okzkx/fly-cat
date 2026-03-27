## Context

当前仓库通过 `scripts/run-tauri.mjs` 在 `npm run tauri dev` 前为 Tauri 开发态动态挑选 localhost 端口，并写入临时 override 配置。这个方向本身是合理的，但现有实现直接在 Windows 上 `spawn` `tauri.cmd`，会导致包装脚本在进入真实 Tauri CLI 前就因为 `spawn EINVAL` 失败。与此同时，包装脚本只清理临时配置文件，没有在退出时管理自己拉起的开发进程树，因此残留的 Vite 进程可能继续占用旧端口。

## Goals / Non-Goals

**Goals:**
- 让自定义 Tauri 开发包装脚本在 Windows 上稳定启动
- 让包装脚本在退出、出错或收到终止信号时主动清理它启动的开发进程树
- 保持现有“优先使用 1430，冲突时回退到附近端口”的开发体验
- 为关键脚本行为补充自动化验证，降低后续回归概率

**Non-Goals:**
- 不改变已有 OAuth localhost 回调端口池策略
- 不修改 Tauri 应用窗口关闭语义之外的桌面运行时功能
- 不尝试清理并非当前包装脚本启动的其他任意本地进程

## Decisions

### 1. 通过 Node 直接调用 Tauri CLI 的 JS 入口，而不是 `tauri.cmd`

Windows 下的 `.cmd` shim 更适合交给 shell 解释，直接作为 `spawn` 目标容易触发 `EINVAL`。更稳妥的方案是像 shim 内部那样，直接用当前 Node 可执行文件运行 `node_modules/@tauri-apps/cli/tauri.js`。这样既保留跨平台一致性，也避免 shell 特性和参数转义差异。

备选方案：
- 改为 `shell: true`：可行但会引入额外的 shell 解析与参数转义风险
- 继续依赖 `.cmd`：在当前 Windows 环境下已被证明确实不稳定

### 2. 为 dev 子进程建立统一的退出清理路径

包装脚本需要同时处理三类退出路径：子进程自然退出、包装脚本收到 `SIGINT/SIGTERM`、启动阶段报错。设计上将临时 override 文件清理与子进程树终止收敛到统一的清理函数中，并保证最多执行一次。

在 Windows 上，使用 `taskkill /PID <pid> /T /F` 清理整棵子进程树；在其他平台上，对根子进程发送终止信号即可。这样可以最大限度减少 Vite 或其他 dev helper 进程在包装脚本退出后继续占用端口的情况。

备选方案：
- 只删除 override 文件，不管理进程树：无法解决残留端口占用
- 只调用 `child.kill()`：在 Windows 上往往不能可靠回收整棵子进程树

### 3. 把脚本逻辑拆成可测试的辅助函数

为了验证 Windows 命令解析和清理策略，脚本需要导出少量纯函数或可注入依赖的辅助逻辑，例如 CLI 启动命令解析和平台相关的清理命令构造。主流程仍保持脚本入口形式，但关键分支可以通过 Vitest 做单元测试。

备选方案：
- 仅手工测试：容易再次被平台差异击穿
- 为脚本单独引入新测试框架：收益低于维护成本

## Risks / Trade-offs

- [Windows 清理使用 `taskkill /F`] -> 可能比温和退出更强硬；通过仅针对当前包装脚本启动的根 PID 执行，并限制在退出路径中调用来降低影响
- [脚本导出测试辅助函数] -> 入口文件结构会略复杂；通过保持默认执行路径不变来控制改动范围
- [worktree 需要单独安装依赖才能跑测试] -> 会增加本次流程时长；但这是验证脚本与测试所必需的成本

## Migration Plan

1. 更新 OpenSpec design/spec/tasks，明确 Windows 启动和 dev 进程清理要求
2. 重构 `scripts/run-tauri.mjs`，改为 Node 直接调用 Tauri CLI JS 入口并补充统一清理逻辑
3. 添加脚本级自动化测试，覆盖 Windows 启动命令和清理分支
4. 运行针对性测试、`openspec validate`，确认 change 可归档

## Open Questions

- 是否还需要在包装脚本启动前识别并提示“同项目旧 dev 会话仍在运行”的场景？当前 change 先聚焦于正确启动与退出清理，避免扩大范围。
