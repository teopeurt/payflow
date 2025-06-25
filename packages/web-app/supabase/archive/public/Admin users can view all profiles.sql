create policy "Admin users can view all profiles" on public.profiles
    as permissive
    for select
    using has_role(auth.uid(), 'admin'::app_role);

