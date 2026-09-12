import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'LocalStorageProvider';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'storage', 'documents');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    this.logger.log(`LocalStorageProvider initialized at base path: ${this.baseDir}`);
  }

  async upload(key: string, data: Buffer, mimeType?: string): Promise<string> {
    const filePath = path.join(this.baseDir, key);
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await fs.promises.writeFile(filePath, data);
    this.logger.log(`Uploaded file key "${key}" (${data.length} bytes) to local storage`);
    return filePath;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File key "${key}" not found in local storage.`);
    }
    return fs.promises.readFile(filePath);
  }

  async delete(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    return fs.existsSync(filePath);
  }
}
