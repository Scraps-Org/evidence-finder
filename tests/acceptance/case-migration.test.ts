import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

describe('Database Migration - Case Table', () => {
  it('has exactly one migration file creating Case table', async () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    
    const dirs = await readdir(migrationsDir, { withFileTypes: true });
    const migrationDirs = dirs.filter((d) => d.isDirectory());

    expect(migrationDirs.length).toBe(1);
    
    const migrationName = migrationDirs[0]!.name;
    const migrationFile = join(migrationsDir, migrationName, 'migration.sql');
    const content = await readFile(migrationFile, 'utf8');

    expect(content).toMatch(/CREATE\s+TABLE\s+"Case"/i);
    expect(content).toMatch(/identifyingTerms/i);
  });

  it('migration file includes identifyingTerms column', async () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    const dirs = await readdir(migrationsDir, { withFileTypes: true });
    const migrationDirs = dirs.filter((d) => d.isDirectory());
    const migrationName = migrationDirs[0]!.name;
    const migrationFile = join(migrationsDir, migrationName, 'migration.sql');
    const content = await readFile(migrationFile, 'utf8');

    expect(content.toUpperCase()).toContain('IDENTIFYINGTERMS');
  });
});
