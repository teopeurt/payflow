-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "finance";
--> statement-breakpoint
CREATE SCHEMA "messaging";
--> statement-breakpoint
CREATE SCHEMA "app";
--> statement-breakpoint
CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE TYPE "auth"."aal_level" AS ENUM('aal1', 'aal2', 'aal3');--> statement-breakpoint
CREATE TYPE "auth"."code_challenge_method" AS ENUM('s256', 'plain');--> statement-breakpoint
CREATE TYPE "auth"."factor_status" AS ENUM('unverified', 'verified');--> statement-breakpoint
CREATE TYPE "auth"."factor_type" AS ENUM('totp', 'webauthn', 'phone');--> statement-breakpoint
CREATE TYPE "auth"."one_time_token_type" AS ENUM('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');--> statement-breakpoint
CREATE TYPE "public"."app_role" AS ENUM('admin', 'client', 'team_member');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency_type" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."recurring_until_type" AS ENUM('indefinitely', 'on_date', 'count');--> statement-breakpoint
CREATE TABLE "auth"."flow_state" (
	"id" uuid NOT NULL,
	"user_id" uuid,
	"auth_code" text NOT NULL,
	"code_challenge_method" "auth"."code_challenge_method" NOT NULL,
	"code_challenge" text NOT NULL,
	"provider_type" text NOT NULL,
	"provider_access_token" text,
	"provider_refresh_token" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"authentication_method" text NOT NULL,
	"auth_code_issued_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."saml_providers" (
	"id" uuid NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"entity_id" text NOT NULL,
	"metadata_xml" text NOT NULL,
	"metadata_url" text,
	"attribute_mapping" jsonb,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"name_id_format" text,
	CONSTRAINT "entity_id not empty" CHECK (char_length(entity_id) > 0),
	CONSTRAINT "metadata_url not empty" CHECK ((metadata_url = NULL::text) OR (char_length(metadata_url) > 0)),
	CONSTRAINT "metadata_xml not empty" CHECK (char_length(metadata_xml) > 0)
);
--> statement-breakpoint
ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."instances" (
	"id" uuid NOT NULL,
	"uuid" uuid,
	"raw_base_config" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."saml_relay_states" (
	"id" uuid NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"request_id" text NOT NULL,
	"for_email" text,
	"redirect_to" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"flow_state_id" uuid,
	CONSTRAINT "request_id not empty" CHECK (char_length(request_id) > 0)
);
--> statement-breakpoint
ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."refresh_tokens" (
	"instance_id" uuid,
	"id" bigserial NOT NULL,
	"token" varchar(255),
	"user_id" varchar(255),
	"revoked" boolean,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"parent" varchar(255),
	"session_id" uuid
);
--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."sso_domains" (
	"id" uuid NOT NULL,
	"sso_provider_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "domain not empty" CHECK (char_length(domain) > 0)
);
--> statement-breakpoint
ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"instance_id" uuid,
	"id" uuid NOT NULL,
	"aud" varchar(255),
	"role" varchar(255),
	"email" varchar(255),
	"encrypted_password" varchar(255),
	"email_confirmed_at" timestamp with time zone,
	"invited_at" timestamp with time zone,
	"confirmation_token" varchar(255),
	"confirmation_sent_at" timestamp with time zone,
	"recovery_token" varchar(255),
	"recovery_sent_at" timestamp with time zone,
	"email_change_token_new" varchar(255),
	"email_change" varchar(255),
	"email_change_sent_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone,
	"raw_app_meta_data" jsonb,
	"raw_user_meta_data" jsonb,
	"is_super_admin" boolean,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"phone" text DEFAULT NULL,
	"phone_confirmed_at" timestamp with time zone,
	"phone_change" text DEFAULT '',
	"phone_change_token" varchar(255) DEFAULT '',
	"phone_change_sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
	"email_change_token_current" varchar(255) DEFAULT '',
	"email_change_confirm_status" smallint DEFAULT 0,
	"banned_until" timestamp with time zone,
	"reauthentication_token" varchar(255) DEFAULT '',
	"reauthentication_sent_at" timestamp with time zone,
	"is_sso_user" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_email_change_confirm_status_check" CHECK ((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2))
);
--> statement-breakpoint
ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."identities" (
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"identity_data" jsonb NOT NULL,
	"provider" text NOT NULL,
	"last_sign_in_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"email" text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."schema_migrations" (
	"version" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."sessions" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"factor_id" uuid,
	"aal" "auth"."aal_level",
	"not_after" timestamp with time zone,
	"refreshed_at" timestamp,
	"user_agent" text,
	"ip" "inet",
	"tag" text
);
--> statement-breakpoint
ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."mfa_factors" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"friendly_name" text,
	"factor_type" "auth"."factor_type" NOT NULL,
	"status" "auth"."factor_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"secret" text,
	"phone" text,
	"last_challenged_at" timestamp with time zone,
	"web_authn_credential" jsonb,
	"web_authn_aaguid" uuid
);
--> statement-breakpoint
ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."one_time_tokens" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"token_type" "auth"."one_time_token_type" NOT NULL,
	"token_hash" text NOT NULL,
	"relates_to" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "one_time_tokens_token_hash_check" CHECK (char_length(token_hash) > 0)
);
--> statement-breakpoint
ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."mfa_challenges" (
	"id" uuid NOT NULL,
	"factor_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"ip_address" "inet" NOT NULL,
	"otp_code" text,
	"web_authn_session_data" jsonb
);
--> statement-breakpoint
ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."mfa_amr_claims" (
	"session_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"authentication_method" text NOT NULL,
	"id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."sso_providers" (
	"id" uuid NOT NULL,
	"resource_id" text,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "resource_id not empty" CHECK ((resource_id = NULL::text) OR (char_length(resource_id) > 0))
);
--> statement-breakpoint
ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth"."audit_log_entries" (
	"instance_id" uuid,
	"id" uuid NOT NULL,
	"payload" json,
	"created_at" timestamp with time zone,
	"ip_address" varchar(64) DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"default_currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"company_name" text,
	"company_email" text,
	"company_logo_url" text,
	"company_address" text,
	"company_phone" text,
	"company_website" text,
	"default_payment_terms" integer DEFAULT 30
);
--> statement-breakpoint
ALTER TABLE "app"."organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"profile_picture_url" text,
	"role" text NOT NULL,
	"company_name" text,
	"address" jsonb,
	"website_url" text,
	"notes" text,
	"client_status" text,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login" timestamp with time zone,
	"organization_id" uuid,
	CONSTRAINT "profiles_email_key" UNIQUE("email"),
	CONSTRAINT "profiles_client_status_check" CHECK (client_status = ANY (ARRAY['lead'::text, 'active'::text, 'inactive'::text])),
	CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['admin'::text, 'team_member'::text, 'client'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_key" UNIQUE("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "app"."user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"organization_id" uuid,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "invites_email_key" UNIQUE("email"),
	CONSTRAINT "invites_token_key" UNIQUE("token"),
	CONSTRAINT "invites_role_check" CHECK (role = ANY (ARRAY['admin'::text, 'client'::text, 'team_member'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"organization_id" uuid,
	"role" text DEFAULT 'member' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organization_members_user_id_organization_id_key" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "app"."organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" text DEFAULT 'medium',
	"client_id" uuid,
	"start_date" date,
	"end_date" date,
	"budget" numeric(12, 2),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	CONSTRAINT "projects_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
	CONSTRAINT "projects_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'archived'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."project_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"role" text DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_team_project_id_user_id_key" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "app"."project_team" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"parent_task_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium',
	"due_date" timestamp with time zone,
	"estimated_hours" numeric(8, 2),
	"actual_hours" numeric(8, 2),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_priority_check" CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
	CONSTRAINT "tasks_status_check" CHECK (status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'review'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."task_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"user_id" uuid,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_assignments_task_id_user_id_key" UNIQUE("task_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "app"."task_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" text NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"project_id" uuid,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."file_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid,
	"shared_with" uuid,
	"permission" text DEFAULT 'view',
	"shared_by" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "file_shares_file_id_shared_with_key" UNIQUE("file_id","shared_with"),
	CONSTRAINT "file_shares_permission_check" CHECK (permission = ANY (ARRAY['view'::text, 'download'::text, 'edit'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."file_shares" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"location" text,
	"event_type" text DEFAULT 'meeting',
	"status" text DEFAULT 'scheduled',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_events_event_type_check" CHECK (event_type = ANY (ARRAY['meeting'::text, 'deadline'::text, 'milestone'::text, 'reminder'::text])),
	CONSTRAINT "calendar_events_status_check" CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."calendar_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."event_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"user_id" uuid,
	"response" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_attendees_event_id_user_id_key" UNIQUE("event_id","user_id"),
	CONSTRAINT "event_attendees_response_check" CHECK (response = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'tentative'::text]))
);
--> statement-breakpoint
ALTER TABLE "app"."event_attendees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"due_date" date,
	"status" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app"."milestones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"milestone_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"due_date" date,
	"status" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app"."deliverables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "app"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"organization_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" varchar(50) NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"terms" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"company_name" text,
	"company_address" text,
	"company_email" text,
	"company_phone" text,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance"."estimates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."estimate_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"billable" boolean DEFAULT true NOT NULL,
	"unit_type" text DEFAULT 'hours' NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "estimate_items_unit_type_check" CHECK (unit_type = ANY (ARRAY['hours'::text, 'days'::text, 'months'::text, 'fixed'::text]))
);
--> statement-breakpoint
ALTER TABLE "finance"."estimate_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" varchar NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"amount" numeric NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"notes" text,
	"terms" text,
	"estimate_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "finance"."quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"unit_price" numeric NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "finance"."quote_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"project_id" uuid,
	"client_id" uuid NOT NULL,
	"status" text DEFAULT 'draft',
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(12, 2) DEFAULT '0',
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"terms" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"organization_id" uuid NOT NULL,
	"estimate_id" uuid,
	"purchase_order" varchar(50),
	"tax" numeric DEFAULT '0' NOT NULL,
	"logo_url" text,
	"is_recurring" boolean DEFAULT false,
	"recurring_frequency" "recurring_frequency_type",
	"recurring_start_date" date,
	"recurring_until" "recurring_until_type",
	"recurring_end_date" date,
	"recurring_count" integer,
	"duplicated_from_id" uuid,
	"recurring_template_id" uuid,
	CONSTRAINT "invoices_invoice_number_key" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text, 'partial'::text]))
);
--> statement-breakpoint
ALTER TABLE "finance"."invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"discount_rate" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint
ALTER TABLE "finance"."invoice_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid,
	"payment_method" text DEFAULT 'stripe',
	"amount" numeric(12, 2) NOT NULL,
	"transaction_id" text,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'pending',
	"processed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_payment_method_check" CHECK (payment_method = ANY (ARRAY['credit_card'::text, 'bank_transfer'::text, 'check'::text, 'cash'::text, 'stripe'::text])),
	CONSTRAINT "payments_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text]))
);
--> statement-breakpoint
ALTER TABLE "finance"."payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."recurring_invoice_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"project_id" uuid,
	"client_id" uuid,
	"template_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"invoice_data" jsonb NOT NULL,
	"frequency" "recurring_frequency_type" NOT NULL,
	"start_date" date NOT NULL,
	"until_type" "recurring_until_type" DEFAULT 'indefinitely' NOT NULL,
	"end_date" date,
	"max_count" integer,
	"next_generation_date" date NOT NULL,
	"generation_count" integer DEFAULT 0,
	"last_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "finance"."recurring_invoice_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"invoice_id" uuid,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generation_date" date NOT NULL,
	"status" varchar(20) DEFAULT 'success',
	"error_message" text,
	"invoice_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_invoice_history_status_check" CHECK ((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'skipped'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messaging"."message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"subject" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messaging"."message_threads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messaging"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "messages_message_type_check" CHECK (message_type = ANY (ARRAY['text'::text, 'system'::text, 'file'::text]))
);
--> statement-breakpoint
ALTER TABLE "messaging"."messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messaging"."message_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid,
	"user_id" uuid,
	"read_status" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	CONSTRAINT "message_recipients_message_id_user_id_key" UNIQUE("message_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "messaging"."message_recipients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messaging"."thread_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid,
	"user_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "thread_participants_thread_id_user_id_key" UNIQUE("thread_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "messaging"."thread_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit"."audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth"."saml_providers" ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."saml_relay_states" ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."saml_relay_states" ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sso_domains" ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."identities" ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."one_time_tokens" ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."mfa_challenges" ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."mfa_amr_claims" ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."profiles" ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."invites" ADD CONSTRAINT "invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."project_team" ADD CONSTRAINT "project_team_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."project_team" ADD CONSTRAINT "project_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "app"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."task_assignments" ADD CONSTRAINT "task_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."task_assignments" ADD CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "app"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."task_assignments" ADD CONSTRAINT "task_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."files" ADD CONSTRAINT "files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."files" ADD CONSTRAINT "files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."file_shares" ADD CONSTRAINT "file_shares_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "app"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."file_shares" ADD CONSTRAINT "file_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."file_shares" ADD CONSTRAINT "file_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."calendar_events" ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."calendar_events" ADD CONSTRAINT "calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."event_attendees" ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "app"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."event_attendees" ADD CONSTRAINT "event_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."deliverables" ADD CONSTRAINT "deliverables_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "app"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."estimates" ADD CONSTRAINT "estimates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."estimates" ADD CONSTRAINT "estimates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "finance"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."quotes" ADD CONSTRAINT "quotes_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "finance"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."quotes" ADD CONSTRAINT "quotes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "finance"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_duplicated_from_id_fkey" FOREIGN KEY ("duplicated_from_id") REFERENCES "finance"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "finance"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_templates" ADD CONSTRAINT "recurring_invoice_templates_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_templates" ADD CONSTRAINT "recurring_invoice_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_templates" ADD CONSTRAINT "recurring_invoice_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "app"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_templates" ADD CONSTRAINT "recurring_invoice_templates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_history" ADD CONSTRAINT "recurring_invoice_history_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "finance"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."recurring_invoice_history" ADD CONSTRAINT "recurring_invoice_history_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "finance"."recurring_invoice_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."message_threads" ADD CONSTRAINT "message_threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."message_threads" ADD CONSTRAINT "message_threads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "app"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "app"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "messaging"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."message_recipients" ADD CONSTRAINT "message_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messaging"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."message_recipients" ADD CONSTRAINT "message_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."thread_participants" ADD CONSTRAINT "thread_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "messaging"."message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messaging"."thread_participants" ADD CONSTRAINT "thread_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING btree ("auth_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING btree ("user_id" uuid_ops,"authentication_method" uuid_ops);--> statement-breakpoint
CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING btree ("sso_provider_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING btree ("for_email" text_ops);--> statement-breakpoint
CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING btree ("sso_provider_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING btree ("instance_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING btree ("instance_id" text_ops,"user_id" text_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING btree ("parent" text_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING btree ("session_id" bool_ops,"revoked" bool_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING btree ("updated_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING btree (lower(domain) text_ops);--> statement-breakpoint
CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING btree ("sso_provider_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING btree ("confirmation_token" text_ops) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING btree ("email_change_token_current" text_ops) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING btree ("email_change_token_new" text_ops) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING btree ("reauthentication_token" text_ops) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING btree ("recovery_token" text_ops) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING btree ("email" text_ops) WHERE (is_sso_user = false);--> statement-breakpoint
CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING btree (instance_id uuid_ops,lower((email)::text) uuid_ops);--> statement-breakpoint
CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING btree ("instance_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING btree ("is_anonymous" bool_ops);--> statement-breakpoint
CREATE INDEX "identities_email_idx" ON "auth"."identities" USING btree ("email" text_pattern_ops);--> statement-breakpoint
CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING btree ("not_after" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING btree ("user_id" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING btree ("user_id" timestamptz_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING btree ("friendly_name" text_ops,"user_id" uuid_ops) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);--> statement-breakpoint
CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING btree ("user_id" text_ops,"phone" text_ops);--> statement-breakpoint
CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING hash ("relates_to" text_ops);--> statement-breakpoint
CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING hash ("token_hash" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING btree ("user_id" uuid_ops,"token_type" uuid_ops);--> statement-breakpoint
CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING btree (lower(resource_id) text_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING btree ("instance_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_client_id" ON "app"."projects" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_client_status" ON "app"."projects" USING btree ("client_id" text_ops,"status" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_dates" ON "app"."projects" USING btree ("start_date" date_ops,"end_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_name_search" ON "app"."projects" USING gin (to_tsvector('english'::regconfig, name) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "app"."projects" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_due_date" ON "app"."tasks" USING btree ("due_date" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_project_id" ON "app"."tasks" USING btree ("project_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_project_status" ON "app"."tasks" USING btree ("project_id" text_ops,"status" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "app"."tasks" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_title_search" ON "app"."tasks" USING gin (to_tsvector('english'::regconfig, title) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_files_project_id" ON "app"."files" USING btree ("project_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_calendar_events_date_range" ON "app"."calendar_events" USING btree ("start_time" timestamptz_ops,"end_time" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_calendar_events_start_time" ON "app"."calendar_events" USING btree ("start_time" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "quotes_estimate_id_idx" ON "finance"."quotes" USING btree ("estimate_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "quotes_organization_id_idx" ON "finance"."quotes" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "quotes_project_id_idx" ON "finance"."quotes" USING btree ("project_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "quotes_reference_number_idx" ON "finance"."quotes" USING btree ("reference_number" text_ops);--> statement-breakpoint
CREATE INDEX "quote_items_quote_id_idx" ON "finance"."quote_items" USING btree ("quote_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_client_id" ON "finance"."invoices" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_client_id_old" ON "finance"."invoices" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_client_status" ON "finance"."invoices" USING btree ("client_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_dates" ON "finance"."invoices" USING btree ("issue_date" date_ops,"due_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_duplicated_from_id" ON "finance"."invoices" USING btree ("duplicated_from_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_estimate_id" ON "finance"."invoices" USING btree ("estimate_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_is_recurring" ON "finance"."invoices" USING btree ("is_recurring" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_organization_created_at" ON "finance"."invoices" USING btree ("organization_id" uuid_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_recurring_template_id" ON "finance"."invoices" USING btree ("recurring_template_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "finance"."invoices" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_recurring_templates_active" ON "finance"."recurring_invoice_templates" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_recurring_templates_next_generation" ON "finance"."recurring_invoice_templates" USING btree ("next_generation_date" date_ops) WHERE (is_active = true);--> statement-breakpoint
CREATE INDEX "idx_recurring_templates_organization_id" ON "finance"."recurring_invoice_templates" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_recurring_history_generation_date" ON "finance"."recurring_invoice_history" USING btree ("generation_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_recurring_history_template_id" ON "finance"."recurring_invoice_history" USING btree ("template_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_content_search" ON "messaging"."messages" USING gin (to_tsvector('english'::regconfig, content) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_thread_id" ON "messaging"."messages" USING btree ("thread_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Users can view organizations they belong to" ON "app"."organizations" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.organization_id = organizations.id) AND (profiles.id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Admin users can manage organizations" ON "app"."organizations" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can create new organizations" ON "app"."organizations" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "profiles_select_own" ON "app"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "profiles_update_own" ON "app"."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "profiles_insert_authenticated" ON "app"."profiles" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "profiles_service_role_all" ON "app"."profiles" AS PERMISSIVE FOR ALL TO "service_role";--> statement-breakpoint
CREATE POLICY "Users can view their roles" ON "app"."user_roles" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Admin users can manage roles" ON "app"."user_roles" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view invites" ON "app"."invites" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Only admins can create invites" ON "app"."invites" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Anyone can update their own invites" ON "app"."invites" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can view their own organization memberships" ON "app"."organization_members" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can create their own organization memberships" ON "app"."organization_members" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Admins can manage organization members" ON "app"."organization_members" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Admins and team members can create projects" ON "app"."projects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'team_member'::text]))))));--> statement-breakpoint
CREATE POLICY "Admins can delete projects" ON "app"."projects" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read projects they're assigned to or are clients of" ON "app"."projects" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Project team members and admins can update projects" ON "app"."projects" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read project team assignments" ON "app"."project_team" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project team members and admins can manage project team" ON "app"."project_team" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read tasks from their projects" ON "app"."tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects
  WHERE ((projects.id = tasks.project_id) AND (projects.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project team members can manage tasks" ON "app"."tasks" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read task assignments" ON "app"."task_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR (task_id IN ( SELECT tasks.id
   FROM app.tasks
  WHERE (tasks.project_id IN ( SELECT project_team.project_id
           FROM app.project_team
          WHERE (project_team.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project team members can manage task assignments" ON "app"."task_assignments" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read files they uploaded or have access to" ON "app"."files" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((uploaded_by = auth.uid()) OR (is_public = true) OR (id IN ( SELECT file_shares.file_id
   FROM app.file_shares
  WHERE (file_shares.shared_with = auth.uid()))) OR (project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (project_id IN ( SELECT projects.id
   FROM app.projects
  WHERE (projects.client_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Users can upload files to their projects" ON "app"."files" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Project team members and admins can update files" ON "app"."files" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Project team members and admins can delete files" ON "app"."files" AS PERMISSIVE FOR DELETE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can manage file shares for files they own or manage" ON "app"."file_shares" AS PERMISSIVE FOR ALL TO "authenticated" USING (((shared_by = auth.uid()) OR (file_id IN ( SELECT files.id
   FROM app.files
  WHERE (files.uploaded_by = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Users can read events they're invited to" ON "app"."calendar_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((created_by = auth.uid()) OR app.is_attendee_of_event(id, auth.uid()) OR app.is_member_of_project(project_id, auth.uid()) OR (EXISTS ( SELECT 1
   FROM app.projects
  WHERE ((projects.id = calendar_events.project_id) AND (projects.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Team members and admins can manage calendar events" ON "app"."calendar_events" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read event attendees for events they can access" ON "app"."event_attendees" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM app.calendar_events
  WHERE ((calendar_events.id = event_attendees.event_id) AND ((calendar_events.created_by = auth.uid()) OR app.is_member_of_project(calendar_events.project_id, auth.uid()) OR (EXISTS ( SELECT 1
           FROM app.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))))))));--> statement-breakpoint
CREATE POLICY "Event creators and admins can manage event attendees" ON "app"."event_attendees" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can manage their own event attendance" ON "app"."event_attendees" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can view milestones for their projects" ON "app"."milestones" AS PERMISSIVE FOR SELECT TO public USING (((project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects
  WHERE ((projects.id = milestones.project_id) AND (projects.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project team members can manage milestones" ON "app"."milestones" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view deliverables for their milestones/projects" ON "app"."deliverables" AS PERMISSIVE FOR SELECT TO public USING (((milestone_id IN ( SELECT milestones.id
   FROM app.milestones
  WHERE (milestones.project_id IN ( SELECT project_team.project_id
           FROM app.project_team
          WHERE (project_team.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (app.milestones m
     JOIN app.projects p ON ((m.project_id = p.id)))
  WHERE ((m.id = deliverables.milestone_id) AND (p.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project team members can manage deliverables" ON "app"."deliverables" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view documents from their organization" ON "app"."documents" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.organization_id = documents.organization_id)))));--> statement-breakpoint
CREATE POLICY "Admin users can manage all documents" ON "app"."documents" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view estimates for their organization/projects" ON "finance"."estimates" AS PERMISSIVE FOR SELECT TO public USING (((organization_id IN ( SELECT p.organization_id
   FROM app.profiles p
  WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects pr
  WHERE ((pr.id = estimates.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Users can create estimates for their organization/projects" ON "finance"."estimates" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update estimates for their organization/projects" ON "finance"."estimates" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete estimates for their organization/projects" ON "finance"."estimates" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view estimate items related to their estimates" ON "finance"."estimate_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM finance.estimates e
  WHERE ((e.id = estimate_items.estimate_id) AND ((e.organization_id IN ( SELECT p.organization_id
           FROM app.profiles p
          WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.projects pr
          WHERE ((pr.id = e.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
                   FROM app.project_team pt
                  WHERE (pt.user_id = auth.uid()))))))))))));--> statement-breakpoint
CREATE POLICY "Users can manage estimate items related to their estimates" ON "finance"."estimate_items" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view quotes for their organization/projects" ON "finance"."quotes" AS PERMISSIVE FOR SELECT TO public USING (((organization_id IN ( SELECT p.organization_id
   FROM app.profiles p
  WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.projects pr
  WHERE ((pr.id = quotes.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Users can manage quotes for their organization/projects" ON "finance"."quotes" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view quote items related to their quotes" ON "finance"."quote_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM finance.quotes q
  WHERE ((q.id = quote_items.quote_id) AND ((q.organization_id IN ( SELECT p.organization_id
           FROM app.profiles p
          WHERE (p.id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.projects pr
          WHERE ((pr.id = q.project_id) AND ((pr.client_id = auth.uid()) OR (pr.id IN ( SELECT pt.project_id
                   FROM app.project_team pt
                  WHERE (pt.user_id = auth.uid()))))))))))));--> statement-breakpoint
CREATE POLICY "Users can manage quote items related to their quotes" ON "finance"."quote_items" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can read invoices for their projects" ON "finance"."invoices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((client_id = auth.uid()) OR (project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Team members can manage invoices" ON "finance"."invoices" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can view invoice items related to their invoices" ON "finance"."invoice_items" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM finance.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND ((i.client_id = auth.uid()) OR (i.project_id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))))));--> statement-breakpoint
CREATE POLICY "Team members can manage invoice items" ON "finance"."invoice_items" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view payments for their invoices" ON "finance"."payments" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM finance.invoices i
  WHERE ((i.id = payments.invoice_id) AND ((i.client_id = auth.uid()) OR (i.project_id IN ( SELECT pt.project_id
           FROM app.project_team pt
          WHERE (pt.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
           FROM app.profiles
          WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))))));--> statement-breakpoint
CREATE POLICY "Team members can manage payments" ON "finance"."payments" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view recurring templates for their organization" ON "finance"."recurring_invoice_templates" AS PERMISSIVE FOR SELECT TO public USING ((organization_id IN ( SELECT profiles.organization_id
   FROM app.profiles
  WHERE (profiles.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "Users can create recurring templates for their organization" ON "finance"."recurring_invoice_templates" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update recurring templates for their organization" ON "finance"."recurring_invoice_templates" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete recurring templates for their organization" ON "finance"."recurring_invoice_templates" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view recurring history for their organization templat" ON "finance"."recurring_invoice_history" AS PERMISSIVE FOR SELECT TO public USING ((template_id IN ( SELECT rt.id
   FROM (finance.recurring_invoice_templates rt
     JOIN app.profiles p ON ((p.organization_id = rt.organization_id)))
  WHERE (p.id = auth.uid()))));--> statement-breakpoint
CREATE POLICY "System can manage recurring invoice history" ON "finance"."recurring_invoice_history" AS PERMISSIVE FOR ALL TO "service_role";--> statement-breakpoint
CREATE POLICY "Users can read threads for their projects" ON "messaging"."message_threads" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((project_id IN ( SELECT project_team.project_id
   FROM app.project_team
  WHERE (project_team.user_id = auth.uid()))) OR (project_id IN ( SELECT projects.id
   FROM app.projects
  WHERE (projects.client_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project members can create threads" ON "messaging"."message_threads" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Project members can update threads" ON "messaging"."message_threads" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can delete their own messages" ON "messaging"."messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((sender_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can read messages in their threads" ON "messaging"."messages" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can send messages in their threads" ON "messaging"."messages" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can update their own messages" ON "messaging"."messages" AS PERMISSIVE FOR UPDATE TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can manage their message read status" ON "messaging"."message_recipients" AS PERMISSIVE FOR ALL TO "authenticated" USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can read thread participants" ON "messaging"."thread_participants" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((thread_id IN ( SELECT message_threads.id
   FROM messaging.message_threads
  WHERE ((message_threads.project_id IN ( SELECT project_team.project_id
           FROM app.project_team
          WHERE (project_team.user_id = auth.uid()))) OR (message_threads.project_id IN ( SELECT projects.id
           FROM app.projects
          WHERE (projects.client_id = auth.uid())))))) OR (EXISTS ( SELECT 1
   FROM app.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));--> statement-breakpoint
CREATE POLICY "Project members can manage thread participants" ON "messaging"."thread_participants" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Users can read their own audit logs" ON "audit"."audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Admins can read all audit logs" ON "audit"."audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated";
*/