import { and, desc, eq } from "drizzle-orm";
import type {
  IssueVcDirectDto,
  IssueVcFromRequestDto,
  IssuedCredentialDownload,
  IssuedVerifiableCredential,
  RejectVcRequestDto,
  RevokeVcDto,
  SigningRequestPayload,
  SubmitVcRequestDto,
  UnsignedVerifiableCredential,
  VerifiableCredentialRequest,
  VerificationCheckResult,
} from "@dataspace-onboarding/shared";
import { db } from "../db/client";
import { vcCredentials, vcRequests, type VcCredentialRow, type VcRequestRow } from "../db/schema";
import { decryptPayload, encryptPayload } from "./credentialEncryption";

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

type StoredSignedPayload = {
  rawVcJwt: string;
  signedCredentialObject: IssueVcDirectDto["signedCredentialObject"];
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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
    id: `urn:uuid:${globalThis.crypto?.randomUUID?.() ?? createId("uvc")}`,
    type: ["VerifiableCredential", input.credentialType],
    issuer: input.issuerId,
    issuanceDate: input.issuanceDate ?? new Date().toISOString(),
    credentialSubject: {
      id: input.holderDid,
      ...input.claims,
    },
  };
}

function getCredentialType(unsignedCredential: UnsignedVerifiableCredential): string {
  const types = unsignedCredential.type.filter((type) => type !== "VerifiableCredential");
  return types[0]?.split("#").pop() || "VerifiableCredential";
}

function getStringContexts(unsignedCredential: UnsignedVerifiableCredential): string[] {
  return unsignedCredential["@context"]?.filter((value): value is string => typeof value === "string") ?? [];
}

function getCredentialSubjectId(unsignedCredential: UnsignedVerifiableCredential): string {
  const holderDid = unsignedCredential.credentialSubject?.id;
  if (typeof holderDid !== "string" || holderDid.trim().length === 0) {
    throw new Error("Unsigned credential must include credentialSubject.id");
  }
  return holderDid;
}

function toVcRequest(row: VcRequestRow): VerifiableCredentialRequest {
  return {
    id: row.id,
    requesterId: row.requesterId,
    requesterOrganizationName: row.requesterOrganizationName || undefined,
    holderDid: row.holderDid,
    requestedIssuerId: row.requestedIssuerId,
    requestedIssuerOrganizationName: row.requestedIssuerOrganizationName || undefined,
    credentialType: row.credentialType,
    purpose: row.purpose,
    requestedClaimKeys: row.requestedClaimKeys || [],
    requestSource: row.requestSource,
    unsignedCredentialId: row.unsignedCredentialId || undefined,
    unsignedCredentialTypes: row.unsignedCredentialTypes || [],
    pendingPayloadAvailable: row.pendingPayloadAvailable,
    status: row.status,
    requestedAt: row.requestedAt,
    updatedAt: row.updatedAt,
    handledBy: row.handledBy || undefined,
    decisionNote: row.decisionNote || undefined,
    issuedCredentialId: row.issuedCredentialId || undefined,
  };
}

function toVcCredential(row: VcCredentialRow): IssuedVerifiableCredential {
  return {
    id: row.id,
    holderId: row.holderId,
    holderOrganizationName: row.holderOrganizationName || undefined,
    holderDid: row.holderDid,
    issuerId: row.issuerId,
    issuerOrganizationName: row.issuerOrganizationName || undefined,
    credentialType: row.credentialType,
    issuanceDate: row.issuanceDate,
    expirationDate: row.expirationDate,
    format: row.format,
    context: row.contextValues || [],
    type: row.typeValues || [],
    source: row.source,
    linkedRequestId: row.linkedRequestId || undefined,
    deliveryAvailable: row.deliveryAvailable,
    downloadedAt: row.downloadedAt || undefined,
    status: row.status,
    revokedAt: row.revokedAt || undefined,
    revokedBy: row.revokedBy || undefined,
    revocationReason: row.revocationReason || undefined,
  };
}

function extractExpirationDate(payload: StoredSignedPayload["signedCredentialObject"]): string | null {
  const expirationEpoch = payload.verifiableCredential.credential.expirationDate;
  if (typeof expirationEpoch !== "number") {
    return null;
  }
  return new Date(expirationEpoch * 1000).toISOString();
}

