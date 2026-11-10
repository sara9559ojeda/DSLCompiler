import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob, OBJECT_URL_REVOKE_DELAY_MS } from "../src/api/downloadBlob.js";
import { blobToDataUrl } from "../src/api/blobToDataUrl.js";

describe("downloadBlob", () => {
  const createObjectURL = vi.fn(() => "blob:fake-url");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clicks a temporary link with the file name and removes it", () => {
    const clicks: { href: string; download: string }[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push({ href: this.href, download: this.download });
    });

    downloadBlob(new Blob(["<svg/>"]), "diagrama.svg");

    expect(clicks).toEqual([{ href: "blob:fake-url", download: "diagrama.svg" }]);
    expect(document.querySelector("a[download]")).toBeNull();
    click.mockRestore();
  });

  it("keeps the object URL alive until after the click, then releases it", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    downloadBlob(new Blob(["x"]), "a.png");
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(OBJECT_URL_REVOKE_DELAY_MS);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    click.mockRestore();
  });
});

describe("blobToDataUrl", () => {
  it("encodes a blob as a base64 data: URL with its type", async () => {
    const dataUrl = await blobToDataUrl(new Blob(["<svg/>"], { type: "image/svg+xml" }));
    expect(dataUrl).toBe(`data:image/svg+xml;base64,${btoa("<svg/>")}`);
  });
});
