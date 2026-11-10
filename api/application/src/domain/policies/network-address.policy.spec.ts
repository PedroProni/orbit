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

  it.each([
    ['2002:a00:1::', '10.0.0.1'],
    ['2002:c0a8:101::1', '192.168.1.1'],
    ['2002:7f00:1::', '127.0.0.1'],
    ['2002:a9fe:a9fe::', '169.254.169.254'],
    ['2002:ac10:1:0:0:0:0:1', '172.16.0.1'],
    ['[2002:a9fe:a9fe::1]', '169.254.169.254'],
  ])('refuses the 6to4 address %s that carries the private IPv4 %s', address => {
    expect(NetworkAddressPolicy.isPublic(address)).toBe(false);
  });

  it.each([
    ['2001:0:7f00:1::', 'server 127.0.0.1'],
    ['2001:0:a00:1:8000:0:f5ff:fffe', 'server 10.0.0.1, client 10.0.0.1'],
    ['2001:0:4136:e378:8000:63bf:3f57:fefe', 'client 192.168.1.1'],
    ['2001:0:a9fe:a9fe::', 'server 169.254.169.254'],
    ['2001::1', 'Teredo prefix'],
  ])('refuses the Teredo address %s (%s)', address => {
    expect(NetworkAddressPolicy.isPublic(address)).toBe(false);
  });

  it.each(['2002::', '2002:808:808::1', '2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '2001:0:808:808::'])('refuses every address under 6to4 and Teredo, even with a public IPv4 inside: %s', address => {
    expect(NetworkAddressPolicy.isPublic(address)).toBe(false);
  });

  it.each(['2001:1::1', '2003::1', '2001:4860:4860::8888', '2001:200::1'])('keeps the neighbours of the 6to4 and Teredo ranges public: %s', address => {
    expect(NetworkAddressPolicy.isPublic(address)).toBe(true);
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
