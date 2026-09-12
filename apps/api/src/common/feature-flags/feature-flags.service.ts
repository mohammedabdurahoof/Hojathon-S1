import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly configService: ConfigService) {}

  private getDefault(flag: string): boolean {
    if (flag === 'MAINTENANCE_MODE') return false;
    return true;
  }

  isEnabled(flag: string): boolean {
    const envVal = this.configService.get<string>(flag) ?? process.env[flag];
    if (envVal !== undefined) {
      return envVal === 'true';
    }
    return this.getDefault(flag);
  }
}
