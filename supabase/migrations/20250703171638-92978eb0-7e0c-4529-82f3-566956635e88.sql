-- Add unique constraint to degen_call_subscriptions to prevent duplicate subscriptions
-- First, let's clean up existing duplicates by keeping only the most recent active subscription per user

-- Delete duplicate subscriptions, keeping only the most recent one per user
DELETE FROM degen_call_subscriptions 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_email) id 
  FROM degen_call_subscriptions 
  ORDER BY user_email, created_at DESC
);

-- Add unique constraint on user_email
ALTER TABLE degen_call_subscriptions 
ADD CONSTRAINT degen_call_subscriptions_user_email_unique 
UNIQUE (user_email);