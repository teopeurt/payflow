create table if not exists public.invites
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    email           text                                               not null,
    token           text                                               not null
        unique,
    organization_id uuid
        references public.organizations,
    role            text                                               not null
        constraint invites_role_check
            check (role = ANY (ARRAY ['admin'::text, 'client'::text])),
    created_at      timestamp with time zone default now()             not null,
    expires_at      timestamp with time zone                           not null,
    used            boolean                  default false             not null
)
    using orioledb;

alter table public.invites
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.invites to anon;

grant delete, insert, references, select, trigger, truncate, update on public.invites to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.invites to service_role;

