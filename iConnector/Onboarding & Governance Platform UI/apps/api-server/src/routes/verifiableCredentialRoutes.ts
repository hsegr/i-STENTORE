import { Hono } from "hono";
import { z } from "zod";
import type { IssueVcDirectDto, SubmitVcRequestDto } from "@dataspace-onboarding/shared";
import {
  deleteCredentialForHolder,
  deleteRevokedCredential,
  downloadCredentialForHolder,
  getAllIssuedCredentials,
  getIssuedCredentialsForHolder,
  getPendingVcRequests,
  getSigningPayloadForRequest,
  getTrustedIssuerDirectory,
  getTrustedIssuers,
  getVcRequestsForRequester,
  issueVcDirect,
  issueVcFromRequest,
  rejectVcRequest,
  revokeIssuedCredential,
  submitVcRequest,
  verifyPresentedCredential,
} from "@/services/verifiableCredentialsService";
import { parseBody, parseParams } from "./validation";

export const verifiableCredentialRoutes = new Hono();

const requesterIdParamSchema = z.object({
  requesterId: z.string().trim().min(1),
});

const holderIdParamSchema = z.object({
  holderId: z.string().trim().min(1),
});

const credentialIdParamSchema = z.object({
  credentialId: z.string().trim().min(1),
});

const requestIdParamSchema = z.object({
  requestId: z.string().trim().min(1),
});

const deleteCredentialForHolderParamsSchema = z.object({
  credentialId: z.string().trim().min(1),
  holderId: z.string().trim().min(1),
});

const submitVcRequestSchema = z.object({
  requesterId: z.string().trim().min(1),
  requesterOrganizationName: z.string().trim().optional(),
  holderDid: z.string().trim().min(1),
  requestedIssuerId: z.string().trim().min(1),
  credentialType: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  requestedClaims: z.record(z.string(), z.string()),
  unsignedCredential: z.unknown().optional(),
});

const signedCredentialObjectSchema = z.object({
  id: z.string().trim().min(1),
  participantContextId: z.string().trim().min(1),
  timestamp: z.number(),
  issuerId: z.string().trim().min(1),
  holderId: z.string().trim().min(1),
  state: z.number(),
  issuancePolicy: z.null(),
  reissuancePolicy: z.null(),
  verifiableCredential: z.object({
    format: z.literal("VC1_0_JWT"),
    rawVc: z.string().trim().min(1),
    credential: z.object({
      credentialSubject: z.array(
        z.object({
          claims: z.record(z.string(), z.unknown()).and(
            z.object({
              id: z.string().trim().min(1),
            }),
          ),
        }),
      ),
      id: z.string().optional(),
      type: z.array(z.string().trim().min(1)).min(1),
      issuer: z.object({
        id: z.string().trim().min(1),
        additionalProperties: z.record(z.string(), z.unknown()),
      }),
      issuanceDate: z.number(),
      expirationDate: z.number().nullable(),
      credentialStatus: z.null(),
      description: z.null(),
      name: z.null(),
    }),
  }),
});

const issueFromRequestSchema = z.object({
  adminId: z.string().trim().min(1),
  issuerId: z.string().trim().min(1),
  issuerOrganizationName: z.string().trim().optional(),
  rawVcJwt: z.string().trim().min(1),
  signedCredentialObject: signedCredentialObjectSchema,
});

const rejectRequestSchema = z.object({
  adminId: z.string().trim().min(1),
  reason: z.string().trim().min(1),
});

const issueDirectSchema = z.object({
  adminId: z.string().trim().min(1),
  holderId: z.string().trim().min(1),
  holderOrganizationName: z.string().trim().optional(),
  holderDid: z.string().trim().min(1),
  issuerId: z.string().trim().min(1),
  issuerOrganizationName: z.string().trim().optional(),
  credentialType: z.string().trim().min(1),
  rawVcJwt: z.string().trim().min(1),
  signedCredentialObject: signedCredentialObjectSchema,
});

const revokeCredentialSchema = z.object({
  adminId: z.string().trim().min(1),
  reason: z.string().trim().optional(),
});

verifiableCredentialRoutes.get("/trusted-issuers", (context) => {
  return context.json(getTrustedIssuers());
});

verifiableCredentialRoutes.get("/trusted-issuers/directory", (context) => {
  return context.json(getTrustedIssuerDirectory());
});

