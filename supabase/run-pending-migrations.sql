-- Run this entire script in Supabase SQL Editor (project: uzfpxjuzceoukoibwoit)
-- Fixes: archived_documents missing, destination_office column, office renames

-- 1) Archive tables (required for Delete on Track my Reports)
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
  destination_office TEXT,
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

-- 2) Office destination on active documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS destination_office TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_destination_office
  ON documents (destination_office)
  WHERE destination_office IS NOT NULL;

-- 3) Add destination_office to archived_documents if table existed without it
ALTER TABLE archived_documents
  ADD COLUMN IF NOT EXISTS destination_office TEXT;

-- 4) Rename ORLDDD -> ORLRDD
UPDATE office_access_tokens SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';
UPDATE documents SET current_office = 'ORLRDD' WHERE current_office = 'ORLDDD';
UPDATE documents SET destination_office = 'ORLRDD' WHERE destination_office = 'ORLDDD';
UPDATE document_routing_logs SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';
UPDATE archived_documents SET current_office = 'ORLRDD' WHERE current_office = 'ORLDDD';
UPDATE archived_documents SET destination_office = 'ORLRDD' WHERE destination_office = 'ORLDDD';
UPDATE archived_documents SET archived_by_office = 'ORLRDD' WHERE archived_by_office = 'ORLDDD';
UPDATE archived_document_routing_logs SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';

-- 5) Rename RPRMD-DLOS -> ORPRMD-DLOS
UPDATE office_access_tokens SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
UPDATE documents SET current_office = 'ORPRMD-DLOS' WHERE current_office = 'RPRMD-DLOS';
UPDATE documents SET destination_office = 'ORPRMD-DLOS' WHERE destination_office = 'RPRMD-DLOS';
UPDATE document_routing_logs SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
UPDATE archived_documents SET current_office = 'ORPRMD-DLOS' WHERE current_office = 'RPRMD-DLOS';
UPDATE archived_documents SET destination_office = 'ORPRMD-DLOS' WHERE destination_office = 'RPRMD-DLOS';
UPDATE archived_documents SET archived_by_office = 'ORPRMD-DLOS' WHERE archived_by_office = 'RPRMD-DLOS';
UPDATE archived_document_routing_logs SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
