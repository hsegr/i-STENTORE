import { and, desc, eq } from "drizzle-orm";
import type {
  AuditEvent,
  OnboardingRequest,
  ResolveOnboardingRequestDto,
  ResolvedRequest,
  SubmitOnboardingRequestDto,
  UpdateLifecycleStatusDto,
} from "@dataspace-onboarding/shared";
import { db } from "@/db/client";
import {
  governanceAuditEvents,
  governancePendingRequests,
  governanceResolvedRequests,
  type GovernanceAuditEventRow,
  type GovernancePendingRequestRow,
  type GovernanceResolvedRequestRow,
} from "@/db/schema";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOwnerId(value: unknown, fallback = "unknown@local"): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

function toPendingRequest(row: GovernancePendingRequestRow): OnboardingRequest {
  return {
    id: row.id,
    ownerId: normalizeOwnerId(row.ownerId, row.applicantName || "unknown@local"),
    applicantName: row.applicantName,
    organizationName: row.organizationName,
    walletAddress: row.walletAddress,
    did: row.did,
    selectedAttestators: row.selectedAttestators || [],
    submittedAt: row.submittedAt,
    tlsSetup: row.tlsSetup,
    blockchainSetup: row.blockchainSetup,
    participantProfile: row.participantProfile || undefined,
    status: "pending",
  };
}

function toResolvedRequest(row: GovernanceResolvedRequestRow): ResolvedRequest {
  return {
    id: row.id,
    ownerId: normalizeOwnerId(row.ownerId, row.applicantName || "unknown@local"),
    applicantName: row.applicantName,
    organizationName: row.organizationName,
    walletAddress: row.walletAddress,
    did: row.did,
    selectedAttestators: row.selectedAttestators || [],
    submittedAt: row.submittedAt,
    tlsSetup: row.tlsSetup,
    blockchainSetup: row.blockchainSetup,
    participantProfile: row.participantProfile || undefined,
    status: row.status,
    resolvedAt: row.resolvedAt,
    resolvedBy: row.resolvedBy,
    rejectionReason: row.rejectionReason || undefined,
    assignedRoles: row.assignedRoles || undefined,
    lifecycleStatus: row.lifecycleStatus || undefined,
  };
}

function toAuditEvent(row: GovernanceAuditEventRow): AuditEvent {
  return {
    id: row.id,
    ownerId: normalizeOwnerId(row.ownerId, row.actor || "unknown@local"),
    type: row.type,
    requestId: row.requestId,
    timestamp: row.timestamp,
    actor: row.actor,
    details: row.details,
  };
}

export async function getPendingRequests(): Promise<OnboardingRequest[]> {
  const rows = await db.select().from(governancePendingRequests).orderBy(desc(governancePendingRequests.submittedAt));
  return rows.map(toPendingRequest);
}

export async function getResolvedRequests(): Promise<ResolvedRequest[]> {
  const rows = await db.select().from(governanceResolvedRequests).orderBy(desc(governanceResolvedRequests.resolvedAt));
  return rows.map(toResolvedRequest);
}

export async function getAuditEvents(limit = 20): Promise<AuditEvent[]> {
  const rows = await db
    .select()
    .from(governanceAuditEvents)
    .orderBy(desc(governanceAuditEvents.timestamp))
    .limit(limit);
  return rows.map(toAuditEvent);
}

export async function getRequestsForOwner(ownerId: string): Promise<{
  pending: OnboardingRequest[];
  resolved: ResolvedRequest[];
}> {
  const [pendingRows, resolvedRows] = await Promise.all([
    db
      .select()
      .from(governancePendingRequests)
      .where(eq(governancePendingRequests.ownerId, ownerId))
      .orderBy(desc(governancePendingRequests.submittedAt)),
    db
      .select()
      .from(governanceResolvedRequests)
      .where(eq(governanceResolvedRequests.ownerId, ownerId))
      .orderBy(desc(governanceResolvedRequests.resolvedAt)),
  ]);

  return {
    pending: pendingRows.map(toPendingRequest),
    resolved: resolvedRows.map(toResolvedRequest),
  };
}