verifiableCredentialRoutes.get("/requests/pending", async (context) => {
  return context.json(await getPendingVcRequests());
});

verifiableCredentialRoutes.get("/requests/requester/:requesterId", async (context) => {
  const parsedParams = parseParams(context, requesterIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }
  return context.json(await getVcRequestsForRequester(parsedParams.data.requesterId));
});

verifiableCredentialRoutes.post("/requests", async (context) => {
  const parsedBody = await parseBody(context, submitVcRequestSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const created = await submitVcRequest(parsedBody.data as SubmitVcRequestDto);
  return context.json(created, 201);
});

verifiableCredentialRoutes.get("/requests/:requestId/signing-payload", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const payload = await getSigningPayloadForRequest(parsedParams.data.requestId);
  if (!payload) {
    return context.json({ error: "Pending VC request not found" }, 404);
  }
  return context.json(payload);
});

verifiableCredentialRoutes.post("/requests/:requestId/issue", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedBody = await parseBody(context, issueFromRequestSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const issued = await issueVcFromRequest({
    ...parsedBody.data,
    requestId: parsedParams.data.requestId,
  });
  if (!issued) {
    return context.json({ error: "Pending VC request not found" }, 404);
  }
  return context.json(issued);
});

verifiableCredentialRoutes.post("/requests/:requestId/reject", async (context) => {
  const parsedParams = parseParams(context, requestIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedBody = await parseBody(context, rejectRequestSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const rejected = await rejectVcRequest(parsedParams.data.requestId, parsedBody.data.adminId, parsedBody.data.reason);
  if (!rejected) {
    return context.json({ error: "Pending VC request not found" }, 404);
  }
  return context.json(rejected);
});

verifiableCredentialRoutes.get("/credentials", async (context) => {
  return context.json(await getAllIssuedCredentials());
});

verifiableCredentialRoutes.get("/credentials/holder/:holderId", async (context) => {
  const parsedParams = parseParams(context, holderIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }
  return context.json(await getIssuedCredentialsForHolder(parsedParams.data.holderId));
});

verifiableCredentialRoutes.get("/credentials/:credentialId/download/holder/:holderId", async (context) => {
  const parsedParams = parseParams(context, deleteCredentialForHolderParamsSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const download = await downloadCredentialForHolder(parsedParams.data.credentialId, parsedParams.data.holderId);
  if (!download) {
    return context.json({ error: "Credential delivery not available for holder" }, 404);
  }
  return context.json(download);
});

verifiableCredentialRoutes.post("/credentials/issue-direct", async (context) => {
  const parsedBody = await parseBody(context, issueDirectSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const issued = await issueVcDirect(parsedBody.data as IssueVcDirectDto);
  return context.json(issued, 201);
});

verifiableCredentialRoutes.post("/credentials/:credentialId/revoke", async (context) => {
  const parsedParams = parseParams(context, credentialIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const parsedBody = await parseBody(context, revokeCredentialSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }

  const revoked = await revokeIssuedCredential(
    parsedParams.data.credentialId,
    parsedBody.data.adminId,
    parsedBody.data.reason ?? "",
  );
  if (!revoked) {
    return context.json({ error: "Credential not found" }, 404);
  }
  return context.json(revoked);
});

verifiableCredentialRoutes.delete("/credentials/:credentialId/holder/:holderId", async (context) => {
  const parsedParams = parseParams(context, deleteCredentialForHolderParamsSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const deleted = await deleteCredentialForHolder(parsedParams.data.credentialId, parsedParams.data.holderId);
  if (!deleted) {
    return context.json({ error: "Credential not found for holder" }, 404);
  }
  return context.json({ deleted: true });
});

verifiableCredentialRoutes.delete("/credentials/:credentialId/revoked", async (context) => {
  const parsedParams = parseParams(context, credentialIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }

  const deleted = await deleteRevokedCredential(parsedParams.data.credentialId);
  if (!deleted) {
    return context.json({ error: "Revoked credential not found" }, 404);
  }
  return context.json({ deleted: true });
});

verifiableCredentialRoutes.get("/credentials/:credentialId/verify", async (context) => {
  const parsedParams = parseParams(context, credentialIdParamSchema);
  if (!parsedParams.success) {
    return parsedParams.response;
  }
  return context.json(await verifyPresentedCredential(parsedParams.data.credentialId));
});
