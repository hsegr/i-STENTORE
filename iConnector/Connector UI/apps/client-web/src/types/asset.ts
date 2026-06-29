export interface AssetDataItem {
  id: string;
  [key: string]: { value: number; unit: string } | string;
}

export interface Asset {
  "@context": {
    "@vocab": string;
    edc: string;
    odrl: string;
  };
  "@id": string;
  properties: {
    name: string;
    contenttype: string;
    [key: string]: string | string[] | number | Date;
  };
  dataAddress: {
    type: string;
    name: string;
    baseUrl: string;
    proxyPath: string;
  };
}

export type AssetCreationRequest = Asset;

export interface AssetCreationResponse {
  "@type": "IdResponse";
  "@id": string;
  createdAt: number;
  "@context": {
    "@vocab": string;
    edc: string;
    odrl: string;
  };
}

export interface AssetListRequest {
  "@type": "QuerySpec";
  offset: number;
  limit: number;
  sortOrder: "ASC" | "DESC";
  sortField: string;
  filterExpression: any[];
}

export type AssetListResponse = AssetCreationRequest[];
