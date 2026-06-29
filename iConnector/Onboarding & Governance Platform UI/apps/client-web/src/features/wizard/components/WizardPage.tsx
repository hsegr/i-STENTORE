import { useState } from "react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { VerificationMethodSetup } from "@/components/onboarding/TLSSetup";
import { WalletSetup } from "@/components/onboarding/WalletSetup";
import { DIDGeneration } from "@/components/onboarding/DIDGeneration";
import { AttestatorSelection, mockAttestators } from "@/components/onboarding/AttestatorSelection";
import { ParticipantReviewDetails } from "@/components/onboarding/ParticipantReviewDetails";
import { OnboardingSummary } from "@/components/onboarding/OnboardingSummary";
import { OnboardingSuccess } from "@/components/onboarding/OnboardingSuccess";
import type { WalletData } from "@/lib/wallet";
import type { DIDData, DIDVerificationMethodData, ParticipantProfile } from "@dataspace-onboarding/shared";

export function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationMethodData, setVerificationMethodData] = useState<DIDVerificationMethodData | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [didData, setDidData] = useState<DIDData | null>(null);
  const [selectedAttestators, setSelectedAttestators] = useState<string[]>([]);
  const [participantDetailsValid, setParticipantDetailsValid] = useState(false);
  const [participantProfile, setParticipantProfile] = useState<ParticipantProfile>({
    organizationName: "",
    intendedParticipation: null,
    businessPurpose: "",
    contactEmail: "",
    website: "",
    country: "",
    additionalInformation: "",
  });
  const [isComplete, setIsComplete] = useState(false);

  const attestatorsList = mockAttestators.map((att) => ({
    id: att.id,
    name: att.name,
    did: att.did,
  }));

  const totalSteps = 6;

  const canProceedStep1 = participantDetailsValid;
  const canProceedStep2 = verificationMethodData !== null;
  const canProceedStep3 = walletData !== null;
  const canProceedStep4 = selectedAttestators.length > 0;
  const canProceedStep5 = didData !== null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsComplete(true);
  };

  if (isComplete) {
    return <OnboardingSuccess />;
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ParticipantReviewDetails
            value={participantProfile}
            onChange={setParticipantProfile}
            onValidityChange={setParticipantDetailsValid}
          />
        );
      case 2:
        return <VerificationMethodSetup onVerificationMethodCreated={setVerificationMethodData} />;
      case 3:
        return <WalletSetup onWalletCreated={setWalletData} />;
      case 4:
        return (
          <AttestatorSelection
            onSelectionChange={setSelectedAttestators}
            selectedAttestators={selectedAttestators}
          />
        );
      case 5:
        return walletData && verificationMethodData ? (
          <DIDGeneration walletData={walletData} onDIDGenerated={setDidData} />
        ) : null;
      case 6:
        return (
          <OnboardingSummary
            verificationMethodData={verificationMethodData}
            walletData={walletData}
            didData={didData}
            selectedAttestators={selectedAttestators}
            attestatorsList={attestatorsList}
            participantProfile={participantProfile}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Organisation Details";
      case 2:
        return "DID Verification Method Keys";
      case 3:
        return "Wallet Setup";
      case 4:
        return "Select Attestators";
      case 5:
        return "DID Generation & Confirmation";
      case 6:
        return "Configuration Summary";
      default:
        return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "Provide organization details for issuer validation and admission review";
      case 2:
        return "Generate an Ed25519 key pair for DID signing and authentication verification methods";
      case 3:
        return "Create your blockchain wallet for decentralized identity management";
      case 4:
        return "Choose trusted entities to verify your identity attributes";
      case 5:
        return "Confirm your generated Decentralized Identifier (DID)";
      case 6:
        return "Review and confirm your DataSpace configuration";
      default:
        return "";
    }
  };

  const getCanGoNext = () => {
    switch (currentStep) {
      case 1:
        return canProceedStep1;
      case 2:
        return canProceedStep2;
      case 3:
        return canProceedStep3;
      case 4:
        return canProceedStep4;
      case 5:
        return canProceedStep5;
      case 6:
        return false;
      default:
        return false;
    }
  };

  const getNextLabel = () => {
    switch (currentStep) {
      case 1:
        return "Continue to Verification Method Keys";
      case 2:
        return "Continue to Wallet Setup";
      case 3:
        return "Continue to Attestators";
      case 4:
        return "Continue to DID Generation";
      case 5:
        return "Review Configuration";
      case 6:
        return "Complete Setup";
      default:
        return "Continue";
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrevious={handlePrevious}
      canGoNext={getCanGoNext()}
      canGoPrevious={currentStep > 1}
      nextLabel={getNextLabel()}
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
    >
      {getStepContent()}
    </OnboardingLayout>
  );
}
