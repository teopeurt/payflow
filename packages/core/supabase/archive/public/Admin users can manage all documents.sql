create policy "Admin users can manage all documents" on public.documents
    as permissive
    for all
    using has_role(auth.uid(), 'admin'::app_role);

