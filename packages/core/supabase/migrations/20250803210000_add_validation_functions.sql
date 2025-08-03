-- Function to validate invoice amounts match invoice_items totals
CREATE OR REPLACE FUNCTION public.validate_invoice_amounts()
RETURNS TABLE (
  invoice_id uuid,
  invoice_number text,
  expected_total numeric,
  actual_total numeric,
  difference numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.total_amount as expected_total,
    COALESCE(SUM(ii.quantity * ii.unit_price), 0) as actual_total,
    i.total_amount - COALESCE(SUM(ii.quantity * ii.unit_price), 0) as difference
  FROM finance.invoices i
  LEFT JOIN finance.invoice_items ii ON i.id = ii.invoice_id
  GROUP BY i.id, i.invoice_number, i.total_amount
  HAVING i.total_amount != COALESCE(SUM(ii.quantity * ii.unit_price), 0);
END;
$$;

-- Function to validate payment amounts don't exceed invoice amounts
CREATE OR REPLACE FUNCTION public.validate_payment_amounts()
RETURNS TABLE (
  payment_id uuid,
  invoice_id uuid,
  invoice_number text,
  invoice_total numeric,
  total_payments numeric,
  overpayment numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH payment_totals AS (
    SELECT 
      p.invoice_id,
      SUM(p.amount) as total_paid
    FROM finance.payments p
    WHERE p.status = 'completed'
    GROUP BY p.invoice_id
  )
  SELECT 
    p.id as payment_id,
    i.id as invoice_id,
    i.invoice_number,
    i.total_amount as invoice_total,
    pt.total_paid as total_payments,
    pt.total_paid - i.total_amount as overpayment
  FROM finance.invoices i
  JOIN payment_totals pt ON i.id = pt.invoice_id
  JOIN finance.payments p ON p.invoice_id = i.id
  WHERE pt.total_paid > i.total_amount;
END;
$$;

-- Function to validate all invoice line items have valid references
CREATE OR REPLACE FUNCTION public.validate_invoice_items()
RETURNS TABLE (
  item_id uuid,
  invoice_id uuid,
  issue text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Check for invoice items without valid invoice
  SELECT 
    ii.id as item_id,
    ii.invoice_id,
    'Invoice item references non-existent invoice' as issue
  FROM finance.invoice_items ii
  LEFT JOIN finance.invoices i ON ii.invoice_id = i.id
  WHERE i.id IS NULL
  
  UNION ALL
  
  -- Check for zero or negative quantities
  SELECT 
    ii.id as item_id,
    ii.invoice_id,
    'Invoice item has invalid quantity' as issue
  FROM finance.invoice_items ii
  WHERE ii.quantity <= 0
  
  UNION ALL
  
  -- Check for negative prices
  SELECT 
    ii.id as item_id,
    ii.invoice_id,
    'Invoice item has negative unit price' as issue
  FROM finance.invoice_items ii
  WHERE ii.unit_price < 0;
END;
$$;

-- Function to get invoice summary with calculated totals
CREATE OR REPLACE FUNCTION public.get_invoice_summary()
RETURNS TABLE (
  total_invoices bigint,
  total_amount numeric,
  paid_amount numeric,
  outstanding_amount numeric,
  overdue_count bigint,
  overdue_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH payment_summary AS (
    SELECT 
      invoice_id,
      SUM(amount) as paid_amount
    FROM finance.payments
    WHERE status = 'completed'
    GROUP BY invoice_id
  ),
  invoice_summary AS (
    SELECT 
      i.id,
      i.total_amount,
      COALESCE(ps.paid_amount, 0) as paid,
      i.total_amount - COALESCE(ps.paid_amount, 0) as outstanding,
      CASE 
        WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' THEN 1 
        ELSE 0 
      END as is_overdue
    FROM finance.invoices i
    LEFT JOIN payment_summary ps ON i.id = ps.invoice_id
  )
  SELECT 
    COUNT(*)::bigint as total_invoices,
    SUM(total_amount) as total_amount,
    SUM(paid) as paid_amount,
    SUM(outstanding) as outstanding_amount,
    SUM(is_overdue)::bigint as overdue_count,
    SUM(CASE WHEN is_overdue = 1 THEN outstanding ELSE 0 END) as overdue_amount
  FROM invoice_summary;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_invoice_amounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_payment_amounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invoice_items() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoice_summary() TO authenticated;