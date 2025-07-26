-- Add recurring invoice support to existing invoices table
-- This migration adds the necessary columns and tables for recurring invoice functionality

-- First, add recurring fields to the existing invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.client_profiles(id),
ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id),
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency varchar(20),
ADD COLUMN IF NOT EXISTS recurring_start_date date,
ADD COLUMN IF NOT EXISTS recurring_until varchar(20) CHECK (recurring_until IN ('indefinitely', 'on_date', 'count')),
ADD COLUMN IF NOT EXISTS recurring_end_date date,
ADD COLUMN IF NOT EXISTS recurring_count integer,
ADD COLUMN IF NOT EXISTS duplicated_from_id uuid REFERENCES public.invoices(id),
ADD COLUMN IF NOT EXISTS recurring_template_id uuid;

-- Create enum for recurring frequency
CREATE TYPE public.recurring_frequency_type AS ENUM (
    'daily',
    'weekly', 
    'monthly',
    'quarterly',
    'yearly'
);

-- Create enum for recurring end condition
CREATE TYPE public.recurring_until_type AS ENUM (
    'indefinitely',
    'on_date', 
    'count'
);

-- Update the recurring_frequency column to use the enum
ALTER TABLE public.invoices 
ALTER COLUMN recurring_frequency TYPE recurring_frequency_type USING recurring_frequency::recurring_frequency_type;

-- Update the recurring_until column to use the enum  
ALTER TABLE public.invoices
ALTER COLUMN recurring_until TYPE recurring_until_type USING recurring_until::recurring_until_type;

-- Create recurring invoice templates table
CREATE TABLE IF NOT EXISTS public.recurring_invoice_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id),
    client_id uuid REFERENCES public.client_profiles(id),
    
    -- Template metadata
    template_name varchar(255) NOT NULL,
    is_active boolean DEFAULT true,
    
    -- Invoice template data (stored as JSONB for flexibility)
    invoice_data jsonb NOT NULL,
    
    -- Recurring configuration
    frequency recurring_frequency_type NOT NULL,
    start_date date NOT NULL,
    until_type recurring_until_type NOT NULL DEFAULT 'indefinitely',
    end_date date,
    max_count integer,
    
    -- Generation tracking
    next_generation_date date NOT NULL,
    generation_count integer DEFAULT 0,
    last_generated_at timestamp with time zone,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
) USING orioledb;