function getCredentialDownloadFilename(credentialType: string, credentialId: string): string {
  if (credentialType === "MembershipCredential") {
    return "membership-vc.json";
  }
  if (credentialType === "DataProcessorCredential") {
    return "dataprocessor-vc.json";
  }
  return `${credentialId}.json`;
}

function buildDownloadResponse(
  credentialId: string,
  credentialType: string,
  payload: StoredSignedPayload,
): IssuedCredentialDownload {
  return {
    credentialId,
    filename: getCredentialDownloadFilename(credentialType, credentialId),
    rawVcJwt: payload.rawVcJwt,
    signedCredentialObject: payload.signedCredentialObject,
  };
}

export function getTrustedIssuers(): string[] {
  return TRUSTED_ISSUER_DIRECTORY.map((issuer) => issuer.did);
}

export function getTrustedIssuerDirectory(): Array<{ did: string; organizationName: string }> {
  return TRUSTED_ISSUER_DIRECTORY.map((issuer) => ({ did: issuer.did, organizationName: issuer.organizationName }));
}

export function getIssuerOrganizationName(issuerDid: string): string {
  return TRUSTED_ISSUER_DIRECTORY.find((issuer) => issuer.did === issuerDid)?.organizationName || "Unknown issuer";
}

export async function getVcRequestsForRequester(requesterId: string): Promise<VerifiableCredentialRequest[]> {
  const rows = await db
    .select()
    .from(vcRequests)
    .where(eq(vcRequests.requesterId, requesterId))
    .orderBy(desc(vcRequests.requestedAt));
  return rows.map(toVcRequest);
}

export async function getPendingVcRequests(): Promise<VerifiableCredentialRequest[]> {
  const rows = await db
    .select()
    .from(vcRequests)
    .where(eq(vcRequests.status, "pending"))
    .orderBy(desc(vcRequests.requestedAt));
  return rows.map(toVcRequest);
}

export async function getSigningPayloadForRequest(requestId: string): Promise<SigningRequestPayload | null> {
  const row = (await db.select().from(vcRequests).where(and(eq(vcRequests.id, requestId), eq(vcRequests.status, "pending"))).limit(1))[0];
  if (!row || !row.pendingPayloadAvailable) {
    return null;
  }

  const unsignedCredential = decryptPayload<UnsignedVerifiableCredential>(row.encryptedUnsignedPayload);
  return {
    requestId: row.id,
    requesterId: row.requesterId,
    requesterOrganizationName: row.requesterOrganizationName || undefined,
    holderDid: row.holderDid,
    requestedIssuerId: row.requestedIssuerId,
    requestedIssuerOrganizationName: row.requestedIssuerOrganizationName || undefined,
    credentialType: row.credentialType,
    purpose: row.purpose,
    requestSource: row.requestSource,
    unsignedCredential,
  };
}

export async function getIssuedCredentialsForHolder(holderId: string): Promise<IssuedVerifiableCredential[]> {
  const rows = await db
    .select()
    .from(vcCredentials)
    .where(eq(vcCredentials.holderId, holderId))
    .orderBy(desc(vcCredentials.issuanceDate));
  return rows.map(toVcCredential);
}

export async function getAllIssuedCredentials(): Promise<IssuedVerifiableCredential[]> {
  const rows = await db.select().from(vcCredentials).orderBy(desc(vcCredentials.issuanceDate));
  return rows.map(toVcCredential);
}

