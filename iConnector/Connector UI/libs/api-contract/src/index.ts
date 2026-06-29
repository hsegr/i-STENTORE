import type { HealthStatus } from "@dataspace-connector/schemas";
import { Hono } from "hono";

export interface ApiContractHandlers {
  getHealth: () => Promise<HealthStatus> | HealthStatus;
}

export function createApiContract(handlers: ApiContractHandlers) {
  const app = new Hono();

  app.get("/health", async (context) => {
    return context.json(await handlers.getHealth());
  });

  return app;
}
