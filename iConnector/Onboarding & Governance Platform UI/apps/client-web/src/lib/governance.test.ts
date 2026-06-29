import { beforeEach, describe, expect, it } from "vite-plus/test";
import {
  clearRequestsForOwner,
  getAuditEvents,
  getRequestsForOwner,
  resolveRequest,
  submitOnboardingRequest,
  updateLifecycle,
} from "@/lib/governance";
import type { SubmitOnboardingRequestDto } from "@dataspace-onboarding/shared";

const ownerId = "participant@example.test";

function installLocalStorageMock() {
  const store = new Map<string, string>();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
}

function makeRequestInput(overrides: Partial<SubmitOnboardingRequestDto> = {}): SubmitOnboardingRequestDto {
  return {
    ownerId,
    applicantName: "Participant Test User",
    organizationName: "Acme Data Services",
    walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    did: "did:indy:besu:wf:0xabcdef1234567890abcdef1234567890abcdef12",
    selectedAttestators: ["attestator-1"],
    tlsSetup: true,
    blockchainSetup: true,
    participantProfile: {
      organizationName: "Acme Data Services",
      intendedParticipation: "provider",
      businessPurpose: "Publish mobility data products.",
    },
    ...overrides,
  };
}

describe("governance storage", () => {
  beforeEach(() => {
    installLocalStorageMock();
    localStorage.clear();
  });

  it("submits onboarding requests scoped to the owner", () => {
    const request = submitOnboardingRequest(makeRequestInput());

    expect(request.status).toBe("pending");
    expect(request.id).toMatch(/^req-/);
    expect(getRequestsForOwner(ownerId).pending).toHaveLength(1);
    expect(getRequestsForOwner("someone-else@example.test").pending).toHaveLength(0);
    expect(getAuditEvents()).toEqual([
      expect.objectContaining({
        ownerId,
        type: "request_submitted",
        requestId: request.id,
      }),
    ]);
  });

  it("resolves requests and records lifecycle changes", () => {
    const request = submitOnboardingRequest(makeRequestInput());
    const resolved = resolveRequest(request.id, "accept", "admin@example.test", {
      assignedRoles: ["participant", "provider"],
    });

    expect(resolved).toEqual(
      expect.objectContaining({
        status: "accepted",
        lifecycleStatus: "active",
        assignedRoles: ["participant", "provider"],
      }),
    );
    expect(getRequestsForOwner(ownerId).pending).toHaveLength(0);
    expect(getRequestsForOwner(ownerId).resolved).toHaveLength(1);

    const renewed = updateLifecycle(request.id, "renewed", "admin@example.test");

    expect(renewed?.lifecycleStatus).toBe("renewed");
    expect(getAuditEvents().map((event) => event.type)).toEqual([
      "lifecycle_renewed",
      "request_accepted",
      "request_submitted",
    ]);
  });

  it("clears only requests owned by the requested owner", () => {
    submitOnboardingRequest(makeRequestInput());
    submitOnboardingRequest(makeRequestInput({ ownerId: "other@example.test" }));

    expect(clearRequestsForOwner(ownerId)).toBe(1);
    expect(getRequestsForOwner(ownerId).pending).toHaveLength(0);
    expect(getRequestsForOwner("other@example.test").pending).toHaveLength(1);
  });
});
