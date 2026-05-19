-- Drop and recreate the get_network_settlements function with consolidation and transitive simplification
DROP FUNCTION IF EXISTS public.get_network_settlements(_network_id uuid);

CREATE OR REPLACE FUNCTION public.get_network_settlements(_network_id uuid)
RETURNS TABLE(from_user_name text, to_user_name text, amount numeric)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  member_rec RECORD;
  balance_map JSONB := '{}';
  member_id_to_name JSONB := '{}';
  member_ids UUID[];
  i INT;
  j INT;
  m1_id UUID;
  m2_id UUID;
  net_amount NUMERIC;
  creditors UUID[] := ARRAY[]::UUID[];
  debtors UUID[] := ARRAY[]::UUID[];
  creditor_amounts NUMERIC[] := ARRAY[]::NUMERIC[];
  debtor_amounts NUMERIC[] := ARRAY[]::NUMERIC[];
  settle_amount NUMERIC;
  ci INT;
  di INT;
BEGIN
  -- Step 1: Build member id to name mapping and initialize balances
  FOR member_rec IN 
    SELECT id, user_name 
    FROM settlegara_network_members 
    WHERE network_id = _network_id AND status = 'active'
  LOOP
    member_id_to_name := member_id_to_name || jsonb_build_object(member_rec.id::text, member_rec.user_name);
    balance_map := balance_map || jsonb_build_object(member_rec.id::text, 0);
    member_ids := array_append(member_ids, member_rec.id);
  END LOOP;

  -- Step 2: Calculate net balance for each member
  -- Positive = they are owed money (creditor), Negative = they owe money (debtor)
  FOR member_rec IN
    SELECT 
      bs.member_id,
      b.paid_by,
      SUM(bs.amount) as total_owed
    FROM settlegara_bill_splits bs
    JOIN settlegara_bills b ON b.id = bs.bill_id
    WHERE b.network_id = _network_id
      AND bs.status = 'unpaid'
      AND bs.member_id != b.paid_by
      AND b.paid_by IS NOT NULL
    GROUP BY bs.member_id, b.paid_by
  LOOP
    -- Debtor owes money (decrease their balance)
    balance_map := jsonb_set(
      balance_map, 
      ARRAY[member_rec.member_id::text], 
      to_jsonb((balance_map->>member_rec.member_id::text)::numeric - member_rec.total_owed)
    );
    -- Creditor is owed money (increase their balance)
    balance_map := jsonb_set(
      balance_map, 
      ARRAY[member_rec.paid_by::text], 
      to_jsonb((balance_map->>member_rec.paid_by::text)::numeric + member_rec.total_owed)
    );
  END LOOP;

  -- Step 3: Separate into creditors and debtors
  FOR i IN 1..array_length(member_ids, 1) LOOP
    net_amount := (balance_map->>member_ids[i]::text)::numeric;
    IF net_amount > 0.01 THEN
      creditors := array_append(creditors, member_ids[i]);
      creditor_amounts := array_append(creditor_amounts, net_amount);
    ELSIF net_amount < -0.01 THEN
      debtors := array_append(debtors, member_ids[i]);
      debtor_amounts := array_append(debtor_amounts, ABS(net_amount));
    END IF;
  END LOOP;

  -- Step 4: Greedy matching - minimize number of transactions
  ci := 1;
  di := 1;
  WHILE ci <= array_length(creditors, 1) AND di <= array_length(debtors, 1) LOOP
    IF creditor_amounts[ci] <= 0.01 THEN
      ci := ci + 1;
      CONTINUE;
    END IF;
    IF debtor_amounts[di] <= 0.01 THEN
      di := di + 1;
      CONTINUE;
    END IF;

    settle_amount := LEAST(creditor_amounts[ci], debtor_amounts[di]);
    
    IF settle_amount > 0.01 THEN
      from_user_name := member_id_to_name->>debtors[di]::text;
      to_user_name := member_id_to_name->>creditors[ci]::text;
      amount := ROUND(settle_amount, 2);
      RETURN NEXT;
    END IF;

    creditor_amounts[ci] := creditor_amounts[ci] - settle_amount;
    debtor_amounts[di] := debtor_amounts[di] - settle_amount;

    IF creditor_amounts[ci] <= 0.01 THEN
      ci := ci + 1;
    END IF;
    IF debtor_amounts[di] <= 0.01 THEN
      di := di + 1;
    END IF;
  END LOOP;

  RETURN;
END;
$function$;