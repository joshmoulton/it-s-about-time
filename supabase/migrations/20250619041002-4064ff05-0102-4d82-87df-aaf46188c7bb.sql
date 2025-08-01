
-- Create table to track sync jobs and their progress
CREATE TABLE public.beehiiv_sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL DEFAULT 'subscribers', -- 'subscribers', 'purchases', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'paused'
  total_pages INTEGER,
  current_page INTEGER DEFAULT 1,
  total_records INTEGER,
  processed_records INTEGER DEFAULT 0,
  synced_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track failed sync items for retry
CREATE TABLE public.beehiiv_sync_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_job_id UUID REFERENCES public.beehiiv_sync_jobs(id) ON DELETE CASCADE,
  item_data JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_beehiiv_subscribers_email ON public.beehiiv_subscribers(email);
CREATE INDEX idx_beehiiv_subscribers_beehiiv_id ON public.beehiiv_subscribers(beehiiv_subscriber_id);
CREATE INDEX idx_beehiiv_subscribers_tier ON public.beehiiv_subscribers(subscription_tier);
CREATE INDEX idx_beehiiv_subscribers_status ON public.beehiiv_subscribers(status);
CREATE INDEX idx_beehiiv_sync_jobs_status ON public.beehiiv_sync_jobs(status);
CREATE INDEX idx_beehiiv_sync_jobs_type ON public.beehiiv_sync_jobs(job_type);

-- Add triggers for updated_at
CREATE TRIGGER update_beehiiv_sync_jobs_updated_at
    BEFORE UPDATE ON public.beehiiv_sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
