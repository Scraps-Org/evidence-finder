import prisma from '~/lib/prisma';
import { csvCell } from '~/lib/csvCell';

export const dynamic = 'force-dynamic';

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
      csvCell(row.id),
      csvCell(row.url),
      csvCell(row.title ?? ''),
      csvCell(row.status),
      csvCell(row.createdAt ? row.createdAt.toISOString() : ''),
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
