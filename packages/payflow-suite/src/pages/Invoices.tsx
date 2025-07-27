
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useInvoicesData } from "@/hooks/useInvoicesData";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { useInvoiceDownloadPDF } from "@/hooks/useInvoicePDF";
import { useQueryClient } from "@tanstack/react-query";

const Invoices = () => {
  const {
    invoices,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    formatDate,
    formatCurrency
  } = useInvoicesData();

  const { handleDownloadPDF } = useInvoiceDownloadPDF();
  const queryClient = useQueryClient();
  
  const handleDeleteInvoice = (invoiceId: string) => {
    // Invalidate and refetch invoices query to refresh the list
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Invoices" 
        description="Create and manage invoices for your clients"
        action={{
          label: "New Invoice",
          href: "/invoices/new",
          icon: <Plus size={16} />,
        }}
      />

      <Card>
        <CardContent className="p-6">
          <InvoiceFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          <InvoicesTable
            invoices={invoices}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onDownloadPDF={handleDownloadPDF}
            onDeleteInvoice={handleDeleteInvoice}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
