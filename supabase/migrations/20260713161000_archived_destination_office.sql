-- Add destination office to archived documents for historical records

ALTER TABLE archived_documents
  ADD COLUMN IF NOT EXISTS destination_office TEXT;
