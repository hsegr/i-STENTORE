import { EdDSASigner } from "did-jwt";
import { createVerifiableCredentialJwt } from "did-jwt-vc";
import type {
  IssuedCredentialDownload,
  IssuedVerifiableCredential,
  OnboardingRequest,
  SigningRequestPayload,
  UnsignedVerifiableCredential,
  VerifiableCredentialRequest,
  VerificationCheckResult,
} from "@dataspace-onboarding/shared";

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim().length > 0) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "/api";
}

const API_BASE_URL = getApiBaseUrl();
const VC_API_BASE_URL = `${API_BASE_URL}/verifiable-credentials`;

const TRUSTED_ISSUER_DIRECTORY = [
  {
    did: "did:indy:besu:wf:0x33b31221a381ccd08d57ca6419ecaf853c8937c9",
    organizationName: "European Dynamics",
  },
  {
    did: "did:indy:besu:wf:0x27924733244ec40950300ce660be0bdce896a9e8",
    organizationName: "Hardware & Software Engineering",
  },
  {
    did: "did:indy:besu:wf:0xA8D489A0d59bA1669eFF344Be06A8772a02553E3",
    organizationName: "AIR Institute",
  },
] as const;

export const ADMIN_ISSUER_DID = "did:indy:besu:wf:0x27924733244ec40950300ce660be0bdce896a9e8";
export const ADMIN_ISSUER_ORGANIZATION_NAME = "Hardware & Software Engineering";

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createUuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? createId("uuid");
}

function getCredentialSubjectId(unsignedCredential: UnsignedVerifiableCredential): string {
  const holderDid = unsignedCredential.credentialSubject?.id;
  if (typeof holderDid !== "string" || holderDid.trim().length === 0) {
    throw new Error("Unsigned credential must include credentialSubject.id");
  }
  return holderDid;
}

function getCredentialType(unsignedCredential: UnsignedVerifiableCredential): string {
  const types = unsignedCredential.type.filter((type) => type !== "VerifiableCredential");
  return types[0]?.split("#").pop() || "VerifiableCredential";
}

function getClaimsFromUnsignedCredential(unsignedCredential: UnsignedVerifiableCredential): Record<string, string> {
  return Object.entries(unsignedCredential.credentialSubject).reduce<Record<string, string>>((claims, [key, value]) => {
    if (typeof value === "string") {
      claims[key] = value;
    } else if (value !== null && value !== undefined) {
      claims[key] = JSON.stringify(value);
    }
    return claims;
  }, {});
}

function getStringContexts(unsignedCredential: UnsignedVerifiableCredential): string[] {
  return unsignedCredential["@context"]?.filter((value): value is string => typeof value === "string") ?? [];
}

function createUnsignedCredentialFromClaims(input: {
  holderDid: string;
  issuerId: string;
  credentialType: string;
  claims: Record<string, string>;
  issuanceDate?: string;
}): UnsignedVerifiableCredential {
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://dataspace.example/credentials/v1"],
    id: `urn:uuid:${createUuid()}`,
    type: ["VerifiableCredential", input.credentialType],
    issuer: input.issuerId,
    issuanceDate: input.issuanceDate ?? new Date().toISOString(),
    credentialSubject: {
      id: input.holderDid,
      ...input.claims,
    },
  };
}

