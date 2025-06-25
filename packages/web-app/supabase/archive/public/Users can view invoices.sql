create policy "Users can view invoices" on public.invoices
    as permissive
    for select
    using true;

