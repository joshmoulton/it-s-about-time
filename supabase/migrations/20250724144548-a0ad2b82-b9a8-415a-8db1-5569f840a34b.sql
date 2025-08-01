-- Create a blacklist table for broken newsletters that should not be displayed
CREATE TABLE IF NOT EXISTS public.newsletter_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beehiiv_post_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  reason TEXT DEFAULT 'Broken or non-functional newsletter',
  blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blacklisted_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_blacklist ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage blacklist
CREATE POLICY "Admins can manage newsletter blacklist"
ON public.newsletter_blacklist
FOR ALL
TO authenticated
USING (is_current_user_admin_fast())
WITH CHECK (is_current_user_admin_fast());

-- Create policy for public read access (so we can filter out blacklisted newsletters)
CREATE POLICY "Public can read newsletter blacklist for filtering"
ON public.newsletter_blacklist
FOR SELECT
TO anon, authenticated
USING (true);

-- Add the problematic newsletters to the blacklist
INSERT INTO public.newsletter_blacklist (beehiiv_post_id, title, reason, blacklisted_by) VALUES
('post_06c1a6aa-abbc-495b-ae89-873ef5aa5abc', 'Newsletter Sneak Peek', 'Non-functional newsletter template', 'system'),
('post_7546777b-0217-462a-a5d6-4ac238a0c7bc', 'Market Recap', 'Non-functional newsletter template', 'system'),
('post_38d6a0ba-9ea4-4ef3-8559-9d2e0336fafb', 'Newsletter Sneak Peek', 'Non-functional newsletter template', 'system'),
('post_4db9d99f-1676-48a8-8263-bedd4da7e007', 'Market Recap', 'Non-functional newsletter template', 'system'),
('post_a0d8c804-ae9d-4a8b-ba4a-b9b46c5cd9de', 'Newsletter Sneak Peek', 'Non-functional newsletter template', 'system'),
('post_c0e46f18-2ac8-4204-b8b5-7410ce10223c', 'Market Recap', 'Non-functional newsletter template', 'system'),
('post_05289b07-5db4-4911-8451-c83a4a406f7d', 'Newsletter Sneak Peek', 'Non-functional newsletter template', 'system'),
('post_5d99397d-bb5f-490f-875e-dc92c3fd9dfc', 'Market Recap', 'Non-functional newsletter template', 'system'),
('post_cccd5a50-6669-40dd-a231-148386fad98f', 'Newsletter Sneak Peek', 'Non-functional newsletter template', 'system'),
('post_35d53cfd-4e27-4178-b58d-1a3508f4229b', 'Newsletter Sneak Peek', 'Non-functional newsletter template', 'system')
ON CONFLICT (beehiiv_post_id) DO NOTHING;