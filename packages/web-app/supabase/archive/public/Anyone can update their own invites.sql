create policy "Anyone can update their own invites" on public.invites
    as permissive
    for update
    to authenticated
    using true;

