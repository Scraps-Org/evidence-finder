import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Prisma migration — Case table', () => {
  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');

  it('prisma/migrations/ exists and contains exactly one migration directory', () => {
    expect(existsSync(migrationsDir)).toBe(true);

    const entries = readdirSync(migrationsDir, { withFileTypes: true });
    const migrationDirs = entries.filter(
      (e) => e.isDirectory() && e.name !== 'migration_lock.toml'
    );

    expect(migrationDirs).toHaveLength(1);
  });

  it('the single migration SQL issues a CREATE TABLE for Case with an identifyingTerms column', () => {
    const entries = readdirSync(migrationsDir, { withFileTypes: true });
    const migrationDirs = entries.filter(
      (e) => e.isDirectory() && e.name !== 'migration_lock.toml'
    );

    const sqlPath = join(migrationsDir, migrationDirs[0]!.name, 'migration.sql');
    expect(existsSync(sqlPath)).toBe(true);

    const sql = readFileSync(sqlPath, 'utf-8').toLowerCase();

    expect(sql).toMatch(/create table/i);
    // Must reference the Case table (case-insensitive, quoted or bare)
    expect(sql).toMatch(/["'`]?case["'`]?/i);
    // Must include the identifyingTerms column (snake_case in SQL is also acceptable)
    expect(sql).toMatch(/identifying_terms|identifyingterms/i);
  });

  it('no ad-hoc SQL files outside prisma/migrations/ create the Case table', () => {
    const cwd = process.cwd();
    const suspectDirs = ['scripts', 'sql', 'db', 'database', 'migrations'];

    for (const dir of suspectDirs) {
      const dirPath = join(cwd, dir);
      if (!existsSync(dirPath)) continue;

      const files = readdirSync(dirPath).filter((f) => f.endsWith('.sql'));
      for (const file of files) {
        const content = readFileSync(join(dirPath, file), 'utf-8').toLowerCase();
        expect(
          content,
          `Ad-hoc SQL file ${dir}/${file} must not CREATE TABLE Case outside prisma/migrations/`
        ).not.toMatch(/create table.*["'`]?case["'`]?/i);
      }
    }
  });
});