export async function getAuditEventsForOwner(ownerId: string, limit = 20): Promise<AuditEvent[]> {
  const rows = await db
    .select()
    .from(governanceAuditEvents)
    .where(eq(governanceAuditEvents.ownerId, ownerId))
    .orderBy(desc(governanceAuditEvents.timestamp))
    .limit(limit);
  return rows.map(toAuditEvent);
}

export async function submitOnboardingRequest(input: SubmitOnboardingRequestDto): Promise<OnboardingRequest> {
  const request: OnboardingRequest = {
    ...input,
    id: createId("req"),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };

  await db.transaction(async (transaction) => {
    await transaction.insert(governancePendingRequests).values({
      id: request.id,
      ownerId: request.ownerId,
      applicantName: request.applicantName,
      organizationName: request.organizationName,
      walletAddress: request.walletAddress,
      did: request.did,
      selectedAttestators: request.selectedAttestators,
      submittedAt: request.submittedAt,
      tlsSetup: request.tlsSetup,
      blockchainSetup: request.blockchainSetup,
      participantProfile: request.participantProfile ?? null,
      status: "pending",
    });

    await transaction.insert(governanceAuditEvents).values({
      id: createId("evt"),
      ownerId: request.ownerId,
      type: "request_submitted",
      requestId: request.id,
      timestamp: new Date().toISOString(),
      actor: input.applicantName,
      details: `Submitted onboarding request for ${input.organizationName}`,
    });
  });

  return request;
}

export async function resolveRequest(
  requestId: string,
  action: ResolveOnboardingRequestDto["action"],
  actor: ResolveOnboardingRequestDto["actor"],
  options?: Pick<ResolveOnboardingRequestDto, "reason" | "assignedRoles">,
): Promise<ResolvedRequest | null> {
  return db.transaction(async (transaction) => {
    const pendingRow = (
      await transaction
        .select()
        .from(governancePendingRequests)
        .where(eq(governancePendingRequests.id, requestId))
        .limit(1)
    )[0];
    if (!pendingRow) {
      return null;
    }

    await transaction.delete(governancePendingRequests).where(eq(governancePendingRequests.id, requestId));

    const resolvedRequest: ResolvedRequest = {
      ...toPendingRequest(pendingRow),
      status: action === "accept" ? "accepted" : "rejected",
      resolvedAt: new Date().toISOString(),
      resolvedBy: actor,
      rejectionReason: action === "reject" ? options?.reason : undefined,
      assignedRoles: action === "accept" ? (options?.assignedRoles ?? ["participant"]) : undefined,
      lifecycleStatus: action === "accept" ? "active" : undefined,
    };

    await transaction.insert(governanceResolvedRequests).values({
      id: resolvedRequest.id,
      ownerId: resolvedRequest.ownerId,
      applicantName: resolvedRequest.applicantName,
      organizationName: resolvedRequest.organizationName,
      walletAddress: resolvedRequest.walletAddress,
      did: resolvedRequest.did,
      selectedAttestators: resolvedRequest.selectedAttestators,
      submittedAt: resolvedRequest.submittedAt,
      tlsSetup: resolvedRequest.tlsSetup,
      blockchainSetup: resolvedRequest.blockchainSetup,
      participantProfile: resolvedRequest.participantProfile ?? null,
      status: resolvedRequest.status,
      resolvedAt: resolvedRequest.resolvedAt,
      resolvedBy: resolvedRequest.resolvedBy,
      rejectionReason: resolvedRequest.rejectionReason ?? null,
      assignedRoles: resolvedRequest.assignedRoles ?? null,
      lifecycleStatus: resolvedRequest.lifecycleStatus ?? null,
    });

    await transaction.insert(governanceAuditEvents).values({
      id: createId("evt"),
      ownerId: resolvedRequest.ownerId,
      type: action === "accept" ? "request_accepted" : "request_rejected",
      requestId,
      timestamp: new Date().toISOString(),
      actor,
      details:
        action === "accept"
          ? `Accepted with roles: ${(resolvedRequest.assignedRoles ?? []).join(", ")}`
          : `Rejected with reason: ${options?.reason ?? "No reason provided"}`,
    });

    return resolvedRequest;
  });
}

