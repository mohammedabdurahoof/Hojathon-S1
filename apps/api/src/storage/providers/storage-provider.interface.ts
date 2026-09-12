export interface StorageProvider {
  name: string;
  upload(key: string, data: Buffer, mimeType?: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}
