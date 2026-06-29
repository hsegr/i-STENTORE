import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Shield, Download, Key, AlertCircle, RefreshCw, Eye, EyeOff, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import {
  downloadPem,
  fingerprintFromPublicKeyPem,
  generateDidVerificationMethod,
  isPemPrivateKey,
  isPemPublicKey,
} from "@/lib/verificationMethod";
import type { DIDVerificationMethodData } from "@dataspace-onboarding/shared";

interface VerificationMethodSetupProps {
  onVerificationMethodCreated: (data: DIDVerificationMethodData) => void;
}

type SetupMode = "generate" | "upload";

export const VerificationMethodSetup = ({ onVerificationMethodCreated }: VerificationMethodSetupProps) => {
  const [mode, setMode] = useState<SetupMode>("generate");
  const [isReady, setIsReady] = useState(false);
  const [verificationMethodData, setVerificationMethodData] = useState<DIDVerificationMethodData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [uploadedPublicKey, setUploadedPublicKey] = useState<string>("");
  const [uploadedPrivateKey, setUploadedPrivateKey] = useState<string>("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateDidVerificationMethod();
      setVerificationMethodData(generated);
      setIsReady(true);
      onVerificationMethodCreated(generated);
      toast.success("Ed25519 key pair generated", {
        description: "Use this key pair in DID verification methods for authentication and assertionMethod.",
      });
    } catch (error) {
      toast.error("Generation failed", {
        description: "An error occurred while generating your Ed25519 key pair.",
      });
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublicKeyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = String(loadEvent.target?.result ?? "");
      if (!isPemPublicKey(content)) {
        toast.error("Invalid public key", {
          description: "Upload a PEM-encoded public key file.",
        });
        return;
      }
      setUploadedPublicKey(content);
      toast.success("Public key uploaded");
    };
    reader.readAsText(file);
  };

  const handlePrivateKeyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const content = String(loadEvent.target?.result ?? "");
      if (!isPemPrivateKey(content)) {
        toast.error("Invalid private key", {
          description: "Upload a PEM-encoded private key file.",
        });
        return;
      }
      setUploadedPrivateKey(content);
      toast.success("Private key uploaded");
    };
    reader.readAsText(file);
  };

  const handleUploadComplete = async () => {
    if (!uploadedPublicKey || !uploadedPrivateKey) {
      toast.error("Missing files", {
        description: "Upload both public and private key files.",
      });
      return;
    }

    const publicKeyFingerprintSha256 = await fingerprintFromPublicKeyPem(uploadedPublicKey);
    const uploaded: DIDVerificationMethodData = {
      methodType: "Ed25519VerificationKey2020",
      publicKeyPem: uploadedPublicKey,
      privateKeyPem: uploadedPrivateKey,
      publicKeyFingerprintSha256,
    };

    setVerificationMethodData(uploaded);
    setIsReady(true);
    onVerificationMethodCreated(uploaded);
    toast.success("Verification method keys loaded");
  };

  const handleRegenerate = async () => {
    if (mode === "upload") {
      setIsReady(false);
      setVerificationMethodData(null);
      setUploadedPublicKey("");
      setUploadedPrivateKey("");
      return;
    }
    await handleGenerate();
  };

  const handleDownloadPublicKey = () => {
    if (!verificationMethodData) return;
    downloadPem(verificationMethodData.publicKeyPem, "did-verification-method-public.pem");
  };

  const handleDownloadPrivateKey = () => {
    if (!verificationMethodData) return;
    downloadPem(verificationMethodData.privateKeyPem, "did-verification-method-private.pem");
  };

  const maskedPrivateKeyPreview = "-----BEGIN PRIVATE KEY-----\n••••••••••••••••••••\n-----END PRIVATE KEY-----";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="bg-gradient-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <Key className="size-8 text-primary-foreground" />
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Generate or upload an Ed25519 key pair to use as DID verification methods for signing and authentication.
          The public key is published in your DID Document, while the private key stays under your control.
        </p>
      </div>

      {!isReady ? (
        <Card className="p-6">
          <FieldGroup>
            <Field>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={mode === "generate"}
                  onChange={() => setMode("generate")}
                  className="size-4"
                />
                <span className="text-sm font-medium">Generate Ed25519 key pair automatically</span>
              </label>
            </Field>

            <Field>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" checked={mode === "upload"} onChange={() => setMode("upload")} className="size-4" />
                <span className="text-sm font-medium">Upload existing Ed25519 key pair (PEM)</span>
              </label>
            </Field>

            {mode === "generate" ? (
              <Button
                onClick={handleGenerate}
                variant="outline"
                disabled={isGenerating}
                className="hover:shadow-glow transition-smooth w-full text-foreground"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Ed25519 key pair"
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="publicKey">Public key (PEM format)</FieldLabel>
                  <input
                    id="publicKey"
                    type="file"
                    accept=".pem,.pub,.key"
                    onChange={handlePublicKeyUpload}
                    className="w-full text-sm"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="privateKey">Private key (PEM format)</FieldLabel>
                  <input
                    id="privateKey"
                    type="file"
                    accept=".pem,.key"
                    onChange={handlePrivateKeyUpload}
                    className="w-full text-sm"
                  />
                </Field>

                <Button
                  onClick={handleUploadComplete}
                  variant="outline"
                  disabled={!uploadedPublicKey || !uploadedPrivateKey}
                  className="hover:shadow-glow transition-smooth w-full text-foreground"
                >
                  Confirm upload
                </Button>
              </div>
            )}
          </FieldGroup>
        </Card>
      ) : (
        <div className="space-y-6">
          <Alert className="border-success/50 bg-success/10 dark:border-success/30 dark:bg-success/5">
            <Shield className="size-4 text-success" />
            <AlertDescription className="text-success-foreground">
              Ed25519 verification method keys are ready for DID signing and authentication operations.
            </AlertDescription>
          </Alert>

          <Card className="p-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="vm-public-key">Verification public key</FieldLabel>
                <div className="rounded border border-border bg-muted p-4">
                  <pre className="max-h-48 overflow-auto text-xs">{verificationMethodData?.publicKeyPem}</pre>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="vm-private-key">Verification private key</FieldLabel>
                <div className="relative rounded border border-border bg-muted p-4">
                  <pre className="max-h-48 overflow-auto text-xs">
                    {showPrivateKey ? verificationMethodData?.privateKeyPem : maskedPrivateKeyPreview}
                  </pre>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    onClick={handleRegenerate}
                    variant="ghost"
                    size="sm"
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className={`size-3 ${isGenerating ? "animate-spin" : ""}`} />
                    {mode === "generate" ? "Regenerate" : "Reset uploads"}
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="fingerprint">Public key fingerprint (SHA-256)</FieldLabel>
                <div className="flex items-center gap-2 rounded border border-border bg-muted p-3">
                  <Fingerprint className="size-4 text-primary" />
                  <p className="font-mono text-xs break-all">{verificationMethodData?.publicKeyFingerprintSha256}</p>
                </div>
              </Field>

              <div className="space-y-3">
                <Button
                  onClick={handleDownloadPublicKey}
                  variant="default"
                  className="flex w-full items-center justify-center gap-2"
                >
                  <Download className="size-4" />
                  Download public key
                </Button>
                <Button
                  onClick={handleDownloadPrivateKey}
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2"
                >
                  <Download className="size-4" />
                  Download private key
                </Button>
              </div>

              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>Important Security Information:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Keep your private key secure and never share it</li>
                    <li>• Publish only the public key in DID verification methods</li>
                    <li>• Rotating the key requires a DID document update</li>
                    <li>• Keep an encrypted backup of your private key</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </FieldGroup>
          </Card>
        </div>
      )}
    </div>
  );
};
