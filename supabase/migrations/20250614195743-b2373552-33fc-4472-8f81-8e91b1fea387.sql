
-- Enable RLS on newsletters table if not already enabled
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read published newsletters
CREATE POLICY "Anyone can view published newsletters" 
  ON public.newsletters 
  FOR SELECT 
  USING (status = 'published');

-- Create policy to allow admin users to manage all newsletters
CREATE POLICY "Admin users can manage newsletters" 
  ON public.newsletters 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
      WHERE au.is_active = TRUE
    )
  );

-- Create policy to allow newsletter creation for admin users
CREATE POLICY "Admin users can create newsletters" 
  ON public.newsletters 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
      WHERE au.is_active = TRUE
    )
  );
