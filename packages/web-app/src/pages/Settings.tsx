import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/shared/Spinner";
import { OrganizationCreationForm } from "@/components/settings/OrganizationCreationForm";
import { CompanyDetailsForm } from "@/components/settings/CompanyDetailsForm";
import { AddOrganizationDialog } from "@/components/settings/AddOrganizationDialog";
import { OrganizationSwitcher } from "@/components/settings/OrganizationSwitcher";
import { DeleteOrganizationButton } from "@/components/settings/DeleteOrganizationButton";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [noOrgFound, setNoOrgFound] = useState(false);

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        // Fetch all organizations the user is a member of
        const { data: memberships, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id, is_primary') // Include is_primary field here
          .eq('user_id', user.id);
          
        if (membershipError) {
          throw membershipError;
        }
        
        if (memberships && memberships.length > 0) {
          // Fetch organization details
          const { data: orgs, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .in('id', memberships.map(m => m.organization_id));
            
          if (orgsError) {
            throw orgsError;
          }
          
          if (orgs && orgs.length > 0) {
            // Add is_primary flag to each organization
            const orgsWithPrimary = orgs.map(org => ({
              ...org,
              is_primary: memberships.find(m => m.organization_id === org.id)?.is_primary || false
            }));
            
            setOrganizations(orgsWithPrimary);
            // Try to find the primary organization first
            const primaryOrg = orgsWithPrimary.find(org => 
              memberships.find(m => 
                m.organization_id === org.id && m.is_primary
              )
            );
            setCurrentOrganization(primaryOrg || orgsWithPrimary[0]);
            setNoOrgFound(false);
          } else {
            setNoOrgFound(true);
          }
        } else {
          setNoOrgFound(true);
        }
      } catch (error: any) {
        console.error('Error fetching organization data:', error);
        toast({
          variant: "destructive",
          title: "Error fetching organizations",
          description: error.message || "Failed to load organizations. Please try again.",
        });
        setNoOrgFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrgData();
  }, [user, toast]);

  const handleOrganizationCreated = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Fetch organizations again to get the newly created one
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, is_primary') // Include is_primary field here as well
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('*')
          .in('id', memberships.map(m => m.organization_id));

        if (orgs && orgs.length > 0) {
          // Add is_primary flag to each organization
          const orgsWithPrimary = orgs.map(org => ({
            ...org,
            is_primary: memberships.find(m => m.organization_id === org.id)?.is_primary || false
          }));
          
          setOrganizations(orgsWithPrimary);
          setCurrentOrganization(orgsWithPrimary[0]);
          setNoOrgFound(false);
        }
      }
    } catch (error) {
      console.error('Error refreshing organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSwitch = (org: any) => {
    setCurrentOrganization(org);
  };

  const handleOrganizationDeleted = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Fetch all organizations the user is a member of after deletion
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, is_primary')
        .eq('user_id', user.id);
          
      if (membershipError) {
        throw membershipError;
      }
      
      if (memberships && memberships.length > 0) {
        // Fetch organization details
        const { data: orgs, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', memberships.map(m => m.organization_id));
          
        if (orgsError) {
          throw orgsError;
        }
        
        if (orgs && orgs.length > 0) {
          // Add is_primary flag to each organization
          const orgsWithPrimary = orgs.map(org => ({
            ...org,
            is_primary: memberships.find(m => m.organization_id === org.id)?.is_primary || false
          }));
          
          setOrganizations(orgsWithPrimary);
          // Try to find the primary organization first
          const primaryOrg = orgsWithPrimary.find(org => 
            memberships.find(m => 
              m.organization_id === org.id && m.is_primary
            )
          );
          setCurrentOrganization(primaryOrg || orgsWithPrimary[0]);
          setNoOrgFound(false);
        } else {
          setNoOrgFound(true);
        }
      } else {
        setNoOrgFound(true);
      }
    } catch (error: unknown) {
      console.error('Error refreshing organizations after deletion:', error);
      toast({
        variant: "destructive",
        title: "Error refreshing organizations",
        description: error instanceof Error ? error.message : "Failed to refresh organizations. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryChanged = async () => {
    // We'll use the same function as handleOrganizationDeleted since it does a full refresh
    await handleOrganizationDeleted();
    
    // Force reload the page to ensure all components reflect the new primary organization
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Settings"
        description="Manage your company details and preferences"
        action={!noOrgFound && <AddOrganizationDialog userId={user?.id || ''} onSuccess={handleOrganizationCreated} />}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : noOrgFound ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Organization Found</AlertTitle>
              <AlertDescription>
                You don't have an organization set up yet. Create one to manage your company details.
              </AlertDescription>
            </Alert>
            
            <OrganizationCreationForm 
              userId={user?.id || ''} 
              onSuccess={handleOrganizationCreated} 
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {organizations.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Switch Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <OrganizationSwitcher 
                  organizations={organizations}
                  currentOrganization={currentOrganization}
                  onSwitch={handleOrganizationSwitch}
                  onPrimaryChanged={handlePrimaryChanged}
                />
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent>
              {currentOrganization && (
                <>
                  <CompanyDetailsForm
                    organizationId={currentOrganization.id}
                    initialData={currentOrganization}
                  />
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Danger Zone</h3>
                    <DeleteOrganizationButton
                      organizationId={currentOrganization.id}
                      organizationName={currentOrganization.name}
                      onSuccess={handleOrganizationDeleted}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
