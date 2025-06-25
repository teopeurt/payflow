create policy "Users can view their own profile" on public.profiles
    as permissive
    for select
    using (auth.uid() = id);

