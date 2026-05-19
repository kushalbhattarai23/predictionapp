
-- Create a table for credits
CREATE TABLE public.credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  person TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for credit payments (to track multiple payments)
CREATE TABLE public.credit_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for credits
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Create policies for credits
CREATE POLICY "Users can view their own credits" 
  ON public.credits 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credits" 
  ON public.credits 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" 
  ON public.credits 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credits" 
  ON public.credits 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS for credit_payments
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_payments (through credit ownership)
CREATE POLICY "Users can view payments for their credits" 
  ON public.credit_payments 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.credits 
    WHERE credits.id = credit_payments.credit_id 
    AND credits.user_id = auth.uid()
  ));

CREATE POLICY "Users can create payments for their credits" 
  ON public.credit_payments 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.credits 
    WHERE credits.id = credit_payments.credit_id 
    AND credits.user_id = auth.uid()
  ));

CREATE POLICY "Users can update payments for their credits" 
  ON public.credit_payments 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.credits 
    WHERE credits.id = credit_payments.credit_id 
    AND credits.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete payments for their credits" 
  ON public.credit_payments 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.credits 
    WHERE credits.id = credit_payments.credit_id 
    AND credits.user_id = auth.uid()
  ));

-- Create function to update remaining amount when payments are made
CREATE OR REPLACE FUNCTION update_credit_remaining_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Subtract payment from remaining amount
    UPDATE public.credits 
    SET remaining_amount = remaining_amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.credit_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Adjust remaining amount based on difference
    UPDATE public.credits 
    SET remaining_amount = remaining_amount + OLD.amount - NEW.amount,
        updated_at = now()
    WHERE id = NEW.credit_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Add back the payment amount to remaining
    UPDATE public.credits 
    SET remaining_amount = remaining_amount + OLD.amount,
        updated_at = now()
    WHERE id = OLD.credit_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update remaining amount
CREATE TRIGGER trigger_update_credit_remaining_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.credit_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_remaining_amount();

-- Add updated_at trigger for credits table
CREATE TRIGGER handle_credits_updated_at 
  BEFORE UPDATE ON public.credits 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();
