
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";
import { Link } from "react-router-dom";

export const QuoteNotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <FileX className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold tracking-tight mb-2">Quote Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        The quote you're looking for doesn't exist or has been removed. Please check the URL and try again.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/quotes">Return to Quotes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/quotes/new">Create New Quote</Link>
        </Button>
      </div>
    </div>
  );
};
