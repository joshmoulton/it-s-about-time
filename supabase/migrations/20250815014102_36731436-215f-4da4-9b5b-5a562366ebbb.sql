-- Test inserting a magic link token to see if there are any issues
INSERT INTO magic_link_tokens (email, token, expires_at, tier, created_at)
VALUES (
  'test@example.com',
  'test-token-123',
  (NOW() + INTERVAL '15 minutes'),
  'premium',
  NOW()
);