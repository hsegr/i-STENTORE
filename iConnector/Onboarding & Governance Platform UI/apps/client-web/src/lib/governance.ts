import type {
  OnboardingRequest,
  ResolvedRequest,
  AuditEvent,
  SubmitOnboardingRequestDto,
  ResolveOnboardingRequestDto,
  UpdateLifecycleStatusDto,
} from "@dataspace-onboarding/shared";

interface GovernanceState {
  pending: OnboardingRequest[];
  resolved: ResolvedRequest[];
  audit: AuditEvent[];
}

const STORAGE_KEY = "wf.governance.state.v1";

const initialPending: OnboardingRequest[] = [];

const initialResolved: ResolvedRequest[] = [];

const initialAudit: AuditEvent[] = [];

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOwnerId(value: unknown, fallback = "unknown@local"): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

function normalizeState(state: GovernanceState): GovernanceState {
  const pending = state.pending.map((request) => ({
    ...request,
    ownerId: normalizeOwnerId(
      (request as Partial<OnboardingRequest>).ownerId,
      request.applicantName || "unknown@local",
    ),
  }));

  const resolved = state.resolved.map((request) => ({
    ...request,
    ownerId: normalizeOwnerId((request as Partial<ResolvedRequest>).ownerId, request.applicantName || "unknown@local"),
  }));

  const ownerByRequestId = new Map<string, string>([
    ...pending.map((request) => [request.id, request.ownerId] as [string, string]),
    ...resolved.map((request) => [request.id, request.ownerId] as [string, string]),
  ]);

  const audit = state.audit.map((event) => ({
    ...event,
    ownerId: normalizeOwnerId(
      (event as Partial<AuditEvent>).ownerId,
      ownerByRequestId.get(event.requestId) || event.actor || "unknown@local",
    ),
  }));

  return { pending, resolved, audit };
}

function loadState(): GovernanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { pending: initialPending, resolved: initialResolved, audit: initialAudit };
    }
    return normalizeState(JSON.parse(raw) as GovernanceState);
  } catch {
    return { pending: initialPending, resolved: initialResolved, audit: initialAudit };
  }
}

