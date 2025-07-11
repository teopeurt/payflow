create policy "Users can view their roles" on public.user_roles
    as permissive
    for select
    using (auth.uid() = user_id);

