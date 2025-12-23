'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { Invoice } from '@/types/invoice';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchInvoice = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Fatura bulunamadı');
        router.push('/dashboard/invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [user, params.id, router]);

  const handleDelete = async () => {
    if (!invoice || !user) return;

    setDeleting(true);

    try {
      const supabase = createSupabaseClient();

      // Görseli sil
      if (invoice.image_url) {
        const fileName = invoice.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('invoices').remove([`${user.id}/${fileName}`]);
        }
      }

      // Faturayı sil
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);

      if (error) throw error;

      toast.success('Fatura silindi');
      router.push('/dashboard/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Fatura silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return <InvoiceDetailSkeleton />;
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.title}</h1>
            <p className="text-muted-foreground mt-1">Fatura Detayları</p>
          </div>
        </div>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="w-4 h-4" />
          Sil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Bilgiler */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fatura Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tutar */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tutar</p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    invoice.type === 'income'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {invoice.type === 'income' ? (
                    <ArrowUpRight className="w-6 h-6" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div
                    className={`text-3xl font-bold ${
                      invoice.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {invoice.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(invoice.amount))}
                  </div>
                  <Badge
                    variant={invoice.type === 'income' ? 'default' : 'destructive'}
                    className="mt-1"
                  >
                    {invoice.type === 'income' ? 'Gelir' : 'Gider'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Diğer Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  Kategori
                </div>
                <p className="text-lg font-medium">{invoice.category}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Tarih
                </div>
                <p className="text-lg font-medium">{formatDate(invoice.date)}</p>
              </div>
            </div>

            {/* OCR Metni */}
            {invoice.ocr_text && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    OCR ile Tespit Edilen Metin
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm font-mono whitespace-pre-wrap">
                      {invoice.ocr_text}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Görsel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Fatura Görseli
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.image_url ? (
              <img
                src={invoice.image_url}
                alt={invoice.title}
                className="w-full h-auto rounded-lg border border-border"
              />
            ) : (
              <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Görsel yok</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faturayı Sil</DialogTitle>
            <DialogDescription>
              Bu faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                'Sil'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const InvoiceDetailSkeleton = () => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-square w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

