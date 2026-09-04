// Project logging built on nestjs-pino. Import logging primitives from here
// rather than reaching for `nestjs-pino` directly.
export { InjectLogger } from './inject-logger.decorator.js';
export { LoggingModule } from './logging.module.js';
export { createLoggingParams, type LoggingOptions } from './logging.config.js';
export { withFrameworkLogFilter } from './framework-log-filter.js';

// Re-exported nestjs-pino primitives.
export { PinoLogger, Logger, LoggerErrorInterceptor } from 'nestjs-pino';
