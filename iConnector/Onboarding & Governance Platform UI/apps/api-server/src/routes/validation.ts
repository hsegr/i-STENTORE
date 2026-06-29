import type { Context } from "hono";
import { z } from "zod";

export function validationError(context: Context, error: z.ZodError): Response {
  return context.json(
    {
      error: "Validation failed",
      issues: error.flatten(),
    },
    400,
  );
}

export async function parseBody<TSchema extends z.ZodTypeAny>(
  context: Context,
  schema: TSchema,
): Promise<{ success: true; data: z.infer<TSchema> } | { success: false; response: Response }> {
  let payload: unknown;
  try {
    payload = await context.req.json();
  } catch {
    payload = null;
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, response: validationError(context, parsed.error) };
  }
  return { success: true, data: parsed.data };
}

export function parseParams<TSchema extends z.ZodTypeAny>(
  context: Context,
  schema: TSchema,
): { success: true; data: z.infer<TSchema> } | { success: false; response: Response } {
  const parsed = schema.safeParse(context.req.param());
  if (!parsed.success) {
    return { success: false, response: validationError(context, parsed.error) };
  }
  return { success: true, data: parsed.data };
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  context: Context,
  schema: TSchema,
): { success: true; data: z.infer<TSchema> } | { success: false; response: Response } {
  const parsed = schema.safeParse(context.req.query());
  if (!parsed.success) {
    return { success: false, response: validationError(context, parsed.error) };
  }
  return { success: true, data: parsed.data };
}
