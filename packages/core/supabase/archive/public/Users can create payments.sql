create policy "Users can create payments" on public.payments
    as permissive
    for insert
    with check true;

