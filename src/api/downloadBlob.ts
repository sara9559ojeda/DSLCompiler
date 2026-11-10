/**
 * How long the object URL stays valid after the click. Revoking it in the same
 * tick can cancel the download in some browsers, which start reading the URL
 * only after the click handler returns.
 */
export const OBJECT_URL_REVOKE_DELAY_MS = 1_000;

/** Saves a Blob as a file through a temporary link, then releases the object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);
}
