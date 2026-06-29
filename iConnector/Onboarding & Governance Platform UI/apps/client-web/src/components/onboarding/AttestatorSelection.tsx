import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Shield, AlertCircle, CheckCircle2 } from "lucide-react";

export interface Attestator {
  id: string;
  name: string;
  did: string;
  status: "active" | "pending" | "inactive";
}

export const mockAttestators: Attestator[] = [
  {
    id: "1",
    name: "European Dynamics",
    did: "did:indy:besu:wf:0x33b31221a381ccd08d57ca6419ecaf853c8937c9",
    status: "active",
  },
  {
    id: "2",
    name: "Hardware & Software Engineering",
    did: "did:indy:besu:wf:0x27924733244ec40950300ce660be0bdce896a9e8",
    status: "active",
  },
  {
    id: "3",
    name: "AIR Institute",
    did: "did:indy:besu:wf:0xA8D489A0d59bA1669eFF344Be06A8772a02553E3",
    status: "active",
  },
];

interface AttestatorSelectionProps {
  onSelectionChange: (selectedAttestators: string[]) => void;
  selectedAttestators: string[];
}

export const AttestatorSelection = ({ onSelectionChange, selectedAttestators }: AttestatorSelectionProps) => {
  const [attestators, setAttestators] = useState<Attestator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setAttestators(mockAttestators);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAttestatorToggle = (attestatorId: string) => {
    const newSelection = selectedAttestators.includes(attestatorId)
      ? selectedAttestators.filter((id) => id !== attestatorId)
      : [...selectedAttestators, attestatorId];

    onSelectionChange(newSelection);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-gradient-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
            <Users className="size-8 animate-pulse text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading trusted attestators from blockchain...</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="flex items-start space-x-4">
                <div className="size-6 rounded bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/3 rounded bg-muted"></div>
                  <div className="h-4 w-2/3 rounded bg-muted"></div>
                  <div className="h-3 w-1/2 rounded bg-muted"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-gradient-primary mx-auto mb-4 flex size-4 items-center justify-center rounded-full">
          <Users className="size-8 text-primary-foreground" />
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Select trusted attestators who will verify your decentralized identity. These entities will be responsible for
          issuing verifiable credentials that prove your identity attributes within the DataSpace.
        </p>
      </div>

      {selectedAttestators.length === 0 && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            You must select at least one attestator to proceed. Choose attestators that align with your verification
            needs.
          </AlertDescription>
        </Alert>
      )}

      {selectedAttestators.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {selectedAttestators.length} attestator{selectedAttestators.length > 1 ? "s" : ""} selected. Your connector
            will remain in pending state until approved by the selected attestators.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {attestators.map((attestator) => (
          <Card
            key={attestator.id}
            className={`cursor-pointer p-6 transition-all hover:shadow-md ${
              selectedAttestators.includes(attestator.id) ? "bg-primary/5 ring-2 ring-primary" : ""
            }`}
            onClick={() => handleAttestatorToggle(attestator.id)}
          >
            <div className="flex items-start space-x-4">
              <Checkbox
                checked={selectedAttestators.includes(attestator.id)}
                onChange={() => handleAttestatorToggle(attestator.id)}
                className="mt-1"
              />

              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                      {attestator.name}
                      {attestator.status === "active" && <Shield className="size-4 text-green-600" />}
                    </h3>
                    <p className="font-mono text-sm text-muted-foreground">{attestator.did}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={attestator.status === "active" ? "default" : "secondary"}
                      className={attestator.status === "active" ? "bg-green-100 text-green-800" : ""}
                    >
                      {attestator.status.charAt(0).toUpperCase() + attestator.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription>
          <strong>Note:</strong> You can select multiple attestators for broader verification coverage. Each selected
          attestator must approve your identity before you can fully participate in the DataSpace.
        </AlertDescription>
      </Alert>
    </div>
  );
};
