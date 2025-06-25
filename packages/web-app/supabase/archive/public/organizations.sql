create table if not exists public.organizations
(
    id               uuid                     default gen_random_uuid()        not null
        primary key,
    name             text                                                      not null,
    created_at       timestamp with time zone default now()                    not null,
    updated_at       timestamp with time zone default now()                    not null,
    default_currency varchar(10)              default 'USD'::character varying not null,
    company_name     text,
    company_email    text,
    company_logo_url text,
    company_address  text,
    company_phone    text,
    company_website  text
)
    using orioledb;

alter table public.organizations
    owner to postgres;

create trigger after_organization_created
    after insert
    on public.organizations
    for each row
execute procedure public.handle_new_organization();

grant delete, insert, references, select, trigger, truncate, update on public.organizations to anon;

grant delete, insert, references, select, trigger, truncate, update on public.organizations to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.organizations to service_role;

