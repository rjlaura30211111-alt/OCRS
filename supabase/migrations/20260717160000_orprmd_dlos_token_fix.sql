-- Fix ORPRMD-DLOS tokens: allow multiple active tokens and restore legacy RPRMD-DLOS QR

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

-- Older printed PDF used office code RPRMD-DLOS with this token prefix.
INSERT INTO office_access_tokens (office_code, access_token)
VALUES ('ORPRMD-DLOS', 'rprmddlos_88a3795a322f0d2392c4dabeadb5d500be07809a065b6995')
ON CONFLICT (access_token) DO NOTHING;
