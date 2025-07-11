create table if not exists public.quotes
(
    id               uuid                     default gen_random_uuid()          not null
        primary key,
    reference_number varchar                                                     not null,
    organization_id  uuid                                                        not null
        references public.organizations,
    project_id       uuid
        references public.projects,
    amount           numeric                                                     not null,
    issue_date       date                                                        not null,
    expiry_date      date                                                        not null,
    status           varchar                  default 'draft'::character varying not null,
    notes            text,
    terms            text,
    estimate_id      uuid
        references public.estimates,
    created_at       timestamp with time zone default now(),
    updated_at       timestamp with time zone default now()
)
    using orioledb;

alter table public.quotes
    owner to postgres;

create index if not exists quotes_reference_number_idx
    on public.quotes (reference_number);

create index if not exists quotes_organization_id_idx
    on public.quotes (organization_id);

create index if not exists quotes_project_id_idx
    on public.quotes (project_id);

create index if not exists quotes_estimate_id_idx
    on public.quotes (estimate_id);

grant delete, insert, references, select, trigger, truncate, update on public.quotes to anon;

grant delete, insert, references, select, trigger, truncate, update on public.quotes to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.quotes to service_role;

