-- Create enum for skill categories
CREATE TYPE public.skill_category AS ENUM (
  'technology',
  'design',
  'business',
  'language',
  'music',
  'sports',
  'cooking',
  'crafts',
  'academic',
  'other'
);

-- Create enum for request status
CREATE TYPE public.request_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'completed',
  'cancelled'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category skill_category NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_skills table (many-to-many)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('offered', 'wanted')),
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, skill_id, skill_type)
);

-- Create skill_requests table
CREATE TABLE public.skill_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  offered_skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  message TEXT,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_request_id UUID REFERENCES public.skill_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(reviewer_id, reviewee_id, skill_request_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for skills
CREATE POLICY "Skills are viewable by everyone" 
ON public.skills FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create skills" 
ON public.skills FOR INSERT 
TO authenticated WITH CHECK (true);

-- RLS Policies for user_skills
CREATE POLICY "User skills are viewable by everyone" 
ON public.user_skills FOR SELECT USING (true);

CREATE POLICY "Users can manage their own skills" 
ON public.user_skills FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for skill_requests
CREATE POLICY "Users can view requests they're involved in" 
ON public.skill_requests FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = provider_id);

CREATE POLICY "Users can create requests" 
ON public.skill_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests they're involved in" 
ON public.skill_requests FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = provider_id);

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile rating
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    avg_rating = (
      SELECT COALESCE(AVG(rating::decimal), 0)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update ratings when reviews are added
CREATE OR REPLACE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skill_requests_updated_at
  BEFORE UPDATE ON public.skill_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample skills
INSERT INTO public.skills (name, category, description) VALUES
('JavaScript', 'technology', 'Modern web development with JavaScript'),
('Python', 'technology', 'Programming with Python for various applications'),
('React', 'technology', 'Frontend framework for building user interfaces'),
('UI/UX Design', 'design', 'User interface and experience design'),
('Logo Design', 'design', 'Creating brand identities and logos'),
('Spanish', 'language', 'Learn or practice Spanish conversation'),
('French', 'language', 'French language tutoring and conversation'),
('Guitar', 'music', 'Learn to play acoustic or electric guitar'),
('Piano', 'music', 'Piano lessons from beginner to advanced'),
('Cooking', 'cooking', 'Learn various cooking techniques and recipes'),
('Photography', 'design', 'Digital photography and photo editing'),
('Marketing', 'business', 'Digital marketing and strategy'),
('Writing', 'academic', 'Creative writing and content creation'),
('Yoga', 'sports', 'Yoga instruction and mindfulness practices'),
('Public Speaking', 'business', 'Improve presentation and communication skills');