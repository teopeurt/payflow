create policy "Admin users can manage roles" on public.user_roles
    as permissive
    for all
    using has_role(auth.uid(), 'admin'::app_role);

