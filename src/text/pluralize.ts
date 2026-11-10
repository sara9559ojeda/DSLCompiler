/**
 * "1 error", "3 errores", "0 errores": a count followed by the singular form
 * for exactly one and the plural form otherwise, as Spanish uses them.
 */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
