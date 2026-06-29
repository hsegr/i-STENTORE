import type { SignedConnectorCredential, UnsignedVerifiableCredential } from "../types/vc.types";

export interface SubmitVcRequestDto {
  requesterId: string;
  requesterOrganizationName?: string;
  holderDid: string;
  requestedIssuerId: string;
  credentialType: string;
  purpose: string;
  requestedClaims: Record<string, string>;
  unsignedCredential?: UnsignedVerifiableCredential;
}

export interface IssueVcFromRequestDto {
  requestId: string;
  adminId: string;
  issuerId: string;
  issuerOrganizationName?: string;
  rawVcJwt: string;
  signedCredentialObject: SignedConnectorCredential;
}

export interface RejectVcRequestDto {
  requestId: string;
  adminId: string;
  reason: string;
}

export interface IssueVcDirectDto {
  adminId: string;
  holderId: string;
  holderOrganizationName?: string;
  holderDid: string;
  issuerId: string;
  issuerOrganizationName?: string;
  credentialType: string;
  rawVcJwt: string;
  signedCredentialObject: SignedConnectorCredential;
}

export interface RevokeVcDto {
  credentialId: string;
  adminId: string;
  reason: string;
}
