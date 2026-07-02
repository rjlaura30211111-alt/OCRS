-- Add OCRS-only disposition: Approved-Completed (marks document as completed)

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
