import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import type { Readable } from 'node:stream';

// Server-side fetch of a caller-supplied URL, restricted to public destinations.
// The destination check runs inside the socket's DNS lookup, so the address that is
// checked is the address that is connected to (no DNS-rebinding window), and it runs
// again for every redirect hop.

export class UnsafeUrlError extends Error {}

export const MAX_REDIRECTS = 5;
export const MAX_BYTES = 1_000_000;
export const TIMEOUT_MS = 10_000;

const blockedV4 = new net.BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // CGNAT (also some cloud metadata, e.g. 100.100.100.200)
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata 169.254.169.254
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // 6to4 relay anycast
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
] as const) {
  blockedV4.addSubnet(network, prefix, 'ipv4');
}

// IPv6: only global unicast (2000::/3) is allowed. That excludes loopback, unspecified,
// IPv4-mapped/-compatible, NAT64, unique-local (incl. fd00:ec2::254) and link-local.
const globalV6 = new net.BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
const blockedV6 = new net.BlockList();
for (const [network, prefix] of [
  ['2001::', 32], // Teredo (embeds an IPv4 address)
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4 (embeds an IPv4 address)
  ['3fff::', 20], // documentation
] as const) {
  blockedV6.addSubnet(network, prefix, 'ipv6');
}

export function isPublicAddress(address: string): boolean {
  try {
    const family = net.isIP(address);
    if (family === 4) return !blockedV4.check(address, 'ipv4');
    if (family === 6) return globalV6.check(address, 'ipv6') && !blockedV6.check(address, 'ipv6');
  } catch {
    // unparsable (e.g. zone id) → not public
  }
  return false;
}

export function assertAllowedUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('invalid url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('scheme not allowed');
  }
  // IP literals never reach the DNS lookup hook, so check them here.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) !== 0 && !isPublicAddress(host)) {
    throw new UnsafeUrlError('destination not allowed');
  }
  return url;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number,
) => void;

export function guardedLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: LookupCallback,
): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '');
    const first = addresses[0];
    if (!first || addresses.some((a) => !isPublicAddress(a.address))) {
      return callback(new UnsafeUrlError('destination not allowed'), '');
    }
    if (options.all) return callback(null, addresses);
    return callback(null, first.address, first.family);
  });
}

export function readCapped(stream: Readable, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(Buffer.concat(chunks).subarray(0, max).toString('utf8'));
    };
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= max) {
        finish();
        stream.destroy();
      }
    });
    stream.on('end', finish);
    stream.on('error', (e) => {
      if (done) return;
      done = true;
      reject(e);
    });
  });
}

export type HopResult = { location?: string; body: string };
export type Hop = (url: URL, signal: AbortSignal) => Promise<HopResult>;

export const defaultHop: Hop = (url, signal) =>
  new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      url,
      { method: 'GET', lookup: guardedLookup as never, signal },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        if (status >= 300 && status < 400 && location) {
          res.destroy();
          resolve({ location, body: '' });
          return;
        }
        readCapped(res, MAX_BYTES).then((body) => resolve({ body }), reject);
      },
    );
    req.on('error', reject);
    req.end();
  });

export async function fetchPublicText(raw: string, hop: Hop = defaultHop): Promise<string> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url = assertAllowedUrl(raw);
  for (let redirects = 0; ; redirects++) {
    const res = await hop(url, signal);
    if (res.location === undefined) return res.body;
    if (redirects >= MAX_REDIRECTS) throw new UnsafeUrlError('too many redirects');
    let next: string;
    try {
      next = new URL(res.location, url).toString();
    } catch {
      throw new UnsafeUrlError('invalid redirect');
    }
    url = assertAllowedUrl(next);
  }
}
