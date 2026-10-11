/** Converts a Blob to a base64 data: URL — used so an export history entry can be re-downloaded later without keeping the original Blob/object URL alive. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo exportado."));
    reader.readAsDataURL(blob);
  });
}
