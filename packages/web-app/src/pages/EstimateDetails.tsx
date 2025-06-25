import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spinner } from "@/components/shared/Spinner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useClientData } from "@/hooks/useClientData";
import { useAuth } from "@/contexts/AuthContext";
import { EstimateHeader } from "@/components/estimates/EstimateHeader";
import { EstimateInfo } from "@/components/estimates/EstimateInfo";
import { EstimateDetailLineItems } from "@/components/estimates/EstimateDetailLineItems";
import { EstimateNotes } from "@/components/estimates/EstimateNotes";
import { EstimatePDFViewer } from "@/components/estimates/EstimatePDFViewer";
import { EstimateSidebar } from "@/components/estimates/EstimateSidebar";
import { EstimateNotFound } from "@/components/estimates/EstimateNotFound";
import { useEstimatePDF } from "@/hooks/useEstimatePDF";
import { 
  EstimateData, 
  RawEstimate, 
  RawProject, 
  toEstimateData 
} from "@/types/estimate";

const EstimateDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { profile } = useAuth(); // Get authenticated user profile
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  
  useEffect(() => {
    const fetchEstimate = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch the estimate data
        const { data, error } = await supabase
          .from("estimates")
          .select(`
            *,
            estimate_items(*),
            organization:organizations(*)
          `)
          .eq("reference_number", id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const rawEstimate = data as RawEstimate;
          let projectData: RawProject | null = null;
          
          if (rawEstimate.project_id) {
            const { data: project } = await supabase
              .from("projects")
              .select("*")
              .eq("id", rawEstimate.project_id)
              .single();
              
            projectData = project;
          }
          
          // Fetch the authenticated user's organization data
          let userOrganization = null;
          if (profile?.organization_id) {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', profile.organization_id)
              .single();
              
            if (!orgError && orgData) {
              userOrganization = orgData;
            }
          }
          
          // Convert raw data to DTO
          const estimateData = toEstimateData(rawEstimate, projectData);
          
          // Add company information from the user's organization
          if (userOrganization) {
            estimateData.companyName = userOrganization.company_name || userOrganization.name || "Your Company";
            estimateData.companyAddress = userOrganization.company_address || "";
            estimateData.companyEmail = userOrganization.company_email || "";
            estimateData.companyPhone = userOrganization.company_phone || "";
          }
          
          setEstimate(estimateData);
        } else {
          toast({
            variant: "destructive",
            title: "Estimate Not Found",
            description: "The requested estimate could not be found."
          });
          setEstimate(null);
        }
      } catch (error) {
        console.error("Error fetching estimate:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Estimate",
          description: "Could not load the estimate data."
        });
        setEstimate(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimate();
  }, [id, toast, profile]);
  
  // Use the custom PDF hook
  const { pdfBlob, loadingPdf } = useEstimatePDF(estimate);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!estimate) {
    return <EstimateNotFound />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <EstimateHeader 
        id={estimate.id}
        date={estimate.date}
        status={estimate.status}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="col-span-1 xl:col-span-2 space-y-6">
          <EstimateInfo
            status={estimate.status}
            client={estimate.client}
            project={estimate.project}
            date={estimate.date}
            dueDate={estimate.dueDate}
            amount={estimate.amount}
            currency={estimate.currency}
          />

          <EstimateDetailLineItems
            lineItems={estimate.lineItems}
            subtotal={estimate.subtotal}
            tax={estimate.tax}
            discount={0}
            amount={estimate.amount}
            currency={estimate.currency}
          />
          
          <EstimateNotes
            notes={estimate.notes}
            terms={estimate.terms}
          />
        </div>
        
        <div className="col-span-1">
          <div className="sticky top-6 space-y-6">
            <EstimatePDFViewer
              pdfBlob={pdfBlob}
              loading={loadingPdf}
              estimateId={estimate.id}
            />
            
            <EstimateSidebar
              id={estimate.id}
              status={estimate.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateDetails;
