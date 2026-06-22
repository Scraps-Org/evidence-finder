import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Case table migration', () => {
  it('has exactly one migration file that creates the Case table', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const migrationFolders = fs
      .readdirSync(migrationsDir)
      .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory());

    expect(migrationFolders).toHaveLength(1);

    const migrationFile = path.join(migrationsDir, migrationFolders[0]!, 'migration.sql');
    expect(fs.existsSync(migrationFile)).toBe(true);

    const content = fs.readFileSync(migrationFile, 'utf-8');
    expect(content).toMatch(/CREATE TABLE.*Case/i);
    expect(content).toMatch(/identifyingTerms/i);
  });
});
