
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface Invoice {
  id: string;
  invoice_number: string;
  organization?: {
    name: string;
    address?: string;
    default_currency?: string;
  };
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  purchase_order?: string;
  notes?: string;
  terms?: string;
  payments?: Payment[];
  invoice_items?: InvoiceItem[];
  calculatedStatus?: string;
  totalPaid?: number;
  logo_url?: string;
}

interface Payment {
  amount: number;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export const useInvoicesData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          organization:organizations(name),
          payments(*)
        `)
        .order("issue_date", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });

  const processedInvoices = invoices.map((invoice: Invoice) => {
    const totalPaid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
    
    let status = invoice.status;
    
    if (status === "sent" && new Date() > new Date(invoice.due_date)) {
      status = "overdue";
    }
    
    if (totalPaid >= Number(invoice.amount)) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partially-paid";
    }
    
    return {
      ...invoice,
      calculatedStatus: status,
      totalPaid,
    };
  });

  const filteredInvoices = processedInvoices
    .filter((invoice: Invoice) => 
      (statusFilter === "all" || invoice.calculatedStatus === statusFilter) &&
      (
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        invoice.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a: Invoice, b: Invoice) => {
      const dateA = new Date(a.issue_date).getTime();
      const dateB = new Date(b.issue_date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return {
    invoices: filteredInvoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder, 
    setSortOrder,
    formatDate,
    formatCurrency
  };
};
