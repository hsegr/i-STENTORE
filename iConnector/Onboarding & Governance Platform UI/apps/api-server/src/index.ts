import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { initializeDatabase } from "./db/bootstrap";
import { closeDatabase } from "./db/client";
import { governanceRoutes } from "./routes/governanceRoutes";
import { verifiableCredentialRoutes } from "./routes/verifiableCredentialRoutes";

const app = new Hono();

app.use("/api/*", cors());

app.get("/health", (context) => {
  return context.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.route("/api/governance", governanceRoutes);
app.route("/api/verifiable-credentials", verifiableCredentialRoutes);

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

async function startServer(): Promise<void> {
  await initializeDatabase();

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`API server listening on http://localhost:${info.port}`);
    },
  );
}

startServer().catch((error) => {
  console.error("Failed to start API server:", error);
  process.exitCode = 1;
});

process.on("SIGINT", () => {
  closeDatabase().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  closeDatabase().finally(() => process.exit(0));
});

export type ApiApp = typeof app;
