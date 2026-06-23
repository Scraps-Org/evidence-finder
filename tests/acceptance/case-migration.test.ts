import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('prisma/migrations/ — migration structure', () => {
  const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');

  it('contains exactly one migration directory', () => {
    expect(fs.existsSync(migrationsDir), 'prisma/migrations/ directory must exist').toBe(true);

    const entries = fs.readdirSync(migrationsDir).filter((entry) => {
      const fullPath = path.join(migrationsDir, entry);
      return fs.statSync(fullPath).isDirectory();
    });

    expect(
      entries.length,
      `Expected exactly 1 migration directory, found: ${entries.join(', ')}`
    ).toBe(1);
  });

  it('the migration SQL creates the Case table with an identifyingTerms column', () => {
    const entries = fs.readdirSync(migrationsDir).filter((entry) => {
      const fullPath = path.join(migrationsDir, entry);
      return fs.statSync(fullPath).isDirectory();
    });

    const migrationDir = entries[0]!;
    const sqlPath = path.join(migrationsDir, migrationDir, 'migration.sql');
    expect(fs.existsSync(sqlPath), `migration.sql not found in ${migrationDir}`).toBe(true);

    const sql = fs.readFileSync(sqlPath, 'utf-8').toLowerCase();
    expect(sql, 'migration SQL must contain CREATE TABLE').toMatch(/create\s+table/);
    expect(sql, 'migration SQL must reference a Case table').toMatch(/\bcase\b|"case"/i);
    expect(
      sql,
      'migration SQL must include identifyingterms column'
    ).toMatch(/identifyingterms/);
  });
});
