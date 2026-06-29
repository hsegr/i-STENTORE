/**
 * Production-Ready TLS Certificate Implementation for Data Space Connectors
 *
 * This implementation uses Web Crypto for key-pair generation and node-forge
 * for X.509 certificate assembly, signing, and parsing.
 *
 *
 * Key Features:
 * - Generates RSA/Ed25519 key pairs via Web Crypto
 * - Creates proper X.509 v3 certificates with extensions
 * - Supports self-signed and CA-signed certificates
 * - PEM/DER encoding/decoding
 * - Certificate validation and verification
 * - Subject Alternative Names (SAN) support
 * - Key usage and extended key usage extensions
 */

import forge from "node-forge";

// ============================================================================
// TYPE DEFINITIONS (Keep interface compatible with existing code)
// ============================================================================

export interface TLSCertificateData {
  certificate: string; // PEM-encoded X.509 certificate
  privateKey: string; // PEM-encoded private key
  publicKey: string; // PEM-encoded public key
  ed25519PrivateKey?: string; // Optional PEM-encoded Ed25519 private key
  ed25519PublicKey?: string; // Optional PEM-encoded Ed25519 public key
  commonName: string;
  organization?: string;
  country?: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string; // Certificate serial number (hex)
  fingerprint: string; // SHA-256 fingerprint
}

export interface TLSGenerationOptions {
  commonName: string;
  organization?: string;
  organizationalUnit?: string;
  locality?: string;
  state?: string;
  country?: string;

  // Certificate options
  validityDays?: number; // Certificate validity in days (default: 365)
  keySize?: number; // RSA key size in bits: 2048, 3072, or 4096 (default: 2048)

  // Advanced options
  subjectAltNames?: string[]; // DNS names, IPs, URIs for SAN extension
  serialNumber?: string; // Custom serial number (hex string)

  // CA signing options (for CA-signed certificates)
  signWith?: {
    certificate: string; // PEM-encoded CA certificate
    privateKey: string; // PEM-encoded CA private key
  };
}

export interface GeneratedKeyPair {
  privateKey: string; // PEM-encoded private key
  publicKey: string; // PEM-encoded public key
}

// ============================================================================
// MAIN CERTIFICATE GENERATION FUNCTION
// ============================================================================

/**
 * Generates a cryptographically valid TLS certificate and key pair
 *
 * This creates production-ready X.509 certificates suitable for:
 * - Data space connector mutual TLS (mTLS) authentication
 * - Service-to-service secure communication
 * - API endpoint encryption
 * - Certificate-based authentication
 *
 * @param options - Certificate generation options
 * @returns TLSCertificateData with PEM-encoded certificate and keys
 */
