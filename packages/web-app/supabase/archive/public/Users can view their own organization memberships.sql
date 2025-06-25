create policy "Users can view their own organization memberships" on public.organization_members
    as permissive
    for select
    using (auth.uid() = user_id);

