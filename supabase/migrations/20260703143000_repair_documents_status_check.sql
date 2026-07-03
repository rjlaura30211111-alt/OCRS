-- Repair documents_status_check for current disposition values.
-- Safe to re-run in Supabase SQL Editor if saves fail with documents_status_check.

UPDATE documents
SET status = 'Uploaded to OLCIMS'
WHERE status = 'Uploaded at OLCIMS';

UPDATE document_routing_logs
SET status = 'Uploaded to OLCIMS'
WHERE status = 'Uploaded at OLCIMS';

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (
  status IN (
    'Pending',
    'For Checking',
    'Approved',
    'Return for Correction',
    'Uploaded to OLCIMS',
    'Approved-Completed'
  )
);
