-- Add ORPRMD-DLOS office access token

INSERT INTO office_access_tokens (office_code, access_token)
VALUES ('ORPRMD-DLOS', 'orprmddlos_1b602d3b205788615bd1b95a7e53b74adf3ecdb8db9dc671')
ON CONFLICT (access_token) DO NOTHING;
