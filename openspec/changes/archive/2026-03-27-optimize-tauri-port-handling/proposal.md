## Why

当前 Tauri 开发流程和桌面 OAuth 回调流程依赖多个写死的本地端口，容易在开发机或终端用户环境中与其他应用发生冲突，导致 `tauri dev` 无法启动或飞书登录回调初始化失败。需要将端口处理改为更具弹性和可恢复性，同时保证用户能够获得明确的配置与失败提示。

## What Changes

- 调整 Tauri 开发态端口策略，避免因为固定 Vite/HMR 端口被占用而直接阻断本地开发。
- 扩展桌面 OAuth 回调端口选择策略，从少量固定端口改为可容忍常见占用场景的本地端口池。
- 更新设置页与授权页文案，使用户知道需要在飞书应用中配置一组回调地址，并在端口不可用时看到可操作的提示。

## Capabilities

### New Capabilities

- `localhost-port-resilience`: 为本地开发端口和桌面 OAuth 回调端口提供冲突规避与恢复能力

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: 调整桌面运行时对开发端口占用和本地 OAuth 回调端口分配的要求
- `sync-focused-application-experience`: 调整设置/授权体验中关于本地回调地址配置和端口失败提示的要求

## Impact

- 受影响前端配置：`vite.config.ts`、`src-tauri/tauri.conf.json`
- 受影响授权流程：`src/components/AuthPage.tsx`
- 受影响用户文案：`src/components/SettingsPage.tsx`、`README.md`
- 不引入新的外部服务，仅调整现有 Tauri/Vite/OAuth 本地端口处理方式
