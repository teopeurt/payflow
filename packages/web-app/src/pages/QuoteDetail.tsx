
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "@/components/shared/Spinner";
import { generateEstimatePDF } from "@/lib/pdfGenerator";
import { PdfGenerateData } from "@/types/pdf";
import { useToast } from "@/hooks/use-toast";
import { QuoteHeader } from "@/components/quotes/QuoteHeader";
import { QuoteInfo } from "@/components/quotes/QuoteInfo";
import { QuoteLineItems } from "@/components/quotes/QuoteLineItems";
import { QuoteNotes } from "@/components/quotes/QuoteNotes";
import { QuotePDFViewer } from "@/components/quotes/QuotePDFViewer";
import { QuoteSidebar } from "@/components/quotes/QuoteSidebar";
import { QuoteNotFound } from "@/components/quotes/QuoteNotFound";
import { supabase } from "@/integrations/supabase/client";

const QuoteDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("quotes")
          .select(`
            *,
            quote_items(*),
            organization:organizations(*)
          `)
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setQuote({
            id: data.id,
            client: {
              id: data.organization_id,
              name: data.organization?.name || "Unknown Client",
              email: data.organization?.company_email || "",
              phone: data.organization?.company_phone || "",
              address: data.organization?.company_address || "",
              currency: data.organization?.default_currency || "USD"
            },
            project: {
              id: data.project_id || "",
              name: data.project_id ? "Project" : "No Project Assigned"
            },
            amount: Number(data.amount),
            subtotal: Number(data.amount),
            tax: 0,
            discount: 0,
            date: data.issue_date,
            status: data.status,
            dueDate: data.expiry_date,
            lineItems: data.quote_items.map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unit_price),
              amount: Number(item.amount)
            })),
            notes: data.notes || "",
            terms: data.terms || "",
            currency: data.organization?.default_currency || "USD"
          });
        } else {
          toast({
            variant: "destructive",
            title: "Quote Not Found",
            description: "The requested quote could not be found."
          });
          setQuote(null);
        }
      } catch (error) {
        console.error("Error fetching quote:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Quote",
          description: "Could not load the quote data."
        });
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id, toast]);

  useEffect(() => {
    if (quote) {
      setLoadingPdf(true);
      try {
        const pdfData: PdfGenerateData = {
          id: quote.id,
          clientName: quote.client.name,
          clientAddress: quote.client.address || "",
          date: new Date(quote.date).toLocaleDateString(),
          dueDate: new Date(quote.dueDate).toLocaleDateString(),
          notes: quote.notes,
          terms: quote.terms,
          lineItems: quote.lineItems,
          subtotal: quote.subtotal,
          tax: quote.tax || 0,
          total: quote.amount,
          currency: quote.currency,
          companyName: "Your Company", // Add default values for the required fields
          companyAddress: "",
          companyEmail: "",
          companyPhone: ""
        };

        const generatedPdf = generateEstimatePDF(pdfData);
        setPdfBlob(generatedPdf);
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
          variant: "destructive",
          title: "PDF Generation Failed",
          description: "Could not generate the quote PDF."
        });
      } finally {
        setLoadingPdf(false);
      }
    }
  }, [quote, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!quote) {
    return <QuoteNotFound />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <QuoteHeader
        id={quote.id}
        date={quote.date}
        status={quote.status}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="col-span-1 xl:col-span-2 space-y-6">
          <QuoteInfo
            status={quote.status}
            client={quote.client}
            project={quote.project}
            date={quote.date}
            dueDate={quote.dueDate}
            amount={quote.amount}
            currency={quote.currency}
          />

          <QuoteLineItems
            lineItems={quote.lineItems}
            subtotal={quote.subtotal}
            tax={quote.tax}
            discount={quote.discount}
            amount={quote.amount}
            currency={quote.currency}
          />

          <QuoteNotes
            notes={quote.notes}
            terms={quote.terms}
          />
        </div>

        <div className="col-span-1">
          <div className="sticky top-6 space-y-6">
            <QuotePDFViewer
              pdfBlob={pdfBlob}
              loading={loadingPdf}
              quoteId={quote.id}
            />

            <QuoteSidebar
              id={quote.id}
              status={quote.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetails;
