import { describe, expect, it } from "vite-plus/test";
import { extractAddressFromWallet, generateDID, pemToBase64, validateDID } from "@/lib/did";

describe("did utilities", () => {
  const walletAddress = "0xAbCDEF1234567890abcdef1234567890ABCDEF12" as const;

  it("generates a deterministic indy besu DID from a wallet address", () => {
    expect(generateDID(walletAddress)).toBe("did:indy:besu:wf:0xabcdef1234567890abcdef1234567890abcdef12");
  });

  it("extracts the lowercase wallet address without the 0x prefix", () => {
    expect(extractAddressFromWallet(walletAddress)).toBe("abcdef1234567890abcdef1234567890abcdef12");
  });

  it("normalizes PEM public keys to base64 content", () => {
    expect(
      pemToBase64(`-----BEGIN PUBLIC KEY-----
      abc
      DEF
      -----END PUBLIC KEY-----`),
    ).toBe("abcDEF");
  });

  it("validates supported DID format and rejects malformed values", () => {
    expect(validateDID("did:indy:besu:wf:0xabcdef1234567890abcdef1234567890abcdef12")).toEqual({
      isValid: true,
    });

    expect(validateDID("did:indy:besu:wf:not-an-address")).toEqual({
      isValid: false,
      error: "Invalid DID format. Expected: did:indy:besu:wf:0x<address>",
    });
  });
});
