
CREATE POLICY "Universe owners can manage their show relationships" ON public.show_universes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.universes u
    WHERE u.id = show_universes.universe_id AND u.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.universes u
    WHERE u.id = show_universes.universe_id AND u.creator_id = auth.uid()
  )
);
