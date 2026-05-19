
-- Create a table to store user requests
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_type CHECK (type IN ('tv_show_request', 'other_feedback'))
);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own requests
CREATE POLICY "Users can create their own requests"
ON public.requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can manage all requests
CREATE POLICY "Admins can manage all requests"
ON public.requests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
