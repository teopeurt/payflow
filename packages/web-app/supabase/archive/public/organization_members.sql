create table if not exists public.organization_members
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    user_id         uuid
        references ??? ()
        on delete cascade,
    organization_id uuid
        references public.organizations
            on delete cascade,
    role            text                     default 'member'::text    not null,
    is_primary      boolean                  default false             not null,
    created_at      timestamp with time zone default now(),
    unique (user_id, organization_id)
)
    using orioledb;

alter table public.organization_members
    owner to postgres;

create trigger organization_members_update_profile
    after insert or update
        of is_primary, organization_id
    on public.organization_members
    for each row
execute procedure public.maintain_profile_organization_consistency();

grant delete, insert, references, select, trigger, truncate, update on public.organization_members to anon;

grant delete, insert, references, select, trigger, truncate, update on public.organization_members to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.organization_members to service_role;