function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getIssuerPrivateKeySeedFromPem(privateKeyPem: string): Uint8Array {
  const keyBytes = base64ToBytes(pemToBase64(privateKeyPem));
  return keyBytes.slice(16, 48);
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${VC_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parse failures on error bodies.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function parseUnsignedCredentialJson(rawJson: string): UnsignedVerifiableCredential {
  const parsed = JSON.parse(rawJson) as Partial<UnsignedVerifiableCredential>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Credential JSON must be an object.");
  }
  if (!Array.isArray(parsed.type) || parsed.type.length === 0) {
    throw new Error("Unsigned credential must include a non-empty type array.");
  }
  if (!parsed.credentialSubject || typeof parsed.credentialSubject !== "object") {
    throw new Error("Unsigned credential must include credentialSubject.");
  }

  const credential = parsed as UnsignedVerifiableCredential;
  getCredentialSubjectId(credential);
  return credential;
}

export async function signUnsignedCredential(
  unsignedCredential: UnsignedVerifiableCredential,
  options: {
    issuerDid: string;
    issuerPrivateKeyPem: string;
  },
): Promise<{ jwt: string; credentialObject: IssuedCredentialDownload["signedCredentialObject"] }> {
  const normalizedUnsignedCredential: UnsignedVerifiableCredential = {
    ...unsignedCredential,
    issuer: options.issuerDid,
  };
  const holderDid = getCredentialSubjectId(normalizedUnsignedCredential);
  const issuedAt = Math.floor(Date.now() / 1000);
  const issuerSigner = {
    did: options.issuerDid,
    alg: "EdDSA" as const,
    signer: EdDSASigner(getIssuerPrivateKeySeedFromPem(options.issuerPrivateKeyPem)),
  };

  const jwtPayload = {
    sub: holderDid,
    aud: holderDid,
    iss: options.issuerDid,
    iat: issuedAt,
    vc: normalizedUnsignedCredential,
  };

  const jwt = await createVerifiableCredentialJwt(
    jwtPayload as Parameters<typeof createVerifiableCredentialJwt>[0],
    issuerSigner,
    {
      header: {
        kid: `${options.issuerDid}#key-1`,
      },
    },
  );

  const issuanceDate = normalizedUnsignedCredential.issuanceDate
    ? new Date(normalizedUnsignedCredential.issuanceDate).getTime() / 1000
    : issuedAt;

  return {
    jwt,
    credentialObject: {
      id: createUuid(),
      participantContextId: holderDid,
      timestamp: Date.now(),
      issuerId: options.issuerDid,
      holderId: holderDid,
      state: 500,
      issuancePolicy: null,
      reissuancePolicy: null,
      verifiableCredential: {
        format: "VC1_0_JWT",
        rawVc: jwt,
        credential: {
          credentialSubject: [
            {
              claims: normalizedUnsignedCredential.credentialSubject,
            },
          ],
          id: normalizedUnsignedCredential.id,
          type: normalizedUnsignedCredential.type.map((type) => type.split("#").pop() ?? type),
          issuer: {
            id: options.issuerDid,
            additionalProperties: {},
          },
          issuanceDate,
          expirationDate: normalizedUnsignedCredential.expirationDate
            ? new Date(normalizedUnsignedCredential.expirationDate).getTime() / 1000
            : null,
          credentialStatus: null,
          description: null,
          name: null,
        },
      },
    },
  };
}

export function downloadJsonFile(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadIssuedCredentialJson(
  credential: IssuedVerifiableCredential,
  holderId: string,
): Promise<void> {
  const download = await apiRequest<IssuedCredentialDownload>(`/credentials/${credential.id}/download/holder/${encodeURIComponent(holderId)}`);
  downloadJsonFile(download.filename, download.signedCredentialObject);
}

export function readPemFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read PEM file."));
    reader.readAsText(file);
  });
}

export async function getTrustedIssuers(): Promise<string[]> {
  return apiRequest<string[]>("/trusted-issuers");
}

export async function getTrustedIssuerDirectory(): Promise<Array<{ did: string; organizationName: string }>> {
  return apiRequest<Array<{ did: string; organizationName: string }>>("/trusted-issuers/directory");
}

export function getIssuerOrganizationName(issuerDid: string): string {
  return TRUSTED_ISSUER_DIRECTORY.find((issuer) => issuer.did === issuerDid)?.organizationName || "Unknown issuer";
}

export async function getVcRequestsForRequester(requesterId: string): Promise<VerifiableCredentialRequest[]> {
  return apiRequest<VerifiableCredentialRequest[]>(`/requests/requester/${encodeURIComponent(requesterId)}`);
}

export async function getPendingVcRequests(): Promise<VerifiableCredentialRequest[]> {
  return apiRequest<VerifiableCredentialRequest[]>("/requests/pending");
}

export async function getSigningPayloadForRequest(requestId: string): Promise<SigningRequestPayload> {
  return apiRequest<SigningRequestPayload>(`/requests/${encodeURIComponent(requestId)}/signing-payload`);
}

export async function getIssuedCredentialsForHolder(holderId: string): Promise<IssuedVerifiableCredential[]> {
  return apiRequest<IssuedVerifiableCredential[]>(`/credentials/holder/${encodeURIComponent(holderId)}`);
}

export async function getAllIssuedCredentials(): Promise<IssuedVerifiableCredential[]> {
  return apiRequest<IssuedVerifiableCredential[]>("/credentials");
}

