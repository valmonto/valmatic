import { isIP } from 'node:net';
import { checkServerIdentity as defaultCheckServerIdentity } from 'node:tls';

/**
 * TLS options for a Postgres connection verified against a PRIVATE CA.
 *
 * A custom CA cannot be expressed in a connection URL — postgres.js reads
 * `sslmode` from the URL but takes the certificate authority only as a JS
 * option. So `?sslmode=verify-full` against a private CA silently checks the
 * system trust store, which has never heard of it, and fails. This is the one
 * place that gap is closed.
 *
 * Two constraints that pull against each other:
 *
 *  - SNI cannot carry an IP literal. Node THROWS on `servername` set to an IP,
 *    and it throws from inside the driver's socket upgrade — an uncaught
 *    exception that takes the process down, not a rejected promise. A host
 *    that is an IP must therefore not set it at all.
 *  - Identity must still be checked against the host actually dialed.
 *
 * Passing `checkServerIdentity` explicitly satisfies both: the comparison is
 * pinned to `host` — Node matches an IP against the certificate's iPAddress
 * SANs and a name against its dNSNames — whatever SNI ends up carrying.
 */
export interface VerifiedTlsOptions {
  ca: string;
  rejectUnauthorized: true;
  servername?: string;
  checkServerIdentity: (servername: string, cert: never) => Error | undefined;
}

export function buildVerifiedTls(host: string, caCert: string): VerifiedTlsOptions {
  return {
    ca: caCert,
    rejectUnauthorized: true,
    ...(isIP(host) ? {} : { servername: host }),
    checkServerIdentity: (_servername, cert) => defaultCheckServerIdentity(host, cert),
  };
}

/**
 * The host a connection URL points at, for the identity check above. Returns
 * null when the URL cannot be parsed — the caller then leaves TLS alone rather
 * than guessing at a name to verify.
 */
export function hostFromConnectionUrl(url: string): string | null {
  try {
    // A bracketed IPv6 literal arrives as "[::1]"; the brackets are URL syntax.
    const parsed = new URL(url);
    const host = parsed.hostname;
    return host ? host.replace(/^\[|\]$/g, '') : null;
  } catch {
    return null;
  }
}