export async function submitVcRequest(input: SubmitVcRequestDto): Promise<VerifiableCredentialRequest> {
  const now = new Date().toISOString();
  const unsignedCredential =
    input.unsignedCredential ??
    createUnsignedCredentialFromClaims({
      holderDid: input.holderDid,
      issuerId: input.requestedIssuerId,
      credentialType: input.credentialType,
      claims: input.requestedClaims,
      issuanceDate: now,
    });

  const request: VerifiableCredentialRequest = {
    id: createId("vcr"),
    requesterId: input.requesterId,
    requesterOrganizationName: input.requesterOrganizationName,
    holderDid: getCredentialSubjectId(unsignedCredential),
    requestedIssuerId: input.requestedIssuerId,
    requestedIssuerOrganizationName: getIssuerOrganizationName(input.requestedIssuerId),
    credentialType: getCredentialType(unsignedCredential),
    purpose: input.purpose,
    requestedClaimKeys: Object.keys(input.requestedClaims),
    requestSource: input.unsignedCredential ? "unsigned_json" : "claims",
    unsignedCredentialId: unsignedCredential.id,
    unsignedCredentialTypes: unsignedCredential.type.map((type) => type.split("#").pop() ?? type),
    pendingPayloadAvailable: true,
    status: "pending",
    requestedAt: now,
    updatedAt: now,
  };

  await db.insert(vcRequests).values({
    id: request.id,
    requesterId: request.requesterId,
    requesterOrganizationName: request.requesterOrganizationName ?? null,
    holderDid: request.holderDid,
    requestedIssuerId: request.requestedIssuerId,
    requestedIssuerOrganizationName: request.requestedIssuerOrganizationName ?? null,
    credentialType: request.credentialType,
    purpose: request.purpose,
    requestedClaims: {},
    requestedClaimKeys: request.requestedClaimKeys,
    requestSource: request.requestSource,
    unsignedCredentialId: request.unsignedCredentialId ?? null,
    unsignedCredentialTypes: request.unsignedCredentialTypes ?? [],
    pendingPayloadAvailable: true,
    encryptedUnsignedPayload: encryptPayload(unsignedCredential),
    status: "pending",
    requestedAt: request.requestedAt,
    updatedAt: request.updatedAt,
    handledBy: null,
    decisionNote: null,
    issuedCredentialId: null,
  });

  return request;
}

export async function issueVcFromRequest(input: IssueVcFromRequestDto): Promise<IssuedVerifiableCredential | null> {
  return db.transaction(async (transaction) => {
    const requestRow = (
      await transaction
        .select()
        .from(vcRequests)
        .where(and(eq(vcRequests.id, input.requestId), eq(vcRequests.status, "pending")))
        .limit(1)
    )[0];

    if (!requestRow || !requestRow.pendingPayloadAvailable) {
      return null;
    }

    const unsignedCredential = decryptPayload<UnsignedVerifiableCredential>(requestRow.encryptedUnsignedPayload);
    const signedPayload: StoredSignedPayload = {
      rawVcJwt: input.rawVcJwt,
      signedCredentialObject: input.signedCredentialObject,
    };
    const issuanceDate = new Date(input.signedCredentialObject.timestamp).toISOString();
    const issuedCredential: IssuedVerifiableCredential = {
      id: createId("vc"),
      holderId: requestRow.requesterId,
      holderOrganizationName: requestRow.requesterOrganizationName || undefined,
      holderDid: requestRow.holderDid,
      issuerId: input.issuerId,
      issuerOrganizationName: input.issuerOrganizationName || getIssuerOrganizationName(input.issuerId),
      credentialType: requestRow.credentialType,
      issuanceDate,
      expirationDate: extractExpirationDate(input.signedCredentialObject),
      format: input.signedCredentialObject.verifiableCredential.format,
      context: getStringContexts(unsignedCredential),
      type: input.signedCredentialObject.verifiableCredential.credential.type,
      source: "request",
      linkedRequestId: requestRow.id,
      deliveryAvailable: true,
      status: "active",
    };

    await transaction.insert(vcCredentials).values({
      id: issuedCredential.id,
      holderId: issuedCredential.holderId,
      holderOrganizationName: issuedCredential.holderOrganizationName ?? null,
      holderDid: issuedCredential.holderDid,
      issuerId: issuedCredential.issuerId,
      issuerOrganizationName: issuedCredential.issuerOrganizationName ?? null,
      credentialType: issuedCredential.credentialType,
      issuanceDate: issuedCredential.issuanceDate,
      expirationDate: issuedCredential.expirationDate,
      format: issuedCredential.format,
      rawVcJwt: "",
      contextValues: issuedCredential.context,
      typeValues: issuedCredential.type,
      credentialSubject: {},
      source: issuedCredential.source,
      linkedRequestId: issuedCredential.linkedRequestId ?? null,
      deliveryAvailable: true,
      downloadedAt: null,
      encryptedSignedPayload: encryptPayload(signedPayload),
      status: issuedCredential.status,
      revokedAt: null,
      revokedBy: null,
      revocationReason: null,
    });

    await transaction
      .update(vcRequests)
      .set({
        status: "issued",
        updatedAt: issuanceDate,
        handledBy: input.adminId,
        decisionNote: `Issued by ${issuedCredential.issuerOrganizationName}`,
        issuedCredentialId: issuedCredential.id,
        pendingPayloadAvailable: false,
        encryptedUnsignedPayload: null,
      })
      .where(eq(vcRequests.id, input.requestId));

    return issuedCredential;
  });
}