-- Create recurring invoice generation history table
CREATE TABLE IF NOT EXISTS public.recurring_invoice_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES public.recurring_invoice_templates(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
    
    -- Generation details
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    generation_date date NOT NULL, -- The date this invoice was supposed to be generated for
    status varchar(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'skipped')),
    error_message text,
    
    -- Metadata
    invoice_data jsonb, -- Snapshot of invoice data at generation time
    created_at timestamp with time zone DEFAULT now() NOT NULL
) USING orioledb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_template_id ON public.invoices(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_invoices_is_recurring ON public.invoices(is_recurring);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_duplicated_from_id ON public.invoices(duplicated_from_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_created_at ON public.invoices(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recurring_templates_organization_id ON public.recurring_invoice_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_active ON public.recurring_invoice_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_next_generation ON public.recurring_invoice_templates(next_generation_date) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_recurring_history_template_id ON public.recurring_invoice_history(template_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_generation_date ON public.recurring_invoice_history(generation_date);

-- Add additional fields to invoice_items for better duplication support
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_rate numeric(5,2) DEFAULT 0;

-- Create a function to calculate next generation date
CREATE OR REPLACE FUNCTION public.calculate_next_generation_date(
    current_date date,
    frequency recurring_frequency_type
) RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE frequency
        WHEN 'daily' THEN current_date + interval '1 day'
        WHEN 'weekly' THEN current_date + interval '1 week' 
        WHEN 'monthly' THEN current_date + interval '1 month'
        WHEN 'quarterly' THEN current_date + interval '3 months'
        WHEN 'yearly' THEN current_date + interval '1 year'
    END::date;
$$;

-- Create a function for duplicate invoice with items (transaction-safe)
CREATE OR REPLACE FUNCTION public.duplicate_invoice_with_items(
    original_invoice_id uuid,
    new_invoice_data jsonb,
    invoice_items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_invoice_id uuid;
    item jsonb;
BEGIN
    -- Insert new invoice
    INSERT INTO public.invoices (
        organization_id,
        project_id,
        client_id,
        amount,
        subtotal,
        tax,
        discount,
        status,
        invoice_number,
        issue_date,
        due_date,
        notes,
        terms,
        purchase_order,
        quote_id,
        is_recurring,
        recurring_frequency,
        recurring_start_date,
        recurring_until,
        recurring_end_date,
        recurring_count,
        duplicated_from_id,
        recurring_template_id,
        created_at,
        updated_at
    ) 
    SELECT 
        (new_invoice_data->>'organization_id')::uuid,
        (new_invoice_data->>'project_id')::uuid,
        (new_invoice_data->>'client_id')::uuid,
        (new_invoice_data->>'amount')::numeric,
        (new_invoice_data->>'subtotal')::numeric,
        (new_invoice_data->>'tax')::numeric,
        (new_invoice_data->>'discount')::numeric,
        new_invoice_data->>'status',
        new_invoice_data->>'invoice_number',
        (new_invoice_data->>'issue_date')::timestamp with time zone,
        (new_invoice_data->>'due_date')::timestamp with time zone,
        new_invoice_data->>'notes',
        new_invoice_data->>'terms',
        new_invoice_data->>'purchase_order',
        (new_invoice_data->>'quote_id')::uuid,
        COALESCE((new_invoice_data->>'is_recurring')::boolean, false),
        (new_invoice_data->>'recurring_frequency')::recurring_frequency_type,
        (new_invoice_data->>'recurring_start_date')::date,
        (new_invoice_data->>'recurring_until')::recurring_until_type,
        (new_invoice_data->>'recurring_end_date')::date,
        (new_invoice_data->>'recurring_count')::integer,
        (new_invoice_data->>'duplicated_from_id')::uuid,
        (new_invoice_data->>'recurring_template_id')::uuid,
        (new_invoice_data->>'created_at')::timestamp with time zone,
        (new_invoice_data->>'updated_at')::timestamp with time zone
    RETURNING id INTO new_invoice_id;

    -- Insert invoice items
    FOR item IN SELECT * FROM jsonb_array_elements(invoice_items)
    LOOP
        INSERT INTO public.invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            amount,
            tax_rate,
            discount_rate
        ) VALUES (
            new_invoice_id,
            item->>'description',
            (item->>'quantity')::numeric,
            (item->>'unit_price')::numeric,
            (item->>'amount')::numeric,
            COALESCE((item->>'tax_rate')::numeric, 0),
            COALESCE((item->>'discount_rate')::numeric, 0)
        );
    END LOOP;

    RETURN new_invoice_id;
END;
$$;

-- Set up RLS policies for recurring invoice templates
ALTER TABLE public.recurring_invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring templates for their organization" 
ON public.recurring_invoice_templates FOR SELECT
USING (
    organization_id IN (
        SELECT profiles.organization_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);

CREATE POLICY "Users can create recurring templates for their organization" 
ON public.recurring_invoice_templates FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT profiles.organization_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);

CREATE POLICY "Users can update recurring templates for their organization" 
ON public.recurring_invoice_templates FOR UPDATE
USING (
    organization_id IN (
        SELECT profiles.organization_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);

CREATE POLICY "Users can delete recurring templates for their organization" 
ON public.recurring_invoice_templates FOR DELETE
USING (
    organization_id IN (
        SELECT profiles.organization_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    )
);

-- Set up RLS policies for recurring invoice history
ALTER TABLE public.recurring_invoice_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurring history for their organization templates" 
ON public.recurring_invoice_history FOR SELECT
USING (
    template_id IN (
        SELECT rt.id 
        FROM recurring_invoice_templates rt
        JOIN profiles p ON p.organization_id = rt.organization_id
        WHERE p.id = auth.uid()
    )
);

CREATE POLICY "System can manage recurring invoice history" 
ON public.recurring_invoice_history FOR ALL
USING (true);

-- Grant permissions
GRANT ALL ON public.recurring_invoice_templates TO authenticated;
GRANT ALL ON public.recurring_invoice_templates TO anon;
GRANT ALL ON public.recurring_invoice_templates TO service_role;

GRANT ALL ON public.recurring_invoice_history TO authenticated;
GRANT ALL ON public.recurring_invoice_history TO anon;
GRANT ALL ON public.recurring_invoice_history TO service_role;

GRANT EXECUTE ON FUNCTION public.calculate_next_generation_date TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_next_generation_date TO anon;
GRANT EXECUTE ON FUNCTION public.calculate_next_generation_date TO service_role;

GRANT EXECUTE ON FUNCTION public.duplicate_invoice_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.duplicate_invoice_with_items TO anon;
GRANT EXECUTE ON FUNCTION public.duplicate_invoice_with_items TO service_role;

-- Add organizations default payment terms if it doesn't exist
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS default_payment_terms integer DEFAULT 30;

-- Update the updated_at trigger for new tables
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER recurring_invoice_templates_updated_at 
    BEFORE UPDATE ON public.recurring_invoice_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();