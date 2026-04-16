import { useAppContext } from '@/context/AppContext';
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useListLeads, getListLeadsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, FileText, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'wouter';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export default function SalesDashboard() {
  const { tenantId } = useAppContext();

  const { data: summary, isLoading } = useGetDashboardSummary(tenantId, {
    query: { enabled: !!tenantId, queryKey: getGetDashboardSummaryQueryKey(tenantId) }
  });
  const { data: leads } = useListLeads(tenantId, {}, {
    query: { enabled: !!tenantId, queryKey: getListLeadsQueryKey(tenantId, {}) }
  });

  const recentLeads = (leads || []).slice(-5).reverse();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sales Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">{summary?.totalLeads ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">{summary?.openLeads ?? 0} open</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Pending Quotes</p>
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold">{summary?.pendingQuotes ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">{summary?.totalQuotes ?? 0} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold">{summary?.conversionRate ?? 0}%</p>
                <p className="text-sm text-muted-foreground mt-1">leads to jobs</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentLeads.map(lead => (
            <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">{lead.customerName}</p>
                <p className="text-xs text-muted-foreground">{lead.serviceType}</p>
              </div>
              <div className="flex items-center gap-2">
                {lead.estimatedValue && <span className="text-sm font-medium">{formatCurrency(lead.estimatedValue)}</span>}
                <Badge className={`text-xs ${statusColors[lead.status] ?? ''}`}>{lead.status}</Badge>
              </div>
            </div>
          ))}
          {recentLeads.length === 0 && <p className="text-muted-foreground text-center py-8">No leads yet.</p>}
          <Link href="/sales/leads" className="block text-center text-sm text-primary hover:underline pt-2">
            View all leads
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
