-- Deletion approval workflow: offices request, OCRS approves and archives.

CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL,
  requested_by_office TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (request_status IN ('pending', 'approved', 'rejected')),
  subject TEXT NOT NULL,
  drafter TEXT NOT NULL,
  action_requested TEXT NOT NULL,
  sent_date DATE NOT NULL,
  sent_time TIME NOT NULL,
  document_status TEXT NOT NULL,
  received_by TEXT,
  current_office TEXT,
  destination_office TEXT,
  document_created_at TIMESTAMPTZ NOT NULL,
  document_updated_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  deleted_by_name TEXT,
  resolved_by_office TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_requests_pending_document
  ON deletion_requests (document_id)
  WHERE request_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status_requested
  ON deletion_requests (request_status, requested_at DESC);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE archived_documents
  ADD COLUMN IF NOT EXISTS deleted_by_name TEXT;

ALTER TABLE archived_documents
  ADD COLUMN IF NOT EXISTS requested_by_office TEXT;
