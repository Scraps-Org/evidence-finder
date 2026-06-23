import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Prisma migrations — Case table', () => {
  it('has exactly one migration directory under prisma/migrations/ that creates the Case table', () => {
    const migrationsDir = path.resolve(process.cwd(), 'prisma', 'migrations');

    expect(
      fs.existsSync(migrationsDir),
      'prisma/migrations/ directory must exist'
    ).toBe(true);

    const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
    const migrationDirs = entries.filter(
      (e) => e.isDirectory() && e.name !== 'migration_lock.toml'
    );

    expect(
      migrationDirs.length,
      `Expected exactly 1 migration directory, found ${migrationDirs.length}: ${migrationDirs.map((d) => d.name).join(', ')}`
    ).toBe(1);

    const sqlPath = path.join(migrationsDir, migrationDirs[0]!.name, 'migration.sql');
    expect(
      fs.existsSync(sqlPath),
      `migration.sql not found at ${sqlPath}`
    ).toBe(true);

    const sql = fs.readFileSync(sqlPath, 'utf8').toLowerCase();
    expect(
      sql,
      'migration.sql must contain a CREATE TABLE statement for the Case table'
    ).toMatch(/create table/i);

    expect(
      sql,
      'migration.sql must define an identifyingTerms column (snake_case or camelCase)'
    ).toMatch(/identifying_terms|identifyingterms/i);
  });
});
