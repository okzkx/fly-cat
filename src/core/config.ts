export interface AppConfig {
  syncRoot: string;
  imageDirName: string;
  mcpServerName: string;
  mcpToolName: string;
  requestTimeoutMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    syncRoot: env.SYNC_ROOT ?? "./synced-docs",
    imageDirName: env.SYNC_IMAGE_DIR ?? "_assets",
    mcpServerName: env.FEISHU_MCP_SERVER ?? "user-feishu-mcp",
    mcpToolName: env.FEISHU_DOC_TOOL ?? "get_doc_content",
    requestTimeoutMs: Number(env.MCP_REQUEST_TIMEOUT_MS ?? 10000)
  };
}
