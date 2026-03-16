export function ok<T>(data: T) {
  return {
    success: true as const,
    data,
    error: null
  };
}

export function fail(code: string, message: string, details?: unknown) {
  return {
    success: false as const,
    data: null,
    error: {
      code,
      message,
      details
    }
  };
}
