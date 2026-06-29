import { Hono } from "hono";
import { z } from "zod";
import type { GovernanceRole, IntendedParticipationRole, LifecycleStatus } from "@dataspace-onboarding/shared";
import {
  deleteRejectedRequest,
  getAuditEvents,
  getAuditEventsForOwner,
  getPendingRequests,
  getRequestsForOwner,
  getResolvedRequests,
  overturnAcceptedRequest,
  resolveRequest,
  submitOnboardingRequest,
  updateLifecycle,
} from "@/services/governanceService";
import { parseBody, parseParams, parseQuery } from "./validation";

export const governanceRoutes = new Hono();

const roleSchema = z.enum(["participant", "consumer", "provider", "prosumer", "observer"] satisfies GovernanceRole[]);
const intendedParticipationSchema = z.enum(["provider", "consumer", "prosumer"] satisfies IntendedParticipationRole[]);
const lifecycleSchema = z.enum(["renewed", "revoked"] satisfies Extract<LifecycleStatus, "renewed" | "revoked">[]);
const requestIdParamSchema = z.object({
  requestId: z.string().trim().min(1),
});
const ownerIdParamSchema = z.object({
  ownerId: z.string().trim().min(1),
});
const limitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
});

const submitOnboardingRequestSchema = z.object({
  ownerId: z.string().trim().min(1),
  applicantName: z.string().trim().min(1),
  organizationName: z.string().trim().min(1),
  walletAddress: z.string().trim().min(1),
  did: z.string().trim().min(1),
  selectedAttestators: z.array(z.string().trim().min(1)),
  tlsSetup: z.boolean(),
  blockchainSetup: z.boolean(),
  participantProfile: z
    .object({
      organizationName: z.string().trim().min(1),
      intendedParticipation: z.union([intendedParticipationSchema, z.null()]),
      businessPurpose: z.string().trim().min(1),
      contactEmail: z.string().trim().optional(),
      website: z.string().trim().optional(),
      country: z.string().trim().optional(),
      additionalInformation: z.string().trim().optional(),
    })
    .strict()
    .optional(),
}).strict();

const resolveRequestSchema = z.object({
  action: z.enum(["accept", "reject"]),
  actor: z.string().trim().min(1),
  reason: z.string().optional(),
  assignedRoles: z.array(roleSchema).optional(),
});

const updateLifecycleSchema = z.object({
  status: lifecycleSchema,
  actor: z.string().trim().min(1),
});

const overturnSchema = z.object({
  actor: z.string().trim().min(1),
  reason: z.string().optional(),
});

const sensitiveFieldPattern = /(private.?key|seed|mnemonic|secret|keystore|wallet.*key|passphrase|xprv)/i;

function containsSensitiveFieldName(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsSensitiveFieldName);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, nestedValue]) => {
      if (sensitiveFieldPattern.test(key)) {
        return true;
      }
      return containsSensitiveFieldName(nestedValue);
    });
  }
  return false;
}

governanceRoutes.get("/pending", async (context) => {
  return context.json(await getPendingRequests());
});

governanceRoutes.get("/resolved", async (context) => {
  return context.json(await getResolvedRequests());
});

governanceRoutes.get("/audit", async (context) => {
  const parsedQuery = parseQuery(context, limitQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }

  const limit = parsedQuery.data.limit ?? 20;
  return context.json(await getAuditEvents(limit));
});

governanceRoutes.get("/owner/:ownerId/requests", async (context) => {
  const parsedParams = parseParams(context, ownerIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  return context.json(await getRequestsForOwner(parsedParams.data.ownerId));
});

governanceRoutes.get("/owner/:ownerId/audit", async (context) => {
  const parsedParams = parseParams(context, ownerIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedQuery = parseQuery(context, limitQuerySchema);
  if (!parsedQuery.success) {
    return parsedQuery.response;
  }

  const limit = parsedQuery.data.limit ?? 20;
  return context.json(await getAuditEventsForOwner(parsedParams.data.ownerId, limit));
});

governanceRoutes.post("/requests", async (context) => {
  let rawBody: unknown;
  try {
    rawBody = await context.req.json();
  } catch {
    rawBody = null;
  }

  if (containsSensitiveFieldName(rawBody)) {
    return context.json(
      {
        error:
          "Sensitive key material is not accepted by the backend. Keep wallet keys and Ed25519 private keys client-side only.",
      },
      400,
    );
  }

  const parsedBody = submitOnboardingRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return context.json({ error: "Invalid request body", issues: parsedBody.error.flatten() }, 400);
  }

  const created = await submitOnboardingRequest(parsedBody.data);
  return context.json(created, 201);
});

governanceRoutes.post("/requests/:requestId/resolve", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedBody = await parseBody(context, resolveRequestSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const result = await resolveRequest(parsedParams.data.requestId, parsedBody.data.action, parsedBody.data.actor, {
    reason: parsedBody.data.reason,
    assignedRoles: parsedBody.data.assignedRoles,
  });
  if (!result) {
    return context.json({ error: "Pending request not found" }, 404);
  }
  return context.json(result);
});

governanceRoutes.post("/requests/:requestId/lifecycle", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedBody = await parseBody(context, updateLifecycleSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const result = await updateLifecycle(parsedParams.data.requestId, parsedBody.data.status, parsedBody.data.actor);
  if (!result) {
    return context.json({ error: "Accepted request not found" }, 404);
  }
  return context.json(result);
});

governanceRoutes.post("/requests/:requestId/overturn", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedBody = await parseBody(context, overturnSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const result = await overturnAcceptedRequest(
    parsedParams.data.requestId,
    parsedBody.data.actor,
    parsedBody.data.reason ?? "",
  );
  if (!result) {
    return context.json({ error: "Accepted request not found" }, 404);
  }
  return context.json(result);
});

governanceRoutes.delete("/requests/:requestId/rejected", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const deleted = await deleteRejectedRequest(parsedParams.data.requestId);
  if (!deleted) {
    return context.json({ error: "Rejected request not found" }, 404);
  }
  return context.json({ deleted: true });
});
