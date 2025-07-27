
import { InvoiceSidebarActions } from "./InvoiceSidebarActions";

interface InvoiceSidebarProps {
  invoiceId: string;
  isPaid: boolean;
  onRecordPayment: () => void;
}

export const InvoiceSidebar = ({ 
  invoiceId, 
  isPaid, 
  onRecordPayment
}: InvoiceSidebarProps) => {
  return (
    <div className="sticky top-6 space-y-6">
      <InvoiceSidebarActions 
        invoiceId={invoiceId}
        isPaid={isPaid}
        onRecordPayment={onRecordPayment}
      />
    </div>
  );
};
