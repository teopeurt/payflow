create policy "Only admins can create invites" on public.invites
    as permissive
    for insert
    to authenticated
    with check true;

