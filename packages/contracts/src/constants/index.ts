/**
 * Runtime constants shared with the browser and the mobile app.
 *
 * Deliberately free of Zod: anything the frontend imports at runtime must not
 * live in a `*.schema.ts`, or importing one regex drags the whole schema graph —
 * and Zod — into the bundle. One file per domain, mirroring `schemas/`.
 */
export * from './iam';
export * from './analytics';
