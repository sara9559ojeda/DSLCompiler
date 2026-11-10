import { beforeEach, describe, expect, it } from "vitest";
import {
  isExportHistoryEntry,
  loadPersistedExportHistory,
  useExportHistoryStore,
} from "../src/state/useExportHistoryStore.js";
import { EXPORT_HISTORY_MAX_ENTRIES, EXPORT_HISTORY_STORAGE_KEY } from "../src/config/app.config.js";
import { installMemoryStorage, installThrowingStorage } from "./helpers/memoryStorage.js";

const validEntry = {
  id: "a",
  format: "svg",
  filename: "diagrama.svg",
  createdAt: 1_700_000_000_000,
  dataUrl: "data:image/svg+xml;base64,PHN2Zz4=",
};

describe("isExportHistoryEntry", () => {
  it("accepts a well-formed entry", () => {
    expect(isExportHistoryEntry(validEntry)).toBe(true);
  });

  it.each([
    ["a missing format", { ...validEntry, format: undefined }],
    ["an unknown format", { ...validEntry, format: "gif" }],
    ["a non-numeric date", { ...validEntry, createdAt: "ayer" }],
    ["a link that is not a data: URL", { ...validEntry, dataUrl: "javascript:alert(1)" }],
    ["null", null],
    ["a string", "entry"],
  ])("rejects %s", (_label, value) => {
    expect(isExportHistoryEntry(value)).toBe(false);
  });
});

describe("loadPersistedExportHistory", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it("returns an empty history when nothing is stored", () => {
    expect(loadPersistedExportHistory()).toEqual([]);
  });

  it("returns an empty history for corrupted JSON", () => {
    window.localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, "{not json");
    expect(loadPersistedExportHistory()).toEqual([]);
  });

  it("drops malformed entries and keeps the valid ones", () => {
    window.localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, JSON.stringify([validEntry, { id: "b" }, 42]));
    expect(loadPersistedExportHistory()).toEqual([validEntry]);
  });

  it("returns an empty history when storage is unavailable", () => {
    installThrowingStorage();
    expect(loadPersistedExportHistory()).toEqual([]);
  });

  it("never loads more than the maximum number of entries", () => {
    const many = Array.from({ length: EXPORT_HISTORY_MAX_ENTRIES + 3 }, (_, index) => ({ ...validEntry, id: String(index) }));
    window.localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, JSON.stringify(many));
    expect(loadPersistedExportHistory()).toHaveLength(EXPORT_HISTORY_MAX_ENTRIES);
  });
});

describe("useExportHistoryStore.addEntry", () => {
  beforeEach(() => {
    installMemoryStorage();
    useExportHistoryStore.setState({ entries: [] });
  });

  it("puts the newest export first and persists it", () => {
    const { addEntry } = useExportHistoryStore.getState();
    addEntry({ format: "svg", filename: "uno.svg", dataUrl: "data:,1" });
    addEntry({ format: "png", filename: "dos.png", dataUrl: "data:,2" });

    const entries = useExportHistoryStore.getState().entries;
    expect(entries.map((entry) => entry.filename)).toEqual(["dos.png", "uno.svg"]);
    expect(loadPersistedExportHistory().map((entry) => entry.filename)).toEqual(["dos.png", "uno.svg"]);
  });

  it("still records the export in memory when storage is full", () => {
    installThrowingStorage();
    useExportHistoryStore.getState().addEntry({ format: "png", filename: "grande.png", dataUrl: "data:,x" });
    expect(useExportHistoryStore.getState().entries).toHaveLength(1);
  });

  it("caps the history at the configured maximum", () => {
    const { addEntry } = useExportHistoryStore.getState();
    for (let index = 0; index < EXPORT_HISTORY_MAX_ENTRIES + 2; index += 1) {
      addEntry({ format: "svg", filename: `${index}.svg`, dataUrl: "data:,x" });
    }
    expect(useExportHistoryStore.getState().entries).toHaveLength(EXPORT_HISTORY_MAX_ENTRIES);
  });
});
