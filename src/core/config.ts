export interface AppConfig {
  syncRoot: string;
  imageDirName: string;
  mcpServerName: string;
  mcpToolName: string;
  requestTimeoutMs: number;
}

type EnvSource = Record<string, string | undefined>;

function resolveBrowserEnv(): EnvSource {
  const viteEnv = (import.meta as ImportMeta & { env?: EnvSource }).env ?? {};
  const processEnv = (globalThis as typeof globalThis & { process?: { env?: EnvSource } }).process?.env ?? {};
  return { ...processEnv, ...viteEnv };
}

export function loadConfig(env: EnvSource = resolveBrowserEnv()): AppConfig {
  return {
    syncRoot: env.SYNC_ROOT ?? "./synced-docs",
    imageDirName: env.SYNC_IMAGE_DIR ?? "_assets",
    mcpServerName: env.FEISHU_MCP_SERVER ?? "user-feishu-mcp",
    mcpToolName: env.FEISHU_DOC_TOOL ?? "get_doc_content",
    requestTimeoutMs: Number(env.MCP_REQUEST_TIMEOUT_MS ?? 10000)
  };
}
