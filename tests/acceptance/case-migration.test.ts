import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('Prisma Migration for Case table', () => {
  it('has exactly one migration file that creates the Case table', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => !f.startsWith('.') && f !== 'migration_lock.toml');

    expect(files).toHaveLength(1);

    const migrationFile = path.join(migrationsDir, files[0]!, 'migration.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    expect(sql).toMatch(/CREATE TABLE.*"Case"/i);
    expect(sql).toMatch(/identifyingTerms/i);
  });

  it('migration creates the Case table with identifyingTerms column', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => !f.startsWith('.') && f !== 'migration_lock.toml');
    const migrationFile = path.join(migrationsDir, files[0]!, 'migration.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    expect(sql.toLowerCase()).toMatch(/identifyingterms/i);
  });
}
