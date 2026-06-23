import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Case migration', () => {
  it('should have exactly one migration file that creates the Case table with identifyingTerms column', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    const migrationDirs = files.filter((f) => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    expect(migrationDirs).toHaveLength(1);

    const migrationDir = migrationDirs[0]!;
    const migrationFile = path.join(migrationsDir, migrationDir, 'migration.sql');
    expect(fs.existsSync(migrationFile)).toBe(true);

    const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
    expect(sqlContent).toMatch(/CREATE TABLE[\s"]*"?Case"?/i);
    expect(sqlContent).toMatch(/identifyingTerms[\s\w"]+TEXT/i);
  });
});
