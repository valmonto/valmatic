import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ZodError } from 'zod';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(@InjectPinoLogger(GlobalExceptionFilter.name) private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { statusCode, message, error } = this.getErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log internal server errors
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    void reply.status(statusCode).send(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    // Handle Zod validation errors
    // Return just the message (without field path) to preserve translation keys
    // e.g., "Invalid email" instead of "email: Invalid email"
    if (exception instanceof ZodError) {
      const zodError = exception as ZodError;
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: zodError.issues.map((issue) => issue.message),
        error: 'Validation Error',
      };
    }

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          statusCode: status,
          message: response,
          error: HttpStatus[status] || 'Error',
        };
      }

      const responseObj = response as Record<string, unknown>;
      return {
        statusCode: status,
        message: (responseObj.message as string | string[]) || exception.message,
        error: (responseObj.error as string) || HttpStatus[status] || 'Error',
      };
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    // Fallback for unknown exceptions
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
