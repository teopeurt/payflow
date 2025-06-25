create policy "Users can view documents from their organization" on public.documents
    as permissive
    for select
    using belongs_to_organization(auth.uid(), organization_id);

