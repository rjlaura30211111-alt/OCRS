-- Allow multiple active tokens per office (e.g. old + reprinted PDF QRs)

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

-- Previous PDF generation (2026-06-30 first batch) — keep valid for printed QRs
INSERT INTO office_access_tokens (office_code, access_token)
VALUES
  ('ORD', 'ord_358321c71d843fcbae3af48d4a318dbd28acd46cbbc14772'),
  ('ODRDA', 'odrda_9414181d42dded5424938302c06af02e8b8dae9c2d38039f'),
  ('ODRDO', 'odrdo_04de1d4938d478efc05b0dfe866dd1386ac203f4abfff8dc'),
  ('OCRS', 'ocrs_277d868dcfbf6937e3e5e4975e82313ab5ba14477c36be7f'),
  ('ORPRMD', 'orprmd_ef642d8afab371e08ba6a2baf84d4b3ae2271943cdf55c0c'),
  ('ORID', 'orid_b968dfb0213137eb6cbc673753910c8873b29fec69651b65'),
  ('OROD', 'orod_f66dd641eefd56f908ec8a53a76634d06e734705890a10bd'),
  ('ORLDDD', 'orlddd_f2dd6d00c87b3226bd2bee96f4bb31e7a49d271dc63ae3f6'),
  ('ORCADD', 'orcadd_5153702c35bfad090415d90d3b43e1caba89342f8254ad76'),
  ('ORCD', 'orcd_b24a9bf5c46231adf872f625cc1a3d4bca3a6ceae5bf174c'),
  ('ORIDMD', 'oridmd_7f141ab6d6f799fe07e015d774e8dee58371378df20a998b'),
  ('ORETD', 'oretd_0d0a9dbaf6084667c08ff686a3dd8ec462a29c860c1ea79b'),
  ('ORPSMD', 'orpsmd_5d75cc2d6655492444842c9d6ad8308e835311cf2a2e85ca'),
  ('ORICTMD', 'orictmd_03b0091e843258c73f14abdd2e2ec2bf9c7cfacd0c1aaa49'),
  ('ORESPO', 'orespo_d833393bb01216c916f06bedae8ed4004c066a09b817a47d'),
  ('RHSU', 'rhsu_114b81035f089e59ee48ac524937fef71fc37aaa65d1fab5'),
  ('RPSMU', 'rpsmu_a1a17dee23393a783ac36d6f9c4d61f270e5fff030e63829'),
  ('RHRU', 'rhru_74177f22d852b06fac2c0814cd9b4487f6eaa1182bf18d85'),
  ('RDEU', 'rdeu_0b8f2b227f682c435aeb57275f09c29db48085c689bda405')
ON CONFLICT (access_token) DO NOTHING;