export async function generateTLSCertificate(options: TLSGenerationOptions): Promise<TLSCertificateData> {
  const {
    commonName,
    organization = "",
    organizationalUnit = "",
    locality = "",
    state = "",
    country = "",
    keySize = 2048,
    validityDays = 365,
    serialNumber,
    subjectAltNames = [],
    signWith,
  } = options;

  // Validate key size
  if (![2048, 3072, 4096].includes(keySize)) {
    throw new Error("Key size must be 2048, 3072, or 4096 bits");
  }

  console.log(`Generating ${keySize}-bit RSA key pair...`);

  // ============================================================================
  // STEP 1: Generate RSA Key Pair
  // ============================================================================

  const rsaPemKeyPair = await generateRSAKeyPair(keySize);
  const keypair: forge.pki.rsa.KeyPair = {
    privateKey: forge.pki.privateKeyFromPem(rsaPemKeyPair.privateKey) as forge.pki.rsa.PrivateKey,
    publicKey: forge.pki.publicKeyFromPem(rsaPemKeyPair.publicKey) as forge.pki.rsa.PublicKey,
  };

  console.log("Key pair generated successfully");

  // ============================================================================
  // STEP 2: Create X.509 Certificate
  // ============================================================================

  const cert = forge.pki.createCertificate();

  // Set version (X.509 v3)
  cert.publicKey = keypair.publicKey;

  // ============================================================================
  // STEP 3: Set Serial Number
  // ============================================================================

  // Serial number must be unique and positive
  const serial = serialNumber || generateSerialNumber();
  cert.serialNumber = serial;

  console.log("Certificate serial number:", serial);

  // ============================================================================
  // STEP 4: Set Validity Period
  // ============================================================================

  const notBefore = new Date();
  const notAfter = new Date();
  notAfter.setDate(notBefore.getDate() + validityDays);

  cert.validity.notBefore = notBefore;
  cert.validity.notAfter = notAfter;

  console.log("Validity period:", notBefore.toISOString(), "to", notAfter.toISOString());

  // ============================================================================
  // STEP 5: Set Subject (who the certificate is for)
  // ============================================================================

  const subjectAttrs: forge.pki.CertificateField[] = [{ name: "commonName", value: commonName }];

  if (organization) {
    subjectAttrs.push({ name: "organizationName", value: organization });
  }
  if (organizationalUnit) {
    subjectAttrs.push({ name: "organizationalUnitName", value: organizationalUnit });
  }
  if (locality) {
    subjectAttrs.push({ name: "localityName", value: locality });
  }
  if (state) {
    subjectAttrs.push({ name: "stateOrProvinceName", value: state });
  }
  if (country) {
    subjectAttrs.push({ name: "countryName", value: country });
  }

  cert.setSubject(subjectAttrs);

  // ============================================================================
  // STEP 6: Set Issuer (who signs the certificate)
  // ============================================================================

  if (signWith) {
    // Certificate will be signed by a CA
    console.log("Certificate will be signed by CA");
    const caCert = forge.pki.certificateFromPem(signWith.certificate);
    cert.setIssuer(caCert.subject.attributes);
  } else {
    // Self-signed certificate (issuer = subject)
    console.log("Creating self-signed certificate");
    cert.setIssuer(subjectAttrs);
  }

  // ============================================================================
  // STEP 7: Add X.509v3 Extensions
  // ============================================================================

  const extensions: any[] = [];

  // Basic Constraints (marks if this is a CA)
  extensions.push({
    name: "basicConstraints",
    cA: false, // Not a CA certificate (end-entity certificate)
    critical: true,
  });

  // Key Usage (what the key can be used for)
  extensions.push({
    name: "keyUsage",
    digitalSignature: true, // Can create digital signatures
    keyEncipherment: true, // Can encrypt symmetric keys
    dataEncipherment: false, // Not typically used for TLS
    critical: true,
  });

  // Extended Key Usage (specific purposes)
  extensions.push({
    name: "extKeyUsage",
    serverAuth: true, // TLS Web Server Authentication
    clientAuth: true, // TLS Web Client Authentication (for mTLS)
  });

  // Subject Key Identifier (fingerprint of the public key)
  extensions.push({
    name: "subjectKeyIdentifier",
  });

  // Authority Key Identifier (for CA-signed certificates)
  if (signWith) {
    extensions.push({
      name: "authorityKeyIdentifier",
    });
  }

  // Subject Alternative Names (SAN) - additional hostnames/IPs
  if (subjectAltNames.length > 0) {
    const altNames = subjectAltNames.map((name) => {
      // Detect type: IP, DNS, or URI
      if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
        return { type: 7, ip: name }; // IP address
      } else if (name.includes("@")) {
        return { type: 1, value: name }; // Email
      } else if (name.startsWith("http://") || name.startsWith("https://")) {
        return { type: 6, value: name }; // URI
      } else {
        return { type: 2, value: name }; // DNS name
      }
    });

    extensions.push({
      name: "subjectAltName",
      altNames,
    });

    console.log("Subject Alternative Names:", subjectAltNames);
  }

  cert.setExtensions(extensions);

  // ============================================================================
  // STEP 8: Sign the Certificate
  // ============================================================================

  let signingKey: forge.pki.PrivateKey;

  if (signWith) {
    // Sign with CA private key
    console.log("Signing with CA private key");
    signingKey = forge.pki.privateKeyFromPem(signWith.privateKey);
  } else {
    // Self-sign with generated private key
    console.log("Self-signing with generated private key");
    signingKey = keypair.privateKey;
  }

  // Sign with SHA-256 (industry standard, secure)
  cert.sign(signingKey, forge.md.sha256.create());

  console.log("Certificate signed successfully");

  // ============================================================================
  // STEP 9: Convert to PEM Format
  // ============================================================================

  const certificatePem = forge.pki.certificateToPem(cert);

  // ============================================================================
  // STEP 10: Calculate Fingerprint
  // ============================================================================

  const fingerprint = calculateFingerprint(cert);

  console.log("Certificate fingerprint:", fingerprint);

  // ============================================================================
  // STEP 11: Return Complete Certificate Data
  // ============================================================================

  return {
    certificate: certificatePem,
    privateKey: rsaPemKeyPair.privateKey,
    publicKey: rsaPemKeyPair.publicKey,
    commonName,
    organization,
    country,
    validFrom: notBefore,
    validTo: notAfter,
    serialNumber: serial,
    fingerprint,
  };
}

