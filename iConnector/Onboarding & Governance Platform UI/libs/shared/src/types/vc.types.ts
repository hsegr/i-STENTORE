export type VerifiableCredentialRequestStatus = "pending" | "issued" | "rejected";
export type VerifiableCredentialFormat = "VC1_0_JWT" | "VC2_0_JWT";
export type VerifiableCredentialLifecycleStatus = "active" | "revoked";
export type VerifiableCredentialRequestSource = "claims" | "unsigned_json";

export interface EncryptedPayload {
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface UnsignedVerifiableCredential {
  "@context"?: Array<string | Record<string, string>>;
  id?: string;
  type: string[];
  issuer?: string | { id: string };
  issuanceDate?: string;
  expirationDate?: string | null;
  credentialSubject: Record<string, unknown> & { id: string };
  [key: string]: unknown;
}

export interface SignedConnectorCredential {
  id: string;
  participantContextId: string;
  timestamp: number;
  issuerId: string;
  holderId: string;
  state: number;
  issuancePolicy: null;
  reissuancePolicy: null;
  verifiableCredential: {
    format: "VC1_0_JWT";
    rawVc: string;
    credential: {
      credentialSubject: Array<{
        claims: UnsignedVerifiableCredential["credentialSubject"];
      }>;
      id?: string;
      type: string[];
      issuer: {
        id: string;
        additionalProperties: Record<string, unknown>;
      };
      issuanceDate: number;
      expirationDate: number | null;
      credentialStatus: null;
      description: null;
      name: null;
    };
  };
}

export interface VerifiableCredentialRequest {
  id: string;
  requesterId: string;
  requesterOrganizationName?: string;
  holderDid: string;
  requestedIssuerId: string;
  requestedIssuerOrganizationName?: string;
  credentialType: string;
  purpose: string;
  requestedClaimKeys: string[];
  requestSource: VerifiableCredentialRequestSource;
  unsignedCredentialId?: string;
  unsignedCredentialTypes?: string[];
  pendingPayloadAvailable: boolean;
  status: VerifiableCredentialRequestStatus;
  requestedAt: string;
  updatedAt: string;
  handledBy?: string;
  decisionNote?: string;
  issuedCredentialId?: string;
}

export interface IssuedVerifiableCredential {
  id: string;
  holderId: string;
  holderOrganizationName?: string;
  holderDid: string;
  issuerId: string;
  issuerOrganizationName?: string;
  credentialType: string;
  issuanceDate: string;
  expirationDate: string | null;
  format: VerifiableCredentialFormat;
  context: string[];
  type: string[];
  signedCredentialObject?: SignedConnectorCredential;
  source: "request" | "direct";
  linkedRequestId?: string;
  deliveryAvailable: boolean;
  downloadedAt?: string;
  status: VerifiableCredentialLifecycleStatus;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export interface SigningRequestPayload {
  requestId: string;
  requesterId: string;
  requesterOrganizationName?: string;
  holderDid: string;
  requestedIssuerId: string;
  requestedIssuerOrganizationName?: string;
  credentialType: string;
  purpose: string;
  requestSource: VerifiableCredentialRequestSource;
  unsignedCredential: UnsignedVerifiableCredential;
}

export interface IssuedCredentialDownload {
  credentialId: string;
  filename: string;
  rawVcJwt: string;
  signedCredentialObject: SignedConnectorCredential;
}

export interface VerificationCheckResult {
  credentialId: string;
  isAuthenticStructure: boolean;
  isIssuerTrusted: boolean;
  isCredentialActive: boolean;
  isValid: boolean;
  checkedAt: string;
  details: string[];
}
