import { Module, type DynamicModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { createLoggingParams, type LoggingOptions } from './logging.config';

/**
 * Configures `nestjs-pino` with the project's standard logging params.
 *
 * Call `LoggingModule.forRoot()` **inline in the app's root `@Module` imports**
 * (after the feature modules are imported at the top of the file). The
 * underlying `LoggerModule.forRoot` snapshots every `@InjectLogger()` /
 * `@InjectPinoLogger()` context at that moment, so all consumers must already be
 * imported — which they are once the root module's decorator evaluates.
 */
@Module({})
export class LoggingModule {
  static forRoot(options?: LoggingOptions): DynamicModule {
    return {
      module: LoggingModule,
      imports: [LoggerModule.forRoot(createLoggingParams(options))],
      exports: [LoggerModule],
    };
  }
}
