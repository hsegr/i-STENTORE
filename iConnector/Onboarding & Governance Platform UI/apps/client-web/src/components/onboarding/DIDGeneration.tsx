import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Fingerprint, Link as LinkIcon } from "lucide-react";
import { generateDID } from "@/lib/did";
import type { WalletData } from "@/lib/wallet";
import type { DIDData } from "@dataspace-onboarding/shared";

interface DIDGenerationProps {
  walletData: WalletData;
  onDIDGenerated: (data: DIDData) => void;
}

// Renamed component for clarity
export const DIDGeneration = ({ walletData, onDIDGenerated }: DIDGenerationProps) => {
  const did = useMemo(() => generateDID(walletData.address), [walletData.address]);

  useEffect(() => {
    onDIDGenerated({
      did,
      walletAddress: walletData.address,
    });
  }, [did, onDIDGenerated, walletData.address]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="bg-gradient-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <Fingerprint className="size-8 text-primary-foreground" />
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Your Decentralized Identifier (DID) is a unique identifier that represents your entity in the DataSpace
          network. It is generated from your wallet address and cryptographic keys.
        </p>
      </div>

      <div className="space-y-6">
        <Alert>
          <LinkIcon className="size-4" />
          <AlertDescription>
            The DID is generated from your wallet address and will be used to establish a verifiable, blockchain-backed
            identity for your connector in a subsequent step.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="did">Generated DID</FieldLabel>
              <Input id="did" value={did} readOnly className="bg-muted font-mono text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">Format: did:indy:besu:wf:{walletData.address}</p>
            </Field>

            <Field>
              <FieldLabel htmlFor="walletAddress">Wallet Address</FieldLabel>
              <Input id="walletAddress" value={walletData.address} readOnly className="bg-muted font-mono text-sm" />
            </Field>
          </FieldGroup>
        </Card>
      </div>

      {/* The isRegistered (Success) state rendering section has been removed */}
    </div>
  );
};
