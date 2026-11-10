import { vi } from "vitest";

/** A Storage that lives in memory, for test environments where window.localStorage is missing. */
export class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, String(value));
  }
}

/** Installs a fresh MemoryStorage as window.localStorage and returns it. */
export function installMemoryStorage(): MemoryStorage {
  const storage = new MemoryStorage();
  vi.stubGlobal("localStorage", storage);
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  return storage;
}

/** Makes every localStorage call throw, like private browsing or a full quota. */
export function installThrowingStorage(): void {
  const throwing = new MemoryStorage();
  const fail = (): never => {
    throw new DOMException("QuotaExceededError");
  };
  throwing.getItem = fail;
  throwing.setItem = fail;
  vi.stubGlobal("localStorage", throwing);
  Object.defineProperty(window, "localStorage", { value: throwing, configurable: true });
}
