create type public.app_role as enum ('admin', 'client');

alter type public.app_role owner to postgres;

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

create policy "Users can view organizations they belong to" on public.organizations
    as permissive
    for select
    using belongs_to_organization(auth.uid(), id);

create policy "Admin users can manage organizations" on public.organizations
    as permissive
    for all
    using has_role(auth.uid(), 'admin'::app_role);

create policy "Users can view their organization" on public.organizations
    as permissive
    for select
    using (EXISTS (SELECT 1
                   FROM profiles
                   WHERE ((profiles.organization_id = organizations.id) AND (profiles.id = auth.uid()))));

create policy "Admins can update their organization" on public.organizations
    as permissive
    for update
    using (EXISTS (SELECT 1
                   FROM (profiles
                       JOIN user_roles ON ((profiles.id = user_roles.user_id)))
                   WHERE ((profiles.organization_id = organizations.id) AND (profiles.id = auth.uid()) AND
                          (user_roles.role = 'admin'::app_role))));

create policy "Users can view organizations they are members of" on public.organizations
    as permissive
    for select
    using (EXISTS (SELECT 1
                   FROM organization_members
                   WHERE ((organization_members.organization_id = organization_members.id) AND
                          (organization_members.user_id = auth.uid()))));

create policy "Users can create new organizations" on public.organizations
    as permissive
    for insert
    with check true;

grant delete, insert, references, select, trigger, truncate, update on public.organizations to anon;

grant delete, insert, references, select, trigger, truncate, update on public.organizations to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.organizations to service_role;

create table if not exists public.profiles
(
    id              uuid                                   not null
        primary key
        references ??? ()
        on delete cascade,
    first_name      text,
    last_name       text,
    organization_id uuid
        references public.organizations,
    created_at      timestamp with time zone default now() not null,
    updated_at      timestamp with time zone default now() not null
)
    using orioledb;

alter table public.profiles
    owner to postgres;

create policy "Users can view their own profile" on public.profiles
    as permissive
    for select
    using (auth.uid() = id);

create policy "Admin users can view all profiles" on public.profiles
    as permissive
    for select
    using has_role(auth.uid(), 'admin'::app_role);

create policy "Users can update their own profile" on public.profiles
    as permissive
    for update
    using (auth.uid() = id);

grant delete, insert, references, select, trigger, truncate, update on public.profiles to anon;

grant delete, insert, references, select, trigger, truncate, update on public.profiles to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.profiles to service_role;

create table if not exists public.user_roles
(
    id         uuid                     default gen_random_uuid() not null
        primary key,
    user_id    uuid                                               not null
        references ??? ()
        on delete cascade,
    role       app_role                                           not null,
    created_at timestamp with time zone default now()             not null,
    unique (user_id, role)
)
    using orioledb;

alter table public.user_roles
    owner to postgres;

create policy "Users can view their roles" on public.user_roles
    as permissive
    for select
    using (auth.uid() = user_id);

create policy "Admin users can manage roles" on public.user_roles
    as permissive
    for all
    using has_role(auth.uid(), 'admin'::app_role);

grant delete, insert, references, select, trigger, truncate, update on public.user_roles to anon;

grant delete, insert, references, select, trigger, truncate, update on public.user_roles to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.user_roles to service_role;

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

create policy "Users can view documents from their organization" on public.documents
    as permissive
    for select
    using belongs_to_organization(auth.uid(), organization_id);

create policy "Admin users can manage all documents" on public.documents
    as permissive
    for all
    using has_role(auth.uid(), 'admin'::app_role);

grant delete, insert, references, select, trigger, truncate, update on public.documents to anon;

grant delete, insert, references, select, trigger, truncate, update on public.documents to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.documents to service_role;

create table if not exists public.invites
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    email           text                                               not null,
    token           text                                               not null
        unique,
    organization_id uuid
        references public.organizations,
    role            text                                               not null
        constraint invites_role_check
            check (role = ANY (ARRAY ['admin'::text, 'client'::text])),
    created_at      timestamp with time zone default now()             not null,
    expires_at      timestamp with time zone                           not null,
    used            boolean                  default false             not null
)
    using orioledb;

alter table public.invites
    owner to postgres;

create policy "Users can view invites" on public.invites
    as permissive
    for select
    to authenticated
    using true;

create policy "Only admins can create invites" on public.invites
    as permissive
    for insert
    to authenticated
    with check true;

create policy "Anyone can update their own invites" on public.invites
    as permissive
    for update
    to authenticated
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.invites to anon;

grant delete, insert, references, select, trigger, truncate, update on public.invites to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.invites to service_role;

create table if not exists public.projects
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    name            text                                               not null,
    description     text,
    status          text                     default 'active'::text    not null,
    organization_id uuid                                               not null
        references public.organizations,
    created_at      timestamp with time zone default now()             not null,
    updated_at      timestamp with time zone default now()             not null,
    start_date      date,
    end_date        date
)
    using orioledb;

alter table public.projects
    owner to postgres;

create policy "Users can view their organization's projects" on public.projects
    as permissive
    for select
    using (organization_id IN (SELECT profiles.organization_id
                               FROM profiles
                               WHERE (profiles.id = auth.uid())));

