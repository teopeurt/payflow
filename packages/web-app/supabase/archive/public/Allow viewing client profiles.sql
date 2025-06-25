create policy "Allow viewing client profiles" on public.client_profiles
    as permissive
    for select
    using true;

