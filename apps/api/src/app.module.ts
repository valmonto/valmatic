import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { DatabaseModule } from '@pkg/database';
import {
  EventsModule,
  GlobalExceptionFilter,
  HealthModule,
  IAM_REDIS,
  LoggerErrorInterceptor,
  LoggingModule,
  StorageModule,
  TelemetryModule,
  ThrottlerRedisStorage,
  ThrottlingModule,
} from '@pkg/server';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OrgModule } from './org/org.module';
import { JobsModule } from './jobs';
import { NotificationModule } from './notifications';
import { AttachmentsModule } from './attachments';
import { ApiKeyModule } from './api-key';
import { InvitationModule } from './invitations';
import { McpModule } from './mcp';
import { I18nModule } from './i18n';
import { SeedModule } from './seed/seed.module';
import { validateEnv } from './config';

@Module({
  imports: [
    LoggingModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.getOrThrow<string>('DATABASE_URL'),
        maxConnections: config.get<number>('DATABASE_MAX_CONNECTIONS', 10),
      }),
    }),
    TelemetryModule,
    // Rate limiting: a global default budget per verified user (per IP when
    // unauthenticated), Redis-backed so limits hold across replicas and
    // restarts. Routes override with @Throttle({ default: { limit, ttl } })
    // and opt out with @SkipThrottle() — the health endpoint does. Limiter
    // Redis is the IAM one unless RATE_LIMIT_REDIS_HOST points elsewhere;
    // counters are namespaced and ephemeral, so switching migrates nothing.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, IAM_REDIS],
      useFactory: (config: ConfigService, iamRedis: Redis) => {
        const dedicatedHost = config.get<string>('RATE_LIMIT_REDIS_HOST');
        const redis = dedicatedHost
          ? new Redis({
              host: dedicatedHost,
              port: config.get<number>('RATE_LIMIT_REDIS_PORT', 6379),
              password: config.get<string>('RATE_LIMIT_REDIS_PASSWORD'),
            })
          : iamRedis;

        return {
          throttlers: [
            {
              name: 'default',
              limit: config.get<number>('RATE_LIMIT_MAX', 300),
              ttl: config.get<number>('RATE_LIMIT_WINDOW_MS', 60_000),
              // Off under test so suites never fight the limiter.
              skipIf: () => config.get<string>('NODE_ENV') === 'test',
            },
          ],
          storage: new ThrottlerRedisStorage(redis),
        };
      },
    }),
    EventsModule,
    I18nModule,
    HealthModule,
    AuthModule,
    UserModule,
    OrgModule,
    JobsModule,
    NotificationModule,
    StorageModule.forRootAsync({
      inject: [ConfigService],
      // Options factory is typed (...args: unknown[]) — narrow inside.
      useFactory: (...args: unknown[]) => {
        const config = args[0] as ConfigService;
        return {
          endpoint: config.getOrThrow<string>('STORAGE_ENDPOINT'),
          region: config.getOrThrow<string>('STORAGE_REGION'),
          accessKeyId: config.getOrThrow<string>('STORAGE_ACCESS_KEY_ID'),
          secretAccessKey: config.getOrThrow<string>('STORAGE_SECRET_ACCESS_KEY'),
          bucket: config.getOrThrow<string>('STORAGE_BUCKET'),
          corsAllowedOrigins: config
            .getOrThrow<string>('STORAGE_CORS_ALLOWED_ORIGINS')
            .split(',')
            .map((origin: string) => origin.trim()),
        };
      },
    }),
    // Attachments are domain-blind; the app registers its subjects here.
    // The template has none yet, so the map is empty — the first feature
    // that wants files adds its module to `imports` and one resolver line:
    //
    //   AttachmentsModule.forRoot({
    //     imports: [TasksModule],
    //     subjects: {
    //       inject: [TaskRepository],
    //       useFactory: (...args: unknown[]) => {
    //         const tasks = args[0] as TaskRepository;
    //         return { task: async (id, orgId) => (await tasks.findById(id, orgId)) !== null };
    //       },
    //     },
    //   }),
    AttachmentsModule.forRoot({ subjects: {} }),
    ApiKeyModule,
    InvitationModule,
    McpModule,
    SeedModule.forApp(),
    // LAST on purpose: global guards run in scan order and the root module's
    // own providers scan before any import's, so the throttler must live in
    // an imported module placed after the IAM modules to see req.user. See
    // ThrottlingModule for the bug this fixed.
    ThrottlingModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
  ],
})
export class AppModule {}
