create policy "Users can view organizations they are members of" on public.organizations
    as permissive
    for select
    using (EXISTS (SELECT 1
                   FROM organization_members
                   WHERE ((organization_members.organization_id = organization_members.id) AND
                          (organization_members.user_id = auth.uid()))));

