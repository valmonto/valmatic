/**
 * The frontend-safe surface of the contract, imported by web and mobile.
 *
 * Everything here is either erased at compile time (types) or free of Zod, so
 * importing it never pulls the schema graph into a client bundle. The root entry
 * (`@pkg/contracts`) re-exports every schema and is server-side.
 *
 * Web and mobile alias `@pkg/contracts` to this module, so reaching for a schema
 * by accident fails to build rather than quietly adding Zod to the bundle. A
 * client that genuinely needs to validate imports `@pkg/contracts/schemas`
 * explicitly — visible in review, rather than by accident.
 */
export type * from '../types';
export * from '../constants';
export * from '../permissions';
