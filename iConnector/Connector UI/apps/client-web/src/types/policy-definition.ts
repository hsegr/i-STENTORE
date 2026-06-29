export interface PolicyRule {
  type: string;
  value: string;
}

export interface PolicyDefinition {
  id: string;
  name: string;
  type: "access" | "contract" | "usage"; // Assuming these are the types
  description: string;
  rules: PolicyRule[];
  created: string; // The API might not provide this directly, will need a placeholder or logic
  usageCount: number; // Placeholder until we have a way to count usage
}

export interface RawPolicyDefinition {
  "@id": string;
  "@type": string;
  policy: {
    permission?: any[];
    prohibition?: any[];
    obligation?: any[];
  };
  [key: string]: unknown;
}

export interface CreatePolicyRequest {
  "@context": {
    "@vocab": string;
    odrl: string;
  };
  "@id": string;
  policy: {
    "@context": string;
    "@type": string;
    permission: any[];
    prohibition: any[];
    obligation: any[];
  };
}
