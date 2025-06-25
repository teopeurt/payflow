create policy "Allow updating own profile" on public.client_profiles
    as permissive
    for update
    using ((auth.uid() = user_id) OR (EXISTS (SELECT 1
                                              FROM user_roles
                                              WHERE ((user_roles.user_id = auth.uid()) AND
                                                     (user_roles.role = 'admin'::app_role)))));

