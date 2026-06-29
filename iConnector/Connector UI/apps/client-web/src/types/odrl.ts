interface OdrlPolicy {
  "@context"?: string;
  "@id"?: string;
  "@type": string;
  "odrl:uid": string;
  "odrl:profile"?: string | string[];
  "odrl:inheritFrom"?: string | string[];
  "odrl:conflict"?: string;
  "odrl:target"?: string;
  "odrl:assigner"?: string;
  "odrl:assignee"?: string;
  "odrl:permission"?: OdrlPermission[];
  "odrl:prohibition"?: OdrlProhibition[];
  "odrl:obligation"?: OdrlDuty[];
}

interface OdrlSet extends OdrlPolicy {}

interface OdrlOffer extends OdrlPolicy {
  "odrl:assigner": string;
}

interface OdrlAgreement extends OdrlPolicy {
  "odrl:assigner": string;
  "odrl:assignee": string;
}

interface OdrlRule {
  "@id"?: string;
  "odrl:action": {
    "odrl:type": string;
  };
  "odrl:constraint"?: OdrlConstraint;
  "odrl:target"?: string;
  "odrl:assigner"?: string;
  "odrl:assignee"?: string;
  "odrl:failure"?: OdrlRule[];
}

interface OdrlPermission extends OdrlRule {
  "odrl:duty"?: OdrlDuty[];
}

interface OdrlProhibition extends OdrlRule {
  "odrl:remedy"?: OdrlDuty[];
}

interface OdrlDuty extends OdrlRule {
  "odrl:consequence"?: OdrlDuty[];
}
