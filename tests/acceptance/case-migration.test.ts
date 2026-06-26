import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../prisma/migrations');

const migrationDirs = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => fs.statSync(path.join(MIGRATIONS_DIR, name)).isDirectory())
    .sort();

describe('prisma/migrations', () => {
  it('directory exists and contains at least one migration', () => {
    expect(fs.existsSync(MIGRATIONS_DIR)).toBe(true);
    expect(migrationDirs().length).toBeGreaterThanOrEqual(1);
  });

  it('a migration SQL creates the Case table with an identifyingTerms text column', () => {
    const sqls = migrationDirs().map((dir) =>
      fs.readFileSync(path.join(MIGRATIONS_DIR, dir, 'migration.sql'), 'utf-8').toLowerCase(),
    );
    const caseSql = sqls.find((sql) => /create\s+table/.test(sql) && /"case"|\bcase\b/.test(sql));
    expect(caseSql).toBeTruthy();
    expect(caseSql).toMatch(/"identifyingterms"|identifyingterms/);
    expect(caseSql).toMatch(/text|varchar/);
  });
});
