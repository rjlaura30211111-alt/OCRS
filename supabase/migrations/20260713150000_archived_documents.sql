-- Archive tables for soft-deleted documents moved out of active tracking

CREATE TABLE IF NOT EXISTS archived_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_document_id UUID NOT NULL,
  reference_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  drafter TEXT NOT NULL,
  action_requested TEXT NOT NULL,
  sent_date DATE NOT NULL,
  sent_time TIME NOT NULL,
  status TEXT NOT NULL,
  received_by TEXT,
  current_office TEXT,
  document_created_at TIMESTAMPTZ NOT NULL,
  document_updated_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_by_office TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS archived_document_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archived_document_id UUID NOT NULL REFERENCES archived_documents(id) ON DELETE CASCADE,
  original_log_id UUID,
  office_code TEXT NOT NULL,
  received_by TEXT,
  status TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_archived_documents_reference
  ON archived_documents (reference_number);

CREATE INDEX IF NOT EXISTS idx_archived_documents_archived_at
  ON archived_documents (archived_at DESC);

ALTER TABLE archived_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_document_routing_logs ENABLE ROW LEVEL SECURITY;
