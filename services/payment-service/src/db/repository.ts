import type { PaymentEvent } from "@example/payment-contracts/models/models_0";
import {
  PaymentResponseBody,
  PaymentStatus,
} from "@example/payment-processor-server/models/models_0";
import { getPool } from "./client";

interface PaymentRow {
  payment_id: string;
  user_id: string;
  tweet_id: string | null;
  amount: string; // pg returns NUMERIC as string
  currency: string;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function rowToResponse(row: PaymentRow): PaymentResponseBody {
  return {
    paymentId: row.payment_id,
    userId: row.user_id,
    tweetId: row.tweet_id ?? undefined,
    amount: Number.parseFloat(row.amount),
    currency: row.currency,
    description: row.description,
    status: row.status as PaymentStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertPayment(
  event: PaymentEvent,
  status: PaymentStatus
): Promise<void> {
  await getPool().query(
    `INSERT INTO payments
       (payment_id, user_id, tweet_id, amount, currency, description, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     ON CONFLICT (payment_id) DO NOTHING`,
    [
      event.paymentId,
      event.userId,
      event.tweetId ?? null,
      event.amount,
      event.currency,
      event.description,
      status,
      event.occurredAt,
    ]
  );
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<void> {
  await getPool().query(
    `UPDATE payments SET status = $1, updated_at = NOW() WHERE payment_id = $2`,
    [status, paymentId]
  );
}

export async function getPaymentById(
  paymentId: string
): Promise<PaymentResponseBody | undefined> {
  const result = await getPool().query<PaymentRow>(
    `SELECT payment_id, user_id, tweet_id, amount, currency, description,
            status, created_at, updated_at
       FROM payments
      WHERE payment_id = $1`,
    [paymentId]
  );
  const row = result.rows[0];
  return row ? rowToResponse(row) : undefined;
}
