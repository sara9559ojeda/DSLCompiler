import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LANGUAGE_VERSION } from "@saramariaojeda9559/compiler-core";
import { checkLanguageVersion, compareLanguageVersions } from "../src/api/languageVersion.js";
import { LanguageVersionChip } from "../src/components/LanguageVersionChip.js";

const reply = (body: unknown, ok = true): typeof fetch =>
  vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }) as unknown as typeof fetch;

describe("language version contract", () => {
  it("the frontend bundles language 2.x (the Web Worker compiles with it)", () => {
    expect(LANGUAGE_VERSION).toMatch(/^2\./);
  });

  it("matches when the backend reports the same version", async () => {
    expect(await checkLanguageVersion(reply({ status: "ok", languageVersion: LANGUAGE_VERSION }))).toEqual({
      kind: "match",
      version: LANGUAGE_VERSION,
    });
  });

  it("reports a mismatch with both versions", async () => {
    expect(await checkLanguageVersion(reply({ languageVersion: "1.0.0" }))).toEqual({ kind: "mismatch", local: LANGUAGE_VERSION, backend: "1.0.0" });
  });

  it("an old backend without the field, an error or no network is unknown, never a crash", async () => {
    expect((await checkLanguageVersion(reply({ status: "ok" }))).kind).toBe("unknown");
    expect((await checkLanguageVersion(reply({}, false))).kind).toBe("unknown");
    expect((await checkLanguageVersion(vi.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch)).kind).toBe("unknown");
  });

  it("compareLanguageVersions is exact", () => {
    expect(compareLanguageVersions("2.0.0", "2.0.0").kind).toBe("match");
    expect(compareLanguageVersions("2.0.0", "2.0.1").kind).toBe("mismatch");
  });
});

describe("LanguageVersionChip", () => {
  it("shows the local version and warns on a mismatch", async () => {
    render(<LanguageVersionChip check={() => Promise.resolve({ kind: "mismatch", local: "2.0.0", backend: "1.0.0" })} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("el servidor usa 1.0.0"));
  });

  it("stays quiet when versions match", async () => {
    render(<LanguageVersionChip check={() => Promise.resolve({ kind: "match", version: "2.0.0" })} />);
    expect(await screen.findByText(/coincide con el servidor/)).toBeInTheDocument();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
