create policy "Users can view invoice items" on public.invoice_items
    as permissive
    for select
    using true;

