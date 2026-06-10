// Project logging built on nestjs-pino. Import logging primitives from here
// rather than reaching for `nestjs-pino` directly.
export { InjectLogger } from './inject-logger.decorator';
export { LoggingModule } from './logging.module';
export { createLoggingParams, type LoggingOptions } from './logging.config';
export { withFrameworkLogFilter } from './framework-log-filter';

// Re-exported nestjs-pino primitives.
export { PinoLogger, Logger, LoggerErrorInterceptor } from 'nestjs-pino';
