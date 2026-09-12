import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { validateProductionConfig } from './config/app.config';

async function bootstrap() {
  // ─── Production config validation ────────────────────────────────────────
  // Fails fast if required env vars are missing or insecure in production
  validateProductionConfig();

  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    // Disable NestJS built-in logger in production — use our structured logger
    logger: isProduction ? ['error', 'warn', 'log'] : ['debug', 'verbose', 'log', 'warn', 'error'],
    bufferLogs: true,
  });

  // ─── Security headers ─────────────────────────────────────────────────────
  app.use(
    (helmet as any).default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.openai.com'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  // ─── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── CORS — explicit, never wildcard with credentials ────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error(`CORS: Origin '${origin}' is not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
  });

  // ─── Request size limits ──────────────────────────────────────────────────
  const maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
  const express = app.getHttpAdapter().getInstance();
  express.use(require('express').json({ limit: maxRequestSize }));
  express.use(require('express').urlencoded({ extended: true, limit: maxRequestSize }));

  // ─── Global Validation Pipe ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,                  // Strip unknown properties
      transform: true,                  // Auto-transform types
      forbidNonWhitelisted: true,       // Reject requests with extra fields
      forbidUnknownValues: true,
      disableErrorMessages: false,
      validationError: {
        target: false,                  // Don't expose class instance in errors
        value: false,                   // Don't expose submitted value in errors
      },
    }),
  );

  const port = process.env.API_PORT || process.env.PORT || 3001;

  // ─── Swagger OpenAPI Documentation ────────────────────────────────────────
  if (!isProduction || process.env.SWAGGER_ENABLED === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI Remedial Learning Platform API')
      .setDescription(
        'Production REST API for personalized AI-powered remedial education. ' +
        'Includes authentication, curriculum management, adaptive assessments, ' +
        'AI tutoring, teacher intelligence, and RAG-powered learning.',
      )
      .setVersion(process.env.APP_VERSION || '1.0.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Health', 'Health and readiness checks')
      .addTag('Students', 'Student management')
      .addTag('Teachers', 'Teacher management')
      .addTag('Curriculum', 'Curriculum, subjects, chapters, topics')
      .addTag('Concepts', 'Learning concepts and prerequisites')
      .addTag('Assessments', 'Assessment management')
      .addTag('Assessment Engine', 'Adaptive assessment engine')
      .addTag('Questions', 'Question bank management')
      .addTag('Mastery', 'Student mastery tracking')
      .addTag('Learning Plans', 'Personalized learning plans')
      .addTag('AI', 'AI tutor and generation endpoints')
      .addTag('RAG', 'Retrieval-augmented generation')
      .addTag('Adaptive', 'Adaptive learning sessions')
      .addTag('Analytics', 'Learning analytics')
      .addTag('Teacher Intelligence', 'Teacher analytics and intervention')
      .addTag('Admin', 'Administrative endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
  logger.log(`❤️  Health: http://localhost:${port}/api/health`);
  logger.log(`✅ Ready: http://localhost:${port}/api/health/ready`);

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.log(`\n${signal} received. Starting graceful shutdown...`);

    // 1. Stop accepting new connections
    await app.close();

    logger.log('✅ Graceful shutdown complete.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions — log and exit rather than continue in bad state
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err.message);
    if (isProduction) {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', String(reason));
    if (isProduction) {
      process.exit(1);
    }
  });
}

bootstrap();
