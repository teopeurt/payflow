import { useState } from "react";
import { Check, Star, StarOff } from "lucide-react";
import { useAuth } from "@payflow/core/auth";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface Organization {
  id: string;
  name: string;
  is_primary?: boolean;
}

interface OrganizationSwitcherProps {
  organizations: Organization[];
  currentOrganization: Organization;
  onSwitch: (org: Organization) => void;
  onPrimaryChanged?: () => void;
}

export function OrganizationSwitcher({ 
  organizations, 
  currentOrganization, 
  onSwitch,
  onPrimaryChanged
}: OrganizationSwitcherProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSetPrimary = async (orgId: string) => {
    if (!user?.id || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Get the membership ID for this organization
      const { data: membership, error: membershipError } = await getSupabase()
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single();
        
      if (membershipError) throw membershipError;
      
      if (membership) {
        // Update the membership to be primary
        const { error: primaryError } = await getSupabase()
          .from('organization_members')
          .update({ is_primary: true })
          .eq('id', membership.id);
          
        if (primaryError) throw primaryError;
        
        // Wait a moment for the database trigger to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
          title: "Primary organization updated",
          description: "Your primary organization has been updated successfully.",
        });
        
        // Notify parent component to refresh data
        if (onPrimaryChanged) {
          onPrimaryChanged();
        }
      }
    } catch (error: unknown) {
      console.error('Error setting primary organization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update primary organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        value={currentOrganization?.id}
        onValueChange={(value) => {
          const org = organizations.find(o => o.id === value);
          if (org) onSwitch(org);
        }}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name} {org.is_primary && <Star className="inline h-3 w-3 ml-1 text-yellow-500" />}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Your Organizations</h3>
        <div className="space-y-2">
          {organizations.map((org) => (
            <Card key={org.id} className={`${currentOrganization?.id === org.id ? 'border-primary' : ''}`}>
              <CardContent className="p-3 flex justify-between items-center">
                <div className="flex items-center">
                  {org.is_primary && (
                    <Star className="h-4 w-4 text-yellow-500 mr-2" />
                  )}
                  <span className="font-medium">{org.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {currentOrganization?.id === org.id && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center">
                      <Check className="h-3 w-3 mr-1" /> Current
                    </span>
                  )}
                  {!org.is_primary && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetPrimary(org.id)}
                      disabled={isUpdating}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Set Primary
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
