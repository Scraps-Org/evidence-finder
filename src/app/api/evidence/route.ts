import prisma from '~/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  
  if (!body || typeof body.url !== 'string' || !body.url.trim() || typeof body.caseId !== 'string' || !body.caseId.trim()) {
    return new Response(JSON.stringify({ error: 'url and caseId required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }
  
  const { url, caseId } = body;
  
  const r = await fetch(url);
  const html = await r.text();
  
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = m?.[1]?.trim() ?? '';
  
  const domain = new URL(url).hostname;
  const detectedAt = new Date();
  
  const created = await prisma.evidence.create({
    data: {
      url,
      detectedAt,
      pageTitle,
      domain,
      caseId
    }
  });
  
  return new Response(JSON.stringify(created), {
    status: 201,
    headers: { 'content-type': 'application/json' }
  });
}
