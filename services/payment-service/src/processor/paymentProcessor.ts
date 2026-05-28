import type { PaymentEvent } from "@example/payment-contracts/models/models_0";
import { PaymentStatus } from "@example/payment-processor-server/models/models_0";
import { insertPayment, updatePaymentStatus } from "../db/repository";

const PROCESSING_DELAY_MS = 1500;
const FAILURE_RATE = 0.1; // 10% simulated failures

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulated payment processor: PENDING → PROCESSING → COMPLETED|FAILED.
 * Each state transition is persisted to Postgres so the read API reflects
 * progress in real time.
 */
export async function processPaymentEvent(event: PaymentEvent): Promise<void> {
  await insertPayment(event, PaymentStatus.PENDING);

  await sleep(PROCESSING_DELAY_MS / 3);
  await updatePaymentStatus(event.paymentId!, PaymentStatus.PROCESSING);

  await sleep(PROCESSING_DELAY_MS);

  const failed = Math.random() < FAILURE_RATE;
  const finalStatus = failed ? PaymentStatus.FAILED : PaymentStatus.COMPLETED;
  await updatePaymentStatus(event.paymentId!, finalStatus);

  // eslint-disable-next-line no-console
  console.log(
    `[processor] payment ${event.paymentId} -> ${finalStatus} (amount=${event.amount} ${event.currency})`
  );
}
