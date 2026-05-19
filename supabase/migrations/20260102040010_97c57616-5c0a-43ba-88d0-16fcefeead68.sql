
-- Fix the get_network_settlements function to use paid_by (member_id) instead of created_by (auth user_id)
CREATE OR REPLACE FUNCTION public.get_network_settlements(_network_id uuid)
RETURNS TABLE(from_user_name text, to_user_name text, amount numeric)
LANGUAGE sql
STABLE
AS $$
WITH member_names AS (
  SELECT id AS member_id, user_name
  FROM settlegara_network_members
  WHERE network_id = _network_id
),
-- Get all unpaid bill splits where the member owes money to the payer
member_debts AS (
  SELECT
    bs.member_id AS from_id,
    b.paid_by AS to_id,
    bs.amount
  FROM settlegara_bill_splits bs
  JOIN settlegara_bills b ON b.id = bs.bill_id
  WHERE b.network_id = _network_id
    AND bs.status = 'unpaid'
    AND bs.member_id != b.paid_by  -- Exclude the payer from owing themselves
    AND b.paid_by IS NOT NULL
),
pairwise_combinations AS (
  SELECT m1.member_id AS from_id, m2.member_id AS to_id
  FROM member_names m1
  JOIN member_names m2 ON m1.member_id <> m2.member_id
),
net_debts AS (
  SELECT
    pc.from_id,
    pc.to_id,
    COALESCE(SUM(CASE WHEN md.from_id = pc.from_id AND md.to_id = pc.to_id THEN md.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN md.from_id = pc.to_id AND md.to_id = pc.from_id THEN md.amount ELSE 0 END), 0) AS net_amount
  FROM pairwise_combinations pc
  LEFT JOIN member_debts md ON
    (md.from_id = pc.from_id AND md.to_id = pc.to_id)
    OR (md.from_id = pc.to_id AND md.to_id = pc.from_id)
  GROUP BY pc.from_id, pc.to_id
),
final_settlements AS (
  SELECT from_id, to_id, net_amount
  FROM net_debts
  WHERE net_amount > 0
)
SELECT
  fn.user_name AS from_user_name,
  tn.user_name AS to_user_name,
  fs.net_amount AS amount
FROM final_settlements fs
JOIN member_names fn ON fn.member_id = fs.from_id
JOIN member_names tn ON tn.member_id = fs.to_id;
$$;
