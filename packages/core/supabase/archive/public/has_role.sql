create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
    stable
    security definer
    SET search_path = ""
    language sql
as
$$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

alter function public.has_role(uuid, app_role) owner to postgres;

grant execute on function public.has_role(uuid, app_role) to anon;

grant execute on function public.has_role(uuid, app_role) to authenticated;

grant execute on function public.has_role(uuid, app_role) to service_role;

