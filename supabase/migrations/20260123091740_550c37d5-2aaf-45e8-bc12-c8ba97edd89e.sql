-- Add discount_amount column to settlegara_bills table
ALTER TABLE public.settlegara_bills
ADD COLUMN discount_amount numeric DEFAULT 0;