
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@payflow/core/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle2, Clock, CircleAlert } from "lucide-react";

export type StatusType = 'active' | 'completed' | 'on-hold';

interface StatusOption {
  value: StatusType;
  label: string;
  icon: React.ReactNode;
}

const statusOptions: StatusOption[] = [
  { value: 'active', label: 'Active', icon: <Clock className="h-4 w-4 mr-2" /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle2 className="h-4 w-4 mr-2" /> },
  { value: 'on-hold', label: 'On Hold', icon: <CircleAlert className="h-4 w-4 mr-2" /> }
];

interface StatusUpdateMenuProps {
  id: string;
  currentStatus: StatusType;
  tableName: 'milestones' | 'deliverables';
  onSuccess?: () => void;
  size?: 'default' | 'sm';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

export function StatusUpdateMenu({
  id,
  currentStatus,
  tableName,
  onSuccess,
  size = 'sm',
  variant = 'outline',
  className
}: StatusUpdateMenuProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];
  
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: StatusType) => {
      const { data, error } = await getSupabase()
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      
      toast({
        title: "Status updated",
        description: `${tableName === 'milestones' ? 'Milestone' : 'Deliverable'} status has been updated.`,
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error(`Error updating ${tableName} status:`, error);
      toast({
        title: "Status update failed",
        description: `There was an error updating the status. Please try again.`,
        variant: "destructive",
      });
    },
  });
  
  const handleStatusChange = (newStatus: StatusType) => {
    if (newStatus !== currentStatus) {
      updateStatusMutation.mutate(newStatus);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled={updateStatusMutation.isPending}
        >
          <div className="flex items-center">
            {currentOption.icon}
            {currentOption.label}
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={`flex items-center ${currentStatus === option.value ? 'bg-accent' : ''}`}
            onClick={() => handleStatusChange(option.value)}
            disabled={updateStatusMutation.isPending}
          >
            {option.icon}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
