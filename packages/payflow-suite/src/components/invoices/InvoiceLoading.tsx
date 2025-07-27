
import { Spinner } from "@/components/shared/Spinner";

export const InvoiceLoading = () => {
  return (
    <div className="flex justify-center items-center h-96">
      <Spinner size="lg" />
    </div>
  );
};
