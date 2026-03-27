## Why

当前自定义 `npm run tauri dev` 包装脚本在 Windows 上会因为直接 `spawn` `tauri.cmd` 而触发 `spawn EINVAL`，导致开发流程在端口选择完成后仍然无法启动。同时，已有开发会话残留的 Vite 进程可能继续占用先前选择的 localhost 端口，让后续启动不断回退到新端口，放大了“应用关闭后端口不释放”的问题。

## What Changes

- 修复 Windows 下 Tauri CLI 包装脚本的启动方式，确保 `npm run tauri dev` 能稳定拉起真实的 Tauri 开发流程。
- 为开发包装脚本补充退出期清理逻辑，在包装进程结束时尽量终止它启动的整条开发进程链，避免残留 Vite 继续占用端口。
- 补充针对开发端口生命周期的行为约束与验证，确保选中的 localhost 端口在 dev 会话结束后可以重新用于下一次启动。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `localhost-port-resilience`: 扩展本地开发端口恢复要求，覆盖开发会话退出后的端口释放与残留进程清理
- `tauri-desktop-runtime-and-backend`: 明确自定义 Tauri 开发包装脚本在 Windows 上必须能够成功启动桌面开发运行时

## Impact

- 受影响脚本：`scripts/run-tauri.mjs`
- 受影响开发配置与验证：`package.json`、可能新增脚本测试
- 受影响 OpenSpec：`openspec/specs/localhost-port-resilience/spec.md`、`openspec/specs/tauri-desktop-runtime-and-backend/spec.md`
