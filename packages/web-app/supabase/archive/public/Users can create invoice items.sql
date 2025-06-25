create policy "Users can create invoice items" on public.invoice_items
    as permissive
    for insert
    with check true;

