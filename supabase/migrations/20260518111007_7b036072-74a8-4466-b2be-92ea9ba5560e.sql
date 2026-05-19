-- Helper to find user_id by email for room invites (restricted to admins or room owners)
CREATE OR REPLACE FUNCTION public.football_find_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT (
    public.football_has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.football_rooms WHERE owner_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT id INTO v_id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  RETURN v_id;
END;
$$;

-- Email lookup helper for admin user-management screen (admin only)
CREATE OR REPLACE FUNCTION public.football_list_users_with_email()
RETURNS TABLE(id uuid, username text, full_name text, is_active boolean, email text, is_admin boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.football_has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT p.id, p.username, p.full_name, p.is_active, u.email::text,
           public.football_has_role(p.id,'admin') AS is_admin
    FROM public.football_profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant admin to seed admin email if user already exists
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'kushal.bhattarai23+test@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.football_profiles(id, username, full_name, is_active)
      VALUES (v_uid, 'kushal_admin', 'Kushal Admin', true)
      ON CONFLICT (id) DO UPDATE SET is_active = true;
    INSERT INTO public.football_user_roles(user_id, role) VALUES (v_uid, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;