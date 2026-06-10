/**
 * A seeder populates the database with a coherent set of data.
 *
 * Seeders must be **idempotent**: running them repeatedly against the same
 * database must converge to the same state without throwing or duplicating
 * rows. In practice this means every write is an upsert.
 */
export interface Seeder {
  /** Human-readable name, used in logs. */
  readonly name: string;
  /** Run the seeder. Must be idempotent. */
  run(): Promise<void>;
}
