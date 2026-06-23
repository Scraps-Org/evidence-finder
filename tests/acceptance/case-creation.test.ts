import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const createRequest = (body: Record<string, string>) => {
  return new Request('http://localhost:3000/api/cases', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
};

describe('Case Creation API Route', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('inserts a case with identifying terms into the database', async () => {
    const terms = `test-case-${Date.now()}`;
    const res = await POST(createRequest({ identifyingTerms: terms }));

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };

    const savedCase = await prisma.case.findUnique({
      where: { id: body.id },
    });

    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(terms);
  });

  it('rejects empty identifying terms and writes no row', async () => {
    const res = await POST(createRequest({ identifyingTerms: '' }));

    expect(res.status).toBe(400);
    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('rejects whitespace-only identifying terms and writes no row', async () => {
    const res = await POST(createRequest({ identifyingTerms: '   \t\n  ' }));

    expect(res.status).toBe(400);
    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});

describe('Case Migration', () => {
  it('has exactly one migration file that creates the Case table with identifyingTerms column', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const files = fs.readdirSync(migrationsDir);

    const migrationDirs = files.filter((f) => {
      const fullPath = path.join(migrationsDir, f);
      return (
        fs.statSync(fullPath).isDirectory() &&
        fs.existsSync(path.join(fullPath, 'migration.sql'))
      );
    });

    expect(migrationDirs).toHaveLength(1);

    const migrationPath = path.join(
      migrationsDir,
      migrationDirs[0]!,
      'migration.sql'
    );
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

    expect(migrationContent).toMatch(/CREATE TABLE.*"Case"/i);
    expect(migrationContent).toMatch(/identifyingTerms.*TEXT/i);
  });
});
