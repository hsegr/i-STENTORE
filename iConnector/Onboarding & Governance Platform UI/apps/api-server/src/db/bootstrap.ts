import { sql } from "drizzle-orm";
import { db } from "./client";

const statements = [
  sql`
    CREATE TABLE IF NOT EXISTS governance_pending_requests (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      did TEXT NOT NULL,
      selected_attestators JSONB NOT NULL DEFAULT '[]'::jsonb,
      submitted_at TEXT NOT NULL,
      tls_setup BOOLEAN NOT NULL,
      blockchain_setup BOOLEAN NOT NULL,
      participant_profile JSONB,
      status TEXT NOT NULL DEFAULT 'pending'
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS governance_resolved_requests (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      organization_name TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      did TEXT NOT NULL,
      selected_attestators JSONB NOT NULL DEFAULT '[]'::jsonb,
      submitted_at TEXT NOT NULL,
      tls_setup BOOLEAN NOT NULL,
      blockchain_setup BOOLEAN NOT NULL,
      participant_profile JSONB,
      status TEXT NOT NULL,
      resolved_at TEXT NOT NULL,
      resolved_by TEXT NOT NULL,
      rejection_reason TEXT,
      assigned_roles JSONB,
      lifecycle_status TEXT
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS governance_audit_events (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      type TEXT NOT NULL,
      request_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      details TEXT NOT NULL
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS vc_requests (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      requester_organization_name TEXT,
      holder_did TEXT NOT NULL,
      requested_issuer_id TEXT NOT NULL,
      requested_issuer_organization_name TEXT,
      credential_type TEXT NOT NULL,
      purpose TEXT NOT NULL,
      requested_claims JSONB NOT NULL DEFAULT '{}'::jsonb,
      requested_claim_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
      request_source TEXT NOT NULL DEFAULT 'claims',
      unsigned_credential_id TEXT,
      unsigned_credential_types JSONB NOT NULL DEFAULT '[]'::jsonb,
      pending_payload_available BOOLEAN NOT NULL DEFAULT TRUE,
      encrypted_unsigned_payload JSONB,
      status TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      handled_by TEXT,
      decision_note TEXT,
      issued_credential_id TEXT
    )
  `,
  sql`
    CREATE TABLE IF NOT EXISTS vc_credentials (
      id TEXT PRIMARY KEY,
      holder_id TEXT NOT NULL,
      holder_organization_name TEXT,
      holder_did TEXT NOT NULL,
      issuer_id TEXT NOT NULL,
      issuer_organization_name TEXT,
      credential_type TEXT NOT NULL,
      issuance_date TEXT NOT NULL,
      expiration_date TEXT,
      format TEXT NOT NULL,
      raw_vc_jwt TEXT NOT NULL,
      context_values JSONB NOT NULL DEFAULT '[]'::jsonb,
      type_values JSONB NOT NULL DEFAULT '[]'::jsonb,
      credential_subject JSONB NOT NULL DEFAULT '{}'::jsonb,
      source TEXT NOT NULL,
      linked_request_id TEXT,
      delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
      downloaded_at TEXT,
      encrypted_signed_payload JSONB,
      status TEXT NOT NULL,
      revoked_at TEXT,
      revoked_by TEXT,
      revocation_reason TEXT
    )
  `,
  sql`ALTER TABLE vc_requests ADD COLUMN IF NOT EXISTS requested_claim_keys JSONB NOT NULL DEFAULT '[]'::jsonb`,
  sql`ALTER TABLE vc_requests ADD COLUMN IF NOT EXISTS request_source TEXT NOT NULL DEFAULT 'claims'`,
  sql`ALTER TABLE vc_requests ADD COLUMN IF NOT EXISTS unsigned_credential_id TEXT`,
  sql`ALTER TABLE vc_requests ADD COLUMN IF NOT EXISTS unsigned_credential_types JSONB NOT NULL DEFAULT '[]'::jsonb`,
  sql`ALTER TABLE vc_requests ADD COLUMN IF NOT EXISTS pending_payload_available BOOLEAN NOT NULL DEFAULT TRUE`,
  sql`ALTER TABLE vc_requests ADD COLUMN IF NOT EXISTS encrypted_unsigned_payload JSONB`,
  sql`ALTER TABLE vc_credentials ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT TRUE`,
  sql`ALTER TABLE vc_credentials ADD COLUMN IF NOT EXISTS downloaded_at TEXT`,
  sql`ALTER TABLE vc_credentials ADD COLUMN IF NOT EXISTS encrypted_signed_payload JSONB`,
  sql`CREATE INDEX IF NOT EXISTS governance_pending_owner_id_idx ON governance_pending_requests (owner_id)`,
  sql`CREATE INDEX IF NOT EXISTS governance_resolved_owner_id_idx ON governance_resolved_requests (owner_id)`,
  sql`CREATE INDEX IF NOT EXISTS governance_audit_owner_id_idx ON governance_audit_events (owner_id)`,
  sql`CREATE INDEX IF NOT EXISTS governance_audit_request_id_idx ON governance_audit_events (request_id)`,
  sql`CREATE INDEX IF NOT EXISTS vc_requests_requester_id_idx ON vc_requests (requester_id)`,
  sql`CREATE INDEX IF NOT EXISTS vc_requests_status_idx ON vc_requests (status)`,
  sql`CREATE INDEX IF NOT EXISTS vc_credentials_holder_id_idx ON vc_credentials (holder_id)`,
  sql`CREATE INDEX IF NOT EXISTS vc_credentials_status_idx ON vc_credentials (status)`,
];

export async function initializeDatabase(): Promise<void> {
  for (const statement of statements) {
    await db.execute(statement);
  }
}
