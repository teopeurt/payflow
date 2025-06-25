create or replace function public.belongs_to_organization(_user_id uuid, _org_id uuid) returns boolean
    stable
    security definer
    SET search_path = ""
    language sql
as
$$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND organization_id = _org_id
  );
$$;

alter function public.belongs_to_organization(uuid, uuid) owner to postgres;

grant execute on function public.belongs_to_organization(uuid, uuid) to anon;

grant execute on function public.belongs_to_organization(uuid, uuid) to authenticated;

grant execute on function public.belongs_to_organization(uuid, uuid) to service_role;

