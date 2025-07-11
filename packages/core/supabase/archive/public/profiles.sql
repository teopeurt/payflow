create table if not exists public.profiles
(
    id              uuid                                   not null
        primary key
        references ??? ()
        on delete cascade,
    first_name      text,
    last_name       text,
    organization_id uuid
        references public.organizations,
    created_at      timestamp with time zone default now() not null,
    updated_at      timestamp with time zone default now() not null
)
    using orioledb;

alter table public.profiles
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.profiles to anon;

grant delete, insert, references, select, trigger, truncate, update on public.profiles to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.profiles to service_role;

