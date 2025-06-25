
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  invoice: string;
}

export const PaymentHistory = () => {
  // This would typically come from an API
  const payments: Payment[] = [
    {
      id: "pmt_1234",
      date: "2025-03-30T12:00:00",
      amount: 1200.00,
      status: "completed",
      method: "Visa •••• 4242",
      invoice: "INV-2024-10"
    },
    {
      id: "pmt_1235",
      date: "2025-03-15T14:30:00",
      amount: 850.00,
      status: "completed",
      method: "Direct Debit •••• 6789",
      invoice: "INV-2024-09"
    },
    {
      id: "pmt_1236",
      date: "2025-02-28T09:15:00",
      amount: 1750.00,
      status: "completed",
      method: "Mastercard •••• 5555",
      invoice: "INV-2024-08"
    },
    {
      id: "pmt_1237",
      date: "2025-01-15T16:45:00",
      amount: 3200.00,
      status: "completed",
      method: "Direct Debit •••• 6789",
      invoice: "INV-2024-07"
    },
    {
      id: "pmt_1238",
      date: "2025-04-15T00:00:00",
      amount: 900.00,
      status: "pending",
      method: "Scheduled",
      invoice: "INV-2024-11"
    }
  ];

  const renderStatus = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View all your past and upcoming payments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{format(new Date(payment.date), "MMM d, yyyy")}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{renderStatus(payment.status)}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>{payment.invoice}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    {payment.status === 'completed' && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
