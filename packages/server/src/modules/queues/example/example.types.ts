/**
 * Payload for example queue jobs.
 * This is what gets passed to the processor.
 */
export interface ExampleJobPayload {
  /** Unique identifier for the user */
  userId: string;
  /** Action to perform */
  action: 'send-email' | 'generate-report' | 'sync-data';
  /** Additional data for the job */
  data: Record<string, unknown>;
}

/**
 * Result returned by the processor after job completion.
 */
export interface ExampleJobResult {
  success: boolean;
  processedAt: string;
  message?: string;
}

/**
 * Job names for type-safe job creation.
 */
export const EXAMPLE_JOB_NAMES = {
  PROCESS: 'process',
} as const;
