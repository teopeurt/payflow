
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Quote, fetchQuotes } from "@/services/quotesService";

export const useQuotesData = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: fetchQuotes
  });

  const filteredQuotes = quotes
    .filter((quote: Quote) => 
      (statusFilter === "all" || quote.status === statusFilter) &&
      (
        quote.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        quote.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a: Quote, b: Quote) => {
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

  const getQuoteUrl = (referenceNumber: string) => `/quotes/${referenceNumber}`;

  return {
    quotes: filteredQuotes,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder, 
    setSortOrder,
    formatDate,
    formatCurrency,
    getQuoteUrl
  };
};
