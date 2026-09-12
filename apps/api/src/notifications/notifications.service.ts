import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async getNotifications(userId: string) {
    return [
      { id: 'n-1', userId, title: 'Welcome', message: 'Welcome to AI Remedial Learning Platform', read: false },
    ];
  }
}
