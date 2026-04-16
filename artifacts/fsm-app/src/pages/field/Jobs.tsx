import { useAppContext } from '@/context/AppContext';
import { useListJobs, getListJobsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function FieldJobsPage() {
  const { tenantId } = useAppContext();

  const { data: jobs, isLoading } = useListJobs(tenantId, {}, {
    query: { enabled: !!tenantId, queryKey: getListJobsQueryKey(tenantId, {}) }
  });

  const myJobs = (jobs || []).filter(j => j.status !== 'cancelled');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Jobs</h1>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {myJobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{job.title}</span>
                      <Badge className={`text-xs ${statusColors[job.status] ?? ''}`}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{job.customerName}</p>
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{job.address}</span>
                    </div>
                    {job.scheduledAt && (
                      <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(job.scheduledAt)}</span>
                      </div>
                    )}
                  </div>
                  {job.status !== 'completed' && (
                    <Link href={`/field/jobs/${job.id}/complete`}>
                      <Button size="sm" className="shrink-0">
                        Complete <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {myJobs.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No jobs assigned to you.</div>
          )}
        </div>
      )}
    </div>
  );
}
