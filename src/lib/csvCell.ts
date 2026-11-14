// One CSV cell. Cells carry text from external pages (titles) and caller input (urls);
// a leading formula character would make Excel/Sheets evaluate the cell, so it is
// prefixed with a single quote before the usual CSV quoting.
const FORMULA_PREFIX = /^[=+\-@＠\t\r]/;

export function csvCell(raw: string): string {
  const value = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
