import type { DIDData } from "@dataspace-onboarding/shared";

export interface DIDRegistrationConfig {
  identityProxyUrl: string;
  apiToken: string;
}

/**
 * Generate DID from wallet address
 * Format: did:indy:besu:wf:<wallet-address>
 */
export function generateDID(walletAddress: `0x${string}`): string {
  // Remove 0x prefix and use lowercase
  const address = walletAddress.toLowerCase();
  return `did:indy:besu:wf:${address}`;
}

/**
 * Extract Ethereum address from wallet address (without 0x prefix)
 */
export function extractAddressFromWallet(walletAddress: `0x${string}`): string {
  return walletAddress.replace(/^0x/, "").toLowerCase();
}

/**
 * Convert PEM public key to base64 (removing headers and newlines)
 */
export function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN PUBLIC KEY-----/, "")
    .replace(/-----END PUBLIC KEY-----/, "")
    .replace(/\s/g, "");
}

/**
 * Register DID with Identity Proxy (MOCK VERSION)
 */
export async function registerDID(
  walletAddress: `0x${string}`,
  privateKey: `0x${string}`,
  publicKeyPem: string,
  certificatePublicKeyPem: string,
  config: DIDRegistrationConfig,
): Promise<DIDData> {
  const did = generateDID(walletAddress);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock registration - no actual API call
  console.log("Mock DID Registration:", {
    did,
    ethereumAddress: extractAddressFromWallet(walletAddress),
    identityProxyUrl: config.identityProxyUrl,
    payload: {
      configuration: {
        publicKeys: [
          {
            type: "Ed25519Signature2018",
            base64: pemToBase64(publicKeyPem),
            purposes: {
              authentication: true,
              assertionMethod: true,
              keyAgreement: true,
              capabilityInvocation: true,
              capabilityDelegation: true,
            },
          },
          {
            type: "X509Certificate2018",
            base64: pemToBase64(certificatePublicKeyPem),
            purposes: {
              authentication: true,
              keyAgreement: true,
            },
          },
        ],
        services: [],
      },
      txSign: {
        mode: "private_key",
        privateKey: privateKey.replace(/^0x/, ""),
      },
    },
  });

  return {
    did,
    walletAddress,
  };
}

/**
 * Validate DID format
 */
export function validateDID(did: string): {
  isValid: boolean;
  error?: string;
} {
  const didPattern = /^did:indy:besu:wf:0x[a-f0-9]{40}$/i;

  if (!didPattern.test(did)) {
    return {
      isValid: false,
      error: "Invalid DID format. Expected: did:indy:besu:wf:0x<address>",
    };
  }

  return { isValid: true };
}

/**
 * Check if DID is already registered (mock implementation)
 */
export async function checkDIDExists(did: string, config: DIDRegistrationConfig): Promise<boolean> {
  try {
    const ethereumAddress = did.split(":").pop();
    const url = `${config.identityProxyUrl}/api/v1/indy/${ethereumAddress}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-token": config.apiToken,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
