import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { EncryptedPayload } from "@dataspace-onboarding/shared";

const DEFAULT_ENCRYPTION_SECRET = "dataspace-onboarding-dev-encryption-key";

function getEncryptionKey(): Buffer {
  const secret = process.env.VC_STORAGE_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_SECRET;
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptPayload<T>(value: T): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptPayload<T>(payload: EncryptedPayload | null | undefined): T {
  if (!payload) {
    throw new Error("Encrypted payload is not available.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
