# sync-doc-download-status

同步任务激活时文档状态标签不更新为同步中：getSyncingDocumentIds() 只从 selectedSources 收集有 documentId 的来源，目录/空间级别选择没有 documentId，导致 syncingIds 为空
