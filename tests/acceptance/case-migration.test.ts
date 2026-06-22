import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Case table migration', () => {
  it('has exactly one migration file with CREATE TABLE Case', async () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    const entries = await readdir(migrationsDir, { withFileTypes: true });

    const migrationDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    expect(migrationDirs.length).toBe(1);

    const migrationFile = join(migrationsDir, migrationDirs[0]!, 'migration.sql');
    const content = await readFile(migrationFile, 'utf-8');

    expect(content).toMatch(/CREATE\s+TABLE\s+"Case"/i);
    expect(content).toMatch(/identifyingTerms\s+TEXT/i);
  });
});
