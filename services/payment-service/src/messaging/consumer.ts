import * as amqp from "amqplib";
import type { PaymentEvent } from "@example/payment-contracts/models/models_0";
import { processPaymentEvent } from "../processor/paymentProcessor";

const QUEUE = "payment.events";

function isValidPaymentEvent(obj: unknown): obj is PaymentEvent {
  if (!obj || typeof obj !== "object") return false;
  const e = obj as Record<string, unknown>;
  return (
    typeof e.paymentId === "string" &&
    typeof e.userId === "string" &&
    typeof e.amount === "number" &&
    typeof e.currency === "string" &&
    typeof e.description === "string" &&
    (e.tweetId === undefined || typeof e.tweetId === "string")
  );
}

let connection: amqp.ChannelModel | undefined;
let channel: amqp.Channel | undefined;

export async function startConsumer(url: string): Promise<void> {
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.prefetch(8);

  connection.on("error", (err: Error) => {
    // eslint-disable-next-line no-console
    console.error("[consumer] rabbitmq error", err);
  });

  await channel.consume(
    QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const raw = JSON.parse(msg.content.toString("utf-8"));
        // Re-hydrate Timestamp from ISO string.
        const candidate = {
          ...raw,
          occurredAt: raw.occurredAt ? new Date(raw.occurredAt) : undefined,
        };
        if (!isValidPaymentEvent(candidate)) {
          // eslint-disable-next-line no-console
          console.error("[consumer] invalid PaymentEvent, dropping:", raw);
          channel!.ack(msg);
          return;
        }
        const event: PaymentEvent = candidate;
        await processPaymentEvent(event);
        channel!.ack(msg);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[consumer] processing error", err);
        // nack without requeue to avoid poison-message loops in this demo.
        channel!.nack(msg, false, false);
      }
    },
    { noAck: false }
  );

  // eslint-disable-next-line no-console
  console.log(`[consumer] listening on queue '${QUEUE}'`);
}

export async function stopConsumer(): Promise<void> {
  try {
    await channel?.close();
  } catch {
    /* ignore */
  }
  try {
    await connection?.close();
  } catch {
    /* ignore */
  }
  channel = undefined;
  connection = undefined;
}
