
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ArrowUpRight, ArrowDownRight, CalendarClock } from "lucide-react";

export const PaymentStatistics = () => {
  // This would typically come from an API
  const stats = {
    totalPaid: "$12,450.00",
    lastPayment: "$1,200.00",
    pendingPayments: "$3,500.00",
    nextPaymentDue: "Apr 15, 2025"
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Total Payments</p>
            <div className="rounded-full bg-primary/10 p-1 text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.totalPaid}</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Last Payment</p>
            <div className="rounded-full bg-emerald-500/10 p-1 text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.lastPayment}</div>
          <p className="text-xs text-muted-foreground">
            Received on Mar 30, 2025
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Pending Payments</p>
            <div className="rounded-full bg-amber-500/10 p-1 text-amber-500">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          <p className="text-xs text-muted-foreground">
            From 3 outstanding invoices
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Next Payment Due</p>
            <div className="rounded-full bg-blue-500/10 p-1 text-blue-500">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.nextPaymentDue}</div>
          <p className="text-xs text-muted-foreground">
            Invoice #INV-2024-11
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
