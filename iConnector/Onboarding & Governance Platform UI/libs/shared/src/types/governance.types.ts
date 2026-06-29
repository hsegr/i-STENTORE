export type GovernanceRole = "participant" | "consumer" | "provider" | "prosumer" | "observer";
export type RequestStatus = "pending" | "accepted" | "rejected";
export type LifecycleStatus = "active" | "renewed" | "revoked";
export type IntendedParticipationRole = "provider" | "consumer" | "prosumer";

export interface ParticipantProfile {
  organizationName: string;
  intendedParticipation: IntendedParticipationRole | null;
  businessPurpose: string;
  contactEmail?: string;
  website?: string;
  country?: string;
  additionalInformation?: string;
}

export interface OnboardingRequest {
  id: string;
  ownerId: string;
  applicantName: string;
  organizationName: string;
  walletAddress: string;
  did: string;
  selectedAttestators: string[];
  submittedAt: string;
  tlsSetup: boolean;
  blockchainSetup: boolean;
  participantProfile?: ParticipantProfile;
  status: "pending";
}

export interface ResolvedRequest extends Omit<OnboardingRequest, "status"> {
  status: "accepted" | "rejected";
  resolvedAt: string;
  resolvedBy: string;
  rejectionReason?: string;
  assignedRoles?: GovernanceRole[];
  lifecycleStatus?: LifecycleStatus;
}

export interface AuditEvent {
  id: string;
  ownerId: string;
  type: "request_submitted" | "request_accepted" | "request_rejected" | "lifecycle_renewed" | "lifecycle_revoked";
  requestId: string;
  timestamp: string;
  actor: string;
  details: string;
}
