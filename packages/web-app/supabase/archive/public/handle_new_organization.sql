create or replace function public.handle_new_organization() returns trigger
    security definer
    language plpgsql
as
$$
BEGIN
  -- Create membership entry for the user who created the organization
  INSERT INTO public.organization_members (user_id, organization_id, role, is_primary)
  VALUES (auth.uid(), NEW.id, 'admin', true);
  
  RETURN NEW;
END;
$$;

alter function public.handle_new_organization() owner to postgres;

grant execute on function public.handle_new_organization() to anon;

grant execute on function public.handle_new_organization() to authenticated;

grant execute on function public.handle_new_organization() to service_role;

