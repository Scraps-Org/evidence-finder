import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('Case Table Migration', () => {
  it('has exactly one migration file creating the Case table', async () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    let entries: string[] = [];
    try {
      entries = await fs.readdir(migrationsDir);
    } catch {
      throw new Error(`prisma/migrations directory not found at ${migrationsDir}`);
    }

    const migrationDirs = entries.filter((e) => !e.startsWith('.'));
    expect(migrationDirs.length).toBe(1);

    const migrationDir = migrationDirs[0]!;
    const migrationFile = join(migrationsDir, migrationDir, 'migration.sql');
    const content = await fs.readFile(migrationFile, 'utf-8');
    expect(content).toMatch(/CREATE TABLE.*["\`]Case["\`]/i);
    expect(content).toMatch(/identifyingTerms/i);
  });
});
