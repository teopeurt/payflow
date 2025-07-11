create table if not exists public.invoices
(
    id              uuid                     default gen_random_uuid()          not null
        primary key,
    invoice_number  varchar(50)                                                 not null,
    organization_id uuid                                                        not null
        references public.organizations,
    project_id      uuid
        references public.projects,
    estimate_id     uuid
        references public.estimates,
    purchase_order  varchar(50),
    amount          numeric(10, 2)                                              not null,
    issue_date      date                                                        not null,
    due_date        date                                                        not null,
    status          varchar(50)              default 'draft'::character varying not null,
    notes           text,
    terms           text,
    created_at      timestamp with time zone default now(),
    updated_at      timestamp with time zone default now(),
    tax             numeric                  default 0                          not null,
    logo_url        text
)
    using orioledb;

alter table public.invoices
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.invoices to anon;

grant delete, insert, references, select, trigger, truncate, update on public.invoices to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.invoices to service_role;

