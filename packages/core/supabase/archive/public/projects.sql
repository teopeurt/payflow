create table if not exists public.projects
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    name            text                                               not null,
    description     text,
    status          text                     default 'active'::text    not null,
    organization_id uuid                                               not null
        references public.organizations,
    created_at      timestamp with time zone default now()             not null,
    updated_at      timestamp with time zone default now()             not null,
    start_date      date,
    end_date        date
)
    using orioledb;

alter table public.projects
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.projects to anon;

grant delete, insert, references, select, trigger, truncate, update on public.projects to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.projects to service_role;

