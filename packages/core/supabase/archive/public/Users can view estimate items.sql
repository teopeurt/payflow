create policy "Users can view estimate items" on public.estimate_items
    as permissive
    for select
    using true;

