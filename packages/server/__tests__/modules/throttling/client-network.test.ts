import { describe, expect, it } from 'vitest';
import { clientNetwork } from '../../../src/modules/throttling/client-network.js';
import { throttlerTracker } from '../../../src/modules/throttling/throttler.guard.js';

/** S6: an IPv6 visitor counts per /64, the block one machine can send from. */
describe('clientNetwork', () => {
  it('keeps an IPv4 address as it is, and reads an IPv4-mapped one as IPv4', () => {
    expect(clientNetwork('203.0.113.7')).toBe('203.0.113.7');
    expect(clientNetwork('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('puts every address of one IPv6 /64 in one bucket', () => {
    const one = clientNetwork('2001:db8:aa:bb:1:2:3:4');
    expect(one).toBe('2001:db8:aa:bb::/64');
    expect(clientNetwork('2001:db8:aa:bb:ffff:ffff:ffff:ffff')).toBe(one);
    expect(clientNetwork('2001:0DB8:00aa:00bb::9')).toBe(one);
    expect(clientNetwork('2001:db8:aa:bc::1')).not.toBe(one);
  });

  it('reads the shortened forms', () => {
    expect(clientNetwork('::1')).toBe('0:0:0:0::/64');
    expect(clientNetwork('2001:db8::')).toBe('2001:db8:0:0::/64');
    expect(clientNetwork('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
  });

  it('is what the throttle counts by when nobody is signed in', () => {
    expect(throttlerTracker({ ip: '2001:db8:aa:bb::1' })).toBe(
      throttlerTracker({ ip: '2001:db8:aa:bb::2' }),
    );
  });
});
