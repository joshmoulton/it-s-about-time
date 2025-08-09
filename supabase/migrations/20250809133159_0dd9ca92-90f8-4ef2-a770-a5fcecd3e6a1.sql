-- 1) Add subscriber_id to user_profiles and enforce unique mapping
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscriber_id uuid;

-- 2) Foreign key to beehiiv_subscribers(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_subscriber_id_fkey'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_subscriber_id_fkey
      FOREIGN KEY (subscriber_id)
      REFERENCES public.beehiiv_subscribers(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 3) Unique index on subscriber_id when present (allow multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_subscriber_id_key 
  ON public.user_profiles(subscriber_id) 
  WHERE subscriber_id IS NOT NULL;

-- 4) Helpful lookup indexes for case-insensitive email joins
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_email_lower 
  ON public.user_profiles (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_user_profiles_whop_email_lower 
  ON public.user_profiles (lower(whop_email));

-- 5) Backfill subscriber_id by matching emails
UPDATE public.user_profiles up
SET subscriber_id = bs.id,
    updated_at = now()
FROM public.beehiiv_subscribers bs
WHERE (lower(up.user_email) = lower(bs.email) OR lower(up.whop_email) = lower(bs.email))
  AND (up.subscriber_id IS NULL OR up.subscriber_id <> bs.id);
