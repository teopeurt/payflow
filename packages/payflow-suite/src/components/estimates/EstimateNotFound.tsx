
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EstimateNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-bold mb-2">Estimate not found</h2>
      <p className="text-muted-foreground mb-6">The estimate you're looking for doesn't exist.</p>
      <Button onClick={() => navigate("/estimates")}>Back to Estimates</Button>
    </div>
  );
};
