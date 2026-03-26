export type ErrorCategory = "mcp" | "transform" | "filesystem" | "validation";

export class SyncError extends Error {
  public readonly category: ErrorCategory;
  public readonly retriable: boolean;

  constructor(category: ErrorCategory, message: string, retriable = true) {
    super(message);
    this.category = category;
    this.retriable = retriable;
  }
}
