create table if not exists public.payments
(
    id           uuid                     default gen_random_uuid() not null
        primary key,
    invoice_id   uuid                                               not null
        references public.invoices
            on delete cascade,
    amount       numeric(10, 2)                                     not null,
    payment_date date                                               not null,
    method       varchar(50)                                        not null,
    reference    varchar(100),
    notes        text,
    created_at   timestamp with time zone default now(),
    updated_at   timestamp with time zone default now()
)
    using orioledb;

alter table public.payments
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on public.payments to anon;

grant delete, insert, references, select, trigger, truncate, update on public.payments to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.payments to service_role;

