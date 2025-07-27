
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const InvoiceNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-96">
      <h2 className="text-2xl font-semibold mb-2">Invoice Not Found</h2>
      <p className="text-muted-foreground mb-6">The requested invoice could not be found.</p>
      <Button onClick={() => navigate("/invoices")}>Back to Invoices</Button>
    </div>
  );
};
