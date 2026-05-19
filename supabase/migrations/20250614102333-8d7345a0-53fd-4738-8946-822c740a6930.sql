
-- 1. Create an enum for application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Table mapping users to roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer to check if a user has a role (prevents recursion in RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS: only users can see their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roles"
  ON public.user_roles
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id);

