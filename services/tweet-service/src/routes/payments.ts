import { Router } from "express";
import { randomUUID } from "crypto";
import {
  InitiatePaymentInput,
  PaymentStatus,
} from "@example/payment-gateway-server/models/models_0";
import { PaymentEvent } from "@example/payment-contracts/models/models_0";
import { publishPaymentEvent } from "../messaging/publisher";
import { respondValidationError } from "../util/responses";

export const paymentsRouter = Router();

paymentsRouter.post("/payments", async (req, res, next) => {
  try {
    const input: InitiatePaymentInput = { body: req.body };
    const failures = InitiatePaymentInput.validate(input);
    if (failures.length > 0) return respondValidationError(res, failures);

    const paymentId = randomUUID();
    const body = input.body!;
    const event: PaymentEvent = {
      paymentId,
      userId: body.userId!,
      tweetId: body.tweetId,
      amount: body.amount!,
      currency: body.currency!,
      description: body.description!,
      occurredAt: new Date(),
    };

    await publishPaymentEvent(event);

    res.status(202).json({
      paymentId,
      status: PaymentStatus.PENDING,
    });
  } catch (err) {
    next(err);
  }
});
