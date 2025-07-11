create table if not exists public.client_profiles
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    email           text                                               not null
        unique,
    first_name      text,
    last_name       text,
    phone           text,
    organization_id uuid
        references public.organizations,
    created_at      timestamp with time zone default now()             not null,
    updated_at      timestamp with time zone default now()             not null,
    user_id         uuid
        references ??? ()
)
    using orioledb;

alter table public.client_profiles
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.client_profiles to anon;

grant delete, insert, references, select, trigger, truncate, update on public.client_profiles to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.client_profiles to service_role;

