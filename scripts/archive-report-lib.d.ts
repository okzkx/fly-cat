export const ARCHIVE_REPORT_FILENAME: string;

export interface TaskItem {
  done: boolean;
  text: string;
}

export interface TaskStats {
  total: number;
  complete: number;
  remaining: number;
  items: TaskItem[];
}

export interface BuildArchiveReportOptions {
  archiveDirName: string;
  schemaName: string;
  why: string;
  whatChanges: string;
  decisions: string;
  taskStats: TaskStats;
  specFiles: string[];
  archiveDir: string;
}

export function extractMarkdownSection(markdown: string, heading: string): string;
export function parseTaskStats(tasksMarkdown: string): TaskStats;
export function buildArchiveReport(options: BuildArchiveReportOptions): string;
export function generateArchiveReport(archiveDir: string): Promise<string>;
export function resolveArchiveDir(options: {
  archiveRoot: string;
  changeName?: string;
  archiveDir?: string;
}): Promise<string>;
