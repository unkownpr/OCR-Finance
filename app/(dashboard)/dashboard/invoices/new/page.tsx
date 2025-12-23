'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InvoiceUpload } from '@/components/invoices/invoice-upload';
import { ArrowLeft } from 'lucide-react';

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/invoices');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Fatura Ekle</h1>
          <p className="text-muted-foreground mt-1">
            Fatura görselinizi yükleyin veya manuel olarak girin
          </p>
        </div>
      </div>

      <InvoiceUpload onSuccess={handleSuccess} />
    </div>
  );
}

