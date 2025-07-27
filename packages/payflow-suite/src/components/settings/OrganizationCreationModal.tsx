import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, PlusCircle } from "lucide-react";
import { OrganizationCreationForm } from "./OrganizationCreationForm";
import { useState } from "react";

interface OrganizationCreationModalProps {
  userId: string;
  onOrganizationCreated: () => void;
}

export function OrganizationCreationModal({
  userId,
  onOrganizationCreated,
}: OrganizationCreationModalProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onOrganizationCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage different businesses or teams.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <OrganizationCreationForm 
            userId={userId} 
            onSuccess={handleSuccess} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
