export interface ContractDefinition {
  id: string;
  name: string;
  assetId: string;
  assetName: string;
  accessPolicy: string;
  contractPolicy: string;
  created: string;
}

export interface RawContractDefinition {
  "@id": string;
  accessPolicyId: string;
  contractPolicyId: string;
  assetsSelector: any[];
}

export interface CreateContractRequest {
  "@context": {
    "@vocab": string;
  };
  "@id": string;
  accessPolicyId: string;
  contractPolicyId: string;
  assetsSelector: any[];
}

export interface ContractDefinitionListRequest {
  "@context": { "@vocab": "https://w3id.org/edc/v0.0.1/ns/" };
  "@type": string;
  offset: number;
  limit: number;
  //sortOrder?: "ASC" | "DESC";
  //sortField?: string;
  filterExpression: [];
}

export interface ContractDefinitionListResponse {
  "@id": string;
  "@type": "ContractDefinition";
  accessPolicyId: string;
  contractPolicyId: string;
  assetsSelector: [];
  "@context": {
    "@vocab": "https://w3id.org/edc/v0.0.1/ns/";
    edc: "https://w3id.org/edc/v0.0.1/ns/";
    odrl: "http://www.w3.org/ns/odrl/2/";
  };
}
