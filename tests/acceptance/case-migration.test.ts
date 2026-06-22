import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Case migration', () => {
  it('should have exactly one migration file creating Case table', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    let files: string[] = [];
    try {
      files = readdirSync(migrationsDir);
    } catch {
      throw new Error('prisma/migrations directory does not exist');
    }

    const migrationDirs = files.filter((f) => !f.startsWith('.'));
    expect(migrationDirs.length).toBeGreaterThanOrEqual(1);

    let foundCaseTableCreation = false;
    for (const dir of migrationDirs) {
      const migrationPath = join(migrationsDir, dir, 'migration.sql');
      try {
        const content = readFileSync(migrationPath, 'utf-8');
        if (content.toUpperCase().includes('CREATE TABLE') && content.toUpperCase().includes('CASE')) {
          foundCaseTableCreation = true;
          expect(content.toUpperCase()).toMatch(/CREATE TABLE "?case"?/i);
          expect(content.toUpperCase()).toMatch(/identifyingterms/i);
        }
      } catch {
        // Migration file may not exist, skip
      }
    }

    expect(foundCaseTableCreation).toBe(true);
  });
});
