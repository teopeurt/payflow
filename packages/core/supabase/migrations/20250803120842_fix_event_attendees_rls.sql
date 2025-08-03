-- 1. Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can read event attendees for events they can access" ON app.event_attendees;

-- 2. Create helper function to avoid recursive reference
CREATE OR REPLACE FUNCTION app.user_can_access_event(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    p_event_id IN (
      SELECT id FROM app.calendar_events 
      WHERE created_by = p_user_id
    )
    OR
    p_event_id IN (
      SELECT event_id FROM app.event_attendees 
      WHERE user_id = p_user_id
    )
$$;

-- 3. Recreate the policy using the helper
CREATE POLICY "Users can read event attendees for events they can access"
ON app.event_attendees
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  app.user_can_access_event(event_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM app.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
