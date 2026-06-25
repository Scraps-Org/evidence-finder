import prisma from '~/lib/prisma';

export const dynamic = 'force-dynamic';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;

  let rows: Array<{
    url: string;
    detectedAt: Date;
    pageTitle: string;
    domain: string;
  }> = [];

  try {
    rows = await prisma.evidence.findMany({
      where: { caseId },
      orderBy: { detectedAt: 'asc' },
    });
  } catch {
    rows = [];
  }

  const header = 'url,detectedAt,pageTitle,domain';
  const lines = rows.map((row) =>
    [
      csvEscape(row.url),
      csvEscape(row.detectedAt.toISOString()),
      csvEscape(row.pageTitle),
      csvEscape(row.domain),
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
