
import { Card, CardContent } from "@/components/ui/card";

interface QuoteNotesProps {
  notes: string;
  terms: string;
}

export const QuoteNotes = ({ notes, terms }: QuoteNotesProps) => {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {notes && (
          <div>
            <h3 className="text-lg font-medium mb-2">Notes</h3>
            <p className="text-muted-foreground whitespace-pre-line">{notes}</p>
          </div>
        )}
        
        {terms && (
          <div>
            <h3 className="text-lg font-medium mb-2">Terms & Conditions</h3>
            <p className="text-muted-foreground whitespace-pre-line">{terms}</p>
          </div>
        )}
        
        {!notes && !terms && (
          <p className="text-muted-foreground">No additional notes or terms have been added to this quote.</p>
        )}
      </CardContent>
    </Card>
  );
};
