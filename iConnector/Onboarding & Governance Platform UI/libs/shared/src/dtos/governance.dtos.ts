import type { GovernanceRole, IntendedParticipationRole, LifecycleStatus } from "@/types/governance.types";

export interface SubmitOnboardingRequestDto {
  ownerId: string;
  applicantName: string;
  organizationName: string;
  walletAddress: string;
  did: string;
  selectedAttestators: string[];
  tlsSetup: boolean;
  blockchainSetup: boolean;
  participantProfile?: {
    organizationName: string;
    intendedParticipation: IntendedParticipationRole | null;
    businessPurpose: string;
    contactEmail?: string;
    website?: string;
    country?: string;
    additionalInformation?: string;
  };
}

export interface ResolveOnboardingRequestDto {
  action: "accept" | "reject";
  actor: string;
  reason?: string;
  assignedRoles?: GovernanceRole[];
}

export interface UpdateLifecycleStatusDto {
  status: Extract<LifecycleStatus, "renewed" | "revoked">;
  actor: string;
}
