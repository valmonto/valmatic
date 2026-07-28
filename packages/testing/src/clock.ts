/**
 * A clock you control, so time-dependent code is deterministic under test.
 *
 * Inject this wherever production code would otherwise call `Date.now()` or
 * `new Date()`. Real clocks make tests flaky — worse, they fail differently
 * depending on how many suites run in parallel and how loaded the machine is.
 */
export interface Clock {
  now(): Date;
  timestamp(): number;
}

/** The real clock. Wire this up in production modules. */
export const systemClock: Clock = {
  now: () => new Date(),
  timestamp: () => Date.now(),
};

export class FakeClock implements Clock {
  private current: number;

  constructor(start: Date | number | string = '2026-01-01T00:00:00.000Z') {
    this.current = new Date(start).getTime();
  }

  now(): Date {
    return new Date(this.current);
  }

  timestamp(): number {
    return this.current;
  }

  /** Move time forward. Accepts ms, or a duration like `'5m'`, `'2h'`, `'1d'`. */
  advance(by: number | string): this {
    this.current += typeof by === 'number' ? by : parseDuration(by);
    return this;
  }

  /** Jump to an absolute instant. */
  set(to: Date | number | string): this {
    this.current = new Date(to).getTime();
    return this;
  }
}

const UNITS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseDuration(value: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/.exec(value.trim());
  const amount = match?.[1];
  const unit = match?.[2];
  if (amount === undefined || unit === undefined) {
    throw new Error(`Unrecognised duration "${value}" — expected e.g. 500ms, 30s, 5m, 2h, 1d`);
  }
  return Number(amount) * (UNITS[unit] ?? 1);
}
