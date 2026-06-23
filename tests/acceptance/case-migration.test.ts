import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Case migration [D2-case-input]', () => {
  it('should have exactly one migration file creating Case table with identifyingTerms column', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => !f.startsWith('.') && f !== 'migration_lock.toml');
    
    expect(files).toHaveLength(1);
    const migrationName = files[0];
    const migrationFile = path.join(migrationsDir, migrationName, 'migration.sql');
    const migrationContent = fs.readFileSync(migrationFile, 'utf-8');
    
    expect(migrationContent).toMatch(/CREATE TABLE.*Case/i);
    expect(migrationContent).toMatch(/identifyingTerms\s+TEXT/i);
  });
});
