create policy "Users can view their organization's projects" on public.projects
    as permissive
    for select
    using (organization_id IN (SELECT profiles.organization_id
                               FROM profiles
                               WHERE (profiles.id = auth.uid())));

