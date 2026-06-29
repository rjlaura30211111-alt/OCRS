-- OCRS document tracker schema
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  drafter TEXT NOT NULL,
  action_requested TEXT NOT NULL,
  sent_date DATE NOT NULL,
  sent_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  received_by TEXT,
  current_office TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documents_status_check CHECK (
    status IN (
      'Pending',
      'For Checking',
      'Approved',
      'Return for Correction',
      'Uploaded at OLCIMS'
    )
  )
);

CREATE TABLE IF NOT EXISTS document_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  office_code TEXT NOT NULL,
  received_by TEXT,
  status TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_documents_reference ON documents(reference_number);
CREATE INDEX IF NOT EXISTS idx_routing_document ON document_routing_logs(document_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_routing_logs ENABLE ROW LEVEL SECURITY;
