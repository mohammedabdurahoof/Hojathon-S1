import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './providers/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly localStorageProvider: LocalStorageProvider,
  ) {
    const providerName = this.configService.get<string>('STORAGE_PROVIDER', 'local');
    this.logger.log(`StorageService initialized with provider: ${providerName}`);
    this.provider = this.localStorageProvider;
  }

  async upload(key: string, data: Buffer, mimeType?: string): Promise<string> {
    return this.provider.upload(key, data, mimeType);
  }

  async download(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }
}
