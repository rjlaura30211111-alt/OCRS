-- Add OCRS-only completed dispositions to documents status check

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (
  status IN (
    'Pending',
    'For Checking',
    'Approved',
    'Return for Correction',
    'Uploaded to OLCIMS',
    'Approved-Completed',
    'Approved by CRS',
    'Noted By CRS',
    'Approved by RD',
    'Noted by RD'
  )
);
