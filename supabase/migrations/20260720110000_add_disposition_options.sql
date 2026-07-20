-- Add disposition options: Signed by RD/CRS, Pull-out, Hand Carry, For Concur, HWI
-- Keeps legacy values for existing records.

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
