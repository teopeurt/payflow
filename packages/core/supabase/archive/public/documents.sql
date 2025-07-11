create table if not exists public.documents
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    title           text                                               not null,
    content         text,
    organization_id uuid                                               not null
        references public.organizations
            on delete cascade,
    created_by      uuid
        references ??? (),
    created_at      timestamp with time zone default now()             not null,
    updated_at      timestamp with time zone default now()             not null
)
    using orioledb;

alter table public.documents
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.documents to anon;

grant delete, insert, references, select, trigger, truncate, update on public.documents to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.documents to service_role;

