create policy "Users can view invites" on public.invites
    as permissive
    for select
    to authenticated
    using true;

