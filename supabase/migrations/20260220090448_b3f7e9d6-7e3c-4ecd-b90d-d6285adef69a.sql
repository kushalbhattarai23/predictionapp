
-- Trigger function: auto-settle bill when all splits are paid
CREATE OR REPLACE FUNCTION public.auto_settle_bill_on_all_splits_paid()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_bill_id uuid;
  v_all_paid boolean;
BEGIN
  v_bill_id := NEW.bill_id;

  -- Check if all splits for this bill are now 'paid'
  SELECT NOT EXISTS (
    SELECT 1 FROM public.settlegara_bill_splits
    WHERE bill_id = v_bill_id AND status != 'paid'
  ) INTO v_all_paid;

  IF v_all_paid THEN
    UPDATE public.settlegara_bills
    SET status = 'settled'
    WHERE id = v_bill_id AND status != 'settled';
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on settlegara_bill_splits
CREATE TRIGGER trigger_auto_settle_bill
AFTER UPDATE ON public.settlegara_bill_splits
FOR EACH ROW
WHEN (NEW.status = 'paid')
EXECUTE FUNCTION public.auto_settle_bill_on_all_splits_paid();