export async function rejectVcRequest(
  requestId: RejectVcRequestDto["requestId"],
  adminId: RejectVcRequestDto["adminId"],
  reason: RejectVcRequestDto["reason"],
): Promise<VerifiableCredentialRequest | null> {
  return db.transaction(async (transaction) => {
    const requestRow = (
      await transaction
        .select()
        .from(vcRequests)
        .where(and(eq(vcRequests.id, requestId), eq(vcRequests.status, "pending")))
        .limit(1)
    )[0];
    if (!requestRow) {
      return null;
    }

    const updatedAt = new Date().toISOString();
    await transaction
      .update(vcRequests)
      .set({
        status: "rejected",
        updatedAt,
        handledBy: adminId,
        decisionNote: reason,
        pendingPayloadAvailable: false,
        encryptedUnsignedPayload: null,
      })
      .where(eq(vcRequests.id, requestId));

    return {
      ...toVcRequest(requestRow),
      status: "rejected",
      updatedAt,
      handledBy: adminId,
      decisionNote: reason,
      pendingPayloadAvailable: false,
    };
  });
}

export async function issueVcDirect(input: IssueVcDirectDto): Promise<IssuedVerifiableCredential> {
  const issuanceDate = new Date(input.signedCredentialObject.timestamp).toISOString();
  const issuedCredential: IssuedVerifiableCredential = {
    id: createId("vc"),
    holderId: input.holderId,
    holderOrganizationName: input.holderOrganizationName,
    holderDid: input.holderDid,
    issuerId: input.issuerId,
    issuerOrganizationName: input.issuerOrganizationName || getIssuerOrganizationName(input.issuerId),
    credentialType: input.credentialType,
    issuanceDate,
    expirationDate: extractExpirationDate(input.signedCredentialObject),
    format: input.signedCredentialObject.verifiableCredential.format,
    context: [],
    type: input.signedCredentialObject.verifiableCredential.credential.type,
    source: "direct",
    deliveryAvailable: true,
    status: "active",
  };

  await db.insert(vcCredentials).values({
    id: issuedCredential.id,
    holderId: issuedCredential.holderId,
    holderOrganizationName: issuedCredential.holderOrganizationName ?? null,
    holderDid: issuedCredential.holderDid,
    issuerId: issuedCredential.issuerId,
    issuerOrganizationName: issuedCredential.issuerOrganizationName ?? null,
    credentialType: issuedCredential.credentialType,
    issuanceDate: issuedCredential.issuanceDate,
    expirationDate: issuedCredential.expirationDate,
    format: issuedCredential.format,
    rawVcJwt: "",
    contextValues: issuedCredential.context,
    typeValues: issuedCredential.type,
    credentialSubject: {},
    source: issuedCredential.source,
    linkedRequestId: null,
    deliveryAvailable: true,
    downloadedAt: null,
    encryptedSignedPayload: encryptPayload({
      rawVcJwt: input.rawVcJwt,
      signedCredentialObject: input.signedCredentialObject,
    }),
    status: issuedCredential.status,
    revokedAt: null,
    revokedBy: null,
    revocationReason: null,
  });

  return issuedCredential;
}

export async function downloadCredentialForHolder(
  credentialId: string,
  holderId: string,
): Promise<IssuedCredentialDownload | null> {
  return db.transaction(async (transaction) => {
    const credentialRow = (
      await transaction
        .select()
        .from(vcCredentials)
        .where(and(eq(vcCredentials.id, credentialId), eq(vcCredentials.holderId, holderId)))
        .limit(1)
    )[0];

    if (!credentialRow || !credentialRow.deliveryAvailable || !credentialRow.encryptedSignedPayload) {
      return null;
    }

    const payload = decryptPayload<StoredSignedPayload>(credentialRow.encryptedSignedPayload);
    await transaction
      .update(vcCredentials)
      .set({
        deliveryAvailable: false,
        downloadedAt: new Date().toISOString(),
        encryptedSignedPayload: null,
      })
      .where(eq(vcCredentials.id, credentialId));

    return buildDownloadResponse(credentialId, credentialRow.credentialType, payload);
  });
}

