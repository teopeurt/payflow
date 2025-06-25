create type public.app_role as enum ('admin', 'client');

alter type public.app_role owner to postgres;

