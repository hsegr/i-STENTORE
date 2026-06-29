export interface DIDData {
  did: string;
  walletAddress: string;
}

export interface DIDVerificationMethodData {
  methodType: "Ed25519VerificationKey2020";
  privateKeyPem: string;
  publicKeyPem: string;
  publicKeyFingerprintSha256: string;
}