create policy "Users can create projects for their organization" on public.projects
    as permissive
    for insert
    with check (organization_id IN (SELECT profiles.organization_id
                                    FROM profiles
                                    WHERE (profiles.id = auth.uid())));

create policy "Users can update their organization's projects" on public.projects
    as permissive
    for update
    using (organization_id IN (SELECT profiles.organization_id
                               FROM profiles
                               WHERE (profiles.id = auth.uid())));

create policy "Users can delete their organization's projects" on public.projects
    as permissive
    for delete
    using (organization_id IN (SELECT profiles.organization_id
                               FROM profiles
                               WHERE (profiles.id = auth.uid())));

create policy "Users can view projects" on public.projects
    as permissive
    for select
    using true;

create policy "Users can create projects" on public.projects
    as permissive
    for insert
    with check true;

create policy "Users can update projects" on public.projects
    as permissive
    for update
    using true;

create policy "Users can delete projects" on public.projects
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.projects to anon;

grant delete, insert, references, select, trigger, truncate, update on public.projects to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.projects to service_role;

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

create policy "Users can view estimates" on public.estimates
    as permissive
    for select
    using true;

create policy "Users can create estimates" on public.estimates
    as permissive
    for insert
    with check true;

create policy "Users can update estimates" on public.estimates
    as permissive
    for update
    using true;

create policy "Users can delete estimates" on public.estimates
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.estimates to anon;

grant delete, insert, references, select, trigger, truncate, update on public.estimates to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.estimates to service_role;

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

create policy "Users can view estimate items" on public.estimate_items
    as permissive
    for select
    using true;

create policy "Users can create estimate items" on public.estimate_items
    as permissive
    for insert
    with check true;

create policy "Users can update estimate items" on public.estimate_items
    as permissive
    for update
    using true;

create policy "Users can delete estimate items" on public.estimate_items
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.estimate_items to anon;

grant delete, insert, references, select, trigger, truncate, update on public.estimate_items to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.estimate_items to service_role;

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

create policy "Users can view invoices" on public.invoices
    as permissive
    for select
    using true;

create policy "Users can create invoices" on public.invoices
    as permissive
    for insert
    with check true;

create policy "Users can update invoices" on public.invoices
    as permissive
    for update
    using true;

create policy "Users can delete invoices" on public.invoices
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.invoices to anon;

grant delete, insert, references, select, trigger, truncate, update on public.invoices to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.invoices to service_role;

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

create policy "Users can view invoice items" on public.invoice_items
    as permissive
    for select
    using true;

create policy "Users can create invoice items" on public.invoice_items
    as permissive
    for insert
    with check true;

create policy "Users can update invoice items" on public.invoice_items
    as permissive
    for update
    using true;

create policy "Users can delete invoice items" on public.invoice_items
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.invoice_items to anon;

grant delete, insert, references, select, trigger, truncate, update on public.invoice_items to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.invoice_items to service_role;

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

create policy "Users can view payments" on public.payments
    as permissive
    for select
    using true;

create policy "Users can create payments" on public.payments
    as permissive
    for insert
    with check true;

create policy "Users can update payments" on public.payments
    as permissive
    for update
    using true;

create policy "Users can delete payments" on public.payments
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.payments to anon;

grant delete, insert, references, select, trigger, truncate, update on public.payments to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.payments to service_role;

create table if not exists public.milestones
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    project_id  uuid                                               not null
        references public.projects
            on delete cascade,
    name        varchar(255)                                       not null,
    description text,
    due_date    date,
    status      varchar(50),
    created_at  timestamp with time zone default now(),
    updated_at  timestamp with time zone default now()
)
    using orioledb;

alter table public.milestones
    owner to postgres;

create policy "Users can view milestones" on public.milestones
    as permissive
    for select
    using true;

create policy "Users can create milestones" on public.milestones
    as permissive
    for insert
    with check true;

create policy "Users can update milestones" on public.milestones
    as permissive
    for update
    using true;

create policy "Users can delete milestones" on public.milestones
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.milestones to anon;

grant delete, insert, references, select, trigger, truncate, update on public.milestones to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.milestones to service_role;

create table if not exists public.deliverables
(
    id           uuid                     default gen_random_uuid() not null
        primary key,
    milestone_id uuid                                               not null
        references public.milestones
            on delete cascade,
    name         varchar(255)                                       not null,
    description  text,
    due_date     date,
    status       varchar(50),
    created_at   timestamp with time zone default now(),
    updated_at   timestamp with time zone default now()
)
    using orioledb;

alter table public.deliverables
    owner to postgres;

create policy "Users can view deliverables" on public.deliverables
    as permissive
    for select
    using true;

create policy "Users can create deliverables" on public.deliverables
    as permissive
    for insert
    with check true;

create policy "Users can update deliverables" on public.deliverables
    as permissive
    for update
    using true;

create policy "Users can delete deliverables" on public.deliverables
    as permissive
    for delete
    using true;

grant delete, insert, references, select, trigger, truncate, update on public.deliverables to anon;

