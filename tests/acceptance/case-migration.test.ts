import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Prisma migration: Case table', () => {
  it('has exactly one migration directory under prisma/migrations/', () => {
    const migrationsDir = path.resolve('prisma/migrations');
    const entries = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());
    expect(entries).toHaveLength(1);
  });

  it('the single migration SQL creates the Case table with an identifyingTerms text column', () => {
    const migrationsDir = path.resolve('prisma/migrations');
    const dirs = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());
    expect(dirs.length).toBeGreaterThanOrEqual(1);
    const sqlPath = path.join(migrationsDir, dirs[0]!.name, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    expect(sql).toMatch(/CREATE TABLE/i);
    expect(sql).toMatch(/"Case"|`Case`|Case/i);
    expect(sql).toMatch(/"identifyingTerms"|`identifyingTerms`|identifyingTerms/i);
  });
});
