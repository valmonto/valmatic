/**
 * The part of a visitor's address that limits count against.
 *
 * An IPv4 address is one visitor's (or one NAT's). An IPv6 address is not:
 * a single connection or server is handed a whole /64 — 2^64 addresses — and
 * can send each request from a new one. Counted per full address, a limit
 * of ten tries was no limit at all (S6). So IPv6 counts per /64, the block
 * one subscriber gets; an IPv4-mapped address counts as the IPv4 it is.
 */
export function clientNetwork(ip: string): string {
  const address = ip.split('%')[0]!.trim().toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (mapped) return mapped[1]!;
  if (!address.includes(':')) return address;

  const [head, tail] = address.split('::') as [string, string | undefined];
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups =
    tail === undefined
      ? left
      : [
          ...left,
          ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'),
          ...right,
        ];
  const prefix = groups
    .slice(0, 4)
    .map((group) => (parseInt(group, 16) || 0).toString(16))
    .join(':');
  return `${prefix}::/64`;
}
