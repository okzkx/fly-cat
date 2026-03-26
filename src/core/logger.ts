type LogLevel = "info" | "warn" | "error";

export interface AppLogger {
  log(level: LogLevel, scope: string, message: string, data?: unknown): void;
}

export class ConsoleLogger implements AppLogger {
  public log(level: LogLevel, scope: string, message: string, data?: unknown): void {
    const base = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${message}`;
    if (data === undefined) {
      console[level === "info" ? "log" : level](base);
      return;
    }
    console[level === "info" ? "log" : level](base, data);
  }
}
