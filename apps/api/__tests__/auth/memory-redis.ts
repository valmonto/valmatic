/**
 * Just enough of Redis, in memory, for what counts sign-in attempts:
 * get/mget/exists/incr/expire/set (with EX, and NX)/del, MULTI, and SCAN by a
 * `prefix*` pattern.
 * Expiry is recorded, not enforced — tests read `ttl` to check it was set.
 */
export class MemoryRedis {
  readonly values = new Map<string, string>();
  readonly ttl = new Map<string, number>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }
  async mget(...keys: string[]) {
    return keys.map((key) => this.values.get(key) ?? null);
  }
  async exists(key: string) {
    return this.values.has(key) ? 1 : 0;
  }
  async incr(key: string) {
    const next = Number(this.values.get(key) ?? 0) + 1;
    this.values.set(key, String(next));
    return next;
  }
  async expire(key: string, seconds: number) {
    this.ttl.set(key, seconds);
    return 1;
  }
  async set(key: string, value: string, _ex?: 'EX', seconds?: number, nx?: 'NX') {
    if (nx && this.values.has(key)) return null;
    this.values.set(key, value);
    if (seconds) this.ttl.set(key, seconds);
    return 'OK';
  }
  async del(...keys: string[]) {
    let gone = 0;
    for (const key of keys) if (this.values.delete(key)) gone++;
    return gone;
  }
  async scan(_cursor: string, _match: 'MATCH', pattern: string) {
    const prefix = pattern.replace(/\*$/, '');
    return ['0', [...this.values.keys()].filter((key) => key.startsWith(prefix))] as const;
  }
  multi() {
    const queued: (() => Promise<unknown>)[] = [];
    const chain = {
      incr: (key: string) => (queued.push(() => this.incr(key)), chain),
      del: (key: string) => (queued.push(() => this.del(key)), chain),
      set: (key: string, value: string, ex: 'EX', seconds: number) => (
        queued.push(() => this.set(key, value, ex, seconds)),
        chain
      ),
      exec: async () => {
        const out: [null, unknown][] = [];
        for (const run of queued) out.push([null, await run()]);
        return out;
      },
    };
    return chain;
  }
}
