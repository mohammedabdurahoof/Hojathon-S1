import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getOverview() {
    return {
      totalStudents: 1,
      totalTeachers: 1,
      activeLearningPlans: 1,
      averageMasteryScore: 70.0,
      knowledgeGapsIdentified: 1,
    };
  }
}
