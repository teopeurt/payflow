create policy "Users can create new organizations" on public.organizations
    as permissive
    for insert
    with check true;

