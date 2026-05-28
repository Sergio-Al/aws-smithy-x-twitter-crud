import type { Response } from "express";
import type { ValidationFailure } from "@aws-smithy/server-common";

/**
 * Convert smithy validator failures into a restJson1-shaped 400 response so the
 * HTTP contract matches what the Smithy `@smithy.framework#ValidationException`
 * trait describes.
 */
export function respondValidationError(
  res: Response,
  failures: ValidationFailure[]
): void {
  res.status(400).json({
    __type: "smithy.framework#ValidationException",
    message: "Input failed Smithy validation.",
    fieldList: failures.map((f) => ({
      path: f.path,
      // ValidationFailure is a discriminated union (Required/Pattern/Length/
      // Enum/...). Each variant has its own descriptive fields, so we serialize
      // the whole record minus `path` to give the caller all available context.
      detail: { ...f, path: undefined },
    })),
  });
}

export function respondNotFound(
  res: Response,
  errorType: string,
  message: string
): void {
  res.status(404).json({ __type: errorType, message });
}
