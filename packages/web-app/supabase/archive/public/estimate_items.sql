create table if not exists public.estimate_items
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    estimate_id uuid                                               not null
        references public.estimates
            on delete cascade,
    description text                                               not null,
    quantity    numeric(10, 2)           default 1                 not null,
    unit_price  numeric(10, 2)                                     not null,
    amount      numeric(10, 2)                                     not null,
    created_at  timestamp with time zone default now(),
    updated_at  timestamp with time zone default now(),
    billable    boolean                  default true              not null,
    unit_type   text                     default 'hours'::text     not null
        constraint estimate_items_unit_type_check
            check (unit_type = ANY (ARRAY ['hours'::text, 'days'::text, 'months'::text, 'fixed'::text])),
    deleted     boolean                  default false             not null
)
    using orioledb;

alter table public.estimate_items
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.estimate_items to anon;

grant delete, insert, references, select, trigger, truncate, update on public.estimate_items to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.estimate_items to service_role;

