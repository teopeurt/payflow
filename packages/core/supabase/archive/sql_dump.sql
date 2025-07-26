-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.client_profiles (
                                        id uuid NOT NULL DEFAULT gen_random_uuid(),
                                        email text NOT NULL UNIQUE,
                                        first_name text,
                                        last_name text,
                                        phone text,
                                        organization_id uuid,
                                        created_at timestamp with time zone NOT NULL DEFAULT now(),
                                        updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                        user_id uuid,
                                        CONSTRAINT client_profiles_pkey PRIMARY KEY (id),
                                        CONSTRAINT client_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
                                        CONSTRAINT client_profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.deliverables (
                                     id uuid NOT NULL DEFAULT gen_random_uuid(),
                                     milestone_id uuid NOT NULL,
                                     name character varying NOT NULL,
                                     description text,
                                     due_date date,
                                     status character varying,
                                     created_at timestamp with time zone DEFAULT now(),
                                     updated_at timestamp with time zone DEFAULT now(),
                                     CONSTRAINT deliverables_pkey PRIMARY KEY (id),
                                     CONSTRAINT deliverables_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestones(id)
);
CREATE TABLE public.documents (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  title text NOT NULL,
                                  content text,
                                  organization_id uuid NOT NULL,
                                  created_by uuid,
                                  created_at timestamp with time zone NOT NULL DEFAULT now(),
                                  updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                  CONSTRAINT documents_pkey PRIMARY KEY (id),
                                  CONSTRAINT documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
                                  CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.estimate_items (
                                       id uuid NOT NULL DEFAULT gen_random_uuid(),
                                       estimate_id uuid NOT NULL,
                                       description text NOT NULL,
                                       quantity numeric NOT NULL DEFAULT 1,
                                       unit_price numeric NOT NULL,
                                       amount numeric NOT NULL,
                                       created_at timestamp with time zone DEFAULT now(),
                                       updated_at timestamp with time zone DEFAULT now(),
                                       billable boolean NOT NULL DEFAULT true,
                                       unit_type text NOT NULL DEFAULT 'hours'::text CHECK (unit_type = ANY (ARRAY['hours'::text, 'days'::text, 'months'::text, 'fixed'::text])),
                                       deleted boolean NOT NULL DEFAULT false,
                                       is_section_header boolean NOT NULL DEFAULT false,
                                       CONSTRAINT estimate_items_pkey PRIMARY KEY (id),
                                       CONSTRAINT estimate_items_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimates(id)
);
CREATE TABLE public.estimates (
                                  id uuid NOT NULL DEFAULT gen_random_uuid(),
                                  reference_number character varying NOT NULL,
                                  organization_id uuid NOT NULL,
                                  project_id uuid,
                                  amount numeric NOT NULL,
                                  issue_date date NOT NULL,
                                  expiry_date date NOT NULL,
                                  status character varying NOT NULL DEFAULT 'draft'::character varying,
                                  notes text,
                                  terms text,
                                  created_at timestamp with time zone DEFAULT now(),
                                  updated_at timestamp with time zone DEFAULT now(),
                                  company_name text,
                                  company_address text,
                                  company_email text,
                                  company_phone text,
                                  deleted boolean NOT NULL DEFAULT false,
                                  CONSTRAINT estimates_pkey PRIMARY KEY (id),
                                  CONSTRAINT estimates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
                                  CONSTRAINT estimates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.invites (
                                id uuid NOT NULL DEFAULT gen_random_uuid(),
                                email text NOT NULL,
                                token text NOT NULL UNIQUE,
                                organization_id uuid,
                                role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'client'::text])),
                                created_at timestamp with time zone NOT NULL DEFAULT now(),
                                expires_at timestamp with time zone NOT NULL,
                                used boolean NOT NULL DEFAULT false,
                                CONSTRAINT invites_pkey PRIMARY KEY (id),
                                CONSTRAINT invites_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.invoice_items (
                                      id uuid NOT NULL DEFAULT gen_random_uuid(),
                                      invoice_id uuid NOT NULL,
                                      description text NOT NULL,
                                      quantity numeric NOT NULL DEFAULT 1,
                                      unit_price numeric NOT NULL,
                                      amount numeric NOT NULL,
                                      created_at timestamp with time zone DEFAULT now(),
                                      updated_at timestamp with time zone DEFAULT now(),
                                      CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
                                      CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
                                 id uuid NOT NULL DEFAULT gen_random_uuid(),
                                 invoice_number character varying NOT NULL,
                                 organization_id uuid NOT NULL,
                                 project_id uuid,
                                 estimate_id uuid,
                                 purchase_order character varying,
                                 amount numeric NOT NULL,
                                 issue_date date NOT NULL,
                                 due_date date NOT NULL,
                                 status character varying NOT NULL DEFAULT 'draft'::character varying,
                                 notes text,
                                 terms text,
                                 created_at timestamp with time zone DEFAULT now(),
                                 updated_at timestamp with time zone DEFAULT now(),
                                 tax numeric NOT NULL DEFAULT 0,
                                 logo_url text,
                                 CONSTRAINT invoices_pkey PRIMARY KEY (id),
                                 CONSTRAINT invoices_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
                                 CONSTRAINT invoices_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
                                 CONSTRAINT invoices_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimates(id)
);
CREATE TABLE public.milestones (
                                   id uuid NOT NULL DEFAULT gen_random_uuid(),
                                   project_id uuid NOT NULL,
                                   name character varying NOT NULL,
                                   description text,
                                   due_date date,
                                   status character varying,
                                   created_at timestamp with time zone DEFAULT now(),
                                   updated_at timestamp with time zone DEFAULT now(),
                                   CONSTRAINT milestones_pkey PRIMARY KEY (id),
                                   CONSTRAINT milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.organization_members (
                                             id uuid NOT NULL DEFAULT gen_random_uuid(),
                                             user_id uuid,
                                             organization_id uuid,
                                             role text NOT NULL DEFAULT 'member'::text,
                                             is_primary boolean NOT NULL DEFAULT false,
                                             created_at timestamp with time zone DEFAULT now(),
                                             CONSTRAINT organization_members_pkey PRIMARY KEY (id),
                                             CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
                                             CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
                                      id uuid NOT NULL DEFAULT gen_random_uuid(),
                                      name text NOT NULL,
                                      created_at timestamp with time zone NOT NULL DEFAULT now(),
                                      updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                      default_currency character varying NOT NULL DEFAULT 'USD'::character varying,
                                      company_name text,
                                      company_email text,
                                      company_logo_url text,
                                      company_address text,
                                      company_phone text,
                                      company_website text,
                                      CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
                                 id uuid NOT NULL DEFAULT gen_random_uuid(),
                                 invoice_id uuid NOT NULL,
                                 amount numeric NOT NULL,
                                 payment_date date NOT NULL,
                                 method character varying NOT NULL,
                                 reference character varying,
                                 notes text,
                                 created_at timestamp with time zone DEFAULT now(),
                                 updated_at timestamp with time zone DEFAULT now(),
                                 CONSTRAINT payments_pkey PRIMARY KEY (id),
                                 CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.profiles (
                                 id uuid NOT NULL,
                                 first_name text,
                                 last_name text,
                                 organization_id uuid,
                                 created_at timestamp with time zone NOT NULL DEFAULT now(),
                                 updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                 CONSTRAINT profiles_pkey PRIMARY KEY (id),
                                 CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
                                 CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.projects (
                                 id uuid NOT NULL DEFAULT gen_random_uuid(),
                                 name text NOT NULL,
                                 description text,
                                 status text NOT NULL DEFAULT 'active'::text,
                                 organization_id uuid NOT NULL,
                                 created_at timestamp with time zone NOT NULL DEFAULT now(),
                                 updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                 start_date date,
                                 end_date date,
                                 CONSTRAINT projects_pkey PRIMARY KEY (id),
                                 CONSTRAINT projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.quote_items (
                                    id uuid NOT NULL DEFAULT gen_random_uuid(),
                                    quote_id uuid NOT NULL,
                                    description text NOT NULL,
                                    quantity numeric NOT NULL DEFAULT 1,
                                    unit_price numeric NOT NULL,
                                    amount numeric NOT NULL,
                                    created_at timestamp with time zone DEFAULT now(),
                                    updated_at timestamp with time zone DEFAULT now(),
                                    CONSTRAINT quote_items_pkey PRIMARY KEY (id),
                                    CONSTRAINT quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id)
);
CREATE TABLE public.quotes (
                               id uuid NOT NULL DEFAULT gen_random_uuid(),
                               reference_number character varying NOT NULL,
                               organization_id uuid NOT NULL,
                               project_id uuid,
                               amount numeric NOT NULL,
                               issue_date date NOT NULL,
                               expiry_date date NOT NULL,
                               status character varying NOT NULL DEFAULT 'draft'::character varying,
                               notes text,
                               terms text,
                               estimate_id uuid,
                               created_at timestamp with time zone DEFAULT now(),
                               updated_at timestamp with time zone DEFAULT now(),
                               CONSTRAINT quotes_pkey PRIMARY KEY (id),
                               CONSTRAINT quotes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
                               CONSTRAINT quotes_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimates(id),
                               CONSTRAINT quotes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.user_roles (
                                   id uuid NOT NULL DEFAULT gen_random_uuid(),
                                   user_id uuid NOT NULL,
                                   role USER-DEFINED NOT NULL,
                                   created_at timestamp with time zone NOT NULL DEFAULT now(),
                                   CONSTRAINT user_roles_pkey PRIMARY KEY (id),
                                   CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);