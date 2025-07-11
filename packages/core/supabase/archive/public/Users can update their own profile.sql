create policy "Users can update their own profile" on public.profiles
    as permissive
    for update
    using (auth.uid() = id);

