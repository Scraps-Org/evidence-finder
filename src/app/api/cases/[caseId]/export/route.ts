import prisma from '~/lib/prisma';

export const dynamic = 'force-dynamic';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  let rows: Array<{
    id: string;
    url: string;
    title: string | null;
    status: string;
    createdAt: Date;
  }> = [];

  try {
    rows = await prisma.candidate.findMany({
      where: { caseId, status: 'evidence' },
      orderBy: { createdAt: 'asc' },
    });
  } catch {
    rows = [];
  }

  const header = 'id,url,title,status,createdAt';
  const lines = rows.map((row) =>
    [
      csvEscape(row.id),
      csvEscape(row.url),
      csvEscape(row.title ?? ''),
      csvEscape(row.status),
      csvEscape(row.createdAt ? row.createdAt.toISOString() : ''),
    ].join(','),
  );
  const csv = [header, ...lines].join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="case-${caseId}-evidence.csv"`,
    },
  });
}
