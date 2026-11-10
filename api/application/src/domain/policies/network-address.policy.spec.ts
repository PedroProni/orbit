import { NetworkAddressPolicy } from '@domain/policies/network-address.policy';

describe('NetworkAddressPolicy', () => {
  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.0.2.10',
    '192.168.1.1',
    '198.18.0.1',
    '198.51.100.7',
    '203.0.113.9',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '[::1]',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:169.254.169.254',
    '::127.0.0.1',
    '64:ff9b::808:808',
    '100::1',
    '2001:db8::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'fe80::1%eth0',
    'ff02::1',
  ])('refuses the non-public address %s', address => {
    expect(NetworkAddressPolicy.isPublic(address)).toBe(false);
  });

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8', '2001:4860:4860::8888'])('accepts the public address %s', address => {
    expect(NetworkAddressPolicy.isPublic(address)).toBe(true);
  });

  it('treats anything that is not an IP literal as not public and recognises literals', () => {
    expect(NetworkAddressPolicy.isPublic('example.com')).toBe(false);
    expect(NetworkAddressPolicy.isPublic('1:2:3')).toBe(false);
    expect(NetworkAddressPolicy.isIp('[2001:db8::1]')).toBe(true);
    expect(NetworkAddressPolicy.isIp('example.com')).toBe(false);
  });
});
