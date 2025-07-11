create policy "Users can create estimate items" on public.estimate_items
    as permissive
    for insert
    with check true;

