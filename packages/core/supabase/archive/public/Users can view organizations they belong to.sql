create policy "Users can view organizations they belong to" on public.organizations
    as permissive
    for select
    using belongs_to_organization(auth.uid(), id);

