import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DeleteOrganizationButtonProps {
  organizationId: string;
  organizationName: string;
  onSuccess: () => void;
}

export function DeleteOrganizationButton({
  organizationId,
  organizationName,
  onSuccess,
}: DeleteOrganizationButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (!user?.id) return;
    
    try {
      setIsDeleting(true);
      
      // First, check if this is the only organization the user belongs to
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);
        
      if (membershipError) throw membershipError;
      
      if (memberships.length <= 1) {
        toast({
          title: "Cannot delete organization",
          description: "You must belong to at least one organization. Create a new organization before deleting this one.",
          variant: "destructive",
        });
        setOpen(false);
        return;
      }
      
      // Delete the organization membership
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', organizationId);
        
      if (deleteError) throw deleteError;
      
      // If this was the primary organization, set another one as primary
      const { data: remainingMemberships, error: fetchError } = await supabase
        .from('organization_members')
        .select('id, organization_id')
        .eq('user_id', user.id)
        .limit(1);
        
      if (fetchError) throw fetchError;
      
      if (remainingMemberships && remainingMemberships.length > 0) {
        const { error: updateError } = await supabase
          .from('organization_members')
          .update({ is_primary: true })
          .eq('id', remainingMemberships[0].id);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Organization removed",
        description: `You have been removed from ${organizationName}.`,
      });
      
      onSuccess();
      setOpen(false);
    } catch (error: unknown) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: `Failed to delete organization: ${error instanceof Error ? error.message : "Please try again."}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Organization</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove yourself from <strong>{organizationName}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
