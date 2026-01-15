import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Users, Car, Calendar, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface FinancialManagementProps {
  userRole: string | null;
}

interface FinancialStats {
  totalRevenue: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  driverPayouts: number;
  platformCommission: number;
  pendingPayments: number;
  refunds: number;
}

interface Transaction {
  id: string;
  type: 'ride_payment' | 'driver_payout' | 'refund' | 'commission';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
  user_name?: string;
  driver_name?: string;
}

export function FinancialManagement({ userRole }: FinancialManagementProps) {
  const { formatCurrency } = useSystemSettings();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    driverPayouts: 0,
    platformCommission: 0,
    pendingPayments: 0,
    refunds: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchFinancialData();
  }, [timeRange]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch payments data
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          rides!inner(
            passenger_id,
            driver_id,
            passengers!inner(name),
            drivers!inner(name)
          )
        `)
        .gte('created_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const platformCommission = totalRevenue * 0.15; // 15% commission
      const driverPayouts = totalRevenue - platformCommission;

      // Calculate daily revenue (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dailyRevenue = payments?.filter(p => new Date(p.created_at) >= oneDayAgo)
        .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Calculate weekly revenue (last 7 days)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklyRevenue = payments?.filter(p => new Date(p.created_at) >= oneWeekAgo)
        .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Calculate monthly revenue (last 30 days)
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const monthlyRevenue = payments?.filter(p => new Date(p.created_at) >= oneMonthAgo)
        .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      const pendingPayments = payments?.filter(p => p.status === 'pending')
        .reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      setStats({
        totalRevenue,
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        driverPayouts,
        platformCommission,
        pendingPayments,
        refunds: 0, // Would calculate from refund records
      });

      // Transform payments to transactions
      const transactionData: Transaction[] = payments?.map(payment => ({
        id: payment.id,
        type: 'ride_payment' as const,
        amount: Number(payment.amount),
        status: payment.status as any,
        date: payment.created_at,
        description: `Ride Payment - ${payment.method}`,
        user_name: (payment.rides as any)?.passengers?.name,
        driver_name: (payment.rides as any)?.drivers?.name,
      })) || [];

      setTransactions(transactionData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // formatCurrency is now provided by useSystemSettings hook

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      change: "+12.5%",
      trend: "up" as const,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      change: "+8.2%",
      trend: "up" as const,
    },
    {
      title: "Driver Payouts",
      value: formatCurrency(stats.driverPayouts),
      icon: Users,
      change: "+5.1%",
      trend: "up" as const,
    },
    {
      title: "Platform Commission",
      value: formatCurrency(stats.platformCommission),
      icon: Car,
      change: "+15.3%",
      trend: "up" as const,
    },
  ];

  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">
            Revenue tracking, payouts, and financial analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchFinancialData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {card.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {card.change} from last period
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Driver Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Financial Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                All financial transactions and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">
                        {transaction.type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.user_name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Payouts</CardTitle>
              <CardDescription>
                Manage driver earnings and payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Driver payout management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Analytics</CardTitle>
              <CardDescription>
                Revenue trends and financial insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Revenue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Daily Revenue:</span>
                      <span className="font-medium">{formatCurrency(stats.dailyRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Weekly Revenue:</span>
                      <span className="font-medium">{formatCurrency(stats.weeklyRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monthly Revenue:</span>
                      <span className="font-medium">{formatCurrency(stats.monthlyRevenue)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Commission & Payouts</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Platform Commission (15%):</span>
                      <span className="font-medium">{formatCurrency(stats.platformCommission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Driver Payouts (85%):</span>
                      <span className="font-medium">{formatCurrency(stats.driverPayouts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending Payments:</span>
                      <span className="font-medium">{formatCurrency(stats.pendingPayments)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}