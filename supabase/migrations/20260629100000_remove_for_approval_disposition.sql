-- Remove "For Approval" disposition option

UPDATE documents
SET status = 'For Checking'
WHERE status = 'For Approval';

UPDATE document_routing_logs
SET status = 'For Checking'
WHERE status = 'For Approval';

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (
  status IN (
    'Pending',
    'For Checking',
    'Approved',
    'Return for Correction',
    'Uploaded at OLCIMS'
  )
);
