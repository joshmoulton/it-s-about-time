-- Add unique constraint on email for admin_users to prevent duplicates
ALTER TABLE public.admin_users 
ADD CONSTRAINT admin_users_email_unique UNIQUE (email);