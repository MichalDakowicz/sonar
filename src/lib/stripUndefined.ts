/**
 * Strips undefined values from an object. Postgres/PostgREST rejects
 * `undefined` in JSON payloads the same way Firebase used to (doc 02) —
 * every write path should run its updates through this first.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
