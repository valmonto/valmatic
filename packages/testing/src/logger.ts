export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export interface LogEntry {
  level: LogLevel;
  message: unknown;
  context?: unknown;
}

/**
 * A logger that records instead of printing.
 *
 * Two jobs: keep test output readable, and let a test assert that something was
 * logged — useful for the paths where logging *is* the observable behaviour,
 * like a swallowed error in a background job.
 *
 * Shaped to satisfy Nest's `LoggerService`.
 */
export class FakeLogger {
  readonly entries: LogEntry[] = [];

  log(message: unknown, context?: unknown): void {
    this.entries.push({ level: 'log', message, context });
  }

  error(message: unknown, context?: unknown): void {
    this.entries.push({ level: 'error', message, context });
  }

  warn(message: unknown, context?: unknown): void {
    this.entries.push({ level: 'warn', message, context });
  }

  debug(message: unknown, context?: unknown): void {
    this.entries.push({ level: 'debug', message, context });
  }

  verbose(message: unknown, context?: unknown): void {
    this.entries.push({ level: 'verbose', message, context });
  }

  /** Entries at one level, or all of them. */
  at(level: LogLevel): LogEntry[] {
    return this.entries.filter((e) => e.level === level);
  }

  /** True when any entry's message contains `text`. */
  logged(text: string, level?: LogLevel): boolean {
    return (level ? this.at(level) : this.entries).some((e) => String(e.message).includes(text));
  }

  reset(): void {
    this.entries.length = 0;
  }
}
