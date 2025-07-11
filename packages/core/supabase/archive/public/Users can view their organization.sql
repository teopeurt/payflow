create policy "Users can view their organization" on public.organizations
    as permissive
    for select
    using (EXISTS (SELECT 1
                   FROM profiles
                   WHERE ((profiles.organization_id = organizations.id) AND (profiles.id = auth.uid()))));