export async function updateLifecycle(
  requestId: string,
  status: UpdateLifecycleStatusDto["status"],
  actor: UpdateLifecycleStatusDto["actor"],
): Promise<ResolvedRequest | null> {
  return db.transaction(async (transaction) => {
    const resolvedRow = (
      await transaction
        .select()
        .from(governanceResolvedRequests)
        .where(and(eq(governanceResolvedRequests.id, requestId), eq(governanceResolvedRequests.status, "accepted")))
        .limit(1)
    )[0];
    if (!resolvedRow) {
      return null;
    }

    await transaction
      .update(governanceResolvedRequests)
      .set({ lifecycleStatus: status })
      .where(eq(governanceResolvedRequests.id, requestId));

    await transaction.insert(governanceAuditEvents).values({
      id: createId("evt"),
      ownerId: resolvedRow.ownerId,
      type: status === "renewed" ? "lifecycle_renewed" : "lifecycle_revoked",
      requestId,
      timestamp: new Date().toISOString(),
      actor,
      details: `${status === "renewed" ? "Renewed" : "Revoked"} participant lifecycle state`,
    });

    return {
      ...toResolvedRequest(resolvedRow),
      lifecycleStatus: status,
    };
  });
}

export async function overturnAcceptedRequest(
  requestId: string,
  actor: string,
  reason: string,
): Promise<ResolvedRequest | null> {
  return db.transaction(async (transaction) => {
    const resolvedRow = (
      await transaction
        .select()
        .from(governanceResolvedRequests)
        .where(and(eq(governanceResolvedRequests.id, requestId), eq(governanceResolvedRequests.status, "accepted")))
        .limit(1)
    )[0];
    if (!resolvedRow) {
      return null;
    }

    const now = new Date().toISOString();
    const rejectionReason = reason.trim() || "Accepted request overturned due to policy violation.";

    await transaction
      .update(governanceResolvedRequests)
      .set({
        status: "rejected",
        resolvedAt: now,
        resolvedBy: actor,
        rejectionReason,
        assignedRoles: null,
        lifecycleStatus: null,
      })
      .where(eq(governanceResolvedRequests.id, requestId));

    await transaction.insert(governanceAuditEvents).values({
      id: createId("evt"),
      ownerId: resolvedRow.ownerId,
      type: "request_rejected",
      requestId,
      timestamp: now,
      actor,
      details: `Overturned accepted request. Reason: ${rejectionReason}`,
    });

    return {
      ...toResolvedRequest(resolvedRow),
      status: "rejected",
      resolvedAt: now,
      resolvedBy: actor,
      rejectionReason,
      assignedRoles: undefined,
      lifecycleStatus: undefined,
    };
  });
}

export async function deleteRejectedRequest(requestId: string): Promise<boolean> {
  return db.transaction(async (transaction) => {
    const existingRow = (
      await transaction
        .select({ id: governanceResolvedRequests.id })
        .from(governanceResolvedRequests)
        .where(and(eq(governanceResolvedRequests.id, requestId), eq(governanceResolvedRequests.status, "rejected")))
        .limit(1)
    )[0];
    if (!existingRow) {
      return false;
    }

    await transaction.delete(governanceResolvedRequests).where(eq(governanceResolvedRequests.id, requestId));
    await transaction.delete(governanceAuditEvents).where(eq(governanceAuditEvents.requestId, requestId));
    return true;
  });
}
