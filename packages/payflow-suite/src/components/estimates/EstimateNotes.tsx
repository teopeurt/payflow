
import { Card, CardContent } from "@/components/ui/card";

interface EstimateNotesProps {
  notes?: string;
  terms?: string;
}

export const EstimateNotes = ({ notes, terms }: EstimateNotesProps) => {
  if (!notes && !terms) return null;
  
  return (
    <Card>
      <CardContent className="p-6">
        {notes && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Notes</h3>
            <p className="text-muted-foreground">{notes}</p>
          </div>
        )}
        {terms && (
          <div>
            <h3 className="text-lg font-medium mb-2">Terms & Conditions</h3>
            <p className="text-muted-foreground">{terms}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
