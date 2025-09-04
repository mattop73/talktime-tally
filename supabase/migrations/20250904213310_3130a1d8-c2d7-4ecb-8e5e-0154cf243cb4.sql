-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create participants table
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_speaking_time INTEGER DEFAULT 0, -- in seconds
  speaking_sessions INTEGER DEFAULT 0,
  is_currently_speaking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Create speaking sessions table
CREATE TABLE public.speaking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER -- in seconds, calculated when session ends
);

-- Enable RLS
ALTER TABLE public.speaking_sessions ENABLE ROW LEVEL SECURITY;

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  asker_name TEXT, -- null if anonymous
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings
CREATE POLICY "Users can view meetings they created or participate in" 
ON public.meetings 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own meetings" 
ON public.meetings 
FOR UPDATE 
USING (created_by = auth.uid());

-- Create RLS policies for participants
CREATE POLICY "Users can view participants in their meetings" 
ON public.participants 
FOR SELECT 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage participants in their meetings" 
ON public.participants 
FOR ALL 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

-- Create RLS policies for speaking sessions
CREATE POLICY "Users can view speaking sessions in their meetings" 
ON public.speaking_sessions 
FOR SELECT 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage speaking sessions in their meetings" 
ON public.speaking_sessions 
FOR ALL 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

-- Create RLS policies for subjects
CREATE POLICY "Users can manage subjects in their meetings" 
ON public.subjects 
FOR ALL 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

-- Create RLS policies for questions
CREATE POLICY "Users can view questions in their meetings" 
ON public.questions 
FOR SELECT 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Anyone can submit questions to meetings" 
ON public.questions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can manage questions in their meetings" 
ON public.questions 
FOR UPDATE 
USING (
  meeting_id IN (
    SELECT id FROM public.meetings WHERE created_by = auth.uid()
  )
);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.speaking_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;