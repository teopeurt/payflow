import { BarChart3, FileText, FileOutput, CreditCard, ArrowRightIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge, StatusType } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Spinner } from "@/components/shared/Spinner";
import { useAuth } from "@payflow/core/auth";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import { dbQueries } from "@/lib/database/queries";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { profile } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  const { 
    recentEstimates, 
    recentInvoices, 
    monthlyRevenueData, 
    dashboardStats, 
    isLoading,
    formatCurrency 
  } = useDashboardData();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (profile?.id) {
        try {
          const role = await dbQueries.getUserRole(profile.id);
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      setRoleLoading(false);
    };

    fetchUserRole();
  }, [profile]);

  if (isLoading || roleLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show client dashboard for client users
  if (userRole === 'client') {
    return <ClientDashboard />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your business performance"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Estimates"
          value={dashboardStats?.totalEstimates.toString() || "0"}
          description="Current month"
          icon={<FileText size={20} />}
          trend={{ value: dashboardStats?.estimatesTrend || 0, isPositive: (dashboardStats?.estimatesTrend || 0) >= 0 }}
        />
        <StatCard
          title="Active Invoices"
          value={dashboardStats?.activeInvoices.toString() || "0"}
          description="Pending payment"
          icon={<FileOutput size={20} />}
          trend={{ value: dashboardStats?.invoicesTrend || 0, isPositive: (dashboardStats?.invoicesTrend || 0) >= 0 }}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(dashboardStats?.monthlyRevenue || 0)}
          description={`${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`}
          icon={<CreditCard size={20} />}
          trend={{ value: dashboardStats?.revenueTrend || 0, isPositive: (dashboardStats?.revenueTrend || 0) >= 0 }}
        />
        <StatCard
          title="Projected Revenue"
          value={formatCurrency(dashboardStats?.projectedRevenue || 0)}
          description="Pending + Estimates"
          icon={<TrendingUp size={20} />}
          trend={{ value: 100, isPositive: true }}
          className="bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-950/40 dark:to-indigo-900/30"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRevenueData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    width={80}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => [`${formatCurrency(Number(value))}`, 'Revenue']}
                    labelFormatter={(label) => `${label} ${new Date().getFullYear()}`}
                  />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
            <CardDescription>Your performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Total Estimates</p>
                  <p className="text-2xl font-bold">{dashboardStats?.totalEstimates || 0}</p>
                </div>
                <div className="bg-emerald-500/10 p-2 rounded-full">
                  <FileText size={20} className="text-emerald-500" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Active Invoices</p>
                  <p className="text-2xl font-bold">{dashboardStats?.activeInvoices || 0}</p>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <TrendingUp size={20} className="text-primary" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Revenue This Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardStats?.monthlyRevenue || 0)}</p>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-full">
                  <CreditCard size={20} className="text-amber-500" />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/reports">
                    View Detailed Reports
                    <ArrowRightIcon size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Estimates</CardTitle>
            <CardDescription>Latest estimates created for clients</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEstimates.map((estimate) => (
                  <TableRow key={estimate.id}>
                    <TableCell className="font-medium">
                      <Link to={`/estimates/${estimate.id}`} className="text-primary hover:underline">
                        {estimate.id}
                      </Link>
                    </TableCell>
                    <TableCell>{estimate.client}</TableCell>
                    <TableCell>{estimate.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={estimate.status as StatusType} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/estimates">View All Estimates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest invoices sent to clients</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link to={`/invoices/${invoice.id}`} className="text-primary hover:underline">
                        {invoice.id}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>{invoice.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status as StatusType} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/invoices">View All Invoices</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
