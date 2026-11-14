import { NextResponse, type NextRequest } from 'next/server';

// Every page and every /api/* route requires the shared operator secret, sent as the
// password of HTTP Basic auth (the username is ignored). Browsers prompt for it once and
// then attach it to same-origin fetches automatically, so the UI needs no changes.
// Fails closed: without EVIDENCE_FINDER_OPERATOR_SECRET nothing is served.

const CHALLENGE = 'Basic realm="evidence-finder", charset="UTF-8"';

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

// Constant-time: compare fixed-length digests so neither length nor a shared prefix leaks.
async function secretMatches(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

function basicPassword(header: string | null): string | null {
  if (!header?.startsWith('Basic ')) return null;
  let decoded: string;
  try {
    const binary = atob(header.slice('Basic '.length).trim());
    decoded = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
  const colon = decoded.indexOf(':');
  return colon === -1 ? null : decoded.slice(colon + 1);
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.EVIDENCE_FINDER_OPERATOR_SECRET;
  if (!expected) {
    return new NextResponse('Service not configured', { status: 503 });
  }

  const given = basicPassword(req.headers.get('authorization'));
  if (given !== null && (await secretMatches(given, expected))) {
    return NextResponse.next();
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': CHALLENGE },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg).*)'],
};
