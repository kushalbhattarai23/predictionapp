
-- Remove the loans table and any related components
DROP TABLE IF EXISTS public.loans CASCADE;

-- Remove any indexes related to loans (if they exist)
DROP INDEX IF EXISTS idx_loans_user_id;
DROP INDEX IF EXISTS idx_loans_status;
DROP INDEX IF EXISTS idx_loans_type;
