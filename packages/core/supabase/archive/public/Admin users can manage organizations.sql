create policy "Admin users can manage organizations" on public.organizations
    as permissive
    for all
    using has_role(auth.uid(), 'admin'::app_role);

