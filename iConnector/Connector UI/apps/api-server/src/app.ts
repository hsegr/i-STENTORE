import { createApiContract } from "@dataspace-connector/api-contract";
import { createDefaultClock, createServiceStatusRepository } from "@dataspace-connector/db";
import { createHealthService } from "@dataspace-connector/domain";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export function buildApp() {
  const app = new Hono();

  app.use("*", logger());
  app.use("*", cors({ origin: "*" }));

  const healthService = createHealthService(
    createServiceStatusRepository("dataspace-connector-api", "0.1.0"),
    createDefaultClock(),
  );

  app.route(
    "/",
    createApiContract({
      getHealth: async () => {
        const status = await healthService.getStatus();
        return {
          status: "ok",
          service: status.service,
          version: status.version,
          timestamp: status.timestamp,
        };
      },
    }),
  );

  app.notFound((context) => context.json({ error: "Not found" }, 404));

  app.onError((error, context) => {
    console.error(error);
    return context.json({ error: "Internal server error" }, 500);
  });

  return app;
}