grant delete, insert, references, select, trigger, truncate, update on public.deliverables to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.deliverables to service_role;

create table if not exists public.client_profiles
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    email           text                                               not null
        unique,
    first_name      text,
    last_name       text,
    phone           text,
    organization_id uuid
        references public.organizations,
    created_at      timestamp with time zone default now()             not null,
    updated_at      timestamp with time zone default now()             not null,
    user_id         uuid
        references ??? ()
)
    using orioledb;

alter table public.client_profiles
    owner to postgres;

create policy "Allow viewing client profiles" on public.client_profiles
    as permissive
    for select
    using true;

create policy "Allow inserting client profiles" on public.client_profiles
    as permissive
    for insert
    with check true;

create policy "Allow updating own profile" on public.client_profiles
    as permissive
    for update
    using ((auth.uid() = user_id) OR (EXISTS (SELECT 1
                                              FROM user_roles
                                              WHERE ((user_roles.user_id = auth.uid()) AND
                                                     (user_roles.role = 'admin'::app_role)))));

grant delete, insert, references, select, trigger, truncate, update on public.client_profiles to anon;

grant delete, insert, references, select, trigger, truncate, update on public.client_profiles to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.client_profiles to service_role;

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

create table if not exists public.organization_members
(
    id              uuid                     default gen_random_uuid() not null
        primary key,
    user_id         uuid
        references ??? ()
        on delete cascade,
    organization_id uuid
        references public.organizations
            on delete cascade,
    role            text                     default 'member'::text    not null,
    is_primary      boolean                  default false             not null,
    created_at      timestamp with time zone default now(),
    unique (user_id, organization_id)
)
    using orioledb;

alter table public.organization_members
    owner to postgres;

create policy "Users can view their own organization memberships" on public.organization_members
    as permissive
    for select
    using (auth.uid() = user_id);

create policy "Users can create their own organization memberships" on public.organization_members
    as permissive
    for insert
    with check (auth.uid() = user_id);

grant delete, insert, references, select, trigger, truncate, update on public.organization_members to anon;

grant delete, insert, references, select, trigger, truncate, update on public.organization_members to authenticated;

grant delete, insert, references, select, trigger, truncate, update on public.organization_members to service_role;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
    stable
    security definer
    SET search_path = ""
    language sql
as
$$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

alter function public.has_role(uuid, app_role) owner to postgres;

grant execute on function public.has_role(uuid, app_role) to anon;

grant execute on function public.has_role(uuid, app_role) to authenticated;

grant execute on function public.has_role(uuid, app_role) to service_role;

create or replace function public.belongs_to_organization(_user_id uuid, _org_id uuid) returns boolean
    stable
    security definer
    SET search_path = ""
    language sql
as
$$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND organization_id = _org_id
  );
$$;

alter function public.belongs_to_organization(uuid, uuid) owner to postgres;

grant execute on function public.belongs_to_organization(uuid, uuid) to anon;

grant execute on function public.belongs_to_organization(uuid, uuid) to authenticated;

grant execute on function public.belongs_to_organization(uuid, uuid) to service_role;

create or replace function public.handle_new_user() returns trigger
    security definer
    SET search_path = ""
    language plpgsql
as
$$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Assign 'client' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

alter function public.handle_new_user() owner to postgres;

grant execute on function public.handle_new_user() to anon;

grant execute on function public.handle_new_user() to authenticated;

grant execute on function public.handle_new_user() to service_role;

create or replace function public.handle_new_organization() returns trigger
    security definer
    language plpgsql
as
$$
BEGIN
  -- Create membership entry for the user who created the organization
  INSERT INTO public.organization_members (user_id, organization_id, role, is_primary)
  VALUES (auth.uid(), NEW.id, 'admin', true);
  
  RETURN NEW;
END;
$$;

alter function public.handle_new_organization() owner to postgres;

create trigger after_organization_created
    after insert
    on public.organizations
    for each row
execute procedure public.handle_new_organization();

grant execute on function public.handle_new_organization() to anon;

grant execute on function public.handle_new_organization() to authenticated;

grant execute on function public.handle_new_organization() to service_role;

create or replace function public.maintain_profile_organization_consistency() returns trigger
    language plpgsql
as
$$
BEGIN
    -- If a user's primary organization is set/changed, update their profile
    IF NEW.is_primary = true THEN
        -- Update the profile organization_id to match the primary organization
        UPDATE public.profiles
        SET organization_id = NEW.organization_id
        WHERE id = NEW.user_id;
        
        -- Ensure only one organization is primary for this user
        UPDATE public.organization_members
        SET is_primary = false
        WHERE user_id = NEW.user_id 
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$;

alter function public.maintain_profile_organization_consistency() owner to postgres;

create trigger organization_members_update_profile
    after insert or update
        of is_primary, organization_id
    on public.organization_members
    for each row
execute procedure public.maintain_profile_organization_consistency();

grant execute on function public.maintain_profile_organization_consistency() to anon;

grant execute on function public.maintain_profile_organization_consistency() to authenticated;

grant execute on function public.maintain_profile_organization_consistency() to service_role;


