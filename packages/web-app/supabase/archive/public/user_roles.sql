create table if not exists public.user_roles
(
    id         uuid                     default gen_random_uuid() not null
        primary key,
    user_id    uuid                                               not null
        references ??? ()
        on delete cascade,
    role       app_role                                           not null,
    created_at timestamp with time zone default now()             not null,
    unique (user_id, role)
)
    using orioledb;

alter table public.user_roles
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.user_roles to anon;

grant delete, insert, references, select, trigger, truncate, update on public.user_roles to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.user_roles to service_role;

