create table if not exists public.deliverables
(
    id           uuid                     default gen_random_uuid() not null
        primary key,
    milestone_id uuid                                               not null
        references public.milestones
            on delete cascade,
    name         varchar(255)                                       not null,
    description  text,
    due_date     date,
    status       varchar(50),
    created_at   timestamp with time zone default now(),
    updated_at   timestamp with time zone default now()
)
    using orioledb;

alter table public.deliverables
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.deliverables to anon;

grant delete, insert, references, select, trigger, truncate, update on public.deliverables to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.deliverables to service_role;

