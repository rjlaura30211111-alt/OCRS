-- RESUME: safe to re-run from any partial state.
-- Run entire script in Supabase SQL Editor.

-- 0) Ensure archive tables + destination_office columns exist first
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

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS destination_office TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_destination_office
  ON documents (destination_office)
  WHERE destination_office IS NOT NULL;

ALTER TABLE archived_documents
  ADD COLUMN IF NOT EXISTS destination_office TEXT;

-- 1) Merge ORLDDD token into ORLRDD (delete typo row if ORLRDD already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'ORLDDD') THEN
    IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'ORLRDD') THEN
      DELETE FROM office_access_tokens WHERE office_code = 'ORLDDD';
    ELSE
      UPDATE office_access_tokens SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';
    END IF;
  END IF;
END $$;

UPDATE documents SET current_office = 'ORLRDD' WHERE current_office = 'ORLDDD';
UPDATE documents SET destination_office = 'ORLRDD' WHERE destination_office = 'ORLDDD';
UPDATE document_routing_logs SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';
UPDATE archived_documents SET current_office = 'ORLRDD' WHERE current_office = 'ORLDDD';
UPDATE archived_documents SET destination_office = 'ORLRDD' WHERE destination_office = 'ORLDDD';
UPDATE archived_documents SET archived_by_office = 'ORLRDD' WHERE archived_by_office = 'ORLDDD';
UPDATE archived_document_routing_logs SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';

-- 2) Merge RPRMD-DLOS token into ORPRMD-DLOS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'RPRMD-DLOS') THEN
    IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'ORPRMD-DLOS') THEN
      DELETE FROM office_access_tokens WHERE office_code = 'RPRMD-DLOS';
    ELSE
      UPDATE office_access_tokens SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
    END IF;
  END IF;
END $$;

UPDATE documents SET current_office = 'ORPRMD-DLOS' WHERE current_office = 'RPRMD-DLOS';
UPDATE documents SET destination_office = 'ORPRMD-DLOS' WHERE destination_office = 'RPRMD-DLOS';
UPDATE document_routing_logs SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
UPDATE archived_documents SET current_office = 'ORPRMD-DLOS' WHERE current_office = 'RPRMD-DLOS';
UPDATE archived_documents SET destination_office = 'ORPRMD-DLOS' WHERE destination_office = 'RPRMD-DLOS';
UPDATE archived_documents SET archived_by_office = 'ORPRMD-DLOS' WHERE archived_by_office = 'RPRMD-DLOS';
UPDATE archived_document_routing_logs SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';

-- 3) Allow multiple tokens per office + restore legacy RPRMD-DLOS printed QR
ALTER TABLE office_access_tokens
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

UPDATE office_access_tokens
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE office_access_tokens
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE office_access_tokens DROP CONSTRAINT IF EXISTS office_access_tokens_pkey;

ALTER TABLE office_access_tokens
  ADD CONSTRAINT office_access_tokens_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_office_access_tokens_token_unique
  ON office_access_tokens (access_token);

INSERT INTO office_access_tokens (office_code, access_token)
VALUES ('ORPRMD-DLOS', 'rprmddlos_88a3795a322f0d2392c4dabeadb5d500be07809a065b6995')
ON CONFLICT (access_token) DO NOTHING;

-- 4) Disposition options (Signed by RD/CRS, Pull-out, Hand Carry, For Concur, HWI, OLCIMS)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (
  status IN (
    'Pending',
    'For Checking',
    'Approved',
    'Return for Correction',
    'Signed by RD',
    'Signed by CRS',
    'Pull-out',
    'Hand Carry',
    'For Concur',
    'HWI',
    'Uploaded to OLCIMS',
    'Approved-Completed',
    'Approved by CRS',
    'Noted By CRS',
    'Approved by RD',
    'Noted by RD',
    'Uploaded at OLCIMS'
  )
);

-- 5) Deletion approval workflow + archive audit fields
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
