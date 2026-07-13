-- Office destination: where a submitted report should be received first

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS destination_office TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_destination_office
  ON documents (destination_office)
  WHERE destination_office IS NOT NULL;
