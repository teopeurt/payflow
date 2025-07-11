create table if not exists public.milestones
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    project_id  uuid                                               not null
        references public.projects
            on delete cascade,
    name        varchar(255)                                       not null,
    description text,
    due_date    date,
    status      varchar(50),
    created_at  timestamp with time zone default now(),
    updated_at  timestamp with time zone default now()
)
    using orioledb;

alter table public.milestones
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.milestones to anon;

grant delete, insert, references, select, trigger, truncate, update on public.milestones to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.milestones to service_role;

