import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Prisma Case migration', () => {
  it('has exactly one migration directory under prisma/migrations/', () => {
    const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');
    const entries = fs.readdirSync(migrationsDir).filter(
      (e) => fs.statSync(path.join(migrationsDir, e)).isDirectory()
    );
    expect(entries).toHaveLength(1);
  });

  it('the single migration SQL creates the Case table with identifyingTerms column', () => {
    const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');
    const dirs = fs.readdirSync(migrationsDir).filter(
      (e) => fs.statSync(path.join(migrationsDir, e)).isDirectory()
    );
    const sqlPath = path.join(migrationsDir, dirs[0]!, 'migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8').toLowerCase();
    expect(sql).toMatch(/create table/i);
    expect(sql).toMatch(/\bcase\b/i);
    expect(sql).toMatch(/identifyingterms/i);
  });

  it('the Prisma schema defines a Case model with identifyingTerms', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    expect(schema).toMatch(/model\s+Case/i);
    expect(schema).toMatch(/identifyingTerms/);
  });
});
