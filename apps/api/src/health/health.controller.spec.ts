import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ health: 1 }]),
          },
        },
        {
          provide: RedisService,
          useValue: {
            isHealthy: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    const result = controller.getHealth();
    expect(result.status).toEqual('ok');
    expect(result.service).toEqual('ai-remedial-learning-api');
  });

  it('should return liveness status', () => {
    const result = controller.getLiveness();
    expect(result.status).toEqual('ok');
  });

  it('should return readiness status', async () => {
    const result = await controller.getReadiness();
    expect(result.status).toEqual('ready');
    expect(result.checks.database.status).toEqual('ok');
    expect(result.checks.redis.status).toEqual('ok');
  });
});
