create policy "Users can update their organization's projects" on public.projects
    as permissive
    for update
    using (organization_id IN (SELECT profiles.organization_id
                               FROM profiles
                               WHERE (profiles.id = auth.uid())));

