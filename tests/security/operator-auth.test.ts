// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { config, middleware } from '../../src/middleware';

const SECRET = 'test-operator-secret-value';

function basic(user: string, password: string): string {
  const bytes = new TextEncoder().encode(`${user}:${password}`);
  return 'Basic ' + btoa(String.fromCharCode(...bytes));
}

function req(path: string, authorization?: string): NextRequest {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers });
}

function matched(path: string): boolean {
  return config.matcher.some((m) => new RegExp(`^${m}$`).test(path));
}

describe('operator auth middleware', () => {
  beforeEach(() => {
    vi.stubEnv('EVIDENCE_FINDER_OPERATOR_SECRET', SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['/api/cases', '/api/evidence', '/api/cases/c1/export', '/', '/cases/c1'])(
    'rejects %s without credentials with 401 and a Basic challenge',
    async (path) => {
      const res = await middleware(req(path));
      expect(res.status).toBe(401);
      expect(res.headers.get('www-authenticate')).toMatch(/^Basic /);
    },
  );

  it('rejects a wrong secret', async () => {
    const res = await middleware(req('/api/cases', basic('operator', 'wrong')));
    expect(res.status).toBe(401);
  });

  it('rejects a secret that only shares a prefix', async () => {
    const res = await middleware(req('/api/cases', basic('operator', SECRET.slice(0, -1))));
    expect(res.status).toBe(401);
  });

  it('rejects malformed Authorization headers', async () => {
    for (const h of ['Basic !!!', 'Basic ' + btoa('no-colon'), `Bearer ${SECRET}`, SECRET]) {
      const res = await middleware(req('/api/cases', h));
      expect(res.status, h).toBe(401);
    }
  });

  it('passes the request through with the right secret (any username)', async () => {
    for (const user of ['operator', '']) {
      const res = await middleware(req('/api/cases', basic(user, SECRET)));
      expect(res.status).toBe(200);
      expect(res.headers.get('x-middleware-next')).toBe('1');
    }
  });

  it('accepts a non-ASCII secret encoded as UTF-8', async () => {
    vi.stubEnv('EVIDENCE_FINDER_OPERATOR_SECRET', '증거-비밀');
    const res = await middleware(req('/api/cases', basic('operator', '증거-비밀')));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('fails closed with 503 when the secret is not configured', async () => {
    for (const value of [undefined, '']) {
      vi.stubEnv('EVIDENCE_FINDER_OPERATOR_SECRET', value as unknown as string);
      const res = await middleware(req('/api/cases', basic('operator', '')));
      expect(res.status).toBe(503);
    }
  });

  it('covers every API route and page, but not static build assets', () => {
    for (const path of [
      '/',
      '/cases/abc',
      '/api/cases',
      '/api/cases/abc/candidates',
      '/api/cases/abc/export',
      '/api/cases/abc/search',
      '/api/candidates/abc',
      '/api/evidence',
    ]) {
      expect(matched(path), path).toBe(true);
    }
    for (const path of ['/_next/static/chunks/x.js', '/_next/image', '/favicon.svg']) {
      expect(matched(path), path).toBe(false);
    }
  });
});
