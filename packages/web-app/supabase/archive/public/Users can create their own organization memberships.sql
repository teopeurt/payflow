create policy "Users can create their own organization memberships" on public.organization_members
    as permissive
    for insert
    with check (auth.uid() = user_id);

