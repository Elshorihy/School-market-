/**
 * Application-level error with a user-safe Arabic message.
 * Never expose stack traces / SQL to the client.
 */
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function safeError(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error && process.env.NODE_ENV !== 'production') return err.message;
  return 'حدث خطأ غير متوقع، حاول مرة أخرى';
}
