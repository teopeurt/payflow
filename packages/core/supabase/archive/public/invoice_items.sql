create table if not exists public.invoice_items
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    invoice_id  uuid                                               not null
        references public.invoices
            on delete cascade,
    description text                                               not null,
    quantity    numeric(10, 2)           default 1                 not null,
    unit_price  numeric(10, 2)                                     not null,
    amount      numeric(10, 2)                                     not null,
    created_at  timestamp with time zone default now(),
    updated_at  timestamp with time zone default now()
)
    using orioledb;

alter table public.invoice_items
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.invoice_items to anon;

grant delete, insert, references, select, trigger, truncate, update on public.invoice_items to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.invoice_items to service_role;

