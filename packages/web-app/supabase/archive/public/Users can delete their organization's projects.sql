create policy "Users can delete their organization's projects" on public.projects
    as permissive
    for delete
    using (organization_id IN (SELECT profiles.organization_id
                               FROM profiles
                               WHERE (profiles.id = auth.uid())));

