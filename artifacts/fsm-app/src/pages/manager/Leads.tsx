import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  useListLeads,
  getListLeadsQueryKey,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useConvertLeadToJob,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, ArrowRight, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-200 text-red-900',
};

export default function LeadsPage() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    serviceType: '',
    description: '',
    status: 'new',
    priority: 'medium',
    estimatedValue: '',
    notes: '',
  });

  const { data: leads, isLoading } = useListLeads(tenantId, {}, {
    query: { enabled: !!tenantId, queryKey: getListLeadsQueryKey(tenantId, {}) }
  });

  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const deleteMutation = useDeleteLead();
  const convertMutation = useConvertLeadToJob();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey(tenantId, {}) });
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      tenantId,
      data: {
        ...form,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
      },
    });
    invalidate();
    setShowCreate(false);
    setForm({ customerName: '', customerEmail: '', customerPhone: '', address: '', serviceType: '', description: '', status: 'new', priority: 'medium', estimatedValue: '', notes: '' });
  };

  const handleDelete = async (leadId: number) => {
    await deleteMutation.mutateAsync({ tenantId, leadId });
    invalidate();
  };

  const handleConvert = async (leadId: number) => {
    await convertMutation.mutateAsync({ tenantId, leadId });
    invalidate();
  };

  const filtered = (leads || []).filter(l => {
    const matchSearch = l.customerName.toLowerCase().includes(search.toLowerCase()) ||
      l.serviceType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Lead
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="quoted">Quoted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{lead.customerName}</span>
                      <Badge className={statusColors[lead.status] ?? ''}>{lead.status}</Badge>
                      <Badge className={priorityColors[lead.priority] ?? ''}>{lead.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.serviceType}</p>
                    {lead.address && <p className="text-sm text-muted-foreground truncate">{lead.address}</p>}
                    {lead.estimatedValue && (
                      <p className="text-sm font-medium text-green-700 mt-1">{formatCurrency(lead.estimatedValue)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lead.status !== 'converted' && lead.status !== 'lost' && (
                      <Button size="sm" variant="outline" onClick={() => handleConvert(lead.id)}>
                        <ArrowRight className="h-4 w-4 mr-1" /> Convert
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(lead.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No leads found.</div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
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
                    {['new', 'contacted', 'quoted', 'converted', 'lost'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <div className="col-span-2">
                <Label>Estimated Value</Label>
                <Input type="number" value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.customerName || !form.serviceType}>Create Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
