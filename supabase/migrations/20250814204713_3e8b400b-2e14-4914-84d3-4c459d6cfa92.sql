-- Configure Supabase to use our custom auth webhook for email sending
UPDATE auth.config 
SET 
  external_email_enabled = true,
  external_email_template = null;

-- Set up the auth webhook configuration to use our edge function
INSERT INTO auth.hooks (hook_table_id, hook_name, created_at) 
VALUES (1, 'send_email', NOW())
ON CONFLICT (hook_table_id, hook_name) DO UPDATE SET 
  created_at = NOW();

-- Disable Supabase's built-in email sending for auth events
UPDATE auth.config 
SET 
  mailer_autoconfirm = false,
  mailer_secure_email_change_enabled = true,
  external_email_enabled = true;