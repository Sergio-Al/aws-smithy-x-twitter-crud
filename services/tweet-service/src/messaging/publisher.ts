import * as amqp from "amqplib";
import type { PaymentEvent } from "@example/payment-contracts/models/models_0";

const QUEUE = "payment.events";

let connection: amqp.ChannelModel | undefined;
let channel: amqp.Channel | undefined;

export async function initPublisher(url: string): Promise<void> {
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  connection.on("error", (err: Error) => {
    // eslint-disable-next-line no-console
    console.error("[publisher] rabbitmq connection error", err);
  });
  connection.on("close", () => {
    // eslint-disable-next-line no-console
    console.warn("[publisher] rabbitmq connection closed");
    connection = undefined;
    channel = undefined;
  });
}

export async function publishPaymentEvent(event: PaymentEvent): Promise<void> {
  if (!channel) {
    throw new Error("Publisher not initialized — call initPublisher() first");
  }
  // Serialize Date → ISO 8601 string so the consumer can reliably parse it
  // regardless of platform JSON-stringify defaults.
  const payload = JSON.stringify({
    ...event,
    occurredAt: event.occurredAt?.toISOString?.() ?? event.occurredAt,
  });
  channel.sendToQueue(QUEUE, Buffer.from(payload, "utf-8"), {
    persistent: true,
    contentType: "application/json",
    contentEncoding: "utf-8",
  });
}

export async function closePublisher(): Promise<void> {
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
