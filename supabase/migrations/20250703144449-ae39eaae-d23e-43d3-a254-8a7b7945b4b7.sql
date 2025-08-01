-- Create video tutorials table (only if not exists)
CREATE TABLE IF NOT EXISTS public.video_tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unlisted')),
  required_tier TEXT NOT NULL DEFAULT 'free' CHECK (required_tier IN ('free', 'paid', 'premium')),
  difficulty_level TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Video tutorials are viewable by everyone" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can insert video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can update video tutorials" ON public.video_tutorials;
DROP POLICY IF EXISTS "Authenticated users can delete video tutorials" ON public.video_tutorials;

-- Create policies for video tutorials access
CREATE POLICY "Video tutorials are viewable by everyone" 
ON public.video_tutorials 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert video tutorials" 
ON public.video_tutorials 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update video tutorials" 
ON public.video_tutorials 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete video tutorials" 
ON public.video_tutorials 
FOR DELETE 
USING (auth.uid() IS NOT NULL);