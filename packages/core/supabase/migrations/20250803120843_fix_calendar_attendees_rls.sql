-- Migration to fix infinite recursion on `calendar_events` and `event_attendees` RLS policies

-- 1. Drop existing RLS policies on `event_attendees`
DROP POLICY IF EXISTS "Users can read event attendees for events they can access" ON app.event_attendees;
DROP POLICY IF EXISTS "Event creators and admins can manage event attendees" ON app.event_attendees;
DROP POLICY IF EXISTS "Users can manage their own event attendance" ON app.event_attendees;

-- 2. Drop existing RLS policy on `calendar_events`
DROP POLICY IF EXISTS "Users can read events they're invited to" ON app.calendar_events;

-- 3. Create helper functions to break circular dependencies

-- 3.1. Function: is_member_of_project
CREATE OR REPLACE FUNCTION app.is_member_of_project(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = app, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app.project_team
    WHERE project_id = p_project_id
    AND user_id = p_user_id
  );
$$;

-- 3.2. Function: is_attendee_of_event
CREATE OR REPLACE FUNCTION app.is_attendee_of_event(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = app, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app.event_attendees
    WHERE event_id = p_event_id
    AND user_id = p_user_id
  );
$$;

-- 3.3. Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION app.is_member_of_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_attendee_of_event(UUID, UUID) TO authenticated;

-- 4. Recreate RLS policy on `calendar_events`
CREATE POLICY "Users can read events they're invited to"
ON app.calendar_events
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    (created_by = auth.uid())
    OR (app.is_attendee_of_event(id, auth.uid()))
    OR (app.is_member_of_project(project_id, auth.uid()))
    OR (EXISTS (
        SELECT 1 FROM app.projects
        WHERE projects.id = calendar_events.project_id
        AND projects.client_id = auth.uid()
    ))
    OR (EXISTS (
        SELECT 1 FROM app.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
);

-- 5. Recreate RLS policies on `event_attendees`

-- 5.1. Read access to event attendees for events the user can access
CREATE POLICY "Users can read event attendees for events they can access"
ON app.event_attendees
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
    (user_id = auth.uid())
    OR (EXISTS (
        SELECT 1 FROM app.calendar_events
        WHERE calendar_events.id = event_attendees.event_id
        AND (
            calendar_events.created_by = auth.uid()
            OR app.is_member_of_project(calendar_events.project_id, auth.uid())
            OR EXISTS (
                SELECT 1 FROM app.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    ))
);

-- 5.2. Full management access to event creators and admins
CREATE POLICY "Event creators and admins can manage event attendees"
ON app.event_attendees
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app.calendar_events
        WHERE calendar_events.id = event_attendees.event_id
        AND calendar_events.created_by = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM app.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 5.3. Let users manage their own event attendance
CREATE POLICY "Users can manage their own event attendance"
ON app.event_attendees
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (user_id = auth.uid());
