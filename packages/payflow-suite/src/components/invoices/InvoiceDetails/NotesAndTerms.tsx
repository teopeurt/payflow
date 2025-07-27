
import { Separator } from "@/components/ui/separator";

interface NotesAndTermsProps {
  notes?: string;
  terms?: string;
}

export const NotesAndTerms = ({ notes, terms }: NotesAndTermsProps) => {
  if (!notes && !terms) return null;
  
  return (
    <>
      <Separator className="my-6" />
      
      {notes && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Notes</h3>
          <p className="text-muted-foreground text-sm">{notes}</p>
        </div>
      )}
      
      {terms && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Terms and Conditions</h3>
          <p className="text-muted-foreground text-sm">{terms}</p>
        </div>
      )}
    </>
  );
};
