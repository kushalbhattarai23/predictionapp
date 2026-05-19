-- Mark payer's own split as paid
UPDATE public.settlegara_bill_splits s
SET status = 'paid', settled_at = COALESCE(settled_at, now())
FROM public.settlegara_bills b
WHERE s.bill_id = b.id
  AND b.paid_by IS NOT NULL
  AND s.member_id = b.paid_by
  AND s.status <> 'paid';

-- Mark bills as settled when every split is paid
UPDATE public.settlegara_bills b
SET status = 'settled'
WHERE b.status <> 'settled'
  AND EXISTS (SELECT 1 FROM public.settlegara_bill_splits WHERE bill_id = b.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.settlegara_bill_splits s
    WHERE s.bill_id = b.id AND s.status <> 'paid'
  );