
-- Create content management tables for admin panel

-- Create newsletters table
CREATE TABLE public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, scheduled
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES public.beehiiv_subscribers(id),
  read_time_minutes INTEGER DEFAULT 5,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video tutorials table for "The Edge"
CREATE TABLE public.video_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, unlisted
  difficulty_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  required_tier subscription_tier DEFAULT 'free',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration_hours DECIMAL(4,2),
  required_tier subscription_tier DEFAULT 'free',
  instructor_name TEXT,
  price_cents INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course modules table
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  estimated_duration_minutes INTEGER,
  content_type TEXT DEFAULT 'video', -- video, text, quiz, assignment
  content_url TEXT,
  content_text TEXT,
  is_preview BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  published_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT DEFAULT 'Weekly Wizdom Team',
  read_time_minutes INTEGER DEFAULT 5,
  category TEXT DEFAULT 'general', -- market_analysis, trading_tips, education, general
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  required_tier subscription_tier DEFAULT 'free',
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin users table for role management
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID REFERENCES public.beehiiv_subscribers(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin', -- super_admin, admin, editor, moderator
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subscriber_id)
);

-- Create content analytics table
CREATE TABLE public.content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- newsletter, video, course, article
  content_id UUID NOT NULL,
  user_id UUID REFERENCES public.beehiiv_subscribers(id),
  action_type TEXT NOT NULL, -- view, like, share, complete, start
  session_duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content tables (admin access only for management)
CREATE POLICY "Admins can manage newsletters"
  ON public.newsletters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.is_active = TRUE
    )
  );

CREATE POLICY "Users can view published newsletters"
  ON public.newsletters
  FOR SELECT
  TO authenticated
  USING (status = 'published' AND published_at <= now());

-- Similar policies for other content tables
CREATE POLICY "Admins can manage video tutorials"
  ON public.video_tutorials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.is_active = TRUE
    )
  );

CREATE POLICY "Users can view published videos"
  ON public.video_tutorials
  FOR SELECT
  TO authenticated
  USING (
    status = 'published' 
    AND EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers bs
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND (
        required_tier = 'free' OR
        (required_tier = 'paid' AND bs.subscription_tier IN ('paid', 'premium')) OR
        (required_tier = 'premium' AND bs.subscription_tier = 'premium')
      )
    )
  );

-- Add similar policies for courses, articles, etc.
CREATE POLICY "Admins can manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.is_active = TRUE
    )
  );

CREATE POLICY "Users can view published courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.beehiiv_subscribers bs
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND (
        required_tier = 'free' OR
        (required_tier = 'paid' AND bs.subscription_tier IN ('paid', 'premium')) OR
        (required_tier = 'premium' AND bs.subscription_tier = 'premium')
      )
    )
  );

-- Admin users policies
CREATE POLICY "Only super admins can manage admin users"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      JOIN public.beehiiv_subscribers bs ON au.subscriber_id = bs.id
      WHERE bs.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND au.role = 'super_admin'
      AND au.is_active = TRUE
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_newsletters_status_published ON public.newsletters(status, published_at DESC);
CREATE INDEX idx_video_tutorials_status ON public.video_tutorials(status, created_at DESC);
CREATE INDEX idx_courses_status_tier ON public.courses(status, required_tier);
CREATE INDEX idx_articles_status_category ON public.articles(status, category, published_at DESC);
CREATE INDEX idx_content_analytics_content ON public.content_analytics(content_type, content_id, created_at DESC);
CREATE INDEX idx_admin_users_subscriber ON public.admin_users(subscriber_id, is_active);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_newsletters_updated_at 
  BEFORE UPDATE ON public.newsletters 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_video_tutorials_updated_at 
  BEFORE UPDATE ON public.video_tutorials 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON public.courses 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at 
  BEFORE UPDATE ON public.course_modules 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_articles_updated_at 
  BEFORE UPDATE ON public.articles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON public.admin_users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
