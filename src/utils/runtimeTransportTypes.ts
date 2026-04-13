export interface RuntimeInfo {
  runtime: string;
  version: string;
}

export interface ExternalOpenResult {
  success: boolean;
  error?: string;
}

export interface SyncedMarkdownPreviewPayload {
  markdown: string;
  outputPath: string;
  title: string;
}