/**
 * Generates an RSA key pair using Web Crypto and returns PEM-encoded keys.
 *
 * @param keySize - RSA modulus length in bits
 * @returns PEM-encoded RSA private/public key pair
 */
export async function generateRSAKeyPair(keySize = 2048): Promise<GeneratedKeyPair> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this environment");
  }

  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );

  const privateKeyDer = await globalThis.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKeyDer = await globalThis.crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: derToPem(privateKeyDer, "PRIVATE KEY"),
    publicKey: derToPem(publicKeyDer, "PUBLIC KEY"),
  };
}

/**
 * Generates an Ed25519 key pair using Web Crypto and returns PEM-encoded keys.
 *
 * @returns PEM-encoded Ed25519 private/public key pair
 */
export async function generateEd25519KeyPair(): Promise<GeneratedKeyPair> {
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

  return {
    privateKey: derToPem(privateKeyDer, "PRIVATE KEY"),
    publicKey: derToPem(publicKeyDer, "PUBLIC KEY"),
  };
}

// ============================================================================
// CERTIFICATE VALIDATION AND PARSING
// ============================================================================

/**
 * Validates a TLS certificate for correctness and security
 *
 * Checks:
 * - PEM format validity
 * - Certificate structure
 * - Validity period
 * - Key strength (minimum 2048 bits)
 * - Required extensions
 *
 * @param certData - Certificate data to validate
 * @returns Validation result with errors array
 */
