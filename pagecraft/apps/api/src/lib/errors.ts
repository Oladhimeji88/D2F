export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function notFound(message: string): never {
  throw new ApiError(404, "NOT_FOUND", message);
}

export function badRequest(message: string, details?: unknown): never {
  throw new ApiError(400, "BAD_REQUEST", message, details);
}
