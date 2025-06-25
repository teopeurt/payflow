
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference?: string; // Now optional
}

interface PaymentHistoryProps {
  payments: Payment[];
  formatDate: (date: string) => string;
  currency?: string; // Optional currency code, defaults to USD
}

export const PaymentHistory = ({ payments, formatDate, currency = 'USD' }: PaymentHistoryProps) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  if (payments.length === 0) return null;
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-medium mb-4">Payment History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.date)}</TableCell>
                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>{payment.reference || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
