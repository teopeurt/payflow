create policy "Users can create projects for their organization" on public.projects
    as permissive
    for insert
    with check (organization_id IN (SELECT profiles.organization_id
                                    FROM profiles
                                    WHERE (profiles.id = auth.uid())));

