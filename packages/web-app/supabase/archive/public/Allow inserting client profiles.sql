create policy "Allow inserting client profiles" on public.client_profiles
    as permissive
    for insert
    with check true;

