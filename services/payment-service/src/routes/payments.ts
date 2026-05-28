import { Router } from "express";
import { GetPaymentStatusInput } from "@example/payment-processor-server/models/models_0";
import { getPaymentById } from "../db/repository";
import { respondNotFound, respondValidationError } from "../util/responses";

export const paymentsRouter = Router();

paymentsRouter.get("/payments/:paymentId", async (req, res, next) => {
  try {
    const input: GetPaymentStatusInput = { paymentId: req.params.paymentId };
    const failures = GetPaymentStatusInput.validate(input);
    if (failures.length > 0) return respondValidationError(res, failures);

    const payment = await getPaymentById(input.paymentId!);
    if (!payment) {
      return respondNotFound(
        res,
        "example.payment#PaymentNotFoundException",
        `Payment ${input.paymentId} not found`
      );
    }
    res.status(200).json(payment);
  } catch (err) {
    next(err);
  }
});
