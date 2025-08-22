export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

export function encodeCursor<T extends Record<string, any>>(value: T): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}
export function decodeCursor<T = any>(cursor?: string | null): T | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
} 