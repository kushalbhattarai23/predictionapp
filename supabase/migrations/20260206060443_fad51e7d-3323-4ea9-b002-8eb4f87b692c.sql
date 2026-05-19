-- Create scheduled_payments table
CREATE TABLE public.scheduled_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table (universal audit/notification system)
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'scheduled_payment', 'network_invite', 'payment_due', 'transaction_added', 'system', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Additional data like payment_id, network_id, amount, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_payments
CREATE POLICY "Users can view their own scheduled payments"
  ON public.scheduled_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled payments"
  ON public.scheduled_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled payments"
  ON public.scheduled_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled payments"
  ON public.scheduled_payments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on scheduled_payments
CREATE TRIGGER update_scheduled_payments_updated_at
  BEFORE UPDATE ON public.scheduled_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_scheduled_payments_user_id ON public.scheduled_payments(user_id);
CREATE INDEX idx_scheduled_payments_next_date ON public.scheduled_payments(next_date);
CREATE INDEX idx_scheduled_payments_is_active ON public.scheduled_payments(is_active);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);