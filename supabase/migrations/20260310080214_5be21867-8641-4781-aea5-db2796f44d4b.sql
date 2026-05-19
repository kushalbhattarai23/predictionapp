-- Allow admins to view all user app preferences
CREATE POLICY "Admins can view all app preferences"
ON public.user_app_preferences FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all user app preferences
CREATE POLICY "Admins can update all app preferences"
ON public.user_app_preferences FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert app preferences for any user
CREATE POLICY "Admins can insert app preferences"
ON public.user_app_preferences FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));