import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Case migration (prisma/migrations)', () => {
  it('should have exactly one migration directory under prisma/migrations/', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const migrationDirs = fs.readdirSync(migrationsDir).filter((f) => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    expect(migrationDirs).toHaveLength(1);
  });

  it('should contain a migration.sql with CREATE TABLE Case DDL', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsDir).filter((f) => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    expect(migrationDirs.length).toBeGreaterThan(0);

    const migrationSql = fs.readFileSync(
      path.join(migrationsDir, migrationDirs[0]!, 'migration.sql'),
      'utf-8'
    );

    expect(migrationSql.toUpperCase()).toContain('CREATE TABLE');
    expect(migrationSql.toUpperCase()).toContain('"Case"');
  });

  it('should have identifying_terms column in Case table migration', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrationDirs = fs.readdirSync(migrationsDir).filter((f) => {
      const fullPath = path.join(migrationsDir, f);
      return fs.statSync(fullPath).isDirectory();
    });

    const migrationSql = fs.readFileSync(
      path.join(migrationsDir, migrationDirs[0]!, 'migration.sql'),
      'utf-8'
    );

    expect(migrationSql.toLowerCase()).toContain('identifying_terms');
  });
});
