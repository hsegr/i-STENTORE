export interface ContractAgreement {
  id: string;
  assetId: string;
  assetName: string;
  counterParty: string;
  status: "active" | "negotiating" | "expired";
  startDate: string;
  endDate: string;
  policy: string; // Placeholder for policy name
  negotiationId: string;
}

export interface RawContractAgreement {
  "@id": string;
  providerId: string;
  consumerId: string;
  assetId: string;
  contractSigningDate: number;
  contractEndDate: number;
  state: string;
  agreementId: string;
}
