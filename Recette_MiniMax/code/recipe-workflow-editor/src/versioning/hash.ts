/**
 * Simple content hash for recipe snapshots.
 * Uses a fast string hashing algorithm (djb2) on the JSON representation.
 */
export function hashSnapshot(obj: unknown): string {
  const str = JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(36);
}
