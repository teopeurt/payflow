
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { InvoiceFormValues } from "@/components/invoices/EditInvoice/schema";
import { transformInvoiceData } from "@/utils/invoiceUtils";

// Client and project types to match database schema
type Client = {
  id: string;
  name: string;
  email?: string;
};

type Project = {
  id: string;
  name: string;
  clientId: string;
};

export const useEditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceFormValues | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch clients from database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Fetch organizations (our clients)
        const { data: organizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, name');
        
        if (orgError) throw orgError;

        // Transform organizations to clients format
        const clientsData = organizations.map(org => ({
          id: org.id,
          name: org.name
        }));

        setClients(clientsData);
      } catch (error: any) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchClients();
  }, []);

  // Fetch invoice data and populate the form
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoading(true);
      
      try {
        if (!id) {
          throw new Error("Invoice ID is missing");
        }
        
        // Fetch invoice with related data
        const { data: invoiceRaw, error: invoiceError } = await supabase
          .from("invoices")
          .select(`
            *,
            organization:organizations(*, default_currency),
            project:projects(*),
            invoice_items(*),
            payments(*)
          `)
          .eq("id", id)
          .single();
          
        if (invoiceError) throw invoiceError;
        if (!invoiceRaw) throw new Error("Invoice not found");
        
        // Transform the data to match our form schema
        const invoice = transformInvoiceData(invoiceRaw);
        if (!invoice) throw new Error("Failed to transform invoice data");
        
        // Format invoice data for the form
        const formValues: InvoiceFormValues = {
          clientId: invoice.client.id,
          projectId: invoice.project?.id || "",
          invoiceNumber: invoice.invoiceNumber,
          purchaseOrder: invoice.purchaseOrder || "",
          issueDate: new Date(invoice.issueDate),
          dueDate: new Date(invoice.dueDate),
          status: invoice.status,
          items: invoice.items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          })),
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          discount: invoice.discount,
          total: invoice.amount,
          notes: invoice.notes || "",
          terms: invoice.terms || "",
          isRecurring: invoice.isRecurring || false,
          recurringFrequency: invoice.recurringFrequency || "",
          recurringStartDate: invoice.recurringStartDate ? new Date(invoice.recurringStartDate) : undefined,
          recurringUntil: invoice.recurringUntil || "indefinitely",
          recurringEndDate: invoice.recurringEndDate ? new Date(invoice.recurringEndDate) : undefined,
          recurringCount: invoice.recurringCount
        };
        
        setInvoiceData(formValues);
        
        // Set logo preview if exists
        if (invoiceRaw.logo_url) {
          setLogoPreview(invoiceRaw.logo_url);
        }
        
        // Load projects for the selected client
        handleClientChange(invoice.client.id);
        
      } catch (error: any) {
        console.error("Error fetching invoice:", error);
        toast({
          title: "Error",
          description: `Failed to load invoice: ${error.message}`,
          variant: "destructive",
        });
        navigate("/invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id, navigate]);

  // Update projects when client changes
  const handleClientChange = async (clientId: string) => {
    try {
      // Fetch projects from the database based on the client ID
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .eq("organization_id", clientId);
        
      if (projectsError) throw projectsError;
      
      // Transform to expected format
      const projects = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        clientId: clientId
      }));
      
      setClientProjects(projects);
    } catch (error) {
      console.error("Error fetching client projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects for this client.",
        variant: "destructive",
      });
    }
  };

  // Upload logo to storage
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !id) return null;
    
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoice-logos')
        .upload(filePath, logoFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('invoice-logos')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (data: InvoiceFormValues) => {
    setIsLoading(true);

    try {
      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }
      
      // Update invoice in the database
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          organization_id: data.clientId,
          project_id: data.projectId || null,
          invoice_number: data.invoiceNumber,
          purchase_order: data.purchaseOrder,
          issue_date: data.issueDate.toISOString().split('T')[0],
          due_date: data.dueDate.toISOString().split('T')[0],
          status: data.status,
          amount: data.total,
          tax: data.tax,
          notes: data.notes,
          terms: data.terms,
          logo_url: logoUrl || undefined  // Only update if we have a new logo
        })
        .eq("id", id);
        
      if (updateError) throw updateError;
      
      // Delete existing invoice items
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", id);
        
      if (deleteError) throw deleteError;
      
      // Insert new invoice items
      const invoiceItems = data.items.map(item => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.rate,
        amount: item.amount
      }));
      
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);
        
      if (itemsError) throw itemsError;
      
      toast({
        title: "Invoice updated",
        description: `Invoice ${data.invoiceNumber} has been updated.`,
      });
      
      navigate(`/invoices/${id}`);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update invoice: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
};
