import type { Response } from "express";
import type { ValidationFailure } from "@aws-smithy/server-common";

export function respondValidationError(
  res: Response,
  failures: ValidationFailure[]
): void {
  res.status(400).json({
    __type: "smithy.framework#ValidationException",
    message: "Input failed Smithy validation.",
    fieldList: failures.map((f) => ({ path: f.path, detail: { ...f, path: undefined } })),
  });
}

export function respondNotFound(
  res: Response,
  errorType: string,
  message: string
): void {
  res.status(404).json({ __type: errorType, message });
}
