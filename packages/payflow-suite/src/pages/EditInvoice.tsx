
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Spinner } from "@/components/shared/Spinner";
import { InvoiceForm } from "@/components/invoices/EditInvoice/InvoiceForm";
import { useEditInvoice } from "@/hooks/useEditInvoice";

const EditInvoice = () => {
  const {
    id,
    isLoading,
    clients,
    clientProjects,
    logoFile,
    logoPreview,
    invoiceData,
    handleClientChange,
    handleSubmit,
    setLogoFile,
    navigate
  } = useEditInvoice();
  
  if (isLoading || !invoiceData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={() => navigate(`/invoices/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title="Edit Invoice" className="ml-4" />
      </div>

      <InvoiceForm
        defaultValues={invoiceData}
        clients={clients}
        projects={clientProjects}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/invoices/${id}`)}
        isLoading={isLoading}
        onClientChange={handleClientChange}
        onLogoChange={(file) => setLogoFile(file)}
        logoPreview={logoPreview}
      />
    </div>
  );
};

export default EditInvoice;
