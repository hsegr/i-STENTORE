export type Iri = string;

export type ConstraintArr = NonNullable<NonNullable<PolicySet["odrl:permission"]>[number]["odrl:constraint"]>;

export interface CommonContext {
  "@vocab": string;
  dct: string;
  edc: string;
  dcat: string;
  odrl: string;
  dspace: string;
}

export type ODRLOperator = { "@id": "odrl:eq" };

export interface ODRLConstraint {
  "@type"?: "odrl:Constraint";
  "odrl:leftOperand": Iri | { "@id": Iri };
  "odrl:operator": ODRLOperator;
  "odrl:rightOperand": string | number | boolean | Iri;
}

export interface ODRLAction {
  "@id": Iri; // e.g. "odrl:use"
}

export interface ODRLPermission {
  "odrl:action": ODRLAction;
  "odrl:constraint"?: ODRLConstraint[]; // array if present
}

export interface ODRLProhibition {
  "odrl:action": ODRLAction;
  "odrl:constraint"?: ODRLConstraint[];
}

export interface ODRLDuty {
  "odrl:action": ODRLAction;
  "odrl:constraint"?: ODRLConstraint[];
}

export interface DataService {
  "@id"?: Iri;
  "@type": "dcat:DataService";
  "dcat:endpointURL": string; // REQUIRED

  "dcat:endpointUrl"?: string;
  "dcat:endpointDescription"?: string | Iri;

  [k: string]: unknown;
}

export interface Distribution {
  //"@id"?: Iri;
  "@type": "dcat:Distribution";

  "dct:format"?: Iri | { "@id": Iri } | { "@type"?: Iri; "@value"?: string } | string;

  "dcat:accessService": DataService;

  "dcat:accessURL"?: string | { "@id": string };
  "dcat:downloadURL"?: string | { "@id": string };

  [k: string]: unknown;
}

export interface CatalogRequest {
  "@context": {
    "@vocab": string;
  };
  "@type": "CatalogRequest";
  counterPartyAddress: string;
  counterPartyId: string;
  protocol: string;
  additionalScopes: string[];
  querySpec: {
    offset: number;
    limit: number;
    sortOrder: "DESC" | "ASC";
    sortField: string;
    filterExpression: [];
  };
}

export interface DatasetRequest {
  "@context": {
    "@vocab": string;
  };
  "@type": "DatasetRequest";
  "@id": string;
  counterPartyAddress: string;
  counterPartyId: string;
  protocol: string;
}

export interface CatalogResponse {
  "@context": {
    "@vocab": string;
  };
  "@id": string;
  datasets: Dataset[];
  provider: string;
}

export interface Offer {
  "@context": {
    "@vocab": string;
  };
  "@id": string;
  "odrl:target": string;
  "odrl:policy": Policy;
}

export interface Policy {
  "@id": string;
  "odrl:permission": Permission[];
}

export interface Permission {
  "odrl:action": {
    "odrl:type": string;
  };
  "odrl:target": string;
}

/*export interface Dataset {
  "@id": string;
  offers: Offer[];
  policies: Policy[];
  properties: Record<string, any>;
  distribution: any[];
}*/

export interface PolicySet {
  "@id"?: Iri;
  "@type": "odrl:Set" | "odrl:Offer" | "odrl:Agreement";
  "odrl:permission"?: ODRLPermission[];
  "odrl:prohibition"?: ODRLProhibition[];
  "odrl:obligation"?: ODRLDuty[];

  "odrl:target"?: Iri;

  "@context"?: (Iri | Record<string, string>)[];
}

export interface Dataset {
  "@id": Iri;
  "@type": "dcat:Dataset";

  "odrl:hasPolicy": PolicySet[];

  "dcat:distribution": Distribution[];

  "dct:title"?: string;
  //"dct:description"?: string;
  //"dct:identifier"?: string;
  //"dcat:keyword"?:
  keywords: string[];
  name: string;
  id?: string;
  contenttype: string;
  description: string;

  [k: string]: unknown;
}

export interface Catalog {
  "@id": Iri;
  "@type": "dcat:Catalog";

  "dcat:dataset": Dataset[];

  "dcat:service"?: DataService[];

  "dspace:participantId": string;

  "dcat:catalog"?: Catalog[];
  "dct:title"?: string;
  "dct:description"?: string;

  "@context"?: CommonContext | (Record<string, string> & { "@vocab"?: string });

  [k: string]: unknown;
}

export type RuleItem = ODRLPermission | ODRLProhibition | ODRLDuty;

/*export interface MockCatalogItem {
  "id": string;
  "title": string;

  "provider": string;
  "providerConnector": string;
  "contentType": string;
  "category": string;
  "keywords": string[];
  "license": string;
  "created": string;
  "size": string;
  "updateFrequency": string;
}*/