export async function submitVcRequest(input: {
  requesterId: string;
  requesterOrganizationName?: string;
  holderDid: string;
  requestedIssuerId: string;
  credentialType: string;
  purpose: string;
  requestedClaims: Record<string, string>;
  unsignedCredential?: UnsignedVerifiableCredential;
}): Promise<VerifiableCredentialRequest> {
  return apiRequest<VerifiableCredentialRequest>("/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function submitUnsignedVcRequest(input: {
  requesterId: string;
  requesterOrganizationName?: string;
  requestedIssuerId: string;
  purpose: string;
  unsignedCredential: UnsignedVerifiableCredential;
}): Promise<VerifiableCredentialRequest> {
  return submitVcRequest({
    requesterId: input.requesterId,
    requesterOrganizationName:
      input.requesterOrganizationName ||
      (typeof input.unsignedCredential.credentialSubject.organizationName === "string"
        ? input.unsignedCredential.credentialSubject.organizationName
        : undefined),
    holderDid: getCredentialSubjectId(input.unsignedCredential),
    requestedIssuerId: input.requestedIssuerId,
    credentialType: getCredentialType(input.unsignedCredential),
    purpose: input.purpose,
    requestedClaims: getClaimsFromUnsignedCredential(input.unsignedCredential),
    unsignedCredential: input.unsignedCredential,
  });
}

export async function issueVcFromRequest(
  requestId: string,
  adminId: string,
  signing: {
    issuerDid: string;
    issuerPrivateKeyPem: string;
    issuerOrganizationName?: string;
  },
): Promise<IssuedVerifiableCredential | null> {
  const requestPayload = await getSigningPayloadForRequest(requestId);
  const { jwt, credentialObject } = await signUnsignedCredential(requestPayload.unsignedCredential, {
    issuerDid: signing.issuerDid,
    issuerPrivateKeyPem: signing.issuerPrivateKeyPem,
  });

  return apiRequest<IssuedVerifiableCredential>(`/requests/${encodeURIComponent(requestId)}/issue`, {
    method: "POST",
    body: JSON.stringify({
      adminId,
      issuerId: signing.issuerDid,
      issuerOrganizationName: signing.issuerOrganizationName,
      rawVcJwt: jwt,
      signedCredentialObject: credentialObject,
    }),
  });
}

