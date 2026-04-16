import { useAppContext } from '@/context/AppContext';
import { useListJobs, getListJobsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HardHat, MapPin, Clock } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Link } from 'wouter';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function FieldDashboard() {
  const { tenantId, user } = useAppContext();

  const { data: jobs, isLoading } = useListJobs(tenantId, {}, {
    query: { enabled: !!tenantId, queryKey: getListJobsQueryKey(tenantId, {}) }
  });

  const myJobs = (jobs || []).filter(j => j.assignedUserId === user?.id || user?.role === 'field_staff');
  const todaysJobs = myJobs.filter(j => j.status === 'scheduled' || j.status === 'in_progress');
  const completedJobs = myJobs.filter(j => j.status === 'completed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <HardHat className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">My Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Today's Jobs</p>
            <p className="text-4xl font-bold mt-1">{todaysJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-4xl font-bold mt-1 text-green-600">{completedJobs.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : (
            <div className="space-y-3">
              {todaysJobs.map(job => (
                <Link key={job.id} href={`/field/jobs/${job.id}/complete`}>
                  <div className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{job.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{job.address}</span>
                        </div>
                        {job.scheduledAt && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(job.scheduledAt)}</span>
                          </div>
                        )}
                      </div>
                      <Badge className={`shrink-0 text-xs ${statusColors[job.status] ?? ''}`}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
              {todaysJobs.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No active jobs. Check the jobs list.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
