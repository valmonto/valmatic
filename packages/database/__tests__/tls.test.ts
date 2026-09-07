import { describe, expect, it } from 'vitest';
import { buildVerifiedTls, hostFromConnectionUrl } from '../src/tls.js';

const CA = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';

describe('buildVerifiedTls', () => {
  /**
   * Node throws on `servername` set to an IP, and it throws from inside the
   * driver's socket upgrade — an uncaught exception that kills the process
   * rather than a rejected promise anything could catch. So this is not a
   * preference; a regression here takes an app down on boot.
   */
  it('never sets servername for an IP host', () => {
    expect(buildVerifiedTls('198.244.200.168', CA)).not.toHaveProperty('servername');
  });

  it('sets servername for a DNS host, where SNI is meaningful', () => {
    expect(buildVerifiedTls('db.example.com', CA).servername).toBe('db.example.com');
  });

  it('pins identity checking to the host dialed either way', () => {
    for (const host of ['198.244.200.168', 'db.example.com']) {
      const tls = buildVerifiedTls(host, CA);
      expect(tls.rejectUnauthorized).toBe(true);
      expect(typeof tls.checkServerIdentity).toBe('function');
    }
  });
});

describe('hostFromConnectionUrl', () => {
  it.each([
    ['postgresql://u:p@198.244.200.168:35427/db', '198.244.200.168'],
    ['postgresql://u:p@db.example.com:5432/db?sslmode=verify-full', 'db.example.com'],
    ['postgres://u:p@localhost/db', 'localhost'],
  ])('reads the host from %s', (url, expected) => {
    expect(hostFromConnectionUrl(url)).toBe(expected);
  });

  it('unwraps an IPv6 literal, whose brackets are URL syntax not hostname', () => {
    expect(hostFromConnectionUrl('postgresql://u:p@[::1]:5432/db')).toBe('::1');
  });

  /**
   * Null means the caller leaves TLS alone rather than guessing a name to
   * verify against — a wrong name would fail confusingly, blaming the server.
   */
  it('returns null rather than guessing when the URL will not parse', () => {
    expect(hostFromConnectionUrl('not a url')).toBeNull();
  });
});
