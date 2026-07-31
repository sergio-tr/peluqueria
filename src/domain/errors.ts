import { ConfigError } from "@/infrastructure/config/env";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toErrorResponse(error: unknown): {
  status: number;
  body: { code: string; message: string };
} {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { code: error.code, message: error.message },
    };
  }
  if (error instanceof ConfigError) {
    return {
      status: 503,
      body: { code: "CONFIG_ERROR", message: error.message },
    };
  }
  return {
    status: 500,
    body: { code: "INTERNAL_ERROR", message: "Ha ocurrido un error." },
  };
}
