-- Enable real-time updates for analyst_signals table
ALTER TABLE public.analyst_signals REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyst_signals;