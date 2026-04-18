/**
 * packages/core — Storage adapter interface
 *
 * Both web and mobile inject their own implementation:
 * - Web:    LocalStorageAdapter  (apps/web/lib/storage-adapter.ts)
 * - Mobile: AsyncStorageAdapter  (apps/mobile/storage/async-storage-adapter.ts)
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Helper: get and JSON-parse */
export async function getJSON<T>(storage: StorageAdapter, key: string): Promise<T | null> {
  try {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Helper: JSON-stringify and set */
export async function setJSON<T>(storage: StorageAdapter, key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}
