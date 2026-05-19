
-- Create budgets table
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2000),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budgets
CREATE POLICY "Users can view their own budgets" 
  ON public.budgets 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" 
  ON public.budgets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
  ON public.budgets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
  ON public.budgets 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budgets 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
