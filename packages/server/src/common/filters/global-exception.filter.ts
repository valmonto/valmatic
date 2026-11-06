import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';
import { InjectLogger, PinoLogger } from '../../modules/logging/index.js';
import { ErrorReporter } from '../../modules/telemetry/index.js';
import type { ActiveUser } from '@pkg/contracts';
import type { HttpRequest, HttpResponse } from '../http/index.js';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  /** Optional verbatim upstream context (e.g. GitHub's own error text) —
   *  message stays a translation key; detail is rendered as-is. */
  detail?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectLogger() private readonly logger: PinoLogger,
    private readonly errorReporter: ErrorReporter,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<HttpRequest & { user?: ActiveUser }>();

    const { statusCode, message, error, detail } = this.getErrorDetails(exception);
    // The URL as sent: a mounted router may already have stripped the global
    // prefix from `request.url`, so ask the adapter.
    const path = this.adapterHost.httpAdapter.getRequestUrl(request) as string;

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      ...(detail ? { detail } : {}),
      timestamp: new Date().toISOString(),
      path,
    };

    // Log internal server errors, and report them if a reporter is configured.
    // 4xx are the caller's mistakes; only 5xx are ours.
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${path} - ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );

      const user = request.user;
      this.errorReporter.report(exception, {
        userId: user?.userId,
        orgId: user?.orgId,
        method: request.method,
        path,
      });
    }

    this.adapterHost.httpAdapter.reply(reply, errorResponse, statusCode);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
    detail?: string;
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
        ...(typeof responseObj.detail === 'string' ? { detail: responseObj.detail } : {}),
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
