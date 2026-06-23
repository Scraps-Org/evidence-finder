import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('Case Migration — D2-case-input', () => {
  it('has exactly one migration file under prisma/migrations/', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const entries = fs.readdirSync(migrationsDir).filter((entry) => {
      return fs.statSync(path.join(migrationsDir, entry)).isDirectory();
    });
    expect(entries).toHaveLength(1);
  });

  it('migration creates Case table with identifyingTerms text column', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDir = fs.readdirSync(migrationsDir)[0]!;
    const migrationFile = path.join(migrationsDir, migrationDir, 'migration.sql');
    const content = fs.readFileSync(migrationFile, 'utf-8');

    expect(content).toMatch(/CREATE TABLE[\s\S]*"Case"/i);
    expect(content).toMatch(/identifyingTerms[\s\S]*TEXT/i);
  });
});
