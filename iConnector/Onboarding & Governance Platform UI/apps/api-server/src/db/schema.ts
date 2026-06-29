import { sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type {
  AuditEvent,
  EncryptedPayload,
  GovernanceRole,
  IntendedParticipationRole,
  LifecycleStatus,
  ParticipantProfile,
  RequestStatus,
  VerifiableCredentialFormat,
  VerifiableCredentialLifecycleStatus,
  VerifiableCredentialRequestStatus,
  VerifiableCredentialRequestSource,
} from "@dataspace-onboarding/shared";

export const governancePendingRequests = pgTable("governance_pending_requests", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  applicantName: text("applicant_name").notNull(),
  organizationName: text("organization_name").notNull(),
  walletAddress: text("wallet_address").notNull(),
  did: text("did").notNull(),
  selectedAttestators: jsonb("selected_attestators").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  submittedAt: text("submitted_at").notNull(),
  tlsSetup: boolean("tls_setup").notNull(),
  blockchainSetup: boolean("blockchain_setup").notNull(),
  participantProfile: jsonb("participant_profile").$type<ParticipantProfile | null>(),
  status: text("status").$type<Extract<RequestStatus, "pending">>().notNull().default("pending"),
});

export const governanceResolvedRequests = pgTable("governance_resolved_requests", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  applicantName: text("applicant_name").notNull(),
  organizationName: text("organization_name").notNull(),
  walletAddress: text("wallet_address").notNull(),
  did: text("did").notNull(),
  selectedAttestators: jsonb("selected_attestators").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  submittedAt: text("submitted_at").notNull(),
  tlsSetup: boolean("tls_setup").notNull(),
  blockchainSetup: boolean("blockchain_setup").notNull(),
  participantProfile: jsonb("participant_profile").$type<ParticipantProfile | null>(),
  status: text("status").$type<Extract<RequestStatus, "accepted" | "rejected">>().notNull(),
  resolvedAt: text("resolved_at").notNull(),
  resolvedBy: text("resolved_by").notNull(),
  rejectionReason: text("rejection_reason"),
  assignedRoles: jsonb("assigned_roles").$type<GovernanceRole[] | null>(),
  lifecycleStatus: text("lifecycle_status").$type<LifecycleStatus | null>(),
});

export const governanceAuditEvents = pgTable("governance_audit_events", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  type: text("type").$type<AuditEvent["type"]>().notNull(),
  requestId: text("request_id").notNull(),
  timestamp: text("timestamp").notNull(),
  actor: text("actor").notNull(),
  details: text("details").notNull(),
});

export const vcRequests = pgTable("vc_requests", {
  id: text("id").primaryKey(),
  requesterId: text("requester_id").notNull(),
  requesterOrganizationName: text("requester_organization_name"),
  holderDid: text("holder_did").notNull(),
  requestedIssuerId: text("requested_issuer_id").notNull(),
  requestedIssuerOrganizationName: text("requested_issuer_organization_name"),
  credentialType: text("credential_type").notNull(),
  purpose: text("purpose").notNull(),
  requestedClaims: jsonb("requested_claims").$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),
  requestedClaimKeys: jsonb("requested_claim_keys").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  requestSource: text("request_source").$type<VerifiableCredentialRequestSource>().notNull().default("claims"),
  unsignedCredentialId: text("unsigned_credential_id"),
  unsignedCredentialTypes: jsonb("unsigned_credential_types").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  pendingPayloadAvailable: boolean("pending_payload_available").notNull().default(true),
  encryptedUnsignedPayload: jsonb("encrypted_unsigned_payload").$type<EncryptedPayload | null>(),
  status: text("status").$type<VerifiableCredentialRequestStatus>().notNull(),
  requestedAt: text("requested_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  handledBy: text("handled_by"),
  decisionNote: text("decision_note"),
  issuedCredentialId: text("issued_credential_id"),
});

export const vcCredentials = pgTable("vc_credentials", {
  id: text("id").primaryKey(),
  holderId: text("holder_id").notNull(),
  holderOrganizationName: text("holder_organization_name"),
  holderDid: text("holder_did").notNull(),
  issuerId: text("issuer_id").notNull(),
  issuerOrganizationName: text("issuer_organization_name"),
  credentialType: text("credential_type").notNull(),
  issuanceDate: text("issuance_date").notNull(),
  expirationDate: text("expiration_date"),
  format: text("format").$type<VerifiableCredentialFormat>().notNull(),
  rawVcJwt: text("raw_vc_jwt").notNull(),
  contextValues: jsonb("context_values").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  typeValues: jsonb("type_values").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  credentialSubject: jsonb("credential_subject").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  source: text("source").$type<"request" | "direct">().notNull(),
  linkedRequestId: text("linked_request_id"),
  deliveryAvailable: boolean("delivery_available").notNull().default(true),
  downloadedAt: text("downloaded_at"),
  encryptedSignedPayload: jsonb("encrypted_signed_payload").$type<EncryptedPayload | null>(),
  status: text("status").$type<VerifiableCredentialLifecycleStatus>().notNull(),
  revokedAt: text("revoked_at"),
  revokedBy: text("revoked_by"),
  revocationReason: text("revocation_reason"),
});

export type GovernancePendingRequestRow = typeof governancePendingRequests.$inferSelect;
export type GovernanceResolvedRequestRow = typeof governanceResolvedRequests.$inferSelect;
export type GovernanceAuditEventRow = typeof governanceAuditEvents.$inferSelect;
export type VcRequestRow = typeof vcRequests.$inferSelect;
export type VcCredentialRow = typeof vcCredentials.$inferSelect;

export type ParticipantProfileDraft = {
  organizationName: string;
  intendedParticipation: IntendedParticipationRole | null;
  businessPurpose: string;
  contactEmail?: string;
  website?: string;
  country?: string;
  additionalInformation?: string;
};
