import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(credentials: { email: string; password: string }) {
    return {
      message: 'Auth login placeholder',
      email: credentials.email,
      accessToken: 'mock_jwt_token_placeholder',
    };
  }
}
