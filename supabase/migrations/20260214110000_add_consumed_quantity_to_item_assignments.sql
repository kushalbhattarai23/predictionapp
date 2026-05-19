ALTER TABLE public.settlegara_item_assignments
ADD COLUMN IF NOT EXISTS consumed_quantity NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.settlegara_item_assignments
ADD CONSTRAINT settlegara_item_assignments_consumed_quantity_nonnegative
CHECK (consumed_quantity >= 0);
