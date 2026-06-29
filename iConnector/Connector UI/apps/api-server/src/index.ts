import { serve } from "@hono/node-server";
import { buildApp } from "./app";

declare const process: { env: Record<string, string | undefined> };

const port = Number(process.env.PORT ?? 3000);

serve({
  fetch: buildApp().fetch,
  port,
});

console.log(`API server listening on http://localhost:${port}`);
