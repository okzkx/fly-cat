import { setTimeout as sleep } from "node:timers/promises";
import { SyncError } from "@/core/errors";

export interface FeishuDocPayload {
  id: string;
  title: string;
  blocks: Array<{ type: string; text?: string; level?: number; imageUrl?: string }>;
}

export interface McpTransport {
  invoke(toolName: string, argumentsJson: Record<string, unknown>): Promise<unknown>;
}

export class McpFeishuClient {
  public constructor(
    private readonly transport: McpTransport,
    private readonly toolName: string,
    private readonly maxRetries = 2
  ) {}

  public async getDocument(documentId: string): Promise<FeishuDocPayload> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      try {
        const data = await this.transport.invoke(this.toolName, { documentId });
        if (!data || typeof data !== "object") {
          throw new SyncError("mcp", "MCP returned invalid document payload");
        }
        return data as FeishuDocPayload;
      } catch (error) {
        if (attempt >= this.maxRetries) {
          if (error instanceof SyncError) {
            throw error;
          }
          throw new SyncError("mcp", `MCP retrieval failed: ${String(error)}`);
        }
        attempt += 1;
        await sleep(150 * attempt);
      }
    }
    throw new SyncError("mcp", "MCP retrieval exhausted retries");
  }
}
