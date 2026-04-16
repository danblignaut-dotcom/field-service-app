import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  useListJobs,
  getListJobsQueryKey,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  useAssignJob,
  useListUsers,
  getListUsersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, UserCheck, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-200 text-red-900 font-bold',
};

export default function JobsPage() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [assignDialog, setAssignDialog] = useState<{ jobId: number; userId: number | null } | null>(null);
  const [form, setForm] = useState({
    title: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    serviceType: '',
    description: '',
    status: 'scheduled',
    priority: 'medium',
    totalAmount: '',
    scheduledAt: '',
  });

  const { data: jobs, isLoading } = useListJobs(tenantId, {}, {
    query: { enabled: !!tenantId, queryKey: getListJobsQueryKey(tenantId, {}) }
  });
  const { data: users } = useListUsers(tenantId, {
    query: { enabled: !!tenantId, queryKey: getListUsersQueryKey(tenantId) }
  });
  const fieldStaff = (users || []).filter(u => u.role === 'field_staff');

  const createMutation = useCreateJob();
  const deleteMutation = useDeleteJob();
  const updateMutation = useUpdateJob();
  const assignMutation = useAssignJob();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListJobsQueryKey(tenantId, {}) });

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      tenantId,
      data: {
        ...form,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : null,
        scheduledAt: form.scheduledAt || null,
      },
    });
    invalidate();
    setShowCreate(false);
  };

  const handleAssign = async () => {
    if (!assignDialog || !assignDialog.userId) return;
    await assignMutation.mutateAsync({
      tenantId,
      jobId: assignDialog.jobId,
      data: { assignedUserId: assignDialog.userId },
    });
    invalidate();
    setAssignDialog(null);
  };

  const filtered = (jobs || []).filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getUserName = (id: number | null) => {
    if (!id) return 'Unassigned';
    return users?.find(u => u.id === id)?.name ?? 'Unknown';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Job
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold">{job.title}</span>
                      <Badge className={statusColors[job.status] ?? ''}>{job.status.replace('_', ' ')}</Badge>
                      <Badge className={priorityColors[job.priority] ?? ''}>{job.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{job.customerName} — {job.address}</p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Assigned: <strong className="text-foreground">{getUserName(job.assignedUserId)}</strong></span>
                      {job.scheduledAt && <span>Scheduled: {formatDate(job.scheduledAt)}</span>}
                      {job.totalAmount && <span className="text-green-700 font-medium">{formatCurrency(job.totalAmount)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setAssignDialog({ jobId: job.id, userId: job.assignedUserId })}>
                      <UserCheck className="h-4 w-4 mr-1" /> Assign
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                      await deleteMutation.mutateAsync({ tenantId, jobId: job.id });
                      invalidate();
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No jobs found.</div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Job</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Job Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Address *</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Service Type *</Label>
                <Input value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['scheduled', 'in_progress', 'completed', 'cancelled'].map(s => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['low', 'medium', 'high', 'urgent'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Total Amount</Label>
                <Input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} />
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.customerName || !form.address || !form.serviceType}>Create Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Field Staff</DialogTitle></DialogHeader>
          <div className="py-3">
            <Label>Select Staff Member</Label>
            <Select
              value={assignDialog?.userId?.toString() ?? ''}
              onValueChange={v => setAssignDialog(d => d ? { ...d, userId: Number(v) } : null)}
            >
              <SelectTrigger><SelectValue placeholder="Choose staff..." /></SelectTrigger>
              <SelectContent>
                {fieldStaff.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignDialog?.userId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
