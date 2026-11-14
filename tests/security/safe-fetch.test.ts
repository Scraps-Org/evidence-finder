// @vitest-environment node
import dns from 'node:dns';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_BYTES,
  UnsafeUrlError,
  assertAllowedUrl,
  defaultHop,
  fetchPublicText,
  isPublicAddress,
  readCapped,
  type Hop,
} from '../../src/lib/safeFetch';

const prismaCreate = vi.fn();
vi.mock('../../src/lib/prisma', () => ({
  default: { evidence: { create: prismaCreate }, candidate: { findMany: vi.fn() } },
}));

// Make every hostname resolve to the given addresses (no real DNS, no network).
function resolveTo(...addresses: string[]) {
  return vi.spyOn(dns, 'lookup').mockImplementation(((
    _host: string,
    _opts: unknown,
    cb: (err: null, a: dns.LookupAddress[]) => void,
  ) => {
    cb(
      null,
      addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
    );
  }) as never);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isPublicAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '100.100.100.200',
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fe80::1',
    'fc00::1',
    'fd00:ec2::254',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '64:ff9b::7f00:1',
    '2002:7f00:1::',
    'not-an-ip',
  ])('rejects %s', (addr) => {
    expect(isPublicAddress(addr)).toBe(false);
  });

  it.each(['93.184.216.34', '8.8.8.8', '2606:4700::1111'])('allows %s', (addr) => {
    expect(isPublicAddress(addr)).toBe(true);
  });
});

describe('assertAllowedUrl', () => {
  it.each([
    'file:///etc/passwd',
    'ftp://example.com/',
    'gopher://example.com/',
    'javascript:alert(1)',
    'not a url',
    'http://127.0.0.1/',
    'http://2130706433/',
    'http://0x7f.0.0.1/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://169.254.169.254/latest/meta-data/',
    'http://100.100.100.200/',
  ])('rejects %s', (raw) => {
    expect(() => assertAllowedUrl(raw)).toThrow(UnsafeUrlError);
  });

  it('accepts public http and https urls', () => {
    expect(assertAllowedUrl('https://example.com/a').hostname).toBe('example.com');
    expect(assertAllowedUrl('http://93.184.216.34/').hostname).toBe('93.184.216.34');
  });
});

describe('fetchPublicText — hostnames that resolve to internal addresses', () => {
  it.each([
    ['10.0.0.5'],
    ['169.254.169.254'],
    ['100.64.1.1'],
    ['::1'],
    ['93.184.216.34', '10.0.0.5'],
  ])('rejects a hostname resolving to %s before connecting', async (...addresses) => {
    resolveTo(...addresses);
    await expect(fetchPublicText('http://innocent.example/')).rejects.toBeInstanceOf(
      UnsafeUrlError,
    );
  });

  it('rejects localhost even though a server is listening there', async () => {
    let hits = 0;
    const server = http.createServer((_req, res) => {
      hits++;
      res.end('<title>internal</title>');
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const { port } = server.address() as AddressInfo;
    try {
      await expect(fetchPublicText(`http://localhost:${port}/`)).rejects.toBeInstanceOf(
        UnsafeUrlError,
      );
      expect(hits).toBe(0);
    } finally {
      await new Promise((r) => server.close(r));
    }
  });
});

describe('fetchPublicText — redirects are re-validated on every hop', () => {
  function redirectThen(location: string): Hop {
    let first = true;
    return (url, signal) => {
      if (first) {
        first = false;
        return Promise.resolve({ location, body: '' });
      }
      return defaultHop(url, signal);
    };
  }

  it('rejects a redirect to the metadata address', async () => {
    await expect(
      fetchPublicText('https://public.example/', redirectThen('http://169.254.169.254/latest/')),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it('rejects a redirect to a hostname that resolves internally', async () => {
    resolveTo('192.168.0.10');
    await expect(
      fetchPublicText('https://public.example/', redirectThen('http://router.example/admin')),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it('rejects a redirect to a non-http scheme', async () => {
    await expect(
      fetchPublicText('https://public.example/', redirectThen('file:///etc/passwd')),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it('stops after too many redirects', async () => {
    const loop: Hop = () => Promise.resolve({ location: '/again', body: '' });
    await expect(fetchPublicText('https://public.example/', loop)).rejects.toThrow(
      /too many redirects/,
    );
  });

  it('follows a relative redirect on a public host and returns the body', async () => {
    const seen: string[] = [];
    const hop: Hop = (url) => {
      seen.push(url.toString());
      return Promise.resolve(
        seen.length === 1 ? { location: '/final', body: '' } : { body: '<title>ok</title>' },
      );
    };
    await expect(fetchPublicText('https://public.example/start', hop)).resolves.toBe(
      '<title>ok</title>',
    );
    expect(seen).toEqual(['https://public.example/start', 'https://public.example/final']);
  });
});

describe('readCapped', () => {
  it('stops reading at the size cap', async () => {
    const chunk = Buffer.alloc(600_000, 'a');
    const body = await readCapped(Readable.from([chunk, chunk, chunk]), MAX_BYTES);
    expect(body.length).toBe(MAX_BYTES);
  });
});

describe('POST /api/evidence', () => {
  it('returns 400 and stores nothing for an internal destination', async () => {
    const { POST } = await import('../../src/app/api/evidence/route');
    prismaCreate.mockReset();
    const res = await POST(
      new Request('http://localhost/api/evidence', {
        method: 'POST',
        body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/', caseId: 'c1' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(prismaCreate).not.toHaveBeenCalled();
  });
});
