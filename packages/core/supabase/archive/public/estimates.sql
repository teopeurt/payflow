create table if not exists public.estimates
(
    id               uuid                     default gen_random_uuid()          not null
        primary key,
    reference_number varchar(50)                                                 not null,
    organization_id  uuid                                                        not null
        references public.organizations,
    project_id       uuid
        references public.projects,
    amount           numeric(10, 2)                                              not null,
    issue_date       date                                                        not null,
    expiry_date      date                                                        not null,
    status           varchar(50)              default 'draft'::character varying not null,
    notes            text,
    terms            text,
    created_at       timestamp with time zone default now(),
    updated_at       timestamp with time zone default now(),
    company_name     text,
    company_address  text,
    company_email    text,
    company_phone    text,
    deleted          boolean                  default false                      not null
)
    using orioledb;

alter table public.estimates
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.estimates to anon;

grant delete, insert, references, select, trigger, truncate, update on public.estimates to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.estimates to service_role;

