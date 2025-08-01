-- Now add the unique constraint
ALTER TABLE public.admin_users 
ADD CONSTRAINT admin_users_email_unique UNIQUE (email);