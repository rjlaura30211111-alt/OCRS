-- Add RCSU, RLO, REU, RPO, RSTU office access tokens

INSERT INTO office_access_tokens (office_code, access_token)
VALUES
  ('RCSU', 'rcsu_b18b4d3af60f83584a1de21473b3936d1d40d97f510cd6c0'),
  ('RLO', 'rlo_e450702b25cd280375214893b7ca50c6d6aa785779b2833c'),
  ('REU', 'reu_634551beb39313126e6fc5ea7a5ada9cb696edf2c1b2ff02'),
  ('RPO', 'rpo_9559c3518b00e12d318560d517173dd5f2ecc6a7bd9d7ca3'),
  ('RSTU', 'rstu_2bbf339467b3f5c9a506d477f833b3dd22b11451c0769f5c')
ON CONFLICT (access_token) DO NOTHING;
