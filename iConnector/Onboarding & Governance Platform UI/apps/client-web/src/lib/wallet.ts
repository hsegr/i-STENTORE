// The Encrypted Wallet implementation is based on the Web3 secret storage definition available at:
// https://ethereum.org/developers/docs/data-structures-and-encoding/web3-secret-storage/
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { hexToBytes, bytesToHex, keccak256 } from "viem";

export interface WalletData {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  usesEncryptedKeystore?: boolean;
}

const PBKDF2_CONFIG = {
  iterations: 262144,
  hash: "SHA-256" as const,
  dklen: 32,
};

/**
 * Generate a new Ethereum wallet with private key
 * @returns WalletData containing address and private key
 */
export const generateWallet = (): WalletData => {
  // Generate a random private key
  const privateKey = generatePrivateKey();

  // Derive the account from private key
  const account = privateKeyToAccount(privateKey);

  return {
    address: account.address,
    privateKey: privateKey,
    usesEncryptedKeystore: false,
  };
};

/**
 * Derive encryption key from password using PBKDF2
 */
const deriveKey = async (password: string, salt: Uint8Array): Promise<Uint8Array> => {
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_CONFIG.iterations,
      hash: PBKDF2_CONFIG.hash,
    },
    passwordKey,
    PBKDF2_CONFIG.dklen * 8, // Convert bytes to bits
  );

  return new Uint8Array(derivedBits);
};

/**
 * Calculate MAC for Web3 keystore format
 * MAC = keccak256(derivedKey[16:32] + ciphertext)
 */
const calculateMac = (derivedKey: Uint8Array, ciphertext: Uint8Array): string => {
  const macBody = derivedKey.slice(16, 32);
  const macInput = new Uint8Array(macBody.length + ciphertext.length);
  macInput.set(macBody, 0);
  macInput.set(ciphertext, macBody.length);

  return keccak256(macInput).replace(/^0x/, "");
};

/**
 * Encrypt private key using AES-128-CTR
 */
export const encryptPrivateKey = async (
  privateKey: `0x${string}`,
  derivedKey: Uint8Array,
  iv: Uint8Array,
): Promise<Uint8Array> => {
  // Use leftmost 16 bytes as cipher key
  const cipherKey = derivedKey.slice(0, 16);

  // Encrypt private key using AES-128-CTR
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-CTR",
      counter: iv as BufferSource,
      length: 128,
    },
    await crypto.subtle.importKey("raw", cipherKey, "AES-CTR", false, ["encrypt"]),
    hexToBytes(privateKey) as BufferSource,
  );

  return new Uint8Array(encryptedData);
};

/**
 * Download wallet as Web3 JSON keystore format (Metamask compatible)
 * @param walletData - Wallet data
 * @param password - User's password
 * @param filename - Optional filename
 */
export const downloadEncryptedWallet = async (walletData: WalletData, password: string, filename?: string) => {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(16));

  // Derive key
  const derivedKey = await deriveKey(password, salt);

  // Encrypt private key
  const ciphertext = await encryptPrivateKey(walletData.privateKey, derivedKey, iv);

  // Convert everything to hex for JSON
  const saltHex = bytesToHex(salt).replace(/^0x/, "");
  const ivHex = bytesToHex(iv).replace(/^0x/, "");
  const ciphertextHex = bytesToHex(ciphertext).replace(/^0x/, "");

  // Calculate MAC
  const mac = calculateMac(derivedKey, ciphertext);

  // Remove 0x prefix from address for Web3 format
  const addressWithoutPrefix = walletData.address.replace(/^0x/, "");

  // Web3 JSON Keystore format (compatible with Metamask)
  const web3Keystore = {
    version: 3,
    id: crypto.randomUUID(),
    address: addressWithoutPrefix,
    crypto: {
      ciphertext: ciphertextHex,
      cipherparams: {
        iv: ivHex,
      },
      cipher: "aes-128-ctr",
      kdf: "pbkdf2",
      kdfparams: {
        c: PBKDF2_CONFIG.iterations,
        dklen: PBKDF2_CONFIG.dklen,
        prf: "hmac-sha256",
        salt: saltHex,
      },
      mac: mac,
    },
  };

  const blob = new Blob([JSON.stringify(web3Keystore, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `wallet-${walletData.address.substring(0, 8)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download plain private key as text file (less secure, use with caution)
 * @param privateKey - Private key to download
 * @param address - Wallet address
 */
export const downloadPrivateKey = (privateKey: string, address: string) => {
  const content = `ETHEREUM PRIVATE KEY
==================
Address: ${address}
Private Key: ${privateKey.replace(/^0x/, "")}

⚠️  SECURITY WARNING ⚠️
Keep this file secure and never share it with anyone!
Anyone with this private key has full access to your wallet.

Generated: ${new Date().toISOString()}
`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wallet-${address.substring(0, 8)}-private-key.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
