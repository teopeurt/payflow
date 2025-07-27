
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { OrganizationCreationForm } from "./OrganizationCreationForm";

interface AddOrganizationDialogProps {
  userId: string;
  onSuccess: () => void;
}

export function AddOrganizationDialog({ userId, onSuccess }: AddOrganizationDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
        </DialogHeader>
        <OrganizationCreationForm userId={userId} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
