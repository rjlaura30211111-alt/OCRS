-- Remove mistyped ORLDDD / orlddd_ token; canonical ORLRDD uses rlrdd_ prefix

DELETE FROM office_access_tokens WHERE office_code = 'ORLDDD';
DELETE FROM office_access_tokens
WHERE access_token = 'orlddd_f2dd6d00c87b3226bd2bee96f4bb31e7a49d271dc63ae3f6';

INSERT INTO office_access_tokens (office_code, access_token)
VALUES ('ORLRDD', 'rlrdd_d3da1c68acef46d48ec988247e240ea7a6460a5320dce80b')
ON CONFLICT (access_token) DO UPDATE
SET office_code = EXCLUDED.office_code;
