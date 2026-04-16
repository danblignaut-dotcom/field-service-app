import { useState, useRef, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import {
  useGetJob,
  getGetJobQueryKey,
  useCompleteJob,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Camera, PenLine, Trash2 } from 'lucide-react';

export default function CompletePage() {
  const [, params] = useRoute('/field/jobs/:jobId/complete');
  const jobId = Number(params?.jobId);
  const { tenantId } = useAppContext();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [sigEmpty, setSigEmpty] = useState(true);

  const { data: job, isLoading } = useGetJob(tenantId, jobId, {
    query: { enabled: !!tenantId && !!jobId, queryKey: getGetJobQueryKey(tenantId, jobId) }
  });

  const completeMutation = useCompleteJob();

  const getCanvas = () => canvasRef.current;

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas) return;
    isDrawing.current = true;
    setSigEmpty(false);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearSignature = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigEmpty(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const canvas = getCanvas();
    const signatureDataUrl = canvas && !sigEmpty ? canvas.toDataURL('image/png') : null;
    await completeMutation.mutateAsync({
      tenantId,
      jobId,
      data: {
        completionPhotoUrl: photoDataUrl,
        completionSignatureUrl: signatureDataUrl,
        completionNotes: notes || null,
      },
    });
    queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(tenantId, jobId) });
    setIsCompleted(true);
  };

  if (isLoading) {
    return <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  if (!job) {
    return <div className="p-6 text-muted-foreground">Job not found.</div>;
  }

  if (isCompleted || job.status === 'completed') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">Job Completed!</h2>
        <p className="text-muted-foreground mt-2">"{job.title}" has been marked as complete.</p>
        {job.completionSignatureUrl && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-2">Captured signature:</p>
            <img src={job.completionSignatureUrl} alt="Signature" className="border rounded-lg mx-auto h-24" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Complete Job</h1>
        <p className="text-muted-foreground">{job.title} — {job.customerName}</p>
        <p className="text-sm text-muted-foreground">{job.address}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5" /> Completion Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photoDataUrl ? (
            <div className="relative">
              <img src={photoDataUrl} alt="Completion" className="w-full max-h-64 object-cover rounded-lg" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => setPhotoDataUrl(null)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Tap to upload or take a photo</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-5 w-5" /> Customer Signature
            </CardTitle>
            {!sigEmpty && (
              <Button size="sm" variant="ghost" onClick={clearSignature} className="text-muted-foreground h-7">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg bg-muted/20 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {sigEmpty && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
                Sign here
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            placeholder="Describe work done, any issues encountered..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full text-base"
        onClick={handleSubmit}
        disabled={completeMutation.isPending}
      >
        <CheckCircle2 className="h-5 w-5 mr-2" />
        {completeMutation.isPending ? 'Completing...' : 'Submit Completion'}
      </Button>
    </div>
  );
}
