## 基本信息

- 变更名称：`fix-discovery-document-summary-rate-limit`
- 变更类型：缺陷修复
- 影响范围：知识库同步发现阶段、Feishu OpenAPI 文档详情请求、OpenSpec 规格与归档记录

## 执行者身份信息

- 姓名：票据猫
- 品种：俄罗斯蓝猫
- 职业：接口锻造师
- 经历：长期处理导出任务、异步票据和第三方 API 链路问题，擅长顺着一次失败请求追到真正的根因。
- 性格：冷静专注，喜欢把异步链路一节一节对齐
- 口头禅：票据对上了，链路就通了
- 邮箱：`piaojumao@opencat.dev`

## 变更动机

用户在知识库里打勾后启动同步时，发现阶段会为每个文档请求一次 Feishu 文档信息。当前实现对 `code=99991400` 限频响应直接失败，导致本来只需短暂退避即可恢复的同步任务被整次判定为 discovery 失败。

## 变更范围

- 为 `src-tauri/src/mcp.rs` 中的文档信息请求补充统一的限频识别与指数退避重试 helper。
- 仅让知识库同步发现阶段改用 `fetch_document_summary_with_retry`，避免扩散到无关 discovery 接口。
- 保持非限频错误继续快速失败，避免掩盖权限或数据问题。
- 补充 Rust 单测，覆盖“限频后成功重试”和“非限频不重试”两类行为。

## 规格影响

- `knowledge-base-source-sync` 的 Knowledge Base Scoped Discovery 要求已补充 discovery 阶段文档详情请求的限频重试约束。
- 新增场景，明确 `code=99991400` 时应在 bounded backoff 后再决定是否失败。

## 任务完成情况

- [x] 为 discovery 阶段文档详情请求增加限频重试
- [x] 保持非限频错误快速失败
- [x] 补充限频/非限频回归测试
- [x] 运行 Rust 后端测试并通过
- [x] 重新验证 OpenSpec change
