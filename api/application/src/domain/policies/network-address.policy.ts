import { isIPv4, isIPv6 } from 'node:net';
import { BLOCKED_IPV4_RANGES, BLOCKED_IPV6_RANGES, IPV4_ADDRESS_BITS, IPV4_MAPPED_IPV6_RANGE, IPV6_ADDRESS_BITS } from '@domain/constants/blocked-address-ranges.constant';
import { ParsedCidr } from '@domain/types/network-address.type';

export class NetworkAddressPolicy {
  private static readonly ipv4Ranges = BLOCKED_IPV4_RANGES.map(cidr => NetworkAddressPolicy.parseCidr(cidr));
  private static readonly ipv6Ranges = BLOCKED_IPV6_RANGES.map(cidr => NetworkAddressPolicy.parseCidr(cidr));
  private static readonly mappedRange = NetworkAddressPolicy.parseCidr(IPV4_MAPPED_IPV6_RANGE);

  static isIp(value: string): boolean {
    const host = NetworkAddressPolicy.unbracket(value);
    return isIPv4(host) || isIPv6(host);
  }

  static isPublic(value: string): boolean {
    const host = NetworkAddressPolicy.unbracket(value);
    if (isIPv4(host)) return NetworkAddressPolicy.isPublicV4(NetworkAddressPolicy.ipv4ToBigInt(host));
    if (!isIPv6(host)) return false;
    const address = NetworkAddressPolicy.ipv6ToBigInt(host);
    if (address === null) return false;
    if (NetworkAddressPolicy.contains(NetworkAddressPolicy.mappedRange, address)) return NetworkAddressPolicy.isPublicV4(address & 0xffffffffn);
    return !NetworkAddressPolicy.ipv6Ranges.some(range => NetworkAddressPolicy.contains(range, address));
  }

  private static isPublicV4(address: bigint): boolean {
    return !NetworkAddressPolicy.ipv4Ranges.some(range => NetworkAddressPolicy.contains(range, address));
  }

  private static contains(range: ParsedCidr, address: bigint): boolean {
    const shift = BigInt(range.bits - range.prefix);
    return address >> shift === range.base >> shift;
  }

  private static parseCidr(cidr: string): ParsedCidr {
    const [address, prefix] = cidr.split('/');
    if (isIPv4(address)) return { bits: IPV4_ADDRESS_BITS, base: NetworkAddressPolicy.ipv4ToBigInt(address), prefix: Number(prefix) };
    return { bits: IPV6_ADDRESS_BITS, base: NetworkAddressPolicy.ipv6ToBigInt(address) ?? 0n, prefix: Number(prefix) };
  }

  private static unbracket(value: string): string {
    const trimmed = value.trim();
    const host = trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
    const zone = host.indexOf('%');
    return zone >= 0 ? host.slice(0, zone) : host;
  }

  private static ipv4ToBigInt(address: string): bigint {
    return address.split('.').reduce((acc, part) => (acc << 8n) | BigInt(Number(part)), 0n);
  }

  private static ipv6ToBigInt(address: string): bigint | null {
    let text = address.toLowerCase();
    const tail: number[] = [];
    const lastColon = text.lastIndexOf(':');
    const maybeV4 = text.slice(lastColon + 1);
    if (maybeV4.includes('.')) {
      if (!isIPv4(maybeV4)) return null;
      const v4 = Number(NetworkAddressPolicy.ipv4ToBigInt(maybeV4));
      tail.push(Math.floor(v4 / 0x10000), v4 % 0x10000);
      const prefix = text.slice(0, lastColon + 1);
      text = prefix.endsWith('::') ? prefix : prefix.slice(0, -1);
    }
    const halves = text.split('::');
    if (halves.length > 2) return null;
    const head = halves[0] ? halves[0].split(':') : [];
    const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    const groups = head.map(g => NetworkAddressPolicy.hextet(g));
    const after = [...rest.map(g => NetworkAddressPolicy.hextet(g)), ...tail];
    const missing = 8 - groups.length - after.length;
    if (halves.length === 1 && missing !== 0) return null;
    if (missing < 0) return null;
    const all: number[] = [...groups, ...new Array<number>(halves.length === 2 ? missing : 0).fill(0), ...after];
    if (all.length !== 8 || all.some(g => Number.isNaN(g) || g < 0 || g > 0xffff)) return null;
    return all.reduce((acc, group) => (acc << 16n) | BigInt(group), 0n);
  }

  private static hextet(group: string): number {
    return /^[0-9a-f]{1,4}$/.test(group) ? parseInt(group, 16) : Number.NaN;
  }
}
