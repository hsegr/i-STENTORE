import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch } from "react-hook-form";
import z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Eye, EyeOff, Download, Key, Shield, AlertCircle, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { generateWallet, downloadEncryptedWallet, downloadPrivateKey, type WalletData } from "@/lib/wallet";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Uppercase letter required")
      .regex(/[a-z]/, "Lowercase letter required")
      .regex(/\d/, "Number required")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Special character required"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface WalletSetupProps {
  onWalletCreated: (walletData: WalletData) => void;
}

export const WalletSetup = ({ onWalletCreated }: WalletSetupProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [walletGenerated, setWalletGenerated] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [userPassword, setUserPassword] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadJson, setDownloadJson] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<PasswordFormValues>({
    resolver: downloadJson ? zodResolver(passwordSchema) : undefined, // only validate password if JSON selected
    mode: "onTouched",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" }) || "";

  const requirements = [
    { met: password.length >= 8, label: "8+ characters" },
    { met: /[A-Z]/.test(password), label: "Uppercase" },
    { met: /[a-z]/.test(password), label: "Lowercase" },
    { met: /\d/.test(password), label: "Number" },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'Special character !@#$%^&*(),.?":{}|<>' },
  ];

  const onSubmit = (data: PasswordFormValues) => {
    try {
      const wallet = generateWallet();
      const walletWithExportMode: WalletData = {
        ...wallet,
        usesEncryptedKeystore: downloadJson,
      };
      setWalletData(walletWithExportMode);
      setUserPassword(downloadJson ? data.password : "");
      setWalletGenerated(true);

      onWalletCreated(walletWithExportMode);

      toast.success("Wallet Generated Successfully", {
        description: "Your Ethereum wallet has been created securely.",
      });
    } catch (error) {
      toast.error("Wallet Generation Failed", {
        description: "An error occurred while generating your wallet. Please try again.",
      });
      console.error("Wallet generation error:", error);
    }
  };

  const handleDownloadEncrypted = async () => {
    if (!walletData || !userPassword) return;

    setIsDownloading(true);
    try {
      await downloadEncryptedWallet(walletData, userPassword);
      toast.success("Encrypted Wallet Downloaded", {
        description: "Your wallet has been encrypted with your password and downloaded securely.",
      });
    } catch (error) {
      toast.error("Download Failed", {
        description: "Failed to download encrypted wallet. Please try again.",
      });
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPlainKey = () => {
    if (!walletData) return;

    downloadPrivateKey(walletData.privateKey, walletData.address);
    toast.success("Private Key Downloaded", {
      description: "Keep this file secure and never share it with anyone.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="bg-gradient-primary mx-auto mb-4 flex size-4 items-center justify-center rounded-full">
          <Key className="size-5 text-primary-foreground" />
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Create a secure wallet for your blockchain identity. This wallet will be used to sign transactions and manage
          your decentralized identity within the DataSpace.
        </p>
      </div>

      {!walletGenerated ? (
        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={downloadJson} onChange={() => setDownloadJson(!downloadJson)} />
                  Download Encrypted JSON Keystore
                </label>
              </Field>

              {downloadJson && (
                <>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.error ? true : undefined}>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter a secure password"
                            aria-invalid={!!fieldState.error}
                            className="pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />

                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.error ? true : undefined}>
                        <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            aria-invalid={!!fieldState.error}
                            className="pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>
                        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                      </Field>
                    )}
                  />

                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {requirements.map((req) => (
                      <span
                        key={req.label}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                          req.met ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {req.met ? <Check className="size-3" /> : <AlertCircle className="size-3" />}
                        {req.label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="outline"
                disabled={downloadJson && !isValid} // only require valid password if JSON download is selected
                className="hover:shadow-glow transition-smooth w-full text-foreground"
              >
                Generate Wallet
              </Button>
            </FieldGroup>
          </form>
        </Card>
      ) : (
        <div className="space-y-6">
          <Alert className="border-success/50 bg-success/10 dark:border-success/30 dark:bg-success/5">
            <Shield className="size-4 text-success" />
            <AlertDescription className="text-success-foreground">
              Your wallet has been successfully generated! Your wallet address is ready and your private key can be
              downloaded below.
            </AlertDescription>
          </Alert>

          <Card className="p-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="walletAddress">Wallet Address</FieldLabel>
                <Input id="walletAddress" value={walletData?.address || ""} readOnly className="bg-muted font-mono" />
              </Field>
              <div className="space-y-3">
                {downloadJson && (
                  <Button
                    onClick={handleDownloadEncrypted}
                    variant="default"
                    disabled={isDownloading}
                    className="flex w-full items-center justify-center gap-2"
                  >
                    <Lock className="size-4" />
                    Download Encrypted Wallet (Recommended)
                  </Button>
                )}

                <Button
                  onClick={handleDownloadPlainKey}
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2"
                >
                  <Download className="size-4" />
                  Download Plain Private Key
                </Button>
              </div>

              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <strong>Important Security Information:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      • <strong>Encrypted wallet</strong> is protected by your password and can be safely stored
                    </li>
                    <li>
                      • <strong>Plain private key</strong> gives direct access to your wallet - store it extremely
                      securely
                    </li>
                    <li>• Never share your private key or password with anyone</li>
                    <li>• Loss of both your password and backup means permanent loss of access</li>
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
