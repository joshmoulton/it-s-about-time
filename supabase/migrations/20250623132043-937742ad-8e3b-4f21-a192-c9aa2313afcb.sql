
-- Create backup_history table to track database backup operations
CREATE TABLE public.backup_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  file_size_mb DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Add Row Level Security (RLS) 
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin users can view backup history" 
  ON public.backup_history 
  FOR SELECT 
  USING (public.is_current_user_admin());

-- Create policy for admin insert
CREATE POLICY "Admin users can create backup records" 
  ON public.backup_history 
  FOR INSERT 
  WITH CHECK (public.is_current_user_admin());

-- Create policy for admin update
CREATE POLICY "Admin users can update backup records" 
  ON public.backup_history 
  FOR UPDATE 
  USING (public.is_current_user_admin());

-- Add index for performance
CREATE INDEX idx_backup_history_created_at ON public.backup_history(created_at DESC);
CREATE INDEX idx_backup_history_status ON public.backup_history(status);
