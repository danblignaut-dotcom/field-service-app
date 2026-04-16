import { useAppContext } from '@/context/AppContext';
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, Briefcase, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useGetTenant, getGetTenantQueryKey } from '@workspace/api-client-react';

export default function ManagerDashboard() {
  const { tenantId } = useAppContext();
  
  const { data: tenant } = useGetTenant(tenantId, { 
    query: { enabled: !!tenantId, queryKey: getGetTenantQueryKey(tenantId) } 
  });
  
  const { data: summary, isLoading } = useGetDashboardSummary(tenantId, {
    query: { enabled: !!tenantId, queryKey: getGetDashboardSummaryQueryKey(tenantId) }
  });

  const currency = tenant?.currency || 'USD';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold tracking-tight">Command Center</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0, currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{formatCurrency(summary?.pendingRevenue || 0, currency)} pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {summary?.totalJobs || 0} total jobs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.openLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(summary?.conversionRate || 0).toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingQuotes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {summary?.totalQuotes || 0} total quotes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