function saveState(state: GovernanceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getPendingRequests(): OnboardingRequest[] {
  return loadState().pending;
}

export function getResolvedRequests(): ResolvedRequest[] {
  return loadState().resolved;
}

export function getAuditEvents(limit = 20): AuditEvent[] {
  return loadState()
    .audit.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getRequestsForOwner(ownerId: string): {
  pending: OnboardingRequest[];
  resolved: ResolvedRequest[];
} {
  const state = loadState();
  return {
    pending: state.pending.filter((request) => request.ownerId === ownerId),
    resolved: state.resolved.filter((request) => request.ownerId === ownerId),
  };
}

export function getAuditEventsForOwner(ownerId: string, limit = 20): AuditEvent[] {
  return loadState()
    .audit.filter((event) => event.ownerId === ownerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function submitOnboardingRequest(input: SubmitOnboardingRequestDto): OnboardingRequest {
  const state = loadState();
  const request: OnboardingRequest = {
    ...input,
    id: createId("req"),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };

  state.pending = [request, ...state.pending];
  state.audit = [
    {
      id: createId("evt"),
      ownerId: request.ownerId,
      type: "request_submitted",
      requestId: request.id,
      timestamp: new Date().toISOString(),
      actor: input.applicantName,
      details: `Submitted onboarding request for ${input.organizationName}`,
    },
    ...state.audit,
  ];

  saveState(state);
  return request;
}

export function resolveRequest(
  requestId: string,
  action: ResolveOnboardingRequestDto["action"],
  actor: ResolveOnboardingRequestDto["actor"],
  options?: Pick<ResolveOnboardingRequestDto, "reason" | "assignedRoles">,
): ResolvedRequest | null {
  const state = loadState();
  const request = state.pending.find((r) => r.id === requestId);
  if (!request) {
    return null;
  }

  state.pending = state.pending.filter((r) => r.id !== requestId);

  const resolved: ResolvedRequest = {
    ...request,
    status: action === "accept" ? "accepted" : "rejected",
    resolvedAt: new Date().toISOString(),
    resolvedBy: actor,
    rejectionReason: action === "reject" ? options?.reason : undefined,
    assignedRoles: action === "accept" ? (options?.assignedRoles ?? ["participant"]) : undefined,
    lifecycleStatus: action === "accept" ? "active" : undefined,
  };

  state.resolved = [resolved, ...state.resolved];
  state.audit = [
    {
      id: createId("evt"),
      ownerId: request.ownerId,
      type: action === "accept" ? "request_accepted" : "request_rejected",
      requestId: requestId,
      timestamp: new Date().toISOString(),
      actor,
      details:
        action === "accept"
          ? `Accepted with roles: ${(resolved.assignedRoles ?? []).join(", ")}`
          : `Rejected with reason: ${options?.reason ?? "No reason provided"}`,
    },
    ...state.audit,
  ];

  saveState(state);
  return resolved;
}

export function updateLifecycle(
  requestId: string,
  status: UpdateLifecycleStatusDto["status"],
  actor: UpdateLifecycleStatusDto["actor"],
): ResolvedRequest | null {
  const state = loadState();
  const index = state.resolved.findIndex((r) => r.id === requestId && r.status === "accepted");
  if (index === -1) {
    return null;
  }

  const updated = {
    ...state.resolved[index],
    lifecycleStatus: status,
  } as ResolvedRequest;

  state.resolved[index] = updated;
  state.audit = [
    {
      id: createId("evt"),
      ownerId: updated.ownerId,
      type: status === "renewed" ? "lifecycle_renewed" : "lifecycle_revoked",
      requestId,
      timestamp: new Date().toISOString(),
      actor,
      details: `${status === "renewed" ? "Renewed" : "Revoked"} participant lifecycle state`,
    },
    ...state.audit,
  ];

  saveState(state);
  return updated;
}

export function overturnAcceptedRequest(requestId: string, actor: string, reason: string): ResolvedRequest | null {
  const state = loadState();
  const index = state.resolved.findIndex((request) => request.id === requestId && request.status === "accepted");
  if (index === -1) {
    return null;
  }

  const now = new Date().toISOString();
  const existing = state.resolved[index];
  const resolved: ResolvedRequest = {
    ...existing,
    status: "rejected",
    resolvedAt: now,
    resolvedBy: actor,
    rejectionReason: reason.trim() || "Accepted request overturned due to policy violation.",
    assignedRoles: undefined,
    lifecycleStatus: undefined,
  };

  state.resolved[index] = resolved;
  state.audit = [
    {
      id: createId("evt"),
      ownerId: resolved.ownerId,
      type: "request_rejected",
      requestId,
      timestamp: now,
      actor,
      details: `Overturned accepted request. Reason: ${resolved.rejectionReason}`,
    },
    ...state.audit,
  ];

  saveState(state);
  return resolved;
}

export function deleteRejectedRequest(requestId: string): boolean {
  const state = loadState();
  const existing = state.resolved.find((request) => request.id === requestId);
  if (!existing || existing.status !== "rejected") {
    return false;
  }

  const beforeResolvedCount = state.resolved.length;
  state.resolved = state.resolved.filter((request) => request.id !== requestId);
  state.audit = state.audit.filter((event) => event.requestId !== requestId);

  const deleted = state.resolved.length < beforeResolvedCount;
  if (deleted) {
    saveState(state);
  }
  return deleted;
}

export function deleteRequestForOwner(requestId: string, ownerId: string): boolean {
  const state = loadState();
  const pendingMatch = state.pending.find((request) => request.id === requestId && request.ownerId === ownerId);
  const resolvedMatch = state.resolved.find((request) => request.id === requestId && request.ownerId === ownerId);
  if (!pendingMatch && !resolvedMatch) {
    return false;
  }

  const pendingBefore = state.pending.length;
  const resolvedBefore = state.resolved.length;
  state.pending = state.pending.filter((request) => !(request.id === requestId && request.ownerId === ownerId));
  state.resolved = state.resolved.filter((request) => !(request.id === requestId && request.ownerId === ownerId));
  state.audit = state.audit.filter((event) => event.requestId !== requestId);

  const deleted = state.pending.length < pendingBefore || state.resolved.length < resolvedBefore;
  if (deleted) {
    saveState(state);
  }
  return deleted;
}

export function clearRequestsForOwner(ownerId: string): number {
  const state = loadState();
  const requestIds = new Set<string>([
    ...state.pending.filter((request) => request.ownerId === ownerId).map((request) => request.id),
    ...state.resolved.filter((request) => request.ownerId === ownerId).map((request) => request.id),
  ]);
  if (requestIds.size === 0) {
    return 0;
  }

  const pendingBefore = state.pending.length;
  const resolvedBefore = state.resolved.length;
  state.pending = state.pending.filter((request) => request.ownerId !== ownerId);
  state.resolved = state.resolved.filter((request) => request.ownerId !== ownerId);
  state.audit = state.audit.filter((event) => !requestIds.has(event.requestId));

  const removedCount = pendingBefore - state.pending.length + (resolvedBefore - state.resolved.length);
  if (removedCount > 0) {
    saveState(state);
  }
  return removedCount;
}

export function deleteAuditEventForOwner(eventId: string, ownerId: string): boolean {
  const state = loadState();
  const beforeCount = state.audit.length;
  state.audit = state.audit.filter((event) => !(event.id === eventId && event.ownerId === ownerId));

  const deleted = state.audit.length < beforeCount;
  if (deleted) {
    saveState(state);
  }
  return deleted;
}

export function clearAuditTrailForOwner(ownerId: string): number {
  const state = loadState();
  const beforeCount = state.audit.length;
  state.audit = state.audit.filter((event) => event.ownerId !== ownerId);
  const removedCount = beforeCount - state.audit.length;

  if (removedCount > 0) {
    saveState(state);
  }
  return removedCount;
}

export function deleteAuditEvent(eventId: string): boolean {
  const state = loadState();
  const beforeCount = state.audit.length;
  state.audit = state.audit.filter((event) => event.id !== eventId);

  const deleted = state.audit.length < beforeCount;
  if (deleted) {
    saveState(state);
  }
  return deleted;
}
