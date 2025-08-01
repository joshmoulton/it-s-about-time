-- Create video tutorials table
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

-- Create policies for video tutorials access (simplified for now)
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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_tutorials_updated_at
BEFORE UPDATE ON public.video_tutorials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment video views
CREATE OR REPLACE FUNCTION public.increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.video_tutorials
  SET view_count = view_count + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;