# 变更报告：fix-rust-warnings

## 基本信息

| 项目 | 值 |
|------|------|
| 变更名称 | fix-rust-warnings |
| 规范 | spec-driven |
| 归档路径 | openspec/changes/archive/2026-03-29-fix-rust-warnings/ |

## 变更动机

`cargo check` 报告 13 个 Rust 编译器警告，均为死代码或未使用变量警告。消除这些警告以提升代码整洁度，使真正的警告更容易被发现。

## 变更范围

修改了 3 个源文件：

| 文件 | 修改内容 |
|------|----------|
| `commands.rs` | 未使用变量加下划线前缀；8 个测试辅助函数添加 `#[cfg(test)]` 门控 |
| `sync.rs` | 2 个测试辅助函数添加 `#[cfg(test)]` 门控；结构体字段添加 `#[allow(dead_code)]` |
| `mcp.rs` | 结构体字段添加 `#[allow(dead_code)]` |

## 技术决策

- **测试专用函数**：使用 `#[cfg(test)]` 门控，符合 Rust 惯用法
- **保留型结构体字段**：使用 `#[allow(dead_code)]` 并附注释说明原因
- **未使用变量**：使用下划线前缀表示有意不使用

## 任务完成情况

14/14 任务全部完成，`cargo check` 和 `cargo test` 均无警告，29 个测试全部通过。
