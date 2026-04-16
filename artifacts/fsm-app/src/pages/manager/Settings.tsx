import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  useGetTenant,
  getGetTenantQueryKey,
  useUpdateTenant,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    currency: 'USD',
    paymentProvider: 'stripe',
    paystackPublicKey: '',
    stripePublicKey: '',
  });

  const { data: tenant, isLoading } = useGetTenant(tenantId, {
    query: { enabled: !!tenantId, queryKey: getGetTenantQueryKey(tenantId) }
  });

  const updateMutation = useUpdateTenant();

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        currency: tenant.currency,
        paymentProvider: tenant.paymentProvider,
        paystackPublicKey: tenant.paystackPublicKey ?? '',
        stripePublicKey: tenant.stripePublicKey ?? '',
      });
    }
  }, [tenant]);

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      tenantId,
      data: {
        name: form.name,
        currency: form.currency,
        paymentProvider: form.paymentProvider,
        paystackPublicKey: form.paystackPublicKey || null,
        stripePublicKey: form.stripePublicKey || null,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetTenantQueryKey(tenantId) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePaymentProvider = () => {
    const next = form.paymentProvider === 'stripe' ? 'paystack' : 'stripe';
    const nextCurrency = next === 'paystack' ? 'ZAR' : 'USD';
    setForm(f => ({ ...f, paymentProvider: next, currency: nextCurrency }));
  };

  if (isLoading) {
    return <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Tenant Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={form.currency} readOnly className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">Currency is set automatically based on payment provider</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
            <div className={`flex-1 text-center p-3 rounded-lg font-semibold text-sm transition-all ${form.paymentProvider === 'stripe' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground'}`}>
              Stripe (USD)
            </div>
            <Switch
              checked={form.paymentProvider === 'paystack'}
              onCheckedChange={togglePaymentProvider}
            />
            <div className={`flex-1 text-center p-3 rounded-lg font-semibold text-sm transition-all ${form.paymentProvider === 'paystack' ? 'bg-green-600 text-white shadow-md' : 'text-muted-foreground'}`}>
              Paystack (ZAR)
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Currently using <strong>{form.paymentProvider === 'stripe' ? 'Stripe' : 'Paystack'}</strong> for {form.currency} payments.
          </p>

          {form.paymentProvider === 'stripe' ? (
            <div>
              <Label>Stripe Public Key</Label>
              <Input
                value={form.stripePublicKey}
                onChange={e => setForm(f => ({ ...f, stripePublicKey: e.target.value }))}
                placeholder="pk_live_..."
              />
            </div>
          ) : (
            <div>
              <Label>Paystack Public Key</Label>
              <Input
                value={form.paystackPublicKey}
                onChange={e => setForm(f => ({ ...f, paystackPublicKey: e.target.value }))}
                placeholder="pk_live_..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saved ? 'Saved!' : updateMutation.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
