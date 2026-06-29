import type { DIDVerificationMethodData } from "@dataspace-onboarding/shared";

export async function generateDidVerificationMethod(): Promise<DIDVerificationMethodData> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this environment");
  }

  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: "Ed25519",
    },
    true,
    ["sign", "verify"],
  );

  const privateKeyDer = await globalThis.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKeyDer = await globalThis.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKeyPem = derToPem(privateKeyDer, "PRIVATE KEY");
  const publicKeyPem = derToPem(publicKeyDer, "PUBLIC KEY");
  const publicKeyFingerprintSha256 = await fingerprintFromPublicKeyPem(publicKeyPem);

  return {
    methodType: "Ed25519VerificationKey2020",
    privateKeyPem,
    publicKeyPem,
    publicKeyFingerprintSha256,
  };
}

export function isPemPublicKey(value: string): boolean {
  return value.includes("-----BEGIN PUBLIC KEY-----") && value.includes("-----END PUBLIC KEY-----");
}

export function isPemPrivateKey(value: string): boolean {
  return value.includes("-----BEGIN PRIVATE KEY-----") && value.includes("-----END PRIVATE KEY-----");
}

export function downloadPem(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/x-pem-file" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function fingerprintFromPublicKeyPem(publicKeyPem: string): Promise<string> {
  const base64 = publicKeyPem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s+/g, "");

  const rawBinary = atob(base64);
  const raw = new Uint8Array(rawBinary.length);
  for (let i = 0; i < rawBinary.length; i += 1) {
    raw[i] = rawBinary.charCodeAt(i);
  }

  const digest = await globalThis.crypto.subtle.digest("SHA-256", raw);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();
}

function derToPem(der: ArrayBuffer, label: "PRIVATE KEY" | "PUBLIC KEY"): string {
  const bytes = new Uint8Array(der);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 = btoa(binary);
  const wrapped = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----\n`;
}
