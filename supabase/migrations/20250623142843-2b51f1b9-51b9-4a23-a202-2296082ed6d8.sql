
-- Create table for sent messages audit trail
CREATE TABLE public.sent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_user_id UUID NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  message_text TEXT NOT NULL,
  chat_id BIGINT NOT NULL,
  message_thread_id BIGINT,
  topic_name TEXT,
  telegram_message_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for user telegram permissions
CREATE TABLE public.user_telegram_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  can_send_messages BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  daily_message_limit INTEGER DEFAULT 50,
  messages_sent_today INTEGER DEFAULT 0,
  last_message_date DATE,
  banned_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Create table for telegram user mapping
CREATE TABLE public.telegram_user_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_user_id UUID NOT NULL,
  dashboard_email TEXT NOT NULL,
  telegram_user_id BIGINT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dashboard_user_id),
  UNIQUE(telegram_user_id)
);

-- Create table for message audit log
CREATE TABLE public.message_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'sent', 'received', 'deleted', 'moderated'
  user_id UUID,
  user_email TEXT,
  telegram_message_id BIGINT,
  message_content TEXT,
  chat_id BIGINT,
  topic_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.sent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_telegram_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sent_messages
CREATE POLICY "Users can view their own sent messages" 
  ON public.sent_messages 
  FOR SELECT 
  USING (sender_user_id = (SELECT id FROM public.beehiiv_subscribers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can insert their own sent messages" 
  ON public.sent_messages 
  FOR INSERT 
  WITH CHECK (sender_user_id = (SELECT id FROM public.beehiiv_subscribers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Create RLS policies for user_telegram_permissions
CREATE POLICY "Users can view their own permissions" 
  ON public.user_telegram_permissions 
  FOR SELECT 
  USING (user_id = (SELECT id FROM public.beehiiv_subscribers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Create RLS policies for telegram_user_mapping
CREATE POLICY "Users can view their own mapping" 
  ON public.telegram_user_mapping 
  FOR SELECT 
  USING (dashboard_user_id = (SELECT id FROM public.beehiiv_subscribers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Users can update their own mapping" 
  ON public.telegram_user_mapping 
  FOR UPDATE 
  USING (dashboard_user_id = (SELECT id FROM public.beehiiv_subscribers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Create RLS policies for message_audit_log (admin only)
CREATE POLICY "Admins can view audit log" 
  ON public.message_audit_log 
  FOR ALL 
  USING (public.is_current_user_admin());

-- Create function to update daily message count
CREATE OR REPLACE FUNCTION public.update_daily_message_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset count if it's a new day
  UPDATE public.user_telegram_permissions 
  SET 
    messages_sent_today = CASE 
      WHEN last_message_date < CURRENT_DATE THEN 1 
      ELSE messages_sent_today + 1 
    END,
    last_message_date = CURRENT_DATE
  WHERE user_id = NEW.sender_user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for daily message count
CREATE TRIGGER update_daily_message_count_trigger
  AFTER INSERT ON public.sent_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_message_count();

-- Create updated_at triggers
CREATE TRIGGER update_user_telegram_permissions_updated_at
  BEFORE UPDATE ON public.user_telegram_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telegram_user_mapping_updated_at
  BEFORE UPDATE ON public.telegram_user_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
