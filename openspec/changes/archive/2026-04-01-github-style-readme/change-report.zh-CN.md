# 变更报告：README GitHub 展示页风格

## 摘要

将根目录 `README.md` 调整为更接近 GitHub 项目首页的信息架构：顶部简介、目录锚点、功能亮点、界面素材说明、使用流程、快速开始，并修正 Releases 绝对链接；同步更新 `readme-documentation` 主规格。

## 动机

提升托管平台首屏可读性与导航效率，避免无效相对路径与虚构截图。

## 范围

- `README.md`
- `openspec/specs/readme-documentation/spec.md`
- OpenSpec 归档 `2026-04-01-github-style-readme`

## 风险与说明

- 主规格合并使用 `--skip-specs`：delta 内容已手工并入主规格后再归档，避免自动合并与旧格式校验冲突。

## 署名

🐱 星页猫（文档编织者·金吉拉）
