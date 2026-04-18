/**
 * apps/web — localStorage implementation of StorageAdapter
 * Wraps synchronous localStorage in an async interface.
 */

import type { StorageAdapter } from "@mathdle/core";

export const localStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or SSR
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
