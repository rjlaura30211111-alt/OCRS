-- Add RPRMD-DLOS office access token

INSERT INTO office_access_tokens (office_code, access_token)
VALUES ('RPRMD-DLOS', 'rprmddlos_88a3795a322f0d2392c4dabeadb5d500be07809a065b6995')
ON CONFLICT (access_token) DO NOTHING;
