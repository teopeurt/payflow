create table if not exists public.quote_items
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    quote_id    uuid                                               not null
        references public.quotes
            on delete cascade,
    description text                                               not null,
    quantity    numeric                  default 1                 not null,
    unit_price  numeric                                            not null,
    amount      numeric                                            not null,
    created_at  timestamp with time zone default now(),
    updated_at  timestamp with time zone default now()
)
    using orioledb;

alter table public.quote_items
    owner to postgres;

create index if not exists quote_items_quote_id_idx
    on public.quote_items (quote_id);

grant delete, insert, references, select, trigger, truncate, update on public.quote_items to anon;

grant delete, insert, references, select, trigger, truncate, update on public.quote_items to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.quote_items to service_role;