export async function revokeIssuedCredential(
  credentialId: RevokeVcDto["credentialId"],
  adminId: RevokeVcDto["adminId"],
  reason: RevokeVcDto["reason"],
): Promise<IssuedVerifiableCredential | null> {
  return db.transaction(async (transaction) => {
    const credentialRow = (await transaction.select().from(vcCredentials).where(eq(vcCredentials.id, credentialId)).limit(1))[0];
    if (!credentialRow) {
      return null;
    }

    const credential = toVcCredential(credentialRow);
    if (credential.status === "revoked") {
      return credential;
    }

    const revokedAt = new Date().toISOString();
    const revocationReason = reason || "Revoked by issuer";

    await transaction
      .update(vcCredentials)
      .set({
        status: "revoked",
        revokedAt,
        revokedBy: adminId,
        revocationReason,
      })
      .where(eq(vcCredentials.id, credentialId));

    return {
      ...credential,
      status: "revoked",
      revokedAt,
      revokedBy: adminId,
      revocationReason,
    };
  });
}

export async function deleteCredentialForHolder(credentialId: string, holderId: string): Promise<boolean> {
  const deleted = await db
    .delete(vcCredentials)
    .where(and(eq(vcCredentials.id, credentialId), eq(vcCredentials.holderId, holderId)))
    .returning({ id: vcCredentials.id });
  return deleted.length > 0;
}

export async function deleteRevokedCredential(credentialId: string): Promise<boolean> {
  return db.transaction(async (transaction) => {
    const revokedCredential = (
      await transaction
        .select({ id: vcCredentials.id })
        .from(vcCredentials)
        .where(and(eq(vcCredentials.id, credentialId), eq(vcCredentials.status, "revoked")))
        .limit(1)
    )[0];
    if (!revokedCredential) {
      return false;
    }

    await transaction.delete(vcCredentials).where(eq(vcCredentials.id, credentialId));
    await transaction
      .update(vcRequests)
      .set({
        issuedCredentialId: null,
      })
      .where(eq(vcRequests.issuedCredentialId, credentialId));

    return true;
  });
}

export async function verifyPresentedCredential(credentialId: string): Promise<VerificationCheckResult> {
  const credentialRow = (await db.select().from(vcCredentials).where(eq(vcCredentials.id, credentialId)).limit(1))[0];
  if (!credentialRow) {
    return {
      credentialId,
      isAuthenticStructure: false,
      isIssuerTrusted: false,
      isCredentialActive: false,
      isValid: false,
      checkedAt: new Date().toISOString(),
      details: ["Credential not found in issuer registry state."],
    };
  }

  const credential = toVcCredential(credentialRow);
  const isAuthenticStructure =
    (credential.format === "VC1_0_JWT" || credential.format === "VC2_0_JWT") &&
    credential.type.includes("VerifiableCredential");
  const isIssuerTrusted = TRUSTED_ISSUER_DIRECTORY.some((issuer) => issuer.did === credential.issuerId);
  const isCredentialActive = credential.status === "active";
  const isValid = isAuthenticStructure && isIssuerTrusted && isCredentialActive;

  const details: string[] = [
    isAuthenticStructure ? "Credential metadata format and VC type checks passed." : "Credential metadata format/type check failed.",
    isIssuerTrusted ? "Issuer DID is in trusted issuer directory." : "Issuer DID is not trusted.",
    isCredentialActive ? "Credential status is active." : "Credential status is revoked.",
    credential.deliveryAvailable
      ? "Encrypted delivery payload is still available for holder download."
      : "Encrypted delivery payload has already been removed from backend storage.",
  ];

  if (credential.status === "revoked" && credential.revocationReason) {
    details.push(`Revocation reason: ${credential.revocationReason}`);
  }

  return {
    credentialId,
    isAuthenticStructure,
    isIssuerTrusted,
    isCredentialActive,
    isValid,
    checkedAt: new Date().toISOString(),
    details,
  };
}
