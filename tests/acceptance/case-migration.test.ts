import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Prisma migrations', () => {
  it('has exactly one migration file that creates the Case table', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);
    
    const dirs = fs.readdirSync(migrationsDir).filter(f => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });
    
    expect(dirs.length).toBe(1);
    
    const migrationSqlPath = path.join(migrationsDir, dirs[0]!, 'migration.sql');
    expect(fs.existsSync(migrationSqlPath)).toBe(true);
    
    const sql = fs.readFileSync(migrationSqlPath, 'utf-8');
    expect(sql).toMatch(/CREATE\s+TABLE\s+"Case"/i);
    expect(sql).toMatch(/identifyingTerms/i);
  });
});
