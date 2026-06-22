import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('Case migration', () => {
  it('should have exactly one migration file creating the Case table', () => {
    const migrationsPath = join(process.cwd(), 'prisma', 'migrations');
    const files = readFileSync(migrationsPath + '/migration_lock.toml', 'utf-8');
    expect(files).toContain('provider = "postgresql"');

    const migrationFile = readFileSync(join(migrationsPath, '0001_init', 'migration.sql'), 'utf-8');
    expect(migrationFile).toContain('CREATE TABLE "Case"');
    expect(migrationFile).toContain('identifyingTerms');
  });
});