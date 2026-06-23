import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Case migration', () => {
  it('has exactly one migration directory under prisma/migrations/ that creates the Case table with identifyingTerms', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    expect(existsSync(migrationsDir), 'prisma/migrations/ directory must exist').toBe(true);

    const entries = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    expect(entries.length).toBe(1);

    const migrationSql = join(migrationsDir, entries[0]!, 'migration.sql');
    expect(existsSync(migrationSql), `migration.sql must exist in ${entries[0]}`).toBe(true);

    const sql = readFileSync(migrationSql, 'utf-8');
    expect(sql.toLowerCase()).toMatch(/create table/i);
    expect(sql.toLowerCase()).toMatch(/"case"|`case`|case/i);
    expect(sql.toLowerCase()).toMatch(/identifyingterms|identifying_terms/i);
  });
});
