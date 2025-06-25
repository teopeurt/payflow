create policy "Users can create invoices" on public.invoices
    as permissive
    for insert
    with check true;

