-- Per-office access tokens for receive/edit authorization

CREATE TABLE IF NOT EXISTS office_access_tokens (
  office_code TEXT PRIMARY KEY,
  access_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_office_access_tokens_token
  ON office_access_tokens (access_token);

ALTER TABLE office_access_tokens ENABLE ROW LEVEL SECURITY;