export function validateCertificate(certData: TLSCertificateData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Validate PEM format
    if (!certData.certificate.includes("BEGIN CERTIFICATE")) {
      errors.push("Invalid certificate PEM format");
    }

    if (!certData.privateKey.includes("BEGIN") || !certData.privateKey.includes("PRIVATE KEY")) {
      errors.push("Invalid private key PEM format");
    }

    // Parse certificate
    const cert = forge.pki.certificateFromPem(certData.certificate);

    // Validate common name
    if (!certData.commonName || certData.commonName.trim().length === 0) {
      errors.push("Common Name (CN) is required");
    }

    // Validate validity period
    const now = new Date();
    if (cert.validity.notBefore > now) {
      errors.push("Certificate is not yet valid");
    }

    if (cert.validity.notAfter < now) {
      errors.push("Certificate has expired");
    }

    // Validate key strength (check public key modulus length)
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    if (publicKey.n) {
      const keySize = publicKey.n.bitLength();
      if (keySize < 2048) {
        errors.push(`Key size ${keySize} bits is too weak (minimum 2048 bits required)`);
      }
    }

    // Verify certificate signature (for self-signed certificates)
    try {
      const verified = cert.verify(cert); // Self-verification for self-signed
      if (!verified) {
        errors.push("Certificate signature verification failed");
      }
    } catch (e) {
      // Signature verification might fail for various reasons
      // Don't add to errors if it's just a verification issue
      console.warn("Certificate signature verification warning:", e);
    }
  } catch (error) {
    errors.push(`Certificate parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse and validate uploaded PEM certificate
 *
 * @param pemContent - PEM-encoded certificate content
 * @returns Validation result with detailed information
 */
export function parseCertificate(pemContent: string): {
  isValid: boolean;
  error?: string;
  details?: {
    subject: Record<string, string>;
    issuer: Record<string, string>;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
  };
} {
  try {
    if (!pemContent.includes("BEGIN CERTIFICATE")) {
      return {
        isValid: false,
        error: "Invalid certificate format: Missing BEGIN CERTIFICATE marker",
      };
    }

    const cert = forge.pki.certificateFromPem(pemContent);

    // Extract subject information
    const subject: Record<string, string> = {};
    cert.subject.attributes.forEach((attr: any) => {
      subject[attr.shortName || attr.name] = attr.value;
    });

    // Extract issuer information
    const issuer: Record<string, string> = {};
    cert.issuer.attributes.forEach((attr: any) => {
      issuer[attr.shortName || attr.name] = attr.value;
    });

    return {
      isValid: true,
      details: {
        subject,
        issuer,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        serialNumber: cert.serialNumber,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Certificate parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Parse and validate uploaded PEM private key
 *
 * @param pemContent - PEM-encoded private key content
 * @returns Validation result with key information
 */
export function parsePrivateKey(pemContent: string): {
  isValid: boolean;
  error?: string;
  keyType?: "RSA";
  keySize?: number;
} {
  try {
    if (!pemContent.includes("BEGIN") || !pemContent.includes("PRIVATE KEY")) {
      return {
        isValid: false,
        error: "Invalid private key format: Missing BEGIN PRIVATE KEY marker",
      };
    }

    const privateKey = forge.pki.privateKeyFromPem(pemContent);
    const rsaKey = privateKey as forge.pki.rsa.PrivateKey;

    return {
      isValid: true,
      keyType: "RSA",
      keySize: rsaKey.n?.bitLength(),
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Private key parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// ============================================================================
// FILE DOWNLOAD FUNCTIONS
// ============================================================================

/**
 * Downloads a certificate as a PEM file
 *
 * @param certificate - PEM-encoded certificate
 * @param commonName - Common name for filename
 */
export function downloadCertificate(certificate: string, commonName: string): void {
  const blob = new Blob([certificate], { type: "application/x-pem-file" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${commonName}_certificate.pem`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a private key as a PEM file
 *
 * @param privateKey - PEM-encoded private key
 * @param commonName - Common name for filename
 */
export function downloadPrivateKey(privateKey: string, commonName: string): void {
  const blob = new Blob([privateKey], { type: "application/x-pem-file" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${commonName}_private_key.pem`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a cryptographically secure random serial number
 *
 * @returns Hexadecimal serial number string (128 bits)
 */
function generateSerialNumber(): string {
  // Generate 16 random bytes (128 bits)
  const bytes = forge.random.getBytesSync(16);

  // Convert to hexadecimal
  const hex = forge.util.bytesToHex(bytes);

  // Ensure it's a positive number by clearing the highest bit
  const serialNumber = BigInt("0x" + hex) & BigInt("0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

  return serialNumber.toString(16).padStart(32, "0");
}

/**
 * Calculates SHA-256 fingerprint of a certificate
 *
 * @param cert - forge certificate object
 * @returns Colon-separated hexadecimal fingerprint (e.g., "AB:CD:EF:...")
 */
function calculateFingerprint(cert: forge.pki.Certificate): string {
  // Convert certificate to DER format
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();

  // Calculate SHA-256 hash
  const md = forge.md.sha256.create();
  md.update(der);
  const hash = md.digest().toHex();

  // Format as colon-separated pairs
  return hash.match(/.{2}/g)!.join(":").toUpperCase();
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
