import "dotenv/config";
import express from "express";
import { paymentsRouter } from "./routes/payments";
import { startConsumer, stopConsumer } from "./messaging/consumer";
import { closePool } from "./db/client";

const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? "amqp://localhost:5672";

async function main(): Promise<void> {
  await startConsumer(RABBITMQ_URL);

  const app = express();
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(paymentsRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      // eslint-disable-next-line no-console
      console.error("[error]", err);
      res.status(500).json({
        __type: "InternalFailure",
        message: "Internal server error",
      });
    }
  );

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[payment-service] listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[payment-service] received ${signal}, shutting down`);
    server.close();
    await stopConsumer();
    await closePool();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[payment-service] fatal:", err);
  process.exit(1);
});