export async function rejectVcRequest(
  requestId: string,
  adminId: string,
  reason: string,
): Promise<VerifiableCredentialRequest | null> {
  return apiRequest<VerifiableCredentialRequest>(`/requests/${encodeURIComponent(requestId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ adminId, reason }),
  });
}

export async function issueVcDirect(input: {
  adminId: string;
  holderId: string;
  holderOrganizationName?: string;
  holderDid: string;
  issuerId: string;
  issuerOrganizationName?: string;
  issuerPrivateKeyPem: string;
  credentialType: string;
  claims: Record<string, string>;
}): Promise<IssuedVerifiableCredential> {
  const now = new Date().toISOString();
  const unsignedCredential = createUnsignedCredentialFromClaims({
    holderDid: input.holderDid,
    issuerId: input.issuerId,
    credentialType: input.credentialType,
    claims: input.claims,
    issuanceDate: now,
  });
  const { jwt, credentialObject } = await signUnsignedCredential(unsignedCredential, {
    issuerDid: input.issuerId,
    issuerPrivateKeyPem: input.issuerPrivateKeyPem,
  });

  return apiRequest<IssuedVerifiableCredential>("/credentials/issue-direct", {
    method: "POST",
    body: JSON.stringify({
      adminId: input.adminId,
      holderId: input.holderId,
      holderOrganizationName: input.holderOrganizationName || input.claims.organizationName,
      holderDid: input.holderDid,
      issuerId: input.issuerId,
      issuerOrganizationName: input.issuerOrganizationName,
      credentialType: input.credentialType,
      rawVcJwt: jwt,
      signedCredentialObject: credentialObject,
    }),
  });
}

function getMembershipType(request: OnboardingRequest): string {
  const intendedParticipation = request.participantProfile?.intendedParticipation;
  if (intendedParticipation === "provider") {
    return "ProviderMember";
  }
  if (intendedParticipation === "consumer") {
    return "ConsumerMember";
  }
  if (intendedParticipation === "prosumer") {
    return "ProsumerMember";
  }
  return "ParticipantMember";
}

export async function issueMembershipCredentialForOnboarding(input: {
  request: OnboardingRequest;
  issuerDid: string;
  issuerOrganizationName?: string;
  issuerPrivateKeyPem: string;
  adminId: string;
}): Promise<IssuedVerifiableCredential> {
  const now = new Date().toISOString();
  const subject = input.request.participantProfile;
  const unsignedCredential: UnsignedVerifiableCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
      "https://www.w3.org/ns/did/v1",
      {
        "mvd-credentials": "https://w3id.org/mvd/credentials/",
        membership: "mvd-credentials:membership",
        membershipType: "mvd-credentials:membershipType",
        website: "mvd-credentials:website",
        contact: "mvd-credentials:contact",
        since: "mvd-credentials:since",
      },
    ],
    id: `urn:dataspace:onboarding:${input.request.id}:membership`,
    type: ["VerifiableCredential", "http://org.yourdataspace.com#MembershipCredential"],
    issuer: input.issuerDid,
    issuanceDate: now,
    credentialSubject: {
      id: input.request.did,
      membership: {
        membershipType: getMembershipType(input.request),
        website: subject?.website || "",
        contact: subject?.contactEmail || input.request.ownerId,
        since: now,
      },
    },
  };

  const { jwt, credentialObject } = await signUnsignedCredential(unsignedCredential, {
    issuerDid: input.issuerDid,
    issuerPrivateKeyPem: input.issuerPrivateKeyPem,
  });

  return apiRequest<IssuedVerifiableCredential>("/credentials/issue-direct", {
    method: "POST",
    body: JSON.stringify({
      adminId: input.adminId,
      holderId: input.request.ownerId,
      holderOrganizationName: subject?.organizationName || input.request.organizationName,
      holderDid: input.request.did,
      issuerId: input.issuerDid,
      issuerOrganizationName: input.issuerOrganizationName,
      credentialType: "MembershipCredential",
      rawVcJwt: jwt,
      signedCredentialObject: credentialObject,
    }),
  });
}

export async function issueDataProcessorCredentialForOnboarding(input: {
  request: OnboardingRequest;
  issuerDid: string;
  issuerOrganizationName?: string;
  issuerPrivateKeyPem: string;
  adminId: string;
}): Promise<IssuedVerifiableCredential> {
  const now = new Date().toISOString();
  const unsignedCredential: UnsignedVerifiableCredential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/suites/jws-2020/v1",
      "https://www.w3.org/ns/did/v1",
      {
        "dataspace-credentials": "https://dataspace.example/credentials/",
        level: "dataspace-credentials:level",
        contractVersion: "dataspace-credentials:contractVersion",
      },
    ],
    id: `urn:dataspace:onboarding:${input.request.id}:dataprocessor`,
    type: ["VerifiableCredential", "http://org.yourdataspace.com#DataProcessorCredential"],
    issuer: input.issuerDid,
    issuanceDate: now,
    credentialSubject: {
      id: input.request.did,
      level: "processing",
      contractVersion: "1.0.0",
    },
  };

  const { jwt, credentialObject } = await signUnsignedCredential(unsignedCredential, {
    issuerDid: input.issuerDid,
    issuerPrivateKeyPem: input.issuerPrivateKeyPem,
  });

  return apiRequest<IssuedVerifiableCredential>("/credentials/issue-direct", {
    method: "POST",
    body: JSON.stringify({
      adminId: input.adminId,
      holderId: input.request.ownerId,
      holderOrganizationName: input.request.participantProfile?.organizationName || input.request.organizationName,
      holderDid: input.request.did,
      issuerId: input.issuerDid,
      issuerOrganizationName: input.issuerOrganizationName,
      credentialType: "DataProcessorCredential",
      rawVcJwt: jwt,
      signedCredentialObject: credentialObject,
    }),
  });
}

export async function revokeIssuedCredential(
  credentialId: string,
  adminId: string,
  reason: string,
): Promise<IssuedVerifiableCredential | null> {
  return apiRequest<IssuedVerifiableCredential>(`/credentials/${encodeURIComponent(credentialId)}/revoke`, {
    method: "POST",
    body: JSON.stringify({ adminId, reason }),
  });
}

export async function deleteCredentialForHolder(credentialId: string, holderId: string): Promise<boolean> {
  await apiRequest<{ deleted: boolean }>(`/credentials/${encodeURIComponent(credentialId)}/holder/${encodeURIComponent(holderId)}`, {
    method: "DELETE",
  });
  return true;
}

export async function deleteRevokedCredential(credentialId: string): Promise<boolean> {
  await apiRequest<{ deleted: boolean }>(`/credentials/${encodeURIComponent(credentialId)}/revoked`, {
    method: "DELETE",
  });
  return true;
}

export async function verifyPresentedCredential(credentialId: string): Promise<VerificationCheckResult> {
  return apiRequest<VerificationCheckResult>(`/credentials/${encodeURIComponent(credentialId)}/verify`);
}

export { getStringContexts };
