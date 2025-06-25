create policy "Users can update invoice items" on public.invoice_items
    as permissive
    for update
    using true;

