
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceTableRow } from "./InvoiceTableRow";
import { Spinner } from "@/components/shared/Spinner";
import { Invoice } from "@/hooks/useInvoicesData";

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  onDownloadPDF: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

export const InvoicesTable = ({
  invoices,
  isLoading,
  formatCurrency,
  formatDate,
  onDownloadPDF,
  onDeleteInvoice
}: InvoicesTableProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Purchase Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <InvoiceTableRow
                key={invoice.id}
                invoice={invoice}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onDownloadPDF={onDownloadPDF}
                onDelete={onDeleteInvoice}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                No invoices found matching your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
