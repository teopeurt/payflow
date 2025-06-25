
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useEstimatesData } from "./useEstimatesData";
import { useInvoicesData } from "./useInvoicesData";

// Dashboard statistics type
interface DashboardStats {
  totalEstimates: number;
  activeInvoices: number;
  monthlyRevenue: number;
  projectedRevenue: number;
  estimatesTrend: number;
  invoicesTrend: number;
  revenueTrend: number;
}

// Monthly revenue data point
interface MonthlyRevenueDataPoint {
  month: string;
  revenue: number;
}

export const useDashboardData = () => {
  const { formatCurrency: formatEstimateCurrency } = useEstimatesData();
  const { formatCurrency: formatInvoiceCurrency } = useInvoicesData();
  
  // Fetch recent estimates
  const { data: recentEstimates = [], isLoading: isLoadingEstimates } = useQuery({
    queryKey: ["dashboard-recent-estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select(`
          reference_number,
          organization:organizations(name, default_currency),
          amount,
          issue_date,
          status
        `)
        .order("issue_date", { ascending: false })
        .limit(4);
        
      if (error) throw error;
      
      return (data || []).map((estimate) => ({
        id: estimate.reference_number,
        client: estimate.organization?.name || "Unknown Client",
        amount: formatEstimateCurrency(
          Number(estimate.amount), 
          estimate.organization?.default_currency || "USD"
        ),
        date: format(new Date(estimate.issue_date), "MMM dd, yyyy"),
        status: estimate.status
      }));
    },
  });

  // Fetch recent invoices
  const { data: recentInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["dashboard-recent-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          invoice_number,
          organization:organizations(name, default_currency),
          amount,
          issue_date,
          due_date,
          status,
          payments(amount)
        `)
        .order("issue_date", { ascending: false })
        .limit(4);
        
      if (error) throw error;
      
      return (data || []).map((invoice) => {
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
          id: invoice.invoice_number,
          client: invoice.organization?.name || "Unknown Client",
          amount: formatInvoiceCurrency(Number(invoice.amount)),
          date: format(new Date(invoice.issue_date), "MMM dd, yyyy"),
          status
        };
      });
    },
  });

  // Get monthly revenue data for the chart
  const { data: monthlyRevenueData = [], isLoading: isLoadingMonthlyRevenue } = useQuery({
    queryKey: ["dashboard-monthly-revenue"],
    queryFn: async () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      
      // Create array of all month names
      const allMonths = Array.from({ length: 12 }, (_, i) => {
        return format(new Date(currentYear, i, 1), "MMM");
      });
      
      // Get all paid invoices for the current year
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          amount,
          issue_date,
          payments(amount)
        `)
        .gte("issue_date", `${currentYear}-01-01`)
        .lte("issue_date", `${currentYear}-12-31`);
        
      if (error) throw error;
      
      // Calculate revenue by month
      const revenueByMonth = allMonths.map((month, index) => {
        // Filter invoices for this month and sum up payments
        const monthInvoices = (data || []).filter(invoice => {
          const invoiceDate = new Date(invoice.issue_date);
          return invoiceDate.getMonth() === index;
        });
        
        // Calculate total paid amount for this month
        const revenue = monthInvoices.reduce((total, invoice) => {
          const totalPaid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
          return total + totalPaid;
        }, 0);
        
        return {
          month,
          revenue: Math.round(revenue) // Round to whole numbers for the chart
        };
      });
      
      return revenueByMonth;
    }
  });

  // Get dashboard statistics
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-statistics"],
    queryFn: async () => {
      const currentDate = new Date();
      const currentMonthStart = startOfMonth(currentDate);
      const currentMonthEnd = endOfMonth(currentDate);
      const lastMonthStart = startOfMonth(subMonths(currentDate, 1));
      const lastMonthEnd = endOfMonth(subMonths(currentDate, 1));
      
      // Get current month estimates count and data for open estimates
      const { data: currentMonthEstimatesData, count: currentMonthEstimates } = await supabase
        .from("estimates")
        .select("amount, status", { count: "exact" })
        .gte("issue_date", currentMonthStart.toISOString())
        .lte("issue_date", currentMonthEnd.toISOString());
      
      // Calculate projected revenue from open estimates
      const openEstimatesRevenue = (currentMonthEstimatesData || []).reduce((total, estimate) => {
        // Only include estimates with statuses that are likely to convert
        if (estimate.status === "draft" || estimate.status === "sent") {
          return total + Number(estimate.amount || 0);
        }
        return total;
      }, 0);
      
      // Get last month estimates count
      const { count: lastMonthEstimates } = await supabase
        .from("estimates")
        .select("*", { count: "exact", head: true })
        .gte("issue_date", lastMonthStart.toISOString())
        .lte("issue_date", lastMonthEnd.toISOString());
      
      // Get active invoices (status = pending, sent, or overdue)
      const { data: activeInvoicesData, count: activeInvoices } = await supabase
        .from("invoices")
        .select("amount", { count: "exact"})
        .in("status", ["pending", "sent"])
        .or(`status.eq.sent,due_date.lt.${currentDate.toISOString()}`); // Include overdue
        
      // Calculate projected revenue from active invoices
      const pendingInvoicesRevenue = (activeInvoicesData || []).reduce((total, invoice) => {
        return total + Number(invoice.amount || 0);
      }, 0);
      
      // Get last month active invoices for trend
      const { count: lastMonthActiveInvoices } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "sent"])
        .or(`status.eq.sent,due_date.lt.${lastMonthEnd.toISOString()}`);
      
      // Get current month revenue
      const { data: currentMonthInvoices } = await supabase
        .from("invoices")
        .select(`
          amount,
          payments(amount)
        `)
        .gte("issue_date", currentMonthStart.toISOString())
        .lte("issue_date", currentMonthEnd.toISOString());
      
      const currentMonthRevenue = (currentMonthInvoices || []).reduce((total, invoice) => {
        const totalPaid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        return total + totalPaid;
      }, 0);
      
      // Get last month revenue for trend
      const { data: lastMonthInvoices } = await supabase
        .from("invoices")
        .select(`
          amount,
          payments(amount)
        `)
        .gte("issue_date", lastMonthStart.toISOString())
        .lte("issue_date", lastMonthEnd.toISOString());
      
      const lastMonthRevenue = (lastMonthInvoices || []).reduce((total, invoice) => {
        const totalPaid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        return total + totalPaid;
      }, 0);
      
      // Calculate trend percentages
      const estimatesTrend = lastMonthEstimates ? 
        Math.round(((currentMonthEstimates || 0) - (lastMonthEstimates || 0)) / lastMonthEstimates * 100) : 0;
      
      const invoicesTrend = lastMonthActiveInvoices ? 
        Math.round(((activeInvoices || 0) - (lastMonthActiveInvoices || 0)) / lastMonthActiveInvoices * 100) : 0;
      
      const revenueTrend = lastMonthRevenue ? 
        Math.round((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;
      
      // Calculate total projected revenue (pending invoices + open estimates)
      const projectedRevenue = pendingInvoicesRevenue + openEstimatesRevenue;
      
      return {
        totalEstimates: currentMonthEstimates || 0,
        activeInvoices: activeInvoices || 0,
        monthlyRevenue: currentMonthRevenue,
        projectedRevenue,
        estimatesTrend,
        invoicesTrend,
        revenueTrend
      };
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };
  
  return {
    recentEstimates,
    recentInvoices,
    monthlyRevenueData,
    dashboardStats,
    isLoading: isLoadingEstimates || isLoadingInvoices || isLoadingMonthlyRevenue || isLoadingStats,
    formatCurrency
  };
};
