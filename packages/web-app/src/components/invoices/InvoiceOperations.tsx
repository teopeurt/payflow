
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RecordPaymentDialog } from "@/components/invoices/RecordPaymentDialog";
import { InvoiceData } from "@/hooks/useInvoiceData";

interface InvoiceOperationsProps {
  invoice: InvoiceData | null;
  remainingBalance: number;
  onInvoiceUpdated: () => void;
}

export const useInvoiceOperations = ({ invoice, remainingBalance, onInvoiceUpdated }: InvoiceOperationsProps) => {
  const navigate = useNavigate();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  
  const handleDelete = async () => {
    if (!invoice?.id) return;
    
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id);
      
      if (error) throw error;
      
      toast({
        title: "Invoice deleted",
        description: `Invoice has been deleted.`,
      });
      navigate("/invoices");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invoice."
      });
    }
    
    setIsDeleteDialogOpen(false);
  };
  
  const handleMarkAsPaid = async (paymentData: any) => {
    if (!invoice?.id) return;
    
    try {
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          invoice_id: invoice.id,
          amount: paymentData.amount,
          payment_date: paymentData.date,
          method: paymentData.method,
          reference: paymentData.reference || null,
          notes: paymentData.notes || null
        });
      
      if (paymentError) throw paymentError;
      
      if (Number(paymentData.amount) >= remainingBalance) {
        const { error: updateError } = await supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("id", invoice.id);
        
        if (updateError) throw updateError;
      } else {
        if (invoice.status !== "partially-paid") {
          const { error: updateError } = await supabase
            .from("invoices")
            .update({ status: "partially-paid" })
            .eq("id", invoice.id);
          
          if (updateError) throw updateError;
        }
      }
      
      toast({
        title: "Payment recorded",
        description: `Payment of ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(paymentData.amount)} has been recorded.`,
      });
      setIsPaymentDialogOpen(false);
      onInvoiceUpdated();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment."
      });
    }
  };
  
  const handleSendEmail = () => {
    toast({
      title: "Invoice sent",
      description: `Invoice has been sent to ${invoice?.client.email || "the client"}.`,
    });
    setIsEmailDialogOpen(false);
  };

  return {
    isPaymentDialogOpen,
    setIsPaymentDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    handleDelete,
    handleMarkAsPaid,
    handleSendEmail
  };
};
