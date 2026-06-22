import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Case Persistence Migration [D2-case-input]', () => {
  it('[Criterion 3a] should have migration file in prisma/migrations/', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('[Criterion 3b] should have migration file containing Case table creation SQL', () => {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const files = fs.readdirSync(migrationsDir);

    let foundCreateCaseTable = false;

    for (const file of files) {
      if (file.includes('migration.sql')) {
        const migrationPath = path.join(migrationsDir, file);
        const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

        if (
          migrationContent.toLowerCase().includes('create table') &&
          migrationContent.toLowerCase().includes('case')
        ) {
          foundCreateCaseTable = true;
          break;
        }
      }
    }

    expect(foundCreateCaseTable).toBe(true);
  });

  it('should have Prisma schema with Case model', () => {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    expect(fs.existsSync(schemaPath)).toBe(true);

    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    expect(schemaContent).toMatch(/model\s+Case\s*{/i);
    expect(schemaContent).toMatch(/identifyingTerms/i);
  });
}
