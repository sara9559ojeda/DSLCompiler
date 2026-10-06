export interface IExportClient {
  exportPng(source: string): Promise<Blob>;
}
