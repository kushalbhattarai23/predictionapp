-- Add scheduled transfer support to scheduled_payments
ALTER TABLE public.scheduled_payments
  ADD COLUMN IF NOT EXISTS to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

ALTER TABLE public.scheduled_payments
  DROP CONSTRAINT IF EXISTS scheduled_payments_type_check;

ALTER TABLE public.scheduled_payments
  ADD CONSTRAINT scheduled_payments_type_check
  CHECK (type IN ('income', 'expense', 'transfer'));

CREATE INDEX IF NOT EXISTS idx_scheduled_payments_to_wallet_id
  ON public.scheduled_payments(to_wallet_id);
