## 1. Development Port Strategy

- [x] 1.1 Relax the fixed Vite development port strategy so localhost port conflicts do not immediately block `tauri dev`
- [x] 1.2 Update Tauri development configuration to match the resilient frontend dev server behavior

## 2. OAuth Callback Resilience

- [x] 2.1 Expand the desktop OAuth callback port pool and keep redirect URI generation aligned with the selected port
- [x] 2.2 Show actionable authorization errors when no supported localhost callback port can be bound

## 3. User Guidance and Validation

- [x] 3.1 Update settings and README guidance to document the supported localhost callback address range
- [x] 3.2 Run validation and project checks for the port-resilience change
