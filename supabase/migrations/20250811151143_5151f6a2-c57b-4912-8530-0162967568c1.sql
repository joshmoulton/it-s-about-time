-- Secure premium/admin read access and admin/service write access for sentiment_alerts, x_posts, x_sentiment_analysis, highlight_topics

-- sentiment_alerts
DO $$
BEGIN
  IF to_regclass('public.sentiment_alerts') IS NOT NULL THEN
    ALTER TABLE public.sentiment_alerts ENABLE ROW LEVEL SECURITY;

    -- Read policy for premium users and admins
    DROP POLICY IF EXISTS sentiment_alerts_premium_read ON public.sentiment_alerts;
    CREATE POLICY sentiment_alerts_premium_read
      ON public.sentiment_alerts
      FOR SELECT
      USING ((get_current_user_tier_optimized() = 'premium'::subscription_tier) OR is_current_user_admin_fast());

    -- Write policies for admins and service role
    DROP POLICY IF EXISTS sentiment_alerts_admin_insert ON public.sentiment_alerts;
    CREATE POLICY sentiment_alerts_admin_insert
      ON public.sentiment_alerts
      FOR INSERT
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS sentiment_alerts_admin_update ON public.sentiment_alerts;
    CREATE POLICY sentiment_alerts_admin_update
      ON public.sentiment_alerts
      FOR UPDATE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role')
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS sentiment_alerts_admin_delete ON public.sentiment_alerts;
    CREATE POLICY sentiment_alerts_admin_delete
      ON public.sentiment_alerts
      FOR DELETE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');
  END IF;
END$$;

-- x_posts
DO $$
BEGIN
  IF to_regclass('public.x_posts') IS NOT NULL THEN
    ALTER TABLE public.x_posts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS x_posts_premium_read ON public.x_posts;
    CREATE POLICY x_posts_premium_read
      ON public.x_posts
      FOR SELECT
      USING ((get_current_user_tier_optimized() = 'premium'::subscription_tier) OR is_current_user_admin_fast());

    DROP POLICY IF EXISTS x_posts_admin_insert ON public.x_posts;
    CREATE POLICY x_posts_admin_insert
      ON public.x_posts
      FOR INSERT
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS x_posts_admin_update ON public.x_posts;
    CREATE POLICY x_posts_admin_update
      ON public.x_posts
      FOR UPDATE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role')
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS x_posts_admin_delete ON public.x_posts;
    CREATE POLICY x_posts_admin_delete
      ON public.x_posts
      FOR DELETE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');
  END IF;
END$$;

-- x_sentiment_analysis
DO $$
BEGIN
  IF to_regclass('public.x_sentiment_analysis') IS NOT NULL THEN
    ALTER TABLE public.x_sentiment_analysis ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS x_sentiment_analysis_premium_read ON public.x_sentiment_analysis;
    CREATE POLICY x_sentiment_analysis_premium_read
      ON public.x_sentiment_analysis
      FOR SELECT
      USING ((get_current_user_tier_optimized() = 'premium'::subscription_tier) OR is_current_user_admin_fast());

    DROP POLICY IF EXISTS x_sentiment_analysis_admin_insert ON public.x_sentiment_analysis;
    CREATE POLICY x_sentiment_analysis_admin_insert
      ON public.x_sentiment_analysis
      FOR INSERT
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS x_sentiment_analysis_admin_update ON public.x_sentiment_analysis;
    CREATE POLICY x_sentiment_analysis_admin_update
      ON public.x_sentiment_analysis
      FOR UPDATE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role')
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS x_sentiment_analysis_admin_delete ON public.x_sentiment_analysis;
    CREATE POLICY x_sentiment_analysis_admin_delete
      ON public.x_sentiment_analysis
      FOR DELETE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');
  END IF;
END$$;

-- highlight_topics
DO $$
BEGIN
  IF to_regclass('public.highlight_topics') IS NOT NULL THEN
    ALTER TABLE public.highlight_topics ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS highlight_topics_premium_read ON public.highlight_topics;
    CREATE POLICY highlight_topics_premium_read
      ON public.highlight_topics
      FOR SELECT
      USING ((get_current_user_tier_optimized() = 'premium'::subscription_tier) OR is_current_user_admin_fast());

    DROP POLICY IF EXISTS highlight_topics_admin_insert ON public.highlight_topics;
    CREATE POLICY highlight_topics_admin_insert
      ON public.highlight_topics
      FOR INSERT
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS highlight_topics_admin_update ON public.highlight_topics;
    CREATE POLICY highlight_topics_admin_update
      ON public.highlight_topics
      FOR UPDATE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role')
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS highlight_topics_admin_delete ON public.highlight_topics;
    CREATE POLICY highlight_topics_admin_delete
      ON public.highlight_topics
      FOR DELETE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');
  END IF;
END$$;

-- newsletter_blacklist: admin/service-only table access (expose via RPCs)
DO $$
BEGIN
  IF to_regclass('public.newsletter_blacklist') IS NOT NULL THEN
    ALTER TABLE public.newsletter_blacklist ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS newsletter_blacklist_admin_select ON public.newsletter_blacklist;
    CREATE POLICY newsletter_blacklist_admin_select
      ON public.newsletter_blacklist
      FOR SELECT
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS newsletter_blacklist_admin_insert ON public.newsletter_blacklist;
    CREATE POLICY newsletter_blacklist_admin_insert
      ON public.newsletter_blacklist
      FOR INSERT
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS newsletter_blacklist_admin_update ON public.newsletter_blacklist;
    CREATE POLICY newsletter_blacklist_admin_update
      ON public.newsletter_blacklist
      FOR UPDATE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role')
      WITH CHECK (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');

    DROP POLICY IF EXISTS newsletter_blacklist_admin_delete ON public.newsletter_blacklist;
    CREATE POLICY newsletter_blacklist_admin_delete
      ON public.newsletter_blacklist
      FOR DELETE
      USING (is_current_user_admin_fast() OR (auth.jwt() ->> 'role') = 'service_role');
  END IF;
END$$;