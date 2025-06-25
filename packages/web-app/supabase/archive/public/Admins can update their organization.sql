create policy "Admins can update their organization" on public.organizations
    as permissive
    for update
    using (EXISTS (SELECT 1
                   FROM (profiles
                       JOIN user_roles ON ((profiles.id = user_roles.user_id)))
                   WHERE ((profiles.organization_id = organizations.id) AND (profiles.id = auth.uid()) AND
                          (user_roles.role = 'admin'::app_role))));

