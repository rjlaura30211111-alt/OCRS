-- Repair documents_status_check for current disposition values.
-- Safe to re-run in Supabase SQL Editor if saves fail with documents_status_check.
--
-- IMPORTANT: Drop the old constraint FIRST, then update rows, then re-add.

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

UPDATE documents
SET status = 'Uploaded to OLCIMS'
WHERE status = 'Uploaded at OLCIMS';

UPDATE document_routing_logs
SET status = 'Uploaded to OLCIMS'
WHERE status = 'Uploaded at OLCIMS';

UPDATE documents
SET status = 'For Checking'
WHERE status = 'For Approval';

UPDATE document_routing_logs
SET status = 'For Checking'
WHERE status = 'For Approval';

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
