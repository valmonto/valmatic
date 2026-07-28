export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  args: unknown[];
}

/**
 * A pino logger that records instead of printing.
 *
 * Shaped to `PinoLogger` from `nestjs-pino`, which is what `@InjectLogger()`
 * provides — so it drops into a service under test without the
 * `as unknown as PinoLogger` cast a hand-rolled object needs.
 *
 * Two jobs: keep test output readable, and let a test assert that something was
 * logged — useful where logging *is* the observable behaviour, like an error
 * swallowed on purpose so a cleanup step cannot fail the request.
 */
export class FakeLogger {
  readonly entries: LogEntry[] = [];
  context?: string;

  trace(...args: unknown[]): void {
    this.entries.push({ level: 'trace', args });
  }

  debug(...args: unknown[]): void {
    this.entries.push({ level: 'debug', args });
  }

  info(...args: unknown[]): void {
    this.entries.push({ level: 'info', args });
  }

  warn(...args: unknown[]): void {
    this.entries.push({ level: 'warn', args });
  }

  error(...args: unknown[]): void {
    this.entries.push({ level: 'error', args });
  }

  fatal(...args: unknown[]): void {
    this.entries.push({ level: 'fatal', args });
  }

  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Hand it to something typed against a concrete logger class.
   *
   * `PinoLogger` carries private members (`logger`, `contextName`, `errorKey`)
   * that no structural stand-in can satisfy, so a cast is unavoidable. Keeping
   * it here means one documented cast rather than
   * `as unknown as PinoLogger` scattered through every test — and the variable
   * you assert on stays a `FakeLogger`.
   *
   * @example provider = new AuthProvider(redis, logger.as<PinoLogger>());
   */
  as<T>(): T {
    return this as unknown as T;
  }

  /** Entries at one level. */
  at(level: LogLevel): LogEntry[] {
    return this.entries.filter((e) => e.level === level);
  }

  /**
   * True when any entry contains `text`, in the message or in a logged object.
   * Pino is called as `logger.warn({ err }, 'message')`, so both matter.
   */
  logged(text: string, level?: LogLevel): boolean {
    const entries = level ? this.at(level) : this.entries;
    return entries.some((e) => e.args.some((arg) => serialize(arg).includes(text)));
  }

  reset(): void {
    this.entries.length = 0;
  }
}

function serialize(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, (_, v) => (v instanceof Error ? v.message : v)) ?? '';
  } catch {
    return String(value);
  }
}
