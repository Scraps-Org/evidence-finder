import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Case Migration - Database Schema', () => {
  it('creates exactly one migration file containing Case table DDL', () => {
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = readdirSync(migrationsDir).filter(
      (f) => f !== 'migration_lock.toml' && !f.startsWith('.'),
    );

    const caseTableMigrations = migrationDirs.filter((dir) => {
      const migrationFile = join(migrationsDir, dir, 'migration.sql');
      try {
        const content = readFileSync(migrationFile, 'utf-8');
        return content.includes('CREATE TABLE') && content.includes('Case');
      } catch {
        return false;
      }
    });

    expect(caseTableMigrations.length).toBe(1);

    const migrationFile = join(migrationsDir, caseTableMigrations[0], 'migration.sql');
    const content = readFileSync(migrationFile, 'utf-8');
    expect(content).toMatch(/CREATE TABLE.*"Case"/i);
    expect(content).toContain('identifyingTerms');
  });
});
