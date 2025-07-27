
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getSupabase } from "@payflow/core/integrations/supabase/client";

export const useEditEstimateData = (estimateId: string) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch estimate data from Supabase
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!estimateId) return;
      
      setLoading(true);
      try {
        // Query by reference number instead of id
        const { data, error } = await getSupabase()
          .from("estimates")
          .select(`
            *,
            estimate_items(*),
            organization:organizations(*)
          `)
          .eq("reference_number", estimateId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Fetch project data if available
          let projectData = null;
          if (data.project_id) {
            const { data: project } = await getSupabase()
              .from("projects")
              .select("*")
              .eq("id", data.project_id)
              .single();
              
            projectData = project;
          }
          
          // Set the estimate data
          setEstimate({
            id: data.id,
            referenceNumber: data.reference_number,
            client: {
              id: data.organization_id,
              name: data.organization?.name || "Unknown Client",
              email: "",  // Default empty string since it doesn't exist in the organization type
              phone: "",  // Default empty string since it doesn't exist in the organization type
              address: ""  // Default empty string for address
            },
            project: projectData ? {
              id: projectData.id,
              name: projectData.name
            } : {
              id: "",
              name: "No Project Assigned"
            },
            amount: Number(data.amount),
            date: data.issue_date,
            status: data.status,
            dueDate: data.expiry_date,
            notes: data.notes || "",
            terms: data.terms || "",
            currency: data.organization?.default_currency || "USD"
          });

          // Format line items
          const items = data.estimate_items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price),
            amount: Number(item.amount)
          }));
          setLineItems(items);
        }
      } catch (error) {
        console.error("Error fetching estimate:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Estimate",
          description: "Could not load the estimate data."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimate();
  }, [estimateId, toast]);

  // Update line item in state
  const updateLineItem = (index: number, field: string, value: any) => {
    const updatedItems = [...lineItems];
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index][field] = Number(value);
      // Recalculate amount
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].unitPrice;
    } else {
      updatedItems[index][field] = value;
    }
    
    setLineItems(updatedItems);
  };

  // Add new line item
  const addLineItem = () => {
    const newItem = {
      id: `new-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0
    };
    
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  // Save estimate changes
  const saveEstimate = async (formData: any) => {
    setSaving(true);
    try {
      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const tax = formData.tax || 0;
      const total = subtotal + tax;
      
      // Update estimate in Supabase
      const { error } = await getSupabase()
        .from("estimates")
        .update({
          issue_date: formData.date,
          expiry_date: formData.dueDate,
          amount: total,
          notes: formData.notes,
          terms: formData.terms,
          status: estimate.status // Keep the existing status
        })
        .eq("id", estimate.id);
      
      if (error) throw error;
      
      // Handle line items
      // First, get the existing items to determine what needs to be created/updated/deleted
      const { data: existingItems } = await getSupabase()
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", estimate.id);
      
      // Create or update line items
      for (const item of lineItems) {
        const isExisting = existingItems?.some(existing => existing.id === item.id);
        
        if (isExisting) {
          // Update existing item
          await getSupabase()
            .from("estimate_items")
            .update({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              amount: item.amount
            })
            .eq("id", item.id);
        } else {
          // Create new item
          await getSupabase()
            .from("estimate_items")
            .insert({
              estimate_id: estimate.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              amount: item.amount
            });
        }
      }
      
      // Delete items that are no longer present
      const currentItemIds = lineItems.map(item => item.id);
      const itemsToDelete = existingItems?.filter(item => !currentItemIds.includes(item.id));
      
      if (itemsToDelete && itemsToDelete.length > 0) {
        for (const item of itemsToDelete) {
          await getSupabase()
            .from("estimate_items")
            .delete()
            .eq("id", item.id);
        }
      }
      
      toast({
        title: "Estimate updated",
        description: `Estimate ${estimateId} has been updated successfully`,
      });
      
      return true;
    } catch (error) {
      console.error("Error updating estimate:", error);
      toast({
        variant: "destructive",
        title: "Error Updating Estimate",
        description: "Could not update the estimate. Please try again."
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    estimate,
    lineItems,
    loading,
    saving,
    updateLineItem,
    addLineItem,
    removeLineItem,
    saveEstimate
  };
};
