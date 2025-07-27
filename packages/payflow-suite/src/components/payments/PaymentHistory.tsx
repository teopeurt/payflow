
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@payflow/core/auth";
import { schemaClient } from "@/lib/database";
import { dbQueries } from "@/lib/database/queries";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed';
  invoice: {
    id: string;
    invoice_number: string;
  };
}

export const PaymentHistory = () => {
  const { profile } = useAuth();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const userRole = await dbQueries.getUserRole(profile.id);
      
      let query = schemaClient.finance
        .payments()
        .select(`
          *,
          invoice:invoices(id, invoice_number, client_id)
        `);

      // Apply client filtering if user is a client
      if (userRole === 'client') {
        // Filter payments for invoices belonging to this client
        query = query.in('invoice_id', 
          schemaClient.finance
            .invoices()
            .select('id')
            .eq('client_id', profile.id)
        );
      }

      const { data, error } = await query.order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Loading payment history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No payment history found
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.payment_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                  <TableCell>{renderStatus(payment.status)}</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                  <TableCell>{payment.invoice?.invoice_number || 'N/A'}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
