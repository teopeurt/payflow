create policy "Users can delete invoice items" on public.invoice_items
    as permissive
    for delete
    using true;

