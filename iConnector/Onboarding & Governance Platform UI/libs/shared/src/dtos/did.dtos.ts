export interface RegisterDidDto {
  ownerId: string;
  walletAddress: string;
  did: string;
  verificationMethod: {
    methodType: "Ed25519VerificationKey2020";
    publicKeyPem: string;
    publicKeyFingerprintSha256: string;
  };
}
