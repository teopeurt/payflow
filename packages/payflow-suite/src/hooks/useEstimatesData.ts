import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

type Tables = Database['public']['Tables'];
type EstimateRow = Tables['estimates']['Row'];
type EstimateItemRow = Tables['estimate_items']['Row'];

interface Organization {
  name: string;
  default_currency?: string;
}

interface DatabaseEstimate extends EstimateRow {
  organization: Organization;
}

export type Estimate = Omit<DatabaseEstimate, 'organization'> & {
  organization?: Organization;
  estimate_items?: EstimateItem[];
}

type EstimateItem = EstimateItemRow;

export const useEstimatesData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const queryClient = useQueryClient();

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("estimates")
        .select(`
          id,
          reference_number,
          amount,
          issue_date,
          expiry_date,
          status,
          notes,
          terms,
          created_at,
          updated_at,
          company_name,
          company_address,
          company_email,
          company_phone,
          organization_id,
          organization:organizations(name, default_currency)
        `)
        .is('deleted', false)
        .order("issue_date", { ascending: false });
        
      if (error) throw error;
      return data as unknown as DatabaseEstimate[];
    },
  });

  const filteredEstimates = estimates
    .filter((estimate: DatabaseEstimate) => 
      (statusFilter === "all" || estimate.status === statusFilter) &&
      (
        estimate.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        estimate.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a: DatabaseEstimate, b: DatabaseEstimate) => {
      const dateA = new Date(a.issue_date).getTime();
      const dateB = new Date(b.issue_date).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const getEstimateUrl = (referenceNumber: string) => `/estimates/${referenceNumber}`;

  const deleteEstimate = async (id: string) => {
    // Soft delete estimate items
    const { error: itemsError } = await getSupabase()
      .from('estimate_items')
      .update({ deleted: true } as EstimateItemRow)
      .is('deleted', false)
      .eq('estimate_id', id);

    if (itemsError) {
      toast.error("Failed to delete estimate items");
      throw itemsError;
    }

    // Soft delete the estimate
    const { error } = await getSupabase()
      .from('estimates')
      .update({ deleted: true } as EstimateRow)
      .is('deleted', false)
      .eq('id', id);

    if (error) {
      toast.error("Failed to delete estimate");
      throw error;
    }

    // Invalidate the estimates query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["estimates"] });
    toast.success("Estimate deleted successfully");
  };

  return {
    estimates: filteredEstimates as unknown as Estimate[],
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder, 
    setSortOrder,
    formatDate,
    formatCurrency,
    getEstimateUrl,
    deleteEstimate
  };
};
