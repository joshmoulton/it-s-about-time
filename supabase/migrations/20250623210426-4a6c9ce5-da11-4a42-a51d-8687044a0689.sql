
-- Create enhanced topic management tables
CREATE TABLE public.telegram_topic_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_topic_id BIGINT NOT NULL,
  original_name TEXT,
  custom_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(telegram_topic_id)
);

-- Create message sync status tracking
CREATE TABLE public.telegram_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'webhook'
  messages_processed INTEGER DEFAULT 0,
  messages_synced INTEGER DEFAULT 0,
  messages_deleted INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed', -- 'running', 'completed', 'failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topic discovery log
CREATE TABLE public.telegram_topic_discovery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_topic_id BIGINT NOT NULL,
  discovered_name TEXT,
  confidence_score FLOAT DEFAULT 0.0,
  discovery_method TEXT NOT NULL, -- 'message_analysis', 'admin_command', 'manual'
  message_samples JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(telegram_topic_id)
);

-- Add indexes for performance
CREATE INDEX idx_telegram_topic_mappings_topic_id ON public.telegram_topic_mappings(telegram_topic_id);
CREATE INDEX idx_telegram_topic_mappings_active ON public.telegram_topic_mappings(is_active);
CREATE INDEX idx_telegram_sync_status_sync_type ON public.telegram_sync_status(sync_type);
CREATE INDEX idx_telegram_sync_status_created_at ON public.telegram_sync_status(created_at);
CREATE INDEX idx_telegram_topic_discovery_topic_id ON public.telegram_topic_discovery(telegram_topic_id);

-- Enable RLS
ALTER TABLE public.telegram_topic_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_topic_discovery ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow authenticated users to view topic mappings" 
  ON public.telegram_topic_mappings 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to manage topic mappings" 
  ON public.telegram_topic_mappings 
  FOR ALL 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to view sync status" 
  ON public.telegram_sync_status 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow service role to manage sync status" 
  ON public.telegram_sync_status 
  FOR ALL 
  TO service_role 
  USING (true);

CREATE POLICY "Allow authenticated users to view topic discovery" 
  ON public.telegram_topic_discovery 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow service role to manage topic discovery" 
  ON public.telegram_topic_discovery 
  FOR ALL 
  TO service_role 
  USING (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_telegram_topic_mappings_updated_at
  BEFORE UPDATE ON public.telegram_topic_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
