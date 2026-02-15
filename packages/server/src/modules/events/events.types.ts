/**
 * Application domain events.
 * Use these constants for type-safe event emission and listening.
 *
 * Add your own events following this pattern:
 * 1. Add event name to AppEvents
 * 2. Create interface for the payload
 * 3. Add to AppEventMap for type safety
 */
export const AppEvents = {
  // Example events - replace with your own
  EXAMPLE_TASK_STARTED: 'example.task.started',
  EXAMPLE_TASK_COMPLETED: 'example.task.completed',
  EXAMPLE_TASK_FAILED: 'example.task.failed',
} as const;

export type AppEventName = (typeof AppEvents)[keyof typeof AppEvents];

// --- Example Events ---

export interface ExampleTaskStartedEvent {
  taskId: string;
  taskType: string;
  initiatedBy: string;
  timestamp: string;
}

export interface ExampleTaskCompletedEvent {
  taskId: string;
  taskType: string;
  initiatedBy: string;
  result: unknown;
  durationMs: number;
  timestamp: string;
}

export interface ExampleTaskFailedEvent {
  taskId: string;
  taskType: string;
  initiatedBy: string;
  error: string;
  timestamp: string;
}

// --- Event Map (for type-safe listeners) ---

export interface AppEventMap {
  [AppEvents.EXAMPLE_TASK_STARTED]: ExampleTaskStartedEvent;
  [AppEvents.EXAMPLE_TASK_COMPLETED]: ExampleTaskCompletedEvent;
  [AppEvents.EXAMPLE_TASK_FAILED]: ExampleTaskFailedEvent;
}
