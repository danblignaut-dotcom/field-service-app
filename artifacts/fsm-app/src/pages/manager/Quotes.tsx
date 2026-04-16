import { useState, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  useListQuotes,
  getListQuotesQueryKey,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  useApproveQuote,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Check, Download, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-700',
};

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function QuotesPage() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    taxRate: '15',
    notes: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as LineItem[],
  });

  const { data: quotes, isLoading } = useListQuotes(tenantId, {}, {
    query: { enabled: !!tenantId, queryKey: getListQuotesQueryKey(tenantId, {}) }
  });

  const createMutation = useCreateQuote();
  const deleteMutation = useDeleteQuote();
  const approveMutation = useApproveQuote();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListQuotesQueryKey(tenantId, {}) });

  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setForm(f => {
      const items = [...f.lineItems];
      items[idx] = { ...items[idx], [field]: value };
      items[idx].total = items[idx].quantity * items[idx].unitPrice;
      return { ...f, lineItems: items };
    });
  };

  const addLineItem = () => {
    setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }] }));
  };

  const removeLineItem = (idx: number) => {
    setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));
  };

  const subtotal = form.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * (Number(form.taxRate) / 100);
  const total = subtotal + taxAmount;

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      tenantId,
      data: {
        customerName: form.customerName,
        customerEmail: form.customerEmail || null,
        customerPhone: form.customerPhone || null,
        address: form.address || null,
        lineItems: form.lineItems,
        taxRate: Number(form.taxRate),
        notes: form.notes || null,
      },
    });
    invalidate();
    setShowCreate(false);
  };

  const handlePrint = (quote: (typeof quotes)[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const lineItems = (quote.lineItems as LineItem[]) || [];
    const html = `
      <html><head><title>Quote #${quote.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 28px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th { background: #f3f4f6; padding: 10px; text-align: left; font-size: 13px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .totals { margin-top: 24px; text-align: right; }
        .total-row { font-weight: bold; font-size: 18px; }
      </style></head>
      <body>
        <h1>Quote #${quote.id}</h1>
        <p class="sub">Date: ${formatDate(quote.createdAt)}</p>
        <p><strong>Customer:</strong> ${quote.customerName}</p>
        ${quote.customerEmail ? `<p><strong>Email:</strong> ${quote.customerEmail}</p>` : ''}
        ${quote.address ? `<p><strong>Address:</strong> ${quote.address}</p>` : ''}
        <table>
          <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          ${lineItems.map(li => `<tr><td>${li.description}</td><td>${li.quantity}</td><td>${formatCurrency(li.unitPrice)}</td><td>${formatCurrency(li.total)}</td></tr>`).join('')}
        </table>
        <div class="totals">
          <p>Subtotal: ${formatCurrency(quote.subtotal)}</p>
          <p>Tax (${quote.taxRate}%): ${formatCurrency(quote.taxAmount)}</p>
          <p class="total-row">Total: ${formatCurrency(quote.total)}</p>
        </div>
        ${quote.notes ? `<p style="margin-top:24px"><strong>Notes:</strong> ${quote.notes}</p>` : ''}
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Quote
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(quotes || []).map(quote => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Quote #{quote.id} — {quote.customerName}</span>
                      <Badge className={statusColors[quote.status] ?? ''}>{quote.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(quote.createdAt)}</p>
                    <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(quote.total)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handlePrint(quote)}>
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </Button>
                    {quote.status === 'sent' && (
                      <Button size="sm" variant="outline" className="text-green-700" onClick={async () => {
                        await approveMutation.mutateAsync({ tenantId, quoteId: quote.id });
                        invalidate();
                      }}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                      await deleteMutation.mutateAsync({ tenantId, quoteId: quote.id });
                      invalidate();
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(quotes || []).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">No quotes yet.</div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quote</DialogTitle>
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
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-3">Unit Price</span>
                  <span className="col-span-2">Total</span>
                </div>
                {form.lineItems.map((li, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-5 h-8 text-sm" value={li.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Service description" />
                    <Input className="col-span-2 h-8 text-sm" type="number" value={li.quantity} min={1} onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))} />
                    <Input className="col-span-3 h-8 text-sm" type="number" value={li.unitPrice} onChange={e => updateLineItem(i, 'unitPrice', Number(e.target.value))} />
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="text-sm font-medium">{formatCurrency(li.total)}</span>
                      {form.lineItems.length > 1 && (
                        <button onClick={() => removeLineItem(i)} className="text-destructive hover:text-destructive/80 ml-auto">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right space-y-1 text-sm border-t pt-3">
                <p>Subtotal: <strong>{formatCurrency(subtotal)}</strong></p>
                <div className="flex items-center justify-end gap-2">
                  <span>Tax rate:</span>
                  <Input className="w-16 h-7 text-sm" type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
                  <span>%</span>
                  <span>= <strong>{formatCurrency(taxAmount)}</strong></span>
                </div>
                <p className="text-base font-bold">Total: {formatCurrency(total)}</p>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.customerName || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
