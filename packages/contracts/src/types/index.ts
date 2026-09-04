/**
 * The type-only surface of the contract.
 *
 * `export type *` emits no runtime code, so importing from here costs nothing
 * wherever it is used. Types are inferred from the schemas, which keeps the two
 * from drifting; this entry only republishes them without the Zod runtime.
 */
export type * from '../schemas/index.js';
