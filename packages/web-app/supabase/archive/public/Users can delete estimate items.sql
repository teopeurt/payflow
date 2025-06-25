create policy "Users can delete estimate items" on public.estimate_items
    as permissive
    for delete
    using true;

